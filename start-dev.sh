#!/usr/bin/env bash
# Wrapper — run from repository root
exec "$(cd "$(dirname "$0")" && pwd)/scripts/start-dev.sh"
