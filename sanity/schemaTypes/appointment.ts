import { defineType, defineField } from "@sanity/types";
import { CalendarIcon } from "lucide-react";
import { defineArrayMember } from "sanity";

export const appointmentType = defineType({
  name: "appointment",
  title: "Appointment",
  icon: CalendarIcon,
  type: "document",
  fields: [
    defineField({
      name: "startTime",
      title: "Start Time",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "endTime",
      title: "End Time",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "duration",
      title: "Duration",
      type: "number",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "note",
      title: "Note",
      type: "string",
    }),
    defineField({
      name: "reminder",
      title: "Reminder",
      type: "array",
      of: [
        defineArrayMember(
          defineField({
            name: "reminderTime",
            title: "Reminder Time",
            type: "string",
            options: {
              list: [
                { title: "1 hour before", value: "1h" },
                { title: "2 hours before", value: "2h" },
                { title: "12 hours before", value: "12h" },
                { title: "24 hours before", value: "24h" },
                { title: "2 days before", value: "2d" },
              ],
            },
          }),
        ),
      ],
    }),
    // array of reminder date times
    // e.g. ["2023-10-01T10:00:00Z", "2023-10-01T11:00:00Z"]
    defineField({
      name: "reminderDateTimes",
      title: "Reminder Date Times",
      type: "array",
      of: [
        defineArrayMember({
          name: "reminderDateTime",
          title: "Reminder Date Time",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "smsMessage",
      title: "SMS Message",
      type: "string",
      description: "Message to be sent via SMS reminder",
      // required if reminder not empty
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const reminder = context.document?.reminder;
          if (Array.isArray(reminder) && reminder.length > 0 && !value) {
            return "SMS message is required if reminders are set.";
          }
          return true;
        }),
    }),
    defineField({
      name: "employee",
      title: "Employee",
      type: "reference",
      to: [
        {
          type: "employee",
        },
      ],
    }),
    defineField({
      name: "customer",
      title: "Customer",
      type: "reference",
      to: [
        {
          type: "customer",
        },
      ],
    }),
    defineField({
      name: "service",
      title: "Service",
      type: "reference",
      to: [
        {
          type: "service",
        },
      ],
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Scheduled", value: "scheduled" },
          { title: "Completed", value: "completed" },
          { title: "Cancelled", value: "cancelled" },
        ],
      },
    }),
  ],
});
