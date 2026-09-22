"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  MessageSquareCode, 
  Send, 
  Sparkles, 
  Terminal, 
  RotateCcw,
  Loader2,
  Table as TableIcon,
  BarChart2
} from "lucide-react";
import { Dataset, AskDataResponse } from "@/types";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DynamicChart } from "@/components/charts/DynamicChart";
import { DEMO_DATASETS } from "@/lib/demoDatasets";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  data?: AskDataResponse;
}

function FormattedText({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }
        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
        const isNumbered = /^\d+\.\s/.test(trimmed);
        const textContent = isBullet
          ? trimmed.substring(2)
          : isNumbered
          ? trimmed.replace(/^\d+\.\s/, "")
          : trimmed;

        // Parse bold **text** and `code`
        const parts = textContent.split(/(\*\*.*?\*\*|`.*?`)/g);
        const rendered = parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="font-semibold text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code key={pIdx} className="px-1.5 py-0.5 rounded bg-slate-950 font-mono text-[11px] text-cyan-300 border border-slate-800">
                {part.slice(1, -1)}
              </code>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-violet-400 mt-1 shrink-0 text-[10px]">●</span>
              <span className="text-slate-200">{rendered}</span>
            </div>
          );
        }

        if (isNumbered) {
          const match = trimmed.match(/^(\d+)\.\s/);
          const num = match ? match[1] : "";
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-cyan-400 font-mono font-semibold shrink-0 text-[11px]">{num}.</span>
              <span className="text-slate-200">{rendered}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="text-slate-200">
            {rendered}
          </p>
        );
      })}
    </div>
  );
}

function AskDataContent() {
  const searchParams = useSearchParams();
  const datasetIdParam = searchParams.get("datasetId");
  const initialQuery = searchParams.get("q");

  const [datasets, setDatasets] = useState<Dataset[]>(DEMO_DATASETS);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(datasetIdParam || "demo-ds-sales");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content:
        "Hello! I am your AI Data Analyst. Ask me any analytical question about your dataset, and I will safely formulate the analysis, compute the verified statistics, and generate interactive visualizations.",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentDataset = datasets.find((d) => d.id === selectedDatasetId) || datasets[0];

  useEffect(() => {
    const init = async () => {
      try {
        const list = await api.datasets.list();
        if (list && list.length > 0) {
          setDatasets(list);
        }
        let targetId = datasetIdParam;
        if (!targetId && list && list.length > 0) {
          targetId = list[0].id;
        }
        if (targetId) {
          setSelectedDatasetId(targetId);
          const activeDs = list?.find((d) => d.id === targetId);
          setMessages([
            {
              id: "intro",
              role: "assistant",
              content: `Hello! I am your AI Data Analyst for **${activeDs?.name || "your dataset"}** (${activeDs?.row_count?.toLocaleString() || 60} records). Ask me any analytical question, or click one of the suggested queries below.`,
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
          id: response.message_id || `asst_${Date.now()}`,
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

  const sampleQuestions = React.useMemo(() => {
    if (selectedDatasetId === "demo-ds-saas") {
      return [
        "What is the average churn risk by subscription plan?",
        "Which plan tier generates the highest MRR?",
        "Compare support ticket volume across active vs churned accounts",
        "Show account status distribution",
        "What is the average NPS score for Enterprise accounts?",
      ];
    }
    if (selectedDatasetId === "demo-ds-clinical") {
      return [
        "What is the mean efficacy score by treatment cohort?",
        "Are adverse events correlated with patient dosage?",
        "Show distribution of systolic blood pressure",
        "Compare recovery rates across cohorts",
        "What is the average patient age in the study?",
      ];
    }
    return [
      "What is total Revenue and Profit?",
      "Top product categories by Revenue",
      "Compare Profit across Regions",
      "Show monthly sales trend",
      "What is the average transaction value?",
    ];
  }, [selectedDatasetId]);

  const handleResetChat = () => {
    setMessages([
      {
        id: "intro",
        role: "assistant",
        content: `Conversation reset. I am your AI Data Analyst for **${currentDataset?.name || "your dataset"}** (${currentDataset?.row_count?.toLocaleString() || 60} records). Ask me any analytical question, or click one of the suggested queries below.`,
      },
    ]);
  };

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
              <p className="text-[11px] text-slate-400">Natural language analytical queries executed with verified computations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {datasets.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Dataset:</span>
                <select
                  value={selectedDatasetId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedDatasetId(newId);
                    const targetDs = datasets.find((d) => d.id === newId);
                    setMessages([
                      {
                        id: `switch_${Date.now()}`,
                        role: "assistant",
                        content: `Switched dataset to **${targetDs?.name || "Dataset"}** (${targetDs?.row_count?.toLocaleString() || 60} records). What would you like to calculate? Try one of the suggested analytical questions below.`,
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

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetChat}
              className="text-xs text-slate-400 hover:text-white border-slate-800 hover:border-slate-700 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </div>
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
                  {m.role === "user" ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <FormattedText content={m.content} />
                  )}

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
                                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider font-mono">Executed Analytical Code:</span>
                                <button
                                  onClick={() => navigator.clipboard.writeText(m.data?.executed_code || "")}
                                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono cursor-pointer"
                                >
                                  Copy Code
                                </button>
                              </div>
                              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre">
                                {m.data.executed_code}
                              </pre>
                            </div>
                          )}

                          {/* Execution Steps */}
                          {m.data.analysis_steps && m.data.analysis_steps.length > 0 && (
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
                  <Card className="overflow-hidden border-slate-800 bg-slate-900/90 shadow-lg">
                    <div className="px-3.5 py-2 border-b border-slate-800 flex items-center gap-2 bg-slate-950/60">
                      <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[11px] font-semibold text-slate-300">Tabular Calculation Result</span>
                    </div>
                    <div className="overflow-x-auto max-h-56">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-950 sticky top-0 border-b border-slate-800 text-slate-400">
                          <tr>
                            {(m.data.result_columns || Object.keys(m.data.tabular_result[0])).map((col, cIdx) => (
                              <th key={`th-${col}-${cIdx}`} className="p-2.5 font-semibold text-[11px] font-mono text-slate-300">
                                {col.replace(/_/g, " ")}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                          {m.data.tabular_result.map((row, rIdx) => {
                            const cols = m.data?.result_columns || Object.keys(row);
                            return (
                              <tr key={`row-${rIdx}`} className="hover:bg-slate-800/40 transition">
                                {cols.map((col, cIdx) => (
                                  <td key={`td-${rIdx}-${col}-${cIdx}`} className="p-2.5 text-slate-200 whitespace-nowrap">
                                    {row[col] !== undefined && row[col] !== null
                                      ? typeof row[col] === "number"
                                        ? row[col].toLocaleString()
                                        : String(row[col])
                                      : "—"}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* Chart Preview (if generated from NL query) */}
                {m.data?.chart_config && (
                  <Card className="p-4 bg-slate-900/90 border-slate-800 shadow-lg">
                    <div className="mb-2 flex items-center gap-2 text-slate-400">
                      <BarChart2 className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-[11px] font-medium text-slate-300">Generated Interactive Chart</span>
                    </div>
                    <DynamicChart config={m.data.chart_config} height={260} color_palette="blue" />
                  </Card>
                )}

                {/* Follow-up Suggestions */}
                {m.data?.suggestions && m.data.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.data.suggestions.map((sugg, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSendQuery(selectedDatasetId, sugg)}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer"
                      >
                        {sugg}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {m.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center shrink-0 text-xs font-bold border border-slate-700">
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

        {/* Input Bar & Persistent Suggestions */}
        <div className="border-t border-slate-800 bg-slate-900/70 p-4 shrink-0">
          <div className="max-w-4xl mx-auto space-y-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px] text-slate-400">
              <span className="shrink-0 font-medium text-slate-400 flex items-center gap-1.5 mr-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Suggested:
              </span>
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendQuery(selectedDatasetId, q)}
                  className="shrink-0 px-3 py-1 rounded-full bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-violet-500/40 transition text-[11px] font-medium cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

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
                placeholder="Ask any analytical question, e.g. 'What is total Revenue and Profit?' or 'Show monthly sales trend'..."
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
