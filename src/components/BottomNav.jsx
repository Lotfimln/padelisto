import useTournamentStore from '../store/tournamentStore';

const TABS = [
  { id: 'setup', label: 'Setup', icon: '🏠' },
  { id: 'rounds', label: 'Rounds', icon: '🎯' },
  { id: 'ranking', label: 'Classement', icon: '📊' },
  { id: 'podium', label: 'Podium', icon: '🏆' },
  { id: 'history', label: 'Historique', icon: '📜' },
];

export default function BottomNav({ activeTab, onTabChange, status, currentRound }) {
  const { history } = useTournamentStore();

  const isDisabled = (tabId) => {
    if (tabId === 'history') return false; // Always accessible
    if (status === 'setup') {
      return tabId !== 'setup';
    }
    if (status === 'in_progress') {
      return tabId === 'podium';
    }
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary/95 backdrop-blur-lg border-t border-border">
      <div
        className="flex items-center justify-around max-w-lg mx-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {TABS.map((tab) => {
          const disabled = isDisabled(tab.id);
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => !disabled && onTabChange(tab.id)}
              disabled={disabled}
              className={`
                relative flex flex-col items-center justify-center gap-0.5 py-2.5 px-3 min-w-[60px]
                transition-all duration-200 ease-out
                ${disabled
                  ? 'opacity-30 cursor-not-allowed'
                  : active
                    ? 'text-accent'
                    : 'text-text-muted hover:text-text'
                }
              `}
            >
              {/* Active indicator */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent rounded-full" />
              )}

              {/* Icon */}
              <span className="text-lg leading-none">{tab.icon}</span>

              {/* Label */}
              <span className={`text-[9px] font-medium ${active ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>

              {/* Badge on Rounds tab */}
              {tab.id === 'rounds' && status === 'in_progress' && (
                <span className="absolute -top-0.5 right-1 min-w-[16px] h-[16px] flex items-center justify-center bg-accent text-bg-primary text-[9px] font-bold rounded-full px-0.5">
                  {currentRound + 1}
                </span>
              )}

              {/* Badge on History tab */}
              {tab.id === 'history' && history.length > 0 && (
                <span className="absolute -top-0.5 right-1 min-w-[16px] h-[16px] flex items-center justify-center bg-accent-2 text-bg-primary text-[9px] font-bold rounded-full px-0.5">
                  {history.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
