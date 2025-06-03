import React from "react";
import { ServiceDataTable } from "@/components/ServiceDataTable";

const page = async () => {
  return (
    <>
      <h2 className="heading">Services</h2>
      <ServiceDataTable />
    </>
  );
};

export default page;
