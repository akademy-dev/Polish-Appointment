import ProfileList from "@/components/ProfileList";
import React from "react";
import { Employee } from "@/types/profile";

const employees: Employee[] = [
  {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    phone: "1234567890",
    position: "Manager",
    workingTimes: [
      {
        day: "Mon",
        from: "08:00 AM",
        to: "05:45 PM",
      },
      {
        day: "Tue",
        from: "08:00 AM",
        to: "05:45 PM",
      },
    ],
    timeOffSchedule: [],
  },
  {
    id: 2,
    firstName: "Jane",
    lastName: "Smith",
    phone: "0987654321",
    position: "Developer",
    workingTimes: [
      {
        day: "Mon",
        from: "08:00 AM",
        to: "05:45 PM",
      },
      {
        day: "Tue",
        from: "08:00 AM",
        to: "05:45 PM",
      },
    ],
    timeOffSchedule: [],
  },
  {
    id: 3,
    firstName: "Jim",
    lastName: "Beam",
    phone: "1234567890",
    position: "Developer",
    workingTimes: [
      {
        day: "Mon",
        from: "08:00 AM",
        to: "05:45 PM",
      },
    ],
    timeOffSchedule: [
      {
        date: new Date(),
        period: "Exact",
        dayOfWeek: [],
        dayOfMonth: [],
        from: "08:00 AM",
        to: "05:45 PM",
        reason: "Sick",
      },
    ],
  },
  {
    id: 4,
    firstName: "Jim",
    lastName: "Brown",
    phone: "1234567890",
    position: "Developer",
    workingTimes: [
      {
        day: "Mon",
        from: "08:00 AM",
        to: "05:45 PM",
      },
    ],
    timeOffSchedule: [],
  },
  {
    id: 5,
    firstName: "Jim",
    lastName: "Brown",
    phone: "1234567890",
    position: "Developer",
    workingTimes: [
      {
        day: "Mon",
        from: "08:00 AM",
        to: "05:45 PM",
      },
    ],
    timeOffSchedule: [
      {
        period: "Daily",
        dayOfWeek: [],
        dayOfMonth: [],
        from: "08:00 AM",
        to: "05:45 PM",
        reason: "Off No Work",
      },
    ],
  },
  {
    id: 6,
    firstName: "Jim",
    lastName: "Brown",
    phone: "1234567890",
    position: "Developer",
    workingTimes: [
      {
        day: "Mon",
        from: "08:00 AM",
        to: "05:45 PM",
      },
    ],
    timeOffSchedule: [
      {
        period: "Weekly",
        dayOfWeek: [1, 2, 3, 4, 5],
        dayOfMonth: [],
        from: "08:00 AM",
        to: "05:45 PM",
        reason: "Off No Work",
      },
    ],
  },
  {
    id: 7,
    firstName: "Jim",
    lastName: "Brown",
    phone: "1234567890",
    position: "Developer",
    workingTimes: [
      {
        day: "Mon",
        from: "08:00 AM",
        to: "05:45 PM",
      },
    ],
    timeOffSchedule: [
      {
        period: "Monthly",
        dayOfWeek: [],
        dayOfMonth: [1, 15, 30],
        from: "08:00 AM",
        to: "05:45 PM",
        reason: "Holiday",
      },
    ],
  },
];

const Page = () => {
  return (
    <>
      <h2 className="heading">Employee List</h2>

      <ProfileList data={employees} />
    </>
  );
};

export default Page;
