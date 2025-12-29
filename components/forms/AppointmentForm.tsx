/* eslint-disable */
"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm, UseFormReturn, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  appointmentFormSchema,
  appointmentTimeOffSchema,
} from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Service } from "@/models/service";
import AppointmentFormLoading from "@/components/AppointmentFormLoading";
import AppointmentClientForm from "@/components/forms/AppointmentClientForm";
import AppointmentInfoForm from "@/components/forms/AppointmentInfoForm";
import { Customer, getProfileName } from "@/models/profile";
import { Appointment } from "@/models/appointment";
import { AlertCircle, XCircle } from "lucide-react";
import { cancelRecurringAppointments } from "@/lib/actions";
import { createTimeOff } from "@/actions/time-off";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";
import { safeParseDate, calculateDuration } from "@/lib/utils";

const intervals: number[] = [];
for (let min = 15; min <= 240; min += 15) {
  intervals.push(min);
}

// Global caches to prevent duplicate requests across remounts
const globalServicesCache: { data: any; promise: Promise<any> | null } = {
  data: null,
  promise: null,
};
const globalCustomerHistoryCache = new Map<string, { data: any; promise: Promise<any> | null }>();

export const AppointmentForm = ({
  onSuccess,
  hideSubmitButton = false,
  formRef,
  form: externalForm,
  isSubmitting = false,
  type,
  appointmentId,
  onTimeOffCreated,
  setIsCancellingStanding,
  onCancelStandingSuccess,
  setIsSubmitting,
  initialAppointments,
  initialEmployeesData,
}: {
  onSuccess?: () => void;
  hideSubmitButton?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
  form?: UseFormReturn<z.infer<typeof appointmentFormSchema>>;
  isSubmitting?: boolean;
  type: "create" | "edit";
  appointmentId?: string;
  onTimeOffCreated?: () => void;
  setIsCancellingStanding?: (value: boolean) => void;
  onCancelStandingSuccess?: () => void;
  setIsSubmitting?: (value: boolean) => void;
  initialAppointments?: Appointment[];
  initialEmployeesData?: any[];
}) => {
  const [showAppointmentInfo, setShowAppointmentInfo] = React.useState(
    type === "edit"
  );
  // Define the form
  const internalForm = useForm<z.infer<typeof appointmentFormSchema>>({
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
      time: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
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
  const form = externalForm || internalForm;

  // Time Off Form
  const timeOffForm = useForm<z.infer<typeof appointmentTimeOffSchema>>({
    resolver: zodResolver(appointmentTimeOffSchema),
    defaultValues: {
      employee: {
        _ref: "",
        _type: "reference",
      },
      startTime: "",
      duration: 30 as number,
      reason: "",
      isRecurring: false,
      recurringDuration: undefined,
      recurringFrequency: undefined,
    },
  });

  const clientErrors = form.formState.errors.customer;

  const [services, setServices] = React.useState<Service[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>(
    initialAppointments || []
  );
  const [employees, setEmployees] = React.useState<
    {
      value: string;
      label: string;
      assignedServices?: Array<{
        serviceId: string;
        price: number;
        duration: number;
        processTime: number;
        showOnline: boolean;
      }>;
    }[]
  >([]);

  const [customers, setCustomers] = React.useState<
    {
      _id: string;
      value: string;
      label: string;
      firstName: string;
      lastName: string;
      phone: string;
      note?: string;
    }[]
  >([]);
  const [customerHistory, setCustomerHistory] = React.useState<Appointment[]>(
    []
  );

  // Separate loading states for better UX
  const [servicesLoading, setServicesLoading] = React.useState(true);
  const [employeesLoading, setEmployeesLoading] = React.useState(true);
  const [customersLoading, setCustomersLoading] = React.useState(false);
  const [showCancelStandingConfirm, setShowCancelStandingConfirm] =
    React.useState(false);
  const [showUpcomingAppointmentsConfirm, setShowUpcomingAppointmentsConfirm] =
    React.useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = React.useState<
    Appointment[]
  >([]);
  const [selectedEmployee, setSelectedEmployee] = React.useState<
    | {
      _id: string;
      firstName: string;
      lastName: string;
    }
    | undefined
  >(undefined);

  // Watch services specifically
  const watchedServices = useWatch({
    control: form.control,
    name: "services",
  });

  const customerRef = useWatch({
    control: form.control,
    name: "customer._ref",
  });

  const customerFirstName = useWatch({
    control: form.control,
    name: "customer.firstName",
  });

  const customerLastName = useWatch({
    control: form.control,
    name: "customer.lastName",
  });

  const employeeRef = useWatch({
    control: form.control,
    name: "employee._ref",
  });

  // Update selectedEmployee when employeeRef changes
  React.useEffect(() => {
    if (employeeRef && employees.length > 0) {
      const employee = employees.find((emp) => emp.value === employeeRef);
      if (employee) {
        setSelectedEmployee({
          _id: employee.value,
          firstName: employee.label.split(" ")[0] || "",
          lastName: employee.label.split(" ").slice(1).join(" ") || "",
        });
        // Auto-set employee in timeOffForm
        timeOffForm.setValue("employee", {
          _ref: employee.value,
          _type: "reference",
        });
        // Auto-set startTime from appointment form
        const appointmentTime = form.getValues("time");
        if (appointmentTime) {
          timeOffForm.setValue("startTime", appointmentTime);
        }
      }
    } else {
      setSelectedEmployee(undefined);
      // Clear employee in timeOffForm
      timeOffForm.setValue("employee", {
        _ref: "",
        _type: "reference",
      });
    }
  }, [employeeRef, employees, timeOffForm, form]);

  const customerPhone = useWatch({
    control: form.control,
    name: "customer.phone",
  });

  // Watch isRecurring in timeOffForm to set default values
  const timeOffIsRecurring = useWatch({
    control: timeOffForm.control,
    name: "isRecurring",
  });

  // Set default values for recurring fields when isRecurring is enabled
  React.useEffect(() => {
    if (timeOffIsRecurring) {
      const currentRecurringDuration =
        timeOffForm.getValues("recurringDuration");
      const currentRecurringFrequency =
        timeOffForm.getValues("recurringFrequency");

      if (!currentRecurringDuration) {
        timeOffForm.setValue("recurringDuration", {
          value: 1,
          unit: "months",
        });
      }

      if (!currentRecurringFrequency) {
        timeOffForm.setValue("recurringFrequency", {
          value: 1,
          unit: "weeks",
        });
      }
    }
  }, [timeOffIsRecurring, timeOffForm]);

  // Check if client form is complete and valid
  React.useEffect(() => {
    const isClientFormComplete =
      customerFirstName && customerLastName && customerPhone && !clientErrors;

    if (isClientFormComplete && !showAppointmentInfo) {
      setShowAppointmentInfo(true);
    } else if (!isClientFormComplete && showAppointmentInfo) {
      setShowAppointmentInfo(false);
    }
  }, [
    customerFirstName,
    customerLastName,
    customerPhone,
    clientErrors,
    showAppointmentInfo,
  ]);

  // No local cache needed, using globalCustomerHistoryCache

  React.useEffect(() => {
    let isMounted = true;
    async function fetchCustomerHistory() {
      if (customerRef) {
        try {
          let historyPromise;
          const cached = globalCustomerHistoryCache.get(customerRef);

          // Check global cache
          if (cached && cached.promise) {
            historyPromise = cached.promise;
          } else {
            // New fetch
            const p = fetch(
              `/api/appointments?customerId=${customerRef}`
            ).then((res) => res.json());

            globalCustomerHistoryCache.set(customerRef, {
              data: null,
              promise: p,
            });
            historyPromise = p;
          }

          const customerHistoryRes = await historyPromise;

          // Update cache data when resolved
          const currentCache = globalCustomerHistoryCache.get(customerRef);
          if (currentCache) {
            currentCache.data = customerHistoryRes;
          }

          if (!isMounted) return;

          // Filter out cancelled appointments and map data
          const filteredAndMappedData = (customerHistoryRes || [])
            .filter((appointment: any) => appointment.status !== "cancelled")
            .map((appointment: any) => {
              const start = safeParseDate(
                appointment.start_time || appointment.startTime
              );
              const end = safeParseDate(
                appointment.end_time || appointment.endTime
              );
              const duration =
                start && end
                  ? (end.getTime() - start.getTime()) / 1000 / 60
                  : 0;
              return {
                _id: appointment.id || appointment._id,
                created_at: appointment.created_at,
                _createdAt: appointment.created_at, // For backward compatibility
                service: appointment.service
                  ? {
                    _id: appointment.service.id || appointment.service._id,
                    name: appointment.service.name,
                    duration: appointment.service.duration,
                  }
                  : undefined,
                customer: appointment.customer
                  ? {
                    _id: appointment.customer.id || appointment.customer._id,
                    firstName: appointment.customer.firstName,
                    lastName: appointment.customer.lastName,
                    fullName: appointment.customer.fullName,
                  }
                  : undefined,
                employee: appointment.employee
                  ? {
                    _id: appointment.employee.id || appointment.employee._id,
                    firstName: appointment.employee.firstName,
                    lastName: appointment.employee.lastName,
                    fullName: appointment.employee.fullName,
                  }
                  : undefined,
                startTime: start
                  ? start.toISOString()
                  : appointment.start_time || appointment.startTime,
                endTime: end
                  ? end.toISOString()
                  : appointment.end_time || appointment.endTime,
                duration: calculateDuration(
                  appointment.start_time || appointment.startTime,
                  appointment.end_time || appointment.endTime
                ),
              };
            });
          setCustomerHistory([...filteredAndMappedData]); // always new reference
        } catch (error) {
          if (isMounted) setCustomerHistory([]);
        }
      } else {
        if (isMounted) setCustomerHistory([]); // also a new reference
      }
    }

    fetchCustomerHistory();
    return () => { isMounted = false; };
  }, [customerRef]);

  const [customerValue, setCustomerValue] = React.useState<string>("");

  // Set customer if needed
  if (customerRef) {
    const selectedCustomer = customers.find(
      (customer) => customer._id === customerRef
    );
    if (selectedCustomer && customerValue !== selectedCustomer._id) {
      setCustomerValue(selectedCustomer._id);
      form.setValue("customer", {
        firstName: selectedCustomer.firstName ?? "",
        lastName: selectedCustomer.lastName ?? "",
        phone: selectedCustomer.phone ?? "",
        _ref: selectedCustomer._id,
        _type: "reference",
      });
    }
  }

  // Function to refresh customer list
  const refreshCustomers = React.useCallback(async () => {
    const customersRes = await fetch("/api/customers").then((res) =>
      res.json()
    );
    // Transform to match Customer type
    setCustomers(
      (customersRes || []).map((customer: any) => ({
        _id: customer.id,
        value: customer.id,
        label:
          `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone || "",
        note: customer.note || "",
      }))
    );
  }, []);

  // Function to go back to customer selection
  const handleBackToCustomer = React.useCallback(() => {
    // Reset customer form data
    form.setValue("customer", {
      firstName: "",
      lastName: "",
      phone: "",
      _ref: "",
      _type: "reference",
    });
    setCustomerValue("");
    // This will trigger the useEffect to set showAppointmentInfo to false
  }, [form]);

  // No local servicesCache needed

  // Fetch services and employees - optimized
  React.useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setServicesLoading(true);

        // Handle Employees
        let employeesPromise;
        if (initialEmployeesData) {
          // Use provided data immediately
          const employeeList = (initialEmployeesData || []).map((employee: any) => ({
            value: employee._id || employee.id,
            _id: employee._id || employee.id,
            label:
              getProfileName(employee) || `${employee.first_name || ""} ${employee.last_name || ""}`.trim(),
            assignedServices: (employee.assignedServices || []).map(
              (as: any) => ({
                serviceId: as.serviceId || as.service_id,
                price: as.price || 0,
                duration: as.duration || 0,
                processTime: as.processTime || as.process_time || 0,
              })
            ),
          }));
          setEmployees(employeeList);
          setEmployeesLoading(false);
          employeesPromise = Promise.resolve(initialEmployeesData);
        } else {
          setEmployeesLoading(true);
          employeesPromise = fetch("/api/employees").then((res) => res.json());
        }

        // SERVICES FETCH (using cache)
        let servicesPromise;
        if (globalServicesCache.data) {
          const transformedServices = (globalServicesCache.data || []).map((s: any) => ({
            _id: s.id,
            name: s.name,
            price: s.price,
            duration: s.duration,
            category: s.category || {
              _id: "",
              name: "",
            },
          }));
          setServices(transformedServices);
          servicesPromise = Promise.resolve(globalServicesCache.data);
        } else if (globalServicesCache.promise) {
          servicesPromise = globalServicesCache.promise.then(data => {
            globalServicesCache.data = data;
            return data;
          });
        } else {
          const p = fetch("/api/services").then((res) => res.json());
          globalServicesCache.promise = p;
          servicesPromise = p.then(data => {
            globalServicesCache.data = data;
            return data;
          });
        }

        const [servicesRes, employeesResRaw] = await Promise.all([
          servicesPromise,
          (!initialEmployeesData) ? employeesPromise : Promise.resolve(null)
        ]);

        if (!isMounted) return;

        // Process Services (if newly fetched)
        if (!globalServicesCache.data && servicesRes) { // actually resolved now
          globalServicesCache.data = servicesRes;
        }

        // Re-set services from resolved data (ensures consistency)
        const transformedServices = (servicesRes || []).map((s: any) => ({
          _id: s.id,
          name: s.name,
          price: s.price,
          duration: s.duration,
          category: s.category || {
            _id: "",
            name: "",
          },
        }));
        setServices(transformedServices);
        setServicesLoading(false);

        // Process Employees (only if fetched)
        if (!initialEmployeesData && employeesResRaw) {
          const employeeList = (employeesResRaw || []).map((employee: any) => ({
            value: employee.id,
            _id: employee.id,
            label:
              `${employee.first_name || ""} ${employee.last_name || ""}`.trim(),
            assignedServices: (employee.assignedServices || []).map(
              (as: any) => ({
                serviceId: as.serviceId || as.service_id,
                price: as.price || 0,
                duration: as.duration || 0,
                processTime: as.processTime || as.process_time || 0,
              })
            ),
          }));
          setEmployees(employeeList);
          setEmployeesLoading(false);
        }

        // Only reset services if not in edit mode and services are empty
        if (type !== "edit") {
          const serviceRefs = form
            .getValues("services")
            .map((service: { _ref: string }) => service._ref);
          const selectedServices = (servicesRes || []).filter((service: Service) =>
            serviceRefs.includes(service._id)
          );
          form.setValue(
            "services",
            selectedServices.map((service: Service) => ({
              _ref: service._id,
              _type: "reference",
              duration: service.duration,
            }))
          );
        }

      } catch (error) {
        if (isMounted) {
          setServices([]);
          // Don't clear employees if we had initial data? 
          // Ideally we handle errors more gracefully but this matches previous behavior
          if (!initialEmployeesData) setEmployees([]);
        }
      } finally {
        if (isMounted) {
          setServicesLoading(false);
          if (!initialEmployeesData) setEmployeesLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [initialEmployeesData]); // Removed 'type' and 'form' dependencies for static data!

  // Fetch customer and appointments in parallel if in edit mode (Dynamic Data)
  React.useEffect(() => {
    let isMounted = true;

    if (type === "edit" && form.getValues("customer._ref")) {
      (async () => {
        try {
          const customerId = form.getValues("customer._ref");
          const customerData = form.getValues("customer");
          const time = form.getValues("time");

          // Check if customer already has full info (from RPC result)
          const hasFullCustomerInfo =
            customerData.firstName &&
            customerData.lastName &&
            customerData.phone;

          // Only fetch customer if we don't have full info
          if (!hasFullCustomerInfo) {
            setCustomersLoading(true);
            try {
              const customersRes = await fetch("/api/customers").then((res) =>
                res.json()
              );

              if (!isMounted) return;

              // Set customer
              const customer = customersRes.find(
                (c: any) => c.id === customerId
              );
              if (customer) {
                setCustomers([
                  {
                    _id: customer.id,
                    value: customer.id,
                    label:
                      `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
                    firstName: customer.first_name,
                    lastName: customer.last_name,
                    phone: customer.phone || "",
                    note: customer.note || "",
                  },
                ]);
              }
            } catch (error) {
              console.error("Error fetching customer:", error);
            } finally {
              if (isMounted) {
                setCustomersLoading(false);
              }
            }
          } else {
            // Customer already has full info from RPC, just set it in customers state
            if (customerId) {
              setCustomers([
                {
                  _id: customerId,
                  value: customerId,
                  label:
                    `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim(),
                  firstName: customerData.firstName,
                  lastName: customerData.lastName,
                  phone: customerData.phone || "",
                  note: (customerData as any).note || "",
                },
              ]);
            }
          }

          // Only fetch appointments if we have both customer and time
          // Skip if appointments are already populated from RPC (services_same_day) or initialAppointments
          if (
            customerId &&
            time &&
            appointments.length === 0 &&
            !initialAppointments
          ) {
            try {
              const startDate = new Date(time).toISOString().split("T")[0];
              const appointmentsRes = await fetch(
                `/api/appointments?date=${startDate}&customerId=${customerId}`
              ).then((res) => res.json());

              if (!isMounted) return;

              // Set appointments if fetched
              if (appointmentsRes) {
                const transformedAppointments = (appointmentsRes || []).map(
                  (apt: any) => ({
                    _id: apt.id,
                    startTime: apt.start_time,
                    endTime: apt.end_time,
                    duration: calculateDuration(apt.start_time, apt.end_time),
                    created_at: apt.created_at,
                    _createdAt: apt.created_at, // For backward compatibility
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
                  })
                );
                setAppointments(transformedAppointments);
              }
            } catch (error) {
              console.error("Error fetching appointments:", error);
            }
          }
        } catch (error) {
          console.error("Error in appointment data fetch:", error);
          if (isMounted) {
            setCustomers([]);
          }
        }
      })();
    } else {
      setCustomers([]);
    }

    return () => {
      isMounted = false;
    };
  }, [type, form]); // Dependency array for dynamic data

  // Check for upcoming appointments in the next 2 weeks
  const checkUpcomingAppointments = async (customerId: string) => {
    try {
      const today = new Date();
      const twoWeeksFromNow = new Date(
        today.getTime() + 14 * 24 * 60 * 60 * 1000
      );

      // Use RPC get_appointments_by_14_date to fetch all appointments in 14-day window
      // This replaces the previous approach of calling API for each day
      const startDateStr = today.toISOString().split("T")[0];

      // Fetch appointments using RPC (14-day window) - single API call instead of 14 calls
      const appointmentsRes = await fetch(
        `/api/appointments?date=${startDateStr}&customerId=${customerId}&use14Day=true`
      ).then((res) => res.json());

      // Filter appointments to only include those in the 2-week range and not cancelled
      const upcomingAppointmentsRes = (appointmentsRes || [])
        .filter((apt: any) => {
          const aptDate = safeParseDate(apt.start_time || apt.startTime);
          return (
            aptDate &&
            aptDate >= today &&
            aptDate <= twoWeeksFromNow &&
            apt.status !== "cancelled"
          );
        })
        .filter((apt: any) => apt.customer && apt.employee && apt.service) // Filter out incomplete appointments
        .map((apt: any) => {
          const start = safeParseDate(apt.start_time);
          const end = safeParseDate(apt.end_time);
          const duration =
            start && end ? (end.getTime() - start.getTime()) / 1000 / 60 : 0;
          return {
            _id: apt.id,
            _createdAt: apt.created_at || new Date().toISOString(),
            startTime: apt.start_time,
            endTime: apt.end_time,
            duration: duration,
            status: apt.status || "scheduled",
            type: apt.type || "walk-in",
            note: apt.note || "",
            reminder: apt.reminder || [],
            reminderDateTimes: apt.reminder_datetime || [],
            smsMessage: "",
            customer: {
              _id: apt.customer.id,
              _type: "customer" as const,
              _createdAt: apt.created_at || new Date().toISOString(),
              _updatedAt: apt.created_at || new Date().toISOString(),
              _rev: "",
              firstName: apt.customer.firstName,
              lastName: apt.customer.lastName,
              phone: apt.customer.phone || "",
            },
            employee: {
              _id: apt.employee.id,
              _type: "employee" as const,
              _createdAt: apt.created_at || new Date().toISOString(),
              _updatedAt: apt.created_at || new Date().toISOString(),
              _rev: "",
              firstName: apt.employee.firstName,
              lastName: apt.employee.lastName,
            },
            service: {
              _id: apt.service.id,
              name: apt.service.name,
              duration: apt.service.duration,
              price: apt.service.price || 0,
              category: {
                _id: apt.service.category?.id || "",
                name: apt.service.category?.name || "",
              },
            },
            recurringGroupId: apt.recurring_group_id,
          };
        })
        .sort((a: any, b: any) => {
          const dateA = safeParseDate(a.startTime);
          const dateB = safeParseDate(b.startTime);
          if (!dateA || !dateB) return 0;
          return dateA.getTime() - dateB.getTime();
        });

      return upcomingAppointmentsRes;
    } catch (error) {
      return [];
    }
  };

  // define a submit handler
  async function onSubmit() {
    // Check for upcoming appointments before submitting
    const customerId = form.getValues("customer._ref");
    if (customerId && type === "create") {
      const upcoming = await checkUpcomingAppointments(customerId);
      if (upcoming.length > 0) {
        setUpcomingAppointments(upcoming);
        setShowUpcomingAppointmentsConfirm(true);
        return; // Don't submit yet, wait for user confirmation
      }
    }

    onSuccess?.();
  }

  // Time off submit handler
  async function onTimeOffSubmit() {
    if (!selectedEmployee) {
      toast.error("Please select an employee from the calendar first");
      return;
    }

    const timeOffData = timeOffForm.getValues();

    // Validate required fields
    if (!timeOffData.startTime) {
      toast.error("Please select a start time");
      return;
    }

    if (
      !timeOffData.duration ||
      (typeof timeOffData.duration !== "number" &&
        timeOffData.duration !== "to_close")
    ) {
      toast.error("Please select duration");
      return;
    }

    // Validate recurring fields if isRecurring is true
    if (timeOffData.isRecurring) {
      if (
        !timeOffData.recurringDuration?.value ||
        !timeOffData.recurringDuration?.unit
      ) {
        toast.error("Please set recurring duration");
        return;
      }
      if (
        !timeOffData.recurringFrequency?.value ||
        !timeOffData.recurringFrequency?.unit
      ) {
        toast.error("Please set recurring frequency");
        return;
      }
    }

    try {
      const result = await createTimeOff(timeOffData);
      if (result.status === "SUCCESS") {
        const message =
          result.count > 1
            ? `${result.count} recurring time offs scheduled successfully`
            : "Time off scheduled successfully";
        toast.success(message);
        // Reset form after successful submission
        timeOffForm.reset({
          employee: {
            _ref: selectedEmployee._id,
            _type: "reference",
          },
          startTime: "",
          duration: 30 as number,
          reason: "",
          isRecurring: false,
          recurringDuration: undefined,
          recurringFrequency: undefined,
        });
        // Refresh time off data and close dialog
        onTimeOffCreated?.();
      } else {
        toast.error("Failed to schedule time off", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Error scheduling time off", {
        description: "An unexpected error occurred",
      });
    }
  }

  // Handle cancel standing appointments
  const handleCancelStanding = async () => {
    try {
      // Get the recurringGroupId from form
      const recurringGroupId = form.getValues("recurringGroupId");
      if (!recurringGroupId) {
        toast.error("Error", {
          description: "This appointment is not part of a recurring series.",
        });
        return;
      }

      // Close the confirm dialog first
      setShowCancelStandingConfirm(false);

      // Set isSubmitting to disable buttons
      setIsSubmitting?.(true);

      const result = await cancelRecurringAppointments(recurringGroupId);

      if (result.status === "SUCCESS") {
        toast.success("Success", {
          description: "All recurring appointments cancelled successfully.",
        });
        // Set status to cancelled for current appointment
        form.setValue("status", "cancelled");
        // Then call onCancelStandingSuccess to close the main dialog
        onCancelStandingSuccess?.();
      } else {
        toast.error("Error", {
          description: result.error,
        });
        // Reset isSubmitting on error
        setIsSubmitting?.(false);
      }
    } catch (error) {
      toast.error("Error", {
        description:
          "Failed to cancel recurring appointments. Please try again.",
      });
      // Reset isSubmitting on error
      setIsSubmitting?.(false);
    }
  };

  // Handle upcoming appointments confirmation
  const handleUpcomingAppointmentsConfirm = () => {
    setShowUpcomingAppointmentsConfirm(false);
    setUpcomingAppointments([]);
    onSuccess?.(); // Proceed with appointment creation
  };

  const handleUpcomingAppointmentsCancel = () => {
    setShowUpcomingAppointmentsConfirm(false);
    setUpcomingAppointments([]);
  };

  // Show UI immediately, use skeleton loading for individual sections
  return (
    <div className="relative flex-1 w-full h-full min-h-0 flex flex-col">
      <Form {...form}>
        <form
          ref={formRef}
          onSubmit={form.handleSubmit(onSubmit)}
          className="h-full flex flex-col min-h-0"
        >
          {!showAppointmentInfo && (
            <div className="space-y-4">
              <AppointmentClientForm
                form={form}
                customers={customers}
                customerValue={customerValue}
                customerHistory={customerHistory}
                setCustomerValue={setCustomerValue}
                isSubmitting={isSubmitting}
                onCustomerCreated={refreshCustomers}
                timeOffForm={timeOffForm}
                onTimeOffSubmit={onTimeOffSubmit}
                selectedEmployee={selectedEmployee}
                type={type}
              />
            </div>
          )}
          {showAppointmentInfo && (
            <div className="space-y-4 flex-1 min-h-0 flex flex-col">
              <AppointmentInfoForm
                form={form}
                services={services}
                employees={employees}
                appointments={appointments}
                customerValue={customerValue}
                customerHistory={customerHistory}
                type={type}
                isSubmitting={isSubmitting}
                onBackToCustomer={handleBackToCustomer}
                servicesLoading={servicesLoading}
                employeesLoading={employeesLoading}
                customerNote={
                  customers.find((c) => c.value === customerValue)?.note
                }
              />
              <div className="flex justify-between pt-2">
                {type === "edit" ? (
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      type="submit"
                      onClick={() => {
                        form.setValue("status", "cancelled");
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel Appointment
                    </Button>
                    {form.getValues("recurringGroupId") && (
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setShowCancelStandingConfirm(true)}
                        disabled={isSubmitting}
                      >
                        Cancel Standing
                      </Button>
                    )}
                  </div>
                ) : null}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={type !== "edit" ? "ml-auto" : ""}
                >
                  {isSubmitting
                    ? type === "edit"
                      ? "Updating..."
                      : "Creating..."
                    : type === "edit"
                      ? "Update"
                      : "Create"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>
      <ConfirmDialog
        open={showCancelStandingConfirm}
        onOpenChange={setShowCancelStandingConfirm}
        title="Cancel Standing Appointments"
        description="Are you sure you want to cancel all recurring appointments in this series? This action cannot be undone."
        onConfirm={handleCancelStanding}
      />

      {/* Upcoming Appointments Details Modal */}
      <Dialog
        open={showUpcomingAppointmentsConfirm}
        onOpenChange={setShowUpcomingAppointmentsConfirm}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Has Upcoming Appointments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              This customer has {upcomingAppointments.length} upcoming
              appointment(s) in the next 2 weeks:
            </p>
            <div className="space-y-2">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="p-3 bg-gray-50 rounded text-sm"
                >
                  <div className="font-medium">
                    {(() => {
                      const startDate = safeParseDate(appointment.startTime);
                      if (!startDate) return "-";
                      return (
                        <>
                          {startDate.toLocaleDateString()} at{" "}
                          {startDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-gray-600">
                    {appointment.employee?.firstName}{" "}
                    {appointment.employee?.lastName} -{" "}
                    {appointment.service?.name}
                  </div>
                  {appointment.note && (
                    <div className="text-gray-500 italic">
                      "{appointment.note}"
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleUpcomingAppointmentsCancel}
              >
                Cancel
              </Button>
              <Button onClick={handleUpcomingAppointmentsConfirm}>
                Create Anyway
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
