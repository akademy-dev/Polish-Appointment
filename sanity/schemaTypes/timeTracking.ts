import { defineField, defineType } from "sanity";

export const timeTrackingType = defineType({
  name: "timeTracking",
  title: "Time Tracking",
  type: "document",
  fields: [
    defineField({
      name: "employee",
      title: "Employee",
      type: "reference",
      to: [{ type: "employee" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "checkIn",
      title: "Check In Time",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "checkOut",
      title: "Check Out Time",
      type: "datetime",
    }),
    defineField({
      name: "hourlyRate",
      title: "Hourly Rate ($)",
      type: "number",
      description: "Optional hourly rate for this shift",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "totalHours",
      title: "Total Hours",
      type: "number",
      description: "Calculated total hours worked",
      readOnly: true,
    }),
    defineField({
      name: "totalPay",
      title: "Total Pay ($)",
      type: "number",
      description: "Calculated total pay for this shift",
      readOnly: true,
    }),
    defineField({
      name: "note",
      title: "Note",
      type: "text",
      description: "Optional note for this time tracking entry",
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Checked In", value: "checked_in" },
          { title: "Checked Out", value: "checked_out" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      employee: "employee.firstName",
      employeeLastName: "employee.lastName",
      checkIn: "checkIn",
      status: "status",
    },
    prepare(selection) {
      const { employee, employeeLastName, checkIn, status } = selection;
      const date = checkIn ? new Date(checkIn).toLocaleDateString() : "No date";
      const time = checkIn ? new Date(checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
      return {
        title: `${employee} ${employeeLastName}`,
        subtitle: `${date} at ${time} - ${status === "checked_in" ? "Checked In" : "Checked Out"}`,
      };
    },
  },
});
