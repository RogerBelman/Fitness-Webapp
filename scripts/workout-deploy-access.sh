#!/bin/sh
# Root-owned forced SSH command. No interactive shell, forwarding, or uploads.
set -eu

case "${SSH_ORIGINAL_COMMAND:-}" in
  status|deploy|rollback)
    exec /usr/bin/sudo -n /usr/local/sbin/workout-release "$SSH_ORIGINAL_COMMAND"
    ;;
  *)
    printf 'This key permits only status, deploy, or rollback.\n' >&2
    exit 64
    ;;
esac
