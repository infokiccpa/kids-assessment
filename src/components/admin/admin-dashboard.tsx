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

export default function AdminDashboard() {
  const { user, setCurrentView, setSelectedStudentId, logout } = useAppStore();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="font-bold text-sm">KinderAssess</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {sidebarItems.map((item) => (
          <Button
            key={item.label}
            variant={item.active ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 h-10"
            onClick={() => {
              setCurrentView(item.view);
              setSidebarOpen(false);
            }}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </nav>
      <div className="px-2 py-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 text-muted-foreground hover:text-foreground"
          onClick={() => {
            logout();
            setCurrentView("landing");
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-medium">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
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
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {user?.name?.charAt(0)?.toUpperCase() || "A"}
                </span>
              </div>
              <span className="font-medium text-foreground">
                {user?.name || "Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Review and manage kindergarten readiness applications
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Applications
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalApplications}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Under Review
                </CardTitle>
                <Clock className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {underReview}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Accepted
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {accepted}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Needs Attention
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {needsAttention}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("all")}
              >
                All
              </Button>
              <Button
                variant={activeFilter === "ready" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("ready")}
              >
                Ready
              </Button>
              <Button
                variant={
                  activeFilter === "needs-observation" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setActiveFilter("needs-observation")}
              >
                Needs Observation
              </Button>
              <Button
                variant={
                  activeFilter === "pending-review" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setActiveFilter("pending-review")}
              >
                Pending Review
              </Button>
            </div>
            <div className="relative sm:ml-auto sm:max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, ID, or school..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          {/* Recent Applications Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Recent Applications
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredStudents.length} total)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentStudents.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No applications found</p>
                  <p className="text-sm mt-1">
                    Try adjusting your filters or search query
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Application ID</TableHead>
                        <TableHead>Child Name</TableHead>
                        <TableHead className="hidden sm:table-cell">School Applied</TableHead>
                        <TableHead className="text-center">Readiness Score</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="hidden md:table-cell">Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentStudents.map((student) => {
                        const config = statusConfig[student.status] || statusConfig.DRAFT;
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-mono text-xs">
                              {student.applicationId}
                            </TableCell>
                            <TableCell className="font-medium">
                              {student.childName}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">
                              {student.schoolApplied || "N/A"}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={getScoreColor(student.readinessScore)}>
                                {student.readinessScore !== null
                                  ? Math.round(student.readinessScore)
                                  : "--"}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={config.color}
                              >
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                              {new Date(student.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5"
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
