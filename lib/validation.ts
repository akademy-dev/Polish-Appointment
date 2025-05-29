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
    }),
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

export const appointmentFormSchema = z.object({
  firstName: z.string().min(1, { message: "First name cannot be empty." }),
  lastName: z.string().min(1, { message: "Last name cannot be empty." }),
  phone: z
    .string()
    .regex(/^\+?[0-9\s]+$/, {
      message: "Phone number must be a valid format.",
    })
    .min(1, { message: "Phone number cannot be empty." })
    .min(10, {
      message: "Phone number must be at least 10 characters.",
    })
    .max(15, {
      message: "Phone number must be at most 15 characters.",
    }),
  time: z.date({
    required_error: "Please select a time",
  }),
  staff: z.string().refine((value) => value !== "", {
    message: "Please select a staff member",
  }),
  note: z.string().optional(),
  reminder: z.boolean().optional(),
  services: z
    .array(
      z.object({
        type: z.string(),
        name: z.string(),
        cost: z.string(),
        date: z.date(),
        duration: z.number(),
        order: z.number(),
      }),
    )
    .min(1, { message: "Please select at least one service." }),
});
