"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Trash2, RefreshCw } from "lucide-react";

interface OptimisticDebugProps {
  changes: Array<{
    id: string;
    type?: string;
    action: string;
    timestamp: number;
  }>;
  onClearChanges?: () => void;
  onRefresh?: () => void;
}

export const OptimisticDebug: React.FC<OptimisticDebugProps> = ({
  changes,
  onClearChanges,
  onRefresh,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (changes.length === 0) {
    return null;
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="fixed bottom-4 left-4 z-50 w-80">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {changes.length} pending
            </Badge>
            Optimistic Updates
          </CardTitle>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
            {onClearChanges && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearChanges}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronUp className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {changes.map((change, index) => (
              <div
                key={`${change.id}-${change.timestamp}`}
                className="flex items-center justify-between text-xs p-2 bg-muted rounded"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      change.action === "add"
                        ? "default"
                        : change.action === "delete"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {change.action}
                  </Badge>
                  <span className="font-mono text-xs">
                    {change.id.slice(0, 8)}...
                  </span>
                </div>
                <span className="text-muted-foreground text-xs">
                  {formatTime(change.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
