"use client";

import Layout from "@/components/Layout";
import Loader, { Skeleton } from "@/components/Loader";
import { useQuery } from "@tanstack/react-query";
import { 
  Trophy, 
  Flame, 
  CheckCircle2, 
  FileText, 
  BarChart2, 
  TrendingUp,
  Percent
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

export default function Analytics() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics data");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-16" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }

  const { leaderboard, dailyProductivity, consistencyStats, notesStats, companyOverview } = analyticsData;

  // Custom Colors for Recharts
  const COLORS = ["#8b5cf6", "#3b82f6", "#ec4899", "#f59e0b", "#10b981"];
  const founderColors = {
    Azarin: "#a78bfa", // light violet
    Najeeb: "#60a5fa", // light blue
    Rima: "#f472b6",   // light pink
  };

  // Pie chart data for contribution score breakdown
  const pieData = leaderboard.map((f) => ({
    name: f.name,
    value: f.productivityStats.contributionScore || 1, // fallback
  }));

  // Medal styling for ranks
  const getRankBadge = (index) => {
    switch (index) {
      case 0:
        return { bg: "bg-amber-500/20 border-amber-500/40 text-amber-400", label: "1st" };
      case 1:
        return { bg: "bg-zinc-350/20 border-zinc-350/40 text-zinc-300", label: "2nd" };
      case 2:
        return { bg: "bg-amber-800/20 border-amber-800/40 text-amber-600", label: "3rd" };
      default:
        return { bg: "bg-zinc-800 border-zinc-700 text-zinc-400", label: `${index + 1}th` };
    }
  };

  return (
    <Layout>
      {/* Title Header */}
      <div className="mb-8 pb-6 border-b border-zinc-800/40">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <BarChart2 className="w-8 h-8 text-violet-400" />
          Analytics & Performance
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Internal statistics, leaderboard standings, and contribution breakdown for Mallzo founders.
        </p>
      </div>

      {/* Grid 1: Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Total Tasks */}
        <div className="p-6 border border-zinc-800 bg-zinc-950/20 rounded-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-650/5 rounded-full blur-2xl" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
            Total Company Tasks
          </span>
          <span className="text-3.5xl font-black text-white leading-none">
            {companyOverview.totalTasks}
          </span>
          <div className="flex items-center gap-2 mt-4 text-xs text-zinc-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{companyOverview.completedTasks} completed successfully</span>
          </div>
        </div>

        {/* Card 2: Avg Completion Rate */}
        <div className="p-6 border border-zinc-800 bg-zinc-950/20 rounded-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
            Company Completion Rate
          </span>
          <span className="text-3.5xl font-black text-white leading-none">
            {companyOverview.completionRate}%
          </span>
          <div className="flex items-center gap-2 mt-4 text-xs text-zinc-400">
            <Percent className="w-4 h-4 text-violet-400" />
            <span>Ratio of completed tasks out of total</span>
          </div>
        </div>

        {/* Card 3: Top Contributor */}
        <div className="p-6 border border-zinc-800 bg-zinc-950/20 rounded-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
            Rank #1 Leader
          </span>
          <span className="text-3.5xl font-black text-white leading-none bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
            {leaderboard[0]?.name || "N/A"}
          </span>
          <div className="flex items-center gap-2 mt-4 text-xs text-zinc-400">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Score: {leaderboard[0]?.productivityStats.contributionScore || 0}%</span>
          </div>
        </div>
      </div>

      {/* Grid 2: Leaderboard + Contribution Score Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Leaderboard Panel */}
        <div className="lg:col-span-2 bg-zinc-950/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-amber-500" />
            Founder Leaderboard
          </h3>

          <div className="space-y-4">
            {leaderboard.map((founder, index) => {
              const badge = getRankBadge(index);
              const stats = founder.productivityStats;
              
              return (
                <div 
                  key={founder._id} 
                  className="flex items-center justify-between gap-4 p-4 border border-zinc-850 rounded-xl bg-zinc-900/10 hover:border-zinc-800 transition"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank badge */}
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    
                    {/* Avatar & Info */}
                    <img src={founder.avatar} alt={founder.name} className="w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900" />
                    <div>
                      <h4 className="font-bold text-zinc-200 text-sm leading-tight">{founder.name}</h4>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-zinc-650" />
                          {stats.completedTasks} / {stats.totalTasks} Tasks
                        </span>
                        
                        {stats.streak > 0 && (
                          <span className="text-[10px] text-orange-400 flex items-center gap-0.5 font-bold uppercase">
                            <Flame className="w-3.5 h-3.5 fill-orange-500/10" />
                            {stats.streak} Streak
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contribution Score */}
                  <div className="text-right">
                    <span className="text-[9px] text-zinc-550 uppercase tracking-wider block font-bold">Contribution</span>
                    <span className="text-xl font-black text-zinc-100">{stats.contributionScore}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contribution Breakdown Pie Chart */}
        <div className="bg-zinc-950/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl flex flex-col justify-between">
          <h3 className="text-base font-bold text-zinc-100 mb-4">
            Contribution Weight
          </h3>
          
          <div className="flex-1 h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={founderColors[entry.name] || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }}
                  itemStyle={{ color: "#e4e4e7" }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center score label */}
            <div className="absolute text-center">
              <span className="text-[10px] text-zinc-550 uppercase tracking-widest block font-bold">Share</span>
              <span className="text-2xl font-black text-white">Scores</span>
            </div>
          </div>

          {/* Legend list */}
          <div className="flex justify-center gap-6 mt-4">
            {leaderboard.map((f, i) => (
              <div key={f.name} className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: founderColors[f.name] || COLORS[i % COLORS.length] }}
                />
                <span>{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid 3: Weekly Productivity BarChart */}
      <div className="grid grid-cols-1 gap-8 mb-8">
        <div className="bg-zinc-950/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-400" />
                Daily Productivity Trends
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Completed tasks per founder over the last 7 days.
              </p>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyProductivity}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }}
                  labelStyle={{ color: "#a1a1aa", fontWeight: "bold", fontSize: 12 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                
                {/* Dynamically draw bars for Azarin, Najeeb, Rima */}
                <Bar dataKey="Azarin" fill={founderColors.Azarin} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Najeeb" fill={founderColors.Najeeb} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rima" fill={founderColors.Rima} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid 4: Detailed stats comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Consistency Table */}
        <div className="bg-zinc-950/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
            Task Consistency Metrics
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-500">
                  <th className="pb-3 font-semibold">Founder</th>
                  <th className="pb-3 font-semibold text-center">Tasks Done</th>
                  <th className="pb-3 font-semibold text-center">Completion Rate</th>
                  <th className="pb-3 font-semibold text-center">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {consistencyStats.map((stat) => (
                  <tr key={stat.founder} className="text-zinc-300">
                    <td className="py-3.5 font-bold">{stat.founder}</td>
                    <td className="py-3.5 text-center text-zinc-400">{stat.completed} / {stat.total}</td>
                    <td className="py-3.5 text-center font-bold text-violet-400">{stat.rate}%</td>
                    <td className="py-3.5 text-center font-bold text-orange-400 flex items-center justify-center gap-0.5">
                      <Flame className="w-3.5 h-3.5 fill-orange-500/10" />
                      {stat.streak} days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strategic Analysis standings */}
        <div className="bg-zinc-950/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-violet-400" />
            Strategic Notes Contribution
          </h3>

          <div className="space-y-4">
            {notesStats.map((stat) => (
              <div key={stat.founder} className="flex items-center justify-between border-b border-zinc-900/60 pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: founderColors[stat.founder] }} />
                  <span className="text-xs font-bold text-zinc-350">{stat.founder}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 font-medium">
                    {stat.notesCount} Strategic Notes
                  </span>
                  
                  {/* Visual mini-bar */}
                  <div className="w-20 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: `${Math.min(stat.notesCount * 20, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
