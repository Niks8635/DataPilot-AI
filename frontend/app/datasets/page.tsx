"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Database, 
  Plus, 
  Sparkles, 
  Trash2, 
  ExternalLink, 
  Download, 
  Clock, 
  FileSpreadsheet, 
  Layers,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { Dataset } from "@/types";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { UploadModal } from "@/components/datasets/UploadModal";
import { formatBytes } from "@/lib/utils";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const [list, rels] = await Promise.all([
        api.datasets.list(),
        api.relationships.get().catch(() => []),
      ]);
      setDatasets(list);
      setRelationships(rels);
    } catch (err) {
      console.error("Failed to load datasets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this dataset?")) {
      try {
        await api.datasets.delete(id);
        setDatasets((prev) => prev.filter((d) => d.id !== id));
      } catch (err: any) {
        alert(err.message || "Failed to delete");
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar onOpenUpload={() => setUploadOpen(true)} />

        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <Database className="w-6 h-6 text-cyan-400" />
                Datasets Catalog
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Manage your raw and cleaned analytical datasets. Click any dataset to launch automated profiling, cleaning, and visual analytics.
              </p>
            </div>

            <Button onClick={() => setUploadOpen(true)} size="sm" variant="luxury">
              <Plus className="w-4 h-4 mr-1.5" />
              Upload Dataset
            </Button>
          </div>

          {/* Multi-Dataset Relationships Alert */}
          {relationships.length > 0 && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-violet-950/40 to-slate-900/90 border border-violet-800/40 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    Multi-Dataset Relationship Detected ({relationships.length})
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {relationships[0].recommendation} ({relationships[0].overlap_count} overlapping keys detected with {relationships[0].overlap_percentage}% match).
                  </p>
                </div>
              </div>
              <Badge variant="purple" className="shrink-0">
                Auto Detected
              </Badge>
            </div>
          )}

          {/* Datasets Grid */}
          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400">Loading datasets...</div>
          ) : datasets.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/10 text-cyan-400 flex items-center justify-center">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">No datasets uploaded yet</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Upload your CSV, XLSX, JSON, or Parquet file, or try our sample sales dataset to explore DataPilot AI.
              </p>
              <div className="flex items-center gap-3 mt-2">
                <Button size="sm" variant="luxury" onClick={() => setUploadOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Upload Data
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {datasets.map((ds) => {
                const isDemo = ds.id.startsWith("demo-ds-");
                return (
                  <Link
                    key={ds.id}
                    href={`/datasets/${ds.id}`}
                    className="group block rounded-2xl border border-white/[0.08] bg-slate-900/60 hover:bg-slate-900 hover:border-cyan-500/40 transition p-5 flex flex-col justify-between shadow-lg relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
                            {ds.file_type} • v{ds.current_version}
                          </span>
                          {isDemo && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-violet-500/15 text-violet-300 border border-violet-500/30 font-medium flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-violet-400" />
                              Interactive Demo
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => handleDelete(ds.id, e)}
                          className="text-slate-500 hover:text-rose-400 transition p-1 rounded hover:bg-slate-800"
                          title="Reset dataset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition tracking-tight">
                        {ds.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 font-mono text-[11px] truncate">
                        {ds.original_filename}
                      </p>

                      {/* Related Fields Summary */}
                      <div className="mt-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] font-mono space-y-1">
                        <div className="text-slate-500 text-[10px] uppercase font-semibold">Key Fields & Metrics:</div>
                        <div className="text-slate-300 text-[11px] truncate">
                          {ds.id === "demo-ds-sales" && "Revenue, Units Sold, Margin, Region, Rating, Discount"}
                          {ds.id === "demo-ds-saas" && "MRR, Active Seats, Support Tickets, NPS, Churn Risk"}
                          {ds.id === "demo-ds-clinical" && "Efficacy Score, Systolic BP, BMI, Cholesterol, Cohort"}
                          {!isDemo && `${ds.column_count} validated continuous & categorical dimensions`}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                        <div>
                          <strong className="text-white font-mono">{ds.row_count.toLocaleString()}</strong> rows
                        </div>
                        <div>
                          <strong className="text-white font-mono">{ds.column_count}</strong> columns
                        </div>
                        <div className="text-[11px]">
                          {formatBytes(ds.file_size_bytes)}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                        <span>Launch Analytics Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={(newDs) => {
          setDatasets((prev) => [newDs, ...prev]);
        }}
      />
    </div>
  );
}
