/* eslint-disable */
"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Calendar,
  EventProps,
  momentLocalizer,
  Views,
} from "react-big-calendar";
import moment from "moment";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarContext } from "@/hooks/context";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { appointmentFormSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useIsMobile } from "@/hooks/use-mobile";
import { Employee, getProfileName } from "@/models/profile";
import { Appointment } from "@/models/appointment";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import {
  createAppointment,
  createCustomer,
  updateAppointment,
} from "@/lib/actions";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { addDays, addMinutes, format, isWithinInterval, parse } from "date-fns";

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

interface CalendarEvent {
  id: number | string;
  start: Date;
  end: Date;
  title: string;
  resourceId: number | string;
  data: Appointment;
  type: string;
}

interface Resource {
  resourceId: string;
  resourceTitle: string;
}

interface AppointmentScheduleProps {
  initialEmployees: Employee[];
  initialAppointments: Appointment[];
  currentDate: string;
}

const generateNotWorkingEvents = (
  employees: Employee[],
  standardStart: string,
  standardEnd: string,
  startDate: Date,
) => {
  const notWorkingEvents: any[] = [];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const dayIndex = startDate.getDay();
  const dayOfWeek = daysOfWeek[dayIndex];
  const currentDate = new Date(startDate.setHours(0, 0, 0, 0));

  employees.forEach((employee) => {
    const workingTimes = employee.workingTimes || [];
    const workSchedule = workingTimes.find((wt) => wt.day === dayOfWeek);

    const standardStartTime = parse(
      `${format(currentDate, "yyyy-MM-dd")} ${standardStart}`,
      "yyyy-MM-dd h:mm a",
      new Date(),
    );
    const standardEndTime = parse(
      `${format(currentDate, "yyyy-MM-dd")} ${standardEnd}`,
      "yyyy-MM-dd h:mm a",
      new Date(),
    );

    if (!workSchedule) {
      notWorkingEvents.push({
        id: `not_working_${employee._id}_${dayOfWeek}`,
        start: standardStartTime,
        end: standardEndTime,
        title: "Not Working",
        resourceId: employee._id,
        type: "not_working",
      });
    } else {
      const workStart = parse(
        `${format(currentDate, "yyyy-MM-dd")} ${workSchedule.from}`,
        "yyyy-MM-dd h:mm a",
        new Date(),
      );
      const workEnd = parse(
        `${format(currentDate, "yyyy-MM-dd")} ${workSchedule.to}`,
        "yyyy-MM-dd h:mm a",
        new Date(),
      );

      if (workStart > standardStartTime) {
        notWorkingEvents.push({
          id: `not_working_${employee._id}_${dayOfWeek}_before`,
          start: standardStartTime,
          end: workStart,
          title: "Not Working",
          resourceId: employee._id,
          type: "not_working",
        });
      }

      if (workEnd < standardEndTime) {
        notWorkingEvents.push({
          id: `not_working_${employee._id}_${dayOfWeek}_after`,
          start: workEnd,
          end: standardEndTime,
          title: "Not Working",
          resourceId: employee._id,
          type: "not_working",
        });
      }

      const notWorkingStart = parse(
        `${format(currentDate, "yyyy-MM-dd")} 8:00 AM`,
        "yyyy-MM-dd h:mm a",
        new Date(),
      );
      const notWorkingEnd = addMinutes(notWorkingStart, 30);

      if (
        isWithinInterval(notWorkingStart, {
          start: workStart,
          end: workEnd,
        }) &&
        isWithinInterval(notWorkingEnd, { start: workStart, end: workEnd })
      ) {
        notWorkingEvents.push({
          id: `not_working_${employee._id}_${dayOfWeek}_specific`,
          start: notWorkingStart,
          end: notWorkingEnd,
          title: "Not Working",
          resourceId: employee._id,
          type: "not_working",
        });
      }
    }
  });

  return notWorkingEvents;
};

const AppointmentSchedule = ({
  initialEmployees,
  initialAppointments,
  currentDate,
}: AppointmentScheduleProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { date, setDate, isLoading, setIsLoading } =
    useContext(CalendarContext);
  const isMobile = useIsMobile();
  const [isPending, startTransition] = useTransition();
  const [processing, setProcessing] = useState(false);
  const [type, setType] = useState<"create" | "edit">("create");
  const [appointmentId, setAppointmentId] = useState<string>("");
  const [duration, setDuration] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  // Memoize resources
  const resources = useMemo(
    () =>
      (initialEmployees || []).map((employee: any) => ({
        resourceId: employee._id,
        resourceTitle: getProfileName(employee),
      })),
    [initialEmployees],
  );

  // Memoize not working events
  const notWorkingEvents = useMemo(() => {
    return generateNotWorkingEvents(
      initialEmployees,
      "8:00 AM",
      "6:00 PM",
      currentDate ? new Date(currentDate) : new Date(),
    );
  }, [initialEmployees, currentDate]);

  // Memoize appointment events
  const appointmentEvents = useMemo(
    () =>
      (initialAppointments || []).map((appointment: Appointment) => ({
        id: appointment._id,
        start: new Date(appointment.startTime),
        end: new Date(appointment.endTime),
        title: appointment.service?.name || "Unknown Service",
        resourceId: appointment.employee?._id,
        data: appointment,
        type: "appointment",
      })),
    [initialAppointments],
  );

  // State for events
  const [myEvents, setEvents] = useState<CalendarEvent[]>([]);

  // Update events when appointmentEvents or notWorkingEvents change
  useEffect(() => {
    setProcessing(true);
    setEvents([...appointmentEvents, ...notWorkingEvents]);
    setProcessing(false);
  }, [appointmentEvents, notWorkingEvents]);

  // Update date when currentDate changes
  useEffect(() => {
    if (currentDate) {
      const parsedDate = new Date(currentDate);
      setDate(parsedDate);
    }
  }, [currentDate, setDate]);

  // Reset isLoading when initialAppointments change (indicating fetch complete)
  useEffect(() => {
    setIsLoading(false);
  }, [initialAppointments, setIsLoading]);

  // Handle date change with transition
  const handleDateChange = (newDate: Date) => {
    setIsLoading(true); // Set loading immediately
    startTransition(() => {
      setDate(newDate);
      const currentParams = new URLSearchParams(window.location.search);
      const formattedDate = format(newDate, "yyyy-MM-dd");
      currentParams.set("date", formattedDate);
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      router.push(newUrl);
    });
  };

  const appointmentForm = useForm<z.infer<typeof appointmentFormSchema>>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      customer: {
        firstName: "",
        lastName: "",
        phone: "",
        _ref: "",
        _type: "reference",
      },
      employee: {
        _ref: "",
        _type: "reference",
      },
      time: "",
      note: "",
      reminder: true,
      services: [],
    },
  });

  const handleConfirm = async () => {
    setShowConfirm(false);
    await handleAppointmentSuccess();
  };

  const handleAppointmentSuccess = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setIsLoading(true); // Set loading immediately before action

    try {
      const formValues = appointmentForm.getValues();
      const formData = new FormData();
      formData.append("time", formValues.time);
      formData.append("note", formValues.note || "");
      formData.append("reminder", formValues.reminder.toString());

      if (formValues.customer._ref) {
        if (type === "edit") {
          const result = await updateAppointment(
            appointmentId,
            duration,
            formData,
            {
              _ref: formValues.customer._ref,
              _type: formValues.customer._type,
            },
            formValues.employee,
          );

          if (result.status === "SUCCESS") {
            setOpen(false);
            appointmentForm.reset();
            toast.success("Success", {
              description: `Appointment updated successfully `,
            });
            router.refresh(); // Trigger re-fetch
          } else {
            toast.error("Error", {
              description: result.error,
            });
          }
          return;
        }

        const result = await createAppointment(
          formData,
          {
            _ref: formValues.customer._ref,
            _type: formValues.customer._type,
          },
          formValues.employee,
          formValues.services,
        );

        if (result.status === "SUCCESS") {
          setOpen(false);
          appointmentForm.reset();
          toast.success("Success", {
            description: `Appointment created successfully`,
          });
          router.refresh(); // Trigger re-fetch
        } else {
          toast.error("Error", {
            description: result.error,
          });
        }
      } else {
        const customerFormData = new FormData();
        customerFormData.append("firstName", formValues.customer.firstName);
        customerFormData.append("lastName", formValues.customer.lastName);
        customerFormData.append("phone", formValues.customer.phone || "");

        const customerResult = await createCustomer(customerFormData);
        if (customerResult.status === "SUCCESS") {
          const customerId = customerResult._id;
          const result = await createAppointment(
            formData,
            {
              _ref: customerId,
              _type: "reference",
            },
            formValues.employee,
            formValues.services,
          );

          if (result.status === "SUCCESS") {
            setOpen(false);
            appointmentForm.reset();
            toast.success("Success", {
              description: "New Appointment created successfully",
            });
            router.refresh(); // Trigger re-fetch
          } else {
            toast.error("Error", {
              description: result.error,
            });
          }
        } else {
          toast.error("Error", {
            description: customerResult.error,
          });
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
      // Note: isLoading is reset by useEffect when initialAppointments updates
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (isSubmitting && !newOpen) return;
    setOpen(newOpen);

    if (newOpen) {
      setIsSubmitting(false);
    } else {
      appointmentForm.reset();
      setIsSubmitting(false);
    }
  };

  const handleSelectSlot = useCallback(
    (slotInfo: import("react-big-calendar").SlotInfo) => {
      const { start, resourceId } = slotInfo as {
        start: Date;
        end: Date;
        resourceId: string;
      };

      setType("create");
      appointmentForm.setValue("time", start.toISOString());
      appointmentForm.setValue("employee", {
        _ref: resourceId,
        _type: "reference",
      });

      setOpen(true);
    },
    [],
  );

  const handleSelectEvent = useCallback((event: object) => {
    const calendarEvent = event as CalendarEvent;

    if (calendarEvent.type === "not_working") {
      return;
    }

    setType("edit");
    setAppointmentId(calendarEvent.data._id);
    appointmentForm.setValue("time", calendarEvent.data.startTime.toString());
    appointmentForm.setValue("employee", {
      _ref: calendarEvent.resourceId.toString(),
      _type: "reference",
    });
    appointmentForm.setValue("customer", {
      firstName: "",
      lastName: "",
      phone: "",
      _ref: calendarEvent.data.customer?._id || "",
      _type: "reference",
    });
    appointmentForm.setValue("note", calendarEvent.data.note || "");
    appointmentForm.setValue("reminder", calendarEvent.data.reminder || true);

    const newServices = calendarEvent.data.service
      ? [
          {
            _ref: calendarEvent.data.service._id,
            _type: "reference",
            duration: calendarEvent.data.service.duration,
          },
        ]
      : [];
    appointmentForm.setValue("services", newServices);
    setDuration(calendarEvent.data.service?.duration || 0);
    setOpen(true);
  }, []);

  const moveEvent = useCallback(
    (args: {
      event: object;
      start: Date | string;
      end: Date | string;
      resourceId?: number | string;
    }) => {
      const { event, start, resourceId } = args;
      const calendarEvent = event as CalendarEvent;

      if (calendarEvent.type === "not_working") {
        return;
      }

      setType("edit");
      setAppointmentId(calendarEvent.data._id);
      appointmentForm.setValue("time", start.toString());
      appointmentForm.setValue("employee", {
        _ref: resourceId?.toString() || calendarEvent.resourceId.toString(),
        _type: "reference",
      });
      appointmentForm.setValue("customer", {
        firstName: "",
        lastName: "",
        phone: "",
        _ref: calendarEvent.data.customer?._id,
        _type: "reference",
      });
      appointmentForm.setValue("note", calendarEvent.data.note || "");
      appointmentForm.setValue("reminder", calendarEvent.data.reminder || true);
      const newServices = calendarEvent.data.service
        ? [
            {
              _ref: calendarEvent.data.service._id,
              _type: "reference",
              duration: calendarEvent.data.service.duration,
            },
          ]
        : [];
      appointmentForm.setValue("services", newServices);

      setDuration(calendarEvent.data.service?.duration || 0);
      setShowConfirm(true);
    },
    [],
  );

  const resizeEvent = useCallback(
    (args: { event: object; start: Date | string; end: Date | string }) => {
      const { event, start, end } = args;
      const calendarEvent = event as CalendarEvent;

      if (calendarEvent.type === "not_working") {
        toast.error("Cannot resize not working events");
        return;
      }
      const startDate = typeof start === "string" ? new Date(start) : start;
      const endDate = typeof end === "string" ? new Date(end) : end;

      setType("edit");
      setAppointmentId(calendarEvent.data._id);
      appointmentForm.setValue("time", startDate.toISOString());
      appointmentForm.setValue("employee", {
        _ref: calendarEvent.resourceId.toString(),
        _type: "reference",
      });
      appointmentForm.setValue("customer", {
        firstName: "",
        lastName: "",
        phone: "",
        _ref: calendarEvent.data.customer?._id,
        _type: "reference",
      });
      appointmentForm.setValue("note", calendarEvent.data.note || "");
      appointmentForm.setValue("reminder", calendarEvent.data.reminder || true);
      const newServices = calendarEvent.data.service
        ? [
            {
              _ref: calendarEvent.data.service._id,
              _type: "reference",
              duration: calendarEvent.data.service.duration,
            },
          ]
        : [];
      appointmentForm.setValue("services", newServices);

      setDuration(
        Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)),
      );
      setShowConfirm(true);
    },
    [],
  );

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      const newDate = new Date(toolbar.date);
      newDate.setDate(newDate.getDate() - 1);
      toolbar.onNavigate("PREV");
      handleDateChange(newDate);
    };

    const goToNext = () => {
      const newDate = new Date(toolbar.date);
      newDate.setDate(newDate.getDate() + 1);
      toolbar.onNavigate("NEXT");
      handleDateChange(newDate);
    };

    const goToToday = () => {
      const today = new Date();
      toolbar.onNavigate("TODAY");
      handleDateChange(today);
    };

    return (
      <div className="flex items-center mb-2 gap-2">
        <div className="flex items-center gap-2">
          <Button onClick={goToToday}>Today</Button>
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

  const resizableAccessor = useCallback((event: object) => {
    const calendarEvent = event as CalendarEvent;
    return calendarEvent.type !== "not_working";
  }, []);

  const draggableAccessor = useCallback((event: object) => {
    const calendarEvent = event as CalendarEvent;
    return calendarEvent.type !== "not_working";
  }, []);

  return (
    <div className="relative h-full w-full">
      <DndProvider backend={HTML5Backend}>
        <div
          className={`h-full w-full ${processing || isLoading ? "loading" : null}`}
        >
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
            resizableAccessor={resizableAccessor}
            draggableAccessor={draggableAccessor}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onEventDrop={moveEvent}
            onEventResize={resizeEvent}
            min={new Date(1970, 1, 1, 8, 0, 0)}
            max={new Date(1970, 1, 1, 18, 0, 0)}
            step={15}
            timeslots={1}
            views={[Views.DAY]}
            components={{
              toolbar: CustomToolbar,
              event: ({ event }: EventProps<object>) => {
                const calendarEvent = event as CalendarEvent;
                if (calendarEvent.type === "appointment") {
                  return (
                    <div className="bg-pink-400 h-full rounded border border-gray-100 cursor-pointer">
                      <div className="flex flex-col justify-center items-center p-1 gap-0.5">
                        <span className="text-md text-black">
                          {calendarEvent.data?.customer
                            ? `${calendarEvent.data.customer.firstName} ${calendarEvent.data.customer.lastName}`
                            : "No Customer"}
                        </span>
                        <span className="text-[14px] text-white">
                          {calendarEvent.title}
                        </span>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-gray-400 h-full rounded border border-gray-100 cursor-default resize-none">
                      <div className="flex flex-col justify-center items-center p-1 gap-0.5">
                        <span className="text-[14px] text-white">
                          {calendarEvent.title}
                        </span>
                      </div>
                    </div>
                  );
                }
              },
            }}
          />
        </div>
      </DndProvider>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild></DialogTrigger>
        <DialogContent
          className="sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl"
          aria-describedby="form-dialog"
        >
          <DialogHeader>
            <DialogTitle>New Appointment</DialogTitle>
            <DialogDescription className="sr-only">
              Create a new appointment with service, customer and employee.
            </DialogDescription>
          </DialogHeader>
          <AppointmentForm
            form={appointmentForm}
            onSuccess={handleAppointmentSuccess}
            hideSubmitButton={isMobile}
            formRef={isMobile ? formRef : undefined}
            isSubmitting={isSubmitting}
            type={type}
          />
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirm Update"
        description="Are you sure you want to reschedule this appointment?"
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default AppointmentSchedule;
