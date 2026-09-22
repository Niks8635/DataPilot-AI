"use client";

import React from "react";
import { AlertTriangle, RotateCcw, HelpCircle, ArrowLeft } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  technicalDetails?: string;
  onRetry?: () => void;
  onBack?: () => void;
  className?: string;
}

export function ErrorState({
  title = "We couldn't complete this analysis",
  message = "An unexpected data parsing or execution constraint occurred.",
  technicalDetails,
  onRetry,
  onBack,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`rounded-2xl border border-rose-500/30 bg-gradient-to-b from-[#1a131b] to-[#0D1117] p-8 text-center flex flex-col items-center justify-center max-w-lg mx-auto shadow-2xl relative overflow-hidden ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
      <p className="text-xs text-slate-300 mt-1.5 max-w-sm leading-relaxed">
        {message}
      </p>

      {technicalDetails && (
        <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-rose-500/20 text-left w-full">
          <div className="text-[10px] uppercase font-mono text-rose-400 font-semibold mb-1">
            Diagnostic Context:
          </div>
          <code className="text-[11px] font-mono text-slate-300 break-all block leading-tight">
            {technicalDetails}
          </code>
        </div>
      )}

      <div className="flex items-center gap-3 mt-6">
        {onRetry && (
          <Button size="sm" variant="primary" onClick={onRetry} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </Button>
        )}

        {onBack && (
          <Button size="sm" variant="outline" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </Button>
        )}
      </div>
    </div>
  );
}
