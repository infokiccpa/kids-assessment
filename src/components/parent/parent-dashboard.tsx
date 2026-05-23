"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Eye,
  FileText,
  ChevronRight,
  Baby,
  ClipboardList,
  Video,
  CheckCircle2,
} from "lucide-react";

interface StudentApp {
  id: string;
  applicationId: string;
  childName: string;
  status: string;
  readinessScore: number | null;
  createdAt: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: "Draft",
    color: "bg-gray-100 text-gray-700 border-gray-300",
    icon: <FileText className="size-3.5" />,
  },
  QUESTIONNAIRE: {
    label: "Questionnaire",
    color: "bg-amber-50 text-amber-700 border-amber-300",
    icon: <ClipboardList className="size-3.5" />,
  },
  VIDEOS: {
    label: "Videos",
    color: "bg-orange-50 text-orange-700 border-orange-300",
    icon: <Video className="size-3.5" />,
  },
  SUBMITTED: {
    label: "Submitted",
    color: "bg-teal-50 text-teal-700 border-teal-300",
    icon: <CheckCircle2 className="size-3.5" />,
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "bg-purple-50 text-purple-700 border-purple-300",
    icon: <Eye className="size-3.5" />,
  },
  ACCEPTED: {
    label: "Accepted",
    color: "bg-green-50 text-green-700 border-green-300",
    icon: <CheckCircle2 className="size-3.5" />,
  },
  HOLD: {
    label: "On Hold",
    color: "bg-yellow-50 text-yellow-700 border-yellow-300",
    icon: <FileText className="size-3.5" />,
  },
  REASSESS: {
    label: "Reassessment",
    color: "bg-orange-50 text-orange-700 border-orange-300",
    icon: <ClipboardList className="size-3.5" />,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-50 text-red-700 border-red-300",
    icon: <FileText className="size-3.5" />,
  },
};

function getStatusStep(status: string): number {
  switch (status) {
    case "DRAFT":
      return 1;
    case "QUESTIONNAIRE":
      return 2;
    case "VIDEOS":
      return 3;
    case "SUBMITTED":
    case "UNDER_REVIEW":
    case "ACCEPTED":
    case "HOLD":
    case "REASSESS":
    case "REJECTED":
      return 4;
    default:
      return 1;
  }
}

function getNextView(
  status: string
):
  | "parent-registration"
  | "parent-questionnaire"
  | "parent-videos"
  | "parent-review"
  | "parent-results" {
  if (status === "UNDER_REVIEW" || status === "ACCEPTED" || status === "HOLD" || status === "REASSESS" || status === "REJECTED") {
    return "parent-results";
  }
  const step = getStatusStep(status);
  switch (step) {
    case 1:
      return "parent-registration";
    case 2:
      return "parent-questionnaire";
    case 3:
      return "parent-videos";
    case 4:
      return "parent-review";
    default:
      return "parent-registration";
  }
}

export default function ParentDashboard() {
  const { user, setCurrentView, setCurrentStudentId } = useAppStore();
  const [students, setStudents] = useState<StudentApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/students?parentId=${user.id}`);
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
  }, [user?.id]);

  const handleNewApplication = () => {
    setCurrentStudentId(null);
    setCurrentView("parent-registration");
  };

  const handleContinueApplication = (student: StudentApp) => {
    setCurrentStudentId(student.id);
    setCurrentView(getNextView(student.status));
  };

  const handleViewResults = (student: StudentApp) => {
    setCurrentStudentId(student.id);
    setCurrentView("parent-results");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
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
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Welcome, {user?.name || "Parent"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your children&apos;s kindergarten readiness assessments
          </p>
        </div>
        <Button onClick={handleNewApplication} className="gap-2">
          <Plus className="size-4" />
          New Application
        </Button>
      </div>

      {/* Applications List */}
      {students.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 sm:p-12 text-center">
            <Baby className="size-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Applications Yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Start a new kindergarten readiness assessment for your child by
              clicking the button below.
            </p>
            <Button onClick={handleNewApplication} className="gap-2">
              <Plus className="size-4" />
              Create First Application
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {students.map((student) => {
            const config = statusConfig[student.status] || statusConfig.DRAFT;
            const isCompleted =
              student.status === "UNDER_REVIEW" ||
              student.status === "ACCEPTED" ||
              student.status === "HOLD" ||
              student.status === "REASSESS" ||
              student.status === "REJECTED";
            const isUnderReview = student.status === "UNDER_REVIEW";

            return (
              <Card
                key={student.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Child Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold truncate">
                          {student.childName}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`${config.color} gap-1 shrink-0`}
                        >
                          {config.icon}
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="font-mono text-xs">
                          {student.applicationId}
                        </span>
                        <span>
                          {new Date(student.createdAt).toLocaleDateString()}
                        </span>
                        {student.readinessScore !== null && (
                          <span className="font-medium text-foreground">
                            Score: {Math.round(student.readinessScore)}/100
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isUnderReview || isCompleted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleViewResults(student)}
                        >
                          <Eye className="size-3.5" />
                          View Results
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleContinueApplication(student)}
                        >
                          Continue
                          <ChevronRight className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
