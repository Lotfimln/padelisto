import { useState } from 'react';
import useTournamentStore from '../store/tournamentStore';

const EMOJIS = ['🎾', '🏸', '⚡', '🔥', '💪', '🌟', '🎯', '🦊', '🐺', '🦁', '🐉', '🎲', '👑', '💎', '🚀', '🌊'];

export default function SetupScreen({ onStart }) {
  const { config, players, updateConfig, addPlayer, removePlayer, generateTournament, tournamentName, setTournamentName } = useTournamentStore();

  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('🎾');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState('');

  const minPlayers = 4;
  const maxPlayersForCourts = config.courts * 4;
  const hasEnoughPlayers = players.length >= minPlayers;

  const handleAddPlayer = () => {
    if (!newName.trim()) {
      setError('Entre un nom !');
      return;
    }
    if (players.some(p => p.name.toLowerCase() === newName.trim().toLowerCase())) {
      setError('Ce nom existe déjà');
      return;
    }
    addPlayer(newName.trim(), 'intermédiaire', newAvatar);
    setNewName('');
    setNewAvatar(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAddPlayer();
  };

  const handleStart = () => {
    if (!hasEnoughPlayers) {
      setError(`Minimum ${minPlayers} joueurs requis`);
      return;
    }
    generateTournament();
    onStart();
  };

  return (
    <div className="flex flex-col gap-6 p-4 safe-bottom animate-fade-in">
      {/* Header */}
      <div className="text-center pt-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
          🏸 Americano Padel
        </h1>
        <p className="text-text-muted text-sm mt-1">Organise ton tournoi en quelques taps</p>
      </div>

      {/* Tournament name */}
      <div className="glass-card p-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 block">
          Nom du tournoi (optionnel)
        </label>
        <input
          type="text"
          value={tournamentName}
          onChange={(e) => setTournamentName(e.target.value)}
          placeholder={`Tournoi du ${new Date().toLocaleDateString('fr-FR')}`}
          className="w-full h-12 px-4 rounded-xl bg-bg-input border border-border text-text placeholder:text-text-dim
                     focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
        />
      </div>

      {/* Courts config */}
      <div className="glass-card p-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 block">
          Nombre de terrains
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => updateConfig({ courts: n })}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200
                ${config.courts === n
                  ? 'bg-accent text-bg-primary shadow-lg shadow-accent/20'
                  : 'bg-bg-card text-text-muted border border-border hover:border-border-light'
                }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-text-dim mt-2">
          {config.courts * 4} joueurs par round • {players.length > maxPlayersForCourts
            ? `${players.length - maxPlayersForCourts} au repos chaque round`
            : players.length < maxPlayersForCourts
              ? `encore ${maxPlayersForCourts - players.length} places`
              : '✓ pile le bon nombre'
          }
        </p>
      </div>

      {/* Points per match */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Points par match
          </label>
          <span className="text-lg font-bold text-accent-2 tabular-nums">{config.pointsPerMatch}</span>
        </div>
        <input
          type="range"
          min={10}
          max={40}
          step={2}
          value={config.pointsPerMatch}
          onChange={(e) => updateConfig({ pointsPerMatch: parseInt(e.target.value) })}
          className="w-full h-2 bg-bg-card rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                     [&::-webkit-slider-thumb]:bg-accent-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-accent-2/30"
        />
        <p className="text-[11px] text-text-dim mt-2">
          La somme des scores des 2 équipes = {config.pointsPerMatch} pts
        </p>
      </div>

      {/* Number of rounds */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Nombre de rounds
          </label>
          <span className="text-lg font-bold text-accent tabular-nums">{config.nbRounds}</span>
        </div>
        <input
          type="range"
          min={1}
          max={Math.max(10, config.nbRounds + 2)}
          value={config.nbRounds}
          onChange={(e) => updateConfig({ nbRounds: parseInt(e.target.value) })}
          className="w-full h-2 bg-bg-card rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                     [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-accent/30"
        />
        <p className="text-[11px] text-text-dim mt-2">
          Recommandé : {players.length >= 4 ? Math.ceil(players.length / 2) - 1 : '–'} rounds pour {players.length} joueurs
        </p>
      </div>

      {/* Add player form */}
      <div className="glass-card p-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 block">
          Ajouter des joueurs ({players.length})
        </label>

        <div className="flex gap-2 mb-3">
          {/* Avatar picker */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-bg-card border border-border
                       text-2xl hover:bg-bg-card-hover hover:border-border-light transition-all duration-200"
          >
            {newAvatar}
          </button>

          {/* Name */}
          <input
            type="text"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Nom du joueur"
            className="flex-1 h-12 px-4 rounded-xl bg-bg-input border border-border text-text placeholder:text-text-dim
                       focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
          />

          {/* Add button */}
          <button
            onClick={handleAddPlayer}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-accent text-bg-primary
                       text-xl font-bold hover:bg-accent-dim active:scale-95 transition-all duration-200
                       shadow-lg shadow-accent/20"
          >
            +
          </button>
        </div>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="grid grid-cols-8 gap-2 p-3 rounded-xl bg-bg-card border border-border mb-3 animate-fade-in">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { setNewAvatar(emoji); setShowEmojiPicker(false); }}
                className={`text-xl p-1.5 rounded-lg transition-all duration-150 hover:bg-bg-card-hover
                  ${emoji === newAvatar ? 'bg-accent/20 ring-1 ring-accent/50' : ''}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}



        {error && (
          <p className="text-danger text-xs font-medium animate-fade-in">{error}</p>
        )}
      </div>

      {/* Players list */}
      {players.length > 0 && (
        <div className="glass-card p-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 block">
            Joueurs inscrits
          </label>
          <div className="space-y-2 stagger-children">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border"
              >
                <span className="text-xl">{player.avatar}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold truncate block">{player.name}</span>
                </div>
                <button
                  onClick={() => removePlayer(player.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim
                             hover:bg-danger-dim hover:text-danger transition-all duration-200"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={!hasEnoughPlayers}
        className={`w-full py-4 rounded-2xl text-base font-bold transition-all duration-300
          ${hasEnoughPlayers
            ? 'bg-gradient-to-r from-accent to-accent-2 text-bg-primary shadow-xl shadow-accent/20 hover:shadow-accent/40 active:scale-[0.98] animate-pulse-glow'
            : 'bg-bg-card text-text-dim border border-border cursor-not-allowed'
          }`}
      >
        {hasEnoughPlayers
          ? `🚀 Lancer le tournoi (${config.nbRounds} rounds)`
          : `Ajoute encore ${minPlayers - players.length} joueur${minPlayers - players.length > 1 ? 's' : ''}`
        }
      </button>
    </div>
  );
}
