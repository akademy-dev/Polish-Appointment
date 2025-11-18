import React from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { TIMEZONE_QUERY } from "@/sanity/lib/queries";
import { Timezone } from "@/components/Timezone";
import { TimeSettings } from "@/components/TimeSettings";
import { SMSMessageSettings } from "@/components/SMSMessageSettings";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";

const Page = async () => {
  console.log("[Settings Page] Fetching timezone settings...");
  
  let result;
  try {
    result = await sanityFetch({
      query: TIMEZONE_QUERY,
      params: {},
    });
    console.log("[Settings Page] Successfully fetched timezone settings:", {
      hasId: !!result.data._id,
      timezone: result.data.timezone,
      minTime: result.data.minTime,
      maxTime: result.data.maxTime,
      hasSmsMessage: !!result.data.smsMessage,
    });
  } catch (error: any) {
    console.error("[Settings Page] Error fetching timezone settings:", {
      error: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    throw error;
  }
  
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-4 sm:space-y-6">
        <h2 className="heading text-xl sm:text-2xl">Theme</h2>
        <ThemeToggle />
      </div>

      <div className="space-y-4 sm:space-y-6">
        <h2 className="heading text-xl sm:text-2xl">Time Zone</h2>
        <Timezone _id={result.data._id} value={result.data.timezone} />
      </div>

      <div className="space-y-4 sm:space-y-6">
        <h2 className="heading text-xl sm:text-2xl">Schedule Time</h2>
        <TimeSettings 
          _id={result.data._id} 
          minTime={result.data.minTime || "8:00 AM"} 
          maxTime={result.data.maxTime || "6:00 PM"} 
        />
      </div>

      <div className="space-y-4 sm:space-y-6">
        <h2 className="heading text-xl sm:text-2xl">SMS Message Template</h2>
        <SMSMessageSettings 
          _id={result.data._id} 
          smsMessage={result.data.smsMessage || "Hi {Customer}, your appointment with {Employee} for {Service} is scheduled for {Date Time}. Please arrive 10 minutes early."} 
        />
      </div>
      
      <SanityLive />
    </div>
  );
};

export default Page;
