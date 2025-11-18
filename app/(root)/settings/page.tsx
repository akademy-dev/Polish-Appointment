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
  
  // Set default values if data is null or missing
  const settingData = result.data || {
    _id: "",
    timezone: "UTC-7:00",
    minTime: "8:00 AM",
    maxTime: "6:00 PM",
    smsMessage: "Hi {Customer}, your appointment with {Employee} for {Service} is scheduled for {Date Time}. Please arrive 10 minutes early.",
  };
  
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-4 sm:space-y-6">
        <h2 className="heading text-xl sm:text-2xl">Theme</h2>
        <ThemeToggle />
      </div>

      <div className="space-y-4 sm:space-y-6">
        <h2 className="heading text-xl sm:text-2xl">Time Zone</h2>
        <Timezone _id={settingData._id} value={settingData.timezone || "UTC-7:00"} />
      </div>

      <div className="space-y-4 sm:space-y-6">
        <h2 className="heading text-xl sm:text-2xl">Schedule Time</h2>
        <TimeSettings 
          _id={settingData._id} 
          minTime={settingData.minTime || "8:00 AM"} 
          maxTime={settingData.maxTime || "6:00 PM"} 
        />
      </div>

      <div className="space-y-4 sm:space-y-6">
        <h2 className="heading text-xl sm:text-2xl">SMS Message Template</h2>
        <SMSMessageSettings 
          _id={settingData._id} 
          smsMessage={settingData.smsMessage || "Hi {Customer}, your appointment with {Employee} for {Service} is scheduled for {Date Time}. Please arrive 10 minutes early."} 
        />
      </div>
      
      <SanityLive />
    </div>
  );
};

export default Page;
