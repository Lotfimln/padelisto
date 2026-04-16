import useTournamentStore from '../store/tournamentStore';
import MatchCard from '../components/MatchCard';

export default function RoundsScreen() {
  const { rounds, currentRound, players, config, status, setScore, validateRound } =
    useTournamentStore();

  if (rounds.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        <p>Aucun round généré. Lance le tournoi depuis Setup.</p>
      </div>
    );
  }

  const round = rounds[currentRound];
  const isLastRound = currentRound === rounds.length - 1;
  const allScored = round.matches.every(
    (m) => m.score1 !== null && m.score2 !== null
  );

  const handleScoreChange = (matchIndex, score1, score2) => {
    setScore(currentRound, matchIndex, score1, score2);
  };

  const handleValidate = () => {
    if (!allScored) return;
    validateRound();
  };

  return (
    <div className="flex flex-col gap-4 p-4 safe-bottom animate-fade-in">
      {/* Round header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text">
            Round {round.roundNumber}
            <span className="text-text-muted font-normal text-sm ml-2">/ {rounds.length}</span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            {config.pointsPerMatch} pts par match • {round.matches.length} match{round.matches.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {rounds.map((_, idx) => (
            <span
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx < currentRound
                  ? 'bg-accent'
                  : idx === currentRound
                    ? 'bg-accent w-4'
                    : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Round progress bar */}
      <div className="w-full h-1 bg-bg-card rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent to-accent-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentRound + (allScored ? 1 : 0)) / rounds.length) * 100}%` }}
        />
      </div>

      {/* Matches */}
      <div className="space-y-3 stagger-children">
        {round.matches.map((match, idx) => (
          <MatchCard
            key={`${currentRound}-${idx}`}
            match={match}
            players={players}
            pointsPerMatch={config.pointsPerMatch}
            onScoreChange={handleScoreChange}
            matchIndex={idx}
            isEditable={status === 'in_progress'}
          />
        ))}
      </div>

      {/* Resting players */}
      {round.resting.length > 0 && (
        <div className="glass-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block mb-2">
            ☕ Au repos ce round
          </span>
          <div className="flex flex-wrap gap-2">
            {round.resting.map((playerId) => {
              const player = players.find((p) => p.id === playerId);
              if (!player) return null;
              return (
                <span
                  key={playerId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-card border border-border text-sm"
                >
                  <span>{player.avatar}</span>
                  <span className="text-text-muted">{player.name}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Validate button */}
      <button
        onClick={handleValidate}
        disabled={!allScored}
        className={`w-full py-4 rounded-2xl text-base font-bold transition-all duration-300 mt-2
          ${allScored
            ? 'bg-gradient-to-r from-accent to-accent-2 text-bg-primary shadow-xl shadow-accent/20 hover:shadow-accent/40 active:scale-[0.98]'
            : 'bg-bg-card text-text-dim border border-border cursor-not-allowed'
          }`}
      >
        {allScored
          ? isLastRound
            ? '🏆 Terminer le tournoi'
            : `✓ Valider & Round suivant`
          : 'Saisis tous les scores pour continuer'
        }
      </button>
    </div>
  );
}
