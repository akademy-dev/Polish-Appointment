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
import {
  ALL_CUSTOMERS_QUERY,
  ALL_EMPLOYEES_QUERY,
  ALL_SERVICES_QUERY,
  APPOINTMENTS_BY_DATE_QUERY,
} from "@/sanity/lib/queries";
import { client } from "@/sanity/lib/client";
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

const intervals: number[] = [];
for (let min = 15; min <= 240; min += 15) {
  intervals.push(min);
}

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
}) => {
  const [showAppointmentInfo, setShowAppointmentInfo] = React.useState(
    type === "edit",
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
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
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
    }[]
  >([]);
  const [customerHistory, setCustomerHistory] = React.useState<Appointment[]>(
    [],
  );

  const [loading, setLoading] = React.useState(true);
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
      const currentRecurringDuration = timeOffForm.getValues("recurringDuration");
      const currentRecurringFrequency = timeOffForm.getValues("recurringFrequency");

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

  React.useEffect(() => {
    async function fetchCustomerHistory() {
      if (customerRef) {
        const customerHistoryRes = await client.fetch(
          APPOINTMENTS_BY_DATE_QUERY,
          { date: null, customerId: customerRef },
        );
        // Filter out cancelled appointments and map data
        const filteredAndMappedData = customerHistoryRes
          .filter(
            (appointment: Appointment) => appointment.status !== "cancelled",
          )
          .map((appointment: Appointment) => {
            const start = new Date(appointment.startTime);
            const end = new Date(appointment.endTime);
            const duration = (end.getTime() - start.getTime()) / 1000 / 60;
            return {
              service: appointment.service,
              customer: appointment.customer,
              employee: appointment.employee,
              startTime: start.toISOString(),
              duration,
            };
          });
        setCustomerHistory([...filteredAndMappedData]); // always new reference
      } else {
        setCustomerHistory([]); // also a new reference
      }
    }

    fetchCustomerHistory();
  }, [customerRef]);

  const [customerValue, setCustomerValue] = React.useState<string>("");

  // Set customer if needed
  if (customerRef) {
    const selectedCustomer = customers.find(
      (customer) => customer._id === customerRef,
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
    const customersRes = await client.fetch(ALL_CUSTOMERS_QUERY, {
      search: null,
    });
    setCustomers(
      customersRes.map((customer: Customer) => ({
        _id: customer._id,
        value: customer._id,
        label: getProfileName(customer),
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
      })),
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

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch customers
      const customersRes = await client.fetch(ALL_CUSTOMERS_QUERY, {
        search: null,
      });
      setCustomers(
        customersRes.map((customer: Customer) => ({
          _id: customer._id,
          value: customer._id,
          label: getProfileName(customer),
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
        })),
      );

      // Fetch services
      const servicesRes = await client.fetch(ALL_SERVICES_QUERY);
      setServices(servicesRes);

      // Only reset services if not in edit mode and services are empty
      if (type !== "edit") {
        const serviceRefs = form
          .getValues("services")
          .map((service: { _ref: string }) => service._ref);
        const selectedServices = servicesRes.filter((service: Service) =>
          serviceRefs.includes(service._id),
        );
        form.setValue(
          "services",
          selectedServices.map((service: Service) => ({
            _ref: service._id,
            _type: "reference",
            duration: service.duration,
          })),
        );
      }

      // Fetch employees
      const employeesRes = await client.fetch(ALL_EMPLOYEES_QUERY, {
        search: null,
      });
      const employeeList = employeesRes.map((employee: any) => ({
        value: employee._id,
        label: getProfileName(employee),
        assignedServices: employee.assignedServices || [],
      }));
      setEmployees(employeeList);

      // Fetch appointments if needed
      if (
        form.getValues("customer._ref") &&
        form.getValues("time") &&
        type === "edit"
      ) {
        const customerId = form.getValues("customer._ref");
        const time = form.getValues("time");
        const startDate = new Date(time).toISOString().split("T")[0];
        const appointmentsRes = await client.fetch(APPOINTMENTS_BY_DATE_QUERY, {
          date: startDate,
          customerId,
        });
        console.log("Appointments fetched:", appointmentsRes);
        setAppointments([...appointmentsRes]);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  // Check for upcoming appointments in the next 2 weeks
  const checkUpcomingAppointments = async (customerId: string) => {
    try {
      const today = new Date();
      const twoWeeksFromNow = new Date(
        today.getTime() + 14 * 24 * 60 * 60 * 1000,
      );

      // Fetch appointments for the next 2 weeks
      const upcomingAppointmentsRes = await client.fetch(
        `
        *[_type == "appointment" && 
          customer._ref == $customerId && 
          startTime >= $startDate && 
          startTime <= $endDate &&
          status != "cancelled"
        ] | order(startTime asc) {
          _id,
          startTime,
          endTime,
          status,
          type,
          note,
          customer->{
            _id,
            firstName,
            lastName,
            phone
          },
          employee->{
            _id,
            firstName,
            lastName
          },
          service->{
            _id,
            name,
            duration,
            price
          }
        }
      `,
        {
          customerId,
          startDate: today.toISOString(),
          endDate: twoWeeksFromNow.toISOString(),
        },
      );

      return upcomingAppointmentsRes;
    } catch (error) {
      console.error("Error checking upcoming appointments:", error);
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
    
    if (!timeOffData.duration || 
        (typeof timeOffData.duration !== "number" && timeOffData.duration !== "to_close")) {
      toast.error("Please select duration");
      return;
    }

    // Validate recurring fields if isRecurring is true
    if (timeOffData.isRecurring) {
      if (!timeOffData.recurringDuration?.value || !timeOffData.recurringDuration?.unit) {
        toast.error("Please set recurring duration");
        return;
      }
      if (!timeOffData.recurringFrequency?.value || !timeOffData.recurringFrequency?.unit) {
        toast.error("Please set recurring frequency");
        return;
      }
    }

    console.log("Time Off Data:", timeOffData);
    try {
      const result = await createTimeOff(timeOffData);
      if (result.status === "SUCCESS") {
        const message = result.count > 1 
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
      console.error("Error creating time off:", error);
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

  if (loading) {
    return <AppointmentFormLoading />;
  }
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
                    {new Date(appointment.startTime).toLocaleDateString()} at{" "}
                    {new Date(appointment.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
