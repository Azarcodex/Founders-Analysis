"use client";

export default function Loader({ className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 space-y-4 ${className}`}>
      {/* Sleek rotating ring */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
        <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin" />
      </div>
      <p className="text-zinc-500 text-xs tracking-widest uppercase animate-pulse">
        Synchronizing...
      </p>
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return (
    <div className={`bg-zinc-900/60 animate-pulse rounded-lg border border-zinc-800/40 ${className}`} />
  );
}
