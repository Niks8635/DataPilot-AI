"use client";

import React from "react";
import { Database, Plus, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "./Button";
import { Badge } from "./Badge";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  badge?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon = Database,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  badge,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#121722] to-[#0D1117] p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-xl relative overflow-hidden specular-top ${className}`}
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/10 blur-[60px] pointer-events-none rounded-full" />

      {badge && (
        <Badge variant="outline" className="mb-4 text-[10px] font-mono text-cyan-400 border-cyan-500/30">
          {badge}
        </Badge>
      )}

      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-cyan-500/20 border border-white/[0.12] flex items-center justify-center text-cyan-400 shadow-lg mb-4">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3 mt-6 flex-wrap justify-center">
          {actionLabel && onAction && (
            <Button size="sm" variant="luxury" onClick={onAction} className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span>{actionLabel}</span>
            </Button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <Button size="sm" variant="outline" onClick={onSecondaryAction}>
              <span>{secondaryActionLabel}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
