# 🏸 Padelisto

App de tournoi de Padel au format **Americano**. Gratuit, sans inscription, installable sur mobile.

## Comment ça marche

1. **Configure** — choisis le nombre de terrains, les points par match, et les rounds
2. **Ajoute les joueurs** — un nom et un emoji, c'est tout
3. **Lance le tournoi** — l'algorithme génère les équipes automatiquement
4. **Saisis les scores** — round par round, le classement se met à jour en direct
5. **Résultat** — podium final avec confettis 🎉

L'algorithme garantit une **rotation optimale des partenaires** : chaque joueur joue avec un maximum de personnes différentes.

## Fonctionnalités

- Rotation intelligente des partenaires (greedy avec matrices de contraintes)
- Saisie tactile des scores (auto-complétion)
- Classement en temps réel
- Historique des tournois passés
- Persistance cloud (Supabase) + offline (localStorage)
- PWA installable sur l'écran d'accueil

## Stack

React 19 · Vite 8 · TailwindCSS v4 · Zustand · Supabase

## Lancer en local

```bash
git clone https://github.com/Lotfimln/padelisto.git
cd padelisto
npm install
npm run dev
```

L'app fonctionne sans Supabase (mode offline). Pour activer la persistance cloud, crée un fichier `.env` :

```
VITE_SUPABASE_URL=<ton url>
VITE_SUPABASE_ANON_KEY=<ta clé anon>
```

## Licence

MIT
