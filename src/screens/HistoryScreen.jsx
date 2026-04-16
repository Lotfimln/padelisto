import { useState } from 'react';
import useTournamentStore from '../store/tournamentStore';
import RankingTable from '../components/RankingTable';

export default function HistoryScreen() {
  const { history, deleteFromHistory } = useTournamentStore();
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = (id) => {
    if (confirmDelete === id) {
      deleteFromHistory(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4 safe-bottom animate-fade-in">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-text">Historique</h2>
        </div>

        <div className="flex flex-col items-center justify-center h-64 text-text-muted gap-3">
          <span className="text-5xl">📜</span>
          <p className="text-sm text-center">Aucun tournoi dans l'historique</p>
          <p className="text-xs text-text-dim text-center">
            Les tournois terminés s'archivent automatiquement ici
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 safe-bottom animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-text">Historique</h2>
        <p className="text-xs text-text-muted">{history.length} tournoi{history.length > 1 ? 's' : ''} joué{history.length > 1 ? 's' : ''}</p>
      </div>

      {/* Tournament cards */}
      <div className="space-y-3 stagger-children">
        {history.map((tournament) => {
          const isExpanded = expandedId === tournament.id;
          const winner = tournament.winner;

          return (
            <div key={tournament.id} className="glass-card overflow-hidden transition-all duration-300">
              {/* Summary card */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : tournament.id)}
                className="w-full p-4 text-left flex items-center gap-3 hover:bg-bg-card-hover/30 transition-all duration-200"
              >
                {/* Winner avatar */}
                <div className="w-12 h-12 rounded-xl bg-gold-dim border border-gold/30 flex items-center justify-center text-2xl flex-shrink-0">
                  {winner?.avatar || '🏆'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-text truncate">{tournament.name}</h3>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {formatDate(tournament.date)} à {formatTime(tournament.date)}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-text-dim">
                      👥 {tournament.players.length} joueurs
                    </span>
                    <span className="text-[10px] text-text-dim">
                      🏟️ {tournament.config.courts} terrain{tournament.config.courts > 1 ? 's' : ''}
                    </span>
                    <span className="text-[10px] text-text-dim">
                      🔄 {tournament.rounds.length} rounds
                    </span>
                    <span className="text-[10px] text-text-dim">
                      🎯 {tournament.config.pointsPerMatch} pts/match
                    </span>
                  </div>
                </div>

                {/* Winner badge */}
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-[10px] text-gold font-semibold">🥇 {winner?.name || '–'}</span>
                  <span className="text-[10px] text-text-dim">{winner?.points || 0} pts</span>
                </div>

                {/* Expand icon */}
                <span className={`text-text-dim text-sm transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>

              {/* Expanded ranking */}
              {isExpanded && (
                <div className="border-t border-border animate-fade-in">
                  <div className="p-4">
                    <RankingTable ranking={tournament.ranking} />
                  </div>

                  {/* Round details */}
                  <div className="px-4 pb-2">
                    <details className="group">
                      <summary className="text-[11px] text-text-muted font-semibold uppercase tracking-wider cursor-pointer
                                          hover:text-text transition-colors py-2 flex items-center gap-1">
                        <span className="group-open:rotate-90 transition-transform text-[10px]">▶</span>
                        Détail des rounds
                      </summary>
                      <div className="space-y-3 pb-3">
                        {tournament.rounds.map((round) => (
                          <div key={round.roundNumber} className="rounded-lg bg-bg-card/50 p-3">
                            <span className="text-[11px] font-semibold text-accent-2 mb-2 block">
                              Round {round.roundNumber}
                            </span>
                            <div className="space-y-1.5">
                              {round.matches.map((match, mi) => {
                                const t1Names = match.team1.map((id) => {
                                  const p = tournament.players.find((pl) => pl.id === id);
                                  return p ? p.name : '?';
                                });
                                const t2Names = match.team2.map((id) => {
                                  const p = tournament.players.find((pl) => pl.id === id);
                                  return p ? p.name : '?';
                                });
                                const t1Wins = match.score1 > match.score2;
                                const t2Wins = match.score2 > match.score1;

                                return (
                                  <div key={mi} className="flex items-center text-xs gap-2">
                                    <span className="text-[10px] text-accent-2/60 w-5">T{match.court}</span>
                                    <span className={`flex-1 text-right truncate ${t1Wins ? 'text-accent font-semibold' : 'text-text-muted'}`}>
                                      {t1Names.join(' & ')}
                                    </span>
                                    <span className="font-bold tabular-nums text-text w-10 text-center">
                                      {match.score1}–{match.score2}
                                    </span>
                                    <span className={`flex-1 truncate ${t2Wins ? 'text-accent font-semibold' : 'text-text-muted'}`}>
                                      {t2Names.join(' & ')}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>

                  {/* Delete */}
                  <div className="px-4 pb-4 flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(tournament.id); }}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-200 ${
                        confirmDelete === tournament.id
                          ? 'bg-danger text-white'
                          : 'text-text-dim hover:text-danger hover:bg-danger-dim'
                      }`}
                    >
                      {confirmDelete === tournament.id ? 'Confirmer la suppression' : '🗑 Supprimer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
