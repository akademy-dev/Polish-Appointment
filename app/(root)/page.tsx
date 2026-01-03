import { getEmployeesForSchedule } from "@/data/employee";
import { getSettings } from "@/data/settings";
import { getAppointmentTimeOffsByDate } from "@/data/appointment-time-off";
import { getAppointmentsByDate } from "@/data/appointment";
import AppointmentScheduleTimezone from "@/components/AppointmentScheduleTimezone";
import moment from "moment-timezone";
import { getIanaTimezone, parseOffset } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    date?: string;
    notWorking?: string;
    cancelled?: string;
    completed?: string;
  }>;
}

const page = async ({ searchParams }: PageProps) => {
  const resolvedSearchParams = await searchParams;

  const settings = await getSettings();

  // Set default values if data is null or missing
  const settingData = settings
    ? {
      _id: settings.id,
      timezone: settings.timezone || "UTC-7:00",
      minTime: settings.min_time || "8:00 AM",
      maxTime: settings.max_time || "6:00 PM",
      smsMessage:
        settings.sms_message ||
        "Hi {Customer}, your appointment with {Employee} for {Service} is scheduled for {Date Time}. Please arrive 10 minutes early.",
    }
    : {
      _id: "",
      timezone: "UTC-7:00",
      minTime: "8:00 AM",
      maxTime: "6:00 PM",
      smsMessage:
        "Hi {Customer}, your appointment with {Employee} for {Service} is scheduled for {Date Time}. Please arrive 10 minutes early.",
    };

  moment.tz.setDefault(getIanaTimezone(parseOffset(settingData.timezone)));
  const date = resolvedSearchParams.date
    ? resolvedSearchParams.date
    : moment
      .tz(new Date(), getIanaTimezone(parseOffset(settingData.timezone)))
      .format("YYYY-MM-DD");

  const notWorking = resolvedSearchParams.notWorking === "true";
  const cancelled = resolvedSearchParams.cancelled === "true";
  const completed = resolvedSearchParams.completed === "true";

  // Parallelize remaining fetches
  const [employeesData, appointmentsData, appointmentTimeOffsData] = await Promise.all([
    getEmployeesForSchedule(),
    getAppointmentsByDate(
      date,
      undefined,
      parseOffset(settingData.timezone)
    ),
    getAppointmentTimeOffsByDate(date, settingData.timezone || "UTC-7:00")
  ]);

  // Transform employees to match expected format
  const employees = employeesData.map((emp) => ({
    _id: emp.id,
    _type: "employee" as const,
    firstName: emp.first_name,
    lastName: emp.last_name,
    phone: emp.phone,
    position: emp.position as "owner" | "serviceProvider" | "backRoom",
    note: emp.note,
    _createdAt: emp.created_at,
    workingTimes: emp.workingTimes || [],
    timeOffSchedules: emp.timeOffSchedules || [],
    assignedServices: emp.assignedServices || [],
  }));

  // Transform appointments to match expected format
  // Note: getAppointmentsByDate already returns data with startTime, endTime, customer, employee, service
  // but we need to ensure format matches models/appointment.ts exactly
  const appointments = appointmentsData.map((apt) => ({
    _id: apt._id || apt.id,
    _createdAt: apt._createdAt || apt.created_at,
    startTime: apt.startTime || apt.start_time,
    endTime: apt.endTime || apt.end_time,
    duration: apt.duration || 0,
    customer: apt.customer
      ? {
        _id: apt.customer._id || apt.customer.id,
        firstName: apt.customer.firstName,
        lastName: apt.customer.lastName,
        fullName: apt.customer.fullName,
      }
      : undefined,
    employee: apt.employee
      ? {
        _id: apt.employee._id || apt.employee.id,
        firstName: apt.employee.firstName,
        lastName: apt.employee.lastName,
        fullName: apt.employee.fullName,
      }
      : undefined,
    service: apt.service
      ? {
        _id: apt.service._id || apt.service.id,
        name: apt.service.name,
        duration: apt.service.duration,
      }
      : undefined,
    reminder: apt.reminder || [],
    reminderDateTimes: apt.reminder_datetime || [],
    smsMessage: apt.sms_message || "",
    type: apt.type as "appointment" | "break" | "time-off",
    status: apt.status as "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show",
    note: apt.note,
    recurringGroupId: apt.recurringGroupId || apt.recurring_group_id,
  }));

  return (
    <>
      <AppointmentScheduleTimezone
        initialEmployees={employees}
        initialAppointments={appointments}
        initialAppointmentTimeOffs={appointmentTimeOffsData || []}
        currentDate={date}
        notWorking={notWorking}
        cancelled={cancelled}
        completed={completed}
        minTime={settingData.minTime || "8:00 AM"}
        maxTime={settingData.maxTime || "6:00 PM"}
      />
    </>
  );
};

export default page;
