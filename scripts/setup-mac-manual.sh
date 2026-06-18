#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${OYE_REPO_URL:-https://github.com/jakeo-dev/oye.git}"
APP_DIR="${OYE_APP_DIR:-$HOME/oye}"
MODEL="${OLLAMA_MODEL:-llama3.2}"
PIPER_VOICE="${PIPER_VOICE:-es_ES-davefx-medium}"
PIPER_DATA_DIR="${PIPER_DATA_DIR:-data/piper-voices}"

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

is_oye_repo() {
  [ -f "package.json" ] && node -e "process.exit(require('./package.json').name === 'oye' ? 0 : 1)" >/dev/null 2>&1
}

open_url() {
  local url="$1"
  if command_exists open; then
    open "$url" >/dev/null 2>&1 || true
  fi
}

missing_dependency() {
  local name="$1"
  local url="$2"
  echo "- $name: $url"
  open_url "$url"
}

check_manual_dependencies() {
  local missing=0

  if ! command_exists git; then
    missing=1
    missing_dependency "Git or Apple Command Line Tools" "https://git-scm.com/download/mac"
    echo "  Apple also provides Git through: xcode-select --install"
  fi

  if ! command_exists node || ! command_exists npm; then
    missing=1
    missing_dependency "Node.js 20 LTS or newer" "https://nodejs.org/en/download"
  fi

  if command_exists node; then
    local major_version
    major_version="$(node -p "Number(process.versions.node.split('.')[0])")"
    if [ "$major_version" -lt 20 ]; then
      missing=1
      echo "- Node.js is installed, but this app needs Node 20 or newer."
      open_url "https://nodejs.org/en/download"
    fi
  fi

  if ! command_exists ollama; then
    missing=1
    missing_dependency "Ollama for macOS" "https://ollama.com/download"
  fi

  if ! command_exists python3; then
    missing=1
    missing_dependency "Python 3" "https://www.python.org/downloads/macos/"
  fi

  if [ "$missing" -ne 0 ]; then
    echo
    echo "Install the missing tools from the official pages above, then rerun:"
    echo "  bash scripts/setup-mac-manual.sh"
    echo
    echo "If you are running this before cloning the repo, rerun the original curl command."
    exit 1
  fi
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

ensure_piper() {
  echo "Installing Piper text-to-speech..."
  python3 -m venv .venv-piper
  .venv-piper/bin/python -m pip install --upgrade pip
  .venv-piper/bin/python -m pip install "piper-tts[http]"

  mkdir -p "$PIPER_DATA_DIR"
  echo "Downloading Piper voice: $PIPER_VOICE"
  .venv-piper/bin/python -m piper.download_voices \
    --data-dir "$PIPER_DATA_DIR" \
    "$PIPER_VOICE"
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
  check_manual_dependencies
  checkout_repo

  echo "Installing app dependencies..."
  npm install

  ensure_piper

  start_ollama
  echo "Pulling Ollama model: $MODEL"
  ollama pull "$MODEL"

  echo
  echo "Starting ¡Oye! at http://localhost:3000"
  npm run dev
}

main "$@"
