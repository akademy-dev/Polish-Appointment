import React from "react";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { Separator } from "./ui/separator";

export type TimeScheduleCardProps = {
  id: string;
  date: string;
  time: string;
  reason: string;
};

const TimeScheduleCard = ({
  date,
  time,
  reason,
  onRemove,
}: TimeScheduleCardProps & { onRemove: () => void }) => {
  return (
    <li className="flex-between line_card hover:bg-accent hover:cursor-pointer transition-all duration-300">
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

export default TimeScheduleCard;
