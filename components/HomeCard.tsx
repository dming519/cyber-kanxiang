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
      className="group relative block overflow-hidden rounded-xl border border-[#edeade]/10 bg-[#2e261f]/80 p-8 shadow-[0_18px_60px_-42px_rgba(0,0,0,0.9)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/45 hover:bg-[#3d3229]/70 hover:shadow-[0_0_42px_-18px_rgba(204,144,92,0.5)]"
    >
      <span
        className={`absolute -right-12 -top-12 size-40 rounded-full bg-gradient-to-br ${meta.accent} opacity-[0.12] blur-3xl transition-opacity duration-500 group-hover:opacity-25`}
      />
      <span className="absolute right-6 top-5 select-none text-5xl text-brand-primary/45 animate-rune-float">
        {meta.trigram}
      </span>

      <div className="relative">
        <h3 className="font-serif text-3xl font-black tracking-wide text-[#f7f4ee]">
          {meta.title}
        </h3>
        <p className="mt-1 text-xs uppercase tracking-[0.3em] text-brand-primary/70">
          {meta.subtitle}
        </p>
        <p className="mt-6 min-h-[3.2em] text-sm leading-relaxed text-[#c9c0b6]">
          {meta.tagline}
        </p>

        <div className="mt-8 flex items-center gap-2 text-sm text-brand-primary transition-all duration-300 group-hover:gap-4 group-hover:text-[#f7f4ee]">
          <span>{meta.cta ?? "开始推演"}</span>
          <span aria-hidden>→</span>
        </div>
      </div>

      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#edeade]/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
    </Link>
  );
}
