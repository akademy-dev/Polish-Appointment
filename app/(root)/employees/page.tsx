import ProfileList from "@/components/ProfileList";
import React from "react";

export interface Employee {
  id: number;
  name: string;
  role: string;
  // timeSchedule: TimeSchedule[];
}

const employees: Employee[] = [
  {
    id: 1,
    name: "Alice Johnson",
    role: "Manager",
  },
  {
    id: 2,
    name: "Bob Smith",
    role: "Developer",
  },
  {
    id: 3,
    name: "Charlie Brown",
    role: "Designer",
  },
  {
    id: 4,
    name: "David Wilson",
    role: "Developer",
  },
  {
    id: 5,
    name: "Eve Davis",
    role: "Developer",
  },
  {
    id: 6,
    name: "Frank Miller",
    role: "QA Engineer",
  },
  {
    id: 7,
    name: "Grace Lee",
    role: "Product Manager",
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
