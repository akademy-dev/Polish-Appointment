import { sanityFetch, SanityLive } from "@/sanity/lib/live";
import {
  ALL_EMPLOYEES_QUERY,
  APPOINTMENTS_BY_DATE_QUERY,
  APPOINTMENT_TIME_OFF_QUERY,
  TIMEZONE_QUERY,
} from "@/sanity/lib/queries";
import AppointmentScheduleTimezone from "@/components/AppointmentScheduleTimezone";
import moment from "moment-timezone";
import { getIanaTimezone, parseOffset } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{
    date?: string;
    notWorking?: string;
    cancelled?: string;
  }>;
}

const page = async ({ searchParams }: PageProps) => {
  const resolvedSearchParams = await searchParams;

  let timezone;
  try {
    timezone = await sanityFetch({
      query: TIMEZONE_QUERY,
      params: {},
    });
  } catch (error) {
    console.error("Error fetching timezone settings:", error);
    // Provide default values if the query fails
    timezone = {
      data: {
        timezone: "UTC-7:00",
        minTime: "8:00 AM",
        maxTime: "6:00 PM",
      },
    };
  }

  const timezoneValue = timezone.data?.timezone || "UTC-7:00";
  moment.tz.setDefault(getIanaTimezone(parseOffset(timezoneValue)));
  const date = resolvedSearchParams.date
    ? resolvedSearchParams.date
    : moment
        .tz(new Date(), getIanaTimezone(parseOffset(timezoneValue)))
        .format("YYYY-MM-DD");

  const notWorking = resolvedSearchParams.notWorking === "true";
  const cancelled = resolvedSearchParams.cancelled === "true";

  const employees = await sanityFetch({
    query: ALL_EMPLOYEES_QUERY,
    params: {
      search: null,
    },
  });
  const appointments = await sanityFetch({
    query: APPOINTMENTS_BY_DATE_QUERY,
    params: {
      date,
      customerId: null,
    },
  });

  const appointmentTimeOffs = await sanityFetch({
    query: APPOINTMENT_TIME_OFF_QUERY,
    params: {},
  });

  return (
    <>
      <AppointmentScheduleTimezone
        initialEmployees={employees.data}
        initialAppointments={appointments.data}
        initialAppointmentTimeOffs={appointmentTimeOffs.data}
        currentDate={date}
        notWorking={notWorking}
        cancelled={cancelled}
        minTime={timezone.data.minTime || "8:00 AM"}
        maxTime={timezone.data.maxTime || "6:00 PM"}
      />
      <SanityLive />
    </>
  );
};

export default page;
