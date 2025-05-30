import { defineType, defineField, defineArrayMember } from "sanity";

export const employeeType = defineType({
  name: "employee",
  title: "Employee",
  type: "document",
  fields: [
    defineField({
      name: "firstName",
      title: "First Name",
      type: "string",
      validation: (Rule) => Rule.required().error("First name is required"),
    }),
    defineField({
      name: "lastName",
      title: "Last Name",
      type: "string",
      validation: (Rule) => Rule.required().error("Last name is required"),
    }),
    defineField({
      name: "phone",
      title: "Phone",
      type: "string",
      validation: (Rule) => Rule.required().error("Phone number is required"),
    }),
    defineField({
      name: "position",
      title: "Position",
      type: "string",
      options: {
        list: [
          { title: "Owner", value: "owner" },
          { title: "Service Provider", value: "serviceProvider" },
          { title: "Back Room", value: "backRoom" },
        ],
      },
      validation: (Rule) => Rule.required().error("Please select a position"),
    }),
    defineField({
      name: "workingTimes",
      title: "Working Times",
      type: "array",
      of: [defineArrayMember({ type: "workingTime" })],
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .max(7)
          .error("You have to select at least one day, up to a maximum of 7."),
    }),
    defineField({
      name: "timeOffSchedule",
      title: "Time Off Schedule",
      type: "array",
      of: [defineArrayMember({ type: "timeOffSchedule" })],
    }),
  ],
});
