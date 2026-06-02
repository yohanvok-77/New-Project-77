import { NextResponse } from "next/server";
import { hasActiveAccess } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getCurrentLanguage } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";
import { serializeSignal } from "@/lib/signals/serializeSignal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user || !hasActiveAccess(user)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const language = getCurrentLanguage();
  const url = new URL(request.url);
  const since = url.searchParams.get("since");
  const where = since
    ? {
        createdAt: {
          gt: new Date(since),
        },
      }
    : undefined;

  const signals = await prisma.signal.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: since ? 20 : 50,
  });

  return NextResponse.json({
    serverTime: new Date().toISOString(),
    signals: signals.map((signal) => serializeSignal(signal, language)),
  });
}
