import { z } from "zod";

export const employeeFormSchema = z.object({
  name: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  role: z.string({
    required_error: "Please select a role.",
  }),
  workingTimeSchedule: z.object({
    from: z.string().min(1, "From is required").max(20, "From is too long"),
    to: z.string().min(1, "To is required").max(20, "To is too long"),
    days: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: "You have to select at least one day.",
    }),
  }),
});

export const clientFormSchema = z.object({
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
});
