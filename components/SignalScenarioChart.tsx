import type { Signal } from "@/types/signal";
import type { Language } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

interface SignalScenarioChartProps {
  signal: Signal;
  language: Language;
}

interface ChartPoint {
  label: "Entry" | "TP" | "SL";
  value: string;
  x: number;
  y: number;
  color: string;
}

function getPipSize(pair: string, entry: string) {
  const decimals = (entry.split(".")[1] || "").length;

  if (pair.toUpperCase().includes("JPY")) {
    return 0.01;
  }

  if (decimals <= 3) {
    return 0.01;
  }

  return 0.0001;
}

function computeTradeStats(signal: Signal) {
  const entry = Number.parseFloat(signal.entry);
  const stopLoss = Number.parseFloat(signal.stopLoss);
  const takeProfit = Number.parseFloat(signal.takeProfit);

  if (!Number.isFinite(entry) || !Number.isFinite(stopLoss) || !Number.isFinite(takeProfit)) {
    return null;
  }

  const pipSize = getPipSize(signal.pair, signal.entry);
  const riskDistance = Math.abs(entry - stopLoss);
  const rewardDistance = Math.abs(takeProfit - entry);

  if (riskDistance === 0) {
    return null;
  }

  return {
    riskPips: Math.round(riskDistance / pipSize),
    rewardPips: Math.round(rewardDistance / pipSize),
    ratio: rewardDistance / riskDistance,
  };
}

function toNumber(value: string | null | undefined) {
  const parsed = Number(String(value || "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function getPriceDecimals(value: string) {
  const decimalPart = value.split(".")[1] || value.split(",")[1];
  return Math.min(Math.max(decimalPart?.length ?? 5, 2), 6);
}

function getAlgorithmPipSize(symbol: string, entry: number) {
  const normalized = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (normalized.includes("XAU")) {
    return 0.01;
  }

  if (normalized.includes("XAG")) {
    return 0.001;
  }

  if (normalized.includes("JPY")) {
    return 0.01;
  }

  if (entry >= 1000) {
    return 1;
  }

  return 0.0001;
}

function normalizeStepPoints(symbol: string, stepPoints: number) {
  const normalized = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (normalized.includes("XAU")) {
    return stepPoints >= 1000 ? stepPoints : stepPoints * 100;
  }

  if (normalized.includes("XAG")) {
    return stepPoints * 10;
  }

  return stepPoints;
}

function getAlgorithmParts(algorithmName: string | null | undefined) {
  const parts = (algorithmName || "").trim().replace(/-+$/, "").split("-").filter(Boolean);
  const rawSymbol = parts[0]?.toUpperCase().replace(/[^A-Z0-9]/g, "") || "";
  const stepPoints = Number(parts[1]);
  const gridOrders = Number(parts[2]);

  if (!rawSymbol || !Number.isFinite(stepPoints) || !Number.isFinite(gridOrders)) {
    return null;
  }

  return {
    symbol: rawSymbol,
    stepPoints,
    gridOrders,
  };
}

function getRussianCurrentOrderLabel(order: number) {
  return `${order}-${order === 3 ? "ем" : "ом"}`;
}

function getRussianStopOrderLabel(order: number) {
  return `${order}-${order === 3 ? "ий" : "ый"}`;
}

function getAlgorithmScenario(signal: Signal, language: Language) {
  const algorithm = getAlgorithmParts(signal.algorithmName);
  const currentOrder = signal.order || null;
  const entry = toNumber(signal.entry);
  const takeProfit = toNumber(signal.takeProfit);

  if (!algorithm || !currentOrder || !entry || !takeProfit) {
    return null;
  }

  const stopOrder = algorithm.gridOrders;
  const pipSize = getAlgorithmPipSize(algorithm.symbol || signal.pair, entry);
  const stepDistance = normalizeStepPoints(algorithm.symbol || signal.pair, algorithm.stepPoints) * pipSize;
  const decimals = getPriceDecimals(signal.entry);
  const isBuy = signal.direction === "BUY";
  const formatPrice = (value: number) => value.toFixed(decimals);
  const formatStep = stepDistance.toFixed(Math.min(Math.max(decimals, 2), 4));
  const allRows: Array<{ order: number; entry: string; takeProfit: string }> = [];

  for (let order = currentOrder + 1; order < stopOrder; order += 1) {
    const stepsFromCurrent = order - currentOrder;
    const entryLevel = isBuy
      ? entry - stepDistance * stepsFromCurrent
      : entry + stepDistance * stepsFromCurrent;
    const takeProfitLevel = isBuy
      ? takeProfit - stepDistance * stepsFromCurrent
      : takeProfit + stepDistance * stepsFromCurrent;

    allRows.push({
      order,
      entry: formatPrice(entryLevel),
      takeProfit: formatPrice(takeProfitLevel),
    });
  }

  const maxVisibleRows = 2;
  const rows = allRows.slice(0, maxVisibleRows);
  const hiddenRowCount = Math.max(allRows.length - maxVisibleRows, 0);

  if (language === "en") {
    return {
      title: "Algorithm logic",
      intro: `Our algorithm consists of ${stopOrder} orders. We are currently on order #${currentOrder}.`,
      stopLine: `Since order #${stopOrder} is our Stop Loss, then:`,
      rowPrefix: "If price reaches",
      rowMiddle: "we move TP to",
      rows,
      hiddenRowCount,
      moreLevelsLabel: (count: number) => `+${count} more level${count === 1 ? "" : "s"}`,
      empty: "The next order is the stop-loss zone, so TP is not moved further.",
      stepLabel: "Grid step",
      stepValue: formatStep,
      stopLabel: "SL order",
      stopValue: `#${stopOrder}`,
    };
  }

  return {
    title: "Логика алгоритма",
    intro: `Наш алгоритм состоит из ${stopOrder} ордеров, сейчас мы находимся на ${getRussianCurrentOrderLabel(currentOrder)} ордере.`,
    stopLine: `Так как ${getRussianStopOrderLabel(stopOrder)} ордер у нас Stop Loss, то:`,
    rowPrefix: "Если цена дойдёт до",
    rowMiddle: "то мы передвигаем TP на",
    rows,
    hiddenRowCount,
    moreLevelsLabel: (count: number) => `+${count} уровн${count === 1 ? "ень" : count < 5 ? "я" : "ей"}`,
    empty: "Следующий ордер является зоной Stop Loss, поэтому TP дальше не передвигается.",
    stepLabel: "Шаг сетки",
    stepValue: formatStep,
    stopLabel: "SL ордер",
    stopValue: `#${stopOrder}`,
  };
}

export function SignalScenarioChart({ signal, language }: SignalScenarioChartProps) {
  const t = getDictionary(language);
  const tradeStats = computeTradeStats(signal);
  const algorithmScenario = getAlgorithmScenario(signal, language);
  const isBuy = signal.direction === "BUY";
  const path = isBuy
    ? "M20 136 C52 116 70 129 96 105 C125 78 149 101 178 70 C205 41 229 58 264 34"
    : "M20 50 C52 72 72 58 98 86 C126 116 150 92 180 126 C207 154 232 132 264 160";

  const fillPath = isBuy
    ? `${path} L264 178 L20 178 Z`
    : `${path} L264 20 L20 20 Z`;

  const points: ChartPoint[] = isBuy
    ? [
        { label: "TP", value: signal.takeProfit, x: 236, y: 48, color: "#22C55E" },
        { label: "Entry", value: signal.entry, x: 142, y: 98, color: "#3B82F6" },
        { label: "SL", value: signal.stopLoss, x: 78, y: 142, color: "#EF4444" },
      ]
    : [
        { label: "SL", value: signal.stopLoss, x: 76, y: 52, color: "#EF4444" },
        { label: "Entry", value: signal.entry, x: 142, y: 98, color: "#3B82F6" },
        { label: "TP", value: signal.takeProfit, x: 236, y: 146, color: "#22C55E" },
      ];

  return (
    <section className="rounded-3xl border border-white/12 bg-white/[0.045] p-4 shadow-gold lg:flex lg:min-h-full lg:flex-col">
      <div>
        <div>
          <p className="text-sm font-black uppercase tracking-normal text-text">
            {t.scenarioTitle}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted">
            {t.scenarioSubtitle}
          </p>
        </div>
      </div>

      <div className="relative mt-4 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#080B12]/80 lg:flex-1">
        {signal.algorithmImageUrl ? (
          <div className="relative z-10 h-52 w-full shrink-0 bg-[#080B12] p-2.5 sm:h-64 sm:p-3 lg:h-[240px]">
            <div className="h-full w-full overflow-hidden rounded-2xl bg-white">
              <img
                src={signal.algorithmImageUrl}
                alt={signal.algorithmName || `${signal.pair} algorithm chart`}
                className="h-[128%] w-full object-cover object-top"
                onError={(event) => {
                  const image = event.currentTarget;

                  if (image.src.endsWith(".png")) {
                    image.src = image.src.replace(/\.png$/, ".jpg");
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(59,130,246,0.2),transparent_34%),radial-gradient(circle_at_18%_78%,rgba(245,158,11,0.14),transparent_34%)]" />
            <svg
              className="relative z-10 h-52 w-full shrink-0 sm:h-64 lg:h-[240px]"
              viewBox="0 0 320 190"
              role="img"
              aria-label={`${t.scenarioAria} ${signal.pair}`}
              preserveAspectRatio="none"
            >
          <defs>
            <linearGradient id={`priceLine-${signal.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.85" />
              <stop offset="52%" stopColor="#F59E0B" stopOpacity="0.9" />
              <stop offset="100%" stopColor={isBuy ? "#22C55E" : "#EF4444"} stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id={`priceFill-${signal.id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={isBuy ? "#22C55E" : "#EF4444"} stopOpacity="0.22" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
            <filter id={`softGlow-${signal.id}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[34, 70, 106, 142, 178].map((y) => (
            <line
              key={y}
              x1="16"
              x2="304"
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.09)"
              strokeWidth="1"
            />
          ))}
          {[64, 128, 192, 256].map((x) => (
            <line
              key={x}
              x1={x}
              x2={x}
              y1="18"
              y2="178"
              stroke="rgba(255,255,255,0.045)"
              strokeWidth="1"
            />
          ))}

          <path d={fillPath} fill={`url(#priceFill-${signal.id})`} opacity="0.9" />
          <path
            d={path}
            fill="none"
            stroke={`url(#priceLine-${signal.id})`}
            strokeLinecap="round"
            strokeWidth="4"
            filter={`url(#softGlow-${signal.id})`}
          />

          {points.map((point) => (
            <g key={point.label}>
              <line
                x1="20"
                x2="300"
                y1={point.y}
                y2={point.y}
                stroke={point.color}
                strokeDasharray="5 7"
                strokeOpacity="0.46"
                strokeWidth="1.2"
              />
              <circle cx={point.x} cy={point.y} r="8" fill="#080B12" stroke={point.color} strokeWidth="3" />
              <circle cx={point.x} cy={point.y} r="3.5" fill={point.color} />
              <g transform={`translate(${Math.min(point.x + 12, 246)} ${point.y - 15})`}>
                <rect
                  width="58"
                  height="26"
                  rx="13"
                  fill="rgba(8,11,18,0.84)"
                  stroke={point.color}
                  strokeOpacity="0.42"
                />
                <text
                  x="29"
                  y="17"
                  textAnchor="middle"
                  fill={point.color}
                  fontSize="10"
                  fontWeight="800"
                >
                  {point.label}
                </text>
              </g>
            </g>
          ))}
            </svg>
          </>
        )}

        <div className="flex flex-1 flex-col divide-y divide-white/10">
          {tradeStats ? (
            <div className="shrink-0 space-y-3 p-4">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-4">
                <p className="text-xs font-black uppercase tracking-normal text-muted">
                  {t.riskReward}
                </p>
                <p className="text-2xl font-black text-gold sm:text-3xl">
                  1&nbsp;:&nbsp;{tradeStats.ratio.toFixed(1)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-normal text-success">
                    {t.pipsToTakeProfit}
                  </p>
                  <p className="mt-1 text-xl font-black text-text">{tradeStats.rewardPips}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-normal text-danger">
                    {t.pipsToStopLoss}
                  </p>
                  <p className="mt-1 text-xl font-black text-text">{tradeStats.riskPips}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="shrink-0 p-4 sm:p-5">
            {algorithmScenario ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-normal text-text">
                    {algorithmScenario.title}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-text sm:text-base">
                    {algorithmScenario.intro}
                  </p>
                  <p className="mt-1 text-sm font-bold leading-relaxed text-muted sm:text-base">
                    {algorithmScenario.stopLine}
                  </p>

                  <div className="mt-3 space-y-2">
                    {algorithmScenario.rows.length > 0 ? (
                      <>
                        {algorithmScenario.rows.map((row) => (
                          <p
                            key={row.order}
                            className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-bold leading-relaxed text-text"
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
                      <p className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-bold leading-relaxed text-danger">
                        {algorithmScenario.empty}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-normal text-muted">
                      {algorithmScenario.stepLabel}
                    </p>
                    <p className="mt-1 text-lg font-black text-blue">{algorithmScenario.stepValue}</p>
                  </div>
                  <div className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-normal text-danger">
                      {algorithmScenario.stopLabel}
                    </p>
                    <p className="mt-1 text-lg font-black text-danger">{algorithmScenario.stopValue}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
