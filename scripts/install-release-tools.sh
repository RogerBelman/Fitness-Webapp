#!/bin/sh
# Run as an administrator from a trusted checkout/staging directory, not CI SSH.
set -eu
[ "$(id -u)" -eq 0 ] || { echo 'Run as root.' >&2; exit 1; }
source_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
backup_dir="/etc/workout-tracker/release-tool-backups/$(date -u +%Y%m%dT%H%M%SZ)"
install -d -m 0700 "$backup_dir" /opt/workout-tracker/container-releases
for existing in /usr/local/bin/workout-deploy-access /usr/local/sbin/workout-release /etc/sudoers.d/workout-release; do
    if [ -f "$existing" ]; then
        cp -p "$existing" "$backup_dir/$(basename "$existing")"
    fi
done

# Validate source syntax and the candidate HTTPS config before allowing release commands.
python3 -c 'import pathlib,sys; compile(pathlib.Path(sys.argv[1]).read_text(), sys.argv[1], "exec")' "$source_dir/workout-release.py"
sh -n "$source_dir/workout-deploy-access.sh"
test_dir=$(mktemp -d /run/workout-nginx-check.XXXXXX)
trap 'rm -rf -- "$test_dir"' EXIT
sed 's/__RELEASE_SHA__/configuration-check/g' "$source_dir/nginx-workout-containers.conf" > "$test_dir/site.conf"
printf 'error_log stderr;\nevents {}\nhttp { include /etc/nginx/mime.types; include %s/site.conf; }\n' "$test_dir" > "$test_dir/nginx.conf"
nginx -t -c "$test_dir/nginx.conf"

install -o root -g root -m 0755 "$source_dir/workout-release.py" /usr/local/sbin/workout-release
install -o root -g root -m 0600 "$source_dir/../docker-compose.production.yml" /etc/workout-tracker/docker-compose.production.yml
install -o root -g root -m 0600 "$source_dir/nginx-workout-containers.conf" /etc/workout-tracker/nginx-containers.conf
printf 'workout-deploy ALL=(root) NOPASSWD: /usr/local/sbin/workout-release status, /usr/local/sbin/workout-release deploy, /usr/local/sbin/workout-release rollback\n' > "$test_dir/sudoers"
visudo -cf "$test_dir/sudoers"
install -o root -g root -m 0440 "$test_dir/sudoers" /etc/sudoers.d/workout-release
visudo -c
install -o root -g root -m 0755 "$source_dir/workout-deploy-access.sh" /usr/local/bin/workout-deploy-access
/usr/local/sbin/workout-release status
printf 'Release tools installed. No application release was deployed.\n'
