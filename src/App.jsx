import { useState, useEffect } from 'react';
import useTournamentStore from './store/tournamentStore';
import BottomNav from './components/BottomNav';
import SetupScreen from './screens/SetupScreen';
import RoundsScreen from './screens/RoundsScreen';
import RankingScreen from './screens/RankingScreen';
import PodiumScreen from './screens/PodiumScreen';
import HistoryScreen from './screens/HistoryScreen';

export default function App() {
  const { status, currentRound, loadHistory } = useTournamentStore();
  const [activeTab, setActiveTab] = useState('setup');

  // Load history from Supabase on startup
  useEffect(() => {
    loadHistory();
  }, []);

  // Auto-navigate on status changes
  useEffect(() => {
    if (status === 'completed') {
      setActiveTab('podium');
    }
  }, [status]);

  const handleStart = () => {
    setActiveTab('rounds');
  };

  const handleNewTournament = () => {
    setActiveTab('setup');
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'setup':
        return <SetupScreen onStart={handleStart} />;
      case 'rounds':
        return <RoundsScreen />;
      case 'ranking':
        return <RankingScreen />;
      case 'podium':
        return <PodiumScreen onNewTournament={handleNewTournament} />;
      case 'history':
        return <HistoryScreen />;
      default:
        return <SetupScreen onStart={handleStart} />;
    }
  };

  return (
    <div className="flex flex-col min-h-dvh bg-bg-primary">
      {/* Main content */}
      <main className="flex-1 max-w-lg mx-auto w-full">
        {renderScreen()}
      </main>

      {/* Bottom navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        status={status}
        currentRound={currentRound}
      />
    </div>
  );
}
