"use client";

import Layout from "@/components/Layout";
import Loader, { Skeleton } from "@/components/Loader";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { 
  Lightbulb, 
  Search, 
  Pin, 
  Plus, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  HelpCircle, 
  XCircle, 
  ChevronRight,
  Filter,
  Save,
  Trash2,
  Paperclip,
  Check
} from "lucide-react";

export default function FutureAnalysis() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  // Selection states
  const [activeNoteId, setActiveNoteId] = useState(null);
  
  // Note creation / editing state
  const [isCreating, setIsCreating] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editPriority, setEditPriority] = useState("Medium");
  const [editStatus, setEditStatus] = useState("Under Discussion");
  
  // Autosave status state
  const [autosaveStatus, setAutosaveStatus] = useState("saved"); // saved, saving, idle
  const autosaveTimer = useRef(null);

  // Comments state
  const [newComment, setNewComment] = useState("");

  // Queries
  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ["notes", search, filterStatus, filterPriority],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterStatus) params.append("status", filterStatus);
      if (filterPriority) params.append("priority", filterPriority);
      const res = await fetch(`/api/future-analysis?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch strategic notes");
      return res.json();
    },
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", activeNoteId],
    queryFn: async () => {
      if (!activeNoteId) return { comments: [] };
      const res = await fetch(`/api/future-analysis/${activeNoteId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: !!activeNoteId,
  });

  // Mutations
  const createNoteMutation = useMutation({
    mutationFn: async (newNote) => {
      const res = await fetch("/api/future-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote),
      });
      if (!res.ok) throw new Error("Failed to create note");
      return res.json();
    },
    onSuccess: (data) => {
      setIsCreating(false);
      setActiveNoteId(data.note._id);
      queryClient.invalidateQueries(["notes"]);
      queryClient.invalidateQueries(["timeline"]);
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, fields }) => {
      const res = await fetch(`/api/future-analysis/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error("Failed to update note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notes"]);
      queryClient.invalidateQueries(["timeline"]);
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/future-analysis/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete note");
      return res.json();
    },
    onSuccess: () => {
      setActiveNoteId(null);
      queryClient.invalidateQueries(["notes"]);
      queryClient.invalidateQueries(["timeline"]);
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ noteId, content }) => {
      const res = await fetch(`/api/future-analysis/${noteId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries(["comments", activeNoteId]);
      queryClient.invalidateQueries(["timeline"]);
    },
  });

  // Get current active note object
  const activeNote = notesData?.notes?.find((n) => n._id === activeNoteId);

  // Sync edit form with active note when active note changes
  useEffect(() => {
    if (activeNote) {
      setEditTitle(activeNote.title);
      setEditDesc(activeNote.description);
      setEditTags(activeNote.tags.join(", "));
      setEditPriority(activeNote.priority);
      setEditStatus(activeNote.status);
      setIsCreating(false);
    }
  }, [activeNoteId, activeNote]);

  // Simulated Autosave logic
  const triggerAutosave = (fieldsToUpdate) => {
    if (!activeNoteId || isCreating) return;
    setAutosaveStatus("saving");
    
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    autosaveTimer.current = setTimeout(() => {
      updateNoteMutation.mutate({
        id: activeNoteId,
        fields: fieldsToUpdate,
      }, {
        onSuccess: () => {
          setAutosaveStatus("saved");
        },
        onError: () => {
          setAutosaveStatus("idle");
        }
      });
    }, 1500); // Wait 1.5 seconds after typing finishes to save
  };

  const handleDescChange = (e) => {
    const val = e.target.value;
    setEditDesc(val);
    triggerAutosave({ description: val });
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setEditTitle(val);
    triggerAutosave({ title: val });
  };

  const handleTagsChange = (e) => {
    const val = e.target.value;
    setEditTags(val);
    const tagsArray = val.split(",").map(t => t.trim()).filter(Boolean);
    triggerAutosave({ tags: tagsArray });
  };

  const handleSelectStatus = (statusVal) => {
    setEditStatus(statusVal);
    updateNoteMutation.mutate({
      id: activeNoteId,
      fields: { status: statusVal },
    });
  };

  const handleSelectPriority = (priorityVal) => {
    setEditPriority(priorityVal);
    updateNoteMutation.mutate({
      id: activeNoteId,
      fields: { priority: priorityVal },
    });
  };

  const handleTogglePin = () => {
    if (!activeNote) return;
    updateNoteMutation.mutate({
      id: activeNoteId,
      fields: { pinned: !activeNote.pinned },
    });
  };

  const handleDeleteNote = () => {
    if (confirm("Are you sure you want to delete this strategic note? This cannot be undone.")) {
      deleteNoteMutation.mutate(activeNoteId);
    }
  };

  const handleCreateNoteSubmit = (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    createNoteMutation.mutate({
      title: editTitle.trim(),
      description: editDesc.trim(),
      tags: editTags.split(",").map(t => t.trim()).filter(Boolean),
      priority: editPriority,
      status: editStatus,
    });
  };

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
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Agreed
          </span>
        );
      case "Under Discussion":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 animate-pulse" /> Under Discussion
          </span>
        );
      case "Rejected":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/25 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  // Render Priority Badge
  const renderPriorityBadge = (priority) => {
    const colors = {
      High: "bg-rose-500/10 text-rose-400 border-rose-500/25",
      Medium: "bg-amber-500/10 text-amber-400 border-amber-500/25",
      Low: "bg-zinc-800 text-zinc-400 border-zinc-750",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${colors[priority]}`}>
        {priority}
      </span>
    );
  };

  return (
    <Layout>
      {/* Upper header */}
      <div className="mb-8 pb-6 border-b border-zinc-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-violet-400" />
            Mallzo Future Analysis
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Strategic mapping, competitive analysis, and scaling notes for long-term decisions.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreating(true);
            setActiveNoteId(null);
            setEditTitle("");
            setEditDesc("");
            setEditTags("");
            setEditPriority("Medium");
            setEditStatus("Under Discussion");
          }}
          className="px-4 py-2.5 rounded-lg bg-violet-650 hover:bg-violet-600 active:scale-[0.98] text-white font-semibold text-xs transition flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Strategic Note
        </button>
      </div>

      {/* Main Workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Notes list + Filters (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Search and Filters box */}
          <div className="p-4 border border-zinc-800 bg-zinc-950/20 rounded-xl space-y-3">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes or tags..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500 rounded-lg py-2 pl-9 pr-3 text-xs text-zinc-150 outline-none placeholder-zinc-550 transition"
              />
            </div>

            {/* Quick dropdown selectors */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-zinc-400 text-[10px] uppercase font-bold py-2 px-2.5 rounded-lg outline-none cursor-pointer focus:border-violet-500 transition"
              >
                <option value="">Status</option>
                <option value="Under Discussion">Under Discussion</option>
                <option value="Agreed">Agreed</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-zinc-400 text-[10px] uppercase font-bold py-2 px-2.5 rounded-lg outline-none cursor-pointer focus:border-violet-500 transition"
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
                        by {note.founder.name}
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
          
          {/* Note Editor View */}
          {activeNoteId && activeNote ? (
            <div className="bg-zinc-950/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-6">
              
              {/* Header Actions: Pinned, Status, Priority Selector, Trash */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-850">
                <div className="flex items-center gap-3">
                  {/* Pin button */}
                  <button
                    onClick={handleTogglePin}
                    className={`p-2 rounded-lg border transition ${
                      activeNote.pinned
                        ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-350 hover:bg-zinc-850"
                    }`}
                  >
                    <Pin className={`w-4 h-4 ${activeNote.pinned ? "fill-violet-400" : ""}`} />
                  </button>

                  {/* Status Dropdown */}
                  <select
                    value={editStatus}
                    onChange={(e) => handleSelectStatus(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold uppercase py-2 px-3 rounded-lg outline-none cursor-pointer focus:border-violet-500 transition"
                  >
                    <option value="Under Discussion">Under Discussion</option>
                    <option value="Agreed">Agreed</option>
                    <option value="Rejected">Rejected</option>
                  </select>

                  {/* Priority Dropdown */}
                  <select
                    value={editPriority}
                    onChange={(e) => handleSelectPriority(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold uppercase py-2 px-3 rounded-lg outline-none cursor-pointer focus:border-violet-500 transition"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Right actions: Autosave status indicator and Delete */}
                <div className="flex items-center gap-4 ml-auto">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    {autosaveStatus === "saving" ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                        Saving draft...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Saved
                      </>
                    )}
                  </span>

                  {activeNote.founder?._id?.toString() === user?._id?.toString() && (
                    <button
                      onClick={handleDeleteNote}
                      className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-rose-950/20 hover:border-rose-900/40 text-zinc-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4 text-left">
                {/* Title Input */}
                <div>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={handleTitleChange}
                    className="w-full bg-transparent border-b border-transparent focus:border-zinc-800 text-xl font-bold text-zinc-100 py-1 outline-none transition"
                  />
                  <p className="text-[10px] text-zinc-550 mt-1 font-medium">
                    Note by <span className="text-zinc-400">{activeNote.founder.name}</span> &bull; Last updated {new Date(activeNote.updatedAt).toLocaleTimeString()}
                  </p>
                </div>

                {/* Description Textarea */}
                <div>
                  <textarea
                    value={editDesc}
                    onChange={handleDescChange}
                    placeholder="Describe your proposal, competitor analysis, scaling strategy, or roadmap..."
                    rows={12}
                    className="w-full bg-zinc-900/30 border border-zinc-850 hover:border-zinc-800 focus:border-violet-500/80 rounded-xl p-4 text-xs text-zinc-200 outline-none leading-relaxed placeholder-zinc-550 transition resize-none font-sans"
                  />
                </div>

                {/* Tags input */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 block uppercase tracking-wider mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={handleTagsChange}
                    placeholder="marketing, ai, roadmap, growth"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500 rounded-lg p-2.5 text-xs text-zinc-150 outline-none transition"
                  />
                </div>
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
                    className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-2.5 text-xs text-zinc-150 outline-none transition"
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
                      
                      return (
                        <div key={comment._id} className="p-3 rounded-xl border border-zinc-900 bg-zinc-900/10 text-left">
                          <div className="flex items-center justify-between gap-3 mb-1.5">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const isFounder = comment.userType === "Founder" || comment.founder;
                                const name = isFounder ? comment.founder?.name : comment.coreMember?.name;
                                const avatar = isFounder ? comment.founder?.avatar : comment.coreMember?.avatar;
                                const badge = isFounder ? "FOUNDER" : "TEAM";
                                return (
                                  <>
                                    <img 
                                      src={avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${name || "Member"}`} 
                                      alt={name || "Member"} 
                                      className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-850" 
                                    />
                                    <span className="text-[11px] font-bold text-zinc-200">{name || "Member"}</span>
                                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                                      isFounder ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" : "bg-zinc-800 text-zinc-500"
                                    }`}>
                                      {badge}
                                    </span>
                                  </>
                                );
                              })()}
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
          ) : isCreating ? (
            /* Creation Form */
            <form onSubmit={handleCreateNoteSubmit} className="bg-zinc-950/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-5 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
                <h3 className="text-base font-bold text-zinc-150">
                  New Strategic Analysis Note
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-xs transition"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider mb-2">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Title (e.g. Scaling revenue via affiliate ads)"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500 rounded-lg p-2.5 text-xs text-zinc-150 outline-none transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider mb-2">
                  Description / Strategy Proposal
                </label>
                <textarea
                  placeholder="Outline competitor metrics, integration roadmap, automations, weaknesses, or pricing models..."
                  rows={10}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500 rounded-lg p-3.5 text-xs text-zinc-200 outline-none transition resize-none leading-relaxed font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider mb-2">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold py-2.5 px-3 rounded-lg outline-none cursor-pointer focus:border-violet-500 transition"
                  >
                    <option value="Under Discussion">Under Discussion</option>
                    <option value="Agreed">Agreed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider mb-2">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold py-2.5 px-3 rounded-lg outline-none cursor-pointer focus:border-violet-500 transition"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="seo, competitor, pricing"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500 rounded-lg p-2.5 text-xs text-zinc-150 outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-850 flex justify-end">
                <button
                  type="submit"
                  disabled={createNoteMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-violet-650 hover:bg-violet-600 text-white font-semibold text-xs transition"
                >
                  {createNoteMutation.isPending ? "Creating..." : "Save Proposal"}
                </button>
              </div>
            </form>
          ) : (
            /* Placeholder */
            <div className="h-96 border border-dashed border-zinc-850 rounded-2xl flex flex-col items-center justify-center p-8 bg-zinc-950/15">
              <Lightbulb className="w-12 h-12 text-zinc-700 animate-pulse mb-3" />
              <h3 className="font-bold text-zinc-300 text-sm">Strategic Workspace</h3>
              <p className="text-zinc-550 text-xs mt-1 text-center max-w-xs leading-relaxed">
                Select a strategic planning note from the side panel, or create a new one to begin collaborating.
              </p>
            </div>
          )}

        </div>

      </div>
    </Layout>
  );
}
