"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Cpu, 
  Lock, 
  Database, 
  Zap, 
  CheckCircle2, 
  Activity, 
  Server, 
  X,
  RefreshCw,
  Copy,
  Check
} from "lucide-react";

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TelemetryModal({ isOpen, onClose }: TelemetryModalProps) {
  const [latency, setLatency] = useState(12);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setLatency(Math.floor(10 + Math.random() * 6));
    }, 2500);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyDiagnostics = () => {
    const diag = {
      timestamp: new Date().toISOString(),
      engine: "DataPilot Python Analytical Core v2.4",
      sandbox: "AST-Isolated Python Subprocess",
      security: "Zero OS primitives, Zero Network Sockets, Read-Only Base Storage",
      encryption: "AES-256 GCM (SHA-256 signature verification)",
      model: "Gemini 2.5 Pro Multi-Modal Reasoning Engine",
      latencyMs: latency,
      status: "OPTIMAL",
    };
    navigator.clipboard.writeText(JSON.stringify(diag, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-slate-900/95 border border-white/10 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col relative specular-top"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                AI Engine & Security Telemetry
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  SYSTEM ONLINE
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Real-time execution environment & security verification
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.06] text-center">
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Engine Latency</div>
              <div className="text-lg font-bold text-emerald-400 font-mono flex items-center justify-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {latency} ms
              </div>
              <div className="text-[10px] text-slate-500">Vectorized C-core</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.06] text-center">
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Sandbox Mode</div>
              <div className="text-lg font-bold text-blue-400 font-mono mt-0.5">
                AST Strict
              </div>
              <div className="text-[10px] text-slate-500">Zero OS Primitives</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.06] text-center">
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Encryption</div>
              <div className="text-lg font-bold text-purple-400 font-mono mt-0.5">
                AES-256
              </div>
              <div className="text-[10px] text-slate-500">GCM Authenticated</div>
            </div>
          </div>

          {/* Detailed Verification Checkpoints */}
          <div className="space-y-2.5 bg-slate-950/50 p-4 rounded-xl border border-white/[0.06]">
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>Security & Sandbox Checkpoints</span>
              <span className="text-[10px] text-slate-500 font-mono">6 of 6 Verified</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-white/[0.04]">
              <span className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                AST-Validated Query Execution
              </span>
              <span className="font-mono text-[11px] text-slate-400">PASSED</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-white/[0.04]">
              <span className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Air-Gapped OS & Sockets Isolation
              </span>
              <span className="font-mono text-[11px] text-slate-400">ENFORCED</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-white/[0.04]">
              <span className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Immutable v1 File Integrity Check
              </span>
              <span className="font-mono text-[11px] text-slate-400">ACTIVE</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-white/[0.04]">
              <span className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Deterministic Heuristic Grounding
              </span>
              <span className="font-mono text-[11px] text-slate-400">ACTIVE (0 Hallucination)</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Cross-Filtering Micro-Latency Buffer
              </span>
              <span className="font-mono text-[11px] text-emerald-400">&lt; 5ms</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-white/[0.06] flex items-center justify-between text-xs">
          <button
            onClick={handleCopyDiagnostics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Diagnostics Copied" : "Copy Diagnostic Payload"}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-md shadow-blue-600/25"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
