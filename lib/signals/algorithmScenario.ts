import type { Signal } from "@/types/signal";
import type { Language } from "@/lib/i18n";

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

export function getAlgorithmScenario(signal: Signal, language: Language) {
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
