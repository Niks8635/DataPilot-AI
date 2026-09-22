"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  ArrowRight, 
  Database, 
  BarChart3, 
  ShieldCheck, 
  Wand2, 
  FileText, 
  ChevronRight, 
  CheckCircle2, 
  TrendingUp, 
  Zap, 
  Layers, 
  HelpCircle,
  Clock,
  Lock,
  Play,
  Activity,
  Cpu,
  LineChart,
  Home,
  SlidersHorizontal,
  Search,
  Code2,
  Table,
  Check,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { UploadModal } from "@/components/datasets/UploadModal";
import { Sparkline } from "@/components/ui/Sparkline";
import { HeroAnalyticsMockup } from "@/components/home/HeroAnalyticsMockup";
import { DataPipelineVisual } from "@/components/home/DataPipelineVisual";
import { AiAnalystIndicator } from "@/components/ui/AiAnalystIndicator";

export default function LandingPage() {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [askQuery, setAskQuery] = useState("Show monthly revenue trends across all regions");

  const workflowSteps = [
    { 
      num: "01", 
      title: "Zero-Config Ingestion", 
      desc: "Drag & drop CSV, XLSX, JSON, or Parquet datasets with automated schema inference and format parsing in milliseconds.",
      tag: "Multi-Format"
    },
    { 
      num: "02", 
      title: "Deterministic Cleaning", 
      desc: "Inspect nulls, duplicates, and outliers with an interactive before-and-after split slider and non-destructive rollbacks.",
      tag: "Audit Diff"
    },
    { 
      num: "03", 
      title: "AST Statistical Proofs", 
      desc: "Sandboxed Python engine computes Pearson correlations, variance distributions, and multi-variable drivers without hallucinations.",
      tag: "Sandboxed"
    },
    { 
      num: "04", 
      title: "Executive Synthesis", 
      desc: "Instantly generate multi-tab styled Excel workbooks, boardroom PDF briefings, and responsive 12-column dashboards.",
      tag: "Boardroom Ready"
    },
  ];

  const faqs = [
    {
      q: "Does DataPilot AI fabricate or hallucinate numbers?",
      a: "Never. All insights and metrics are strictly grounded in computed statistical results generated from Python's analytical engine (Pandas, NumPy, SciPy). The AI translates computed summaries into plain English without inventing numbers."
    },
    {
      q: "Is code execution safe and sandboxed?",
      a: "Yes. All analytical queries execute within an AST-validated sandbox with zero access to filesystem, shell, network sockets, or OS primitives, protected by strict CPU and execution time limits."
    },
    {
      q: "What file formats can I analyze?",
      a: "DataPilot AI natively ingests CSV, Excel (.xlsx, .xls), JSON, and Apache Parquet files up to hundreds of thousands of rows with automatic type inference."
    },
    {
      q: "Can I export my dashboards and cleaned datasets?",
      a: "Yes. You can export sanitized CSV files, multi-tab executive Excel spreadsheets, boardroom-ready PDF briefs, and high-res chart images (PNG/SVG)."
    }
  ];

  return (
    <div className="min-h-screen bg-[#080A0F] text-slate-100 dot-pattern flex flex-col selection:bg-violet-600 selection:text-white">
      {/* ============================================================ */}
      {/* 1. TOP NAVIGATION BAR                                         */}
      {/* ============================================================ */}
      <header className="h-16 border-b border-white/[0.08] bg-[#080A0F]/80 backdrop-blur-xl sticky top-0 z-40 px-6 sm:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-violet-500/20 group-hover:scale-105 transition">
            <div className="w-full h-full rounded-[11px] bg-[#080A0F] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
              DataPilot AI
            </span>
            <span className="text-[10px] text-slate-400 font-normal mt-0.5">
              AI-Powered Data Analytics Platform
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-xs text-slate-400 font-medium">
          <Link href="/" className="text-white font-semibold flex items-center gap-1.5 hover:text-cyan-300 transition">
            <Home className="w-3.5 h-3.5 text-cyan-400" />
            Home
          </Link>
          <a href="#pipeline" className="hover:text-cyan-300 transition">Pipeline</a>
          <a href="#cleaning" className="hover:text-emerald-300 transition">Data Cleaning</a>
          <a href="#analyst" className="hover:text-purple-300 transition">AI Analyst</a>
          <a href="#ask-data" className="hover:text-cyan-300 transition">Ask Data</a>
          <a href="#features" className="hover:text-white transition">Capabilities</a>
          <a href="#security" className="hover:text-white transition">Security & FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-xs font-medium text-slate-300 hover:text-white transition px-2">
            Sign In
          </Link>
          <Button 
            size="sm" 
            onClick={() => setUploadOpen(true)} 
            className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white font-semibold shadow-md shadow-violet-500/20 text-xs px-3.5"
          >
            Start Analyzing
          </Button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. AIRY, COMMANDING HERO SECTION                              */}
      {/* ============================================================ */}
      <section className="relative pt-8 sm:pt-12 pb-14 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col items-center">
        {/* Ambient Radial Backdrops */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-gradient-to-tr from-violet-600/15 via-purple-600/12 to-cyan-400/10 blur-[140px] pointer-events-none rounded-full" />

        {/* Small Premium Badge (Refinement 1) */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-mono mb-3.5 shadow-inner backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-slate-300 font-medium">AI-Powered Data Analytics Platform</span>
        </div>

        {/* Primary Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-white text-center leading-[1.1] shimmer-text sm:whitespace-nowrap max-w-none px-2 uppercase">
          Turn Raw Data Into Decisions
        </h1>

        {/* Streamlined Subtitle (Refinement 1) */}
        <p className="mt-3.5 text-sm sm:text-base text-slate-300 max-w-2xl text-center font-normal leading-relaxed">
          Upload any CSV, Excel, Parquet, or JSON dataset. Analyze, visualize, clean, and understand your data with an AI-powered analytics workflow.
        </p>

        {/* Hero CTA Hierarchy (Refinement 5) */}
        <div className="mt-6 flex items-center gap-3.5 flex-wrap justify-center">
          <Button 
            size="lg" 
            onClick={() => setUploadOpen(true)} 
            className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-violet-600/25 hover:shadow-indigo-500/30 gap-2 px-7 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span>Start Analyzing</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Link href="/dashboard">
            <Button size="lg" variant="secondary" className="px-5 border-white/[0.1] text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all">
              View Demo
            </Button>
          </Link>
        </div>

        {/* Ingestion Formats Pill Bar */}
        <div className="mt-4 mb-2 flex items-center gap-2 text-xs text-slate-400 flex-wrap justify-center font-mono">
          <span className="text-slate-500 text-[11px] font-medium">Supported:</span>
          {["CSV", "Excel (.xlsx)", "JSON", "Apache Parquet"].map((fmt) => (
            <span key={fmt} className="px-2.5 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-slate-300 text-[11px]">
              {fmt}
            </span>
          ))}
        </div>

        {/* Interactive Product Showcase Viewport (Refinement 4) */}
        <div className="mt-6 sm:mt-8 w-full relative">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-b from-cyan-500/10 via-purple-500/10 to-transparent blur-xl pointer-events-none -z-10" />
          <HeroAnalyticsMockup />
        </div>

        {/* Subtle Real Product Trust Signal (Refinement 7) */}
        <div className="mt-8 w-full p-4 sm:p-5 rounded-2xl border border-white/[0.08] bg-[#0D1117]/80 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">Real Data Analysis</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-slate-300 text-[11px] flex-wrap justify-center">
              <span className="flex items-center gap-1.5 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Actual dataset calculations</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Real-time profiling</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Data quality analysis</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 border-t md:border-t-0 md:border-l border-white/[0.08] pt-2 md:pt-0 md:pl-4">
              <span>CSV • XLSX • JSON • PARQUET</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Python • Pandas • FastAPI</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. THE AUTONOMOUS INTELLIGENCE PIPELINE (UNIFIED)             */}
      {/* ============================================================ */}
      <section id="pipeline" className="py-24 border-t border-white/[0.06] bg-gradient-to-b from-[#080A0F] via-[#0D1117]/60 to-[#080A0F] relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 space-y-16">
          {/* Section Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="text-xs uppercase font-mono font-bold text-violet-400 tracking-wider">
              Data Transformation Pipeline
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              From Raw Ingestion to Boardroom Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Automating the rigorous, multi-hour workflows of senior data analysts and data engineers into a continuous, air-gapped pipeline.
            </p>
          </div>

          {/* Interactive Glowing Connected Pipeline Visual */}
          <DataPipelineVisual />

          {/* 4-Phase Progressive Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-4">
            {workflowSteps.map((step, idx) => {
              const stepStyles = [
                { badge: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", hover: "hover:border-indigo-500/40", textHover: "group-hover:text-indigo-300" },
                { badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", hover: "hover:border-emerald-500/40", textHover: "group-hover:text-emerald-300" },
                { badge: "text-purple-400 bg-purple-500/10 border-purple-500/20", hover: "hover:border-purple-500/40", textHover: "group-hover:text-purple-300" },
                { badge: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", hover: "hover:border-cyan-500/40", textHover: "group-hover:text-cyan-300" },
              ][idx];

              return (
                <Card key={step.num} variant="bento" className={`p-6 flex flex-col justify-between ${stepStyles.hover} transition-all duration-300 group`}>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${stepStyles.badge}`}>
                        {step.num}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 transition">
                        {step.tag}
                      </span>
                    </div>
                    <h3 className={`text-base font-bold text-white tracking-tight ${stepStyles.textHover} transition`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. BALANCED FEATURE STORY: SMART DATA CLEANING STUDIO         */}
      {/* ============================================================ */}
      <section id="cleaning" className="py-28 border-t border-white/[0.06] bg-[#0D1117]/40 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Narrative & Quality Scorecard */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Deterministic Data Cleaning</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Sanitize Messy Data With Instant Visual Diffs
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Raw business data is riddled with corrupted cells, missing values, duplicate records, and extreme outliers. DataPilot AI automatically profiles column distributions and proposes non-destructive fixes.
              </p>

              {/* Quality Metric Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121722] to-[#0D1117] border border-white/[0.08] shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-slate-400 font-semibold">Calibrated Health Score</span>
                  <span className="text-2xl font-extrabold font-mono text-emerald-400">92 <span className="text-xs text-slate-500 font-normal">/ 100</span></span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full w-[92%]" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>0 Invalid Types</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>12 Duplicates Removed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>3 Nulls Imputed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>8 Outliers Bounded</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Link href="/datasets">
                  <Button size="md" variant="luxury" className="gap-2">
                    <span>Explore Data Cleaning Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Before-and-After Split Slider Showcase */}
            <div className="lg:col-span-7">
              <Card variant="bento-mint" className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Before-and-After Split Comparator</h4>
                      <span className="text-[11px] font-mono text-slate-400">Interactive Curtain Reveal & Audit Diff</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">
                    Non-Destructive
                  </span>
                </div>

                {/* Visual Before vs After Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Dirty State */}
                  <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2">
                    <div className="flex items-center justify-between text-rose-400 font-bold">
                      <span>Raw Dirty State</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20">Pre-Clean</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-300 text-[11px]">
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span>Null values in key revenue columns</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span>Unstandardized dates (DD/MM vs MM/DD)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span>Extreme IQR anomalies skewing mean</span>
                      </li>
                    </ul>
                  </div>

                  {/* Clean State */}
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>Sanitized Clean State</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20">Verified</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-300 text-[11px]">
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Median/mode deterministic imputation</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Normalized ISO-8601 timestamps</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Capped statistical outliers with audit diff</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.06] flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>3 View Modes: Split Slider • Side-by-Side • Audit Diff</span>
                  <span className="text-emerald-400 font-bold">1-Click Revert</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. BALANCED FEATURE STORY: AUTONOMOUS AI ANALYST             */}
      {/* ============================================================ */}
      <section id="analyst" className="py-28 border-t border-white/[0.06] bg-[#080A0F] relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Live AI Analyst Reasoning Terminal */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <AiAnalystIndicator />
            </div>

            {/* Right Column: Narrative & Security Guarantees */}
            <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono">
                <Cpu className="w-3.5 h-3.5" />
                <span>Autonomous Analysis Engine</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                An AI Analyst Workspace, Not A Generic Chatbot
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Generic LLMs hallucinate numbers and invent trends. DataPilot AI compiles user queries into Abstract Syntax Trees (AST) and executes deterministic Python calculations (Pandas, SciPy, NumPy) inside an isolated sandbox.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#121722] border border-white/[0.06]">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">AST-Validated Sandbox Execution</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No filesystem writes, shell commands, or network sockets. Pure analytical execution protected by strict CPU timeouts.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#121722] border border-white/[0.06]">
                  <TrendingUp className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Statistical Moment & Correlation Discovery</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pearson matrices, distribution skewness, ANOVA tests, and driver attribution computed in real time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/dashboard">
                  <Button size="md" variant="luxury" className="gap-2">
                    <span>View Sample Analysis</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. BALANCED FEATURE STORY: CONVERSATIONAL BI                 */}
      {/* ============================================================ */}
      <section id="ask-data" className="py-28 border-t border-white/[0.06] bg-[#0D1117]/40 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Narrative & Prompt Starters */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Conversational BI</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Ask Questions in Plain English. Receive Exact Proofs.
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Query hundreds of thousands of rows using natural language. The AI translates questions into mathematical queries and generates clear, cited explanations with interactive visual charts.
              </p>

              {/* Clickable Suggestion Chips */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-mono uppercase text-slate-400 block font-semibold">Try A Sample Query:</span>
                <div className="flex flex-col gap-2">
                  {[
                    "Show monthly revenue trends across all regions",
                    "Which sales channel has the highest margin?",
                    "Identify statistical anomalies in transactions"
                  ].map((query) => (
                    <button
                      key={query}
                      onClick={() => setAskQuery(query)}
                      className="text-left px-3.5 py-2 rounded-xl bg-[#121722] border border-white/[0.06] hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-300 transition flex items-center justify-between group"
                    >
                      <span className="truncate">{query}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Query Box + Rich AI Response Card */}
            <div className="lg:col-span-7 space-y-4">
              {/* Input Bar */}
              <div className="p-2 rounded-2xl bg-[#121722] border border-white/[0.1] shadow-2xl flex items-center gap-3">
                <div className="p-2 text-cyan-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={askQuery}
                  onChange={(e) => setAskQuery(e.target.value)}
                  placeholder="Ask anything about your data..."
                  className="flex-1 bg-transparent text-xs sm:text-sm text-white focus:outline-none placeholder:text-slate-500"
                />
                <Link href="/ask-data">
                  <Button size="sm" variant="luxury" className="gap-1.5 shrink-0 shadow-md shadow-violet-500/15">
                    <span>Ask AI</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              {/* Sample AI Response Card */}
              <Card variant="bento-purple" className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs font-mono">
                  <span className="text-violet-400 flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Synthesis Result
                  </span>
                  <span className="text-emerald-400">14ms • Columns: ARR, Region, Date</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Monthly revenue demonstrated strong secular expansion peaking at <strong className="text-emerald-400">$890K</strong> in August (+24.2% YoY). <strong className="text-white">North America</strong> accounted for the highest gross volume ($542K), while <strong className="text-purple-300">APAC</strong> expanded at the highest velocity (+38.1%).
                </p>

                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-white/[0.06] text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-400">
                  <span>Calculation: <code>df.groupby(['Month','Region'])['ARR'].sum()</code></span>
                  <span className="text-emerald-400 font-bold shrink-0">AST Verified ✓</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. ENTERPRISE CAPABILITIES BENTO GRID                         */}
      {/* ============================================================ */}
      <section id="features" className="py-28 max-w-7xl mx-auto px-6 sm:px-12 w-full">
        <div className="text-center space-y-3 mb-16 max-w-2xl mx-auto">
          <div className="text-xs uppercase font-mono font-bold text-cyan-400 tracking-wider">Enterprise Architecture</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            High-Performance Analytical Canvas
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Engineered for high data throughput, instant cross-filtering, and executive boardroom presentations.
          </p>
        </div>

        {/* Dynamic Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Large 2-column card */}
          <Card variant="bento" className="md:col-span-2 p-7 flex flex-col justify-between hover:border-cyan-500/40 transition duration-300">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Power BI & Tableau-Grade Visual Analytics</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Drag-and-drop 12-column layout with multi-page tabs, interactive slicers, cross-filtering, dynamic chart formatting, and 2x Retina PNG / pure vector SVG exports.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-cyan-400">
              <span>Interactive Cross-Filter Latency: &lt; 5ms</span>
              <Link href="/dashboards" className="flex items-center gap-1 hover:underline">
                Open Visual Analytics <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </Card>

          {/* Card 2: 1-column metric card (Cyan Forecasting) */}
          <Card variant="bento-cyan" className="p-7 flex flex-col justify-between hover:border-cyan-500/50 transition duration-300">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">ARIMA & Holt-Winters Forecasting</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated chronological resampling, multiplicative seasonal decomposition, and 95% confidence intervals.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-white/[0.06] text-xs font-mono text-cyan-400">
              MAPE: 3.2% Precision
            </div>
          </Card>

          {/* Card 3: 1-column audit card */}
          <Card variant="bento" className="p-7 flex flex-col justify-between hover:border-emerald-500/50 transition duration-300">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Boardroom Executive Briefings</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compiles multi-tab styled Excel workbooks and presentation-ready PDF briefings with correlation matrices.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-white/[0.06] text-xs font-mono text-emerald-400">
              PDF & Excel Multi-Tab
            </div>
          </Card>

          {/* Card 4: 2-column card */}
          <Card variant="bento-purple" className="md:col-span-2 p-7 flex flex-col justify-between hover:border-purple-500/50 transition duration-300">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Air-Gapped Tenant Data Isolation</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Zero training on customer datasets. Raw files remain immutable in read-only vaults; all transformations generate clean versions with verifiable cryptographic audit logs.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-purple-300">
              <span>AES-256 GCM Encryption In-Transit & At-Rest</span>
              <span>SOC-2 Type II Validated</span>
            </div>
          </Card>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. COHESIVE TRUST & CLARITY HUB: SECURITY + FAQ (2-COLUMN)   */}
      {/* ============================================================ */}
      <section id="security" className="py-28 border-t border-white/[0.06] bg-gradient-to-b from-[#080A0F] via-[#0D1117]/70 to-[#080A0F]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Zero-Trust Security Enclave */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero-Trust Security</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Zero-Trust AST Execution Enclave
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                DataPilot AI parses analytical statements into Abstract Syntax Trees before execution. Filesystem mutations, shell commands, socket connections, and OS primitives are blocked at bytecode compilation.
              </p>

              <div className="p-5 rounded-2xl bg-[#121722] border border-white/[0.08] space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Zero model training on customer data</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Strict memory and execution timeouts</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full GDPR data portability archive</span>
                </div>
              </div>
            </div>

            {/* Right Column: FAQ Accordion */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1 mb-6">
                <div className="text-xs uppercase font-mono font-bold text-violet-400 tracking-wider">Clarifications</div>
                <h3 className="text-2xl font-bold text-white">Frequently Asked Questions</h3>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => {
                  const isOpen = activeFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-white/[0.08] bg-[#121722]/80 overflow-hidden transition duration-200 hover:border-violet-500/30"
                    >
                      <button
                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                        className="w-full p-4.5 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-white hover:text-violet-300 transition"
                      >
                        <span>{faq.q}</span>
                        <ChevronRight
                          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                            isOpen ? "rotate-90 text-violet-400" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4.5 pb-4.5 text-xs text-slate-300 leading-relaxed border-t border-white/[0.06] pt-3">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. HIGH-IMPACT CONVERSION CTA                                 */}
      {/* ============================================================ */}
      <section className="py-28 border-t border-white/[0.08] bg-gradient-to-b from-[#121722] via-[#0D1117] to-[#080A0F] text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-violet-500/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-12 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight shimmer-text leading-tight">
            Ready to Turn Raw Data Into Decisions?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Upload any CSV, Excel, Parquet, or JSON dataset. Experience the speed, rigor, and clarity of autonomous data intelligence.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            <Button size="lg" variant="luxury" onClick={() => setUploadOpen(true)} className="gap-2 shadow-xl shadow-violet-500/20 px-6">
              <span>Start Analyzing Now</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="px-5 border-white/[0.1] hover:border-violet-500/40">
                Explore Live Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 10. MINIMALIST BRAND FOOTER                                   */}
      {/* ============================================================ */}
      <footer className="border-t border-white/[0.07] py-8 px-6 sm:px-12 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-2 font-semibold text-slate-400">
          <Sparkles className="w-4 h-4 text-violet-400" />
          DataPilot AI — "Your data. Your questions. AI-powered answers."
        </div>
        <p>© 2026 DataPilot AI. All rights reserved.</p>
      </footer>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={(ds) => {
          router.push(`/datasets/${ds.id}`);
        }}
      />
    </div>
  );
}
