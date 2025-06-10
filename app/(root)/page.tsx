import AppointmentSchedule from "@/components/AppointmentSchedule";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";
import { APPOINTMENTS_QUERY, EMPLOYEES_QUERY } from "@/sanity/lib/queries";
import React, { Suspense } from "react";

export default async function HomePage() {
  const employees = await sanityFetch({
    query: EMPLOYEES_QUERY,
    params: {
      search: null,
    },
  });
  const appointments = await sanityFetch({
    query: APPOINTMENTS_QUERY,
  });

  return (
    <>
      <Suspense fallback={<div>Loading schedule...</div>}>
        <AppointmentSchedule
          initialEmployees={employees.data}
          initialAppointments={appointments.data}
        />
      </Suspense>
      <SanityLive />
    </>
  );
}
