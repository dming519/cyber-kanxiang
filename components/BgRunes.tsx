export function BgRunes() {
  const trigrams = ["☰", "☱", "☲", "☳", "☴", "☵", "☶", "☷"];
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(237,234,222,0.04) 0, transparent 24%), linear-gradient(115deg, rgba(204,144,92,0.08), transparent 38%, rgba(174,111,55,0.05))",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(237,234,222,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(237,234,222,0.32) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 select-none">
        {trigrams.map((g, i) => (
          <span
            key={g}
            className="absolute font-serif text-[10rem] text-brand-primary/[0.07] animate-rune-float"
            style={{
              top: `${(i * 13 + 7) % 80}%`,
              left: `${(i * 17 + 5) % 80}%`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${6 + (i % 3)}s`,
            }}
          >
            {g}
          </span>
        ))}
      </div>
    </>
  );
}
