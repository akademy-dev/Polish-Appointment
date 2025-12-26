import React from "react";
import { getAllEmployees } from "@/data/employee";
import { getAllTimeTracking } from "@/data/time-tracking";
import TimeTrackingPage from "@/components/TimeTrackingPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TimeTracking() {
  const [employeesData, timeTrackingData] = await Promise.all([
    getAllEmployees(),
    getAllTimeTracking(),
  ]);

  // Transform employees to match expected format
  const employees = employeesData.map((emp) => ({
    _id: emp.id,
    _type: "employee",
    firstName: emp.first_name,
    lastName: emp.last_name,
    phone: emp.phone,
    position: emp.position,
    note: emp.note,
    _createdAt: emp.created_at,
    workingTimes: emp.workingTimes || [],
    timeOffSchedules: emp.timeOffSchedules || [],
    assignedServices: emp.assignedServices || [],
  }));

  // Transform time tracking to match expected format
  const timeTracking = timeTrackingData.map((tt) => ({
    _id: tt.id,
    _createdAt: tt.created_at,
    _updatedAt: tt.updated_at || tt.created_at,
    employee: tt.employee
      ? {
        _id: tt.employee.id,
        firstName: tt.employee.first_name,
        lastName: tt.employee.last_name,
      }
      : undefined,
    checkIn: tt.check_in,
    checkOut: tt.check_out,
    hourlyRate: tt.hourly_rate,
    totalHours: tt.total_hours,
    totalPay: tt.total_pay,
    note: tt.note,
    status: tt.status,
  }));

  return (
    <TimeTrackingPage
      initialEmployees={employees}
      initialTimeTracking={timeTracking}
    />
  );
}
