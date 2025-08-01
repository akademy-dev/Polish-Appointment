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
}

export const CalendarContext = createContext<CalendarContextType>({
  date: new Date(),
  setDate: () => {},
  isLoading: false,
  setIsLoading: () => {},
  timezone: "",
});

export const CalendarProvider = ({
  children,
  timezone,
}: {
  children: ReactNode;
  timezone: string;
}) => {
  moment.tz.setDefault(getIanaTimezone(timezone));
  const [date, setDate] = useState<Date>(
    moment.tz(new Date(), getIanaTimezone(timezone)).toDate(),
  );

  // Định dạng ngày giờ
  // const formattedDate = moment(date).format("YYYY-MM-DD HH:mm:ss");
  // console.log(formattedDate);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <CalendarContext.Provider
      value={{ date, setDate, isLoading, setIsLoading, timezone }}
    >
      {children}
    </CalendarContext.Provider>
  );
};
