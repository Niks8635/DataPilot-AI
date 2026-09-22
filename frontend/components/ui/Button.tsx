import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "luxury" | "emerald" | "glass" | "cyan" | "purple" | "amber";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, disabled, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed select-none relative overflow-hidden group";
    
    const variants = {
      primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 focus:ring-indigo-500 border border-indigo-400/25 active:scale-[0.98] hover:-translate-y-0.5",
      luxury: "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white shadow-[0_0_24px_rgba(139,92,246,0.3)] hover:shadow-[0_0_32px_rgba(139,92,246,0.5)] border border-white/20 font-semibold active:scale-[0.98] hover:-translate-y-0.5",
      amber: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/35 border border-violet-400/30 focus:ring-violet-400 active:scale-[0.98] hover:-translate-y-0.5",
      cyan: "bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 hover:shadow-lg hover:shadow-cyan-600/30 border border-cyan-400/30 focus:ring-cyan-500 active:scale-[0.98] hover:-translate-y-0.5",
      purple: "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 hover:shadow-lg hover:shadow-purple-600/30 border border-purple-400/30 focus:ring-purple-500 active:scale-[0.98] hover:-translate-y-0.5",
      emerald: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 border border-emerald-400/30 focus:ring-emerald-500 active:scale-[0.98] hover:-translate-y-0.5",
      glass: "bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] hover:border-white/[0.18] backdrop-blur-md active:scale-[0.98] hover:-translate-y-0.5 shadow-sm",
      secondary: "bg-slate-900 hover:bg-slate-850 text-slate-100 border border-white/[0.08] hover:border-white/[0.15] focus:ring-slate-600 active:scale-[0.98] hover:-translate-y-0.5 shadow-sm",
      outline: "bg-transparent hover:bg-white/[0.05] text-slate-200 border border-white/[0.1] hover:border-violet-500/40 focus:ring-slate-600 active:scale-[0.98] hover:-translate-y-0.5",
      ghost: "bg-transparent hover:bg-white/[0.05] text-slate-300 hover:text-white focus:ring-slate-700",
      danger: "bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500 shadow-md shadow-rose-600/20 border border-rose-400/30 active:scale-[0.98] hover:-translate-y-0.5",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-6 py-2.5 gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
