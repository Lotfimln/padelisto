import ScoreInput from './ScoreInput';

export default function MatchCard({ match, players, pointsPerMatch, onScoreChange, matchIndex, isEditable }) {
  const getPlayer = (id) => players.find((p) => p.id === id) || { name: '?', avatar: '👤' };

  const team1Players = match.team1.map(getPlayer);
  const team2Players = match.team2.map(getPlayer);

  const isScored = match.score1 !== null && match.score2 !== null;
  const team1Wins = isScored && match.score1 > match.score2;
  const team2Wins = isScored && match.score2 > match.score1;

  const handleScore1Change = (newScore) => {
    // Auto-complete: score2 = pointsPerMatch - score1
    onScoreChange(matchIndex, newScore, pointsPerMatch - newScore);
  };

  const handleScore2Change = (newScore) => {
    onScoreChange(matchIndex, pointsPerMatch - newScore, newScore);
  };

  return (
    <div className={`glass-card p-4 transition-all duration-300 ${isScored ? 'border-accent/20' : ''}`}>
      {/* Court badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-2 bg-accent-2/10 px-2.5 py-1 rounded-full">
          Terrain {match.court}
        </span>
        {isScored && (
          <span className="text-[11px] font-medium text-accent bg-accent/10 px-2.5 py-1 rounded-full">
            ✓ Score saisi
          </span>
        )}
      </div>

      {/* Match layout */}
      <div className="flex items-center gap-3">
        {/* Team 1 */}
        <div className={`flex-1 text-center ${team1Wins ? '' : ''}`}>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center gap-1">
              <span className="text-lg">{team1Players[0].avatar}</span>
              <span className="text-lg">{team1Players[1].avatar}</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-xs font-medium truncate max-w-[80px] ${team1Wins ? 'text-accent' : 'text-text'}`}>
                {team1Players[0].name}
              </span>
              <span className={`text-xs font-medium truncate max-w-[80px] ${team1Wins ? 'text-accent' : 'text-text'}`}>
                {team1Players[1].name}
              </span>
            </div>
          </div>
        </div>

        {/* Scores */}
        {isEditable ? (
          <div className="flex items-center gap-2">
            <ScoreInput
              value={match.score1}
              onChange={handleScore1Change}
              max={pointsPerMatch}
            />
            <span className="text-text-dim text-sm font-medium">–</span>
            <ScoreInput
              value={match.score2}
              onChange={handleScore2Change}
              max={pointsPerMatch}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold tabular-nums ${team1Wins ? 'text-accent' : 'text-text'}`}>
              {match.score1 ?? '–'}
            </span>
            <span className="text-text-dim text-sm">–</span>
            <span className={`text-2xl font-bold tabular-nums ${team2Wins ? 'text-accent' : 'text-text'}`}>
              {match.score2 ?? '–'}
            </span>
          </div>
        )}

        {/* Team 2 */}
        <div className={`flex-1 text-center`}>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center gap-1">
              <span className="text-lg">{team2Players[0].avatar}</span>
              <span className="text-lg">{team2Players[1].avatar}</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-xs font-medium truncate max-w-[80px] ${team2Wins ? 'text-accent' : 'text-text'}`}>
                {team2Players[0].name}
              </span>
              <span className={`text-xs font-medium truncate max-w-[80px] ${team2Wins ? 'text-accent' : 'text-text'}`}>
                {team2Players[1].name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
