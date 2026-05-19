"use client";

import Layout from "@/components/Layout";
import FounderCard from "@/components/FounderCard";
import Loader, { Skeleton } from "@/components/Loader";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Plus, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Lightbulb, 
  Trash2, 
  PlayCircle,
  AlertCircle
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Date states
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Task creation states
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskError, setTaskError] = useState("");

  // Accountability check states
  const [accountabilityLog, setAccountabilityLog] = useState("");
  const [checkingAccountability, setCheckingAccountability] = useState(false);

  // Queries
  const { data: dashboardData, isLoading: tasksLoading } = useQuery({
    queryKey: ["dashboard", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
  });

  const { data: timelineData } = useQuery({
    queryKey: ["timeline"],
    queryFn: async () => {
      const res = await fetch("/api/timeline");
      if (!res.ok) throw new Error("Failed to fetch timeline");
      return res.json();
    },
  });

  const { data: notesData } = useQuery({
    queryKey: ["recentNotes"],
    queryFn: async () => {
      const res = await fetch("/api/future-analysis?pinned=true");
      if (!res.ok) throw new Error("Failed to fetch strategic notes");
      const data = await res.json();
      // Fetch unpinned if no pinned notes exist, to show something on dashboard
      if (data.notes && data.notes.length > 0) return data;
      
      const allRes = await fetch("/api/future-analysis");
      return allRes.json();
    },
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: async (newTask) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      setTaskTitle("");
      setTaskDesc("");
      setTaskPriority("medium");
      setIsAddingTask(false);
      queryClient.invalidateQueries(["dashboard", selectedDate]);
      queryClient.invalidateQueries(["timeline"]);
    },
    onError: (err) => {
      setTaskError(err.message || "Failed to create task");
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["dashboard", selectedDate]);
      queryClient.invalidateQueries(["timeline"]);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["dashboard", selectedDate]);
      queryClient.invalidateQueries(["timeline"]);
    },
  });

  // Handlers
  const handleCreateTask = (e) => {
    e.preventDefault();
    setTaskError("");
    if (!taskTitle.trim()) {
      setTaskError("Task title is required");
      return;
    }
    createTaskMutation.mutate({
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      priority: taskPriority,
      assignedDate: selectedDate,
    });
  };

  const handleToggleTaskStatus = (task) => {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    updateTaskMutation.mutate({ id: task._id, status: nextStatus });
  };

  const handleDeleteTask = (taskId) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleRunAccountability = async () => {
    try {
      setCheckingAccountability(true);
      setAccountabilityLog("");
      const res = await fetch(`/api/cron/accountability?date=${selectedDate}&force=true`);
      if (res.ok) {
        const data = await res.json();
        setAccountabilityLog(data.message || "Check completed successfully.");
        // Refetch queries to show warnings in notifications
        queryClient.invalidateQueries(["dashboard", selectedDate]);
        queryClient.invalidateQueries(["timeline"]);
      } else {
        setAccountabilityLog("Error triggering accountability check.");
      }
    } catch (e) {
      console.error(e);
      setAccountabilityLog("Failed to reach accountability endpoint.");
    } finally {
      setCheckingAccountability(false);
    }
  };

  const dateFormatted = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Calculate some simple metrics
  const activeTasks = dashboardData?.tasks || [];
  const completedCount = activeTasks.filter(t => t.status === "completed").length;
  const totalCount = activeTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Layout>
      {/* Upper Dashboard Grid: Header + Quick Date Picker */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-zinc-800/40">
        <div>
          <div className="flex items-center gap-2.5 text-zinc-400 text-sm mb-1 font-medium">
            <Calendar className="w-4 h-4 text-violet-400" />
            <span>{dateFormatted}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Founder Control Panel
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Manual accountability check */}
          <button
            onClick={handleRunAccountability}
            disabled={checkingAccountability}
            className="px-4 py-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 active:scale-[0.98] transition text-amber-400 text-xs font-semibold flex items-center gap-2"
          >
            <PlayCircle className="w-4.5 h-4.5" />
            {checkingAccountability ? "Running Check..." : "Run Accountability Check"}
          </button>

          {/* Date Selector input */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs rounded-lg py-2.5 px-3 transition focus:border-violet-500 outline-none"
          />
        </div>
      </div>

      {/* Accountability Log Output Alert */}
      {accountabilityLog && (
        <div className="mb-6 p-4 rounded-xl bg-violet-950/20 border border-violet-800/40 text-violet-300 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 text-violet-400 shrink-0" />
            <span>{accountabilityLog}</span>
          </div>
          <button 
            onClick={() => setAccountabilityLog("")}
            className="text-zinc-500 hover:text-zinc-300 font-semibold"
          >
            Clear
          </button>
        </div>
      )}

      {/* 1. Founder Activity Cards */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
          Founder Accountability Status
        </h2>
        {tasksLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboardData?.founderSummaries?.map((summary) => (
              <FounderCard key={summary.founder.id} summary={summary} />
            ))}
          </div>
        )}
      </section>

      {/* 2. Tasks Management Section + Strategic notes panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle Columns: Task Management System */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-950/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-100">Tasks Checklist</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Track, complete, and add founder responsibilities.
                </p>
              </div>

              {!isAddingTask && (
                <button
                  onClick={() => setIsAddingTask(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-violet-650 hover:bg-violet-600 active:scale-[0.98] text-white font-semibold text-xs transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              )}
            </div>

            {/* Progress indicator */}
            {totalCount > 0 && (
              <div className="mb-6 bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs font-medium text-zinc-400 mb-1.5">
                    <span>Task Completion Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-violet-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-zinc-500 block uppercase font-medium">Completed</span>
                  <span className="font-bold text-zinc-200 text-base">{completedCount}/{totalCount}</span>
                </div>
              </div>
            )}

            {/* Inline Task Form */}
            {isAddingTask && (
              <form onSubmit={handleCreateTask} className="mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-950/70 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    New Responsiblity
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingTask(false)}
                    className="text-zinc-500 hover:text-zinc-300 text-xs transition"
                  >
                    Cancel
                  </button>
                </div>
                
                {taskError && (
                  <p className="text-[11px] text-rose-400 font-semibold">{taskError}</p>
                )}

                <div>
                  <input
                    type="text"
                    placeholder="Task title (e.g. Prepare deck for investors)"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500/80 rounded-lg p-2.5 text-xs text-zinc-150 outline-none placeholder-zinc-500 transition"
                  />
                </div>

                <div>
                  <textarea
                    placeholder="Description (optional)"
                    rows={2}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500/80 rounded-lg p-2.5 text-xs text-zinc-150 outline-none placeholder-zinc-500 transition resize-none"
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-[10px] uppercase font-bold">Priority:</span>
                    {["low", "medium", "high"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTaskPriority(p)}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition ${
                          taskPriority === p
                            ? p === "high"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/35"
                              : p === "medium"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/35"
                                : "bg-zinc-700/60 text-zinc-300 border border-zinc-650"
                            : "bg-zinc-900 text-zinc-500 border border-zinc-850 hover:bg-zinc-850"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={createTaskMutation.isPending}
                    className="px-3.5 py-1.5 rounded-lg bg-violet-650 hover:bg-violet-600 text-white font-semibold text-xs transition"
                  >
                    {createTaskMutation.isPending ? "Adding..." : "Add to Board"}
                  </button>
                </div>
              </form>
            )}

            {/* Tasks List */}
            {tasksLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : activeTasks.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/5">
                <p className="text-zinc-500 text-sm">No tasks scheduled for this day.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTasks.map((task) => {
                  const isCompleted = task.status === "completed";
                  const isMyTask = task.createdBy?._id?.toString() === user?._id?.toString();
                  const priorityColors = {
                    high: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    low: "bg-zinc-800 text-zinc-400 border-zinc-750",
                  };

                  return (
                    <div
                      key={task._id}
                      className={`flex items-start justify-between gap-4 p-3.5 border rounded-xl bg-zinc-900/10 transition-all ${
                        isCompleted
                          ? "border-zinc-850 opacity-60 bg-zinc-950/20"
                          : "border-zinc-800/80 hover:border-zinc-750 hover:bg-zinc-900/30"
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Toggle Checkbox */}
                        <button
                          onClick={() => handleToggleTaskStatus(task)}
                          disabled={!isMyTask}
                          className={`mt-0.5 rounded-full transition shrink-0 ${
                            !isMyTask ? "cursor-not-allowed opacity-50" : "hover:scale-105"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-zinc-500 hover:text-violet-400" />
                          )}
                        </button>
                        
                        <div className="min-w-0">
                          <h4 className={`text-sm font-bold text-zinc-200 truncate ${isCompleted ? "line-through text-zinc-500" : ""}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          
                          {/* Metadata */}
                          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                            {/* Priority Badge */}
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${priorityColors[task.priority]}`}>
                              {task.priority}
                            </span>
                            
                            {/* Founder Avatar info */}
                            <div className="flex items-center gap-1.5">
                              <img
                                src={task.createdBy.avatar}
                                alt={task.createdBy.name}
                                className="w-4 h-4 rounded-full bg-zinc-800"
                              />
                              <span className="text-[10px] text-zinc-500 font-medium">
                                {task.createdBy.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {isMyTask && (
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="text-zinc-600 hover:text-rose-400 transition p-1"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Strategic Updates & Activity Timeline */}
        <div className="space-y-6">
          {/* Strategic Updates */}
          <div className="bg-zinc-950/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 mb-4">
              <Lightbulb className="w-4.5 h-4.5 text-violet-400" />
              Strategic Updates
            </h3>
            
            <div className="space-y-3.5">
              {notesData?.notes?.length === 0 ? (
                <p className="text-zinc-550 text-xs py-4 text-center">
                  No future planning notes found.
                </p>
              ) : (
                notesData?.notes?.slice(0, 3).map((note) => {
                  const statusColors = {
                    "Agreed": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    "Under Discussion": "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    "Rejected": "bg-rose-500/10 text-rose-400 border-rose-500/20",
                  };

                  return (
                    <div 
                      key={note._id}
                      className="p-3 border border-zinc-850 rounded-xl bg-zinc-900/5 hover:border-zinc-800 transition"
                    >
                      <h4 className="text-xs font-bold text-zinc-250 hover:text-violet-400 transition truncate">
                        <a href="/future-analysis">{note.title}</a>
                      </h4>
                      <p className="text-[11px] text-zinc-450 mt-1 line-clamp-2 leading-normal">
                        {note.description}
                      </p>
                      
                      <div className="flex items-center justify-between gap-3 mt-3">
                        <span className="text-[9px] text-zinc-550">
                          by {note.founder.name}
                        </span>
                        
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${statusColors[note.status]}`}>
                          {note.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-zinc-950/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 mb-4">
              <Clock className="w-4.5 h-4.5 text-violet-400" />
              Activity Timeline
            </h3>

            <div className="relative border-l border-zinc-850 pl-4 ml-2.5 space-y-5 py-2">
              {timelineData?.activities?.length === 0 ? (
                <p className="text-zinc-550 text-xs py-4">No recent activity logged.</p>
              ) : (
                timelineData?.activities?.slice(0, 5).map((log) => {
                  const logTime = new Date(log.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div key={log._id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-800 border-2 border-violet-500" />
                      
                      <div className="text-[11px] text-zinc-400 font-semibold leading-none mb-1">
                        {log.founder.name} &bull; <span className="text-zinc-500 font-normal">{logTime}</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        {log.details}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
