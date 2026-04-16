import useTournamentStore from '../store/tournamentStore';
import RankingTable from '../components/RankingTable';

export default function RankingScreen() {
  const { getRanking, status, currentRound, rounds } = useTournamentStore();
  const ranking = getRanking();

  const completedRounds = status === 'completed' ? rounds.length : currentRound;

  if (ranking.length === 0 || ranking.every((p) => p.matchesPlayed === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-muted gap-2">
        <span className="text-4xl">📊</span>
        <p className="text-sm">Le classement apparaîtra après le 1er round</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 safe-bottom animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text">Classement</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {completedRounds} round{completedRounds > 1 ? 's' : ''} complété{completedRounds > 1 ? 's' : ''}
            {status === 'in_progress' && ` • Round ${currentRound + 1} en cours`}
          </p>
        </div>
        {status === 'completed' && (
          <span className="text-xs font-semibold text-accent bg-accent/10 px-3 py-1.5 rounded-full">
            ✓ Tournoi terminé
          </span>
        )}
      </div>

      {/* Ranking table */}
      <RankingTable ranking={ranking} />
    </div>
  );
}
