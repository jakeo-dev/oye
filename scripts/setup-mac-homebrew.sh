#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${OYE_REPO_URL:-https://github.com/jakeo-dev/oye.git}"
APP_DIR="${OYE_APP_DIR:-$HOME/oye}"
MODEL="${OLLAMA_MODEL:-llama3.2}"

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

is_oye_repo() {
  [ -f "package.json" ] && node -e "process.exit(require('./package.json').name === 'oye' ? 0 : 1)" >/dev/null 2>&1
}

ensure_homebrew() {
  if command_exists brew; then
    return
  fi

  echo "Homebrew is not installed."
  echo "Install it from https://brew.sh, then rerun this script."
  exit 1
}

ensure_command_with_brew() {
  local command_name="$1"
  local formula_name="$2"

  if command_exists "$command_name"; then
    return
  fi

  echo "Installing $formula_name..."
  brew install "$formula_name"
}

ensure_ollama() {
  if command_exists ollama; then
    return
  fi

  echo "Installing Ollama..."
  brew install --cask ollama
}

checkout_repo() {
  if is_oye_repo; then
    return
  fi

  if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    return
  fi

  echo "Cloning ¡Oye! into $APP_DIR..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
}

start_ollama() {
  echo "Starting Ollama..."
  open -a Ollama >/dev/null 2>&1 || true
  sleep 3

  if ! ollama list >/dev/null 2>&1; then
    echo "Ollama is not responding yet. Open the Ollama app, then rerun this script."
    exit 1
  fi
}

main() {
  ensure_homebrew
  ensure_command_with_brew git git
  ensure_command_with_brew node node
  ensure_ollama
  checkout_repo

  echo "Installing app dependencies..."
  npm install

  start_ollama
  echo "Pulling Ollama model: $MODEL"
  ollama pull "$MODEL"

  echo
  echo "Starting ¡Oye! at http://localhost:3000"
  npm run dev
}

main "$@"
