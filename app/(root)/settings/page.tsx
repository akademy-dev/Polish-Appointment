import React from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { TIMEZONE_QUERY } from "@/sanity/lib/queries";
import { Timezone } from "@/components/Timezone";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";

const Page = async () => {
  const result = await sanityFetch({
    query: TIMEZONE_QUERY,
    params: {},
  });
  return (
    <>
      <h2 className="heading">Theme</h2>
      <ThemeToggle />
      <h2 className="heading mt-8">Time Zone</h2>
      <Timezone _id={result.data._id} value={result.data.timezone} />
      <SanityLive />
    </>
  );
};

export default Page;
