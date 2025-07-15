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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn, formatMinuteDuration } from "@/lib/utils";
import {
  ArrowUpDown,
  Check,
  ChevronDownIcon,
  ChevronsUpDown,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import DataTable from "@/components/DataTable";
import { format } from "date-fns";
import * as React from "react";
import { useMemo, useState } from "react";
import { Customer, Employee } from "@/models/profile";
import { Appointment } from "@/models/appointment";
import { Service } from "@/models/service";

const intervals: number[] = [];
for (let min = 15; min <= 240; min += 15) {
  intervals.push(min);
}

const VARIABLE_LIST = ["Customer", "Employee", "Service", "Date Time"];

const AppointmentInfoForm = ({
  form,
  services = [],
  employees = [],
  appointments = [],
}: {
  form: UseFormReturn<z.infer<typeof appointmentFormSchema>>;
  services: Service[];
  employees: { value: string; label: string }[];
  appointments: Appointment[];
  type: "create" | "edit";
}) => {
  const [open, setOpen] = useState(false);
  const REMINDER_OPTIONS = [
    { label: "1hr", value: "1h" },
    { label: "2hr", value: "2h" },
    { label: "12hr", value: "12h" },
    { label: "24hr", value: "24h" },
    { label: "2d", value: "2d" },
  ];
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

  const {
    date: initialDate,
    time: initialTime,
    ampm: initialAmpm,
  } = parseTimeString(
    form.getValues("time") ||
      (() => {
        const now = new Date();
        now.setHours(9, 0, 0, 0);
        return now.toISOString();
      })(),
  );

  // Local state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate,
  );
  const [selectedTime, setSelectedTime] = useState<string>(initialTime);
  const [selectedAmpm, setSelectedAmpm] = useState<"AM" | "PM">(
    initialAmpm as "AM" | "PM",
  );
  const hasClientError = !!form.formState.errors.customer;

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

  const formatDuration = useMemo(() => {
    return (min: number): string => {
      const hr = Math.floor(min / 60);
      const m = min % 60;
      if (hr && m) return `${hr}hr ${m}min`;
      if (hr) return `${hr}hr`;
      return `${m}min`;
    };
  }, []);

  const [employeeOpen, setEmployeeOpen] = React.useState(false);
  const [employeeValue, setEmployeeValue] = React.useState<string>("");

  const [selectedOrder, setSelectedOrder] = React.useState<string[]>([]);

  const employeeRef = form.getValues("employee._ref");
  if (employeeRef) {
    const selectedEmployee = employees.find(
      (employee: { value: string; label: string }) =>
        employee.value === employeeRef,
    );
    if (selectedEmployee && employeeValue !== selectedEmployee.value) {
      setEmployeeValue(selectedEmployee.value);
    }
  }

  const watchedServices = form.watch("services") || [];

  const tableData = useMemo(() => {
    return services.map((service) => {
      const selectedService = watchedServices.find(
        (s: any) => s._ref === service._id,
      );
      return {
        ...service,
        duration: selectedService ? selectedService.duration : service.duration,
      };
    });
  }, [services, watchedServices]);

  return (
    <div>
      <h2 className="text-lg font-semibold">Information</h2>
      <div className="flex gap-4 w-full">
        <div className="flex flex-col gap-2 w-1/2">
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
                            updateFormTime(date, selectedTime, selectedAmpm);
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
                          updateFormTime(selectedDate, newTime, selectedAmpm);
                        }}
                        className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-ampm-field]:hidden"
                      />
                      <Select
                        value={selectedAmpm}
                        onValueChange={(value: "AM" | "PM") => {
                          setSelectedAmpm(value);
                          updateFormTime(selectedDate, selectedTime, value);
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
                    <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
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
                                (employee) => employee.value === employeeValue,
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
              <FormItem className="flex flex-row gap-2">
                <div className="text-sm font-medium mb-1">SMS Reminder</div>
                <div className="flex flex-row gap-4">
                  {REMINDER_OPTIONS.map((option) => (
                    <FormControl key={option.value}>
                      <label className="flex items-center gap-2">
                        <Checkbox
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
        </div>
        <div className="flex flex-col gap-2 w-1/2">
          <FormField
            control={form.control}
            name="smsMessage"
            render={({ field }) => (
              <FormItem>
                <Label className="mb-1">SMS Content</Label>
                <div className="flex gap-2 mb-1 w-full">
                  {VARIABLE_LIST.map((v) => (
                    <Button
                      key={v}
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById(
                          "smsMessage",
                        ) as HTMLTextAreaElement | null;
                        if (!textarea) return;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const safeValue = field.value ?? "";
                        const newValue =
                          safeValue.substring(0, start) +
                          `{${v}}` +
                          safeValue.substring(end, safeValue.length);
                        field.onChange(newValue);
                        setTimeout(() => {
                          textarea.focus();
                          textarea.selectionStart = textarea.selectionEnd =
                            start + v.length + 2;
                        }, 0);
                      }}
                    >
                      {v}
                    </Button>
                  ))}
                </div>
                <FormControl>
                  <Textarea
                    id="smsMessage"
                    className="w-full min-h-[80px] resize-none"
                    placeholder="Type your SMS message here. Use {variables} for personalization (e.g., {name}, {date})..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {appointments.length > 0 ? (
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
                <div>{formatMinuteDuration(row.original.duration || 0)}</div>
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
                  {format(new Date(row.original.startTime), "dd/MM/yyyy HH:mm")}
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
                  {format(new Date(row.original.endTime), "dd/MM/yyyy HH:mm")}
                </div>
              ),
            },
          ]}
          data={appointments}
          height={hasClientError ? "200px" : "250px"}
          searchColumn="serviceName"
          isShowPagination={false}
          getRowId={(row: any) => row._id}
          title={"Today's Services"}
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
                      const currentServices = form.getValues("services") || [];
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
            ]}
            data={tableData}
            height={hasClientError ? "200px" : "250px"}
            searchColumn="name"
            isShowPagination={false}
            getRowId={(row) => row._id}
          />
          {form.formState.errors.services && (
            <FormMessage>{form.formState.errors.services.message}</FormMessage>
          )}
        </>
      )}
    </div>
  );
};

export default AppointmentInfoForm;
