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
      color: "#6BCB77",
      bgColor: "bg-[#6BCB77]/15",
      textColor: "text-[#27AE60]",
    };
  }
  if (score >= 60) {
    return {
      label: "Moderate",
      color: "#FEC163",
      bgColor: "bg-[#FEC163]/15",
      textColor: "text-[#D4A017]",
    };
  }
  if (score >= 40) {
    return {
      label: "Needs Support",
      color: "#FF8E53",
      bgColor: "bg-[#FF8E53]/15",
      textColor: "text-[#E67E22]",
    };
  }
  return {
    label: "Requires Attention",
    color: "#FF6B6B",
    bgColor: "bg-[#FF6B6B]/15",
    textColor: "text-[#E74C3C]",
  };
}

function getLevelBadge(level: string): {
  className: string;
  icon: React.ReactNode;
} {
  const lower = level.toLowerCase();
  if (lower.includes("good")) {
    return {
      className: "badge-3d bg-[#6BCB77]/20 text-[#27AE60] border-[#6BCB77]/30",
      icon: <CheckCircle2 className="size-3.5" />,
    };
  }
  if (lower.includes("moderate")) {
    return {
      className: "badge-3d bg-[#FEC163]/20 text-[#D4A017] border-[#FEC163]/30",
      icon: <AlertCircle className="size-3.5" />,
    };
  }
  return {
    className: "badge-3d bg-[#FF6B6B]/20 text-[#E74C3C] border-[#FF6B6B]/30",
    icon: <AlertTriangle className="size-3.5" />,
  };
}

// Circular gauge component using SVG with vibrant gradient stroke and 3D shadow
function ScoreGauge({ score }: { score: number }) {
  const interpretation = getScoreInterpretation(score);
  const radius = 80;
  const strokeWidth = 14;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const center = radius;

  const gradientId = "scoreGradient";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative drop-shadow-lg">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B6B" />
              <stop offset="25%" stopColor="#FEC163" />
              <stop offset="50%" stopColor="#6BCB77" />
              <stop offset="75%" stopColor="#4D96FF" />
              <stop offset="100%" stopColor="#9B59B6" />
            </linearGradient>
            <filter id="gaugeShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
            </filter>
          </defs>
          {/* Background circle */}
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={center}
            cy={center}
            strokeLinecap="round"
          />
          {/* Progress arc with gradient */}
          <circle
            stroke={`url(#${gradientId})`}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: "stroke-dashoffset 1s ease-in-out" }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={center}
            cy={center}
            filter="url(#gaugeShadow)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-black"
            style={{ color: interpretation.color }}
          >
            {Math.round(score)}
          </span>
          <span className="text-xs text-muted-foreground font-semibold">out of 100</span>
        </div>
      </div>
      <Badge
        className={`badge-3d ${interpretation.bgColor} ${interpretation.textColor} border text-sm px-4 py-1.5 font-bold`}
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
        <div className="text-center">
          <Loader2 className="size-10 animate-spin text-[#FF6B6B] mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <div className="icon-bubble icon-bubble-coral size-16 mx-auto mb-4 p-4">
          <AlertCircle className="size-8" />
        </div>
        <h2 className="text-lg font-bold mb-2">Error Loading Results</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button
          onClick={() => setCurrentView("parent-dashboard")}
          className="btn-3d bg-[#FF6B6B] hover:bg-[#FF5252] text-white border-none rounded-xl font-semibold"
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  if (!student?.aiAnalysis || student.aiAnalysis.analysisStatus !== "COMPLETED") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <div className="animate-sparkle inline-block mb-4">
          <Loader2 className="size-12 animate-spin text-[#FF6B6B] mx-auto" />
        </div>
        <h2 className="text-lg font-bold mb-2">
          Analysis Not Yet Available
        </h2>
        <p className="text-muted-foreground mb-4">
          The AI analysis is still being processed. Please check back in a few
          moments.
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
      <div className="mb-6 animate-bounce-in">
        <h1 className="text-2xl sm:text-3xl font-bold rainbow-text">
          Assessment Results
        </h1>
        <p className="text-muted-foreground mt-1">
          AI-powered readiness analysis for {student.childName}
        </p>
      </div>

      {/* Score Gauge - Vibrant celebratory feel */}
      <Card className="mb-5 card-3d bg-playful-card-coral">
        <CardContent className="p-8 flex flex-col items-center">
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2.5">
            <span className="icon-bubble icon-bubble-coral size-9 p-2">
              <GraduationCap className="size-5" />
            </span>
            Readiness Score
          </h2>
          <ScoreGauge score={score} />
          <div className="divider-rainbow mt-5 w-48" />
          <p className="text-sm text-muted-foreground mt-3 text-center font-medium">
            Application ID: {student.applicationId}
          </p>
        </CardContent>
      </Card>

      {/* Behavioral Assessment */}
      <Card className="mb-5 card-3d bg-playful-card-blue">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <span className="icon-bubble icon-bubble-purple size-9 p-2">
              <Brain className="size-5" />
            </span>
            Behavioral Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Attention Level */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm">
              <span className="icon-bubble icon-bubble-yellow size-8 p-1.5">
                <Brain className="size-4" />
              </span>
              <span className="font-medium">Attention Level</span>
            </div>
            <Badge
              className={getLevelBadge(analysis.attentionLevel).className}
            >
              {getLevelBadge(analysis.attentionLevel).icon}
              <span className="ml-1">{analysis.attentionLevel}</span>
            </Badge>
          </div>

          <div className="divider-rainbow" />

          {/* Instruction Following */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm">
              <span className="icon-bubble icon-bubble-blue size-8 p-1.5">
                <BookOpen className="size-4" />
              </span>
              <span className="font-medium">Instruction Following</span>
            </div>
            <Badge
              className={
                getLevelBadge(analysis.instructionFollowing).className
              }
            >
              {getLevelBadge(analysis.instructionFollowing).icon}
              <span className="ml-1">{analysis.instructionFollowing}</span>
            </Badge>
          </div>

          <div className="divider-rainbow" />

          {/* Emotional Behavior */}
          <div>
            <div className="flex items-center gap-2.5 text-sm mb-2">
              <span className="icon-bubble icon-bubble-pink size-8 p-1.5">
                <Heart className="size-4" />
              </span>
              <span className="font-medium">Emotional Behavior</span>
            </div>
            <p className="text-sm text-muted-foreground pl-11 leading-relaxed">
              {analysis.emotionalBehavior}
            </p>
          </div>

          <div className="divider-rainbow" />

          {/* Social Readiness */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm">
              <span className="icon-bubble icon-bubble-green size-8 p-1.5">
                <Users className="size-4" />
              </span>
              <span className="font-medium">Social Readiness</span>
            </div>
            <Badge
              className={getLevelBadge(analysis.socialReadiness).className}
            >
              {getLevelBadge(analysis.socialReadiness).icon}
              <span className="ml-1">{analysis.socialReadiness}</span>
            </Badge>
          </div>

          <div className="divider-rainbow" />

          {/* Classroom Adaptability */}
          <div>
            <div className="flex items-center gap-2.5 text-sm mb-2">
              <span className="icon-bubble icon-bubble-purple size-8 p-1.5">
                <GraduationCap className="size-4" />
              </span>
              <span className="font-medium">Classroom Adaptability</span>
            </div>
            <p className="text-sm text-muted-foreground pl-11 leading-relaxed">
              {analysis.classroomAdaptability}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Recommendations - Playful green gradient */}
      <Card className="mb-5 card-3d bg-playful-card-green border-2 border-[#6BCB77]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <span className="icon-bubble icon-bubble-green size-9 p-2">
              <GraduationCap className="size-5" />
            </span>
            Teacher Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed pl-1">
            {analysis.teacherRecommendation}
          </p>
        </CardContent>
      </Card>

      {/* Risk Flags - Amber 3D styling */}
      {riskFlags.length > 0 && (
        <Card className="mb-5 card-3d border-2 border-[#FF8E53]/40 bg-playful-card-yellow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-base text-[#E67E22]">
              <span className="icon-bubble icon-bubble-yellow size-9 p-2">
                <ShieldAlert className="size-5" />
              </span>
              Areas of Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {riskFlags.map((flag, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FF8E53]/10 border border-[#FF8E53]/20 shadow-sm"
                >
                  <span className="icon-bubble icon-bubble-yellow size-6 p-1 shrink-0 mt-0.5">
                    <AlertTriangle className="size-3" />
                  </span>
                  <span className="text-sm text-[#C0392B] font-medium">{flag}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Button
          variant="outline"
          onClick={handleDownloadReport}
          disabled={downloading}
          className="gap-1.5 flex-1 btn-3d bg-white border-[#4D96FF]/30 text-[#2980B9] hover:bg-[#4D96FF]/10 rounded-xl font-semibold"
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
          className="gap-1.5 flex-1 btn-3d-purple bg-[#9B59B6] hover:bg-[#8E44AD] text-white border-none rounded-xl font-semibold"
        >
          <LayoutDashboard className="size-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Disclaimer Footer - Subtle playful styling */}
      <div className="mt-8 p-5 rounded-2xl bg-playful-card-yellow/50 border-2 border-[#FEC163]/20 text-center">
        <div className="flex items-center justify-center gap-2.5 text-sm text-muted-foreground">
          <span className="icon-bubble icon-bubble-yellow size-7 p-1.5">
            <FileText className="size-3.5" />
          </span>
          <span className="font-medium">
            This is an AI-assisted educational readiness observation and not a
            medical diagnosis.
          </span>
        </div>
      </div>
    </div>
  );
}
