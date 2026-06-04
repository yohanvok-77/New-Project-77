import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeStoredMarketSymbol } from "@/src/lib/market-data/symbol-map";

export const runtime = "nodejs";

type IncomingPrice = {
  symbol?: unknown;
  pair?: unknown;
  bid?: unknown;
  ask?: unknown;
  source?: unknown;
};

type NormalizedIncomingPrice = {
  symbol: string;
  bid: number;
  ask: number;
  mid: number;
  source: string;
};

function isAuthorized(request: Request) {
  const expectedSecret = process.env.MARKET_PRICE_SECRET;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret")?.trim() ?? "";

  return Boolean(expectedSecret && ((token && token === expectedSecret) || querySecret === expectedSecret));
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeIncomingPrice(price: IncomingPrice): NormalizedIncomingPrice | null {
  const rawSymbol = typeof price.symbol === "string" ? price.symbol : price.pair;
  const bid = toNumber(price.bid);
  const ask = toNumber(price.ask);

  if (typeof rawSymbol !== "string" || !rawSymbol.trim()) {
    return null;
  }

  if (bid === null || ask === null || bid <= 0 || ask <= 0) {
    return null;
  }

  return {
    symbol: normalizeStoredMarketSymbol(rawSymbol),
    bid,
    ask,
    mid: Number(((bid + ask) / 2).toFixed(8)),
    source: typeof price.source === "string" && price.source.trim() ? price.source.trim() : "roboforex",
  };
}

async function ensureMarketQuoteTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "MarketQuote" (
      "id" TEXT NOT NULL,
      "symbol" TEXT NOT NULL,
      "bid" DECIMAL(65,30) NOT NULL,
      "ask" DECIMAL(65,30) NOT NULL,
      "mid" DECIMAL(65,30) NOT NULL,
      "source" TEXT NOT NULL DEFAULT 'roboforex',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MarketQuote_pkey" PRIMARY KEY ("id")
    )
  `;
  await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "MarketQuote_symbol_key" ON "MarketQuote"("symbol")`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "MarketQuote_symbol_idx" ON "MarketQuote"("symbol")`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "MarketQuote_updatedAt_idx" ON "MarketQuote"("updatedAt")`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rawPrices: unknown[] = Array.isArray(body.prices) ? body.prices : [body.price ?? body];
    const prices = rawPrices
      .map((price: unknown) => normalizeIncomingPrice(price as IncomingPrice))
      .filter((price): price is NormalizedIncomingPrice => Boolean(price));

    if (prices.length === 0) {
      return NextResponse.json({ message: "No valid prices received." }, { status: 400 });
    }

    await ensureMarketQuoteTable();
    await prisma.$transaction(
      prices.map((price) =>
        prisma.$executeRaw(
          Prisma.sql`
            INSERT INTO "MarketQuote" ("id", "symbol", "bid", "ask", "mid", "source", "createdAt", "updatedAt")
            VALUES (${crypto.randomUUID()}, ${price.symbol}, ${price.bid}, ${price.ask}, ${price.mid}, ${price.source}, NOW(), NOW())
            ON CONFLICT ("symbol") DO UPDATE SET
              "bid" = EXCLUDED."bid",
              "ask" = EXCLUDED."ask",
              "mid" = EXCLUDED."mid",
              "source" = EXCLUDED."source",
              "updatedAt" = NOW()
          `,
        ),
      ),
    );

    return NextResponse.json({
      message: "Prices updated.",
      updated: prices.length,
      symbols: prices.map((price) => price.symbol),
    });
  } catch (error) {
    console.error("[market-prices] failed to update prices", error);
    return NextResponse.json({ message: "Could not update market prices." }, { status: 400 });
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    await ensureMarketQuoteTable();

    const quotes = await prisma.$queryRaw<
      Array<{
        symbol: string;
        bid: unknown;
        ask: unknown;
        mid: unknown;
        source: string;
        updatedAt: Date;
      }>
    >`
      SELECT "symbol", "bid", "ask", "mid", "source", "updatedAt"
      FROM "MarketQuote"
      ORDER BY "updatedAt" DESC
      LIMIT 50
    `;

    return NextResponse.json({
      count: quotes.length,
      quotes: quotes.map((quote) => ({
        symbol: quote.symbol,
        bid: Number(quote.bid?.toString()),
        ask: Number(quote.ask?.toString()),
        mid: Number(quote.mid?.toString()),
        source: quote.source,
        updatedAt: quote.updatedAt,
      })),
    });
  } catch (error) {
    console.error("[market-prices] failed to read prices", error);
    return NextResponse.json({ message: "Could not read market prices." }, { status: 400 });
  }
}
