import React from "react";
import { AppointmentDataTable } from "@/components/AppointmentDataTable";
import { APPOINTMENTS_QUERY, TIMEZONE_QUERY } from "@/sanity/lib/queries";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";
import { parseOffset } from "@/lib/utils";

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

  const appointments = await sanityFetch({
    query: APPOINTMENTS_QUERY,
    params: {
      page,
      limit,
      status,
      searchTerm,
    },
  });

  const timezone = await sanityFetch({
    query: TIMEZONE_QUERY,
  });

  return (
    <>
      <h2 className="heading">Appointments</h2>
      <AppointmentDataTable
        initialAppointments={appointments.data.data || []}
        total={appointments.data.total || 0}
        initialParams={{
          page,
          status,
          searchTerm,
          limit,
          timezone: parseOffset(timezone.data.timezone),
          minTime: timezone.data.minTime || "8:00 AM",
          maxTime: timezone.data.maxTime || "6:00 PM",
        }}
      />
      <SanityLive />
    </>
  );
};

export default page;
