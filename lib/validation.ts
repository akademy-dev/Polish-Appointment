import { z } from "zod";

export const workingTimeSchema = z
  .array(
    z.object({
      from: z.string(),
      to: z.string(),
      day: z.string(),
    }),
  )
  .refine((value) => value.some((item) => item), {
    message: "You have to select at least one day.",
  });

export const timeOffScheduleFormSchema = z.array(
  z.object({
    date: z.date().optional(),
    from: z.string(),
    to: z.string(),
    reason: z.string({
      required_error: "Please enter a reason",
    }),
    dayOfWeek: z
      .array(z.number().min(1).max(7))
      //check if the days are unique
      .refine((value) => new Set(value).size === value.length, {
        message: "Please select unique days",
      })
      .optional(),
    dayOfMonth: z
      .array(z.number().min(1).max(31))
      .refine((value) => new Set(value).size === value.length, {
        message: "Please select unique days",
      })
      .optional(),
    period: z.enum(["Exact", "Daily", "Weekly", "Monthly"]),
  }),
);

export const employeeFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .refine(
      (value) => /^[+]{1}(?:[0-9-()/.]\s?){6,15}[0-9]{1}$/.test(value),
      "Please enter a valid phone number",
    ),
  position: z.string({
    required_error: "Please select a position",
  }),
  workingTimes: workingTimeSchema,
  timeOffSchedule: timeOffScheduleFormSchema.optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const appointmentFormSchema = z.object({
  firstName: z.string().min(1, { message: "First name cannot be empty." }),
  lastName: z.string().min(1, { message: "Last name cannot be empty." }),
  phone: z
    .string()
    .refine(
      (value) => /^[+]{1}(?:[0-9-()/.]\s?){6,15}[0-9]{1}$/.test(value),
      "Please enter a valid phone number",
    ),
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
