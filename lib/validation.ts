import { z } from "zod";
import { convertTimeStringToMinutes } from "./utils";

export const workingTimeSchema = z
  .array(
    z
      .object({
        from: z.string(),
        to: z.string(),
        day: z.string(),
      })
      .refine(
        (data) => {
          return (
            convertTimeStringToMinutes(data.from) <
            convertTimeStringToMinutes(data.to)
          );
        },
        {
          message: "From time must be before to time",
        }
      )
  )
  .min(1, "You have to select at least one day.")
  .max(7);

export const timeOffScheduleFormSchema = z.array(
  z
    .object({
      date: z.date().optional(),
      from: z.string(),
      to: z.string(),
      reason: z.string().min(1, "Please enter a reason"),
      dayOfWeek: z
        .array(z.number())
        .min(1, "Please select at least one day")
        .max(7)
        .optional(),
      dayOfMonth: z
        .array(z.number())
        .min(1, "Please select at least one day")
        .max(31)
        .optional(),
      period: z.enum(["Exact", "Daily", "Weekly", "Monthly"]),
    })
    .refine(
      (data) => {
        //check if every item in the array have right format
        return (
          convertTimeStringToMinutes(data.from) <
          convertTimeStringToMinutes(data.to)
        );
      },
      {
        message: "From time must be before to time",
      }
    )
);

export const employeeFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  position: z.string({
    required_error: "Please select a position",
  }),
  workingTimes: workingTimeSchema,
  timeOffSchedule: timeOffScheduleFormSchema,
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const appointmentFormSchema = z.object({
  firstName: z.string().min(1, { message: "First name cannot be empty." }),
  lastName: z.string().min(1, { message: "Last name cannot be empty." }),
  phone: z
    .string()
    .refine(
      (value) => /^[+]{1}(?:[0-9-()/.]\s?){6,15}[0-9]{1}$/.test(value),
      "Please enter a valid phone number"
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
      })
    )
    .min(1, { message: "Please select at least one service." }),
});
