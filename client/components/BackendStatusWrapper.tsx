"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import LoadingScreen from "./LoadingScreen";
import CheckingScreen from "./CheckingScreen";

type BackendStatus = "checking" | "online" | "offline";

export function useBackendStatus() {
  const [status, setStatus] = useState<BackendStatus>("checking");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    let interval: NodeJS.Timeout;

    const check = async () => {
      try {
        const res = await api.get("/health");

        if (res.status === 200) {
          setStatus("online");
          clearInterval(interval);
        } else {
          setStatus("offline");
        }
      } catch {
        setStatus("offline");
      }
    };

    check();
    interval = setInterval(check, 4000);

    return () => clearInterval(interval);
  }, []);

  return { status, isClient };
}

interface BackendStatusWrapperProps {
  children: React.ReactNode;
}

export default function BackendStatusWrapper({ children }: BackendStatusWrapperProps) {
  const { status, isClient } = useBackendStatus();

  // Only render the loading state on the client side to prevent hydration mismatch
  if (!isClient || status !== "online") {
    return (
      <div className="relative h-screen">
        {status === "checking" ? (
          <CheckingScreen />
        ) : (
          <LoadingScreen />
        )}
      </div>
    );
  }

  return <>{children}</>;
}
