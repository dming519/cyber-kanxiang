"use client";

import Link from "next/link";
import { KIND_META, type DivineType } from "@/lib/prompts";

export interface HomeCardMeta {
  href: string;
  title: string;
  subtitle: string;
  tagline: string;
  trigram: string;
  accent: string;
  cta?: string;
}

interface PropsByType {
  type: DivineType;
}
interface PropsByMeta {
  meta: HomeCardMeta;
}
type Props = PropsByType | PropsByMeta;

function isByType(p: Props): p is PropsByType {
  return "type" in p;
}

export function HomeCard(props: Props) {
  const meta: HomeCardMeta = isByType(props)
    ? {
        href: `/divine/${props.type}`,
        ...KIND_META[props.type],
        cta: "开始推演",
      }
    : props.meta;

  return (
    <Link
      href={meta.href}
      className="group relative block overflow-hidden rounded-2xl border border-purple-500/30 bg-purple-500/[.06] p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-cyan-400/60 hover:bg-purple-500/[.10] hover:shadow-[0_0_50px_-10px_rgba(34,211,238,0.55)]"
    >
      <span
        className={`absolute -right-12 -top-12 size-40 rounded-full bg-gradient-to-br ${meta.accent} opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-50`}
      />
      <span className="absolute right-6 top-5 select-none text-5xl text-cinnabar/70 animate-rune-float">
        {meta.trigram}
      </span>

      <div className="relative">
        <h3 className="font-serif text-3xl font-black tracking-wide text-neon-cyan">
          {meta.title}
        </h3>
        <p className="mt-1 text-xs uppercase tracking-[0.3em] text-purple-300/70">
          {meta.subtitle}
        </p>
        <p className="mt-6 min-h-[3.2em] text-sm leading-relaxed text-gray-300">
          {meta.tagline}
        </p>

        <div className="mt-8 flex items-center gap-2 text-sm text-neon-purple transition-all duration-300 group-hover:gap-4 group-hover:text-neon-cyan">
          <span>{meta.cta ?? "开始推演"}</span>
          <span aria-hidden>→</span>
        </div>
      </div>

      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
    </Link>
  );
}
