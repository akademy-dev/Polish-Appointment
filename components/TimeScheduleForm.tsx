import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import SelectTime from "./SelectTime";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

const timeScheduleFormTabs = ["Exact", "Daily", "Weekly", "Monthly", "Yearly"];

const TimeScheduleForm = () => {
  const [date, setDate] = useState<Date>();
  const [fromTime, setFromTime] = useState<Date>(new Date());
  const [toTime, setToTime] = useState<Date>(new Date());
  const [reason, setReason] = useState("");

  return (
    <Tabs
      defaultValue={timeScheduleFormTabs[0]}
      className="w-full bg-secondary py-2 px-2"
    >
      <TabsList className="flex-between w-full">
        {timeScheduleFormTabs.map((tab) => (
          <TabsTrigger key={tab} value={tab}>
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>
      {timeScheduleFormTabs.map((tab) => (
        <TabsContent key={tab} value={tab} className="w-full mt-2">
          <div className="flex-between gap-4  mb-4">
            <p className="text-lg-medium">Date</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <hr />
          <div className="grid grid-rows-2 my-4">
            <p className="text-lg-medium grid-rows-1">Time</p>
            <div className="flex-between gap-4 w-full">
              <SelectTime label="From" date={fromTime} setDate={setFromTime} />
              <SelectTime label="To" date={toTime} setDate={setToTime} />
            </div>
          </div>
          <hr />
          <div className="flex-between gap-4 my-4">
            <Label className="text-lg-medium" htmlFor="reason">
              Reason
            </Label>

            <Textarea
              rows={3}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason"
              id="reason"
              value={reason}
              className="bg-background resize-none"
            />
          </div>
          <hr />
          <div className="flex item-centers justify-end gap-4 my-4">
            <Button>Add</Button>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default TimeScheduleForm;
