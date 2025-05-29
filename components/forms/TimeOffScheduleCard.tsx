import React, { forwardRef } from "react";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import { Separator } from "../ui/separator";

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
        return date ? date.toDateString() : "invalid date";
      }
      if (period === "Daily") {
        return "Everyday";
      }
      if (period === "Weekly") {
        return "Every week on " + dayOfWeek?.sort((a, b) => a - b)?.join(", ");
      }
      return "Every month on " + dayOfMonth?.sort((a, b) => a - b)?.join(", ");
    };

    return (
      <li
        ref={ref}
        className={`flex-between line_card hover:bg-accent hover:cursor-pointer transition-all duration-300 min-w-0 ${
          isSelected ? "bg-accent" : ""
        }`}
        onClick={onClick}
      >
        <div className="flex-between h-5 gap-1 flex-1 min-w-0">
          <p className="text-lg font-semibold text-wrap">
            {displayFormattedDate()}
          </p>
          <Separator orientation="vertical" className="border-black-1-25" />
          <p className="text-sm truncate flex-1">{reason}</p>
        </div>
        <div className="flex-between flex-shrink-0">
          <Button
            variant="ghost"
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
      </li>
    );
  }
);

TimeOffScheduleCard.displayName = "TimeOffScheduleCard";

export default TimeOffScheduleCard;
