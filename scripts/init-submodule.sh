#!/bin/bash
set -euo pipefail

# Detect environment: Vercel sets the VERCEL=1 env var automatically
if [ "${VERCEL:-}" = "1" ]; then
  echo "[submodule] Vercel CI detected — setting up SSH deploy key..."

  if [ -z "${SSH_PRIVATE_KEY_BASE64:-}" ]; then
    echo "[submodule] ERROR: SSH_PRIVATE_KEY_BASE64 env var is not set." >&2
    exit 1
  fi

  mkdir -p ~/.ssh
  echo "$SSH_PRIVATE_KEY_BASE64" | base64 --decode > ~/.ssh/id_ed25519
  chmod 600 ~/.ssh/id_ed25519
  ssh-keyscan -t ed25519 github.com >> ~/.ssh/known_hosts 2>/dev/null

  echo "[submodule] SSH deploy key configured."
else
  echo "[submodule] Local environment detected — using existing SSH agent."
fi

# Initialize and update submodules
git submodule update --init --recursive
echo "[submodule] Submodules initialized successfully."
