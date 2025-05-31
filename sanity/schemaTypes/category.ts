import { defineField, defineType } from "@sanity/types";
import { PackageIcon } from "lucide-react";

export const categoryType = defineType({
  name: "category",
  title: "Category",
  icon: PackageIcon,
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required().min(1).max(100),
    }),
  ],
});
