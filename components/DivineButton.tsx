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
      className={`group relative w-full rounded-full px-8 py-4 font-serif text-lg font-bold tracking-[0.3em] transition-all duration-300 ${
        disabled || loading
          ? "cursor-not-allowed bg-[#3d3229]/60 text-[#a3988f]/60"
          : "animate-neon-pulse bg-brand-primary text-white shadow-[0_0_24px_rgba(204,144,92,0.18)] hover:bg-brand-hover hover:scale-[1.01] active:scale-95"
      }`}
    >
      <span className="relative z-10">
        {loading ? "推演中…" : children}
      </span>
      {!disabled && !loading && (
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <span className="absolute inset-y-0 -left-full w-1/2 skew-x-12 bg-white/20 transition-transform duration-700 group-hover:translate-x-[300%]" />
        </span>
      )}
    </button>
  );
}
