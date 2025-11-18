# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/64c2702a-3a05-4d0d-bbba-3f29359bfeba

## Environment Variables Configuration

This project requires the following environment variables to be configured:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenAI Configuration (for Supabase Edge Functions)
# Note: Configure this in Supabase Edge Functions secrets
OPENAI_API_KEY=your_openai_api_key
```

### For Local Development

1. Create a `.env` file in the root directory based on `.env.example`
2. Add your actual Supabase URL and anonymous key

### For Production Deployment

If deploying to a hosting service like Vercel or Netlify:
- Add these environment variables in your deployment platform's settings panel
- For Supabase Edge Functions, set these secrets in the Supabase dashboard under Project Settings > API > Edge Functions > Secrets

**For Supabase Edge Functions:**
```bash
# Configure Edge Function secrets (required for the optimize-content function)
supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

**IMPORTANT**: Never commit your actual `.env` file containing real credentials to your repository.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/64c2702a-3a05-4d0d-bbba-3f29359bfeba) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/64c2702a-3a05-4d0d-bbba-3f29359bfeba) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

## State Persistence

This application implements automatic state persistence using localStorage to provide a seamless user experience across page reloads and tab switches.

### Available Persistence Hooks

1. `usePersistedState`: Generic state persistence
```typescript
const [value, setValue, clearValue] = usePersistedState('my-key', defaultValue);
```

2. `useFormPersistence`: Form data persistence
```typescript
const { loadForm, clearSavedForm } = useFormPersistence(form, 'form-key');
```

3. `useScrollRestoration`: Automatic scroll position restoration
```typescript
useScrollRestoration();
```

### LocalStorage Keys Used

All persistence keys are prefixed with `app_` to avoid conflicts:

- `app_form_*`: Form data
- `app_scroll_*`: Scroll positions per route
- `app_*`: Generic persisted states

### Best Practices

1. **Security**: Never store sensitive data (tokens, passwords) in localStorage
2. **Performance**: Use debouncing for frequent updates (default: 1000ms)
3. **Fallbacks**: Always provide default values for persisted states
4. **Error Handling**: All hooks include built-in error handling and fallbacks
5. **Cleanup**: Use clear functions when data is no longer needed

### Example Usage

```typescript
import { usePersistedState } from '@/hooks/usePersistedState';

function MyComponent() {
  const [filters, setFilters, clearFilters] = usePersistedState('filters', {
    category: 'all',
    sortBy: 'date'
  });

  // ... rest of component logic
}
```

## Émulation Android (Capacitor)

Le projet est préconfiguré avec Capacitor (`capacitor.config.ts`) et contient déjà le dossier `android/`.
Voici des étapes rapides pour builder et lancer l'application Android (émulateur ou appareil physique).

1) Installer les dépendances (si ce n'est pas déjà fait)

```bash
npm install
```

2) Mode build (production web -> intégré dans l'apk)

```bash
# construit l'app web dans /dist, synchronise avec la plateforme Android
npm run android:prepare
# ouvre le projet Android dans Android Studio
npm run cap:open android
```

3) Lancer depuis Android Studio

- Ouvrez le projet Android (après `npm run cap:open android`) dans Android Studio.
- Démarrez un émulateur ou branchez un appareil physique.
- Cliquez sur Run pour installer et lancer l'application.

4) Installer l'APK depuis la ligne de commande (optionnel)

```bash
# construit puis installe l'apk debug sur l'appareil connecté
npm run android:prepare
cd android
./gradlew installDebug
```

5) Développement avec live-reload (chargement depuis le serveur Vite)

- Récupérez l'adresse IP locale de votre machine (macOS) :

```bash
ipconfig getifaddr en0
# ou si vous êtes en Ethernet
ipconfig getifaddr en1
```

- Dans `capacitor.config.ts`, remplacez temporairement `server.url` par `http://<VOTRE_IP>:5173` et conservez `cleartext: true` :

```ts
server: {
  url: 'http://192.168.x.y:5173',
  cleartext: true
}
```

- Lancez le serveur de développement Vite :

```bash
npm run dev
```

- Ouvrez le projet Android dans Android Studio et lancez l'application : elle chargera le contenu depuis votre serveur local (live-reload).

Remarques et dépannage

- `webDir` est configuré sur `dist` (build produit par `vite build`).
- Si vous préférez charger une URL distante (par ex. `https://app.digiibuz.fr`), ne changez pas `server.url`.
- Assurez-vous d'avoir Android Studio, SDK, et une version Java compatible installés.
- Si vous rencontrez des erreurs Gradle, ouvrez Android Studio et laissez-le télécharger les dépendances/SDK manquants.
- Pour revenir à la configuration de production, remplacez `server.url` par l'URL distante ou supprimez le champ `server`.
