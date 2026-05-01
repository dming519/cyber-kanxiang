export function BgRunes() {
  const trigrams = ["☰", "☱", "☲", "☳", "☴", "☵", "☶", "☷"];
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 22%, rgba(168,85,247,0.45) 0, transparent 40%), radial-gradient(circle at 82% 78%, rgba(34,211,238,0.38) 0, transparent 45%), radial-gradient(circle at 65% 15%, rgba(236,72,153,0.22) 0, transparent 35%)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none fixed inset-0 -z-10 select-none">
        {trigrams.map((g, i) => (
          <span
            key={g}
            className="absolute font-serif text-[10rem] text-purple-400/[0.06] animate-rune-float"
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
