"use server";

import { client } from "@/sanity/lib/client";
import { appointmentTimeOffSchema } from "@/lib/validation";
import { z } from "zod";

export async function createTimeOff(data: z.infer<typeof appointmentTimeOffSchema>) {
  try {
    const validatedData = appointmentTimeOffSchema.parse(data);
    
    if (validatedData.isRecurring && validatedData.recurringDuration && validatedData.recurringFrequency) {
      // Create multiple time offs for recurring pattern
      const timeOffs = [];
      const startDate = new Date(validatedData.startTime);
      const durationValue = validatedData.recurringDuration.value;
      const durationUnit = validatedData.recurringDuration.unit;
      const frequencyValue = validatedData.recurringFrequency.value;
      const frequencyUnit = validatedData.recurringFrequency.unit;
      
      // Calculate end date based on recurring duration
      const endDate = new Date(startDate);
      if (durationUnit === "days") {
        endDate.setDate(endDate.getDate() + durationValue);
      } else if (durationUnit === "weeks") {
        endDate.setDate(endDate.getDate() + (durationValue * 7));
      } else if (durationUnit === "months") {
        endDate.setMonth(endDate.getMonth() + durationValue);
      }
      
      // Generate time offs based on frequency
      let currentDate = new Date(startDate);
      let timeOffCount = 0;
      const maxTimeOffs = 100; // Prevent infinite loop
      
      while (currentDate < endDate && timeOffCount < maxTimeOffs) {
        const timeOffDoc = {
          _type: "appointmentTimeOff",
          employee: validatedData.employee,
          startTime: currentDate.toISOString(),
          duration: validatedData.duration,
          reason: validatedData.reason || "",
          isRecurring: true,
          recurringDuration: validatedData.recurringDuration,
          recurringFrequency: validatedData.recurringFrequency,
        };
        
        timeOffs.push(timeOffDoc);
        
        // Calculate next date based on frequency
        if (frequencyUnit === "days") {
          currentDate.setDate(currentDate.getDate() + frequencyValue);
        } else if (frequencyUnit === "weeks") {
          currentDate.setDate(currentDate.getDate() + (frequencyValue * 7));
        }
        
        timeOffCount++;
      }
      
      // Create all time offs one by one
      const results = [];
      for (const timeOffDoc of timeOffs) {
        const result = await client.create(timeOffDoc);
        results.push(result);
      }
      
      return {
        status: "SUCCESS" as const,
        data: results,
        count: timeOffs.length,
      };
    } else {
      // Create single time off
      const timeOffDoc = {
        _type: "appointmentTimeOff",
        employee: validatedData.employee,
        startTime: validatedData.startTime,
        duration: validatedData.duration,
        reason: validatedData.reason || "",
        isRecurring: false,
      };

      const result = await client.create(timeOffDoc);
      
      return {
        status: "SUCCESS" as const,
        data: result,
        count: 1,
      };
    }
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
