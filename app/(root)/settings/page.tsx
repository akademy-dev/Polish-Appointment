import React from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { TIMEZONE_QUERY } from "@/sanity/lib/queries";
import { Timezone } from "@/components/Timezone";
import { TimeSettings } from "@/components/TimeSettings";
import { SMSMessageSettings } from "@/components/SMSMessageSettings";
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
      <h2 className="heading mt-8">Schedule Time</h2>
      <TimeSettings 
        _id={result.data._id} 
        minTime={result.data.minTime || "8:00 AM"} 
        maxTime={result.data.maxTime || "6:00 PM"} 
      />
      <h2 className="heading mt-8">SMS Message Template</h2>
      <SMSMessageSettings 
        _id={result.data._id} 
        smsMessage={result.data.smsMessage || "Hi {Customer}, your appointment with {Employee} for {Service} is scheduled for {Date Time}. Please arrive 10 minutes early."} 
      />
      <SanityLive />
    </>
  );
};

export default Page;
