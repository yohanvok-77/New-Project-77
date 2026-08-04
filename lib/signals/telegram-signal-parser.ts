import type { Prisma, SignalDirection } from "@prisma/client";
import { normalizeSignalSourceName } from "../../../lib/signals/sourceVisibility";

export type ParsedTelegramSignal = {
  sourceText: string;
  algorithm: string;
  algorithmName: string;
  algorithmImageUrl: string;
  symbol: string;
  pair: string;
  direction: SignalDirection;
  sourceName: string;
  order: number;
  volume: number | null;
  entry: number;
  takeProfit: number;
  stopLoss: number;
  winrate: number;
  stepPoints: number;
  gridOrders: number;
  openedPositions: number;
  stopLossPoints: number;
  magic: string | null;
  sourceUrl: string | null;
  publishedAt: Date;
  expiresAt: Date;
};

export type TelegramSignalParserOptions = {
  publishedAt?: Date;
  expiresInHours?: number;
  defaultWinrate?: number;
  sourceName?: string;
};

const defaultExpiresInHours = 24;
const defaultWinrate = 70;
const defaultSourceName = "E+R Range";
const winrateByOpenedPositions: Record<number, number> = {
  1: 62,
  2: 64,
  3: 66,
  4: 68,
  5: 70,
  6: 76,
  7: 82,
  8: 88,
};

function readMatch(text: string, pattern: RegExp) {
  return text.match(pattern)?.[1]?.trim() ?? null;
}

function readRequired(text: string, patterns: RegExp[], fieldName: string) {
  for (const pattern of patterns) {
    const value = readMatch(text, pattern);

    if (value) {
      return value;
    }
  }

  throw new Error(`TELEGRAM_SIGNAL_MISSING_${fieldName}`);
}

function parseNumber(value: string, fieldName: string) {
  const normalized = value.replace(",", ".").replace(/\s+/g, "");
  const number = Number(normalized);

  if (!Number.isFinite(number)) {
    throw new Error(`TELEGRAM_SIGNAL_INVALID_${fieldName}`);
  }

  return number;
}

function getPipSize(symbol: string, entry: number) {
  const normalized = symbol.toUpperCase();

  if (normalized.includes("JPY")) {
    return 0.01;
  }

  if (normalized.includes("XAU")) {
    return 0.01;
  }

  if (normalized.includes("XAG")) {
    return 0.001;
  }

  if (entry >= 1000) {
    return 1;
  }

  return 0.0001;
}

function normalizeStepPoints(symbol: string, stepPoints: number) {
  const normalized = symbol.toUpperCase();

  if (normalized.includes("XAU")) {
    return stepPoints * 100;
  }

  if (normalized.includes("XAG")) {
    return stepPoints * 10;
  }

  return stepPoints;
}

function getPriceDecimals(entry: number) {
  const decimalPart = entry.toString().split(".")[1];
  return Math.min(Math.max(decimalPart?.length ?? 5, 2), 6);
}

function normalizePair(symbol: string) {
  const cleanSymbol = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (cleanSymbol.endsWith("CASH")) {
    return cleanSymbol.replace(/CASH$/, "");
  }

  if (/^[A-Z]{6}$/.test(cleanSymbol)) {
    return `${cleanSymbol.slice(0, 3)}/${cleanSymbol.slice(3)}`;
  }

  return cleanSymbol;
}

function parseAlgorithm(algorithm: string) {
  const parts = algorithm.trim().replace(/-+$/, "").split("-").filter(Boolean);

  if (parts.length < 3) {
    throw new Error("TELEGRAM_SIGNAL_INVALID_ALGORITHM");
  }

  const symbol = parts[0].toUpperCase();
  const stepPoints = Number(parts[1]);
  const gridOrders = Number(parts[2]);

  if (!Number.isFinite(stepPoints) || stepPoints <= 0) {
    throw new Error("TELEGRAM_SIGNAL_INVALID_STEP");
  }

  if (!Number.isFinite(gridOrders) || gridOrders <= 0) {
    throw new Error("TELEGRAM_SIGNAL_INVALID_GRID");
  }

  return {
    algorithmName: parts.join("-"),
    symbol,
    stepPoints,
    gridOrders,
  };
}

function getAlgorithmImageUrl(algorithmName: string) {
  return `/algorithm-charts/${algorithmName}.png`;
}

function parseOpenedPositions(sourceText: string) {
  const match = sourceText.match(
    /(?:Открытых позиций|Открыто позиций|Open positions)[^\n\r]*?(?:BUY|SELL)(?:\s*\(magic\s*([^)]+)\))?:\s*(\d+)/i,
  );

  if (!match?.[2]) {
    throw new Error("TELEGRAM_SIGNAL_MISSING_OPENED_POSITIONS");
  }

  return {
    openedPositions: parseNumber(match[2], "OPENED_POSITIONS"),
    magic: match[1]?.trim() ?? null,
  };
}

export function calculateStopLoss(params: {
  direction: SignalDirection;
  symbol: string;
  entry: number;
  stepPoints: number;
  gridOrders: number;
  openedPositions: number;
}) {
  const remainingOrders = Math.max(params.gridOrders - params.openedPositions, 0);
  const normalizedStepPoints = normalizeStepPoints(params.symbol, params.stepPoints);
  const stopLossPoints = remainingOrders * normalizedStepPoints;
  const pipSize = getPipSize(params.symbol, params.entry);
  const distance = stopLossPoints * pipSize;
  const decimals = getPriceDecimals(params.entry);
  const stopLoss = params.direction === "BUY" ? params.entry - distance : params.entry + distance;

  return {
    stopLoss: Number(stopLoss.toFixed(decimals)),
    stopLossPoints,
    remainingOrders,
  };
}

export function calculateWinrateByOrder(openedPositions: number) {
  const normalizedOrder = Math.max(Math.floor(openedPositions), 1);

  if (normalizedOrder >= 8) {
    return winrateByOpenedPositions[8];
  }

  return winrateByOpenedPositions[normalizedOrder] ?? defaultWinrate;
}

export function parseTelegramSignalMessage(
  sourceText: string,
  options: TelegramSignalParserOptions = {},
): ParsedTelegramSignal {
  const algorithm = readRequired(sourceText, [/Алгоритм:\s*([^\n\r]+)/i, /Algorithm:\s*([^\n\r]+)/i], "ALGORITHM");
  const algorithmData = parseAlgorithm(algorithm);
  const symbol = readRequired(
    sourceText,
    [/Символ:\s*([^\n\r]+)/i, /Symbol:\s*([^\n\r]+)/i],
    "SYMBOL",
  ).toUpperCase();
  const directionRaw = readRequired(sourceText, [/Тип:\s*(?:[^\w\n\r]*)?(BUY|SELL)/i, /Type:\s*(?:[^\w\n\r]*)?(BUY|SELL)/i], "DIRECTION");
  const direction = directionRaw.toUpperCase() as SignalDirection;
  const volumeRaw = readMatch(sourceText, /Объ[её]м:\s*([0-9.,]+)/i) ?? readMatch(sourceText, /Volume:\s*([0-9.,]+)/i);
  const entry = parseNumber(readRequired(sourceText, [/Цена:\s*([0-9.,\s]+)/i, /Price:\s*([0-9.,\s]+)/i], "ENTRY"), "ENTRY");
  const takeProfit = parseNumber(readRequired(sourceText, [/TP:\s*([0-9.,\s]+)/i], "TAKE_PROFIT"), "TAKE_PROFIT");
  const { openedPositions, magic } = parseOpenedPositions(sourceText);
  const sourceUrl = readMatch(sourceText, /(https?:\/\/\S+)/i);
  const publishedAt = options.publishedAt ?? new Date();
  const expiresAt = new Date(
    publishedAt.getTime() + (options.expiresInHours ?? defaultExpiresInHours) * 60 * 60 * 1000,
  );
  const stopLossData = calculateStopLoss({
    direction,
    symbol: algorithmData.symbol || symbol,
    entry,
    stepPoints: algorithmData.stepPoints,
    gridOrders: algorithmData.gridOrders,
    openedPositions,
  });
  const pair = normalizePair(symbol || algorithmData.symbol);
  const sourceName = normalizeSignalSourceName(options.sourceName, pair, algorithmData.algorithmName);

  return {
    sourceText,
    algorithm,
    algorithmName: algorithmData.algorithmName,
    algorithmImageUrl: getAlgorithmImageUrl(algorithmData.algorithmName),
    symbol,
    pair,
    direction,
    sourceName,
    order: openedPositions,
    volume: volumeRaw ? parseNumber(volumeRaw, "VOLUME") : null,
    entry,
    takeProfit,
    stopLoss: stopLossData.stopLoss,
    winrate: calculateWinrateByOrder(openedPositions),
    stepPoints: algorithmData.stepPoints,
    gridOrders: algorithmData.gridOrders,
    openedPositions,
    stopLossPoints: stopLossData.stopLossPoints,
    magic,
    sourceUrl,
    publishedAt,
    expiresAt,
  };
}

export function toSignalCreateInput(
  parsed: ParsedTelegramSignal,
  options: { winrate?: number } = {},
): Prisma.SignalCreateInput {
  return {
    pair: parsed.pair,
    direction: parsed.direction,
    sourceName: parsed.sourceName,
    order: parsed.order,
    algorithmName: parsed.algorithmName,
    algorithmImageUrl: parsed.algorithmImageUrl,
    winrate: options.winrate ?? parsed.winrate,
    entry: parsed.entry,
    stopLoss: parsed.stopLoss,
    takeProfit: parsed.takeProfit,
    status: "PENDING",
    publishedAt: parsed.publishedAt,
    expiresAt: parsed.expiresAt,
    events: {
      create: {
        type: "CREATED",
        price: parsed.entry,
        message: `Imported from Telegram. Algorithm=${parsed.algorithmName}; order=${parsed.order}; opened=${parsed.openedPositions}; winrate=${options.winrate ?? parsed.winrate}%; calculated SL=${parsed.stopLoss} (${parsed.stopLossPoints} points).`,
      },
    },
  };
}
