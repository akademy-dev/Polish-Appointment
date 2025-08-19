import React from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { appointmentTimeOffSchema } from "@/lib/validation";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AppointmentTimeOffForm = ({
  form,
  isSubmitting,
  onSubmit,
  selectedEmployee,
}: {
  form: UseFormReturn<z.infer<typeof appointmentTimeOffSchema>>;
  isSubmitting: boolean;
  onSubmit?: () => void;
  selectedEmployee?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}) => {
  // Generate duration options in minutes
  const durationOptions = React.useMemo(() => {
    const options = [];
    for (let min = 15; min <= 480; min += 15) {
      options.push(min);
    }
    // Add "To close" option (representing full day)
    options.push("to_close");
    return options;
  }, []);

  const formatDuration = React.useMemo(() => {
    return (duration: number | string): string => {
      if (duration === "to_close") {
        return "To close";
      }
      const min = duration as number;
      const hr = Math.floor(min / 60);
      const m = min % 60;
      if (hr && m) return `${hr}hr ${m}min`;
      if (hr) return `${hr}hr`;
      return `${m}min`;
    };
  }, []);

  // Ensure default values for recurring fields are set
  React.useEffect(() => {
    const currentRecurringDuration = form.getValues("recurringDuration");
    const currentRecurringFrequency = form.getValues("recurringFrequency");

    if (!currentRecurringDuration || !currentRecurringDuration.unit) {
      form.setValue("recurringDuration", {
        value: currentRecurringDuration?.value || 1,
        unit: "months",
      });
    }

    if (!currentRecurringFrequency || !currentRecurringFrequency.unit) {
      form.setValue("recurringFrequency", {
        value: currentRecurringFrequency?.value || 1,
        unit: "weeks",
      });
    }
  }, [form]);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Schedule Time Off for Employee</h2>

      <FormField
        control={form.control}
        name="duration"
        render={({ field }) => (
          <FormItem>
            <Label htmlFor="duration">Duration</Label>
            <FormControl>
              <Select
                onValueChange={(value) => {
                  if (value === "to_close") {
                    field.onChange("to_close");
                  } else {
                    field.onChange(Number(value));
                  }
                }}
                value={field.value?.toString() || ""}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((duration) => (
                    <SelectItem key={duration} value={duration.toString()}>
                      {formatDuration(duration)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="reason"
        render={({ field }) => (
          <FormItem>
            <Label htmlFor="reason">Reason (Optional)</Label>
            <FormControl>
              <Textarea
                id="reason"
                placeholder="Enter reason for time off..."
                className="resize-none"
                {...field}
                disabled={isSubmitting}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isRecurring"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isSubmitting}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <Label htmlFor="isRecurring" className="text-md">
                Recurring Time Off
              </Label>
            </div>
          </FormItem>
        )}
      />

      {form.watch("isRecurring") && (
        <div className="flex flex-col gap-4 ml-6">
          <FormField
            control={form.control}
            name="recurringDuration"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start">
                  <Label
                    htmlFor="recurringDuration"
                    className="whitespace-nowrap text-md flex items-center pt-1 w-20"
                  >
                    Duration
                  </Label>
                  <div className="flex gap-2 ml-4">
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          field.onChange({
                            value: parseInt(value),
                            unit: field.value?.unit || "months",
                          });
                        }}
                        value={field.value?.value?.toString() || ""}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="1" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 26 }, (_, i) => i + 1).map(
                            (num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          field.onChange({
                            ...field.value,
                            unit: value as "days" | "weeks" | "months",
                          });
                        }}
                        value={field.value?.unit || "months"}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recurringFrequency"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start">
                  <Label
                    htmlFor="recurringFrequency"
                    className="whitespace-nowrap text-md flex items-center pt-1 w-20"
                  >
                    Frequency
                  </Label>
                  <div className="flex gap-2 ml-4">
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          field.onChange({
                            value: parseInt(value),
                            unit: field.value?.unit || "weeks",
                          });
                        }}
                        value={field.value?.value?.toString() || ""}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="1" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 26 }, (_, i) => i + 1).map(
                            (num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          field.onChange({
                            ...field.value,
                            unit: value as "days" | "weeks",
                          });
                        }}
                        value={field.value?.unit || "weeks"}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {onSubmit && (
        <div className="flex justify-start pt-4">
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !selectedEmployee}
          >
            {isSubmitting ? "Scheduling..." : "Schedule Time Off"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AppointmentTimeOffForm;
