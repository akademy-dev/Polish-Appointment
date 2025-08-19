import React from "react";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";
import { ALL_EMPLOYEES_QUERY, TIME_TRACKING_QUERY } from "@/sanity/lib/queries";
import TimeTrackingPage from "@/components/TimeTrackingPage";

export default async function TimeTracking() {
  const [employeesResult, timeTrackingResult] = await Promise.all([
    sanityFetch({
      query: ALL_EMPLOYEES_QUERY,
      params: { search: null },
    }),
    sanityFetch({
      query: TIME_TRACKING_QUERY,
      tags: ["timeTracking"],
    }),
  ]);

  console.log("Employees result:", employeesResult);
  console.log("Time tracking result:", timeTrackingResult);

  const employees = employeesResult.data || employeesResult;
  const timeTracking = timeTrackingResult.data || timeTrackingResult;

  console.log("Employees:", employees);
  console.log("Time tracking:", timeTracking);

  return (
    <>
      <TimeTrackingPage
        initialEmployees={employees}
        initialTimeTracking={timeTracking}
      />
      <SanityLive />
    </>
  );
}
