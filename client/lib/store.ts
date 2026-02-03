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

          if (response.user && response.token) {
            localStorage.setItem('token', response.token);
            set({
              user: response.user,
              isLoading: false,
              error: null,
            });
            return true;
          } else if (response.user) {
            // If only user is returned, assume token is in localStorage already
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
        localStorage.removeItem('token');
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

  const initAuth = async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return false;
    }

    try {
      const profile = await authAPI.getProfile();
      console.log('Auth profile:', profile);
      setUser(profile);
      return true;
    } catch (error: any) {
      console.error('Auth error:', error);
      localStorage.removeItem('token');
      setUser(null);
      return false;
    }
  };

  return { initAuth };
};
