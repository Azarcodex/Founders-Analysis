"use client";

import Loader, { Skeleton } from "@/components/Loader";
import { useCoreAuth } from "@/context/CoreAuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { 
  Lightbulb, 
  Search, 
  Pin, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  HelpCircle, 
  XCircle, 
  ChevronRight,
  Filter,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CoreFutureAnalysis() {
  const { user } = useCoreAuth();
  const queryClient = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  // Selection states
  const [activeNoteId, setActiveNoteId] = useState(null);
  
  // Comments state
  const [newComment, setNewComment] = useState("");

  // Queries
  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ["coreNotes", search, filterStatus, filterPriority],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterStatus) params.append("status", filterStatus);
      if (filterPriority) params.append("priority", filterPriority);
      const res = await fetch(`/api/core/future-analysis?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch strategic notes");
      return res.json();
    },
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["coreComments", activeNoteId],
    queryFn: async () => {
      if (!activeNoteId) return { comments: [] };
      const res = await fetch(`/api/core/future-analysis/${activeNoteId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: !!activeNoteId,
  });

  // Mutations
  const createCommentMutation = useMutation({
    mutationFn: async ({ noteId, content }) => {
      const res = await fetch(`/api/core/future-analysis/${noteId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries(["coreComments", activeNoteId]);
    },
  });

  // Get current active note object
  const activeNote = notesData?.notes?.find((n) => n._id === activeNoteId);

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !activeNoteId) return;

    createCommentMutation.mutate({
      noteId: activeNoteId,
      content: newComment.trim(),
    });
  };

  // Render Status Badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case "Agreed":
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shrink-0">
            <CheckCircle className="w-3.5 h-3.5" /> Agreed
          </span>
        );
      case "Under Discussion":
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 shrink-0">
            <HelpCircle className="w-3.5 h-3.5 animate-pulse" /> Under Discussion
          </span>
        );
      case "Rejected":
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 shrink-0">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  // Render Priority Badge
  const renderPriorityBadge = (priority) => {
    const colors = {
      High: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      Low: "bg-zinc-800 text-zinc-400 border-zinc-750",
    };
    return (
      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border shrink-0 ${colors[priority]}`}>
        {priority} Priority
      </span>
    );
  };

  return (
    <>
      {/* Upper header */}
      <div className="mb-8 pb-6 border-b border-zinc-800/40">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Lightbulb className="w-8 h-8 text-violet-400" />
          Future Analysis Workspace
        </h1>
        <p className="text-zinc-450 text-sm mt-1">
          Review long-term strategic decisions, competitor analyses, and participate in discussion threads.
        </p>
      </div>

      {/* Main Workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Notes list + Filters (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Search and Filters box */}
          <div className="p-4 border border-zinc-800 bg-zinc-950/20 rounded-xl space-y-3 backdrop-blur-md">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-550 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes or tags..."
                className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-violet-500 rounded-lg py-2 pl-9 pr-3 text-xs text-zinc-200 outline-none placeholder-zinc-550 transition"
              />
            </div>

            {/* Quick dropdown selectors */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-zinc-900/40 border border-zinc-850 hover:border-zinc-800 text-zinc-400 text-[10px] uppercase font-bold py-2 px-2.5 rounded-lg outline-none cursor-pointer focus:border-violet-500 transition"
              >
                <option value="">Status</option>
                <option value="Under Discussion">Under Discussion</option>
                <option value="Agreed">Agreed</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-zinc-900/40 border border-zinc-850 hover:border-zinc-800 text-zinc-400 text-[10px] uppercase font-bold py-2 px-2.5 rounded-lg outline-none cursor-pointer focus:border-violet-500 transition"
              >
                <option value="">Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Notes list */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {notesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : notesData?.notes?.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/5">
                <p className="text-zinc-500 text-xs">No strategic notes found.</p>
              </div>
            ) : (
              notesData?.notes?.map((note) => {
                const isActive = note._id === activeNoteId;
                return (
                  <div
                    key={note._id}
                    onClick={() => setActiveNoteId(note._id)}
                    className={`p-4 border rounded-xl transition cursor-pointer text-left ${
                      isActive
                        ? "border-violet-550/80 bg-violet-650/5 shadow-md shadow-violet-950/15"
                        : "border-zinc-800/80 bg-zinc-900/10 hover:border-zinc-700/80 hover:bg-zinc-900/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className={`font-bold text-sm leading-snug flex-1 truncate ${isActive ? "text-violet-300" : "text-zinc-200"}`}>
                        {note.title}
                      </h3>
                      {note.pinned && (
                        <Pin className="w-3.5 h-3.5 text-violet-400 fill-violet-400 shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-450 mt-1 line-clamp-2 leading-relaxed">
                      {note.description || "No description provided."}
                    </p>

                    <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-zinc-850/50">
                      <span className="text-[10px] text-zinc-550 font-medium">
                        by {note.founder?.name || "Founder"}
                      </span>
                      <span className="text-[10px] text-zinc-550">
                        {new Date(note.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Side: Active Workspace (8 cols) */}
        <div className="lg:col-span-8">
          
          {/* Note View */}
          {activeNoteId && activeNote ? (
            <div className="bg-zinc-950/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-6">
              
              {/* Header Details: Pinned, Status, Priority */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-850">
                <div className="flex flex-wrap items-center gap-2">
                  {activeNote.pinned && (
                    <span className="p-2 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-400" title="Pinned by Founder">
                      <Pin className="w-4 h-4 fill-violet-400" />
                    </span>
                  )}
                  {renderStatusBadge(activeNote.status)}
                  {renderPriorityBadge(activeNote.priority)}
                </div>

                <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                  Read-only Access
                </div>
              </div>

              {/* Read-only Information */}
              <div className="space-y-6 text-left">
                {/* Title */}
                <div>
                  <h2 className="text-2xl font-extrabold text-zinc-100 tracking-tight">
                    {activeNote.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <img 
                      src={activeNote.founder?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${activeNote.founder?.name || "Founder"}`} 
                      alt={activeNote.founder?.name || "Founder"} 
                      className="w-5 h-5 rounded-full bg-zinc-850" 
                    />
                    <p className="text-[11px] text-zinc-500 font-medium">
                      Proposed by <span className="text-zinc-355 font-bold">{activeNote.founder?.name || "Founder"}</span> &bull; Updated {new Date(activeNote.updatedAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                {/* Description content panel */}
                <div className="bg-zinc-900/10 border border-zinc-900 p-5 rounded-2xl leading-relaxed whitespace-pre-wrap text-xs text-zinc-300 font-sans">
                  {activeNote.description || "No description details provided."}
                </div>

                {/* Tags */}
                {activeNote.tags?.length > 0 && (
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block uppercase tracking-wider mb-2.5">
                      Strategic Labels
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {activeNote.tags.map((t, idx) => (
                        <span key={idx} className="px-2.5 py-1 text-[10px] font-semibold border border-zinc-800 bg-zinc-900/20 text-zinc-400 rounded-lg">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Discussion Forum / Comment Section */}
              <div className="pt-6 border-t border-zinc-850 space-y-4">
                <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2 text-left">
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                  Strategic Discussion
                </h4>

                {/* New Comment Input */}
                <form onSubmit={handlePostComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Offer feedback, raise objections, or ask clarifying questions..."
                    className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-2.5 text-xs text-zinc-200 outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={createCommentMutation.isPending}
                    className="p-2.5 rounded-xl bg-violet-650 hover:bg-violet-600 active:scale-[0.98] text-white transition flex items-center justify-center shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* Comments List */}
                {commentsLoading ? (
                  <div className="space-y-2 py-4">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                  </div>
                ) : commentsData?.comments?.length === 0 ? (
                  <p className="text-zinc-550 text-xs py-4 text-center">
                    No comments posted yet. Start the strategic discussion.
                  </p>
                ) : (
                  <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                    {commentsData?.comments?.map((comment) => {
                      const timeStr = new Date(comment.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const dateStr = new Date(comment.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      });

                      // Determine author attributes
                      const isFounder = comment.userType === "Founder" || comment.founder;
                      const authorName = isFounder ? comment.founder?.name : comment.coreMember?.name;
                      const authorAvatar = isFounder ? comment.founder?.avatar : comment.coreMember?.avatar;
                      const authorRoleBadge = isFounder ? "FOUNDER" : "TEAM";
                      
                      return (
                        <div key={comment._id} className="p-3.5 rounded-xl border border-zinc-900 bg-zinc-900/10 text-left hover:border-zinc-850 transition duration-150">
                          <div className="flex items-center justify-between gap-3 mb-1.5">
                            <div className="flex items-center gap-2">
                              <img 
                                src={authorAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${authorName || "Member"}`} 
                                alt={authorName || "Member"} 
                                className="w-5.5 h-5.5 rounded-full bg-zinc-850 border border-zinc-800" 
                              />
                              <span className="text-[11px] font-bold text-zinc-200">{authorName || "Member"}</span>
                              <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                                isFounder ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" : "bg-zinc-800 text-zinc-500"
                              }`}>
                                {authorRoleBadge}
                              </span>
                            </div>
                            <span className="text-[9px] text-zinc-500">
                              {dateStr} &bull; {timeStr}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-350 leading-relaxed pl-7.5">
                            {comment.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Placeholder */
            <div className="h-96 border border-dashed border-zinc-850 rounded-2xl flex flex-col items-center justify-center p-8 bg-zinc-950/15">
              <Lightbulb className="w-12 h-12 text-zinc-700 animate-pulse mb-3" />
              <h3 className="font-bold text-zinc-300 text-sm">Strategic Workspace</h3>
              <p className="text-zinc-550 text-xs mt-1 text-center max-w-xs leading-relaxed">
                Select a strategic planning note from the side panel to view details and join the conversation.
              </p>
            </div>
          )}

        </div>

      </div>
    </>
  );
}
