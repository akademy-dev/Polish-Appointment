import React from "react";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import { Separator } from "../ui/separator";

export type TimeOffScheduleCardProps = {
  id: string;
  date: string;
  fromTime: string;
  toTime: string;
  reason: string;
};

const TimeOffScheduleCard = ({
  date,
  reason,
  onRemove,
  onClick,
}: TimeOffScheduleCardProps & {
  onRemove: () => void;
  onClick: () => void;
}) => {
  return (
    <li
      className="flex-between line_card hover:bg-accent hover:cursor-pointer transition-all duration-300"
      onClick={onClick}
    >
      <div className="flex-between h-5 space-x-2">
        <p className="text-lg font-bold">{date}</p>
        <Separator orientation="vertical" className="border-black-1-25" />
        <p className="text-sm font-semibold">{reason}</p>
      </div>
      <div className="flex-between h-8  space-x-1">
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
};

export default TimeOffScheduleCard;
