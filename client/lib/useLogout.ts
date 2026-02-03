import { useRouter } from "next/navigation";
import { useAuthStore } from "./store";

export const useLogout = () => {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    // Simply clear the token from localStorage and redirect
    logout();
    router.push("/login");
  };

  return { handleLogout };
};