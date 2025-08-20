"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";

interface OptimisticStatusProps {
  pendingChanges: number;
  hasErrors: boolean;
}

export const OptimisticStatus: React.FC<OptimisticStatusProps> = ({
  pendingChanges,
  hasErrors,
}) => {
  if (pendingChanges === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        variant={hasErrors ? "destructive" : "secondary"}
        className="flex items-center gap-2 px-3 py-2 shadow-lg"
      >
        {hasErrors ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
        <span>
          {hasErrors 
            ? "Sync failed" 
            : `${pendingChanges} change${pendingChanges > 1 ? 's' : ''} pending`
          }
        </span>
      </Badge>
    </div>
  );
};
