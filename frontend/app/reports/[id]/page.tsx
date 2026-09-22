"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Report } from "@/types";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params?.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reportId) {
      api.reports.get(reportId)
        .then(setReport)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [reportId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !report) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <div className="flex-1 flex items-center justify-center p-12 text-xs text-slate-400">
            Loading report...
          </div>
        </div>
      </div>
    );
  }

  const content = report.content || {};

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 space-y-6 max-w-5xl w-full mx-auto print:p-0 print:m-0">
          {/* Top Actions (hidden during print) */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
            <Link href="/reports" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Reports
            </Link>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1 text-purple-400" />
                Print / Save as PDF
              </Button>
              <a
                href={api.reports.getHtmlUrl(report.id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-blue-600 hover:bg-blue-500 text-white transition font-medium"
              >
                Standalone View
              </a>
            </div>
          </div>

          {/* Printable Report Document Sheet */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 shadow-2xl space-y-8 print:bg-white print:text-black print:border-none print:shadow-none print:p-4">
            {/* Header */}
            <div className="border-b border-slate-800 pb-6 print:border-slate-300">
              <div className="text-xs uppercase font-bold text-blue-400 tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                DataPilot AI Executive Audit
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white print:text-black">
                {report.title}
              </h1>
              <div className="text-xs text-slate-400 print:text-slate-600 mt-2 flex items-center gap-2">
                <span>Dataset: <strong>{content.dataset_name}</strong></span>
                <span>•</span>
                <span>Generated: {new Date(report.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
                Executive Summary
              </h2>
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 print:bg-slate-50 print:border-slate-300 text-xs sm:text-sm text-slate-200 print:text-slate-800 leading-relaxed">
                {content.executive_summary}
              </div>
            </div>

            {/* Top KPIs */}
            {content.kpis && (
              <div className="space-y-3">
                <h2 className="text-base font-bold text-white print:text-black">
                  Key Performance Indicators
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {content.kpis.map((k: any) => (
                    <div
                      key={k.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:bg-slate-50 print:border-slate-300"
                    >
                      <div className="text-[10px] uppercase font-semibold text-slate-400 print:text-slate-600 tracking-wider">
                        {k.label}
                      </div>
                      <div className="text-xl font-bold text-white print:text-black mt-1">
                        {k.formatted_value}
                      </div>
                      {k.subtext && (
                        <div className="text-[10px] text-slate-400 print:text-slate-600 mt-0.5">
                          {k.subtext}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Insights List */}
            {content.key_insights && content.key_insights.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-bold text-white print:text-black">
                  Analytical Findings
                </h2>
                <div className="space-y-2">
                  {content.key_insights.map((ins: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 print:bg-white print:border-slate-200 text-xs text-slate-200 print:text-slate-800 flex items-start gap-2.5"
                    >
                      <span className="font-mono text-blue-400 font-bold">{idx + 1}.</span>
                      <span>{ins}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strategic Recommendations */}
            {content.recommendations && content.recommendations.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-bold text-white print:text-black">
                  Strategic Business Recommendations
                </h2>
                <div className="space-y-2">
                  {content.recommendations.map((rec: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 print:bg-slate-50 print:border-slate-200 text-xs text-emerald-300 print:text-slate-800 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Quality & Cleaning Audit */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-white print:text-black">
                Data Quality Health & Audit Trail
              </h2>
              <div className="text-xs text-slate-400 print:text-slate-600 mb-2">
                Quality Score: <strong className="text-white print:text-black">{content.data_quality?.score}/100 ({content.data_quality?.grade})</strong>
              </div>
              <div className="border border-slate-800 print:border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 print:bg-slate-100 text-slate-400 print:text-slate-600 border-b border-slate-800 print:border-slate-300">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Action Type</th>
                      <th className="p-3">Transformation Details</th>
                      <th className="p-3">Affected Rows</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-slate-200 font-mono text-[11px]">
                    {content.cleaning_history && content.cleaning_history.length > 0 ? (
                      content.cleaning_history.map((c: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-3">{idx + 1}</td>
                          <td className="p-3 text-purple-400 print:text-purple-700">{c.operation_type}</td>
                          <td className="p-3 text-slate-200 print:text-slate-800">{c.summary}</td>
                          <td className="p-3">{c.affected_rows}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500">
                          Original raw dataset analyzed with no mutation applied.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-slate-800 print:border-slate-300 text-center text-xs text-slate-500">
              DataPilot AI — "Your data. Your questions. AI-powered answers."
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
