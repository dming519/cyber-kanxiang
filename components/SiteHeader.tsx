import Link from "next/link";

const NAV_ITEMS = [
  { href: "/divine/palm", label: "看手相" },
  { href: "/divine/face", label: "看面相" },
  { href: "/divine/mole", label: "看痣相" },
  { href: "/bazi", label: "看八字" },
  { href: "/naming", label: "起名" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#edeade]/10 bg-[#201913]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 px-5 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg border border-brand-primary/35 bg-brand-light font-serif text-lg text-brand-primary">
            相
          </span>
          <span className="font-serif text-lg font-bold tracking-wide text-[#f7f4ee]">
            赛博看相
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm text-[#c9c0b6] transition hover:bg-[#edeade]/5 hover:text-brand-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/divine/palm"
          className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(204,144,92,0.18)] transition hover:bg-brand-hover"
        >
          开始推演
        </Link>
      </div>
    </header>
  );
}
