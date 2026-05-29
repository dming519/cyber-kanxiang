const PROVIDERS = [
  {
    name: "GitHub",
    href: "/api/auth/signin/github",
    mark: "GH",
  },
  {
    name: "Google",
    href: "/api/auth/signin/google",
    mark: "G",
  },
];

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-5 py-12 sm:px-6">
      <section className="relative w-full max-w-md rounded-2xl border border-[#edeade]/10 bg-[#2e261f]/75 p-6 shadow-[0_24px_80px_-56px_rgba(0,0,0,1)] backdrop-blur-sm sm:p-8">
        <a
          href="/"
          aria-label="关闭登录页"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-[#edeade]/10 bg-[#edeade]/5 text-lg leading-none text-[#f7f4ee] transition hover:border-brand-primary/40 hover:bg-brand-light hover:text-brand-primary"
        >
          ×
        </a>
        <div className="text-center">
          <img src="/logo.svg" alt="" className="mx-auto size-14" />
          <h1 className="mt-5 font-serif text-3xl font-bold text-[#f7f4ee]">
            登录赛博看相
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#a3988f]">
            当前仅支持 GitHub 和 Google 登录。
          </p>
        </div>

        <div className="mt-7 space-y-3">
          {PROVIDERS.map((provider) => (
            <a
              key={provider.name}
              href={provider.href}
              className="flex h-12 items-center justify-center gap-3 rounded-full border border-[#edeade]/10 bg-[#edeade]/5 px-4 text-sm font-semibold text-[#f7f4ee] transition hover:border-brand-primary/45 hover:bg-brand-light hover:text-brand-primary"
            >
              <span className="grid size-7 place-items-center rounded-full border border-current/25 font-mono text-[11px]">
                {provider.mark}
              </span>
              使用 {provider.name} 登录
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
