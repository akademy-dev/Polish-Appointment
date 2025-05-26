import React from "react";
import Link from "next/link";
import { Tabs } from "./ui/tabs";
import { TabsList, TabsTrigger } from "./ui/tabs";

const Navbar = ({ value = "schedule" }) => {
  return (
    <div className="flex items-center gap-4">
      <span className="font-bold text-lg">Polish Appointment</span>
      <Tabs defaultValue={value} className="flex-1">
        <TabsList>
          <TabsTrigger asChild value="schedule">
            <Link href="/">Schedule</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="employees">
            <Link href="/employees">Employees</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="customers">
            <Link href="/customers">Customers</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="settings">
            <Link href="/settings">Settings</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="login">
            <Link href="/login">Login</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default Navbar;
