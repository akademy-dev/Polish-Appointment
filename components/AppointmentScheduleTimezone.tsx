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
import { APPOINTMENT_TIME_OFF_QUERY } from "@/sanity/lib/queries";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { client } from "@/sanity/lib/client";
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
import { getIanaTimezone } from "@/lib/utils";
import { deleteTimeOff, updateTimeOff } from "@/actions/time-off";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

const generateAppointmentTimeOffEvents = (
  appointmentTimeOffs: any[],
  date: Date,
  timezone: string,
  maxTime: string,
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
      const startDate = moment.tz(
        timeOff._createdAt,
        getIanaTimezone(timezone),
      );
      const endDate = startDate
        .clone()
        .add(timeOff.recurringDuration.value, timeOff.recurringDuration.unit);

      // Check if current date is within the recurring period
      if (momentDate.isBetween(startDate, endDate, "day", "[]")) {
        // Check frequency
        const daysDiff = momentDate.diff(startDate, "days");
        const frequencyValue = timeOff.recurringFrequency.value;
        const frequencyUnit = timeOff.recurringFrequency.unit;

        if (frequencyUnit === "days") {
          isMatchingDate = daysDiff % frequencyValue === 0;
        } else if (frequencyUnit === "weeks") {
          const weeksDiff = momentDate.diff(startDate, "weeks");
          isMatchingDate = weeksDiff % frequencyValue === 0;
        }
      }
    } else {
      // Non-recurring time off - check if it's for today
      const timeOffDate = moment.tz(
        timeOff.startTime,
        getIanaTimezone(timezone),
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
  const [appointmentTimeOffs, setAppointmentTimeOffs] = useState<any[]>(
    initialAppointmentTimeOffs,
  );
  const [showTimeOffDialog, setShowTimeOffDialog] = useState(false);
  const [selectedTimeOff, setSelectedTimeOff] = useState<any>(null);
  const [editingTimeOff, setEditingTimeOff] = useState<any>(null);
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
      minTime,
      maxTime,
      dateAtStartOfDay,
      timezone,
    );
  }, [initialEmployees, currentDate, timezone]);

  // Generate appointment time off events
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

    return generateAppointmentTimeOffEvents(
      appointmentTimeOffs,
      dateAtStartOfDay,
      timezone,
      maxTime || "6:00 PM",
    );
  }, [appointmentTimeOffs, currentDate, timezone, maxTime]);

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

  // Fetch appointment time off data
  const fetchAppointmentTimeOffs = React.useCallback(async () => {
    try {
      const timeOffs = await client.fetch(APPOINTMENT_TIME_OFF_QUERY);
      setAppointmentTimeOffs(timeOffs);
    } catch (error) {
      console.error("Error fetching appointment time offs:", error);
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
      (emp) => emp._id === watchedEmployeeRef,
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
        pendingAppointmentData.recurringFrequency,
      );

      if (result.status === "SUCCESS") {
        setOpen(false);
        appointmentForm.reset();
        toast.success("Success", {
          description:
            "Recurring appointments created successfully (with conflicts)",
        });
        router.refresh();
        fetchAppointmentTimeOffs(); // Refresh time off data
      } else {
        toast.error("Error", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error(error);
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
      console.error("Error cancelling time off:", error);
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
      console.error("Error updating time off:", error);
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

        // For create mode, check for conflicts first if it's a recurring appointment
        if (formValues.isRecurring) {
          // Calculate end time for the first appointment
          const startTime = new Date(formValues.time);
          const totalDuration = formValues.services.reduce(
            (total, service) => total + service.duration * service.quantity,
            0,
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
              : undefined,
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
            : undefined,
        );

        if (result.status === "SUCCESS") {
          setOpen(false);
          appointmentForm.reset();
          toast.success("Success", {
            description: `Appointment created successfully`,
          });
          router.refresh(); // Trigger re-fetch
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
              0,
            );
            const endTime = new Date(
              startTime.getTime() + totalDuration * 60000,
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
                : undefined,
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
              : undefined,
          );

          if (result.status === "SUCCESS") {
            setOpen(false);
            appointmentForm.reset();
            toast.success("Success", {
              description: "New Appointment created successfully",
            });
            router.refresh(); // Trigger re-fetch
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

    if (calendarEvent.type === "not_working") {
      return;
    }

    if (calendarEvent.type === "appointmentTimeOff") {
      setSelectedTimeOff(calendarEvent.data);
      setShowTimeOffDialog(true);
      return;
    }

    console.log("Calendar Event:", calendarEvent.data);
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
    appointmentForm.setValue("reminder", calendarEvent.data.reminder);
    appointmentForm.setValue("type", calendarEvent.data.type || "walk-in");
    const newServices = calendarEvent.data.service
      ? [
          {
            _ref: calendarEvent.data.service._id,
            _type: "reference",
            duration: calendarEvent.data.service.duration,
            quantity: 1,
          },
        ]
      : [];
    appointmentForm.setValue("services", newServices);
    appointmentForm.setValue(
      "status",
      calendarEvent.data.status || "scheduled",
    );
    // Set recurringGroupId for Cancel Standing functionality
    if (calendarEvent.data.recurringGroupId) {
      appointmentForm.setValue(
        "recurringGroupId",
        calendarEvent.data.recurringGroupId,
      );
    }
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
        calendarEvent.type === "timeOff" ||
        calendarEvent.type === "appointmentTimeOff"
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

      const newServices = calendarEvent.data.service
        ? [
            {
              _ref: calendarEvent.data.service._id,
              _type: "reference",
              duration: calendarEvent.data.service.duration,
              quantity: 1,
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
        calendarEvent.type === "appointmentTimeOff"
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
      const newServices = calendarEvent.data.service
        ? [
            {
              _ref: calendarEvent.data.service._id,
              _type: "reference",
              duration: calendarEvent.data.service.duration,
              quantity: 1,
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
          className={`h-full w-full  ${processing || isLoading ? "loading" : null}`}
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
                        <span className="text-md text-black ≈">
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
                } else if (calendarEvent.type === "appointmentTimeOff") {
                  return (
                    <div className="bg-blue-400 h-full rounded border border-gray-100 cursor-default resize-none opacity-70">
                      <div className="flex flex-col justify-center items-center p-1 gap-0.5">
                        <span className="text-[14px] text-black font-medium">
                          {calendarEvent.title}
                        </span>
                        {(calendarEvent.data as any)?.reason && (
                          <span className="text-[12px] text-black opacity-80">
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
          className={`sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl max-h-[95vh] h-[95vh] flex flex-col items-start justify-start`}
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

      {/* Time Off Dialog */}
      <Dialog open={showTimeOffDialog} onOpenChange={setShowTimeOffDialog}>
        <DialogContent className="sm:max-w-md">
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
                                     <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm font-medium">Employee</label>
                       <p className="text-sm text-gray-600">
                         {selectedTimeOff.employee?.firstName} {selectedTimeOff.employee?.lastName}
                       </p>
                     </div>
                     <div>
                       <label className="text-sm font-medium">Start Time</label>
                       <p className="text-sm text-gray-600">
                         {moment.tz(selectedTimeOff.startTime, getIanaTimezone(timezone))
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

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm font-medium">Created At</label>
                       <p className="text-sm text-gray-600">
                         {selectedTimeOff._createdAt 
                           ? moment.tz(selectedTimeOff._createdAt, getIanaTimezone(timezone))
                               .format("MMM DD, YYYY h:mm A")
                           : "N/A"}
                       </p>
                     </div>
                     <div>
                       <label className="text-sm font-medium">Last Updated</label>
                       <p className="text-sm text-gray-600">
                         {selectedTimeOff._updatedAt 
                           ? moment.tz(selectedTimeOff._updatedAt, getIanaTimezone(timezone))
                               .format("MMM DD, YYYY h:mm A")
                           : "N/A"}
                       </p>
                     </div>
                   </div>
                  
                  {selectedTimeOff.reason && (
                    <div>
                      <label className="text-sm font-medium">Reason</label>
                      <p className="text-sm text-gray-600">{selectedTimeOff.reason}</p>
                    </div>
                  )}
                  
                  {selectedTimeOff.isRecurring && selectedTimeOff.recurringDuration && selectedTimeOff.recurringFrequency && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Recurring Duration</label>
                        <p className="text-sm text-gray-600">
                          {selectedTimeOff.recurringDuration.value} {selectedTimeOff.recurringDuration.unit}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Recurring Frequency</label>
                        <p className="text-sm text-gray-600">
                          Every {selectedTimeOff.recurringFrequency.value} {selectedTimeOff.recurringFrequency.unit}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2 pt-4">
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
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm font-medium">Employee</label>
                       <p className="text-sm text-gray-600">
                         {editingTimeOff.employeeInfo?.firstName} {editingTimeOff.employeeInfo?.lastName}
                       </p>
                     </div>
                     <div>
                       <label className="text-sm font-medium">Start Time</label>
                       <p className="text-sm text-gray-600">
                         {moment.tz(editingTimeOff.startTime, getIanaTimezone(timezone))
                           .format("MMM DD, YYYY h:mm A")}
                       </p>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm font-medium">Created At</label>
                       <p className="text-sm text-gray-600">
                         {selectedTimeOff._createdAt 
                           ? moment.tz(selectedTimeOff._createdAt, getIanaTimezone(timezone))
                               .format("MMM DD, YYYY h:mm A")
                           : "N/A"}
                       </p>
                     </div>
                     <div>
                       <label className="text-sm font-medium">Last Updated</label>
                       <p className="text-sm text-gray-600">
                         {selectedTimeOff._updatedAt 
                           ? moment.tz(selectedTimeOff._updatedAt, getIanaTimezone(timezone))
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
                          setEditingTimeOff((prev: any) => ({ ...prev, duration: "to_close" }));
                        } else {
                          setEditingTimeOff((prev: any) => ({ ...prev, duration: Number(value) }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 32 }, (_, i) => (i + 1) * 15).map((min) => (
                          <SelectItem key={min} value={min.toString()}>
                            {formatDuration(min)}
                          </SelectItem>
                        ))}
                        <SelectItem value="to_close">To close</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editingTimeOff.reason && (
                    <div>
                      <label className="text-sm font-medium">Reason</label>
                      <p className="text-sm text-gray-600">{editingTimeOff.reason}</p>
                    </div>
                  )}
                  
                  {editingTimeOff.isRecurring && editingTimeOff.recurringDuration && editingTimeOff.recurringFrequency && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Recurring Duration</label>
                        <p className="text-sm text-gray-600">
                          {editingTimeOff.recurringDuration.value} {editingTimeOff.recurringDuration.unit}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Recurring Frequency</label>
                        <p className="text-sm text-gray-600">
                          Every {editingTimeOff.recurringFrequency.value} {editingTimeOff.recurringFrequency.unit}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2 pt-4">
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
