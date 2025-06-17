/* eslint-disable */

"use client";

import React, { useCallback, useContext, useEffect, useState } from "react";
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
import { createAppointment, updateAppointment } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

interface CalendarEvent {
  id: number;
  start: Date;
  end: Date;
  title: string;
  resourceId: number;
  data: Appointment;
}

interface Resource {
  resourceId: number;
  resourceTitle: string;
}

interface AppointmentScheduleProps {
  initialEmployees: Employee[];
  initialAppointments: Appointment[];
}

const AppointmentSchedule = ({
  initialEmployees,
  initialAppointments,
}: AppointmentScheduleProps) => {
  const [resources, setResources] = useState(
    (initialEmployees || []).map((employee: any) => ({
      resourceId: employee._id,
      resourceTitle: getProfileName(employee),
    })),
  );
  const [myEvents, setEvents] = useState(
    (initialAppointments || []).map(
      (appointment: Appointment, idx: number) => ({
        id: appointment._id,
        start: new Date(appointment.startTime),
        end: new Date(appointment.endTime),
        title: appointment.service?.name || "Unknown Service",
        resourceId: appointment.employee?._id,
        data: appointment,
      }),
    ),
  );

  useEffect(() => {
    setEvents(
      (initialAppointments || []).map(
        (appointment: Appointment, idx: number) => ({
          id: appointment._id,
          start: new Date(appointment.startTime),
          end: new Date(appointment.endTime),
          title: appointment.service?.name || "Unknown Service",
          resourceId: appointment.employee?._id,
          data: appointment,
        }),
      ),
    );
  }, [initialAppointments]);

  const [type, setType] = useState<"create" | "edit">("create");
  const [appointmentId, setAppointmentId] = useState<string>("");
  const [duration, setDuration] = useState<number>(0);

  const { date, setDate } = useContext(CalendarContext);

  const router = useRouter();

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("date", newDate.toISOString().split("T")[0]);
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    router.push(newUrl); // Sử dụng router.push để điều hướng
  };

  const views = [Views.DAY];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const formRef = React.useRef<HTMLFormElement>(null);

  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirm = async () => {
    setShowConfirm(false);
    await handleAppointmentSuccess();
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

  const handleAppointmentSuccess = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formValues = appointmentForm.getValues();

      const formData = new FormData();
      formData.append("time", formValues.time);
      formData.append("note", formValues.note || "");
      formData.append("reminder", formValues.reminder.toString());
      if (formValues.customer._ref) {
        if (type === "edit") {
          console.log("Updating appointment with values:", formValues);
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

          if (result.status == "SUCCESS") {
            setOpen(false);
            appointmentForm.reset();
            toast.success("Success", {
              description: `Appointment updated successfully for ${formValues.customer.firstName} ${formValues.customer.lastName}`,
            });
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

        if (result.status == "SUCCESS") {
          setOpen(false);
          appointmentForm.reset();
          toast.success("Success", {
            description: `Appointment created successfully for ${formValues.customer.firstName} ${formValues.customer.lastName}`,
          });
        } else {
          toast.error("Error", {
            description: result.error,
          });
        }
      } else {
        toast.error("Error", {
          description: "Customer reference is required for appointment",
        });
        return;
      }
    } catch (error) {
      console.log(error);
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
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
    [myEvents, resources],
  );

  const handleSelectEvent = useCallback((event: object) => {
    const calendarEvent = event as CalendarEvent;
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

  return (
    <>
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
              event: ({ event }: EventProps<object>) => {
                const calendarEvent = event as CalendarEvent;
                return (
                  <div className="bg-pink-400 h-full rounded border border-gray-100 ">
                    <div className="flex flex-col justify-center items-center p-1 gap-0.5 ">
                      <span className="text-md text-black">
                        {calendarEvent.data.customer
                          ? `${calendarEvent.data.customer.firstName} ${calendarEvent.data.customer.lastName}`
                          : "No Customer"}
                      </span>
                      <span className="text-[14px] text-white">
                        {calendarEvent.title}
                      </span>
                    </div>
                  </div>
                );
              },
            }}
          />
        </div>
      </DndProvider>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild></DialogTrigger>
        <DialogContent
          className={`sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl`}
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
    </>
  );
};

export default AppointmentSchedule;
