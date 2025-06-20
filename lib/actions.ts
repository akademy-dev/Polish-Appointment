"use server";

import { writeClient } from "@/sanity/lib/write-client";
import { parseServerActionResponse } from "./utils";
import { TimeOffSchedule, WorkingTime } from "@/models/profile";
import bcrypt from "bcrypt";

export const createEmployee = async (
  form: FormData,
  workingTimes: WorkingTime[],
  timeOffSchedules: TimeOffSchedule[],
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
  }[],
) => {
  const { time, note, reminder } = Object.fromEntries(Array.from(form));

  try {
    const results = [];
    let currentTime = new Date(time as string);

    // Loop through each service and create a separate appointment
    for (const [, service] of services.entries()) {
      // Calculate startTime and endTime for this service
      const startTime = currentTime;
      const endTime = new Date(startTime.getTime() + service.duration * 60000);

      const appointment = {
        _type: "appointment",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: service.duration,
        note,
        reminder: reminder === "true",
        customer,
        employee,
        service: {
          _ref: service._ref,
          _type: service._type,
        },
      };

      // Create the appointment
      const result = await writeClient.create(appointment);
      results.push(result);

      // Update currentTime for the next service
      currentTime = endTime;
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
) => {
  const { time, note, reminder } = Object.fromEntries(Array.from(form));

  try {
    const appointment = {
      startTime: new Date(time as string).toISOString(),
      endTime: new Date(
        new Date(time as string).getTime() + duration * 60000,
      ).toISOString(),
      duration: duration,
      note,
      reminder: reminder === "true",
      customer,
      employee,
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
