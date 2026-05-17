# ¡Oye!

Personalize your Spanish journey with ¡Oye! by learning what you actually need
to know for real-world conversations.

## Quick Start On macOS

Choose one setup path. Both options clone this repo if needed, install app
dependencies, pull the local Ollama model, and start the app at
[http://localhost:3000](http://localhost:3000).

### Option 1: Mac With Homebrew

Use this if you already have [Homebrew](https://brew.sh). It installs missing
tools with `brew`.

```bash
curl -fsSL https://raw.githubusercontent.com/jakeo-dev/oye/main/scripts/setup-mac-homebrew.sh | bash
```

From an already cloned repo:

```bash
./scripts/setup-mac-homebrew.sh
```

### Option 2: Mac Without Homebrew

Use this if you do not want Homebrew. This script verifies Git, Node.js, npm,
and Ollama. If something is missing, it opens the official installer page and
tells you to rerun the script after installation.

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

## Getting Started

After setup, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Running the AI Locally

Install Ollama: [https://ollama.com/download](https://ollama.com/download).

After installing, run `ollama pull llama3.2` in the terminal. 
