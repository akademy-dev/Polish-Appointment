"use client";

import { createContext, useState, ReactNode } from "react";
import moment from "moment-timezone";
import { getIanaTimezone } from "@/lib/utils";

interface CalendarContextType {
  date: Date;
  setDate: (date: Date) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  timezone: string;
  minTime: string;
  maxTime: string;
}

export const CalendarContext = createContext<CalendarContextType>({
  date: new Date(),
  setDate: () => {},
  isLoading: false,
  setIsLoading: () => {},
  timezone: "",
  minTime: "8:00 AM",
  maxTime: "6:00 PM",
});

export const CalendarProvider = ({
  children,
  timezone,
  minTime = "8:00 AM",
  maxTime = "6:00 PM",
}: {
  children: ReactNode;
  timezone: string;
  minTime?: string;
  maxTime?: string;
}) => {
  moment.tz.setDefault(getIanaTimezone(timezone));
  const [date, setDate] = useState<Date>(
    moment.tz(new Date(), getIanaTimezone(timezone)).toDate(),
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <CalendarContext.Provider
      value={{ date, setDate, isLoading, setIsLoading, timezone, minTime, maxTime }}
    >
      {children}
    </CalendarContext.Provider>
  );
};
