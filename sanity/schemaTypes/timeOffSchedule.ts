import { convertTimeStringToMinutes } from "@/lib/utils";
import { defineType, defineField, defineArrayMember } from "sanity";

export const timeOffScheduleType = defineType({
  name: "timeOffSchedule",
  title: "Time Off Schedule",
  type: "object",
  fields: [
    defineField({
      name: "date",
      title: "Date",
      type: "string",
    }),
    defineField({
      name: "from",
      title: "From",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "to",
      title: "To",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "reason",
      title: "Reason",
      type: "string",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "dayOfWeek",
      title: "Day of Week",
      type: "array",
      of: [defineArrayMember({ type: "number" })],
    }),
    defineField({
      name: "dayOfMonth",
      title: "Day of Month",
      type: "array",
      of: [defineArrayMember({ type: "number" })],
    }),
    defineField({
      name: "period",
      title: "Period",
      type: "string",
      options: {
        list: [
          { title: "Exact", value: "Exact" },
          { title: "Daily", value: "Daily" },
          { title: "Weekly", value: "Weekly" },
          { title: "Monthly", value: "Monthly" },
        ],
      },
      validation: (Rule) => Rule.required(),
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
    Rule.custom((fields) => {
      if (fields?.period === "Exact" && fields?.date) {
        return fields?.date ? true : "Please select a date";
      }
      return true;
    }),
    Rule.custom((fields) => {
      if (fields?.period === "Weekly" && fields?.dayOfWeek) {
        return fields?.dayOfWeek &&
          fields?.dayOfWeek instanceof Array &&
          fields?.dayOfWeek.length >= 1 &&
          fields?.dayOfWeek.length <= 7
          ? true
          : "Please select at least one day of week";
      }
      return true;
    }),
    Rule.custom((fields) => {
      if (fields?.period === "Monthly" && fields?.dayOfMonth) {
        return fields?.dayOfMonth &&
          fields?.dayOfMonth instanceof Array &&
          fields?.dayOfMonth.length >= 1 &&
          fields?.dayOfMonth.length <= 31
          ? true
          : "Please select at least one day of month";
      }
      return true;
    }),
  ],
});
