import { NextResponse } from "next/server";
import { getAppointmentTimeOffs } from "@/data/appointment-time-off";

export async function GET(request: Request) {
  try {
    const timeOffs = await getAppointmentTimeOffs();
    return NextResponse.json(timeOffs);
  } catch (error) {
    console.error("Error fetching appointment time offs:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment time offs" },
      { status: 500 }
    );
  }
}

