import React, { forwardRef } from "react";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import { Separator } from "../ui/separator";
import { dayLabels } from "./EmployeeWorkingForm";

export type TimeOffScheduleCardProps = {
  date?: Date;
  from: string;
  to: string;
  reason: string;
  isSelected?: boolean;
  period: "Exact" | "Daily" | "Weekly" | "Monthly";
  dayOfWeek?: number[];
  dayOfMonth?: number[];
};

const TimeOffScheduleCard = forwardRef<
  HTMLLIElement,
  TimeOffScheduleCardProps & {
    onRemove: () => void;
    onClick: () => void;
  }
>(
  (
    {
      date,
      period,
      dayOfMonth,
      dayOfWeek,
      reason,
      onRemove,
      onClick,
      isSelected = false,
    },
    ref
  ) => {
    const displayFormattedDate = () => {
      if (period === "Exact") {
        return date ? date.toDateString() : "Invalid Date";
      }
      if (period === "Daily") {
        return "Everyday";
      }
      if (period === "Weekly") {
        //convert dayOfWeek to dayLabels
        const formattedDayOfWeek = dayOfWeek?.map((day) => dayLabels[day - 1]);
        return "Every week on " + formattedDayOfWeek?.join(", ");
      }
      const formattedDayOfMonth = dayOfMonth?.map((day) => day.toString());
      return "Every month on " + formattedDayOfMonth?.join(", ");
    };

    return (
      <li
        ref={ref}
        className={`flex-between line_card hover:bg-accent hover:cursor-pointer transition-all duration-300 min-w-0 ${
          isSelected ? "bg-accent" : ""
        }`}
        onClick={onClick}
      >
        <div className="flex flex-wrap items-center w-full min-w-0">
          <span className="text-lg font-semibold break-words whitespace-normal min-w-0">
            {displayFormattedDate()}
          </span>
          <Separator
            orientation="horizontal"
            className="h-5 my-1 hidden sm:inline border-black-1-25"
          />
          <span className="text-sm break-words whitespace-normal min-w-0">
            {reason}
          </span>
          <div className="flex-shrink-0 ml-auto mt-1">
            <Button
              variant="ghost"
              className="hover:bg-destructive hover:text-destructive-foreground"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onRemove();
              }}
            >
              <X />
            </Button>
          </div>
        </div>
      </li>
    );
  }
);

TimeOffScheduleCard.displayName = "TimeOffScheduleCard";

export default TimeOffScheduleCard;
