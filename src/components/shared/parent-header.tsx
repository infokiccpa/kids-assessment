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
        return <FileText className="size-4 text-primary shrink-0" />;
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo + Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentView("parent-dashboard")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm hidden sm:inline">KinderAssess</span>
          </button>

          {/* Breadcrumb for current step */}
          {currentView !== "parent-dashboard" && stepLabels[currentView] && (
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
              <ChevronRight className="size-3.5" />
              <button
                onClick={() => setCurrentView("parent-dashboard")}
                className="hover:text-foreground transition-colors"
              >
                Dashboard
              </button>
              <ChevronRight className="size-3.5" />
              <span className="text-foreground font-medium">
                {stepLabels[currentView]}
              </span>
            </div>
          )}
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between p-3 border-b">
                <h4 className="font-semibold text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <Bell className="size-8 mx-auto mb-2 opacity-30" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 p-3 border-b last:border-0 transition-colors hover:bg-muted/50 ${
                        !notif.read ? "bg-primary/5" : ""
                      }`}
                    >
                      {getNotifIcon(notif.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-tight ${
                              !notif.read ? "font-medium" : ""
                            }`}
                          >
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
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
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {user?.name?.charAt(0)?.toUpperCase() || "P"}
              </span>
            </div>
            <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
              {user?.name || "Parent"}
            </span>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
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
