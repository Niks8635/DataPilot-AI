import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "luxury" | "subtle" | "bento" | "bento-purple" | "bento-cyan" | "bento-mint" | "bento-indigo" | "bento-amber" | "metric";
}

export function Card({ className, variant = "glass", children, ...props }: CardProps) {
  const variantStyles = {
    default: "border-slate-800/80 bg-slate-900/80 backdrop-blur-md shadow-xl",
    glass: "glass-card specular-top",
    luxury: "glass-card specular-top hover:border-violet-500/40 hover:shadow-[0_16px_40px_-10px_rgba(139,92,246,0.25)]",
    subtle: "border-white/[0.06] bg-slate-950/60 backdrop-blur-xs",
    bento: "bento-card specular-top",
    "bento-purple": "bento-card specular-top bento-glow-purple",
    "bento-cyan": "bento-card specular-top bento-glow-cyan",
    "bento-mint": "bento-card specular-top bento-glow-mint",
    "bento-indigo": "bento-card specular-top bento-glow-purple",
    "bento-amber": "bento-card specular-top bento-glow-purple",
    metric: "bento-card specular-top p-4 sm:p-5 flex flex-col justify-between",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border text-slate-100 transition-all duration-300 relative overflow-hidden",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5 border-b border-white/[0.06] flex flex-col gap-1.5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-semibold tracking-tight text-white flex items-center gap-2", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-slate-400 font-normal leading-relaxed", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5 border-t border-white/[0.06] flex items-center justify-between", className)} {...props}>
      {children}
    </div>
  );
}
