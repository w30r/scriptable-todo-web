#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

APP_NAME="SecondBrain"
APP_DIR="dist/$APP_NAME.app"

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS" "$APP_DIR/Contents/Resources"

swiftc -O main.swift -o "$APP_DIR/Contents/MacOS/$APP_NAME" -framework AppKit -framework WebKit

cp Info.plist "$APP_DIR/Contents/Info.plist"

cp ../index.html ../elsa.html ../app.js ../styles.css ../index.css "$APP_DIR/Contents/Resources/"

echo "Built: $APP_DIR"