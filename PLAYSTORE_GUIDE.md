# 📱 Guide complet de publication d'Eladma sur le Google Play Store

Ce guide technique explique en détail comment transformer l'application web **Eladma** (React + Vite + Tailwind CSS) en une application mobile Android native prête pour le **Google Play Store**.

Pour cela, nous avons configuré **Capacitor** (par Ionic), qui est le framework moderne de référence pour convertir des SPA (Single Page Applications) ultra-performantes en applications natives iOS/Android sans modifier le code source.

---

## 🛠️ Étape 1 : Préparer l'environnement de développement

Avant de générer le paquet Android, assurez-vous d'avoir installé les outils requis sur votre machine locale :

1. **Node.js** (v18+) : déjà utilisé par l'application.
2. **Android Studio** : Téléchargez et installez la version officielle pour votre système d'exploitation ([lien officiel](https://developer.android.com/studio)).
3. **SDK Android** : Dans Android Studio, rendez-vous dans le *SDK Manager* et installez la dernière plateforme Android stable (ex: API 34+).
4. **Command-line tools & Gradle** : Installez-les via l'onglet *SDK Tools* d'Android Studio.

---

## 📦 Étape 2 : Configuration locale de Capacitor

Nous avons déjà installé `@capacitor/core` et `@capacitor/cli` dans l'application, et configuré `capacitor.config.ts`.

Pour initialiser et ajouter le dossier natif **Android** sur votre machine locale, ouvrez votre terminal dans le dossier du projet et exécutez les commandes suivantes :

```bash
# 1. Installer le package plateforme Android de Capacitor
npm install @capacitor/android

# 2. Compiler l'application web (génère le dossier /dist)
npm run build

# 3. Ajouter la plateforme Android (génère un projet Android Studio natif dans /android)
npx cap add android
```

Une fois cette configuration initiale terminée, toute modification de code se synchronisera avec la commande :
```bash
# Génère le build Web et copie les fichiers vers le dossier Android natif
npm run mobile:build
```

---

## 💻 Étape 3 : Compiler et Tester avec Android Studio

Pour prévisualiser et exécuter l'application sur un émulateur ou sur votre téléphone physique :

1. **Ouvrir le projet dans Android Studio** :
   ```bash
   npm run mobile:open
   ```
2. **Connecter un téléphone Android** en mode *Débogage USB* ou démarrer un *Émulateur Android (AVD)* dans Android Studio.
3. **Lancer l'application** : Cliquez sur le bouton vert **Run** (icône Play ▶) dans la barre supérieure d'Android Studio. L'application Eladma s'affiche instantanément sur votre écran mobile !

---

## 🎨 Étape 4 : Personnaliser l'Icône et l'Écran de Démarrage (Splash Screen)

Pour que votre application mobile paraisse professionnelle sur le Play Store :

1. **Utiliser l'outil de génération de Capacitor** :
   Installez `@capacitor/assets` pour générer automatiquement toutes les tailles d'icônes et d'écrans requis à partir d'un fichier source unique :
   ```bash
   npm install @capacitor/assets -D
   ```
2. Placez vos logos dans un dossier `/assets` à la racine :
   - `assets/icon-only.png` (icône d'au moins 1024x1024 px)
   - `assets/splash.png` (écran d'accueil d'au moins 2732x2732 px)
3. Générez les icônes en une commande :
   ```bash
   npx capacitor-assets generate --android
   ```

---

## 🔐 Étape 5 : Créer l'App Bundle (.AAB) signé pour la production

Google exige un fichier **AAB (Android App Bundle)** signé pour publier une application sur le Play Store.

### 1. Générer une Clé de Signature (Keystore)
Dans Android Studio :
- Allez dans **Build > Generate Signed Bundle / APK**.
- Sélectionnez **Android App Bundle** et cliquez sur **Next**.
- Dans *Key store path*, cliquez sur **Create new...** et remplissez les informations pour générer votre fichier de clé sécurisée `.jks`. **Gardez ce fichier et ses mots de passe précieusement !** (Sans cela, vous ne pourrez jamais mettre à jour l'application).

### 2. Compiler le fichier de release final
- Sélectionnez la clé créée, spécifiez les clés de signature, puis cliquez sur **Next**.
- Sélectionnez la variante de build **release**.
- Cliquez sur **Create** / **Finish**.
- Android Studio va compiler l'application et générer le fichier final `app-release.aab` (situé généralement dans `android/app/release/app-release.aab`).

---

## 🚀 Étape 6 : Publication sur la Google Play Console

1. **Créer un compte Développeur Google** : Rendez-vous sur la [Google Play Console](https://play.google.com/console). Les frais d'inscription uniques sont de **$25**.
2. **Créer une nouvelle application** :
   - Saisissez le nom de l'application : **Eladma**
   - Langue par défaut : **Français**
   - Type : **Application** et **Gratuite**
3. **Configurer la fiche du Store (Store Listing)** :
   - Fournissez une description courte, une description détaillée.
   - Importez l'icône de l'application (512x512 px) et le graphique de présentation (1024x500 px).
   - Importez au moins **4 captures d'écran** de votre application en mode mobile.
4. **Importer le fichier .aab** : Activez la section **Production** ou **Tests fermés** (Recommended) et déposez votre fichier `app-release.aab`.
5. **Phase de Test Fermé (Règle Google 2026)** :
   - Pour les nouveaux comptes personnels créés après novembre 2023, Google exige de faire tester l'application par **20 testeurs uniques pendant au moins 14 jours consécutifs** avant de pouvoir la publier en production.
   - Configurez une liste d'adresses email de testeurs (amis, collègues, famille), invitez-les via la Play Console, et conservez le canal actif pendant 14 jours.
6. **Soumettre pour révision** :
   Une fois les questionnaires de sécurité (âge, contenu, politique de confidentialité) complétés, cliquez sur **Lancer l'examen réglementaire**. L'application sera validée sous 2 à 7 jours par les équipes de Google !

---

### 💡 Recommandation de sécurité pour les API
L'application Eladma intègre des intégrations asynchrones comme l'API Gemini. Ne partagez jamais vos clés API de production en dur dans le paquet mobile de l'application. Utilisez des variables d'environnement distantes ou servez-les via un serveur mandataire (Proxy API) pour une sécurité maximale.

Félicitations ! Votre structure est entièrement prête pour conquérir l'écosystème mobile Android ! 🚀
