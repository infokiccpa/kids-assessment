"use client";

import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Baby,
  Users,
  School,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

const STEPS = [
  { number: 1, title: "Child Information", icon: Baby, color: "#FF6B6B", iconBubble: "icon-bubble-coral", cardBg: "bg-playful-card-coral" },
  { number: 2, title: "Parent Information", icon: Users, color: "#9B59B6", iconBubble: "icon-bubble-purple", cardBg: "bg-playful-card-purple" },
  { number: 3, title: "School Selection", icon: School, color: "#4D96FF", iconBubble: "icon-bubble-blue", cardBg: "bg-playful-card-blue" },
  { number: 4, title: "Consent & Review", icon: ShieldCheck, color: "#6BCB77", iconBubble: "icon-bubble-green", cardBg: "bg-playful-card-green" },
];

const SCHOOLS = [
  "Sunshine Kindergarten",
  "Little Stars Academy",
  "Green Meadows School",
  "Rainbow Learning Center",
];

const GRADES = ["Pre-K", "Kindergarten", "Grade 1"];

interface FormData {
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
  consentGiven: boolean;
}

const initialFormData: FormData = {
  childName: "",
  dateOfBirth: "",
  gender: "",
  nationality: "",
  languagesSpoken: "",
  previousSchool: "",
  specialMedicalNotes: "",
  fatherName: "",
  motherName: "",
  mobileNumber: "",
  parentEmail: "",
  address: "",
  schoolApplied: "",
  gradeApplied: "",
  consentGiven: false,
};

export default function RegistrationForm() {
  const { user, setCurrentView, setCurrentStudentId, setIsLoading } =
    useAppStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
    parentEmail: user?.email || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.childName.trim())
        newErrors.childName = "Child name is required";
      if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
      if (!formData.gender) newErrors.gender = "Gender is required";
    }

    if (currentStep === 2) {
      if (!formData.fatherName.trim())
        newErrors.fatherName = "Father name is required";
      if (!formData.motherName.trim())
        newErrors.motherName = "Mother name is required";
      if (!formData.mobileNumber.trim())
        newErrors.mobileNumber = "Mobile number is required";
      if (!formData.parentEmail.trim())
        newErrors.parentEmail = "Email is required";
      if (!formData.address.trim())
        newErrors.address = "Address is required";
    }

    if (currentStep === 3) {
      if (!formData.schoolApplied)
        newErrors.schoolApplied = "Please select a school";
      if (!formData.gradeApplied)
        newErrors.gradeApplied = "Please select a grade";
    }

    if (currentStep === 4) {
      if (!formData.consentGiven)
        newErrors.consentGiven = "You must provide consent to continue";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setSubmitting(true);
    setIsLoading(true);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: user?.id,
          ...formData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create application");
      }

      const data = await res.json();
      setCurrentStudentId(data.student.id);
      setCurrentView("parent-questionnaire");
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error ? err.message : "Failed to create application",
      });
    } finally {
      setSubmitting(false);
      setIsLoading(false);
    }
  };

  const progressValue = (step / 4) * 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 animate-bounce-in">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2">
          📝 New Application
        </h1>
        <p className="text-muted-foreground mt-1 font-medium">
          Complete all steps to register your child for assessment
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <Progress value={progressValue} className="h-3 mb-5 progress-playful rounded-full" />
        <div className="grid grid-cols-4 gap-3">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = s.number === step;
            const isCompleted = s.number < step;
            return (
              <div
                key={s.number}
                className={`flex flex-col items-center gap-2 text-center animate-bounce-in`}
                style={{ animationDelay: `${s.number * 0.1}s` }}
              >
                <div
                  className={`flex items-center justify-center size-12 rounded-xl transition-all ${
                    isActive
                      ? `icon-bubble ${s.iconBubble} step-3d scale-110`
                      : isCompleted
                      ? "icon-bubble icon-bubble-green step-3d"
                      : "bg-muted/50 border-2 border-muted-foreground/20 rounded-xl"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    <Icon className="size-5" />
                  )}
                </div>
                <span
                  className={`text-xs font-bold hidden sm:block ${
                    isActive
                      ? ""
                      : isCompleted
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                  style={isActive ? { color: s.color } : undefined}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="divider-rainbow mb-6" />

      {/* Step Content */}
      {step === 1 && (
        <Card className="card-3d border-l-4 border-l-[#FF6B6B] bg-playful-card-coral animate-bounce-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="icon-bubble icon-bubble-coral size-10 rounded-xl">
                <Baby className="size-5" />
              </div>
              <span className="text-[#FF6B6B]">Child Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="childName" className="font-semibold text-sm">
                Child Full Name <span className="text-[#FF6B6B]">*</span>
              </Label>
              <Input
                id="childName"
                value={formData.childName}
                onChange={(e) => updateField("childName", e.target.value)}
                placeholder="Enter child's full name"
                className={`input-playful mt-1.5 ${errors.childName ? "border-[#FF6B6B]" : ""}`}
              />
              {errors.childName && (
                <p className="text-sm text-[#FF6B6B] mt-1 font-medium">
                  {errors.childName}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="dateOfBirth" className="font-semibold text-sm">
                Date of Birth <span className="text-[#FF6B6B]">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => updateField("dateOfBirth", e.target.value)}
                className={`input-playful mt-1.5 ${errors.dateOfBirth ? "border-[#FF6B6B]" : ""}`}
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-[#FF6B6B] mt-1 font-medium">
                  {errors.dateOfBirth}
                </p>
              )}
            </div>

            <div>
              <Label className="font-semibold text-sm">
                Gender <span className="text-[#FF6B6B]">*</span>
              </Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={(val) => updateField("gender", val)}
                className="flex gap-6 mt-2"
              >
                {["Male", "Female", "Other"].map((g) => (
                  <div key={g} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={g}
                      id={g.toLowerCase()}
                      className="border-[#FF6B6B] text-[#FF6B6B]"
                    />
                    <Label htmlFor={g.toLowerCase()} className="font-medium cursor-pointer">
                      {g}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.gender && (
                <p className="text-sm text-[#FF6B6B] mt-1 font-medium">
                  {errors.gender}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="nationality" className="font-semibold text-sm">Nationality</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => updateField("nationality", e.target.value)}
                placeholder="Enter nationality"
                className="input-playful mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="languagesSpoken" className="font-semibold text-sm">Languages Spoken</Label>
              <Input
                id="languagesSpoken"
                value={formData.languagesSpoken}
                onChange={(e) => updateField("languagesSpoken", e.target.value)}
                placeholder="e.g. English, Arabic, French"
                className="input-playful mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Separate multiple languages with commas
              </p>
            </div>

            <div>
              <Label htmlFor="previousSchool" className="font-semibold text-sm">Previous School</Label>
              <Input
                id="previousSchool"
                value={formData.previousSchool}
                onChange={(e) => updateField("previousSchool", e.target.value)}
                placeholder="Enter previous school name (if any)"
                className="input-playful mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="specialMedicalNotes" className="font-semibold text-sm">Special Medical Notes</Label>
              <Textarea
                id="specialMedicalNotes"
                value={formData.specialMedicalNotes}
                onChange={(e) =>
                  updateField("specialMedicalNotes", e.target.value)
                }
                placeholder="Any medical conditions, allergies, or special needs"
                rows={3}
                className="input-playful mt-1.5"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="card-3d border-l-4 border-l-[#9B59B6] bg-playful-card-purple animate-bounce-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="icon-bubble icon-bubble-purple size-10 rounded-xl">
                <Users className="size-5" />
              </div>
              <span className="text-[#9B59B6]">Parent Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fatherName" className="font-semibold text-sm">
                Father Name <span className="text-[#FF6B6B]">*</span>
              </Label>
              <Input
                id="fatherName"
                value={formData.fatherName}
                onChange={(e) => updateField("fatherName", e.target.value)}
                placeholder="Enter father's full name"
                className={`input-playful mt-1.5 ${errors.fatherName ? "border-[#FF6B6B]" : ""}`}
              />
              {errors.fatherName && (
                <p className="text-sm text-[#FF6B6B] mt-1 font-medium">
                  {errors.fatherName}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="motherName" className="font-semibold text-sm">
                Mother Name <span className="text-[#FF6B6B]">*</span>
              </Label>
              <Input
                id="motherName"
                value={formData.motherName}
                onChange={(e) => updateField("motherName", e.target.value)}
                placeholder="Enter mother's full name"
                className={`input-playful mt-1.5 ${errors.motherName ? "border-[#FF6B6B]" : ""}`}
              />
              {errors.motherName && (
                <p className="text-sm text-[#FF6B6B] mt-1 font-medium">
                  {errors.motherName}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="mobileNumber" className="font-semibold text-sm">
                Mobile Number <span className="text-[#FF6B6B]">*</span>
              </Label>
              <Input
                id="mobileNumber"
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) => updateField("mobileNumber", e.target.value)}
                placeholder="Enter mobile number"
                className={`input-playful mt-1.5 ${errors.mobileNumber ? "border-[#FF6B6B]" : ""}`}
              />
              {errors.mobileNumber && (
                <p className="text-sm text-[#FF6B6B] mt-1 font-medium">
                  {errors.mobileNumber}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="parentEmail" className="font-semibold text-sm">
                Email <span className="text-[#FF6B6B]">*</span>
              </Label>
              <Input
                id="parentEmail"
                type="email"
                value={formData.parentEmail}
                onChange={(e) => updateField("parentEmail", e.target.value)}
                placeholder="Enter email address"
                className={`input-playful mt-1.5 ${errors.parentEmail ? "border-[#FF6B6B]" : ""}`}
              />
              {errors.parentEmail && (
                <p className="text-sm text-[#FF6B6B] mt-1 font-medium">
                  {errors.parentEmail}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="address" className="font-semibold text-sm">
                Address <span className="text-[#FF6B6B]">*</span>
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Enter full residential address"
                rows={3}
                className={`input-playful mt-1.5 ${errors.address ? "border-[#FF6B6B]" : ""}`}
              />
              {errors.address && (
                <p className="text-sm text-[#FF6B6B] mt-1 font-medium">
                  {errors.address}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="card-3d border-l-4 border-l-[#4D96FF] bg-playful-card-blue animate-bounce-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="icon-bubble icon-bubble-blue size-10 rounded-xl">
                <School className="size-5" />
              </div>
              <span className="text-[#4D96FF]">School Selection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-semibold text-sm">
                School Applied For <span className="text-[#FF6B6B]">*</span>
              </Label>
              <Select
                value={formData.schoolApplied}
                onValueChange={(val) => updateField("schoolApplied", val)}
              >
                <SelectTrigger
                  className={`w-full mt-1.5 input-playful ${
                    errors.schoolApplied ? "border-[#FF6B6B]" : ""
                  }`}
                >
                  <SelectValue placeholder="Select a school" />
                </SelectTrigger>
                <SelectContent>
                  {SCHOOLS.map((school) => (
                    <SelectItem key={school} value={school}>
                      {school}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.schoolApplied && (
                <p className="text-sm text-[#FF6B6B] mt-1 font-medium">
                  {errors.schoolApplied}
                </p>
              )}
            </div>

            <div>
              <Label className="font-semibold text-sm">
                Grade Applied For <span className="text-[#FF6B6B]">*</span>
              </Label>
              <Select
                value={formData.gradeApplied}
                onValueChange={(val) => updateField("gradeApplied", val)}
              >
                <SelectTrigger
                  className={`w-full mt-1.5 input-playful ${
                    errors.gradeApplied ? "border-[#FF6B6B]" : ""
                  }`}
                >
                  <SelectValue placeholder="Select a grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.gradeApplied && (
                <p className="text-sm text-[#FF6B6B] mt-1 font-medium">
                  {errors.gradeApplied}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="card-3d border-l-4 border-l-[#6BCB77] bg-playful-card-green animate-bounce-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="icon-bubble icon-bubble-green size-10 rounded-xl">
                <ShieldCheck className="size-5" />
              </div>
              <span className="text-[#6BCB77]">Consent & Review</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Review Summary */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-[#FF6B6B] uppercase tracking-wider flex items-center gap-2">
                <div className="icon-bubble icon-bubble-coral size-6 rounded-lg">
                  <Baby className="size-3" />
                </div>
                Child Information
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-white/50 rounded-xl p-3">
                <div className="text-muted-foreground font-medium">Full Name</div>
                <div className="font-bold">{formData.childName || "-"}</div>
                <div className="text-muted-foreground font-medium">Date of Birth</div>
                <div className="font-bold">
                  {formData.dateOfBirth || "-"}
                </div>
                <div className="text-muted-foreground font-medium">Gender</div>
                <div className="font-bold">{formData.gender || "-"}</div>
                <div className="text-muted-foreground font-medium">Nationality</div>
                <div className="font-bold">
                  {formData.nationality || "-"}
                </div>
                <div className="text-muted-foreground font-medium">Languages</div>
                <div className="font-bold">
                  {formData.languagesSpoken || "-"}
                </div>
                <div className="text-muted-foreground font-medium">Previous School</div>
                <div className="font-bold">
                  {formData.previousSchool || "-"}
                </div>
                <div className="text-muted-foreground font-medium col-span-2">
                  Special Medical Notes
                </div>
                <div className="font-bold col-span-2">
                  {formData.specialMedicalNotes || "None"}
                </div>
              </div>

              <div className="divider-rainbow" />
              <h3 className="font-bold text-sm text-[#9B59B6] uppercase tracking-wider flex items-center gap-2">
                <div className="icon-bubble icon-bubble-purple size-6 rounded-lg">
                  <Users className="size-3" />
                </div>
                Parent Information
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-white/50 rounded-xl p-3">
                <div className="text-muted-foreground font-medium">Father</div>
                <div className="font-bold">
                  {formData.fatherName || "-"}
                </div>
                <div className="text-muted-foreground font-medium">Mother</div>
                <div className="font-bold">
                  {formData.motherName || "-"}
                </div>
                <div className="text-muted-foreground font-medium">Mobile</div>
                <div className="font-bold">
                  {formData.mobileNumber || "-"}
                </div>
                <div className="text-muted-foreground font-medium">Email</div>
                <div className="font-bold">
                  {formData.parentEmail || "-"}
                </div>
                <div className="text-muted-foreground font-medium col-span-2">Address</div>
                <div className="font-bold col-span-2">
                  {formData.address || "-"}
                </div>
              </div>

              <div className="divider-rainbow" />
              <h3 className="font-bold text-sm text-[#4D96FF] uppercase tracking-wider flex items-center gap-2">
                <div className="icon-bubble icon-bubble-blue size-6 rounded-lg">
                  <School className="size-3" />
                </div>
                School Selection
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-white/50 rounded-xl p-3">
                <div className="text-muted-foreground font-medium">School</div>
                <div className="font-bold">
                  {formData.schoolApplied || "-"}
                </div>
                <div className="text-muted-foreground font-medium">Grade</div>
                <div className="font-bold">
                  {formData.gradeApplied || "-"}
                </div>
              </div>
            </div>

            <div className="divider-rainbow" />

            {/* Consent */}
            <div className="flex items-start gap-3 bg-[#6BCB7708] rounded-xl p-4 border-2 border-[#6BCB7720]">
              <Checkbox
                id="consent"
                checked={formData.consentGiven}
                onCheckedChange={(checked) =>
                  updateField("consentGiven", checked === true)
                }
                className="mt-0.5 data-[state=checked]:bg-[#6BCB77] data-[state=checked]:border-[#6BCB77]"
              />
              <Label htmlFor="consent" className="font-medium text-sm leading-relaxed cursor-pointer">
                I consent to AI-assisted behavioral readiness assessment for
                educational admission purposes only.
              </Label>
            </div>
            {errors.consentGiven && (
              <p className="text-sm text-[#FF6B6B] font-medium">{errors.consentGiven}</p>
            )}

            {errors.submit && (
              <div className="rounded-xl bg-[#FF6B6B10] p-4 text-sm text-[#FF6B6B] font-semibold border-2 border-[#FF6B6B20]">
                {errors.submit}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={step === 1 ? () => setCurrentView("parent-dashboard") : handleBack}
          className="gap-1.5 rounded-xl border-2 font-semibold hover:bg-muted/50"
        >
          <ChevronLeft className="size-4" />
          {step === 1 ? "Dashboard" : "Back"}
        </Button>

        {step < 4 ? (
          <Button
            onClick={handleNext}
            className="btn-3d bg-[#FF6B6B] hover:bg-[#FF5252] text-white gap-1.5 rounded-xl"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-3d-green bg-[#6BCB77] hover:bg-[#5AB868] text-white gap-1.5 rounded-xl"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Application
                <CheckCircle2 className="size-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
