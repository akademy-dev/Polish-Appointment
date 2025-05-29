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
    workingTimes: [],
    timeOffSchedule: [],
  },
  {
    id: 2,
    firstName: "Jane",
    lastName: "Smith",
    phone: "0987654321",
    position: "Developer",
    workingTimes: [],
    timeOffSchedule: [],
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
