"use client";

import Loader, { Skeleton } from "@/components/Loader";
import { useCoreAuth } from "@/context/CoreAuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  CornerDownRight,
  Shield,
  User as UserIcon,
  Send,
  Calendar,
  Pin
} from "lucide-react";
import { motion } from "framer-motion";

export default function IdeaDetailsPage({ params }) {
  const { id } = use(params);
  const { user } = useCoreAuth();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyText, setReplyText] = useState("");

  // Query: Fetch Single Idea Details
  const { data: ideaData, isLoading: isIdeaLoading } = useQuery({
    queryKey: ["coreIdea", id],
    queryFn: async () => {
      const res = await fetch(`/api/core/ideas/${id}`);
      if (!res.ok) throw new Error("Failed to fetch idea");
      return res.json();
    },
  });

  // Query: Fetch Comments
  const { data: commentsData, isLoading: isCommentsLoading } = useQuery({
    queryKey: ["ideaComments", id],
    queryFn: async () => {
      const res = await fetch(`/api/core/ideas/${id}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
  });

  // Mutation: Submit Comment
  const addCommentMutation = useMutation({
    mutationFn: async (commentBody) => {
      const res = await fetch(`/api/core/ideas/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentBody),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: () => {
      setCommentText("");
      setReplyToId(null);
      setReplyText("");
      queryClient.invalidateQueries(["ideaComments", id]);
    },
  });

  // Mutation: Toggle Like
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/core/ideas/${id}/like`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle upvote");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["coreIdea", id]);
      queryClient.invalidateQueries(["coreIdeas"]);
    },
  });

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ text: commentText.trim() });
  };

  const handlePostReply = (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    addCommentMutation.mutate({
      text: replyText.trim(),
      parentComment: parentId,
    });
  };

  const handleToggleLike = () => {
    toggleLikeMutation.mutate();
  };

  if (isIdeaLoading) {
    return (
      <>
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </>
    );
  }

  const idea = ideaData?.idea;
  if (!idea) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-zinc-400">Idea not found or deleted.</p>
          <Link href="/core" className="text-violet-400 hover:text-violet-300 mt-4 inline-block font-semibold">
            &larr; Back to Dashboard
          </Link>
        </div>
      </>
    );
  }

  const comments = commentsData?.comments || [];

  // Group comments into root comments and their replies
  const rootComments = comments.filter((c) => !c.parentComment);
  const getRepliesForComment = (parentId) => {
    return comments.filter((c) => c.parentComment === parentId);
  };



  const statusColors = {
    "Pending Review": "bg-zinc-800 text-zinc-400 border-zinc-750",
    "Under Discussion": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Approved": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Rejected": "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "Planned": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };

  const priorityColors = {
    high: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    low: "bg-zinc-800 text-zinc-450 border-zinc-750",
  };

  return (
    <>
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/core"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-550 hover:text-zinc-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ideas Dashboard
        </Link>
      </div>

      {/* Main Grid: Left Side Idea Detail, Right Side Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Idea description */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-950/20 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl relative">
            {idea.pinned && (
              <span className="absolute top-6 right-6 text-violet-400 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-violet-950/20 border border-violet-800/30 px-2 py-0.5 rounded-full">
                <Pin className="w-3.5 h-3.5 fill-violet-400" />
                Pinned
              </span>
            )}

            <div className="flex items-center gap-2.5 mb-4 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border uppercase ${priorityColors[idea.priority]}`}>
                {idea.priority}
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase ${statusColors[idea.status]}`}>
                {idea.status}
              </span>
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight mb-4">{idea.title}</h1>

            <div className="flex items-center gap-3 border-b border-zinc-900 pb-5 mb-5">
              <img
                src={idea.createdBy?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${idea.createdBy?.name}`}
                alt={idea.createdBy?.name}
                className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-800"
              />
              <div>
                <h4 className="text-sm font-bold text-zinc-300">{idea.createdBy?.name}</h4>
                <p className="text-[10px] text-zinc-550 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3 h-3 text-zinc-650" />
                  Submitted on {new Date(idea.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>

            <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">
              {idea.description}
            </div>

            {/* Like interaction */}
            <div className="flex items-center gap-4 border-t border-zinc-900 pt-5">
              <button
                onClick={handleToggleLike}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition ${
                  idea.userLiked
                    ? "bg-rose-950/15 border-rose-500/80 text-rose-400"
                    : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${idea.userLiked ? "fill-rose-500/20" : ""}`} />
                <span>Upvote Proposal ({idea.likesCount || 0})</span>
              </button>
            </div>
          </div>

          {/* Founder Response Card */}
          {idea.founderResponse ? (
            <div className="bg-gradient-to-r from-violet-950/20 to-indigo-950/15 border border-violet-550/30 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-violet-500/5 blur-2xl pointer-events-none" />
              <h3 className="text-sm font-bold text-violet-400 flex items-center gap-2 mb-3.5 uppercase tracking-widest">
                <Shield className="w-4.5 h-4.5" />
                Founder Response
              </h3>
              <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
                {idea.founderResponse}
              </p>
            </div>
          ) : (
            <div className="bg-zinc-950/10 border border-zinc-850 border-dashed rounded-2xl p-6 text-center">
              <p className="text-zinc-550 text-xs">No response yet from the founder team. Your proposal is pending review.</p>
            </div>
          )}
        </div>

        {/* Right Column: Dynamic threaded comments section */}
        <div className="space-y-6">
          <div className="bg-zinc-950/20 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col max-h-[680px] overflow-hidden">
            <h3 className="text-base font-bold text-zinc-150 flex items-center gap-2 mb-4 shrink-0">
              <MessageSquare className="w-4.5 h-4.5 text-violet-400" />
              Collaboration Chat
            </h3>

            {/* List of comments */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 scrollbar-thin">
              {isCommentsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-10 text-zinc-600 text-xs">No discussion started yet. Be the first!</div>
              ) : (
                rootComments.map((comment) => {
                  const commentOwner = comment.userType === "Founder" ? comment.founder : comment.coreMember;
                  const commentDate = new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const replies = getRepliesForComment(comment._id);

                  return (
                    <div key={comment._id} className="space-y-3.5">
                      {/* Main Comment */}
                      <div className={`p-3.5 rounded-xl border ${
                        comment.userType === "Founder" 
                          ? "bg-violet-950/5 border-violet-900/30" 
                          : "bg-zinc-900/10 border-zinc-850"
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={commentOwner?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${commentOwner?.name}`}
                              alt={commentOwner?.name}
                              className="w-5 h-5 rounded-full bg-zinc-800"
                            />
                            <span className="text-[11px] font-bold text-zinc-300">{commentOwner?.name}</span>
                            {comment.userType === "Founder" && (
                              <span className="text-[8px] font-extrabold uppercase px-1 py-0.5 rounded bg-violet-650/20 text-violet-400 border border-violet-500/25">Founder</span>
                            )}
                          </div>
                          <span className="text-[9px] text-zinc-650">{commentDate}</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                        
                        {/* Reply Action Trigger */}
                        <div className="mt-2.5 text-right">
                          <button
                            onClick={() => {
                              setReplyToId(replyToId === comment._id ? null : comment._id);
                              setReplyText("");
                            }}
                            className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition cursor-pointer"
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
                            placeholder="Write a reply..."
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-violet-500 transition"
                          />
                          <button
                            type="submit"
                            disabled={addCommentMutation.isPending}
                            className="p-2 rounded-lg bg-violet-650 hover:bg-violet-600 text-white cursor-pointer transition shrink-0"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      )}

                      {/* Replies List */}
                      {replies.length > 0 && (
                        <div className="pl-6 space-y-3.5 border-l border-zinc-900 ml-3">
                          {replies.map((reply) => {
                            const replyOwner = reply.userType === "Founder" ? reply.founder : reply.coreMember;
                            const replyDate = new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                            return (
                              <div
                                key={reply._id}
                                className={`p-3 rounded-xl border flex gap-2.5 ${
                                  reply.userType === "Founder"
                                    ? "bg-violet-950/5 border-violet-900/20"
                                    : "bg-zinc-900/10 border-zinc-850/60"
                                }`}
                              >
                                <CornerDownRight className="w-3.5 h-3.5 text-zinc-650 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <img
                                        src={replyOwner?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${replyOwner?.name}`}
                                        alt={replyOwner?.name}
                                        className="w-4.5 h-4.5 rounded-full bg-zinc-800"
                                      />
                                      <span className="text-[10px] font-bold text-zinc-350">{replyOwner?.name}</span>
                                      {reply.userType === "Founder" && (
                                        <span className="text-[7px] font-extrabold uppercase px-1 rounded bg-violet-650/20 text-violet-400 border border-violet-500/20">Founder</span>
                                      )}
                                    </div>
                                    <span className="text-[8px] text-zinc-650">{replyDate}</span>
                                  </div>
                                  <p className="text-xs text-zinc-300 leading-relaxed">{reply.text}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className="flex gap-2 border-t border-zinc-900/60 pt-4 shrink-0">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts on this idea..."
                className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-violet-500 transition"
              />
              <button
                type="submit"
                disabled={addCommentMutation.isPending}
                className="p-3 rounded-xl bg-violet-650 hover:bg-violet-600 active:scale-[0.97] text-white cursor-pointer transition shrink-0 flex items-center justify-center"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </>
  );
}
