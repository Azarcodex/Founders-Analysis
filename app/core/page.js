"use client";

import Loader, { Skeleton } from "@/components/Loader";
import { useCoreAuth } from "@/context/CoreAuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import {
  Lightbulb,
  Plus,
  Search,
  Filter,
  CheckCircle,
  ThumbsUp,
  MessageSquare,
  Trash2,
  Edit,
  AlertCircle,
  Clock,
  Pin,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CoreDashboard() {
  const { user } = useCoreAuth();
  const queryClient = useQueryClient();

  // Search & Filter states
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [filterByMe, setFilterByMe] = useState(false);

  // Submit Idea form states
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDesc, setIdeaDesc] = useState("");
  const [ideaPriority, setIdeaPriority] = useState("medium");
  const [formError, setFormError] = useState("");

  // Edit Idea states
  const [editingIdea, setEditingIdea] = useState(null);

  // Query: Fetch Ideas
  const { data, isLoading } = useQuery({
    queryKey: ["coreIdeas", status, priority, filterByMe, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (priority) params.append("priority", priority);
      if (filterByMe) params.append("createdByMe", "true");
      if (search) params.append("search", search);

      const res = await fetch(`/api/core/ideas?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch ideas");
      return res.json();
    },
  });

  // Submit Idea Mutation
  const submitIdeaMutation = useMutation({
    mutationFn: async (newIdea) => {
      const res = await fetch("/api/core/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIdea),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit idea");
      }
      return res.json();
    },
    onSuccess: () => {
      setIdeaTitle("");
      setIdeaDesc("");
      setIdeaPriority("medium");
      setIsSubmitOpen(false);
      queryClient.invalidateQueries(["coreIdeas"]);
    },
    onError: (err) => {
      setFormError(err.message);
    },
  });

  // Edit Idea Mutation
  const editIdeaMutation = useMutation({
    mutationFn: async ({ id, updatedIdea }) => {
      const res = await fetch(`/api/core/ideas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedIdea),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to edit idea");
      }
      return res.json();
    },
    onSuccess: () => {
      setEditingIdea(null);
      queryClient.invalidateQueries(["coreIdeas"]);
    },
    onError: (err) => {
      setFormError(err.message);
    },
  });

  // Delete Idea Mutation
  const deleteIdeaMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/core/ideas/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete idea");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["coreIdeas"]);
    },
  });

  // Like Toggle Mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/core/ideas/${id}/like`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle upvote");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["coreIdeas"]);
    },
  });

  // Handlers
  const handleCreateIdea = (e) => {
    e.preventDefault();
    setFormError("");
    if (!ideaTitle.trim() || !ideaDesc.trim()) {
      setFormError("Title and description are required");
      return;
    }
    submitIdeaMutation.mutate({
      title: ideaTitle.trim(),
      description: ideaDesc.trim(),
      category: "feature ideas",
      priority: ideaPriority,
      tags: [],
    });
  };

  const handleUpdateIdea = (e) => {
    e.preventDefault();
    setFormError("");
    if (!editingIdea.title.trim() || !editingIdea.description.trim()) {
      setFormError("Title and description are required");
      return;
    }
    editIdeaMutation.mutate({
      id: editingIdea._id,
      updatedIdea: {
        title: editingIdea.title,
        description: editingIdea.description,
        category: editingIdea.category || "feature ideas",
        priority: editingIdea.priority,
        tags: [],
      },
    });
  };

  const handleDeleteIdea = (id) => {
    if (confirm("Are you sure you want to delete this idea?")) {
      deleteIdeaMutation.mutate(id);
    }
  };

  const handleToggleLike = (id) => {
    toggleLikeMutation.mutate(id);
  };

  const openEditModal = (idea) => {
    setEditingIdea({
      ...idea,
    });
  };

  const ideas = data?.ideas || [];

  // Compute metrics in memory based on total fetched or list all ideas without filters
  const mySubmissions = ideas.filter((i) => i.createdBy?._id === user?.id || i.createdBy?._id === user?._id);
  const totalSubmissions = mySubmissions.length;
  const approvedSubmissions = mySubmissions.filter((i) => i.status === "Approved").length;
  const pendingSubmissions = mySubmissions.filter((i) => i.status === "Pending Review").length;
  const likesReceived = mySubmissions.reduce((acc, i) => acc + (i.likesCount || 0), 0);



  const statusColors = {
    "Pending Review": "bg-zinc-800 text-zinc-400 border-zinc-750",
    "Under Discussion": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Approved": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Rejected": "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "Planned": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };

  const priorityColors = {
    high: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    medium: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    low: "bg-zinc-850 text-zinc-450 border border-zinc-800",
  };

  return (
    <>
      {/* Top Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-zinc-800/40">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Lightbulb className="w-8 h-8 text-violet-400" />
            Ideas Hub
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Submit growth strategies, product features, and improvements to founders.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-violet-650 hover:bg-violet-600 active:scale-[0.98] text-white text-sm font-semibold transition flex items-center gap-2 self-start lg:self-auto cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          Submit Idea
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "My Submitted Ideas", val: totalSubmissions, color: "text-zinc-300" },
          { label: "Approved Contributions", val: approvedSubmissions, color: "text-emerald-400" },
          { label: "Pending Reviews", val: pendingSubmissions, color: "text-amber-400" },
          { label: "Upvotes Received", val: likesReceived, color: "text-rose-400" },
        ].map((m, idx) => (
          <div key={idx} className="bg-zinc-950/20 border border-zinc-800/60 rounded-2xl p-5 backdrop-blur-md">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">{m.label}</p>
            <p className={`text-3xl font-black ${m.color}`}>{m.val}</p>
          </div>
        ))}
      </div>

      {/* Search and Filters Section */}
      <div className="bg-zinc-950/20 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search ideas, tag descriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-violet-500/80 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-200 placeholder-zinc-550 outline-none transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterByMe(!filterByMe)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filterByMe
                  ? "bg-violet-950/20 border-violet-500/80 text-violet-400"
                  : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-250"
              }`}
            >
              Filter: My Ideas
            </button>



            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-zinc-900/40 border border-zinc-800 rounded-xl text-xs py-2.5 px-3 text-zinc-400 focus:border-violet-500 outline-none transition cursor-pointer"
            >
              <option value="">All Statuses</option>
              {["Pending Review", "Under Discussion", "Approved", "Rejected", "Planned"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="bg-zinc-900/40 border border-zinc-800 rounded-xl text-xs py-2.5 px-3 text-zinc-400 focus:border-violet-500 outline-none transition cursor-pointer"
            >
              <option value="">All Priorities</option>
              {["low", "medium", "high"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ideas Feed */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/5">
          <AlertCircle className="w-8 h-8 text-zinc-550 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No ideas matches the selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ideas.map((idea) => {
            const isCreator = idea.createdBy?._id === user?.id || idea.createdBy?._id === user?._id;
            return (
              <motion.div
                key={idea._id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-950/20 border border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-200 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-sm relative"
              >
                {/* Pin Icon */}
                {idea.pinned && (
                  <span className="absolute top-4 right-4 text-violet-400" title="Pinned by Founder">
                    <Pin className="w-4 h-4 fill-violet-400" />
                  </span>
                )}

                <div>
                  {/* Category + Priority */}
                  <div className="flex items-center gap-2 mb-3.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase ${priorityColors[idea.priority]}`}>
                      {idea.priority}
                    </span>
                  </div>

                  {/* Title & description */}
                  <h3 className="text-base font-bold text-zinc-200 hover:text-violet-400 transition mb-2">
                    <Link href={`/core/ideas/${idea._id}`}>{idea.title}</Link>
                  </h3>
                  <p className="text-xs text-zinc-450 leading-relaxed mb-4 line-clamp-3">
                    {idea.description}
                  </p>
                </div>

                {/* Footer details */}
                <div className="border-t border-zinc-900/60 pt-4 flex flex-col gap-4">
                  {/* CreatedBy and Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={idea.createdBy?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${idea.createdBy?.name}`}
                        alt={idea.createdBy?.name}
                        className="w-5.5 h-5.5 rounded-full bg-zinc-800"
                      />
                      <span className="text-[11px] text-zinc-500 font-medium">
                        {idea.createdBy?.name}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase ${statusColors[idea.status]}`}>
                      {idea.status}
                    </span>
                  </div>



                  {/* Founder Response Snippet */}
                  {idea.founderResponse && (
                    <div className="bg-violet-950/5 border border-violet-900/20 p-3 rounded-xl">
                      <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-1">Founder Response</span>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {idea.founderResponse}
                      </p>
                    </div>
                  )}

                  {/* Interaction buttons */}
                  <div className="flex items-center justify-between border-t border-zinc-900/60 pt-3.5">
                    <div className="flex items-center gap-4">
                      {/* Upvote button */}
                      <button
                        onClick={() => handleToggleLike(idea._id)}
                        className={`flex items-center gap-1.5 text-xs transition cursor-pointer p-1 rounded-md ${
                          idea.userLiked
                            ? "text-rose-500 font-semibold"
                            : "text-zinc-550 hover:text-zinc-350"
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${idea.userLiked ? "fill-rose-500/20" : ""}`} />
                        <span>{idea.likesCount || 0}</span>
                      </button>

                      {/* Comments count redirect link */}
                      <Link
                        href={`/core/ideas/${idea._id}`}
                        className="flex items-center gap-1.5 text-xs text-zinc-550 hover:text-zinc-300 transition"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Discussion
                      </Link>
                    </div>

                    {/* Creator Edit/Delete actions */}
                    {isCreator && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(idea)}
                          className="p-1 rounded text-zinc-600 hover:text-violet-400 transition cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteIdea(idea._id)}
                          className="p-1 rounded text-zinc-600 hover:text-rose-500 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* SUBMIT IDEA MODAL */}
      <AnimatePresence>
        {isSubmitOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsSubmitOpen(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
                <Lightbulb className="w-5.5 h-5.5 text-violet-400" />
                Submit Collaboration Idea
              </h2>
              <p className="text-xs text-zinc-500 mb-6">Submit feature ideas, marketing updates, or bug reports to founder review.</p>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateIdea} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-450 uppercase block mb-1.5">Idea Title</label>
                  <input
                    type="text"
                    value={ideaTitle}
                    onChange={(e) => setIdeaTitle(e.target.value)}
                    placeholder="Provide a clear, actionable summary (e.g. Integrate Apple Pay checkout)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-violet-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-450 uppercase block mb-1.5">Priority</label>
                  <select
                    value={ideaPriority}
                    onChange={(e) => setIdeaPriority(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-violet-500 transition cursor-pointer"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-450 uppercase block mb-1.5">Detailed Description</label>
                  <textarea
                    rows={4}
                    value={ideaDesc}
                    onChange={(e) => setIdeaDesc(e.target.value)}
                    placeholder="Describe the issue or strategy, outline execution steps, and list potential business impacts..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 resize-none outline-none focus:border-violet-500 transition"
                  />
                </div>



                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setIsSubmitOpen(false)}
                    className="px-4 py-2 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitIdeaMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-violet-650 hover:bg-violet-600 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    {submitIdeaMutation.isPending ? "Submitting..." : "Submit Proposal"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT IDEA MODAL */}
      <AnimatePresence>
        {editingIdea && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setEditingIdea(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
                <Edit className="w-5.5 h-5.5 text-violet-400" />
                Edit Collaboration Idea
              </h2>
              <p className="text-xs text-zinc-500 mb-6">Modify details of your idea submission.</p>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleUpdateIdea} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-450 uppercase block mb-1.5">Idea Title</label>
                  <input
                    type="text"
                    value={editingIdea.title}
                    onChange={(e) => setEditingIdea({ ...editingIdea, title: e.target.value })}
                    placeholder="Provide a clear, actionable summary"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-violet-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-450 uppercase block mb-1.5">Priority</label>
                  <select
                    value={editingIdea.priority}
                    onChange={(e) => setEditingIdea({ ...editingIdea, priority: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-violet-500 transition cursor-pointer"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-450 uppercase block mb-1.5">Detailed Description</label>
                  <textarea
                    rows={4}
                    value={editingIdea.description}
                    onChange={(e) => setEditingIdea({ ...editingIdea, description: e.target.value })}
                    placeholder="Describe the issue or strategy..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 resize-none outline-none focus:border-violet-500 transition"
                  />
                </div>



                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingIdea(null)}
                    className="px-4 py-2 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editIdeaMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-violet-650 hover:bg-violet-600 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    {editIdeaMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
