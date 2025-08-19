import { defineField, defineType } from "@sanity/types";
import { UserIcon } from "lucide-react";

export const customerType = defineType({
  name: "customer",
  title: "Customer",
  icon: UserIcon,
  type: "document",
  fields: [
    defineField({
      name: "firstName",
      title: "First Name",
      type: "string",
      validation: (Rule) => Rule.required().min(1).max(100),
    }),
    defineField({
      name: "lastName",
      title: "Last Name",
      type: "string",
      validation: (Rule) => Rule.required().min(1).max(100),
    }),
    defineField({
      name: "phone",
      title: "Phone",
      type: "string",
      validation: (Rule) => Rule.required().error("Phone number is required"),
    }),
    defineField({
      name: "note",
      title: "Note",
      type: "text",
      description: "Additional notes about this customer",
    }),
  ],
});
