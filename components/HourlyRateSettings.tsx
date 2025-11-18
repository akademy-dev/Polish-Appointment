"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { updateHourlyRate } from "@/lib/actions";
import { toast } from "sonner";

export function HourlyRateSettings({
  _id,
  hourlyRate,
}: {
  _id: string;
  hourlyRate?: number;
}) {
  const [rate, setRate] = useState(hourlyRate?.toString() || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const result = await updateHourlyRate(
        _id,
        rate ? parseFloat(rate) : undefined
      );

      if (result.status === "SUCCESS") {
        toast.success("Hourly rate updated successfully");
      } else {
        toast.error(result.error || "Failed to update hourly rate");
      }
    } catch (error) {
      console.error("Error updating hourly rate:", error);
      toast.error("Failed to update hourly rate");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = () => {
    setRate(hourlyRate?.toString() || "");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Default Hourly Rate ($)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          placeholder="Enter default hourly rate"
          className="max-w-xs"
        />
        <p className="text-sm text-muted-foreground">
          This rate will be used as the default when creating new time tracking
          entries.
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
