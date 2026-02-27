"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import AuthGuard from "@/components/AuthGuard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  formatRelativeTime,
  formatWinRate,
  formatElo,
  normalizeMatchAgents,
} from "@/lib/utils";
import type { Agent, Match } from "@/lib/types";

/* ═══════════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════════ */
function IconPlus({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function IconBolt({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
}
function IconChart({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
}
function IconStar({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
}
function IconArrowRight({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>;
}
function IconCheck({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════ */

function Avatar({ name, size = "w-10 h-10", textSize = "text-base", gradient = "from-arena-primary to-arena-primary-dark" }: { name: string; size?: string; textSize?: string; gradient?: string }) {
  return (
    <div className={`${size} rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
      <span className={`${textSize} font-extrabold text-white`}>{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

/* Animated number counter */
function AnimatedNum({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <span className="tabular-nums">{display}</span>;
}

/* Animated decimal counter */
function AnimatedDecimal({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(eased * value);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <span className="tabular-nums">{display.toFixed(2)}</span>;
}

/* Win Rate SVG Ring — with gradient stroke + glow */
function WinRateRing({ rate, size = 80 }: { rate: number; size?: number }) {
  const pct = Math.round(rate * 100);
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const gradId = `wr-grad-${size}`;
  const glowId = `wr-glow-${size}`;
  const colorStart = pct >= 60 ? "#059669" : pct >= 40 ? "#5B4FCF" : "#DC2626";
  const colorEnd = pct >= 60 ? "#34d399" : pct >= 40 ? "#7B6FE0" : "#f87171";
  const textColor = pct >= 60 ? "#059669" : pct >= 40 ? "#5B4FCF" : "#DC2626";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E8E4DF" strokeWidth={4} opacity={0.5} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`url(#${gradId})`} strokeWidth={5}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          filter={`url(#${glowId})`}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold font-mono leading-none" style={{ color: textColor }}>{pct}</span>
        <span className="text-[7px] font-mono text-arena-muted-light font-medium mt-0.5">%</span>
      </div>
    </div>
  );
}

/* W/L/D Bar */
function WLDBar({ wins, losses, draws, height = "h-1.5" }: { wins: number; losses: number; draws: number; height?: string }) {
  const total = wins + losses + draws;
  if (total === 0) return <div className={`w-full ${height} rounded-full bg-arena-border-light/30`} />;
  return (
    <div className={`w-full ${height} rounded-full overflow-hidden flex bg-arena-border-light/30`}>
      {wins > 0 && <div className="h-full bg-arena-success transition-all duration-700" style={{ width: `${(wins / total) * 100}%` }} />}
      {draws > 0 && <div className="h-full bg-arena-muted-light/50 transition-all duration-700" style={{ width: `${(draws / total) * 100}%` }} />}
      {losses > 0 && <div className="h-full bg-arena-danger/50 transition-all duration-700" style={{ width: `${(losses / total) * 100}%` }} />}
    </div>
  );
}

/* Mini Ring — with gradient arc */
function MiniRing({ rate, size = 28 }: { rate: number; size?: number }) {
  const pct = rate * 100;
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (pct / 100) * circ;
  const colorStart = pct >= 60 ? "#059669" : pct >= 40 ? "#5B4FCF" : "#DC2626";
  const colorEnd = pct >= 60 ? "#34d399" : pct >= 40 ? "#7B6FE0" : "#f87171";
  const gid = `mr-${size}-${Math.round(pct)}`;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E8E4DF" strokeWidth={3} opacity={0.4} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={3}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[7px] font-bold tabular-nums text-arena-text">{Math.round(pct)}</span>
      </div>
    </div>
  );
}

/* ELO Tier Badge — enhanced with dot indicator and stronger presence */
function EloTier({ elo }: { elo: number }) {
  const tier = elo >= 2000
    ? { name: "Grandmaster", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/25", dot: "bg-red-500" }
    : elo >= 1800
    ? { name: "Diamond", color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/25", dot: "bg-cyan-500" }
    : elo >= 1600
    ? { name: "Gold", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/25", dot: "bg-amber-500" }
    : elo >= 1400
    ? { name: "Silver", color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/25", dot: "bg-slate-400" }
    : { name: "Bronze", color: "text-orange-600", bg: "bg-orange-600/10", border: "border-orange-600/25", dot: "bg-orange-600" };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-mono font-bold rounded-md ${tier.bg} ${tier.color} border ${tier.border} backdrop-blur-sm`}>
      <span className={`w-1.5 h-1.5 rounded-full ${tier.dot} shrink-0`} />
      {tier.name}
    </span>
  );
}

/* Skeleton Loader — glass style */
function DashboardSkeleton() {
  return (
    <>
      <div className="dash-glass-bg" aria-hidden="true" />
      <div className="dash-glass-viewport">
        <div className="dash-glass-layout">
          <aside className="dash-glass-rail animate-pulse">
            <div className="glass-panel h-52" />
            <div className="glass-panel h-28" />
            <div className="glass-panel h-28" />
            <div className="glass-panel h-24" />
          </aside>
          <div className="dash-glass-main animate-pulse">
            <div className="glass-panel-strong h-40" />
            <div className="flex gap-4 overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass-panel h-32 w-[300px] shrink-0" />
              ))}
            </div>
            <div className="glass-panel h-64" />
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════ */
function DashboardContent() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { t } = useLanguage();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentsRes, matchesRes] = await Promise.allSettled([
          api.getAgents(),
          api.getMatches({ limit: 5 }),
        ]);
        if (agentsRes.status === "fulfilled") setAgents(agentsRes.value.agents || []);
        if (matchesRes.status === "fulfilled")
          setRecentMatches(
            (matchesRes.value.matches || []).map((m) => ({ ...m, id: m.id || (m as any)._id }))
          );
      } catch { /* silently handle */ } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const active = agents.filter((a) => a.status === "in_match").length;
    const queued = agents.filter((a) => a.status === "queued").length;
    const earnings = agents.reduce((s, a) => s + (a.stats?.totalEarnings || 0), 0);
    const bestElo = agents.length > 0 ? Math.max(...agents.map((a) => a.elo || 0)) : 0;
    const wins = agents.reduce((s, a) => s + (a.stats?.wins || 0), 0);
    const losses = agents.reduce((s, a) => s + (a.stats?.losses || 0), 0);
    const draws = agents.reduce((s, a) => s + (a.stats?.draws || 0), 0);
    const total = wins + losses + draws;
    const winRate = total > 0 ? wins / total : 0;
    const bestAgent = agents.length > 0
      ? agents.reduce((best, a) => ((a.elo || 0) > (best.elo || 0) ? a : best), agents[0])
      : null;
    return { active, queued, earnings, bestElo, wins, losses, draws, total, winRate, bestAgent };
  }, [agents]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t.dashboard.goodMorning;
    if (hour < 18) return t.dashboard.goodAfternoon;
    return t.dashboard.goodEvening;
  }, [t]);

  if (loading) return <DashboardSkeleton />;

  const hasAgents = agents.length > 0;

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          FIXED ANIMATED MESH GRADIENT BACKGROUND
          ═══════════════════════════════════════════════════ */}
      <div className="dash-glass-bg" aria-hidden="true">
        <div className="absolute w-96 h-96 rounded-full bg-arena-primary/10 blur-[100px] animate-mesh-float"
             style={{ top: "10%", left: "60%" }} />
        <div className="absolute w-80 h-80 rounded-full bg-arena-accent/8 blur-[80px] animate-mesh-float"
             style={{ top: "60%", left: "20%", animationDelay: "4s" }} />
        <div className="absolute w-64 h-64 rounded-full bg-arena-success/5 blur-[60px] animate-mesh-float"
             style={{ top: "30%", left: "40%", animationDelay: "8s" }} />
      </div>

      {/* ═══════════════════════════════════════════════════
          CONTENT LAYER
          ═══════════════════════════════════════════════════ */}
      <div className="dash-glass-viewport">
        <div className="dash-glass-layout">

          {/* ═══════════════════════════════════════════════
              LEFT RAIL — Sticky sidebar
              ═══════════════════════════════════════════════ */}
          <aside className="dash-glass-rail">

            {/* Identity Panel */}
            <div className="glass-panel glass-panel-highlight p-6 opacity-0 animate-slide-in-left"
                 style={{ animationDelay: "0.05s", animationFillMode: "both" }}>
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-arena-primary to-arena-accent flex items-center justify-center shadow-lg"
                       style={{ boxShadow: "0 8px 30px rgba(91, 79, 207, 0.3)" }}>
                    <span className="text-3xl font-extrabold text-white">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-arena-success border-2 border-white"
                        style={{ boxShadow: "0 0 12px rgba(5, 150, 105, 0.5)" }} />
                </div>
                <p className="text-[11px] text-arena-muted font-mono tracking-widest uppercase mb-1">
                  {greeting}
                </p>
                <h1 className="text-xl font-display font-bold text-arena-text-bright tracking-tight">
                  {user?.username}
                </h1>
                {hasAgents && (
                  <p className="text-[11px] text-arena-muted mt-1 flex items-center gap-1.5">
                    {stats.active > 0 && (
                      <span className="relative inline-flex w-1.5 h-1.5">
                        <span className="absolute inset-0 rounded-full bg-arena-success animate-ping opacity-60" />
                        <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-arena-success" />
                      </span>
                    )}
                    {stats.active > 0
                      ? `${stats.active} ${t.dashboard.matchesLive}`
                      : `${agents.length} ${t.dashboard.agentsCompeting}`}
                  </p>
                )}
              </div>
            </div>

            {/* Stats cards — only shown when user has agents */}
            {hasAgents && (
              <>
                {/* Win Rate */}
                <div className="glass-panel p-5 opacity-0 animate-slide-in-left"
                     style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
                  <p className="stat-label mb-3">{t.common.winRate}</p>
                  <div className="flex items-center gap-4">
                    <WinRateRing rate={stats.winRate} size={60} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 text-[11px] font-mono font-semibold mb-2.5">
                        <span className="text-arena-success">{stats.wins}<span className="text-[9px] font-normal ml-0.5 text-arena-success/60">W</span></span>
                        <span className="text-arena-danger">{stats.losses}<span className="text-[9px] font-normal ml-0.5 text-arena-danger/60">L</span></span>
                        <span className="text-arena-muted-light">{stats.draws}<span className="text-[9px] font-normal ml-0.5">D</span></span>
                      </div>
                      <WLDBar wins={stats.wins} losses={stats.losses} draws={stats.draws} height="h-1.5" />
                      <div className="mt-2 pt-2 border-t border-arena-border-light/20">
                        <span className="text-[9px] text-arena-muted font-mono">{t.common.matches}</span>
                        <span className="text-sm font-bold font-mono text-arena-text-bright ml-1.5"><AnimatedNum value={stats.total} /></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Peak ELO */}
                <div className="glass-panel p-5 opacity-0 animate-slide-in-left cursor-pointer"
                     style={{ animationDelay: "0.15s", animationFillMode: "both" }}
                     onClick={() => stats.bestAgent && router.push(`/agents/${stats.bestAgent.id}`)}>
                  <p className="stat-label mb-3">PEAK {t.common.elo}</p>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-extrabold font-mono glass-stat-number">
                      <AnimatedNum value={stats.bestElo} duration={1400} />
                    </span>
                    {stats.bestAgent && <EloTier elo={stats.bestElo} />}
                  </div>
                  {stats.bestAgent && (
                    <p className="text-[10px] text-arena-muted font-mono mt-2 truncate flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-arena-primary/30" />
                      {stats.bestAgent.name}
                    </p>
                  )}
                </div>

                {/* Earnings */}
                <div className="glass-panel p-5 opacity-0 animate-slide-in-left"
                     style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
                  <p className="stat-label stat-label-accent mb-3">{t.common.earnings}</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-extrabold font-mono text-arena-accent"
                          style={{ textShadow: "0 0 24px rgba(232, 165, 0, 0.2), 0 0 48px rgba(232, 165, 0, 0.06)" }}>
                      <AnimatedDecimal value={stats.earnings} duration={1400} />
                    </span>
                    <span className="text-[10px] text-arena-muted font-mono font-semibold mb-1.5 bg-arena-accent/8 px-1.5 py-0.5 rounded">USDC</span>
                  </div>
                </div>

                {/* Active / Queue */}
                <div className="glass-panel p-5 opacity-0 animate-slide-in-left cursor-pointer"
                     style={{ animationDelay: "0.25s", animationFillMode: "both" }}
                     onClick={() => router.push("/matchmaking")}>
                  <p className="stat-label stat-label-success mb-3">{t.dashboard.activeMatches}</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-extrabold font-mono text-arena-text-bright">
                      <AnimatedNum value={stats.active} />
                    </span>
                    {stats.active > 0 && (
                      <span className="relative inline-flex w-2 h-2">
                        <span className="absolute inset-0 rounded-full bg-arena-success animate-ping opacity-60" />
                        <span className="relative inline-flex w-2 h-2 rounded-full bg-arena-success" />
                      </span>
                    )}
                    <span className="text-arena-border-light text-sm">/</span>
                    <span className="text-lg font-bold font-mono text-arena-muted-light">
                      <AnimatedNum value={stats.queued} />
                    </span>
                    <span className="text-[9px] text-arena-muted-light font-mono">{t.dashboard.inQueue}</span>
                  </div>
                </div>
              </>
            )}

            {/* Quick Actions */}
            <div className="glass-panel p-4 opacity-0 animate-slide-in-left"
                 style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
              <div className="flex flex-col gap-2">
                <Link href="/agents/new" className="w-full">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-arena-primary hover:bg-arena-primary-dark text-white text-sm font-semibold rounded-xl transition-all duration-300"
                          style={{ boxShadow: "0 4px 20px rgba(91, 79, 207, 0.25)" }}>
                    <IconPlus className="w-4 h-4" />
                    {t.dashboard.createAgent}
                  </button>
                </Link>
                <Link href="/matchmaking" className="w-full">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-arena-bg-light hover:bg-arena-border-light/40 text-arena-text text-sm font-medium rounded-xl border border-arena-border-light/50 hover:border-arena-border-light transition-all duration-300">
                    <IconBolt className="w-4 h-4" />
                    {t.dashboard.joinQueue}
                  </button>
                </Link>
              </div>
            </div>
          </aside>

          {/* ═══════════════════════════════════════════════
              MAIN CONTENT
              ═══════════════════════════════════════════════ */}
          <div className="dash-glass-main">

            {/* Welcome Hero Banner */}
            <div className="glass-panel-strong glass-panel-highlight p-8 opacity-0 animate-fade-in-scale"
                 style={{ animationDelay: "0.08s", animationFillMode: "both" }}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-display font-bold text-arena-text-bright tracking-tight mb-2">
                    {t.dashboard.welcomeBack}{" "}
                    <span className="bg-gradient-to-r from-arena-primary to-arena-accent bg-clip-text text-transparent">
                      {user?.username}
                    </span>
                  </h2>
                  <p className="text-sm text-arena-muted max-w-md leading-relaxed">
                    {t.dashboard.overview}
                  </p>
                </div>
                {hasAgents && (
                  <div className="hidden sm:flex items-center gap-4">
                    <div className="text-right bg-arena-primary/[0.04] rounded-xl px-4 py-3 border border-arena-primary/8">
                      <p className="text-[9px] text-arena-muted font-mono uppercase tracking-wider mb-0.5">
                        {t.common.matches}
                      </p>
                      <p className="text-2xl font-extrabold font-mono text-arena-primary">
                        <AnimatedNum value={stats.total} />
                      </p>
                    </div>
                    <div className="text-right bg-arena-accent/[0.04] rounded-xl px-4 py-3 border border-arena-accent/8">
                      <p className="text-[9px] text-arena-muted font-mono uppercase tracking-wider mb-0.5">
                        {t.dashboard.yourAgents}
                      </p>
                      <p className="text-2xl font-extrabold font-mono text-arena-accent">
                        <AnimatedNum value={agents.length} />
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stat chips */}
              {hasAgents && (
                <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-arena-border-light/30">
                  <Link href="/agents">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-arena-bg-light/80 border border-arena-border-light/50 rounded-full text-[11px] font-medium text-arena-muted hover:text-arena-primary hover:border-arena-primary/20 transition-all cursor-pointer">
                      {agents.length} {t.common.agents}
                      <IconArrowRight className="w-3 h-3 opacity-40" />
                    </span>
                  </Link>
                  <Link href="/leaderboard">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-arena-bg-light/80 border border-arena-border-light/50 rounded-full text-[11px] font-medium text-arena-muted hover:text-arena-primary hover:border-arena-primary/20 transition-all cursor-pointer">
                      {t.dashboard.leaderboard}
                      <IconArrowRight className="w-3 h-3 opacity-40" />
                    </span>
                  </Link>
                  {stats.active > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-arena-success/8 border border-arena-success/15 rounded-full text-[11px] font-semibold text-arena-success">
                      <span className="relative w-1.5 h-1.5">
                        <span className="absolute inset-0 rounded-full bg-arena-success animate-ping opacity-50" />
                        <span className="relative block w-1.5 h-1.5 rounded-full bg-arena-success" />
                      </span>
                      {stats.active} {t.common.live}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════════
                ONBOARDING (no agents)
                ═══════════════════════════════════════════════ */}
            {!hasAgents && (
              <div className="glass-panel-strong glass-panel-glow p-10 text-center opacity-0 animate-fade-in-scale"
                   style={{ animationDelay: "0.15s", animationFillMode: "both" }}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-arena-primary/10 to-arena-accent/10 flex items-center justify-center mx-auto mb-5 animate-float"
                     style={{ animationDuration: "4s" }}>
                  <IconBolt className="w-8 h-8 text-arena-primary" />
                </div>
                <h3 className="text-2xl font-display font-bold text-arena-text-bright mb-3">
                  Deploy Your First Agent
                </h3>
                <p className="text-sm text-arena-muted max-w-md mx-auto mb-6 leading-relaxed">
                  Create an AI agent, enter the arena, and start competing against other players for USDC.
                </p>
                <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-arena-success/8 text-arena-success text-[11px] font-semibold border border-arena-success/15">
                    <IconCheck className="w-3 h-3" /> Account Created
                  </span>
                  <span className="w-6 h-px bg-arena-border-light hidden sm:block" />
                  <span className="px-3 py-1.5 rounded-full bg-arena-primary/8 text-arena-primary text-[11px] font-semibold border border-arena-primary/15 animate-glow-breath">
                    Create Agent
                  </span>
                  <span className="w-6 h-px bg-arena-border-light hidden sm:block" />
                  <span className="px-3 py-1.5 rounded-full bg-arena-bg-light text-arena-muted text-[11px] border border-arena-border-light/50">
                    Compete
                  </span>
                </div>
                <Link href="/agents/new">
                  <button className="px-6 py-3 bg-arena-primary hover:bg-arena-primary-dark text-white font-semibold rounded-xl transition-all"
                          style={{ boxShadow: "0 4px 25px rgba(91, 79, 207, 0.3)" }}>
                    {t.dashboard.createAgent}
                  </button>
                </Link>
              </div>
            )}

            {/* ═══════════════════════════════════════════════
                YOUR AGENTS — Horizontal Scroll Strip
                ═══════════════════════════════════════════════ */}
            {hasAgents && (
              <div className="opacity-0 animate-fade-up"
                   style={{ animationDelay: "0.12s", animationFillMode: "both" }}>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-lg font-display font-bold text-arena-text-bright">
                    {t.dashboard.yourAgents}
                  </h2>
                  <Link href="/agents" className="text-xs text-arena-muted hover:text-arena-primary transition-colors flex items-center gap-1">
                    {t.common.viewAll} <IconArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="dash-agent-strip">
                  {agents.slice(0, 6).map((agent, i) => {
                    const w = agent.stats?.wins || 0;
                    const l = agent.stats?.losses || 0;
                    const d = agent.stats?.draws || 0;
                    const isBest = stats.bestAgent?.id === agent.id;
                    const isLive = agent.status === "in_match";
                    const isIdle = agent.status !== "in_match" && agent.status !== "queued";

                    return (
                      <div
                        key={agent.id}
                        className={`group glass-panel glass-panel-glow p-5 cursor-pointer opacity-0 animate-fade-in-scale overflow-hidden ${
                          isBest ? "ring-1 ring-arena-primary/25" : ""
                        }`}
                        style={{ animationDelay: `${0.15 + i * 0.06}s`, animationFillMode: "both" }}
                        onClick={() => router.push(`/agents/${agent.id}`)}
                      >
                        {/* Subtle left accent bar */}
                        <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-all duration-300 ${
                          isLive ? "bg-arena-success" : isBest ? "bg-gradient-to-b from-arena-primary to-arena-accent" : "bg-arena-primary/0 group-hover:bg-arena-primary/30"
                        }`} />

                        {/* Agent header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative">
                              <Avatar name={agent.name} size="w-11 h-11" textSize="text-sm"
                                      gradient={isBest ? "from-arena-primary to-arena-accent" : "from-arena-primary to-arena-primary-dark"} />
                              {isLive && (
                                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-arena-success border-2 border-white shadow-sm"
                                      style={{ boxShadow: "0 0 8px rgba(5, 150, 105, 0.4)" }}>
                                  <span className="absolute inset-0 rounded-full bg-arena-success animate-ping opacity-50" />
                                </span>
                              )}
                              {isIdle && (
                                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-arena-muted-light border-2 border-white status-idle-pulse" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-arena-text-bright truncate flex items-center gap-1.5">
                                {isBest && <IconStar className="w-3.5 h-3.5 text-arena-accent shrink-0" />}
                                {agent.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-arena-text font-mono font-semibold">{formatElo(agent.elo)}</span>
                                <EloTier elo={agent.elo} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stats section */}
                        <div className="pt-3 border-t border-arena-border-light/20">
                          <WLDBar wins={w} losses={l} draws={d} height="h-1.5" />
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2 text-[11px] font-mono font-semibold">
                              <span className="text-arena-success">{w}<span className="text-[9px] font-normal text-arena-success/60 ml-0.5">W</span></span>
                              <span className="text-arena-danger">{l}<span className="text-[9px] font-normal text-arena-danger/60 ml-0.5">L</span></span>
                              <span className="text-arena-muted-light">{d}<span className="text-[9px] font-normal ml-0.5">D</span></span>
                            </div>
                            <MiniRing rate={agent.stats?.winRate || 0} size={28} />
                          </div>
                        </div>

                        {/* Hover arrow indicator */}
                        <div className="absolute right-4 top-5 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5">
                          <IconArrowRight className="w-4 h-4 text-arena-muted-light" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════
                RECENT MATCHES
                ═══════════════════════════════════════════════ */}
            <div className="opacity-0 animate-fade-up"
                 style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-display font-bold text-arena-text-bright">
                  {t.dashboard.recentMatches}
                </h2>
                <Link href="/matches" className="text-xs text-arena-muted hover:text-arena-primary transition-colors flex items-center gap-1">
                  {t.common.viewAll} <IconArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {recentMatches.length === 0 ? (
                <div className="glass-panel-strong p-10 text-center">
                  <div className="w-12 h-12 rounded-xl bg-arena-primary/8 flex items-center justify-center mx-auto mb-3">
                    <IconBolt className="w-6 h-6 text-arena-primary" />
                  </div>
                  <p className="text-sm text-arena-text-bright font-medium mb-1">{t.dashboard.noMatchesYet}</p>
                  <p className="text-xs text-arena-muted mb-5 max-w-xs mx-auto">
                    {hasAgents ? t.matchmaking.subtitle : t.agents.noAgentsDesc}
                  </p>
                  <Link href={hasAgents ? "/matchmaking" : "/agents/new"}>
                    <Button size="sm">{hasAgents ? t.dashboard.startFirst : t.dashboard.createAgent}</Button>
                  </Link>
                </div>
              ) : (
                <div className="glass-panel overflow-hidden">
                  {recentMatches.map((match, i) => {
                    const agentsArr = normalizeMatchAgents(match.agents);
                    const myAgent = agentsArr.find((a) => agents.some((ag) => ag.id === a.agentId));
                    const isWinner = myAgent && match.winnerId === myAgent.agentId;
                    const isLoss = myAgent && match.status === "completed" && match.winnerId && match.winnerId !== myAgent.agentId;
                    const isActive = match.status === "active";
                    const isLast = i === recentMatches.length - 1;

                    return (
                      <div key={match.id}>
                        <Link href={`/matches/${match.id}`}>
                          <div
                            className="flex items-center gap-4 px-5 py-4 hover:bg-arena-card-hover transition-colors cursor-pointer group opacity-0 animate-fade-up"
                            style={{ animationDelay: `${0.25 + i * 0.05}s`, animationFillMode: "both" }}
                          >
                            {/* Result indicator */}
                            <div className={`w-1 self-stretch rounded-full shrink-0 ${
                              isActive ? "bg-arena-success" : isWinner ? "bg-arena-success" : isLoss ? "bg-arena-danger/50" : "bg-arena-border-light"
                            }`}
                            style={isActive ? { boxShadow: "0 0 8px rgba(5, 150, 105, 0.4)" } : {}} />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-medium text-arena-text-bright truncate">
                                  {agentsArr.map((a) => a.agentName).join(" vs ") || "Unknown"}
                                </span>
                                {isActive && (
                                  <span className="relative flex w-2 h-2 shrink-0">
                                    <span className="absolute inset-0 rounded-full bg-arena-success animate-ping opacity-60" />
                                    <span className="relative block w-2 h-2 rounded-full bg-arena-success" />
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-arena-muted font-mono">
                                <span className="capitalize">{match.gameType}</span>
                                <span className="opacity-30">/</span>
                                <span>{match.stakeAmount} USDC</span>
                                <span className="opacity-30">/</span>
                                <span>{formatRelativeTime(match.createdAt)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              {match.status === "completed" && myAgent && (
                                <span className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full ${
                                  isWinner ? "bg-arena-success/8 text-arena-success" : isLoss ? "bg-arena-danger/8 text-arena-danger" : "bg-arena-muted/8 text-arena-muted"
                                }`}>
                                  {isWinner ? t.common.won : isLoss ? t.common.lost : t.common.draws}
                                </span>
                              )}
                              {myAgent?.eloChange !== undefined && myAgent.eloChange !== null && myAgent.eloChange !== 0 && (
                                <span className={`text-xs font-mono font-bold tabular-nums ${
                                  myAgent.eloChange > 0 ? "text-arena-success" : "text-arena-danger"
                                }`}>
                                  {myAgent.eloChange > 0 ? "+" : ""}{myAgent.eloChange}
                                </span>
                              )}
                              <IconArrowRight className="w-3.5 h-3.5 text-arena-muted-light opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        </Link>
                        {!isLast && <div className="glass-divider mx-5" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
