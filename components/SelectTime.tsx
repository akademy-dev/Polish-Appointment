import React from "react";
import { Label } from "./ui/label";
import { TimePicker } from "./ui/time-picker";

const SelectTime = ({
  label,
  date,
  setDate,
}: {
  label?: string;
  date: Date;
  setDate: (date: Date) => void;
}) => {
  return (
    <div className="flex items-center gap-4 w-full">
      {label && <Label className="text-lg-medium">{label}</Label>}
      <TimePicker date={date} setDate={setDate} />
    </div>
  );
};

export default SelectTime;
