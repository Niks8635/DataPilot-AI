"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  User, 
  Mail, 
  Building, 
  ShieldCheck, 
  Database, 
  BarChart3, 
  FileText, 
  Download, 
  Key, 
  Check, 
  Copy, 
  Edit3, 
  ArrowRight, 
  Sparkles, 
  HardDrive, 
  RefreshCw, 
  Layers, 
  Lock, 
  Cpu, 
  Activity, 
  Clock,
  Calendar,
  ExternalLink,
  ChevronRight,
  Shield,
  Save,
  Trash2,
  CheckCircle2
} from "lucide-react";
import { UserProfileResponse, UserDatasetSummary, UserActivityItem } from "@/types";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Sparkline } from "@/components/ui/Sparkline";
import { formatBytes } from "@/lib/utils";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"datasets" | "activity" | "settings" | "security">("datasets");

  // Edit form state
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Clipboard & Export state
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await api.auth.getProfile();
      setProfile(data);
      setFullName(data.full_name);
      setOrganization(data.organization);
      setRole(data.role);
    } catch (err) {
      console.error("Failed to load user profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await api.auth.updateProfile({
        full_name: fullName,
        organization: organization,
        role: role,
      });
      setProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyKey = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.api_key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyId = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const data = await api.auth.exportData();
      
      // Trigger download of JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `datapilot_user_data_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to export data", err);
    } finally {
      setExporting(false);
    }
  };

  const storageUsed = profile?.stats.total_storage_bytes || 0;
  const storageQuota = profile?.stats.storage_quota_bytes || 10737418240;
  const storagePercent = Math.min(Math.round((storageUsed / storageQuota) * 100 * 10) / 10, 100);

  return (
    <div className="flex min-h-screen bg-[#030712] text-slate-100 dot-pattern">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="p-6 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mb-1">
                <Link href="/dashboard" className="hover:text-white transition">Command Center</Link>
                <span>/</span>
                <span className="text-cyan-400 font-semibold">User Profile & Data Vault</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                Account Identity & Data Inventory
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="glass"
                size="sm"
                onClick={handleExportData}
                disabled={exporting}
                className="gap-1.5 text-xs shadow-sm"
              >
                {exportSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Data Package Exported</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{exporting ? "Compiling..." : "Export My Data (JSON)"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Profile Hero Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-white/[0.09] p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.6)] specular-top">
            <div className="absolute top-0 right-0 w-[400px] h-[250px] bg-gradient-to-bl from-violet-600/15 via-indigo-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
            <div className="absolute -bottom-10 left-1/3 w-[300px] h-[200px] bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                {/* Avatar with Iridescent Ring */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[2px] shadow-xl shadow-violet-500/25 shrink-0">
                  <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-2xl font-extrabold text-white">
                    {profile ? profile.full_name.substring(0, 2).toUpperCase() : "DP"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {profile?.full_name || "Data Analyst"}
                    </h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {profile?.tier || "Enterprise Pro"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-violet-500/15 text-violet-300 border border-violet-500/25">
                      AST Enclave
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {profile?.email || "analyst@datapilot.ai"}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {profile?.organization || "DataPilot Enterprise Analytics"}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Member since {profile?.created_at || "September 2026"}
                    </span>
                  </div>

                  <div className="pt-1.5 flex items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span>Account ID:</span>
                    <span className="text-slate-300 font-bold">{profile?.id.substring(0, 16)}...</span>
                    <button
                      onClick={handleCopyId}
                      className="p-1 hover:text-white rounded hover:bg-white/[0.06] transition"
                      title="Copy Account ID"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                <Button
                  size="sm"
                  variant="luxury"
                  onClick={() => setActiveTab("settings")}
                  className="gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Profile
                </Button>
                <Link href="/dashboards">
                  <Button size="sm" variant="glass" className="gap-1.5 hover:border-violet-500/40 hover:text-violet-300">
                    <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
                    Visual Analytics
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* User Data & Analytics Vault (KPIs with Sparklines) */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Personal Data & Computational Vault</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Metric 1: Datasets Cataloged (Cyan) */}
              <Card variant="luxury" className="p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-cyan-400/90">
                    Datasets Cataloged
                  </span>
                  <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Database className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-white tracking-tight font-mono">
                      {profile?.stats.total_datasets ?? 0}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Multi-format files
                    </div>
                  </div>
                  <Sparkline
                    data={[2, 3, 5, 6, 8, profile?.stats.total_datasets || 9]}
                    color="cyan"
                    width={75}
                    height={30}
                  />
                </div>
              </Card>

              {/* Metric 2: Total Rows Processed (Emerald) */}
              <Card variant="luxury" className="p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-400/90">
                    Rows Processed
                  </span>
                  <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-white tracking-tight font-mono">
                      {profile?.stats.total_rows.toLocaleString() ?? 0}
                    </div>
                    <div className="text-[11px] text-emerald-400 mt-0.5 font-mono">
                      {profile?.stats.total_columns ?? 0} total columns
                    </div>
                  </div>
                  <Sparkline
                    data={[1000, 4500, 8200, 12000, 15500, profile?.stats.total_rows || 17740]}
                    color="emerald"
                    width={75}
                    height={30}
                  />
                </div>
              </Card>

              {/* Metric 3: Visual Dashboards (Violet) */}
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
                    <div className="text-2xl font-extrabold text-white tracking-tight font-mono">
                      {profile?.stats.total_dashboards ?? 0}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Multi-page studios
                    </div>
                  </div>
                  <Sparkline
                    data={[3, 6, 10, 15, 20, profile?.stats.total_dashboards || 25]}
                    color="violet"
                    width={75}
                    height={30}
                  />
                </div>
              </Card>

              {/* Metric 4: Boardroom Reports (Emerald) */}
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
                    <div className="text-2xl font-extrabold text-white tracking-tight font-mono">
                      {profile?.stats.total_reports ?? 0}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Boardroom briefs
                    </div>
                  </div>
                  <Sparkline
                    data={[1, 1, 2, 2, 3, Math.max(profile?.stats.total_reports || 1, 3)]}
                    color="emerald"
                    width={75}
                    height={30}
                  />
                </div>
              </Card>

              {/* Metric 5: Storage Footprint (Indigo) */}
              <Card variant="luxury" className="p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-400/90">
                    Storage Quota
                  </span>
                  <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <HardDrive className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-extrabold text-white tracking-tight font-mono">
                      {formatBytes(storageUsed)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      of 10 GB
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 h-1.5 rounded-full"
                      style={{ width: `${Math.max(storagePercent, 2)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono flex justify-between">
                    <span>{storagePercent}% used</span>
                    <span className="text-emerald-400">Optimal</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Navigation Tab Strip */}
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
            <button
              onClick={() => setActiveTab("datasets")}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
                activeTab === "datasets"
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Data Inventory ({profile?.datasets.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("activity")}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
                activeTab === "activity"
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Activity Audit Trail</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
                activeTab === "settings"
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Profile Settings</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
                activeTab === "security"
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Security & API Keys</span>
            </button>
          </div>

          {/* Tab 1: Datasets Inventory */}
          {activeTab === "datasets" && (
            <Card variant="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    <Database className="w-4 h-4 text-cyan-400" />
                    Complete Datasets & Files Inventory
                  </CardTitle>
                  <div className="text-xs text-slate-400 mt-1">
                    All ingested CSV, Excel, and JSON files belonging to your user account.
                  </div>
                </div>
                <Link href="/dashboard">
                  <Button size="sm" variant="luxury">
                    + Upload New Dataset
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-12 text-center text-xs text-slate-400">Loading user catalog...</div>
                ) : !profile?.datasets.length ? (
                  <div className="p-12 text-center text-xs text-slate-400">
                    No datasets uploaded yet. Click "+ Upload New Dataset" to get started.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider border-b border-white/[0.06]">
                        <tr>
                          <th className="px-5 py-3">Dataset Name</th>
                          <th className="px-4 py-3">Format</th>
                          <th className="px-4 py-3">Dimensions</th>
                          <th className="px-4 py-3">Storage</th>
                          <th className="px-4 py-3">Version</th>
                          <th className="px-4 py-3">Quality Score</th>
                          <th className="px-4 py-3">Ingested</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {profile.datasets.map((ds) => (
                          <tr key={ds.id} className="hover:bg-white/[0.02] transition group">
                            <td className="px-5 py-3.5 font-semibold text-white">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-slate-900 border border-white/[0.08] text-cyan-400 flex items-center justify-center font-mono text-[10px] uppercase font-bold shrink-0">
                                  {ds.file_type}
                                </div>
                                <span className="group-hover:text-cyan-300 transition truncate max-w-xs">{ds.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-[11px]">
                              <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] uppercase text-slate-300 font-bold">
                                {ds.file_type}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-[11px]">
                              {ds.row_count.toLocaleString()} rows × {ds.column_count} cols
                            </td>
                            <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                              {formatBytes(ds.file_size_bytes)}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/15 text-blue-300 border border-blue-500/25">
                                v{ds.current_version}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-bold">
                                {ds.quality_score}/100
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                              {ds.created_at || "Recently"}
                            </td>
                            <td className="px-5 py-3.5 text-right space-x-2">
                              <Link href={`/datasets/${ds.id}`}>
                                <button className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition">
                                  Workspace
                                </button>
                              </Link>
                              <Link href={`/dashboards?datasetId=${ds.id}`}>
                                <button className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-medium transition">
                                  Dashboard
                                </button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tab 2: Activity Timeline */}
          {activeTab === "activity" && (
            <Card variant="glass" className="p-6">
              <CardTitle className="text-base mb-6">
                <Clock className="w-4 h-4 text-cyan-400" />
                Chronological Activity & Operational Audit
              </CardTitle>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/[0.08]">
                {profile?.recent_activity.map((act) => (
                  <div key={act.id} className="relative group">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] hover:border-white/[0.12] transition">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition">
                          {act.title}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          {act.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {act.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Tab 3: Profile Settings Form */}
          {activeTab === "settings" && (
            <Card variant="glass" className="p-6">
              <CardTitle className="text-base mb-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                Edit Profile & Organization Info
              </CardTitle>
              <p className="text-xs text-slate-400 mb-6">
                Update your professional title, full name, and enterprise organization.
              </p>

              <form onSubmit={handleSaveProfile} className="max-w-xl space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Professional Role / Title
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/[0.06] text-xs text-slate-400 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Contact your workspace administrator to change primary account email.
                  </span>
                </div>

                <div className="pt-3 flex items-center gap-3">
                  <Button type="submit" variant="luxury" size="sm" disabled={saving}>
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {saving ? "Saving Changes..." : "Save Profile"}
                  </Button>
                  {saveSuccess && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                      Profile updated successfully!
                    </span>
                  )}
                </div>
              </form>
            </Card>
          )}

          {/* Tab 4: Security & API Enclave */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* API Key Card */}
              <Card variant="glass" className="p-6">
                <CardTitle className="text-base mb-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  API Keys & Programmatic Access
                </CardTitle>
                <p className="text-xs text-slate-400 mb-4">
                  Use this secret token to authenticate automated ETL pipelines and CLI ingestion requests.
                </p>

                <div className="flex items-center gap-2 max-w-xl">
                  <div className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-white/[0.1] font-mono text-xs text-cyan-300 select-all">
                    {profile?.api_key || "dp_live_demo_analyst_key"}
                  </div>
                  <button
                    onClick={handleCopyKey}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </Card>

              {/* Security Enclave Verification */}
              <Card variant="glass" className="p-6">
                <CardTitle className="text-base mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Tenant Data Protection & AST Sandboxing
                </CardTitle>
                <p className="text-xs text-slate-400 mb-4">
                  All queries, cleanings, and mathematical analyses are strictly executed within air-gapped processes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">AST Sandboxing</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-1">ACTIVE</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Zero OS primitive access</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Encryption</div>
                    <div className="text-sm font-bold text-blue-400 font-mono mt-1">AES-256 GCM</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Rest & In-Transit</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Model Training</div>
                    <div className="text-sm font-bold text-purple-400 font-mono mt-1">EXCLUDED</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Zero LLM model retention</div>
                  </div>
                </div>
              </Card>

              {/* Data Portability / GDPR */}
              <Card variant="glass" className="p-6">
                <CardTitle className="text-base mb-2">
                  <Download className="w-4 h-4 text-cyan-400" />
                  GDPR Data Portability & Complete Backup
                </CardTitle>
                <p className="text-xs text-slate-400 mb-4">
                  Download a complete structured JSON archive containing your full user metadata, datasets inventory, report briefs, and dashboard layouts.
                </p>
                <Button
                  onClick={handleExportData}
                  disabled={exporting}
                  variant="glass"
                  size="sm"
                  className="gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{exporting ? "Generating Archive..." : "Download Full Data Archive"}</span>
                </Button>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
