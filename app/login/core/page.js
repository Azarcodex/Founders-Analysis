"use client";

import { useState, useEffect } from "react";
import { useCoreAuth } from "@/context/CoreAuthContext";
import { AlertCircle, Lock, Mail, Server, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function CoreLoginPage() {
  const { login: coreLogin } = useCoreAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seedingStatus, setSeedingStatus] = useState("idle");

  const [coreMembers, setCoreMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  // Auto-seed and fetch core members on mount
  useEffect(() => {
    const autoSeedAndFetch = async () => {
      try {
        setSeedingStatus("seeding");
        // Trigger seeding
        await fetch("/api/core/auth/seed");
        setSeedingStatus("seeded");
        
        // Fetch core list
        const res = await fetch("/api/core/auth/list");
        if (res.ok) {
          const data = await res.json();
          setCoreMembers(data.members || []);
        }
      } catch (err) {
        console.error("Core auto seed or fetch failed", err);
        setSeedingStatus("error");
      }
    };
    autoSeedAndFetch();
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
      await coreLogin(email, password);
    } catch (err) {
      console.error(err);
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCoreQuickFill = (member) => {
    setSelectedMemberId(member._id);
    setEmail(member.email);
    setPassword("mallzo2026");
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-y-auto font-sans">
      {/* Dynamic background highlights */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-lg bg-zinc-950/40 border border-zinc-800/85 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative z-10 my-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 font-extrabold text-2xl tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            Mallzo <span className="text-zinc-100 font-light">Workspace</span>
          </div>
          <p className="text-zinc-400 text-sm">
            Core Collaborator Hub Login
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2.5 animate-pulse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Seeding Indicator */}
        {seedingStatus === "seeding" && (
          <div className="mb-6 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80 text-[11px] text-zinc-500 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              Initializing secure workspace...
            </span>
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-2 uppercase tracking-wider">
              Member Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@mallzo.com"
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
            className="w-full py-3.5 rounded-xl bg-violet-650 hover:bg-violet-650/95 active:scale-[0.98] text-white font-semibold text-sm transition shadow-lg shadow-violet-950/45 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? "Verifying..." : "Access Core Workspace"}
          </button>
        </form>

        {/* Quick Credentials Panel */}
        <div className="mt-8 pt-6 border-t border-zinc-900/80">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest text-center mb-4">
            Select Core Team Member
          </p>
          {coreMembers.length === 0 ? (
            <div className="text-center py-2 text-zinc-650 text-xs">Loading members...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              {coreMembers.map((member) => {
                const isSelected = selectedMemberId === member._id;
                return (
                  <motion.button
                    key={member._id}
                    onClick={() => handleCoreQuickFill(member)}
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`p-4 rounded-xl flex flex-col items-center justify-center border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-violet-950/20 border-violet-500 shadow-md shadow-violet-500/10 text-white font-bold"
                        : "bg-zinc-900/30 border-zinc-850 hover:border-zinc-700 text-zinc-300"
                    }`}
                  >
                    <img
                      src={member.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.name}`}
                      alt={member.name}
                      className="w-12 h-12 rounded-full bg-zinc-850 border border-zinc-800 mb-2"
                    />
                    <span className="text-xs font-semibold truncate w-full">{member.name}</span>
                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mt-1 block">
                      {member.name === "Faeesa" ? "Co-Partner" : "Developer"}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
