"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { usePathname } from "next/navigation";
import { CalendarProvider } from "@/hooks/context";
import CreateInfoButton from "@/components/CreateInfoButton";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { LogOutIcon } from "lucide-react";
import RootLoading from "@/app/(root)/loading";
import { SettingsProvider, useSettings } from "@/hooks/use-settings";

function LayoutContent({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const value = pathname.split("/")[1] || "schedule";
  const isRoot = pathname === "/";
  const { settings, loading } = useSettings();

  if (loading || !settings) {
    return <RootLoading />; // Hiển thị loading khi đang fetch
  }

  return (
    <>
      {isRoot ? (
        <SidebarProvider>
          <CalendarProvider
            timezone={settings.timezone}
            minTime={settings.minTime}
            maxTime={settings.maxTime}
          >
            <AppSidebar />
            <SidebarTrigger />
            <main className="font-lexend p-2 sm:p-4 w-full h-screen overflow-hidden">
              <header className="mb-3 sm:mb-5 w-full space-y-3 sm:space-y-4 lg:space-y-0">
                <div className="flex items-center justify-between">
                  <Navbar value={value} />
                </div>
                <div className="flex flex-col gap-2 sm:gap-3 lg:hidden sm:flex-row sm:items-center sm:justify-between">
                  {value !== "services" && <CreateInfoButton type={value} />}
                </div>
              </header>
              <div className="w-full h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)]">
                {children}
              </div>
            </main>
          </CalendarProvider>
        </SidebarProvider>
      ) : (
        <main className="font-lexend p-2 sm:p-4 h-screen overflow-y-auto">
          <header className="mb-3 sm:mb-5 w-full space-y-3 sm:space-y-4 lg:space-y-0">
            <div className="flex items-center justify-between">
              <Navbar value={value} />
              {value !== "settings" &&
                value !== "appointments" &&
                value !== "time-tracking" &&
                value !== "services" ? (
                <div className="hidden lg:flex items-center gap-4">
                  <CreateInfoButton type={value} />
                </div>
              ) : value !== "appointments" &&
                value !== "time-tracking" &&
                value !== "services" ? (
                <Button variant="outline" className="hidden lg:flex" asChild>
                  <LogoutButton>
                    <LogOutIcon />
                  </LogoutButton>
                </Button>
              ) : null}
            </div>
            {value !== "settings" &&
              value !== "appointments" &&
              value !== "time-tracking" &&
              value !== "services" && (
                <div className="flex flex-col gap-2 sm:gap-3 lg:hidden sm:flex-row sm:items-center sm:justify-between">
                  <CreateInfoButton type={value} />
                </div>
              )}
          </header>
          <div className="pb-8">{children}</div>
        </main>
      )}
    </>
  );
}

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SettingsProvider>
      <LayoutContent>{children}</LayoutContent>
    </SettingsProvider>
  );
}
