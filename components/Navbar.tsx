"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Tabs } from "./ui/tabs";
import { TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const navigationItems = [
  { value: "schedule", label: "Schedule", href: "/" },
  { value: "employees", label: "Employees", href: "/employees" },
  { value: "customers", label: "Customers", href: "/customers" },
  { value: "services", label: "Services", href: "/services" },
  { value: "appointments", label: "Appointments", href: "/appointments" },
  { value: "time-tracking", label: "Time Tracking", href: "/time-tracking" },
  { value: "settings", label: "Settings", href: "/settings" },
];

const Navbar = ({ value = "schedule" }) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const handleMobileNavClick = () => {
    setIsOpen(false);
  };

  if (isMobile) {
    return (
      <div className="flex items-center justify-between w-full px-4 py-2">
        <span className="font-bold text-lg">The Polish Lounge</span>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[350px]">
            <SheetHeader>
              <SheetTitle className="text-left">Navigation</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-2 mt-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.value}
                  href={item.href}
                  onClick={handleMobileNavClick}
                  className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    value === item.value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="font-bold text-lg">The Polish Lounge</span>
      <Tabs defaultValue={value} className="flex-1">
        <TabsList>
          {navigationItems.map((item) => (
            <TabsTrigger key={item.value} asChild value={item.value}>
              <Link href={item.href} prefetch={true}>
                {item.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default Navbar;
