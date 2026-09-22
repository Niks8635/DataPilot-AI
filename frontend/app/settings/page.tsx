"use client";

import React, { useState } from "react";
import { 
  Settings as SettingsIcon, 
  Key, 
  Sparkles, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Database,
  Cpu
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function SettingsPage() {
  const [provider, setProvider] = useState("auto");
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 space-y-6 max-w-4xl w-full mx-auto">
          <div className="border-b border-slate-800 pb-5">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-blue-500" />
              Settings & Configuration
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage analytical AI providers, database connections, and sandbox limits.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* AI Provider Config */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Cpu className="w-4 h-4 text-blue-400" />
                  AI Intelligence Provider
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure your preferred LLM provider for narrative insight synthesis and code translation.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Select Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="auto">Auto-detect (Gemini / OpenAI / Anthropic or Analytical Heuristics)</option>
                    <option value="gemini">Google Gemini (Gemini 1.5 Flash)</option>
                    <option value="openai">OpenAI (GPT-4o-mini)</option>
                    <option value="anthropic">Anthropic (Claude 3 Haiku)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Provider API Key (Optional)
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-... or AIzaSy... (leave blank to use server environment variables)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Keys can also be configured directly in your <code className="text-slate-400">backend/.env</code> file.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sandbox Execution Rules */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Safe Execution Sandbox Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div>
                    <div className="font-semibold text-white">AST Abstract Syntax Tree Validation</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Prevents imports, system calls, network sockets, file I/O, and shell commands.
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div>
                    <div className="font-semibold text-white">Execution Timeout Limit</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Enforces hard 5-second computation ceiling per query to eliminate infinite loops.
                    </div>
                  </div>
                  <Badge variant="outline">5 Seconds</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              {saved ? (
                <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Settings saved successfully!
                </div>
              ) : <div />}

              <Button type="submit" size="sm" variant="primary">
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Preferences
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
