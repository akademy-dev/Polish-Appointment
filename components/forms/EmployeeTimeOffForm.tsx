import React from "react";
import { Button } from "../ui/button";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

import TimeOffScheduleForm from "./TimeOffScheduleForm";

import TimeOffScheduleCard, {
  TimeOffScheduleCardProps,
} from "./TimeOffScheduleCard";

const EmployeeTimeOffForm = () => {
  const [selectedTimeOffSchedule, setSelectedTimeOffSchedule] =
    React.useState<TimeOffScheduleCardProps | null>(null);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [timeScheduleCardData, setTimeScheduleCardData] = React.useState<
    TimeOffScheduleCardProps[]
  >([]);
  const handleAddTimeScheduleCard = () => {
    setTimeScheduleCardData([
      {
        id: Date.now().toString(),
        date: "",
        toTime: `${new Date().getHours().toString()}:${new Date()
          .getMinutes()
          .toString()}`,
        fromTime: `${new Date().getHours().toString()}:${new Date()
          .getMinutes()
          .toString()}`,
        reason: "",
      },
      ...timeScheduleCardData,
    ]);

    setTimeout(() => {
      const scrollContainer = scrollContainerRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 0);
  };

  return (
    <div className="grid gap-4 p-4">
      <div className="grid grid-cols-5 gap-4">
        <div className="grid-center grid-cols-3 gap-4">
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

        <ScrollArea ref={scrollContainerRef} className="h-37 rounded-md border">
          {timeScheduleCardData.length > 0 ? (
            timeScheduleCardData.map((card) => (
              <TimeOffScheduleCard
                key={card.id}
                {...card}
                onClick={() => {
                  setSelectedTimeOffSchedule(card);
                }}
                onRemove={() => {
                  setTimeScheduleCardData(
                    timeScheduleCardData.filter((c) => c.id !== card.id)
                  );
                }}
              />
            ))
          ) : (
            <div className="h-36 flex-between">
              <p className="text-sm md:text-md lg:text-lg xl:text-xl 2xl:text-2xl text-muted-foreground text-center w-full">
                No time-off schedule yet
              </p>
            </div>
          )}
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {selectedTimeOffSchedule && (
          <div className="grid rounded-md border">
            <TimeOffScheduleForm
              selectedTimeOffSchedule={selectedTimeOffSchedule}
              setSelectedTimeOffSchedule={setSelectedTimeOffSchedule}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeTimeOffForm;
