"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import { useState, useCallback, useContext } from "react";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarContext } from "@/hooks/context";

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

interface CalendarEvent {
  id: number;
  start: Date;
  end: Date;
  title: string;
  resourceId: number;
  allDay?: boolean;
}

interface Resource {
  resourceId: number;
  resourceTitle: string;
}

const resources: Resource[] = [
  { resourceId: 1, resourceTitle: "Alice" },
  { resourceId: 2, resourceTitle: "Bob" },
  { resourceId: 3, resourceTitle: "David" },
  { resourceId: 4, resourceTitle: "Elizabeth" },
  { resourceId: 5, resourceTitle: "Frank" },
  { resourceId: 6, resourceTitle: "George" },
  { resourceId: 7, resourceTitle: "Hannah" },
  { resourceId: 8, resourceTitle: "Ian" },
  { resourceId: 9, resourceTitle: "Jack" },
  { resourceId: 10, resourceTitle: "Kathy" },
];

let eventId = 0;
const initialEvents: CalendarEvent[] = Array.from(
  { length: 1 },
  (_, k) => k,
).flatMap((i) => {
  const currentResource = resources[i % resources.length];
  const dayDiff = i % 7;

  return Array.from({ length: 1 }, (_, j) => ({
    id: eventId++,
    title: `Event ${i + j} - ${currentResource.resourceTitle}`,
    start: new Date(2018, 0, 29 + dayDiff, 9 + (j % 4), 0, 0),
    end: new Date(2018, 0, 29 + dayDiff, 11 + (j % 4), 0, 0),
    resourceId: currentResource.resourceId,
  }));
});

const Home = () => {
  const [myEvents, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const { date, setDate } = useContext(CalendarContext);
  const views = [Views.DAY];

  const handleSelectSlot = useCallback(
    (slotInfo: import("react-big-calendar").SlotInfo) => {
      const { start, end, resourceId } = slotInfo as {
        start: Date;
        end: Date;
        resourceId?: string | number;
      };
      // Ensure resourceId is a number and defined
      const parsedResourceId =
        typeof resourceId === "string"
          ? parseInt(resourceId, 10)
          : typeof resourceId === "number"
            ? resourceId
            : undefined;

      if (parsedResourceId === undefined || isNaN(parsedResourceId)) {
        window.alert("Please select a valid resource.");
        return;
      }

      const title = window.prompt("New Event Name");
      if (title) {
        setEvents((prev) => [
          ...prev,
          { id: eventId++, start, end, title, resourceId: parsedResourceId },
        ]);
      }
    },
    [],
  );

  const handleSelectEvent = useCallback((event: object) => {
    const calendarEvent = event as CalendarEvent;
    window.alert(calendarEvent.title);
  }, []);

  const moveEvent = useCallback(
    (args: {
      event: object;
      start: Date | string;
      end: Date | string;
      resourceId?: number | string;
      isAllDay?: boolean;
    }) => {
      const {
        event,
        start,
        end,
        resourceId,
        isAllDay: droppedOnAllDaySlot = false,
      } = args;
      const calendarEvent = event as CalendarEvent;
      const { allDay } = calendarEvent;
      if (!allDay && droppedOnAllDaySlot) {
        calendarEvent.allDay = true;
      }

      // Convert start and end to Date if they are strings
      const startDate = typeof start === "string" ? new Date(start) : start;
      const endDate = typeof end === "string" ? new Date(end) : end;

      setEvents((prev) => {
        const existing =
          prev.find((ev) => ev.id === calendarEvent.id) ?? calendarEvent;
        const filtered = prev.filter((ev) => ev.id !== calendarEvent.id);
        // Ensure resourceId is a number
        const parsedResourceId: number =
          typeof resourceId === "string"
            ? parseInt(resourceId, 10)
            : typeof resourceId === "number"
              ? resourceId
              : existing.resourceId;
        return [
          ...filtered,
          {
            ...existing,
            start: startDate,
            end: endDate,
            resourceId: parsedResourceId,
            allDay: calendarEvent.allDay,
          },
        ];
      });
    },
    [],
  );

  const resizeEvent = useCallback(
    (args: { event: object; start: Date | string; end: Date | string }) => {
      const { event, start, end } = args;
      const calendarEvent = event as CalendarEvent;
      // Convert start and end to Date if they are strings
      const startDate = typeof start === "string" ? new Date(start) : start;
      const endDate = typeof end === "string" ? new Date(end) : end;
      setEvents((prev) => {
        const existing = prev.find((ev) => ev.id === calendarEvent.id);
        if (!existing) return prev;
        const filtered = prev.filter((ev) => ev.id !== calendarEvent.id);
        return [...filtered, { ...existing, start: startDate, end: endDate }];
      });
    },
    [],
  );

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      const newDate = new Date(toolbar.date);
      newDate.setDate(newDate.getDate() - 1);
      setDate(newDate);
      toolbar.onNavigate("PREV");
    };
    const goToNext = () => {
      const newDate = new Date(toolbar.date);
      newDate.setDate(newDate.getDate() + 1);
      setDate(newDate);
      toolbar.onNavigate("NEXT");
    };
    const goToToday = () => {
      const today = new Date();
      setDate(today);
      toolbar.onNavigate("TODAY");
    };

    return (
      <div className="flex items-center mb-2 gap-2">
        <div className="flex items-center gap-2">
          <Button
            onClick={goToToday}
            className="bg-[var(--color-accent-blue)] text-white transition hover:bg-[color:rgba(51,143,255,0.85)]"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToBack}
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <span className="font-semibold text-lg">
          {toolbar.label}{" "}
          <span className="font-semibold text-lg">
            {toolbar.date.getFullYear()}
          </span>
        </span>
      </div>
    );
  };

  return (
    <div className="h-full w-full ">
      <DragAndDropCalendar
        selectable
        defaultDate={date}
        date={date} // Add this line to control the current date
        defaultView={Views.DAY}
        events={myEvents}
        localizer={localizer}
        dayLayoutAlgorithm={"no-overlap"}
        resources={resources}
        resourceIdAccessor={(resource) => (resource as Resource).resourceId}
        resourceTitleAccessor={(resource) =>
          (resource as Resource).resourceTitle
        }
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onEventDrop={moveEvent}
        onEventResize={resizeEvent}
        min={new Date(1970, 1, 1, 8, 0, 0)}
        max={new Date(1970, 1, 1, 18, 0, 0)}
        step={15}
        timeslots={1}
        views={views}
        components={{
          toolbar: CustomToolbar,
        }}
      />
    </div>
  );
};

export default Home;
