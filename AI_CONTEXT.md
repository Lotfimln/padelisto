# Americano Padel — Contexte pour Agent IA

> Ce fichier est destiné à un agent IA (Claude, GPT, Gemini, etc.) qui doit faire évoluer ce projet. Lis-le en entier avant toute intervention.

---

## IDENTITÉ DU PROJET

- **Nom** : Americano Padel
- **Type** : PWA mobile-first (React SPA)
- **But** : Organiser des tournois de padel au format américano (rotation des partenaires)
- **Déploiement** : Vercel (frontend) + Supabase (BDD cloud)
- **Répertoire racine** : `c:\Users\melou\.gemini\antigravity\scratch\Padel\`
- **Port de dev** : 5173 (FIXÉ dans vite.config.js — NE PAS CHANGER, conflit avec un projet Flask sur 5000)

---

## STACK TECHNIQUE EXACTE

```
React 19 + Vite 8 + TailwindCSS v4 + Zustand + Supabase JS SDK
```

### Versions critiques
- **Vite 8** : certains plugins ne sont pas compatibles (ex: vite-plugin-pwa)
- **TailwindCSS v4** : PAS de fichier `tailwind.config.js`. Le design system est dans `src/index.css` via `@theme {}` et `@import "tailwindcss"`
- **React 19** : utilise les dernières conventions (pas de class components)

### Commande pour lancer le dev
```bash
cmd /c "npm run dev"
```
> Note: sur ce système Windows, utiliser `cmd /c "npm ..."` pour contourner les restrictions PowerShell sur les scripts npm.

---

## STRUCTURE DES FICHIERS — CE QUE CHAQUE FICHIER FAIT

### Core Logic
| Fichier | Rôle | Attention |
|---------|------|-----------|
| `src/lib/scheduler.js` | **ALGORITHME PRINCIPAL** — Génère le planning des rounds avec rotation optimale des partenaires | CommonJS (`module.exports`). Scoring: `pScore*10 + oScore`. NE PAS modifier sans tests exhaustifs |
| `src/lib/supabase.js` | Client Supabase avec fallback — si credentials absents, l'app marche en localStorage only | Exporte `supabase` (peut être null) et `isSupabaseConfigured()` |
| `src/store/tournamentStore.js` | Zustand store — état complet + actions + persistence localStorage + sync Supabase | Variable globale `nextPlayerId` réhydratée dans `onRehydrate`. Actions async pour Supabase |

### Écrans (ordre du flow utilisateur)
| Fichier | Rôle |
|---------|------|
| `src/screens/SetupScreen.jsx` | Config (terrains, points/match, rounds) + ajout joueurs (emoji + nom) + bouton lancer |
| `src/screens/RoundsScreen.jsx` | Affiche les matchs du round en cours, saisie des scores, validation → round suivant |
| `src/screens/RankingScreen.jsx` | Classement live (points, différentiel, victoires) |
| `src/screens/PodiumScreen.jsx` | Écran de fin avec podium CSS et confettis + bouton nouveau tournoi |
| `src/screens/HistoryScreen.jsx` | Liste des tournois passés (cartes expansibles avec ranking + détail des rounds) |

### Composants réutilisables
| Fichier | Rôle |
|---------|------|
| `src/components/BottomNav.jsx` | Barre de navigation fixe en bas, 5 onglets, badges dynamiques |
| `src/components/ScoreInput.jsx` | Boutons +/- pour saisie tactile des scores |
| `src/components/MatchCard.jsx` | Carte d'un match : 2 équipes, scores auto-complétés, indicateur terrain |
| `src/components/RankingTable.jsx` | Tableau de classement avec médailles (🥇🥈🥉), réutilisé dans Ranking ET History |
| `src/components/Confetti.jsx` | Animation canvas de confettis (gravité, rotation, couleurs multiples) |

### Config & Infra
| Fichier | Rôle |
|---------|------|
| `vite.config.js` | Vite config avec plugin TailwindCSS, port fixé à 5173 |
| `src/index.css` | **DESIGN SYSTEM COMPLET** — tokens de couleur, animations, glass cards, safe-area, scrollbar |
| `.env` | Variables Supabase (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY). **NE PAS COMMIT** |
| `supabase-schema.sql` | Schéma de la table `tournaments`. À exécuter dans le SQL Editor de Supabase |
| `public/manifest.json` | PWA manifest pour installation sur écran d'accueil mobile |

---

## SCHÉMA SUPABASE

### Table `tournaments`
```sql
id UUID DEFAULT gen_random_uuid() PRIMARY KEY
name TEXT NOT NULL DEFAULT 'Tournoi'
config JSONB NOT NULL         -- {"courts": 2, "pointsPerMatch": 30, "nbRounds": 7}
players JSONB NOT NULL        -- [{"id": 1, "name": "Lotfi", "avatar": "🔥", "level": "intermédiaire"}]
rounds JSONB NOT NULL         -- [{"roundNumber": 1, "matches": [...], "resting": [...]}]
current_round INTEGER DEFAULT 0
status TEXT CHECK (status IN ('setup', 'in_progress', 'completed'))
ranking JSONB                 -- Classement final calculé
winner JSONB                  -- Joueur #1
created_at TIMESTAMPTZ DEFAULT NOW()
completed_at TIMESTAMPTZ
```

### RLS Policies
Actuellement **full open access** (pas d'auth). Policies :
- SELECT / INSERT / UPDATE / DELETE → `USING (true)`

### Supabase Project
- **Project ref** : voir `.env`
- **URL** : voir `.env` (VITE_SUPABASE_URL)
- **Realtime** : activé sur la table `tournaments`

---

## ALGORITHME DU SCHEDULER — DOCUMENTATION TECHNIQUE

### Entrées
`generateSchedule(nbPlayers, nbCourts, nbRounds)` → `Round[]`

### Logique
1. Calcule combien de joueurs jouent par round (`playersPerRound = nbCourts * 4`)
2. Les joueurs en surplus se reposent (priorisation de ceux qui se sont le moins reposés)
3. Pour chaque round :
   - Sélectionne les joueurs actifs (ceux qui se reposent le moins)
   - Greedy: explore toutes les paires `(i,j)` possibles pour former les matchs
   - Score de chaque paire : `partnerMatrix[i][j] * 10 + opponentMatrix[i][j]`
   - Sélectionne la paire au score le plus bas → garantit la variété maximale
   - Affecte les terrains par rotation pour équilibrer le passage

### Sortie
```js
[{
  roundNumber: 1,
  matches: [{
    team1: [0, 1],    // indices des joueurs
    team2: [2, 3],
    court: 1,
    score1: null,
    score2: null
  }],
  resting: [4, 5]    // indices des joueurs au repos
}]
```

### Garanties vérifiées
| Config | Rounds sans doublon partenaire | Max répétitions jusqu'à 14 rounds |
|--------|-------------------------------|-----------------------------------|
| 8j/2t | 7 | 2 max (parfait) |
| 12j/3t | Testé OK | - |
| 16j/4t | Testé OK | - |

---

## STORE ZUSTAND — API COMPLÈTE

### State
```js
{
  config: { courts, pointsPerMatch, nbRounds },
  players: [{ id, name, level, avatar }],
  rounds: [{ roundNumber, matches, resting }],
  currentRound: 0,
  status: 'setup' | 'in_progress' | 'completed',
  tournamentName: '',
  supabaseId: null,
  history: [{ id, supabaseId, name, date, config, players, rounds, ranking, winner }],
  isLoading: false,
  supabaseConnected: false
}
```

### Actions
| Action | Sync Supabase | Description |
|--------|:---:|-------------|
| `setTournamentName(name)` | ❌ | Définit le nom du tournoi |
| `updateConfig(updates)` | ❌ | Met à jour la config (courts, points, rounds) |
| `addPlayer(name, level, avatar)` | ❌ | Ajoute un joueur, auto-calcule nbRounds recommandé |
| `removePlayer(id)` | ❌ | Retire un joueur |
| `generateTournament()` | ✅ INSERT | Génère le schedule et démarre le tournoi |
| `setScore(roundIdx, matchIdx, s1, s2)` | ❌ | Met à jour un score |
| `validateRound()` | ✅ UPDATE | Valide le round, passe au suivant ou termine |
| `getRanking()` | ❌ | Calcule le classement en temps réel (getter) |
| `deleteFromHistory(id)` | ✅ DELETE | Supprime un tournoi de l'historique |
| `loadHistory()` | ✅ SELECT | Charge et merge l'historique remote + local |
| `resetTournament()` | ❌ | Reset complet (nouveau tournoi) |
| `backToSetup()` | ❌ | Retour au setup (garde les joueurs) |

### Persistence
- **localStorage** : via middleware `persist` de Zustand, clé `americano-padel-tournament`
- **Supabase** : sync asynchrone, fallback silencieux si non dispo
- **Merge** : `loadHistory()` déduplique par `supabaseId`, trie par date desc

---

## CONVENTIONS DE CODE

### Styling
- **JAMAIS** de `tailwind.config.js` — tout dans `index.css` via `@theme {}`
- Classes utilitaires Tailwind v4 directement dans le JSX
- Composants de base : `.glass-card`, `.safe-bottom`, `.stagger-children`, `.animate-*`

### Composants React
- Functional components uniquement (pas de classes)
- Destructuration des props dans la signature
- State local avec `useState`, state global avec `useTournamentStore()`
- Pas de `useEffect` pour la logique métier — tout dans les actions Zustand

### Nommage
- Fichiers : `PascalCase.jsx` pour les composants, `camelCase.js` pour les utilitaires
- Variables : `camelCase`
- CSS custom : kebab-case (ex: `--color-bg-primary`)

---

## INSTRUCTIONS POUR MODIFICATIONS

### Ajouter un nouvel écran
1. Créer `src/screens/MonScreen.jsx`
2. Ajouter l'import dans `src/App.jsx`
3. Ajouter un `case` dans `renderScreen()`
4. Si besoin d'un onglet : ajouter dans le tableau `TABS` de `src/components/BottomNav.jsx`

### Modifier le schéma Supabase
1. Modifier `supabase-schema.sql`
2. Exécuter la migration dans le SQL Editor de Supabase
3. Adapter les fonctions de sync dans `tournamentStore.js` (`saveTournamentToSupabase`, `fetchHistoryFromSupabase`)

### Modifier le scheduler
1. **TOUJOURS** tester après modification :
```js
const { generateSchedule } = require('./src/lib/scheduler.js');
const rounds = generateSchedule(8, 2, 14);
// Vérifier : 0 doublons sur les 7 premiers rounds, max 2 répétitions sur 14
```
2. Le scoring `pScore * 10 + oScore` est CRITIQUE — ne pas changer le ratio sans comprendre l'impact

### Ajouter de l'authentification
1. Activer Supabase Auth dans le dashboard
2. Ajouter un `user_id UUID REFERENCES auth.users(id)` à la table `tournaments`
3. Resserrer les RLS policies :
   - SELECT : `auth.uid() = user_id OR is_public = true`
   - INSERT/UPDATE/DELETE : `auth.uid() = user_id`
4. Créer un écran de login/signup
5. Modifier `supabase.js` pour gérer la session

---

## DÉPLOIEMENT

### Vercel (production actuelle)
```bash
npx vercel --prod
```
Variables d'environnement configurées dans Vercel dashboard :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Build local
```bash
npm run build  # → dist/
```
Le dossier `dist/` est une SPA statique servable par n'importe quel serveur HTTP (nginx, Apache, Caddy, etc).

### Config nginx (alternative)
Voir `nginx-padel.conf` — inclut SPA routing, cache assets, gzip.

---

## ERREURS COURANTES ET SOLUTIONS

| Erreur | Cause | Solution |
|--------|-------|----------|
| `@import must precede all rules` | Ordre des imports CSS | `@import url(fonts)` AVANT `@import "tailwindcss"` dans `index.css` |
| `Port 5173 already in use` | Autre instance de dev | Tuer le processus ou changer le port dans `vite.config.js` |
| `Supabase save error: 42P01` | Table `tournaments` n'existe pas | Exécuter `supabase-schema.sql` dans le SQL Editor |
| `nextPlayerId` incohérent | Corruption localStorage | Vider localStorage ou vérifier `onRehydrate` |
| `onShowHistory is not defined` | Référence résiduelle à un ancien prop | Vérifier que SetupScreen n'utilise plus ce prop |
| Build taille > 500KB | Normal (Supabase SDK fait ~200KB) | Le gzip ramène à ~120KB, acceptable |

---

## CE QUI N'EST PAS IMPLÉMENTÉ (mais prévu)

1. **Auth utilisateurs** — Chaque organisateur pourrait avoir ses propres tournois
2. **Realtime multi-téléphones** — Supabase Realtime est activé mais pas exploité côté client
3. **QR Code de partage** — Générer un QR pour rejoindre un tournoi
4. **Stats globales joueurs** — Agrégation cross-tournois (winrate, partenaire préféré, etc.)
5. **Service Worker** — Cache offline plus robuste (actuellement juste localStorage)
6. **Export PDF** — Résultats imprimables
7. **Tests unitaires** — Vitest pour le scheduler et le store
8. **i18n** — Tout est en français, pas de système de traduction
