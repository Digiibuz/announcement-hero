
# API Sécurisée avec Supabase Edge Functions

Ce projet implémente une couche d'API sécurisée utilisant des Edge Functions Supabase pour masquer les détails d'implémentation de Supabase et améliorer la sécurité.

## Fonctionnalités

- Edge Function `/login` pour l'authentification sécurisée
- Edge Function `/db/<table>` générique pour accéder aux tables
- Edge Function `/refresh-token` pour renouveler les tokens expirés
- Masquage complet des URLs et informations sensibles
- Composant React pour utiliser ces APIs

## Configuration initiale

### 1. Configuration des secrets pour les Edge Functions

Assurez-vous de configurer les variables d'environnement suivantes dans votre projet Supabase :

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Création d'une table de contacts pour les tests

Exécutez le SQL suivant pour créer une table de contacts :

```sql
CREATE TABLE public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Activer RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre aux utilisateurs authentifiés de lire leurs propres contacts
CREATE POLICY "Users can read their own contacts"
  ON public.contacts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Créer une politique pour permettre aux utilisateurs authentifiés de créer leurs propres contacts
CREATE POLICY "Users can create their own contacts"
  ON public.contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Créer une politique pour permettre aux utilisateurs authentifiés de modifier leurs propres contacts
CREATE POLICY "Users can update their own contacts"
  ON public.contacts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Créer une politique pour permettre aux utilisateurs authentifiés de supprimer leurs propres contacts
CREATE POLICY "Users can delete their own contacts"
  ON public.contacts
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Déploiement local

1. Clonez ce projet
2. Installez les dépendances avec `npm install`
3. Exécutez le projet avec `npm run dev`

## Configuration en production

### 1. Renommer le sous-domaine des Edge Functions

Pour personnaliser le sous-domaine des Edge Functions sans inclure le project-ref :

1. Dans le dashboard Supabase, allez à Settings > API
2. Sous la section "Edge Functions", configurez un domaine personnalisé

### 2. Mettre à jour les en-têtes CORS

Pour mettre à jour les en-têtes CORS en production :

1. Modifiez les variables `corsHeaders` dans chaque Edge Function pour inclure les domaines autorisés :

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://votre-domaine.com",  // ou multiple domaines séparés par une virgule
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
```

### 3. Configuration des variables d'environnement

Pour configurer les variables d'environnement en production :

1. Dans le dashboard Supabase, allez à Settings > Edge Functions
2. Ajoutez vos variables d'environnement via l'interface

## Bonnes pratiques RLS (Row Level Security)

- **Activer RLS sur toutes les tables** : `ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;`
- **Créer des politiques par action** : Définissez des politiques séparées pour SELECT, INSERT, UPDATE et DELETE
- **Utiliser le rôle `authenticated`** : Limitez l'accès aux utilisateurs authentifiés
- **Vérifier l'identité de l'utilisateur** : Utilisez `auth.uid()` pour comparer avec les champs user_id
- **Éviter les requêtes trop complexes** dans les politiques pour éviter les problèmes de performance
- **Utiliser des fonctions SECURITY DEFINER** pour les vérifications complexes

## Notes de sécurité

- Tous les tokens sont stockés dans localStorage (considérez IndexedDB ou cookies HttpOnly en production)
- Les messages d'erreur sont génériques pour éviter de révéler des informations sensibles
- Les URLs Supabase sont masquées dans tous les logs et messages d'erreur
