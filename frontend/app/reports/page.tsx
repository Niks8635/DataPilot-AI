"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Sparkles, 
  Download, 
  Eye, 
  Plus, 
  Printer, 
  Calendar,
  Layers,
  Database
} from "lucide-react";
import { Report, Dataset } from "@/types";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [generating, setGenerating] = useState(false);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [reps, dss] = await Promise.all([
        api.reports.list(),
        api.datasets.list(),
      ]);
      setReports(reps);
      setDatasets(dss);
      if (dss.length > 0) {
        setSelectedDatasetId(dss[0].id);
      }
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerate = async () => {
    if (!selectedDatasetId) return;
    try {
      setGenerating(true);
      const rep = await api.reports.generate(selectedDatasetId, reportTitle || undefined);
      setReports((prev) => [rep, ...prev]);
      setGenerateOpen(false);
      setReportTitle("");
    } catch (err: any) {
      alert(err.message || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <FileText className="w-6 h-6 text-emerald-400" />
                Executive Reports
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Automated boardroom-ready intelligence reports combining data quality, KPIs, cleaning logs, and strategic recommendations.
              </p>
            </div>

            <Button
              onClick={() => setGenerateOpen(true)}
              size="sm"
              variant="luxury"
              disabled={datasets.length === 0}
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Generate New Report
            </Button>
          </div>

          {/* Reports List */}
          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">No reports generated yet</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Generate an executive report from any uploaded dataset with 1 click.
              </p>
              {datasets.length > 0 && (
                <Button size="sm" variant="luxury" onClick={() => setGenerateOpen(true)} className="mt-2">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Create Report
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-2xl border border-white/[0.08] bg-slate-900/60 hover:bg-slate-900 hover:border-emerald-500/30 transition p-5 flex flex-col justify-between shadow-lg group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
                        Executive Audit
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(rep.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-white tracking-tight leading-snug group-hover:text-emerald-300 transition">
                      {rep.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {rep.summary || "Comprehensive statistical breakdown and business recommendations."}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <Link href={`/reports/${rep.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full hover:border-violet-500/40">
                        <Eye className="w-3.5 h-3.5 mr-1 text-violet-400" />
                        View Report
                      </Button>
                    </Link>

                    <a
                      href={api.reports.getHtmlUrl(rep.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                      title="Open printable report for PDF saving"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print / PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Generate Report Modal */}
      <Modal
        isOpen={generateOpen}
        onClose={() => setGenerateOpen(false)}
        title="Generate Executive Report"
        description="DataPilot AI will analyze quality scores, KPIs, and trends to build a comprehensive presentation"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Select Dataset</label>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.row_count.toLocaleString()} rows)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Custom Title (Optional)</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="e.g., Q3 Financial Intelligence & Health Briefing"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="ghost" size="sm" onClick={() => setGenerateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={generating}
              disabled={!selectedDatasetId}
              onClick={handleGenerate}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-violet-300" />
              Generate Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
