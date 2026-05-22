"use client";

import { useAppStore } from "@/store/app-store";
import LandingPage from "@/components/shared/landing";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import ForgotPassword from "@/components/auth/forgot-password";
import AdminDashboard from "@/components/admin/admin-dashboard";
import StudentDetail from "@/components/admin/student-detail";
import ParentDashboard from "@/components/parent/parent-dashboard";
import RegistrationForm from "@/components/parent/registration-form";
import Questionnaire from "@/components/parent/questionnaire";
import VideoTasks from "@/components/parent/video-tasks";
import Review from "@/components/parent/review";
import Results from "@/components/parent/results";

export default function Home() {
  const { currentView, isAuthenticated, user } = useAppStore();

  // Auth views (no auth required)
  if (currentView === "landing") return <LandingPage />;
  if (currentView === "login") return <LoginForm />;
  if (currentView === "register") return <RegisterForm />;
  if (currentView === "forgot-password") return <ForgotPassword />;

  // Protected views - show landing if not authenticated
  if (!isAuthenticated || !user) {
    return <LandingPage />;
  }

  // Parent views
  if (currentView === "parent-dashboard") return <ParentDashboard />;
  if (currentView === "parent-registration") return <RegistrationForm />;
  if (currentView === "parent-questionnaire") return <Questionnaire />;
  if (currentView === "parent-videos") return <VideoTasks />;
  if (currentView === "parent-review") return <Review />;
  if (currentView === "parent-results") return <Results />;

  // Admin views
  if (currentView === "admin-dashboard") return <AdminDashboard />;
  if (currentView === "admin-students") return <AdminDashboard />;
  if (currentView === "admin-student-detail") return <StudentDetail />;

  // Admin settings placeholder
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

  // Fallback to landing
  return <LandingPage />;
}
