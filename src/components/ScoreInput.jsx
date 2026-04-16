export default function ScoreInput({ value, onChange, max, label }) {
  const handleDecrement = () => {
    if (value > 0) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={handleDecrement}
          disabled={value <= 0}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-bg-card border border-border
                     text-xl font-bold text-text-muted
                     hover:bg-bg-card-hover hover:text-text hover:border-border-light
                     active:scale-95 transition-all duration-150
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          –
        </button>

        <span className="w-12 text-center text-2xl font-bold tabular-nums text-text">
          {value ?? '–'}
        </span>

        <button
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-bg-card border border-border
                     text-xl font-bold text-text-muted
                     hover:bg-bg-card-hover hover:text-text hover:border-border-light
                     active:scale-95 transition-all duration-150
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
}
