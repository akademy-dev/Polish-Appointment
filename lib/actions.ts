"use server";

import { writeClient } from "@/sanity/lib/write-client";
import { parseServerActionResponse } from "./utils";
import { TimeOffSchedule, WorkingTime } from "@/models/profile";
import { AssignedService } from "@/models/assignedService";

export const createEmployee = async (
  form: FormData,
  workingTimes: WorkingTime[],
  timeOffSchedules: TimeOffSchedule[],
  assignedServices: AssignedService[],
) => {
  const { firstName, lastName, phone, position } = Object.fromEntries(
    Array.from(form),
  );

  try {
    const employee = {
      firstName,
      lastName,
      phone,
      position,
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
  const { firstName, lastName, phone, position } = Object.fromEntries(
    Array.from(form),
  );

  try {
    const employee = {
      firstName,
      lastName,
      phone,
      position,
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
  const { firstName, lastName, phone, email } = Object.fromEntries(
    Array.from(form),
  );

  try {
    const customer = {
      firstName,
      lastName,
      phone,
      email,
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
    const recurringGroupId = isRecurring ? `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined;

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
  const { firstName, lastName, phone, email } = Object.fromEntries(
    Array.from(form),
  );

  try {
    const customer = {
      firstName,
      lastName,
      phone,
      email,
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

export const cancelRecurringAppointments = async (recurringGroupId: string) => {
  try {
    // Find all appointments with the same recurringGroupId
    const appointments = await writeClient.fetch(
      `*[_type == "appointment" && recurringGroupId == $recurringGroupId && status == "scheduled"]{_id}`,
      { recurringGroupId },
    );

    console.log(`Found ${appointments.length} recurring appointments to cancel`);

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
