#!/usr/bin/env bash
#
# notify-watch.sh — Push a Wear OS notification to your Galaxy Watch from your Mac.
#
# Usage:
#   ./notify-watch.sh [title] [message]
#   ./notify-watch.sh "Build done" "12:34 — CI passed" "2026-09-17T20:45:00Z"  (optional ISO time)
#
# Requires: wireless adb connected (see SmartWatch/README).
set -euo pipefail

ADB="${ADB:-$HOME/Library/Android/sdk/platform-tools/adb}"
WATCH="${WATCH:-192.168.1.101}"   # change to your watch's IP
TAG="pc-notify"

title="${1:-Hello from your Mac}"
message="${2:-This is a Wear OS notification triggered by a script.}"
when="${3:-}"

# --- ensure we have a live adb connection to the watch ------------------------
if ! "$ADB" devices | awk '$2=="device"{print $1}' | grep -qE "\.(_adb-tls|$WATCH)"; then
  echo "[-] No watch connected. Attempting wireless connect to $WATCH ..." >&2
  # wireless debugging port shown on watch: Settings > Developer options > Wireless debugging
  port="$("$ADB" devices -l | awk -v w="$WATCH" '$2=="device" && $0 ~ w {print $1; exit}')"
  port="${port##*:}"
  port="${port:-5555}"
  "$ADB" connect "$WATCH:$port" >/dev/null 2>&1 || true
fi

if ! "$ADB" shell true >/dev/null 2>&1; then
  echo "[!] Watch not reachable. Enable Wireless debugging on the watch and re-run." >&2
  echo "    See ./scripts/connect-watch.sh" >&2
  exit 1
fi

# --- post the notification -----------------------------------------------------
extra=()
if [[ -n "$when" ]]; then
  extra=(--when "$when")
fi
"$ADB" shell cmd notification post \
  -t "$title"          `# title` \
  -S bigtext           `# expandable style on the small round screen` \
  "${extra[@]}" \
  "$TAG" "$message"

echo "[+] Posted notification to watch: $title" >&2
