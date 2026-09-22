"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Database, 
  ShieldCheck, 
  Wand2, 
  BarChart3, 
  Sparkles, 
  Download, 
  FileText, 
  RefreshCw,
  MessageSquareCode,
  LayoutDashboard,
  Calendar,
  Layers,
  TrendingUp,
  Sliders
} from "lucide-react";
import { Dataset, QualityScore, DatasetProfile, AIInsights } from "@/types";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataGrid } from "@/components/datasets/DataGrid";
import { DataQualityView } from "@/components/datasets/DataQualityView";
import { CleaningStudio } from "@/components/datasets/CleaningStudio";
import { AnalysisStepper } from "@/components/datasets/AnalysisStepper";
import { EDAView } from "@/components/datasets/EDAView";
import { InsightsView } from "@/components/datasets/InsightsView";
import { ForecastView } from "@/components/datasets/ForecastView";
import { ReportBuilder } from "@/components/reports/ReportBuilder";
import { ExportCenterModal } from "@/components/export/ExportCenterModal";

export default function DatasetWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const datasetId = params?.id as string;

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [quality, setQuality] = useState<QualityScore | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const loadDatasetData = async () => {
    try {
      setLoading(true);
      const [ds, prof, qual, anl] = await Promise.all([
        api.datasets.get(datasetId),
        api.datasets.profile(datasetId),
        api.datasets.quality(datasetId),
        api.analysis.get(datasetId),
      ]);
      setDataset(ds);
      setProfile(prof);
      setQuality(qual);
      setAnalysisData(anl);
    } catch (err) {
      console.error("Failed to load workspace data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (datasetId) {
      loadDatasetData();
    }
  }, [datasetId]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await api.analysis.refresh(datasetId);
      await loadDatasetData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleRegenerateInsights = async (focusPrompt?: string, detailLevel: "brief" | "deep" = "brief") => {
    const updatedInsights = await api.analysis.regenerateInsights(datasetId, focusPrompt, detailLevel);
    setAnalysisData((prev: any) => ({ ...prev, insights: updatedInsights }));
  };

  const handleAskQuestion = (question: string) => {
    router.push(`/ask-data?datasetId=${datasetId}&q=${encodeURIComponent(question)}`);
  };

  // 9 Unified Cross-Feature Workspace Tabs
  const tabs = [
    { id: "preview", label: "Spreadsheet Preview", icon: <Database className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: "quality", label: "Data Quality & Health", icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />, badge: quality?.overall_score },
    { id: "clean", label: "Cleaning Studio", icon: <Wand2 className="w-3.5 h-3.5 text-indigo-400" /> },
    { id: "eda", label: "Analysis & EDA", icon: <BarChart3 className="w-3.5 h-3.5 text-violet-400" /> },
    { id: "insights", label: "AI Insights", icon: <Sparkles className="w-3.5 h-3.5 text-violet-300" /> },
    { id: "forecast", label: "Forecast Engine", icon: <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: "ask", label: "Ask Your Data", icon: <MessageSquareCode className="w-3.5 h-3.5 text-violet-400" /> },
    { id: "reports", label: "Report Builder", icon: <FileText className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: "export", label: "Export Center", icon: <Download className="w-3.5 h-3.5 text-emerald-400" /> },
  ];

  if (loading || !dataset) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <div className="flex-1 flex items-center justify-center p-12 text-xs text-slate-400 gap-3">
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            Initializing Analysis Workspace & Intelligence Models...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <Navbar />

        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Breadcrumb & Dataset Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                <Link href="/datasets" className="hover:text-white transition flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Datasets
                </Link>
                <span>/</span>
                <span className="text-white font-medium">{dataset.name}</span>
                <span className="font-mono text-[10px] ml-1 uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
                  v{dataset.current_version} • {dataset.file_type}
                </span>
                {profile?.domain_info && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25 font-mono">
                    {profile.domain_info.domain}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                {dataset.name}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {dataset.row_count.toLocaleString()} rows • {dataset.column_count} columns • Uploaded: {new Date(dataset.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                loading={refreshing}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Refresh Analysis
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setExportModalOpen(true)}
              >
                <Download className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Export Center
              </Button>

              <Link href={`/dashboards?datasetId=${dataset.id}`}>
                <Button variant="secondary" size="sm">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1 text-violet-400" />
                  Dashboard
                </Button>
              </Link>

              <Button
                variant="luxury"
                size="sm"
                onClick={() => setActiveTab("ask")}
              >
                <MessageSquareCode className="w-3.5 h-3.5 mr-1" />
                Ask Questions
              </Button>
            </div>
          </div>

          {/* Workspace Navigation Tabs (9 Tabs) */}
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {/* Tab Content Rendering */}
          <div className="pt-2">
            {/* Tab 1: Spreadsheet Preview */}
            {activeTab === "preview" && (
              <DataGrid datasetId={dataset.id} />
            )}

            {/* Tab 2: Data Quality & Health */}
            {activeTab === "quality" && (
              <DataQualityView
                quality={quality}
                profile={profile}
                onGoToCleaning={() => setActiveTab("clean")}
              />
            )}

            {/* Tab 3: Cleaning Studio */}
            {activeTab === "clean" && (
              <CleaningStudio
                datasetId={dataset.id}
                profile={profile}
                onCleaningComplete={loadDatasetData}
              />
            )}

            {/* Tab 4: Analysis & EDA */}
            {activeTab === "eda" && (
              <div className="space-y-6">
                <AnalysisStepper
                  plan={analysisData?.analysis_plan}
                  intelligence={analysisData?.intelligence || profile?.intelligence}
                  domain={analysisData?.intelligence?.business_domain || profile?.domain_info}
                />
                <EDAView
                  eda={analysisData?.eda}
                  correlations={analysisData?.correlations}
                  outliers={analysisData?.outliers || []}
                />
              </div>
            )}

            {/* Tab 5: AI Insights */}
            {activeTab === "insights" && (
              <InsightsView
                datasetId={dataset.id}
                insights={analysisData?.insights}
                onAskQuestion={handleAskQuestion}
                onRegenerate={handleRegenerateInsights}
              />
            )}

            {/* Tab 6: Forecast Engine */}
            {activeTab === "forecast" && (
              <ForecastView
                datasetId={dataset.id}
                profile={profile}
              />
            )}

            {/* Tab 7: Ask Your Data */}
            {activeTab === "ask" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <MessageSquareCode className="w-4 h-4 text-cyan-400" />
                      Conversational AI Data Analyst
                    </h3>
                    <p className="text-xs text-slate-400">
                      Multi-turn conversational memory with pronoun resolution and sandbox calculation transparency.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push(`/ask-data?datasetId=${dataset.id}`)}
                  >
                    Open Full-Screen Conversation
                  </Button>
                </div>
                <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-3">
                  <p>Click below to start or continue an interactive session exploring this dataset:</p>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => router.push(`/ask-data?datasetId=${dataset.id}`)}
                  >
                    Launch Conversational Studio for {dataset.name}
                  </Button>
                </div>
              </div>
            )}

            {/* Tab 8: Executive Report Builder */}
            {activeTab === "reports" && (
              <ReportBuilder
                datasetId={dataset.id}
                datasetName={dataset.name}
              />
            )}

            {/* Tab 9: Export Center */}
            {activeTab === "export" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-400" />
                      Dataset & Artifact Export Hub
                    </h3>
                    <p className="text-xs text-slate-400">
                      Download the multi-tab executive workbook, active cleaned CSV, raw upload, or JSON files.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setExportModalOpen(true)}
                  >
                    Open Download Center
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">7-Worksheet Workbook</span>
                    <h4 className="text-sm font-bold text-white">Multi-Tab Executive Excel (.xlsx)</h4>
                    <p className="text-xs text-slate-400">
                      Includes Raw Data, Cleaned Data, Summary Statistics, KPIs, AI Insights, Anomalies, and Forecast with custom navy corporate styling and auto column widths.
                    </p>
                    <a
                      href={api.datasets.getExportUrl(dataset.id, "xlsx_multitab", "current", true)}
                      download
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Executive .xlsx
                    </a>
                  </div>

                  <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block">Standard Spreadsheets</span>
                    <h4 className="text-sm font-bold text-white">Cleaned CSV & JSON Data</h4>
                    <p className="text-xs text-slate-400">
                      Export flat tabular CSV or JSON records for direct integration with external data science pipelines, dashboards, or databases.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={api.datasets.getExportUrl(dataset.id, "csv", "current")}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Cleaned CSV
                      </a>
                      <a
                        href={api.datasets.getExportUrl(dataset.id, "json", "current")}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        JSON Records
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Global Export Center Modal */}
      <ExportCenterModal
        datasetId={dataset.id}
        datasetName={dataset.name}
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </div>
  );
}
