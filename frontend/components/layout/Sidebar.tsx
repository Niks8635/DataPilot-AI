"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Database, 
  Sparkles, 
  LayoutDashboard, 
  MessageSquareCode, 
  FileText, 
  Settings, 
  ShieldCheck, 
  Command, 
  ChevronRight, 
  ChevronLeft,
  Zap, 
  Activity, 
  User, 
  Home,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./CommandPalette";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Datasets", href: "/datasets", icon: Database },
  { label: "Dashboards", href: "/dashboards", icon: BarChart3 },
  { label: "Ask Data", href: "/ask-data", icon: MessageSquareCode, badge: "AI" },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Profile & Vault", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load persisted collapse preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("datapilot_sidebar_collapsed");
      if (saved === "true") setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("datapilot_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  return (
    <>
      <aside
        className={cn(
          "border-r border-white/[0.08] bg-[#080A0F]/90 backdrop-blur-xl flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-20 transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div>
          {/* Brand Header — Links to Website Home */}
          <div className="h-16 border-b border-white/[0.08] px-4 flex items-center justify-between">
            <Link 
              href="/" 
              className="flex items-center gap-3 group overflow-hidden" 
              title="Return to Main Website Home (http://localhost:3000/)"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-violet-500/20 group-hover:scale-105 transition shrink-0">
                <div className="w-full h-full rounded-[11px] bg-[#080A0F] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
                    DataPilot <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-violet-500/15 text-violet-300 border border-violet-500/25">AI</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal truncate">AI-Powered Analytics</div>
                </div>
              )}
            </Link>

            {/* Collapse Toggle Button */}
            <button
              onClick={toggleCollapse}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Quick Return to Website Home Action */}
          <div className="px-3 pt-3 pb-1">
            <Link
              href="/"
              className={cn(
                "w-full flex items-center rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-white/[0.06] hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-medium transition-all group shadow-xs",
                isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
              )}
              title="Return to Main Website Home (http://localhost:3000/)"
            >
              <span className="flex items-center gap-2">
                <Home className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                {!isCollapsed && <span>Return to Home</span>}
              </span>
              {!isCollapsed && (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Main
                </span>
              )}
            </Link>
          </div>

          {/* Command Menu Quick Action */}
          <div className="px-3 pt-1 pb-2">
            <button
              onClick={() => setCommandOpen(true)}
              className={cn(
                "w-full flex items-center rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] text-slate-400 hover:text-slate-200 text-xs transition group shadow-xs",
                isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
              )}
              title="Open Command Menu (⌘K)"
            >
              <span className="flex items-center gap-2">
                <Command className="w-4 h-4 text-violet-400 shrink-0" />
                {!isCollapsed && <span>Command Menu</span>}
              </span>
              {!isCollapsed && (
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-900 text-slate-400 border border-slate-700">
                  ⌘K
                </kbd>
              )}
            </button>
          </div>

          {/* Navigation List */}
          <div className="p-3 space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                Intelligence Studio
              </div>
            )}
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-xl text-xs font-medium transition-all group relative",
                    isCollapsed ? "justify-center p-2.5" : "justify-between px-3.5 py-2",
                    isActive
                      ? "bg-gradient-to-r from-violet-600/20 via-indigo-500/10 to-transparent text-white border-l-2 border-violet-500 font-semibold shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-4 h-4 transition-colors shrink-0", isActive ? "text-violet-400" : "text-slate-400 group-hover:text-slate-200")} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-500/15 text-violet-300 font-mono font-bold border border-violet-500/25">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer Info / Engine Status */}
        <div className="p-3 border-t border-white/[0.08]">
          {!isCollapsed ? (
            <>
              <div className="p-3 rounded-xl bg-[#121722] border border-white/[0.08] text-xs shadow-inner relative overflow-hidden specular-top">
                <div className="flex items-center justify-between text-slate-300 mb-1.5">
                  <span className="font-semibold flex items-center gap-1.5 text-white">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    AST Enclave
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Air-Gapped
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Zero OS access sandbox & AES-256 tenant data isolation active.
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
                <span>DataPilot Engine v2.4</span>
                <span className="text-emerald-400">SOC-2 Active</span>
              </div>
            </>
          ) : (
            <div className="flex justify-center p-2 text-emerald-400" title="AST Enclave Air-Gapped">
              <ShieldCheck className="w-5 h-5" />
            </div>
          )}
        </div>
      </aside>

      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
      />
    </>
  );
}
