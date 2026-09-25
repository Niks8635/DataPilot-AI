"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Database, 
  BarChart3, 
  FileText, 
  Sparkles, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  Layers, 
  Zap,
  MessageSquareCode,
  Activity,
  ArrowUpRight,
  Compass
} from "lucide-react";
import { Dataset, Report } from "@/types";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { UploadModal } from "@/components/datasets/UploadModal";
import { Sparkline } from "@/components/ui/Sparkline";
import { formatBytes } from "@/lib/utils";

import { DEMO_DATASETS, getDemoReports } from "@/lib/demoDatasets";

export default function DashboardHomePage() {
  const router = useRouter();
  const [datasets, setDatasets] = useState<Dataset[]>(DEMO_DATASETS);
  const [reports, setReports] = useState<Report[]>(getDemoReports());
  const [loading, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        const [dss, reps] = await Promise.all([
          api.datasets.list(),
          api.reports.list(),
        ]);
        setDatasets(dss);
        setReports(reps);
      } catch (err) {
        console.error("Failed to load dashboard overview", err);
      } finally {
        setLoading(false);
      }
    };
    loadOverview();
  }, []);

  const totalRows = datasets.reduce((acc, d) => acc + d.row_count, 0);

  return (
    <div className="flex min-h-screen bg-[#030712] text-slate-100 dot-pattern">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onOpenUpload={() => setUploadOpen(true)} />

        <main className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Welcome Banner with Luxury Gradient */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-white/[0.09] p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.6)] specular-top">
            {/* Ambient Background Auras */}
            <div className="absolute top-0 right-0 w-[450px] h-[300px] bg-gradient-to-bl from-violet-600/15 via-indigo-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
            <div className="absolute -bottom-10 left-1/3 w-[300px] h-[200px] bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/15 to-indigo-500/15 border border-violet-400/25 text-violet-300 text-xs font-mono font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>AI-Powered Data Analytics Platform</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Enterprise Data Command Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal max-w-2xl">
                Transform raw multi-format datasets into board-ready executive intelligence. Automated profiling, AST-sandboxed statistical cleaning, predictive forecasting, and interactive visual analytics.
              </p>
              
              <div className="pt-4 flex items-center gap-3 flex-wrap">
                <Button onClick={() => setUploadOpen(true)} size="sm" variant="luxury">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Upload New Dataset
                </Button>
                {datasets.length > 0 && (
                  <Link href={`/dashboards?datasetId=${datasets[0].id}`}>
                    <Button variant="glass" size="sm" className="hover:border-violet-500/40 hover:text-violet-300">
                      <BarChart3 className="w-4 h-4 mr-1.5 text-violet-400" />
                      Open Visual Analytics
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
                    </Button>
                  </Link>
                )}
                <Link href="/ask-data">
                  <Button variant="outline" size="sm" className="hover:border-cyan-500/40 hover:text-cyan-300">
                    <MessageSquareCode className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                    Ask AI Copilot
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Luxury Financial-Terminal Metric Cards with Mini Sparklines (Cyan, Violet, Emerald, Indigo) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Total Datasets (Cyan) */}
            <Card variant="luxury" className="p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-cyan-400/90">
                  Data Vault
                </span>
                <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Database className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
                    {datasets.length}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {totalRows.toLocaleString()} rows cataloged
                  </div>
                </div>
                <Sparkline
                  data={[2, 3, 3, 4, 5, 5, datasets.length || 6]}
                  color="cyan"
                  width={90}
                  height={34}
                />
              </div>
            </Card>

            {/* Card 2: Visual Analytics (Violet) */}
            <Card variant="luxury" className="p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-violet-400/90">
                  Visual Analytics
                </span>
                <div className="p-1.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
                    {datasets.length * 2 || 12}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Interactive multi-page charts
                  </div>
                </div>
                <Sparkline
                  data={[4, 6, 8, 7, 10, 9, 12]}
                  color="violet"
                  width={90}
                  height={34}
                />
              </div>
            </Card>

            {/* Card 3: Executive Reports (Emerald) */}
            <Card variant="luxury" className="p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-400/90">
                  Executive Reports
                </span>
                <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
                    {reports.length}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Boardroom briefs ready
                  </div>
                </div>
                <Sparkline
                  data={[1, 2, 2, 4, 3, 5, Math.max(reports.length, 6)]}
                  color="emerald"
                  width={90}
                  height={34}
                />
              </div>
            </Card>

            {/* Card 4: AI Telemetry & Quality (Indigo) */}
            <Card variant="luxury" className="p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-400/90">
                  AI & Data Quality
                </span>
                <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-bold text-indigo-400 tracking-tight font-mono">
                    96/100
                  </div>
                  <div className="text-xs text-indigo-400/80 mt-0.5 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    AST Isolated (12ms)
                  </div>
                </div>
                <Sparkline
                  data={[88, 90, 92, 91, 95, 94, 96]}
                  color="violet"
                  width={90}
                  height={34}
                />
              </div>
            </Card>
          </div>

          {/* Recent Uploads and Quick Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Datasets List */}
            <Card variant="glass" className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  <Database className="w-4 h-4 text-cyan-400" />
                  Recent Datasets Catalog
                </CardTitle>
                <Link href="/datasets" className="text-xs text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1">
                  <span>View All ({datasets.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-12 text-center text-xs text-slate-400">
                    <span className="inline-block w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-2" />
                    Loading enterprise catalog...
                  </div>
                ) : datasets.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400">
                    No datasets yet. Click "Upload New Dataset" or load sample demo data.
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.05]">
                    {datasets.slice(0, 5).map((ds) => (
                      <Link
                        key={ds.id}
                        href={`/datasets/${ds.id}`}
                        className="p-4 flex items-center justify-between hover:bg-white/[0.03] transition block group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/[0.08] text-cyan-400 flex items-center justify-center font-mono text-xs font-bold uppercase shadow-inner group-hover:border-cyan-500/30 group-hover:scale-105 transition shrink-0">
                            {ds.file_type}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition truncate">
                              {ds.name}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 truncate font-mono">
                              {ds.row_count.toLocaleString()} rows • {ds.column_count} cols • {formatBytes(ds.file_size_bytes)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 pl-3">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                            v{ds.current_version}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions & Copilot Trigger */}
            <div className="space-y-4">
              {/* Ask Copilot Bento Card */}
              <Card variant="glass" className="p-5 border-violet-500/25 bg-gradient-to-br from-violet-950/20 via-slate-900/80 to-slate-950">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 font-mono">
                    <MessageSquareCode className="w-4 h-4" />
                    <span>AI Copilot</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 font-mono">
                    Zero Hallucination
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  Conversational Business Intelligence
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Ask analytical questions in plain English. Translates intent into AST-verified Python queries with charts and statistical proofs.
                </p>
                <Link href="/ask-data" className="mt-4 block">
                  <Button size="sm" variant="luxury" className="w-full">
                    Launch AI Chat Copilot
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </Card>

              {/* Sample Analytics Demo Card */}
              <Card variant="glass" className="p-5 border-cyan-500/20 bg-gradient-to-br from-cyan-950/15 via-slate-900/80 to-slate-950">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 font-mono">
                    <Sparkles className="w-4 h-4" />
                    <span>Demo Workspace</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                    600 Rows
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Explore a pre-loaded multinational sales dataset with multi-page dashboards, correlation matrices, and forecasting models.
                </p>
                <Button
                  size="sm"
                  variant="glass"
                  className="w-full mt-4 hover:border-cyan-500/30 hover:text-cyan-300"
                  onClick={() => setUploadOpen(true)}
                >
                  Load Sample Dataset
                </Button>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={(newDs) => {
          setDatasets((prev) => [newDs, ...prev]);
          if (newDs?.id) {
            router.push(`/datasets/${newDs.id}`);
          }
        }}
      />
    </div>
  );
}
