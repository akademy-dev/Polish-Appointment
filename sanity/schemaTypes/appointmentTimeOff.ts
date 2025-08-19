import { convertTimeStringToMinutes } from "@/lib/utils";
import { defineType, defineField } from "sanity";

export const appointmentTimeOffType = defineType({
  name: "appointmentTimeOff",
  title: "Appointment Time Off",
  type: "object",
  fields: [
    defineField({
      name: "employee",
      title: "Employee",
      type: "reference",
      to: [{ type: "employee" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "startTime",
      title: "Start Time",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "duration",
      title: "Duration",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "reason",
      title: "Reason",
      type: "string",
    }),
    defineField({
      name: "isRecurring",
      title: "Is Recurring",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "recurringDuration",
      title: "Recurring Duration",
      type: "object",
      fields: [
        defineField({
          name: "value",
          title: "Value",
          type: "number",
          validation: (Rule) => Rule.min(1).max(26),
        }),
        defineField({
          name: "unit",
          title: "Unit",
          type: "string",
          options: {
            list: [
              { title: "Days", value: "days" },
              { title: "Weeks", value: "weeks" },
              { title: "Months", value: "months" },
            ],
          },
        }),
      ],
    }),
    defineField({
      name: "recurringFrequency",
      title: "Recurring Frequency",
      type: "object",
      fields: [
        defineField({
          name: "value",
          title: "Value",
          type: "number",
          validation: (Rule) => Rule.min(1).max(26),
        }),
        defineField({
          name: "unit",
          title: "Unit",
          type: "string",
          options: {
            list: [
              { title: "Days", value: "days" },
              { title: "Weeks", value: "weeks" },
            ],
          },
        }),
      ],
    }),
  ],
  validation: (Rule) => [
    Rule.custom((fields) => {
      if (!fields?.from || !fields?.to) return true;
      const fromMinutes = convertTimeStringToMinutes(fields.from.toString());
      const toMinutes = convertTimeStringToMinutes(fields.to.toString());
      return fromMinutes < toMinutes
        ? true
        : "From time must be before to time";
    }),
  ],
});
