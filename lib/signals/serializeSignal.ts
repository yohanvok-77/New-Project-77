import type { Signal as PrismaSignal } from "@prisma/client";
import type { Language } from "@/lib/i18n";
import type { Signal, SignalStatus } from "@/types/signal";

export function serializeSignal(signal: PrismaSignal, language: Language): Signal {
  return {
    id: signal.id,
    pair: signal.pair,
    direction: signal.direction,
    sourceName: signal.sourceName,
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
  };
}
