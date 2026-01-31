import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "./api";

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login(email, password);
          console.log('Login response:', response);

          if (response.user) {
            set({
              user: response.user,
              isLoading: false,
              error: null,
            });
            return true;
          } else if (response.token && response.user) {
            // Handle case where response has both token and user
            set({
              user: response.user,
              isLoading: false,
              error: null,
            });
            return true;
          }
        } catch (err: any) {
          console.error('Login error:', err);
          console.error('Login error response:', err.response);
          set({
            error: err.response?.data?.error || "Login failed",
            isLoading: false,
          });
        }
        return false;
      },

      register: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          await authAPI.register(email, password);
          set({ isLoading: false });
        } catch (err: any) {
          set({
            error: err.response?.data?.error || "Registration failed",
            isLoading: false,
          });
        }
      },

      logout: () => {
        set({ user: null, error: null });
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user) => {
        set({ user });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);

export const useInitAuth = () => {
  const { setUser } = useAuthStore();

  const initAuth = async () => {
    try {
      const profile = await authAPI.getProfile();
      console.log('Auth profile:', profile);
      setUser(profile);
    } catch (error: any) {
      console.error('Auth error:', error);
      console.error('Auth error response:', error.response);
      setUser(null); // Ensure null on failure
    }
  };

  return { initAuth };
};
