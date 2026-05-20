"use client";

import { useCoreAuth } from "@/context/CoreAuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Lightbulb, 
  LogOut, 
  Bell, 
  Menu, 
  X,
  Clock,
  Heart,
  MessageSquare
} from "lucide-react";

export default function CoreLayout({ children }) {
  const { user, logout } = useCoreAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/core/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications.filter(n => !n.isRead).length);
      }
    } catch (e) {
      console.error("Core Layout fetch notifications error:", e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 30s
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/core/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { name: "Ideas Dashboard", href: "/core", icon: LayoutDashboard },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
          <span className="text-zinc-500 text-sm">Authenticating Core Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col md:flex-row">
      {/* Background radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))] pointer-events-none z-0" />

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl z-20 shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-800/65">
          <Link href="/core" className="flex items-center gap-2 font-bold text-xl tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            <span className="text-zinc-100">Mallzo</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-zinc-800 text-violet-400 font-bold">CORE</span>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-zinc-800/65 flex items-center gap-3">
          <div className="relative">
            <img src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`} alt={user.name} className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-800" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-900" />
          </div>
          <div className="overflow-hidden">
            <h4 className="font-semibold text-sm text-zinc-200 truncate">{user.name}</h4>
            <p className="text-xs text-zinc-500 truncate capitalize">Core Member</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 px-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-zinc-800/85 text-zinc-100 shadow-sm shadow-violet-500/10 border-l-2 border-violet-500"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-violet-400" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-zinc-800/65">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-red-950/20 hover:text-red-400 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex h-16 items-center justify-between px-6 border-b border-zinc-800 bg-zinc-950/40 backdrop-blur-xl z-20">
        <Link href="/core" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <span className="text-zinc-100">Mallzo</span>
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-zinc-800 text-violet-400 font-bold">CORE</span>
        </Link>
        <div className="flex items-center gap-4">
          {/* Notifications Trigger */}
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 transition cursor-pointer"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
            )}
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-zinc-950/95 backdrop-blur-xl z-40 flex flex-col p-6 space-y-6">
          <nav className="flex flex-col space-y-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                    isActive
                      ? "bg-zinc-900 text-zinc-100 border-l-2 border-violet-500"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/55"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-zinc-800 pt-6">
            <div className="flex items-center gap-3 mb-6">
              <img src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`} alt={user.name} className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-800" />
              <div>
                <h4 className="font-semibold text-zinc-200">{user.name}</h4>
                <p className="text-xs text-zinc-500">Core Member</p>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-red-400 hover:bg-red-950/20 transition-all cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Notification Center Panel */}
      {notificationsOpen && (
        <div className="absolute top-16 right-4 md:right-8 w-80 md:w-96 max-h-[500px] flex flex-col bg-zinc-950/90 border border-zinc-800 rounded-xl shadow-2xl backdrop-blur-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/30">
            <h4 className="font-semibold text-zinc-200 flex items-center gap-2">
              <Bell className="w-4 h-4 text-violet-400" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-600/90 text-violet-100 font-bold">
                  {unreadCount} new
                </span>
              )}
            </h4>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-violet-400 hover:text-violet-300 font-medium transition cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              <button 
                onClick={() => setNotificationsOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => {
                const date = new Date(notif.createdAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
                
                return (
                  <Link
                    href={`/core/ideas/${notif.idea?._id || notif.idea}`}
                    key={notif._id}
                    onClick={() => setNotificationsOpen(false)}
                    className={`p-4 flex gap-3 transition hover:bg-zinc-900/40 block ${
                      !notif.isRead ? "bg-violet-950/5 border-l-2 border-violet-500" : ""
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {notif.type === "response" ? (
                        <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      ) : notif.type === "status_change" ? (
                        <div className="p-1 rounded-md bg-violet-500/10 text-violet-400">
                          <Lightbulb className="w-4 h-4" />
                        </div>
                      ) : notif.type === "like" ? (
                        <div className="p-1 rounded-md bg-rose-500/10 text-rose-500">
                          <Heart className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-1 rounded-md bg-blue-500/10 text-blue-500">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-200 truncate">{notif.title}</p>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{notif.description}</p>
                      <span className="text-[10px] text-zinc-500 mt-2 block">{date}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 z-10 relative">
        {/* Header Bar */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-zinc-800/40 bg-zinc-950/10 backdrop-blur-md">
          <div className="text-sm text-zinc-500">
            Core Member Operating Suite &bull; <span className="text-zinc-300 font-medium">Mallzo OS</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notification Trigger Desktop */}
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/70 text-zinc-300 transition cursor-pointer"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              )}
            </button>
            
            {/* Divider */}
            <span className="w-px h-5 bg-zinc-800" />
            
            {/* User details */}
            <div className="flex items-center gap-3">
              <img src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`} alt={user.name} className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800" />
              <div className="text-left">
                <p className="text-xs font-semibold text-zinc-200">{user.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-emerald-400 font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
