import { defineType, defineField } from "@sanity/types";
import { CalendarIcon } from "lucide-react";

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
      type: "boolean",
      initialValue: true,
      validation: (Rule) => Rule.required(),
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
      initialValue: "scheduled",
    }),
  ],
});
