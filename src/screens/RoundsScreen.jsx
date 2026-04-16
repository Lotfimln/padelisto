import useTournamentStore from '../store/tournamentStore';
import MatchCard from '../components/MatchCard';

export default function RoundsScreen() {
  const {
    rounds,
    currentRound,
    players,
    config,
    status,
    setScore,
    validateRound,
    addNextRound,
    finishTournament,
  } = useTournamentStore();

  if (rounds.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        <p>Aucun round généré. Lance le tournoi depuis Setup.</p>
      </div>
    );
  }

  const round = rounds[currentRound];
  const isRoundValidated = status === 'round_validated';
  const isInProgress = status === 'in_progress';

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

  const handleAddRound = () => {
    addNextRound();
  };

  const handleFinish = () => {
    finishTournament();
  };

  return (
    <div className="flex flex-col gap-4 p-4 safe-bottom animate-fade-in">
      {/* Round header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text">
            Round {round.roundNumber}
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            {config.pointsPerMatch} pts par match • {round.matches.length} match{round.matches.length > 1 ? 's' : ''}
            {rounds.length > 1 && ` • ${rounds.length} rounds joués`}
          </p>
        </div>

        {/* Progress dots — dynamic, one per played round */}
        <div className="flex items-center gap-1.5">
          {rounds.map((_, idx) => (
            <span
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx < currentRound
                  ? 'bg-accent'
                  : idx === currentRound
                    ? isRoundValidated
                      ? 'bg-accent w-4'
                      : 'bg-accent-2 w-4'
                    : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Round progress indicator */}
      <div className="w-full h-1 bg-bg-card rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent to-accent-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: isRoundValidated ? '100%' : `${(round.matches.filter(m => m.score1 !== null).length / round.matches.length) * 100}%` }}
        />
      </div>

      {/* Validated badge */}
      {isRoundValidated && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20 animate-fade-in">
          <span className="text-accent text-lg">✓</span>
          <span className="text-sm text-accent font-medium">Round {round.roundNumber} validé — que veux-tu faire ?</span>
        </div>
      )}

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
            isEditable={isInProgress}
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

      {/* Action buttons */}
      {isRoundValidated ? (
        /* After validation: two choices */
        <div className="flex flex-col gap-3 mt-2 animate-fade-in">
          <button
            onClick={handleAddRound}
            className="w-full py-4 rounded-2xl text-base font-bold transition-all duration-300
              bg-gradient-to-r from-accent to-accent-2 text-bg-primary shadow-xl shadow-accent/20
              hover:shadow-accent/40 active:scale-[0.98]"
          >
            ➕ Ajouter un round
          </button>
          <button
            onClick={handleFinish}
            className="w-full py-4 rounded-2xl text-base font-bold transition-all duration-300
              bg-gradient-to-r from-amber-500 to-orange-500 text-bg-primary shadow-xl shadow-amber-500/20
              hover:shadow-amber-500/40 active:scale-[0.98]"
          >
            🏆 Terminer le tournoi
          </button>
        </div>
      ) : (
        /* During play: validate scores */
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
            ? '✓ Valider les scores'
            : 'Saisis tous les scores pour continuer'
          }
        </button>
      )}
    </div>
  );
}
