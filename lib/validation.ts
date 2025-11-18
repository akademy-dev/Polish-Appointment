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

export const assignedServicesSchema = z.array(
  z.object({
    serviceId: z.string().min(1, "Service ID is required"),
    price: z.number().min(0, "Price must be at least 0"),
    duration: z.number().positive("Duration must be a positive number"),
    processTime: z.number().min(0, "Process time must be at least 0 minutes"),
    showOnline: z.boolean(),
  })
);
export const timeOffScheduleFormSchema = z.array(
  z
    .object({
      date: z.date().optional(),
      from: z.string(),
      to: z.string(),
      reason: z.string().min(1, "Please enter a reason"),
      dayOfWeek: z.array(z.number()).optional(),
      dayOfMonth: z.array(z.number()).optional(),
      period: z.enum(["Exact", "Daily", "Weekly", "Monthly"]),
    })
    .refine(
      (data) => {
        // Validate dayOfWeek only when period is "Weekly"
        if (data.period === "Weekly") {
          return (
            data.dayOfWeek &&
            data.dayOfWeek.length >= 1 &&
            data.dayOfWeek.length <= 7
          );
        }
        return true;
      },
      {
        message: "Please select at least one day of week",
        path: ["dayOfWeek"],
      }
    )
    .refine(
      (data) => {
        // Validate dayOfMonth only when period is "Monthly"
        if (data.period === "Monthly") {
          return (
            data.dayOfMonth &&
            data.dayOfMonth.length >= 1 &&
            data.dayOfMonth.length <= 31
          );
        }
        return true;
      },
      {
        message: "Please select at least one day of month",
        path: ["dayOfMonth"],
      }
    )
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

// New simplified time off schema for appointment form
export const appointmentTimeOffSchema = z
  .object({
    employee: z.object({
      _ref: z.string().min(1, "Employee is required"),
      _type: z.literal("reference"),
    }),
    startTime: z.string().min(1, "Start time is required"),
    duration: z.union([z.number().min(1), z.literal("to_close")]),
    reason: z.string().optional(),
    isRecurring: z.boolean(),
    recurringDuration: z
      .object({
        value: z.number().min(1).max(26),
        unit: z.enum(["days", "weeks", "months"]),
      })
      .optional(),
    recurringFrequency: z
      .object({
        value: z.number().min(1).max(26),
        unit: z.enum(["days", "weeks"]),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // If isRecurring is true, recurringDuration and recurringFrequency are required
      if (data.isRecurring) {
        return data.recurringDuration && data.recurringFrequency;
      }
      return true;
    },
    {
      message:
        "Recurring duration and frequency are required when recurring is enabled",
      path: ["isRecurring"],
    }
  );

export const employeeFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  position: z.string({
    required_error: "Please select a position",
  }),
  note: z.string().optional(),
  workingTimes: workingTimeSchema,
  timeOffSchedules: timeOffScheduleFormSchema,
  assignedServices: assignedServicesSchema,
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const customerFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  note: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

export const customerImportSchema = z.object({
  file: z.instanceof(File, { message: "Please select a file" }),
});

export type CustomerImportValues = z.infer<typeof customerImportSchema>;

const referenceSchema = z.object({
  _ref: z.string().min(1, "Reference is required"),
  _type: z.string(),
});

export const serviceFormSchema = z.object({
  category: referenceSchema,
  name: z.string().min(1, "Service name is required"),
  price: z.number().min(0, "Price must be at least 0"),
  duration: z.number().positive("Duration must be a positive number"),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export const appointmentFormSchema = z.object({
  time: z.string().min(1, { message: "Time is required" }),
  note: z.string().optional(),
  reminder: z.array(z.any()),
  type: z.enum(["walk-in", "request"], {
    required_error: "Type is required",
  }),
  isRecurring: z.boolean(),
  recurringDuration: z
    .object({
      value: z.number().min(1).max(26).optional(),
      unit: z.enum(["days", "weeks", "months"]).optional(),
    })
    .optional(),
  recurringFrequency: z
    .object({
      value: z.number().min(1).max(26).optional(),
      unit: z.enum(["days", "weeks"]).optional(),
    })
    .optional(),
  customer: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().min(1, "Phone is required"),
    _ref: z.string().optional(),
    _type: z.literal("reference"),
  }),
  employee: z.object({
    _ref: z.string().min(1, "Employee reference is required"),
    _type: z.literal("reference"),
  }),
  services: z
    .array(
      z.object({
        _ref: z.string().min(1, "Service reference is required"),
        _type: z.string(),
        duration: z.number().positive("Duration must be a positive number"),
        quantity: z
          .number()
          .min(1, { message: "Quantity must be at least 1" })
          .max(10, { message: "Quantity cannot exceed 10" }),
      })
    )
    .min(1, { message: "Please select at least one service." }),
  status: z.enum(["scheduled", "cancelled", "completed"], {
    required_error: "Status is required",
  }),
  recurringGroupId: z.string().optional(),
});
