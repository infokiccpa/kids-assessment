"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  AlertCircle,
  Download,
  LayoutDashboard,
  Brain,
  Heart,
  Users,
  BookOpen,
  ShieldAlert,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface AnalysisData {
  readinessScore: number;
  attentionLevel: string;
  instructionFollowing: string;
  emotionalBehavior: string;
  socialReadiness: string;
  classroomAdaptability: string;
  teacherRecommendation: string;
  riskFlags: string;
  analysisStatus: string;
}

interface StudentResult {
  id: string;
  applicationId: string;
  childName: string;
  status: string;
  aiAnalysis: AnalysisData | null;
}

function getScoreInterpretation(score: number): {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
} {
  if (score >= 80) {
    return {
      label: "Ready",
      color: "#16a34a",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
    };
  }
  if (score >= 60) {
    return {
      label: "Moderate",
      color: "#d97706",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
    };
  }
  if (score >= 40) {
    return {
      label: "Needs Support",
      color: "#ea580c",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
    };
  }
  return {
    label: "Requires Attention",
    color: "#dc2626",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
  };
}

function getLevelBadge(level: string): {
  className: string;
  icon: React.ReactNode;
} {
  const lower = level.toLowerCase();
  if (lower.includes("good")) {
    return {
      className: "bg-green-100 text-green-700 border-green-300",
      icon: <CheckCircle2 className="size-3.5" />,
    };
  }
  if (lower.includes("moderate")) {
    return {
      className: "bg-amber-100 text-amber-700 border-amber-300",
      icon: <AlertCircle className="size-3.5" />,
    };
  }
  return {
    className: "bg-red-100 text-red-700 border-red-300",
    icon: <AlertTriangle className="size-3.5" />,
  };
}

// Circular gauge component using SVG
function ScoreGauge({ score }: { score: number }) {
  const interpretation = getScoreInterpretation(score);
  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const center = radius;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={center}
            cy={center}
          />
          {/* Progress arc */}
          <circle
            stroke={interpretation.color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: "stroke-dashoffset 1s ease-in-out" }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={center}
            cy={center}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color: interpretation.color }}>
            {Math.round(score)}
          </span>
          <span className="text-xs text-muted-foreground">out of 100</span>
        </div>
      </div>
      <Badge
        className={`${interpretation.bgColor} ${interpretation.textColor} border text-sm px-3 py-1`}
      >
        {interpretation.label}
      </Badge>
    </div>
  );
}

export default function Results() {
  const { currentStudentId, setCurrentView } = useAppStore();
  const [student, setStudent] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!currentStudentId) {
      setLoading(false);
      return;
    }
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/students/${currentStudentId}`);
        if (!res.ok) throw new Error("Failed to load results");
        const data = await res.json();
        setStudent(data.student);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load results");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [currentStudentId]);

  const handleDownloadReport = async () => {
    if (!currentStudentId) return;
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/reports?studentId=${currentStudentId}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate report");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KRA_Report_${student?.applicationId || "report"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to download report"
      );
    } finally {
      setDownloading(false);
    }
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
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <AlertCircle className="size-12 mx-auto text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">Error Loading Results</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => setCurrentView("parent-dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  if (!student?.aiAnalysis || student.aiAnalysis.analysisStatus !== "COMPLETED") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <Loader2 className="size-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">
          Analysis Not Yet Available
        </h2>
        <p className="text-muted-foreground mb-4">
          The AI analysis is still being processed. Please check back in a few
          moments.
        </p>
        <Button onClick={() => setCurrentView("parent-dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const analysis = student.aiAnalysis;
  const score = analysis.readinessScore;

  let riskFlags: string[] = [];
  try {
    riskFlags = JSON.parse(analysis.riskFlags || "[]");
  } catch {
    riskFlags = [];
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Assessment Results
        </h1>
        <p className="text-muted-foreground mt-1">
          AI-powered readiness analysis for {student.childName}
        </p>
      </div>

      {/* Score Gauge */}
      <Card className="mb-4">
        <CardContent className="p-6 flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-4">Readiness Score</h2>
          <ScoreGauge score={score} />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Application ID: {student.applicationId}
          </p>
        </CardContent>
      </Card>

      {/* Behavioral Assessment */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="size-5 text-primary" />
            Behavioral Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Attention Level */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Brain className="size-4 text-amber-600" />
              <span>Attention Level</span>
            </div>
            <Badge
              variant="outline"
              className={getLevelBadge(analysis.attentionLevel).className}
            >
              {getLevelBadge(analysis.attentionLevel).icon}
              {analysis.attentionLevel}
            </Badge>
          </div>

          <Separator />

          {/* Instruction Following */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="size-4 text-blue-600" />
              <span>Instruction Following</span>
            </div>
            <Badge
              variant="outline"
              className={
                getLevelBadge(analysis.instructionFollowing).className
              }
            >
              {getLevelBadge(analysis.instructionFollowing).icon}
              {analysis.instructionFollowing}
            </Badge>
          </div>

          <Separator />

          {/* Emotional Behavior */}
          <div>
            <div className="flex items-center gap-2 text-sm mb-2">
              <Heart className="size-4 text-rose-500" />
              <span className="font-medium">Emotional Behavior</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              {analysis.emotionalBehavior}
            </p>
          </div>

          <Separator />

          {/* Social Readiness */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="size-4 text-emerald-600" />
              <span>Social Readiness</span>
            </div>
            <Badge
              variant="outline"
              className={getLevelBadge(analysis.socialReadiness).className}
            >
              {getLevelBadge(analysis.socialReadiness).icon}
              {analysis.socialReadiness}
            </Badge>
          </div>

          <Separator />

          {/* Classroom Adaptability */}
          <div>
            <div className="flex items-center gap-2 text-sm mb-2">
              <GraduationCap className="size-4 text-purple-600" />
              <span className="font-medium">Classroom Adaptability</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              {analysis.classroomAdaptability}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Recommendations */}
      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="size-5 text-primary" />
            Teacher Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">
            {analysis.teacherRecommendation}
          </p>
        </CardContent>
      </Card>

      {/* Risk Flags */}
      {riskFlags.length > 0 && (
        <Card className="mb-4 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-700">
              <ShieldAlert className="size-5 text-amber-600" />
              Areas of Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskFlags.map((flag, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-100"
                >
                  <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-amber-800">{flag}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button
          variant="outline"
          onClick={handleDownloadReport}
          disabled={downloading}
          className="gap-1.5 flex-1"
        >
          {downloading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="size-4" />
              Download Report
            </>
          )}
        </Button>
        <Button
          variant="default"
          onClick={() => setCurrentView("parent-dashboard")}
          className="gap-1.5 flex-1"
        >
          <LayoutDashboard className="size-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Disclaimer Footer */}
      <div className="mt-8 p-4 rounded-lg bg-muted/50 border text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <FileText className="size-4" />
          <span>
            This is an AI-assisted educational readiness observation and not a
            medical diagnosis.
          </span>
        </div>
      </div>
    </div>
  );
}
