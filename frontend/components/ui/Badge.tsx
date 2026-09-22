import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "outline" | "primary" | "error";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    success: "bg-emerald-950/80 text-emerald-400 border-emerald-800/60",
    warning: "bg-rose-950/60 text-rose-300 border-rose-800/50",
    danger: "bg-rose-950/80 text-rose-400 border-rose-800/60",
    error: "bg-rose-950/80 text-rose-400 border-rose-800/60",
    info: "bg-blue-950/80 text-blue-400 border-blue-800/60",
    primary: "bg-blue-950/80 text-blue-400 border-blue-800/60",
    purple: "bg-purple-950/80 text-purple-400 border-purple-800/60",
    outline: "bg-transparent text-slate-400 border-slate-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
