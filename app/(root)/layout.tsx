"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { usePathname } from "next/navigation";
import { CalendarProvider } from "@/hooks/context";
import CreateInfoButton from "@/components/CreateInfoButton";
import SearchForm from "@/components/forms/SearchForm";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { LogOutIcon } from "lucide-react";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const value = pathname.split("/")[1] || "schedule";

  const isRoot = pathname === "/";

  return (
    <>
      {isRoot ? (
        <SidebarProvider>
          <CalendarProvider>
            <AppSidebar />
            <SidebarTrigger />
            <main className="font-lexend p-4 w-full h-screen overflow-hidden">
              <header className="mb-5 w-full space-y-4 lg:space-y-0">
                <div className="flex items-center justify-between">
                  <Navbar value={value} />
                  <div className="hidden lg:flex items-center gap-4">
                    <CreateInfoButton type={value} />
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:hidden sm:flex-row sm:items-center sm:justify-between">
                  <CreateInfoButton type={value} />
                </div>
              </header>
              <div className="w-full h-[calc(100vh-6rem)]">{children}</div>
            </main>
          </CalendarProvider>
        </SidebarProvider>
      ) : (
        <main className="font-lexend p-4">
          <header className="mb-5 w-full space-y-4 lg:space-y-0">
            <div className="flex items-center justify-between">
              <Navbar value={value} />
              {value !== "settings" && value !== "appointments" ? (
                <div className="hidden lg:flex items-center gap-4">
                  {value !== "services" && (
                    <div className="w-80">
                      <SearchForm action={`/${value}`} />
                    </div>
                  )}
                  <CreateInfoButton type={value} />
                </div>
              ) : value !== "appointments" ? (
                <Button variant="outline" className="hidden lg:flex" asChild>
                  <LogoutButton>
                    <LogOutIcon />
                  </LogoutButton>
                </Button>
              ) : null}
            </div>

            {value !== "settings" && value !== "appointments" && (
              <div className="flex flex-col gap-3 lg:hidden sm:flex-row sm:items-center sm:justify-between">
                {value !== "services" && (
                  <div className="flex-1 sm:max-w-md">
                    <SearchForm action={`/${value}`} />
                  </div>
                )}
                <CreateInfoButton type={value} />
              </div>
            )}
          </header>
          {children}
        </main>
      )}
    </>
  );
}
