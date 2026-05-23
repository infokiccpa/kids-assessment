"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Upload,
  Video,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Lightbulb,
  CameraOff,
  Clock,
  ChevronLeft,
  Eye,
  FileVideo,
  X,
} from "lucide-react";

interface TaskConfig {
  taskType: string;
  number: number;
  title: string;
  instruction: string;
}

const TASKS: TaskConfig[] = [
  {
    taskType: "TASK1",
    number: 1,
    title: "Sitting Ability",
    instruction:
      "Ask your child to sit and color/draw for 3 minutes.",
  },
  {
    taskType: "TASK2",
    number: 2,
    title: "Instruction Following",
    instruction:
      "Ask your child: 1. Pick a red object 2. Keep it on the table 3. Clap hands twice",
  },
  {
    taskType: "TASK3",
    number: 3,
    title: "Emotional Response",
    instruction: "Parent leaves the room for 30 seconds.",
  },
  {
    taskType: "TASK4",
    number: 4,
    title: "Self Introduction",
    instruction:
      "Ask your child: What is your name? How old are you? Which color do you like?",
  },
];

type UploadStatus = "pending" | "uploading" | "uploaded";

interface TaskState {
  status: UploadStatus;
  progress: number;
  fileName: string;
  previewUrl: string | null;
}

const TASK_COLORS: Record<string, { border: string; numberBg: string; numberText: string; dotColor: string }> = {
  TASK1: { border: "border-l-[#FF6B6B]", numberBg: "number-pop bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] text-white", numberText: "", dotColor: "bg-[#FF6B6B]" },
  TASK2: { border: "border-l-[#9B59B6]", numberBg: "number-pop bg-gradient-to-br from-[#9B59B6] to-[#8E44AD] text-white", numberText: "", dotColor: "bg-[#9B59B6]" },
  TASK3: { border: "border-l-[#6BCB77]", numberBg: "number-pop bg-gradient-to-br from-[#6BCB77] to-[#27AE60] text-white", numberText: "", dotColor: "bg-[#6BCB77]" },
  TASK4: { border: "border-l-[#4D96FF]", numberBg: "number-pop bg-gradient-to-br from-[#4D96FF] to-[#2980B9] text-white", numberText: "", dotColor: "bg-[#4D96FF]" },
};

export default function VideoTasks() {
  const { currentStudentId, setCurrentView } = useAppStore();
  const [taskStates, setTaskStates] = useState<Record<string, TaskState>>({
    TASK1: { status: "pending", progress: 0, fileName: "", previewUrl: null },
    TASK2: { status: "pending", progress: 0, fileName: "", previewUrl: null },
    TASK3: { status: "pending", progress: 0, fileName: "", previewUrl: null },
    TASK4: { status: "pending", progress: 0, fileName: "", previewUrl: null },
  });
  const [error, setError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Load existing videos on mount
  useEffect(() => {
    if (!currentStudentId) return;
    const fetchVideos = async () => {
      try {
        const res = await fetch(
          `/api/videos?studentId=${currentStudentId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.videos && data.videos.length > 0) {
            setTaskStates((prev) => {
              const next = { ...prev };
              for (const video of data.videos) {
                if (next[video.taskType]) {
                  next[video.taskType] = {
                    status: "uploaded",
                    progress: 100,
                    fileName: video.fileName,
                    previewUrl: video.filePath,
                  };
                }
              }
              return next;
            });
          }
        }
      } catch {
        // Silently ignore fetch errors on load
      }
    };
    fetchVideos();
  }, [currentStudentId]);

  const handleFileSelect = async (
    taskType: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!currentStudentId) {
      setError("No student selected. Please go back to the dashboard.");
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    // Set uploading state
    setTaskStates((prev) => ({
      ...prev,
      [taskType]: {
        status: "uploading",
        progress: 0,
        fileName: file.name,
        previewUrl,
      },
    }));
    setError(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setTaskStates((prev) => {
        const current = prev[taskType];
        if (current.progress >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return {
          ...prev,
          [taskType]: {
            ...current,
            progress: Math.min(current.progress + 15, 90),
          },
        };
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append("studentId", currentStudentId);
      formData.append("taskType", taskType);
      formData.append("video", file);

      const res = await fetch("/api/videos", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to upload video");
      }

      setTaskStates((prev) => ({
        ...prev,
        [taskType]: {
          ...prev[taskType],
          status: "uploaded",
          progress: 100,
        },
      }));
    } catch (err) {
      clearInterval(progressInterval);
      setTaskStates((prev) => ({
        ...prev,
        [taskType]: {
          ...prev[taskType],
          status: "pending",
          progress: 0,
        },
      }));
      setError(
        err instanceof Error ? err.message : "Failed to upload video"
      );
    }

    // Reset file input
    if (fileInputRefs.current[taskType]) {
      fileInputRefs.current[taskType]!.value = "";
    }
  };

  const allUploaded = Object.values(taskStates).every(
    (t) => t.status === "uploaded"
  );

  const uploadedCount = Object.values(taskStates).filter(
    (t) => t.status === "uploaded"
  ).length;

  const handleSubmit = () => {
    setCurrentView("parent-review");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 animate-bounce-in">
        <h1 className="text-2xl sm:text-3xl font-bold rainbow-text">
          Video Tasks
        </h1>
        <p className="text-muted-foreground mt-1">
          Record and upload videos of your child completing each task
        </p>
      </div>

      {/* Guidelines Banner - Playful yellow gradient with 3D feel */}
      <Card className="mb-6 card-3d bg-playful-card-yellow border-2 border-[#FEC163]/40">
        <CardContent className="p-5">
          <h3 className="font-bold text-[#D4A017] flex items-center gap-2 mb-3 text-base">
            <span className="icon-bubble icon-bubble-yellow size-7 p-1.5">
              <Lightbulb className="size-4" />
            </span>
            Recording Guidelines
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-[#B8860B]">
            <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2">
              <Volume2 className="size-3.5 shrink-0 text-[#F39C12]" />
              <span>Quiet room required</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2">
              <Eye className="size-3.5 shrink-0 text-[#F39C12]" />
              <span>Child face must be visible</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2">
              <Lightbulb className="size-3.5 shrink-0 text-[#F39C12]" />
              <span>Good lighting needed</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2">
              <Volume2 className="size-3.5 shrink-0 text-[#F39C12]" />
              <span>Parent voice should be audible</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2">
              <CameraOff className="size-3.5 shrink-0 text-[#F39C12]" />
              <span>No edited videos</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2">
              <Clock className="size-3.5 shrink-0 text-[#F39C12]" />
              <span>Maximum duration: 2 minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-muted-foreground font-medium">
          {uploadedCount} of {TASKS.length} tasks completed
        </span>
        <div className="flex gap-2">
          {TASKS.map((task) => (
            <div
              key={task.taskType}
              className={`size-4 rounded-full transition-all duration-300 step-3d ${
                taskStates[task.taskType].status === "uploaded"
                  ? TASK_COLORS[task.taskType].dotColor + " scale-110"
                  : taskStates[task.taskType].status === "uploading"
                  ? "bg-[#FEC163] animate-pulse"
                  : "bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Task Cards */}
      <div className="space-y-5">
        {TASKS.map((task, idx) => {
          const state = taskStates[task.taskType];
          const colors = TASK_COLORS[task.taskType];
          return (
            <Card
              key={task.taskType}
              className={`card-3d border-l-4 ${colors.border} overflow-hidden ${
                state.status === "uploaded"
                  ? "bg-playful-card-green"
                  : idx % 2 === 0
                  ? "bg-playful-card-coral"
                  : "bg-playful-card-purple"
              }`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <span className={colors.numberBg}>
                      {task.number}
                    </span>
                    {task.title}
                  </CardTitle>
                  <Badge
                    className={`badge-3d ${
                      state.status === "uploaded"
                        ? "bg-[#6BCB77]/20 text-[#27AE60] border-[#6BCB77]/30"
                        : state.status === "uploading"
                        ? "bg-[#FEC163]/20 text-[#D4A017] border-[#FEC163]/30"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {state.status === "uploaded" && (
                      <CheckCircle2 className="size-3 mr-1" />
                    )}
                    {state.status === "uploading" && (
                      <Loader2 className="size-3 mr-1 animate-spin" />
                    )}
                    {state.status === "pending" && (
                      <FileVideo className="size-3 mr-1" />
                    )}
                    {state.status === "uploaded"
                      ? "Uploaded"
                      : state.status === "uploading"
                      ? "Uploading"
                      : "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {task.instruction}
                </p>

                {/* Upload Progress - Rainbow gradient */}
                {state.status === "uploading" && (
                  <div className="space-y-2">
                    <div className="h-3 bg-muted/50 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${state.progress}%`,
                          background: "linear-gradient(90deg, #FF6B6B, #FEC163, #6BCB77, #4D96FF, #9B59B6)",
                          backgroundSize: "200% 100%",
                          animation: "rainbowShift 2s linear infinite",
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Uploading {state.fileName}... {state.progress}%
                    </p>
                  </div>
                )}

                {/* Video Preview - Rounded corners and subtle shadow */}
                {state.status === "uploaded" && state.previewUrl && (
                  <div className="relative rounded-2xl overflow-hidden bg-black/5 shadow-lg ring-2 ring-[#6BCB77]/30">
                    <video
                      src={state.previewUrl}
                      className="w-full max-h-48 object-contain rounded-2xl"
                      controls
                    >
                      <track kind="captions" />
                    </video>
                    <div className="absolute top-2 right-2">
                      <Badge className="badge-3d bg-[#6BCB77] text-white border-none text-xs">
                        <CheckCircle2 className="size-3 mr-1" />
                        Done
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Upload Button / File Input */}
                {state.status !== "uploading" && (
                  <div>
                    <input
                      ref={(el) => {
                        fileInputRefs.current[task.taskType] = el;
                      }}
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileSelect(task.taskType, e)}
                      className="hidden"
                      id={`video-${task.taskType}`}
                    />
                    <Button
                      variant={state.status === "uploaded" ? "outline" : "default"}
                      size="sm"
                      className={`gap-1.5 rounded-xl font-semibold ${
                        state.status === "uploaded"
                          ? "border-[#9B59B6]/30 text-[#8E44AD] hover:bg-[#9B59B6]/10"
                          : "btn-3d bg-[#FF6B6B] hover:bg-[#FF5252] text-white border-none"
                      }`}
                      onClick={() =>
                        fileInputRefs.current[task.taskType]?.click()
                      }
                    >
                      {state.status === "uploaded" ? (
                        <>
                          <Upload className="size-3.5" />
                          Replace Video
                        </>
                      ) : (
                        <>
                          <Video className="size-3.5" />
                          Upload Video
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 flex items-center gap-2 border-2 border-red-200 shadow-md">
          <AlertCircle className="size-4 shrink-0" />
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto p-0 h-auto text-red-400 hover:text-red-600"
            onClick={() => setError(null)}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setCurrentView("parent-questionnaire")}
          className="gap-1.5 rounded-xl font-semibold border-[#9B59B6]/30 text-[#8E44AD] hover:bg-[#9B59B6]/10"
        >
          <ChevronLeft className="size-4" />
          Back to Questionnaire
        </Button>

        {allUploaded && (
          <Button
            onClick={handleSubmit}
            className="gap-1.5 btn-3d-green bg-[#6BCB77] hover:bg-[#5AB868] text-white border-none"
          >
            Submit for Analysis
            <CheckCircle2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
