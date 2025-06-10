import { type SchemaTypeDefinition } from "sanity";
import { serviceType } from "@/sanity/schemaTypes/service";
import { categoryType } from "@/sanity/schemaTypes/category";
import { employeeType } from "@/sanity/schemaTypes/employee";
import { timeOffScheduleType } from "@/sanity/schemaTypes/timeOffSchedule";
import { workingType } from "@/sanity/schemaTypes/workingTime";
import { customerType } from "@/sanity/schemaTypes/customer";
import { appointmentType } from "@/sanity/schemaTypes/appointment";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    serviceType,
    categoryType,
    employeeType,
    customerType,
    timeOffScheduleType,
    workingType,
    appointmentType,
  ],
};
