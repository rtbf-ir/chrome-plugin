#!/usr/bin/env sh
set -eu

VERSION=$(node -p "require('./manifest.json').version")
mkdir -p dist
rm -f "dist/rtbf-chrome-${VERSION}.zip"
zip -r "dist/rtbf-chrome-${VERSION}.zip" . \
  --exclude ".git/*" --exclude "dist/*" --exclude "test/*" --exclude ".DS_Store" --exclude "*/.DS_Store" --exclude "release.sh"
echo "Created dist/rtbf-chrome-${VERSION}.zip"
