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
import { Loader2, LogIn, AlertCircle, Info } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginForm() {
  const { setCurrentView, setUser } = useAppStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        setIsLoading(false);
        return;
      }

      // Fetch session to get user info including role
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user) {
        setUser({
          id: session.user.id as string,
          email: session.user.email as string,
          name: session.user.name as string,
          role: (session.user.role as string) || "PARENT",
        });

        // Navigate based on role
        if (session.user.role === "ADMIN") {
          setCurrentView("admin-dashboard");
        } else {
          setCurrentView("parent-dashboard");
        }
      } else {
        setError("Failed to retrieve session. Please try again.");
      }
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
        <div className="bubble w-72 h-72 bg-[#FF6B6B] top-[-5rem] right-[-3rem]" />
        <div className="bubble w-56 h-56 bg-[#FEC163] bottom-[-2rem] left-[-2rem]" />
        <div className="bubble w-40 h-40 bg-[#6BCB77] top-[15%] left-[5%]" />
        <div className="bubble w-32 h-32 bg-[#4D96FF] top-[60%] right-[8%]" />
        <div className="bubble w-24 h-24 bg-[#9B59B6] top-[35%] right-[15%]" />
        <div className="bubble w-20 h-20 bg-[#FF8E53] bottom-[20%] left-[12%]" />
        {/* Soft blurred glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#FF6B6B]/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#FEC163]/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-[#6BCB77]/8 blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-bounce-in">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 icon-bubble icon-bubble-coral h-16 w-16 rounded-2xl animate-wiggle">
            <LogIn className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight rainbow-text">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-[#8B7E74] font-medium">
            Sign in to your KinderAssess account 🎒
          </p>
        </div>

        <Card className="card-3d rounded-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-[#3D3028]">Sign In</CardTitle>
            <CardDescription className="text-[#8B7E74]">
              Enter your credentials to access the platform ✨
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

              {/* Demo hint */}
              <Alert className="border-2 border-amber-200 bg-amber-50/80 rounded-xl">
                <Info className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-xs text-[#8B7E74]">
                  <strong className="text-[#3D3028]">Demo:</strong> Use{" "}
                  <code className="rounded-lg bg-amber-100 px-1.5 py-0.5 text-xs font-mono text-amber-700 border border-amber-200">
                    admin@school.com
                  </code>{" "}
                  /{" "}
                  <code className="rounded-lg bg-amber-100 px-1.5 py-0.5 text-xs font-mono text-amber-700 border border-amber-200">
                    admin123
                  </code>{" "}
                  to sign in as admin.
                </AlertDescription>
              </Alert>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#3D3028] font-semibold">Email</Label>
                <Input
                  id="email"
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

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[#3D3028] font-semibold">Password</Label>
                  <button
                    type="button"
                    onClick={() => setCurrentView("forgot-password")}
                    className="text-xs text-[#FF6B6B] hover:text-[#FF8E53] transition-colors font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="input-playful"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full btn-3d bg-[#FF6B6B] text-white hover:bg-[#FF5252] h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center text-sm text-[#8B7E74]">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setCurrentView("register")}
                className="font-bold text-[#FF6B6B] hover:text-[#FF8E53] transition-colors"
              >
                Register 🎉
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
