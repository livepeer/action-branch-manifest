#!/bin/bash

set -e
set -o pipefail

cd "$GITHUB_WORKSPACE"

python3 /app/script.py
