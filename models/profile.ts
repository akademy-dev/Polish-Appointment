// Import types from Sanity
import type {
  Employee as SanityEmployee,
  Customer as SanityCustomer,
  WorkingTime,
  TimeOffSchedule,
} from "../sanity/types";

// Re-export Sanity types for easier usage
export type Employee = SanityEmployee;
export type Customer = SanityCustomer;
export type { WorkingTime, TimeOffSchedule };

// Union type cho ProfileCard và ProfileList
export type Profile = Employee | Customer;

// Helper functions để determine type và get display info
export const getProfileName = (profile: Profile): string => {
  return `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
};

export const getProfileRole = (profile: Profile): string => {
  if (isEmployee(profile)) {
    switch (profile.position) {
      case "owner":
        return "Owner";
      case "serviceProvider":
        return "Service Provider";
      case "backRoom":
        return "Back Room";
      default:
        return "Service Provider";
    }
  }
  return "Customer";
};

export const isEmployee = (profile: Profile): profile is Employee => {
  return profile._type === "employee";
};

export const isCustomer = (profile: Profile): profile is Customer => {
  return profile._type === "customer";
};

// Utility functions để làm việc với working times và time off schedules
export const formatWorkingTime = (workingTime: WorkingTime): string => {
  if (!workingTime.day || !workingTime.from || !workingTime.to) return "";
  return `${workingTime.day}: ${workingTime.from} - ${workingTime.to}`;
};

export const formatTimeOffSchedule = (timeOff: TimeOffSchedule): string => {
  if (!timeOff.reason) return "";
  let timeStr = "";

  if (timeOff.from && timeOff.to) {
    timeStr = `${timeOff.from} - ${timeOff.to}`;
  }

  if (timeOff.date) {
    return `${timeOff.reason} (${timeOff.date}) ${timeStr}`.trim();
  }

  return `${timeOff.reason} ${timeStr}`.trim();
};

// Function để get display phone number
export const getProfilePhone = (profile: Profile): string => {
  return profile.phone || "";
};

// Function để get profile ID
export const getProfileId = (profile: Profile): string => {
  return profile._id;
};
