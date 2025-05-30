import React from "react";
import { Button } from "../ui/button";

import TimeOffScheduleForm from "./TimeOffScheduleForm";

import TimeOffScheduleCard, {
  TimeOffScheduleCardProps,
} from "./TimeOffScheduleCard";
import { employeeFormSchema } from "@/lib/validation";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

const EmployeeTimeOffForm = ({
  form,
}: {
  form: UseFormReturn<z.infer<typeof employeeFormSchema>>;
}) => {
  const [selectedTimeOffScheduleIndex, setSelectedTimeOffScheduleIndex] =
    React.useState<number>(-1);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const firstItemRef = React.useRef<HTMLLIElement>(null);

  const [timeScheduleCardData, setTimeScheduleCardData] = React.useState<
    TimeOffScheduleCardProps[]
  >(form.watch("timeOffSchedule") || []);

  const handleAddTimeScheduleCard = () => {
    const newItem = {
      date: new Date(),
      from: "08:00 AM",
      to: "05:45 PM",
      reason: "",
      period: "Exact" as const,
      dayOfWeek: [],
      dayOfMonth: [],
    };

    form.setValue("timeOffSchedule", [
      ...(form.watch("timeOffSchedule") || []),
      newItem,
    ]);

    setTimeScheduleCardData(form.watch("timeOffSchedule") || []);

    // Use a combination of requestAnimationFrame and setTimeout to ensure DOM update
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (firstItemRef.current) {
          firstItemRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    });
  };

  return (
    <div className="grid-center gap-1 grid-rows-7 h-full pb-6">
      <div className="grid-center grid-cols-3 row-span-1">
        <p className="col-span-2 text-xl-semibold">Time-off schedule</p>
        <Button
          variant="outline"
          className="col-span-1"
          onClick={(e) => {
            e.preventDefault();
            handleAddTimeScheduleCard();
          }}
        >
          Add new entry
        </Button>
      </div>

      {/* Responsive layout: vertical on mobile, horizontal on desktop */}
      <div className="flex flex-col md:grid md:grid-cols-2 row-span-6 gap-4">
        {/* Cards List Panel - Hiển thị trên mobile, phải trên desktop */}
        <div
          className="rounded-md border overflow-y-auto 
                     max-h-[150px] sm:max-h-[180px] md:max-h-[367px] 
                     order-1 md:order-2"
          ref={scrollContainerRef}
        >
          {timeScheduleCardData.length > 0 ? (
            [...timeScheduleCardData].reverse().map((card, reversedIndex) => {
              const originalIndex =
                timeScheduleCardData.length - 1 - reversedIndex;
              return (
                <TimeOffScheduleCard
                  key={originalIndex}
                  {...card}
                  ref={reversedIndex === 0 ? firstItemRef : undefined}
                  isSelected={selectedTimeOffScheduleIndex === originalIndex}
                  onClick={() => {
                    setSelectedTimeOffScheduleIndex(originalIndex);
                  }}
                  onRemove={() => {
                    setTimeScheduleCardData(
                      timeScheduleCardData.filter((_, i) => i !== originalIndex)
                    );
                    form.setValue("timeOffSchedule", [
                      ...(form.watch("timeOffSchedule") || []).filter(
                        (_, i) => i !== originalIndex
                      ),
                    ]);
                    setSelectedTimeOffScheduleIndex(-1);
                  }}
                />
              );
            })
          ) : (
            <div className="h-full flex-between">
              <p className="text-sm md:text-md lg:text-lg xl:text-xl 2xl:text-2xl text-muted-foreground text-center w-full">
                No time-off schedule yet
              </p>
            </div>
          )}
        </div>

        {/* Form Panel - Hiển thị dưới mobile, trái trên desktop */}
        <div className="grid rounded-md border order-2 md:order-1 min-h-[400px] sm:min-h-[450px] md:min-h-[300px]">
          {selectedTimeOffScheduleIndex !== -1 ? (
            <TimeOffScheduleForm
              form={form}
              selectedTimeOffScheduleIndex={selectedTimeOffScheduleIndex}
            />
          ) : (
            <div className="flex-between h-full">
              <p className="text-sm md:text-md lg:text-lg xl:text-xl 2xl:text-2xl text-muted-foreground text-center w-full">
                Add new entry to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeTimeOffForm;
