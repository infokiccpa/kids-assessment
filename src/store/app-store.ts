import { create } from "zustand";

// View types for SPA navigation
export type AppView =
  | "landing"
  | "login"
  | "register"
  | "forgot-password"
  | "parent-dashboard"
  | "parent-registration"
  | "parent-questionnaire"
  | "parent-videos"
  | "parent-review"
  | "parent-results"
  | "admin-dashboard"
  | "admin-students"
  | "admin-student-detail"
  | "admin-settings"
  | "admin-platforms";

interface AppState {
  // Navigation
  currentView: AppView;
  setCurrentView: (view: AppView) => void;

  // Auth
  user: { id: string; email: string; name: string; role: string } | null;
  setUser: (user: AppState["user"]) => void;
  isAuthenticated: boolean;

  // Selected student for admin detail view
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;

  // Registration step tracking
  registrationStep: number;
  setRegistrationStep: (step: number) => void;

  // Current student being assessed (parent side)
  currentStudentId: string | null;
  setCurrentStudentId: (id: string | null) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Notifications
  notifications: {
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
  }[];
  setNotifications: (notifications: AppState["notifications"]) => void;
  addNotification: (
    notification: Omit<AppState["notifications"][0], "id">
  ) => void;

  // Logout
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: "landing",
  setCurrentView: (view) => set({ currentView: view }),

  user: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  isAuthenticated: false,

  selectedStudentId: null,
  setSelectedStudentId: (id) => set({ selectedStudentId: id }),

  registrationStep: 1,
  setRegistrationStep: (step) => set({ registrationStep: step }),

  currentStudentId: null,
  setCurrentStudentId: (id) => set({ currentStudentId: id }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        { ...notification, id: `notif-${Date.now()}` },
        ...state.notifications,
      ],
    })),

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("kinder_assess_last_view");
    }
    set({
      user: null,
      isAuthenticated: false,
      currentView: "landing",
      selectedStudentId: null,
      currentStudentId: null,
      registrationStep: 1,
    });
  },
}));
