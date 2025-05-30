// Base interface cho cả Employee và Customer
export interface BaseProfile {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
}

// Interface cho WorkingTime (từ Employee)
export interface WorkingTime {
  dayOfWeek: number[];
  dayOfMonth: number[];
  time: string;
}

// Interface cho TimeOffSchedule (từ Employee)
export interface TimeOffSchedule {
  date: Date;
  period: string;
  dayOfWeek: number[];
  dayOfMonth: number[];
}

// Employee extends BaseProfile
export interface Employee extends BaseProfile {
  position: string;
  workingTimes: WorkingTime[];
  timeOffSchedule: TimeOffSchedule[];
}

// Customer type alias từ BaseProfile
export type Customer = BaseProfile;

// Union type cho ProfileCard và ProfileList
export type Profile = Employee | Customer;

// Helper functions để determine type và get display info
export const getProfileName = (profile: Profile): string => {
  return `${profile.firstName} ${profile.lastName}`;
};

export const getProfileRole = (profile: Profile): string => {
  if ("position" in profile) {
    return profile.position; // Employee
  }
  return "Customer"; // Customer
};

export const isEmployee = (profile: Profile): profile is Employee => {
  return "position" in profile;
};

export const isCustomer = (profile: Profile): profile is Customer => {
  return !("position" in profile);
};
