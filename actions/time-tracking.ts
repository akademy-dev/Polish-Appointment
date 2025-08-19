"use server";

import { client } from "@/sanity/lib/client";
import { writeClient } from "@/sanity/lib/write-client";
import { TimeTracking } from "@/sanity/types";

export async function createTimeTracking(data: {
  employee: { _ref: string; _type: "reference" };
  checkIn: string;
  hourlyRate?: number;
  note?: string;
}) {
  try {
    const timeTracking = await writeClient.create({
      _type: "timeTracking",
      employee: data.employee,
      checkIn: data.checkIn,
      hourlyRate: data.hourlyRate,
      note: data.note,
      status: "checked_in",
    });

    return {
      status: "SUCCESS" as const,
      data: timeTracking,
    };
  } catch (error) {
    console.error("Error creating time tracking:", error);
    return {
      status: "ERROR" as const,
      error: "Failed to create time tracking",
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
      const existingRecord = await client.fetch(
        `*[_type == "timeTracking" && _id == $id][0]`,
        { id }
      );

      if (existingRecord?.checkIn) {
        const checkIn = new Date(existingRecord.checkIn);
        const checkOut = new Date(data.checkOut);
        totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60); // Convert to hours

        if (data.hourlyRate || existingRecord.hourlyRate) {
          const rate = data.hourlyRate || existingRecord.hourlyRate;
          totalPay = totalHours * rate;
        }
      }
    }

    const timeTracking = await writeClient
      .patch(id)
      .set({
        ...data,
        ...(totalHours !== undefined && { totalHours }),
        ...(totalPay !== undefined && { totalPay }),
      })
      .commit();

    return {
      status: "SUCCESS" as const,
      data: timeTracking,
    };
  } catch (error) {
    console.error("Error updating time tracking:", error);
    return {
      status: "ERROR" as const,
      error: "Failed to update time tracking",
    };
  }
}

export async function deleteTimeTracking(id: string) {
  try {
    await writeClient.delete(id);
    return {
      status: "SUCCESS" as const,
    };
  } catch (error) {
    console.error("Error deleting time tracking:", error);
    return {
      status: "ERROR" as const,
      error: "Failed to delete time tracking",
    };
  }
}

export async function getTimeTrackingByDateRange(
  startDate: string,
  endDate: string
) {
  try {
    const timeTracking = await client.fetch(
      `*[_type == "timeTracking" && 
        checkIn >= $startDate && 
        checkIn <= $endDate
      ] | order(checkIn desc) {
        _id,
        employee->{
          _id,
          firstName,
          lastName
        },
        checkIn,
        checkOut,
        hourlyRate,
        totalHours,
        totalPay,
        note,
        status,
        _createdAt,
        _updatedAt
      }`,
      { startDate, endDate }
    );

    return {
      status: "SUCCESS" as const,
      data: timeTracking,
    };
  } catch (error) {
    console.error("Error fetching time tracking:", error);
    return {
      status: "ERROR" as const,
      error: "Failed to fetch time tracking",
    };
  }
}

export async function getTimeTrackingByEmployee(employeeId: string) {
  try {
    const timeTracking = await client.fetch(
      `*[_type == "timeTracking" && 
        employee._ref == $employeeId
      ] | order(checkIn desc) {
        _id,
        employee->{
          _id,
          firstName,
          lastName
        },
        checkIn,
        checkOut,
        hourlyRate,
        totalHours,
        totalPay,
        note,
        status,
        _createdAt,
        _updatedAt
      }`,
      { employeeId }
    );

    return {
      status: "SUCCESS" as const,
      data: timeTracking,
    };
  } catch (error) {
    console.error("Error fetching time tracking:", error);
    return {
      status: "ERROR" as const,
      error: "Failed to fetch time tracking",
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
