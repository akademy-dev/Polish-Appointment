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
import { useForm, useWatch } from "react-hook-form";
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
  checkRecurringConflicts,
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
import { ConflictDialog } from "@/components/ConflictDialog";
import { getIanaTimezone, safeParseDate, calculateDuration } from "@/lib/utils";
import { deleteTimeOff, updateTimeOff } from "@/actions/time-off";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const DragAndDropCalendar = withDragAndDrop(Calendar);

type AppointmentWithLegacyTimes = Appointment & {
  start_time?: string;
  end_time?: string;
};

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
  initialAppointmentTimeOffs?: any[];
  currentDate: string;
  notWorking?: boolean;
  cancelled?: boolean;
  minTime?: string;
  maxTime?: string;
}

export const formatToISO8601 = (
  date: Date,
  time: string,
  timezone: string
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
  timezone: string
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
    timezone
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
        timezone
      );
      const workEnd = formatToISO8601(currentDate, workSchedule.to, timezone);

      const workStartMoment = moment.tz(workStart, getIanaTimezone(timezone));
      const workEndMoment = moment.tz(workEnd, getIanaTimezone(timezone));
      const standardStartMoment = moment.tz(
        standardStartTime,
        getIanaTimezone(timezone)
      );
      const standardEndMoment = moment.tz(
        standardEndTime,
        getIanaTimezone(timezone)
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
  timezone: string
): Date | null => {
  timeStr = timeStr.trim();
  if (!isValidTimeString(timeStr)) {
    return null;
  }

  const isoTime = formatToISO8601(date, timeStr, timezone);
  const momentTime = moment.tz(isoTime, getIanaTimezone(timezone));
  if (!momentTime.isValid()) {
    return null;
  }
  return momentTime.toDate();
};

const generateAppointmentTimeOffEvents = (
  appointmentTimeOffs: any[],
  date: Date,
  timezone: string,
  maxTime: string
): CalendarEvent[] => {
  const events: any[] = [];

  appointmentTimeOffs.forEach((timeOff) => {
    if (!timeOff.employee || !timeOff.startTime || !timeOff.duration) {
      return;
    }

    const momentDate = moment.tz(date, getIanaTimezone(timezone));
    let isMatchingDate = false;

    if (
      timeOff.isRecurring &&
      timeOff.recurringDuration &&
      timeOff.recurringFrequency
    ) {
      // Handle recurring time off
      // For recurring time offs, each document represents a specific occurrence
      // So we just check if the startTime matches the current date
      const timeOffDate = moment.tz(
        timeOff.startTime,
        getIanaTimezone(timezone)
      );
      isMatchingDate = timeOffDate.isSame(momentDate, "day");
    } else {
      // Non-recurring time off - check if it's for today
      const timeOffDate = moment.tz(
        timeOff.startTime,
        getIanaTimezone(timezone)
      );
      isMatchingDate = timeOffDate.isSame(momentDate, "day");
    }

    if (isMatchingDate) {
      const startTime = moment
        .tz(timeOff.startTime, getIanaTimezone(timezone))
        .toDate();
      let endTime;

      if (timeOff.duration === "to_close") {
        // For "to close", set end time to the end of the day (maxTime)
        const maxTimeMoment = setTimeToDate(date, maxTime, timezone);
        endTime =
          maxTimeMoment ||
          moment
            .tz(timeOff.startTime, getIanaTimezone(timezone))
            .add(480, "minutes") // Fallback to 8 hours if maxTime parsing fails
            .toDate();
      } else {
        // For regular duration, add minutes to start time
        endTime = moment
          .tz(timeOff.startTime, getIanaTimezone(timezone))
          .add(timeOff.duration, "minutes")
          .toDate();
      }

      events.push({
        id: `appointment_time_off_${timeOff._id}_${momentDate.format("YYYY-MM-DD")}`,
        start: startTime,
        end: endTime,
        title: "Time Off",
        resourceId: timeOff.employee._id,
        type: "appointmentTimeOff",
        data: timeOff,
      });
    }
  });

  return events;
};

const AppointmentScheduleTimezone = ({
  initialEmployees,
  initialAppointments,
  initialAppointmentTimeOffs = [],
  currentDate,
  notWorking = false,
  cancelled = false,
  minTime: propMinTime,
  maxTime: propMaxTime,
}: AppointmentScheduleProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    date,
    setDate,
    isLoading,
    setIsLoading,
    timezone,
    minTime: contextMinTime,
    maxTime: contextMaxTime,
  } = useContext(CalendarContext);

  // Use props if provided, otherwise use context values
  const minTime = propMinTime || contextMinTime;
  const maxTime = propMaxTime || contextMaxTime;

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
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [pendingAppointmentData, setPendingAppointmentData] =
    useState<any>(null);
  const [showServiceConfirm, setShowServiceConfirm] = useState(false);
  const [pendingMoveEvent, setPendingMoveEvent] = useState<{
    event: object;
    start: Date | string;
    end: Date | string;
    resourceId?: number | string;
  } | null>(null);
  const [appointmentTimeOffs, setAppointmentTimeOffs] = useState<any[]>(
    initialAppointmentTimeOffs
  );
  const [showTimeOffDialog, setShowTimeOffDialog] = useState(false);
  const [selectedTimeOff, setSelectedTimeOff] = useState<any>(null);
  const [editingTimeOff, setEditingTimeOff] = useState<any>(null);
  const [isCancellingStanding, setIsCancellingStanding] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [rpcAppointments, setRpcAppointments] = useState<Appointment[]>([]);

  // Local state for optimistic updates
  const [appointments, setAppointments] = useState<Appointment[]>(
    initialAppointments || []
  );

  // Sync with initialAppointments when they change (from server)
  useEffect(() => {
    if (initialAppointments) {
      setAppointments(initialAppointments);
    }
  }, [initialAppointments]);

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

  // Sync date from URL parameter on mount
  useEffect(() => {
    if (currentDate) {
      // currentDate is already a string in correct timezone (e.g., "2025-08-20")
      // Parse it directly without timezone conversion
      const urlDate = moment(currentDate, "YYYY-MM-DD").toDate();
      const contextDate = moment
        .tz(date, getIanaTimezone(timezone))
        .startOf("day")
        .toDate();

      // Only update if dates are different
      if (urlDate.getTime() !== contextDate.getTime()) {
        setDate(urlDate);
      }
    }
  }, [currentDate, timezone, setDate]);

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
            ? moment(currentDate, "YYYY-MM-DD").toDate()
            : moment.tz(new Date(), getIanaTimezone(timezone)).toDate()
        )
    );
  }, [initialEmployees, currentDate, notWorking, timezone]);

  const [resources, setResources] = useState<Resource[]>(() => {
    const savedOrder = localStorage.getItem("resourceOrder");
    let orderedEmployees = filteredEmployees;
    if (savedOrder) {
      const order: string[] = JSON.parse(savedOrder);
      // Filter order to only include employees that are currently visible
      const filteredOrder = order.filter((id) =>
        filteredEmployees.some((emp) => emp._id === id)
      );

      // Sort employees: first by saved order, then add new employees at the end
      orderedEmployees = [...filteredEmployees].sort((a, b) => {
        const aIndex = filteredOrder.indexOf(a._id);
        const bIndex = filteredOrder.indexOf(b._id);

        // If both are in saved order, sort by their order
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        // If only one is in saved order, prioritize the saved one
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        // If neither is in saved order, maintain original order
        return 0;
      });
    }
    return orderedEmployees.map((employee: any) => ({
      resourceId: employee._id,
      resourceTitle: getProfileName(employee),
    }));
  });

  // Track if user has manually reordered resources
  const [hasUserReordered, setHasUserReordered] = useState(false);

  useEffect(() => {
    const savedOrder = localStorage.getItem("resourceOrder");
    let orderedEmployees = filteredEmployees;
    if (savedOrder) {
      const order: string[] = JSON.parse(savedOrder);
      // Filter order to only include employees that are currently visible
      const filteredOrder = order.filter((id) =>
        filteredEmployees.some((emp) => emp._id === id)
      );

      // Sort employees: first by saved order, then add new employees at the end
      orderedEmployees = [...filteredEmployees].sort((a, b) => {
        const aIndex = filteredOrder.indexOf(a._id);
        const bIndex = filteredOrder.indexOf(b._id);

        // If both are in saved order, sort by their order
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        // If only one is in saved order, prioritize the saved one
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        // If neither is in saved order, maintain original order
        return 0;
      });
    }
    setResources(
      orderedEmployees.map((employee: any) => ({
        resourceId: employee._id,
        resourceTitle: getProfileName(employee),
      }))
    );
    setIsLoading(false);

    // Reset hasUserReordered when filteredEmployees changes (e.g., when notWorking changes)
    setHasUserReordered(false);
  }, [filteredEmployees]);

  // Memoize not working events
  const notWorkingEvents = useMemo(() => {
    // Đảm bảo currentDate ở đầu ngày với múi giờ cụ thể
    const dateAtStartOfDay = currentDate
      ? moment(currentDate, "YYYY-MM-DD").startOf("day").toDate()
      : moment
          .tz(new Date(), getIanaTimezone(timezone))
          .startOf("day")
          .toDate();

    return generateNotWorkingEvents(
      initialEmployees,
      minTime,
      maxTime,
      dateAtStartOfDay,
      timezone
    );
  }, [initialEmployees, currentDate, timezone]);

  // Generate appointment time off events
  const timeOffEvents = useMemo(() => {
    const dateAtStartOfDay = currentDate
      ? moment(currentDate, "YYYY-MM-DD").startOf("day").toDate()
      : moment
          .tz(new Date(), getIanaTimezone(timezone))
          .startOf("day")
          .toDate();

    const events = generateAppointmentTimeOffEvents(
      appointmentTimeOffs,
      dateAtStartOfDay,
      timezone,
      maxTime || "6:00 PM"
    );

    return events;
  }, [appointmentTimeOffs, currentDate, timezone, maxTime]);

  // Ánh xạ appointments (local state) thành sự kiện lịch
  const appointmentEvents = useMemo(() => {
    return (appointments || [])
      .filter((appt: AppointmentWithLegacyTimes) => {
        // Filter out appointments with invalid startTime
        const startTime = appt.startTime || appt.start_time;
        return startTime && safeParseDate(startTime);
      })
      .map((appt: AppointmentWithLegacyTimes) => {
        const startTimeStr = appt.startTime || appt.start_time;
        const endTimeStr = appt.endTime || appt.end_time;

        const startMoment = moment.tz(startTimeStr, getIanaTimezone(timezone));
        const endMoment = endTimeStr
          ? moment.tz(endTimeStr, getIanaTimezone(timezone))
          : startMoment.clone().add(appt.duration || 30, "minutes");

        // Validate moments
        if (!startMoment.isValid()) {
          return null;
        }

        return {
          id: appt._id,
          start: startMoment.toDate(),
          end: endMoment.isValid()
            ? endMoment.toDate()
            : startMoment.clone().add(30, "minutes").toDate(),
          title: appt.service?.name || "Appointment",
          resourceId: appt.employee?._id,
          data: appt,
          type: "appointment",
        };
      })
      .filter((event) => event !== null);
  }, [appointments, timezone]);

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
            (event) => event.data?.status !== "cancelled"
          )),
    ];
    setEvents(filteredEvents);
    setProcessing(false);
  }, [notWorkingEvents, timeOffEvents, appointmentEvents, cancelled]);

  // Reset isLoading when initialAppointments change (indicating fetch complete)
  useEffect(() => {
    setIsLoading(false);
  }, [initialAppointments, setIsLoading]);

  // Fetch appointment time off data from Supabase
  const fetchAppointmentTimeOffs = React.useCallback(async () => {
    try {
      const response = await fetch("/api/appointment-time-off");
      const timeOffs = await response.json();
      setAppointmentTimeOffs(timeOffs || []);
    } catch (error) {
      setAppointmentTimeOffs([]);
    }
  }, []);

  // Fetch appointment time offs on component mount
  useEffect(() => {
    fetchAppointmentTimeOffs();
  }, [fetchAppointmentTimeOffs]);

  // Refresh appointment time offs when appointments change (indicating new time off was created)
  useEffect(() => {
    fetchAppointmentTimeOffs();
  }, [initialAppointments, fetchAppointmentTimeOffs]);

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
      type: "walk-in",
      isRecurring: false,
      recurringDuration: {
        value: 1,
        unit: "months",
      },
      recurringFrequency: {
        value: 1,
        unit: "weeks",
      },
      recurringGroupId: "",
    },
  });

  // Watch form values for dynamic title
  const watchedEmployeeRef = useWatch({
    control: appointmentForm.control,
    name: "employee._ref",
  });

  const watchedTime = useWatch({
    control: appointmentForm.control,
    name: "time",
  });

  // Generate dynamic title
  const generateDialogTitle = () => {
    if (type === "edit") {
      return "Edit Appointment";
    }

    if (!watchedEmployeeRef || !watchedTime) {
      return "Create Appointment";
    }

    const selectedEmployee = filteredEmployees.find(
      (emp) => emp._id === watchedEmployeeRef
    );

    if (!selectedEmployee) {
      return "Create Appointment";
    }

    try {
      const appointmentDate = new Date(watchedTime);
      const dayOfWeek = appointmentDate.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: getIanaTimezone(timezone),
      });
      const dateString = appointmentDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: getIanaTimezone(timezone),
      });
      const timeString = appointmentDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: getIanaTimezone(timezone),
      });

      return `Scheduling with ${selectedEmployee.firstName} on ${dayOfWeek}, ${dateString} at ${timeString}`;
    } catch (error) {
      return "Create Appointment";
    }
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    await handleAppointmentSuccess();
  };

  const handleConflictConfirm = async () => {
    if (!pendingAppointmentData) return;

    setIsSubmitting(true);
    setIsLoading(true);
    setShowConflictDialog(false);

    try {
      const result = await createAppointment(
        pendingAppointmentData.formData,
        pendingAppointmentData.customer,
        pendingAppointmentData.employee,
        pendingAppointmentData.services,
        pendingAppointmentData.reminder,
        pendingAppointmentData.isRecurring,
        pendingAppointmentData.recurringDuration,
        pendingAppointmentData.recurringFrequency
      );

      if (result.status === "SUCCESS") {
        setOpen(false);
        appointmentForm.reset();
        // Optimistic update: Add appointments to local state immediately
        if (result.results && Array.isArray(result.results)) {
          const newAppointments = result.results.map((createdAppt: any) => {
            const formValues = pendingAppointmentData;
            const totalDuration = formValues.services.reduce(
              (total: number, service: any) =>
                total + service.duration * service.quantity,
              0
            );
            const startTime = new Date(
              formValues.formData.get("time") as string
            );
            const endTime = new Date(
              startTime.getTime() + totalDuration * 60000
            );

            const employee = filteredEmployees.find(
              (emp) => emp._id === formValues.employee._ref
            );
            const firstService = formValues.services[0];

            return {
              _id: createdAppt._id || `temp-${Date.now()}-${Math.random()}`,
              _createdAt: new Date().toISOString(),
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              duration: totalDuration,
              note: (formValues.formData.get("note") as string) || "",
              type: ((formValues.formData.get("type") as string) ||
                "walk-in") as Appointment["type"],
              status: ((formValues.formData.get("status") as string) ||
                "scheduled") as Appointment["status"],
              reminder: (formValues.reminder || []) as Appointment["reminder"],
              reminderDateTimes: [],
              smsMessage: "",
              customer: {
                _id: formValues.customer._ref || "",
                _type: "customer",
                firstName: "",
                lastName: "",
                phone: "",
              },
              employee: {
                _id: employee?._id || formValues.employee._ref,
                _type: "employee",
                firstName: employee?.firstName || "",
                lastName: employee?.lastName || "",
              },
              service: {
                _id: firstService?._ref || "",
                name: "Loading...",
                price: 0,
                duration: firstService?.duration || 0,
                category: { _id: "", name: "" },
              },
              recurringGroupId: createdAppt.recurringGroupId,
            } satisfies Appointment;
          });

          setAppointments((prev) => [...prev, ...newAppointments]);
        }

        toast.success("Success", {
          description:
            "Recurring appointments created successfully (with conflicts)",
        });

        // Refresh in background without blocking UI
        startTransition(() => {
          router.refresh();
        });
        fetchAppointmentTimeOffs(); // Refresh time off data
      } else {
        toast.error("Error", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
      setPendingAppointmentData(null);
      setConflicts([]);
    }
  };

  const handleConflictCancel = () => {
    setShowConflictDialog(false);
    setPendingAppointmentData(null);
    setConflicts([]);
    setIsSubmitting(false);
    setIsLoading(false);
  };

  const handleTimeOffCancel = async () => {
    if (!selectedTimeOff) return;

    setIsSubmitting(true);
    try {
      const result = await deleteTimeOff(selectedTimeOff._id);

      if (result.status === "SUCCESS") {
        toast.success("Time off cancelled successfully");
        setShowTimeOffDialog(false);
        setSelectedTimeOff(null);
        fetchAppointmentTimeOffs();
      } else {
        toast.error("Error cancelling time off", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeOffUpdate = async () => {
    if (!selectedTimeOff || !editingTimeOff) return;

    setIsSubmitting(true);
    try {
      const result = await updateTimeOff(selectedTimeOff._id, editingTimeOff);

      if (result.status === "SUCCESS") {
        toast.success("Time off updated successfully");
        setShowTimeOffDialog(false);
        setSelectedTimeOff(null);
        setEditingTimeOff(null);
        fetchAppointmentTimeOffs();
      } else {
        toast.error("Error updating time off", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTimeOff = () => {
    if (selectedTimeOff) {
      setEditingTimeOff({
        employee: {
          _ref: selectedTimeOff.employee._id,
          _type: "reference",
        },
        employeeInfo: selectedTimeOff.employee, // Giữ thông tin employee để hiển thị
        startTime: selectedTimeOff.startTime,
        duration: selectedTimeOff.duration,
        reason: selectedTimeOff.reason,
        isRecurring: selectedTimeOff.isRecurring,
        recurringDuration: selectedTimeOff.recurringDuration,
        recurringFrequency: selectedTimeOff.recurringFrequency,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingTimeOff(null);
  };

  const formatDuration = (duration: number | string): string => {
    if (duration === "to_close") {
      return "To close";
    }
    const min = duration as number;
    const hr = Math.floor(min / 60);
    const m = min % 60;
    if (hr && m) return `${hr}hr ${m}min`;
    if (hr) return `${hr}hr`;
    return `${m}min`;
  };

  const handleFormSave = async () => {
    if (type === "create") {
      await handleAppointmentSuccess();
    } else {
      setShowConfirm(true); // Show confirm dialog only for edit
    }
  };

  const handleCancelStandingSuccess = async () => {
    // Handle success after cancel standing - close dialog directly
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
      formData.append("type", formValues.type || "walk-in");
      formData.append("status", formValues.status || "scheduled");

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
            formValues.reminder
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

        // For create mode, check for conflicts first if it's a recurring appointment
        if (formValues.isRecurring) {
          // Calculate end time for the first appointment
          const startTime = new Date(formValues.time);
          const totalDuration = formValues.services.reduce(
            (total, service) => total + service.duration * service.quantity,
            0
          );
          const endTime = new Date(startTime.getTime() + totalDuration * 60000);

          const conflictResult = await checkRecurringConflicts(
            formValues.employee._ref,
            startTime.toISOString(),
            endTime.toISOString(),
            formValues.isRecurring,
            formValues.recurringDuration?.value &&
              formValues.recurringDuration?.unit
              ? {
                  value: formValues.recurringDuration.value,
                  unit: formValues.recurringDuration.unit,
                }
              : undefined,
            formValues.recurringFrequency?.value &&
              formValues.recurringFrequency?.unit
              ? {
                  value: formValues.recurringFrequency.value,
                  unit: formValues.recurringFrequency.unit,
                }
              : undefined
          );

          if (
            conflictResult.status === "SUCCESS" &&
            conflictResult.conflicts.length > 0
          ) {
            // Store the appointment data and show conflict dialog
            setPendingAppointmentData({
              formData,
              customer: {
                _ref: formValues.customer._ref,
                _type: formValues.customer._type,
              },
              employee: formValues.employee,
              services: formValues.services,
              reminder: formValues.reminder,
              isRecurring: formValues.isRecurring,
              recurringDuration:
                formValues.recurringDuration?.value &&
                formValues.recurringDuration?.unit
                  ? {
                      value: formValues.recurringDuration.value,
                      unit: formValues.recurringDuration.unit,
                    }
                  : undefined,
              recurringFrequency:
                formValues.recurringFrequency?.value &&
                formValues.recurringFrequency?.unit
                  ? {
                      value: formValues.recurringFrequency.value,
                      unit: formValues.recurringFrequency.unit,
                    }
                  : undefined,
            });
            setConflicts(conflictResult.conflicts);
            setShowConflictDialog(true);
            setIsSubmitting(false);
            setIsLoading(false);
            return;
          }
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
          formValues.isRecurring,
          formValues.recurringDuration?.value &&
            formValues.recurringDuration?.unit
            ? {
                value: formValues.recurringDuration.value,
                unit: formValues.recurringDuration.unit,
              }
            : undefined,
          formValues.recurringFrequency?.value &&
            formValues.recurringFrequency?.unit
            ? {
                value: formValues.recurringFrequency.value,
                unit: formValues.recurringFrequency.unit,
              }
            : undefined
        );

        if (result.status === "SUCCESS") {
          // Optimistic update: Add appointments to local state immediately
          if (result.results && Array.isArray(result.results)) {
            const newAppointments = result.results.map((createdAppt: any) => {
              // Build optimistic appointment from form values and created result
              const totalDuration = formValues.services.reduce(
                (total, service) => total + service.duration * service.quantity,
                0
              );
              const startTime = new Date(formValues.time);
              const endTime = new Date(
                startTime.getTime() + totalDuration * 60000
              );

              // Find employee and service info
              const employee = filteredEmployees.find(
                (emp) => emp._id === formValues.employee._ref
              );
              const firstService = formValues.services[0];

              return {
                _id: createdAppt._id || `temp-${Date.now()}-${Math.random()}`,
                _createdAt: new Date().toISOString(),
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                duration: totalDuration,
                note: formValues.note || "",
                type: (formValues.type || "walk-in") as Appointment["type"],
                status: (formValues.status ||
                  "scheduled") as Appointment["status"],
                reminder: (formValues.reminder ||
                  []) as Appointment["reminder"],
                reminderDateTimes: [],
                smsMessage: "",
                customer: {
                  _id: formValues.customer._ref || "",
                  _type: "customer",
                  firstName: formValues.customer.firstName,
                  lastName: formValues.customer.lastName,
                  phone: formValues.customer.phone,
                },
                employee: {
                  _id: employee?._id || formValues.employee._ref,
                  _type: "employee",
                  firstName: employee?.firstName || "",
                  lastName: employee?.lastName || "",
                },
                service: {
                  _id: firstService?._ref || "",
                  name: "Loading...",
                  price: 0,
                  duration: firstService?.duration || 0,
                  category: { _id: "", name: "" },
                },
                recurringGroupId: createdAppt.recurringGroupId,
              } satisfies Appointment;
            });

            // Add to local state immediately
            setAppointments((prev) => [...prev, ...newAppointments]);
          }

          setOpen(false);
          appointmentForm.reset();
          toast.success("Success", {
            description: `Appointment created successfully`,
          });

          // Refresh in background without blocking UI
          startTransition(() => {
            router.refresh();
          });
          fetchAppointmentTimeOffs(); // Refresh time off data
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

          // Check for conflicts if it's a recurring appointment
          if (formValues.isRecurring) {
            const startTime = new Date(formValues.time);
            const totalDuration = formValues.services.reduce(
              (total, service) => total + service.duration * service.quantity,
              0
            );
            const endTime = new Date(
              startTime.getTime() + totalDuration * 60000
            );

            const conflictResult = await checkRecurringConflicts(
              formValues.employee._ref,
              startTime.toISOString(),
              endTime.toISOString(),
              formValues.isRecurring,
              formValues.recurringDuration?.value &&
                formValues.recurringDuration?.unit
                ? {
                    value: formValues.recurringDuration.value,
                    unit: formValues.recurringDuration.unit,
                  }
                : undefined,
              formValues.recurringFrequency?.value &&
                formValues.recurringFrequency?.unit
                ? {
                    value: formValues.recurringFrequency.value,
                    unit: formValues.recurringFrequency.unit,
                  }
                : undefined
            );

            if (
              conflictResult.status === "SUCCESS" &&
              conflictResult.conflicts.length > 0
            ) {
              setPendingAppointmentData({
                formData,
                customer: {
                  _ref: customerId,
                  _type: "reference",
                },
                employee: formValues.employee,
                services: formValues.services,
                reminder: formValues.reminder,
                isRecurring: formValues.isRecurring,
                recurringDuration:
                  formValues.recurringDuration?.value &&
                  formValues.recurringDuration?.unit
                    ? {
                        value: formValues.recurringDuration.value,
                        unit: formValues.recurringDuration.unit,
                      }
                    : undefined,
                recurringFrequency:
                  formValues.recurringFrequency?.value &&
                  formValues.recurringFrequency?.unit
                    ? {
                        value: formValues.recurringFrequency.value,
                        unit: formValues.recurringFrequency.unit,
                      }
                    : undefined,
              });
              setConflicts(conflictResult.conflicts);
              setShowConflictDialog(true);
              setIsSubmitting(false);
              setIsLoading(false);
              return;
            }
          }

          const result = await createAppointment(
            formData,
            {
              _ref: customerId,
              _type: "reference",
            },
            formValues.employee,
            formValues.services,
            formValues.reminder,
            formValues.isRecurring,
            formValues.recurringDuration?.value &&
              formValues.recurringDuration?.unit
              ? {
                  value: formValues.recurringDuration.value,
                  unit: formValues.recurringDuration.unit,
                }
              : undefined,
            formValues.recurringFrequency?.value &&
              formValues.recurringFrequency?.unit
              ? {
                  value: formValues.recurringFrequency.value,
                  unit: formValues.recurringFrequency.unit,
                }
              : undefined
          );

          if (result.status === "SUCCESS") {
            // Optimistic update: Add appointments to local state immediately
            if (result.results && Array.isArray(result.results)) {
              const newAppointments = result.results.map((createdAppt: any) => {
                // Build optimistic appointment from form values and created result
                const totalDuration = formValues.services.reduce(
                  (total, service) =>
                    total + service.duration * service.quantity,
                  0
                );
                const startTime = new Date(formValues.time);
                const endTime = new Date(
                  startTime.getTime() + totalDuration * 60000
                );

                // Find employee and service info
                const employee = filteredEmployees.find(
                  (emp) => emp._id === formValues.employee._ref
                );
                const firstService = formValues.services[0];

                return {
                  _id: createdAppt._id || `temp-${Date.now()}-${Math.random()}`,
                  _createdAt: new Date().toISOString(),
                  startTime: startTime.toISOString(),
                  endTime: endTime.toISOString(),
                  duration: totalDuration,
                  note: formValues.note || "",
                  type: (formValues.type || "walk-in") as Appointment["type"],
                  status: (formValues.status ||
                    "scheduled") as Appointment["status"],
                  reminder: (formValues.reminder ||
                    []) as Appointment["reminder"],
                  reminderDateTimes: [],
                  smsMessage: "",
                  customer: {
                    _id: customerId,
                    _type: "customer",
                    firstName: formValues.customer.firstName,
                    lastName: formValues.customer.lastName,
                    phone: formValues.customer.phone,
                  },
                  employee: {
                    _id: employee?._id || formValues.employee._ref,
                    _type: "employee",
                    firstName: employee?.firstName || "",
                    lastName: employee?.lastName || "",
                  },
                  service: {
                    _id: firstService?._ref || "",
                    name: "Loading...",
                    price: 0,
                    duration: firstService?.duration || 0,
                    category: { _id: "", name: "" },
                  },
                  recurringGroupId: createdAppt.recurringGroupId,
                } satisfies Appointment;
              });

              // Add to local state immediately
              setAppointments((prev) => [...prev, ...newAppointments]);
            }

            setOpen(false);
            appointmentForm.reset();
            toast.success("Success", {
              description: "New Appointment created successfully",
            });

            // Refresh in background without blocking UI
            startTransition(() => {
              router.refresh();
            });
            fetchAppointmentTimeOffs(); // Refresh time off data
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
    []
  );

  const handleSelectEvent = useCallback(async (event: object) => {
    const calendarEvent = event as CalendarEvent;

    if (calendarEvent.type === "not_working") {
      return;
    }

    if (calendarEvent.type === "appointmentTimeOff") {
      setSelectedTimeOff(calendarEvent.data);
      setShowTimeOffDialog(true);
      return;
    }

    // Call SQL function when appointment is clicked to get full data
    if (calendarEvent.type === "appointment" && calendarEvent.data._id) {
      try {
        const response = await fetch(
          `/api/appointments?appointmentId=${calendarEvent.data._id}`
        );
        const rpcResult = await response.json();

        if (process.env.NODE_ENV !== "production") {
          const sample =
            Array.isArray(rpcResult) && rpcResult.length > 0
              ? rpcResult[0]
              : rpcResult;
          console.log("[rpc] get_appointment_with_services_same_day response", {
            appointmentId: calendarEvent.data._id,
            rpcType: Array.isArray(rpcResult) ? "array" : typeof rpcResult,
            rpcLength: Array.isArray(rpcResult) ? rpcResult.length : undefined,
            sample: sample
              ? {
                  id: (sample as any).id,
                  employee_id: (sample as any).employee_id,
                  employee_first_name: (sample as any).employee_first_name,
                  employee_last_name: (sample as any).employee_last_name,
                  services_same_day_count: Array.isArray(
                    (sample as any).services_same_day
                  )
                    ? (sample as any).services_same_day.length
                    : 0,
                }
              : sample,
          });
        }

        // Use RPC result to populate form instead of calendarEvent.data
        if (rpcResult && Array.isArray(rpcResult) && rpcResult.length > 0) {
          const appointmentData = rpcResult[0];

          setType("edit");
          setAppointmentId(appointmentData.id);

          // Set customer info from RPC result
          appointmentForm.setValue("customer", {
            firstName: appointmentData.customer_first_name || "",
            lastName: appointmentData.customer_last_name || "",
            phone: appointmentData.customer_phone || "",
            _ref: appointmentData.customer_id,
            _type: "reference",
          });

          // Set employee from calendarEvent (or from RPC if available)
          appointmentForm.setValue("employee", {
            _ref: calendarEvent.resourceId.toString(),
            _type: "reference",
          });

          // Set other fields from RPC result
          appointmentForm.setValue("note", appointmentData.note || "");
          appointmentForm.setValue("reminder", appointmentData.reminder || []);
          appointmentForm.setValue("type", appointmentData.type || "walk-in");
          appointmentForm.setValue(
            "status",
            appointmentData.status || "scheduled"
          );

          // Set recurringGroupId for Cancel Standing functionality
          if (appointmentData.recurring_group_id) {
            appointmentForm.setValue(
              "recurringGroupId",
              appointmentData.recurring_group_id
            );
          }

          // Find the first service from services_same_day to set as the selected service
          // and set time from the first appointment
          if (
            appointmentData.services_same_day &&
            appointmentData.services_same_day.length > 0
          ) {
            const firstService = appointmentData.services_same_day[0];

            const employeeIdFromCalendar =
              calendarEvent.resourceId?.toString?.() || "";
            const employeeFromCalendar = (initialEmployees || []).find(
              (e: any) => e?._id?.toString?.() === employeeIdFromCalendar
            );
            const employeeNameFromCalendar = employeeFromCalendar
              ? getProfileName(employeeFromCalendar as any)
              : "";

            // Set time from first service
            if (firstService.start_time) {
              appointmentForm.setValue("time", firstService.start_time);
            }

            // Transform services_same_day into appointments format
            const transformedAppointments: Appointment[] =
              appointmentData.services_same_day.map((service: any) => ({
                // IMPORTANT:
                // Staff in services_same_day can be different or can lag behind in RPC fields.
                // Prefer staff info on the service row (if present), otherwise fall back to
                // calendar resource (current staff on UI), then finally fall back to RPC root fields.
                _id: `${appointmentData.id}_${service.service_id}_${service.start_time}`, // Generate unique ID
                startTime: service.start_time,
                endTime: service.end_time,
                duration: calculateDuration(
                  service.start_time,
                  service.end_time
                ),
                created_at: service.created_at || appointmentData.created_at,
                _createdAt: service.created_at || appointmentData.created_at,
                customer: {
                  _id: appointmentData.customer_id,
                  firstName: appointmentData.customer_first_name,
                  lastName: appointmentData.customer_last_name,
                  fullName:
                    `${appointmentData.customer_first_name || ""} ${appointmentData.customer_last_name || ""}`.trim(),
                },
                employee: {
                  _id:
                    service.employee_id ||
                    service.employeeId ||
                    service.staff_id ||
                    service.staffId ||
                    appointmentData.employee_id ||
                    employeeIdFromCalendar,
                  firstName:
                    service.employee_first_name ||
                    service.employeeFirstName ||
                    service.staff_first_name ||
                    service.staffFirstName ||
                    appointmentData.employee_first_name ||
                    (employeeFromCalendar as any)?.firstName ||
                    "",
                  lastName:
                    service.employee_last_name ||
                    service.employeeLastName ||
                    service.staff_last_name ||
                    service.staffLastName ||
                    appointmentData.employee_last_name ||
                    (employeeFromCalendar as any)?.lastName ||
                    "",
                  fullName:
                    service.employee_full_name ||
                    (service as any).employee_fullname ||
                    service.employeeFullName ||
                    service.staff_full_name ||
                    service.staffFullName ||
                    service.employee_name ||
                    service.staff_name ||
                    employeeNameFromCalendar ||
                    `${appointmentData.employee_first_name || ""} ${appointmentData.employee_last_name || ""}`.trim(),
                },
                service: {
                  _id: service.service_id,
                  name: service.name,
                  duration: calculateDuration(
                    service.start_time,
                    service.end_time
                  ),
                },
                reminder: appointmentData.reminder || [],
                type: appointmentData.type || "walk-in",
                status: appointmentData.status || "scheduled",
                note: appointmentData.note || "",
                recurringGroupId: appointmentData.recurring_group_id,
              }));

            if (process.env.NODE_ENV !== "production") {
              console.log("[rpc] transformed today's services (staff)", {
                appointmentId: appointmentData.id,
                items: transformedAppointments.map((a: any) => ({
                  id: a._id,
                  startTime: a.startTime,
                  service: a.service?.name || a.service?._id,
                  staffId: a.employee?._id,
                  staffName:
                    (a.employee as any)?.fullName ||
                    `${a.employee?.firstName || ""} ${a.employee?.lastName || ""}`.trim(),
                })),
              });
            }

            // Store transformed appointments to pass to AppointmentForm
            setRpcAppointments(transformedAppointments);

            // Set services - use the first service's service_id
            // Calculate duration for the service
            const serviceDuration = calculateDuration(
              firstService.start_time,
              firstService.end_time
            );
            const newServices = [
              {
                _ref: firstService.service_id,
                _type: "reference",
                duration: serviceDuration,
                quantity: 1,
              },
            ];
            appointmentForm.setValue("services", newServices);

            // Calculate and set duration from first and last service
            const lastService =
              appointmentData.services_same_day[
                appointmentData.services_same_day.length - 1
              ];
            if (firstService.start_time && lastService.end_time) {
              const totalDuration = calculateDuration(
                firstService.start_time,
                lastService.end_time
              );
              setDuration(totalDuration);
            } else {
              setDuration(calendarEvent.data.duration || 0);
            }
          } else {
            // Reset RPC appointments if no services_same_day
            setRpcAppointments([]);
            // Fallback to calendarEvent data if no services_same_day
            appointmentForm.setValue(
              "time",
              calendarEvent.data.startTime.toString()
            );
            const newServices = calendarEvent.data.service
              ? [
                  {
                    _ref: calendarEvent.data.service._id,
                    _type: "reference",
                    duration:
                      calendarEvent.data.duration ||
                      calendarEvent.data.service.duration,
                    quantity: 1,
                  },
                ]
              : [];
            appointmentForm.setValue("services", newServices);
            setDuration(calendarEvent.data.duration || 0);
            // Reset RPC appointments if fallback
            setRpcAppointments([]);
          }

          setOpen(true);
          return; // Exit early since we've populated from RPC
        }
      } catch (error) {
        console.error(
          "Error calling get_appointment_with_services_same_day:",
          error
        );
        // Fall through to use calendarEvent.data as fallback
      }
    }

    // Fallback: Use calendarEvent.data if RPC call fails or no result
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
    appointmentForm.setValue("type", calendarEvent.data.type || "walk-in");
    const newServices = calendarEvent.data.service
      ? [
          {
            _ref: calendarEvent.data.service._id,
            _type: "reference",
            duration:
              calendarEvent.data.duration ||
              calendarEvent.data.service.duration,
            quantity: 1,
          },
        ]
      : [];
    appointmentForm.setValue("services", newServices);
    appointmentForm.setValue(
      "status",
      calendarEvent.data.status || "scheduled"
    );
    // Set recurringGroupId for Cancel Standing functionality
    if (calendarEvent.data.recurringGroupId) {
      appointmentForm.setValue(
        "recurringGroupId",
        calendarEvent.data.recurringGroupId
      );
    }
    setDuration(calendarEvent.data.duration || 0);
    // Reset RPC appointments for fallback
    setRpcAppointments([]);
    setOpen(true);
  }, []);

  const moveEvent = useCallback(
    async (args: {
      event: object;
      start: Date | string;
      end: Date | string;
      resourceId?: number | string;
    }) => {
      const { event, start, resourceId } = args;
      const calendarEvent = event as CalendarEvent;

      if (
        calendarEvent.type === "not_working" ||
        calendarEvent.type === "timeOff" ||
        calendarEvent.type === "appointmentTimeOff"
      ) {
        return;
      }

      // Check if appointment has a service
      const appointmentServiceId = calendarEvent.data.service?._id;
      if (!appointmentServiceId) {
        // No service to check, proceed with update
        await performMoveEvent(args);
        return;
      }

      // Check if employee changed
      const newEmployeeId =
        resourceId?.toString() || calendarEvent.resourceId.toString();
      const currentEmployeeId = calendarEvent.resourceId.toString();

      // If employee hasn't changed, proceed without confirmation
      if (newEmployeeId === currentEmployeeId) {
        await performMoveEvent(args);
        return;
      }

      // Find the new employee
      const newEmployee = filteredEmployees.find(
        (emp) => emp._id === newEmployeeId
      );

      if (!newEmployee) {
        toast.error("Error", {
          description: "Employee not found",
        });
        return;
      }

      // Check if employee has the service in assignedServices
      const hasService = newEmployee.assignedServices?.some(
        (as: any) => as.serviceId === appointmentServiceId
      );

      // If employee doesn't have the service, show confirm dialog
      if (!hasService) {
        setPendingMoveEvent(args);
        setShowServiceConfirm(true);
        return;
      }

      // Employee has the service, proceed with update
      await performMoveEvent(args);
    },
    [filteredEmployees]
  );

  const performMoveEvent = useCallback(
    async (args: {
      event: object;
      start: Date | string;
      end: Date | string;
      resourceId?: number | string;
    }) => {
      const { event, start, resourceId } = args;
      const calendarEvent = event as CalendarEvent;

      if (isSubmitting) return;
      setIsSubmitting(true);

      const appointmentId = calendarEvent.data._id;
      const startDate = typeof start === "string" ? new Date(start) : start;
      const duration =
        calendarEvent.data.duration ||
        calendarEvent.data.service?.duration ||
        0;
      const endDate = new Date(startDate.getTime() + duration * 60000);
      const newEmployeeId =
        resourceId?.toString() || calendarEvent.resourceId.toString();

      // ⚡ OPTIMISTIC UPDATE: Update local state immediately
      setAppointments((prev) =>
        prev.map((appt) => {
          if (appt._id === appointmentId) {
            return {
              ...appt,
              startTime: startDate.toISOString(),
              endTime: endDate.toISOString(),
              employee: {
                ...appt.employee,
                _id: newEmployeeId,
              },
            };
          }
          return appt;
        })
      );

      try {
        const formData = new FormData();
        formData.append("time", startDate.toISOString());
        formData.append("note", calendarEvent.data.note || "");
        formData.append("type", calendarEvent.data.type || "walk-in");
        formData.append("status", calendarEvent.data.status || "scheduled");

        const result = await updateAppointment(
          appointmentId,
          duration,
          formData,
          {
            _ref: calendarEvent.data.customer?._id,
            _type: "reference",
          },
          {
            _ref: newEmployeeId,
            _type: "reference",
          },
          calendarEvent.data.reminder
        );

        if (result.status === "SUCCESS") {
          toast.success("Success", {
            description: `Appointment updated successfully`,
          });
          // Refresh in background without blocking UI
          startTransition(() => {
            router.refresh();
          });
        } else {
          // Rollback on error
          toast.error("Error", {
            description: result.error,
          });
          // Refresh to get correct data from server
          router.refresh();
        }
      } catch (error) {
        toast.error("Error", {
          description: "An unexpected error occurred",
        });
        // Rollback on error
        router.refresh();
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, router]
  );

  const handleServiceConfirm = useCallback(async () => {
    setShowServiceConfirm(false);
    if (pendingMoveEvent) {
      await performMoveEvent(pendingMoveEvent);
      setPendingMoveEvent(null);
    }
  }, [pendingMoveEvent, performMoveEvent]);

  const handleServiceCancel = useCallback(() => {
    setShowServiceConfirm(false);
    setPendingMoveEvent(null);
    // Refresh to reset the appointment position
    router.refresh();
  }, [router]);

  const handleServiceConfirmDialogChange = useCallback(
    (open: boolean) => {
      if (!open && showServiceConfirm) {
        // If dialog is being closed, cancel the operation
        handleServiceCancel();
      } else {
        setShowServiceConfirm(open);
      }
    },
    [showServiceConfirm, handleServiceCancel]
  );

  const resizeEvent = useCallback(
    async (args: {
      event: object;
      start: Date | string;
      end: Date | string;
    }) => {
      const { event, start, end } = args;
      const calendarEvent = event as CalendarEvent;

      if (
        calendarEvent.type === "not_working" ||
        calendarEvent.type === "appointmentTimeOff"
      ) {
        return;
      }

      if (isSubmitting) return;
      setIsSubmitting(true);

      const startDate = typeof start === "string" ? new Date(start) : start;
      const endDate = typeof end === "string" ? new Date(end) : end;
      const appointmentId = calendarEvent.data._id;
      const duration = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60)
      );

      // ⚡ OPTIMISTIC UPDATE: Update local state immediately
      setAppointments((prev) =>
        prev.map((appt) => {
          if (appt._id === appointmentId) {
            return {
              ...appt,
              startTime: startDate.toISOString(),
              endTime: endDate.toISOString(),
              duration: duration,
            };
          }
          return appt;
        })
      );

      try {
        const formData = new FormData();
        formData.append("time", startDate.toISOString());
        formData.append("note", calendarEvent.data.note || "");
        formData.append("type", calendarEvent.data.type || "walk-in");
        formData.append("status", calendarEvent.data.status || "scheduled");

        const result = await updateAppointment(
          appointmentId,
          duration,
          formData,
          {
            _ref: calendarEvent.data.customer?._id,
            _type: "reference",
          },
          {
            _ref: calendarEvent.resourceId.toString(),
            _type: "reference",
          },
          calendarEvent.data.reminder || []
        );

        if (result.status === "SUCCESS") {
          toast.success("Success", {
            description: `Appointment updated successfully`,
          });
          // Refresh in background without blocking UI
          startTransition(() => {
            router.refresh();
          });
        } else {
          // Rollback on error
          toast.error("Error", {
            description: result.error,
          });
          // Refresh to get correct data from server
          router.refresh();
        }
      } catch (error) {
        toast.error("Error", {
          description: "An unexpected error occurred",
        });
        // Rollback on error
        router.refresh();
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, router]
  );

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      const currentDate = moment.tz(toolbar.date, getIanaTimezone(timezone));
      const newDate = currentDate.subtract(1, "day").startOf("day");
      toolbar.onNavigate("PREV");
      handleDateChange(newDate.toDate());
    };

    const goToNext = () => {
      const currentDate = moment.tz(toolbar.date, getIanaTimezone(timezone));
      const newDate = currentDate.add(1, "day").startOf("day");
      toolbar.onNavigate("NEXT");
      handleDateChange(newDate.toDate());
    };

    const goToToday = () => {
      const today = moment
        .tz(new Date(), getIanaTimezone(timezone))
        .startOf("day");
      toolbar.onNavigate("TODAY");
      handleDateChange(today.toDate());
    };

    return (
      <div
        className={`flex items-center mb-2 gap-2 relative z-20 ${isMobile ? "flex-col sm:flex-row" : ""}`}
      >
        <div
          className={`flex items-center gap-2 ${isMobile ? "w-full justify-between" : ""}`}
        >
          <div className="flex items-center gap-1 sm:gap-2">
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
        </div>
        <span
          className={`font-semibold ${isMobile ? "text-base" : "text-lg"} ${isMobile ? "text-center w-full" : ""}`}
        >
          {toolbar.label}{" "}
          <span
            className={`font-semibold ${isMobile ? "text-base" : "text-lg"}`}
          >
            {toolbar.date.getFullYear()}
          </span>
        </span>
      </div>
    );
  };

  const resizableAccessor = useCallback((event: object) => {
    const calendarEvent = event as CalendarEvent;
    return (
      calendarEvent.type !== "not_working" &&
      calendarEvent.type !== "appointmentTimeOff"
    );
  }, []);

  const draggableAccessor = useCallback((event: object) => {
    const calendarEvent = event as CalendarEvent;
    return (
      calendarEvent.type !== "not_working" &&
      calendarEvent.type !== "appointmentTimeOff"
    );
  }, []);

  const NoEventsOverlay = () => (
    <div className="absolute inset-0 flex items-center justify-center z-5 pointer-events-none">
      <span className="text-2xl font-bold text-gray-400">Business Closed</span>
    </div>
  );

  const moveResource = (dragIndex: number, hoverIndex: number) => {
    setHasUserReordered(true); // Mark that user has manually reordered
    setResources((prevResources = []) => {
      const updated = [...prevResources];
      const [removed] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, removed);
      return updated;
    });
  };

  useEffect(() => {
    // Only update localStorage if user has manually reordered resources
    if (hasUserReordered) {
      localStorage.setItem(
        "resourceOrder",
        JSON.stringify(resources.map((r) => r.resourceId))
      );
    }
  }, [resources, hasUserReordered]);

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
      <div
        ref={ref}
        style={{ opacity: isDragging ? 0.5 : 1, cursor: "move" }}
        className={`flex items-center ${isMobile ? "text-xs px-1" : "px-2"}`}
      >
        <GripVertical
          size={isMobile ? 12 : 16}
          style={{ marginRight: isMobile ? 2 : 4 }}
        />
        <span className={`${isMobile ? "text-xs truncate" : "text-sm"}`}>
          {resource.resourceTitle}
        </span>
      </div>
    );
  };

  return (
    <div className="relative h-full w-full">
      {isMobile && (
        <style jsx>{`
          .mobile-calendar .rbc-time-header {
            font-size: 12px;
          }
          .mobile-calendar .rbc-header {
            padding: 4px 2px;
            font-size: 11px;
            font-weight: 600;
          }
          .mobile-calendar .rbc-time-slot {
            font-size: 10px;
          }
          .mobile-calendar .rbc-event {
            font-size: 10px;
            padding: 1px;
          }
          .mobile-calendar .rbc-time-content {
            font-size: 10px;
          }
          .mobile-calendar .rbc-timeslot-group {
            min-height: 30px;
          }
        `}</style>
      )}
      <DndProvider backend={HTML5Backend}>
        <div
          className={`h-full w-full ${isMobile ? "mobile-calendar" : ""} ${processing || isLoading ? "loading" : null}`}
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
              .set({
                hour: moment(minTime, "h:mm A").hour(),
                minute: moment(minTime, "h:mm A").minute(),
                second: 0,
                millisecond: 0,
              })
              .toDate()}
            max={moment
              .tz(getIanaTimezone(timezone))
              .set({
                hour: moment(maxTime, "h:mm A").hour(),
                minute: moment(maxTime, "h:mm A").minute(),
                second: 0,
                millisecond: 0,
              })
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
                  // Determine background color based on appointment type
                  const bgColor =
                    calendarEvent.data.type === "request"
                      ? "bg-pink-400"
                      : "bg-cyan-600";

                  return (
                    <div
                      className={`${bgColor} h-full rounded border border-gray-100 cursor-pointer`}
                    >
                      <div className="flex flex-col justify-center items-center p-1 gap-0.5">
                        <span
                          className={`${isMobile ? "text-xs" : "text-sm"} text-black font-medium truncate w-full text-center`}
                        >
                          {calendarEvent.data?.customer
                            ? `${calendarEvent.data.customer.firstName} ${calendarEvent.data.customer.lastName}`
                            : "No Customer"}
                        </span>
                        <span
                          className={`${isMobile ? "text-[10px]" : "text-[14px]"} text-white truncate w-full text-center`}
                        >
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
                        <span
                          className={`${isMobile ? "text-xs" : "text-sm"} text-white font-medium truncate w-full text-center`}
                        >
                          {calendarEvent.data?.customer
                            ? `${calendarEvent.data.customer.firstName} ${calendarEvent.data.customer.lastName}`
                            : "No Customer"}
                        </span>
                        <span
                          className={`${isMobile ? "text-[10px]" : "text-[14px]"} text-white truncate w-full text-center`}
                        >
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
                        <span
                          className={`${isMobile ? "text-xs" : "text-sm"} text-white font-medium truncate w-full text-center`}
                        >
                          {calendarEvent.data?.customer
                            ? `${calendarEvent.data.customer.firstName} ${calendarEvent.data.customer.lastName}`
                            : "No Customer"}
                        </span>
                        <span
                          className={`${isMobile ? "text-[10px]" : "text-[14px]"} text-white truncate w-full text-center`}
                        >
                          {calendarEvent.title}
                        </span>
                      </div>
                    </div>
                  );
                } else if (calendarEvent.type === "not_working") {
                  return (
                    <div className="bg-gray-500 h-full rounded border border-gray-100 cursor-default resize-none opacity-70">
                      <div className="flex flex-col justify-center items-center p-1 gap-0.5">
                        <span
                          className={`${isMobile ? "text-[10px]" : "text-[14px]"} text-white truncate w-full text-center`}
                        >
                          {calendarEvent.title}
                        </span>
                      </div>
                    </div>
                  );
                } else if (calendarEvent.type === "appointmentTimeOff") {
                  return (
                    <div className="bg-blue-400 h-full rounded border border-gray-100 cursor-default resize-none opacity-70">
                      <div className="flex flex-col justify-center items-center p-1 gap-0.5">
                        <span
                          className={`${isMobile ? "text-[10px]" : "text-[14px]"} text-black font-medium truncate w-full text-center`}
                        >
                          {calendarEvent.title}
                        </span>
                        {(calendarEvent.data as any)?.reason && (
                          <span
                            className={`${isMobile ? "text-[8px]" : "text-[12px]"} text-black opacity-80 truncate w-full text-center`}
                          >
                            {(calendarEvent.data as any).reason}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
              },
              resourceHeader: (props: any) => {
                const index = resources.findIndex(
                  (r) => r.resourceId === props.resource.resourceId
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
          className={`${isMobile ? "w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh]" : "sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl"} max-h-[95vh] h-[95vh] flex flex-col items-start justify-start`}
          aria-describedby="form-dialog"
        >
          <DialogHeader>
            <DialogTitle>{generateDialogTitle()}</DialogTitle>
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
            onTimeOffCreated={() => {
              fetchAppointmentTimeOffs();
              setOpen(false);
            }}
            setIsCancellingStanding={setIsCancellingStanding}
            onCancelStandingSuccess={handleCancelStandingSuccess}
            setIsSubmitting={setIsSubmitting}
            initialAppointments={
              rpcAppointments.length > 0 ? rpcAppointments : undefined
            }
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
      <ConflictDialog
        open={showConflictDialog}
        onOpenChange={setShowConflictDialog}
        conflicts={conflicts}
        timezone={timezone}
        onConfirm={handleConflictConfirm}
        onCancel={handleConflictCancel}
      />
      <ConfirmDialog
        open={showServiceConfirm}
        onOpenChange={handleServiceConfirmDialogChange}
        title="Employee doesn't have this service"
        description={
          pendingMoveEvent
            ? (() => {
                const event = pendingMoveEvent.event as CalendarEvent;
                const newEmployeeId =
                  pendingMoveEvent.resourceId?.toString() ||
                  event.resourceId.toString();
                const newEmployee = filteredEmployees.find(
                  (emp) => emp._id === newEmployeeId
                );
                const serviceName = event.data.service?.name || "this service";
                const employeeName = newEmployee
                  ? getProfileName(newEmployee)
                  : "this employee";
                return `The employee "${employeeName}" doesn't have "${serviceName}" in their assigned services. Do you want to continue anyway?`;
              })()
            : "This employee doesn't have the required service. Do you want to continue?"
        }
        onConfirm={handleServiceConfirm}
        onCancel={handleServiceCancel}
        confirmText="Continue"
        disabled={isSubmitting}
      />

      {/* Time Off Dialog */}
      <Dialog open={showTimeOffDialog} onOpenChange={setShowTimeOffDialog}>
        <DialogContent
          className={`${isMobile ? "w-[95vw] max-w-[95vw]" : "sm:max-w-md"}`}
        >
          <DialogHeader>
            <DialogTitle>Time Off Details</DialogTitle>
            <DialogDescription>
              View and manage time off details
            </DialogDescription>
          </DialogHeader>

          {selectedTimeOff && (
            <div className="space-y-4">
              {!editingTimeOff ? (
                // View Mode
                <>
                  <div
                    className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-4`}
                  >
                    <div>
                      <label className="text-sm font-medium">Employee</label>
                      <p className="text-sm text-gray-600">
                        {selectedTimeOff.employee?.firstName}{" "}
                        {selectedTimeOff.employee?.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Start Time</label>
                      <p className="text-sm text-gray-600">
                        {moment
                          .tz(
                            selectedTimeOff.startTime,
                            getIanaTimezone(timezone)
                          )
                          .format("MMM DD, YYYY h:mm A")}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Duration</label>
                      <p className="text-sm text-gray-600">
                        {formatDuration(selectedTimeOff.duration)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Recurring</label>
                      <p className="text-sm text-gray-600">
                        {selectedTimeOff.isRecurring ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-4`}
                  >
                    <div>
                      <label className="text-sm font-medium">Created At</label>
                      <p className="text-sm text-gray-600">
                        {selectedTimeOff._createdAt
                          ? moment
                              .tz(
                                selectedTimeOff._createdAt,
                                getIanaTimezone(timezone)
                              )
                              .format("MMM DD, YYYY h:mm A")
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Last Updated
                      </label>
                      <p className="text-sm text-gray-600">
                        {selectedTimeOff._updatedAt
                          ? moment
                              .tz(
                                selectedTimeOff._updatedAt,
                                getIanaTimezone(timezone)
                              )
                              .format("MMM DD, YYYY h:mm A")
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {selectedTimeOff.reason && (
                    <div>
                      <label className="text-sm font-medium">Reason</label>
                      <p className="text-sm text-gray-600">
                        {selectedTimeOff.reason}
                      </p>
                    </div>
                  )}

                  {selectedTimeOff.isRecurring &&
                    selectedTimeOff.recurringDuration &&
                    selectedTimeOff.recurringFrequency && (
                      <div
                        className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-4`}
                      >
                        <div>
                          <label className="text-sm font-medium">
                            Recurring Duration
                          </label>
                          <p className="text-sm text-gray-600">
                            {selectedTimeOff.recurringDuration.value}{" "}
                            {selectedTimeOff.recurringDuration.unit}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Recurring Frequency
                          </label>
                          <p className="text-sm text-gray-600">
                            Every {selectedTimeOff.recurringFrequency.value}{" "}
                            {selectedTimeOff.recurringFrequency.unit}
                          </p>
                        </div>
                      </div>
                    )}

                  <div
                    className={`flex ${isMobile ? "flex-col" : "justify-end"} gap-2 pt-4`}
                  >
                    <Button
                      variant="outline"
                      onClick={() => setShowTimeOffDialog(false)}
                      disabled={isSubmitting}
                    >
                      Close
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleEditTimeOff}
                      disabled={isSubmitting}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleTimeOffCancel}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Cancelling..." : "Cancel Time Off"}
                    </Button>
                  </div>
                </>
              ) : (
                // Edit Mode
                <>
                  <div
                    className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-4`}
                  >
                    <div>
                      <label className="text-sm font-medium">Employee</label>
                      <p className="text-sm text-gray-600">
                        {editingTimeOff.employeeInfo?.firstName}{" "}
                        {editingTimeOff.employeeInfo?.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Start Time</label>
                      <p className="text-sm text-gray-600">
                        {moment
                          .tz(
                            editingTimeOff.startTime,
                            getIanaTimezone(timezone)
                          )
                          .format("MMM DD, YYYY h:mm A")}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-4`}
                  >
                    <div>
                      <label className="text-sm font-medium">Created At</label>
                      <p className="text-sm text-gray-600">
                        {selectedTimeOff._createdAt
                          ? moment
                              .tz(
                                selectedTimeOff._createdAt,
                                getIanaTimezone(timezone)
                              )
                              .format("MMM DD, YYYY h:mm A")
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Last Updated
                      </label>
                      <p className="text-sm text-gray-600">
                        {selectedTimeOff._updatedAt
                          ? moment
                              .tz(
                                selectedTimeOff._updatedAt,
                                getIanaTimezone(timezone)
                              )
                              .format("MMM DD, YYYY h:mm A")
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Select
                      value={editingTimeOff.duration?.toString() || ""}
                      onValueChange={(value) => {
                        if (value === "to_close") {
                          setEditingTimeOff((prev: any) => ({
                            ...prev,
                            duration: "to_close",
                          }));
                        } else {
                          setEditingTimeOff((prev: any) => ({
                            ...prev,
                            duration: Number(value),
                          }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 32 }, (_, i) => (i + 1) * 15).map(
                          (min) => (
                            <SelectItem key={min} value={min.toString()}>
                              {formatDuration(min)}
                            </SelectItem>
                          )
                        )}
                        <SelectItem value="to_close">To close</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editingTimeOff.reason && (
                    <div>
                      <label className="text-sm font-medium">Reason</label>
                      <p className="text-sm text-gray-600">
                        {editingTimeOff.reason}
                      </p>
                    </div>
                  )}

                  {editingTimeOff.isRecurring &&
                    editingTimeOff.recurringDuration &&
                    editingTimeOff.recurringFrequency && (
                      <div
                        className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-4`}
                      >
                        <div>
                          <label className="text-sm font-medium">
                            Recurring Duration
                          </label>
                          <p className="text-sm text-gray-600">
                            {editingTimeOff.recurringDuration.value}{" "}
                            {editingTimeOff.recurringDuration.unit}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Recurring Frequency
                          </label>
                          <p className="text-sm text-gray-600">
                            Every {editingTimeOff.recurringFrequency.value}{" "}
                            {editingTimeOff.recurringFrequency.unit}
                          </p>
                        </div>
                      </div>
                    )}

                  <div
                    className={`flex ${isMobile ? "flex-col" : "justify-end"} gap-2 pt-4`}
                  >
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleTimeOffUpdate}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Updating..." : "Update Time Off"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentScheduleTimezone;
