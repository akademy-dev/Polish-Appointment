import { z } from "zod";
import { isValidHour } from "./time-picker-utils";

export const workingTimeSchema = z
  .array(
    z.object({
      from: z.string().refine(isValidHour, {
        message: "Please enter a valid hour",
      }),
      to: z.string().refine(isValidHour, {
        message: "Please enter a valid hour",
      }),
      day: z.string(),
    })
  )
  .refine((value) => value.some((item) => item), {
    message: "You have to select at least one day.",
  });

export const timeOffScheduleFormSchema = z.object({
  date: z.string({
    required_error: "Please select a date",
  }),
  fromTime: z.string({
    required_error: "Please select a time",
  }),
  toTime: z.string({
    required_error: "Please select a time",
  }),
  reason: z.string().min(1, "Please enter a reason"),
});

export const employeeFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.date({
    required_error: "Please select a start date",
  }),
  endDate: z.date().optional(),
  workingTimes: workingTimeSchema,
  timeOffSchedule: timeOffScheduleFormSchema.optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
