"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Sparkles, 
  Database, 
  BarChart3, 
  FileText, 
  Settings, 
  Upload, 
  ShieldCheck, 
  ArrowRight, 
  Command,
  CornerDownLeft,
  X,
  Layers,
  MessageSquareCode,
  User,
  Home
} from "lucide-react";
import { Dataset } from "@/types";
import { api } from "@/lib/api";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Actions" | "Datasets";
  subtitle?: string;
  icon: React.ElementType;
  badge?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUpload?: () => void;
  onOpenTelemetry?: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpenUpload,
  onOpenTelemetry,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load datasets when palette opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      api.datasets.list().then((list) => setDatasets(list)).catch(() => {});
    }
  }, [isOpen]);

  // Global keyboard listener for ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Build items list
  const allItems: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      // Actions
      {
        id: "act-upload",
        title: "Upload New Dataset",
        category: "Actions",
        subtitle: "Import CSV, XLSX, JSON, or Parquet",
        icon: Upload,
        badge: "Action",
        onSelect: () => {
          onClose();
          onOpenUpload?.();
        },
      },
      {
        id: "act-ask",
        title: "Ask AI Copilot",
        category: "Actions",
        subtitle: "Formulate plain-English analytical query",
        icon: MessageSquareCode,
        badge: "AI",
        onSelect: () => {
          onClose();
          router.push("/ask-data");
        },
      },
      {
        id: "act-report",
        title: "Generate Boardroom Report",
        category: "Actions",
        subtitle: "Compile executive intelligence audit",
        icon: FileText,
        badge: "Audit",
        onSelect: () => {
          onClose();
          router.push("/reports");
        },
      },
      {
        id: "act-telemetry",
        title: "Inspect Security & Engine Telemetry",
        category: "Actions",
        subtitle: "View AST sandboxing & AES-256 telemetry",
        icon: ShieldCheck,
        badge: "Security",
        onSelect: () => {
          onClose();
          onOpenTelemetry?.();
        },
      },

      // Navigation
      {
        id: "nav-home",
        title: "Return to Website Home",
        category: "Navigation",
        subtitle: "Visit main landing page (http://localhost:3000/)",
        icon: Home,
        badge: "Main",
        onSelect: () => {
          onClose();
          router.push("/");
        },
      },
      {
        id: "nav-dash",
        title: "Command Center",
        category: "Navigation",
        subtitle: "Platform overview and recent activity",
        icon: Layers,
        onSelect: () => {
          onClose();
          router.push("/dashboard");
        },
      },
      {
        id: "nav-datasets",
        title: "Datasets Library",
        category: "Navigation",
        subtitle: "Manage uploaded raw files and version audits",
        icon: Database,
        onSelect: () => {
          onClose();
          router.push("/datasets");
        },
      },
      {
        id: "nav-dashboards",
        title: "Interactive Dashboards Studio",
        category: "Navigation",
        subtitle: "Power BI / Tableau visual canvas & cross-filters",
        icon: BarChart3,
        onSelect: () => {
          onClose();
          router.push("/dashboards");
        },
      },
      {
        id: "nav-profile",
        title: "User Profile & Data Vault",
        category: "Navigation",
        subtitle: "Account identity, personal datasets inventory, and storage stats",
        icon: User,
        onSelect: () => {
          onClose();
          router.push("/profile");
        },
      },
      {
        id: "nav-settings",
        title: "Platform Settings",
        category: "Navigation",
        subtitle: "Engine configuration and API keys",
        icon: Settings,
        onSelect: () => {
          onClose();
          router.push("/settings");
        },
      },
    ];

    // Datasets
    datasets.forEach((ds) => {
      items.push({
        id: `ds-${ds.id}`,
        title: ds.name,
        category: "Datasets",
        subtitle: `${ds.row_count.toLocaleString()} rows • ${ds.column_count} columns`,
        icon: Database,
        badge: ds.file_type.toUpperCase(),
        onSelect: () => {
          onClose();
          router.push(`/datasets/${ds.id}`);
        },
      });
    });

    return items;
  }, [datasets, router, onClose, onOpenUpload, onOpenTelemetry]);

  // Filter items by query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  // Keyboard navigation within list
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col relative specular-top"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08] gap-3">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command, search datasets, or jump anywhere..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800/80 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-white/[0.04]">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching commands or datasets found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-blue-600/20 text-white border border-blue-500/30"
                      : "text-slate-300 hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-white truncate flex items-center gap-2">
                        {item.title}
                        {item.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-white/[0.08] text-slate-300 border border-white/[0.08]">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-400 truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-3">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-blue-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 text-[9px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 text-[9px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">↵</kbd> Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 text-[9px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">esc</kbd> Dismiss
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px]">
            <Sparkles className="w-3 h-3 text-blue-400" /> DataPilot Command 2.0
          </div>
        </div>
      </div>
    </div>
  );
}
