import ProfileList from "@/components/ProfileList";
import React from "react";

export interface Customer {
  id: number;
  name: string;
  role: string;
}

const customers: Customer[] = [
  {
    id: 1,
    name: "John Doe",
    role: "Customer",
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
