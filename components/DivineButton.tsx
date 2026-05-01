"use client";

interface Props {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export function DivineButton({ onClick, disabled, loading, children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`group relative w-full rounded-xl px-8 py-4 font-serif text-lg font-bold tracking-[0.3em] transition-all duration-300 ${
        disabled || loading
          ? "cursor-not-allowed bg-gray-800/40 text-gray-500"
          : "animate-neon-pulse bg-gradient-to-r from-purple-600 via-fuchsia-600 to-cyan-500 text-white hover:scale-[1.02] active:scale-95"
      }`}
    >
      <span className="relative z-10">
        {loading ? "推演中…" : children}
      </span>
      {!disabled && !loading && (
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
          <span className="absolute inset-y-0 -left-full w-1/2 skew-x-12 bg-white/25 transition-transform duration-700 group-hover:translate-x-[300%]" />
        </span>
      )}
    </button>
  );
}
