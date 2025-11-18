import React from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { TIMEZONE_QUERY } from "@/sanity/lib/queries";
import { Timezone } from "@/components/Timezone";
import { TimeSettings } from "@/components/TimeSettings";
import { SMSMessageSettings } from "@/components/SMSMessageSettings";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";

const Page = async () => {
  let result;
  try {
    result = await sanityFetch({
      query: TIMEZONE_QUERY,
      params: {},
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    // Provide default values if the query fails
    result = {
      data: {
        _id: null,
        timezone: "UTC-7:00",
        minTime: "8:00 AM",
        maxTime: "6:00 PM",
        smsMessage: "Hi {Customer}, your appointment with {Employee} for {Service} is scheduled for {Date Time}. Please arrive 10 minutes early.",
      },
    };
  }

  const setting = result.data || {
    _id: null,
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
        {setting._id ? (
          <Timezone _id={setting._id} value={setting.timezone || "UTC-7:00"} />
        ) : (
          <div className="text-sm text-muted-foreground">
            No settings document found. Please create a settings document in Sanity Studio.
          </div>
        )}
      </div>

      <div className="space-y-4 sm:space-y-6">
        <h2 className="heading text-xl sm:text-2xl">Schedule Time</h2>
        {setting._id ? (
          <TimeSettings 
            _id={setting._id} 
            minTime={setting.minTime || "8:00 AM"} 
            maxTime={setting.maxTime || "6:00 PM"} 
          />
        ) : (
          <div className="text-sm text-muted-foreground">
            No settings document found. Please create a settings document in Sanity Studio.
          </div>
        )}
      </div>

      <div className="space-y-4 sm:space-y-6">
        <h2 className="heading text-xl sm:text-2xl">SMS Message Template</h2>
        {setting._id ? (
          <SMSMessageSettings 
            _id={setting._id} 
            smsMessage={setting.smsMessage || "Hi {Customer}, your appointment with {Employee} for {Service} is scheduled for {Date Time}. Please arrive 10 minutes early."} 
          />
        ) : (
          <div className="text-sm text-muted-foreground">
            No settings document found. Please create a settings document in Sanity Studio.
          </div>
        )}
      </div>
      
      <SanityLive />
    </div>
  );
};

export default Page;
