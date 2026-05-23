"use client";

import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import {
  Loader2,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function RegisterForm() {
  const { setCurrentView } = useAppStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone: phone || undefined,
          role: "PARENT",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError("An account with this email already exists.");
        } else {
          setError(data.error || "Registration failed. Please try again.");
        }
        return;
      }

      setSuccess(
        "Account created successfully! Redirecting to sign in..."
      );

      // Navigate to login after a brief delay
      setTimeout(() => {
        setCurrentView("login");
      }, 1500);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-playful-warm px-4 py-8 relative overflow-hidden">
      {/* Floating decorative bubbles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="bubble w-72 h-72 bg-[#6BCB77] top-[-5rem] left-[-3rem]" />
        <div className="bubble w-56 h-56 bg-[#9B59B6] bottom-[-2rem] right-[-2rem]" />
        <div className="bubble w-40 h-40 bg-[#FEC163] top-[10%] right-[8%]" />
        <div className="bubble w-32 h-32 bg-[#FF6B6B] bottom-[30%] left-[5%]" />
        <div className="bubble w-24 h-24 bg-[#4D96FF] top-[50%] left-[10%]" />
        <div className="bubble w-20 h-20 bg-[#FF8E53] top-[25%] right-[20%]" />
        {/* Soft blurred glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#6BCB77]/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#9B59B6]/10 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-[#FEC163]/8 blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-bounce-in">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <Image src="/kam-logo.png" alt="Kam Global AI" width={64} height={64} className="mx-auto mb-4 rounded-2xl animate-wiggle" />
          <h1 className="text-3xl font-extrabold tracking-tight rainbow-text">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-[#8B7E74] font-medium">
            Join KinderAssess to begin the assessment process 🌟
          </p>
        </div>

        <Card className="card-3d rounded-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-[#3D3028]">Register</CardTitle>
            <CardDescription className="text-[#8B7E74]">
              Fill in your details to create a new account 🎨
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="rounded-xl border-2 border-red-200 bg-red-50/80">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && (
                <Alert className="border-2 border-green-200 bg-green-50/80 rounded-xl">
                  <CheckCircle2 className="h-4 w-4 text-[#6BCB77]" />
                  <AlertDescription className="text-[#27AE60] font-medium">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#3D3028] font-semibold">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="name"
                  className="input-playful"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-[#3D3028] font-semibold">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  className="input-playful"
                />
              </div>

              {/* Phone (optional) */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#3D3028] font-semibold">
                  Phone <span className="text-[#8B7E74] font-normal">(optional)</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  autoComplete="tel"
                  className="input-playful"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-[#3D3028] font-semibold">Password</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                    className="input-playful pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7E74] hover:text-[#3D3028] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-[#3D3028] font-semibold">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                    className="input-playful pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7E74] hover:text-[#3D3028] transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Parent Account Badge */}
              <div className="flex items-center gap-3 rounded-xl border-2 border-[#6BCB77] bg-[#6BCB77]/10 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6BCB77] text-white text-lg">👨‍👩‍👧</div>
                <div>
                  <div className="text-sm font-bold text-[#3D3028]">Parent Account</div>
                  <div className="text-xs text-[#8B7E74]">
                    Register to assess your child’s kindergarten readiness
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full btn-3d-green bg-[#6BCB77] text-white hover:bg-[#5ABF68] h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center text-sm text-[#8B7E74]">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setCurrentView("login")}
                className="font-bold text-[#FF6B6B] hover:text-[#FF8E53] transition-colors"
              >
                Sign In 🚀
              </button>
            </div>

            {/* Back to Landing */}
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setCurrentView("landing")}
                className="text-xs text-[#8B7E74] hover:text-[#3D3028] transition-colors font-medium"
              >
                &larr; Back to Home
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
