import { NextResponse } from "next/server";
import { getAllTimeTracking, getTimeTrackingByDateRange, getTimeTrackingByEmployee } from "@/data/time-tracking";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const employeeId = searchParams.get("employeeId");
    
    // If date range is provided
    if (startDate && endDate) {
      const timeTracking = await getTimeTrackingByDateRange(startDate, endDate);
      return NextResponse.json(timeTracking);
    }
    
    // If employeeId is provided
    if (employeeId) {
      const timeTracking = await getTimeTrackingByEmployee(employeeId);
      return NextResponse.json(timeTracking);
    }
    
    // Otherwise return all
    const timeTracking = await getAllTimeTracking();
    return NextResponse.json(timeTracking);
  } catch (error) {
    console.error("Error fetching time tracking:", error);
    return NextResponse.json(
      { error: "Failed to fetch time tracking" },
      { status: 500 }
    );
  }
}

