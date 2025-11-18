"use client";

import React, { useEffect, useState } from "react";
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
import { parseOffset } from "@/lib/utils";
import { TIMEZONE_QUERY } from "@/sanity/lib/queries";
import { client } from "@/sanity/lib/client";
import RootLoading from "@/app/(root)/Loading";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const value = pathname.split("/")[1] || "schedule";
  const isRoot = pathname === "/";
  const [timezone, setTimezone] = useState<string>("");
  const [minTime, setMinTime] = useState<string>("8:00 AM");
  const [maxTime, setMaxTime] = useState<string>("6:00 PM");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await client.fetch(TIMEZONE_QUERY);
        // Set default values if data is null or missing
        const settingData = data || {
          timezone: "UTC-7:00",
          minTime: "8:00 AM",
          maxTime: "6:00 PM",
        };
        setTimezone(parseOffset(settingData.timezone || "UTC-7:00"));
        setMinTime(settingData.minTime || "8:00 AM");
        setMaxTime(settingData.maxTime || "6:00 PM");
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError("Failed to fetch settings. Please try again later.");
        setTimezone("UTC"); // Set a default timezone in case of error
        setMinTime("8:00 AM");
        setMaxTime("6:00 PM");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []); // Dependency array rỗng để chỉ chạy một lần

  if (loading) {
    return <RootLoading />; // Hiển thị loading khi đang fetch
  }

  return (
    <>
      {isRoot ? (
        <SidebarProvider>
          <CalendarProvider timezone={timezone} minTime={minTime} maxTime={maxTime}>
            <AppSidebar />
            <SidebarTrigger />
            <main className="font-lexend p-2 sm:p-4 w-full h-screen overflow-hidden">
              <header className="mb-3 sm:mb-5 w-full space-y-3 sm:space-y-4 lg:space-y-0">
                <div className="flex items-center justify-between">
                  <Navbar value={value} />
                </div>
                <div className="flex flex-col gap-2 sm:gap-3 lg:hidden sm:flex-row sm:items-center sm:justify-between">
                  <CreateInfoButton type={value} />
                </div>
              </header>
              <div className="w-full h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)]">{children}</div>
            </main>
          </CalendarProvider>
        </SidebarProvider>
      ) : (
        <main className="font-lexend p-2 sm:p-4 h-screen overflow-y-auto">
          <header className="mb-3 sm:mb-5 w-full space-y-3 sm:space-y-4 lg:space-y-0">
            <div className="flex items-center justify-between">
              <Navbar value={value} />
              {value !== "settings" && value !== "appointments" && value !== "time-tracking" ? (
                <div className="hidden lg:flex items-center gap-4">
                  {value !== "services" && (
                    <div className="w-80">
                      <SearchForm action={`/${value}`} />
                    </div>
                  )}
                  <CreateInfoButton type={value} />
                </div>
              ) : value !== "appointments" && value !== "time-tracking" ? (
                <Button variant="outline" className="hidden lg:flex" asChild>
                  <LogoutButton>
                    <LogOutIcon />
                  </LogoutButton>
                </Button>
              ) : null}
            </div>
            {value !== "settings" && value !== "appointments" && value !== "time-tracking" && (
              <div className="flex flex-col gap-2 sm:gap-3 lg:hidden sm:flex-row sm:items-center sm:justify-between">
                {value !== "services" && (
                  <div className="flex-1 sm:max-w-md">
                    <SearchForm action={`/${value}`} />
                  </div>
                )}
                <CreateInfoButton type={value} />
              </div>
            )}
          </header>
          <div className="pb-8">
            {children}
          </div>
        </main>
      )}
    </>
  );
}
