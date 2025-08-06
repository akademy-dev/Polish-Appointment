import { type SchemaTypeDefinition } from "sanity";
import { serviceType } from "@/sanity/schemaTypes/service";
import { categoryType } from "@/sanity/schemaTypes/category";
import { employeeType } from "@/sanity/schemaTypes/employee";
import { timeOffScheduleType } from "@/sanity/schemaTypes/timeOffSchedule";
import { workingType } from "@/sanity/schemaTypes/workingTime";
import { customerType } from "@/sanity/schemaTypes/customer";
import { appointmentType } from "@/sanity/schemaTypes/appointment";
import user from "./user";
import session from "./session";
import account from "./account";
import verificationToken from "./verificationToken";
import passwordResetToken from "./passwordResetToken";
import twoFactorToken from "./twoFactorToken";
import twoFactorConfirmation from "./twoFactorConfirmation";
import { setting } from "@/sanity/schemaTypes/setting";
import { assignedServiceType } from "@/sanity/schemaTypes/assignedService";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    serviceType,
    categoryType,
    employeeType,
    customerType,
    timeOffScheduleType,
    workingType,
    assignedServiceType,
    appointmentType,
    user,
    session,
    account,
    verificationToken,
    passwordResetToken,
    twoFactorToken,
    twoFactorConfirmation,
    setting,
  ],
};
