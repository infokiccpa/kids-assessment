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
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Smart Assessment",
    description:
      "AI-powered behavioral analysis that evaluates your child's readiness through intelligent questionnaires and observations.",
  },
  {
    icon: Video,
    title: "Video Analysis",
    description:
      "Short activity videos analyzed by AI to assess attention, sitting tolerance, and instruction-following skills.",
  },
  {
    icon: FileText,
    title: "Instant Reports",
    description:
      "Comprehensive readiness reports with scores, recommendations, and insights delivered instantly after assessment.",
  },
];

export default function LandingPage() {
  const { setCurrentView } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Decorative background shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        {/* Small decorative circles */}
        <div className="absolute top-20 left-1/4 w-3 h-3 rounded-full bg-primary/20" />
        <div className="absolute top-40 right-1/3 w-2 h-2 rounded-full bg-accent/30" />
        <div className="absolute bottom-40 left-1/3 w-4 h-4 rounded-full bg-primary/10" />
        <div className="absolute top-1/2 right-20 w-2 h-2 rounded-full bg-accent/20" />
        {/* Wavy gradient band */}
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-accent/60 to-primary/60"
        />
      </div>

      {/* Header / Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              KinderAssess
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("login")}
              className="text-muted-foreground hover:text-foreground"
            >
              Admin Portal
            </Button>
            <Button
              size="sm"
              onClick={() => setCurrentView("login")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative py-16 sm:py-24 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/60 px-4 py-1.5 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-primary" />
                <span>Safe Educational Assessment Only</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                AI Kindergarten{" "}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
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
                <Button
                  size="lg"
                  onClick={() => setCurrentView("login")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 text-base"
                >
                  Get Started
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentView("register")}
                  className="px-8 text-base"
                >
                  Create Account
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="mt-12 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Privacy Protected</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <Brain className="h-4 w-4 text-primary" />
                  <span>AI-Powered</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>Instant Reports</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                Our platform uses cutting-edge AI to provide accurate,
                comprehensive readiness assessments.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mx-auto max-w-5xl">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="group relative overflow-hidden border-border/50 bg-card hover:border-primary/30 transition-colors duration-300"
                >
                  {/* Decorative corner gradient */}
                  <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-gradient-to-bl from-primary/5 to-transparent" />

                  <CardHeader className="pb-2">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8 sm:p-12 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Ready to Get Started?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Begin the assessment process for your child or access the admin
                portal to manage applications.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button
                  size="lg"
                  onClick={() => setCurrentView("register")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
                >
                  Register as Parent
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentView("login")}
                  className="px-8"
                >
                  Admin Portal
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-muted/30">
        <div className="container mx-auto flex flex-col items-center gap-2 px-4 py-6 sm:flex-row sm:justify-center sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Powered by AI</span>
          </div>
          <span className="hidden sm:inline text-muted-foreground/50">
            &bull;
          </span>
          <span className="text-sm text-muted-foreground">
            Safe Educational Assessment Only
          </span>
        </div>
      </footer>
    </div>
  );
}
