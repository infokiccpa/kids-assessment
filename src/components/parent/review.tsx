"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Video,
  Brain,
  Sparkles,
  ChevronLeft,
  Heart,
  Users,
} from "lucide-react";

interface StudentData {
  id: string;
  applicationId: string;
  childName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  languagesSpoken: string;
  schoolApplied: string;
  gradeApplied: string;
  fatherName: string;
  motherName: string;
  status: string;
  currentStep: number;
  questionnaire: {
    sectionA: string;
    sectionB: string;
    sectionC: string;
  } | null;
  videos: {
    taskType: string;
    fileName: string;
    fileSize: number;
    uploadedAt: string;
  }[];
  aiAnalysis: {
    analysisStatus: string;
  } | null;
}

const TASK_LABELS: Record<string, string> = {
  TASK1: "Sitting Ability",
  TASK2: "Instruction Following",
  TASK3: "Emotional Response",
  TASK4: "Self Introduction",
};

const TASK_VIDEO_COLORS: Record<string, string> = {
  TASK1: "#FF6B6B",
  TASK2: "#9B59B6",
  TASK3: "#6BCB77",
  TASK4: "#4D96FF",
};

export default function Review() {
  const { currentStudentId, setCurrentView, setIsLoading } = useAppStore();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentStudentId) {
      setLoading(false);
      return;
    }
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/students/${currentStudentId}`);
        if (!res.ok) throw new Error("Failed to load student data");
        const data = await res.json();
        setStudent(data.student);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load student data"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [currentStudentId]);

  const handleAnalyze = async () => {
    if (!currentStudentId) return;

    setAnalyzing(true);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: currentStudentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      setCurrentView("parent-results");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Analysis failed. Please try again."
      );
    } finally {
      setAnalyzing(false);
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="size-10 animate-spin text-[#FF6B6B] mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Loading your review...</p>
        </div>
      </div>
    );
  }

  if (!student && !error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <div className="icon-bubble icon-bubble-coral size-16 mx-auto mb-4 p-4">
          <AlertCircle className="size-8" />
        </div>
        <h2 className="text-lg font-bold mb-2">No Student Selected</h2>
        <p className="text-muted-foreground mb-4">
          Please go back to the dashboard and select an application.
        </p>
        <Button
          onClick={() => setCurrentView("parent-dashboard")}
          className="btn-3d bg-[#FF6B6B] hover:bg-[#FF5252] text-white border-none rounded-xl font-semibold"
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  // Parse questionnaire sections
  const sectionA = student?.questionnaire
    ? typeof student.questionnaire.sectionA === "string"
      ? JSON.parse(student.questionnaire.sectionA)
      : student.questionnaire.sectionA
    : {};
  const sectionB = student?.questionnaire
    ? typeof student.questionnaire.sectionB === "string"
      ? JSON.parse(student.questionnaire.sectionB)
      : student.questionnaire.sectionB
    : {};
  const sectionC = student?.questionnaire
    ? typeof student.questionnaire.sectionC === "string"
      ? JSON.parse(student.questionnaire.sectionC)
      : student.questionnaire.sectionC
    : {};

  const videoMap: Record<string, { fileName: string; fileSize: number }> = {};
  for (const v of student?.videos || []) {
    videoMap[v.taskType] = { fileName: v.fileName, fileSize: v.fileSize };
  }

  const formatOptionLabel = (opt: string): string => {
    return opt
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 animate-bounce-in">
        <h1 className="text-2xl sm:text-3xl font-bold rainbow-text">
          Review & Submit
        </h1>
        <p className="text-muted-foreground mt-1">
          Review all information before submitting for AI analysis
        </p>
      </div>

      {/* Student Application Summary */}
      <Card className="mb-5 card-3d bg-playful-card-coral">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <span className="icon-bubble icon-bubble-coral size-9 p-2">
              <FileText className="size-5" />
            </span>
            Application Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div className="text-muted-foreground">Application ID</div>
            <div className="font-mono font-semibold bg-white/60 rounded-lg px-2 py-0.5 text-center">
              {student?.applicationId}
            </div>
            <div className="text-muted-foreground">Child Name</div>
            <div className="font-semibold">{student?.childName}</div>
            <div className="text-muted-foreground">Date of Birth</div>
            <div className="font-semibold">{student?.dateOfBirth}</div>
            <div className="text-muted-foreground">Gender</div>
            <div className="font-semibold">{student?.gender}</div>
            <div className="text-muted-foreground">School</div>
            <div className="font-semibold">{student?.schoolApplied}</div>
            <div className="text-muted-foreground">Grade</div>
            <div className="font-semibold">{student?.gradeApplied}</div>
          </div>
        </CardContent>
      </Card>

      {/* Questionnaire Summary */}
      <Card className="mb-5 card-3d bg-playful-card-purple">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <span className="icon-bubble icon-bubble-purple size-9 p-2">
              <Brain className="size-5" />
            </span>
            Questionnaire Responses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Section A */}
          <div>
            <h4 className="text-sm font-bold text-[#D4A017] mb-3 flex items-center gap-2">
              <span className="icon-bubble icon-bubble-yellow size-6 p-1">
                <Brain className="size-3.5" />
              </span>
              Section A - Attention
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center bg-white/50 rounded-xl px-3 py-2">
                <span className="text-muted-foreground">
                  Sit for 5 minutes?
                </span>
                <Badge className="badge-3d bg-[#FEC163]/20 text-[#D4A017] border-[#FEC163]/30 text-xs">
                  {formatOptionLabel(sectionA.q1 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between items-center bg-white/50 rounded-xl px-3 py-2">
                <span className="text-muted-foreground">
                  Respond when called?
                </span>
                <Badge className="badge-3d bg-[#FEC163]/20 text-[#D4A017] border-[#FEC163]/30 text-xs">
                  {formatOptionLabel(sectionA.q2 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between items-center bg-white/50 rounded-xl px-3 py-2">
                <span className="text-muted-foreground">
                  Follow instructions?
                </span>
                <Badge className="badge-3d bg-[#FEC163]/20 text-[#D4A017] border-[#FEC163]/30 text-xs">
                  {formatOptionLabel(sectionA.q3 || "N/A")}
                </Badge>
              </div>
            </div>
          </div>

          {/* Rainbow Divider */}
          <div className="divider-rainbow" />

          {/* Section B */}
          <div>
            <h4 className="text-sm font-bold text-[#E74C7A] mb-3 flex items-center gap-2">
              <span className="icon-bubble icon-bubble-pink size-6 p-1">
                <Heart className="size-3.5" />
              </span>
              Section B - Emotional
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center bg-white/50 rounded-xl px-3 py-2">
                <span className="text-muted-foreground">
                  Cry during separation?
                </span>
                <Badge className="badge-3d bg-[#FF6B9D]/20 text-[#C44569] border-[#FF6B9D]/30 text-xs">
                  {formatOptionLabel(sectionB.q1 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between items-center bg-white/50 rounded-xl px-3 py-2">
                <span className="text-muted-foreground">
                  Comfortable in new places?
                </span>
                <Badge className="badge-3d bg-[#FF6B9D]/20 text-[#C44569] border-[#FF6B9D]/30 text-xs">
                  {formatOptionLabel(sectionB.q2 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between items-center bg-white/50 rounded-xl px-3 py-2">
                <span className="text-muted-foreground">
                  Disturbed by loud sounds?
                </span>
                <Badge className="badge-3d bg-[#FF6B9D]/20 text-[#C44569] border-[#FF6B9D]/30 text-xs">
                  {formatOptionLabel(sectionB.q3 || "N/A")}
                </Badge>
              </div>
            </div>
          </div>

          {/* Rainbow Divider */}
          <div className="divider-rainbow" />

          {/* Section C */}
          <div>
            <h4 className="text-sm font-bold text-[#27AE60] mb-3 flex items-center gap-2">
              <span className="icon-bubble icon-bubble-green size-6 p-1">
                <Users className="size-3.5" />
              </span>
              Section C - Social
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center bg-white/50 rounded-xl px-3 py-2">
                <span className="text-muted-foreground">
                  Interact with other children?
                </span>
                <Badge className="badge-3d bg-[#6BCB77]/20 text-[#27AE60] border-[#6BCB77]/30 text-xs">
                  {formatOptionLabel(sectionC.q1 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between items-center bg-white/50 rounded-xl px-3 py-2">
                <span className="text-muted-foreground">
                  Share toys with others?
                </span>
                <Badge className="badge-3d bg-[#6BCB77]/20 text-[#27AE60] border-[#6BCB77]/30 text-xs">
                  {formatOptionLabel(sectionC.q2 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between items-center bg-white/50 rounded-xl px-3 py-2">
                <span className="text-muted-foreground">
                  Introduce themselves?
                </span>
                <Badge className="badge-3d bg-[#6BCB77]/20 text-[#27AE60] border-[#6BCB77]/30 text-xs">
                  {formatOptionLabel(sectionC.q3 || "N/A")}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Upload Status */}
      <Card className="mb-5 card-3d bg-playful-card-blue">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <span className="icon-bubble icon-bubble-blue size-9 p-2">
              <Video className="size-5" />
            </span>
            Video Upload Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {["TASK1", "TASK2", "TASK3", "TASK4"].map((taskType) => {
              const video = videoMap[taskType];
              const isUploaded = !!video;
              const color = TASK_VIDEO_COLORS[taskType];
              return (
                <div
                  key={taskType}
                  className="flex items-center justify-between text-sm bg-white/50 rounded-xl px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    {isUploaded ? (
                      <span
                        className="icon-bubble icon-bubble-green size-7 p-1.5"
                      >
                        <CheckCircle2 className="size-3.5" />
                      </span>
                    ) : (
                      <span
                        className="icon-bubble icon-bubble-yellow size-7 p-1.5"
                      >
                        <AlertCircle className="size-3.5" />
                      </span>
                    )}
                    <span className="font-medium" style={{ color }}>
                      {TASK_LABELS[taskType]}
                    </span>
                  </div>
                  <Badge
                    className={`badge-3d ${
                      isUploaded
                        ? "bg-[#6BCB77]/20 text-[#27AE60] border-[#6BCB77]/30"
                        : "bg-[#FEC163]/20 text-[#D4A017] border-[#FEC163]/30"
                    }`}
                  >
                    {isUploaded
                      ? `${(video.fileSize / 1024 / 1024).toFixed(1)} MB`
                      : "Missing"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-600 flex items-center gap-2 border-2 border-red-200 shadow-md">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Analyzing State - Animated sparkle */}
      {analyzing && (
        <Card className="mb-5 card-3d bg-playful-card-coral border-2 border-[#FF6B6B]/30">
          <CardContent className="p-8 text-center">
            <div className="animate-sparkle inline-block mb-4">
              <Sparkles className="size-12 text-[#FF6B6B]" />
            </div>
            <h3 className="font-bold text-lg mb-2 rainbow-text">
              AI Analysis in Progress
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Our AI is analyzing the questionnaire responses and video
              recordings. This may take a moment...
            </p>
            <div className="divider-rainbow mt-4 mx-auto w-32" />
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setCurrentView("parent-videos")}
          className="gap-1.5 btn-3d bg-white border-[#9B59B6]/30 text-[#8E44AD] hover:bg-[#9B59B6]/10 rounded-xl font-semibold"
          disabled={analyzing}
        >
          <ChevronLeft className="size-4" />
          Back to Videos
        </Button>

        <Button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="gap-1.5 btn-3d bg-[#FF6B6B] hover:bg-[#FF5252] text-white border-none rounded-xl font-semibold"
        >
          {analyzing ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Submit for AI Analysis
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
