import { NextResponse } from "next/server";
import {
  getAppointmentsByDate,
  getAppointmentsBy14Date,
  getAppointmentsByCustomer,
} from "@/data/appointment";
import { supabase } from "@/lib/supabase";
import { getSettings } from "@/data/settings";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const customerId = searchParams.get("customerId");
    const employeeId = searchParams.get("employeeId");
    const timezoneParam = searchParams.get("timezone");

    // If employeeId is provided, fetch all appointments for that employee
    if (employeeId) {
      try {
        let query = supabase
          .from("appointments")
          .select(
            `
            *,
            customer:customers (
              id,
              first_name,
              last_name,
              phone
            ),
            employee:employees (
              id,
              first_name,
              last_name
            ),
            service:services (
              id,
              name,
              duration
            )
          `
          )
          .eq("employee_id", employeeId)
          .order("start_time", { ascending: false });

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching appointments by employee:", error);
          return NextResponse.json([]);
        }

        // Transform data to match expected format
        const appointments = (data || []).map((apt: any) => ({
          id: apt.id,
          _id: apt.id,
          start_time: apt.start_time,
          startTime: apt.start_time,
          end_time: apt.end_time,
          endTime: apt.end_time,
          note: apt.note,
          status: apt.status,
          type: apt.type,
          recurring_group_id: apt.recurring_group_id,
          reminder: apt.reminder || [],
          created_at: apt.created_at,
          _createdAt: apt.created_at,
          customer: apt.customer
            ? {
                id: apt.customer.id,
                _id: apt.customer.id,
                firstName: apt.customer.first_name,
                lastName: apt.customer.last_name,
                phone: apt.customer.phone,
                fullName:
                  `${apt.customer.first_name || ""} ${apt.customer.last_name || ""}`.trim(),
              }
            : undefined,
          employee: apt.employee
            ? {
                id: apt.employee.id,
                _id: apt.employee.id,
                firstName: apt.employee.first_name,
                lastName: apt.employee.last_name,
                fullName:
                  `${apt.employee.first_name || ""} ${apt.employee.last_name || ""}`.trim(),
              }
            : undefined,
          service: apt.service
            ? {
                id: apt.service.id,
                _id: apt.service.id,
                name: apt.service.name,
                duration: apt.service.duration,
              }
            : undefined,
        }));

        return NextResponse.json(appointments);
      } catch (error) {
        console.error("Error fetching appointments by employee:", error);
        return NextResponse.json([]);
      }
    }

    // If date is null or not provided, but customerId is provided, fetch all appointments for that customer
    if ((!date || date === "null") && customerId) {
      const appointments = await getAppointmentsByCustomer(customerId);
      return NextResponse.json(appointments);
    }

    // If date is provided, fetch appointments by date (and optionally by customer)
    if (date && date !== "null") {
      // Prefer explicit timezone param, otherwise fall back to settings
      const settings = await getSettings();
      const timezone = timezoneParam || settings?.timezone || "UTC-7:00";

      // Check if we should use 14-day RPC (for checking upcoming appointments)
      const use14Day = searchParams.get("use14Day") === "true";

      if (use14Day) {
        const appointments = await getAppointmentsBy14Date(
          date,
          customerId || undefined
        );
        return NextResponse.json(appointments);
      } else {
        const appointments = await getAppointmentsByDate(
          date,
          customerId || undefined,
          timezone
        );
        return NextResponse.json(appointments);
      }
    }

    // If appointmentId is provided, call the SQL function
    const appointmentId = searchParams.get("appointmentId");
    if (appointmentId) {
      try {
        const { data, error } = await supabase.rpc(
          "get_appointment_with_services_same_day",
          { p_appointment_id: appointmentId }
        );

        if (error) {
          console.error(
            "Error calling get_appointment_with_services_same_day:",
            error
          );
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (process.env.NODE_ENV !== "production") {
          const sample =
            Array.isArray(data) && data.length > 0 ? (data as any)[0] : data;
          console.log(
            "[api/appointments] RPC get_appointment_with_services_same_day",
            {
              appointmentId,
              rows: Array.isArray(data) ? data.length : 0,
              sample: sample
                ? {
                    id: (sample as any).id,
                    employee_id: (sample as any).employee_id,
                    employee_first_name: (sample as any).employee_first_name,
                    employee_last_name: (sample as any).employee_last_name,
                    services_same_day_count: Array.isArray(
                      (sample as any).services_same_day
                    )
                      ? (sample as any).services_same_day.length
                      : 0,
                  }
                : sample,
            }
          );
        }

        return NextResponse.json(data);
      } catch (error) {
        console.error(
          "Error calling get_appointment_with_services_same_day:",
          error
        );
        return NextResponse.json(
          { error: "Failed to call function" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "Either date, customerId, employeeId, or appointmentId parameter is required",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}
