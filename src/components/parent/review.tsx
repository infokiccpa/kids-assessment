"use client";

import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  FileCheck,
  Scan,
  Mic,
  BarChart3,
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
    duration: number;
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

const TASK_ICONS: Record<string, React.ReactNode> = {
  TASK1: <Scan className="size-4" />,
  TASK2: <Brain className="size-4" />,
  TASK3: <Heart className="size-4" />,
  TASK4: <Mic className="size-4" />,
};

// ============================================================
// Step-by-step animated analysis screen
// ============================================================
function AnalysisAnimation({
  videos,
  childName,
}: {
  videos: StudentData["videos"];
  childName: string;
}) {
  // Build steps: one per video, then speech, then behavioral, then report
  const videoSteps = videos.map((v) => ({
    key: v.taskType,
    label: `Aapke bachche ka "${TASK_LABELS[v.taskType]}" video analyze kiya ja raha hai`,
    subLabel: v.fileName,
    icon: TASK_ICONS[v.taskType] || <Scan className="size-4" />,
    color: TASK_VIDEO_COLORS[v.taskType] || "#4D96FF",
  }));

  const extraSteps = [
    {
      key: "speech",
      label: "Baat-cheet aur bhaasha ka vishleshan ho raha hai",
      subLabel: "Speech clarity, vocabulary, confidence...",
      icon: <Mic className="size-4" />,
      color: "#9B59B6",
    },
    {
      key: "behavioral",
      label: "Sampoorna vyavaharik report taiyar ki ja rahi hai",
      subLabel: "Readiness score, behavioral assessment...",
      icon: <BarChart3 className="size-4" />,
      color: "#FEC163",
    },
    {
      key: "report",
      label: "Antim report tayar ho rahi hai!",
      subLabel: `${childName} ki poori assessment complete ho rahi hai`,
      icon: <FileCheck className="size-4" />,
      color: "#6BCB77",
    },
  ];

  const allSteps = [...videoSteps, ...extraSteps];

  // Durations (ms) per step — generous to match real AI time
  const stepDurations = [
    ...videos.map(() => 28000),   // ~28s per video
    14000,                         // speech
    12000,                         // behavioral
    8000,                          // report
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [dotCount, setDotCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((d) => (d + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Step progression
  useEffect(() => {
    if (currentStep >= allSteps.length) return;
    const duration = stepDurations[currentStep] ?? 15000;
    timerRef.current = setTimeout(() => {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep((s) => s + 1);
    }, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const dots = ".".repeat(dotCount);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="relative inline-block mb-5">
          <div className="size-24 rounded-full bg-gradient-to-br from-[#FF6B6B] via-[#FEC163] to-[#6BCB77] flex items-center justify-center shadow-2xl animate-pulse">
            <Brain className="size-12 text-white" />
          </div>
          {/* Orbiting dot */}
          <div
            className="absolute size-4 rounded-full bg-[#4D96FF] shadow-lg"
            style={{
              top: "50%",
              left: "50%",
              animation: "orbit 2s linear infinite",
              transformOrigin: "0 0",
            }}
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black rainbow-text mb-2">
          AI Analysis Chal Raha Hai
        </h1>
        <p className="text-muted-foreground font-medium text-sm">
          Kripaya pratiksha karein — yeh kuch minute le sakta hai
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-8">
        {allSteps.map((step, idx) => {
          const isCompleted = completedSteps.has(idx);
          const isActive = currentStep === idx;
          const isPending = idx > currentStep;

          return (
            <div
              key={step.key}
              className={`relative flex items-center gap-4 rounded-2xl px-4 py-3.5 border-2 transition-all duration-500 ${
                isCompleted
                  ? "border-[#6BCB77]/40 bg-[#6BCB77]/10 opacity-80"
                  : isActive
                  ? "border-opacity-60 shadow-lg scale-[1.02]"
                  : "border-transparent bg-muted/30 opacity-40"
              }`}
              style={
                isActive
                  ? { borderColor: step.color + "60", background: step.color + "12" }
                  : {}
              }
            >
              {/* Icon bubble */}
              <div
                className={`size-10 rounded-xl flex items-center justify-center shrink-0 shadow-md text-white transition-all duration-300 ${
                  isActive ? "animate-bounce" : ""
                }`}
                style={{
                  background: isCompleted
                    ? "#6BCB77"
                    : isPending
                    ? "#CBD5E1"
                    : step.color,
                }}
              >
                {isCompleted ? <CheckCircle2 className="size-5" /> : step.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold truncate ${
                    isCompleted ? "text-[#27AE60]" : isActive ? "" : "text-muted-foreground"
                  }`}
                >
                  {isActive
                    ? `${step.label}${dots}`
                    : isCompleted
                    ? `✓ ${step.label}`
                    : step.label}
                </p>
                {(isActive || isCompleted) && step.subLabel && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {step.subLabel}
                  </p>
                )}
              </div>

              {/* Status indicator */}
              <div className="shrink-0">
                {isCompleted ? (
                  <Badge className="badge-3d bg-[#6BCB77]/20 text-[#27AE60] border-[#6BCB77]/30 text-xs">
                    Done
                  </Badge>
                ) : isActive ? (
                  <Loader2
                    className="size-5 animate-spin"
                    style={{ color: step.color }}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          <span>Progress</span>
          <span>
            {Math.round(
              (Math.min(currentStep, allSteps.length) / allSteps.length) * 100
            )}
            %
          </span>
        </div>
        <div className="h-3 bg-muted/40 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${(Math.min(currentStep, allSteps.length) / allSteps.length) * 100}%`,
              background:
                "linear-gradient(90deg, #FF6B6B, #FEC163, #6BCB77, #4D96FF, #9B59B6)",
              backgroundSize: "200% 100%",
              animation: "rainbowShift 2s linear infinite",
            }}
          />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 p-4 rounded-2xl bg-[#FEC163]/10 border border-[#FEC163]/20 text-center">
        <p className="text-xs text-muted-foreground font-medium">
          ⏳ Is prakriya mein 2–4 minute lag sakte hain. Kripaya page band na karein.
        </p>
      </div>

      <style>{`
        @keyframes orbit {
          0%   { transform: translate(48px, -12px) rotate(0deg) translateX(0); }
          100% { transform: translate(48px, -12px) rotate(360deg) translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================
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
        signal: AbortSignal.timeout(5 * 60 * 1000), // 5-minute client timeout
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
      setAnalyzing(false);
      setIsLoading(false);
    }
  };

  // ---- Loading state ----
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

  // ---- No student ----
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

  // ---- ANALYZING state — show beautiful animation ----
  if (analyzing && student) {
    return (
      <AnalysisAnimation
        videos={student.videos}
        childName={student.childName}
      />
    );
  }

  // ---- Parse questionnaire sections ----
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

  const videoMap: Record<
    string,
    { fileName: string; fileSize: number; duration: number }
  > = {};
  for (const v of student?.videos || []) {
    videoMap[v.taskType] = {
      fileName: v.fileName,
      fileSize: v.fileSize,
      duration: v.duration,
    };
  }

  const formatOptionLabel = (opt: string): string => {
    return opt
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${(bytes / 1024).toFixed(0)} KB`;

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return null;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 animate-bounce-in">
        <h1 className="text-2xl sm:text-3xl font-bold rainbow-text">
          Review &amp; Submit
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
                <span className="text-muted-foreground">Sit for 5 minutes?</span>
                <Badge className="badge-3d bg-[#FEC163]/20 text-[#D4A017] border-[#FEC163]/30 text-xs">
                  {formatOptionLabel(sectionA.q1 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between items-center bg-white/50 rounded-xl px-3 py-2">
                <span className="text-muted-foreground">Respond when called?</span>
                <Badge className="badge-3d bg-[#FEC163]/20 text-[#D4A017] border-[#FEC163]/30 text-xs">
                  {formatOptionLabel(sectionA.q2 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between items-center bg-white/50 rounded-xl px-3 py-2">
                <span className="text-muted-foreground">Follow instructions?</span>
                <Badge className="badge-3d bg-[#FEC163]/20 text-[#D4A017] border-[#FEC163]/30 text-xs">
                  {formatOptionLabel(sectionA.q3 || "N/A")}
                </Badge>
              </div>
            </div>
          </div>

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
                <span className="text-muted-foreground">Cry during separation?</span>
                <Badge className="badge-3d bg-[#FF6B9D]/20 text-[#C44569] border-[#FF6B9D]/30 text-xs">
                  {formatOptionLabel(sectionB.q1 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between items-center bg-white/50 rounded-xl px-3 py-2">
                <span className="text-muted-foreground">Comfortable in new places?</span>
                <Badge className="badge-3d bg-[#FF6B9D]/20 text-[#C44569] border-[#FF6B9D]/30 text-xs">
                  {formatOptionLabel(sectionB.q2 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between items-center bg-white/50 rounded-xl px-3 py-2">
                <span className="text-muted-foreground">Disturbed by loud sounds?</span>
                <Badge className="badge-3d bg-[#FF6B9D]/20 text-[#C44569] border-[#FF6B9D]/30 text-xs">
                  {formatOptionLabel(sectionB.q3 || "N/A")}
                </Badge>
              </div>
            </div>
          </div>

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
                <span className="text-muted-foreground">Interact with other children?</span>
                <Badge className="badge-3d bg-[#6BCB77]/20 text-[#27AE60] border-[#6BCB77]/30 text-xs">
                  {formatOptionLabel(sectionC.q1 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between items-center bg-white/50 rounded-xl px-3 py-2">
                <span className="text-muted-foreground">Share toys with others?</span>
                <Badge className="badge-3d bg-[#6BCB77]/20 text-[#27AE60] border-[#6BCB77]/30 text-xs">
                  {formatOptionLabel(sectionC.q2 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between items-center bg-white/50 rounded-xl px-3 py-2">
                <span className="text-muted-foreground">Introduce themselves?</span>
                <Badge className="badge-3d bg-[#6BCB77]/20 text-[#27AE60] border-[#6BCB77]/30 text-xs">
                  {formatOptionLabel(sectionC.q3 || "N/A")}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Upload Status — with duration + size */}
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
              const dur = video?.duration ? formatDuration(video.duration) : null;
              return (
                <div
                  key={taskType}
                  className="flex items-center justify-between text-sm bg-white/50 rounded-xl px-3 py-2.5 gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isUploaded ? (
                      <span className="icon-bubble icon-bubble-green size-7 p-1.5 shrink-0">
                        <CheckCircle2 className="size-3.5" />
                      </span>
                    ) : (
                      <span className="icon-bubble icon-bubble-yellow size-7 p-1.5 shrink-0">
                        <AlertCircle className="size-3.5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <span className="font-medium block" style={{ color }}>
                        {TASK_LABELS[taskType]}
                      </span>
                      {isUploaded && (
                        <span className="text-xs text-muted-foreground truncate block">
                          {video.fileName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isUploaded ? (
                      <>
                        {dur && (
                          <Badge className="badge-3d bg-[#4D96FF]/15 text-[#2980B9] border-[#4D96FF]/30 text-xs">
                            ⏱ {dur}
                          </Badge>
                        )}
                        <Badge className="badge-3d bg-[#6BCB77]/20 text-[#27AE60] border-[#6BCB77]/30 text-xs">
                          {formatSize(video.fileSize)}
                        </Badge>
                      </>
                    ) : (
                      <Badge className="badge-3d bg-[#FEC163]/20 text-[#D4A017] border-[#FEC163]/30 text-xs">
                        Missing
                      </Badge>
                    )}
                  </div>
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
