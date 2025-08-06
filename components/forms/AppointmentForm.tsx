/* eslint-disable */
"use client";
import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

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
}: {
  onSuccess?: () => void;
  hideSubmitButton?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
  form?: UseFormReturn<z.infer<typeof appointmentFormSchema>>;
  isSubmitting?: boolean;
  type: "create" | "edit";
}) => {
  const [tab, setTab] = React.useState("client");
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
      smsMessage: "",
    },
  });
  const form = externalForm || internalForm;

  const clientTabErrors = form.formState.errors.customer;

  const appointmentTabErrors =
    form.formState.errors.employee ||
    form.formState.errors.time ||
    form.formState.errors.services ||
    form.formState.errors.note ||
    form.formState.errors.reminder ||
    form.formState.errors.smsMessage;

  const [services, setServices] = React.useState<Service[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [employees, setEmployees] = React.useState<
    { value: string; label: string }[]
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

  const customerRef = useWatch({
    control: form.control,
    name: "customer._ref",
  });

  React.useEffect(() => {
    async function fetchCustomerHistory() {
      if (customerRef) {
        const customerHistoryRes = await client.fetch(
          APPOINTMENTS_BY_DATE_QUERY,
          { date: null, customerId: customerRef },
        );
        const mappedData = customerHistoryRes.map(
          (appointment: Appointment) => {
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
          },
        );
        setCustomerHistory([...mappedData]); // always new reference
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

      // Fetch employees
      const employeesRes = await client.fetch(ALL_EMPLOYEES_QUERY, {
        search: null,
      });
      const employeeList = employeesRes.map((employee: any) => ({
        value: employee._id,
        label: getProfileName(employee),
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
    onSuccess?.();
  }

  if (loading) {
    return <AppointmentFormLoading />;
  }
  return (
    <>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full ">
          <TabsTrigger
            value="client"
            className={cn(
              "relative",
              clientTabErrors &&
                "text-red-700 data-[state=active]:text-red-800 data-[state=active]:bg-red-50 border-red-200",
            )}
            disabled={isSubmitting}
          >
            Client
            {clientTabErrors && (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
          </TabsTrigger>
          <TabsTrigger
            value="appointment"
            className={cn(
              "relative",
              appointmentTabErrors &&
                "text-red-700 data-[state=active]:text-red-800 data-[state=active]:bg-red-50 border-red-200",
            )}
            disabled={isSubmitting}
          >
            Appointment
            {appointmentTabErrors && (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="relative flex-1">
        <Form {...form}>
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)}>
            {tab === "client" && (
              <AppointmentClientForm
                form={form}
                customers={customers}
                customerValue={customerValue}
                customerHistory={customerHistory}
                setCustomerValue={setCustomerValue}
                isSubmitting={isSubmitting}
              />
            )}
            {tab === "appointment" && (
              <AppointmentInfoForm
                form={form}
                services={services}
                employees={employees}
                appointments={appointments}
                type={type}
                isSubmitting={isSubmitting}
              />
            )}
            <div className="flex justify-between pt-2">
              {type === "edit" ? (
                <Button
                  variant="destructive"
                  type="submit"
                  onClick={() => {
                    form.setValue("status", "cancelled");
                  }}
                >
                  Cancel Appointment
                </Button>
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
          </form>
        </Form>
      </div>
    </>
  );
};
