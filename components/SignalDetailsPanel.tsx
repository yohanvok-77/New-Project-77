import { SignalScenarioChart } from "@/components/SignalScenarioChart";
import { getSignalStatusColor, getSignalStatusLabel } from "@/lib/signalLifecycle";
import { getAlgorithmScenario } from "@/lib/signals/algorithmScenario";
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

export function SignalDetailsPanel({ signal, onClose, language }: SignalDetailsPanelProps) {
  const t = getDictionary(language);

  if (!signal) {
    return null;
  }

  const algorithmScenario = getAlgorithmScenario(signal, language);

  const details: Array<{ key: string; label: string; value: string }> = [
    { key: "algorithm", label: "Algorithm", value: signal.algorithmName || "—" },
    { key: "order", label: "Order", value: signal.order ? `#${signal.order}` : "—" },
    { key: "published", label: t.publication, value: signal.publishedAt },
  ];

  const priceRows: Array<{ key: string; label: string; value: string; styles: string; valueColor: string }> = [
    { key: "entry", label: "Entry price", value: signal.entry, styles: "border-blue/25 bg-blue/10", valueColor: "text-blue" },
    { key: "stopLoss", label: "Stop Loss", value: signal.stopLoss, styles: "border-danger/25 bg-danger/10", valueColor: "text-danger" },
    { key: "takeProfit", label: "Take Profit", value: signal.takeProfit, styles: "border-success/25 bg-success/10", valueColor: "text-success" },
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

              {algorithmScenario ? (
                <div className="relative mt-3 border-t border-white/10 pt-3">
                  <p className="text-sm font-black uppercase tracking-normal text-text">
                    {algorithmScenario.title}
                  </p>
                  <p className="mt-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-bold leading-relaxed text-text">
                    {algorithmScenario.intro} {algorithmScenario.stopLine}
                  </p>

                  <div className="mt-2 space-y-2">
                    {algorithmScenario.rows.length > 0 ? (
                      <>
                        {algorithmScenario.rows.map((row) => (
                          <p
                            key={row.order}
                            className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2.5 text-sm font-bold leading-relaxed text-text"
                          >
                            {algorithmScenario.rowPrefix}{" "}
                            <span className="text-blue">{row.entry}</span>, {algorithmScenario.rowMiddle}{" "}
                            <span className="text-success">{row.takeProfit}</span>.
                          </p>
                        ))}
                        {algorithmScenario.hiddenRowCount > 0 ? (
                          <p className="px-1 text-xs font-bold text-muted">
                            {algorithmScenario.moreLevelsLabel(algorithmScenario.hiddenRowCount)}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <p className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-2.5 text-sm font-bold leading-relaxed text-danger">
                        {algorithmScenario.empty}
                      </p>
                    )}
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2.5">
                      <p className="text-xs font-black uppercase tracking-normal text-muted">
                        {algorithmScenario.stepLabel}
                      </p>
                      <p className="mt-1 text-lg font-black text-blue">{algorithmScenario.stepValue}</p>
                    </div>
                    <div className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-2.5">
                      <p className="text-xs font-black uppercase tracking-normal text-danger">
                        {algorithmScenario.stopLabel}
                      </p>
                      <p className="mt-1 text-lg font-black text-danger">{algorithmScenario.stopValue}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <dl className="grid gap-2">
              {priceRows.map((row) => (
                <div
                  key={row.key}
                  className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 backdrop-blur-xl ${row.styles}`}
                >
                  <dt className="text-sm font-bold text-muted">{row.label}</dt>
                  <dd className={`min-w-0 break-words text-right text-xl font-black ${row.valueColor}`}>
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            <dl className="grid gap-2">
              {details.map((detail) => (
                <div
                  key={detail.key}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2.5 backdrop-blur-xl transition hover:border-white/16 hover:bg-white/[0.065]"
                >
                  <dt className="text-sm font-semibold text-muted">{detail.label}</dt>
                  <dd className="min-w-0 break-words text-right text-base font-black text-text">
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
