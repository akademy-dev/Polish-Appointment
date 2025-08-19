"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updateSMSMessage } from "@/actions/settings";

interface SMSMessageSettingsProps {
  _id: string;
  smsMessage: string;
}

const VARIABLES = [
  { label: "Customer", value: "{Customer}" },
  { label: "Employee", value: "{Employee}" },
  { label: "Service", value: "{Service}" },
  { label: "Date Time", value: "{Date Time}" },
];

export const SMSMessageSettings = ({ _id, smsMessage }: SMSMessageSettingsProps) => {
  const [message, setMessage] = useState(smsMessage);
  const [isUpdating, setIsUpdating] = useState(false);

  const addVariable = (variable: string) => {
    setMessage(prev => prev + variable);
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const result = await updateSMSMessage(_id, message);
      
      if (result.status === "SUCCESS") {
        toast.success("SMS message updated successfully");
      } else {
        toast.error(result.error || "Failed to update SMS message");
      }
    } catch (error) {
      console.error("Error updating SMS message:", error);
      toast.error("Failed to update SMS message");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = () => {
    setMessage(smsMessage);
  };

  return (
    <div className="space-y-4">
        <div className="space-y-2">
          <Label>Available Variables</Label>
          <div className="flex flex-wrap gap-2">
            {VARIABLES.map((variable) => (
              <Button
                key={variable.value}
                variant="outline"
                onClick={() => addVariable(variable.value)}
              >
                {variable.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Message Template</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your SMS message template..."
            className="min-h-[120px]"
          />
          <p className="text-sm text-muted-foreground">
            Use the variables above to personalize your messages. Variables will be replaced with actual data when sending SMS.
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

        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="p-3 bg-gray-50 rounded text-sm">
            <div className="font-medium mb-2">Example with sample data:</div>
            <div className="text-gray-600">
              {message
                .replace(/{Customer}/g, "John Doe")
                .replace(/{Employee}/g, "Jane Smith")
                .replace(/{Service}/g, "Nail Polish")
                .replace(/{Date Time}/g, "2024-01-15 2:30 PM")}
            </div>
          </div>
        </div>
    </div>
  );
};
