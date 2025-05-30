/* eslint-disable */
"use client";

import React from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import { useState, useCallback, useContext } from "react";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarContext } from "@/hooks/context";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { AppointmentForm } from "@/components/forms/AppointmentForm";

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

const initialResources: Resource[] = [
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
  const currentResource = initialResources[i % initialResources.length];
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
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const { date, setDate } = useContext(CalendarContext);
  const views = [Views.DAY];
  const [isCreateAppointmentDialogOpen, setIsCreateAppointmentDialogOpen] =
    useState(false);
  const [time, setTime] = useState<Record<string, any> | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null,
  );

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

      // Prevent creating an event if there is already an event in the same time and resource
      const hasConflict = myEvents.some(
        (ev) =>
          ev.resourceId === parsedResourceId &&
          ((start >= ev.start && start < ev.end) ||
            (end > ev.start && end <= ev.end) ||
            (start <= ev.start && end >= ev.end)),
      );
      if (hasConflict) {
        window.alert(
          "There is already an event in this time slot for this resource.",
        );
        return;
      }

      const resource =
        resources.find((r) => r.resourceId === parsedResourceId) || null;
      setSelectedResource(resource);
      setTime({ time: start });
      setIsCreateAppointmentDialogOpen(true);
    },
    [myEvents, resources],
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

  // Drag-and-drop resource header logic
  const moveResource = (dragIndex: number, hoverIndex: number) => {
    setResources((prevResources) => {
      const updated = [...prevResources];
      const [removed] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, removed);
      return updated;
    });
  };

  const ResourceHeader = ({
    resource,
    index,
  }: {
    resource: Resource;
    index: number;
  }) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const [, drop] = useDrop({
      accept: "RESOURCE",
      hover(item: { index: number }) {
        if (item.index !== index) {
          moveResource(item.index, index);
          item.index = index;
        }
      },
    });
    const [{ isDragging }, drag] = useDrag({
      type: "RESOURCE",
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });
    drag(drop(ref));
    return (
      <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1, cursor: "move" }}>
        <GripVertical size={16} style={{ marginRight: 4 }} />
        {resource.resourceTitle}
      </div>
    );
  };

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
    <DndProvider backend={HTML5Backend}>
      <div className="h-full w-full">
        <DragAndDropCalendar
          selectable
          defaultDate={date}
          date={date}
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
            resourceHeader: (props: any) => {
              const index = resources.findIndex(
                (r) => r.resourceId === props.resource.resourceId,
              );
              return <ResourceHeader resource={props.resource} index={index} />;
            },
          }}
        />
        <AppointmentForm
          isOpen={isCreateAppointmentDialogOpen}
          onOpenChange={setIsCreateAppointmentDialogOpen}
          time={time}
          staff={selectedResource?.resourceTitle || ""}
        />
      </div>
    </DndProvider>
  );
};

export default Home;
