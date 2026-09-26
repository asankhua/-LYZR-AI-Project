#!/bin/sh
set -eu
# Hugging Face does not set PORT and expects 7860.
# Render sets PORT (10000 unless the service overrides it).
export PORT="${PORT:-7860}"
exec node server.js
