import { redirect } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { hasActiveAccess } from "@/lib/auth/access";
import { getCurrentLanguage } from "@/lib/i18nServer";
import { prisma } from "@/lib/prisma";
import { serializeSignal } from "@/lib/signals/serializeSignal";
import { hiddenSignalSourceNames } from "@/lib/signals/sourceVisibility";

export const dynamic = "force-dynamic";

export default async function SignalsPage() {
  const language = getCurrentLanguage();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!hasActiveAccess(user)) {
    redirect("/no-access");
  }

  const signals = await prisma.signal.findMany({
    where: {
      NOT: {
        sourceName: {
          in: hiddenSignalSourceNames,
        },
      },
    },
    orderBy: { publishedAt: "desc" },
  });

  const serializedSignals = signals.map((signal) => serializeSignal(signal, language));

  return (
    <Dashboard
      currentUser={{
        name: user.name,
        email: user.email,
        role: user.role,
        accessUntil: user.accessUntil?.toISOString() || null,
      }}
      language={language}
      signals={serializedSignals}
    />
  );
}
