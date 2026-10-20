#!/bin/sh
# Root-owned forced SSH command. No interactive shell, forwarding, or uploads.
# Deployment permissions will be added separately after this connection check.
set -eu

case "${SSH_ORIGINAL_COMMAND:-}" in
  status)
    printf 'Deployment SSH connection: OK\n'
    printf 'Current workout service: '
    /usr/bin/systemctl is-active workout-tracker
    ;;
  *)
    printf 'This key permits only the status command.\n' >&2
    exit 64
    ;;
esac
