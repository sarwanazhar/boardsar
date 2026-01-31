import { useRouter } from "next/navigation";
import { useAuthStore } from "./store";

export const useLogout = () => {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      // Call the logout API to clear the cookie
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // Clear client state
        logout();
        
        // Redirect to login page
        router.push("/login");
      } else {
        console.error("Logout API failed");
        // Still clear client state even if API fails
        logout();
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Clear client state even if there's an error
      logout();
      router.push("/login");
    }
  };

  return { handleLogout };
};