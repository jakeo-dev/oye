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
- Ollama for macOS

## Start Learning

Open [http://localhost:3000](http://localhost:3000) with your browser to start using ¡Oye!
