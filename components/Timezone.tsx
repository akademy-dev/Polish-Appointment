"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import { updateTimezone } from "@/lib/actions";
import { toast } from "sonner";

export function Timezone({ _id, value }: { _id: string; value: string }) {
  const timezones = [
    { value: "UTC-12", label: "UTC-12:00" },
    { value: "UTC-11", label: "UTC-11:00" },
    { value: "UTC-10", label: "UTC-10:00" },
    { value: "UTC-9", label: "UTC-09:00" },
    { value: "UTC-8", label: "UTC-08:00" },
    { value: "UTC-7", label: "UTC-07:00" },
    { value: "UTC-6", label: "UTC-06:00" },
    { value: "UTC-5", label: "UTC-05:00" },
    { value: "UTC-4", label: "UTC-04:00" },
    { value: "UTC-3", label: "UTC-03:00" },
    { value: "UTC-2", label: "UTC-02:00" },
    { value: "UTC-1", label: "UTC-01:00" },
    { value: "UTC+0", label: "UTC+00:00" },
    { value: "UTC+1", label: "UTC+01:00" },
    { value: "UTC+2", label: "UTC+02:00" },
    { value: "UTC+3", label: "UTC+03:00" },
    { value: "UTC+4", label: "UTC+04:00" },
    { value: "UTC+5", label: "UTC+05:00" },
    { value: "UTC+6", label: "UTC+06:00" },
    { value: "UTC+7", label: "UTC+07:00" },
    { value: "UTC+8", label: "UTC+08:00" },
    { value: "UTC+9", label: "UTC+09:00" },
    { value: "UTC+10", label: "UTC+10:00" },
    { value: "UTC+11", label: "UTC+11:00" },
    { value: "UTC+12", label: "UTC+12:00" },
  ];

  const handleChange = (newValue: string) => {
    // Handle the change event if needed
    updateTimezone(_id, newValue).then((res) => {
      if (res.error) {
        toast.error("Error", {
          description: res.error.message || "Failed to update timezone.",
        });
      } else {
        toast.success("Success", {
          description: "Timezone updated successfully.",
        });
      }
    });
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select Timezone" />
      </SelectTrigger>
      <SelectContent>
        {timezones.map((tz) => (
          <SelectItem key={tz.value} value={tz.value}>
            {tz.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
