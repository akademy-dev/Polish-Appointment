"use server";

import { writeClient } from "@/sanity/lib/write-client";
import { parseServerActionResponse } from "./utils";
import { TimeOffSchedule, WorkingTime } from "@/models/profile";

export const createEmployee = async (
  form: FormData,
  workingTimes: WorkingTime[],
  timeOffSchedules: TimeOffSchedule[]
) => {
  const { firstName, lastName, phone, position } = Object.fromEntries(
    Array.from(form)
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
  timeOffSchedules: TimeOffSchedule[]
) => {
  const { firstName, lastName, phone, position } = Object.fromEntries(
    Array.from(form)
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
    Array.from(form)
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
    Array.from(form)
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
