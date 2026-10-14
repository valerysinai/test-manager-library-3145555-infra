#!/bin/sh
set -eu
mkdir -p "$HOME/.local/share/pki/nssdb" "$HOME/.pki"
certutil -N --empty-password -d "sql:$HOME/.local/share/pki/nssdb"
certutil -A -d "sql:$HOME/.local/share/pki/nssdb" -n library-local-ca -t 'C,,' -i /trust/root-ca.pem
ln -s "$HOME/.local/share/pki/nssdb" "$HOME/.pki/nssdb"
exec npx playwright test --config tests/playwright.config.mjs
