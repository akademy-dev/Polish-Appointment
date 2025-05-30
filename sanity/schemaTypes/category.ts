import { defineField, defineType } from "@sanity/types";

export const categoryType = defineType({
  name: "category",
  title: "Category",
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
