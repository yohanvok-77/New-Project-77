import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { hasActiveAccess } from "@/lib/auth/access";
import { getCurrentLanguage } from "@/lib/i18nServer";

export const dynamic = "force-dynamic";

const copy = {
  ru: {
    brand: "Торговые идеи",
    logo: "ТИ",
    login: "Войти",
    register: "Регистрация",
    enterPlatform: "Войти в платформу",
    createAccount: "Создать аккаунт",
    badge: "Система торговых идей на базе 77 алгоритмов",
    title: "Математика перевеса между рынками",
    lead:
      "Платформа наблюдает за рынками, сравнивает силу одной торговой пары относительно другой и фиксирует моменты, когда статистический перевес становится максимальным.",
    proof:
      "Это не просто поток сигналов. На реальных счетах работает сеть алгоритмов, которые превращают повторяющиеся рыночные паттерны в торговые идеи с Entry, TP, SL и понятным жизненным циклом.",
    primaryCta: "Открыть платформу",
    marketMap: "Карта рынков",
    algorithmEngine: "Algorithm engine",
    online: "Online",
    markets: "рынков под наблюдением",
    algorithms: "алгоритмов на реальных счетах",
    lifecycle: "статусов жизненного цикла идеи",
    imbalance: "Market imbalance",
    formulaTitle: "Идея появляется в момент максимального перевеса",
    formulaText:
      "Система ищет повторяемые ситуации, где поведение одной пары статистически выделяется относительно другой. Когда условия сходятся, идея попадает в закрытый dashboard.",
    steps: [
      ["01", "Наблюдение", "Рынки анализируются постоянно: bid/ask, движение, активность и взаимный дисбаланс."],
      ["02", "Сравнение", "Алгоритмы проверяют, где одна торговая пара получает преимущество относительно другой."],
      ["03", "Фильтрация", "Идея появляется только когда перевес достигает заданного математического порога."],
      ["04", "Сопровождение", "Платформа отслеживает Entry, TP, SL, статус и историю события автоматически."],
    ],
    labTitle: "77 алгоритмов работают как исследовательская лаборатория",
    labText:
      "Каждый алгоритм тестирует свой участок рынка. Вместе они дают систему наблюдений, где важны повторяемость, вероятность и дисциплина исполнения.",
    cards: [
      ["Entry", "точка включения идеи"],
      ["Take Profit", "цель движения"],
      ["Stop Loss", "контроль сценария"],
    ],
    disclaimer: "Информация представлена исключительно в образовательных целях и не является финансовой рекомендацией.",
  },
  en: {
    brand: "Trading Ideas",
    logo: "TI",
    login: "Log in",
    register: "Register",
    enterPlatform: "Enter platform",
    createAccount: "Create account",
    badge: "Trading idea system powered by 77 algorithms",
    title: "Mathematics of market imbalance",
    lead:
      "The platform observes markets, compares relative strength between instruments, and captures moments when statistical imbalance reaches its strongest point.",
    proof:
      "This is not just a stream of signals. A network of algorithms runs on real accounts and turns recurring market patterns into structured ideas with Entry, TP, SL, and a clear lifecycle.",
    primaryCta: "Open platform",
    marketMap: "Market map",
    algorithmEngine: "Algorithm engine",
    online: "Online",
    markets: "markets monitored",
    algorithms: "algorithms on real accounts",
    lifecycle: "signal lifecycle states",
    imbalance: "Market imbalance",
    formulaTitle: "An idea appears at the moment of maximum imbalance",
    formulaText:
      "The system searches for repeatable situations where one instrument statistically stands out against another. When the conditions align, the idea enters the private dashboard.",
    steps: [
      ["01", "Observation", "Markets are monitored continuously: bid/ask, movement, activity, and relative imbalance."],
      ["02", "Comparison", "Algorithms check where one trading pair gains an edge relative to another."],
      ["03", "Filtering", "An idea appears only when the imbalance reaches a defined mathematical threshold."],
      ["04", "Lifecycle", "The platform tracks Entry, TP, SL, status, and event history automatically."],
    ],
    labTitle: "77 algorithms working like a research lab",
    labText:
      "Each algorithm tests its own market segment. Together they create an observation system built on repeatability, probability, and execution discipline.",
    cards: [
      ["Entry", "idea activation level"],
      ["Take Profit", "target scenario"],
      ["Stop Loss", "scenario control"],
    ],
    disclaimer: "The information is provided for educational purposes only and is not financial advice.",
  },
} as const;

const outerPairs = ["AUDCAD", "AUDUSD", "CADJPY", "CHFJPY", "EURAUD", "EURCAD", "EURCHF", "EURGBP", "EURJPY", "EURUSD"];
const innerPairs = ["GBPCHF", "GBPJPY", "GBPNZD", "GBPUSD", "XAGUSD", "XAUUSD", "NZDUSD", "NZDCAD", "US500"];
const bars = [34, 58, 42, 76, 64, 92, 68, 104, 84, 118, 96, 132];

function MarketVisual({ language }: { language: keyof typeof copy }) {
  const t = copy[language];

  return (
    <div className="landing-market-scene pointer-events-none relative mx-auto w-full max-w-[650px] lg:ml-auto">
      <div className="absolute -inset-8 rounded-full bg-blue/10 blur-3xl" />
      <div className="glass-panel relative overflow-hidden rounded-[2rem] p-4 sm:p-5">
        <div className="landing-grid absolute inset-0 opacity-35" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-normal text-muted">{t.marketMap}</p>
            <h2 className="mt-1 truncate text-xl font-black text-text sm:text-2xl">XAU/USD · GBP/NZD · NZD/CAD</h2>
          </div>
          <span className="shrink-0 rounded-full border border-success/30 bg-success/15 px-3 py-1 text-xs font-black text-success">
            {t.online}
          </span>
        </div>

        <div className="relative z-10 mt-5 grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="relative h-56 overflow-hidden rounded-3xl border border-white/10 bg-[#080B12]/72">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:44px_36px]" />
            <div className="absolute inset-x-5 bottom-5 flex h-40 items-end justify-between gap-1.5">
              {bars.map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  className={[
                    "landing-bar block w-4 rounded-t-lg",
                    index % 5 === 0 ? "bg-danger" : index % 3 === 0 ? "bg-gold" : "bg-success",
                  ].join(" ")}
                  style={{ height, animationDelay: `${index * 120}ms` }}
                />
              ))}
            </div>
            <div className="landing-price-line absolute left-6 top-28 h-1 w-[84%] rounded-full bg-gradient-to-r from-blue via-success to-gold" />
            <span className="absolute left-[58%] top-[42%] h-4 w-4 rounded-full bg-blue shadow-[0_0_24px_rgba(59,130,246,0.8)]" />
            <span className="absolute right-[16%] top-[27%] h-4 w-4 rounded-full bg-success shadow-[0_0_24px_rgba(34,197,94,0.8)]" />
          </div>

          <div className="landing-orbit relative mx-auto aspect-square w-full max-w-[22rem] rounded-full border border-white/10 bg-[#080B12]/48">
            <div className="absolute inset-5 rounded-full border border-white/10" />
            <div className="absolute inset-14 rounded-full border border-blue/25" />
            <div className="absolute inset-[6.5rem] rounded-full border border-gold/20" />
            {outerPairs.map((pair, index) => (
              <span
                key={pair}
                className="landing-node absolute rounded-full border border-white/12 bg-white/[0.09] px-2.5 py-1 text-[10px] font-black text-text backdrop-blur-xl"
                style={{
                  left: `${50 + Math.cos((index / outerPairs.length) * Math.PI * 2) * 45}%`,
                  top: `${50 + Math.sin((index / outerPairs.length) * Math.PI * 2) * 45}%`,
                  animationDelay: `${index * 110}ms`,
                }}
              >
                {pair}
              </span>
            ))}
            {innerPairs.map((pair, index) => (
              <span
                key={pair}
                className="landing-node absolute rounded-full border border-blue/20 bg-blue/[0.08] px-2.5 py-1 text-[10px] font-black text-blue backdrop-blur-xl"
                style={{
                  left: `${50 + Math.cos((index / innerPairs.length) * Math.PI * 2 + 0.2) * 30}%`,
                  top: `${50 + Math.sin((index / innerPairs.length) * Math.PI * 2 + 0.2) * 30}%`,
                  animationDelay: `${index * 130}ms`,
                }}
              >
                {pair}
              </span>
            ))}
            <div className="absolute left-1/2 top-1/2 w-36 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-success/25 bg-success/10 p-4 text-center backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-normal text-success">{t.algorithmEngine}</p>
              <strong className="mt-1 block text-4xl font-black text-text">77</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const language = getCurrentLanguage();
  const t = copy[language];
  const user = await getCurrentUser();
  const canOpenPlatform = hasActiveAccess(user);
  const primaryHref = user ? (canOpenPlatform ? "/signals" : "/no-access") : "/register";
  const primaryLabel = user ? t.enterPlatform : t.createAccount;

  return (
    <main className="relative min-h-screen overflow-hidden bg-base text-text">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(59,130,246,0.2),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(245,158,11,0.16),transparent_26%),radial-gradient(circle_at_50%_94%,rgba(34,197,94,0.12),transparent_36%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,11,18,0.9),rgba(8,11,18,0.55),rgba(8,11,18,0.9))]" />
      </div>

      <header className="fixed inset-x-0 top-0 z-30 px-4 py-4 sm:px-6 lg:px-8">
        <nav className="glass-panel mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-3xl px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-lg font-black text-blue shadow-glow">
              {t.logo}
            </span>
            <span className="truncate text-lg font-black tracking-normal">{t.brand}</span>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher language={language} />
            <Link href={user ? "/signals" : "/login"} className="glass-button rounded-full px-4 py-2.5 text-sm font-black">
              {user ? t.enterPlatform : t.login}
            </Link>
            {user ? null : (
              <Link
                href="/register"
                className="hidden rounded-full bg-blue px-4 py-2.5 text-sm font-black text-white shadow-glow transition hover:scale-[1.02] sm:inline-flex"
              >
                {t.register}
              </Link>
            )}
          </div>
        </nav>
      </header>

      <section className="relative isolate min-h-screen overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="landing-grid absolute inset-0 opacity-35" />
        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="max-w-3xl">
            <div className="landing-fade-up inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-sm font-black text-blue backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_16px_rgba(34,197,94,0.8)]" />
              {t.badge}
            </div>
            <h1 className="landing-fade-up mt-7 max-w-4xl text-5xl font-black leading-[0.95] tracking-normal text-text sm:text-6xl xl:text-7xl">
              {t.title}
            </h1>
            <p className="landing-fade-up mt-7 max-w-3xl text-lg font-semibold leading-8 text-muted sm:text-xl">
              {t.lead}
            </p>
            <p className="landing-fade-up mt-4 max-w-3xl text-base font-medium leading-7 text-white/72 sm:text-lg">
              {t.proof}
            </p>
            <div className="landing-fade-up mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className="rounded-2xl bg-blue px-6 py-4 text-center font-black text-white shadow-glow transition hover:scale-[1.01]"
              >
                {primaryLabel}
              </Link>
              <Link
                href={user ? "/signals" : "/login"}
                className="rounded-2xl border border-white/12 bg-white/10 px-6 py-4 text-center font-black text-text backdrop-blur-xl transition hover:bg-white/15"
              >
                {user ? t.primaryCta : t.enterPlatform}
              </Link>
            </div>
          </div>

          <MarketVisual language={language} />
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-white/[0.025] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            ["10", t.markets, "text-blue"],
            ["77", t.algorithms, "text-success"],
            ["6", t.lifecycle, "text-gold"],
          ].map(([value, label, color], index) => (
            <article key={label} className="glass-panel landing-fade-up rounded-3xl p-6" style={{ animationDelay: `${index * 110}ms` }}>
              <strong className={`text-5xl font-black ${color}`}>{value}</strong>
              <p className="mt-3 text-sm font-bold text-muted">{label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="lg:sticky lg:top-32">
            <p className="text-sm font-black uppercase tracking-normal text-success">{t.imbalance}</p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-normal sm:text-5xl">{t.formulaTitle}</h2>
            <p className="mt-5 text-lg font-medium leading-8 text-muted">{t.formulaText}</p>
          </div>

          <div className="grid gap-4">
            {t.steps.map(([number, title, text], index) => (
              <article
                key={number}
                className="glass-panel landing-fade-up group rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:border-white/25"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="flex gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-blue/25 bg-blue/10 text-sm font-black text-blue">
                    {number}
                  </span>
                  <div>
                    <h3 className="text-xl font-black">{title}</h3>
                    <p className="mt-2 leading-7 text-muted">{text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-20 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto max-w-7xl overflow-hidden rounded-[2rem] p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-normal text-blue">Idea detected</p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-normal sm:text-5xl">{t.labTitle}</h2>
              <p className="mt-5 text-lg leading-8 text-muted">{t.labText}</p>
            </div>
            <div className="grid gap-3">
              {t.cards.map(([title, text], index) => (
                <div
                  key={title}
                  className="landing-fade-up rounded-3xl border border-white/10 bg-white/[0.055] p-5"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className={["text-lg font-black", index === 0 ? "text-blue" : index === 1 ? "text-success" : "text-danger"].join(" ")}>
                      {title}
                    </span>
                    <span className="h-2 w-24 rounded-full bg-gradient-to-r from-blue via-success to-gold" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-muted">{t.disclaimer}</p>
      </section>
    </main>
  );
}
