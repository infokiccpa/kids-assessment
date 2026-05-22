"use client";

import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Brain,
  Heart,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type SectionKey = "A" | "B" | "C";

interface QuestionAnswer {
  q1: string;
  q2: string;
  q3: string;
}

interface SectionConfig {
  key: SectionKey;
  title: string;
  icon: React.ReactNode;
  questions: {
    id: string;
    text: string;
    options: string[];
    type: "radio" | "select";
  }[];
}

const SECTIONS: SectionConfig[] = [
  {
    key: "A",
    title: "Section A - Attention",
    icon: <Brain className="size-5 text-amber-600" />,
    questions: [
      {
        id: "q1",
        text: "Can your child sit for 5 minutes without getting up?",
        options: ["yes", "sometimes", "no"],
        type: "radio",
      },
      {
        id: "q2",
        text: "Does your child respond when called by name?",
        options: ["yes", "sometimes", "no"],
        type: "radio",
      },
      {
        id: "q3",
        text: "Can your child follow simple instructions?",
        options: ["yes", "sometimes", "no"],
        type: "radio",
      },
    ],
  },
  {
    key: "B",
    title: "Section B - Emotional",
    icon: <Heart className="size-5 text-rose-500" />,
    questions: [
      {
        id: "q1",
        text: "Does your child cry during separation from you?",
        options: ["yes", "sometimes", "no"],
        type: "radio",
      },
      {
        id: "q2",
        text: "Is your child comfortable in new places?",
        options: ["yes", "sometimes", "no"],
        type: "radio",
      },
      {
        id: "q3",
        text: "Does loud sound disturb your child?",
        options: ["yes", "sometimes", "no"],
        type: "radio",
      },
    ],
  },
  {
    key: "C",
    title: "Section C - Social",
    icon: <Users className="size-5 text-emerald-600" />,
    questions: [
      {
        id: "q1",
        text: "Does your child interact with other children?",
        options: ["yes", "sometimes", "no"],
        type: "radio",
      },
      {
        id: "q2",
        text: "Does your child share toys with others?",
        options: ["yes", "sometimes", "no"],
        type: "radio",
      },
      {
        id: "q3",
        text: "Can your child introduce themselves?",
        options: ["yes", "with help", "no"],
        type: "select",
      },
    ],
  },
];

export default function Questionnaire() {
  const { currentStudentId, setCurrentView, setIsLoading } = useAppStore();
  const [activeSection, setActiveSection] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({
    A: { q1: "", q2: "", q3: "" },
    B: { q1: "", q2: "", q3: "" },
    C: { q1: "", q2: "", q3: "" },
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const currentSection = SECTIONS[activeSection];
  const sectionKey = currentSection.key;
  const sectionAnswers = answers[sectionKey];

  const updateAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [questionId]: value,
      },
    }));
    const errKey = `${sectionKey}-${questionId}`;
    if (validationErrors[errKey]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[errKey];
        return next;
      });
    }
  };

  const isSectionComplete = (sectionIdx: number): boolean => {
    const key = SECTIONS[sectionIdx].key;
    const sectionAns = answers[key];
    return Object.values(sectionAns).every((v) => v !== "");
  };

  const validateCurrentSection = (): boolean => {
    const newErrors: Record<string, string> = {};
    currentSection.questions.forEach((q) => {
      if (!sectionAnswers[q.id as keyof QuestionAnswer]) {
        newErrors[`${sectionKey}-${q.id}`] = "Please answer this question";
      }
    });
    setValidationErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleNextSection = () => {
    if (validateCurrentSection()) {
      setActiveSection((prev) => Math.min(prev + 1, SECTIONS.length - 1));
    }
  };

  const handlePrevSection = () => {
    setActiveSection((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateCurrentSection()) return;

    // Check all sections are complete
    for (let i = 0; i < SECTIONS.length; i++) {
      if (!isSectionComplete(i)) {
        setError(
          `Please complete Section ${SECTIONS[i].key} before submitting.`
        );
        setActiveSection(i);
        return;
      }
    }

    if (!currentStudentId) {
      setError("No student selected. Please go back to the dashboard.");
      return;
    }

    setSubmitting(true);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentStudentId,
          sectionA: answers.A,
          sectionB: answers.B,
          sectionC: answers.C,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save questionnaire");
      }

      setCurrentView("parent-videos");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save questionnaire"
      );
    } finally {
      setSubmitting(false);
      setIsLoading(false);
    }
  };

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
          Behavioral Questionnaire
        </h1>
        <p className="text-muted-foreground mt-1">
          Answer questions about your child&apos;s behavior in different areas
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {SECTIONS.map((section, idx) => {
          const complete = isSectionComplete(idx);
          const active = idx === activeSection;
          return (
            <button
              key={section.key}
              onClick={() => {
                if (idx <= activeSection || complete) {
                  setActiveSection(idx);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : complete
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-muted text-muted-foreground border-transparent"
              }`}
            >
              {complete ? (
                <CheckCircle2 className="size-4" />
              ) : active ? (
                section.icon
              ) : (
                <div className="size-4 rounded-full border-2 border-current" />
              )}
              <span className="hidden sm:inline">Section {section.key}</span>
              <span className="sm:hidden">{section.key}</span>
            </button>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-1 mb-6">
        {SECTIONS.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              idx <= activeSection
                ? isSectionComplete(idx)
                  ? "bg-green-500"
                  : "bg-primary"
                : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Current Section Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentSection.icon}
            {currentSection.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentSection.questions.map((question) => {
            const errKey = `${sectionKey}-${question.id}`;
            const currentAnswer =
              sectionAnswers[question.id as keyof QuestionAnswer];

            return (
              <div
                key={question.id}
                className="space-y-3"
              >
                <Label className="text-sm font-medium">
                  {question.text}
                </Label>

                {question.type === "radio" ? (
                  <RadioGroup
                    value={currentAnswer}
                    onValueChange={(val) => updateAnswer(question.id, val)}
                    className="flex flex-wrap gap-4"
                  >
                    {question.options.map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <RadioGroupItem
                          value={opt}
                          id={`${sectionKey}-${question.id}-${opt}`}
                        />
                        <Label
                          htmlFor={`${sectionKey}-${question.id}-${opt}`}
                          className="font-normal cursor-pointer"
                        >
                          {formatOptionLabel(opt)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <Select
                    value={currentAnswer}
                    onValueChange={(val) => updateAnswer(question.id, val)}
                  >
                    <SelectTrigger
                      className={`w-full ${
                        validationErrors[errKey] ? "border-destructive" : ""
                      }`}
                    >
                      <SelectValue placeholder="Select an answer" />
                    </SelectTrigger>
                    <SelectContent>
                      {question.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {formatOptionLabel(opt)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {validationErrors[errKey] && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    {validationErrors[errKey]}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={
            activeSection === 0
              ? () => setCurrentView("parent-registration")
              : handlePrevSection
          }
          className="gap-1.5"
        >
          <ChevronLeft className="size-4" />
          {activeSection === 0 ? "Back to Registration" : "Previous"}
        </Button>

        {activeSection < SECTIONS.length - 1 ? (
          <Button onClick={handleNextSection} className="gap-1.5">
            Next Section
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Questionnaire
                <CheckCircle2 className="size-4" />
              </>
            )}
          </Button>
        )}
      </div>

      {/* Section completion status */}
      <div className="mt-6 flex flex-wrap gap-2">
        {SECTIONS.map((section, idx) => (
          <Badge
            key={section.key}
            variant={isSectionComplete(idx) ? "default" : "outline"}
            className={
              isSectionComplete(idx)
                ? "bg-green-100 text-green-700 border-green-200"
                : ""
            }
          >
            Section {section.key}: {isSectionComplete(idx) ? "Complete" : "Incomplete"}
          </Badge>
        ))}
      </div>
    </div>
  );
}
