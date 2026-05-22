"use client";

import { useAppStore } from "@/store/app-store";
import LandingPage from "@/components/shared/landing";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import ForgotPassword from "@/components/auth/forgot-password";
import ParentHeader from "@/components/shared/parent-header";
import AdminDashboard from "@/components/admin/admin-dashboard";
import StudentDetail from "@/components/admin/student-detail";
import ParentDashboard from "@/components/parent/parent-dashboard";
import RegistrationForm from "@/components/parent/registration-form";
import Questionnaire from "@/components/parent/questionnaire";
import VideoTasks from "@/components/parent/video-tasks";
import Review from "@/components/parent/review";
import Results from "@/components/parent/results";
import { Sparkles } from "lucide-react";

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
];

export default function Home() {
  const { currentView, isAuthenticated, user } = useAppStore();

  // Auth views (no auth required, standalone)
  if (currentView === "landing") return <LandingPage />;
  if (currentView === "login") return <LoginForm />;
  if (currentView === "register") return <RegisterForm />;
  if (currentView === "forgot-password") return <ForgotPassword />;

  // Protected views - show landing if not authenticated
  if (!isAuthenticated || !user) {
    return <LandingPage />;
  }

  // Admin views (have their own layout with sidebar)
  if (currentView === "admin-dashboard") return <AdminDashboard />;
  if (currentView === "admin-students") return <AdminDashboard />;
  if (currentView === "admin-student-detail") return <StudentDetail />;
  if (currentView === "admin-settings") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-bold text-foreground">
            Admin Settings
          </h1>
          <p className="text-muted-foreground">
            Settings page is coming soon.
          </p>
        </div>
      </div>
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Parent Header */}
      <ParentHeader />

      {/* Main Content */}
      <main className="flex-1">{renderParentContent()}</main>

      {/* Sticky Footer */}
      <footer className="mt-auto border-t bg-muted/30">
        <div className="container mx-auto flex flex-col items-center gap-2 px-4 py-4 sm:flex-row sm:justify-center sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Powered by AI</span>
          </div>
          <span className="hidden sm:inline text-muted-foreground/50">
            &bull;
          </span>
          <span className="text-xs text-muted-foreground">
            Safe Educational Assessment Only &mdash; Not a Medical Diagnosis
          </span>
        </div>
      </footer>
    </div>
  );
}
