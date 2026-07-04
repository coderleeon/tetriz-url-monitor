import React from "react";
import { CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

interface StatusBadgeProps {
  isUp: boolean | null;
}

export function StatusBadge({ isUp }: StatusBadgeProps) {
  if (isUp === null) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
        <HelpCircle className="w-3.5 h-3.5 mr-1" />
        PENDING
      </span>
    );
  }

  if (isUp) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="relative flex h-2 w-2 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
        UP
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
      <span className="relative flex h-2 w-2 mr-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
      </span>
      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
      DOWN
    </span>
  );
}
