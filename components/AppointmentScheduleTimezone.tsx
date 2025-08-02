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
import moment from "moment-timezone";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarContext } from "@/hooks/context";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { appointmentFormSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useIsMobile } from "@/hooks/use-mobile";
import { Employee, getProfileName, TimeOffSchedule } from "@/models/profile";
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
import { getIanaTimezone } from "@/lib/utils";

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
  notWorking?: boolean;
  cancelled?: boolean;
}

export const formatToISO8601 = (
  date: Date,
  time: string,
  timezone: string,
): string => {
  const dateMoment = moment.tz(date, getIanaTimezone(timezone));
  const [hours, minutes] =
    time.includes("AM") || time.includes("PM")
      ? moment(time, "h:mm A").format("HH:mm").split(":")
      : time.split(":");
  return dateMoment
    .set({
      hour: parseInt(hours, 10),
      minute: parseInt(minutes, 10),
      second: 0,
      millisecond: 0,
    })
    .toISOString();
};

const generateNotWorkingEvents = (
  employees: Employee[],
  standardStart: string,
  standardEnd: string,
  currentDate: Date,
  timezone: string,
): CalendarEvent[] => {
  const notWorkingEvents: any[] = [];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Chuyển currentDate sang múi giờ cụ thể và lấy thông tin ngày
  const momentDate = moment.tz(currentDate, getIanaTimezone(timezone));
  const dayIndex = momentDate.day(); // Lấy chỉ số ngày trong tuần (0 = Sun, 1 = Mon, ...)
  const dayOfWeek = daysOfWeek[dayIndex];

  // Convert standard times to ISO 8601
  const standardStartTime = formatToISO8601(
    currentDate,
    standardStart,
    timezone,
  );
  const standardEndTime = formatToISO8601(currentDate, standardEnd, timezone);

  employees.forEach((employee) => {
    const workingTimes = employee.workingTimes || [];
    const workSchedule = workingTimes.find((wt) => wt.day === dayOfWeek);

    if (!workSchedule) {
      // No work schedule: employee is not working for the entire standard period
      notWorkingEvents.push({
        id: `not_working_${employee._id}_${dayOfWeek}`,
        start: moment.tz(standardStartTime, getIanaTimezone(timezone)).toDate(),
        end: moment.tz(standardEndTime, getIanaTimezone(timezone)).toDate(),
        title: "Not Working",
        resourceId: employee._id,
        type: "not_working",
      });
    } else {
      const workStart = formatToISO8601(
        currentDate,
        workSchedule.from,
        timezone,
      );
      const workEnd = formatToISO8601(currentDate, workSchedule.to, timezone);

      const workStartMoment = moment.tz(workStart, getIanaTimezone(timezone));
      const workEndMoment = moment.tz(workEnd, getIanaTimezone(timezone));
      const standardStartMoment = moment.tz(
        standardStartTime,
        getIanaTimezone(timezone),
      );
      const standardEndMoment = moment.tz(
        standardEndTime,
        getIanaTimezone(timezone),
      );

      if (workStartMoment.isAfter(standardStartMoment)) {
        // Employee starts later than standard start time
        notWorkingEvents.push({
          id: `not_working_${employee._id}_${dayOfWeek}_start`,
          start: standardStartMoment.toDate(),
          end: workStartMoment.toDate(),
          title: "Not Working",
          resourceId: employee._id,
          type: "not_working",
        });
      }

      if (workEndMoment.isAfter(standardEndMoment)) {
        // Employee ends later than standard end time
        notWorkingEvents.push({
          id: `not_working_${employee._id}_${dayOfWeek}_end`,
          start: workEndMoment.toDate(),
          end: standardEndMoment.toDate(),
          title: "Not Working",
          resourceId: employee._id,
          type: "not_working",
        });
      }
    }
  });

  return notWorkingEvents;
};

const isValidTimeString = (timeStr: string): boolean => {
  const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
  return timeRegex.test(timeStr.trim());
};

const setTimeToDate = (
  date: Date,
  timeStr: string,
  timezone: string,
): Date | null => {
  timeStr = timeStr.trim();
  if (!isValidTimeString(timeStr)) {
    console.error(
      `Invalid time format: ${timeStr}. Expected HH:mm AM/PM (e.g., "10:00 AM").`,
    );
    return null;
  }

  const isoTime = formatToISO8601(date, timeStr, timezone);
  const momentTime = moment.tz(isoTime, getIanaTimezone(timezone));
  if (!momentTime.isValid()) {
    console.error(`Invalid Date created from: ${date}, ${timeStr}`);
    return null;
  }
  return momentTime.toDate();
};

const generateTimeOffEvents = (
  employees: Employee[],
  date: Date,
  timezone: string,
): CalendarEvent[] => {
  const events: any[] = [];
  employees.forEach((employee) => {
    if (!employee.timeOffSchedules || employee.timeOffSchedules.length === 0) {
      return;
    }

    employee.timeOffSchedules.forEach((schedule: TimeOffSchedule) => {
      const {
        period,
        date: scheduleDate,
        from,
        to,
        reason,
        dayOfWeek,
        dayOfMonth,
      } = schedule;
      let isMatchingDate = false;
      const momentDate = moment.tz(date, getIanaTimezone(timezone));

      switch (period) {
        case "Exact":
          if (scheduleDate) {
            const exactDate = moment.tz(
              scheduleDate,
              getIanaTimezone(timezone),
            );
            isMatchingDate =
              exactDate.isSame(momentDate, "year") &&
              exactDate.isSame(momentDate, "month") &&
              exactDate.isSame(momentDate, "date");
          }
          break;
        case "Daily":
          isMatchingDate = true;
          break;
        case "Weekly":
          if (dayOfWeek) {
            const currentDayOfWeek = momentDate.day();
            const adjustedDayOfWeek =
              currentDayOfWeek === 0 ? 7 : currentDayOfWeek;
            isMatchingDate = dayOfWeek.includes(adjustedDayOfWeek);
          }
          break;
        case "Monthly":
          if (dayOfMonth) {
            const currentDayOfMonth = momentDate.date();
            isMatchingDate = dayOfMonth.includes(currentDayOfMonth);
          }
          break;
        default:
          break;
      }

      if (isMatchingDate && from && to) {
        const startTime = setTimeToDate(date, from, timezone);
        const endTime = setTimeToDate(date, to, timezone);
        if (startTime && endTime) {
          events.push({
            id: `time_off_${employee._id}_${scheduleDate || momentDate.toISOString()}`,
            start: startTime,
            end: endTime,
            title: `Time Off`,
            resourceId: employee._id,
            type: "timeOff",
          });
        }
      }
    });
  });

  return events;
};

const AppointmentScheduleTimezone = ({
  initialEmployees,
  initialAppointments,
  currentDate,
  notWorking = false,
  cancelled = false,
}: AppointmentScheduleProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { date, setDate, isLoading, setIsLoading, timezone } =
    useContext(CalendarContext);

  moment.tz.setDefault(getIanaTimezone(timezone));
  const localizer = momentLocalizer(moment);

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

  // Chuẩn hóa ngày khi múi giờ thay đổi
  useEffect(() => {
    const momentDate = moment.tz(date, getIanaTimezone(timezone));
    const normalizedDate = momentDate.startOf("day").toDate(); // Chuẩn hóa về đầu ngày
    const currentTimestamp = date.getTime();
    const normalizedTimestamp = normalizedDate.getTime();

    // Chỉ cập nhật nếu timestamp khác
    if (currentTimestamp !== normalizedTimestamp) {
      setDate(normalizedDate);
    }
  }, [timezone, date, setDate]);

  // Kiểm tra nhân viên không làm việc cả ngày theo múi giờ ứng dụng
  const isEmployeeNotWorkingAllDay = (employee: Employee, date: Date) => {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const momentDate = moment.tz(date, getIanaTimezone(timezone));
    const dayOfWeek = daysOfWeek[momentDate.day()];
    const workingTimes = employee.workingTimes || [];
    return !workingTimes.some((wt) => wt.day === dayOfWeek);
  };

  // Lọc nhân viên dựa trên trạng thái làm việc
  const filteredEmployees = useMemo(() => {
    if (notWorking) {
      return initialEmployees || [];
    }
    return (initialEmployees || []).filter(
      (employee) =>
        !isEmployeeNotWorkingAllDay(
          employee,
          currentDate
            ? moment.tz(currentDate, getIanaTimezone(timezone)).toDate()
            : moment.tz(new Date(), getIanaTimezone(timezone)).toDate(),
        ),
    );
  }, [initialEmployees, currentDate, notWorking, timezone]);

  const [resources, setResources] = useState<Resource[]>(() => {
    const savedOrder = localStorage.getItem("resourceOrder");
    let orderedEmployees = filteredEmployees;
    if (savedOrder) {
      const order: string[] = JSON.parse(savedOrder);
      orderedEmployees = [...filteredEmployees].sort(
        (a, b) => order.indexOf(a._id) - order.indexOf(b._id),
      );
    }
    return orderedEmployees.map((employee: any) => ({
      resourceId: employee._id,
      resourceTitle: getProfileName(employee),
    }));
  });

  useEffect(() => {
    const savedOrder = localStorage.getItem("resourceOrder");
    let orderedEmployees = filteredEmployees;
    if (savedOrder) {
      const order: string[] = JSON.parse(savedOrder);
      orderedEmployees = [...filteredEmployees].sort(
        (a, b) => order.indexOf(a._id) - order.indexOf(b._id),
      );
    }
    setResources(
      orderedEmployees.map((employee: any) => ({
        resourceId: employee._id,
        resourceTitle: getProfileName(employee),
      })),
    );
    setIsLoading(false);
  }, [filteredEmployees]);

  // Memoize not working events
  const notWorkingEvents = useMemo(() => {
    // Đảm bảo currentDate ở đầu ngày với múi giờ cụ thể
    const dateAtStartOfDay = currentDate
      ? moment
          .tz(currentDate, getIanaTimezone(timezone))
          .startOf("day")
          .toDate()
      : moment
          .tz(new Date(), getIanaTimezone(timezone))
          .startOf("day")
          .toDate();

    return generateNotWorkingEvents(
      initialEmployees,
      "8:00 AM",
      "6:00 PM",
      dateAtStartOfDay,
      timezone,
    );
  }, [initialEmployees, currentDate, timezone]);

  const timeOffEvents = useMemo(() => {
    const dateAtStartOfDay = currentDate
      ? moment
          .tz(currentDate, getIanaTimezone(timezone))
          .startOf("day")
          .toDate()
      : moment
          .tz(new Date(), getIanaTimezone(timezone))
          .startOf("day")
          .toDate();

    return generateTimeOffEvents(initialEmployees, dateAtStartOfDay, timezone);
  }, [initialEmployees, currentDate, timezone]);

  // Ánh xạ initialAppointments thành sự kiện lịch
  const appointmentEvents = useMemo(() => {
    return (initialAppointments || []).map((appt: Appointment) => {
      const startMoment = moment.tz(appt.startTime, getIanaTimezone(timezone));
      const endMoment = appt.endTime
        ? moment.tz(appt.endTime, getIanaTimezone(timezone))
        : startMoment.clone().add(appt.duration || 30, "minutes");
      return {
        id: appt._id,
        start: startMoment.toDate(),
        end: endMoment.toDate(),
        title: appt.service?.name || "Appointment",
        resourceId: appt.employee?._id,
        data: appt,
        type: "appointment",
      };
    });
  }, [initialAppointments, timezone]);

  // State cho sự kiện
  const [myEvents, setEvents] = useState<CalendarEvent[]>([]);

  // Cập nhật sự kiện khi appointmentEvents hoặc notWorkingEvents thay đổi
  useEffect(() => {
    setProcessing(true);
    const filteredEvents = [
      ...notWorkingEvents,
      ...timeOffEvents,
      ...(cancelled
        ? appointmentEvents
        : appointmentEvents.filter(
            (event) => event.data?.status !== "cancelled",
          )),
    ];
    setEvents(filteredEvents);
    setProcessing(false);
  }, [notWorkingEvents, timeOffEvents, appointmentEvents, cancelled]);

  // Reset isLoading when initialAppointments change (indicating fetch complete)
  useEffect(() => {
    setIsLoading(false);
  }, [initialAppointments, setIsLoading]);

  const updateUrlParams = (updates: Record<string, string | boolean>) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      currentParams.set(key, value.toString());
    });
    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    router.push(newUrl);
  };

  // Handle date change with transition
  const handleDateChange = (newDate: Date) => {
    setIsLoading(true);
    startTransition(() => {
      const normalizedDate = moment
        .tz(newDate, getIanaTimezone(timezone))
        .startOf("day")
        .toDate();
      setDate(normalizedDate);
      updateUrlParams({
        date: moment(normalizedDate).format("YYYY-MM-DD"),
      });
      setIsLoading(false);
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
      reminder: [],
      services: [],
      status: "scheduled",
    },
  });

  const handleConfirm = async () => {
    setShowConfirm(false);
    await handleAppointmentSuccess();
  };

  const handleFormSave = () => {
    if (type === "create") {
      handleAppointmentSuccess();
    } else {
      setShowConfirm(true); // Show confirm dialog only for edit
    }
  };

  const handleAppointmentSuccess = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setIsLoading(true); // Set loading immediately before action

    try {
      const formValues = appointmentForm.getValues();
      const formData = new FormData();
      console.log("Form Values:", formValues);
      formData.append("time", formValues.time);
      formData.append("note", formValues.note || "");
      formData.append("status", formValues.status || "scheduled");
      formData.append("smsMessage", formValues.smsMessage || "");

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
            formValues.reminder,
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
          formValues.reminder,
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
            formValues.reminder,
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
      console.log("Selected Slot Start:", start.toISOString());
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

    if (
      calendarEvent.type === "not_working" ||
      calendarEvent.type === "timeOff"
    ) {
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
      _ref: calendarEvent.data.customer._id,
      _type: "reference",
    });
    appointmentForm.setValue("note", calendarEvent.data.note || "");
    appointmentForm.setValue("reminder", calendarEvent.data.reminder);
    appointmentForm.setValue("smsMessage", calendarEvent.data.smsMessage || "");
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
    appointmentForm.setValue(
      "status",
      calendarEvent.data.status || "scheduled",
    );
    setDuration(calendarEvent.data.duration || 0);
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

      if (
        calendarEvent.type === "not_working" ||
        calendarEvent.type === "timeOff"
      ) {
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
      appointmentForm.setValue("reminder", calendarEvent.data.reminder);
      appointmentForm.setValue(
        "smsMessage",
        calendarEvent.data.smsMessage || "",
      );
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
      appointmentForm.setValue(
        "status",
        calendarEvent.data.status || "scheduled",
      );

      setDuration(calendarEvent.data.service?.duration || 0);
      setShowConfirm(true);
    },
    [],
  );

  const resizeEvent = useCallback(
    (args: { event: object; start: Date | string; end: Date | string }) => {
      const { event, start, end } = args;
      const calendarEvent = event as CalendarEvent;

      if (
        calendarEvent.type === "not_working" ||
        calendarEvent.type === "timeOff"
      ) {
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
      appointmentForm.setValue(
        "smsMessage",
        calendarEvent.data.smsMessage || "",
      );
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
      appointmentForm.setValue(
        "status",
        calendarEvent.data.status || "scheduled",
      );

      setDuration(
        Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)),
      );
      setShowConfirm(true);
    },
    [],
  );

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      const currentDate = moment.tz(toolbar.date, getIanaTimezone(timezone));
      const newDate = currentDate.subtract(1, "day").startOf("day");
      console.log("Previous Date:", newDate.format("YYYY-MM-DD HH:mm:ss z"));
      toolbar.onNavigate("PREV");
      handleDateChange(newDate.toDate());
    };

    const goToNext = () => {
      const currentDate = moment.tz(toolbar.date, getIanaTimezone(timezone));
      const newDate = currentDate.add(1, "day").startOf("day");
      console.log("Next Date:", newDate.format("YYYY-MM-DD HH:mm:ss z"));
      toolbar.onNavigate("NEXT");
      handleDateChange(newDate.toDate());
    };

    const goToToday = () => {
      const today = moment
        .tz(new Date(), getIanaTimezone(timezone))
        .startOf("day");
      console.log("Today:", today.format("YYYY-MM-DD HH:mm:ss z"));
      toolbar.onNavigate("TODAY");
      handleDateChange(today.toDate());
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
    return (
      calendarEvent.type !== "not_working" && calendarEvent.type !== "timeOff"
    );
  }, []);

  const draggableAccessor = useCallback((event: object) => {
    const calendarEvent = event as CalendarEvent;
    return (
      calendarEvent.type !== "not_working" && calendarEvent.type !== "timeOff"
    );
  }, []);

  const NoEventsOverlay = () => (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <span className="text-2xl font-bold text-gray-400">Business Closed</span>
    </div>
  );

  const moveResource = (dragIndex: number, hoverIndex: number) => {
    setResources((prevResources = []) => {
      const updated = [...prevResources];
      const [removed] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, removed);
      return updated;
    });
  };

  useEffect(() => {
    localStorage.setItem(
      "resourceOrder",
      JSON.stringify(resources.map((r) => r.resourceId)),
    );
  }, [resources]);

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

  return (
    <div className="relative h-full w-full">
      <DndProvider backend={HTML5Backend}>
        <div
          className={`h-full w-full ${processing || isLoading ? "loading" : null}`}
        >
          {resources.length === 0 && <NoEventsOverlay />}
          <DragAndDropCalendar
            selectable
            defaultDate={date}
            date={date}
            defaultView={Views.DAY}
            events={myEvents}
            localizer={localizer}
            min={moment
              .tz(getIanaTimezone(timezone))
              .set({ hour: 8, minute: 0, second: 0, millisecond: 0 })
              .toDate()}
            max={moment
              .tz(getIanaTimezone(timezone))
              .set({ hour: 18, minute: 0, second: 0, millisecond: 0 })
              .toDate()}
            // dayLayoutAlgorithm={"no-overlap"}
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
            step={15}
            timeslots={1}
            views={[Views.DAY]}
            components={{
              toolbar: CustomToolbar,
              event: ({ event }: EventProps<object>) => {
                const calendarEvent = event as CalendarEvent;
                if (
                  calendarEvent.type === "appointment" &&
                  calendarEvent.data.status === "scheduled"
                ) {
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
                } else if (
                  calendarEvent.type === "appointment" &&
                  calendarEvent.data.status === "cancelled" &&
                  cancelled === true
                ) {
                  return (
                    <div className="bg-red-600 h-full rounded border border-gray-100 cursor-default resize-none opacity-70">
                      <div className="flex flex-col justify-center items-center p-1 gap-0.5">
                        <span className="text-md text-white">
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
                } else if (
                  calendarEvent.type === "appointment" &&
                  calendarEvent.data.status === "completed"
                ) {
                  return (
                    <div className="bg-green-700 h-full rounded border border-gray-100 cursor-default resize-none opacity-70">
                      <div className="flex flex-col justify-center items-center p-1 gap-0.5">
                        <span className="text-md text-white">
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
                } else if (calendarEvent.type === "not_working") {
                  return (
                    <div className="bg-gray-500 h-full rounded border border-gray-100 cursor-default resize-none opacity-70">
                      <div className="flex flex-col justify-center items-center p-1 gap-0.5">
                        <span className="text-[14px] text-white">
                          {calendarEvent.title}
                        </span>
                      </div>
                    </div>
                  );
                } else if (calendarEvent.type === "timeOff") {
                  return (
                    <div className="bg-blue-400 h-full rounded border border-gray-100 cursor-default resize-none opacity-70">
                      <div className="flex flex-col justify-center items-center p-1 gap-0.5">
                        <span className="text-[14px] text-black ">
                          {calendarEvent.title}
                        </span>
                      </div>
                    </div>
                  );
                }
              },
              resourceHeader: (props: any) => {
                const index = resources.findIndex(
                  (r) => r.resourceId === props.resource.resourceId,
                );
                return (
                  <ResourceHeader resource={props.resource} index={index} />
                );
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
            <DialogTitle>
              {type === "create" ? "Create Appointment" : "Edit Appointment"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Create a new appointment with service, customer and employee.
            </DialogDescription>
          </DialogHeader>
          <AppointmentForm
            form={appointmentForm}
            onSuccess={handleFormSave}
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
        description="Are you sure you want to update this appointment?"
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default AppointmentScheduleTimezone;
