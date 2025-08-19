import React from "react";
import Link from "next/link";
import { Tabs } from "./ui/tabs";
import { TabsList, TabsTrigger } from "./ui/tabs";

const Navbar = ({ value = "schedule" }) => {
  return (
    <div className="flex items-center gap-4">
      <span className="font-bold text-lg">The Polish Lounge</span>
      <Tabs defaultValue={value} className="flex-1">
        <TabsList>
          <TabsTrigger asChild value="schedule">
            <Link href="/" prefetch={true}>
              Schedule
            </Link>
          </TabsTrigger>
          <TabsTrigger asChild value="employees">
            <Link href="/employees" prefetch={true}>
              Employees
            </Link>
          </TabsTrigger>
          <TabsTrigger asChild value="customers">
            <Link href="/customers" prefetch={true}>
              Customers
            </Link>
          </TabsTrigger>
          <TabsTrigger asChild value="services">
            <Link href="/services" prefetch={true}>
              Services
            </Link>
          </TabsTrigger>
          <TabsTrigger asChild value="appointments">
            <Link href="/appointments" prefetch={true}>
              Appointments
            </Link>
          </TabsTrigger>
          <TabsTrigger asChild value="time-tracking">
            <Link href="/time-tracking" prefetch={true}>
              Time Tracking
            </Link>
          </TabsTrigger>
          <TabsTrigger asChild value="settings">
            <Link href="/settings" prefetch={true}>
              Settings
            </Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default Navbar;
