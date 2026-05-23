"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  LayoutDashboard,
  Bell,
  LogOut,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  X,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function ParentHeader() {
  const { user, currentView, setCurrentView, logout } = useAppStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  // Fetch notifications on mount and every 30 seconds
  useEffect(() => {
    if (!user?.id) return;

    let active = true;

    const fetchNotifs = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}`);
        if (res.ok && active) {
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
    return () => {
      active = false;
      clearInterval(interval);
    };
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

  const markAllAsRead = useCallback(async () => {
    for (const n of notifications.filter((n) => !n.read)) {
      await markAsRead(n.id);
    }
  }, [notifications, markAsRead]);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "STATUS_CHANGE":
        return <CheckCircle2 className="size-4 text-green-600 shrink-0" />;
      case "ADMIN_REVIEW":
        return <Eye className="size-4 text-purple-600 shrink-0" />;
      case "UPLOAD_COMPLETE":
        return <FileText className="size-4 text-[#FF6B6B] shrink-0" />;
      default:
        return <Clock className="size-4 text-muted-foreground shrink-0" />;
    }
  };

  // Step labels for the parent flow
  const stepLabels: Record<string, string> = {
    "parent-registration": "Registration",
    "parent-questionnaire": "Questionnaire",
    "parent-videos": "Video Tasks",
    "parent-review": "Review",
    "parent-results": "Results",
  };

  const stepColors: Record<string, string> = {
    "parent-registration": "#FF6B6B",
    "parent-questionnaire": "#9B59B6",
    "parent-videos": "#4D96FF",
    "parent-review": "#FEC163",
    "parent-results": "#6BCB77",
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-[#FF6B6B20] bg-white/90 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo + Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentView("parent-dashboard")}
            className="flex items-center gap-2.5 hover:opacity-90 transition-all group"
          >
            <div className="icon-bubble icon-bubble-coral size-10 rounded-xl animate-wiggle">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-lg hidden sm:inline rainbow-text">
              KinderAssess
            </span>
          </button>

          {/* Breadcrumb for current step */}
          {currentView !== "parent-dashboard" && stepLabels[currentView] && (
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <ChevronRight className="size-4 text-muted-foreground/50" />
              <button
                onClick={() => setCurrentView("parent-dashboard")}
                className="text-muted-foreground hover:text-[#FF6B6B] transition-colors font-medium"
              >
                Dashboard
              </button>
              <ChevronRight className="size-4 text-muted-foreground/50" />
              <div className="flex items-center gap-1.5">
                <div
                  className="number-pop text-white text-xs"
                  style={{
                    background: stepColors[currentView] || "#FF6B6B",
                    width: "1.5rem",
                    height: "1.5rem",
                    fontSize: "0.7rem",
                  }}
                >
                  {Object.keys(stepLabels).indexOf(currentView) + 1}
                </div>
                <span
                  className="font-bold"
                  style={{ color: stepColors[currentView] || "#FF6B6B" }}
                >
                  {stepLabels[currentView]}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-xl hover:bg-[#FF6B6B10] transition-all"
              >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 number-pop bg-[#FF6B6B] text-white text-[10px] font-bold" style={{ width: "1.25rem", height: "1.25rem", fontSize: "0.625rem" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 rounded-2xl border-2 border-[#FF6B6B20] shadow-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b-2 border-[#FF6B6B10] bg-gradient-to-r from-[#FF6B6B08] to-[#9B59B608]">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Bell className="size-4 text-[#FF6B6B]" />
                  Notifications
                </h4>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[#FF6B6B] hover:text-[#FF8E53] font-semibold transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    <div className="icon-bubble icon-bubble-yellow size-12 mx-auto mb-3 rounded-xl">
                      <Bell className="size-5" />
                    </div>
                    <p className="font-medium">No notifications yet</p>
                    <p className="text-xs mt-1 text-muted-foreground/70">We&apos;ll let you know when there&apos;s an update!</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 p-3 border-b last:border-0 transition-colors hover:bg-[#FF6B6B05] ${
                        !notif.read ? "bg-[#FF6B6B08]" : ""
                      }`}
                    >
                      {getNotifIcon(notif.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-tight ${
                              !notif.read ? "font-semibold" : ""
                            }`}
                          >
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="shrink-0 p-0.5 rounded-lg hover:bg-[#FF6B6B10] transition-colors"
                            >
                              <X className="size-3 text-muted-foreground" />
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

          {/* User info */}
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] shadow-md" style={{ boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.15), 0 2px 6px rgba(255,107,107,0.25)" }}>
              <span className="text-xs font-extrabold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "P"}
              </span>
            </div>
            <span className="text-sm font-bold text-foreground max-w-[120px] truncate">
              {user?.name || "Parent"}
            </span>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground hover:text-[#FF6B6B] hover:bg-[#FF6B6B10] transition-all"
            onClick={() => {
              logout();
              setCurrentView("landing");
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
