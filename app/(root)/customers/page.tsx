import ProfileList from "@/components/ProfileList";
import React from "react";
import { Customer } from "@/models/profile";

const customers: Customer[] = [
  {
    _id: "1",
    firstName: "John",
    lastName: "Doe",
    phone: "1234567890",
    _type: "customer",
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    _rev: "1",
  },
  {
    _id: "2",
    firstName: "Jane",
    lastName: "Smith",
    phone: "0987654321",
    _type: "customer",
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    _rev: "2",
  },
  {
    _id: "3",
    firstName: "Jim",
    lastName: "Beam",
    phone: "1234567890",
    _type: "customer",
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    _rev: "3",
  },
  {
    _id: "4",
    firstName: "Jim",
    lastName: "Brown",
    phone: "1234567890",
    _type: "customer",
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    _rev: "4",
  },
  {
    _id: "5",
    firstName: "Jim",
    lastName: "Brown",
    phone: "1234567890",
    _type: "customer",
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    _rev: "5",
  },
  {
    _id: "6",
    firstName: "Jim",
    lastName: "Brown",
    phone: "1234567890",
    _type: "customer",
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    _rev: "6",
  },
  {
    _id: "7",
    firstName: "Jim",
    lastName: "Brown",
    phone: "1234567890",
    _type: "customer",
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    _rev: "7",
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
