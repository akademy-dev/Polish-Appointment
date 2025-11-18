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
  
  const setting = result.data || null;
  
  // If no setting exists, show a message or handle gracefully
  if (!setting || !setting._id) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="space-y-4 sm:space-y-6">
          <h2 className="heading text-xl sm:text-2xl">Theme</h2>
          <ThemeToggle />
        </div>
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            No settings document found. Please create a settings document in Sanity Studio to configure timezone, schedule times, and SMS messages.
          </p>
        </div>
        <SanityLive />
      </div>
    );
  }
  
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-4 sm:space-y-6">
        <h2 className="heading text-xl sm:text-2xl">Theme</h2>
        <ThemeToggle />
      </div>

      <div className="space-y-4 sm:space-y-6">
        <h2 className="heading text-xl sm:text-2xl">Time Zone</h2>
        <Timezone _id={setting._id} value={setting.timezone} />
      </div>

      <div className="space-y-4 sm:space-y-6">
        <h2 className="heading text-xl sm:text-2xl">Schedule Time</h2>
        <TimeSettings 
          _id={setting._id} 
          minTime={setting.minTime || "8:00 AM"} 
          maxTime={setting.maxTime || "6:00 PM"} 
        />
      </div>

      <div className="space-y-4 sm:space-y-6">
        <h2 className="heading text-xl sm:text-2xl">SMS Message Template</h2>
        <SMSMessageSettings 
          _id={setting._id} 
          smsMessage={setting.smsMessage || "Hi {Customer}, your appointment with {Employee} for {Service} is scheduled for {Date Time}. Please arrive 10 minutes early."} 
        />
      </div>
      
      <SanityLive />
    </div>
  );
};

export default Page;
