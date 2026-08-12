import { SignalScenarioChart } from "@/components/SignalScenarioChart";
import { getSignalStatusColor, getSignalStatusLabel } from "@/lib/signalLifecycle";
import type { Signal } from "@/types/signal";
import type { Language } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

interface SignalDetailsPanelProps {
  signal: Signal | null;
  onClose: () => void;
  language: Language;
}

const directionStyles = {
  BUY: "border-blue/30 bg-blue/15 text-blue",
  SELL: "border-violet/30 bg-violet/15 text-violet",
};

const detailValueStyles: Record<string, string> = {
  entry: "text-blue",
  stopLoss: "text-danger",
  takeProfit: "text-success",
};

export function SignalDetailsPanel({ signal, onClose, language }: SignalDetailsPanelProps) {
  const t = getDictionary(language);

  if (!signal) {
    return null;
  }

  const details: Array<{ key: string; label: string; value: string }> = [
    { key: "algorithm", label: "Algorithm", value: signal.algorithmName || "—" },
    { key: "order", label: "Order", value: signal.order ? `#${signal.order}` : "—" },
    { key: "entry", label: "Entry price", value: signal.entry },
    { key: "stopLoss", label: "Stop Loss", value: signal.stopLoss },
    { key: "takeProfit", label: "Take Profit", value: signal.takeProfit },
    { key: "published", label: t.publication, value: signal.publishedAt },
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-3 py-4 sm:px-5">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        aria-label={t.closeDetails}
        onClick={onClose}
      />

      <aside className="glass-panel relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border-white/16 p-4 shadow-glass animate-sheetUp sm:p-5">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-gold/12 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-normal text-muted">{t.detailsTitle}</p>
            <h2 className="mt-1 break-words text-3xl font-black tracking-normal text-text">
              {signal.pair}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/12 bg-white/10 text-xl text-text shadow-glow transition hover:scale-105 hover:bg-white/15"
            aria-label={t.close}
          >
            ×
          </button>
        </div>

        <div className="relative mt-4 grid max-h-[calc(92vh-6rem)] gap-4 overflow-y-auto pr-1 lg:grid-cols-[0.9fr_1.25fr] lg:items-stretch">
          <section className="grid gap-4">
            <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.055] p-3">
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-black ${directionStyles[signal.direction]}`}
                  >
                    {signal.direction}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-black ${getSignalStatusColor(
                      signal.status,
                    )}`}
                  >
                    {getSignalStatusLabel(signal.status, language)}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-normal text-muted">Winrate</p>
                  <strong className="block text-2xl font-black leading-none tracking-normal text-text">
                    {signal.winrate}%
                  </strong>
                </div>
              </div>
              <div className="relative mt-2.5 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue via-success to-gold"
                  style={{ width: `${signal.winrate}%` }}
                />
              </div>
            </div>

            <dl className="grid gap-2">
              {details.map((detail) => (
                <div
                  key={detail.key}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2.5 backdrop-blur-xl transition hover:border-white/16 hover:bg-white/[0.065]"
                >
                  <dt className="text-sm font-semibold text-muted">{detail.label}</dt>
                  <dd
                    className={[
                      "min-w-0 break-words text-right text-base font-black",
                      detailValueStyles[detail.key] || "text-text",
                    ].join(" ")}
                  >
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <SignalScenarioChart signal={signal} language={language} />
        </div>
      </aside>
    </div>
  );
}
