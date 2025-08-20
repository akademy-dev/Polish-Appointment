"use server";

import { writeClient } from "@/sanity/lib/write-client";
import { parseServerActionResponse } from "./utils";
import { TimeOffSchedule, WorkingTime } from "@/models/profile";
import { AssignedService } from "@/models/assignedService";
import {
  CHECK_CONFLICT_QUERY,
  EMPLOYEE_WORKING_TIMES_QUERY,
} from "@/sanity/lib/queries";
import moment from "moment-timezone";

export const createEmployee = async (
  form: FormData,
  workingTimes: WorkingTime[],
  timeOffSchedules: TimeOffSchedule[],
  assignedServices: AssignedService[],
) => {
  const { firstName, lastName, phone, position, note } = Object.fromEntries(
    Array.from(form),
  );

  try {
    const employee = {
      firstName,
      lastName,
      phone,
      position,
      note,
      workingTimes,
      timeOffSchedules,
      assignedServices,
    };

    //add _key for each item in workingTimes and timeOffSchedules
    employee.workingTimes = employee.workingTimes.map((time) => ({
      ...time,
      _key: crypto.randomUUID(),
    }));
    employee.timeOffSchedules = employee.timeOffSchedules.map((time) => ({
      ...time,
      _key: crypto.randomUUID(),
    }));

    const result = await writeClient.create({
      _type: "employee",
      ...employee,
    });

    return parseServerActionResponse({
      ...result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const updateEmployee = async (
  _id: string,
  form: FormData,
  workingTimes: WorkingTime[],
  timeOffSchedules: TimeOffSchedule[],
  assignedServices: AssignedService[],
) => {
  const { firstName, lastName, phone, position, note } = Object.fromEntries(
    Array.from(form),
  );

  try {
    const employee = {
      firstName,
      lastName,
      phone,
      position,
      note,
      workingTimes,
      timeOffSchedules,
      assignedServices,
    };

    const result = await writeClient
      .patch(_id)
      .set({
        ...employee,
      })
      .commit();

    return parseServerActionResponse({
      ...result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const createCustomer = async (form: FormData) => {
  const { firstName, lastName, phone, email, note } = Object.fromEntries(
    Array.from(form),
  );

  try {
    const customer = {
      firstName,
      lastName,
      phone,
      email,
      note,
    };

    const result = await writeClient.create({
      _type: "customer",
      ...customer,
    });

    console.log("Customer created successfully", result);

    return parseServerActionResponse({
      ...result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);
    return parseServerActionResponse({
      error: JSON.stringify(error),
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
  recurringFrequency?: { value: number; unit: "days" | "weeks" },
) => {
  const { time, note, type } = Object.fromEntries(Array.from(form));

  try {
    const results = [];
    let currentTime = new Date(time as string);

    // Generate recurring group ID if this is a recurring appointment
    const recurringGroupId = isRecurring
      ? `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : undefined;

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
            startTime.getTime() + service.duration * 60000,
          );

          const appointment = {
            _type: "appointment",
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: service.duration,
            note,
            type: type || "walk-in",
            reminder: reminder || [],
            customer,
            employee,
            service: {
              _ref: service._ref,
              _type: service._type,
            },
            status: "scheduled",
            recurringGroupId,
            // calculate Reminder Date Times based on reminder array and startTime
            reminderDateTimes: reminder
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
              .filter(Boolean), // Filter out any null values
          };

          // Create the appointment
          const result = await writeClient.create(appointment);
          results.push(result);

          // Update currentTime for the next appointment (same service or next service)
          currentTime = endTime;
        }
      }
    }

    return parseServerActionResponse({
      results, // Return array of created appointments
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);
    return parseServerActionResponse({
      error: JSON.stringify(error),
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
  reminder: string[],
) => {
  const { time, note, status, type } = Object.fromEntries(Array.from(form));

  try {
    const appointment = {
      startTime: new Date(time as string).toISOString(),
      endTime: new Date(
        new Date(time as string).getTime() + duration * 60000,
      ).toISOString(),
      duration: duration,
      note,
      type: type || "walk-in",
      reminder,
      customer,
      employee,
      status,
      // calculate Reminder Date Times base on reminder array and startTime
      reminderDateTimes: reminder
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
        .filter(Boolean), // Filter out any null values
    };

    const result = await writeClient
      .patch(_id)
      .set({
        ...appointment,
      })
      .commit();

    return parseServerActionResponse({
      ...result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const deleteAppointment = async (_id: string) => {
  try {
    const result = await writeClient.delete(_id);

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

export const updateCustomer = async (_id: string, form: FormData) => {
  const { firstName, lastName, phone, email, note } = Object.fromEntries(
    Array.from(form),
  );

  try {
    const customer = {
      firstName,
      lastName,
      phone,
      email,
      note,
    };

    const result = await writeClient
      .patch(_id)
      .set({
        ...customer,
      })
      .commit();

    return parseServerActionResponse({
      ...result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const createService = async (
  form: FormData,
  category: {
    _ref: string;
    _type: string;
  },
) => {
  const { name, price, duration, showOnline } = Object.fromEntries(
    Array.from(form),
  );

  try {
    const service = {
      name,
      price: parseFloat(price as string),
      duration: parseInt(duration as string, 10),
      showOnline: showOnline === "true",
      category: category,
    };

    const result = await writeClient.create({
      _type: "service",
      ...service,
    });

    return parseServerActionResponse({
      ...result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const updateService = async (_id: string, form: FormData) => {
  const { name, description, price, duration, category } = Object.fromEntries(
    Array.from(form),
  );

  try {
    const service = {
      name,
      description,
      price: parseFloat(price as string),
      duration: parseInt(duration as string, 10),
      category,
      showOnline: form.get("showOnline") === "true",
    };

    const result = await writeClient
      .patch(_id)
      .set({
        ...service,
      })
      .commit();

    return parseServerActionResponse({
      ...result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const deleteEmployee = async (_id: string) => {
  try {
    const referencingDocs = await writeClient.fetch(
      `*[_type == "appointment" && employee._ref == $id]{_id}`,
      { id: _id },
    );

    for (const refDoc of referencingDocs) {
      await writeClient.delete(refDoc._id);
    }

    const result = await writeClient.delete(_id);

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

export const deleteCustomer = async (_id: string) => {
  try {
    const referencingDocs = await writeClient.fetch(
      `*[_type == "appointment" && customer._ref == $id]{_id}`,
      { id: _id },
    );

    for (const refDoc of referencingDocs) {
      await writeClient.delete(refDoc._id);
    }

    const result = await writeClient.delete(_id);

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

export const deleteService = async (_id: string) => {
  try {
    const referencingDocs = await writeClient.fetch(
      `*[_type == "appointment" && service._ref == $id]{_id}`,
      { id: _id },
    );

    for (const refDoc of referencingDocs) {
      await writeClient.delete(refDoc._id);
    }

    const result = await writeClient.delete(_id);

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

export const updateTimezone = async (_id: string, timezone: string) => {
  try {
    const result = await writeClient
      .patch(_id)
      .set({
        timezone,
      })
      .commit();

    return parseServerActionResponse({
      ...result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};

export const updateTimeSettings = async (
  _id: string,
  minTime: string,
  maxTime: string,
) => {
  try {
    const result = await writeClient
      .patch(_id)
      .set({
        minTime,
        maxTime,
      })
      .commit();

    return parseServerActionResponse({
      ...result,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);
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
  recurringFrequency?: { value: number; unit: "days" | "weeks" },
) => {
  try {
    // Get employee working times and time off schedules
    const employee = await writeClient.fetch(EMPLOYEE_WORKING_TIMES_QUERY, {
      employeeId,
    });

    if (!employee) {
      return parseServerActionResponse({
        error: "Employee not found",
        status: "ERROR",
      });
    }

    if (!isRecurring) {
      // For non-recurring appointments, just check the single time slot
      const conflicts = await writeClient.fetch(CHECK_CONFLICT_QUERY, {
        employeeId,
        startTime,
        endTime,
      });

      // Check working times and time off for single appointment
      const workingTimeConflicts = checkWorkingTimeConflicts(
        employee,
        new Date(startTime),
        new Date(endTime),
      );

      const timeOffConflicts = checkTimeOffConflicts(
        employee,
        new Date(startTime),
        new Date(endTime),
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
    let currentStartTime = new Date(startTime);
    let currentEndTime = new Date(endTime);

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

    // Check each occurrence for conflicts
    for (let occurrence = 0; occurrence < totalAppointments; occurrence++) {
      if (occurrence > 0) {
        // Calculate next occurrence time
        const originalDate = new Date(startTime);
        const originalHour = originalDate.getHours();
        const originalMinute = originalDate.getMinutes();

        let daysToAdd = 0;
        if (recurringFrequency) {
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
        currentStartTime = occurrenceTime;
        currentEndTime = new Date(occurrenceTime.getTime() + durationMs);
      }

      const appointmentConflicts = await writeClient.fetch(
        CHECK_CONFLICT_QUERY,
        {
          employeeId,
          startTime: currentStartTime.toISOString(),
          endTime: currentEndTime.toISOString(),
        },
      );

      // Check working times and time off for this occurrence
      const workingTimeConflicts = checkWorkingTimeConflicts(
        employee,
        currentStartTime,
        currentEndTime,
      );

      const timeOffConflicts = checkTimeOffConflicts(
        employee,
        currentStartTime,
        currentEndTime,
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
    console.log(error);
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
  endTime: Date,
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
        (endTime.getTime() - startTime.getTime()) / (1000 * 60),
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
          (endTime.getTime() - startTime.getTime()) / (1000 * 60),
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
    "YYYY-MM-DD h:mm A",
  ).toDate();
  const workEnd = moment(
    `${appointmentDate} ${workSchedule.to}`,
    "YYYY-MM-DD h:mm A",
  ).toDate();

  // Only conflict if appointment is completely outside working hours
  if (startTime < workStart || endTime > workEnd) {
    conflicts.push({
      _id: `outside_working_hours_${dayOfWeek}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: Math.round(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60),
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
          (endTime.getTime() - startTime.getTime()) / (1000 * 60),
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
  endTime: Date,
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
        "YYYY-MM-DD h:mm A",
      ).toDate();
      const timeOffEnd = moment(
        `${appointmentDate} ${to}`,
        "YYYY-MM-DD h:mm A",
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
            (timeOffEnd.getTime() - timeOffStart.getTime()) / (1000 * 60),
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
              (timeOffEnd.getTime() - timeOffStart.getTime()) / (1000 * 60),
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
    // Find all appointments with the same recurringGroupId
    const appointments = await writeClient.fetch(
      `*[_type == "appointment" && recurringGroupId == $recurringGroupId && status == "scheduled"]{_id}`,
      { recurringGroupId },
    );

    // Update all appointments to cancelled status
    const results = [];
    for (const appointment of appointments) {
      const result = await writeClient
        .patch(appointment._id)
        .set({
          status: "cancelled",
        })
        .commit();
      results.push(result);
    }

    return parseServerActionResponse({
      results,
      error: "",
      status: "SUCCESS",
    });
  } catch (error) {
    console.log(error);
    return parseServerActionResponse({
      error: JSON.stringify(error),
      status: "ERROR",
    });
  }
};
