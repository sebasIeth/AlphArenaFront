"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import type { AgentType } from "@/lib/types";
import AuthGuard from "@/components/AuthGuard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

/* ── Inline icons ─────────────────────────────────── */
function IconArrowLeft({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
}
function IconBolt({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
}
function IconGlobe({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9 9 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>;
}
function IconShield({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;
}
function IconCheck({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
}
function IconX({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}
function IconChevron({ className = "w-4 h-4", open }: { className?: string; open: boolean }) {
  return <svg className={`${className} transition-transform duration-300 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;
}
function IconLoader({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>;
}
function IconGamepad({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.657-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" /></svg>;
}

/* ── Step connector for the guide ─────────────────── */
function StepIndicator({ step, color, done }: { step: number; color: string; done?: boolean }) {
  return (
    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
      done
        ? "bg-arena-success border-arena-success text-white"
        : `${color} border-current`
    }`}>
      {done ? <IconCheck className="w-3.5 h-3.5" /> : step}
    </div>
  );
}

/* ── Status pill ──────────────────────────────────── */
function StatusPill({ status, successText, errorText, loadingText, latency }: {
  status: "idle" | "checking" | "success" | "error";
  successText: string;
  errorText?: string;
  loadingText: string;
  latency?: number;
}) {
  if (status === "idle") return null;
  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl bg-arena-primary/5 border border-arena-primary/15 text-arena-primary text-sm font-medium animate-pulse">
        <IconLoader className="w-4 h-4" />
        {loadingText}
      </div>
    );
  }
  if (status === "success") {
    return (
      <div className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl bg-arena-success/8 border border-arena-success/20 text-arena-success text-sm font-medium">
        <div className="w-5 h-5 rounded-full bg-arena-success/15 flex items-center justify-center shrink-0">
          <IconCheck className="w-3 h-3" />
        </div>
        {successText}
        {latency !== undefined && <span className="ml-auto text-xs font-mono opacity-60">{latency}ms</span>}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl bg-arena-danger/8 border border-arena-danger/20 text-arena-danger text-sm">
      <div className="w-5 h-5 rounded-full bg-arena-danger/15 flex items-center justify-center shrink-0">
        <IconX className="w-3 h-3" />
      </div>
      <span className="truncate">{errorText}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN FORM
   ═══════════════════════════════════════════════════════ */
function CreateAgentContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const [agentType, setAgentType] = useState<AgentType>("openclaw");
  const [formData, setFormData] = useState({
    name: "",
    endpointUrl: "",
    openclawUrl: "",
    openclawToken: "",
    openclawAgentId: "",
    selfclawPublicKey: "",
    marrakech: true,
  });
  const [showGuide, setShowGuide] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [healthCheck, setHealthCheck] = useState<{
    status: "idle" | "checking" | "success" | "error";
    latencyMs?: number;
    error?: string;
  }>({ status: "idle" });
  const [selfclawCheck, setSelfclawCheck] = useState<{
    status: "idle" | "checking" | "success" | "error";
    agentName?: string;
    error?: string;
  }>({ status: "idle" });

  const validateUrl = (url: string): boolean => {
    try { new URL(url); return true; } catch { return false; }
  };

  const handleTestConnection = async () => {
    if (!formData.openclawUrl.trim() || !formData.openclawToken.trim()) {
      setHealthCheck({ status: "error", error: t.createAgent.testUrlTokenRequired });
      return;
    }
    if (!validateUrl(formData.openclawUrl.trim())) {
      setHealthCheck({ status: "error", error: t.createAgent.invalidUrlFormat });
      return;
    }
    setHealthCheck({ status: "checking" });
    try {
      const result = await api.testOpenClawWebhook(formData.openclawUrl.trim(), formData.openclawToken.trim());
      if (result.ok) {
        setHealthCheck({ status: "success", latencyMs: result.latencyMs });
      } else {
        setHealthCheck({ status: "error", latencyMs: result.latencyMs, error: result.error || t.createAgent.connectionFailed });
      }
    } catch (err) {
      setHealthCheck({ status: "error", error: err instanceof Error ? err.message : t.createAgent.connectionFailed });
    }
  };

  const handleSelfClawVerify = async () => {
    if (!formData.selfclawPublicKey.trim()) {
      setSelfclawCheck({ status: "error", error: t.createAgent.selfclawError });
      return;
    }
    setSelfclawCheck({ status: "checking" });
    try {
      const result = await api.verifySelfClaw(formData.selfclawPublicKey.trim());
      if (result.verified) {
        setSelfclawCheck({ status: "success", agentName: result.agentName });
      } else {
        setSelfclawCheck({ status: "error", error: t.createAgent.selfclawNotVerified });
      }
    } catch (err) {
      setSelfclawCheck({ status: "error", error: err instanceof Error ? err.message : t.createAgent.selfclawError });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.name.trim()) { setError(t.createAgent.agentNameRequired); setLoading(false); return; }
    if (agentType === "http") {
      if (!formData.endpointUrl.trim()) { setError(t.createAgent.endpointUrlRequired); setLoading(false); return; }
      if (!validateUrl(formData.endpointUrl.trim())) { setError(t.createAgent.endpointUrlInvalid); setLoading(false); return; }
    }
    if (agentType === "openclaw") {
      if (!formData.openclawUrl.trim()) { setError(t.createAgent.openclawUrlRequired); setLoading(false); return; }
      if (!validateUrl(formData.openclawUrl.trim())) { setError(t.createAgent.openclawUrlInvalid); setLoading(false); return; }
      if (!formData.openclawToken.trim()) { setError(t.createAgent.gatewayTokenRequired); setLoading(false); return; }
    }
    const gameTypes: string[] = [];
    if (formData.marrakech) gameTypes.push("marrakech");
    if (gameTypes.length === 0) { setError(t.createAgent.selectGameType); setLoading(false); return; }

    try {
      const payload: Record<string, unknown> = { name: formData.name.trim(), type: agentType, gameTypes };
      if (agentType === "http") {
        payload.endpointUrl = formData.endpointUrl.trim();
      } else {
        payload.openclawUrl = formData.openclawUrl.trim();
        payload.openclawToken = formData.openclawToken.trim();
        if (formData.openclawAgentId.trim()) payload.openclawAgentId = formData.openclawAgentId.trim();
      }
      if (selfclawCheck.status !== "success") { setError(t.createAgent.selfclawRequired); setLoading(false); return; }
      payload.selfclawPublicKey = formData.selfclawPublicKey.trim();

      const data = await api.createAgent(payload as any);
      router.push(`/agents/${data.agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.createAgent.createFailed);
    } finally {
      setLoading(false);
    }
  };

  const selfclawVerified = selfclawCheck.status === "success";
  const connectionVerified = healthCheck.status === "success";

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">

        {/* ── Page header ────────────────────────────── */}
        <div className="mb-8">
          <Link href="/agents" className="inline-flex items-center gap-1.5 text-sm text-arena-muted hover:text-arena-primary transition-colors mb-5 group">
            <IconArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            {t.createAgent.backToAgents}
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-arena-primary to-arena-accent flex items-center justify-center shadow-lg"
                 style={{ boxShadow: "0 6px 24px rgba(91, 79, 207, 0.25)" }}>
              <IconBolt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-arena-text-bright font-display tracking-tight">
                {t.createAgent.title}
              </h1>
              <p className="text-sm text-arena-muted mt-0.5">{t.createAgent.subtitle}</p>
            </div>
          </div>
        </div>

        {/* ── Setup guide (collapsible) ──────────────── */}
        <div className="mb-6 rounded-2xl overflow-hidden border border-arena-border-light/60 bg-white/70 backdrop-blur-sm shadow-arena-sm">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-arena-card-hover transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-arena-primary/8 flex items-center justify-center">
                <span className="text-[10px] font-bold text-arena-primary">?</span>
              </div>
              <span className="text-sm font-semibold text-arena-text">{t.createAgent.guideTitle}</span>
            </div>
            <IconChevron className="w-4 h-4 text-arena-muted" open={showGuide} />
          </button>

          <div className={`overflow-hidden transition-all duration-400 ease-in-out ${showGuide ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="px-6 pb-6 space-y-0">

              {/* Step 1: SelfClaw */}
              <div className="relative pl-12 pb-8">
                <div className="absolute left-[15px] top-10 bottom-0 w-px bg-arena-border-light/40" />
                <div className="absolute left-0 top-1">
                  <StepIndicator step={1} color="text-arena-primary bg-arena-primary/8" done={selfclawVerified} />
                </div>
                <h3 className="text-sm font-semibold text-arena-text mb-1.5 pt-1">{t.createAgent.guideSelfclawTitle}</h3>
                <p className="text-xs text-arena-muted mb-3 leading-relaxed">{t.createAgent.guideSelfclawDesc}</p>
                <ol className="text-xs text-arena-muted space-y-1.5 list-decimal list-inside mb-3">
                  <li>{t.createAgent.guideSelfclawStep1}</li>
                  <li>{t.createAgent.guideSelfclawStep2}</li>
                  <li>{t.createAgent.guideSelfclawStep3}</li>
                  <li>{t.createAgent.guideSelfclawStep4}</li>
                  <li>{t.createAgent.guideSelfclawStep5}</li>
                </ol>
                <div className="bg-arena-primary/[0.04] border border-arena-primary/15 rounded-xl px-3.5 py-2.5 mb-3">
                  <p className="text-xs text-arena-primary leading-relaxed">{t.createAgent.guideSelfclawNote}</p>
                </div>
                <a href="https://selfclaw.ai" target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1.5 text-xs font-semibold text-arena-primary hover:text-arena-primary-dark transition-colors">
                  {t.createAgent.guideSelfclawLink} <span className="text-[10px]">&rarr;</span>
                </a>
              </div>

              {/* Step 2: OpenClaw */}
              <div className="relative pl-12 pb-8">
                <div className="absolute left-[15px] top-10 bottom-0 w-px bg-arena-border-light/40" />
                <div className="absolute left-0 top-1">
                  <StepIndicator step={2} color="text-arena-primary bg-arena-primary/8" done={connectionVerified} />
                </div>
                <h3 className="text-sm font-semibold text-arena-text mb-1.5 pt-1">{t.createAgent.guideOpenclawTitle}</h3>
                <p className="text-xs text-arena-muted mb-3 leading-relaxed">{t.createAgent.guideOpenclawDesc}</p>
                <ol className="text-xs text-arena-muted space-y-1.5 list-decimal list-inside">
                  <li>{t.createAgent.guideOpenclawStep1}</li>
                  <li>{t.createAgent.guideOpenclawStep2}</li>
                  <li>{t.createAgent.guideOpenclawStep3}{" "}
                    <code className="text-arena-primary bg-arena-primary/5 px-1.5 py-0.5 rounded text-[11px] font-mono">~/.openclaw/openclaw.json</code>
                  </li>
                  <li>{t.createAgent.guideOpenclawStep4}</li>
                </ol>
              </div>

              {/* Step 3: Ready */}
              <div className="relative pl-12">
                <div className="absolute left-0 top-1">
                  <StepIndicator step={3} color="text-arena-success bg-arena-success/8" />
                </div>
                <h3 className="text-sm font-semibold text-arena-text mb-1.5 pt-1">{t.createAgent.guideReadyTitle}</h3>
                <p className="text-xs text-arena-muted leading-relaxed">{t.createAgent.guideReadyDesc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main form card ─────────────────────────── */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-arena-border-light/60 shadow-arena-sm overflow-hidden">
          <form onSubmit={handleSubmit}>

            {/* Error banner */}
            {error && (
              <div className="mx-6 mt-6 flex items-start gap-3 bg-arena-danger/8 border border-arena-danger/20 text-arena-danger rounded-xl px-4 py-3 text-sm animate-fade-down">
                <div className="w-5 h-5 rounded-full bg-arena-danger/15 flex items-center justify-center shrink-0 mt-0.5">
                  <IconX className="w-3 h-3" />
                </div>
                <span>{error}</span>
              </div>
            )}

            {/* Section: Basic info */}
            <div className="p-6 space-y-5">
              <Input
                label={t.createAgent.agentName}
                type="text"
                placeholder={t.createAgent.agentNamePlaceholder}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                helperText={t.createAgent.agentNameHelper}
              />

              {/* Wallet address (read-only) */}
              <div>
                <label className="block text-sm font-medium text-arena-text mb-1.5">{t.createAgent.walletAddress}</label>
                <div className="flex items-center gap-3 bg-arena-bg-light/60 border border-arena-border-light/50 rounded-xl px-4 py-3">
                  <div className="w-7 h-7 rounded-lg bg-arena-primary/8 flex items-center justify-center shrink-0">
                    <IconShield className="w-3.5 h-3.5 text-arena-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-mono text-arena-text truncate">{user?.walletAddress || t.createAgent.noWalletSet}</div>
                    <div className="text-[11px] text-arena-muted mt-0.5">{t.createAgent.walletHelper}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-arena-border-light/40 to-transparent" />

            {/* Section: Agent type */}
            <div className="p-6 space-y-5">
              <label className="block text-sm font-medium text-arena-text">{t.createAgent.agentType}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAgentType("openclaw")}
                  className={`group relative p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                    agentType === "openclaw"
                      ? "border-arena-primary bg-arena-primary/[0.05] shadow-sm"
                      : "border-arena-border-light/60 bg-white hover:border-arena-primary/30 hover:bg-arena-primary/[0.02]"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                    agentType === "openclaw" ? "bg-arena-primary/12" : "bg-arena-bg-light"
                  }`}>
                    <IconBolt className={`w-4.5 h-4.5 ${agentType === "openclaw" ? "text-arena-primary" : "text-arena-muted"}`} />
                  </div>
                  <div className="text-sm font-semibold text-arena-text">{t.createAgent.openclaw}</div>
                  <div className="text-xs text-arena-muted mt-1 leading-relaxed">{t.createAgent.openclawDesc}</div>
                  {agentType === "openclaw" && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-arena-primary flex items-center justify-center">
                      <IconCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setAgentType("http")}
                  className={`group relative p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                    agentType === "http"
                      ? "border-arena-primary bg-arena-primary/[0.05] shadow-sm"
                      : "border-arena-border-light/60 bg-white hover:border-arena-primary/30 hover:bg-arena-primary/[0.02]"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                    agentType === "http" ? "bg-arena-primary/12" : "bg-arena-bg-light"
                  }`}>
                    <IconGlobe className={`w-4.5 h-4.5 ${agentType === "http" ? "text-arena-primary" : "text-arena-muted"}`} />
                  </div>
                  <div className="text-sm font-semibold text-arena-text">{t.createAgent.customHttp}</div>
                  <div className="text-xs text-arena-muted mt-1 leading-relaxed">{t.createAgent.customHttpDesc}</div>
                  {agentType === "http" && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-arena-primary flex items-center justify-center">
                      <IconCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              </div>

              {/* OpenClaw fields */}
              {agentType === "openclaw" && (
                <div className="space-y-4 pt-2">
                  <Input
                    label={t.createAgent.openclawUrl}
                    type="text"
                    placeholder="http://your-vps.com:64936"
                    value={formData.openclawUrl}
                    onChange={(e) => setFormData({ ...formData, openclawUrl: e.target.value })}
                    required
                    helperText="HTTP URL of your OpenClaw instance (http:// or https://)."
                  />
                  <Input
                    label={t.createAgent.gatewayToken}
                    type="password"
                    placeholder="Your OPENCLAW_TOKEN"
                    value={formData.openclawToken}
                    onChange={(e) => setFormData({ ...formData, openclawToken: e.target.value })}
                    required
                    helperText="The token from your OpenClaw config (~/.openclaw/openclaw.json)."
                  />
                  <Input
                    label={t.createAgent.agentIdOptional}
                    type="text"
                    placeholder="main"
                    value={formData.openclawAgentId}
                    onChange={(e) => setFormData({ ...formData, openclawAgentId: e.target.value })}
                    helperText={t.createAgent.agentIdHelper}
                  />

                  {/* Test connection */}
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={healthCheck.status === "checking"}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-arena-border-light/60 bg-white text-sm font-medium text-arena-text hover:border-arena-primary/40 hover:bg-arena-primary/[0.03] transition-all disabled:opacity-50"
                  >
                    {healthCheck.status === "checking"
                      ? <><IconLoader className="w-4 h-4" /> {t.createAgent.testingConnection}</>
                      : t.createAgent.testConnection}
                  </button>
                  <StatusPill
                    status={healthCheck.status}
                    successText={`${t.createAgent.connected}`}
                    errorText={`${t.createAgent.connectionFailed}: ${healthCheck.error}`}
                    loadingText={t.createAgent.testingConnection}
                    latency={healthCheck.latencyMs}
                  />

                  {/* Setup reference */}
                  <div className="bg-arena-bg-light/40 border border-arena-border-light/40 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-arena-text mb-2 uppercase tracking-wider">{t.createAgent.openclawSetup}</h4>
                    <ul className="text-xs text-arena-muted space-y-1.5 list-disc list-inside leading-relaxed">
                      <li>{t.createAgent.openclawStep1}{" "}
                        <code className="text-arena-primary bg-arena-primary/5 px-1 py-0.5 rounded text-[11px]">http://your-vps.com:64936</code>)
                      </li>
                      <li>{t.createAgent.openclawStep2}{" "}
                        <code className="text-arena-primary bg-arena-primary/5 px-1 py-0.5 rounded text-[11px]">token</code>{" "}
                        {t.createAgent.openclawStep2b} (<code className="text-arena-primary bg-arena-primary/5 px-1 py-0.5 rounded text-[11px]">~/.openclaw/openclaw.json</code>)
                      </li>
                      <li>{t.createAgent.openclawStep3}{" "}
                        <code className="text-arena-primary bg-arena-primary/5 px-1 py-0.5 rounded text-[11px]">/hooks/wake</code>{" "}
                        {t.createAgent.openclawStep3b}{" "}
                        <code className="text-arena-primary bg-arena-primary/5 px-1 py-0.5 rounded text-[11px]">/hooks/agent</code>
                      </li>
                      <li>{t.createAgent.openclawStep4}</li>
                      <li>{t.createAgent.openclawStep5}</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* HTTP fields */}
              {agentType === "http" && (
                <div className="space-y-4 pt-2">
                  <Input
                    label={t.createAgent.endpointUrl}
                    type="url"
                    placeholder={t.createAgent.endpointUrlPlaceholder}
                    value={formData.endpointUrl}
                    onChange={(e) => setFormData({ ...formData, endpointUrl: e.target.value })}
                    required
                    helperText={t.createAgent.endpointHelper}
                  />
                  <div className="bg-arena-bg-light/40 border border-arena-border-light/40 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-arena-text mb-2 uppercase tracking-wider">{t.createAgent.endpointRequirements}</h4>
                    <ul className="text-xs text-arena-muted space-y-1.5 list-disc list-inside leading-relaxed">
                      <li>{t.createAgent.endpointReq1}</li>
                      <li>{t.createAgent.endpointReq2}</li>
                      <li>{t.createAgent.endpointReq3}</li>
                      <li>{t.createAgent.endpointReq4}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Section divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-arena-border-light/40 to-transparent" />

            {/* Section: SelfClaw verification */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  selfclawVerified ? "bg-arena-success/10" : "bg-arena-primary/8"
                }`}>
                  <IconShield className={`w-4 h-4 ${selfclawVerified ? "text-arena-success" : "text-arena-primary"}`} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-arena-text">
                    {t.createAgent.selfclawVerification}
                    <span className="text-arena-danger ml-1">*</span>
                  </label>
                  <p className="text-[11px] text-arena-muted">{t.createAgent.selfclawRequired}</p>
                </div>
              </div>

              <Input
                label={t.createAgent.selfclawPublicKey}
                type="text"
                placeholder={t.createAgent.selfclawPublicKeyPlaceholder}
                value={formData.selfclawPublicKey}
                onChange={(e) => setFormData({ ...formData, selfclawPublicKey: e.target.value })}
                helperText={t.createAgent.selfclawPublicKeyHelper}
              />

              <button
                type="button"
                onClick={handleSelfClawVerify}
                disabled={selfclawCheck.status === "checking" || !formData.selfclawPublicKey.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-arena-border-light/60 bg-white text-sm font-medium text-arena-text hover:border-arena-primary/40 hover:bg-arena-primary/[0.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selfclawCheck.status === "checking"
                  ? <><IconLoader className="w-4 h-4" /> {t.createAgent.selfclawVerifying}</>
                  : t.createAgent.selfclawVerify}
              </button>

              <StatusPill
                status={selfclawCheck.status}
                successText={`${t.createAgent.selfclawVerified}${selfclawCheck.agentName ? ` — ${selfclawCheck.agentName}` : ""}`}
                errorText={selfclawCheck.error}
                loadingText={t.createAgent.selfclawVerifying}
              />
            </div>

            {/* Section divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-arena-border-light/40 to-transparent" />

            {/* Section: Game type */}
            <div className="p-6 space-y-3">
              <label className="block text-sm font-medium text-arena-text">{t.createAgent.gameTypes}</label>
              <label className={`flex items-center gap-4 cursor-pointer rounded-xl p-4 border-2 transition-all duration-200 ${
                formData.marrakech
                  ? "border-arena-primary/40 bg-arena-primary/[0.04]"
                  : "border-arena-border-light/60 bg-white hover:border-arena-primary/20"
              }`}>
                <input
                  type="checkbox"
                  checked={formData.marrakech}
                  onChange={(e) => setFormData({ ...formData, marrakech: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                  formData.marrakech
                    ? "bg-arena-primary border-arena-primary"
                    : "border-arena-border-light bg-white"
                }`}>
                  {formData.marrakech && <IconCheck className="w-3 h-3 text-white" />}
                </div>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  formData.marrakech ? "bg-arena-accent/10" : "bg-arena-bg-light"
                }`}>
                  <IconGamepad className={`w-4.5 h-4.5 ${formData.marrakech ? "text-arena-accent" : "text-arena-muted"}`} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-arena-text">{t.createAgent.marrakech}</div>
                  <div className="text-xs text-arena-muted mt-0.5">{t.createAgent.marrakechDesc}</div>
                </div>
              </label>
            </div>

            {/* Submit area */}
            <div className="p-6 pt-2 flex gap-3">
              <Button
                type="submit"
                isLoading={loading}
                disabled={loading || !selfclawVerified}
                className="flex-1"
                size="lg"
              >
                {t.createAgent.title}
              </Button>
              <Link href="/agents">
                <Button type="button" variant="secondary" size="lg">
                  {t.common.cancel}
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CreateAgentPage() {
  return (
    <AuthGuard>
      <CreateAgentContent />
    </AuthGuard>
  );
}
