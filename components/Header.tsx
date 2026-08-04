"use client";

import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { formatDate } from "@/lib/format";
import type { Language } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

export interface HeaderUser {
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  accessUntil: string | null;
}

interface HeaderProps {
  currentUser: HeaderUser;
  language: Language;
  sourceNames: string[];
  activeSourceName: string;
  onSourceNameChange: (sourceName: string) => void;
}

const sourceAccentClasses = [
  "border-blue/30 bg-blue/10 text-blue hover:bg-blue/15",
  "border-success/30 bg-success/10 text-success hover:bg-success/15",
  "border-gold/30 bg-gold/10 text-gold hover:bg-gold/15",
  "border-danger/25 bg-danger/10 text-danger hover:bg-danger/15",
  "border-white/14 bg-white/[0.07] text-text hover:bg-white/[0.1]",
];

export function Header({
  currentUser,
  language,
  sourceNames,
  activeSourceName,
  onSourceNameChange,
}: HeaderProps) {
  const router = useRouter();
  const t = getDictionary(language);
  const allSourcesLabel = language === "ru" ? "Все источники" : "All sources";
  const sourceOptions = ["all", ...sourceNames];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-4 z-30 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="glass-panel flex flex-col gap-4 rounded-3xl px-5 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
        <BrandMark />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <nav
            className="max-w-full rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-1.5 backdrop-blur-xl lg:max-w-[34rem]"
            aria-label={language === "ru" ? "Источники сигналов" : "Signal sources"}
          >
            <div className="flex gap-1.5 overflow-x-auto">
              {sourceOptions.map((sourceName, index) => {
                const isAll = sourceName === "all";
                const isActive = activeSourceName === sourceName;

                return (
                  <button
                    key={sourceName}
                    type="button"
                    onClick={() => onSourceNameChange(sourceName)}
                    className={[
                      "shrink-0 rounded-full border px-3.5 py-2 text-xs font-black transition duration-200 sm:text-sm",
                      isActive
                        ? isAll
                          ? "border-white/45 bg-white/16 text-text shadow-glow"
                          : `${sourceAccentClasses[(index - 1) % sourceAccentClasses.length]} shadow-glow`
                        : "border-transparent text-muted hover:bg-white/8 hover:text-text",
                    ].join(" ")}
                  >
                    {isAll ? allSourcesLabel : sourceName}
                  </button>
                );
              })}
            </div>
          </nav>

          {currentUser.role === "ADMIN" ? (
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="shrink-0 rounded-full border border-blue/35 bg-blue/15 px-4 py-2.5 text-sm font-black text-blue transition hover:bg-blue/20"
            >
              {t.adminPanel}
            </button>
          ) : null}

          <LanguageSwitcher language={language} />

          <div className="flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.055] px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-text">
                {currentUser.name || currentUser.email}
              </p>
              <p className="text-xs font-semibold text-muted">
                {currentUser.role === "ADMIN" ? t.roleAdmin : t.roleUser}
                {currentUser.accessUntil ? ` · ${formatDate(currentUser.accessUntil)}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs font-black text-muted transition hover:text-text"
            >
              {t.logout}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
