import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const employeeId = searchParams.get("employeeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    const limit = limitParam ? Number(limitParam) : 100;
    const offset = offsetParam ? Number(offsetParam) : 0;

    const { data, error } = await supabase.rpc("get_appointment_history_json", {
      p_customer_id: customerId || null,
      p_employee_id: employeeId || null,
      p_start_date: startDate || null,
      p_end_date: endDate || null,
      p_limit: Number.isFinite(limit) ? limit : 100,
      p_offset: Number.isFinite(offset) ? offset : 0,
    });

    if (error) {
      console.error("Error calling get_appointment_history_json:", error);
      return NextResponse.json({ total: 0, data: [] }, { status: 500 });
    }

    // Expected shape:
    // { total: number, data: [{ Date, Customer, Service, Duration }, ...] }
    return NextResponse.json(data ?? { total: 0, data: [] });
  } catch (error) {
    console.error("Error in /api/appointment-history:", error);
    return NextResponse.json({ total: 0, data: [] }, { status: 500 });
  }
}
