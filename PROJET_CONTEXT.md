# Americano Padel — Contexte Projet (pour développeur humain)

## 📋 Résumé

Application PWA mobile-first pour organiser des tournois de padel au format **Americano**. Le principe : les joueurs changent de partenaire à chaque round pour maximiser la variété. L'app gère le scheduling, la saisie des scores, le classement en temps réel, et l'historique des tournois.

**URL de production** : Déployé sur Vercel (voir `.vercel/` pour la config)
**Base de données** : Supabase (PostgreSQL hébergé)

---

## 🏗️ Architecture

```
Padel/
├── public/
│   ├── favicon.svg              # Icône de l'app
│   ├── icons.svg                # Icônes PWA (512x512, 192x192)
│   └── manifest.json            # PWA manifest (installable)
├── src/
│   ├── lib/
│   │   ├── scheduler.js         # 🧠 Algorithme américano (LE cœur du projet)
│   │   └── supabase.js          # Client Supabase + fallback gracieux
│   ├── store/
│   │   └── tournamentStore.js   # Zustand store (state + persistence + sync)
│   ├── components/
│   │   ├── BottomNav.jsx        # Navigation 5 onglets (Setup/Rounds/Classement/Podium/Historique)
│   │   ├── ScoreInput.jsx       # Boutons +/- tactiles (44px touch targets)
│   │   ├── MatchCard.jsx        # Carte de match avec auto-complétion des scores
│   │   ├── RankingTable.jsx     # Tableau de classement (médailles, points, diff)
│   │   └── Confetti.jsx         # Animation confettis canvas
│   ├── screens/
│   │   ├── SetupScreen.jsx      # Config tournoi + ajout joueurs
│   │   ├── RoundsScreen.jsx     # Saisie des scores round par round
│   │   ├── RankingScreen.jsx    # Classement live
│   │   ├── PodiumScreen.jsx     # Podium final + confettis
│   │   └── HistoryScreen.jsx    # Historique des tournois passés
│   ├── App.jsx                  # Router principal (tabs)
│   ├── main.jsx                 # Entry point React
│   └── index.css                # Design system complet (tokens, animations, glass cards)
├── .env                         # ⚠️ Credentials Supabase (NE PAS COMMIT)
├── supabase-schema.sql          # Schéma SQL de la base Supabase
├── nginx-padel.conf             # Config nginx (si déploiement VPS)
├── vite.config.js               # Vite 8 + TailwindCSS v4, port 5173
└── package.json
```

---

## 🔧 Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Framework | React | 19 |
| Bundler | Vite | 8 |
| Styling | TailwindCSS | 4 (via `@import "tailwindcss"`, pas de config file) |
| State | Zustand | dernière |
| Persistence | localStorage (offline) + Supabase (cloud) |
| BDD | Supabase (PostgreSQL) | - |
| Déploiement | Vercel | - |
| PWA | manifest.json manuel (pas de vite-plugin-pwa) |

### Pourquoi ce choix ?
- **TailwindCSS v4** : tout dans `index.css` via `@theme {}`, pas de `tailwind.config.js`
- **Zustand** : plus léger que Redux, middleware `persist` intégré pour localStorage
- **Supabase** : gratuit, RLS policies, pas de backend custom à maintenir
- **Pas de vite-plugin-pwa** : incompatible avec Vite 8 au moment du dev

---

## 🧠 L'algorithme Américano (`scheduler.js`)

C'est **le fichier le plus important du projet**. Il génère le planning des rounds.

### Concept
- **Greedy** : pour chaque round, on essaie toutes les paires possibles et on sélectionne celle qui minimise un score de contrainte
- **Scoring** : `pScore * 10 + oScore` — priorité absolue aux partenaires uniques sur les adversaires uniques
- **Matrices de contraintes** :
  - `partnerMatrix[i][j]` = nombre de fois que i et j ont été partenaires
  - `opponentMatrix[i][j]` = nombre de fois que i et j ont été adversaires
  - `courtCount[i][c]` = nombre de fois que i a joué sur le terrain c
  - `restCount[i]` = nombre de fois que i s'est reposé

### Performance vérifiée
| Config | Rounds uniques (0 doublon) | Max avant 3è répétition |
|--------|---------------------------|------------------------|
| 8j / 2t | 7 rounds | 15+ rounds |
| 12j / 3t | À tester | - |
| 16j / 4t | À tester | - |

### Point d'attention
La fonction `generateSchedule(nbPlayers, nbCourts, nbRounds)` est en **CommonJS** (`module.exports`) pour compatibilité Node.js (tests) ET ES modules (Vite). Si tu migres vers ESM pur, il faudra adapter.

---

## 💾 Persistance & State

### Flow des données
```
                    ┌─────────────────┐
                    │   Zustand Store  │
                    │  (source of truth)│
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
              ┌─────▼─────┐   ┌──────▼──────┐
              │ localStorage│   │  Supabase   │
              │  (offline)  │   │   (cloud)   │
              └─────────────┘   └─────────────┘
```

### Quand Supabase est sollicité :
1. `generateTournament()` → INSERT le tournoi
2. `validateRound()` → UPDATE la progression (et les scores)
3. `validateRound()` (dernier round) → UPDATE status='completed' + ranking + winner
4. `loadHistory()` (au démarrage) → SELECT les tournois completed, merge avec le local
5. `deleteFromHistory()` → DELETE

### Schéma Supabase
Table unique `tournaments` avec du JSONB :
```sql
id UUID PRIMARY KEY
name TEXT                    -- "Tournoi du samedi"
config JSONB                 -- {courts, pointsPerMatch, nbRounds}
players JSONB                -- [{id, name, avatar, level}]
rounds JSONB                 -- [{roundNumber, matches: [{team1, team2, score1, score2, court}], resting}]
current_round INTEGER
status TEXT                  -- 'setup' | 'in_progress' | 'completed'
ranking JSONB                -- Classement final (calculé à la complétion)
winner JSONB                 -- Le joueur #1
created_at TIMESTAMPTZ
completed_at TIMESTAMPTZ
```

**RLS** : Open access (pas d'authentification). Tout le monde peut lire/écrire. Si tu ajoutes de l'auth, il faudra ajouter un `user_id` et resserrer les policies.

---

## 🎨 Design System

Tout est dans `index.css` via `@theme {}` :

### Couleurs principales
- `--color-accent` : vert `#4ade80` (actions principales, boutons CTA)
- `--color-accent-2` : bleu `#38bdf8` (infos secondaires, sliders)
- `--color-bg-primary` : `#0f1419` (fond noir bleuté)
- `--color-bg-card` : `#1a2233` (cartes glass)
- **Médailles** : gold `#fbbf24`, silver `#94a3b8`, bronze `#d97706`

### Animations
- `animate-fade-in-up` : entrée des éléments
- `animate-pulse-glow` : pulsation verte sur le bouton CTA
- `stagger-children` : animation décalée des listes
- `Confetti.jsx` : animation canvas avec gravité et rotation

### Conventions UI
- **Glass cards** : `.glass-card` (gradient + blur + border)
- **Touch targets** : minimum 44px pour les boutons interactifs
- **Safe area** : `.safe-bottom` pour l'encoche iOS
- **Dark mode** : par défaut, pas de light mode

---

## 🚀 Commandes

```bash
# Développement
npm run dev                  # → http://localhost:5173 (port fixé dans vite.config.js)

# Build production
npm run build                # → dist/

# Déployer sur Vercel
npx vercel --prod

# Lint
npm run lint
```

### Variables d'environnement nécessaires
```
VITE_SUPABASE_URL=<voir .env>
VITE_SUPABASE_ANON_KEY=<voir .env>
```
Si ces variables sont absentes, l'app fonctionne en **mode offline** (localStorage uniquement).

---

## ⚠️ Points d'attention / Pièges connus

1. **Port 5173** : fixé dans `vite.config.js` pour éviter les conflits avec d'autres projets locaux (le dev a un projet Flask sur le port 5000)
2. **TailwindCSS v4** : pas de `tailwind.config.js`. Tout est dans `index.css` avec `@theme {}` et `@import "tailwindcss"`
3. **Auto-complétion des scores** : quand tu modifies score1, score2 se calcule automatiquement (`pointsPerMatch - score1`). Logique dans `MatchCard.jsx`
4. **Scheduler CommonJS** : le fichier utilise `module.exports` pour être testable avec `node` directement
5. **nextPlayerId** : variable globale dans le store, réhydratée au reload via `onRehydrate`. Attention si tu modifies la logique de persistence
6. **Supabase RLS** : actuellement en full open access. À sécuriser si tu ajoutes de l'authentification

---

## 🗺️ Roadmap / Idées d'évolution

- [ ] **Authentification** : ajouter Supabase Auth pour sécuriser les données
- [ ] **QR Code** : partager l'URL du tournoi en cours via QR code
- [ ] **Realtime** : sync temps réel entre plusieurs téléphones via Supabase Realtime
- [ ] **Service Worker** : cache offline plus robuste
- [ ] **Statistiques globales** : stats de chaque joueur à travers tous les tournois
- [ ] **Mode équipes fixes** : variante où les équipes ne changent pas
- [ ] **Export PDF** : résultats du tournoi en PDF
- [ ] **Notifications** : push notification quand un round est terminé (multi-téléphones)
