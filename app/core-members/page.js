"use client";

import Layout from "@/components/Layout";
import Loader, { Skeleton } from "@/components/Loader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Lightbulb,
  Pin,
  MessageSquare,
  BarChart2,
  Trophy,
  Activity,
  Flame,
  CheckCircle2,
  ThumbsUp,
  Tag,
  X,
  Send,
  Save,
  Check,
  Search,
  Filter
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

export default function CoreMembersManagement() {
  const queryClient = useQueryClient();

  // Search & Filter for ideas
  const [ideaSearch, setIdeaSearch] = useState("");
  const [ideaCategory, setIdeaCategory] = useState("");
  const [ideaStatus, setIdeaStatus] = useState("");
  const [ideaPriority, setIdeaPriority] = useState("");

  // Core Member Form States
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [memberAvatar, setMemberAvatar] = useState("");
  const [memberStatus, setMemberStatus] = useState("Active");
  const [memberFormError, setMemberFormError] = useState("");

  // Founder responses state (key is ideaId)
  const [responseInputs, setResponseInputs] = useState({});

  // Active Discussion Drawer/Modal
  const [activeDiscussionIdeaId, setActiveDiscussionIdeaId] = useState(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyText, setReplyText] = useState("");

  // Queries
  // 1. Fetch Core Members list
  const { data: membersData, isLoading: isMembersLoading } = useQuery({
    queryKey: ["founderCoreMembers"],
    queryFn: async () => {
      const res = await fetch("/api/core-members");
      if (!res.ok) throw new Error("Failed to fetch core members");
      return res.json();
    },
  });

  // 2. Fetch Core Analytics
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ["founderCoreAnalytics"],
    queryFn: async () => {
      const res = await fetch("/api/founder/analytics/core-members");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  // 3. Fetch Ideas (for Founder control board)
  const { data: ideasData, isLoading: isIdeasLoading } = useQuery({
    queryKey: ["founderIdeas", ideaCategory, ideaStatus, ideaPriority, ideaSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (ideaCategory) params.append("category", ideaCategory);
      if (ideaStatus) params.append("status", ideaStatus);
      if (ideaPriority) params.append("priority", ideaPriority);
      if (ideaSearch) params.append("search", ideaSearch);

      const res = await fetch(`/api/founder/ideas?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch founder ideas");
      return res.json();
    },
  });

  // 4. Fetch Comments for Active Discussion
  const { data: activeCommentsData, isLoading: isActiveCommentsLoading } = useQuery({
    queryKey: ["activeComments", activeDiscussionIdeaId],
    queryFn: async () => {
      if (!activeDiscussionIdeaId) return null;
      const res = await fetch(`/api/core/ideas/${activeDiscussionIdeaId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: !!activeDiscussionIdeaId,
  });

  // Mutations
  // 1. Register Core Member
  const registerMemberMutation = useMutation({
    mutationFn: async (newMember) => {
      const res = await fetch("/api/core-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to register member");
      }
      return res.json();
    },
    onSuccess: () => {
      closeMemberModal();
      queryClient.invalidateQueries(["founderCoreMembers"]);
      queryClient.invalidateQueries(["founderCoreAnalytics"]);
    },
    onError: (err) => setMemberFormError(err.message),
  });

  // 2. Update Core Member
  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, updatedMember }) => {
      const res = await fetch(`/api/core-members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMember),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update member");
      }
      return res.json();
    },
    onSuccess: () => {
      closeMemberModal();
      queryClient.invalidateQueries(["founderCoreMembers"]);
      queryClient.invalidateQueries(["founderCoreAnalytics"]);
    },
    onError: (err) => setMemberFormError(err.message),
  });

  // 3. Delete Core Member
  const deleteMemberMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/core-members/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete member");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["founderCoreMembers"]);
      queryClient.invalidateQueries(["founderCoreAnalytics"]);
      queryClient.invalidateQueries(["founderIdeas"]);
    },
  });

  // 4. Update Idea Status/Response/Pin
  const updateIdeaMutation = useMutation({
    mutationFn: async ({ id, status, founderResponse, pinned }) => {
      const res = await fetch(`/api/founder/ideas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, founderResponse, pinned }),
      });
      if (!res.ok) throw new Error("Failed to update idea");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["founderIdeas"]);
      queryClient.invalidateQueries(["founderCoreAnalytics"]);
    },
  });

  // 5. Delete Idea
  const deleteIdeaMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/founder/ideas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete idea");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["founderIdeas"]);
      queryClient.invalidateQueries(["founderCoreAnalytics"]);
    },
  });

  // 6. Post Comment/Reply
  const postCommentMutation = useMutation({
    mutationFn: async (commentBody) => {
      const res = await fetch(`/api/core/ideas/${activeDiscussionIdeaId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentBody),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: () => {
      setNewCommentText("");
      setReplyToId(null);
      setReplyText("");
      queryClient.invalidateQueries(["activeComments", activeDiscussionIdeaId]);
    },
  });

  // Handlers
  const openAddModal = () => {
    setEditingMember(null);
    setMemberName("");
    setMemberEmail("");
    setMemberPassword("");
    setMemberAvatar("");
    setMemberStatus("Active");
    setMemberFormError("");
    setIsMemberModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setMemberName(member.name);
    setMemberEmail(member.email);
    setMemberPassword("");
    setMemberAvatar(member.avatar || "");
    setMemberStatus(member.status || "Active");
    setMemberFormError("");
    setIsMemberModalOpen(true);
  };

  const closeMemberModal = () => {
    setIsMemberModalOpen(false);
    setEditingMember(null);
  };

  const handleMemberSubmit = (e) => {
    e.preventDefault();
    setMemberFormError("");

    if (!memberName.trim() || !memberEmail.trim()) {
      setMemberFormError("Name and Email are required");
      return;
    }

    if (!editingMember && !memberPassword) {
      setMemberFormError("Password is required for new accounts");
      return;
    }

    const payload = {
      name: memberName.trim(),
      email: memberEmail.trim(),
      avatar: memberAvatar.trim() || undefined,
      status: memberStatus,
    };

    if (memberPassword) payload.password = memberPassword;

    if (editingMember) {
      updateMemberMutation.mutate({ id: editingMember._id, updatedMember: payload });
    } else {
      registerMemberMutation.mutate(payload);
    }
  };

  const handleDeleteMember = (id, name) => {
    if (confirm(`CAUTION: Deleting ${name} will permanently remove their profile, submitted ideas, comments, upvotes, and notifications. Proceed?`)) {
      deleteMemberMutation.mutate(id);
    }
  };

  const handleUpdateStatus = (id, status) => {
    updateIdeaMutation.mutate({ id, status });
  };

  const handleTogglePin = (id, currentPin) => {
    updateIdeaMutation.mutate({ id, pinned: !currentPin });
  };

  const handleSaveResponse = (id) => {
    const text = responseInputs[id];
    if (text === undefined) return;
    updateIdeaMutation.mutate({ id, founderResponse: text });
  };

  const handleDeleteIdea = (id) => {
    if (confirm("Are you sure you want to delete this idea proposal?")) {
      deleteIdeaMutation.mutate(id);
    }
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    postCommentMutation.mutate({ text: newCommentText.trim() });
  };

  const handlePostReply = (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    postCommentMutation.mutate({
      text: replyText.trim(),
      parentComment: parentId,
    });
  };

  // Process data variables
  const members = membersData?.members || [];
  const ideas = ideasData?.ideas || [];
  const analytics = analyticsData?.analytics || {
    totals: { totalIdeas: 0, pendingReviews: 0, approvedIdeas: 0, totalLikes: 0, totalComments: 0 },
    weeklyActivity: [],
    rankings: []
  };

  const categories = [
    "feature ideas",
    "UI improvements",
    "business ideas",
    "scaling ideas",
    "marketing ideas",
    "bug reports",
    "automation ideas",
    "AI ideas",
    "workflow improvements",
  ];

  const categoryColors = {
    "feature ideas": "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "UI improvements": "bg-sky-500/10 text-sky-400 border-sky-500/20",
    "business ideas": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "scaling ideas": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "marketing ideas": "bg-pink-500/10 text-pink-400 border-pink-500/20",
    "bug reports": "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "automation ideas": "bg-teal-500/10 text-teal-400 border-teal-500/20",
    "AI ideas": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "workflow improvements": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  const statusColors = {
    "Pending Review": "bg-zinc-800 text-zinc-400 border-zinc-750",
    "Under Discussion": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Approved": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Rejected": "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "Planned": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };

  const priorityColors = {
    high: "text-rose-400 border-rose-500/20 bg-rose-500/5",
    medium: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    low: "text-zinc-550 border-zinc-800 bg-zinc-900/10",
  };

  const getMedalColor = (index) => {
    switch (index) {
      case 0: return "bg-amber-500/20 border-amber-500/40 text-amber-400";
      case 1: return "bg-zinc-300/20 border-zinc-300/40 text-zinc-300";
      case 2: return "bg-amber-800/20 border-amber-800/40 text-amber-600";
      default: return "bg-zinc-900/50 border-zinc-850 text-zinc-500";
    }
  };

  return (
    <Layout>
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-zinc-800/40">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-violet-400" />
            Core Members Dashboard
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Administer team members, track collaboration performance rankings, and respond to strategy proposals.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-violet-650 hover:bg-violet-600 active:scale-[0.98] text-white text-sm font-semibold transition flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <UserPlus className="w-4.5 h-4.5" />
          Add Core Member
        </button>
      </div>

      {isAnalyticsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-950/20 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/5 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Total Ideas Submitted</span>
              <span className="text-3.5xl font-black text-white">{analytics.totals.totalIdeas}</span>
              <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {analytics.totals.approvedIdeas} proposals approved
              </p>
            </div>

            <div className="bg-zinc-950/20 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Pending Review</span>
              <span className="text-3.5xl font-black text-amber-400">{analytics.totals.pendingReviews}</span>
              <p className="text-[10px] text-zinc-555 mt-2">Awaiting founder responses</p>
            </div>

            <div className="bg-zinc-950/20 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Most Active Contributor</span>
              <span className="text-xl font-black text-white truncate block">
                {analytics.mostActive ? analytics.mostActive.name : "None"}
              </span>
              <p className="text-[10px] text-zinc-500 mt-2">
                {analytics.mostActive ? `${analytics.mostActive.totalIdeas} ideas submitted` : ""}
              </p>
            </div>

            <div className="bg-zinc-950/20 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Highest Approved</span>
              <span className="text-xl font-black text-white truncate block">
                {analytics.highestApproved ? analytics.highestApproved.name : "None"}
              </span>
              <p className="text-[10px] text-zinc-500 mt-2">
                {analytics.highestApproved ? `${analytics.highestApproved.approvedIdeas} approved ideas` : ""}
              </p>
            </div>
          </div>

          {/* Grid: Analytics Chart & Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Leaderboard/Contribution standings */}
            <div className="lg:col-span-2 bg-zinc-950/30 border border-zinc-800/85 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-base font-bold text-zinc-150 flex items-center gap-2 mb-6">
                <Trophy className="w-5 h-5 text-amber-500" />
                Core Contributors Ranking
              </h3>

              <div className="space-y-4">
                {analytics.rankings.length === 0 ? (
                  <p className="text-center py-6 text-zinc-650 text-xs">No registered core member statistics found.</p>
                ) : (
                  analytics.rankings.map((stat, index) => {
                    const badgeClass = getMedalColor(index);
                    return (
                      <div
                        key={stat.id}
                        className="flex items-center justify-between gap-4 p-4 border border-zinc-850 rounded-xl bg-zinc-900/10 hover:border-zinc-800 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border ${badgeClass}`}>
                            {index === 0 ? "1st" : index === 1 ? "2nd" : index === 2 ? "3rd" : `${index + 1}`}
                          </span>

                          <img
                            src={stat.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${stat.name}`}
                            alt={stat.name}
                            className="w-10 h-10 rounded-full bg-zinc-850"
                          />

                          <div>
                            <h4 className="font-bold text-zinc-200 text-sm leading-tight">{stat.name}</h4>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[10px] text-zinc-500 font-medium">
                                {stat.totalIdeas} ideas submitted ({stat.approvedIdeas} approved)
                              </span>
                              <span className="text-[10px] text-zinc-550 flex items-center gap-0.5">
                                <ThumbsUp className="w-3 h-3 text-rose-500" />
                                {stat.likesReceived} likes
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] text-zinc-550 uppercase tracking-wider block font-bold">Score</span>
                          <span className="text-lg font-black text-violet-400">{stat.contributionScore} pts</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Weekly Activity chart */}
            <div className="bg-zinc-950/30 border border-zinc-800/85 rounded-2xl p-6 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-150 flex items-center gap-2 mb-1.5">
                  <Activity className="w-4.5 h-4.5 text-violet-400" />
                  Submission Activity
                </h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-6">Ideas created in past 7 days</p>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                {analytics.weeklyActivity.length === 0 ? (
                  <span className="text-zinc-650 text-xs">No recent activity.</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.weeklyActivity}
                      margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }}
                        labelStyle={{ color: "#a1a1aa", fontWeight: "bold", fontSize: 12 }}
                      />
                      <Bar dataKey="ideas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Core Members List Management Section */}
      <div className="bg-zinc-950/20 border border-zinc-800/85 rounded-2xl p-6 backdrop-blur-xl mb-10">
        <h3 className="text-base font-bold text-zinc-150 mb-6 flex items-center gap-2">
          <Users className="w-4.5 h-4.5 text-violet-400" />
          Active Core Members
        </h3>

        {isMembersLoading ? (
          <Skeleton className="h-40" />
        ) : members.length === 0 ? (
          <p className="text-center py-6 text-zinc-650 text-xs">No core members found. Click "Add Core Member" to register one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-500 uppercase tracking-wider font-semibold">
                  <th className="pb-3.5">Name</th>
                  <th className="pb-3.5">Email</th>
                  <th className="pb-3.5 text-center">Status</th>
                  <th className="pb-3.5 text-center">Total Ideas</th>
                  <th className="pb-3.5 text-center">Approved</th>
                  <th className="pb-3.5 text-center">Likes Rec.</th>
                  <th className="pb-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                {members.map((member) => (
                  <tr key={member._id} className="hover:bg-zinc-900/10 transition">
                    <td className="py-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={member.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.name}`}
                          alt={member.name}
                          className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-800"
                        />
                        <span className="font-bold text-zinc-200">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-zinc-450">{member.email}</td>
                    <td className="py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        member.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                      }`}>
                        {member.status || "Active"}
                      </span>
                    </td>
                    <td className="py-4 text-center text-zinc-400 font-medium">{member.totalIdeas || 0}</td>
                    <td className="py-4 text-center text-emerald-500 font-semibold">{member.approvedIdeas || 0}</td>
                    <td className="py-4 text-center text-rose-400 font-semibold">{member.totalLikes || 0}</td>
                    <td className="py-4 text-right">
                      <div className="inline-flex gap-2.5">
                        <button
                          onClick={() => openEditModal(member)}
                          className="p-1 rounded text-zinc-500 hover:text-violet-400 transition cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member._id, member.name)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-500 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collaboration proposals list (control board) */}
      <div className="bg-zinc-950/20 border border-zinc-800/85 rounded-2xl p-6 backdrop-blur-xl">
        <h3 className="text-base font-bold text-zinc-150 mb-6 flex items-center gap-2">
          <Lightbulb className="w-4.5 h-4.5 text-violet-400" />
          Collaboration Proposals Review
        </h3>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-550 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search ideas..."
              value={ideaSearch}
              onChange={(e) => setIdeaSearch(e.target.value)}
              className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-violet-500 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-200 outline-none transition"
            />
          </div>

          <div className="flex flex-wrap gap-2.5">
            <select
              value={ideaCategory}
              onChange={(e) => setIdeaCategory(e.target.value)}
              className="bg-zinc-900/40 border border-zinc-850 rounded-xl text-xs py-2 px-3 text-zinc-450 focus:border-violet-500 outline-none transition cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={ideaStatus}
              onChange={(e) => setIdeaStatus(e.target.value)}
              className="bg-zinc-900/40 border border-zinc-850 rounded-xl text-xs py-2 px-3 text-zinc-450 focus:border-violet-500 outline-none transition cursor-pointer"
            >
              <option value="">All Statuses</option>
              {["Pending Review", "Under Discussion", "Approved", "Rejected", "Planned"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={ideaPriority}
              onChange={(e) => setIdeaPriority(e.target.value)}
              className="bg-zinc-900/40 border border-zinc-850 rounded-xl text-xs py-2 px-3 text-zinc-450 focus:border-violet-500 outline-none transition cursor-pointer"
            >
              <option value="">All Priorities</option>
              {["low", "medium", "high"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {isIdeasLoading ? (
          <Skeleton className="h-48" />
        ) : ideas.length === 0 ? (
          <p className="text-center py-10 text-zinc-650 text-xs">No ideas found.</p>
        ) : (
          <div className="space-y-6">
            {ideas.map((idea) => {
              const resInput = responseInputs[idea._id] !== undefined ? responseInputs[idea._id] : idea.founderResponse || "";
              const responseHasChanged = resInput !== (idea.founderResponse || "");

              return (
                <div
                  key={idea._id}
                  className="p-5 border border-zinc-850 rounded-2xl bg-zinc-900/10 hover:border-zinc-800 transition-all flex flex-col justify-between"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-900/50 pb-4 mb-4">
                    <div>
                      {/* Meta information row */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${categoryColors[idea.category]}`}>
                          {idea.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${priorityColors[idea.priority]}`}>
                          {idea.priority}
                        </span>
                        <div className="flex items-center gap-1.5 ml-2">
                          <img
                            src={idea.createdBy?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${idea.createdBy?.name}`}
                            alt={idea.createdBy?.name}
                            className="w-4.5 h-4.5 rounded-full bg-zinc-850"
                          />
                          <span className="text-[10px] text-zinc-500 font-bold">{idea.createdBy?.name}</span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-zinc-200">{idea.title}</h4>
                      <p className="text-xs text-zinc-450 mt-1 leading-relaxed whitespace-pre-wrap">{idea.description}</p>
                    </div>

                    {/* Controls row */}
                    <div className="flex flex-row md:flex-col gap-2 shrink-0 md:items-end">
                      {/* Pin Toggle */}
                      <button
                        onClick={() => handleTogglePin(idea._id, idea.pinned)}
                        className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center gap-1 ${
                          idea.pinned
                            ? "bg-violet-950/20 border-violet-500 text-violet-400"
                            : "bg-zinc-900 border-zinc-800 text-zinc-555 hover:text-zinc-350"
                        }`}
                      >
                        <Pin className={`w-3.5 h-3.5 ${idea.pinned ? "fill-violet-400" : ""}`} />
                        <span>{idea.pinned ? "Pinned" : "Pin"}</span>
                      </button>

                      {/* Status Dropdown */}
                      <select
                        value={idea.status}
                        onChange={(e) => handleUpdateStatus(idea._id, e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl text-xs py-2 px-2.5 text-zinc-300 outline-none cursor-pointer focus:border-violet-500"
                      >
                        {["Pending Review", "Under Discussion", "Approved", "Rejected", "Planned"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleDeleteIdea(idea._id)}
                        className="p-2 border border-zinc-800 bg-zinc-900 hover:bg-rose-950/25 hover:border-rose-950/20 text-zinc-550 hover:text-rose-500 transition rounded-xl cursor-pointer"
                        title="Delete Idea"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Founder response and discussion interaction */}
                  <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
                    {/* Founder response form field */}
                    <div className="flex-1 w-full flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a feedback response to core member..."
                        value={resInput}
                        onChange={(e) => setResponseInputs({ ...responseInputs, [idea._id]: e.target.value })}
                        className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-violet-500 rounded-xl py-2 px-3.5 text-xs text-zinc-200 outline-none transition"
                      />
                      <button
                        onClick={() => handleSaveResponse(idea._id)}
                        disabled={!responseHasChanged}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                          responseHasChanged
                            ? "bg-violet-650 hover:bg-violet-600 text-white"
                            : "bg-zinc-850 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                        }`}
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Response
                      </button>
                    </div>

                    {/* Open discussion action */}
                    <button
                      onClick={() => setActiveDiscussionIdeaId(idea._id)}
                      className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-350 text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition w-full sm:w-auto justify-center"
                    >
                      <MessageSquare className="w-4 h-4 text-violet-400" />
                      Open Chat Discussion
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CORE MEMBER ADD/EDIT MODAL */}
      <AnimatePresence>
        {isMemberModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={closeMemberModal}
                className="absolute top-4 right-4 text-zinc-550 hover:text-zinc-350 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
                {editingMember ? <Edit className="w-5.5 h-5.5 text-violet-400" /> : <UserPlus className="w-5.5 h-5.5 text-violet-400" />}
                {editingMember ? "Edit Core Member Account" : "Add Core Member"}
              </h2>
              <p className="text-xs text-zinc-500 mb-6">
                {editingMember ? "Modify this core member's information or reset credentials." : "Create a separate team account for suggestion submittals."}
              </p>

              {memberFormError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
                  {memberFormError}
                </div>
              )}

              <form onSubmit={handleMemberSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-450 uppercase block mb-1.5">Member Name</label>
                  <input
                    type="text"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="Ahmed"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-650 outline-none focus:border-violet-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-450 uppercase block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="ahmed@mallzo.com"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-650 outline-none focus:border-violet-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-450 uppercase block mb-1.5">
                    Password {editingMember && "(Leave blank to keep same)"}
                  </label>
                  <input
                    type="password"
                    value={memberPassword}
                    onChange={(e) => setMemberPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-650 outline-none focus:border-violet-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-450 uppercase block mb-1.5">Avatar SVG/Image URL (Optional)</label>
                  <input
                    type="text"
                    value={memberAvatar}
                    onChange={(e) => setMemberAvatar(e.target.value)}
                    placeholder="https://api.dicebear.com/..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-650 outline-none focus:border-violet-500 transition"
                  />
                </div>

                {editingMember && (
                  <div>
                    <label className="text-[10px] font-bold text-zinc-450 uppercase block mb-1.5">Account Status</label>
                    <select
                      value={memberStatus}
                      onChange={(e) => setMemberStatus(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 outline-none focus:border-violet-500 transition cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Away">Away</option>
                      <option value="Offline">Offline</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={closeMemberModal}
                    className="px-4 py-2 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={registerMemberMutation.isPending || updateMemberMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-violet-650 hover:bg-violet-600 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    {registerMemberMutation.isPending || updateMemberMutation.isPending ? "Saving..." : "Save Member"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DISCUSSION DRAWER / MODAL FOR FOUNDER */}
      <AnimatePresence>
        {activeDiscussionIdeaId && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ x: "100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-lg h-full bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col justify-between shadow-2xl relative"
            >
              {/* Close Drawer Button */}
              <button
                onClick={() => {
                  setActiveDiscussionIdeaId(null);
                  setNewCommentText("");
                  setReplyToId(null);
                  setReplyText("");
                }}
                className="absolute top-4 right-4 text-zinc-550 hover:text-zinc-350 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col h-full">
                <h3 className="text-base font-bold text-zinc-150 flex items-center gap-2 mb-2 shrink-0">
                  <MessageSquare className="w-4.5 h-4.5 text-violet-400" />
                  Proposal Discussion Chat
                </h3>
                <p className="text-[10px] text-zinc-550 uppercase tracking-widest font-bold mb-6 shrink-0 border-b border-zinc-900 pb-3">
                  Founder Review Board &bull; Threaded Chat
                </p>

                {/* Comments Container */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 scrollbar-thin">
                  {isActiveCommentsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                    </div>
                  ) : !activeCommentsData?.comments || activeCommentsData.comments.length === 0 ? (
                    <div className="text-center py-16 text-zinc-650 text-xs">No discussion messages on this proposal. Post a comment to begin.</div>
                  ) : (
                    activeCommentsData.comments
                      .filter((c) => !c.parentComment)
                      .map((comment) => {
                        const commentOwner = comment.userType === "Founder" ? comment.founder : comment.coreMember;
                        const commentDate = new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const replies = activeCommentsData.comments.filter((c) => c.parentComment === comment._id);

                        return (
                          <div key={comment._id} className="space-y-3">
                            <div className={`p-3.5 rounded-xl border ${
                              comment.userType === "Founder" 
                                ? "bg-violet-950/5 border-violet-900/35" 
                                : "bg-zinc-900/10 border-zinc-850"
                            }`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={commentOwner?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${commentOwner?.name}`}
                                    alt={commentOwner?.name}
                                    className="w-5 h-5 rounded-full bg-zinc-800"
                                  />
                                  <span className="text-[10px] font-bold text-zinc-300">{commentOwner?.name}</span>
                                  {comment.userType === "Founder" && (
                                    <span className="text-[7px] font-black uppercase px-1 rounded bg-violet-650/20 text-violet-400 border border-violet-500/20">Founder</span>
                                  )}
                                </div>
                                <span className="text-[9px] text-zinc-650">{commentDate}</span>
                              </div>
                              <p className="text-xs text-zinc-350 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                              
                              <div className="mt-2 text-right">
                                <button
                                  onClick={() => {
                                    setReplyToId(replyToId === comment._id ? null : comment._id);
                                    setReplyText("");
                                  }}
                                  className="text-[9px] font-extrabold text-violet-400 hover:text-violet-300 transition cursor-pointer"
                                >
                                  {replyToId === comment._id ? "Cancel Reply" : "Reply"}
                                </button>
                              </div>
                            </div>

                            {/* Inline Reply Form */}
                            {replyToId === comment._id && (
                              <form onSubmit={(e) => handlePostReply(e, comment._id)} className="flex gap-2 pl-6 animate-fadeIn">
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Write reply..."
                                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 outline-none focus:border-violet-500"
                                />
                                <button
                                  type="submit"
                                  disabled={postCommentMutation.isPending}
                                  className="p-2 rounded-lg bg-violet-650 hover:bg-violet-600 text-white cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </form>
                            )}

                            {/* Replies */}
                            {replies.map((reply) => {
                              const replyOwner = reply.userType === "Founder" ? reply.founder : reply.coreMember;
                              const replyDate = new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                              return (
                                <div
                                  key={reply._id}
                                  className={`pl-6 ml-3 border-l border-zinc-900 flex gap-2.5 p-2 rounded-lg border ${
                                    reply.userType === "Founder"
                                      ? "bg-violet-950/5 border-violet-900/15"
                                      : "bg-zinc-900/5 border-zinc-850/50"
                                  }`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-1.5">
                                        <img
                                          src={replyOwner?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${replyOwner?.name}`}
                                          alt={replyOwner?.name}
                                          className="w-4 h-4 rounded-full bg-zinc-800"
                                        />
                                        <span className="text-[9px] font-bold text-zinc-400">{replyOwner?.name}</span>
                                        {reply.userType === "Founder" && (
                                          <span className="text-[7px] font-black uppercase px-0.5 rounded bg-violet-650/20 text-violet-400">Founder</span>
                                        )}
                                      </div>
                                      <span className="text-[8px] text-zinc-605">{replyDate}</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-350 leading-relaxed">{reply.text}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Add Chat message */}
                <form onSubmit={handlePostComment} className="flex gap-2 border-t border-zinc-900 pt-4 shrink-0">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Type feedback, suggestions, questions..."
                    className="flex-1 bg-zinc-900 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-650 outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    disabled={postCommentMutation.isPending}
                    className="p-3 rounded-xl bg-violet-650 hover:bg-violet-600 text-white cursor-pointer transition flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
