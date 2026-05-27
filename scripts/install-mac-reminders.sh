#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="${APP_DATABASE_PATH:-$APP_DIR/data/app-db.json}"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$PLIST_DIR/dev.jakeo.oye.reminders.plist"
NODE_PATH="$(command -v node || true)"
REMINDER_TIME="${OYE_REMINDER_TIME:-18:00}"
HOUR="${REMINDER_TIME%%:*}"
MINUTE="${REMINDER_TIME##*:}"

if [ -z "$NODE_PATH" ]; then
  echo "Node.js is required. Run the macOS setup script first."
  exit 1
fi

if ! [[ "$HOUR" =~ ^[0-9]+$ && "$MINUTE" =~ ^[0-9]+$ ]]; then
  echo "Invalid OYE_REMINDER_TIME. Use HH:MM, for example 18:00."
  exit 1
fi

mkdir -p "$PLIST_DIR" "$APP_DIR/logs"

cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>dev.jakeo.oye.reminders</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE_PATH</string>
    <string>$APP_DIR/scripts/send-mac-reminder.mjs</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>APP_DATABASE_PATH</key>
    <string>$DB_PATH</string>
  </dict>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>$HOUR</integer>
    <key>Minute</key>
    <integer>$MINUTE</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>$APP_DIR/logs/mac-reminders.log</string>
  <key>StandardErrorPath</key>
  <string>$APP_DIR/logs/mac-reminders.err.log</string>
</dict>
</plist>
PLIST

launchctl unload "$PLIST_PATH" >/dev/null 2>&1 || true
launchctl load "$PLIST_PATH"

echo "Installed local Mac reminders at $REMINDER_TIME."
echo "Reminder agent: $PLIST_PATH"
echo "It reads: $DB_PATH"
