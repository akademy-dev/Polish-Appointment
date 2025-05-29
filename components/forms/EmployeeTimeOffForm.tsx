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
      to: "08:00 AM",
      from: "05:45 PM",
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

      <div className="grid grid-cols-2 row-span-6 gap-4 ">
        <div className="grid rounded-md border">
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
        <div
          className="rounded-md border overflow-y-auto max-h-[367px]"
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
                      timeScheduleCardData.filter((c, i) => i !== originalIndex)
                    );
                    form.setValue("timeOffSchedule", [
                      ...(form.watch("timeOffSchedule") || []).filter(
                        (c, i) => i !== originalIndex
                      ),
                    ]);
                    setSelectedTimeOffScheduleIndex(-1);
                  }}
                />
              );
            })
          ) : (
            <div className="h-36 flex-between">
              <p className="text-sm md:text-md lg:text-lg xl:text-xl 2xl:text-2xl text-muted-foreground text-center w-full">
                No time-off schedule yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeTimeOffForm;
