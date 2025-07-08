import AppointmentSchedule from "@/components/AppointmentSchedule";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";
import {
  ALL_EMPLOYEES_QUERY,
  APPOINTMENTS_BY_DATE_QUERY,
} from "@/sanity/lib/queries";

interface PageProps {
  searchParams: Promise<{
    date?: string;
    notWorking?: string;
  }>;
}

const page = async ({ searchParams }: PageProps) => {
  const resolvedSearchParams = await searchParams;
  const date =
    resolvedSearchParams.date || new Date().toISOString().split("T")[0];
  const notWorking = resolvedSearchParams.notWorking === "true";

  console.log("Current date:", date);

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

  return (
    <>
      <AppointmentSchedule
        initialEmployees={employees.data}
        initialAppointments={appointments.data}
        currentDate={date}
        notWorking={notWorking}
      />
      <SanityLive />
    </>
  );
};

export default page;
