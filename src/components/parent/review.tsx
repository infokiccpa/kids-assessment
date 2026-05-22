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
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student && !error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <AlertCircle className="size-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">No Student Selected</h2>
        <p className="text-muted-foreground mb-4">
          Please go back to the dashboard and select an application.
        </p>
        <Button onClick={() => setCurrentView("parent-dashboard")}>
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
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Review & Submit
        </h1>
        <p className="text-muted-foreground mt-1">
          Review all information before submitting for AI analysis
        </p>
      </div>

      {/* Student Application Summary */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-5 text-primary" />
            Application Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="text-muted-foreground">Application ID</div>
            <div className="font-mono font-medium">
              {student?.applicationId}
            </div>
            <div className="text-muted-foreground">Child Name</div>
            <div className="font-medium">{student?.childName}</div>
            <div className="text-muted-foreground">Date of Birth</div>
            <div className="font-medium">{student?.dateOfBirth}</div>
            <div className="text-muted-foreground">Gender</div>
            <div className="font-medium">{student?.gender}</div>
            <div className="text-muted-foreground">School</div>
            <div className="font-medium">{student?.schoolApplied}</div>
            <div className="text-muted-foreground">Grade</div>
            <div className="font-medium">{student?.gradeApplied}</div>
          </div>
        </CardContent>
      </Card>

      {/* Questionnaire Summary */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="size-5 text-amber-600" />
            Questionnaire Responses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Section A */}
          <div>
            <h4 className="text-sm font-semibold text-amber-700 mb-2">
              Section A - Attention
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Sit for 5 minutes?
                </span>
                <Badge variant="outline" className="text-xs">
                  {formatOptionLabel(sectionA.q1 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Respond when called?
                </span>
                <Badge variant="outline" className="text-xs">
                  {formatOptionLabel(sectionA.q2 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Follow instructions?
                </span>
                <Badge variant="outline" className="text-xs">
                  {formatOptionLabel(sectionA.q3 || "N/A")}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section B */}
          <div>
            <h4 className="text-sm font-semibold text-rose-600 mb-2">
              Section B - Emotional
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Cry during separation?
                </span>
                <Badge variant="outline" className="text-xs">
                  {formatOptionLabel(sectionB.q1 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Comfortable in new places?
                </span>
                <Badge variant="outline" className="text-xs">
                  {formatOptionLabel(sectionB.q2 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Disturbed by loud sounds?
                </span>
                <Badge variant="outline" className="text-xs">
                  {formatOptionLabel(sectionB.q3 || "N/A")}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section C */}
          <div>
            <h4 className="text-sm font-semibold text-emerald-600 mb-2">
              Section C - Social
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Interact with other children?
                </span>
                <Badge variant="outline" className="text-xs">
                  {formatOptionLabel(sectionC.q1 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Share toys with others?
                </span>
                <Badge variant="outline" className="text-xs">
                  {formatOptionLabel(sectionC.q2 || "N/A")}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Introduce themselves?
                </span>
                <Badge variant="outline" className="text-xs">
                  {formatOptionLabel(sectionC.q3 || "N/A")}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Upload Status */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Video className="size-5 text-primary" />
            Video Upload Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {["TASK1", "TASK2", "TASK3", "TASK4"].map((taskType) => {
              const video = videoMap[taskType];
              const isUploaded = !!video;
              return (
                <div
                  key={taskType}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    {isUploaded ? (
                      <CheckCircle2 className="size-4 text-green-600" />
                    ) : (
                      <AlertCircle className="size-4 text-amber-500" />
                    )}
                    <span>{TASK_LABELS[taskType]}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      isUploaded
                        ? "bg-green-100 text-green-700 border-green-300"
                        : "bg-amber-100 text-amber-700 border-amber-300"
                    }
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
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Analyzing State */}
      {analyzing && (
        <Card className="mb-4 border-primary/30 bg-primary/5">
          <CardContent className="p-6 text-center">
            <Loader2 className="size-10 animate-spin text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">
              AI Analysis in Progress
            </h3>
            <p className="text-muted-foreground text-sm">
              Our AI is analyzing the questionnaire responses and video
              recordings. This may take a moment...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentView("parent-videos")}
          className="gap-1.5"
          disabled={analyzing}
        >
          <ChevronLeft className="size-4" />
          Back to Videos
        </Button>

        <Button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="gap-1.5"
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
