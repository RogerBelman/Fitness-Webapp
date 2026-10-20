"""Release safety checks with fake commands/files; never connects to production."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch, Mock

spec = importlib.util.spec_from_file_location('release', Path(__file__).parents[1] / 'workout-release.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class ReleaseTests(unittest.TestCase):
    def request(self):
        return {'commit': 'a' * 40, 'frontend_digest': 'sha256:' + 'b' * 64,
                'backend_digest': 'sha256:' + 'c' * 64,
                'registry_username': 'test-user', 'registry_token': 'temporary-test-token'}

    def test_rejects_incomplete_or_injected_image_versions(self):
        for field, value in [('commit', 'main'), ('commit', 'a' * 40 + ';id'),
                             ('backend_digest', 'latest'),
                             ('frontend_digest', 'sha256:' + 'b' * 64 + '\nother=value')]:
            data = self.request()
            data[field] = value
            with self.subTest(field=field, value=value), self.assertRaises(release.ReleaseError):
                release.validate_request(data, 'deploy')

    def test_rejects_invalid_credentials_without_echoing_token(self):
        data = self.request()
        data['registry_token'] = 'sensitive\nvalue'
        with self.assertRaises(release.ReleaseError) as error:
            release.validate_request(data, 'deploy')
        self.assertNotIn('sensitive', str(error.exception))

    def test_failed_activation_restores_previous_release_without_recording_success(self):
        target, current = {'mode': 'containers'}, {'mode': 'legacy'}
        with patch.object(release, 'activate', side_effect=[release.ReleaseError('unhealthy'), None]) as activate, \
                patch.object(release, 'read_state', return_value={'mode': 'legacy'}), \
                patch.object(release, 'write_json') as save:
            with self.assertRaisesRegex(release.ReleaseError, 'previous application release restored'):
                release.transition(target, current)
            self.assertEqual(activate.call_args_list[0].args, (target, current))
            self.assertEqual(activate.call_args_list[1].args, (current, target))
            self.assertTrue(all(call.args[1] != target for call in save.call_args_list))

    def test_failed_recovery_is_reported_as_failure(self):
        with patch.object(release, 'read_state', return_value=None), \
                patch.object(release, 'activate', side_effect=release.ReleaseError('failure')):
            with self.assertRaisesRegex(release.ReleaseError, 'Automatic recovery failed'):
                release.transition({'mode': 'containers'}, {'mode': 'legacy'})

    def test_success_records_previous_and_current_release_in_order(self):
        target, current = {'commit': 'new'}, {'commit': 'old'}
        with patch.object(release, 'activate'), patch.object(release, 'read_state', return_value=None), \
                patch.object(release, 'write_json') as save:
            release.transition(target, current)
            self.assertEqual(save.call_args_list[0].args, (release.ROOT / 'previous.json', current))
            self.assertEqual(save.call_args_list[1].args, (release.ROOT / 'current.json', target))

    def test_compose_rejects_untrusted_configuration_directory(self):
        with patch.object(release, 'run') as command:
            with self.assertRaises(release.ReleaseError):
                release.compose({'directory': '/tmp/untrusted'}, 'up')
            command.assert_not_called()

    def test_metadata_write_failure_also_restores_previous_release(self):
        target, current, previous = {'commit': 'new'}, {'commit': 'old'}, {'commit': 'older'}
        with patch.object(release, 'read_state', return_value=previous), \
                patch.object(release, 'activate') as activate, \
                patch.object(release, 'write_json', side_effect=[None, OSError('disk full'), None, None]):
            with self.assertRaisesRegex(release.ReleaseError, 'previous application release restored'):
                release.transition(target, current)
            self.assertEqual(activate.call_args_list[-1].args, (current, target))

    def test_unavailable_registry_stops_before_activation(self):
        with patch.object(release, 'run', side_effect=release.ReleaseError('registry unavailable')), \
                patch.object(release, 'activate') as activate:
            with self.assertRaises(release.ReleaseError):
                release.prepare(self.request(), {})
            activate.assert_not_called()

    def test_wrong_image_revision_is_rejected_before_any_activation(self):
        data = self.request()
        image = Mock(stdout='[{"Config":{"Labels":{"org.opencontainers.image.revision":"wrong"}}}]')
        with patch.object(release, 'run', return_value=image), patch.object(release, 'activate') as activate:
            with self.assertRaisesRegex(release.ReleaseError, 'commit does not match'):
                release.prepare(data, {})
            activate.assert_not_called()

    def test_prepared_release_pins_both_images_without_persisting_registry_token(self):
        data = self.request()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / 'releases'
            config = Path(directory) / 'config'
            root.mkdir()
            config.mkdir()
            (config / 'docker-compose.production.yml').write_text('services: {}\n')
            (config / 'nginx-containers.conf').write_text('__RELEASE_SHA__')
            info = [{'Os': 'linux', 'Architecture': 'amd64', 'Config': {'Labels': {
                'org.opencontainers.image.revision': data['commit'],
                'org.opencontainers.image.source': release.SOURCE}}}]
            with patch.object(release, 'ROOT', root), patch.object(release, 'CONFIG', config), \
                    patch.object(release, 'run', return_value=Mock(stdout=release.json.dumps(info))):
                state = release.prepare(data, {})
            files = Path(state['directory'])
            image_env = (files / 'images.env').read_text()
            self.assertIn('@sha256:', image_env)
            self.assertIn('BACKEND_IMAGE=', image_env)
            self.assertIn('FRONTEND_IMAGE=', image_env)
            for file in files.iterdir():
                self.assertNotIn(data['registry_token'], file.read_text())
            self.assertEqual((files / 'nginx.conf').read_text(), data['commit'])

    def test_state_write_replaces_complete_json(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'state.json'
            release.write_json(path, {'commit': 'old'})
            release.write_json(path, {'commit': 'new'})
            self.assertEqual(release.json.loads(path.read_text()), {'commit': 'new'})
            self.assertFalse(path.with_suffix('.tmp').exists())


if __name__ == '__main__':
    unittest.main()
