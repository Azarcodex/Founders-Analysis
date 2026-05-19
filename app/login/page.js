"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, Lock, Mail, Server } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seedingStatus, setSeedingStatus] = useState("idle"); // idle, seeding, seeded, error

  // Auto-seed database on page load to ensure founders exist
  useEffect(() => {
    const autoSeed = async () => {
      try {
        setSeedingStatus("seeding");
        const res = await fetch("/api/auth/seed");
        if (res.ok) {
          setSeedingStatus("seeded");
        } else {
          setSeedingStatus("error");
        }
      } catch (err) {
        console.error("Auto seed failed", err);
        setSeedingStatus("error");
      }
    };
    autoSeed();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      console.error(err);
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (founderEmail) => {
    setEmail(founderEmail);
    setPassword("mallzo2026");
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic background highlights */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
        
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 font-extrabold text-2xl tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            Mallzo <span className="text-zinc-100 font-light">OS</span>
          </div>
          <p className="text-zinc-400 text-sm">
            Founder Accountability & Strategy Operating System
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Seeding Indicator */}
        {seedingStatus === "seeding" && (
          <div className="mb-6 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              Initializing founder accounts...
            </span>
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-2 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@mallzo.com"
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/80 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-650 transition outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-2 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/80 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-650 transition outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-violet-650 hover:bg-violet-600 active:scale-[0.98] text-white font-semibold text-sm transition shadow-lg shadow-violet-950/40 flex items-center justify-center gap-2"
          >
            {loading ? "Logging in..." : "Access Dashboard"}
          </button>
        </form>

        {/* Quick Credentials Seeding */}
        <div className="mt-8 pt-6 border-t border-zinc-900">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest text-center mb-4">
            Quick-Fill Founder Credentials
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: "Azarin", email: "azarin@mallzo.com" },
              { name: "Najeeb", email: "najeeb@mallzo.com" },
              { name: "Rima", email: "rima@mallzo.com" },
            ].map((f) => (
              <button
                key={f.name}
                onClick={() => handleQuickFill(f.email)}
                type="button"
                className="py-2.5 px-2 rounded-xl bg-zinc-900/40 border border-zinc-850 hover:bg-zinc-900 hover:border-zinc-700 active:scale-[0.97] transition text-zinc-300 font-medium text-xs text-center"
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
