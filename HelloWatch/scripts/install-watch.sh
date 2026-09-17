#!/usr/bin/env bash
#
# install-watch.sh — Build (optional) and install the release APK onto your Galaxy Watch over wireless adb.
#
# Usage:
#   ./install-watch.sh            # install the existing release APK
#   ./install-watch.sh --build    # assembleRelease first, then install
#
# Env overrides:
#   WATCH=192.168.1.101   WATCH_PORT=5555   ADB=/path/to/adb   APK=/path/to/app-release.apk
#
# Requires: wireless adb connected (see SmartWatch/README).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ADB="${ADB:-$HOME/Library/Android/sdk/platform-tools/adb}"
WATCH="${WATCH:-192.168.1.101}"
WATCH_PORT="${WATCH_PORT:-5555}"
APK="${APK:-$ROOT/android/app/build/outputs/apk/release/app-release.apk}"
APP_ID="com.hellowatch"
ACTIVITY="$APP_ID/.MainActivity"

# --- optionally build the release APK -----------------------------------------
if [[ "${1:-}" == "--build" ]]; then
  echo "[*] Building release APK (armeabi-v7a)..." >&2
  (cd "$ROOT/android" && ./gradlew :app:assembleRelease -PreactNativeArchitectures=armeabi-v7a)
fi

if [[ ! -f "$APK" ]]; then
  echo "[!] APK not found: $APK" >&2
  echo "    Build it with: ./install-watch.sh --build   (or: npm run android:release)" >&2
  exit 1
fi

# --- ensure we have a live adb connection to the watch ------------------------
if ! "$ADB" devices | awk '$2=="device"{print $1}' | grep -qE "\.(_adb-tls|$WATCH)"; then
  echo "[-] No watch connected. Attempting wireless connect to $WATCH:$WATCH_PORT ..." >&2
  # wireless debugging port shown on watch: Settings > Developer options > Wireless debugging
  "$ADB" connect "$WATCH:$WATCH_PORT" >/dev/null 2>&1 || true
fi

if ! "$ADB" shell true >/dev/null 2>&1; then
  echo "[!] Watch not reachable. Enable Wireless debugging on the watch and re-run." >&2
  exit 1
fi

# --- install over the existing app (same debug key, keeps saved data) ---------
echo "[*] Installing $(basename "$APK") ($(du -h "$APK" | cut -f1)) on watch..." >&2
"$ADB" install -r "$APK"

echo "[*] Launching $ACTIVITY ..." >&2
"$ADB" shell am force-stop "$APP_ID"
"$ADB" shell am start -n "$ACTIVITY" >/dev/null

echo "[+] Installed and launched $APP_ID." >&2
