#!/usr/bin/python3
"""Root-owned release helper. Accepts data over stdin, never shell commands/files."""

import fcntl
import json
import os
from pathlib import Path
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from urllib.error import HTTPError
from urllib.request import urlopen
from uuid import uuid4

ROOT = Path('/opt/workout-tracker/container-releases')
CONFIG = Path('/etc/workout-tracker')
NGINX = Path('/etc/nginx/sites-available/workouts.rogerbelman.com')
SITE = 'https://workouts.rogerbelman.com'
SOURCE = 'https://github.com/RogerBelman/Fitness-Webapp'
IMAGES = 'ghcr.io/rogerbelman/workout-tracker-'


class ReleaseError(Exception):
    pass


def require(condition, message):
    if not condition:
        raise ReleaseError(message)


def validate_request(data, operation):
    require(isinstance(data, dict), 'Release request must be an object.')
    token = data.get('registry_token', '')
    user = data.get('registry_username', '')
    require(isinstance(token, str) and 10 <= len(token) <= 4096 and '\n' not in token,
            'Missing or invalid temporary registry token.')
    require(isinstance(user, str) and re.fullmatch(r'[A-Za-z0-9_-]{1,100}', user),
            'Invalid registry username.')
    if operation == 'deploy':
        require(isinstance(data.get('commit'), str) and
                re.fullmatch(r'[0-9a-f]{40}', data['commit']), 'A full commit ID is required.')
        for component in ('frontend', 'backend'):
            digest = data.get(f'{component}_digest', '')
            require(isinstance(digest, str) and re.fullmatch(r'sha256:[0-9a-f]{64}', digest),
                    f'Invalid {component} image digest.')
    return data


def run(args, *, env=None, input_text=None, check=True):
    # Do not forward command output: Docker or providers can include credentials.
    result = subprocess.run(args, input=input_text, text=True, capture_output=True,
                            env=env, timeout=300)
    if check and result.returncode:
        raise ReleaseError(f'{args[0]} {args[1]} failed (exit {result.returncode}); inspect server logs.')
    return result


def write_json(path, data):
    temp = path.with_suffix('.tmp')
    temp.write_text(json.dumps(data, indent=2) + '\n')
    os.chmod(temp, 0o600)
    temp.replace(path)


def read_state(name):
    path = ROOT / f'{name}.json'
    return json.loads(path.read_text()) if path.exists() else None


def fetch(url, status=200):
    try:
        response = urlopen(url, timeout=10)
    except HTTPError as error:
        response = error
    with response:
        require(response.status == status, f'Health check failed for {url}.')
        return response.headers, response.read().decode()


def wait_backend(port):
    deadline = time.monotonic() + 180
    while time.monotonic() < deadline:
        try:
            _, content = fetch(f'http://127.0.0.1:{port}/actuator/health')
            if json.loads(content)['status'] == 'UP':
                return
        except (OSError, ValueError, KeyError, ReleaseError):
            pass
        time.sleep(3)
    raise ReleaseError('Backend did not become healthy within 180 seconds.')


def compose(state, *args, check=True):
    directory = Path(state['directory'])
    # Compose files and manifests come from root-owned release directories only.
    require(directory.parent == ROOT and directory.is_dir(), 'Invalid release directory.')
    return run(['docker', 'compose', '--env-file', str(directory / 'images.env'),
                '-f', str(directory / 'compose.yml'), *args], check=check)


def initial_state():
    current = read_state('current')
    if current:
        return current
    require(run(['systemctl', 'is-active', '--quiet', 'workout-tracker'], check=False).returncode == 0,
            'No recorded release and legacy service is not active. Manual recovery required.')
    directory = ROOT / ('legacy-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
    directory.mkdir(mode=0o700)
    shutil.copy2(NGINX, directory / 'nginx.conf')
    shutil.copy2('/opt/workout-tracker/app.jar', directory / 'app.jar')
    shutil.copy2('/etc/systemd/system/workout-tracker.service', directory / 'workout-tracker.service')
    run(['tar', '-czf', str(directory / 'frontend.tar.gz'),
         '-C', '/var/www/workouts.rogerbelman.com', '.'])
    enabled = run(['systemctl', 'is-enabled', '--quiet', 'workout-tracker'], check=False).returncode == 0
    current = {'mode': 'legacy', 'directory': str(directory), 'enabled': enabled}
    write_json(ROOT / 'current.json', current)
    return current


def prepare(data, docker_env):
    state = {'mode': 'containers', 'commit': data['commit']}
    for component in ('frontend', 'backend'):
        image = IMAGES + component + '@' + data[f'{component}_digest']
        run(['docker', 'pull', image], env=docker_env)
        info = json.loads(run(['docker', 'image', 'inspect', image], env=docker_env).stdout)[0]
        labels = info.get('Config', {}).get('Labels') or {}
        require(labels.get('org.opencontainers.image.revision') == data['commit'],
                f'{component} image commit does not match the approved release.')
        require(labels.get('org.opencontainers.image.source') == SOURCE,
                f'{component} image does not belong to this repository.')
        require(info.get('Os') == 'linux' and info.get('Architecture') == 'amd64',
                f'{component} image has the wrong platform.')
        state[f'{component}_image'] = image
    directory = ROOT / (datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') +
                        '-' + data['commit'][:12] + '-' + uuid4().hex[:6])
    directory.mkdir(mode=0o700)
    state['directory'] = str(directory)
    shutil.copy2(CONFIG / 'docker-compose.production.yml', directory / 'compose.yml')
    (directory / 'images.env').write_text(
        f"BACKEND_IMAGE={state['backend_image']}\nFRONTEND_IMAGE={state['frontend_image']}\n")
    nginx = (CONFIG / 'nginx-containers.conf').read_text().replace('__RELEASE_SHA__', data['commit'])
    (directory / 'nginx.conf').write_text(nginx)
    write_json(directory / 'release.json', state)
    compose(state, 'config', '--quiet')
    return state


def switch_nginx(state):
    shutil.copyfile(Path(state['directory']) / 'nginx.conf', NGINX)
    run(['nginx', '-t'])
    run(['systemctl', 'reload', 'nginx'])


def verify_public(state):
    headers, html = fetch(SITE + '/')
    require('Workout Tracker' in html, 'Public frontend check failed.')
    if state['mode'] == 'containers':
        require(headers.get('X-Workout-Release') == state['commit'], 'Public release ID does not match.')
        _, logo = fetch(SITE + '/logo.svg')
        require('<svg' in logo, 'Logo check failed.')
        private_headers, _ = fetch(SITE + '/dashboard')
        require(private_headers.get('X-Robots-Tag') == 'noindex, nofollow', 'Private route header missing.')
    _, csrf = fetch(SITE + '/api/auth/csrf')
    require(bool(json.loads(csrf).get('token')), 'Public API check failed.')
    fetch(SITE + '/api/auth/me', 401)


def activate(state, outgoing=None):
    if state['mode'] == 'legacy':
        if outgoing and outgoing['mode'] == 'containers':
            compose(outgoing, 'down', '--remove-orphans')
        run(['systemctl', 'enable' if state['enabled'] else 'disable', 'workout-tracker'])
        run(['systemctl', 'start', 'workout-tracker'])
        wait_backend(8080)
    else:
        run(['systemctl', 'stop', 'workout-tracker'])
        compose(state, 'up', '--detach', '--wait', '--wait-timeout', '240', '--remove-orphans')
        wait_backend(18081)
        _, page = fetch('http://127.0.0.1:18080/')
        require('Workout Tracker' in page, 'Container frontend check failed.')
    switch_nginx(state)
    for attempt in range(10):
        try:
            verify_public(state)
            break
        except (OSError, ValueError, KeyError, ReleaseError):
            if attempt == 9:
                raise
            time.sleep(2)
    if state['mode'] == 'containers':
        run(['systemctl', 'disable', 'workout-tracker'])


def transition(target, current):
    previous = read_state('previous')
    try:
        activate(target, current)
        write_json(ROOT / 'previous.json', current)
        write_json(ROOT / 'current.json', target)
    except Exception:
        print('Release verification failed; restoring the prior application release.', flush=True)
        try:
            activate(current, target)
            write_json(ROOT / 'current.json', current)
            if previous is not None:
                write_json(ROOT / 'previous.json', previous)
            else:
                (ROOT / 'previous.json').unlink(missing_ok=True)
        except Exception as error:
            raise ReleaseError('Automatic recovery failed. Use the saved server backup and inspect logs.') from error
        raise ReleaseError('Release failed; previous application release restored. Database migrations were not reversed.')


def execute(operation, data):
    validate_request(data, operation)
    current = initial_state()
    with tempfile.TemporaryDirectory(prefix='workout-registry-', dir='/run') as auth:
        docker_env = dict(os.environ, DOCKER_CONFIG=auth)
        run(['docker', 'login', 'ghcr.io', '--username', data['registry_username'], '--password-stdin'],
            env=docker_env, input_text=data['registry_token'] + '\n')
        if operation == 'deploy':
            target = prepare(data, docker_env)
        else:
            target = read_state('previous')
            require(target is not None, 'No previous release is recorded.')
            if target['mode'] == 'containers':
                for component in ('frontend', 'backend'):
                    image = target[f'{component}_image']
                    require(re.fullmatch(re.escape(IMAGES + component) + r'@sha256:[0-9a-f]{64}', image),
                            'Invalid saved image reference.')
                    run(['docker', 'pull', image], env=docker_env)
        transition(target, current)
    print(f"Release successful: {target.get('commit', 'legacy systemd release')}", flush=True)


def main():
    require(os.geteuid() == 0, 'Run through the restricted sudo command.')
    require(len(sys.argv) == 2 and sys.argv[1] in ('status', 'deploy', 'rollback'), 'Invalid operation.')
    os.umask(0o077)
    ROOT.mkdir(mode=0o700, parents=True, exist_ok=True)
    with open('/run/lock/workout-tracker-release.lock', 'w') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as error:
            raise ReleaseError('Another release operation is running.') from error
        if sys.argv[1] == 'status':
            state = read_state('current')
            port = 18081 if state and state['mode'] == 'containers' else 8080
            _, body = fetch(f'http://127.0.0.1:{port}/actuator/health')
            require(json.loads(body)['status'] == 'UP', 'Current backend is unhealthy.')
            print('Deployment SSH connection: OK\nCurrent workout service: active')
            if state:
                print('Release:', state.get('commit', 'legacy systemd'))
            return
        raw = sys.stdin.buffer.read(16385)
        require(len(raw) <= 16384, 'Release request too large.')
        execute(sys.argv[1], json.loads(raw))


if __name__ == '__main__':
    # Disconnects/timeouts during activation enter the same recovery path.
    def interrupted(signum, frame):
        raise ReleaseError('Release connection interrupted.')

    signal.signal(signal.SIGHUP, interrupted)
    signal.signal(signal.SIGTERM, interrupted)
    try:
        main()
    except Exception as error:
        # Never include request data or external command output in errors.
        message = str(error) if isinstance(error, ReleaseError) else 'Release helper failed; inspect server state.'
        print(message, file=sys.stderr)
        sys.exit(1)
