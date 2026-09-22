"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, Sparkles, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { Dataset } from "@/types";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (dataset: Dataset) => void;
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "parsing" | "profiling" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      selectFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      selectFile(e.target.files[0]);
    }
  };

  const selectFile = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    const valid = ["csv", "xlsx", "xls", "json", "parquet"];
    if (!ext || !valid.includes(ext)) {
      setErrorMessage(`Unsupported format .${ext}. Please select CSV, XLSX, XLS, JSON, or Parquet.`);
      return;
    }
    setErrorMessage("");
    setFile(selectedFile);
    if (!datasetName) {
      setDatasetName(selectedFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setStatus("uploading");
      // Simulate stepped progression UX
      setTimeout(() => setStatus("parsing"), 400);
      setTimeout(() => setStatus("profiling"), 900);

      const dataset = await api.datasets.upload(file, datasetName);
      setStatus("ready");
      setTimeout(() => {
        onSuccess(dataset);
        reset();
      }, 500);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to process dataset. Please check the file formatting.");
    }
  };

  const handleLoadDemo = async (demoType = "sales") => {
    try {
      setDemoLoading(true);
      setErrorMessage("");
      const dataset = await api.datasets.loadDemo(demoType);
      onSuccess(dataset);
      reset();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load demo dataset.");
    } finally {
      setDemoLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setDatasetName("");
    setStatus("idle");
    setErrorMessage("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={reset} title="Upload Dataset" description="Upload CSV, Excel, JSON, or Parquet for automated end-to-end analysis">
      <div className="space-y-4">
        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
            dragActive
              ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
              : "border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/70"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.json,.parquet"
            onChange={handleChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-200">
              {file ? file.name : "Click to upload or drag & drop"}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports CSV, XLSX, XLS, JSON, Parquet (up to 100MB)"}
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <Badge variant="outline">CSV</Badge>
            <Badge variant="outline">XLSX</Badge>
            <Badge variant="outline">XLS</Badge>
            <Badge variant="outline">JSON</Badge>
            <Badge variant="outline">PARQUET</Badge>
          </div>
        </div>

        {/* Dataset Name Input */}
        {file && (
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Dataset Name</label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder="e.g., Q3 Sales & Operations"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        )}

        {/* Processing Stepper Status */}
        {status !== "idle" && (
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between font-medium text-slate-300">
              <span className="flex items-center gap-2">
                {status === "ready" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : status === "error" ? (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                )}
                {status === "uploading" && "Uploading raw dataset..."}
                {status === "parsing" && "Parsing & validating structure..."}
                {status === "profiling" && "Running Profiler & Data Quality Engine..."}
                {status === "ready" && "Ready! Analysis synthesized."}
                {status === "error" && "Analysis error occurred"}
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Demo Datasets Quick Bar */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Or explore pre-configured demo datasets:</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={demoLoading || (status !== "idle" && status !== "error")}
              onClick={() => handleLoadDemo("sales")}
              className="p-2 rounded-xl border border-white/[0.08] bg-slate-900/80 hover:bg-slate-850 hover:border-violet-500/40 text-left transition flex flex-col justify-between group disabled:opacity-50"
            >
              <div className="text-[10px] font-mono text-violet-400 uppercase font-bold">CSV • 1.2K rows</div>
              <div className="text-xs font-semibold text-white group-hover:text-violet-300 truncate">E-Commerce Sales</div>
              <div className="text-[10px] text-slate-400 truncate">12 fields (Revenue, Margin)</div>
            </button>
            <button
              type="button"
              disabled={demoLoading || (status !== "idle" && status !== "error")}
              onClick={() => handleLoadDemo("saas")}
              className="p-2 rounded-xl border border-white/[0.08] bg-slate-900/80 hover:bg-slate-850 hover:border-cyan-500/40 text-left transition flex flex-col justify-between group disabled:opacity-50"
            >
              <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Parquet • 850 rows</div>
              <div className="text-xs font-semibold text-white group-hover:text-cyan-300 truncate">SaaS Churn</div>
              <div className="text-[10px] text-slate-400 truncate">11 fields (MRR, NPS, Risk)</div>
            </button>
            <button
              type="button"
              disabled={demoLoading || (status !== "idle" && status !== "error")}
              onClick={() => handleLoadDemo("clinical")}
              className="p-2 rounded-xl border border-white/[0.08] bg-slate-900/80 hover:bg-slate-850 hover:border-emerald-500/40 text-left transition flex flex-col justify-between group disabled:opacity-50"
            >
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold">JSON • 500 rows</div>
              <div className="text-xs font-semibold text-white group-hover:text-emerald-300 truncate">Clinical Trials</div>
              <div className="text-[10px] text-slate-400 truncate">12 fields (Efficacy, Vitals)</div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!file || status === "uploading" || status === "parsing" || status === "profiling"}
              loading={status === "uploading" || status === "parsing" || status === "profiling"}
              onClick={handleUpload}
            >
              Analyze Dataset
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
