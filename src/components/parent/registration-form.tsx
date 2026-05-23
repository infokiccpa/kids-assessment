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
  { number: 1, title: "Child Information", icon: Baby },
  { number: 2, title: "Parent Information", icon: Users },
  { number: 3, title: "School Selection", icon: School },
  { number: 4, title: "Consent & Review", icon: ShieldCheck },
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
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          New Application
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete all steps to register your child for assessment
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <Progress value={progressValue} className="h-2 mb-4" />
        <div className="grid grid-cols-4 gap-2">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = s.number === step;
            const isCompleted = s.number < step;
            return (
              <div
                key={s.number}
                className={`flex flex-col items-center gap-1 text-center ${
                  isActive
                    ? "text-primary"
                    : isCompleted
                    ? "text-green-600"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`flex items-center justify-center size-8 rounded-full border-2 transition-colors ${
                    isActive
                      ? "border-primary bg-primary/10"
                      : isCompleted
                      ? "border-green-600 bg-green-50"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>
                <span className="text-xs font-medium hidden sm:block">
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="size-5 text-primary" />
              Child Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="childName">
                Child Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="childName"
                value={formData.childName}
                onChange={(e) => updateField("childName", e.target.value)}
                placeholder="Enter child's full name"
                className={errors.childName ? "border-destructive" : ""}
              />
              {errors.childName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.childName}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="dateOfBirth">
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => updateField("dateOfBirth", e.target.value)}
                className={errors.dateOfBirth ? "border-destructive" : ""}
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-destructive mt-1">
                  {errors.dateOfBirth}
                </p>
              )}
            </div>

            <div>
              <Label>
                Gender <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={(val) => updateField("gender", val)}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male" className="font-normal cursor-pointer">
                    Male
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label
                    htmlFor="female"
                    className="font-normal cursor-pointer"
                  >
                    Female
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="Other" id="other" />
                  <Label htmlFor="other" className="font-normal cursor-pointer">
                    Other
                  </Label>
                </div>
              </RadioGroup>
              {errors.gender && (
                <p className="text-sm text-destructive mt-1">
                  {errors.gender}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => updateField("nationality", e.target.value)}
                placeholder="Enter nationality"
              />
            </div>

            <div>
              <Label htmlFor="languagesSpoken">Languages Spoken</Label>
              <Input
                id="languagesSpoken"
                value={formData.languagesSpoken}
                onChange={(e) => updateField("languagesSpoken", e.target.value)}
                placeholder="e.g. English, Arabic, French"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate multiple languages with commas
              </p>
            </div>

            <div>
              <Label htmlFor="previousSchool">Previous School</Label>
              <Input
                id="previousSchool"
                value={formData.previousSchool}
                onChange={(e) => updateField("previousSchool", e.target.value)}
                placeholder="Enter previous school name (if any)"
              />
            </div>

            <div>
              <Label htmlFor="specialMedicalNotes">Special Medical Notes</Label>
              <Textarea
                id="specialMedicalNotes"
                value={formData.specialMedicalNotes}
                onChange={(e) =>
                  updateField("specialMedicalNotes", e.target.value)
                }
                placeholder="Any medical conditions, allergies, or special needs"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              Parent Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fatherName">
                Father Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fatherName"
                value={formData.fatherName}
                onChange={(e) => updateField("fatherName", e.target.value)}
                placeholder="Enter father's full name"
                className={errors.fatherName ? "border-destructive" : ""}
              />
              {errors.fatherName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.fatherName}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="motherName">
                Mother Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="motherName"
                value={formData.motherName}
                onChange={(e) => updateField("motherName", e.target.value)}
                placeholder="Enter mother's full name"
                className={errors.motherName ? "border-destructive" : ""}
              />
              {errors.motherName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.motherName}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="mobileNumber">
                Mobile Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mobileNumber"
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) => updateField("mobileNumber", e.target.value)}
                placeholder="Enter mobile number"
                className={errors.mobileNumber ? "border-destructive" : ""}
              />
              {errors.mobileNumber && (
                <p className="text-sm text-destructive mt-1">
                  {errors.mobileNumber}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="parentEmail">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="parentEmail"
                type="email"
                value={formData.parentEmail}
                onChange={(e) => updateField("parentEmail", e.target.value)}
                placeholder="Enter email address"
                className={errors.parentEmail ? "border-destructive" : ""}
              />
              {errors.parentEmail && (
                <p className="text-sm text-destructive mt-1">
                  {errors.parentEmail}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="address">
                Address <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Enter full residential address"
                rows={3}
                className={errors.address ? "border-destructive" : ""}
              />
              {errors.address && (
                <p className="text-sm text-destructive mt-1">
                  {errors.address}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="size-5 text-primary" />
              School Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>
                School Applied For <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.schoolApplied}
                onValueChange={(val) => updateField("schoolApplied", val)}
              >
                <SelectTrigger
                  className={`w-full mt-1.5 ${
                    errors.schoolApplied ? "border-destructive" : ""
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
                <p className="text-sm text-destructive mt-1">
                  {errors.schoolApplied}
                </p>
              )}
            </div>

            <div>
              <Label>
                Grade Applied For <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.gradeApplied}
                onValueChange={(val) => updateField("gradeApplied", val)}
              >
                <SelectTrigger
                  className={`w-full mt-1.5 ${
                    errors.gradeApplied ? "border-destructive" : ""
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
                <p className="text-sm text-destructive mt-1">
                  {errors.gradeApplied}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              Consent & Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Review Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Child Information
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">Full Name</div>
                <div className="font-medium">{formData.childName || "-"}</div>
                <div className="text-muted-foreground">Date of Birth</div>
                <div className="font-medium">
                  {formData.dateOfBirth || "-"}
                </div>
                <div className="text-muted-foreground">Gender</div>
                <div className="font-medium">{formData.gender || "-"}</div>
                <div className="text-muted-foreground">Nationality</div>
                <div className="font-medium">
                  {formData.nationality || "-"}
                </div>
                <div className="text-muted-foreground">Languages</div>
                <div className="font-medium">
                  {formData.languagesSpoken || "-"}
                </div>
                <div className="text-muted-foreground">Previous School</div>
                <div className="font-medium">
                  {formData.previousSchool || "-"}
                </div>
                <div className="text-muted-foreground col-span-2">
                  Special Medical Notes
                </div>
                <div className="font-medium col-span-2">
                  {formData.specialMedicalNotes || "None"}
                </div>
              </div>

              <div className="border-t pt-4" />
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Parent Information
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">Father</div>
                <div className="font-medium">
                  {formData.fatherName || "-"}
                </div>
                <div className="text-muted-foreground">Mother</div>
                <div className="font-medium">
                  {formData.motherName || "-"}
                </div>
                <div className="text-muted-foreground">Mobile</div>
                <div className="font-medium">
                  {formData.mobileNumber || "-"}
                </div>
                <div className="text-muted-foreground">Email</div>
                <div className="font-medium">
                  {formData.parentEmail || "-"}
                </div>
                <div className="text-muted-foreground col-span-2">Address</div>
                <div className="font-medium col-span-2">
                  {formData.address || "-"}
                </div>
              </div>

              <div className="border-t pt-4" />
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                School Selection
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">School</div>
                <div className="font-medium">
                  {formData.schoolApplied || "-"}
                </div>
                <div className="text-muted-foreground">Grade</div>
                <div className="font-medium">
                  {formData.gradeApplied || "-"}
                </div>
              </div>
            </div>

            <div className="border-t pt-4" />

            {/* Consent */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={formData.consentGiven}
                onCheckedChange={(checked) =>
                  updateField("consentGiven", checked === true)
                }
                className="mt-0.5"
              />
              <Label htmlFor="consent" className="font-normal text-sm leading-relaxed cursor-pointer">
                I consent to AI-assisted behavioral readiness assessment for
                educational admission purposes only.
              </Label>
            </div>
            {errors.consentGiven && (
              <p className="text-sm text-destructive">{errors.consentGiven}</p>
            )}

            {errors.submit && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
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
          className="gap-1.5"
        >
          <ChevronLeft className="size-4" />
          {step === 1 ? "Dashboard" : "Back"}
        </Button>

        {step < 4 ? (
          <Button onClick={handleNext} className="gap-1.5">
            Next
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
