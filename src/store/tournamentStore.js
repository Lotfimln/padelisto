import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateSchedule, recommendedRounds } from '../lib/scheduler';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

let nextPlayerId = 1;

/**
 * Compute ranking from a tournament's data (players + rounds)
 */
function computeRanking(players, rounds) {
  const stats = {};
  for (const p of players) {
    stats[p.id] = {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      level: p.level,
      points: 0,
      differential: 0,
      matchesPlayed: 0,
      wins: 0,
    };
  }

  for (const round of rounds) {
    for (const match of round.matches) {
      if (match.score1 === null || match.score2 === null) continue;

      for (const pid of match.team1) {
        if (stats[pid]) {
          stats[pid].points += match.score1;
          stats[pid].differential += match.score1 - match.score2;
          stats[pid].matchesPlayed++;
          if (match.score1 > match.score2) stats[pid].wins++;
        }
      }

      for (const pid of match.team2) {
        if (stats[pid]) {
          stats[pid].points += match.score2;
          stats[pid].differential += match.score2 - match.score1;
          stats[pid].matchesPlayed++;
          if (match.score2 > match.score1) stats[pid].wins++;
        }
      }
    }
  }

  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.differential !== a.differential)
      return b.differential - a.differential;
    return b.wins - a.wins;
  });
}

// ============================================
// Supabase sync helpers
// ============================================

async function saveTournamentToSupabase(tournament) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .upsert({
        id: tournament.supabaseId || undefined,
        name: tournament.name,
        config: tournament.config,
        players: tournament.players,
        rounds: tournament.rounds,
        current_round: tournament.currentRound,
        status: tournament.status,
        ranking: tournament.ranking || [],
        winner: tournament.winner || null,
        completed_at: tournament.status === 'completed' ? new Date().toISOString() : null,
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Supabase save error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Supabase save failed:', err);
    return null;
  }
}

async function fetchHistoryFromSupabase() {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Supabase fetch failed:', err);
    return null;
  }
}

async function deleteTournamentFromSupabase(supabaseId) {
  if (!isSupabaseConfigured() || !supabaseId) return;
  try {
    await supabase.from('tournaments').delete().eq('id', supabaseId);
  } catch (err) {
    console.error('Supabase delete failed:', err);
  }
}

// ============================================
// Store
// ============================================

const useTournamentStore = create(
  persist(
    (set, get) => ({
      // Config
      config: {
        courts: 2,
        pointsPerMatch: 20,
        nbRounds: 3,
      },

      // Players list
      players: [],

      // Generated rounds
      rounds: [],

      // Current round index (0-based)
      currentRound: 0,

      // Tournament status
      status: 'setup',

      // Tournament name
      tournamentName: '',

      // Supabase ID for the active tournament
      supabaseId: null,

      // History
      history: [],

      // Loading state
      isLoading: false,

      // Whether Supabase is connected
      supabaseConnected: false,

      // --- Actions ---

      setTournamentName: (name) => set({ tournamentName: name }),

      updateConfig: (updates) =>
        set((state) => ({
          config: { ...state.config, ...updates },
        })),

      addPlayer: (name, level = 'intermédiaire', avatar = '🎾') =>
        set((state) => {
          const id = nextPlayerId++;
          const newPlayers = [
            ...state.players,
            { id, name, level, avatar },
          ];
          return {
            players: newPlayers,
            config: {
              ...state.config,
              nbRounds: recommendedRounds(newPlayers.length),
            },
          };
        }),

      removePlayer: (id) =>
        set((state) => {
          const newPlayers = state.players.filter((p) => p.id !== id);
          return {
            players: newPlayers,
            config: {
              ...state.config,
              nbRounds: recommendedRounds(newPlayers.length),
            },
          };
        }),

      generateTournament: async () => {
        const state = get();
        const { courts, nbRounds } = state.config;
        const nbPlayers = state.players.length;

        if (nbPlayers < 4) return;

        const playerIds = state.players.map((p) => p.id);
        const rounds = generateSchedule(nbPlayers, courts, nbRounds);

        const mappedRounds = rounds.map((round) => ({
          ...round,
          matches: round.matches.map((match) => ({
            ...match,
            team1: match.team1.map((idx) => playerIds[idx]),
            team2: match.team2.map((idx) => playerIds[idx]),
          })),
          resting: round.resting.map((idx) => playerIds[idx]),
        }));

        set({
          rounds: mappedRounds,
          currentRound: 0,
          status: 'in_progress',
        });

        // Save to Supabase
        const saved = await saveTournamentToSupabase({
          name: state.tournamentName || `Tournoi du ${new Date().toLocaleDateString('fr-FR')}`,
          config: state.config,
          players: state.players,
          rounds: mappedRounds,
          currentRound: 0,
          status: 'in_progress',
        });

        if (saved) {
          set({ supabaseId: saved.id, supabaseConnected: true });
        }
      },

      setScore: (roundIndex, matchIndex, score1, score2) =>
        set((state) => {
          const newRounds = [...state.rounds];
          const newMatches = [...newRounds[roundIndex].matches];
          newMatches[matchIndex] = {
            ...newMatches[matchIndex],
            score1,
            score2,
          };
          newRounds[roundIndex] = {
            ...newRounds[roundIndex],
            matches: newMatches,
          };
          return { rounds: newRounds };
        }),

      validateRound: async () => {
        const state = get();
        const currentRound = state.currentRound;
        const round = state.rounds[currentRound];

        const allScored = round.matches.every(
          (m) => m.score1 !== null && m.score2 !== null
        );
        if (!allScored) return;

        const nextRound = currentRound + 1;
        const isLast = nextRound >= state.rounds.length;

        if (isLast) {
          // Tournament completed
          const ranking = computeRanking(state.players, state.rounds);
          const tournamentName = state.tournamentName || `Tournoi du ${new Date().toLocaleDateString('fr-FR')}`;

          const archived = {
            id: Date.now(), // unique local ID
            supabaseId: state.supabaseId,
            name: tournamentName,
            date: new Date().toISOString(),
            config: { ...state.config },
            players: [...state.players],
            rounds: [...state.rounds],
            ranking,
            winner: ranking[0] || null,
          };

          set({
            currentRound: nextRound - 1,
            status: 'completed',
            history: [archived, ...state.history],
          });

          // Sync to Supabase
          await saveTournamentToSupabase({
            supabaseId: state.supabaseId,
            name: tournamentName,
            config: state.config,
            players: state.players,
            rounds: state.rounds,
            currentRound: nextRound - 1,
            status: 'completed',
            ranking,
            winner: ranking[0] || null,
          });
        } else {
          set({ currentRound: nextRound });

          // Sync progress to Supabase
          saveTournamentToSupabase({
            supabaseId: state.supabaseId,
            name: state.tournamentName || `Tournoi du ${new Date().toLocaleDateString('fr-FR')}`,
            config: state.config,
            players: state.players,
            rounds: state.rounds,
            currentRound: nextRound,
            status: 'in_progress',
          });
        }
      },

      getRanking: () => {
        const state = get();
        const { players, rounds, currentRound } = state;

        const completedRounds =
          state.status === 'completed'
            ? rounds
            : rounds.slice(0, currentRound);

        return computeRanking(players, completedRounds);
      },

      deleteFromHistory: async (tournamentId) => {
        const state = get();
        const tournament = state.history.find((t) => t.id === tournamentId);

        set({
          history: state.history.filter((t) => t.id !== tournamentId),
        });

        // Also delete from Supabase
        if (tournament?.supabaseId) {
          await deleteTournamentFromSupabase(tournament.supabaseId);
        }
      },

      // Load history from Supabase (merge with local)
      loadHistory: async () => {
        if (!isSupabaseConfigured()) return;

        set({ isLoading: true });
        const remoteTournaments = await fetchHistoryFromSupabase();

        if (remoteTournaments) {
          const state = get();
          const localIds = new Set(state.history.map((t) => t.supabaseId).filter(Boolean));

          // Convert Supabase format to local format
          const remoteFormatted = remoteTournaments
            .filter((t) => !localIds.has(t.id))
            .map((t) => ({
              id: Date.now() + Math.random(), // unique local ID
              supabaseId: t.id,
              name: t.name,
              date: t.created_at,
              config: t.config,
              players: t.players,
              rounds: t.rounds,
              ranking: t.ranking || computeRanking(t.players, t.rounds),
              winner: t.winner || null,
            }));

          // Merge: remote first, then local-only
          const merged = [
            ...state.history.filter((t) => t.supabaseId), // local with supabase ID (already synced)
            ...remoteFormatted, // remote-only
            ...state.history.filter((t) => !t.supabaseId), // local-only
          ];

          // Deduplicate by supabaseId
          const seen = new Set();
          const deduplicated = merged.filter((t) => {
            if (t.supabaseId) {
              if (seen.has(t.supabaseId)) return false;
              seen.add(t.supabaseId);
            }
            return true;
          });

          // Sort by date desc
          deduplicated.sort((a, b) => new Date(b.date) - new Date(a.date));

          set({
            history: deduplicated,
            supabaseConnected: true,
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
      },

      resetTournament: () =>
        set({
          config: { courts: 2, pointsPerMatch: 20, nbRounds: 3 },
          players: [],
          rounds: [],
          currentRound: 0,
          status: 'setup',
          tournamentName: '',
          supabaseId: null,
        }),

      backToSetup: () =>
        set({
          rounds: [],
          currentRound: 0,
          status: 'setup',
          supabaseId: null,
        }),
    }),
    {
      name: 'americano-padel-tournament',
      onRehydrate: () => {
        return (state) => {
          if (state?.players?.length) {
            nextPlayerId =
              Math.max(...state.players.map((p) => p.id)) + 1;
          }
        };
      },
    }
  )
);

export default useTournamentStore;
