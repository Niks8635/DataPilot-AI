"use client";

import React, { useState, useEffect } from "react";
import { 
  Wand2, 
  RotateCcw, 
  Eye, 
  Play, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  FileSpreadsheet, 
  Sparkles,
  Download,
  Trash2,
  RefreshCw,
  SlidersHorizontal
} from "lucide-react";
import { CleaningSuggestion, CleaningLogEntry, CleaningDiffPreview, DatasetProfile } from "@/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { CleaningSplitSlider } from "./CleaningSplitSlider";

interface CleaningStudioProps {
  datasetId: string;
  profile?: DatasetProfile | null;
  onCleaningComplete: () => void;
}

const OPERATION_OPTIONS = [
  { id: "trim_whitespace", label: "Trim Whitespace", category: "Text", desc: "Strip leading and trailing spaces" },
  { id: "collapse_whitespace", label: "Collapse Multiple Spaces", category: "Text", desc: "Convert duplicate spaces to a single space" },
  { id: "standardize_text", label: "Standardize Text Casing", category: "Text", desc: "Convert text to Lower, UPPER, or Title Case" },
  { id: "remove_special_chars", label: "Remove Special Characters", category: "Text", desc: "Strip symbols, emojis, and non-alphanumeric chars" },
  { id: "normalize_dates", label: "Normalize Dates to ISO", category: "Dates", desc: "Parse non-standard dates and format as YYYY-MM-DD" },
  { id: "impute_median", label: "Impute Missing with Median", category: "Missing", desc: "Fill nulls with median value (robust to outliers)" },
  { id: "impute_mean", label: "Impute Missing with Mean", category: "Missing", desc: "Fill nulls with arithmetic mean" },
  { id: "impute_mode", label: "Impute Missing with Mode", category: "Missing", desc: "Fill nulls with the most frequent value" },
  { id: "impute_constant", label: "Impute with Custom Value", category: "Missing", desc: "Replace missing cells with a constant label" },
  { id: "ffill", label: "Forward Fill (ffill)", category: "Missing", desc: "Propagate previous valid value forward" },
  { id: "bfill", label: "Backward Fill (bfill)", category: "Missing", desc: "Propagate next valid value backward" },
  { id: "drop_missing_rows", label: "Drop Rows with Missing Values", category: "Missing", desc: "Eliminate rows where specified column is null" },
  { id: "drop_duplicates", label: "Remove Duplicate Records", category: "Deduplication", desc: "Drop exact duplicate rows across all columns" },
  { id: "clip_outliers", label: "Cap Outliers to 1.5x IQR", category: "Outliers", desc: "Bound extreme numbers within statistical thresholds" },
  { id: "nullify_outliers", label: "Nullify Outliers", category: "Outliers", desc: "Set values beyond 1.5x IQR boundary to NULL" },
  { id: "drop_outlier_rows", label: "Drop Outlier Rows", category: "Outliers", desc: "Delete rows that contain extreme outliers" },
  { id: "cast_column_type", label: "Cast Column Data Type", category: "Schema", desc: "Convert column to numeric, integer, datetime, or text" },
  { id: "drop_column", label: "Drop Column", category: "Schema", desc: "Permanently delete an entire column" },
];

export function CleaningStudio({ datasetId, profile, onCleaningComplete }: CleaningStudioProps) {
  const [suggestions, setSuggestions] = useState<CleaningSuggestion[]>([]);
  const [history, setHistory] = useState<CleaningLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [reverting, setReverting] = useState(false);

  // Custom Operation Form state
  const [selectedOp, setSelectedOp] = useState(OPERATION_OPTIONS[0].id);
  const [selectedCol, setSelectedCol] = useState("");
  const [opParams, setOpParams] = useState<Record<string, any>>({});

  // Diff Preview Modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [diffPreview, setDiffPreview] = useState<CleaningDiffPreview | null>(null);

  const columns = profile?.columns?.map((c) => c.name) || [];

  const loadStudioData = async () => {
    try {
      setLoading(true);
      const [suggs, hist] = await Promise.all([
        api.datasets.cleaningSuggestions(datasetId),
        api.datasets.history(datasetId),
      ]);
      setSuggestions(suggs);
      setHistory(hist);
      if (columns.length > 0 && !selectedCol) {
        setSelectedCol(columns[0]);
      }
    } catch (err) {
      console.error("Failed to load cleaning studio data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudioData();
  }, [datasetId]);

  // Request interactive before/after diff preview
  const handleRequestPreview = async (action: { action_type: string; column?: string; params?: Record<string, any> }) => {
    try {
      setPreviewLoading(true);
      setPreviewOpen(true);
      const res = await api.datasets.previewClean(datasetId, action);
      setDiffPreview(res);
    } catch (err: any) {
      alert("Failed to compute cleaning preview: " + err.message);
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Apply previewed action
  const handleApplyPreviewed = async () => {
    if (!diffPreview) return;
    try {
      setExecuting(true);
      await api.datasets.clean(datasetId, [{
        action_type: diffPreview.operation_type,
        column: diffPreview.column,
        params: opParams
      }], `Applied ${diffPreview.operation_type} via Cleaning Studio`);
      setPreviewOpen(false);
      await loadStudioData();
      onCleaningComplete();
    } catch (err: any) {
      alert("Failed to apply cleaning operation: " + err.message);
    } finally {
      setExecuting(false);
    }
  };

  // Direct Apply Suggestion
  const handleApplySuggestion = async (sugg: CleaningSuggestion) => {
    await handleRequestPreview({
      action_type: sugg.action_type,
      column: sugg.column,
      params: sugg.suggested_params || {}
    });
  };

  // Revert version
  const handleRevertVersion = async (vNumber: number) => {
    if (!confirm(`Are you sure you want to revert dataset to version ${vNumber}?`)) return;
    try {
      setReverting(true);
      await api.datasets.revert(datasetId, vNumber);
      await loadStudioData();
      onCleaningComplete();
    } catch (err: any) {
      alert("Failed to revert version: " + err.message);
    } finally {
      setReverting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
        Loading Cleaning Studio...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Studio Banner & Metric Diff Overview */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <Wand2 className="w-4 h-4 text-blue-400" />
            Data Cleaning Studio
          </div>
          <h2 className="text-xl font-bold text-white">Interactive Transformation & Recipe Studio</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Test transformations with live before/after diff previews before committing. Changes are versioned non-destructively; raw files remain completely untouched.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {suggestions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleApplySuggestion(suggestions[0])}
              className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs shadow-xs"
              title="Compare dataset before and after top AI cleaning recommendation"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              Compare with Split Slider
            </Button>
          )}
          <a
            href={api.datasets.getExportUrl(datasetId, "csv", "current")}
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export Cleaned CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Operations Builder & AI Suggestions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Custom Operation Builder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Build Custom Transformation Operation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Operation Picker */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Select Cleaning Operation
                  </label>
                  <select
                    value={selectedOp}
                    onChange={(e) => setSelectedOp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {OPERATION_OPTIONS.map((op) => (
                      <option key={op.id} value={op.id}>
                        [{op.category}] {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Column Target */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Target Column
                  </label>
                  <select
                    value={selectedCol}
                    onChange={(e) => setSelectedCol(e.target.value)}
                    disabled={selectedOp === "drop_duplicates"}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  >
                    {selectedOp === "drop_duplicates" ? (
                      <option value="">All Columns (Whole Row Deduplication)</option>
                    ) : (
                      columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Dynamic Param Inputs */}
              {selectedOp === "standardize_text" && (
                <div className="flex items-center gap-3 text-xs text-slate-300 pt-1">
                  <span className="text-slate-400">Target Casing:</span>
                  {["title", "lower", "upper"].map((caseMode) => (
                    <label key={caseMode} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="casing"
                        value={caseMode}
                        checked={(opParams.casing || "title") === caseMode}
                        onChange={(e) => setOpParams({ ...opParams, casing: e.target.value })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="capitalize">{caseMode} Case</span>
                    </label>
                  ))}
                </div>
              )}

              {selectedOp === "impute_constant" && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Fill Constant Value:</label>
                  <input
                    type="text"
                    placeholder="e.g. Unknown, N/A, 0"
                    value={opParams.value || ""}
                    onChange={(e) => setOpParams({ ...opParams, value: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
              )}

              {selectedOp === "cast_column_type" && (
                <div className="flex items-center gap-3 text-xs text-slate-300 pt-1">
                  <span className="text-slate-400">Cast To:</span>
                  {["numeric", "integer", "datetime", "string"].map((typeMode) => (
                    <label key={typeMode} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="target_type"
                        value={typeMode}
                        checked={(opParams.target_type || "numeric") === typeMode}
                        onChange={(e) => setOpParams({ ...opParams, target_type: e.target.value })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="capitalize">{typeMode}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    handleRequestPreview({
                      action_type: selectedOp,
                      column: selectedOp === "drop_duplicates" ? undefined : selectedCol,
                      params: opParams
                    })
                  }
                  loading={previewLoading}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Preview Transformation Diff
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommended Cleaning Recipes */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              Automated Cleaning Recommendations ({suggestions.length})
            </h3>

            {suggestions.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800 text-xs text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                No critical anomalies detected. Dataset is in good health!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {suggestions.map((sugg) => (
                  <div
                    key={sugg.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4 transition hover:border-slate-700"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-100">{sugg.title}</span>
                        <Badge
                          variant={sugg.severity === "critical" ? "danger" : sugg.severity === "warning" ? "warning" : "default"}
                          className="text-[10px] uppercase font-mono"
                        >
                          {sugg.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">{sugg.description}</p>
                      <div className="text-[11px] text-blue-400 font-mono">{sugg.impact_estimate}</div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplySuggestion(sugg)}
                      loading={previewLoading}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                      Preview
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Version Audit Log & Revert Studio */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                Version History & Audit Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-6">
                  No transformations applied yet. Running on Version 1 (Original Upload).
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((h, idx) => (
                    <div
                      key={h.id || idx}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 capitalize">
                          {h.operation_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(h.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{h.summary}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {h.affected_rows} rows affected
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-slate-800">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs text-rose-400 hover:text-rose-300 border-rose-500/20 hover:border-rose-500/40"
                      onClick={() => handleRevertVersion(1)}
                      loading={reverting}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Revert to Original (v1)
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Before / After Transformation Split Slider Modal */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Interactive Transformation Split Slider Preview"
        maxWidth="4xl"
      >
        {diffPreview ? (
          <div className="space-y-4">
            {/* Header info */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Transformation:</span>
                  <span className="text-blue-400 capitalize font-mono font-bold">
                    {diffPreview.operation_type.replace(/_/g, " ")}
                  </span>
                  {diffPreview.column && (
                    <span className="text-slate-400 font-normal">
                      on column <code className="text-cyan-300 font-mono font-bold">{diffPreview.column}</code>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{diffPreview.summary}</p>
              </div>
              <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30 font-mono shrink-0">
                AST Sandbox Verified
              </Badge>
            </div>

            {/* Split Slider Component */}
            <CleaningSplitSlider
              sampleBefore={diffPreview.sample_before}
              sampleAfter={diffPreview.sample_after}
              changedCells={diffPreview.changed_cells}
              metricsDiff={diffPreview.metrics_diff}
              operationName={diffPreview.operation_type}
              columnName={diffPreview.column}
            />

            {/* Action Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleApplyPreviewed} loading={executing}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Apply Transformation & Save New Version
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            Computing interactive before and after transformation diff...
          </div>
        )}
      </Modal>
    </div>
  );
}
