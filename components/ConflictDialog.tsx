"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, Clock, User, Ban, Clock3 } from "lucide-react";
import moment from "moment-timezone";
import { getIanaTimezone } from "@/lib/utils";

interface Conflict {
  _id: string;
  startTime: string;
  endTime: string;
  duration: number;
  customer: {
    _id: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
  service: {
    _id: string;
    name: string;
    duration: number;
  };
  status: string;
  type?: "appointment" | "working_time" | "time_off";
}

interface ConflictOccurrence {
  occurrence: number;
  startTime: string;
  endTime: string;
  conflicts: Conflict[];
}

interface ConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: ConflictOccurrence[];
  timezone: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConflictDialog({
  open,
  onOpenChange,
  conflicts,
  timezone,
  onConfirm,
  onCancel,
}: ConflictDialogProps) {
  const formatDateTime = (dateTime: string) => {
    return moment.tz(dateTime, getIanaTimezone(timezone)).format("MMM DD, YYYY h:mm A");
  };

  const formatTime = (dateTime: string) => {
    return moment.tz(dateTime, getIanaTimezone(timezone)).format("h:mm A");
  };

  const totalConflicts = conflicts.reduce((total, occurrence) => total + occurrence.conflicts.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Scheduling Conflicts Detected
          </DialogTitle>
          <DialogDescription>
            The following {totalConflicts} conflict{totalConflicts !== 1 ? 's' : ''} were found with your recurring schedule (including existing appointments, working hours, and time off):
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {conflicts.map((occurrence, index) => (
            <div key={index} className="border rounded-lg p-4 bg-red-50">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-red-600" />
                <span className="font-semibold text-red-800">
                  Occurrence #{occurrence.occurrence}
                </span>
                <span className="text-sm text-gray-600">
                  ({formatDateTime(occurrence.startTime)} - {formatTime(occurrence.endTime)})
                </span>
              </div>

              <div className="space-y-2">
                {occurrence.conflicts.map((conflict) => {
                  const getConflictIcon = () => {
                    switch (conflict.type) {
                      case "working_time":
                        return <Ban className="w-4 h-4 text-orange-600" />;
                      case "time_off":
                        return <Clock3 className="w-4 h-4 text-blue-600" />;
                      default:
                        return <User className="w-4 h-4 text-red-600" />;
                    }
                  };

                  const getConflictColor = () => {
                    switch (conflict.type) {
                      case "working_time":
                        return "border-orange-200 bg-orange-50";
                      case "time_off":
                        return "border-blue-200 bg-blue-50";
                      default:
                        return "border-red-200 bg-red-50";
                    }
                  };

                  const getConflictTitle = () => {
                    switch (conflict.type) {
                      case "working_time":
                        return "Working Time Conflict";
                      case "time_off":
                        return "Time Off Conflict";
                      default:
                        return "Appointment Conflict";
                    }
                  };

                  return (
                    <div key={conflict._id} className={`bg-white rounded p-3 border ${getConflictColor()}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getConflictIcon()}
                            <span className="font-medium text-sm">
                              {getConflictTitle()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="font-medium">
                              {conflict.customer.fullName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-600">
                              {formatTime(conflict.startTime)} - {formatTime(conflict.endTime)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {conflict.service.name} ({conflict.duration} min)
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {conflict.status}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Create Anyway
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
