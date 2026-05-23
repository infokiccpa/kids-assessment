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
  { label: string; color: string; borderColor: string; iconBg: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: "Draft",
    color: "bg-gray-100 text-gray-700 border-gray-300",
    borderColor: "border-l-gray-400",
    iconBg: "icon-bubble icon-bubble-blue",
    icon: <FileText className="size-3.5" />,
  },
  QUESTIONNAIRE: {
    label: "Questionnaire",
    color: "bg-amber-50 text-amber-700 border-amber-300",
    borderColor: "border-l-amber-400",
    iconBg: "icon-bubble icon-bubble-yellow",
    icon: <ClipboardList className="size-3.5" />,
  },
  VIDEOS: {
    label: "Videos",
    color: "bg-orange-50 text-orange-700 border-orange-300",
    borderColor: "border-l-orange-400",
    iconBg: "icon-bubble icon-bubble-coral",
    icon: <Video className="size-3.5" />,
  },
  SUBMITTED: {
    label: "Submitted",
    color: "bg-teal-50 text-teal-700 border-teal-300",
    borderColor: "border-l-teal-400",
    iconBg: "icon-bubble icon-bubble-green",
    icon: <CheckCircle2 className="size-3.5" />,
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "bg-purple-50 text-purple-700 border-purple-300",
    borderColor: "border-l-purple-400",
    iconBg: "icon-bubble icon-bubble-purple",
    icon: <Eye className="size-3.5" />,
  },
  ACCEPTED: {
    label: "Accepted",
    color: "bg-green-50 text-green-700 border-green-300",
    borderColor: "border-l-green-500",
    iconBg: "icon-bubble icon-bubble-green",
    icon: <CheckCircle2 className="size-3.5" />,
  },
  HOLD: {
    label: "On Hold",
    color: "bg-yellow-50 text-yellow-700 border-yellow-300",
    borderColor: "border-l-yellow-400",
    iconBg: "icon-bubble icon-bubble-yellow",
    icon: <FileText className="size-3.5" />,
  },
  REASSESS: {
    label: "Reassessment",
    color: "bg-orange-50 text-orange-700 border-orange-300",
    borderColor: "border-l-orange-400",
    iconBg: "icon-bubble icon-bubble-coral",
    icon: <ClipboardList className="size-3.5" />,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-50 text-red-700 border-red-300",
    borderColor: "border-l-red-400",
    iconBg: "icon-bubble icon-bubble-coral",
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
        <div className="flex flex-col items-center gap-4">
          <div className="icon-bubble icon-bubble-coral size-16 rounded-2xl animate-bounce">
            <Loader2 className="size-8 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full card-3d border-2 border-red-200 bg-playful-card-coral">
          <CardContent className="p-8 text-center">
            <div className="icon-bubble icon-bubble-coral size-14 mx-auto mb-4 rounded-2xl">
              <FileText className="size-6" />
            </div>
            <p className="text-destructive font-bold text-lg">{error}</p>
            <Button
              className="mt-6 btn-3d bg-[#FF6B6B] hover:bg-[#FF5252] text-white"
              onClick={() => window.location.reload()}
            >
              Try Again
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
        <div className="animate-bounce-in">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2">
            <span>Welcome</span>
            <span className="inline-block animate-wiggle">👋</span>
            <span className="rainbow-text">{user?.name || "Parent"}</span>
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Manage your children&apos;s kindergarten readiness assessments ✨
          </p>
        </div>
        <Button
          onClick={handleNewApplication}
          className="btn-3d bg-[#FF6B6B] hover:bg-[#FF5252] text-white gap-2 rounded-xl px-6 py-3 text-sm"
        >
          <Plus className="size-4" />
          New Application
        </Button>
      </div>

      <div className="divider-rainbow mb-8" />

      {/* Applications List */}
      {students.length === 0 ? (
        <Card className="card-3d border-2 border-dashed border-[#FF6B6B30] bg-playful-card-coral">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="icon-bubble icon-bubble-coral size-20 mx-auto mb-5 rounded-2xl">
              <Baby className="size-9" />
            </div>
            <h3 className="text-xl font-extrabold text-foreground mb-2">
              No Applications Yet 🎒
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto font-medium">
              Start a new kindergarten readiness assessment for your child by
              clicking the button below.
            </p>
            <Button
              onClick={handleNewApplication}
              className="btn-3d bg-[#FF6B6B] hover:bg-[#FF5252] text-white gap-2 rounded-xl px-6 py-3"
            >
              <Plus className="size-4" />
              Create First Application
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {students.map((student, index) => {
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
                className={`card-3d border-l-4 ${config.borderColor} animate-bounce-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Child Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`${config.iconBg} size-8 rounded-lg shrink-0`}>
                          {config.icon}
                        </div>
                        <h3 className="text-lg font-extrabold truncate">
                          {student.childName}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`${config.color} badge-3d gap-1 shrink-0`}
                        >
                          {config.icon}
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground ml-11">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-lg">
                          {student.applicationId}
                        </span>
                        <span className="font-medium">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </span>
                        {student.readinessScore !== null && (
                          <span className="font-bold text-[#FF6B6B]">
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
                          className="gap-1.5 rounded-xl border-2 border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
                          onClick={() => handleViewResults(student)}
                        >
                          <Eye className="size-3.5" />
                          View Results
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="btn-3d bg-[#FF6B6B] hover:bg-[#FF5252] text-white gap-1.5 rounded-xl font-semibold"
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
