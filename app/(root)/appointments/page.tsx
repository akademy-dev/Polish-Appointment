import React from "react";
import { AppointmentDataTable } from "@/components/AppointmentDataTable";
import { APPOINTMENTS_QUERY } from "@/sanity/lib/queries";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";

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
        }}
      />
      <SanityLive />
    </>
  );
};

export default page;
