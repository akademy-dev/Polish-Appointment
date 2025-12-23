"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import CustomerForm from "./forms/CustomerForm";
import EmployeeForm from "./forms/EmployeeForm";
import ServiceForm from "./forms/ServiceForm";
import DataTable from "./DataTable";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  appointmentFormSchema,
  customerFormSchema,
  employeeFormSchema,
  serviceFormSchema,
} from "@/lib/validation";
import { useRef, useState, ReactNode, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/hooks/use-settings";
import {
  createEmployee,
  createCustomer,
  updateEmployee,
  updateCustomer,
  updateService,
  createService,
  createAppointment,
  deleteEmployee,
  deleteCustomer,
  deleteService,
  checkRecurringConflicts,
} from "@/lib/actions";
import {
  TimeOffSchedule,
  WorkingTime,
  Profile,
  getProfileName,
  isEmployee,
  Customer,
  getProfileId,
} from "@/models/profile";
import { getServiceId, Service } from "@/models/service";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { ConflictDialog } from "@/components/ConflictDialog";
import { ColumnDef } from "@tanstack/react-table";
import ProfileTableLoading from "./ProfileTableLoading";
import { ArrowUpDown, CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { formatMinuteDuration, parseOffset, cn } from "@/lib/utils";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { AssignedService } from "@/models/assignedService";
import { Appointment } from "@/models/appointment";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type FormMode = "create" | "edit" | "history" | "delete";
type FormType = "employees" | "customers" | "services" | "schedule";
type EmployeeHistoryRow = {
  startTime: string;
  customer: {
    _id?: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone?: string;
  };
  service: { name: string };
  duration: number;
};
type CustomerHistoryRow = {
  startTime: string;
  employee: { firstName: string; lastName: string; fullName: string };
  service: { name: string };
  duration: number;
};

// Add interface for pending appointment data
interface PendingAppointmentData {
  formData: FormData;
  customer: {
    _ref: string;
    _type: string;
  };
  employee: {
    _ref: string;
    _type: string;
  };
  services: any[];
  reminder: any[];
  isRecurring: boolean;
  recurringDuration?: {
    value: number;
    unit: "days" | "weeks" | "months";
  };
  recurringFrequency?: {
    value: number;
    unit: "days" | "weeks";
  };
}

interface FormButtonProps {
  children: ReactNode;
  mode: FormMode;
  type: FormType;
  profile?: Profile; // For edit mode
  service?: Service;
  onSuccess?: () => void;
  categories?: { _id: string; name: string }[]; // For services type
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "destructive"
    | "secondary"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const FormButton = ({
  children,
  mode,
  type,
  profile,
  service,
  onSuccess,
  categories,
  variant = "default",
  size = "default",
  className = "",
}: FormButtonProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();
  const formRef = useRef<HTMLFormElement>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [employeeHistory, setEmployeeHistory] = useState<EmployeeHistoryRow[]>(
    []
  );
  const [customerHistory, setCustomerHistory] = useState<CustomerHistoryRow[]>(
    []
  );
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPageSize, setHistoryPageSize] = useState(20);
  const [timezone, setTimezone] = useState<string>("");
  const [historyFilterType, setHistoryFilterType] = useState<
    "customer" | "date" | "both"
  >("both");
  const [historyDateRange, setHistoryDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] =
    useState<string>("");
  const [selectedHistoryEmployee, setSelectedHistoryEmployee] =
    useState<string>("");
  const [historyCustomerOpen, setHistoryCustomerOpen] = useState(false);
  const [historyCustomerQuery, setHistoryCustomerQuery] = useState("");
  const [historyCustomerResults, setHistoryCustomerResults] = useState<
    { id: string; fullName: string; phone?: string }[]
  >([]);
  const [historyCustomerSearching, setHistoryCustomerSearching] =
    useState(false);
  const [selectedHistoryCustomerInfo, setSelectedHistoryCustomerInfo] =
    useState<{ id: string; fullName: string; phone?: string } | null>(null);
  const historyCustomerSearchTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [pendingAppointmentData, setPendingAppointmentData] =
    useState<PendingAppointmentData | null>(null);

  const normalizeNumberArray = (value: unknown): number[] => {
    if (!Array.isArray(value)) return [];
    return (value as unknown[])
      .map((v) => (typeof v === "number" ? v : Number(v)))
      .filter((n) => Number.isFinite(n));
  };

  // Search customers for history filter (same UX as Create Appointment)
  useEffect(() => {
    if (historyCustomerSearchTimeoutRef.current) {
      clearTimeout(historyCustomerSearchTimeoutRef.current);
    }

    const term = historyCustomerQuery.trim();
    if (!term) {
      setHistoryCustomerResults([]);
      setHistoryCustomerSearching(false);
      return;
    }

    setHistoryCustomerSearching(true);
    historyCustomerSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/customers?search=${encodeURIComponent(term)}`
        ).then((r) => r.json());

        setHistoryCustomerResults(
          (res || []).map((customer: any) => ({
            id: String(customer.id),
            fullName:
              `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
            phone: customer.phone ? String(customer.phone) : undefined,
          }))
        );
      } catch {
        setHistoryCustomerResults([]);
      } finally {
        setHistoryCustomerSearching(false);
      }
    }, 300);

    return () => {
      if (historyCustomerSearchTimeoutRef.current) {
        clearTimeout(historyCustomerSearchTimeoutRef.current);
      }
    };
  }, [historyCustomerQuery]);

  const customerHistoryEmployeeOptions = useMemo(() => {
    const names = new Set<string>();
    (customerHistory || []).forEach((row: any) => {
      const name = row?.employee?.fullName;
      if (name) names.add(String(name));
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [customerHistory]);

  const filteredEmployeeHistory = useMemo(() => {
    // Employee history is fetched already filtered via RPC (employee/customer/date range).
    return (employeeHistory || []) as any[];
  }, [employeeHistory]);

  const filteredCustomerHistory = useMemo(() => {
    let rows = (customerHistory || []) as any[];

    // For customer history, "By customer" doesn't make sense (fixed customer),
    // so we map the person filter to employee instead.
    if (historyFilterType === "customer" || historyFilterType === "both") {
      if (selectedHistoryEmployee) {
        rows = rows.filter(
          (r) => r?.employee?.fullName === selectedHistoryEmployee
        );
      }
    }

    if (historyFilterType === "date" || historyFilterType === "both") {
      const from = historyDateRange.from;
      const to = historyDateRange.to || historyDateRange.from;
      if (from && to) {
        const fromStart = new Date(from);
        fromStart.setHours(0, 0, 0, 0);
        const toEnd = new Date(to);
        toEnd.setHours(23, 59, 59, 999);

        rows = rows.filter((r) => {
          const dt = new Date(r?.startTime);
          if (isNaN(dt.getTime())) return false;
          return dt >= fromStart && dt <= toEnd;
        });
      }
    }

    return rows;
  }, [
    customerHistory,
    historyFilterType,
    historyDateRange,
    selectedHistoryEmployee,
  ]);

  const fetchEmployeeHistory = async () => {
    if (profile) {
      setLoadingHistory(true);
      try {
        const params = new URLSearchParams();

        // Employee filter (required for employee history)
        const employeeId = getProfileId(profile);
        if (employeeId) {
          params.set("employeeId", employeeId);
        }

        // Customer filter (optional)
        if (
          (historyFilterType === "customer" || historyFilterType === "both") &&
          selectedHistoryCustomer
        ) {
          params.set("customerId", selectedHistoryCustomer);
        }

        // Date range filter (optional)
        if (historyFilterType === "date" || historyFilterType === "both") {
          const from = historyDateRange.from;
          const to = historyDateRange.to || historyDateRange.from;
          if (from && to) {
            params.set("startDate", from.toISOString());
            params.set("endDate", to.toISOString());
          }
        }

        // NOTE: API supports pagination; for now fetch a reasonably large page.
        params.set("limit", String(Math.max(100, historyPageSize)));
        params.set("offset", "0");

        const response = await fetch(`/api/appointment-history?${params}`);
        const payload = await response.json();

        const rows = (payload?.data || []) as any[];
        const transformedResult = rows.map((row: any, idx: number) => ({
          _id: `${row.Date ?? idx}`,
          _createdAt: row.Date,
          startTime: row.Date,
          duration: row.Duration ?? 0,
          customer: {
            _id: selectedHistoryCustomer || undefined,
            firstName: "",
            lastName: "",
            fullName: row.Customer ?? "",
            phone: undefined,
          },
          service: {
            name: row.Service ?? "",
          },
        }));

        setEmployeeHistory(transformedResult);
      } catch {
        setEmployeeHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    }
  };

  const fetchCustomerHistory = async () => {
    if (profile) {
      setLoadingHistory(true);
      try {
        // Fetch all appointments for this customer
        const customerId = getProfileId(profile);
        const response = await fetch(
          `/api/appointments?customerId=${customerId}`
        );
        const result = await response.json();
        // Transform to match expected format and filter out cancelled
        const filteredResult = (result || [])
          .filter((appointment: any) => appointment.status !== "cancelled")
          .map((apt: any) => ({
            _id: apt.id,
            _createdAt: apt.created_at,
            startTime: apt.start_time || apt.startTime,
            endTime: apt.end_time || apt.endTime,
            duration: apt.service?.duration || 0,
            customer: apt.customer
              ? {
                  _id: apt.customer.id,
                  firstName: apt.customer.firstName,
                  lastName: apt.customer.lastName,
                  fullName: apt.customer.fullName,
                }
              : undefined,
            employee: apt.employee
              ? {
                  _id: apt.employee.id,
                  firstName: apt.employee.firstName,
                  lastName: apt.employee.lastName,
                  fullName: apt.employee.fullName,
                }
              : undefined,
            service: apt.service
              ? {
                  _id: apt.service.id,
                  name: apt.service.name,
                  duration: apt.service.duration,
                }
              : undefined,
            reminder: apt.reminder || [],
            type: apt.type,
            status: apt.status,
            note: apt.note,
            recurringGroupId: apt.recurring_group_id,
          }));
        setCustomerHistory(filteredResult);
      } catch {
        setCustomerHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    }
  };

  // Refetch employee history when filters change (RPC-backed)
  useEffect(() => {
    if (!open) return;
    if (mode !== "history") return;
    if (type !== "employees") return;
    if (!profile) return;
    fetchEmployeeHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    mode,
    type,
    profile,
    historyFilterType,
    historyDateRange,
    selectedHistoryCustomer,
    historyPageSize,
  ]);

  // Use settings from context if available, otherwise fetch once
  const { settings: contextSettings } = useSettings();

  useEffect(() => {
    // Use settings from context if available
    if (contextSettings?.timezone) {
      setTimezone(contextSettings.timezone);
      return;
    }

    // Fallback: fetch only if context doesn't have settings yet
    if (timezone) return;

    let isMounted = true;

    const fetchTimezone = async () => {
      try {
        const response = await fetch("/api/settings");
        if (!isMounted) return;

        const settings = await response.json();
        if (isMounted) {
          if (settings && settings.timezone) {
            setTimezone(parseOffset(settings.timezone));
          } else {
            setTimezone(parseOffset("UTC-7:00"));
          }
        }
      } catch (error) {
        if (!isMounted) return;
        setTimezone(parseOffset("UTC-7:00"));
      }
    };

    fetchTimezone();

    return () => {
      isMounted = false;
    };
  }, [contextSettings?.timezone, timezone]);

  // Aggressively fix aria-hidden conflicts using MutationObserver
  useEffect(() => {
    if (open) {
      let observer: MutationObserver | null = null;

      // Function to remove aria-hidden from main and body
      const removeAriaHidden = () => {
        const mainElement = document.querySelector("main");
        const bodyElement = document.body;

        if (mainElement?.hasAttribute("aria-hidden")) {
          mainElement.removeAttribute("aria-hidden");
        }
        if (mainElement?.hasAttribute("data-aria-hidden")) {
          mainElement.removeAttribute("data-aria-hidden");
        }
        if (bodyElement?.hasAttribute("aria-hidden")) {
          bodyElement.removeAttribute("aria-hidden");
        }
      };

      // Immediately remove aria-hidden
      removeAriaHidden();

      // Set up observer to watch for aria-hidden being re-added
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "attributes") {
            const target = mutation.target as Element;
            if (
              (target.tagName === "MAIN" || target.tagName === "BODY") &&
              (mutation.attributeName === "aria-hidden" ||
                mutation.attributeName === "data-aria-hidden")
            ) {
              // Remove aria-hidden immediately if it gets re-added
              if (target.hasAttribute("aria-hidden")) {
                target.removeAttribute("aria-hidden");
              }
              if (target.hasAttribute("data-aria-hidden")) {
                target.removeAttribute("data-aria-hidden");
              }
            }
          }
        });
      });

      // Start observing
      const mainElement = document.querySelector("main");
      const bodyElement = document.body;

      if (mainElement) {
        observer.observe(mainElement, {
          attributes: true,
          attributeFilter: ["aria-hidden", "data-aria-hidden"],
        });
      }
      if (bodyElement) {
        observer.observe(bodyElement, {
          attributes: true,
          attributeFilter: ["aria-hidden", "data-aria-hidden"],
        });
      }

      // Also run a periodic check every 100ms
      const intervalId = setInterval(removeAriaHidden, 100);

      // Cleanup
      return () => {
        if (observer) {
          observer.disconnect();
        }
        clearInterval(intervalId);
      };
    }
  }, [open]);

  // Form instances
  const employeeForm = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      position: "backRoom",
      note: "",
      workingTimes: [],
      timeOffSchedules: [],
      assignedServices: [],
    },
  });

  const customerForm = useForm<z.infer<typeof customerFormSchema>>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      note: "",
    },
  });

  const serviceForm = useForm<z.infer<typeof serviceFormSchema>>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      duration: 15,
      category: {
        _ref: "",
        _type: "reference",
      },
    },
  });

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
      time: new Date().toISOString(),
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
    },
  });

  // Get appropriate form instance based on type
  const getFormInstance = () => {
    switch (type) {
      case "employees":
        return employeeForm;
      case "customers":
        return customerForm;
      case "services":
        return serviceForm;
      case "schedule":
        return appointmentForm;
      default:
        return employeeForm;
    }
  };

  // Get title based on mode and type
  const getTitle = () => {
    if (mode === "history" && profile) {
      return `${getProfileName(profile)}'s History`;
    }
    if (mode === "edit" && profile) {
      return `Edit ${getProfileName(profile)}`;
    }
    if (mode === "edit" && service) {
      return `Edit ${service.name}`;
    }
    if (mode === "delete" && profile) {
      return `Delete ${getProfileName(profile)}`;
    }
    // Create mode
    switch (type) {
      case "employees":
        return "New Employee";
      case "customers":
        return "New Customer";
      case "services":
        return "New Service";
      case "schedule":
        return "New Appointment";
      default:
        return "New Item";
    }
  };

  // Get description based on mode and type
  const getDescription = () => {
    if (mode === "history" && profile) {
      return `View service history for ${getProfileName(profile)}.`;
    }
    if (mode === "edit" && profile) {
      return `Update details for ${getProfileName(profile)}.`;
    }
    if (mode === "edit" && service) {
      return `Update details for ${service.name}.`;
    }
    if (mode === "delete" && profile) {
      return `Delete ${getProfileName(profile)}.`;
    }
    // Create mode
    switch (type) {
      case "employees":
        return "Create a new employee with basic information, working time and time-off schedule.";
      case "customers":
        return "Create a new customer with basic information, contact information and address.";
      case "services":
        return "Create a new service with details and pricing.";
      case "schedule":
        return "Create a new appointment with service, customer and employee.";
      default:
        return "";
    }
  };

  // Get toast description
  const getToastDescription = () => {
    if (mode === "edit" && profile) {
      return `${getProfileName(profile)} updated successfully`;
    } else if (mode === "edit" && service) {
      return `${service.name} updated successfully`;
    }
    // Create mode
    switch (type) {
      case "employees":
        return "New Employee created successfully";
      case "customers":
        return "New Customer created successfully";
      case "services":
        return "New Service created successfully";
      case "schedule":
        return "New Appointment created successfully";
      default:
        return "Operation completed successfully";
    }
  };

  // Get submit button text based on state and mode
  const getSubmitButtonText = () => {
    if (isSubmitting) {
      return mode === "edit" ? "Updating..." : "Creating...";
    }
    return "Save";
  };

  // Handle employee form success
  const handleEmployeeSuccess = async () => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);

    try {
      const formValues = employeeForm.getValues();

      const formData = new FormData();
      formData.append("firstName", formValues.firstName);
      formData.append("lastName", formValues.lastName);
      formData.append("phone", formValues.phone || "");
      formData.append("position", formValues.position);
      formData.append("note", formValues.note || "");

      if (mode === "edit" && profile) {
        // Update mode - include _id
        const profileId = getProfileId(profile);

        const result = await updateEmployee(
          profileId,
          formData,
          formValues.workingTimes as unknown as WorkingTime[],
          formValues.timeOffSchedules as unknown as TimeOffSchedule[],
          formValues.assignedServices as unknown as AssignedService[]
        );

        if (result.status == "SUCCESS") {
          setOpen(false);
          employeeForm.reset();
          toast.success("Success", {
            description: getToastDescription(),
          });
          // Refetch data from Supabase
          router.refresh();
        } else {
          toast.error("Error", {
            description: result.error,
          });
        }
        return;
      }

      // Create mode

      const result = await createEmployee(
        formData,
        formValues.workingTimes as unknown as WorkingTime[],
        formValues.timeOffSchedules as unknown as TimeOffSchedule[],
        formValues.assignedServices as unknown as AssignedService[]
      );

      if (result.status == "SUCCESS") {
        setOpen(false);
        employeeForm.reset();
        toast.success("Success", {
          description: getToastDescription(),
        });
        // Refetch data from Supabase
        router.refresh();
      } else {
        toast.error("Error", {
          description: result.error || "Failed to create employee",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle customer form success
  const handleCustomerSuccess = async () => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);

    try {
      const formValues = customerForm.getValues();

      const formData = new FormData();
      formData.append("firstName", formValues.firstName);
      formData.append("lastName", formValues.lastName);
      formData.append("phone", formValues.phone || "");
      formData.append("note", formValues.note || "");

      if (mode === "edit" && profile) {
        // Update mode - include _id
        const profileId = getProfileId(profile);

        const result = await updateCustomer(profileId, formData);

        if (result.status == "SUCCESS") {
          setOpen(false);
          customerForm.reset();
          toast.success("Success", {
            description: getToastDescription(),
          });
          // Refetch data from Supabase
          router.refresh();
        } else {
          toast.error("Error", {
            description: result.error,
          });
        }
        return;
      }

      // Create mode
      const result = await createCustomer(formData);

      if (result.status == "SUCCESS") {
        setOpen(false);
        customerForm.reset();
        toast.success("Success", {
          description: getToastDescription(),
        });
        // Refetch data from Supabase
        router.refresh();
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
    }
  };

  // Handle service form success
  const handleServiceSuccess = async () => {
    try {
      if (isSubmitting) return; // Prevent double submission
      setIsSubmitting(true);

      const formValues = serviceForm.getValues();
      const formData = new FormData();
      formData.append("name", formValues.name);
      formData.append("price", formValues.price.toString());
      formData.append("duration", formValues.duration.toString());
      // Append category for update
      if (formValues.category?._ref) {
        formData.append("category", JSON.stringify(formValues.category));
      }

      if (mode === "edit" && service) {
        // Update mode - include _id
        if (!service) {
          toast.error("Error", {
            description: "Service not found for update",
          });
          return;
        }
        const result = await updateService(getServiceId(service), formData);

        if (result.status == "SUCCESS") {
          setOpen(false);
          serviceForm.reset();
          toast.success("Success", {
            description: getToastDescription(),
          });
          // Refetch data from Supabase
          router.refresh();
        } else {
          toast.error("Error", {
            description: result.error,
          });
        }
        return;
      }

      // Create mode
      const result = await createService(formData, formValues.category);
      if (result.status == "SUCCESS") {
        setOpen(false);
        serviceForm.reset();
        toast.success("Success", {
          description: getToastDescription(),
        });
        // Refetch data from Supabase
        router.refresh();
        return;
      } else {
        toast.error("Error", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    }
  };

  // Handle appointment form success
  const handleAppointmentSuccess = async () => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);

    try {
      const formValues = appointmentForm.getValues();

      const formData = new FormData();
      formData.append("time", formValues.time);
      formData.append("note", formValues.note || "");
      formData.append("type", formValues.type || "walk-in");
      formData.append("status", formValues.status);

      if (formValues.customer._ref) {
        // Check for conflicts if it's a recurring appointment
        if (formValues.isRecurring) {
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
            return;
          }
        }

        // Create mode
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

        if (result.status == "SUCCESS") {
          setOpen(false);
          appointmentForm.reset();
          toast.success("Success", {
            description: getToastDescription(),
          });
          // Refetch data from Supabase
          router.refresh();
        } else {
          toast.error("Error", {
            description: result.error,
          });
        }
      } else {
        // create customer then get customer ID to create appointment
        const customerFormData = new FormData();
        customerFormData.append("firstName", formValues.customer.firstName);
        customerFormData.append("lastName", formValues.customer.lastName);
        customerFormData.append("phone", formValues.customer.phone || "");
        // Note: customer note is not part of appointment form schema, so we skip it

        const customerResult = await createCustomer(customerFormData);
        if (customerResult.status === "SUCCESS") {
          // Now create appointment with new customer
          const customerId = customerResult._id; // Assuming data contains the new customer object

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
            setOpen(false);
            appointmentForm.reset();
            toast.success("Success", {
              description: getToastDescription(),
            });
            // Refetch data from Supabase
            router.refresh();
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

  const handleConflictConfirm = async () => {
    if (!pendingAppointmentData) return;

    setIsSubmitting(true);
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
        appointmentForm?.reset();
        toast.success("Success", {
          description:
            "Recurring appointments created successfully (with conflicts)",
        });
        // Refetch data from Supabase
        router.refresh();
        if (onSuccess) onSuccess();
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
      setPendingAppointmentData(null);
      setConflicts([]);
    }
  };

  const handleConflictCancel = () => {
    setShowConflictDialog(false);
    setPendingAppointmentData(null);
    setConflicts([]);
    setIsSubmitting(false);
  };

  // Main form success handler
  const handleFormSuccess = async () => {
    switch (type) {
      case "employees":
        await handleEmployeeSuccess();
        break;
      case "customers":
        await handleCustomerSuccess();
        break;
      case "services":
        await handleServiceSuccess();
        break;
      case "schedule":
        await handleAppointmentSuccess();
        break;
      default:
    }
  };

  // Render appropriate form based on mode and type
  const renderForm = () => {
    if (mode === "history" && type === "employees") {
      if (loadingHistory) {
        return <ProfileTableLoading />;
      }
      const columns: ColumnDef<EmployeeHistoryRow>[] = [
        {
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          accessorKey: "startTime",
          cell: (info) => {
            return (
              <div>
                {format(
                  toZonedTime(new Date(info.getValue() as string), timezone),
                  "MM/dd/yyyy"
                )}
              </div>
            );
          },
        },
        {
          header: "Customer",
          accessorKey: "customerFullName",
          accessorFn: (row) => row.customer.fullName,
        },
        {
          header: "Service",
          accessorKey: "service",
          cell: (info) => {
            const service = info.getValue() as EmployeeHistoryRow["service"];
            return service.name;
          },
        },
        {
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                Duration
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          accessorKey: "duration",
          cell: ({ row }) =>
            formatMinuteDuration(row.getValue("duration") as number),
        },
      ];
      return (
        <div className="w-full h-full min-h-0 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[max-content_max-content_1fr] md:items-end">
            <div className="space-y-2">
              <Label>Filter Type</Label>
              <Select
                value={historyFilterType}
                onValueChange={(value: any) => setHistoryFilterType(value)}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">By Customer</SelectItem>
                  <SelectItem value="date">By Date Range</SelectItem>
                  <SelectItem value="both">By Customer & Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(historyFilterType === "date" || historyFilterType === "both") && (
              <div className="space-y-2 md:justify-self-center">
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[240px] justify-start"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {historyDateRange.from ? (
                        historyDateRange.to ? (
                          <>
                            {format(historyDateRange.from, "LLL dd, y")} -{" "}
                            {format(historyDateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(historyDateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={historyDateRange.from}
                      selected={historyDateRange}
                      onSelect={(range) =>
                        setHistoryDateRange({
                          from: range?.from,
                          to: range?.to || range?.from,
                        })
                      }
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {(historyFilterType === "customer" ||
              historyFilterType === "both") && (
              <div className="space-y-2 md:w-fit">
                <Label>Customer</Label>
                <Popover
                  open={historyCustomerOpen}
                  onOpenChange={(open) => {
                    setHistoryCustomerOpen(open);
                    if (!open) setHistoryCustomerQuery("");
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={historyCustomerOpen}
                      className="w-[320px] justify-between"
                    >
                      {selectedHistoryCustomerInfo
                        ? `${selectedHistoryCustomerInfo.fullName}${selectedHistoryCustomerInfo.phone ? ` - ${selectedHistoryCustomerInfo.phone}` : ""}`
                        : "Search by name or phone..."}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search by name or phone..."
                        value={historyCustomerQuery}
                        onValueChange={setHistoryCustomerQuery}
                      />
                      <CommandList>
                        {historyCustomerSearching ? (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            Searching...
                          </div>
                        ) : historyCustomerResults.length === 0 ? (
                          <CommandEmpty>No customer found.</CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {historyCustomerResults.map((c) => {
                              const label = `${c.fullName}${c.phone ? ` - ${c.phone}` : ""}`;
                              return (
                                <CommandItem
                                  key={c.id}
                                  value={c.id}
                                  onSelect={() => {
                                    const isSame =
                                      selectedHistoryCustomer === c.id;
                                    const nextId = isSame ? "" : c.id;
                                    setSelectedHistoryCustomer(nextId);
                                    setSelectedHistoryCustomerInfo(
                                      isSame ? null : c
                                    );
                                    setHistoryCustomerOpen(false);
                                    setHistoryCustomerQuery("");
                                  }}
                                >
                                  {label}
                                  <Check
                                    className={cn(
                                      "ml-auto",
                                      selectedHistoryCustomer === c.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <DataTable
            columns={columns}
            data={filteredEmployeeHistory}
            title={""}
            isShowSearch={false}
            isShowPagination={true}
            titleEmpty={"No history found"}
            isShowExport={true}
            timezone={timezone}
            showLimit={historyPageSize}
            pageSizeOptions={[20, 50, 100]}
            onPageSizeChange={setHistoryPageSize}
          />
        </div>
      );
    } else if (mode === "history" && type === "customers") {
      if (loadingHistory) {
        return <ProfileTableLoading />;
      }
      const columns: ColumnDef<CustomerHistoryRow>[] = [
        {
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          accessorKey: "startTime",
          cell: (info) => {
            return (
              <div>
                {format(
                  toZonedTime(new Date(info.getValue() as string), timezone),
                  "MM/dd/yyyy"
                )}
              </div>
            );
          },
        },
        {
          header: "Employee",
          accessorKey: "employeeFullName",
          accessorFn: (row) => row.employee.fullName,
        },
        {
          header: "Service",
          accessorKey: "service",
          cell: (info) => {
            const service = info.getValue() as EmployeeHistoryRow["service"];
            return service.name;
          },
        },
        {
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                Duration
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          accessorKey: "duration",
          cell: ({ row }) =>
            formatMinuteDuration(row.getValue("duration") as number),
        },
      ];
      return (
        <div className="w-full h-full min-h-0 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[max-content_max-content_1fr] md:items-end">
            <div className="space-y-2">
              <Label>Filter Type</Label>
              <Select
                value={historyFilterType}
                onValueChange={(value: any) => setHistoryFilterType(value)}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">By Customer</SelectItem>
                  <SelectItem value="date">By Date Range</SelectItem>
                  <SelectItem value="both">By Customer & Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(historyFilterType === "date" || historyFilterType === "both") && (
              <div className="space-y-2 md:justify-self-center">
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[240px] justify-start"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {historyDateRange.from ? (
                        historyDateRange.to ? (
                          <>
                            {format(historyDateRange.from, "LLL dd, y")} -{" "}
                            {format(historyDateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(historyDateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={historyDateRange.from}
                      selected={historyDateRange}
                      onSelect={(range) =>
                        setHistoryDateRange({
                          from: range?.from,
                          to: range?.to || range?.from,
                        })
                      }
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {(historyFilterType === "customer" ||
              historyFilterType === "both") && (
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select
                  value={selectedHistoryEmployee}
                  onValueChange={(value) => setSelectedHistoryEmployee(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerHistoryEmployeeOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DataTable
            columns={columns}
            data={filteredCustomerHistory}
            title={""}
            isShowSearch={false}
            isShowPagination={true}
            titleEmpty={"No history found"}
            isShowExport={true}
            timezone={timezone}
            showLimit={historyPageSize}
            pageSizeOptions={[20, 50, 100]}
            onPageSizeChange={setHistoryPageSize}
          />
        </div>
      );
    }

    switch (type) {
      case "employees":
        return (
          <EmployeeForm
            form={employeeForm}
            onSuccess={handleFormSuccess}
            hideSubmitButton={isMobile}
            formRef={isMobile ? formRef : undefined}
            isSubmitting={isSubmitting}
          />
        );
      case "customers":
        return (
          <CustomerForm
            form={customerForm}
            onSuccess={handleFormSuccess}
            hideSubmitButton={isMobile}
            formRef={isMobile ? formRef : undefined}
            initialData={
              mode === "edit" && type === "customers"
                ? (profile as Customer)
                : undefined
            }
            isSubmitting={isSubmitting}
          />
        );
      case "services":
        return (
          <ServiceForm
            form={serviceForm}
            onSuccess={handleFormSuccess}
            hideSubmitButton={isMobile}
            formRef={isMobile ? formRef : undefined}
            isSubmitting={isSubmitting}
            initialData={
              mode === "edit" && service ? (service as Service) : undefined
            }
            categories={categories}
          />
        );
      case "schedule":
        return (
          <AppointmentForm
            type={"create"}
            form={appointmentForm}
            onSuccess={handleFormSuccess}
            hideSubmitButton={isMobile}
            formRef={isMobile ? formRef : undefined}
            isSubmitting={isSubmitting}
          />
        );

      default:
        return null;
    }
  };

  // Handle submit from drawer footer
  const handleDrawerSubmit = () => {
    if (isSubmitting || !formRef.current) return;
    formRef.current.requestSubmit();
  };

  // Handle open/close dialog để reset form
  const handleOpenChange = (newOpen: boolean) => {
    if (isSubmitting && !newOpen) return; // Prevent closing while submitting
    setOpen(newOpen);

    if (newOpen) {
      setIsSubmitting(false); // Reset submitting state when opening
      // Reset history filters each time the dialog opens
      setHistoryFilterType("both");
      setHistoryDateRange({ from: undefined, to: undefined });
      setSelectedHistoryCustomer("");
      setSelectedHistoryCustomerInfo(null);
      setSelectedHistoryEmployee("");
      setHistoryCustomerOpen(false);
      setHistoryCustomerQuery("");
      setHistoryCustomerResults([]);
      setHistoryCustomerSearching(false);
      const currentForm = getFormInstance();

      if (
        mode === "edit" &&
        profile &&
        type === "employees" &&
        isEmployee(profile)
      ) {
        // Load existing employee data
        const formData = {
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          phone: profile.phone || "",
          position: profile.position || "serviceProvider",
          note: profile.note || "",
          workingTimes:
            profile.workingTimes?.map((wt) => ({
              from: wt.from || "",
              to: wt.to || "",
              day: wt.day || "",
            })) || [],
          timeOffSchedules:
            profile.timeOffSchedules?.map((to) => ({
              from: to.from || "",
              to: to.to || "",
              reason: to.reason || "",
              period:
                (to.period as "Exact" | "Daily" | "Weekly" | "Monthly") ||
                "Exact",
              date: to.date ? new Date(to.date) : undefined,
              dayOfWeek: normalizeNumberArray((to as any).dayOfWeek),
              dayOfMonth: normalizeNumberArray((to as any).dayOfMonth),
            })) || [],
          assignedServices:
            profile.assignedServices?.map((as) => ({
              serviceId: as.serviceId || "",
              price: as.price || 0,
              duration: as.duration || 15,
              processTime: as.processTime || 0,
            })) || [],
        };
        employeeForm.reset(formData);
      } else if (mode === "edit" && profile && type === "customers") {
        // Load existing customer data via CustomerForm's initialData prop
        // CustomerForm will handle the reset internally with note field
      } else if (mode === "history" && type === "employees" && profile) {
        fetchEmployeeHistory();
      } else if (mode === "history" && type === "customers" && profile) {
        fetchCustomerHistory();
      } else {
        // Create mode - reset to defaults
        currentForm.reset();
      }
    } else {
      // Reset form on close
      const currentForm = getFormInstance();
      currentForm.reset();
      setIsSubmitting(false); // Reset submitting state when closing
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (mode === "delete") {
      try {
        setIsSubmitting(true);

        if (profile) {
          if (type === "employees") {
            const result = await deleteEmployee(getProfileId(profile));
            if (result.status === "SUCCESS") {
              setOpen(false);
              setConfirmDialogOpen(false);
              toast.success("Success", {
                description: `${getProfileName(profile)} deleted successfully`,
              });
              // Refetch data from Supabase
              router.refresh();
            } else {
              toast.error("Error", {
                description: result.error,
              });
            }
          } else if (type === "customers") {
            const result = await deleteCustomer(getProfileId(profile));
            if (result.status === "SUCCESS") {
              setOpen(false);
              setConfirmDialogOpen(false);
              toast.success("Success", {
                description: `${getProfileName(profile)} deleted successfully`,
              });
            } else {
              toast.error("Error", {
                description: result.error,
              });
            }
          }
        } else if (service && type === "services") {
          const result = await deleteService(getServiceId(service));
          if (result.status === "SUCCESS") {
            setOpen(false);
            setConfirmDialogOpen(false);
            toast.success("Success", {
              description: `${service.name} deleted successfully`,
            });
          } else {
            toast.error("Error", {
              description: result.error,
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
    }
  };

  // Render delete confirmation content
  const renderDeleteConfirmation = () => {
    const itemName = profile
      ? getProfileName(profile)
      : service?.name || "item";

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{itemName}</strong>? This
          action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setConfirmDialogOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    );
  };

  // Handle main dialog/drawer open for delete mode
  const handleMainOpenChange = (newOpen: boolean) => {
    if (mode === "delete" && newOpen) {
      // For delete mode, show confirmation dialog instead
      setConfirmDialogOpen(true);
      return;
    }

    // Regular open/close logic for other modes
    handleOpenChange(newOpen);
  };

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={handleMainOpenChange}>
          <DrawerTrigger asChild>
            <Button variant={variant} size={size} className={className}>
              {children}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="p-4 h-[95vh] flex flex-col">
            <DrawerHeader className="text-left flex-shrink-0 px-0">
              <DrawerTitle>{getTitle()}</DrawerTitle>
              <DrawerDescription className="sr-only">
                {getDescription()}
              </DrawerDescription>
            </DrawerHeader>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto min-h-0 pb-4">
              {renderForm()}
            </div>

            {/* Fixed footer with buttons */}
            <DrawerFooter className="pt-2 px-0 pb-0 flex-shrink-0 border-t">
              {(mode === "edit" || mode === "create") && (
                <Button onClick={handleDrawerSubmit} disabled={isSubmitting}>
                  {getSubmitButtonText()}
                </Button>
              )}
              <DrawerClose asChild>
                <Button variant="outline" disabled={isSubmitting}>
                  {mode === "history" ? "Close" : "Cancel"}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Delete Confirmation Dialog for Mobile */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {renderDeleteConfirmation()}
          </DialogContent>
        </Dialog>

        {/* Conflict Dialog for Mobile */}
        <ConflictDialog
          open={showConflictDialog}
          onOpenChange={setShowConflictDialog}
          conflicts={conflicts}
          timezone={timezone}
          onConfirm={handleConflictConfirm}
          onCancel={handleConflictCancel}
        />
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant={variant} size={size} className={className}>
            {children}
          </Button>
        </DialogTrigger>
        <DialogContent
          className={cn(
            // Different sizes based on form type
            type === "customers" &&
              mode === "history" &&
              "w-[95vw] sm:max-w-5xl h-[90vh] overflow-hidden flex flex-col",
            type === "customers" &&
              mode !== "history" &&
              "sm:max-w-md max-h-[90vh]",
            type === "services" && "sm:max-w-lg max-h-[90vh]",
            type === "employees" &&
              mode === "history" &&
              "w-[95vw] sm:max-w-5xl h-[90vh] overflow-hidden flex flex-col",
            type === "employees" &&
              mode !== "history" &&
              "sm:max-w-2xl max-h-[95vh]",
            type === "schedule" &&
              "sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl max-h-[95vh]",
            // Default for other cases
            !["customers", "services", "employees", "schedule"].includes(
              type
            ) && "sm:max-w-lg max-h-[90vh]",
            "flex flex-col items-start justify-start overflow-y-auto"
          )}
          aria-describedby="form-dialog"
        >
          <DialogHeader>
            <DialogTitle>{getTitle()}</DialogTitle>

            <DialogDescription className="sr-only">
              {getDescription()}
            </DialogDescription>
          </DialogHeader>
          {renderForm()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          {renderDeleteConfirmation()}
        </DialogContent>
      </Dialog>

      {/* Conflict Dialog */}
      <ConflictDialog
        open={showConflictDialog}
        onOpenChange={setShowConflictDialog}
        conflicts={conflicts}
        timezone={timezone}
        onConfirm={handleConflictConfirm}
        onCancel={handleConflictCancel}
      />
    </>
  );
};

export default FormButton;
