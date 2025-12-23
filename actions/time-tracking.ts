"use server";

import {
  createTimeTracking as createTimeTrackingSupabase,
  updateTimeTracking as updateTimeTrackingSupabase,
  deleteTimeTracking as deleteTimeTrackingSupabase,
  getTimeTrackingById,
  getTimeTrackingByDateRange as getTimeTrackingByDateRangeSupabase,
  getTimeTrackingByEmployee as getTimeTrackingByEmployeeSupabase,
} from "@/data/time-tracking";
import { revalidatePath } from "next/cache";

export async function createTimeTracking(data: {
  employee: { _ref: string; _type: "reference" };
  checkIn: string;
  hourlyRate?: number;
  note?: string;
}) {
  try {
    const timeTracking = await createTimeTrackingSupabase(
      data.employee._ref,
      data.checkIn,
      data.hourlyRate,
      data.note
    );

    revalidatePath("/time-tracking");

    return {
      status: "SUCCESS" as const,
      data: timeTracking,
    };
  } catch (error) {
    console.error("Error creating time tracking:", error);
    return {
      status: "ERROR" as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create time tracking",
    };
  }
}

export async function updateTimeTracking(
  id: string,
  data: {
    checkOut?: string;
    hourlyRate?: number;
    note?: string;
    status?: "checked_in" | "checked_out";
  }
) {
  try {
    // Calculate total hours and pay if checkOut is provided
    let totalHours: number | undefined;
    let totalPay: number | undefined;

    if (data.checkOut) {
      const existingRecord = await getTimeTrackingById(id);

      if (existingRecord?.checkIn) {
        const checkIn = new Date(existingRecord.checkIn);
        const checkOut = new Date(data.checkOut);
        totalHours =
          (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60); // Convert to hours

        if (data.hourlyRate || existingRecord.hourlyRate) {
          const rate = data.hourlyRate || existingRecord.hourlyRate;
          totalPay = totalHours * rate;
        }
      }
    }

    const timeTracking = await updateTimeTrackingSupabase(id, {
      ...data,
      ...(totalHours !== undefined && { totalHours }),
      ...(totalPay !== undefined && { totalPay }),
    });

    revalidatePath("/time-tracking");

    return {
      status: "SUCCESS" as const,
      data: timeTracking,
    };
  } catch (error) {
    console.error("Error updating time tracking:", error);
    return {
      status: "ERROR" as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update time tracking",
    };
  }
}

export async function deleteTimeTracking(id: string) {
  try {
    await deleteTimeTrackingSupabase(id);

    revalidatePath("/time-tracking");

    return {
      status: "SUCCESS" as const,
    };
  } catch (error) {
    console.error("Error deleting time tracking:", error);
    return {
      status: "ERROR" as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete time tracking",
    };
  }
}

export async function getTimeTrackingByDateRange(
  startDate: string,
  endDate: string
) {
  try {
    const timeTracking = await getTimeTrackingByDateRangeSupabase(
      startDate,
      endDate
    );

    return {
      status: "SUCCESS" as const,
      data: timeTracking,
    };
  } catch (error) {
    console.error("Error fetching time tracking:", error);
    return {
      status: "ERROR" as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch time tracking",
    };
  }
}

export async function getTimeTrackingByEmployee(employeeId: string) {
  try {
    const timeTracking = await getTimeTrackingByEmployeeSupabase(employeeId);

    return {
      status: "SUCCESS" as const,
      data: timeTracking,
    };
  } catch (error) {
    console.error("Error fetching time tracking:", error);
    return {
      status: "ERROR" as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch time tracking",
    };
  }
}

export async function calculateTotalPay(
  timeTrackingRecords: Array<{
    totalPay?: number;
    hourlyRate?: number;
    totalHours?: number;
  }>
) {
  let totalPay = 0;
  let totalHours = 0;

  timeTrackingRecords.forEach((record) => {
    if (record.totalPay) {
      totalPay += record.totalPay;
    } else if (record.hourlyRate && record.totalHours) {
      totalPay += record.hourlyRate * record.totalHours;
    }

    if (record.totalHours) {
      totalHours += record.totalHours;
    }
  });

  return {
    totalPay: Math.round(totalPay * 100) / 100, // Round to 2 decimal places
    totalHours: Math.round(totalHours * 100) / 100,
  };
}
