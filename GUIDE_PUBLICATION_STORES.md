# Guide de Publication MyJantes sur les App Stores

Ce guide vous accompagne dans le processus de publication de l'application MyJantes sur l'App Store (iOS) et le Google Play Store (Android).

---

## Table des matières

1. [Prérequis](#prérequis)
2. [Étape 1 : Tester avec Expo Go](#étape-1--tester-avec-expo-go)
3. [Étape 2 : Publier sur Expo Go](#étape-2--publier-sur-expo-go)
4. [Étape 3 : Publication iOS (App Store)](#étape-3--publication-ios-app-store)
5. [Étape 4 : Publication Android (Google Play)](#étape-4--publication-android-google-play)
6. [Ressources utiles](#ressources-utiles)

---

## Prérequis

### Comptes requis

| Plateforme | Compte nécessaire | Coût | Lien d'inscription |
|------------|-------------------|------|-------------------|
| iOS | Apple Developer Program | 99€/an | [developer.apple.com](https://developer.apple.com/programs/) |
| Android | Google Play Console | 25$ (une fois) | [play.google.com/console](https://play.google.com/console/signup) |
| Build | Compte Expo EAS | Gratuit | [expo.dev](https://expo.dev/signup) |

### Éléments à préparer

Avant de commencer, préparez les éléments suivants :

- **Icône de l'application** : 1024x1024 pixels (PNG, sans transparence pour iOS)
- **Captures d'écran** :
  - iPhone : 6.5" (1284x2778) et 5.5" (1242x2208)
  - iPad : 12.9" (2048x2732) - optionnel
  - Android : minimum 2 captures, 320-3840 pixels
- **Description courte** : max 80 caractères
- **Description complète** : jusqu'à 4000 caractères
- **Politique de confidentialité** : URL accessible publiquement
- **Catégorie** : Productivité / Business

---

## Étape 1 : Tester avec Expo Go

### Sur votre téléphone

1. **Installez Expo Go** depuis l'App Store ou le Play Store
2. Dans Replit, cliquez sur le menu de la barre d'URL
3. **Scannez le QR code** affiché avec votre téléphone
4. L'application s'ouvrira dans Expo Go

### Tests recommandés

- [ ] Connexion avec différents comptes (admin/client)
- [ ] Navigation entre les onglets
- [ ] Création et modification de devis
- [ ] Affichage correct sur différentes tailles d'écran
- [ ] Mode sombre et clair

---

## Étape 2 : Publier sur Expo Go

Cette étape permet de partager une version de test avec d'autres personnes.

1. **Dans Replit**, cliquez sur le bouton "Publish"
2. Sélectionnez "Expo Go" comme destination
3. **Partagez le lien** généré avec vos testeurs
4. Les testeurs peuvent scanner le QR code avec Expo Go

---

## Étape 3 : Publication iOS (App Store)

### 3.1 Configuration Apple Developer

1. Connectez-vous à [App Store Connect](https://appstoreconnect.apple.com)
2. Cliquez sur **"My Apps"** → **"+"** → **"New App"**
3. Remplissez les informations :
   - **Platform** : iOS
   - **Name** : MyJantes
   - **Primary Language** : French
   - **Bundle ID** : Créez-en un (ex: com.myjantes.app)
   - **SKU** : myjantes-app

### 3.2 Configuration dans Replit

1. Ouvrez le fichier `app.json`
2. Vérifiez les configurations :

```json
{
  "expo": {
    "name": "MyJantes",
    "slug": "myjantes",
    "ios": {
      "bundleIdentifier": "com.myjantes.app",
      "buildNumber": "1"
    }
  }
}
```

### 3.3 Build et soumission via Replit

1. Dans Replit, cliquez sur **"Publish"**
2. Sélectionnez **"TestFlight"** pour la bêta ou **"App Store"** pour la production
3. Replit lancera le build dans le cloud via Expo EAS
4. Une fois terminé, l'app sera soumise automatiquement

### 3.4 Configuration dans App Store Connect

Après la soumission, complétez dans App Store Connect :

1. **Informations générales**
   - Description en français
   - Mots-clés (jantes, garage, automobile, devis, facturation)
   - URL de support
   - URL de politique de confidentialité

2. **Captures d'écran**
   - Ajoutez les captures pour chaque taille d'écran requise

3. **Tarification**
   - Sélectionnez "Gratuit" ou configurez un prix

4. **Contenu de l'app**
   - Répondez au questionnaire sur le contenu
   - Indiquez les autorisations utilisées

5. **Soumission pour review**
   - Cliquez sur "Submit for Review"
   - Délai moyen : 24-48h

---

## Étape 4 : Publication Android (Google Play)

### 4.1 Configuration Google Play Console

1. Connectez-vous à [Google Play Console](https://play.google.com/console)
2. Cliquez sur **"Create app"**
3. Remplissez :
   - **App name** : MyJantes
   - **Default language** : French
   - **App or game** : App
   - **Free or paid** : Free

### 4.2 Configuration dans Replit

1. Vérifiez `app.json` :

```json
{
  "expo": {
    "android": {
      "package": "com.myjantes.app",
      "versionCode": 1
    }
  }
}
```

### 4.3 Build Android

1. Dans Replit, cliquez sur **"Publish"**
2. Sélectionnez **"Google Play"**
3. Replit génère un fichier AAB (Android App Bundle)

### 4.4 Upload sur Google Play

1. Dans Google Play Console, allez dans **"Production"** → **"Create new release"**
2. Uploadez le fichier AAB généré
3. Complétez les informations :

   **Store listing** :
   - Titre : MyJantes
   - Description courte
   - Description complète
   - Icône (512x512)
   - Feature graphic (1024x500)
   - Captures d'écran

   **Content rating** :
   - Répondez au questionnaire IARC

   **Pricing & distribution** :
   - Pays de distribution
   - Catégorie : Business

4. **Soumettez pour review**
   - Délai moyen : quelques heures à quelques jours

---

## Checklist avant soumission

### iOS
- [ ] Icône 1024x1024 sans transparence
- [ ] Captures d'écran pour iPhone 6.5" et 5.5"
- [ ] Description et mots-clés en français
- [ ] URL politique de confidentialité
- [ ] Compte Apple Developer actif
- [ ] Bundle ID configuré

### Android
- [ ] Icône 512x512
- [ ] Feature graphic 1024x500
- [ ] Au moins 2 captures d'écran
- [ ] Description en français
- [ ] Questionnaire IARC complété
- [ ] Compte Google Play Console actif

---

## Ressources utiles

- [Documentation Expo - Publishing](https://docs.expo.dev/distribution/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)
- [Générateur de captures d'écran](https://hotpot.ai/app-screenshots)

---

## Notes importantes

1. **Temps de review** : Apple prend généralement 24-48h, Google Play quelques heures.

2. **Mises à jour** : Pour chaque nouvelle version, incrémentez :
   - iOS : `buildNumber` dans app.json
   - Android : `versionCode` dans app.json

3. **Politique de confidentialité** : Obligatoire pour les deux stores. Doit expliquer quelles données sont collectées et comment elles sont utilisées.

4. **Support** : Prévoyez une adresse email ou URL pour le support utilisateur.

---

## Besoin d'aide ?

Pour toute question sur le processus de publication, consultez :
- La documentation Expo : [docs.expo.dev](https://docs.expo.dev)
- Le support Replit : via l'interface Replit
- Les forums Apple Developer et Google Play
