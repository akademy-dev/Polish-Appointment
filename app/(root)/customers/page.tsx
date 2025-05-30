import ProfileList from "@/components/ProfileList";
import React from "react";
import { Customer } from "@/types/profile";

const customers: Customer[] = [
  {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    phone: "1234567890",
  },
  {
    id: 2,
    firstName: "Jane",
    lastName: "Smith",
    phone: "0987654321",
  },
  {
    id: 3,
    firstName: "Jim",
    lastName: "Beam",
    phone: "1234567890",
  },
  {
    id: 4,
    firstName: "Jim",
    lastName: "Brown",
    phone: "1234567890",
  },
  {
    id: 5,
    firstName: "Jim",
    lastName: "Brown",
    phone: "1234567890",
  },
  {
    id: 6,
    firstName: "Jim",
    lastName: "Brown",
    phone: "1234567890",
  },
  {
    id: 7,
    firstName: "Jim",
    lastName: "Brown",
    phone: "1234567890",
  },
];

const Page = () => {
  return (
    <>
      <h2 className="heading">Customer List</h2>

      <ProfileList data={customers} />
    </>
  );
};

export default Page;
