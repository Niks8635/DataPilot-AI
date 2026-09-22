"use client";

import React, { useState } from "react";
import { Plus, Copy, Trash2, Edit2, Check, X, FileSpreadsheet } from "lucide-react";
import { DashboardPage } from "@/types";

interface PageTabBarProps {
  pages: DashboardPage[];
  activePageId: string;
  theme?: "dark" | "light";
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onRenamePage: (pageId: string, newTitle: string) => void;
  onDuplicatePage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
}

export function PageTabBar({
  pages,
  activePageId,
  theme = "dark",
  onSelectPage,
  onAddPage,
  onRenamePage,
  onDuplicatePage,
  onDeletePage,
}: PageTabBarProps) {
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const isDark = theme === "dark";

  const handleStartEdit = (p: DashboardPage, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPageId(p.id);
    setEditTitle(p.title);
  };

  const handleSaveEdit = (pageId: string) => {
    if (editTitle.trim()) {
      onRenamePage(pageId, editTitle.trim());
    }
    setEditingPageId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, pageId: string) => {
    if (e.key === "Enter") handleSaveEdit(pageId);
    if (e.key === "Escape") setEditingPageId(null);
  };

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-2 border-b overflow-x-auto text-xs select-none ${
        isDark ? "bg-slate-950/80 border-slate-800/80" : "bg-slate-100/90 border-slate-200"
      }`}
    >
      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mr-2 uppercase tracking-wider">
        <FileSpreadsheet className="w-3.5 h-3.5" />
        Pages:
      </div>

      <div className="flex items-center gap-1.5 flex-1">
        {pages.map((p, idx) => {
          const isActive = p.id === activePageId;
          const isEditing = editingPageId === p.id;

          return (
            <div
              key={p.id}
              onClick={() => onSelectPage(p.id)}
              className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all duration-150 border ${
                isActive
                  ? isDark
                    ? "bg-violet-950/25 border-violet-500/50 text-white shadow-sm"
                    : "bg-white border-violet-500/50 text-slate-900 shadow-sm"
                  : isDark
                  ? "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  : "bg-slate-200/50 border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              {isEditing ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, p.id)}
                    autoFocus
                    className="bg-slate-950 text-white px-1.5 py-0.5 rounded text-xs border border-violet-500 outline-none w-28"
                  />
                  <button
                    onClick={() => handleSaveEdit(p.id)}
                    className="text-emerald-400 hover:text-emerald-300 p-0.5"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setEditingPageId(null)}
                    className="text-slate-400 hover:text-slate-200 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-semibold text-violet-400 text-[11px]">{idx + 1}.</span>
                  <span className="truncate max-w-[140px]">{p.title}</span>

                  {/* Actions on Active or Hover */}
                  <div
                    className={`flex items-center gap-1 ml-1 transition-opacity ${
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <button
                      onClick={(e) => handleStartEdit(p, e)}
                      title="Rename Page"
                      className="text-slate-400 hover:text-blue-400 p-0.5 rounded"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicatePage(p.id);
                      }}
                      title="Duplicate Page"
                      className="text-slate-400 hover:text-emerald-400 p-0.5 rounded"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {pages.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete page "${p.title}"?`)) {
                            onDeletePage(p.id);
                          }
                        }}
                        title="Delete Page"
                        className="text-slate-400 hover:text-red-400 p-0.5 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* + Add Page Button */}
        <button
          onClick={onAddPage}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed transition-colors text-xs font-semibold ${
            isDark
              ? "border-slate-800 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5"
              : "border-slate-300 text-slate-600 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Page
        </button>
      </div>
    </div>
  );
}
