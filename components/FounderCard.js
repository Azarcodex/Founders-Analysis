"use client";

import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

export default function FounderCard({ summary }) {
  const { founder, stats } = summary;
  const { total, completed, pending, statusColor } = stats;

  const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Formatting colors
  const colorMap = {
    green: {
      bg: "bg-emerald-500/10 border-emerald-500/30",
      text: "text-emerald-400",
      dot: "bg-emerald-500 shadow-emerald-500/40",
      icon: CheckCircle2,
      label: "All Done",
    },
    yellow: {
      bg: "bg-amber-500/10 border-amber-500/30",
      text: "text-amber-400",
      dot: "bg-amber-500 shadow-amber-500/40",
      icon: Circle,
      label: "In Progress",
    },
    red: {
      bg: "bg-rose-500/10 border-rose-500/30",
      text: "text-rose-400",
      dot: "bg-rose-500 shadow-rose-500/40",
      icon: AlertCircle,
      label: "No Activity",
    },
  };

  const currentTheme = colorMap[statusColor] || colorMap.red;
  const StatusIcon = currentTheme.icon;

  const formattedTime = founder.lastActive 
    ? new Date(founder.lastActive).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "N/A";

  return (
    <div className={`relative p-5 border rounded-xl backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-zinc-950/50 bg-zinc-900/20 ${currentTheme.bg}`}>
      {/* Glow highlight */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-10 pointer-events-none ${progressPercentage === 100 ? "bg-emerald-500" : statusColor === "yellow" ? "bg-amber-500" : "bg-rose-500"}`} />

      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={founder.avatar}
              alt={founder.name}
              className="w-12 h-12 rounded-full border border-zinc-700 bg-zinc-800"
            />
            {/* Status Color Dot */}
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900 shadow-lg ${currentTheme.dot}`} />
          </div>
          <div>
            <h3 className="font-bold text-zinc-100 text-lg leading-tight">{founder.name}</h3>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold mt-1 uppercase tracking-wider ${currentTheme.text}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {currentTheme.label}
            </span>
          </div>
        </div>

        {/* Contribution Score */}
        <div className="text-right">
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">Contribution</span>
          <span className="text-2xl font-black text-white leading-none bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            {founder.contributionScore}%
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 my-5 text-center bg-zinc-950/30 rounded-lg p-2.5 border border-zinc-800/40">
        <div>
          <span className="text-[10px] text-zinc-500 block uppercase font-medium">Added</span>
          <span className="font-semibold text-zinc-200 text-sm">{total}</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 block uppercase font-medium">Completed</span>
          <span className="font-semibold text-emerald-400 text-sm">{completed}</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 block uppercase font-medium">Pending</span>
          <span className="font-semibold text-amber-400 text-sm">{pending}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          <span className="text-zinc-400">Progress</span>
          <span className={currentTheme.text}>{progressPercentage}%</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercentage === 100 
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                : statusColor === "yellow" 
                  ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                  : "bg-zinc-700"
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Last Active details */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-850 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
          Active today
        </span>
        <span>Updated: {formattedTime}</span>
      </div>
    </div>
  );
}
