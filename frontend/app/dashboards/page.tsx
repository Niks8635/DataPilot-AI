"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Plus, 
  Save, 
  Sun, 
  Moon, 
  Sparkles, 
  Copy, 
  Trash2, 
  RotateCcw, 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  Database, 
  Layers, 
  Edit3, 
  Check, 
  CheckCircle2, 
  FilePlus 
} from "lucide-react";
import { Dashboard, DashboardWidget, Dataset, DatasetProfile, DashboardPage } from "@/types";
import { api } from "@/lib/api";
import { DEMO_DATASETS, getDemoDashboard, getDemoProfile, getDemoRows } from "@/lib/demoDatasets";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DynamicChart } from "@/components/charts/DynamicChart";
import { PageTabBar } from "@/components/dashboard/PageTabBar";
import { ActiveFilterBanner } from "@/components/dashboard/ActiveFilterBanner";
import { SlicerWidget } from "@/components/dashboard/SlicerWidget";
import { DateFilterWidget } from "@/components/dashboard/DateFilterWidget";
import { TableWidget } from "@/components/dashboard/TableWidget";
import { WidgetContainer } from "@/components/dashboard/WidgetContainer";
import { WidgetFormatModal } from "@/components/dashboard/WidgetFormatModal";
import { AddWidgetModal } from "@/components/dashboard/AddWidgetModal";
import { 
  applyFilters, 
  computeGroupedData, 
  computeMetric, 
  formatMetricValue, 
  getUniqueValues, 
  ActiveFilters, 
  ActiveDateFilter 
} from "@/lib/crossFilter";

function DashboardsStudio() {
  const searchParams = useSearchParams();
  const datasetIdParam = searchParams.get("datasetId");

  const initialTargetId = datasetIdParam || "demo-ds-sales";
  const [datasets, setDatasets] = useState<Dataset[]>(DEMO_DATASETS);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(initialTargetId);
  const [profile, setProfile] = useState<DatasetProfile | null>(getDemoProfile(initialTargetId));
  const [rawRows, setRawRows] = useState<Record<string, any>[]>(getDemoRows(initialTargetId));

  const [dashboardsList, setDashboardsList] = useState<Dashboard[]>([getDemoDashboard(initialTargetId)]);
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(getDemoDashboard(initialTargetId));

  // Studio UI state
  const [activePageId, setActivePageId] = useState<string>("page_1");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cross-filtering state
  const [categoricalFilters, setCategoricalFilters] = useState<ActiveFilters>({});
  const [dateFilter, setDateFilter] = useState<ActiveDateFilter>({ preset: "all" });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Editable Dashboard Title
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [dashTitleInput, setDashTitleInput] = useState("");

  // 1. Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const list = await api.datasets.list();
        setDatasets(list);

        let targetId = datasetIdParam;
        if (!targetId && list.length > 0) {
          targetId = list[0].id;
        }

        if (targetId) {
          setSelectedDatasetId(targetId);
          await loadDatasetDashboards(targetId);
        }
      } catch (err) {
        console.error("Failed to load dashboards data", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [datasetIdParam]);

  const loadDatasetDashboards = async (datasetId: string) => {
    try {
      const [allDash, prof, previewRes] = await Promise.all([
        api.dashboards.listAllForDataset(datasetId),
        api.datasets.profile(datasetId),
        api.datasets.preview(datasetId, 1, 200),
      ]);

      setDashboardsList(allDash);
      setProfile(prof);
      setRawRows(previewRes.rows || []);

      if (allDash.length > 0) {
        selectDashboard(allDash[0]);
      } else {
        // Create or get default auto dashboard
        const autoDash = await api.dashboards.getForDataset(datasetId);
        setDashboardsList([autoDash]);
        selectDashboard(autoDash);
      }
    } catch (e) {
      console.error("Error loading dashboard details", e);
    }
  };

  const selectDashboard = (d: Dashboard) => {
    setCurrentDashboard(d);
    setDashTitleInput(d.title);
    setIsDirty(false);

    const layout = d.layout_config;
    if (layout) {
      setTheme((layout.theme as any) || "dark");
      if (layout.pages && layout.pages.length > 0) {
        const pId = layout.active_page_id || layout.pages[0].id;
        setActivePageId(pId);
      }
    } else {
      setActivePageId("page_1");
    }
    // Clear cross-filters on dashboard switch
    setCategoricalFilters({});
    setDateFilter({ preset: "all" });
  };

  const handleDatasetChange = async (newId: string) => {
    setSelectedDatasetId(newId);
    setLoading(true);
    try {
      await loadDatasetDashboards(newId);
    } finally {
      setLoading(false);
    }
  };

  // 2. Real-time Filtered Records
  const filteredRows = useMemo(() => {
    return applyFilters(rawRows, categoricalFilters, dateFilter);
  }, [rawRows, categoricalFilters, dateFilter]);

  // 3. Current Page & Page Widgets
  const pages: DashboardPage[] = useMemo(() => {
    if (currentDashboard?.layout_config?.pages && currentDashboard.layout_config.pages.length > 0) {
      return currentDashboard.layout_config.pages;
    }
    return [
      {
        id: "page_1",
        title: "Executive Overview",
        description: "Primary performance metrics",
        widget_ids: currentDashboard?.widgets?.map((w) => w.id) || [],
      },
    ];
  }, [currentDashboard]);

  const activePage = useMemo(() => {
    return pages.find((p) => p.id === activePageId) || pages[0];
  }, [pages, activePageId]);

  const pageWidgets = useMemo(() => {
    if (!currentDashboard || !activePage) return [];
    const ids = activePage.widget_ids || [];
    // If widget_ids specified on page, filter by them; otherwise fallback to widget.page_id
    if (ids.length > 0) {
      return ids
        .map((wid) => currentDashboard.widgets.find((w) => w.id === wid))
        .filter((w): w is DashboardWidget => Boolean(w));
    }
    return currentDashboard.widgets.filter((w) => (w.page_id || "page_1") === activePage.id);
  }, [currentDashboard, activePage]);

  // 4. Cross-Filtering Callbacks
  const handleToggleCategoryFilter = (col: string, val: string, multi = true) => {
    setCategoricalFilters((prev) => {
      const existing = prev[col] || [];
      const isAlready = existing.some(
        (v) => String(v).trim().toLowerCase() === String(val).trim().toLowerCase()
      );

      if (isAlready) {
        const next = existing.filter(
          (v) => String(v).trim().toLowerCase() !== String(val).trim().toLowerCase()
        );
        if (next.length === 0) {
          const copy = { ...prev };
          delete copy[col];
          return copy;
        }
        return { ...prev, [col]: next };
      } else {
        return { ...prev, [col]: multi ? [...existing, val] : [val] };
      }
    });
  };

  const handleRemoveCategoryFilter = (col: string, val: string) => {
    setCategoricalFilters((prev) => {
      const existing = prev[col] || [];
      const next = existing.filter(
        (v) => String(v).trim().toLowerCase() !== String(val).trim().toLowerCase()
      );
      if (next.length === 0) {
        const copy = { ...prev };
        delete copy[col];
        return copy;
      }
      return { ...prev, [col]: next };
    });
  };

  const handleClearColumnFilter = (col: string) => {
    setCategoricalFilters((prev) => {
      const copy = { ...prev };
      delete copy[col];
      return copy;
    });
  };

  const handleClearAllFilters = () => {
    setCategoricalFilters({});
    setDateFilter({ preset: "all" });
  };

  // 5. Page Management
  const handleAddPage = () => {
    if (!currentDashboard) return;
    const newPageId = `page_${Date.now()}`;
    const newPage: DashboardPage = {
      id: newPageId,
      title: `Page ${pages.length + 1}`,
      description: "Custom analysis view",
      widget_ids: [],
    };

    const updatedPages = [...pages, newPage];
    const updatedDashboard: Dashboard = {
      ...currentDashboard,
      layout_config: {
        theme,
        active_page_id: newPageId,
        pages: updatedPages,
      },
    };

    setCurrentDashboard(updatedDashboard);
    setActivePageId(newPageId);
    setIsDirty(true);
  };

  const handleRenamePage = (pageId: string, newTitle: string) => {
    if (!currentDashboard) return;
    const updatedPages = pages.map((p) => (p.id === pageId ? { ...p, title: newTitle } : p));
    setCurrentDashboard({
      ...currentDashboard,
      layout_config: {
        theme,
        active_page_id: activePageId,
        pages: updatedPages,
      },
    });
    setIsDirty(true);
  };

  const handleDuplicatePage = (pageId: string) => {
    if (!currentDashboard) return;
    const sourcePage = pages.find((p) => p.id === pageId);
    if (!sourcePage) return;

    const newPageId = `page_${Date.now()}`;
    // Clone widgets for new page
    const clonedWidgets: DashboardWidget[] = [];
    const newWidgetIds: string[] = [];

    (sourcePage.widget_ids || []).forEach((wid) => {
      const orig = currentDashboard.widgets.find((w) => w.id === wid);
      if (orig) {
        const newId = `w_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        clonedWidgets.push({ ...orig, id: newId, page_id: newPageId });
        newWidgetIds.push(newId);
      }
    });

    const newPage: DashboardPage = {
      id: newPageId,
      title: `Copy of ${sourcePage.title}`,
      description: sourcePage.description,
      widget_ids: newWidgetIds,
    };

    setCurrentDashboard({
      ...currentDashboard,
      widgets: [...currentDashboard.widgets, ...clonedWidgets],
      layout_config: {
        theme,
        active_page_id: newPageId,
        pages: [...pages, newPage],
      },
    });
    setActivePageId(newPageId);
    setIsDirty(true);
  };

  const handleDeletePage = (pageId: string) => {
    if (!currentDashboard || pages.length <= 1) return;
    const pageToDelete = pages.find((p) => p.id === pageId);
    const updatedPages = pages.filter((p) => p.id !== pageId);
    const remainingWidgets = currentDashboard.widgets.filter(
      (w) => !(pageToDelete?.widget_ids || []).includes(w.id)
    );

    const nextActive = updatedPages[0].id;
    setCurrentDashboard({
      ...currentDashboard,
      widgets: remainingWidgets,
      layout_config: {
        theme,
        active_page_id: nextActive,
        pages: updatedPages,
      },
    });
    setActivePageId(nextActive);
    setIsDirty(true);
  };

  // 6. Widget Reordering & Sizing
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex || !currentDashboard) return;

    const currentWidgetIds = [...(activePage.widget_ids || [])];
    const [movedId] = currentWidgetIds.splice(draggedIndex, 1);
    currentWidgetIds.splice(targetIndex, 0, movedId);

    const updatedPages = pages.map((p) =>
      p.id === activePage.id ? { ...p, widget_ids: currentWidgetIds } : p
    );

    setCurrentDashboard({
      ...currentDashboard,
      layout_config: {
        theme,
        active_page_id: activePage.id,
        pages: updatedPages,
      },
    });
    setDraggedIndex(null);
    setIsDirty(true);
  };

  const handleResizeWidth = (widgetId: string, newW: number) => {
    if (!currentDashboard) return;
    const updated = currentDashboard.widgets.map((w) =>
      w.id === widgetId ? { ...w, grid_w: newW } : w
    );
    setCurrentDashboard({ ...currentDashboard, widgets: updated });
    setIsDirty(true);
  };

  const handleResizeHeight = (widgetId: string, newH: number) => {
    if (!currentDashboard) return;
    const updated = currentDashboard.widgets.map((w) =>
      w.id === widgetId ? { ...w, grid_h: newH } : w
    );
    setCurrentDashboard({ ...currentDashboard, widgets: updated });
    setIsDirty(true);
  };

  const handleDeleteWidget = (widgetId: string) => {
    if (!currentDashboard) return;
    const updatedWidgets = currentDashboard.widgets.filter((w) => w.id !== widgetId);
    const updatedPages = pages.map((p) => ({
      ...p,
      widget_ids: (p.widget_ids || []).filter((id) => id !== widgetId),
    }));

    setCurrentDashboard({
      ...currentDashboard,
      widgets: updatedWidgets,
      layout_config: {
        theme,
        active_page_id: activePageId,
        pages: updatedPages,
      },
    });
    setIsDirty(true);
  };

  const handleDuplicateWidget = (widget: DashboardWidget) => {
    if (!currentDashboard) return;
    const newId = `w_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const cloned: DashboardWidget = {
      ...widget,
      id: newId,
      title: `Copy of ${widget.title}`,
    };

    const updatedPages = pages.map((p) =>
      p.id === activePage.id ? { ...p, widget_ids: [...(p.widget_ids || []), newId] } : p
    );

    setCurrentDashboard({
      ...currentDashboard,
      widgets: [...currentDashboard.widgets, cloned],
      layout_config: {
        theme,
        active_page_id: activePageId,
        pages: updatedPages,
      },
    });
    setIsDirty(true);
  };

  const handleAddWidget = (newWidget: DashboardWidget) => {
    if (!currentDashboard) return;
    const updatedPages = pages.map((p) =>
      p.id === activePage.id ? { ...p, widget_ids: [...(p.widget_ids || []), newWidget.id] } : p
    );

    setCurrentDashboard({
      ...currentDashboard,
      widgets: [...currentDashboard.widgets, newWidget],
      layout_config: {
        theme,
        active_page_id: activePageId,
        pages: updatedPages,
      },
    });
    setIsDirty(true);
  };

  const handleSaveFormattedWidget = (updatedWidget: DashboardWidget) => {
    if (!currentDashboard) return;
    const updatedWidgets = currentDashboard.widgets.map((w) =>
      w.id === updatedWidget.id ? updatedWidget : w
    );
    setCurrentDashboard({
      ...currentDashboard,
      widgets: updatedWidgets,
    });
    setIsDirty(true);
  };

  // 7. Save Layout to Backend
  const handleSaveLayout = async () => {
    if (!currentDashboard) return;
    try {
      setIsSaving(true);
      const layoutPayload = {
        theme,
        active_page_id: activePageId,
        pages,
      };

      const updated = await api.dashboards.update(currentDashboard.id, {
        title: dashTitleInput || currentDashboard.title,
        layout_config: layoutPayload,
        widgets: currentDashboard.widgets,
      });

      setCurrentDashboard(updated);
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error("Failed to save dashboard layout", e);
      alert("Error saving dashboard layout. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // 8. Create New Custom Dashboard
  const handleCreateNewDashboard = async () => {
    if (!selectedDatasetId) return;
    try {
      setLoading(true);
      const newDash = await api.dashboards.create({
        dataset_id: selectedDatasetId,
        title: `Custom Dashboard ${dashboardsList.length + 1}`,
        description: "Custom user-built analytics layout",
        layout_config: {
          theme,
          active_page_id: "page_1",
          pages: [
            {
              id: "page_1",
              title: "Page 1",
              description: "",
              widget_ids: [],
            },
          ],
        },
        widgets: [],
      });

      setDashboardsList([newDash, ...dashboardsList]);
      selectDashboard(newDash);
    } catch (e) {
      console.error("Failed to create dashboard", e);
    } finally {
      setLoading(false);
    }
  };

  // 9. Duplicate Dashboard
  const handleDuplicateDashboard = async () => {
    if (!currentDashboard) return;
    try {
      setLoading(true);
      const dup = await api.dashboards.duplicate(currentDashboard.id);
      setDashboardsList([dup, ...dashboardsList]);
      selectDashboard(dup);
    } catch (e) {
      console.error("Failed to duplicate dashboard", e);
    } finally {
      setLoading(false);
    }
  };

  // 10. Delete Dashboard
  const handleDeleteDashboard = async () => {
    if (!currentDashboard || currentDashboard.is_default) return;
    if (!confirm(`Are you sure you want to delete dashboard "${currentDashboard.title}"?`)) return;

    try {
      setLoading(true);
      await api.dashboards.delete(currentDashboard.id);
      const remaining = dashboardsList.filter((d) => d.id !== currentDashboard.id);
      setDashboardsList(remaining);
      if (remaining.length > 0) {
        selectDashboard(remaining[0]);
      } else {
        await handleDatasetChange(selectedDatasetId);
      }
    } catch (e) {
      console.error("Failed to delete dashboard", e);
    } finally {
      setLoading(false);
    }
  };

  // 11. Regenerate Full Auto Dashboard
  const handleRegenerateAutoDashboard = async () => {
    if (!selectedDatasetId) return;
    if (!confirm("Regenerate default dashboard with auto-detected KPIs, dimension slicers, charts, and summary table?")) return;
    try {
      setLoading(true);
      const regenerated = await api.dashboards.regenerate(selectedDatasetId);
      const nextList = dashboardsList.map((d) => (d.id === regenerated.id ? regenerated : d));
      if (!nextList.some((d) => d.id === regenerated.id)) {
        nextList.unshift(regenerated);
      }
      setDashboardsList(nextList);
      selectDashboard(regenerated);
    } catch (e) {
      console.error("Failed to regenerate dashboard", e);
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`flex min-h-screen transition-colors duration-200 ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"
      }`}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="p-6 space-y-5 max-w-[1600px] w-full mx-auto">
          {/* Top Bar: Dataset, Dashboard Selector, Title, Actions */}
          <div
            className={`p-4 rounded-2xl border transition-colors ${
              isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Title & Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <LayoutDashboard className="w-4 h-4 text-violet-400" />
                  <span className="font-semibold uppercase tracking-wider text-slate-400">Dashboards & Visual Analytics</span>
                  {currentDashboard?.is_default && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-violet-500/15 text-violet-300 border border-violet-500/25 font-medium font-mono">
                      Auto-Generated
                    </span>
                  )}
                  {isDirty && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/25 animate-pulse font-medium">
                      Unsaved Changes
                    </span>
                  )}
                </div>

                {isEditingTitle ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={dashTitleInput}
                      onChange={(e) => {
                        setDashTitleInput(e.target.value);
                        setIsDirty(true);
                      }}
                      onBlur={() => setIsEditingTitle(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setIsEditingTitle(false);
                      }}
                      autoFocus
                      className={`text-xl font-bold px-2 py-0.5 rounded outline-none border ${
                        isDark
                          ? "bg-slate-950 border-violet-500 text-white"
                          : "bg-slate-50 border-violet-500 text-slate-900"
                      }`}
                    />
                    <button
                      onClick={() => setIsEditingTitle(false)}
                      className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <h1
                    onClick={() => setIsEditingTitle(true)}
                    title="Click to rename dashboard"
                    className={`text-xl font-bold tracking-tight cursor-pointer hover:underline flex items-center gap-2 ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {dashTitleInput || currentDashboard?.title || "Interactive Dashboard"}
                    <Edit3 className="w-3.5 h-3.5 text-slate-500 opacity-60" />
                  </h1>
                )}
              </div>

              {/* Selectors & Studio Controls */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Dataset Selector */}
                {datasets.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500 font-medium hidden sm:inline">Dataset:</span>
                    <select
                      value={selectedDatasetId}
                      onChange={(e) => handleDatasetChange(e.target.value)}
                      className={`border text-xs rounded-lg px-2.5 py-1.5 font-medium outline-none ${
                        isDark
                          ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-violet-500"
                          : "bg-slate-50 border-slate-300 text-slate-900 focus:border-violet-500"
                      }`}
                    >
                      {datasets.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.row_count.toLocaleString()} rows)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Dashboard Switcher Dropdown */}
                {dashboardsList.length > 1 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500 font-medium hidden sm:inline">Layout:</span>
                    <select
                      value={currentDashboard?.id || ""}
                      onChange={(e) => {
                        const d = dashboardsList.find((x) => x.id === e.target.value);
                        if (d) selectDashboard(d);
                      }}
                      className={`border text-xs rounded-lg px-2.5 py-1.5 font-medium outline-none ${
                        isDark
                          ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-violet-500"
                          : "bg-slate-50 border-slate-300 text-slate-900 focus:border-violet-500"
                      }`}
                    >
                      {dashboardsList.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title} {d.is_default ? "(Default)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Dashboard Actions */}
                <Button
                  variant="luxury"
                  size="sm"
                  onClick={handleCreateNewDashboard}
                  className="gap-1 text-xs"
                  title="Create a new custom dashboard layout"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Dashboard</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDuplicateDashboard}
                  className="gap-1 text-xs hover:border-violet-500/40"
                  title="Duplicate current dashboard"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Duplicate</span>
                </Button>

                {currentDashboard && !currentDashboard.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteDashboard}
                    className="text-red-400 hover:text-red-300 hover:border-red-500/40 text-xs"
                    title="Delete custom dashboard"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Builder Studio Action Toolbar */}
          <div
            className={`px-4 py-3 rounded-2xl border flex items-center justify-between gap-3 flex-wrap transition-colors ${
              isDark ? "bg-slate-900/70 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {/* Customize Mode Switcher */}
              <Button
                variant={isCustomizeMode ? "primary" : "outline"}
                size="sm"
                onClick={() => setIsCustomizeMode(!isCustomizeMode)}
                className="gap-1.5 text-xs font-semibold shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isCustomizeMode ? "Done Customizing" : "Customize Dashboard"}
              </Button>

              {/* Add Widget Button (enabled in customize mode or accessible directly) */}
              {isCustomizeMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  className="gap-1.5 text-xs border-violet-500/40 text-violet-300 hover:bg-violet-500/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Widget
                </Button>
              )}

              {/* Regenerate Auto-Dashboard Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateAutoDashboard}
                className="gap-1.5 text-xs text-slate-300 hover:text-white"
                title="Regenerate full auto dashboard with detected KPIs, slicers, charts, and table"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Regenerate Auto-Dashboard</span>
              </Button>

              <span className="text-slate-500 text-xs hidden sm:inline">|</span>

              {/* Theme Switcher Toggle */}
              <button
                onClick={() => {
                  const newTheme = theme === "dark" ? "light" : "dark";
                  setTheme(newTheme);
                  setIsDirty(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  isDark
                    ? "bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
                    : "bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900"
                }`}
                title={`Switch to ${theme === "dark" ? "Light" : "Dark"} theme`}
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-violet-500" />
                    <span>Light Mode</span>
                  </>
                )}
              </button>
            </div>

            {/* Save Layout Button & Status */}
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Layout Saved!
                </span>
              )}

              {isCustomizeMode && (
                <Button
                  variant={isDirty ? "primary" : "outline"}
                  size="sm"
                  onClick={handleSaveLayout}
                  disabled={isSaving}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? "Saving..." : isDirty ? "Save Layout *" : "Saved"}
                </Button>
              )}
            </div>
          </div>

          {/* Multi-Page Tab Bar */}
          <div className="rounded-2xl border overflow-hidden border-slate-800/80 shadow-sm">
            <PageTabBar
              pages={pages}
              activePageId={activePageId}
              theme={theme}
              onSelectPage={(pId) => setActivePageId(pId)}
              onAddPage={handleAddPage}
              onRenamePage={handleRenamePage}
              onDuplicatePage={handleDuplicatePage}
              onDeletePage={handleDeletePage}
            />

            {/* Active Filters Indicator Banner */}
            <div className="p-3 bg-slate-950/40">
              <ActiveFilterBanner
                categoricalFilters={categoricalFilters}
                dateFilter={dateFilter}
                theme={theme}
                onRemoveCategoryFilter={handleRemoveCategoryFilter}
                onClearDateFilter={() => setDateFilter({ preset: "all" })}
                onClearAll={handleClearAllFilters}
              />
            </div>

            {/* Canvas Area */}
            <div className="p-4 sm:p-6 min-h-[500px]">
              {loading ? (
                <div className="p-20 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Rendering dashboard studio canvas...
                </div>
              ) : pageWidgets.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-slate-800/80 rounded-2xl">
                  <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                    This page has no widgets yet
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Click "Add Widget" to add custom KPI cards, charts, data tables, or dimension slicers.
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsAddModalOpen(true)}
                    className="mt-4 gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Widget
                  </Button>
                </div>
              ) : (
                /* 12-Column Responsive Drag & Drop Grid */
                <div className="grid grid-cols-12 gap-4">
                  {pageWidgets.map((widget, idx) => {
                    return (
                      <WidgetContainer
                        key={widget.id}
                        widget={widget}
                        index={idx}
                        theme={theme}
                        isCustomizeMode={isCustomizeMode}
                        onFormat={(w) => setEditingWidget(w)}
                        onDuplicate={handleDuplicateWidget}
                        onDelete={handleDeleteWidget}
                        onResizeWidth={handleResizeWidth}
                        onResizeHeight={handleResizeHeight}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      >
                        {/* 1. KPI Widget */}
                        {widget.widget_type === "kpi" && (
                          <div className="flex flex-col justify-between h-full">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                {widget.title}
                              </span>
                              <div className="p-1.5 rounded-lg bg-slate-800/60 text-blue-400">
                                <TrendingUp className="w-4 h-4" />
                              </div>
                            </div>
                            <div className="my-auto">
                              <div
                                className={`text-3xl font-bold tracking-tight ${
                                  isDark ? "text-white" : "text-slate-900"
                                }`}
                              >
                                {widget.chart_config?.x_axis_title
                                  ? formatMetricValue(
                                      computeMetric(filteredRows, widget.chart_config.x_axis_title, "sum")
                                    )
                                  : widget.kpi_data?.formatted_value || "—"}
                              </div>
                              {widget.subtitle && (
                                <p className="text-xs text-slate-500 mt-1">{widget.subtitle}</p>
                              )}
                            </div>
                            {categoricalFilters && Object.keys(categoricalFilters).length > 0 && (
                              <div className="text-[10px] text-blue-400 mt-2 font-mono flex items-center gap-1">
                                <span>Filtered: {filteredRows.length.toLocaleString()} records</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. Chart Widget */}
                        {widget.widget_type === "chart" && widget.chart_config && (
                          <div className="flex flex-col h-full">
                            {/* Dynamically recompute grouped series if raw rows present */}
                            {(() => {
                              const x = widget.chart_config.x_axis_title;
                              const y = widget.chart_config.y_axis_title;
                              let chartConf = widget.chart_config;

                              if (x && y && filteredRows.length > 0) {
                                const dynamicGroup = computeGroupedData(filteredRows, x, y, "sum", 12);
                                chartConf = {
                                  ...widget.chart_config,
                                  x_data: dynamicGroup.map((g) => g.name),
                                  y_data: dynamicGroup.map((g) => g.value),
                                };
                              }

                              return (
                                <DynamicChart
                                  config={chartConf}
                                  height={widget.grid_h === 2 ? 140 : widget.grid_h === 4 ? 260 : 380}
                                  color_palette={widget.color_palette || "blue"}
                                  theme={theme}
                                  activeFilterValue={
                                    x && categoricalFilters[x] ? categoricalFilters[x][0] : undefined
                                  }
                                  onPointClick={(categoryName) => {
                                    if (x) {
                                      handleToggleCategoryFilter(x, categoryName);
                                    }
                                  }}
                                />
                              );
                            })()}
                          </div>
                        )}

                        {/* 3. Table Widget */}
                        {widget.widget_type === "table" && (
                          <TableWidget
                            title={widget.title}
                            config={widget.table_config || { columns: [], page_size: 5, show_totals: true }}
                            rows={filteredRows}
                            theme={theme}
                            onRowClick={(row) => {
                              // Cross-filter on first categorical column
                              const firstKey = Object.keys(row)[0];
                              if (firstKey) {
                                handleToggleCategoryFilter(firstKey, String(row[firstKey]));
                              }
                            }}
                          />
                        )}

                        {/* 4. Categorical Slicer Widget */}
                        {widget.widget_type === "slicer" && widget.slicer_config && (
                          <SlicerWidget
                            title={widget.title}
                            config={widget.slicer_config}
                            availableValues={getUniqueValues(rawRows, widget.slicer_config.column)}
                            selectedValues={categoricalFilters[widget.slicer_config.column] || []}
                            theme={theme}
                            onToggleValue={(col, val, multi) =>
                              handleToggleCategoryFilter(col, val, multi)
                            }
                            onClear={(col) => handleClearColumnFilter(col)}
                          />
                        )}

                        {/* 5. Date Filter Widget */}
                        {widget.widget_type === "date_filter" && widget.date_filter_config && (
                          <DateFilterWidget
                            title={widget.title}
                            config={widget.date_filter_config}
                            currentFilter={dateFilter}
                            theme={theme}
                            onSelectPreset={(preset) =>
                              setDateFilter({
                                date_col: widget.date_filter_config?.date_col,
                                preset,
                              })
                            }
                            onCustomDates={(start, end) =>
                              setDateFilter({
                                date_col: widget.date_filter_config?.date_col,
                                preset: "custom",
                                start_date: start,
                                end_date: end,
                              })
                            }
                            onClear={() => setDateFilter({ preset: "all" })}
                          />
                        )}
                      </WidgetContainer>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add Widget Modal */}
      <AddWidgetModal
        isOpen={isAddModalOpen}
        pageId={activePageId}
        profile={profile}
        rows={rawRows}
        theme={theme}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddWidget}
      />

      {/* Format / Customize Inspector Modal */}
      <WidgetFormatModal
        isOpen={Boolean(editingWidget)}
        widget={editingWidget}
        profile={profile}
        theme={theme}
        onClose={() => setEditingWidget(null)}
        onSave={handleSaveFormattedWidget}
      />
    </div>
  );
}

export default function DashboardsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-slate-950 items-center justify-center text-xs text-slate-400">
          Loading Advanced Dashboard Studio...
        </div>
      }
    >
      <DashboardsStudio />
    </Suspense>
  );
}
