"use client";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import SearchForm from "@/components/SearchForm";
import { CalendarContext } from "@/hooks/context";
import { CreateAppointmentDialog } from "@/components/CreateAppointmentDialog";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const value = pathname.split("/")[1] || "schedule";

  const isRoot = pathname === "/";
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isCreateAppointmentDialogOpen, setIsCreateAppointmentDialogOpen] =
    useState(false);

  return (
    <>
      {isRoot ? (
        <SidebarProvider>
          <CalendarContext.Provider value={{ date, setDate }}>
            <AppSidebar />
            <SidebarTrigger />
            <main className="font-lexend p-4 w-full h-screen overflow-hidden">
              <header className="mb-5 w-full space-y-4 lg:space-y-0">
                <div className="flex items-center justify-between">
                  <Navbar value={value} />
                  <div className="hidden lg:flex items-center gap-4">
                    <div className="w-80">
                      <SearchForm />
                    </div>
                    <Button
                      size="default"
                      className="whitespace-nowrap"
                      onClick={() => setIsCreateAppointmentDialogOpen(true)}
                    >
                      New Appointment
                    </Button>
                    <CreateAppointmentDialog
                      isOpen={isCreateAppointmentDialogOpen}
                      onOpenChange={setIsCreateAppointmentDialogOpen}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:hidden sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 sm:max-w-md">
                    <SearchForm />
                  </div>
                  <Button size="default" className="sm:whitespace-nowrap">
                    New Appointment
                  </Button>
                </div>
              </header>
              <div className="w-full h-[calc(100vh-6rem)]">{children}</div>
            </main>
          </CalendarContext.Provider>
        </SidebarProvider>
      ) : (
        <main className="font-lexend p-4">
          <header className="mb-5 w-full space-y-4 lg:space-y-0">
            <div className="flex items-center justify-between">
              <Navbar value={value} />
              <div className="hidden lg:flex items-center gap-4">
                <div className="w-80">
                  <SearchForm />
                </div>
                <Button size="default" className="whitespace-nowrap">
                  {value === "employees" ? "New Employee" : "New Customer"}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:hidden sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 sm:max-w-md">
                <SearchForm />
              </div>
              <Button size="default" className="sm:whitespace-nowrap">
                {value === "employees" ? "New Employee" : "New Customer"}
              </Button>
            </div>
          </header>

          {children}
        </main>
      )}
    </>
  );
}
