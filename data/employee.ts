import { supabase } from "@/lib/supabase";
import { WorkingTime, TimeOffSchedule } from "@/models/profile";
import { AssignedService } from "@/models/assignedService";
import { safeParseDate } from "@/lib/utils";
import { cache } from "react";

export interface Employee {
  id: string;
  _id?: string; // For backward compatibility
  _type?: "employee"; // For backward compatibility
  first_name?: string;
  last_name?: string;
  firstName?: string; // For backward compatibility
  lastName?: string; // For backward compatibility
  phone?: string;
  position?: "owner" | "serviceProvider" | "backRoom";
  note?: string;

  hourly_rate?: number;
  hourlyRate?: number; // For backward compatibility
  created_at?: string;
  _createdAt?: string; // For backward compatibility
  workingTimes?: WorkingTime[];
  timeOffSchedules?: TimeOffSchedule[];
  assignedServices?: AssignedService[];
}

export interface EmployeeWithRelations extends Employee {
  workingTimes: WorkingTime[];
  timeOffSchedules: TimeOffSchedule[];
  assignedServices: AssignedService[];
}

export interface EmployeesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface EmployeesResponse {
  data: EmployeeWithRelations[];
  total: number;
}

export const getEmployees = async (
  params: EmployeesQueryParams = {}
): Promise<EmployeesResponse> => {
  try {
    const { page = 1, limit = 20, search = "" } = params;

    // Build query
    let query = supabase.from("employees").select(
      `
        *,
        workingTimes:working_time (
          id,
          day,
          from,
          to
        ),
        timeOffSchedules:time_off_schedule (
          id,
          date,
          from,
          to,
          reason,
          day_of_week,
          day_of_month,
          period
        ),
        assignedServices:assigned_service (
          id,
          service_id,
          price,
          duration,
          process_time
        )
      `,
      { count: "exact" }
    );

    // Apply search filter
    if (search && search.trim()) {
      const searchTerm = `%${search.trim().replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
      // Search in multiple fields using OR condition
      // Supabase PostgREST OR syntax: field1.ilike.value,field2.ilike.value
      query = query.or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},phone.ilike.${searchTerm},position.ilike.${searchTerm}`
      );
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Order by created_at desc
    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return { data: [], total: 0 };
    }

    // Transform data to match expected format
    const employees: EmployeeWithRelations[] = (data || []).map((emp) => ({
      id: emp.id,
      _id: emp.id, // For backward compatibility
      _type: "employee", // For backward compatibility
      first_name: emp.first_name,
      last_name: emp.last_name,
      firstName: emp.first_name, // For backward compatibility
      lastName: emp.last_name, // For backward compatibility
      phone: emp.phone,
      position: emp.position,
      note: emp.note,

      hourly_rate: emp.hourly_rate,
      hourlyRate: emp.hourly_rate,
      created_at: emp.created_at,
      _createdAt: emp.created_at, // For backward compatibility
      workingTimes: (emp.workingTimes || []).map((wt: any) => ({
        _key: wt.id, // Use id as _key for backward compatibility
        day: wt.day,
        from: wt.from,
        to: wt.to,
      })),
      timeOffSchedules: (emp.timeOffSchedules || []).map((tos: any) => ({
        _key: tos.id, // Use id as _key for backward compatibility
        date: tos.date,
        from: tos.from,
        to: tos.to,
        reason: tos.reason,
        dayOfWeek: tos.day_of_week,
        dayOfMonth: tos.day_of_month,
        period: tos.period,
      })),
      assignedServices: (emp.assignedServices || []).map((as: any) => ({
        _key: as.id, // Use id as _key for backward compatibility
        serviceId: as.service_id,
        price: as.price,
        duration: as.duration,
        processTime: as.process_time,
      })),
    })) as EmployeeWithRelations[];

    // Sort: Owner first, then others by created_at desc
    employees.sort((a, b) => {
      if (a.position === "owner" && b.position !== "owner") return -1;
      if (a.position !== "owner" && b.position === "owner") return 1;
      // If both are owner or both are not owner, sort by created_at desc
      const aDate = a.created_at
        ? safeParseDate(a.created_at)?.getTime() || 0
        : 0;
      const bDate = b.created_at
        ? safeParseDate(b.created_at)?.getTime() || 0
        : 0;
      return bDate - aDate;
    });

    return {
      data: employees,
      total: count || 0,
    };
  } catch (error) {
    return { data: [], total: 0 };
  }
};

export const getAllEmployees = async (
  search?: string
): Promise<EmployeeWithRelations[]> => {
  try {
    // Build query
    let query = supabase.from("employees").select(`
        *,
        workingTimes:working_time (
          id,
          day,
          from,
          to
        ),
        timeOffSchedules:time_off_schedule (
          id,
          date,
          from,
          to,
          reason,
          day_of_week,
          day_of_month,
          period
        ),
        assignedServices:assigned_service (
          id,
          service_id,
          price,
          duration,
          process_time
        )
      `);

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim().replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
      // Search in multiple fields using OR condition
      query = query.or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},phone.ilike.${searchTerm},position.ilike.${searchTerm}`
      );
    }

    // Order by created_at desc
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      return [];
    }

    // Transform data to match expected format
    const employees: EmployeeWithRelations[] = (data || []).map((emp) => ({
      id: emp.id,
      _id: emp.id,
      _type: "employee",
      first_name: emp.first_name,
      last_name: emp.last_name,
      firstName: emp.first_name,
      lastName: emp.last_name,
      phone: emp.phone,
      position: emp.position,
      note: emp.note,
      hourly_rate: emp.hourly_rate,
      hourlyRate: emp.hourly_rate,
      created_at: emp.created_at,
      _createdAt: emp.created_at,
      workingTimes: (emp.workingTimes || []).map((wt: any) => ({
        _key: wt.id,
        day: wt.day,
        from: wt.from,
        to: wt.to,
      })),
      timeOffSchedules: (emp.timeOffSchedules || []).map((tos: any) => ({
        _key: tos.id,
        date: tos.date,
        from: tos.from,
        to: tos.to,
        reason: tos.reason,
        dayOfWeek: tos.day_of_week,
        dayOfMonth: tos.day_of_month,
        period: tos.period,
      })),
      assignedServices: (emp.assignedServices || []).map((as: any) => ({
        _key: as.id,
        serviceId: as.service_id,
        price: as.price,
        duration: as.duration,
        processTime: as.process_time,
      })),
    })) as EmployeeWithRelations[];

    // Sort: Owner first, then others by created_at desc
    employees.sort((a, b) => {
      if (a.position === "owner" && b.position !== "owner") return -1;
      if (a.position !== "owner" && b.position === "owner") return 1;
      // If both are owner or both are not owner, sort by created_at desc
      const aDate = a.created_at
        ? safeParseDate(a.created_at)?.getTime() || 0
        : 0;
      const bDate = b.created_at
        ? safeParseDate(b.created_at)?.getTime() || 0
        : 0;
      return bDate - aDate;
    });

    return employees;
  } catch (error) {
    return [];
  }
};

/**
 * Lightweight employee fetch for Schedule page.
 * Only includes relations needed by the calendar UI:
 * - working_time (for not-working overlay)
 * - assigned_service (for drag+drop service validation)
 *
 * Avoids fetching time_off_schedule which can be large and is not used on Schedule.
 */
const getEmployeesForScheduleInternal = async (): Promise<
  EmployeeWithRelations[]
> => {
  try {
    const { data, error } = await supabase.from("employees").select(`
        id,
        first_name,
        last_name,
        phone,
        position,
        note,
        hourly_rate,
        created_at,
        workingTimes:working_time (
          id,
          day,
          from,
          to
        ),
        assignedServices:assigned_service (
          id,
          service_id,
          price,
          duration,
          process_time
        )
      `);

    if (error) {
      return [];
    }

    const employees: EmployeeWithRelations[] = (data || []).map((emp: any) => ({
      id: emp.id,
      _id: emp.id,
      _type: "employee",
      first_name: emp.first_name,
      last_name: emp.last_name,
      firstName: emp.first_name,
      lastName: emp.last_name,
      phone: emp.phone,
      position: emp.position,
      note: emp.note,
      hourly_rate: emp.hourly_rate,
      hourlyRate: emp.hourly_rate,
      created_at: emp.created_at,
      _createdAt: emp.created_at,
      workingTimes: (emp.workingTimes || []).map((wt: any) => ({
        _key: wt.id,
        day: wt.day,
        from: wt.from,
        to: wt.to,
      })),
      // Not used on Schedule; keep empty to satisfy type.
      timeOffSchedules: [],
      assignedServices: (emp.assignedServices || []).map((as: any) => ({
        _key: as.id,
        serviceId: as.service_id,
        price: as.price,
        duration: as.duration,
        processTime: as.process_time,
      })),
    })) as EmployeeWithRelations[];

    // Keep same sort semantics as other employee fetches: Owner first, then created_at desc
    employees.sort((a, b) => {
      if (a.position === "owner" && b.position !== "owner") return -1;
      if (a.position !== "owner" && b.position === "owner") return 1;
      const aDate = a.created_at
        ? safeParseDate(a.created_at)?.getTime() || 0
        : 0;
      const bDate = b.created_at
        ? safeParseDate(b.created_at)?.getTime() || 0
        : 0;
      return bDate - aDate;
    });

    return employees;
  } catch (error) {
    return [];
  }
};

export const getEmployeesForSchedule = cache(getEmployeesForScheduleInternal);

export const getEmployeeById = async (
  id: string
): Promise<EmployeeWithRelations | null> => {
  try {
    const { data, error } = await supabase
      .from("employees")
      .select(
        `
        *,
        workingTimes:working_time (
          id,
          day,
          from,
          to
        ),
        timeOffSchedules:time_off_schedule (
          id,
          date,
          from,
          to,
          reason,
          day_of_week,
          day_of_month,
          period
        ),
        assignedServices:assigned_service (
          id,
          service_id,
          price,
          duration,
          process_time
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("[CREATE APP] ❌ getEmployeeById error:", {
        employeeId: id,
        error: error.message,
      });
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      _id: data.id,
      _type: "employee",
      first_name: data.first_name,
      last_name: data.last_name,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      position: data.position,
      note: data.note,
      hourly_rate: data.hourly_rate,
      hourlyRate: data.hourly_rate,
      created_at: data.created_at,
      _createdAt: data.created_at,
      workingTimes: (data.workingTimes || []).map((wt: any) => ({
        _key: wt.id,
        day: wt.day,
        from: wt.from,
        to: wt.to,
      })),
      timeOffSchedules: (data.timeOffSchedules || []).map((tos: any) => ({
        _key: tos.id,
        date: tos.date,
        from: tos.from,
        to: tos.to,
        reason: tos.reason,
        dayOfWeek: tos.day_of_week,
        dayOfMonth: tos.day_of_month,
        period: tos.period,
      })),
      assignedServices: (data.assignedServices || []).map((as: any) => ({
        _key: as.id,
        serviceId: as.service_id,
        price: as.price,
        duration: as.duration,
        processTime: as.process_time,
      })),
    } as EmployeeWithRelations;
  } catch (error) {
    console.error("Error fetching employee:", error);
    return null;
  }
};

export const createEmployee = async (
  firstName: string,
  lastName: string,
  phone: string | null,
  position: string,
  note: string | null,
  hourlyRate: number | null,
  workingTimes: WorkingTime[],
  timeOffSchedules: TimeOffSchedule[],
  assignedServices: AssignedService[]
): Promise<Employee | null> => {
  try {
    // Step 1: Create employee first to get the ID
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        position: position,
        note: note || null,
        hourly_rate: hourlyRate || 0,
      })
      .select()
      .single();

    if (employeeError) {
      throw new Error(`Failed to create employee: ${employeeError.message}`);
    }

    if (!employee || !employee.id) {
      throw new Error("Failed to create employee: No ID returned");
    }

    const employeeId = employee.id;

    // Step 2: Create working times (after employee is created)
    if (workingTimes.length > 0) {
      const workingTimesData = workingTimes.map((wt) => ({
        employee_id: employeeId,
        day: wt.day || null,
        from: wt.from || null,
        to: wt.to || null,
      }));

      const { error: wtError } = await supabase
        .from("working_time")
        .insert(workingTimesData);

      if (wtError) {
        throw new Error(`Failed to create working times: ${wtError.message}`);
      }
    }

    // Step 3: Create time off schedules (after employee is created)
    if (timeOffSchedules.length > 0) {
      const timeOffData = timeOffSchedules.map((tos) => ({
        employee_id: employeeId,
        date: tos.date || null,
        from: tos.from || null,
        to: tos.to || null,
        reason: tos.reason || null,
        day_of_week: tos.dayOfWeek || null,
        day_of_month: tos.dayOfMonth || null,
        period: tos.period || null,
      }));

      const { error: tosError } = await supabase
        .from("time_off_schedule")
        .insert(timeOffData);

      if (tosError) {
        throw new Error(
          `Failed to create time off schedules: ${tosError.message}`
        );
      }
    }

    // Step 4: Create assigned services (after employee is created)
    if (assignedServices.length > 0) {
      const assignedServicesData = assignedServices.map((as) => ({
        employee_id: employeeId,
        service_id: as.serviceId || null,
        price: as.price || null,
        duration: as.duration || null,
        process_time: as.processTime || null,
      }));

      const { error: asError } = await supabase
        .from("assigned_service")
        .insert(assignedServicesData);

      if (asError) {
        throw new Error(
          `Failed to create assigned services: ${asError.message}`
        );
      }
    }

    return {
      id: employee.id,
      _id: employee.id,
      _type: "employee",
      first_name: employee.first_name,
      last_name: employee.last_name,
      firstName: employee.first_name,
      lastName: employee.last_name,
      phone: employee.phone,
      position: employee.position,
      note: employee.note,

      hourly_rate: employee.hourly_rate,
      hourlyRate: employee.hourly_rate,
      created_at: employee.created_at,
    };
  } catch (error) {
    // Re-throw to allow proper error handling in the calling function
    throw error;
  }
};

export const updateEmployee = async (
  id: string,
  updates: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    position?: string;

    note?: string | null;
    hourlyRate?: number | null;
  },
  workingTimes?: WorkingTime[],
  timeOffSchedules?: TimeOffSchedule[],
  assignedServices?: AssignedService[]
): Promise<Employee | null> => {
  try {
    // Update employee
    const updateData: any = {};
    if (updates.firstName !== undefined)
      updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;
    if (updates.position !== undefined) updateData.position = updates.position;

    if (updates.note !== undefined) updateData.note = updates.note || null;
    if (updates.hourlyRate !== undefined)
      updateData.hourly_rate = updates.hourlyRate || 0;

    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (employeeError || !employee) {
      return null;
    }

    // Update working times if provided
    if (workingTimes !== undefined) {
      // Delete existing working times
      await supabase.from("working_time").delete().eq("employee_id", id);

      // Insert new working times
      if (workingTimes.length > 0) {
        const workingTimesData = workingTimes.map((wt) => ({
          employee_id: id,
          day: wt.day,
          from: wt.from,
          to: wt.to,
        }));

        await supabase.from("working_time").insert(workingTimesData);
      }
    }

    // Update time off schedules if provided
    if (timeOffSchedules !== undefined) {
      // Delete existing time off schedules
      await supabase.from("time_off_schedule").delete().eq("employee_id", id);

      // Insert new time off schedules
      if (timeOffSchedules.length > 0) {
        const timeOffData = timeOffSchedules.map((tos) => ({
          employee_id: id,
          date: tos.date || null,
          from: tos.from || null,
          to: tos.to || null,
          reason: tos.reason || null,
          day_of_week: tos.dayOfWeek || null,
          day_of_month: tos.dayOfMonth || null,
          period: tos.period || null,
        }));

        await supabase.from("time_off_schedule").insert(timeOffData);
      }
    }

    // Update assigned services if provided
    if (assignedServices !== undefined) {
      // Delete existing assigned services
      await supabase.from("assigned_service").delete().eq("employee_id", id);

      // Insert new assigned services
      if (assignedServices.length > 0) {
        const assignedServicesData = assignedServices.map((as) => ({
          employee_id: id,
          service_id: as.serviceId || null,
          price: as.price || null,
          duration: as.duration || null,
          process_time: as.processTime || null,
        }));

        await supabase.from("assigned_service").insert(assignedServicesData);
      }
    }

    return {
      id: employee.id,
      _id: employee.id,
      _type: "employee",
      first_name: employee.first_name,
      last_name: employee.last_name,
      firstName: employee.first_name,
      lastName: employee.last_name,
      phone: employee.phone,
      position: employee.position,
      note: employee.note,

      hourly_rate: employee.hourly_rate,
      hourlyRate: employee.hourly_rate,
      created_at: employee.created_at,
    };
  } catch (error) {
    return null;
  }
};

export const deleteEmployee = async (id: string): Promise<boolean> => {
  try {
    // Delete employee (cascade will delete related records)
    const { error } = await supabase.from("employees").delete().eq("id", id);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting employee:", error);
    return false;
  }
};
