"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Check, 
  Trash2, 
  Wand2, 
  History, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import { CleaningSuggestion, CleaningLogEntry } from "@/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface CleanerModalProps {
  datasetId: string;
  onCleaningComplete: () => void;
}

export function CleanerModal({ datasetId, onCleaningComplete }: CleanerModalProps) {
  const [suggestions, setSuggestions] = useState<CleaningSuggestion[]>([]);
  const [history, setHistory] = useState<CleaningLogEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const loadSuggestionsAndHistory = async () => {
    try {
      setLoading(true);
      const [suggs, hist] = await Promise.all([
        api.datasets.cleaningSuggestions(datasetId),
        api.datasets.history(datasetId),
      ]);
      setSuggestions(suggs);
      setHistory(hist);
      // Select all by default
      setSelectedIds(suggs.map((s) => s.id));
    } catch (err) {
      console.error("Failed to load cleaning data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestionsAndHistory();
  }, [datasetId]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleApply = async (all = false) => {
    const targetSuggestions = all
      ? suggestions
      : suggestions.filter((s) => selectedIds.includes(s.id));

    if (targetSuggestions.length === 0) return;

    try {
      setApplying(true);
      const actions = targetSuggestions.map((s) => ({
        action_type: s.action_type,
        column: s.column,
        params: s.suggested_params,
      }));

      const res = await api.datasets.clean(datasetId, actions);
      setResultMessage(res.message);
      await loadSuggestionsAndHistory();
      onCleaningComplete();
    } catch (err: any) {
      alert(err.message || "Failed to apply cleaning operations");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Suggestions Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              <Wand2 className="w-4 h-4 text-blue-400" />
              Automated Cleaning Recommendations ({suggestions.length})
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Select operations to optimize dataset completeness and integrity. Original data is always backed up.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={suggestions.length === 0 || applying}
              onClick={() => setSelectedIds(suggestions.map((s) => s.id))}
            >
              Select All
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={applying}
              disabled={selectedIds.length === 0}
              onClick={() => handleApply(false)}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Apply Selected ({selectedIds.length})
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {resultMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{resultMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Analyzing dataset for cleaning opportunities...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-12 text-center text-xs text-emerald-400 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              <span>No pending cleaning actions! Dataset is clean and ready.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {suggestions.map((s) => {
                const isSelected = selectedIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleSelect(s.id)}
                    className={`py-4 px-3 rounded-xl cursor-pointer transition flex items-start justify-between gap-4 ${
                      isSelected ? "bg-blue-600/10 border border-blue-500/20" : "hover:bg-slate-900/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 border transition ${
                          isSelected
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "border-slate-700 bg-slate-950"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                          {s.title}
                          <Badge variant={s.severity === "critical" ? "danger" : s.severity === "warning" ? "warning" : "info"}>
                            {s.impact_estimate}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {s.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {s.action_type}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit History Log */}
      <Card>
        <CardHeader>
          <CardTitle>
            <History className="w-4 h-4 text-purple-400" />
            Cleaning Operations Audit History ({history.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No cleaning transformations have been applied to this dataset yet.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {history.map((h, idx) => (
                <div key={h.id} className="relative flex items-start justify-between gap-4 text-xs">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-950" />
                  <div>
                    <div className="font-semibold text-slate-200">{h.summary}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-purple-400">{h.operation_type}</span>
                      <span>•</span>
                      <span>{new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <Badge variant="default" className="text-[10px]">
                    {h.affected_rows} rows affected
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
