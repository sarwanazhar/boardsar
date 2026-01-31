"use client";

import { useLogout } from "@/lib/useLogout";

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  className = "", 
  children = "Logout" 
}) => {
  const { handleLogout } = useLogout();

  return (
    <button
      onClick={handleLogout}
      className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ${className}`}
      type="button"
    >
      {children}
    </button>
  );
};