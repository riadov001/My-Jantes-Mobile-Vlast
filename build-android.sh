#!/bin/bash
set -e

echo "🧹 Création / remplacement eas.json..."

cat > eas.json << 'JSON'
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
JSON

echo "✅ eas.json OK"

echo "📦 Git commit + push..."
git add eas.json
git commit -m "auto: fix eas.json for android apk build" || true
git push || true

echo "🚀 Build APK en cours..."
npx eas-cli build -p android --profile preview --non-interactive
