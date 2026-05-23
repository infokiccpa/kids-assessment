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
  Users,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import AdminLayout from "@/components/admin/admin-layout";

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
  const { setCurrentView, setSelectedStudentId } = useAppStore();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  if (loading) {
    return (
      <AdminLayout activeView="admin-dashboard">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="icon-bubble icon-bubble-coral h-16 w-16 animate-sparkle">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <p className="text-muted-foreground font-medium">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout activeView="admin-dashboard">
        <div className="flex items-center justify-center py-20">
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
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeView="admin-dashboard">
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
          <Eye className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#FF6B6B]/60" />
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
    </AdminLayout>
  );
}
