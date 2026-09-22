"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Printer, 
  Sparkles, 
  Check, 
  Layers, 
  Download, 
  ExternalLink, 
  Eye, 
  RefreshCw,
  Sliders
} from "lucide-react";
import { Report } from "@/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface ReportBuilderProps {
  datasetId: string;
  datasetName: string;
}

const AVAILABLE_SECTIONS = [
  { id: "executive_summary", label: "Executive Summary & Structured Findings", desc: "McKinsey-style summary, strategic cards, and core takeaways" },
  { id: "kpis", label: "Key Performance Indicators (KPIs)", desc: "High-level aggregate scorecards and metrics" },
  { id: "quality", label: "Data Quality & Health Scorecard", desc: "Overall health grade, issue audit, and deductions" },
  { id: "segments", label: "Segment Breakdown & Pareto Concentration", desc: "80/20 driver distributions and bivariate tables" },
  { id: "forecast", label: "Predictive Time-Series Forecast", desc: "Holt-Winters projections with 95% confidence intervals" },
  { id: "correlations", label: "Correlation & Multicollinearity Matrix", desc: "Pairwise linear dependencies and collinearity flags" },
  { id: "anomalies", label: "Statistical Anomalies & Outliers", desc: "1.5x IQR boundaries and extreme data instances" },
  { id: "dictionary", label: "Dataset Schema & Data Dictionary", desc: "Full breakdown of column types, null counts, and roles" },
  { id: "methodology", label: "Analytical Methodology & Calculation Standards", desc: "Detailed mathematical foundations and scoring algorithms" },
  { id: "limitations", label: "Data Limitations & Assumptions", desc: "Stationarity caveats, causal boundaries, and scope notes" },
];

export function ReportBuilder({ datasetId, datasetName }: ReportBuilderProps) {
  const [title, setTitle] = useState(`Executive Analytics Report — ${datasetName}`);
  const [selectedSections, setSelectedSections] = useState<string[]>([
    "executive_summary", "kpis", "quality", "segments", "forecast", "methodology", "limitations", "dictionary"
  ]);
  const [customNotes, setCustomNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<Report | null>(null);

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const rep = await api.reports.generate(datasetId, title, selectedSections, customNotes);
      setGeneratedReport(rep);
    } catch (err: any) {
      alert("Failed to build report: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!generatedReport) return;
    const win = window.open(api.reports.getHtmlUrl(generatedReport.id), "_blank");
    if (win) {
      win.focus();
    }
  };

  return (
    <div className="space-y-6">
      {/* Builder Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            Executive Report Builder
          </div>
          <h2 className="text-xl font-bold text-white">Customizable Executive Briefing Generator</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Select exact analytical modules, embed customized management commentary, and generate publication-ready PDF reports with rigorous methodology and limitation disclosures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {generatedReport && (
            <Button variant="primary" size="sm" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print to PDF / View
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configuration Controls */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Report Title */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Report Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Custom Management Commentary */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Commentary & Strategic Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., 'Prepared for the Board of Directors Q3 Strategy Review. Focus on revenue retention and margin leakages.'"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Section Toggles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Included Sections ({selectedSections.length})
                  </span>
                  <button
                    onClick={() =>
                      setSelectedSections(
                        selectedSections.length === AVAILABLE_SECTIONS.length
                          ? []
                          : AVAILABLE_SECTIONS.map((s) => s.id)
                      )
                    }
                    className="text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    {selectedSections.length === AVAILABLE_SECTIONS.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {AVAILABLE_SECTIONS.map((sec) => {
                    const isChecked = selectedSections.includes(sec.id);
                    return (
                      <div
                        key={sec.id}
                        onClick={() => toggleSection(sec.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-start gap-2.5 ${
                          isChecked
                            ? "bg-blue-500/10 border-blue-500/40 text-slate-200"
                            : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                            isChecked
                              ? "bg-blue-600 border-blue-500 text-white"
                              : "border-slate-700 bg-slate-900"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="font-semibold text-xs leading-tight">{sec.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{sec.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                className="w-full text-xs font-semibold"
                onClick={handleGenerate}
                loading={generating}
                disabled={selectedSections.length === 0}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Generate Executive Report
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right 2 Columns: Report Live Preview */}
        <div className="lg:col-span-2">
          {generatedReport ? (
            <Card className="overflow-hidden border-slate-800 h-full flex flex-col">
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200">{generatedReport.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                    Open Print / PDF View
                  </Button>
                </div>
              </div>

              {/* Embedded Document Frame */}
              <div className="flex-1 bg-white min-h-[600px]">
                <iframe
                  src={api.reports.getHtmlUrl(generatedReport.id)}
                  title="Report Preview"
                  className="w-full h-full min-h-[600px] border-none"
                />
              </div>
            </Card>
          ) : (
            <div className="p-16 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/40 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No Report Generated Yet</h3>
              <p className="text-xs text-slate-400 max-w-md">
                Configure your desired analytical modules on the left and click <strong>Generate Executive Report</strong> to preview the comprehensive briefing here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
