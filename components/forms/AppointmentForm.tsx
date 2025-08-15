/* eslint-disable */
"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { useForm, UseFormReturn, useWatch } from "react-hook-form";
import { z } from "zod";
import { appointmentFormSchema } from "@/lib/validation";
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
}: {
  onSuccess?: () => void;
  hideSubmitButton?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
  form?: UseFormReturn<z.infer<typeof appointmentFormSchema>>;
  isSubmitting?: boolean;
  type: "create" | "edit";
  appointmentId?: string;
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

  // Watch form state for debugging
  React.useEffect(() => {
    console.log("Form state changed:", {
      values: form.getValues(),
      errors: form.formState.errors,
      isValid: form.formState.isValid,
      isDirty: form.formState.isDirty,
    });
  }, [form.formState]);

  // Watch services specifically
  const watchedServices = useWatch({
    control: form.control,
    name: "services",
  });

  React.useEffect(() => {
    console.log("Services changed:", watchedServices);
  }, [watchedServices]);

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

  const customerPhone = useWatch({
    control: form.control,
    name: "customer.phone",
  });

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
        setAppointments([...appointmentsRes]);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  // define a submit handler
  function onSubmit() {
    console.log("Form submitted with values:", form.getValues());
    console.log("Form errors:", form.formState.errors);
    console.log("Form is valid:", form.formState.isValid);
    onSuccess?.();
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

      const result = await cancelRecurringAppointments(recurringGroupId);

      if (result.status === "SUCCESS") {
        toast.success("Success", {
          description: "All recurring appointments cancelled successfully.",
        });
        onSuccess?.();
      } else {
        toast.error("Error", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Error", {
        description:
          "Failed to cancel recurring appointments. Please try again.",
      });
    }
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
                    >
                      Cancel Appointment
                    </Button>
                    {form.getValues("recurringGroupId") && (
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setShowCancelStandingConfirm(true)}
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
    </div>
  );
};
