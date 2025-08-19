"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import { updateTimeSettings } from "@/lib/actions";
import { toast } from "sonner";

export function TimeSettings({ 
  _id, 
  minTime, 
  maxTime 
}: { 
  _id: string; 
  minTime: string; 
  maxTime: string; 
}) {
  const timeOptions = [
    { value: "6:00 AM", label: "6:00 AM" },
    { value: "6:30 AM", label: "6:30 AM" },
    { value: "7:00 AM", label: "7:00 AM" },
    { value: "7:30 AM", label: "7:30 AM" },
    { value: "8:00 AM", label: "8:00 AM" },
    { value: "8:30 AM", label: "8:30 AM" },
    { value: "9:00 AM", label: "9:00 AM" },
    { value: "9:30 AM", label: "9:30 AM" },
    { value: "10:00 AM", label: "10:00 AM" },
    { value: "10:30 AM", label: "10:30 AM" },
    { value: "11:00 AM", label: "11:00 AM" },
    { value: "11:30 AM", label: "11:30 AM" },
    { value: "12:00 PM", label: "12:00 PM" },
    { value: "12:30 PM", label: "12:30 PM" },
    { value: "1:00 PM", label: "1:00 PM" },
    { value: "1:30 PM", label: "1:30 PM" },
    { value: "2:00 PM", label: "2:00 PM" },
    { value: "2:30 PM", label: "2:30 PM" },
    { value: "3:00 PM", label: "3:00 PM" },
    { value: "3:30 PM", label: "3:30 PM" },
    { value: "4:00 PM", label: "4:00 PM" },
    { value: "4:30 PM", label: "4:30 PM" },
    { value: "5:00 PM", label: "5:00 PM" },
    { value: "5:30 PM", label: "5:30 PM" },
    { value: "6:00 PM", label: "6:00 PM" },
    { value: "6:30 PM", label: "6:30 PM" },
    { value: "7:00 PM", label: "7:00 PM" },
    { value: "7:30 PM", label: "7:30 PM" },
    { value: "8:00 PM", label: "8:00 PM" },
    { value: "8:30 PM", label: "8:30 PM" },
    { value: "9:00 PM", label: "9:00 PM" },
    { value: "9:30 PM", label: "9:30 PM" },
    { value: "10:00 PM", label: "10:00 PM" },
  ];

  const handleMinTimeChange = (newValue: string) => {
    updateTimeSettings(_id, newValue, maxTime).then((res) => {
      if (res.error) {
        toast.error("Error", {
          description: res.error.message || "Failed to update minimum time.",
        });
      } else {
        toast.success("Success", {
          description: "Minimum time updated successfully.",
        });
      }
    });
  };

  const handleMaxTimeChange = (newValue: string) => {
    updateTimeSettings(_id, minTime, newValue).then((res) => {
      if (res.error) {
        toast.error("Error", {
          description: res.error.message || "Failed to update maximum time.",
        });
      } else {
        toast.success("Success", {
          description: "Maximum time updated successfully.",
        });
      }
    });
  };

  return (
    <div className="flex gap-8">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Minimum Time</label>
        <Select value={minTime} onValueChange={handleMinTimeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select minimum time" />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((time) => (
              <SelectItem key={time.value} value={time.value}>
                {time.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Maximum Time</label>
        <Select value={maxTime} onValueChange={handleMaxTimeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select maximum time" />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((time) => (
              <SelectItem key={time.value} value={time.value}>
                {time.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
