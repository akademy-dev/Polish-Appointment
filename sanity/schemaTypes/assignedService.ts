import { defineField, defineType } from "@sanity/types";

export const assignedServiceType = defineType({
  name: "assignedService",
  title: "Assigned Service",
  type: "object",
  fields: [
    defineField({
      name: "serviceId",
      title: "Service ID",
      type: "string",
      validation: (Rule) => Rule.required().error("Service ID is required"),
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "number",
      validation: (Rule) => Rule.required().min(0).error("Price is required"),
    }),
    defineField({
      name: "duration",
      title: "Duration",
      type: "number",
      validation: (Rule) =>
        Rule.required()
          .min(15)
          .error("Process time must be at least 15 minutes"),
    }),
    defineField({
      name: "processTime",
      title: "Process Time",
      type: "number",
      validation: (Rule) =>
        Rule.required().min(0).error("Process time must be at least 0 minutes"),
    }),
    defineField({
      name: "showOnline",
      title: "Show Online",
      type: "boolean",
      initialValue: true,
      validation: (Rule) => Rule.required().error("Show online is required"),
    }),
  ],
});
