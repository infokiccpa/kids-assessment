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
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Video Tasks
        </h1>
        <p className="text-muted-foreground mt-1">
          Record and upload videos of your child completing each task
        </p>
      </div>

      {/* Guidelines Banner */}
      <Card className="mb-6 border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
            <Lightbulb className="size-4" />
            Recording Guidelines
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-amber-700">
            <div className="flex items-center gap-2">
              <Volume2 className="size-3.5 shrink-0" />
              <span>Quiet room required</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="size-3.5 shrink-0" />
              <span>Child face must be visible</span>
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb className="size-3.5 shrink-0" />
              <span>Good lighting needed</span>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 className="size-3.5 shrink-0" />
              <span>Parent voice should be audible</span>
            </div>
            <div className="flex items-center gap-2">
              <CameraOff className="size-3.5 shrink-0" />
              <span>No edited videos</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 shrink-0" />
              <span>Maximum duration: 2 minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          {uploadedCount} of {TASKS.length} tasks completed
        </span>
        <div className="flex gap-1">
          {TASKS.map((task) => (
            <div
              key={task.taskType}
              className={`size-3 rounded-full transition-colors ${
                taskStates[task.taskType].status === "uploaded"
                  ? "bg-green-500"
                  : taskStates[task.taskType].status === "uploading"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Task Cards */}
      <div className="space-y-4">
        {TASKS.map((task) => {
          const state = taskStates[task.taskType];
          return (
            <Card
              key={task.taskType}
              className={
                state.status === "uploaded"
                  ? "border-green-200 bg-green-50/30"
                  : ""
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="flex items-center justify-center size-7 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {task.number}
                    </div>
                    {task.title}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={
                      state.status === "uploaded"
                        ? "bg-green-100 text-green-700 border-green-300"
                        : state.status === "uploading"
                        ? "bg-amber-100 text-amber-700 border-amber-300"
                        : "bg-gray-100 text-gray-600 border-gray-300"
                    }
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
                <p className="text-sm text-muted-foreground">
                  {task.instruction}
                </p>

                {/* Upload Progress */}
                {state.status === "uploading" && (
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${state.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Uploading {state.fileName}... {state.progress}%
                    </p>
                  </div>
                )}

                {/* Video Preview */}
                {state.status === "uploaded" && state.previewUrl && (
                  <div className="relative rounded-lg overflow-hidden bg-black/5">
                    <video
                      src={state.previewUrl}
                      className="w-full max-h-48 object-contain rounded-lg"
                      controls
                    >
                      <track kind="captions" />
                    </video>
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-600 text-white text-xs">
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
                      className="gap-1.5"
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
        <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto p-0 h-auto"
            onClick={() => setError(null)}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentView("parent-questionnaire")}
          className="gap-1.5"
        >
          <ChevronLeft className="size-4" />
          Back to Questionnaire
        </Button>

        {allUploaded && (
          <Button
            onClick={handleSubmit}
            className="gap-1.5 bg-green-600 hover:bg-green-700"
          >
            Submit for Analysis
            <CheckCircle2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
