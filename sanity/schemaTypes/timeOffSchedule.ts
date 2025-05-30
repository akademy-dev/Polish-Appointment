import { defineType, defineField, defineArrayMember } from "sanity";

function convertTimeStringToMinutes(timeString: any) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
}

export const timeOffScheduleType = defineType({
  name: "timeOffSchedule",
  title: "Time Off Schedule",
  type: "object",
  fields: [
    defineField({
      name: "date",
      title: "Date",
      type: "string",
      validation: (Rule) => Rule.min(1).max(15),
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
      validation: (Rule) =>
        Rule.required().min(1).error("Please enter a reason"),
    }),
    defineField({
      name: "dayOfWeek",
      title: "Day of Week",
      type: "array",
      of: [defineArrayMember({ type: "number" })],
      validation: (Rule) => Rule.min(1).max(7),
    }),
    defineField({
      name: "dayOfMonth",
      title: "Day of Month",
      type: "array",
      of: [defineArrayMember({ type: "number" })],
      validation: (Rule) => Rule.min(1).max(31),
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
  validation: (Rule) =>
    Rule.custom((fields) => {
      if (!fields?.from || !fields?.to) return true;
      const fromMinutes = convertTimeStringToMinutes(fields.from);
      const toMinutes = convertTimeStringToMinutes(fields.to);
      return fromMinutes < toMinutes
        ? true
        : "From time must be before to time";
    }),
});
