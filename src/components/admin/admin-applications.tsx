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
  FileText,
  Eye,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Filter,
  Download,
  ArrowUpDown,
  Baby,
  GraduationCap,
} from "lucide-react";

interface StudentRow {
  id: string;
  applicationId: string;
  childName: string;
  schoolApplied: string;
  gradeApplied: string;
  status: string;
  readinessScore: number | null;
  riskFlags: string;
  createdAt: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; emoji: string }
> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700 border-gray-300", emoji: "📝" },
  QUESTIONNAIRE: { label: "Questionnaire", color: "bg-amber-50 text-amber-700 border-amber-300", emoji: "📋" },
  VIDEOS: { label: "Videos", color: "bg-orange-50 text-orange-700 border-orange-300", emoji: "🎥" },
  SUBMITTED: { label: "Submitted", color: "bg-teal-50 text-teal-700 border-teal-300", emoji: "📤" },
  UNDER_REVIEW: { label: "Under Review", color: "bg-purple-50 text-purple-700 border-purple-300", emoji: "🔍" },
  ACCEPTED: { label: "Accepted", color: "bg-green-50 text-green-700 border-green-300", emoji: "✅" },
  HOLD: { label: "On Hold", color: "bg-yellow-50 text-yellow-700 border-yellow-300", emoji: "⏸️" },
  REASSESS: { label: "Reassessment", color: "bg-orange-50 text-orange-700 border-orange-300", emoji: "🔄" },
  REJECTED: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-300", emoji: "❌" },
};

type FilterType = "all" | "ready" | "needs-observation" | "pending-review" | "accepted" | "rejected";
type SortField = "childName" | "readinessScore" | "createdAt";
type SortDir = "asc" | "desc";

export default function AdminApplications() {
  const { setCurrentView, setSelectedStudentId } = useAppStore();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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
      case "accepted":
        return s.status === "ACCEPTED";
      case "rejected":
        return s.status === "REJECTED";
      default:
        return true;
    }
  });

  // Sort
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortField) {
      case "childName":
        return dir * a.childName.localeCompare(b.childName);
      case "readinessScore":
        return dir * ((a.readinessScore ?? -1) - (b.readinessScore ?? -1));
      case "createdAt":
        return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      default:
        return 0;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleViewStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentView("admin-student-detail");
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 80) return "text-green-600 font-bold";
    if (score >= 60) return "text-amber-600 font-bold";
    return "text-red-600 font-bold";
  };

  // Stats
  const totalApplications = students.length;
  const pendingCount = students.filter((s) => s.status === "UNDER_REVIEW" || s.status === "SUBMITTED").length;
  const acceptedCount = students.filter((s) => s.status === "ACCEPTED").length;
  const needsAttentionCount = students.filter(
    (s) =>
      (s.readinessScore !== null && s.readinessScore < 60) ||
      getRiskFlags(s.riskFlags).length > 0
  ).length;

  const filterButtons: { key: FilterType; label: string; emoji: string }[] = [
    { key: "all", label: "All", emoji: "🌈" },
    { key: "pending-review", label: "Pending Review", emoji: "⏳" },
    { key: "ready", label: "Ready", emoji: "✅" },
    { key: "needs-observation", label: "Observation", emoji: "👀" },
    { key: "accepted", label: "Accepted", emoji: "🎉" },
    { key: "rejected", label: "Rejected", emoji: "❌" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="icon-bubble icon-bubble-coral h-16 w-16 animate-sparkle">
          <Clock className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
          📋 All Applications
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          View, search, and manage all student applications
        </p>
        <div className="divider-rainbow mt-3 max-w-xs" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="card-3d bg-playful-card-coral">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="icon-bubble icon-bubble-coral h-10 w-10 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#FF6B6B]">{totalApplications}</p>
              <p className="text-xs text-muted-foreground font-medium">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-3d bg-playful-card-purple">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="icon-bubble icon-bubble-purple h-10 w-10 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-purple-600">{pendingCount}</p>
              <p className="text-xs text-muted-foreground font-medium">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-3d bg-playful-card-green">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="icon-bubble icon-bubble-green h-10 w-10 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-green-600">{acceptedCount}</p>
              <p className="text-xs text-muted-foreground font-medium">Accepted</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-3d bg-playful-card-yellow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="icon-bubble icon-bubble-yellow h-10 w-10 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-amber-600">{needsAttentionCount}</p>
              <p className="text-xs text-muted-foreground font-medium">Attention</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {filterButtons.map((fb) => (
            <button
              key={fb.key}
              className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200 ${
                activeFilter === fb.key
                  ? "btn-3d bg-[#FF6B6B] text-white"
                  : "bg-white border-2 border-purple-100 text-purple-600 hover:border-[#FF6B6B]/40 hover:text-[#FF6B6B] shadow-sm"
              }`}
              onClick={() => setActiveFilter(fb.key)}
            >
              {fb.emoji} {fb.label}
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="relative sm:max-w-xs w-full">
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

      {/* Results count */}
      <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Showing <strong className="text-foreground">{sortedStudents.length}</strong> of {students.length} applications</span>
      </div>

      {/* Applications Table */}
      <Card className="card-3d overflow-hidden">
        <CardContent className="p-0">
          {sortedStudents.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
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
                    <TableHead className="font-bold text-purple-700/70">App ID</TableHead>
                    <TableHead
                      className="font-bold text-purple-700/70 cursor-pointer hover:text-[#FF6B6B] transition-colors"
                      onClick={() => handleSort("childName")}
                    >
                      <div className="flex items-center gap-1">
                        Child Name
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell font-bold text-purple-700/70">School</TableHead>
                    <TableHead className="hidden md:table-cell font-bold text-purple-700/70">Grade</TableHead>
                    <TableHead
                      className="text-center font-bold text-purple-700/70 cursor-pointer hover:text-[#FF6B6B] transition-colors"
                      onClick={() => handleSort("readinessScore")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Score
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-center font-bold text-purple-700/70">Status</TableHead>
                    <TableHead
                      className="hidden lg:table-cell font-bold text-purple-700/70 cursor-pointer hover:text-[#FF6B6B] transition-colors"
                      onClick={() => handleSort("createdAt")}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-bold text-purple-700/70">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStudents.map((student) => {
                    const config = statusConfig[student.status] || statusConfig.DRAFT;
                    return (
                      <TableRow key={student.id} className="border-b border-purple-50 hover:bg-purple-50/30 transition-colors">
                        <TableCell className="font-mono text-xs font-semibold">
                          {student.applicationId}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="icon-bubble icon-bubble-pink h-8 w-8 text-xs shrink-0">
                              <Baby className="h-4 w-4" />
                            </div>
                            <span className="font-semibold text-foreground">{student.childName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                          {student.schoolApplied || "N/A"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="badge-3d text-xs bg-blue-50 text-blue-700 border-blue-200">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            {student.gradeApplied || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`text-sm ${getScoreColor(student.readinessScore)}`}>
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
                            {config.emoji} {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
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
    </div>
  );
}
