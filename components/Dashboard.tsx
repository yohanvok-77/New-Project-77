"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import { Header, type HeaderUser } from "@/components/Header";
import { SignalCard } from "@/components/SignalCard";
import { SignalDetailsPanel } from "@/components/SignalDetailsPanel";
import { StatsCards } from "@/components/StatsCards";
import type { Language } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import { isSignalActual, isSignalClosed } from "@/lib/signalLifecycle";
import type { Signal, SignalFilter } from "@/types/signal";

interface DashboardProps {
  currentUser: HeaderUser;
  language: Language;
  signals: Signal[];
}

const hiddenSignalSourceNames = ["E+M Range"];

function isVisibleSignalSource(sourceName: string | null | undefined) {
  return !hiddenSignalSourceNames.includes(sourceName?.trim() || "");
}

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

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export function Dashboard({ currentUser, language, signals }: DashboardProps) {
  const t = getDictionary(language);
  const initialVisibleSignals = useMemo(
    () => signals.filter((signal) => isVisibleSignalSource(signal.sourceName)),
    [signals],
  );
  const [activeFilter, setActiveFilter] = useState<SignalFilter>("actual");
  const [activeSourceName, setActiveSourceName] = useState("all");
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [liveSignals, setLiveSignals] = useState<Signal[]>(initialVisibleSignals);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [newSignalNotice, setNewSignalNotice] = useState<Signal | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const lastCheckRef = useRef(new Date().toISOString());
  const knownIdsRef = useRef(new Set(initialVisibleSignals.map((signal) => signal.id)));

  useEffect(() => {
    setLiveSignals(initialVisibleSignals);
    knownIdsRef.current = new Set(initialVisibleSignals.map((signal) => signal.id));
  }, [initialVisibleSignals]);

  const sourceNames = useMemo(() => {
    const preferredSources = ["E+R Range", "XAU/XAG Range"];
    const dynamicSources = liveSignals
      .map((signal) => normalizeSignalSourceName(signal.sourceName, signal.pair, signal.algorithmName))
      .filter((sourceName): sourceName is string => Boolean(sourceName && isVisibleSignalSource(sourceName)));

    return Array.from(new Set([...preferredSources, ...dynamicSources]));
  }, [liveSignals]);

  useEffect(() => {
    if (activeSourceName !== "all" && !sourceNames.includes(activeSourceName)) {
      setActiveSourceName("all");
    }
  }, [activeSourceName, sourceNames]);

  function playNewSignalSound() {
    if (!soundEnabled) {
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1174, audioContext.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.38);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.42);
  }

  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/signals/latest?since=${encodeURIComponent(lastCheckRef.current)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { serverTime: string; signals: Signal[] };
        lastCheckRef.current = payload.serverTime;
        const freshSignals = payload.signals.filter(
          (signal) => isVisibleSignalSource(signal.sourceName) && !knownIdsRef.current.has(signal.id),
        );

        if (freshSignals.length === 0) {
          return;
        }

        freshSignals.forEach((signal) => knownIdsRef.current.add(signal.id));
        setLiveSignals((current) => [...freshSignals, ...current]);
        setHighlightedIds(freshSignals.map((signal) => signal.id));
        setNewSignalNotice(freshSignals[0]);
        playNewSignalSound();
        window.setTimeout(() => setHighlightedIds([]), 9000);
      } catch {
        // Polling should never interrupt the dashboard.
      }
    }, 10000);

    return () => window.clearInterval(interval);
  }, [soundEnabled]);

  const sourceFilteredSignals = useMemo(() => {
    if (activeSourceName === "all") {
      return liveSignals;
    }

    return liveSignals.filter(
      (signal) => normalizeSignalSourceName(signal.sourceName, signal.pair, signal.algorithmName) === activeSourceName,
    );
  }, [activeSourceName, liveSignals]);

  const filteredSignals = useMemo(() => {
    if (activeFilter === "all") {
      return sourceFilteredSignals;
    }

    if (activeFilter === "actual") {
      return sourceFilteredSignals.filter((signal) => isSignalActual(signal));
    }

    if (activeFilter === "closed") {
      return sourceFilteredSignals.filter((signal) => isSignalClosed(signal));
    }

    if (activeFilter === "inactive") {
      return sourceFilteredSignals.filter((signal) => signal.status === "expired" || signal.status === "cancelled");
    }

    return sourceFilteredSignals.filter((signal) => signal.direction === activeFilter);
  }, [activeFilter, sourceFilteredSignals]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-base">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(59,130,246,0.2),transparent_28%),radial-gradient(circle_at_86%_16%,rgba(245,158,11,0.14),transparent_24%),radial-gradient(circle_at_50%_96%,rgba(34,197,94,0.14),transparent_34%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35" />
        <div className="absolute left-1/2 top-0 h-64 w-[52rem] -translate-x-1/2 rounded-full bg-blue/10 blur-3xl" />
      </div>

      <div className="relative z-10 py-4 sm:py-6">
        <Header
          currentUser={currentUser}
          language={language}
          sourceNames={sourceNames}
          activeSourceName={activeSourceName}
          onSourceNameChange={setActiveSourceName}
        />

        <section className="mx-auto mt-8 flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
          <StatsCards signals={sourceFilteredSignals} language={language} />

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-sm font-bold text-blue backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_16px_rgba(34,197,94,0.8)]" />
                Live dashboard
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-normal text-text sm:text-4xl">
                {t.dashboardMap}
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setSoundEnabled(true)}
                className={[
                  "rounded-full border px-4 py-2.5 text-sm font-black transition",
                  soundEnabled
                    ? "border-success/35 bg-success/15 text-success"
                    : "border-white/12 bg-white/10 text-muted hover:text-text",
                ].join(" ")}
              >
                {soundEnabled ? "Звук включен" : "Включить звук"}
              </button>
              <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} language={language} />
            </div>
          </div>

          {newSignalNotice ? (
            <div className="glass-panel rounded-3xl border-success/30 bg-success/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-normal text-success">Новый сигнал</p>
                  <p className="mt-1 text-lg font-black text-text">
                    {newSignalNotice.pair} · {newSignalNotice.direction} · Winrate {newSignalNotice.winrate}%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewSignalNotice(null)}
                  className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm font-black text-muted transition hover:text-text"
                >
                  Закрыть
                </button>
              </div>
            </div>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredSignals.map((signal, index) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                index={index}
                selected={selectedSignal?.id === signal.id}
                highlighted={highlightedIds.includes(signal.id)}
                onSelect={setSelectedSignal}
                language={language}
              />
            ))}
          </section>

          {filteredSignals.length === 0 ? (
            <div className="glass-panel rounded-3xl p-10 text-center">
              <p className="text-lg font-black text-text">
                {liveSignals.length === 0 ? "Сигналы пока не поступили" : "По этому фильтру сигналов нет"}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Новые идеи появятся здесь автоматически после импорта из Telegram.
              </p>
            </div>
          ) : null}

          <p className="pb-10 pt-4 text-center text-sm leading-6 text-muted">
            {t.disclaimer}
          </p>
        </section>
      </div>

      <SignalDetailsPanel signal={selectedSignal} onClose={() => setSelectedSignal(null)} language={language} />
    </main>
  );
}
