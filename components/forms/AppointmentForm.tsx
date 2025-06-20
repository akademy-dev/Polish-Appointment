/* eslint-disable */
"use client";
import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, ChevronDownIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { cn, formatMinuteDuration } from "@/lib/utils";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { appointmentFormSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import {
  All_SERVICES_QUERY,
  APPOINTMENTS_BY_DATE_QUERY,
  ALL_CUSTOMERS_QUERY,
  ALL_EMPLOYEES_QUERY,
} from "@/sanity/lib/queries";
import { Customer, getProfileName } from "@/models/profile";
import { client } from "@/sanity/lib/client";
import { Service } from "@/models/service";
import { Appointment } from "@/models/appointment";
import { useWatch } from "react-hook-form";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppointmentFormLoading from "@/components/AppointmentFormLoading";

export const AppointmentForm = ({
  onSuccess,
  hideSubmitButton = false,
  formRef,
  form: externalForm,
  isSubmitting = false,
}: {
  onSuccess?: () => void;
  hideSubmitButton?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
  form?: UseFormReturn<z.infer<typeof appointmentFormSchema>>;
  isSubmitting?: boolean;
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
      time: "",
      note: "",
      reminder: true,
      services: [],
    },
  });

  const form = externalForm || internalForm;

  const [open, setOpen] = useState(false);

  // Helper to parse time string to Date, time, and AM/PM
  const parseTimeString = (timeString: string) => {
    if (!timeString) return { date: undefined, time: "", ampm: "AM" };
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return { date: undefined, time: "", ampm: "AM" };
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const ampmValue = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const time = `${displayHours.toString().padStart(2, "0")}:${minutes}:${seconds}`;
    return { date, time, ampm: ampmValue };
  };

  // Get initial values
  const {
    date: initialDate,
    time: initialTime,
    ampm: initialAmpm,
  } = parseTimeString(form.getValues("time"));

  // Local state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate,
  );
  const [selectedTime, setSelectedTime] = useState<string>(initialTime);
  const [selectedAmpm, setSelectedAmpm] = useState<"AM" | "PM">(
    initialAmpm as "AM" | "PM",
  );

  // Update form's time field
  const updateFormTime = (
    date: Date | undefined,
    time: string,
    ampm: "AM" | "PM",
  ) => {
    if (date && time) {
      let [hours, minutes, seconds] = time.split(":").map(Number);
      // Adjust hours for AM/PM
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      const combinedDate = new Date(date);
      combinedDate.setHours(hours, minutes, seconds || 0);
      form.setValue("time", combinedDate.toISOString());
    } else {
      form.setValue("time", "");
    }
  };

  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [customerHistory, setCustomerHistory] = React.useState<Appointment[]>(
    [],
  );
  const [selectedOrder, setSelectedOrder] = React.useState<string[]>([]);

  const [customerOpen, setCustomerOpen] = React.useState(false);
  const [customerValue, setCustomerValue] = React.useState<string>("");

  const [employeeOpen, setEmployeeOpen] = React.useState(false);
  const [employeeValue, setEmployeeValue] = React.useState<string>("");

  const [services, setServices] = React.useState<Service[]>([]);

  const [customers, setCustomers] = React.useState<
    (Customer & { value: string; label: string })[]
  >([]);

  const [employees, setEmployees] = React.useState<
    { value: string; label: string }[]
  >([]);

  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      // Fetch customers
      const customersRes = await client.fetch(ALL_CUSTOMERS_QUERY, {
        search: null,
      });
      setCustomers(
        customersRes.map((customer: Customer) => ({
          ...customer,
          value: customer._id,
          label: getProfileName(customer),
        })),
      );
      // Set customer if needed
      const customerRef = form.getValues("customer._ref");
      if (customerRef) {
        const selectedCustomer = customersRes.find(
          (customer: Customer) => customer._id === customerRef,
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

      // Fetch employees
      const employeesRes = await client.fetch(ALL_EMPLOYEES_QUERY, {
        search: null,
      });
      const employeeList = employeesRes.map((employee: any) => ({
        value: employee._id,
        label: getProfileName(employee),
      }));
      setEmployees(employeeList);

      const employeeRef = form.getValues("employee._ref");
      if (employeeRef) {
        const selectedEmployee = employeeList.find(
          (employee: { value: string; label: string }) =>
            employee.value === employeeRef,
        );
        if (selectedEmployee && employeeValue !== selectedEmployee.value) {
          setEmployeeValue(selectedEmployee.value);
        }
      }

      // Fetch services
      const servicesRes = await client.fetch(All_SERVICES_QUERY);
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
      setSelectedOrder(selectedServices.map((service: Service) => service._id));

      // Fetch appointments if needed
      if (form.getValues("customer._ref") && form.getValues("time")) {
        const customerId = form.getValues("customer._ref");
        const time = form.getValues("time");
        const customerHistoryRes = await client.fetch(
          APPOINTMENTS_BY_DATE_QUERY,
          {
            date: null,
            customerId,
          },
        );
        setCustomerHistory(
          customerHistoryRes.map((appointment: Appointment) => ({
            ...appointment,
            startTime: new Date(appointment.startTime),
            endTime: new Date(appointment.endTime),
          })),
        );
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

  // define a submit handler
  function onSubmit() {
    onSuccess?.();
  }

  const hasClientError = !!form.formState.errors.customer;

  if (loading) {
    return <AppointmentFormLoading />;
  }
  return (
    <>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full ">
          <TabsTrigger value="client">Client</TabsTrigger>
          <TabsTrigger value="appointment">Appointment</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="relative flex-1 ">
        <Form {...form}>
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)}>
            {tab === "client" && (
              <div>
                {/* Client tab content */}
                <div className="flex flex-between justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Information</h2>
                  <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerOpen}
                        className="w-[250px] justify-between"
                      >
                        {customerValue
                          ? customers.find(
                              (customer) => customer.value === customerValue,
                            )?.label
                          : "Search customer..."}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0 ">
                      <Command
                        filter={(value, search) => {
                          const customer = customers.find(
                            (c) => c.value === value,
                          );
                          return customer?.label
                            .toLowerCase()
                            .includes(search.toLowerCase())
                            ? 1
                            : 0;
                        }}
                      >
                        <CommandInput
                          placeholder="Search customer..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No customer found.</CommandEmpty>
                          <CommandGroup>
                            {customers.map((customer: any) => (
                              <CommandItem
                                key={customer.value}
                                value={customer.value}
                                onSelect={(currentValue) => {
                                  const newValue =
                                    currentValue === customerValue
                                      ? ""
                                      : currentValue;
                                  setCustomerValue(newValue);
                                  setCustomerOpen(false);

                                  const selected = customers.find(
                                    (c) => c.value === newValue,
                                  );
                                  if (selected) {
                                    form.setValue("customer", {
                                      firstName: selected.firstName ?? "",
                                      lastName: selected.lastName ?? "",
                                      phone: selected.phone ?? "",
                                      _ref: selected._id,
                                      _type: "reference",
                                    });
                                  } else {
                                    form.reset({
                                      ...form.getValues(),
                                      customer: {
                                        firstName: "",
                                        lastName: "",
                                        phone: "",
                                        _ref: "",
                                        _type: "reference",
                                      },
                                    });
                                  }
                                }}
                              >
                                {customer.label}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    customerValue === customer.value
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-2">
                  <FormField
                    control={form.control}
                    name="customer.firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-start gap-4">
                            <Label
                              htmlFor="firstName"
                              className="whitespace-nowrap flex items-center pt-1 text-md min-w-[120px] text-right"
                            >
                              First Name
                            </Label>
                            <div className="flex flex-col gap-1">
                              <Input
                                type="text"
                                id="firstName"
                                placeholder="First Name"
                                className="w-m"
                                {...field}
                                disabled={!!form.getValues("customer._ref")}
                              />
                              <FormMessage className="pl-1" />
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customer.lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-start gap-4">
                            <Label
                              htmlFor="lastName"
                              className="whitespace-nowrap flex items-center pt-1 text-md min-w-[120px] text-right"
                            >
                              Last Name
                            </Label>
                            <div className="flex flex-col gap-1">
                              <Input
                                type="text"
                                id="lastName"
                                placeholder="Last Name"
                                className="w-m"
                                {...field}
                                disabled={!!form.getValues("customer._ref")}
                              />
                              <FormMessage className=" pl-1" />
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customer.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-start gap-4">
                            <Label
                              htmlFor="phone"
                              className="whitespace-nowrap flex items-center pt-1 text-md min-w-[120px] text-right"
                            >
                              Phone Number
                            </Label>
                            <div className="flex flex-col gap-1">
                              <Input
                                type="text"
                                id="phone"
                                placeholder="Phone Number"
                                className="w-m"
                                {...field}
                                disabled={!!form.getValues("customer._ref")}
                              />
                              <FormMessage className=" pl-1" />
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <DataTable
                  key={customerHistory.length}
                  columns={[
                    {
                      accessorKey: "service",
                      header: "Service",
                      cell: ({ row }) => {
                        const service = services.find(
                          (s) => s._id === row.original.service?._id,
                        );
                        return (
                          <div>
                            {service ? service.name : "Unknown Service"}
                          </div>
                        );
                      },
                    },
                    {
                      accessorKey: "staff",
                      header: "Staff",
                      // find the employee by _ref
                      cell: ({ row }) => {
                        const employee = employees.find(
                          (e) => e.value === row.original.employee?._id,
                        );
                        return (
                          <div>
                            {employee ? employee.label : "Unknown Staff"}
                          </div>
                        );
                      },
                    },
                    {
                      accessorKey: "duration",
                      header: ({ column }) => (
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                          }
                        >
                          Duration
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      ),
                      cell: ({ row }) => (
                        <div>
                          {formatMinuteDuration(row.original.duration || 0)}
                        </div>
                      ),
                    },
                    {
                      accessorKey: "date",
                      header: ({ column }) => {
                        return (
                          <Button
                            variant="ghost"
                            onClick={() =>
                              column.toggleSorting(
                                column.getIsSorted() === "asc",
                              )
                            }
                          >
                            Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        );
                      },
                      cell: ({ row }) => {
                        return (
                          <div>
                            {format(
                              new Date(row.original.startTime),
                              "MM/dd/yyyy",
                            )}
                          </div>
                        );
                      },
                    },
                  ]}
                  data={customerHistory}
                  height={hasClientError ? "200px" : "250px"}
                  titleEmpty="No service history available."
                  searchColumn="service"
                  isShowPagination={false}
                />
              </div>
            )}
            {tab === "appointment" && (
              <div>
                <h2 className="text-lg font-semibold">Information</h2>
                <div className="flex flex-col gap-2">
                  <FormField
                    control={form.control}
                    name="time"
                    render={() => (
                      <FormItem className="flex flex-col">
                        <div className="flex gap-4">
                          {/* Date Input */}
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="date" className="px-1 text-md">
                              Date
                            </Label>
                            <Popover open={open} onOpenChange={setOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  id="date"
                                  className={cn(
                                    "w-32 justify-between font-normal",
                                    !selectedDate && "text-muted-foreground",
                                  )}
                                >
                                  {selectedDate
                                    ? selectedDate.toLocaleDateString()
                                    : "Select date"}
                                  <ChevronDownIcon />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto overflow-hidden p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  captionLayout="dropdown"
                                  onSelect={(date) => {
                                    setSelectedDate(date);
                                    updateFormTime(
                                      date,
                                      selectedTime,
                                      selectedAmpm,
                                    );
                                    setOpen(false);
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          {/* Time Input */}
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="time" className="px-1 text-md">
                              Time
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="time"
                                id="time"
                                step="60"
                                value={selectedTime || "08:00"}
                                onChange={(e) => {
                                  const newTime = e.target.value;
                                  setSelectedTime(newTime);
                                  updateFormTime(
                                    selectedDate,
                                    newTime,
                                    selectedAmpm,
                                  );
                                }}
                                className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden"
                              />
                              <Select
                                value={selectedAmpm}
                                onValueChange={(value: "AM" | "PM") => {
                                  setSelectedAmpm(value);
                                  updateFormTime(
                                    selectedDate,
                                    selectedTime,
                                    value,
                                  );
                                }}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue placeholder="AM/PM" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AM">AM</SelectItem>
                                  <SelectItem value="PM">PM</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employee._ref"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start">
                          <Label
                            htmlFor="employee"
                            className="whitespace-nowrap flex items-center pt-1 text-md min-w-[50px] text-right"
                          >
                            Staff
                          </Label>
                          <div className="flex flex-col gap-1">
                            <Popover
                              open={employeeOpen}
                              onOpenChange={setEmployeeOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={employeeOpen}
                                  className="w-2xs text-left font-normal ml-4 justify-between"
                                  id="employee"
                                  type="button"
                                >
                                  {employeeValue
                                    ? employees.find(
                                        (employee) =>
                                          employee.value === employeeValue,
                                      )?.label
                                    : "Search staff..."}
                                  <ChevronsUpDown className="opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-2xs p-0 ">
                                <Command
                                  filter={(value, search) => {
                                    const employee = employees.find(
                                      (c) => c.value === value,
                                    );
                                    return employee?.label
                                      .toLowerCase()
                                      .includes(search.toLowerCase())
                                      ? 1
                                      : 0;
                                  }}
                                >
                                  <CommandInput
                                    placeholder="Search staff..."
                                    className="h-9"
                                  />
                                  <CommandList>
                                    <CommandEmpty>No staff found.</CommandEmpty>
                                    <CommandGroup>
                                      {employees.map((employee: any) => (
                                        <CommandItem
                                          key={employee.value}
                                          value={employee.value}
                                          onSelect={(currentValue) => {
                                            const newValue =
                                              currentValue === employeeValue
                                                ? ""
                                                : currentValue;
                                            setEmployeeValue(newValue);
                                            setEmployeeOpen(false);
                                            field.onChange(newValue); // update employee._ref
                                            form.setValue(
                                              "employee._type",
                                              "reference",
                                            );
                                          }}
                                        >
                                          {employee.label}
                                          <Check
                                            className={cn(
                                              "ml-auto",
                                              employeeValue === employee.value
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage className="ml-4" />
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start">
                          <Label
                            htmlFor="note"
                            className="whitespace-nowrap text-md flex items-center pt-1"
                          >
                            Appointment Note
                          </Label>
                          <div className="flex flex-col gap-1">
                            <FormControl>
                              <Input
                                type="text"
                                id="note"
                                autoComplete="off"
                                className="w-2xs ml-4"
                                {...field}
                              />
                            </FormControl>
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reminder"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center">
                        <FormControl>
                          <Checkbox
                            id="reminder"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <label
                          htmlFor="reminder"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          SMS Reminder
                        </label>
                      </FormItem>
                    )}
                  />
                </div>
                {appointments.length > 0 ? (
                  <DataTable
                    columns={[
                      {
                        accessorKey: "customer",
                        header: "Customer",
                        cell: ({ row }: { row: any }) => {
                          const customer = customers.find(
                            (c) => c.value === row.original.customer._id,
                          );
                          return (
                            <div>
                              {customer
                                ? `${customer.firstName} ${customer.lastName}`
                                : "Unknown"}
                            </div>
                          );
                        },
                      },
                      {
                        accessorKey: "employee",
                        header: "Staff",
                        cell: ({ row }: { row: any }) => {
                          const employee = employees.find(
                            (e) => e.value === row.original.employee._id,
                          );
                          return (
                            <div>{employee ? employee.label : "Unknown"}</div>
                          );
                        },
                      },
                      {
                        accessorKey: "service",
                        header: "Service",
                        cell: ({ row }: { row: any }) => {
                          const service = services.find(
                            (s) => s._id === row.original.service._id,
                          );
                          return (
                            <div>{service ? service.name : "Unknown"}</div>
                          );
                        },
                      },
                      {
                        accessorKey: "duration",
                        header: ({ column }: { column: any }) => (
                          <Button
                            variant="ghost"
                            type="button"
                            onClick={() =>
                              column.toggleSorting(
                                column.getIsSorted() === "asc",
                              )
                            }
                          >
                            Duration
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        ),
                        cell: ({ row }: { row: any }) => (
                          <div>
                            {formatMinuteDuration(row.original.duration || 0)}
                          </div>
                        ),
                      },
                      {
                        accessorKey: "startTime",
                        header: ({ column }: { column: any }) => (
                          <Button
                            variant="ghost"
                            type="button"
                            onClick={() =>
                              column.toggleSorting(
                                column.getIsSorted() === "asc",
                              )
                            }
                          >
                            Start Time
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        ),
                        cell: ({ row }: { row: any }) => (
                          <div>
                            {format(
                              new Date(row.original.startTime),
                              "dd/MM/yyyy HH:mm",
                            )}
                          </div>
                        ),
                      },
                      {
                        accessorKey: "endTime",
                        header: ({ column }: { column: any }) => (
                          <Button
                            variant="ghost"
                            type="button"
                            onClick={() =>
                              column.toggleSorting(
                                column.getIsSorted() === "asc",
                              )
                            }
                          >
                            End Time
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        ),
                        cell: ({ row }: { row: any }) => (
                          <div>
                            {format(
                              new Date(row.original.endTime),
                              "dd/MM/yyyy HH:mm",
                            )}
                          </div>
                        ),
                      },
                    ]}
                    data={appointments}
                    height={hasClientError ? "200px" : "250px"}
                    searchColumn="service"
                    isShowPagination={false}
                    getRowId={(row: any) => row._id}
                  />
                ) : (
                  <>
                    <DataTable
                      columns={[
                        {
                          id: "select",
                          header: () => null,
                          cell: ({ row }: { row: any }) => {
                            // Helper to get ordinal suffix
                            const getOrdinal = (n: number) => {
                              if (n % 10 === 1 && n % 100 !== 11)
                                return `${n}st`;
                              if (n % 10 === 2 && n % 100 !== 12)
                                return `${n}nd`;
                              if (n % 10 === 3 && n % 100 !== 13)
                                return `${n}rd`;
                              return `${n}th`;
                            };
                            const isChecked = selectedOrder.includes(row.id);
                            const idx = selectedOrder.indexOf(row.id);
                            return (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(value) => {
                                    setSelectedOrder((prev) => {
                                      if (value) {
                                        if (!prev.includes(row.id)) {
                                          const currentServices =
                                            form.getValues("services") || [];
                                          const exists = currentServices.some(
                                            (s: any) =>
                                              s._ref === row.original._id,
                                          );
                                          if (!exists) {
                                            const newServiceRef = {
                                              _ref: row.original._id,
                                              _type: "reference",
                                              duration:
                                                row.original.duration || 0,
                                            };
                                            form.setValue("services", [
                                              ...currentServices,
                                              newServiceRef,
                                            ]);
                                          }
                                          return [...prev, row.id];
                                        }
                                        return prev;
                                      } else {
                                        const currentServices =
                                          form.getValues("services") || [];
                                        form.setValue(
                                          "services",
                                          currentServices.filter(
                                            (s: any) =>
                                              s._ref !== row.original._id,
                                          ),
                                        );
                                        return prev.filter(
                                          (id) => id !== row.id,
                                        );
                                      }
                                    });
                                  }}
                                  aria-label="Select row"
                                />
                                {isChecked && idx !== -1 && (
                                  <span className="text-xs text-muted-foreground">
                                    {getOrdinal(idx + 1)}
                                  </span>
                                )}
                              </div>
                            );
                          },
                          enableSorting: false,
                          enableHiding: false,
                        },
                        {
                          accessorKey: "category.name",
                          header: "Type",
                        },
                        {
                          accessorKey: "name",
                          header: "Name",
                        },
                        {
                          accessorKey: "price",
                          header: ({ column }: { column: any }) => (
                            <Button
                              variant="ghost"
                              type="button"
                              onClick={() =>
                                column.toggleSorting(
                                  column.getIsSorted() === "asc",
                                )
                              }
                            >
                              Cost
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          ),
                        },
                        {
                          accessorKey: "duration",
                          header: ({ column }: { column: any }) => (
                            <Button
                              variant="ghost"
                              type="button"
                              onClick={() =>
                                column.toggleSorting(
                                  column.getIsSorted() === "asc",
                                )
                              }
                            >
                              Duration
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          ),
                          cell: ({ row }: { row: any }) => (
                            <div>
                              {formatMinuteDuration(row.original.duration || 0)}
                            </div>
                          ),
                        },
                      ]}
                      data={services}
                      height={hasClientError ? "200px" : "250px"}
                      searchColumn="name"
                      isShowPagination={false}
                      getRowId={(row: any) => row._id}
                    />
                    {form.formState.errors.services && (
                      <FormMessage>
                        {form.formState.errors.services.message}
                      </FormMessage>
                    )}
                  </>
                )}
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
};
