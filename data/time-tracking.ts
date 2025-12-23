import { supabase } from "@/lib/supabase";

export interface TimeTracking {
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
  };
  checkIn: string;
  check_in: string;
  checkOut?: string | null;
  check_out?: string | null;
  hourlyRate?: number | null;
  hourly_rate?: number | null;
  totalHours?: number | null;
  total_hours?: number | null;
  totalPay?: number | null;
  total_pay?: number | null;
  note?: string | null;
  status: "checked_in" | "checked_out";
  created_at: string;
  updated_at?: string;
}

/**
 * Create a new time tracking record
 */
export const createTimeTracking = async (
  employeeId: string,
  checkIn: string,
  hourlyRate?: number | null,
  note?: string | null
): Promise<TimeTracking | null> => {
  try {
    const { data, error } = await supabase
      .from("time_tracking")
      .insert({
        employee_id: employeeId,
        check_in: checkIn,
        hourly_rate: hourlyRate || null,
        note: note || null,
        status: "checked_in",
      })
      .select(
        `
        *,
        employee:employees (
          id,
          first_name,
          last_name
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to create time tracking: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return transformTimeTracking(data);
  } catch (error) {
    throw error;
  }
};

/**
 * Update a time tracking record
 */
export const updateTimeTracking = async (
  id: string,
  updates: {
    checkOut?: string;
    hourlyRate?: number;
    note?: string;
    status?: "checked_in" | "checked_out";
    totalHours?: number;
    totalPay?: number;
  }
): Promise<TimeTracking | null> => {
  try {
    const updateData: any = {};
    
    if (updates.checkOut !== undefined) {
      updateData.check_out = updates.checkOut;
    }
    if (updates.hourlyRate !== undefined) {
      updateData.hourly_rate = updates.hourlyRate;
    }
    if (updates.note !== undefined) {
      updateData.note = updates.note || null;
    }
    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }
    if (updates.totalHours !== undefined) {
      updateData.total_hours = updates.totalHours;
    }
    if (updates.totalPay !== undefined) {
      updateData.total_pay = updates.totalPay;
    }

    const { data, error } = await supabase
      .from("time_tracking")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        employee:employees (
          id,
          first_name,
          last_name
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to update time tracking: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return transformTimeTracking(data);
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a time tracking record
 */
export const deleteTimeTracking = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("time_tracking")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete time tracking: ${error.message}`);
    }

    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Get time tracking records by date range
 */
export const getTimeTrackingByDateRange = async (
  startDate: string,
  endDate: string
): Promise<TimeTracking[]> => {
  try {
    const { data, error } = await supabase
      .from("time_tracking")
      .select(
        `
        *,
        employee:employees (
          id,
          first_name,
          last_name
        )
      `
      )
      .gte("check_in", startDate)
      .lte("check_in", endDate)
      .order("check_in", { ascending: false });

    if (error) {
      return [];
    }

    return (data || []).map(transformTimeTracking);
  } catch (error) {
    return [];
  }
};

/**
 * Get time tracking records by employee
 */
export const getTimeTrackingByEmployee = async (
  employeeId: string
): Promise<TimeTracking[]> => {
  try {
    const { data, error } = await supabase
      .from("time_tracking")
      .select(
        `
        *,
        employee:employees (
          id,
          first_name,
          last_name
        )
      `
      )
      .eq("employee_id", employeeId)
      .order("check_in", { ascending: false });

    if (error) {
      return [];
    }

    return (data || []).map(transformTimeTracking);
  } catch (error) {
    return [];
  }
};

/**
 * Get all time tracking records
 */
export const getAllTimeTracking = async (): Promise<TimeTracking[]> => {
  try {
    const { data, error } = await supabase
      .from("time_tracking")
      .select(
        `
        *,
        employee:employees (
          id,
          first_name,
          last_name
        )
      `
      )
      .order("check_in", { ascending: false });

    if (error) {
      return [];
    }

    return (data || []).map(transformTimeTracking);
  } catch (error) {
    return [];
  }
};

/**
 * Get a single time tracking record by ID
 */
export const getTimeTrackingById = async (
  id: string
): Promise<TimeTracking | null> => {
  try {
    const { data, error } = await supabase
      .from("time_tracking")
      .select(
        `
        *,
        employee:employees (
          id,
          first_name,
          last_name
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      return null;
    }

    if (!data) {
      return null;
    }

    return transformTimeTracking(data);
  } catch (error) {
    return null;
  }
};

/**
 * Transform Supabase data to TimeTracking format
 */
function transformTimeTracking(data: any): TimeTracking {
  return {
    id: data.id,
    _id: data.id,
    _createdAt: data.created_at,
    _updatedAt: data.updated_at || data.created_at,
    employee_id: data.employee_id,
    employee: data.employee
      ? {
          _id: data.employee.id,
          id: data.employee.id,
          firstName: data.employee.first_name,
          first_name: data.employee.first_name,
          lastName: data.employee.last_name,
          last_name: data.employee.last_name,
        }
      : undefined,
    checkIn: data.check_in,
    check_in: data.check_in,
    checkOut: data.check_out,
    check_out: data.check_out,
    hourlyRate: data.hourly_rate,
    hourly_rate: data.hourly_rate,
    totalHours: data.total_hours,
    total_hours: data.total_hours,
    totalPay: data.total_pay,
    total_pay: data.total_pay,
    note: data.note,
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

