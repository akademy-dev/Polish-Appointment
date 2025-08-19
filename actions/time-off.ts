"use server";

import { client } from "@/sanity/lib/client";
import { appointmentTimeOffSchema } from "@/lib/validation";
import { z } from "zod";

export async function createTimeOff(data: z.infer<typeof appointmentTimeOffSchema>) {
  try {
    const validatedData = appointmentTimeOffSchema.parse(data);
    
    const timeOffDoc = {
      _type: "appointmentTimeOff",
      employee: validatedData.employee,
      startTime: validatedData.startTime,
      duration: validatedData.duration,
      reason: validatedData.reason || "",
      isRecurring: validatedData.isRecurring,
      recurringDuration: validatedData.recurringDuration,
      recurringFrequency: validatedData.recurringFrequency,
    };

    const result = await client.create(timeOffDoc);
    
    return {
      status: "SUCCESS" as const,
      data: result,
    };
  } catch (error) {
    console.error("Error creating time off:", error);
    return {
      status: "ERROR" as const,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateTimeOff(id: string, data: z.infer<typeof appointmentTimeOffSchema>) {
  try {
    const validatedData = appointmentTimeOffSchema.parse(data);
    
    const timeOffDoc = {
      employee: validatedData.employee,
      startTime: validatedData.startTime,
      duration: validatedData.duration,
      reason: validatedData.reason || "",
      isRecurring: validatedData.isRecurring,
      recurringDuration: validatedData.recurringDuration,
      recurringFrequency: validatedData.recurringFrequency,
    };

    const result = await client
      .patch(id)
      .set(timeOffDoc)
      .commit();
    
    return {
      status: "SUCCESS" as const,
      data: result,
    };
  } catch (error) {
    console.error("Error updating time off:", error);
    return {
      status: "ERROR" as const,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deleteTimeOff(id: string) {
  try {
    await client.delete(id);
    
    return {
      status: "SUCCESS" as const,
    };
  } catch (error) {
    console.error("Error deleting time off:", error);
    return {
      status: "ERROR" as const,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
