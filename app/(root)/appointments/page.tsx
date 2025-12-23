import React from "react";
import { AppointmentDataTable } from "@/components/AppointmentDataTable";
import { getAppointments } from "@/data/appointment";
import { getSettings } from "@/data/settings";
import { parseOffset, calculateDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    limit?: string;
    query?: string;
  }>;
}

const page = async ({ searchParams }: PageProps) => {
  // Await searchParams to access its properties
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const status = resolvedSearchParams.status || "";
  const searchTerm = resolvedSearchParams.query || "";
  const limit = parseInt(resolvedSearchParams.limit || "20", 10);

  const [appointmentsResult, settings] = await Promise.all([
    getAppointments({
      page,
      limit,
      status,
      searchTerm,
    }),
    getSettings(),
  ]);

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

  // Transform appointments to match expected format
  const appointmentsFormatted = appointmentsResult.data.map((apt) => ({
    _id: apt.id,
    startTime: apt.start_time,
    endTime: apt.end_time,
    duration: calculateDuration(apt.start_time, apt.end_time),
    customer: apt.customer
      ? {
          _id: apt.customer.id,
          firstName: apt.customer.firstName,
          lastName: apt.customer.lastName,
          fullName: apt.customer.fullName,
        }
      : undefined,
    employee: apt.employee
      ? {
          _id: apt.employee.id,
          firstName: apt.employee.firstName,
          lastName: apt.employee.lastName,
          fullName: apt.employee.fullName,
        }
      : undefined,
    service: apt.service
      ? {
          _id: apt.service.id,
          name: apt.service.name,
          duration: apt.service.duration,
        }
      : undefined,
    reminder: apt.reminder || [],
    type: apt.type,
    status: apt.status,
    recurringGroupId: apt.recurring_group_id,
  }));

  return (
    <>
      <h2 className="heading">Appointments</h2>
      <AppointmentDataTable
        initialAppointments={appointmentsFormatted}
        total={appointmentsResult.total}
        initialParams={{
          page,
          status,
          searchTerm,
          limit,
          timezone: parseOffset(settingData.timezone || "UTC-7:00"),
          minTime: settingData.minTime || "8:00 AM",
          maxTime: settingData.maxTime || "6:00 PM",
        }}
      />
    </>
  );
};

export default page;
