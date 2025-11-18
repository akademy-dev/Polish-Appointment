import { DocumentTextIcon } from "@sanity/icons";
import { defineType, defineField } from "@sanity/types";

export const setting = defineType({
  name: "setting",
  title: "Settings",
  type: "document",
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: "timezone",
      title: "Timezone",
      type: "string",
      description: "The timezone for the application",
      initialValue: "UTC-7:00",
    }),
    defineField({
      name: "minTime",
      title: "Minimum Time",
      type: "string",
      description:
        "The minimum time to display in the schedule (e.g., 8:00 AM)",
      initialValue: "8:00 AM",
    }),
    defineField({
      name: "maxTime",
      title: "Maximum Time",
      type: "string",
      description:
        "The maximum time to display in the schedule (e.g., 6:00 PM)",
      initialValue: "6:00 PM",
    }),
    defineField({
      name: "smsMessage",
      title: "Default SMS Message",
      type: "text",
      description:
        "Default SMS message template for appointment reminders. Use {Customer}, {Employee}, {Service}, {Date Time} as variables.",
      initialValue:
        "Hi {Customer}, your appointment with {Employee} for {Service} is scheduled for {Date Time}. Please arrive 10 minutes early.",
    }),
    defineField({
      name: "hourlyRate",
      title: "Default Hourly Rate ($)",
      type: "number",
      description: "Default hourly rate for time tracking",
      validation: (Rule) => Rule.min(0),
    }),
  ],
});
