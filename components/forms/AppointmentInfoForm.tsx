/* eslint-disable */

import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { appointmentFormSchema } from "@/lib/validation";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatMinuteDuration } from "@/lib/utils";
import { ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import DataTable from "@/components/DataTable";
import { format } from "date-fns";
import * as React from "react";
import { useContext, useMemo } from "react";
import { Appointment } from "@/models/appointment";
import { Service } from "@/models/service";
import { CalendarContext } from "@/hooks/context";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import FormButton from "@/components/FormButton";

const intervals: number[] = [];
for (let min = 15; min <= 240; min += 15) {
  intervals.push(min);
}

const AppointmentInfoForm = ({
  form,
  services = [],
  employees = [],
  appointments = [],
  type,
  customerValue,
  customerHistory,
  isSubmitting,
  onBackToCustomer,
}: {
  form: UseFormReturn<z.infer<typeof appointmentFormSchema>>;
  services: Service[];
  employees: {
    value: string;
    label: string;
    assignedServices?: Array<{
      serviceId: string;
      price: number;
      duration: number;
      processTime: number;
      showOnline: boolean;
    }>;
  }[];
  appointments: Appointment[];
  type: "create" | "edit";
  customerValue: string;
  customerHistory: Appointment[];
  isSubmitting: boolean;
  onBackToCustomer?: () => void;
}) => {
  const { timezone } = useContext(CalendarContext);

  const REMINDER_OPTIONS = [
    { label: "1hr", value: "1h" },
    { label: "2hr", value: "2h" },
    { label: "12hr", value: "12h" },
    { label: "24hr", value: "24h" },
    { label: "2d", value: "2d" },
  ];

  const formatDuration = useMemo(() => {
    return (min: number): string => {
      const hr = Math.floor(min / 60);
      const m = min % 60;
      if (hr && m) return `${hr}hr ${m}min`;
      if (hr) return `${hr}hr`;
      return `${m}min`;
    };
  }, []);

  const [employeeValue, setEmployeeValue] = React.useState<string>("");

  const [selectedOrder, setSelectedOrder] = React.useState<string[]>([]);

  const employeeRef = form.getValues("employee._ref");
  if (employeeRef) {
    const selectedEmployee = employees.find(
      (employee: { value: string; label: string }) =>
        employee.value === employeeRef,
    );
    if (selectedEmployee && employeeValue !== selectedEmployee.value) {
      console.log("Setting employee value:", selectedEmployee.value, "Type:", type);
      setEmployeeValue(selectedEmployee.value);
    }
  }

  const watchedServices = form.watch("services") || [];

  // Filter out cancelled appointments
  const filteredAppointments = useMemo(() => {
    const filtered = appointments.filter((appointment) => appointment.status !== "cancelled");
    console.log("Original appointments:", appointments.length, "Filtered appointments:", filtered.length);
    return filtered;
  }, [appointments]);

  // Ensure default values for recurring fields are set
  React.useEffect(() => {
    const currentRecurringDuration = form.getValues("recurringDuration");
    const currentRecurringFrequency = form.getValues("recurringFrequency");

    if (!currentRecurringDuration || !currentRecurringDuration.unit) {
      form.setValue("recurringDuration", {
        value: currentRecurringDuration?.value || 1,
        unit: "months",
      });
    }

    if (!currentRecurringFrequency || !currentRecurringFrequency.unit) {
      form.setValue("recurringFrequency", {
        value: currentRecurringFrequency?.value || 1,
        unit: "weeks",
      });
    }
  }, [form]);

  // Clear selected services when employee changes (only in create mode)
  React.useEffect(() => {
    if (employeeValue && type === "create") {
      const selectedEmployee = employees.find(
        (emp) => emp.value === employeeValue,
      );
      if (selectedEmployee && selectedEmployee.assignedServices) {
        // Clear current services selection when employee changes
        console.log("Clearing services due to employee change in create mode");
        form.setValue("services", []);
        setSelectedOrder([]);
      }
    }
  }, [employeeValue, employees, form, type]);

  const tableData = useMemo(() => {
    // Get the selected employee
    const selectedEmployee = employees.find(
      (emp) => emp.value === employeeValue,
    );

    if (!selectedEmployee || !selectedEmployee.assignedServices) {
      return [];
    }

    // Filter services based on assignedServices of the selected employee that have showOnline: true
    const assignedServiceIds = selectedEmployee.assignedServices
      .filter((as) => as.showOnline === true)
      .map((as) => as.serviceId);
    const filteredServices = services.filter((service) =>
      assignedServiceIds.includes(service._id),
    );

    return filteredServices.map((service) => {
      const selectedService = watchedServices.find(
        (s: any) => s._ref === service._id,
      );

      // Get assigned service data for this service
      const assignedService = selectedEmployee.assignedServices?.find(
        (as) => as.serviceId === service._id,
      );

      return {
        ...service,
        // Use assigned service processTime if available, otherwise use service duration
        duration: selectedService
          ? selectedService.duration
          : assignedService?.processTime || service.duration,
        // Use assigned service price if available, otherwise use service price
        price: assignedService?.price || service.price,
        quantity: 1,
      };
    });
  }, [services, watchedServices, employeeValue, employees]);

  return (
    <div className="flex flex-col h-full min-h-0 flex-1">
      <div className="flex gap-6 w-full flex-1 min-h-0 overflow-hidden">
        <div className="w-1/3 flex flex-col gap-4">
          <div className="flex flex-col ">
            <span className="text-xl font-semibold text-primary">
              {form.getValues("customer.firstName")}{" "}
              {form.getValues("customer.lastName")}
            </span>

            <span className="text-lg">{form.getValues("customer.phone")}</span>
          </div>

          <FormButton
            mode="history"
            type="customers"
            profile={{
              _id: customerValue,
              _type: "customer",
              _createdAt: new Date().toISOString(),
              _updatedAt: new Date().toISOString(),
              _rev: "",
              firstName: form.getValues("customer.firstName"),
              lastName: form.getValues("customer.lastName"),
              phone: form.getValues("customer.phone"),
            }}
            variant="outline"
            className="w-fit"
          >
            Client History
          </FormButton>

          {type === "create" && (
            <Button
              onClick={onBackToCustomer}
              variant="outline"
              className="w-fit"
            >
              Choose another Client
            </Button>
          )}
        </div>

        <div className="w-px bg-black self-stretch "></div>

        <div className="flex flex-col gap-2 w-2/3 flex-1 min-h-0">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start">
                  <Label
                    htmlFor="type"
                    className="whitespace-nowrap text-md flex items-center pt-1"
                  >
                    Type
                  </Label>
                  <div className="flex flex-col gap-1">
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className=" ml-4">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent defaultValue="walk-in">
                          <SelectItem value="walk-in">Walk In</SelectItem>
                          <SelectItem value="request">Request</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </div>
                </div>
                <FormMessage />
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
                        disabled={isSubmitting}
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
              <FormItem className="flex flex-row gap-2">
                <Label
                  htmlFor="note"
                  className="whitespace-nowrap text-md flex items-center pt-1"
                >
                  SMS Reminder
                </Label>
                <div className="flex flex-row gap-4">
                  {REMINDER_OPTIONS.map((option) => (
                    <FormControl key={option.value}>
                      <label className="flex items-center gap-2">
                        <Checkbox
                          disabled={isSubmitting}
                          checked={
                            Array.isArray(field.value) &&
                            field.value.includes(option.value)
                          }
                          onCheckedChange={(checked) => {
                            const current = Array.isArray(field.value)
                              ? field.value
                              : [];
                            if (checked) {
                              field.onChange([...current, option.value]);
                            } else {
                              field.onChange(
                                current.filter(
                                  (v: string) => v !== option.value,
                                ),
                              );
                            }
                          }}
                        />
                        {option.label}
                      </label>
                    </FormControl>
                  ))}
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isRecurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <Label htmlFor="isRecurring" className="text-md">
                    Recurring Appointment
                  </Label>
                </div>
              </FormItem>
            )}
          />

          {form.watch("isRecurring") && (
            <div className="flex flex-col gap-4 ml-6">
              <FormField
                control={form.control}
                name="recurringDuration"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start">
                      <Label
                        htmlFor="recurringDuration"
                        className="whitespace-nowrap text-md flex items-center pt-1 w-20"
                      >
                        Duration
                      </Label>
                      <div className="flex gap-2 ml-4">
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              field.onChange({
                                value: parseInt(value),
                                unit: field.value?.unit || "months",
                              });
                            }}
                            value={field.value?.value?.toString() || ""}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue placeholder="1" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 26 }, (_, i) => i + 1).map(
                                (num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              field.onChange({
                                ...field.value,
                                unit: value as "days" | "weeks" | "months",
                              });
                            }}
                            value={field.value?.unit || "months"}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="days">Days</SelectItem>
                              <SelectItem value="weeks">Weeks</SelectItem>
                              <SelectItem value="months">Months</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurringFrequency"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start">
                      <Label
                        htmlFor="recurringFrequency"
                        className="whitespace-nowrap text-md flex items-center pt-1 w-20"
                      >
                        Frequency
                      </Label>
                      <div className="flex gap-2 ml-4">
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              field.onChange({
                                value: parseInt(value),
                                unit: field.value?.unit || "weeks",
                              });
                            }}
                            value={field.value?.value?.toString() || ""}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue placeholder="1" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 26 }, (_, i) => i + 1).map(
                                (num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              field.onChange({
                                ...field.value,
                                unit: value as "days" | "weeks",
                              });
                            }}
                            value={field.value?.unit || "weeks"}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="days">Days</SelectItem>
                              <SelectItem value="weeks">Weeks</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <div className="w-full h-px bg-black my-2"></div>

          {filteredAppointments.length > 0 ? (
            <>
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <DataTable
                  columns={[
                    {
                      accessorKey: "customer.fullName",
                      header: "Customer",
                    },
                    {
                      accessorKey: "employee.fullName",
                      header: "Staff",
                    },
                    {
                      accessorFn: (row) => row.service?.name ?? "",
                      id: "serviceName",
                      header: "Service",
                    },
                    {
                      accessorKey: "duration",
                      header: ({ column }: { column: any }) => (
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
                            column.toggleSorting(column.getIsSorted() === "asc")
                          }
                        >
                          Start Time
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      ),
                      cell: ({ row }: { row: any }) => (
                        <div>
                          {format(
                            toZonedTime(
                              new Date(row.original.startTime),
                              timezone,
                            ),
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
                            column.toggleSorting(column.getIsSorted() === "asc")
                          }
                        >
                          End Time
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      ),
                      cell: ({ row }: { row: any }) => (
                        <div>
                          {format(
                            toZonedTime(
                              new Date(row.original.endTime),
                              timezone,
                            ),
                            "dd/MM/yyyy HH:mm",
                          )}
                        </div>
                      ),
                    },
                  ]}
                  data={filteredAppointments}
                  height={undefined}
                  searchColumn="serviceName"
                  isShowPagination={false}
                  getRowId={(row: any) => row._id}
                  title={"Today's Services"}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <DataTable
                  columns={[
                    {
                      id: "select",
                      header: () => null,
                      cell: ({ row }: { row: any }) => {
                        // Helper to get ordinal suffix
                        const getOrdinal = (n: number) => {
                          if (n % 10 === 1 && n % 100 !== 11) return `${n}st`;
                          if (n % 10 === 2 && n % 100 !== 12) return `${n}nd`;
                          if (n % 10 === 3 && n % 100 !== 13) return `${n}rd`;
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
                                        (s: any) => s._ref === row.original._id,
                                      );
                                      if (!exists) {
                                        const newServiceRef = {
                                          _ref: row.original._id,
                                          _type: "reference",
                                          duration: row.original.duration || 0,
                                          quantity: 1,
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
                                        (s: any) => s._ref !== row.original._id,
                                      ),
                                    );
                                    return prev.filter((id) => id !== row.id);
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
                            column.toggleSorting(column.getIsSorted() === "asc")
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
                            column.toggleSorting(column.getIsSorted() === "asc")
                          }
                        >
                          Duration
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      ),
                      cell: ({ row }: { row: any }) => (
                        <Select
                          value={row.original.duration?.toString() || "0"}
                          onValueChange={(value) => {
                            const newDuration = Number(value);
                            const currentServices =
                              form.getValues("services") || [];
                            const serviceIndex = currentServices.findIndex(
                              (s: any) => s._ref === row.original._id,
                            );
                            if (serviceIndex !== -1) {
                              // Update existing
                              const updatedServices = [...currentServices];
                              updatedServices[serviceIndex] = {
                                ...updatedServices[serviceIndex],
                                duration: newDuration,
                              };
                              form.setValue("services", updatedServices);
                            } else {
                              // Add new
                              const newServiceRef = {
                                _ref: row.original._id,
                                _type: "reference",
                                duration: newDuration,
                                quantity: 1,
                              };
                              form.setValue("services", [
                                ...currentServices,
                                newServiceRef,
                              ]);
                              setSelectedOrder((prev) => [...prev, row.id]);
                            }
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {intervals.map((min) => (
                              <SelectItem key={min} value={min.toString()}>
                                {formatDuration(min)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ),
                    },
                    {
                      accessorKey: "quantity",
                      header: "Quantity",
                      cell: ({ row }: { row: any }) => {
                        const currentServices =
                          form.getValues("services") || [];
                        const serviceIndex = currentServices.findIndex(
                          (s: any) => s._ref === row.original._id,
                        );
                        const quantity =
                          serviceIndex !== -1
                            ? currentServices[serviceIndex].quantity
                            : 1;
                        return (
                          <Input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(e) => {
                              const newQuantity = Number(e.target.value);
                              if (newQuantity < 1) return;
                              const updatedServices = [...currentServices];
                              if (serviceIndex !== -1) {
                                updatedServices[serviceIndex] = {
                                  ...updatedServices[serviceIndex],
                                  quantity: newQuantity,
                                };
                              } else {
                                updatedServices.push({
                                  _ref: row.original._id,
                                  _type: "reference",
                                  duration: row.original.duration || 0,
                                  quantity: newQuantity,
                                });
                                setSelectedOrder((prev) => [...prev, row.id]);
                              }
                              form.setValue("services", updatedServices);
                            }}
                          />
                        );
                      },
                    },
                  ]}
                  data={tableData}
                  searchColumn="name"
                  isShowPagination={false}
                  getRowId={(row) => row._id}
                  title={"Services"}
                />
              </div>
              {form.formState.errors.services && (
                <FormMessage>
                  {form.formState.errors.services.message}
                </FormMessage>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentInfoForm;
