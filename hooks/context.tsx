"use client";

import { createContext, useState, ReactNode } from "react";

interface CalendarContextType {
  date: Date;
  setDate: (date: Date) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const CalendarContext = createContext<CalendarContextType>({
  date: new Date(),
  setDate: () => {},
  isLoading: false,
  setIsLoading: () => {},
});

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const [date, setDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <CalendarContext.Provider
      value={{ date, setDate, isLoading, setIsLoading }}
    >
      {children}
    </CalendarContext.Provider>
  );
};
