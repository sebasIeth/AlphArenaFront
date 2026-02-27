"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import AuthGuard from "@/components/AuthGuard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatElo } from "@/lib/utils";
import type { Agent, QueueStatus } from "@/lib/types";
import type { Socket } from "socket.io-client";

/* ── Types ── */
interface QueuedAgent {
  agentId: string;
  status: QueueStatus | null;
  cancelling: boolean;
}

interface CountdownAgent {
  agentId: string;
  name?: string;
  eloAtStart?: number;
}

/* ── Inline SVG Icons ── */
function IconSwords({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6" />
      <path d="M16 16l4 4" />
      <path d="M19 21l2-2" />
      <path d="M9.5 6.5L21 18v3h-3L6.5 9.5" />
      <path d="M11 5l-6 6" />
      <path d="M8 8L4 4" />
      <path d="M5 3L3 5" />
    </svg>
  );
}

function IconBolt({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function IconDice({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="3" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="16" cy="8" r="1.2" fill="currentColor" />
      <circle cx="8" cy="16" r="1.2" fill="currentColor" />
      <circle cx="16" cy="16" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}

function IconChevronDown({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconX({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

/* ── Radar Search Animation (replaces PulseRing) ── */
function RadarSearch({ name }: { name?: string }) {
  const initial = (name || "?")[0].toUpperCase();
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28">
        {/* Expanding rings */}
        <div className="mm-radar-ring" />
        <div className="mm-radar-ring" />
        <div className="mm-radar-ring" />
        {/* Orbiting dots */}
        <div className="mm-orbit-dot" />
        <div className="mm-orbit-dot" />
        {/* Center agent avatar */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-arena-primary to-arena-primary-dark flex items-center justify-center shadow-lg shadow-arena-primary/20">
            <span className="text-white font-display font-bold text-xl">{initial}</span>
          </div>
        </div>
      </div>
      <span className="text-sm text-arena-muted font-medium mm-ellipsis">
        Searching for opponent
      </span>
    </div>
  );
}

/* ── Enhanced Countdown Ring ── */
function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const pct = Math.round((seconds / total) * 100);
  const circumference = 2 * Math.PI * 45;
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="countdownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5B4FCF" />
            <stop offset="100%" stopColor="#E8A500" />
          </linearGradient>
          <filter id="countdownGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(91,79,207,0.1)" strokeWidth="5" />
        <circle
          cx="50" cy="50" r="45" fill="none"
          stroke="url(#countdownGrad)"
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          strokeLinecap="round"
          filter="url(#countdownGlow)"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold font-mono text-arena-primary tabular-nums glass-stat-number">
          {seconds}
        </span>
        <span className="text-[10px] text-arena-muted uppercase tracking-widest font-mono">sec</span>
      </div>
    </div>
  );
}

/* ── Agent Avatar ── */
function AgentAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const s = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${s} rounded-lg bg-gradient-to-br from-arena-primary to-arena-primary-dark flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold font-display">{name[0]?.toUpperCase() || "?"}</span>
    </div>
  );
}

/* ── Main Content ── */
function MatchmakingContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedAgentId = searchParams.get("agentId") || "";

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [selectedAgentId, setSelectedAgentId] = useState(preselectedAgentId);
  const [stakeAmount, setStakeAmount] = useState("0");
  const [gameType] = useState("marrakech");
  const [joining, setJoining] = useState(false);

  // Custom selector
  const [selectorOpen, setSelectorOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Queue state
  const [queuedAgents, setQueuedAgents] = useState<QueuedAgent[]>([]);
  const [queueSize, setQueueSize] = useState<number | null>(null);

  // Backend countdown state (broadcast via WebSocket)
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(30);
  const [countdownAgents, setCountdownAgents] = useState<CountdownAgent[]>([]);
  const COUNTDOWN_TOTAL = 30;

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const queuedAgentIdsRef = useRef<Set<string>>(new Set());

  // Close selector on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setSelectorOpen(false);
      }
    }
    if (selectorOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [selectorOpen]);

  // Fetch agents
  useEffect(() => {
    async function fetchAgents() {
      try {
        const data = await api.getAgents();
        setAgents(data.agents || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.matchmaking.joinFailed);
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, [t.matchmaking.joinFailed]);

  // Fetch queue size
  useEffect(() => {
    async function fetchQueueSize() {
      try {
        const data = await api.getQueueSize(gameType);
        setQueueSize(data.size);
      } catch {
        // silently handle
      }
    }
    fetchQueueSize();
    const interval = setInterval(fetchQueueSize, 5000);
    return () => clearInterval(interval);
  }, [gameType]);

  // WebSocket: listen for countdown ticks and match creation
  useEffect(() => {
    const socket = api.connectSocket();
    if (!socket) return;
    socketRef.current = socket;

    socket.onAny((eventName: string, raw: any) => {
      if (eventName !== "message") return;
      const msg = typeof raw === "string" ? JSON.parse(raw) : raw;
      const type = msg?.type;
      const data = msg?.data;
      if (!type || !data) return;

      if (type === "matchmaking:countdown") {
        const remainingMs = data.remainingMs ?? data.remaining ?? 0;
        const agentsList: CountdownAgent[] = Array.isArray(data.agents) ? data.agents : [];
        const seconds = Math.ceil(remainingMs / 1000);
        if (seconds > 0) {
          setCountdownActive(true);
          setCountdownSeconds(seconds);
          setCountdownAgents(agentsList);
        } else {
          setCountdownActive(false);
          setCountdownSeconds(0);
        }
      }

      if (type === "matchmaking:matched") {
        const matchId = data.matchId;
        const matchedAgentIds: string[] = Array.isArray(data.agents) ? data.agents : [];
        if (!matchId) return;
        const myIds = queuedAgentIdsRef.current;
        const myAgentMatched = matchedAgentIds.some((id) => myIds.has(id));
        if (myAgentMatched) {
          router.push(`/matches/${matchId}`);
        }
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [router]);

  // Poll queue status for queued agents
  const queuedAgentsRef = useRef<QueuedAgent[]>([]);
  queuedAgentsRef.current = queuedAgents;

  useEffect(() => {
    if (queuedAgents.length === 0) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    pollRef.current = setInterval(async () => {
      const current = queuedAgentsRef.current;
      if (current.length === 0) return;

      const agentIds = current.map((qa) => qa.agentId);
      const updates = await Promise.allSettled(
        agentIds.map((id) => api.getQueueStatus(id))
      );

      const statusMap = new Map<string, QueueStatus>();
      const failedIds = new Set<string>();

      agentIds.forEach((id, i) => {
        if (updates[i].status === "fulfilled") {
          const value = updates[i].value;
          statusMap.set(id, value);
          if (value.matchId) {
            router.push(`/matches/${value.matchId}`);
          }
        } else {
          failedIds.add(id);
        }
      });

      setQueuedAgents((prev) =>
        prev
          .map((qa) => {
            const newStatus = statusMap.get(qa.agentId);
            return newStatus ? { ...qa, status: newStatus } : qa;
          })
          .filter((qa) => {
            if (failedIds.has(qa.agentId)) return false;
            const s = qa.status?.status;
            return s !== "matched" && s !== "cancelled";
          })
      );
    }, 2000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [queuedAgents.length, router]);

  const handleJoinQueue = async () => {
    setError("");
    setJoining(true);

    if (!selectedAgentId) {
      setError(t.matchmaking.selectAgentError);
      setJoining(false);
      return;
    }

    const stake = parseFloat(stakeAmount);
    if (isNaN(stake) || stake < 0) {
      setError(t.matchmaking.invalidStake);
      setJoining(false);
      return;
    }

    try {
      await api.joinQueue(selectedAgentId, stake, gameType);
      queuedAgentIdsRef.current.add(selectedAgentId);
      setQueuedAgents((prev) => [
        ...prev,
        { agentId: selectedAgentId, status: { status: "queued" }, cancelling: false },
      ]);
      setSelectedAgentId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.matchmaking.joinFailed);
    } finally {
      setJoining(false);
    }
  };

  const handleCancel = async (agentId: string) => {
    setQueuedAgents((prev) =>
      prev.map((qa) => (qa.agentId === agentId ? { ...qa, cancelling: true } : qa))
    );
    try {
      await api.cancelQueue(agentId);
      queuedAgentIdsRef.current.delete(agentId);
      setQueuedAgents((prev) => prev.filter((qa) => qa.agentId !== agentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.matchmaking.cancelFailed);
      setQueuedAgents((prev) =>
        prev.map((qa) => (qa.agentId === agentId ? { ...qa, cancelling: false } : qa))
      );
    }
  };

  const queuedIds = new Set(queuedAgents.map((qa) => qa.agentId));
  const availableAgents = agents.filter((a) => a.status === "idle" && !queuedIds.has(a.id));
  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  if (loading) return <PageSpinner />;

  return (
    <div className="page-container relative min-h-[80vh]">
      {/* Ambient background glow */}
      <div className="mm-ambient" />

      <div className="max-w-2xl mx-auto relative z-10">

        {/* ── Page Header ── */}
        <div className="text-center mb-10 opacity-0 animate-fade-up">
          {/* Swords icon with glow */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-arena-primary/10 to-arena-accent/10 border border-arena-primary/20 mb-5 animate-glow-pulse">
            <IconSwords className="w-8 h-8 text-arena-primary" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-bold bg-gradient-to-r from-arena-primary via-arena-primary-light to-arena-accent bg-clip-text text-transparent mb-3">
            {t.matchmaking.title}
          </h1>
          <p className="text-arena-muted leading-relaxed max-w-md mx-auto">
            {t.matchmaking.subtitle}
          </p>
        </div>

        {error && (
          <div className="bg-arena-danger/10 border border-arena-danger/30 text-arena-danger rounded-xl px-4 py-3 text-sm mb-6 animate-fade-down flex items-center gap-2">
            <IconX className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Queue Stats ── */}
        <div className="grid grid-cols-2 gap-5 mb-8">
          {/* Queue Size */}
          <div
            className="glass-panel mm-gradient-border rounded-xl px-5 py-5 opacity-0 animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-arena-success live-dot" />
              <span className="stat-label stat-label-success">{t.matchmaking.currentQueue}</span>
            </div>
            <div className="text-3xl font-bold font-mono tabular-nums text-arena-primary glass-stat-number">
              {queueSize !== null ? queueSize : "—"}
            </div>
            <div className="text-xs text-arena-muted mt-1">{t.matchmaking.agentsWaiting}</div>
          </div>

          {/* Game Type */}
          <div
            className="glass-panel mm-gradient-border rounded-xl px-5 py-5 opacity-0 animate-fade-up"
            style={{ animationDelay: "0.15s" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="stat-label">{t.common.gameType}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-arena-accent/15 to-arena-accent/5 border border-arena-accent/20 flex items-center justify-center animate-float" style={{ animationDuration: "5s" }}>
                <IconDice className="w-5 h-5 text-arena-accent" />
              </div>
              <div>
                <div className="text-lg font-display font-bold text-arena-text capitalize">
                  {gameType}
                </div>
                <div className="text-xs text-arena-muted">Board Game</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Backend Countdown ── */}
        {countdownActive && (
          <div className="glass-panel-strong mm-gradient-border rounded-2xl p-6 sm:p-8 mb-8 opacity-0 animate-scale-in relative overflow-hidden">
            {/* Glow bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-arena-primary/[0.04] via-transparent to-arena-accent/[0.03] pointer-events-none" />

            <div className="relative text-center">
              <div className="mb-5">
                <CountdownRing seconds={countdownSeconds} total={COUNTDOWN_TOTAL} />
              </div>

              <h2 className="text-xl font-display font-bold text-arena-text mb-1 animate-pulse">
                Match Starting Soon
              </h2>
              <p className="text-sm text-arena-muted mb-1">
                Waiting{" "}
                <span className="text-arena-primary font-semibold font-mono">{countdownSeconds}s</span>
                {" "}for more agents to join...
              </p>
              <p className="text-xs text-arena-muted/70 mb-5">
                The match will start automatically when the countdown ends.
              </p>

              {countdownAgents.length > 0 && (
                <div className="pt-4 border-t border-arena-border-light/40">
                  <p className="stat-label mb-3">
                    Agents Ready ({countdownAgents.length})
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {countdownAgents.map((ca) => (
                      <div
                        key={ca.agentId}
                        className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2"
                      >
                        <div className="w-2 h-2 rounded-full bg-arena-success animate-pulse" />
                        <span className="text-sm text-arena-text font-medium">
                          {ca.name || ca.agentId.slice(0, 8)}
                        </span>
                        {ca.eloAtStart !== undefined && (
                          <span className="text-xs text-arena-muted font-mono">
                            {formatElo(ca.eloAtStart)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Queued Agents (Searching State) ── */}
        {queuedAgents.map((qa, i) => {
          const agentInfo = agents.find((a) => a.id === qa.agentId);
          return (
            <div
              key={qa.agentId}
              className="glass-panel-strong mm-gradient-border rounded-2xl p-6 sm:p-8 mb-6 opacity-0 animate-fade-up relative overflow-hidden"
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              {/* Gradient side accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-arena-primary via-arena-accent to-arena-primary rounded-l-2xl" />

              <div className="flex flex-col items-center gap-6">
                {/* Radar animation */}
                <RadarSearch name={agentInfo?.name} />

                {/* Agent info */}
                <div className="text-center w-full">
                  <h3 className="text-lg font-display font-bold text-arena-text mb-1">
                    {t.matchmaking.inQueue}
                  </h3>
                  <p className="text-sm text-arena-muted mb-3">
                    {t.matchmaking.agentLabel}{" "}
                    <span className="text-arena-text font-semibold">
                      {agentInfo?.name || qa.agentId}
                    </span>
                    {agentInfo && (
                      <span className="text-arena-primary font-mono ml-1.5 text-xs">
                        ({formatElo(agentInfo.elo)})
                      </span>
                    )}
                  </p>

                  {/* Status + position */}
                  <div className="flex items-center gap-3 justify-center mb-4">
                    {qa.status && (
                      <>
                        <Badge
                          status={qa.status.status || qa.status.agentStatus || "queued"}
                        />
                        {qa.status.position !== undefined && (
                          <span className="text-xs text-arena-muted font-mono">
                            {t.common.position}: #{qa.status.position}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Agent stats chips */}
                  {agentInfo && (
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-arena-success/10 text-arena-success text-xs font-medium">
                        {agentInfo.stats?.wins || 0}W
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-arena-danger/10 text-arena-danger text-xs font-medium">
                        {agentInfo.stats?.losses || 0}L
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-arena-muted/10 text-arena-muted text-xs font-medium">
                        {agentInfo.stats?.draws || 0}D
                      </span>
                    </div>
                  )}

                  <p className="text-xs text-arena-muted/70 mb-4">
                    {t.matchmaking.waitingMsg}
                  </p>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleCancel(qa.agentId)}
                    isLoading={qa.cancelling}
                  >
                    <IconX className="w-3.5 h-3.5" />
                    {t.matchmaking.cancelQueue}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Join Form ── */}
        <div
          className="glass-panel glass-panel-highlight rounded-2xl overflow-hidden opacity-0 animate-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          {/* Form header */}
          <div className="px-6 py-4 border-b border-arena-border-light/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-arena-primary/10 to-arena-accent/10 border border-arena-primary/20 flex items-center justify-center">
              <IconSwords className="w-4 h-4 text-arena-primary" />
            </div>
            <h2 className="text-lg font-display font-bold text-arena-text">
              {t.matchmaking.joinQueue}
            </h2>
          </div>

          <div className="p-6">
            {availableAgents.length === 0 && queuedAgents.length === 0 ? (
              /* ── Empty state ── */
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-arena-primary/10 to-arena-accent/10 border border-arena-primary/15 mb-5 animate-float">
                  <IconSwords className="w-8 h-8 text-arena-primary/60" />
                </div>
                <p className="text-arena-muted mb-6 max-w-sm mx-auto leading-relaxed">
                  {t.matchmaking.noIdleAgents}
                </p>
                <a href="/agents/new">
                  <button className="mm-glow-btn bg-gradient-to-r from-arena-primary to-arena-primary-dark text-white rounded-xl px-6 py-3 font-semibold text-sm inline-flex items-center gap-2 transition-all">
                    <IconBolt className="w-4 h-4" />
                    {t.matchmaking.createAgent}
                  </button>
                </a>
              </div>
            ) : availableAgents.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-arena-muted">{t.matchmaking.noIdleAgents}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* ── Custom Agent Selector ── */}
                <div>
                  <label className="block text-sm font-medium text-arena-text mb-1.5">
                    {t.matchmaking.selectAgent}
                  </label>
                  <div className="relative" ref={selectorRef}>
                    <button
                      type="button"
                      onClick={() => setSelectorOpen((o) => !o)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-arena-border-light bg-white/80 backdrop-blur-sm hover:border-arena-primary/30 transition-colors text-left"
                    >
                      {selectedAgent ? (
                        <div className="flex items-center gap-3 min-w-0">
                          <AgentAvatar name={selectedAgent.name} size="sm" />
                          <div className="min-w-0">
                            <div className="font-semibold text-arena-text text-sm truncate">
                              {selectedAgent.name}
                            </div>
                            <div className="text-xs text-arena-muted font-mono">
                              ELO {formatElo(selectedAgent.elo)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-arena-muted text-sm">{t.matchmaking.chooseAgent}</span>
                      )}
                      <IconChevronDown
                        className={`w-4 h-4 text-arena-muted transition-transform duration-200 flex-shrink-0 ${selectorOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {/* Dropdown */}
                    {selectorOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 z-50 glass-panel-strong rounded-xl border border-arena-border-light shadow-arena-lg overflow-hidden">
                        <div className="max-h-60 overflow-y-auto py-1">
                          {availableAgents.map((agent) => {
                            const wins = agent.stats?.wins || 0;
                            const losses = agent.stats?.losses || 0;
                            const draws = agent.stats?.draws || 0;
                            const isSelected = agent.id === selectedAgentId;
                            return (
                              <button
                                key={agent.id}
                                type="button"
                                onClick={() => {
                                  setSelectedAgentId(agent.id);
                                  setSelectorOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                  isSelected
                                    ? "bg-arena-primary/5 border-l-2 border-arena-primary"
                                    : "hover:bg-arena-primary/[0.03] border-l-2 border-transparent"
                                }`}
                              >
                                <AgentAvatar name={agent.name} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-arena-text text-sm truncate">
                                    {agent.name}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-arena-muted">
                                    <span className="text-arena-success font-medium">{wins}W</span>
                                    <span className="text-arena-danger/80 font-medium">{losses}L</span>
                                    <span>{draws}D</span>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-sm font-bold font-mono text-arena-primary tabular-nums">
                                    {formatElo(agent.elo)}
                                  </div>
                                  <div className="text-[9px] text-arena-muted uppercase tracking-wider">
                                    ELO
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected agent preview */}
                {selectedAgent && (() => {
                  const wins = selectedAgent.stats?.wins || 0;
                  const losses = selectedAgent.stats?.losses || 0;
                  const draws = selectedAgent.stats?.draws || 0;
                  const total = wins + losses + draws;
                  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
                  return (
                    <div className="glass-panel rounded-xl p-4 relative overflow-hidden opacity-0 animate-fade-up" style={{ animationDelay: "0.05s" }}>
                      {/* Left accent */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-arena-primary to-arena-accent rounded-l-xl" />

                      <div className="flex items-center justify-between pl-3">
                        <div className="flex items-center gap-3">
                          <AgentAvatar name={selectedAgent.name} />
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-arena-text">{selectedAgent.name}</span>
                              <Badge status={selectedAgent.status} />
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-arena-success font-medium">{wins}W</span>
                              <span className="text-arena-danger/80 font-medium">{losses}L</span>
                              <span className="text-arena-muted">{draws}D</span>
                              <span className="text-arena-muted">·</span>
                              <span className="text-arena-primary font-semibold">{winRate}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold font-mono text-arena-primary tabular-nums glass-stat-number">
                            {formatElo(selectedAgent.elo)}
                          </div>
                          <div className="text-[10px] text-arena-muted uppercase tracking-widest font-mono">
                            {t.common.elo}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Stake + Game Type row */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t.matchmaking.stakeAmount}
                    type="number"
                    min="0"
                    step="0.01"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    helperText={t.matchmaking.stakeHelper}
                  />

                  <div>
                    <label className="block text-sm font-medium text-arena-text mb-1.5">
                      {t.common.gameType}
                    </label>
                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-arena-border-light bg-white/80 backdrop-blur-sm">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-arena-accent/15 to-arena-accent/5 flex items-center justify-center">
                        <IconDice className="w-3.5 h-3.5 text-arena-accent" />
                      </div>
                      <span className="text-arena-text capitalize font-medium text-sm">{gameType}</span>
                    </div>
                  </div>
                </div>

                {/* Join Button */}
                <button
                  onClick={handleJoinQueue}
                  disabled={joining || !selectedAgentId}
                  className="w-full mm-glow-btn bg-gradient-to-r from-arena-primary to-arena-primary-dark text-white rounded-xl py-4 text-base font-bold inline-flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                >
                  {joining ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <IconBolt className="w-5 h-5" />
                  )}
                  {t.matchmaking.joinQueue}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MatchmakingPage() {
  return (
    <AuthGuard>
      <MatchmakingContent />
    </AuthGuard>
  );
}
