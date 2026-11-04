const COLORS = ['#2f80ff', '#22c55e', '#eab308', '#5b9dff', '#ffffff'];

/** Pequena chuva de confetes, discreta, que some sozinha. */
export function Celebration({ burstKey }: { burstKey: number }) {
  if (!burstKey) return null;
  return (
    <div key={burstKey} className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden" aria-hidden>
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={i}
          className="absolute top-0 h-2 w-1.5 animate-fall rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            background: COLORS[i % COLORS.length],
            animationDelay: `${(i % 7) * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}
