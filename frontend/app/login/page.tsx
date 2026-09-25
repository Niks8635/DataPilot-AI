"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Lock, Mail, AlertCircle, ShieldCheck, Home, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registeredParam = searchParams.get("registered");
  const emailParam = searchParams.get("email");

  const [email, setEmail] = useState("analyst@datapilot.ai");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    if (registeredParam === "1") {
      setJustRegistered(true);
      if (emailParam) {
        setEmail(emailParam);
        setPassword("");
      }
    }
  }, [registeredParam, emailParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const res = await api.auth.login({ email, password });
      localStorage.setItem("datapilot_token", res.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    localStorage.setItem("datapilot_token", "demo-token");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 relative overflow-hidden dot-pattern">
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Return to Home Button */}
      <div className="fixed top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/[0.08] hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-medium transition-all shadow-lg backdrop-blur-md group active:scale-[0.98]"
          title="Return to Main Website Home"
        >
          <Home className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span>Return to Home</span>
        </Link>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              DataPilot <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono">AI</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-white tracking-tight">Sign in to your account</h2>
          <p className="text-xs text-slate-400">
            Access your analytical workspace, datasets, and reports
          </p>
        </div>

        <Card className="p-6 border-white/[0.09] bg-slate-900/80 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            {justRegistered && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-600/40 text-xs text-emerald-300 flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Registration successful!</span>
                  <p className="text-[11px] text-emerald-300/90 mt-0.5">
                    Your account has been created. Please enter your password to sign in.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="analyst@datapilot.ai"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 transition"
                />
              </div>
            </div>

            <Button type="submit" size="md" variant="luxury" className="w-full" loading={loading}>
              Sign In
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500 text-[10px] font-semibold">Or Instant Access</span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full hover:border-emerald-500/40"
              onClick={handleQuickDemo}
            >
              <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-400" />
              Continue in Demo Mode (Zero-Config)
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            Don't have an account?{" "}
            <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium">
              Create an account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-400">
          Loading Sign In...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
