# ¡Oye!

Personalize your Spanish journey with ¡Oye! by learning what you actually need
to know for real-world conversations.

## Quick Start On macOS

Choose one setup path. Both options clone this repo if needed, install app
dependencies, pull the local Ollama model, and start the app at
[http://localhost:3000](http://localhost:3000).

### Option 1: One Command With Homebrew

Use this for the most automated setup. It installs Homebrew if missing, then
uses it to install Git, Node.js, and Ollama as needed. macOS may ask for your
admin password during installation.

```bash
curl -fsSL https://raw.githubusercontent.com/jakeo-dev/oye/main/scripts/setup-mac-homebrew.sh | bash
```

From an already cloned repo:

```bash
./scripts/setup-mac-homebrew.sh
```

### Option 2: Without Homebrew

Use this if you do not want the script to install Homebrew. It verifies Git,
Node.js, npm, and Ollama. If something is missing, it opens the official
installer page and tells you to rerun the script after installation.

```bash
curl -fsSL https://raw.githubusercontent.com/jakeo-dev/oye/main/scripts/setup-mac-manual.sh | bash
```

From an already cloned repo:

```bash
./scripts/setup-mac-manual.sh
```

Manual prerequisites:

- Git or Apple Command Line Tools
- Node.js 20 or newer
- npm
- Python 3
- Ollama for macOS

## Start Learning

Open [http://localhost:3000](http://localhost:3000) with your browser to start using ¡Oye!

## Local Spanish Text To Speech

¡Oye! uses Piper for read-aloud Spanish audio. The setup scripts create a local
`.venv-piper` environment and download the default `es_ES-davefx-medium` voice
into `data/piper-voices`.

You can change the voice or Piper runtime with environment variables:

```bash
PIPER_VOICE=es_ES-davefx-medium
PIPER_DATA_DIR=data/piper-voices
PIPER_LENGTH_SCALE=1.05
PIPER_PYTHON=.venv-piper/bin/python
```

If you run Piper's HTTP server separately, set `PIPER_BASE_URL` and the app will
use that instead of starting the Piper CLI for each phrase:

```bash
PIPER_BASE_URL=http://localhost:5000
```

## Local Mac Reminders

Browser reminders work while the app is open. To get local macOS notifications
after closing the app, install the reminder agent from a cloned repo:

```bash
./scripts/install-mac-reminders.sh
```

The agent reads your local `data/app-db.json` file and prioritizes Spanish words
or phrases you have missed multiple times. Remove it with:

```bash
./scripts/uninstall-mac-reminders.sh
```

You can also use the Settings page's "Test Mac notification" button to fire the
same notification path immediately.
