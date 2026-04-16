import { useState, useEffect } from 'react';
import useTournamentStore from '../store/tournamentStore';
import RankingTable from '../components/RankingTable';
import Confetti from '../components/Confetti';

export default function PodiumScreen({ onNewTournament }) {
  const { getRanking, status, resetTournament, backToSetup } = useTournamentStore();
  const ranking = getRanking();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (status === 'completed') {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (status !== 'completed') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-muted gap-2">
        <span className="text-4xl">🏆</span>
        <p className="text-sm">Le podium s'affichera à la fin du tournoi</p>
      </div>
    );
  }

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  const handleNewTournament = () => {
    resetTournament();
    onNewTournament();
  };

  const handleReplay = () => {
    backToSetup();
    onNewTournament();
  };

  return (
    <div className="flex flex-col gap-6 p-4 safe-bottom animate-fade-in">
      <Confetti active={showConfetti} duration={5000} />

      {/* Header */}
      <div className="text-center pt-4">
        <h2 className="text-2xl font-bold text-text">Tournoi terminé ! 🎉</h2>
        <p className="text-sm text-text-muted mt-1">Bravo à tous les joueurs</p>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-3 px-4 pt-8 pb-4">
        {/* 2nd place */}
        {top3[1] && (
          <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <span className="text-3xl mb-2">{top3[1].avatar}</span>
            <span className="text-xs font-semibold text-text truncate max-w-[80px]">{top3[1].name}</span>
            <span className="text-xs text-silver font-bold mt-1">{top3[1].points} pts</span>
            <div className="w-20 mt-3 rounded-t-xl bg-gradient-to-t from-silver/20 to-silver/5 border border-silver/20 flex items-center justify-center"
                 style={{ height: '80px' }}>
              <span className="text-2xl font-black text-silver">2</span>
            </div>
          </div>
        )}

        {/* 1st place */}
        {top3[0] && (
          <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-lg mb-1">👑</span>
            <span className="text-4xl mb-2">{top3[0].avatar}</span>
            <span className="text-sm font-bold text-text truncate max-w-[90px]">{top3[0].name}</span>
            <span className="text-xs text-gold font-bold mt-1">{top3[0].points} pts</span>
            <div className="w-24 mt-3 rounded-t-xl bg-gradient-to-t from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center"
                 style={{ height: '110px' }}>
              <span className="text-3xl font-black text-gold">1</span>
            </div>
          </div>
        )}

        {/* 3rd place */}
        {top3[2] && (
          <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <span className="text-3xl mb-2">{top3[2].avatar}</span>
            <span className="text-xs font-semibold text-text truncate max-w-[80px]">{top3[2].name}</span>
            <span className="text-xs text-bronze font-bold mt-1">{top3[2].points} pts</span>
            <div className="w-20 mt-3 rounded-t-xl bg-gradient-to-t from-bronze/20 to-bronze/5 border border-bronze/20 flex items-center justify-center"
                 style={{ height: '60px' }}>
              <span className="text-2xl font-black text-bronze">3</span>
            </div>
          </div>
        )}
      </div>

      {/* Full ranking */}
      <div className="glass-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
          Classement complet
        </h3>
        <RankingTable ranking={ranking} />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleReplay}
          className="flex-1 py-3.5 rounded-xl bg-bg-card border border-border text-sm font-semibold text-text
                     hover:bg-bg-card-hover transition-all duration-200 active:scale-[0.98]"
        >
          🔄 Rejouer (mêmes joueurs)
        </button>
        <button
          onClick={handleNewTournament}
          className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-accent to-accent-2 text-bg-primary text-sm font-bold
                     shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all duration-200 active:scale-[0.98]"
        >
          ✨ Nouveau tournoi
        </button>
      </div>
    </div>
  );
}
