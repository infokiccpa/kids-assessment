"use client";

import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Menu,
  LogOut,
  Sparkles,
  Bell,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useState, useCallback } from "react";

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const SIDEBAR_ITEMS = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    view: "admin-dashboard" as const,
  },
  {
    icon: FileText,
    label: "Applications",
    view: "admin-students" as const,
  },
  {
    icon: Settings,
    label: "Settings",
    view: "admin-settings" as const,
  },
];

// Extracted as a proper component to avoid "created during render" error
function SidebarContent({
  activeView,
  onNavigate,
  onLogout,
}: {
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-purple-50 via-lavender-50 to-pink-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-purple-100/60">
        <div className="icon-bubble icon-bubble-coral h-10 w-10 animate-wiggle">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="font-extrabold text-lg rainbow-text">KinderAssess</span>
      </div>
      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = activeView === item.view;
          return (
            <Button
              key={item.label}
              variant="ghost"
              className={`w-full justify-start gap-3 h-11 rounded-2xl px-4 transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white shadow-lg shadow-[#FF6B6B]/25 hover:from-[#FF6B6B] hover:to-[#FF8E53] font-bold"
                  : "text-purple-700/70 hover:bg-purple-100/60 hover:text-purple-900 font-medium"
              }`}
              onClick={() => onNavigate(item.view)}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-white" : ""}`} />
              {item.label}
            </Button>
          );
        })}
      </nav>
      {/* Divider */}
      <div className="px-4 pb-2">
        <div className="divider-rainbow" />
      </div>
      {/* Sign Out */}
      <div className="px-3 py-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11 rounded-2xl px-4 text-rose-400 hover:bg-rose-50 hover:text-rose-600 font-medium transition-all duration-200"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
  activeView,
}: {
  children: React.ReactNode;
  activeView: string;
}) {
  const { user, setCurrentView, logout } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  // Fetch notifications
  useEffect(() => {
    if (!user?.id) return;
    const fetchNotifs = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        // Silently ignore
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const markAsRead = useCallback(async (notifId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notifId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently ignore
    }
  }, []);

  const handleNavigate = useCallback((view: string) => {
    setCurrentView(view as "admin-dashboard" | "admin-students" | "admin-settings");
    setSidebarOpen(false);
  }, [setCurrentView]);

  const handleLogout = useCallback(() => {
    logout();
    setCurrentView("landing");
  }, [logout, setCurrentView]);

  return (
    <div className="h-screen flex overflow-hidden bg-playful-warm">
      {/* Desktop Sidebar - Fixed, no scroll */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r border-purple-100/50 flex-shrink-0">
        <SidebarContent activeView={activeView} onNavigate={handleNavigate} onLogout={handleLogout} />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent activeView={activeView} onNavigate={handleNavigate} onLogout={handleLogout} />
        </SheetContent>
      </Sheet>

      {/* Main Content - Only this area scrolls */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar - Stays fixed at top */}
        <header className="flex-shrink-0 z-40 flex h-16 items-center gap-4 border-b border-purple-100/40 bg-white/80 backdrop-blur-md px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-2xl hover:bg-purple-50"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-purple-600" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {/* Notification Popover */}
            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-2xl hover:bg-amber-50">
                  <Bell className="h-5 w-5 text-amber-500" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B6B] text-[10px] font-bold text-white shadow-md shadow-[#FF6B6B]/30">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 rounded-2xl border-2 border-purple-100 shadow-xl">
                <div className="flex items-center justify-between p-4 border-b border-purple-100/50">
                  <h4 className="font-bold text-sm text-purple-800">🔔 Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={async () => {
                        for (const n of notifications.filter((n) => !n.read)) {
                          await markAsRead(n.id);
                        }
                      }}
                      className="text-xs text-[#FF6B6B] hover:text-[#ff5252] font-semibold transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <div className="icon-bubble icon-bubble-purple h-12 w-12 mx-auto mb-3 opacity-50">
                        <Bell className="h-6 w-6" />
                      </div>
                      <p className="font-medium text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-3 p-3 border-b border-purple-50 last:border-0 transition-colors hover:bg-purple-50/40 ${
                          !notif.read ? "bg-[#FF6B6B]/5" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm leading-tight ${!notif.read ? "font-semibold" : ""}`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="shrink-0 p-1 rounded-lg hover:bg-purple-100 transition-colors"
                              >
                                <X className="size-3 text-purple-400" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">
                            {new Date(notif.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {/* User Avatar */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="icon-bubble icon-bubble-purple h-9 w-9 text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <span className="font-semibold text-foreground">
                {user?.name || "Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
