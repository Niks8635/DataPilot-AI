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

  const handleLoadDemo = async () => {
    try {
      setDemoLoading(true);
      setErrorMessage("");
      const dataset = await api.datasets.loadDemo();
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

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleLoadDemo}
            loading={demoLoading}
            disabled={status !== "idle" && status !== "error"}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-cyan-400" />
            Try Demo Sales Data
          </Button>

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
