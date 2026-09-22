"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  MessageSquareCode, 
  Send, 
  Sparkles, 
  Database, 
  Terminal, 
  BarChart3, 
  CheckCircle2, 
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { Dataset, AskDataResponse } from "@/types";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DynamicChart } from "@/components/charts/DynamicChart";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  data?: AskDataResponse;
}

function AskDataContent() {
  const searchParams = useSearchParams();
  const datasetIdParam = searchParams.get("datasetId");
  const initialQuery = searchParams.get("q");

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const list = await api.datasets.list();
        setDatasets(list);
        let targetId = datasetIdParam;
        if (!targetId && list.length > 0) {
          targetId = list[0].id;
        }
        if (targetId) {
          setSelectedDatasetId(targetId);
          // Initial greeting
          setMessages([
            {
              id: "intro",
              role: "assistant",
              content:
                "Hello! I am your AI Data Analyst. Ask me any analytical question about your dataset, and I will safely formulate the analysis, compute the answer, and generate an interactive visualization.",
            },
          ]);

          if (initialQuery) {
            handleSendQuery(targetId, initialQuery);
          }
        }
      } catch (err) {
        console.error("Failed to load datasets", err);
      }
    };
    init();
  }, [datasetIdParam]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendQuery = async (targetDsId: string, q: string) => {
    if (!q.trim()) return;
    const userMsgId = `user_${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: q }]);
    setInputQuery("");
    setLoading(true);

    try {
      const response = await api.askData.ask(targetDsId, q, conversationId);
      setConversationId(response.conversation_id);
      setMessages((prev) => [
        ...prev,
        {
          id: response.message_id,
          role: "assistant",
          content: response.answer_text,
          data: response,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: `I encountered an issue computing that: ${err.message || "Please check your column names."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "What is total Revenue and Profit?",
    "Top 5 categories by Revenue",
    "Compare Profit across Regions",
    "Show monthly sales trend",
    "What is the average transaction value?",
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />

        {/* Workspace Top Toolbar */}
        <div className="border-b border-slate-800 bg-slate-900/60 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <MessageSquareCode className="w-5 h-5 text-violet-400" />
            <div>
              <h1 className="text-sm font-semibold text-white">Conversational BI & Ask Your Data</h1>
              <p className="text-[11px] text-slate-400">Natural language analytical queries executed in a sandboxed Python runtime</p>
            </div>
          </div>

          {datasets.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Dataset:</span>
              <select
                value={selectedDatasetId}
                onChange={(e) => {
                  setSelectedDatasetId(e.target.value);
                  setMessages([
                    {
                      id: `switch_${Date.now()}`,
                      role: "assistant",
                      content: `Switched dataset. What would you like to calculate on this data?`,
                    },
                  ]);
                }}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-500 font-medium"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.row_count.toLocaleString()} rows)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Chat History & Stream Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl w-full mx-auto">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-cyan-400 text-white flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20 text-xs font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-3 ${m.role === "user" ? "items-end" : "items-start"}`}>
                {/* Text Bubble */}
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white font-medium rounded-tr-none shadow-md shadow-blue-600/20"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-xl"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {/* Show Analysis & Calculation Transparency Drawer */}
                  {m.data && (m.data.executed_code || m.data.analysis_steps) && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80">
                      <details className="text-xs group" open={false}>
                        <summary className="cursor-pointer font-semibold text-slate-300 hover:text-white flex items-center justify-between text-[11px] select-none">
                          <span className="flex items-center gap-1.5 text-cyan-400">
                            <Terminal className="w-3.5 h-3.5" />
                            Show Analysis & Calculation Transparency
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono group-open:rotate-90 transition-transform">▶</span>
                        </summary>
                        
                        <div className="mt-3 space-y-3 pl-1">
                          {/* Filter Explanation Note */}
                          {m.data.filter_explanation && (
                            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300">
                              <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">Filter Logic:</span>
                              {m.data.filter_explanation}
                            </div>
                          )}

                          {/* Queried Columns */}
                          {m.data.queried_columns && m.data.queried_columns.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Queried Columns:</span>
                              {Array.from(new Set(m.data.queried_columns.map(String))).map((c, cIdx) => (
                                <span key={`qcol-${c}-${cIdx}`} className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Sandboxed Python Code */}
                          {m.data.executed_code && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider font-mono">Sandboxed Pandas Code:</span>
                                <button
                                  onClick={() => navigator.clipboard.writeText(m.data?.executed_code || "")}
                                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono"
                                >
                                  Copy Code
                                </button>
                              </div>
                              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                                {m.data.executed_code}
                              </pre>
                            </div>
                          )}

                          {/* Execution Steps */}
                          {m.data.analysis_steps && (
                            <div className="space-y-1 pt-1">
                              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Analytical Steps:</span>
                              {m.data.analysis_steps.map((s, sIdx) => (
                                <div key={`step-${s.step_number ?? sIdx}-${sIdx}`} className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                  <span className="text-blue-400 font-mono text-[10px]">{s.step_number}.</span>
                                  <span>{s.description}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  )}
                </div>

                {/* Tabular Result (if present) */}
                {m.data?.tabular_result && m.data.tabular_result.length > 0 && (
                  <Card className="overflow-hidden border-slate-800">
                    <div className="overflow-x-auto max-h-56">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-950 sticky top-0 border-b border-slate-800 text-slate-400">
                          <tr>
                            {m.data.result_columns?.map((col, cIdx) => (
                              <th key={`th-${col}-${cIdx}`} className="p-2.5 font-semibold text-[11px] font-mono">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                          {m.data.tabular_result.map((row, rIdx) => (
                            <tr key={`row-${rIdx}`} className="hover:bg-slate-900/50">
                              {m.data?.result_columns?.map((col, cIdx) => (
                                <td key={`td-${rIdx}-${col}-${cIdx}`} className="p-2.5 text-slate-200 whitespace-nowrap">
                                  {typeof row[col] === "number" ? row[col].toLocaleString() : String(row[col])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* Chart Preview (if generated from NL query) */}
                {m.data?.chart_config && (
                  <Card className="p-4">
                    <DynamicChart config={m.data.chart_config} height={240} />
                  </Card>
                )}

                {/* Follow-up Suggestions */}
                {m.data?.suggestions && m.data.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.data.suggestions.map((sugg, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSendQuery(selectedDatasetId, sugg)}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition"
                      >
                        {sugg}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {m.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center shrink-0 text-xs font-bold">
                  You
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-cyan-400 text-white flex items-center justify-center shrink-0 text-xs font-bold animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                Formulating analytical plan & executing sandboxed code...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-800 bg-slate-900/70 p-4 shrink-0">
          <div className="max-w-4xl mx-auto space-y-2.5">
            {messages.length <= 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px] text-slate-400">
                <span className="shrink-0 font-medium text-slate-500">Suggested:</span>
                {sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuery(selectedDatasetId, q)}
                    className="shrink-0 px-2.5 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery(selectedDatasetId, inputQuery);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask any question, e.g., 'What are top 5 products by profit?' or 'Show monthly revenue trend'..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
              />
              <Button type="submit" size="md" disabled={!inputQuery.trim() || loading} variant="luxury">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AskDataPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-slate-950 items-center justify-center text-xs text-slate-400">
          Loading Conversational BI...
        </div>
      }
    >
      <AskDataContent />
    </Suspense>
  );
}
