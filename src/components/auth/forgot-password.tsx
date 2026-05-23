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
import { Loader2, Mail, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const { setCurrentView } = useAppStore();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate sending a reset link (no real email service in this demo)
    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setIsSuccess(true);
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
        <div className="bubble w-72 h-72 bg-[#4D96FF] top-[-5rem] right-[-3rem]" />
        <div className="bubble w-56 h-56 bg-[#9B59B6] bottom-[-2rem] left-[-2rem]" />
        <div className="bubble w-40 h-40 bg-[#6BCB77] top-[20%] left-[8%]" />
        <div className="bubble w-32 h-32 bg-[#FEC163] bottom-[25%] right-[5%]" />
        <div className="bubble w-24 h-24 bg-[#FF6B6B] top-[45%] left-[15%]" />
        <div className="bubble w-20 h-20 bg-[#FF8E53] bottom-[40%] right-[18%]" />
        {/* Soft blurred glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#4D96FF]/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#9B59B6]/10 blur-3xl" />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full bg-[#6BCB77]/8 blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-bounce-in">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 icon-bubble icon-bubble-blue h-16 w-16 rounded-2xl animate-wiggle">
            <Mail className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight rainbow-text">
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-[#8B7E74] font-medium">
            We&apos;ll send you a link to reset your password 📬
          </p>
        </div>

        <Card className="card-3d rounded-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-[#3D3028]">Forgot Password</CardTitle>
            <CardDescription className="text-[#8B7E74]">
              Enter your email address and we&apos;ll send you a reset link 💫
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="space-y-4">
                <Alert className="border-2 border-blue-200 bg-blue-50/80 rounded-xl">
                  <CheckCircle2 className="h-4 w-4 text-[#4D96FF]" />
                  <AlertDescription className="text-[#2980B9] font-medium">
                    If an account exists with <strong>{email}</strong>, you will
                    receive a password reset link shortly.
                  </AlertDescription>
                </Alert>

                <div className="rounded-xl bg-amber-50/80 border-2 border-amber-200 p-4 text-sm text-[#8B7E74]">
                  <p>
                    In this demo environment, email sending is simulated. Please
                    contact your administrator to reset your password. 📧
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => setCurrentView("login")}
                  className="w-full btn-3d-purple bg-[#9B59B6] text-white hover:bg-[#8E44AD] h-12 text-base"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="rounded-xl border-2 border-red-200 bg-red-50/80">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-[#3D3028] font-semibold">Email Address</Label>
                  <Input
                    id="forgot-email"
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

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full btn-3d bg-[#4D96FF] text-white hover:bg-[#3A85EE] h-12 text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Back to Login */}
            {!isSuccess && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setCurrentView("login")}
                  className="inline-flex items-center gap-1 text-sm text-[#FF6B6B] hover:text-[#FF8E53] transition-colors font-semibold"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to Sign In
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
