import type { Signal as PrismaSignal } from "@prisma/client";
import type { Language } from "@/lib/i18n";
import type { Signal, SignalStatus } from "@/types/signal";

function normalizeSignalSourceName(
  sourceName: string | null | undefined,
  pair: string | null | undefined,
  algorithmName?: string | null,
) {
  const normalizedPair = pair?.toUpperCase().replace(/[^A-Z0-9]/g, "") || "";
  const normalizedAlgorithm = algorithmName?.toUpperCase() || "";

  if (
    normalizedPair.startsWith("XAU") ||
    normalizedPair.startsWith("XAG") ||
    normalizedAlgorithm.startsWith("XAU-") ||
    normalizedAlgorithm.startsWith("XAG-")
  ) {
    return "XAU/XAG Range";
  }

  return sourceName?.trim() || "E+R Range";
}

export function serializeSignal(signal: PrismaSignal, language: Language): Signal {
  return {
    id: signal.id,
    pair: signal.pair,
    direction: signal.direction,
    sourceName: normalizeSignalSourceName(signal.sourceName, signal.pair, signal.algorithmName),
    order: signal.order,
    algorithmName: signal.algorithmName,
    algorithmImageUrl: signal.algorithmImageUrl,
    winrate: signal.winrate,
    entry: signal.entry.toString(),
    stopLoss: signal.stopLoss.toString(),
    takeProfit: signal.takeProfit.toString(),
    status: signal.status.toLowerCase() as SignalStatus,
    publishedAt: new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Moscow",
    }).format(signal.publishedAt),
    expiresAt: signal.expiresAt.toISOString(),
    activatedAt: signal.activatedAt?.toISOString() || null,
    closedAt: signal.closedAt?.toISOString() || null,
    closeReason:
      signal.closeReason === "take_profit" ||
      signal.closeReason === "stop_loss" ||
      signal.closeReason === "expired" ||
      signal.closeReason === "cancelled"
        ? signal.closeReason
        : null,
    closePrice: signal.closePrice?.toString() || null,
    lastPrice: signal.lastMarketPrice?.toString() || null,
    excludedFromStats: signal.excludedFromStats,
  };
}
