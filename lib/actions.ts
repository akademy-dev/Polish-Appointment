"use server";

import { writeClient } from "@/sanity/lib/write-client";
import { parseServerActionResponse } from "./utils";
import { TimeOffSchedule, WorkingTime } from "@/models/profile";

export const createEmployee = async (
  form: FormData,
  workingTimes: WorkingTime[],
  timeOffSchedule: TimeOffSchedule[]
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
      timeOffSchedule,
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
