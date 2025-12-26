"use server";

import { revalidatePath } from "next/cache";
import { parseServerActionResponse } from "./utils";
import { TimeOffSchedule, WorkingTime } from "@/models/profile";
import { AssignedService } from "@/models/assignedService";
import { getEmployeeById } from "@/data/employee";
import {
  checkAppointmentConflicts,
  getAppointmentsBy14Date,
} from "@/data/appointment";
import moment from "moment-timezone";

export const createEmployee = async (
  form: FormData,
  workingTimes: WorkingTime[],
  timeOffSchedules: TimeOffSchedule[],
  assignedServices: AssignedService[]
) => {
  const { firstName, lastName, phone, position, note, hourlyRate } = Object.fromEntries(
    Array.from(form)
  );

  try {
    const { createEmployee: createEmployeeSupabase } = await import(
      "@/data/employee"
    );
    const result = await createEmployeeSupabase(
      firstName as string,
      lastName as string,
      (phone as string) || null,
      position as string,
      (note as string) || null,
      hourlyRate ? parseFloat(hourlyRate as string) : 0,
      workingTimes,
      timeOffSchedules,
      assignedServices
    );

    if (!result) {
      return parseServerActionResponse({
        error: "Failed to create employee: No result returned",
        status: "ERROR",
      });
    }

    revalidatePath("/employees");

    return parseServerActionResponse({
      ...result,
      _id: result.id, // For backward compatibility
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : JSON.stringify(error);
    return parseServerActionResponse({
      error: errorMessage,
      status: "ERROR",
    });
  }
};

export const updateEmployee = async (
  _id: string,
  form: FormData,
  workingTimes: WorkingTime[],
  timeOffSchedules: TimeOffSchedule[],
  assignedServices: AssignedService[]
) => {
  const { firstName, lastName, phone, position, note, hourlyRate } = Object.fromEntries(
    Array.from(form)
  );

  try {
    const { updateEmployee: updateEmployeeSupabase } = await import(
      "@/data/employee"
    );
    const result = await updateEmployeeSupabase(
      _id,
      {
        firstName: firstName as string,
        lastName: lastName as string,
        phone: (phone as string) || null,

        position: position as string,
        note: (note as string) || null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate as string) : 0,
      },
      workingTimes,
      timeOffSchedules,
      assignedServices
    );

    if (!result) {
      return parseServerActionResponse({
        error: "Failed to update employee",
        status: "ERROR",
      });
    }

    revalidatePath("/employees");

    return parseServerActionResponse({
      ...result,
      _id: result.id, // For backward compatibility
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const createCustomer = async (form: FormData) => {
  const { firstName, lastName, phone, note } = Object.fromEntries(
    Array.from(form)
  );

  try {
    const { createCustomer: createCustomerSupabase } = await import(
      "@/data/customer"
    );
    const result = await createCustomerSupabase(
      firstName as string,
      lastName as string,
      (phone as string) || null,
      (note as string) || null
    );

    if (!result) {
      return parseServerActionResponse({
        error: "Failed to create customer: No result returned",
        status: "ERROR",
      });
    }

    revalidatePath("/customers");

    return parseServerActionResponse({
      ...result,
      _id: result.id, // For backward compatibility
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : JSON.stringify(error);
    return parseServerActionResponse({
      error: errorMessage,
      status: "ERROR",
    });
  }
};

export const createAppointment = async (
  form: FormData,
  customer: { _ref: string; _type: string },
  employee: { _ref: string; _type: string },
  services: {
    _ref: string;
    _type: string;
    duration: number;
    quantity: number;
  }[],
  reminder: string[],
  isRecurring?: boolean,
  recurringDuration?: { value: number; unit: "days" | "weeks" | "months" },
  recurringFrequency?: { value: number; unit: "days" | "weeks" }
) => {
  const { time, note, type } = Object.fromEntries(Array.from(form));

  try {
    const { createAppointment: createAppointmentSupabase } = await import(
      "@/data/appointment"
    );
    const results = [];
    let currentTime = new Date(time as string);

    // Generate recurring group ID if this is a recurring appointment
    // Use UUID format for Supabase
    const crypto = await import("crypto");
    const recurringGroupId = isRecurring ? crypto.randomUUID() : undefined;

    // Calculate how many recurring appointments to create
    let totalAppointments = 1; // Start with 1 (the original appointment)
    if (isRecurring && recurringDuration && recurringFrequency) {
      const durationInDays = (() => {
        switch (recurringDuration.unit) {
          case "days":
            return recurringDuration.value;
          case "weeks":
            return recurringDuration.value * 7;
          case "months":
            return recurringDuration.value * 30; // Approximate
          default:
            return 0;
        }
      })();

      const frequencyInDays = (() => {
        switch (recurringFrequency.unit) {
          case "days":
            return recurringFrequency.value;
          case "weeks":
            return recurringFrequency.value * 7;
          default:
            return recurringFrequency.value;
        }
      })();

      if (frequencyInDays > 0) {
        totalAppointments = Math.floor(durationInDays / frequencyInDays) + 1;
      }
    }

    // Create appointments for each occurrence
    for (let occurrence = 0; occurrence < totalAppointments; occurrence++) {
      let occurrenceTime = new Date(currentTime);

      // Calculate the time for this occurrence
      if (occurrence > 0 && isRecurring && recurringFrequency) {
        // Get the original time (hour, minute) from the first appointment
        const originalTime = new Date(time as string);
        const originalHour = originalTime.getHours();
        const originalMinute = originalTime.getMinutes();

        // Calculate the correct date for this occurrence
        const originalDate = new Date(time as string);
        const daysToAdd = (() => {
          switch (recurringFrequency.unit) {
            case "days":
              return recurringFrequency.value * occurrence;
            case "weeks":
              return recurringFrequency.value * 7 * occurrence;
            default:
              return recurringFrequency.value * occurrence;
          }
        })();

        occurrenceTime = new Date(originalDate);
        occurrenceTime.setDate(originalDate.getDate() + daysToAdd);
        occurrenceTime.setHours(originalHour, originalMinute, 0, 0);

        currentTime = occurrenceTime;
      }

      // Loop through each service and create appointments based on quantity
      for (const [, service] of services.entries()) {
        const quantity = service.quantity || 1; // Default to 1 if quantity is not provided

        // Create appointments for this service based on quantity
        for (let i = 0; i < quantity; i++) {
          // Calculate startTime and endTime for this appointment
          const startTime = currentTime;
          const endTime = new Date(
            startTime.getTime() + service.duration * 60000
          );

          // Calculate reminder_datetime based on reminder array and startTime
          const reminderDatetime = reminder
            .map((reminderTime) => {
              const reminderDate = new Date(startTime);
              switch (reminderTime) {
                case "1h":
                  reminderDate.setHours(reminderDate.getHours() - 1);
                  break;
                case "2h":
                  reminderDate.setHours(reminderDate.getHours() - 2);
                  break;
                case "12h":
                  reminderDate.setHours(reminderDate.getHours() - 12);
                  break;
                case "24h":
                  reminderDate.setDate(reminderDate.getDate() - 1);
                  break;
                case "2d":
                  reminderDate.setDate(reminderDate.getDate() - 2);
                  break;
                default:
                  return null; // Skip invalid reminders
              }
              return reminderDate.toISOString();
            })
            .filter(Boolean) as string[]; // Filter out any null values

          // Create the appointment using Supabase
          const result = await createAppointmentSupabase(
            startTime.toISOString(),
            endTime.toISOString(),
            customer._ref, // customerId
            employee._ref, // employeeId
            service._ref, // serviceId
            "scheduled", // status
            type || "walk-in", // type
            (note as string) || null, // note
            reminder || [], // reminder
            recurringGroupId || undefined, // recurringGroupId
            reminderDatetime.length > 0 ? reminderDatetime : undefined // reminderDatetime
          );

          if (result) {
            results.push(result);
          } else {
            console.error("[CREATE APP] ❌ Failed to create appointment");
          }

          // Update currentTime for the next appointment (same service or next service)
          currentTime = endTime;
        }
      }
    }

    revalidatePath("/appointments");
    revalidatePath("/");

    return parseServerActionResponse({
      results, // Return array of created appointments
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : JSON.stringify(error);
    console.error("[CREATE APP] ❌ Error in createAppointment:", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return parseServerActionResponse({
      error: errorMessage,
      status: "ERROR",
    });
  }
};

export const updateAppointment = async (
  _id: string,
  duration: number,
  form: FormData,
  customer: { _ref: string; _type: string },
  employee: { _ref: string; _type: string },
  reminder: string[]
) => {
  const { time, note, status, type } = Object.fromEntries(Array.from(form));

  try {
    const { updateAppointment: updateAppointmentSupabase } = await import(
      "@/data/appointment"
    );

    const startTime = new Date(time as string).toISOString();
    const endTime = new Date(
      new Date(time as string).getTime() + duration * 60000
    ).toISOString();

    // Calculate reminder_datetime based on reminder array and startTime
    const reminderDatetime = reminder
      .map((reminderTime) => {
        const reminderDate = new Date(time as string);
        switch (reminderTime) {
          case "1h":
            reminderDate.setHours(reminderDate.getHours() - 1);
            break;
          case "2h":
            reminderDate.setHours(reminderDate.getHours() - 2);
            break;
          case "12h":
            reminderDate.setHours(reminderDate.getHours() - 12);
            break;
          case "24h":
            reminderDate.setDate(reminderDate.getDate() - 1);
            break;
          case "2d":
            reminderDate.setDate(reminderDate.getDate() - 2);
            break;
          default:
            return null; // Skip invalid reminders
        }
        return reminderDate.toISOString();
      })
      .filter(Boolean) as string[]; // Filter out any null values

    const result = await updateAppointmentSupabase(_id, {
      startTime,
      endTime,
      customerId: customer._ref,
      employeeId: employee._ref,
      status: status as string,
      type: type || "walk-in",
      note: (note as string) || null,
      reminder: reminder || [],
      reminderDatetime:
        reminderDatetime.length > 0 ? reminderDatetime : undefined,
    });

    if (!result) {
      return parseServerActionResponse({
        error: "Failed to update appointment",
        status: "ERROR",
      });
    }

    revalidatePath("/appointments");
    revalidatePath("/");

    return parseServerActionResponse({
      ...result,
      _id: result.id, // For backward compatibility
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : JSON.stringify(error);
    return parseServerActionResponse({
      error: errorMessage,
      status: "ERROR",
    });
  }
};

export const deleteAppointment = async (_id: string) => {
  try {
    const { deleteAppointment: deleteAppointmentSupabase } = await import(
      "@/data/appointment"
    );
    const success = await deleteAppointmentSupabase(_id);

    if (!success) {
      return parseServerActionResponse({
        error: "Failed to delete appointment",
        status: "ERROR",
      });
    }

    revalidatePath("/appointments");
    revalidatePath("/");

    return parseServerActionResponse({
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const updateCustomer = async (_id: string, form: FormData) => {
  const { firstName, lastName, phone, note } = Object.fromEntries(
    Array.from(form)
  );

  try {
    const { updateCustomer: updateCustomerSupabase } = await import(
      "@/data/customer"
    );
    const result = await updateCustomerSupabase(_id, {
      firstName: firstName as string,
      lastName: lastName as string,
      phone: (phone as string) || null,
      note: (note as string) || null,
    });

    if (!result) {
      return parseServerActionResponse({
        error: "Failed to update customer",
        status: "ERROR",
      });
    }

    revalidatePath("/customers");

    return parseServerActionResponse({
      ...result,
      _id: result.id, // For backward compatibility
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : JSON.stringify(error);
    return parseServerActionResponse({
      error: errorMessage,
      status: "ERROR",
    });
  }
};

export const createService = async (
  form: FormData,
  category: {
    _ref: string;
    _type: string;
  }
) => {
  const { name, price, duration } = Object.fromEntries(Array.from(form));

  try {
    const { createService: createServiceSupabase } = await import(
      "@/data/service"
    );
    const result = await createServiceSupabase(
      name as string,
      parseFloat(price as string),
      parseInt(duration as string, 10),
      category._ref || null
    );

    if (!result) {
      return parseServerActionResponse({
        error: "Failed to create service",
        status: "ERROR",
      });
    }

    revalidatePath("/services");

    return parseServerActionResponse({
      ...result,
      _id: result.id, // For backward compatibility
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const updateService = async (_id: string, form: FormData) => {
  const { name, description, price, duration, category } = Object.fromEntries(
    Array.from(form)
  );

  try {
    const { updateService: updateServiceSupabase } = await import(
      "@/data/service"
    );

    // Parse category if it's a string (could be JSON or just ID)
    let categoryId: string | null = null;
    if (category) {
      try {
        const categoryObj =
          typeof category === "string" ? JSON.parse(category) : category;
        categoryId = categoryObj._ref || categoryObj.id || category || null;
      } catch {
        categoryId = (category as string) || null;
      }
    }
    // If category is empty string or undefined, set to null
    if (categoryId === "" || categoryId === undefined) {
      categoryId = null;
    }

    const result = await updateServiceSupabase(_id, {
      name: name as string,
      price: price ? parseFloat(price as string) : undefined,
      duration: duration ? parseInt(duration as string, 10) : undefined,
      categoryId: categoryId || null, // Ensure null if empty
    });

    if (!result) {
      return parseServerActionResponse({
        error: "Failed to update service",
        status: "ERROR",
      });
    }

    revalidatePath("/services");

    return parseServerActionResponse({
      ...result,
      _id: result.id, // For backward compatibility
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const deleteEmployee = async (_id: string) => {
  try {
    // Note: With CASCADE delete in Supabase, related records will be automatically deleted
    // TODO: Add appointment reference check when appointments are migrated to Supabase

    const { deleteEmployee: deleteEmployeeSupabase } = await import(
      "@/data/employee"
    );
    const success = await deleteEmployeeSupabase(_id);

    if (!success) {
      return parseServerActionResponse({
        error: "Failed to delete employee",
        status: "ERROR",
      });
    }

    revalidatePath("/employees");

    return parseServerActionResponse({
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const deleteCustomer = async (_id: string) => {
  try {
    // Note: With CASCADE delete in Supabase, related records will be automatically deleted
    // TODO: Add appointment reference check when appointments are migrated to Supabase

    const { deleteCustomer: deleteCustomerSupabase } = await import(
      "@/data/customer"
    );
    const success = await deleteCustomerSupabase(_id);

    if (!success) {
      return parseServerActionResponse({
        error: "Failed to delete customer",
        status: "ERROR",
      });
    }

    revalidatePath("/customers");
    revalidatePath("/appointments");

    return parseServerActionResponse({
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const deleteAllCustomers = async () => {
  try {
    const { getAllCustomers } = await import("@/data/customer");
    const { supabase } = await import("@/lib/supabase");

    // Fetch all customers
    const allCustomers = await getAllCustomers();

    if (!allCustomers || allCustomers.length === 0) {
      return parseServerActionResponse({
        error: "No customers found",
        status: "ERROR",
      });
    }

    let deletedCount = 0;
    let errorCount = 0;

    // Delete each customer (CASCADE will handle related appointments)
    for (const customer of allCustomers) {
      try {
        // Delete the customer (appointments will be deleted via CASCADE)
        const { error } = await supabase
          .from("customers")
          .delete()
          .eq("id", customer.id);

        if (error) {
          throw error;
        }
        deletedCount++;
      } catch (error) {
        errorCount++;
      }
    }

    if (errorCount > 0) {
      revalidatePath("/customers");
      revalidatePath("/appointments");
      return parseServerActionResponse({
        error: `Deleted ${deletedCount} customers, but ${errorCount} failed`,
        status: "ERROR",
      });
    }

    revalidatePath("/customers");
    revalidatePath("/appointments");

    return parseServerActionResponse({
      error: "",
      status: "SUCCESS",
      count: deletedCount,
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const deleteService = async (_id: string) => {
  try {
    // Check for referencing appointments
    // Note: This would need to be handled separately if appointments are still in Sanity
    // For now, we'll just delete the service
    // TODO: Add appointment reference check when appointments are migrated to Supabase

    const { deleteService: deleteServiceSupabase } = await import(
      "@/data/service"
    );
    const success = await deleteServiceSupabase(_id);

    if (!success) {
      return parseServerActionResponse({
        error: "Failed to delete service",
        status: "ERROR",
      });
    }

    revalidatePath("/services");

    return parseServerActionResponse({
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const updateTimezone = async (id: string, timezone: string) => {
  try {
    const { updateSettings } = await import("@/data/settings");
    const result = await updateSettings(id, { timezone });

    if (!result) {
      return parseServerActionResponse({
        error: "Failed to update timezone",
        status: "ERROR",
      });
    }

    revalidatePath("/settings");

    return parseServerActionResponse({
      ...result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const updateTimeSettings = async (
  id: string,
  minTime: string,
  maxTime: string
) => {
  try {
    const { updateSettings } = await import("@/data/settings");
    const result = await updateSettings(id, {
      min_time: minTime,
      max_time: maxTime,
    });

    if (!result) {
      return parseServerActionResponse({
        error: "Failed to update time settings",
        status: "ERROR",
      });
    }

    revalidatePath("/settings");

    return parseServerActionResponse({
      ...result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};





export const checkRecurringConflicts = async (
  employeeId: string,
  startTime: string,
  endTime: string,
  isRecurring: boolean,
  recurringDuration?: { value: number; unit: "days" | "weeks" | "months" },
  recurringFrequency?: { value: number; unit: "days" | "weeks" }
) => {
  try {
    // Get employee with working times and time off schedules
    const employee = await getEmployeeById(employeeId);

    if (!employee) {
      return parseServerActionResponse({
        error: "Employee not found",
        status: "ERROR",
      });
    }

    if (!isRecurring) {
      // For non-recurring appointments, just check the single time slot
      const conflicts = await checkAppointmentConflicts(
        employeeId,
        startTime,
        endTime
      );

      // Check working times and time off for single appointment
      const workingTimeConflicts = checkWorkingTimeConflicts(
        employee,
        new Date(startTime),
        new Date(endTime)
      );

      const timeOffConflicts = checkTimeOffConflicts(
        employee,
        new Date(startTime),
        new Date(endTime)
      );

      const allConflicts = [
        ...conflicts.map((conflict: any) => ({
          ...conflict,
          type: "appointment",
        })),
        ...workingTimeConflicts.map((conflict: any) => ({
          ...conflict,
          type: "working_time",
        })),
        ...timeOffConflicts.map((conflict: any) => ({
          ...conflict,
          type: "time_off",
        })),
      ];

      return parseServerActionResponse({
        conflicts:
          allConflicts.length > 0
            ? [
              {
                occurrence: 1,
                startTime,
                endTime,
                conflicts: allConflicts,
              },
            ]
            : [],
        error: "",
        status: "SUCCESS",
      });
    }

    // For recurring appointments, check all occurrences
    const allConflicts: any[] = [];

    // Calculate how many recurring appointments to check
    let totalAppointments = 1;
    if (recurringDuration && recurringFrequency) {
      const durationInDays = (() => {
        switch (recurringDuration.unit) {
          case "days":
            return recurringDuration.value;
          case "weeks":
            return recurringDuration.value * 7;
          case "months":
            return recurringDuration.value * 30;
          default:
            return 0;
        }
      })();

      const frequencyInDays = (() => {
        switch (recurringFrequency.unit) {
          case "days":
            return recurringFrequency.value;
          case "weeks":
            return recurringFrequency.value * 7;
          default:
            return 0;
        }
      })();

      if (frequencyInDays > 0) {
        totalAppointments = Math.ceil(durationInDays / frequencyInDays);
      }
    }

    // Get the first date of the recurring appointments
    const firstDate = new Date(startTime);
    const firstDateStr = firstDate.toISOString().split("T")[0];

    // Fetch all appointments in 14-day window using RPC
    const existingAppointments = await getAppointmentsBy14Date(firstDateStr);

    // Filter appointments for the specific employee and status = "scheduled"
    const employeeAppointments = existingAppointments.filter(
      (apt) => apt.employee_id === employeeId && apt.status === "scheduled"
    );

    // Check each occurrence for conflicts
    for (let occurrence = 0; occurrence < totalAppointments; occurrence++) {
      // Calculate occurrence time
      const originalDate = new Date(startTime);
      const originalHour = originalDate.getHours();
      const originalMinute = originalDate.getMinutes();

      let daysToAdd = 0;
      if (occurrence > 0 && recurringFrequency) {
        switch (recurringFrequency.unit) {
          case "days":
            daysToAdd = recurringFrequency.value * occurrence;
            break;
          case "weeks":
            daysToAdd = recurringFrequency.value * 7 * occurrence;
            break;
        }
      }

      const occurrenceTime = new Date(originalDate);
      occurrenceTime.setDate(originalDate.getDate() + daysToAdd);
      occurrenceTime.setHours(originalHour, originalMinute, 0, 0);

      const durationMs =
        new Date(endTime).getTime() - new Date(startTime).getTime();
      const currentStartTime = occurrenceTime;
      const currentEndTime = new Date(occurrenceTime.getTime() + durationMs);

      // Check for overlapping appointments in the fetched data
      const appointmentConflicts = employeeAppointments.filter((apt) => {
        const aptStart = new Date(apt.start_time || apt.startTime || "");
        const aptEnd = new Date(apt.end_time || apt.endTime || "");

        // Check if appointments overlap
        return (
          (aptStart < currentEndTime && aptEnd > currentStartTime) ||
          (aptStart >= currentStartTime && aptStart < currentEndTime) ||
          (aptEnd > currentStartTime && aptEnd <= currentEndTime) ||
          (aptStart <= currentStartTime && aptEnd >= currentEndTime)
        );
      });

      // Check working times and time off for this occurrence
      const workingTimeConflicts = checkWorkingTimeConflicts(
        employee,
        currentStartTime,
        currentEndTime
      );

      const timeOffConflicts = checkTimeOffConflicts(
        employee,
        currentStartTime,
        currentEndTime
      );

      const allConflictsForOccurrence = [
        ...appointmentConflicts.map((conflict: any) => ({
          ...conflict,
          type: "appointment",
        })),
        ...workingTimeConflicts.map((conflict: any) => ({
          ...conflict,
          type: "working_time",
        })),
        ...timeOffConflicts.map((conflict: any) => ({
          ...conflict,
          type: "time_off",
        })),
      ];

      if (allConflictsForOccurrence.length > 0) {
        allConflicts.push({
          occurrence: occurrence + 1,
          startTime: currentStartTime.toISOString(),
          endTime: currentEndTime.toISOString(),
          conflicts: allConflictsForOccurrence,
        });
      }
    }

    return parseServerActionResponse({
      conflicts: allConflicts,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

// Helper function to check working time conflicts
const checkWorkingTimeConflicts = (
  employee: any,
  startTime: Date,
  endTime: Date
) => {
  const conflicts: any[] = [];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = daysOfWeek[startTime.getDay()];

  const workingTimes = employee.workingTimes || [];
  const workSchedule = workingTimes.find((wt: any) => wt.day === dayOfWeek);

  if (!workSchedule) {
    // Employee is not working on this day
    conflicts.push({
      _id: `not_working_${dayOfWeek}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: Math.round(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60)
      ),
      customer: {
        _id: "system",
        firstName: "System",
        lastName: "Notice",
        fullName: "Not Working Day",
      },
      service: {
        _id: "system",
        name: "Employee Not Available",
        duration: Math.round(
          (endTime.getTime() - startTime.getTime()) / (1000 * 60)
        ),
      },
      status: "not_working",
    });
    return conflicts;
  }

  // Check if appointment is outside working hours using moment.js
  const appointmentDate = moment(startTime).format("YYYY-MM-DD");
  const workStart = moment(
    `${appointmentDate} ${workSchedule.from}`,
    "YYYY-MM-DD h:mm A"
  ).toDate();
  const workEnd = moment(
    `${appointmentDate} ${workSchedule.to}`,
    "YYYY-MM-DD h:mm A"
  ).toDate();

  // Only conflict if appointment is completely outside working hours
  if (startTime < workStart || endTime > workEnd) {
    conflicts.push({
      _id: `outside_working_hours_${dayOfWeek}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: Math.round(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60)
      ),
      customer: {
        _id: "system",
        firstName: "System",
        lastName: "Notice",
        fullName: "Outside Working Hours",
      },
      service: {
        _id: "system",
        name: `Working Hours: ${workSchedule.from} - ${workSchedule.to}`,
        duration: Math.round(
          (endTime.getTime() - startTime.getTime()) / (1000 * 60)
        ),
      },
      status: "outside_working_hours",
    });
  }

  return conflicts;
};

// Helper function to check time off conflicts
const checkTimeOffConflicts = (
  employee: any,
  startTime: Date,
  endTime: Date
) => {
  const conflicts: any[] = [];
  const timeOffSchedules = employee.timeOffSchedules || [];

  timeOffSchedules.forEach((schedule: any) => {
    const {
      period,
      date: scheduleDate,
      from,
      to,
      reason,
      dayOfWeek,
      dayOfMonth,
    } = schedule;

    let isMatchingDate = false;

    switch (period) {
      case "Exact":
        if (scheduleDate) {
          const exactDate = new Date(scheduleDate);
          isMatchingDate =
            exactDate.getFullYear() === startTime.getFullYear() &&
            exactDate.getMonth() === startTime.getMonth() &&
            exactDate.getDate() === startTime.getDate();
        }
        break;
      case "Daily":
        isMatchingDate = true;
        break;
      case "Weekly":
        if (dayOfWeek) {
          const currentDayOfWeek = startTime.getDay();
          const adjustedDayOfWeek =
            currentDayOfWeek === 0 ? 7 : currentDayOfWeek;
          isMatchingDate = dayOfWeek.includes(adjustedDayOfWeek);
        }
        break;
      case "Monthly":
        if (dayOfMonth) {
          const currentDayOfMonth = startTime.getDate();
          isMatchingDate = dayOfMonth.includes(currentDayOfMonth);
        }
        break;
      default:
        break;
    }

    if (isMatchingDate && from && to) {
      const appointmentDate = moment(startTime).format("YYYY-MM-DD");
      const timeOffStart = moment(
        `${appointmentDate} ${from}`,
        "YYYY-MM-DD h:mm A"
      ).toDate();
      const timeOffEnd = moment(
        `${appointmentDate} ${to}`,
        "YYYY-MM-DD h:mm A"
      ).toDate();

      // Check if appointment overlaps with time off
      if (
        (startTime >= timeOffStart && startTime < timeOffEnd) ||
        (endTime > timeOffStart && endTime <= timeOffEnd) ||
        (startTime <= timeOffStart && endTime >= timeOffEnd)
      ) {
        conflicts.push({
          _id: `time_off_${scheduleDate || startTime.toISOString()}`,
          startTime: timeOffStart.toISOString(),
          endTime: timeOffEnd.toISOString(),
          duration: Math.round(
            (timeOffEnd.getTime() - timeOffStart.getTime()) / (1000 * 60)
          ),
          customer: {
            _id: "system",
            firstName: "System",
            lastName: "Notice",
            fullName: "Time Off",
          },
          service: {
            _id: "system",
            name: `Time Off: ${reason || "Scheduled time off"}`,
            duration: Math.round(
              (timeOffEnd.getTime() - timeOffStart.getTime()) / (1000 * 60)
            ),
          },
          status: "time_off",
        });
      }
    }
  });

  return conflicts;
};

export const cancelRecurringAppointments = async (recurringGroupId: string) => {
  try {
    const { cancelRecurringAppointments: cancelRecurringAppointmentsSupabase } =
      await import("@/data/appointment");
    const result = await cancelRecurringAppointmentsSupabase(recurringGroupId);

    revalidatePath("/appointments");
    revalidatePath("/");

    return parseServerActionResponse({
      results: [],
      count: result.count,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const createCategory = async (form: FormData) => {
  const { name } = Object.fromEntries(Array.from(form));

  try {
    const { createCategory: createCategorySupabase } = await import(
      "@/data/category"
    );
    const result = await createCategorySupabase(name as string);

    if (!result) {
      return parseServerActionResponse({
        error: "Failed to create category: No result returned",
        status: "ERROR",
      });
    }

    revalidatePath("/services");

    return parseServerActionResponse({
      ...result,
      _id: result.id, // For backward compatibility
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : JSON.stringify(error);
    return parseServerActionResponse({
      error: errorMessage,
      status: "ERROR",
    });
  }
};

export const updateCategory = async (_id: string, form: FormData) => {
  const { name } = Object.fromEntries(Array.from(form));

  try {
    const { updateCategory: updateCategorySupabase } = await import(
      "@/data/category"
    );
    const result = await updateCategorySupabase(_id, name as string);

    if (!result) {
      return parseServerActionResponse({
        error: "Failed to update category",
        status: "ERROR",
      });
    }

    revalidatePath("/services");

    return parseServerActionResponse({
      ...result,
      _id: result.id, // For backward compatibility
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : JSON.stringify(error);
    return parseServerActionResponse({
      error: errorMessage,
      status: "ERROR",
    });
  }
};

export const deleteCategory = async (_id: string) => {
  try {
    const { deleteCategory: deleteCategorySupabase } = await import(
      "@/data/category"
    );
    const result = await deleteCategorySupabase(_id);

    if (!result) {
      return parseServerActionResponse({
        error: "Failed to delete category",
        status: "ERROR",
      });
    }

    revalidatePath("/services");

    return parseServerActionResponse({
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : JSON.stringify(error);
    return parseServerActionResponse({
      error: errorMessage,
      status: "ERROR",
    });
  }
};
