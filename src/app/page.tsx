"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import LandingPage from "@/components/shared/landing";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import ForgotPassword from "@/components/auth/forgot-password";
import ParentHeader from "@/components/shared/parent-header";
import AdminDashboard from "@/components/admin/admin-dashboard";
import AdminApplications from "@/components/admin/admin-applications";
import AdminSettings from "@/components/admin/admin-settings";
import AdminPlatforms from "@/components/admin/admin-platforms";
import StudentDetail from "@/components/admin/student-detail";
import ParentDashboard from "@/components/parent/parent-dashboard";
import RegistrationForm from "@/components/parent/registration-form";
import Questionnaire from "@/components/parent/questionnaire";
import VideoTasks from "@/components/parent/video-tasks";
import Review from "@/components/parent/review";
import Results from "@/components/parent/results";
import AdminLayout from "@/components/admin/admin-layout";
import Image from "next/image";
import { Heart, Loader2 } from "lucide-react";

// Views that should use the parent layout (header + footer)
const PARENT_VIEWS = [
  "parent-dashboard",
  "parent-registration",
  "parent-questionnaire",
  "parent-videos",
  "parent-review",
  "parent-results",
];

// Views that use their own layout (no header/footer)
const STANDALONE_VIEWS = [
  "landing",
  "login",
  "register",
  "forgot-password",
  "admin-dashboard",
  "admin-students",
  "admin-student-detail",
  "admin-settings",
  "admin-platforms",
];

export default function Home() {
  const { currentView, isAuthenticated, user, setUser, setCurrentView } = useAppStore();
  const [checkingSession, setCheckingSession] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        if (session?.user) {
          setUser({
            id: session.user.id as string,
            email: session.user.email as string,
            name: session.user.name as string,
            role: (session.user.role as string) || "PARENT",
          });
          
          // Restore exact last view or fallback to dashboard based on role
          const lastView = localStorage.getItem("kinder_assess_last_view");
          const allowedViews = session.user.role === "ADMIN"
            ? ["admin-dashboard", "admin-students", "admin-student-detail", "admin-settings", "admin-platforms"]
            : ["parent-dashboard", "parent-registration", "parent-questionnaire", "parent-videos", "parent-review", "parent-results"];
            
          if (lastView && allowedViews.includes(lastView)) {
            setCurrentView(lastView as any);
          } else {
            setCurrentView(session.user.role === "ADMIN" ? "admin-dashboard" : "parent-dashboard");
          }
        }
      } catch (err) {
        console.error("Failed to restore session", err);
      } finally {
        setCheckingSession(false);
      }
    };
    restoreSession();
  }, [setUser, setCurrentView]);

  // Persist currentView to localStorage whenever it changes
  useEffect(() => {
    if (isAuthenticated && currentView) {
      localStorage.setItem("kinder_assess_last_view", currentView);
    }
  }, [currentView, isAuthenticated]);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-playful-warm">
        <div className="flex flex-col items-center gap-3 animate-bounce-in">
          <div className="icon-bubble icon-bubble-coral h-20 w-20 animate-sparkle">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
          <p className="text-muted-foreground font-semibold mt-2 text-lg rainbow-text">Restoring session...</p>
        </div>
      </div>
    );
  }

  // Auth views (no auth required, standalone)
  if (currentView === "landing") return <LandingPage />;
  if (currentView === "login") return <LoginForm />;
  if (currentView === "register") return <RegisterForm />;
  if (currentView === "forgot-password") return <ForgotPassword />;

  // Protected views - show landing if not authenticated
  if (!isAuthenticated || !user) {
    return <LandingPage />;
  }

  // Admin views
  if (currentView === "admin-dashboard") return <AdminDashboard />;
  if (currentView === "admin-students") {
    return (
      <AdminLayout activeView="admin-students">
        <AdminApplications />
      </AdminLayout>
    );
  }
  if (currentView === "admin-student-detail") return <StudentDetail />;
  if (currentView === "admin-settings") {
    return (
      <AdminLayout activeView="admin-settings">
        <AdminSettings />
      </AdminLayout>
    );
  }
  if (currentView === "admin-platforms") {
    return (
      <AdminLayout activeView="admin-platforms">
        <AdminPlatforms />
      </AdminLayout>
    );
  }

  // Parent views - wrapped in consistent layout with header and footer
  const renderParentContent = () => {
    switch (currentView) {
      case "parent-dashboard":
        return <ParentDashboard />;
      case "parent-registration":
        return <RegistrationForm />;
      case "parent-questionnaire":
        return <Questionnaire />;
      case "parent-videos":
        return <VideoTasks />;
      case "parent-review":
        return <Review />;
      case "parent-results":
        return <Results />;
      default:
        return <ParentDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-playful-warm">
      {/* Parent Header */}
      <ParentHeader />

      {/* Main Content */}
      <main className="flex-1">{renderParentContent()}</main>

      {/* Sticky Footer */}
      <footer className="mt-auto bg-white/80 backdrop-blur-sm">
        <div className="divider-rainbow" />
        <div className="container mx-auto flex flex-col items-center gap-2 px-4 py-4 sm:flex-row sm:justify-center sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Image src="/kam-logo.png" alt="Kam Global AI" width={20} height={20} className="animate-sparkle" />
            <span>Powered by Kam Global AI</span>
          </div>
          <span className="hidden sm:inline text-muted-foreground/50">
            &bull;
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="h-3 w-3 text-[#FF6B6B] fill-[#FF6B6B]" />
            Safe Educational Assessment Only &mdash; Not a Medical Diagnosis
          </span>
        </div>
      </footer>
    </div>
  );
}
