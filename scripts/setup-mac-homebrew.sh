#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${OYE_REPO_URL:-https://github.com/jakeo-dev/oye.git}"
BRANCH="${OYE_BRANCH:-main}"
APP_DIR="${OYE_APP_DIR:-$HOME/oye}"
MODEL="${OLLAMA_MODEL:-llama3.2}"
PIPER_VOICE="${PIPER_VOICE:-es_ES-carlfm-x_low}"
PIPER_DATA_DIR="${PIPER_DATA_DIR:-data/piper-voices}"

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

is_oye_repo() {
  [ -f "package.json" ] && node -e "process.exit(require('./package.json').name === 'oye' ? 0 : 1)" >/dev/null 2>&1
}

checkout_branch() {
  if git remote | grep -qx origin; then
    git remote set-url origin "$REPO_URL"
  else
    git remote add origin "$REPO_URL"
  fi
  git fetch origin "$BRANCH"
  if git rev-parse --verify --quiet "$BRANCH" >/dev/null; then
    git checkout "$BRANCH"
  else
    git checkout -b "$BRANCH" "origin/$BRANCH"
  fi
  git pull --ff-only origin "$BRANCH"
}

ensure_homebrew() {
  if command_exists brew; then
    return
  fi

  echo "Homebrew is not installed. Installing Homebrew..."
  NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  if [ -x "/opt/homebrew/bin/brew" ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [ -x "/usr/local/bin/brew" ]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi

  if ! command_exists brew; then
    echo "Homebrew installed, but brew is not on PATH yet."
    echo "Open a new terminal, then rerun this script."
    exit 1
  fi
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

checkout_repo() {
  if is_oye_repo; then
    checkout_branch
    return
  fi

  if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    checkout_branch
    return
  fi

  echo "Cloning ¡Oye! branch $BRANCH into $APP_DIR..."
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
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
  ensure_command_with_brew python3 python
  ensure_ollama
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
