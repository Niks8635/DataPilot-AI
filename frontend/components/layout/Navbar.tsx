"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Search, Bell, Plus, Activity, ShieldCheck, Command, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CommandPalette } from "./CommandPalette";
import { TelemetryModal } from "./TelemetryModal";

interface NavbarProps {
  onOpenUpload?: () => void;
}

export function Navbar({ onOpenUpload }: NavbarProps) {
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);
  const [telemetryOpen, setTelemetryOpen] = useState(false);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("datapilot_token");
      localStorage.removeItem("datapilot_user");
    }
    router.push("/login");
  };

  // Global shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-16 border-b border-white/[0.08] bg-[#080A0F]/85 backdrop-blur-xl sticky top-0 z-30 px-6 flex items-center justify-between">
        {/* Spotlight Command Bar Trigger */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <button
            onClick={() => setCommandOpen(true)}
            className="w-full bg-[#121722]/90 hover:bg-[#161C28] border border-white/[0.08] hover:border-violet-500/40 rounded-xl pl-3.5 pr-3 py-1.5 text-xs text-slate-400 flex items-center justify-between transition-all group shadow-sm"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-400 transition-colors" />
              <span className="truncate">Search datasets, queries, dashboards...</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700/80 shadow-xs">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right Section: Telemetry HUD, Notifications, Profile */}
        <div className="flex items-center gap-3">
          {/* Live AI Telemetry Pill */}
          <button
            onClick={() => setTelemetryOpen(true)}
            className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-mono transition group"
            title="Inspect AI Engine & Sandbox Telemetry"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[11px] font-medium text-emerald-300">AI Core: 4.0 Pro</span>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] text-emerald-400">12ms</span>
          </button>

          {onOpenUpload && (
            <Button size="sm" variant="luxury" onClick={onOpenUpload} className="hidden sm:inline-flex">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Upload Dataset
            </Button>
          )}

          {/* Return to Main Website Home Button */}
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-medium transition-all group shadow-xs active:scale-[0.98]"
            title="Return to Main Website Home (http://localhost:3000/)"
          >
            <Home className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline font-medium">Return to Home</span>
          </Link>

          <div className="flex items-center gap-2 pl-3 border-l border-white/[0.08]">
            <button 
              onClick={() => setTelemetryOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] rounded-xl transition relative"
              title="Notifications & System Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 hover:border-rose-500/40 text-rose-300 hover:text-rose-100 text-xs font-medium transition-all group shadow-sm ml-1 active:scale-[0.98]"
              title="Sign Out of DataPilot AI"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400 group-hover:text-rose-300 group-hover:-translate-x-0.5 transition-all" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Modals */}
      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
        onOpenUpload={onOpenUpload}
        onOpenTelemetry={() => setTelemetryOpen(true)}
      />

      <TelemetryModal
        isOpen={telemetryOpen}
        onClose={() => setTelemetryOpen(false)}
      />
    </>
  );
}
