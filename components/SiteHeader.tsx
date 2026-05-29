"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/divine/palm", label: "看手相" },
  { href: "/divine/face", label: "看面相" },
  { href: "/divine/mole", label: "看痣相" },
  { href: "/bazi", label: "看八字" },
  { href: "/naming", label: "起名" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const saved = localStorage.getItem("kanxiang_theme") === "dark" ? "dark" : "light";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem("kanxiang_theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#edeade]/10 bg-[#201913]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 px-5 sm:px-6">
        <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
          <img src="/logo.svg" alt="" className="size-9" />
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

        <button
          type="button"
          aria-label={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
          title={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
          onClick={toggleTheme}
          className="hidden size-10 place-items-center rounded-full border border-[#edeade]/10 bg-[#edeade]/5 font-serif text-sm font-bold text-[#f7f4ee] transition hover:border-brand-primary/40 hover:bg-brand-light hover:text-brand-primary md:grid"
        >
          {theme === "dark" ? "日" : "月"}
        </button>

        <Link
          href="/login"
          className="hidden rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(204,144,92,0.18)] transition hover:bg-brand-hover md:inline-flex"
        >
          登录
        </Link>

        <button
          type="button"
          aria-label={menuOpen ? "关闭导航菜单" : "打开导航菜单"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="grid size-10 place-items-center rounded-full border border-[#edeade]/10 bg-[#edeade]/5 text-[#f7f4ee] transition hover:border-brand-primary/40 hover:bg-brand-light hover:text-brand-primary md:hidden"
        >
          <span className="flex w-4 flex-col gap-1">
            <span className="h-0.5 rounded-full bg-current" />
            <span className="h-0.5 rounded-full bg-current" />
            <span className="h-0.5 rounded-full bg-current" />
          </span>
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-[#edeade]/10 bg-[#201913]/95 px-5 py-4 shadow-[0_18px_48px_-32px_rgba(0,0,0,1)] backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-[#f7f4ee] transition hover:bg-[#edeade]/5 hover:text-brand-primary"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={closeMenu}
              className="mt-2 rounded-full bg-brand-primary px-4 py-2.5 text-center text-sm font-semibold text-white shadow-[0_0_24px_rgba(204,144,92,0.18)] transition hover:bg-brand-hover"
            >
              登录
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="mt-2 rounded-full border border-[#edeade]/10 bg-[#edeade]/5 px-4 py-2.5 text-center text-sm font-semibold text-[#f7f4ee] transition hover:border-brand-primary/40 hover:bg-brand-light hover:text-brand-primary"
            >
              {theme === "dark" ? "切换浅色主题" : "切换深色主题"}
            </button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
