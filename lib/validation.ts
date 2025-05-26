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
