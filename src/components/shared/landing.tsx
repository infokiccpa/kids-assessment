"use client";

import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain,
  Video,
  FileText,
  Shield,
  Sparkles,
  ChevronRight,
  Star,
  Heart,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Smart Assessment",
    description:
      "AI-powered behavioral analysis that evaluates your child's readiness through intelligent questionnaires and observations.",
    colorClass: "icon-bubble-coral",
    cardBg: "bg-playful-card-coral",
    numberColor: "bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] text-white",
  },
  {
    icon: Video,
    title: "Video Analysis",
    description:
      "Short activity videos analyzed by AI to assess attention, sitting tolerance, and instruction-following skills.",
    colorClass: "icon-bubble-purple",
    cardBg: "bg-playful-card-purple",
    numberColor: "bg-gradient-to-br from-[#9B59B6] to-[#8E44AD] text-white",
  },
  {
    icon: FileText,
    title: "Instant Reports",
    description:
      "Comprehensive readiness reports with scores, recommendations, and insights delivered instantly after assessment.",
    colorClass: "icon-bubble-green",
    cardBg: "bg-playful-card-green",
    numberColor: "bg-gradient-to-br from-[#6BCB77] to-[#27AE60] text-white",
  },
];

export default function LandingPage() {
  const { setCurrentView } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col bg-playful-warm">
      {/* ===== Decorative background shapes ===== */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Large soft blobs */}
        <div className="bubble w-72 h-72 bg-[#FF6B6B] -top-20 -right-16" />
        <div className="bubble w-64 h-64 bg-[#9B59B6] top-1/3 -left-24" />
        <div className="bubble w-56 h-56 bg-[#6BCB77] -bottom-16 right-1/4" />
        <div className="bubble w-48 h-48 bg-[#FEC163] top-2/3 right-10" />
        <div className="bubble w-40 h-40 bg-[#4D96FF] bottom-1/4 left-1/4" />

        {/* Floating stars / sparkles */}
        <div className="absolute top-24 left-[15%] text-[#FEC163] opacity-20 animate-bounce-in" style={{ animationDelay: "0s" }}>
          <Star className="w-5 h-5" fill="currentColor" />
        </div>
        <div className="absolute top-40 right-[20%] text-[#FF6B6B] opacity-20 animate-bounce-in" style={{ animationDelay: "0.5s" }}>
          <Star className="w-4 h-4" fill="currentColor" />
        </div>
        <div className="absolute top-[60%] left-[10%] text-[#9B59B6] opacity-20 animate-bounce-in" style={{ animationDelay: "1s" }}>
          <Star className="w-6 h-6" fill="currentColor" />
        </div>
        <div className="absolute bottom-32 right-[15%] text-[#6BCB77] opacity-20 animate-bounce-in" style={{ animationDelay: "1.5s" }}>
          <Star className="w-5 h-5" fill="currentColor" />
        </div>
        <div className="absolute top-1/2 left-1/2 text-[#4D96FF] opacity-15 animate-bounce-in" style={{ animationDelay: "0.8s" }}>
          <Heart className="w-4 h-4" fill="currentColor" />
        </div>

        {/* Small decorative dots */}
        <div className="absolute top-20 left-1/4 w-3 h-3 rounded-full bg-[#FF6B6B]/25" />
        <div className="absolute top-40 right-1/3 w-2 h-2 rounded-full bg-[#9B59B6]/30" />
        <div className="absolute bottom-40 left-1/3 w-4 h-4 rounded-full bg-[#6BCB77]/20" />
        <div className="absolute top-1/2 right-20 w-2 h-2 rounded-full bg-[#FEC163]/30" />
        <div className="absolute top-72 left-16 w-3 h-3 rounded-full bg-[#4D96FF]/25" />
        <div className="absolute bottom-60 right-32 w-2 h-2 rounded-full bg-[#FF6B6B]/20" />

        {/* Rainbow top bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 divider-rainbow" />
      </div>

      {/* ===== Header / Navigation ===== */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-[#FF6B6B]/10 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 animate-wiggle">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground">
              Kinder<span className="text-[#FF6B6B]">Assess</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("login")}
              className="text-muted-foreground hover:text-foreground rounded-xl"
            >
              Admin Portal
            </Button>
            <button
              onClick={() => setCurrentView("login")}
              className="btn-3d bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white px-5 py-2 text-sm rounded-xl"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* ===== Hero Section ===== */}
      <main className="flex-1">
        <section className="relative py-16 sm:py-24 lg:py-32 bg-playful-hero overflow-hidden">
          {/* Hero floating decorations */}
          <div className="absolute top-10 left-8 w-16 h-16 rounded-full bg-[#FEC163]/15 blur-sm" />
          <div className="absolute top-20 right-12 w-20 h-20 rounded-full bg-[#9B59B6]/10 blur-sm" />
          <div className="absolute bottom-16 left-1/4 w-24 h-24 rounded-full bg-[#6BCB77]/10 blur-sm" />
          <div className="absolute bottom-10 right-1/3 w-14 h-14 rounded-full bg-[#4D96FF]/12 blur-sm" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="mx-auto max-w-3xl text-center">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/80 border-2 border-[#6BCB77]/30 px-5 py-2 text-sm text-muted-foreground shadow-sm badge-3d">
                <Shield className="h-4 w-4 text-[#6BCB77]" />
                <span>Safe Educational Assessment Only</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-bounce-in">
                AI Kindergarten{" "}
                <span className="rainbow-text">
                  Readiness
                </span>{" "}
                Assessment
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                A smart, AI-powered admission assessment platform that evaluates
                children&apos;s readiness for kindergarten through interactive
                questionnaires, video-based analysis, and instant comprehensive
                reports.
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <button
                  onClick={() => setCurrentView("login")}
                  className="btn-3d bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white px-8 py-3 text-base rounded-xl flex items-center gap-1.5"
                >
                  Get Started
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentView("register")}
                  className="btn-3d-purple bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] text-white px-8 py-3 text-base rounded-xl flex items-center gap-1.5"
                >
                  Create Account
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>

              {/* Trust indicators */}
              <div className="mt-12 flex items-center justify-center gap-4 sm:gap-6 text-sm flex-wrap">
                <div className="flex items-center gap-1.5 bg-white/70 rounded-full px-4 py-1.5 border border-[#6BCB77]/20">
                  <Shield className="h-4 w-4 text-[#6BCB77]" />
                  <span className="text-muted-foreground font-medium">Privacy Protected</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/70 rounded-full px-4 py-1.5 border border-[#9B59B6]/20">
                  <Brain className="h-4 w-4 text-[#9B59B6]" />
                  <span className="text-muted-foreground font-medium">AI-Powered</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/70 rounded-full px-4 py-1.5 border border-[#4D96FF]/20">
                  <FileText className="h-4 w-4 text-[#4D96FF]" />
                  <span className="text-muted-foreground font-medium">Instant Reports</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rainbow divider between sections */}
        <div className="divider-rainbow w-full" />

        {/* ===== Feature Cards ===== */}
        <section className="py-16 sm:py-24 bg-playful-warm relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-10 right-10 w-20 h-20 rounded-full bg-[#FEC163]/8 blur-lg" />
          <div className="absolute bottom-10 left-10 w-24 h-24 rounded-full bg-[#9B59B6]/6 blur-lg" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="mx-auto max-w-2xl text-center mb-14">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border-2 border-[#FEC163]/30 px-5 py-2 text-sm text-muted-foreground shadow-sm badge-3d mb-4">
                <Star className="h-4 w-4 text-[#FEC163]" fill="currentColor" />
                <span>Simple 3-Step Process</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                How It <span className="rainbow-text">Works</span>
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                Our platform uses cutting-edge AI to provide accurate,
                comprehensive readiness assessments.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mx-auto max-w-5xl">
              {features.map((feature, index) => (
                <Card
                  key={feature.title}
                  className={`card-3d group relative overflow-hidden bg-card ${feature.cardBg} animate-bounce-in`}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {/* Decorative corner blob */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-gradient-to-tr from-white/20 to-transparent" />

                  <CardHeader className="pb-2 relative z-10">
                    <div className="mb-3 flex items-center gap-3">
                      <div className={`icon-bubble ${feature.colorClass} h-14 w-14 animate-wiggle`}>
                        <feature.icon className="h-7 w-7" />
                      </div>
                      <span className={`number-pop ${feature.numberColor}`}>
                        {index + 1}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Rainbow divider between sections */}
        <div className="divider-rainbow w-full" />

        {/* ===== CTA Section ===== */}
        <section className="py-16 sm:py-24 bg-playful-hero relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-8 left-12 w-16 h-16 rounded-full bg-[#FF6B6B]/10 blur-md" />
          <div className="absolute bottom-12 right-16 w-20 h-20 rounded-full bg-[#4D96FF]/10 blur-md" />
          <div className="absolute top-1/2 left-1/3 w-12 h-12 rounded-full bg-[#FEC163]/10 blur-md" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="mx-auto max-w-2xl rounded-3xl p-1.5 bg-gradient-to-r from-[#FF6B6B] via-[#9B59B6] to-[#4D96FF]">
              <div className="rounded-[1.35rem] bg-white p-8 sm:p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] text-white mb-4 shadow-lg">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  Ready to Get <span className="rainbow-text">Started</span>?
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Begin the assessment process for your child or access the admin
                  portal to manage applications.
                </p>
                <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <button
                    onClick={() => setCurrentView("register")}
                    className="btn-3d-green bg-gradient-to-r from-[#6BCB77] to-[#27AE60] text-white px-8 py-3 rounded-xl flex items-center gap-1.5"
                  >
                    Register as Parent
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentView("login")}
                    className="btn-3d bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white px-8 py-3 rounded-xl flex items-center gap-1.5"
                  >
                    Admin Portal
                    <Shield className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="mt-auto relative">
        <div className="divider-rainbow w-full" />
        <div className="bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto flex flex-col items-center gap-3 px-4 py-8 sm:flex-row sm:justify-center sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold">Powered by AI</span>
            </div>
            <span className="hidden sm:inline text-muted-foreground/30 text-lg">
              &#x2022;
            </span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-[#6BCB77]" />
              <span>Safe Educational Assessment Only</span>
            </div>
            <span className="hidden sm:inline text-muted-foreground/30 text-lg">
              &#x2022;
            </span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 text-[#FF6B6B]" fill="currentColor" />
              <span>Made with care for little learners</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
