"use client";

import { useOffline } from "next/offline";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 bg-destructive px-4 py-1.5 text-center text-xs font-medium text-background"
    >
      <WifiOff className="-mt-0.5 mr-1 inline size-3.5" aria-hidden />
      Sin conexión — mostrando última información disponible
    </div>
  );
}