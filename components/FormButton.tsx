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
import { useRef, useState, ReactNode, useEffect } from "react";
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
import { client } from "@/sanity/lib/client";
import {
  APPOINTMENTS_BY_CUSTOMER_QUERY,
  APPOINTMENTS_BY_EMPLOYEE_QUERY,
  TIMEZONE_QUERY,
} from "@/sanity/lib/queries";
import { ColumnDef } from "@tanstack/react-table";
import ProfileTableLoading from "./ProfileTableLoading";
import { ArrowUpDown } from "lucide-react";
import * as React from "react";
import { formatMinuteDuration, parseOffset } from "@/lib/utils";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { AssignedService } from "@/models/assignedService";
import { Appointment } from "@/models/appointment";

type FormMode = "create" | "edit" | "history" | "delete";
type FormType = "employees" | "customers" | "services" | "schedule";
type EmployeeHistoryRow = {
  startTime: string;
  customer: { firstName: string; lastName: string; fullName: string };
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
  variant = "default",
  size = "default",
  className = "",
}: FormButtonProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();
  const formRef = useRef<HTMLFormElement>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [employeeHistory, setEmployeeHistory] = useState([]);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [timezone, setTimezone] = useState<string>("");
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [pendingAppointmentData, setPendingAppointmentData] =
    useState<PendingAppointmentData | null>(null);

  const fetchEmployeeHistory = async () => {
    if (profile) {
      setLoadingHistory(true);
      try {
        const result = await client.fetch(APPOINTMENTS_BY_EMPLOYEE_QUERY, {
          employeeId: getProfileId(profile),
        });
        setEmployeeHistory(result || []);
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
        const result = await client.fetch(APPOINTMENTS_BY_CUSTOMER_QUERY, {
          customerId: getProfileId(profile),
        });
        // Filter out cancelled appointments
        const filteredResult = (result || []).filter(
          (appointment: Appointment) => appointment.status !== "cancelled",
        );
        setCustomerHistory(filteredResult);
      } catch {
        setCustomerHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    }
  };

  useEffect(() => {
    // Fetch timezone on mount
    const fetchTimezone = async () => {
      try {
        const result = await client.fetch(TIMEZONE_QUERY);
        if (result) {
          setTimezone(parseOffset(result.timezone || "UTC-7:00"));
        } else {
          setTimezone("UTC");
        }
      } catch (error) {
        console.error("Error fetching timezone settings:", error);
        setTimezone("UTC"); // Set default timezone on error
      }
    };

    fetchTimezone();
  }, []);

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
      showOnline: true,
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
        console.log("Updating employee with ID:", profileId);
        console.log("Form Values:", formValues);

        const result = await updateEmployee(
          profileId,
          formData,
          formValues.workingTimes as unknown as WorkingTime[],
          formValues.timeOffSchedules as unknown as TimeOffSchedule[],
          formValues.assignedServices as unknown as AssignedService[],
        );

        if (result.status == "SUCCESS") {
          setOpen(false);
          employeeForm.reset();
          toast.success("Success", {
            description: getToastDescription(),
          });
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
        formValues.assignedServices as unknown as AssignedService[],
      );

      if (result.status == "SUCCESS") {
        setOpen(false);
        employeeForm.reset();
        toast.success("Success", {
          description: getToastDescription(),
        });
      } else {
        toast.error("Error", {
          description: result.error,
        });
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

  // Handle customer form success
  const handleCustomerSuccess = async () => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);

    try {
      const formValues = customerForm.getValues();
      console.log("Customer formValues", formValues);

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
        // Call onSuccess callback to refresh customer list
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error("Error", {
          description: result.error,
        });
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
      formData.append("showOnline", formValues.showOnline.toString());

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
        return;
      } else {
        toast.error("Error", {
          description: result.error,
        });
      }
    } catch (error) {
      console.log(error);
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
      console.log("Appointment formValues", formValues);
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
            : undefined,
        );

        if (result.status == "SUCCESS") {
          setOpen(false);
          appointmentForm.reset();
          toast.success("Success", {
            description: getToastDescription(),
          });
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
              description: getToastDescription(),
            });
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
      console.log(error);
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
        pendingAppointmentData.recurringFrequency,
      );

      if (result.status === "SUCCESS") {
        setOpen(false);
        appointmentForm?.reset();
        toast.success("Success", {
          description:
            "Recurring appointments created successfully (with conflicts)",
        });
        if (onSuccess) onSuccess();
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
        console.log("Unknown form type:", type);
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
                  "MM/dd/yyyy",
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
        <DataTable
          columns={columns}
          data={employeeHistory}
          height={isMobile ? "calc(100vh - 200px)" : "calc(100vh - 300px)"}
          title={""}
          isShowPagination={false}
          titleEmpty={"No history found"}
          searchColumn={"customerFullName"}
          searchName={"Search customer..."}
          isShowExport={true}
          timezone={timezone}
        />
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
                  "MM/dd/yyyy",
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
        <DataTable
          columns={columns}
          data={customerHistory}
          height={isMobile ? "calc(100vh - 200px)" : "calc(100vh - 300px)"}
          title={""}
          isShowPagination={false}
          searchColumn={"employeeFullName"}
          searchName={"Search employee..."}
          titleEmpty={"No history found"}
          isShowExport={true}
          timezone={timezone}
        />
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
              dayOfWeek: to.dayOfWeek || [],
              dayOfMonth: to.dayOfMonth || [],
            })) || [],
          assignedServices:
            profile.assignedServices?.map((as) => ({
              serviceId: as.serviceId || "",
              price: as.price || 0,
              duration: as.duration || 15,
              processTime: as.processTime || 0,
              showOnline: as.showOnline !== undefined ? as.showOnline : true,
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
        console.log(error);
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
          className={`sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl max-h-[95vh] h-[95vh] flex flex-col items-start justify-start`}
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
