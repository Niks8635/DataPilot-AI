"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-slate-800/60 border border-white/[0.04]",
        className
      )}
      {...props}
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#121722] space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-6 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#121722] overflow-hidden p-4 space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-24 rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="flex gap-4 pb-2 border-b border-white/[0.04]">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 py-1.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-3.5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#121722] space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-lg" />
      </div>
      <div 
        className="w-full rounded-xl bg-slate-950/60 border border-white/[0.04] p-4 flex items-end gap-3 justify-around" 
        style={{ height }}
      >
        <Skeleton className="w-8 h-[35%] rounded-t-md" />
        <Skeleton className="w-8 h-[65%] rounded-t-md" />
        <Skeleton className="w-8 h-[50%] rounded-t-md" />
        <Skeleton className="w-8 h-[85%] rounded-t-md" />
        <Skeleton className="w-8 h-[40%] rounded-t-md" />
        <Skeleton className="w-8 h-[75%] rounded-t-md" />
      </div>
    </div>
  );
}
