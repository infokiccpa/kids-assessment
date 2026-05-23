"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Bell,
  Users,
  Eye,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Menu,
  LogOut,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";

interface StudentRow {
  id: string;
  applicationId: string;
  childName: string;
  schoolApplied: string;
  status: string;
  readinessScore: number | null;
  riskFlags: string;
  createdAt: string;
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string }
> = {
  DRAFT: { label: "Draft", variant: "secondary", color: "bg-gray-100 text-gray-700 border-gray-300" },
  QUESTIONNAIRE: { label: "Questionnaire", variant: "outline", color: "bg-amber-50 text-amber-700 border-amber-300" },
  VIDEOS: { label: "Videos", variant: "outline", color: "bg-orange-50 text-orange-700 border-orange-300" },
  SUBMITTED: { label: "Submitted", variant: "secondary", color: "bg-teal-50 text-teal-700 border-teal-300" },
  UNDER_REVIEW: { label: "Under Review", variant: "outline", color: "bg-purple-50 text-purple-700 border-purple-300" },
  ACCEPTED: { label: "Accepted", variant: "default", color: "bg-green-50 text-green-700 border-green-300" },
  HOLD: { label: "On Hold", variant: "secondary", color: "bg-yellow-50 text-yellow-700 border-yellow-300" },
  REASSESS: { label: "Reassessment", variant: "outline", color: "bg-orange-50 text-orange-700 border-orange-300" },
  REJECTED: { label: "Rejected", variant: "destructive", color: "bg-red-50 text-red-700 border-red-300" },
};

type FilterType = "all" | "ready" | "needs-observation" | "pending-review";

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, setCurrentView, setSelectedStudentId, logout } = useAppStore();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/students?role=ADMIN");
        if (!res.ok) throw new Error("Failed to load applications");
        const data = await res.json();
        setStudents(data.students || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load applications"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

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

  const markAsRead = async (notifId: string) => {
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
  };

  const getRiskFlags = (riskFlagsStr: string): string[] => {
    try {
      return JSON.parse(riskFlagsStr || "[]");
    } catch {
      return [];
    }
  };

  const totalApplications = students.length;
  const underReview = students.filter((s) => s.status === "UNDER_REVIEW").length;
  const accepted = students.filter((s) => s.status === "ACCEPTED").length;
  const needsAttention = students.filter(
    (s) =>
      (s.readinessScore !== null && s.readinessScore < 60) ||
      getRiskFlags(s.riskFlags).length > 0
  ).length;

  const filteredStudents = students.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !s.childName.toLowerCase().includes(q) &&
        !s.applicationId.toLowerCase().includes(q) &&
        !s.schoolApplied.toLowerCase().includes(q)
      ) {
        return false;
      }
    }

    switch (activeFilter) {
      case "ready":
        return s.readinessScore !== null && s.readinessScore >= 80;
      case "needs-observation":
        return (
          s.readinessScore !== null &&
          s.readinessScore >= 60 &&
          s.readinessScore < 80
        );
      case "pending-review":
        return s.status === "UNDER_REVIEW";
      default:
        return true;
    }
  });

  const recentStudents = filteredStudents.slice(0, 10);

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 80) return "text-green-600 font-semibold";
    if (score >= 60) return "text-amber-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const handleViewStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentView("admin-student-detail");
  };

  const sidebarItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      view: "admin-dashboard" as const,
      active: true,
    },
    {
      icon: FileText,
      label: "Applications",
      view: "admin-students" as const,
      active: false,
    },
    {
      icon: Settings,
      label: "Settings",
      view: "admin-settings" as const,
      active: false,
    },
  ];

  const SidebarContent = () => (
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
        {sidebarItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className={`w-full justify-start gap-3 h-11 rounded-2xl px-4 transition-all duration-200 ${
              item.active
                ? "bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white shadow-lg shadow-[#FF6B6B]/25 hover:from-[#FF6B6B] hover:to-[#FF8E53] font-bold"
                : "text-purple-700/70 hover:bg-purple-100/60 hover:text-purple-900 font-medium"
            }`}
            onClick={() => {
              setCurrentView(item.view);
              setSidebarOpen(false);
            }}
          >
            <item.icon className={`h-5 w-5 ${item.active ? "text-white" : ""}`} />
            {item.label}
          </Button>
        ))}
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
          onClick={() => {
            logout();
            setCurrentView("landing");
          }}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-playful-warm">
        <div className="flex flex-col items-center gap-3">
          <div className="icon-bubble icon-bubble-coral h-16 w-16 animate-sparkle">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <p className="text-muted-foreground font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-playful-warm">
        <Card className="max-w-md w-full card-3d">
          <CardContent className="p-6 text-center">
            <div className="icon-bubble icon-bubble-coral h-14 w-14 mx-auto mb-4">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <p className="text-destructive font-medium">{error}</p>
            <Button
              className="mt-4 btn-3d bg-[#FF6B6B] hover:bg-[#ff5252] text-white"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-playful-warm">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r border-purple-100/50">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-purple-100/40 bg-white/80 backdrop-blur-md px-4 sm:px-6">
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

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              🎨 Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Review and manage kindergarten readiness applications
            </p>
            <div className="divider-rainbow mt-3 max-w-xs" />
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="card-3d bg-playful-card-coral">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Total Applications
                </CardTitle>
                <div className="icon-bubble icon-bubble-coral h-9 w-9">
                  <Users className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-[#FF6B6B]">{totalApplications}</div>
              </CardContent>
            </Card>
            <Card className="card-3d bg-playful-card-purple">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Under Review
                </CardTitle>
                <div className="icon-bubble icon-bubble-purple h-9 w-9">
                  <Clock className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-purple-600">
                  {underReview}
                </div>
              </CardContent>
            </Card>
            <Card className="card-3d bg-playful-card-green">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Accepted
                </CardTitle>
                <div className="icon-bubble icon-bubble-green h-9 w-9">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-green-600">
                  {accepted}
                </div>
              </CardContent>
            </Card>
            <Card className="card-3d bg-playful-card-yellow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Needs Attention
                </CardTitle>
                <div className="icon-bubble icon-bubble-yellow h-9 w-9">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-amber-600">
                  {needsAttention}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Readiness Score Distribution */}
          {students.some((s) => s.readinessScore !== null) && (
            <Card className="mb-6 card-3d">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  📊 Readiness Score Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {(() => {
                    const scored = students.filter((s) => s.readinessScore !== null);
                    const ready = scored.filter((s) => s.readinessScore! >= 80).length;
                    const observation = scored.filter((s) => s.readinessScore! >= 60 && s.readinessScore! < 80).length;
                    const support = scored.filter((s) => s.readinessScore! < 60).length;
                    const total = scored.length || 1;
                    return [
                      { label: "Ready", count: ready, color: "bg-green-500", textColor: "text-green-700", bgColor: "bg-gradient-to-br from-green-50 to-emerald-100", pct: Math.round((ready / total) * 100) },
                      { label: "Needs Observation", count: observation, color: "bg-amber-500", textColor: "text-amber-700", bgColor: "bg-gradient-to-br from-amber-50 to-yellow-100", pct: Math.round((observation / total) * 100) },
                      { label: "Needs Support", count: support, color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-gradient-to-br from-red-50 to-rose-100", pct: Math.round((support / total) * 100) },
                    ].map((item) => (
                      <div key={item.label} className={`rounded-2xl ${item.bgColor} p-4 text-center shadow-sm`}>
                        <div className={`text-3xl font-extrabold ${item.textColor}`}>{item.count}</div>
                        <div className="text-xs font-semibold text-muted-foreground mt-1">{item.label}</div>
                        <div className="mt-2 h-2 bg-white/60 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full ${item.color} rounded-full transition-all duration-500 shadow-sm`} style={{ width: `${item.pct}%` }} />
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 font-semibold">{item.pct}%</div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex gap-2 flex-wrap">
              <button
                className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  activeFilter === "all"
                    ? "btn-3d bg-[#FF6B6B] text-white"
                    : "bg-white border-2 border-purple-100 text-purple-600 hover:border-[#FF6B6B]/40 hover:text-[#FF6B6B] shadow-sm"
                }`}
                onClick={() => setActiveFilter("all")}
              >
                🌈 All
              </button>
              <button
                className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  activeFilter === "ready"
                    ? "btn-3d-green bg-green-500 text-white"
                    : "bg-white border-2 border-green-100 text-green-600 hover:border-green-300 hover:text-green-700 shadow-sm"
                }`}
                onClick={() => setActiveFilter("ready")}
              >
                ✅ Ready
              </button>
              <button
                className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  activeFilter === "needs-observation"
                    ? "btn-3d bg-amber-500 text-white"
                    : "bg-white border-2 border-amber-100 text-amber-600 hover:border-amber-300 hover:text-amber-700 shadow-sm"
                }`}
                onClick={() => setActiveFilter("needs-observation")}
              >
                👀 Needs Observation
              </button>
              <button
                className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  activeFilter === "pending-review"
                    ? "btn-3d-purple bg-purple-500 text-white"
                    : "bg-white border-2 border-purple-100 text-purple-600 hover:border-purple-300 hover:text-purple-700 shadow-sm"
                }`}
                onClick={() => setActiveFilter("pending-review")}
              >
                ⏳ Pending Review
              </button>
            </div>
            <div className="relative sm:ml-auto sm:max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#FF6B6B]/60" />
              <input
                type="text"
                placeholder="Search by name, ID, or school..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-playful w-full h-10 px-4 pl-10 text-sm"
              />
            </div>
          </div>

          {/* Recent Applications Table */}
          <Card className="card-3d overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                📋 Recent Applications
                <span className="ml-1 text-sm font-normal text-muted-foreground badge-3d bg-purple-100 text-purple-700">
                  {filteredStudents.length} total
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentStudents.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <div className="icon-bubble icon-bubble-purple h-16 w-16 mx-auto mb-4 opacity-50">
                    <Users className="h-8 w-8" />
                  </div>
                  <p className="font-bold text-lg">No applications found</p>
                  <p className="text-sm mt-1">
                    Try adjusting your filters or search query
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 border-purple-100/50 hover:bg-transparent">
                        <TableHead className="w-[120px] font-bold text-purple-700/70">Application ID</TableHead>
                        <TableHead className="font-bold text-purple-700/70">Child Name</TableHead>
                        <TableHead className="hidden sm:table-cell font-bold text-purple-700/70">School Applied</TableHead>
                        <TableHead className="text-center font-bold text-purple-700/70">Readiness Score</TableHead>
                        <TableHead className="text-center font-bold text-purple-700/70">Status</TableHead>
                        <TableHead className="hidden md:table-cell font-bold text-purple-700/70">Date</TableHead>
                        <TableHead className="text-right font-bold text-purple-700/70">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentStudents.map((student) => {
                        const config = statusConfig[student.status] || statusConfig.DRAFT;
                        return (
                          <TableRow key={student.id} className="border-b border-purple-50 hover:bg-purple-50/30 transition-colors">
                            <TableCell className="font-mono text-xs font-semibold">
                              {student.applicationId}
                            </TableCell>
                            <TableCell className="font-semibold text-foreground">
                              {student.childName}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">
                              {student.schoolApplied || "N/A"}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`text-sm font-bold ${getScoreColor(student.readinessScore)}`}>
                                {student.readinessScore !== null
                                  ? Math.round(student.readinessScore)
                                  : "--"}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={`badge-3d text-xs ${config.color}`}
                              >
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                              {new Date(student.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                className="gap-1.5 rounded-xl bg-[#FF6B6B]/10 text-[#FF6B6B] hover:bg-[#FF6B6B] hover:text-white font-bold border-0 shadow-sm transition-all duration-200"
                                size="sm"
                                onClick={() => handleViewStudent(student.id)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
