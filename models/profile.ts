// Define types locally (no longer using Sanity for business entities)
export type WorkingTime = {
  _type?: "workingTime";
  from: string;
  to: string;
  day?: string;
};

export type TimeOffSchedule = {
  _type?: "timeOffSchedule";
  date?: string;
  from: string;
  to: string;
  reason: string;
  period?: string;
  dayOfWeek?: string;
  dayOfMonth?: string;
};

export type Employee = {
  _id: string;
  _type?: "employee";
  _createdAt?: string;
  _updatedAt?: string;
  _rev?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  position?: "owner" | "serviceProvider" | "backRoom";
  note?: string;
  workingTimes?: WorkingTime[];
  timeOffSchedules?: TimeOffSchedule[];
  assignedServices?: any[];
};

export type Customer = {
  _id: string;
  _type?: "customer";
  _createdAt?: string;
  _updatedAt?: string;
  _rev?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  note?: string;
};

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
