import { defineField, defineType } from "@sanity/types";

function convertTimeStringToMinutes(timeString: any) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
}

export const workingType = defineType({
  name: "workingTime",
  title: "Working Time",
  type: "object",
  fields: [
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
      name: "day",
      title: "Day",
      type: "string",
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
