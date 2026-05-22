"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Loader2,
  Download,
  CheckCircle2,
  Pause,
  RotateCcw,
  XCircle,
  AlertTriangle,
  User,
  Phone,
  Mail,
  MapPin,
  School,
  Calendar,
  FileText,
  Video,
  Brain,
  MessageSquare,
  Shield,
  Clock,
} from "lucide-react";

interface StudentData {
  id: string;
  applicationId: string;
  childName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  languagesSpoken: string;
  previousSchool: string;
  specialMedicalNotes: string;
  fatherName: string;
  motherName: string;
  mobileNumber: string;
  parentEmail: string;
  address: string;
  schoolApplied: string;
  gradeApplied: string;
  status: string;
  currentStep: number;
  createdAt: string;
  questionnaire: {
    sectionA: string;
    sectionB: string;
    sectionC: string;
    completedAt: string | null;
  } | null;
  videos: {
    id: string;
    taskType: string;
    filePath: string;
    fileName: string;
    fileSize: number;
    duration: number;
    uploadedAt: string;
  }[];
  aiAnalysis: {
    sittingScore: number;
    attentionScore: number;
    hyperactivityScore: number;
    emotionalScore: number;
    instructionScore: number;
    speechClarity: number;
    vocabularyLevel: number;
    responseConfidence: number;
    responseDelay: number;
    readinessScore: number;
    attentionLevel: string;
    instructionFollowing: string;
    emotionalBehavior: string;
    socialReadiness: string;
    classroomAdaptability: string;
    teacherRecommendation: string;
    riskFlags: string;
    analysisStatus: string;
  } | null;
  adminNotes: {
    id: string;
    note: string;
    action: string;
    createdAt: string;
    admin: {
      id: string;
      name: string;
      email: string;
    };
  }[];
}

const sectionAQuestions: Record<string, string> = {
  q1: "Can the child sit still for 5+ minutes?",
  q2: "Does the child maintain focus on tasks?",
  q3: "Can the child follow simple instructions?",
  q4: "Does the child complete activities without distraction?",
  q5: "Does the child show sustained interest in activities?",
};

const sectionBQuestions: Record<string, string> = {
  q1: "Does the child become easily frustrated?",
  q2: "Can the child calm down after being upset?",
  q3: "Does the child show aggressive behavior?",
  q4: "Does the child separate from parents without distress?",
  q5: "Does the child express emotions appropriately?",
};

const sectionCQuestions: Record<string, string> = {
  q1: "Does the child interact with other children?",
  q2: "Can the child share toys with others?",
  q3: "Does the child communicate needs clearly?",
  q4: "Does the child show empathy toward others?",
  q5: "Can the child take turns in group activities?",
};

const taskLabels: Record<string, string> = {
  TASK1: "Sitting Tolerance Task",
  TASK2: "Attention & Focus Task",
  TASK3: "Instruction Following Task",
  TASK4: "Emotional Response Task",
};

function calculateAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    now.getMonth() -
    birth.getMonth();
  return `${Math.floor(months / 12)}y ${months % 12}m`;
}

function getAnswerColor(answer: string): string {
  const lower = answer.toLowerCase();
  if (lower === "yes") return "bg-green-100 text-green-700 border-green-300";
  if (lower === "sometimes")
    return "bg-amber-100 text-amber-700 border-amber-300";
  if (lower === "no") return "bg-red-100 text-red-700 border-red-300";
  return "bg-gray-100 text-gray-700 border-gray-300";
}

function getScoreBadgeColor(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-700";
  if (score >= 60) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function getReadinessColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function getProgressColor(score: number): string {
  if (score >= 7) return "[&>div]:bg-green-500";
  if (score >= 4) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-red-500";
}

function getBehavioralBadge(level: string): string {
  const lower = level.toLowerCase();
  if (lower.includes("good") || lower.includes("high"))
    return "bg-green-100 text-green-700 border-green-300";
  if (lower.includes("moderate"))
    return "bg-amber-100 text-amber-700 border-amber-300";
  return "bg-red-100 text-red-700 border-red-300";
}

export default function StudentDetail() {
  const { selectedStudentId, user, setCurrentView } = useAppStore();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string>("");
  const [actionNote, setActionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!selectedStudentId) return;
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/students/${selectedStudentId}`);
        if (!res.ok) throw new Error("Failed to load student details");
        const data = await res.json();
        setStudent(data.student);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load student details"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [selectedStudentId]);

  const parseSection = (sectionStr: string): Record<string, string> => {
    try {
      return JSON.parse(sectionStr || "{}");
    } catch {
      return {};
    }
  };

  const getRiskFlags = (riskFlagsStr: string): string[] => {
    try {
      return JSON.parse(riskFlagsStr || "[]");
    } catch {
      return [];
    }
  };

  const handleAction = async () => {
    if (!student || !user || !actionType) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          adminId: user.id,
          action: actionType,
          note: actionNote,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process action");
      }
      // Refresh student data
      const refreshRes = await fetch(`/api/students/${student.id}`);
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setStudent(data.student);
      }
      setActionDialogOpen(false);
      setActionNote("");
      setActionType("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process action"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!student) return;
    try {
      setDownloading(true);
      const res = await fetch(`/api/reports?studentId=${student.id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate report");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KRA_Report_${student.applicationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to download report"
      );
    } finally {
      setDownloading(false);
    }
  };

  const openActionDialog = (action: string) => {
    setActionType(action);
    setActionNote("");
    setActionDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-medium">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setCurrentView("admin-dashboard")}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Student not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setCurrentView("admin-dashboard")}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sectionA = parseSection(student.questionnaire?.sectionA || "{}");
  const sectionB = parseSection(student.questionnaire?.sectionB || "{}");
  const sectionC = parseSection(student.questionnaire?.sectionC || "{}");
  const analysis = student.aiAnalysis;
  const riskFlags = analysis ? getRiskFlags(analysis.riskFlags) : [];

  const actionButtons = [
    {
      action: "ACCEPT",
      label: "Accept",
      icon: CheckCircle2,
      variant: "default" as const,
      className:
        "bg-green-600 hover:bg-green-700 text-white",
    },
    {
      action: "HOLD",
      label: "Hold",
      icon: Pause,
      variant: "outline" as const,
      className: "border-amber-500 text-amber-700 hover:bg-amber-50",
    },
    {
      action: "REASSESS",
      label: "Reassess",
      icon: RotateCcw,
      variant: "outline" as const,
      className: "border-purple-500 text-purple-700 hover:bg-purple-50",
    },
    {
      action: "REJECT",
      label: "Reject",
      icon: XCircle,
      variant: "outline" as const,
      className: "border-red-500 text-red-700 hover:bg-red-50",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => setCurrentView("admin-dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Dashboard</span>
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {student.applicationId}
          </Badge>
          <Badge
            variant="outline"
            className={
              student.status === "ACCEPTED"
                ? "bg-green-50 text-green-700 border-green-300"
                : student.status === "REJECTED"
                  ? "bg-red-50 text-red-700 border-red-300"
                  : student.status === "UNDER_REVIEW"
                    ? "bg-purple-50 text-purple-700 border-purple-300"
                    : student.status === "HOLD"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                      : "bg-gray-50 text-gray-700 border-gray-300"
            }
          >
            {student.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 1. Student Profile Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Student Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Child Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Child Information
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name</span>
                    <p className="font-medium">{student.childName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date of Birth</span>
                    <p className="font-medium">
                      {new Date(student.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Age</span>
                    <p className="font-medium">
                      {calculateAge(student.dateOfBirth)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gender</span>
                    <p className="font-medium">{student.gender}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nationality</span>
                    <p className="font-medium">
                      {student.nationality || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Languages</span>
                    <p className="font-medium">
                      {student.languagesSpoken || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parent Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Parent Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Father:</span>
                    <span className="font-medium">{student.fatherName || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Mother:</span>
                    <span className="font-medium">{student.motherName || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">
                      {student.mobileNumber || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">
                      {student.parentEmail || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-medium">
                      {student.address || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* School & Application Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <School className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-muted-foreground block">School</span>
                  <p className="font-medium">
                    {student.schoolApplied || "N/A"}
                  </p>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground block">Grade</span>
                <p className="font-medium">{student.gradeApplied || "N/A"}</p>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-muted-foreground block">
                    Application ID
                  </span>
                  <p className="font-medium font-mono text-xs">
                    {student.applicationId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-muted-foreground block">Applied</span>
                  <p className="font-medium">
                    {new Date(student.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Questionnaire Summary */}
        {student.questionnaire && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Questionnaire Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="sectionA">
                <TabsList className="mb-4">
                  <TabsTrigger value="sectionA">
                    Section A - Attention
                  </TabsTrigger>
                  <TabsTrigger value="sectionB">
                    Section B - Emotional
                  </TabsTrigger>
                  <TabsTrigger value="sectionC">
                    Section C - Social
                  </TabsTrigger>
                </TabsList>

                {[
                  {
                    key: "sectionA",
                    title: "Attention",
                    questions: sectionAQuestions,
                    answers: sectionA,
                  },
                  {
                    key: "sectionB",
                    title: "Emotional",
                    questions: sectionBQuestions,
                    answers: sectionB,
                  },
                  {
                    key: "sectionC",
                    title: "Social",
                    questions: sectionCQuestions,
                    answers: sectionC,
                  },
                ].map((section) => (
                  <TabsContent key={section.key} value={section.key}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(section.questions).map(([qKey, question]) => {
                        const answer = section.answers[qKey] || "N/A";
                        return (
                          <div
                            key={qKey}
                            className="flex items-center justify-between p-3 rounded-lg border"
                          >
                            <span className="text-sm mr-3">{question}</span>
                            <Badge
                              variant="outline"
                              className={`shrink-0 ${getAnswerColor(answer)}`}
                            >
                              {answer}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* 3. Video Submissions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Video Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(["TASK1", "TASK2", "TASK3", "TASK4"] as const).map((taskType) => {
                const video = student.videos.find(
                  (v) => v.taskType === taskType
                );
                return (
                  <Card key={taskType} className="border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">
                          {taskLabels[taskType]}
                        </h4>
                        <Badge
                          variant="outline"
                          className={
                            video
                              ? "bg-green-50 text-green-700 border-green-300"
                              : "bg-gray-50 text-gray-500 border-gray-300"
                          }
                        >
                          {video ? "Uploaded" : "Not uploaded"}
                        </Badge>
                      </div>
                      {video ? (
                        <>
                          <video
                            src={video.filePath}
                            controls
                            className="w-full rounded-md bg-black mb-2"
                            style={{ maxHeight: "160px" }}
                          >
                            Your browser does not support the video element.
                          </video>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Duration: {video.duration.toFixed(1)}s</span>
                            <span>
                              {new Date(video.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                          <Video className="h-8 w-8 mb-2 opacity-40" />
                          <p className="text-xs">Not uploaded</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 4. AI Analysis Results */}
        {analysis && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Analysis Results
                <Badge
                  variant="outline"
                  className={
                    analysis.analysisStatus === "COMPLETED"
                      ? "bg-green-50 text-green-700 border-green-300"
                      : analysis.analysisStatus === "PROCESSING"
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-red-50 text-red-700 border-red-300"
                  }
                >
                  {analysis.analysisStatus}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Readiness Score */}
              <div className="flex flex-col items-center py-4">
                <span className="text-sm text-muted-foreground mb-1">
                  Overall Readiness Score
                </span>
                <span
                  className={`text-5xl font-bold ${getReadinessColor(analysis.readinessScore)}`}
                >
                  {Math.round(analysis.readinessScore)}
                </span>
                <span className="text-sm text-muted-foreground">out of 100</span>
                <Badge
                  className={`mt-2 ${getScoreBadgeColor(analysis.readinessScore)}`}
                >
                  {analysis.readinessScore >= 80
                    ? "Ready"
                    : analysis.readinessScore >= 60
                      ? "Needs Observation"
                      : "Needs Support"}
                </Badge>
              </div>

              <Separator />

              {/* Video Analysis Scores */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  Video Analysis Scores
                </h4>
                <div className="space-y-3">
                  {[
                    { label: "Sitting Ability", score: analysis.sittingScore },
                    { label: "Attention", score: analysis.attentionScore },
                    {
                      label: "Hyperactivity (Inverse)",
                      score: analysis.hyperactivityScore,
                    },
                    {
                      label: "Emotional Regulation",
                      score: analysis.emotionalScore,
                    },
                    {
                      label: "Instruction Following",
                      score: analysis.instructionScore,
                    },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{item.label}</span>
                        <span className="font-medium">
                          {item.score.toFixed(1)}/10
                        </span>
                      </div>
                      <Progress
                        value={item.score * 10}
                        className={`h-2 ${getProgressColor(item.score)}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Speech Analysis Scores */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Speech Analysis Scores
                </h4>
                <div className="space-y-3">
                  {[
                    {
                      label: "Speech Clarity",
                      score: analysis.speechClarity,
                    },
                    {
                      label: "Vocabulary Level",
                      score: analysis.vocabularyLevel,
                    },
                    {
                      label: "Response Confidence",
                      score: analysis.responseConfidence,
                    },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{item.label}</span>
                        <span className="font-medium">
                          {item.score.toFixed(1)}/10
                        </span>
                      </div>
                      <Progress
                        value={item.score * 10}
                        className={`h-2 ${getProgressColor(item.score)}`}
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm">
                    <span>Response Delay</span>
                    <span className="font-medium">
                      {analysis.responseDelay.toFixed(1)}s
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Behavioral Assessment */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Behavioral Assessment
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm">Attention Level</span>
                    <Badge
                      variant="outline"
                      className={getBehavioralBadge(analysis.attentionLevel)}
                    >
                      {analysis.attentionLevel || "N/A"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm">Instruction Following</span>
                    <Badge
                      variant="outline"
                      className={getBehavioralBadge(
                        analysis.instructionFollowing
                      )}
                    >
                      {analysis.instructionFollowing || "N/A"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm">Social Readiness</span>
                    <Badge
                      variant="outline"
                      className={getBehavioralBadge(analysis.socialReadiness)}
                    >
                      {analysis.socialReadiness || "N/A"}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <span className="text-sm text-muted-foreground block mb-1">
                      Emotional Behavior
                    </span>
                    <p className="text-sm font-medium">
                      {analysis.emotionalBehavior || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-lg border">
                  <span className="text-sm text-muted-foreground block mb-1">
                    Classroom Adaptability
                  </span>
                  <p className="text-sm font-medium">
                    {analysis.classroomAdaptability || "N/A"}
                  </p>
                </div>

                {/* Teacher Recommendation */}
                <Card className="mt-3 border-primary/30 bg-primary/5">
                  <CardContent className="p-4">
                    <h5 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                      <School className="h-4 w-4" />
                      Teacher Recommendation
                    </h5>
                    <p className="text-sm leading-relaxed">
                      {analysis.teacherRecommendation ||
                        "No specific recommendations."}
                    </p>
                  </CardContent>
                </Card>

                {/* Risk Flags */}
                {riskFlags.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {riskFlags.map((flag, idx) => (
                      <Alert key={idx} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Risk Flag</AlertTitle>
                        <AlertDescription>{flag}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 5. Admin Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {actionButtons.map((btn) => (
                <Button
                  key={btn.action}
                  variant={btn.variant}
                  className={`gap-2 ${btn.className}`}
                  onClick={() => openActionDialog(btn.action)}
                  disabled={
                    submitting ||
                    (student.status === "ACCEPTED" &&
                      btn.action === "ACCEPT")
                  }
                >
                  <btn.icon className="h-4 w-4" />
                  {btn.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 6. Admin Notes History */}
        {student.adminNotes.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Admin Notes History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {student.adminNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex gap-3 p-3 rounded-lg border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={
                            note.action === "ACCEPT"
                              ? "bg-green-50 text-green-700 border-green-300"
                              : note.action === "REJECT"
                                ? "bg-red-50 text-red-700 border-red-300"
                                : note.action === "HOLD"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                                  : "bg-purple-50 text-purple-700 border-purple-300"
                          }
                        >
                          {note.action}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          by {note.admin.name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {note.note && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {note.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 7. Download Report */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleDownloadReport}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Report
          </Button>
        </div>

        {/* Spacer at bottom */}
        <div className="h-4" />
      </main>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "ACCEPT" && "Accept Application"}
              {actionType === "HOLD" && "Place on Hold"}
              {actionType === "REASSESS" && "Request Reassessment"}
              {actionType === "REJECT" && "Reject Application"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "ACCEPT" &&
                "Accept this application. The parent will be notified."}
              {actionType === "HOLD" &&
                "Place this application on hold. The parent will be notified."}
              {actionType === "REASSESS" &&
                "Request a new assessment. The parent will be notified."}
              {actionType === "REJECT" &&
                "Reject this application. The parent will be notified."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium mb-2 block">
              Note (optional)
            </label>
            <Textarea
              placeholder="Add a note about this decision..."
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={submitting}
              className={
                actionType === "ACCEPT"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : actionType === "REJECT"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : undefined
              }
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm {actionType.charAt(0) + actionType.slice(1).toLowerCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
