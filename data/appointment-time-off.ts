import { supabase } from "@/lib/supabase";
import moment from "moment-timezone";
import { getIanaTimezone, parseOffset } from "@/lib/utils";

export interface AppointmentTimeOff {
  id: string;
  _id: string; // For backward compatibility
  _createdAt: string;
  _updatedAt?: string;
  employee_id: string;
  employee?: {
    _id: string;
    id: string;
    firstName: string;
    first_name: string;
    lastName: string;
    last_name: string;
    phone?: string;
  };
  startTime: string;
  start_time: string;
  duration: number | "to_close";
  reason?: string | null;
  isRecurring: boolean;
  is_recurring: boolean;
  recurringDuration?: {
    value: number;
    unit: "days" | "weeks" | "months";
  } | null;
  recurring_duration?: {
    value: number;
    unit: "days" | "weeks" | "months";
  } | null;
  recurringFrequency?: {
    value: number;
    unit: "days" | "weeks";
  } | null;
  recurring_frequency?: {
    value: number;
    unit: "days" | "weeks";
  } | null;
  created_at: string;
}

/**
 * Get all appointment time offs with employee information
 */
export const getAppointmentTimeOffs = async (): Promise<
  AppointmentTimeOff[]
> => {
  try {
    const { data, error } = await supabase
      .from("appointment_time_off")
      .select(
        `
        *,
        employee:employees (
          id,
          first_name,
          last_name,
          phone
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    // Transform to match expected format
    const timeOffs: AppointmentTimeOff[] = (data || []).map((to: any) => ({
      id: to.id,
      _id: to.id,
      _createdAt: to.created_at,
      _updatedAt: to.created_at, // Supabase doesn't have updated_at, use created_at
      employee_id: to.employee_id,
      employee: to.employee
        ? {
            _id: to.employee.id,
            id: to.employee.id,
            firstName: to.employee.first_name,
            first_name: to.employee.first_name,
            lastName: to.employee.last_name,
            last_name: to.employee.last_name,
            phone: to.employee.phone || undefined,
          }
        : undefined,
      startTime: to.start_time,
      start_time: to.start_time,
      duration: to.duration,
      reason: to.reason,
      isRecurring: to.is_recurring || false,
      is_recurring: to.is_recurring || false,
      recurringDuration: to.recurring_duration,
      recurring_duration: to.recurring_duration,
      recurringFrequency: to.recurring_frequency,
      recurring_frequency: to.recurring_frequency,
      created_at: to.created_at,
    }));

    return timeOffs;
  } catch (error) {
    return [];
  }
};

/**
 * Get appointment time offs for a specific local day (timezone-aware).
 * This is much lighter than fetching all rows and filtering client-side.
 */
export const getAppointmentTimeOffsByDate = async (
  date: string,
  timezone: string
): Promise<AppointmentTimeOff[]> => {
  try {
    const tzInput = timezone?.startsWith("UTC")
      ? parseOffset(timezone)
      : timezone;
    const ianaTz = getIanaTimezone(tzInput || "UTC");
    const startUtc = moment.tz(date, "YYYY-MM-DD", ianaTz).startOf("day").utc();
    const endUtc = startUtc.clone().add(1, "day");

    const { data, error } = await supabase
      .from("appointment_time_off")
      .select(
        `
        id,
        employee_id,
        start_time,
        duration,
        reason,
        is_recurring,
        recurring_duration,
        recurring_frequency,
        created_at,
        employee:employees (
          id,
          first_name,
          last_name,
          phone
        )
      `
      )
      .gte("start_time", startUtc.toISOString())
      .lt("start_time", endUtc.toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      return [];
    }

    return (data || []).map((to: any) => ({
      id: to.id,
      _id: to.id,
      _createdAt: to.created_at,
      _updatedAt: to.created_at,
      employee_id: to.employee_id,
      employee: to.employee
        ? {
            _id: to.employee.id,
            id: to.employee.id,
            firstName: to.employee.first_name,
            first_name: to.employee.first_name,
            lastName: to.employee.last_name,
            last_name: to.employee.last_name,
            phone: to.employee.phone || undefined,
          }
        : undefined,
      startTime: to.start_time,
      start_time: to.start_time,
      duration: to.duration === null ? "to_close" : to.duration,
      reason: to.reason,
      isRecurring: to.is_recurring || false,
      is_recurring: to.is_recurring || false,
      recurringDuration: to.recurring_duration,
      recurring_duration: to.recurring_duration,
      recurringFrequency: to.recurring_frequency,
      recurring_frequency: to.recurring_frequency,
      created_at: to.created_at,
    }));
  } catch (error) {
    return [];
  }
};

/**
 * Create a single appointment time off
 */
export const createAppointmentTimeOff = async (
  employeeId: string,
  startTime: string,
  duration: number | "to_close",
  reason?: string | null,
  isRecurring: boolean = false,
  recurringDuration?: {
    value: number;
    unit: "days" | "weeks" | "months";
  } | null,
  recurringFrequency?: {
    value: number;
    unit: "days" | "weeks";
  } | null
): Promise<AppointmentTimeOff | null> => {
  try {
    // Convert "to_close" to a number if needed, or store as null
    const durationValue = duration === "to_close" ? null : duration;

    const { data, error } = await supabase
      .from("appointment_time_off")
      .insert({
        employee_id: employeeId,
        start_time: startTime,
        duration: durationValue,
        reason: reason || null,
        is_recurring: isRecurring,
        recurring_duration: recurringDuration || null,
        recurring_frequency: recurringFrequency || null,
      })
      .select(
        `
        *,
        employee:employees (
          id,
          first_name,
          last_name,
          phone
        )
      `
      )
      .single();

    if (error) {
      throw new Error(
        `Failed to create appointment time off: ${error.message}`
      );
    }

    if (!data) {
      return null;
    }

    // Transform to match expected format
    return {
      id: data.id,
      _id: data.id,
      _createdAt: data.created_at,
      _updatedAt: data.created_at,
      employee_id: data.employee_id,
      employee: data.employee
        ? {
            _id: data.employee.id,
            id: data.employee.id,
            firstName: data.employee.first_name,
            first_name: data.employee.first_name,
            lastName: data.employee.last_name,
            last_name: data.employee.last_name,
            phone: data.employee.phone || undefined,
          }
        : undefined,
      startTime: data.start_time,
      start_time: data.start_time,
      duration: data.duration === null ? "to_close" : data.duration,
      reason: data.reason,
      isRecurring: data.is_recurring || false,
      is_recurring: data.is_recurring || false,
      recurringDuration: data.recurring_duration,
      recurring_duration: data.recurring_duration,
      recurringFrequency: data.recurring_frequency,
      recurring_frequency: data.recurring_frequency,
      created_at: data.created_at,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Create multiple appointment time offs (for recurring)
 */
export const createMultipleAppointmentTimeOffs = async (
  timeOffs: Array<{
    employeeId: string;
    startTime: string;
    duration: number | "to_close";
    reason?: string | null;
    isRecurring: boolean;
    recurringDuration?: {
      value: number;
      unit: "days" | "weeks" | "months";
    } | null;
    recurringFrequency?: {
      value: number;
      unit: "days" | "weeks";
    } | null;
  }>
): Promise<AppointmentTimeOff[]> => {
  try {
    const insertData = timeOffs.map((to) => ({
      employee_id: to.employeeId,
      start_time: to.startTime,
      duration: to.duration === "to_close" ? null : to.duration,
      reason: to.reason || null,
      is_recurring: to.isRecurring,
      recurring_duration: to.recurringDuration || null,
      recurring_frequency: to.recurringFrequency || null,
    }));

    const { data, error } = await supabase
      .from("appointment_time_off")
      .insert(insertData)
      .select(
        `
        *,
        employee:employees (
          id,
          first_name,
          last_name,
          phone
        )
      `
      );

    if (error) {
      throw new Error(
        `Failed to create appointment time offs: ${error.message}`
      );
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform to match expected format
    return data.map((to: any) => ({
      id: to.id,
      _id: to.id,
      _createdAt: to.created_at,
      _updatedAt: to.created_at,
      employee_id: to.employee_id,
      employee: to.employee
        ? {
            _id: to.employee.id,
            id: to.employee.id,
            firstName: to.employee.first_name,
            first_name: to.employee.first_name,
            lastName: to.employee.last_name,
            last_name: to.employee.last_name,
            phone: to.employee.phone || undefined,
          }
        : undefined,
      startTime: to.start_time,
      start_time: to.start_time,
      duration: to.duration === null ? "to_close" : to.duration,
      reason: to.reason,
      isRecurring: to.is_recurring || false,
      is_recurring: to.is_recurring || false,
      recurringDuration: to.recurring_duration,
      recurring_duration: to.recurring_duration,
      recurringFrequency: to.recurring_frequency,
      recurring_frequency: to.recurring_frequency,
      created_at: to.created_at,
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * Update an appointment time off
 */
export const updateAppointmentTimeOff = async (
  id: string,
  updates: {
    employeeId?: string;
    startTime?: string;
    duration?: number | "to_close";
    reason?: string | null;
    isRecurring?: boolean;
    recurringDuration?: {
      value: number;
      unit: "days" | "weeks" | "months";
    } | null;
    recurringFrequency?: {
      value: number;
      unit: "days" | "weeks";
    } | null;
  }
): Promise<AppointmentTimeOff | null> => {
  try {
    const updateData: any = {};

    if (updates.employeeId !== undefined) {
      updateData.employee_id = updates.employeeId;
    }
    if (updates.startTime !== undefined) {
      updateData.start_time = updates.startTime;
    }
    if (updates.duration !== undefined) {
      updateData.duration =
        updates.duration === "to_close" ? null : updates.duration;
    }
    if (updates.reason !== undefined) {
      updateData.reason = updates.reason || null;
    }
    if (updates.isRecurring !== undefined) {
      updateData.is_recurring = updates.isRecurring;
    }
    if (updates.recurringDuration !== undefined) {
      updateData.recurring_duration = updates.recurringDuration || null;
    }
    if (updates.recurringFrequency !== undefined) {
      updateData.recurring_frequency = updates.recurringFrequency || null;
    }

    const { data, error } = await supabase
      .from("appointment_time_off")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        employee:employees (
          id,
          first_name,
          last_name,
          phone
        )
      `
      )
      .single();

    if (error) {
      throw new Error(
        `Failed to update appointment time off: ${error.message}`
      );
    }

    if (!data) {
      return null;
    }

    // Transform to match expected format
    return {
      id: data.id,
      _id: data.id,
      _createdAt: data.created_at,
      _updatedAt: data.created_at,
      employee_id: data.employee_id,
      employee: data.employee
        ? {
            _id: data.employee.id,
            id: data.employee.id,
            firstName: data.employee.first_name,
            first_name: data.employee.first_name,
            lastName: data.employee.last_name,
            last_name: data.employee.last_name,
            phone: data.employee.phone || undefined,
          }
        : undefined,
      startTime: data.start_time,
      start_time: data.start_time,
      duration: data.duration === null ? "to_close" : data.duration,
      reason: data.reason,
      isRecurring: data.is_recurring || false,
      is_recurring: data.is_recurring || false,
      recurringDuration: data.recurring_duration,
      recurring_duration: data.recurring_duration,
      recurringFrequency: data.recurring_frequency,
      recurring_frequency: data.recurring_frequency,
      created_at: data.created_at,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Delete an appointment time off
 */
export const deleteAppointmentTimeOff = async (
  id: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("appointment_time_off")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(
        `Failed to delete appointment time off: ${error.message}`
      );
    }

    return true;
  } catch (error) {
    throw error;
  }
};
