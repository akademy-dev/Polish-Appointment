import { Customer, Employee } from "@/models/profile";
import { Service } from "@/models/service";

// Re-export Sanity types for easier usage
export type Appointment = {
  _id: string;
  startTime: string;
  endTime: string;
  duration: number;
  note: string;
  type: "walk-in" | "request";
  reminder: Array<"1h" | "2h" | "12h" | "24h" | "2d">;
  reminderDateTimes: Array<string>;
  smsMessage: string;
  employee: Employee;
  customer: Customer;
  service: Service;
  status: "scheduled" | "completed" | "cancelled";
  recurringGroupId?: string;
};
