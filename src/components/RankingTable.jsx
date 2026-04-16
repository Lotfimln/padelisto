export default function RankingTable({ ranking, showFull = true }) {
  const getMedalEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return null;
  };

  const getRankBg = (index) => {
    if (index === 0) return 'bg-gold-dim border-gold/30';
    if (index === 1) return 'bg-silver-dim border-silver/30';
    if (index === 2) return 'bg-bronze-dim border-bronze/30';
    return 'bg-bg-card border-border';
  };

  return (
    <div className="space-y-2 stagger-children">
      {/* Header */}
      <div className="flex items-center px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-text-muted">
        <span className="w-10 text-center">#</span>
        <span className="flex-1">Joueur</span>
        <span className="w-14 text-center">Pts</span>
        <span className="w-14 text-center">+/–</span>
        {showFull && <span className="w-10 text-center">🎾</span>}
      </div>

      {/* Rows */}
      {ranking.map((player, index) => (
        <div
          key={player.id}
          className={`flex items-center px-4 py-3 rounded-xl border transition-all duration-300 ${getRankBg(index)}`}
        >
          {/* Rank */}
          <span className="w-10 text-center">
            {getMedalEmoji(index) || (
              <span className="text-sm font-semibold text-text-muted">{index + 1}</span>
            )}
          </span>

          {/* Player */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-lg flex-shrink-0">{player.avatar}</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{player.name}</div>
              <div className="text-[10px] text-text-muted">{player.level}</div>
            </div>
          </div>

          {/* Points */}
          <span className={`w-14 text-center text-sm font-bold tabular-nums ${
            index === 0 ? 'text-gold' : index === 1 ? 'text-silver' : index === 2 ? 'text-bronze' : 'text-text'
          }`}>
            {player.points}
          </span>

          {/* Differential */}
          <span className={`w-14 text-center text-sm font-semibold tabular-nums ${
            player.differential > 0 ? 'text-accent' : player.differential < 0 ? 'text-danger' : 'text-text-muted'
          }`}>
            {player.differential > 0 ? '+' : ''}{player.differential}
          </span>

          {/* Matches */}
          {showFull && (
            <span className="w-10 text-center text-sm text-text-muted tabular-nums">
              {player.matchesPlayed}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
