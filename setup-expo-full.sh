#!/usr/bin/env bash
set -e

echo "🚀 Expo FULL AUTO SETUP (safe mode)"

########################################
# Helpers
########################################

backup_file () {
  if [ -f "$1" ]; then
    cp "$1" "$1.bak"
    echo "📦 Backup créé: $1.bak"
  fi
}

########################################
# 1. Vérification projet
########################################

if [ ! -f package.json ]; then
  echo "❌ Lance ce script à la racine du projet Expo"
  exit 1
fi

########################################
# 2. Installer EAS CLI
########################################

if ! command -v eas &> /dev/null; then
  echo "📦 Installation EAS CLI..."
  npm install -g eas-cli
else
  echo "✅ EAS CLI déjà installé"
fi

########################################
# 3. Init EAS (safe)
########################################

if [ ! -f eas.json ]; then
  echo "📝 Création eas.json"

cat <<JSON > eas.json
{
  "cli": { "version": ">= 5.9.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "ios": { "simulator": false }
    }
  }
}
JSON
else
  echo "✅ eas.json déjà présent"
fi

########################################
# 4. Patch app.json automatiquement
########################################

if [ -f app.json ]; then
  backup_file app.json

  node <<'NODE'
const fs = require('fs');

const file = 'app.json';
const data = JSON.parse(fs.readFileSync(file));

if (!data.expo) data.expo = {};

if (!data.expo.version) data.expo.version = "1.0.0";

if (!data.expo.ios) data.expo.ios = {};
if (!data.expo.ios.bundleIdentifier)
  data.expo.ios.bundleIdentifier = "com.myjantesmobile.app";

if (!data.expo.android) data.expo.android = {};
if (!data.expo.android.package)
  data.expo.android.package = "com.myjantesmobile.app";

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log("✅ app.json sécurisé et complété");
NODE

else
  echo "⚠️ app.json introuvable (ignoré)"
fi

########################################
# 5. .gitignore sécurisé
########################################

touch .gitignore

add_ignore () {
  grep -qxF "$1" .gitignore || echo "$1" >> .gitignore
}

add_ignore "service-account.json"
add_ignore ".expo"
add_ignore "dist"
add_ignore "build"

echo "🔒 .gitignore sécurisé"

########################################
# 6. GitHub Actions CI/CD
########################################

mkdir -p .github/workflows

if [ ! -f ".github/workflows/eas.yml" ]; then

cat <<YML > .github/workflows/eas.yml
name: Expo EAS Build

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: \${{ secrets.EXPO_TOKEN }}

      - run: npm install

      - run: eas build --platform all --profile production --non-interactive
YML

  echo "✅ GitHub Actions créé"
else
  echo "✅ GitHub Actions déjà présent"
fi

########################################
# 7. Login & init expo
########################################

echo ""
echo "🔐 Connexion Expo (si demandé)"
eas login || true

if [ ! -d ".eas" ]; then
  eas init --non-interactive || true
fi

########################################
# DONE
########################################

echo ""
echo "🎉 SETUP TERMINÉ 🎉"
echo ""
echo "Prochaines étapes :"
echo ""
echo "1️⃣ Android → ajouter service-account.json"
echo "2️⃣ eas token:create → ajouter EXPO_TOKEN dans GitHub Secrets"
echo ""
echo "Build manuel :"
echo "   eas build -p all"
echo ""
echo "Build auto :"
echo "   git push origin main"
echo ""
