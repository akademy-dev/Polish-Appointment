import { supabase } from "@/lib/supabase";
import { calculateDuration } from "@/lib/utils";
import moment from "moment-timezone";
import { getIanaTimezone, parseOffset } from "@/lib/utils";

export interface Appointment {
  id: string;
  _id?: string; // For backward compatibility
  _type?: "appointment"; // For backward compatibility
  start_time?: string;
  startTime?: string; // For backward compatibility
  end_time?: string;
  endTime?: string; // For backward compatibility
  note?: string;
  employee_id?: string;
  customer_id?: string;
  service_id?: string;
  status?: string;
  type?: string;
  recurring_group_id?: string;
  recurringGroupId?: string; // For backward compatibility
  reminder?: string[];
  reminder_datetime?: string[];
  created_at?: string;
  _createdAt?: string; // For backward compatibility
  // Joined data
  customer?: {
    id: string;
    _id?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
  };
  employee?: {
    id: string;
    _id?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
  };
  service?: {
    id: string;
    _id?: string;
    name?: string;
    duration?: number;
  };
}

export interface AppointmentsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  searchTerm?: string;
  date?: string;
  customerId?: string;
}

export interface AppointmentsResponse {
  data: Appointment[];
  total: number;
}

export const getAppointments = async (
  params: AppointmentsQueryParams = {}
): Promise<AppointmentsResponse> => {
  try {
    const { page = 1, limit = 20, status = "", searchTerm = "" } = params;

    // Build query with joins
    let query = supabase.from("appointments").select(
      `
        *,
        customer:customers (
          id,
          first_name,
          last_name
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
      `,
      { count: "exact" }
    );

    // Apply status filter
    if (status) {
      query = query.eq("status", status);
    }

    // Apply search filter (search in customer, employee, service names)
    // Note: Supabase doesn't support searching across joined tables easily
    // We'll need to filter after fetching or use a different approach
    if (searchTerm && searchTerm.trim()) {
      // For now, we'll fetch all and filter client-side, or use a more complex query
      // This is a limitation - we might need to use full-text search or a different approach
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Order by start_time asc
    query = query.order("start_time", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      return { data: [], total: 0 };
    }

    // Transform data to match expected format
    let appointments: Appointment[] = (data || []).map((apt) => ({
      id: apt.id,
      _id: apt.id,
      _type: "appointment",
      start_time: apt.start_time,
      startTime: apt.start_time, // For backward compatibility
      end_time: apt.end_time,
      endTime: apt.end_time, // For backward compatibility
      note: apt.note,
      employee_id: apt.employee_id,
      customer_id: apt.customer_id,
      service_id: apt.service_id,
      status: apt.status,
      type: apt.type,
      recurring_group_id: apt.recurring_group_id,
      recurringGroupId: apt.recurring_group_id, // For backward compatibility
      reminder: apt.reminder || [],
      reminder_datetime: apt.reminder_datetime || [],
      created_at: apt.created_at,
      _createdAt: apt.created_at, // For backward compatibility
      customer: apt.customer
        ? {
            id: apt.customer.id,
            _id: apt.customer.id,
            firstName: apt.customer.first_name,
            lastName: apt.customer.last_name,
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
      // Calculate duration from start_time and end_time
      duration: calculateDuration(apt.start_time, apt.end_time),
    }));

    // Apply search filter client-side if needed
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      appointments = appointments.filter((apt) => {
        const customerName =
          `${apt.customer?.firstName || ""} ${apt.customer?.lastName || ""}`.toLowerCase();
        const employeeName =
          `${apt.employee?.firstName || ""} ${apt.employee?.lastName || ""}`.toLowerCase();
        const serviceName = (apt.service?.name || "").toLowerCase();
        return (
          customerName.includes(searchLower) ||
          employeeName.includes(searchLower) ||
          serviceName.includes(searchLower)
        );
      });
    }

    return {
      data: appointments,
      total: count || 0,
    };
  } catch (error) {
    return { data: [], total: 0 };
  }
};

export const getAppointmentsByCustomer = async (
  customerId: string
): Promise<Appointment[]> => {
  try {
    // Build query with joins
    let query = supabase.from("appointments").select(
      `
        *,
        customer:customers (
          id,
          first_name,
          last_name
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
    );

    // Filter by customer
    query = query.eq("customer_id", customerId);

    // Order by start_time desc (most recent first)
    query = query.order("start_time", { ascending: false });

    const { data, error } = await query;

    if (error) {
      return [];
    }

    // Transform data to match expected format
    const appointments: Appointment[] = (data || []).map((apt) => ({
      id: apt.id,
      _id: apt.id,
      _type: "appointment",
      start_time: apt.start_time,
      startTime: apt.start_time,
      end_time: apt.end_time,
      endTime: apt.end_time,
      note: apt.note,
      employee_id: apt.employee_id,
      customer_id: apt.customer_id,
      service_id: apt.service_id,
      status: apt.status,
      type: apt.type,
      recurring_group_id: apt.recurring_group_id,
      recurringGroupId: apt.recurring_group_id,
      reminder: apt.reminder || [],
      reminder_datetime: apt.reminder_datetime || [],
      created_at: apt.created_at,
      _createdAt: apt.created_at,
      customer: apt.customer
        ? {
            id: apt.customer.id,
            _id: apt.customer.id,
            firstName: apt.customer.first_name,
            lastName: apt.customer.last_name,
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
      // Calculate duration from start_time and end_time
      duration: calculateDuration(apt.start_time, apt.end_time),
    }));

    return appointments;
  } catch (error) {
    return [];
  }
};

export const getAppointmentsByDate = async (
  date: string,
  customerId?: string,
  timezone?: string
): Promise<Appointment[]> => {
  try {
    // IMPORTANT:
    // Do NOT filter by DATE(start_time) in UTC, because timestamptz is stored in UTC and
    // the user's "day" depends on the configured timezone.
    //
    // Instead, compute the UTC range for the requested local day and filter by start_time.
    const tzInput = timezone
      ? timezone.startsWith("UTC")
        ? parseOffset(timezone)
        : timezone
      : "UTC";
    const ianaTz = getIanaTimezone(tzInput);

    const startUtc = moment.tz(date, "YYYY-MM-DD", ianaTz).startOf("day").utc();
    const endUtc = startUtc.clone().add(1, "day");

    let query = supabase.from("appointments").select(
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
    );

    query = query.gte("start_time", startUtc.toISOString());
    query = query.lt("start_time", endUtc.toISOString());

    if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    query = query.order("start_time", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching appointments by date range:", error);
      return [];
    }

    // Transform data to match expected format
    const appointments: Appointment[] = (data || []).map((apt: any) => ({
      id: apt.id,
      _id: apt.id,
      _type: "appointment",
      start_time: apt.start_time,
      startTime: apt.start_time,
      end_time: apt.end_time,
      endTime: apt.end_time,
      note: apt.note,
      employee_id: apt.employee_id,
      customer_id: apt.customer_id,
      service_id: apt.service_id,
      status: apt.status,
      type: apt.type,
      recurring_group_id: apt.recurring_group_id,
      recurringGroupId: apt.recurring_group_id,
      reminder: apt.reminder || [],
      reminder_datetime: apt.reminder_datetime || [],
      created_at: apt.created_at,
      _createdAt: apt.created_at,
      customer: apt.customer
        ? {
            id: apt.customer.id,
            _id: apt.customer.id,
            firstName: apt.customer.first_name,
            lastName: apt.customer.last_name,
            fullName:
              `${apt.customer.first_name || ""} ${apt.customer.last_name || ""}`.trim(),
            phone: apt.customer.phone,
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
      duration: calculateDuration(apt.start_time, apt.end_time),
    }));

    return appointments;
  } catch (error) {
    console.error("Error in getAppointmentsByDate:", error);
    return [];
  }
};

export const getAppointmentsBy14Date = async (
  date: string,
  customerId?: string
): Promise<Appointment[]> => {
  try {
    // Use RPC function get_appointments_by_14_date
    const { data, error } = await supabase.rpc("get_appointments_by_14_date", {
      p_date: date,
      p_customer_id: customerId || null,
    });

    if (error) {
      console.error("Error calling get_appointments_by_14_date:", error);
      return [];
    }

    // Transform data to match expected format
    const appointments: Appointment[] = (data || []).map((apt: any) => ({
      id: apt.id,
      _id: apt.id,
      _type: "appointment",
      start_time: apt.start_time,
      startTime: apt.start_time,
      end_time: apt.end_time,
      endTime: apt.end_time,
      note: apt.note,
      employee_id: apt.employee_id,
      customer_id: apt.customer_id,
      service_id: apt.service_id,
      status: apt.status,
      type: apt.type,
      recurring_group_id: apt.recurring_group_id,
      recurringGroupId: apt.recurring_group_id,
      reminder: apt.reminder || [],
      reminder_datetime: apt.reminder_datetime || [],
      created_at: apt.created_at,
      _createdAt: apt.created_at,
      customer: apt.customer
        ? {
            id: apt.customer.id,
            _id: apt.customer.id,
            firstName: apt.customer.first_name,
            lastName: apt.customer.last_name,
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
      // Use duration_minutes from RPC if available, otherwise calculate
      duration:
        apt.duration_minutes || calculateDuration(apt.start_time, apt.end_time),
    }));

    return appointments;
  } catch (error) {
    console.error("Error in getAppointmentsBy14Date:", error);
    return [];
  }
};

export const createAppointment = async (
  startTime: string,
  endTime: string,
  customerId: string,
  employeeId: string,
  serviceId: string,
  status: string,
  type: string,
  note: string | null,
  reminder: string[],
  recurringGroupId?: string,
  reminderDatetime?: string[]
): Promise<Appointment | null> => {
  try {
    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        start_time: startTime,
        end_time: endTime,
        customer_id: customerId,
        employee_id: employeeId,
        service_id: serviceId,
        status: status,
        type: type,
        note: note || null,
        reminder: reminder.length > 0 ? reminder : null,
        reminder_datetime:
          reminderDatetime && reminderDatetime.length > 0
            ? reminderDatetime
            : null,
        recurring_group_id: recurringGroupId || null,
      })
      .select(
        `
        *,
        customer:customers (
          id,
          first_name,
          last_name
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
      .single();

    if (error) {
      console.error("[CREATE APP] ❌ Supabase API Error:", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`Failed to create appointment: ${error.message}`);
    }

    if (!appointment || !appointment.id) {
      throw new Error("Failed to create appointment: No ID returned");
    }

    return {
      id: appointment.id,
      _id: appointment.id,
      _type: "appointment",
      start_time: appointment.start_time,
      startTime: appointment.start_time,
      end_time: appointment.end_time,
      endTime: appointment.end_time,
      note: appointment.note,
      employee_id: appointment.employee_id,
      customer_id: appointment.customer_id,
      service_id: appointment.service_id,
      status: appointment.status,
      type: appointment.type,
      recurring_group_id: appointment.recurring_group_id,
      recurringGroupId: appointment.recurring_group_id,
      reminder: appointment.reminder || [],
      reminder_datetime: appointment.reminder_datetime || [],
      created_at: appointment.created_at,
      customer: appointment.customer
        ? {
            id: appointment.customer.id,
            _id: appointment.customer.id,
            firstName: appointment.customer.first_name,
            lastName: appointment.customer.last_name,
            fullName:
              `${appointment.customer.first_name || ""} ${appointment.customer.last_name || ""}`.trim(),
          }
        : undefined,
      employee: appointment.employee
        ? {
            id: appointment.employee.id,
            _id: appointment.employee.id,
            firstName: appointment.employee.first_name,
            lastName: appointment.employee.last_name,
            fullName:
              `${appointment.employee.first_name || ""} ${appointment.employee.last_name || ""}`.trim(),
          }
        : undefined,
      service: appointment.service
        ? {
            id: appointment.service.id,
            _id: appointment.service.id,
            name: appointment.service.name,
            duration: appointment.service.duration,
          }
        : undefined,
      // Calculate duration from start_time and end_time
      duration: calculateDuration(appointment.start_time, appointment.end_time),
    } as Appointment & { duration?: number };
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
};

export const updateAppointment = async (
  id: string,
  updates: {
    startTime?: string;
    endTime?: string;
    customerId?: string;
    employeeId?: string;
    serviceId?: string;
    status?: string;
    type?: string;
    note?: string | null;
    reminder?: string[];
    recurringGroupId?: string;
    reminderDatetime?: string[];
  }
): Promise<Appointment | null> => {
  try {
    const updateData: any = {};
    if (updates.startTime !== undefined)
      updateData.start_time = updates.startTime;
    if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
    if (updates.customerId !== undefined)
      updateData.customer_id = updates.customerId || null;
    if (updates.employeeId !== undefined)
      updateData.employee_id = updates.employeeId || null;
    if (updates.serviceId !== undefined)
      updateData.service_id = updates.serviceId || null;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.note !== undefined) updateData.note = updates.note || null;
    if (updates.reminder !== undefined)
      updateData.reminder =
        updates.reminder.length > 0 ? updates.reminder : null;
    if (updates.reminderDatetime !== undefined)
      updateData.reminder_datetime =
        updates.reminderDatetime.length > 0 ? updates.reminderDatetime : null;
    if (updates.recurringGroupId !== undefined)
      updateData.recurring_group_id = updates.recurringGroupId || null;

    const { data: appointment, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        customer:customers (
          id,
          first_name,
          last_name
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
      .single();

    if (error) {
      throw new Error(`Failed to update appointment: ${error.message}`);
    }

    if (!appointment) {
      throw new Error("Failed to update appointment: No data returned");
    }

    return {
      id: appointment.id,
      _id: appointment.id,
      _type: "appointment",
      start_time: appointment.start_time,
      startTime: appointment.start_time,
      end_time: appointment.end_time,
      endTime: appointment.end_time,
      note: appointment.note,
      employee_id: appointment.employee_id,
      customer_id: appointment.customer_id,
      service_id: appointment.service_id,
      status: appointment.status,
      type: appointment.type,
      recurring_group_id: appointment.recurring_group_id,
      recurringGroupId: appointment.recurring_group_id,
      reminder: appointment.reminder || [],
      reminder_datetime: appointment.reminder_datetime || [],
      created_at: appointment.created_at,
      customer: appointment.customer
        ? {
            id: appointment.customer.id,
            _id: appointment.customer.id,
            firstName: appointment.customer.first_name,
            lastName: appointment.customer.last_name,
            fullName:
              `${appointment.customer.first_name || ""} ${appointment.customer.last_name || ""}`.trim(),
          }
        : undefined,
      employee: appointment.employee
        ? {
            id: appointment.employee.id,
            _id: appointment.employee.id,
            firstName: appointment.employee.first_name,
            lastName: appointment.employee.last_name,
            fullName:
              `${appointment.employee.first_name || ""} ${appointment.employee.last_name || ""}`.trim(),
          }
        : undefined,
      service: appointment.service
        ? {
            id: appointment.service.id,
            _id: appointment.service.id,
            name: appointment.service.name,
            duration: appointment.service.duration,
          }
        : undefined,
      // Calculate duration from start_time and end_time
      duration: calculateDuration(appointment.start_time, appointment.end_time),
    } as Appointment & { duration?: number };
  } catch (error) {
    throw error;
  }
};

export const deleteAppointment = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("appointments").delete().eq("id", id);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const deleteAppointmentsByRecurringGroup = async (
  recurringGroupId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("recurring_group_id", recurringGroupId);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const cancelRecurringAppointments = async (
  recurringGroupId: string
): Promise<{ count: number }> => {
  try {
    // Find all appointments with the same recurringGroupId and status = "scheduled"
    const { data: appointments, error: fetchError } = await supabase
      .from("appointments")
      .select("id")
      .eq("recurring_group_id", recurringGroupId)
      .eq("status", "scheduled");

    if (fetchError) {
      throw new Error(
        `Failed to fetch recurring appointments: ${fetchError.message}`
      );
    }

    if (!appointments || appointments.length === 0) {
      return { count: 0 };
    }

    // Update all appointments to cancelled status
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("recurring_group_id", recurringGroupId)
      .eq("status", "scheduled");

    if (updateError) {
      throw new Error(
        `Failed to cancel recurring appointments: ${updateError.message}`
      );
    }

    return { count: appointments.length };
  } catch (error) {
    throw error;
  }
};

/**
 * Check for appointment conflicts (overlapping appointments)
 * Uses RPC function check_appointment_conflicts
 */
export const checkAppointmentConflicts = async (
  employeeId: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
): Promise<Appointment[]> => {
  try {
    // Use RPC function check_appointment_conflicts
    const { data, error } = await supabase.rpc("check_appointment_conflicts", {
      p_employee_id: employeeId,
      p_start_time: startTime,
      p_end_time: endTime,
      p_exclude_appointment_id: excludeAppointmentId || null,
    });

    if (error) {
      console.error("[CREATE APP] ❌ checkAppointmentConflicts RPC error:", {
        error: error.message,
        code: error.code,
        details: error.details,
      });
      return [];
    }

    // Transform data to match expected format
    return (data || []).map(
      (apt: any) =>
        ({
          id: apt.id,
          _id: apt.id,
          start_time: apt.start_time,
          startTime: apt.start_time,
          end_time: apt.end_time,
          endTime: apt.end_time,
          employee_id: apt.employee_id,
          customer_id: apt.customer_id,
          service_id: apt.service_id,
          status: apt.status,
          customer: apt.customer
            ? {
                id: apt.customer.id,
                _id: apt.customer.id,
                firstName: apt.customer.first_name,
                lastName: apt.customer.last_name,
                fullName:
                  `${apt.customer.first_name || ""} ${apt.customer.last_name || ""}`.trim(),
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
          // Add duration as computed property (not in interface but used by callers)
          duration:
            apt.duration_minutes ||
            calculateDuration(apt.start_time, apt.end_time),
        }) as Appointment & { duration?: number }
    );
  } catch (error) {
    console.error("[CREATE APP] ❌ Error in checkAppointmentConflicts:", error);
    return [];
  }
};
