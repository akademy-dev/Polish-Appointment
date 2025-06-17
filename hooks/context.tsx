import React from "react";

export const CalendarContext = React.createContext<{
  date: Date | undefined;
  setDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
}>({
  date: new Date(),
  setDate: () => {},
});
