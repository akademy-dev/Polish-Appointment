import { defineField, defineType } from "@sanity/types";
import { PackageIcon } from "lucide-react";

export const serviceType = defineType({
  name: "service",
  title: "Service",
  icon: PackageIcon,
  type: "document",
  fields: [
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required().min(1).max(100),
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "number",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "duration",
      title: "Duration",
      type: "number",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "showOnline",
      title: "Show Online",
      type: "boolean",
      initialValue: true,
      validation: (Rule) => Rule.required(),
    }),
  ],
});
