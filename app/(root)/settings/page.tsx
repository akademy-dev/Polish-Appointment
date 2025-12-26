import React from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Timezone } from "@/components/Timezone";
import { TimeSettings } from "@/components/TimeSettings";
import { SMSMessageSettings } from "@/components/SMSMessageSettings";

import { getSettings } from "@/data/settings";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Page = async () => {
  // Fetch settings from Supabase
  const settings = await getSettings();

  // Log settings to console
  console.log("=== SETTINGS FROM SUPABASE ===");
  console.log(JSON.stringify(settings, null, 2));
  console.log("=============================");

  // Set default values if data is null or missing
  const settingData = settings
    ? {
      id: settings.id,
      _id: settings.id, // Keep _id for backward compatibility with components
      timezone: settings.timezone || "UTC-7:00",
      minTime: settings.min_time || "8:00 AM",
      maxTime: settings.max_time || "6:00 PM",
      smsMessage:
        settings.sms_message ||
        "Hi {Customer}, your appointment with {Employee} for {Service} is scheduled for {Date Time}. Please arrive 10 minutes early.",

    }
    : {
      id: "",
      _id: "",
      timezone: "UTC-7:00",
      minTime: "8:00 AM",
      maxTime: "6:00 PM",
      smsMessage:
        "Hi {Customer}, your appointment with {Employee} for {Service} is scheduled for {Date Time}. Please arrive 10 minutes early.",
    };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading text-2xl sm:text-3xl">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your application settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Theme</h3>
              <p className="text-sm text-muted-foreground">
                Customize the appearance of your application
              </p>
              <ThemeToggle />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Time Zone</h3>
              <p className="text-sm text-muted-foreground">
                Set the default timezone for your business
              </p>
              <Timezone
                _id={settingData._id}
                value={settingData.timezone || "UTC-7:00"}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Schedule Time</h3>
              <p className="text-sm text-muted-foreground">
                Set the minimum and maximum time displayed in the schedule
              </p>
              <TimeSettings
                _id={settingData._id}
                minTime={settingData.minTime || "8:00 AM"}
                maxTime={settingData.maxTime || "6:00 PM"}
              />
            </div>


          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">SMS Message Template</h3>
            <p className="text-sm text-muted-foreground">
              Customize the default SMS message sent to customers for
              appointment reminders
            </p>
            <SMSMessageSettings
              _id={settingData._id}
              smsMessage={
                settingData.smsMessage ||
                "Hi {Customer}, your appointment with {Employee} for {Service} is scheduled for {Date Time}. Please arrive 10 minutes early."
              }
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Page;
