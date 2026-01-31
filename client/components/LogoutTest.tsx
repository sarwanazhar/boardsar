"use client";

import { useState } from "react";
import { useLogout } from "@/lib/useLogout";
import { useAuthStore } from "@/lib/store";

export const LogoutTest: React.FC = () => {
  const { user } = useAuthStore();
  const { handleLogout } = useLogout();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleTestLogout = async () => {
    setIsLoggingOut(true);
    try {
      await handleLogout();
    } catch (error) {
      console.error("Test logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h2 className="text-white text-lg font-bold mb-4">Logout Test</h2>
      <div className="mb-4">
        <p className="text-white/80">Current user: {user?.email || "Not logged in"}</p>
      </div>
      <div className="flex gap-4">
        <button
          onClick={handleTestLogout}
          disabled={isLoggingOut}
          className={`px-4 py-2 rounded-md ${
            isLoggingOut
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          } text-white transition-colors`}
        >
          {isLoggingOut ? "Logging out..." : "Test Logout"}
        </button>
        <button
          onClick={() => {
            // Simulate manual logout for comparison
            useAuthStore.getState().logout();
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          Manual Logout (Store Only)
        </button>
      </div>
      <div className="mt-4 text-sm text-white/60">
        <p>• Test Logout: Calls API + clears store + redirects</p>
        <p>• Manual Logout: Only clears store (for comparison)</p>
      </div>
    </div>
  );
};