/* eslint-disable */

import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, CalendarIcon, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import { useForm } from "react-hook-form";
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
import { ScrollBar, ScrollArea } from "@/components/ui/scroll-area";
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

export const AppointmentForm: React.FC<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  time?: any;
  staff?: string;
}> = ({ isOpen, onOpenChange, time, staff }) => {
  const [tab, setTab] = React.useState("client");
  // Define the form
  const form = useForm<z.infer<typeof appointmentFormSchema>>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      time: time?.time,
      staff: staff || "",
      note: "",
      reminder: true,
      services: [],
    },
  });

  React.useEffect(() => {
    setTab("client");
    form.reset({
      ...form.getValues(),
      time: time?.time || time || undefined,
      staff: staff || "",
    });
  }, [isOpen, time, staff]);

  const [open, setOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<string[]>([]);

  const staffs = [
    {
      value: "Alice",
      label: "Alice",
    },
    {
      value: "Bob",
      label: "Bob",
    },
    {
      value: "Charlie",
      label: "Charlie",
    },
    {
      value: "Diana",
      label: "Diana",
    },
    {
      value: "Eve",
      label: "Eve",
    },
    {
      value: "Frank",
      label: "Frank",
    },
    {
      value: "Grace",
      label: "Grace",
    },
  ];

  // define a submit handler
  function onSubmit(data: z.infer<typeof appointmentFormSchema>) {
    console.log("Form submitted with data:", data);
    // Here you would typically handle the form submission, e.g., send data to an API
  }

  function handleDateSelect(date: Date | undefined) {
    if (date) {
      form.setValue("time", date, { shouldValidate: true });
    }
  }

  function handleTimeChange(type: "hour" | "minute" | "ampm", value: string) {
    const currentDate = form.getValues("time") || new Date();
    const newDate = new Date(currentDate);

    if (type === "hour") {
      const hour = parseInt(value, 10);
      newDate.setHours(newDate.getHours() >= 12 ? hour + 12 : hour);
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(value, 10));
    } else if (type === "ampm") {
      const hours = newDate.getHours();
      if (value === "AM" && hours >= 12) {
        newDate.setHours(hours - 12);
      } else if (value === "PM" && hours < 12) {
        newDate.setHours(hours + 12);
      }
    }

    form.setValue("time", newDate);
  }

  const hasClientError =
    !!form.formState.errors.firstName ||
    !!form.formState.errors.lastName ||
    !!form.formState.errors.phone;

  const hasAppointmentError =
    !!form.formState.errors.time || !!form.formState.errors.staff;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 [&>button]:hidden min-w-[800px] max-w-none w-auto min-h-[620px]">
        <VisuallyHidden>
          <DialogTitle>Create Appointment</DialogTitle>
        </VisuallyHidden>
        <div className="flex">
          {/* Left: Tabs for Client and Appointment */}
          <div className="shadow-2xl p-2  bg-secondary rounded-bl-lg rounded-tl-lg">
            <Tabs value={tab} onValueChange={setTab} orientation="vertical">
              <TabsList className="items-start bg-transparent p-0 w-full">
                <TabsTrigger value="client">Client</TabsTrigger>
                <TabsTrigger value="appointment">Appointment</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {/* Right: Tab Content */}
          <div className="relative flex-1 p-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {tab === "client" && (
                  <div>
                    {/* Client tab content */}
                    <div className="flex flex-between justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">Information</h2>
                      <div className="relative max-w-sm">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Search className="w-4 h-4 text-black" />
                        </span>
                        <Input className="pl-10" placeholder="Search" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <FormField
                        control={form.control}
                        name="firstName"
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
                        name="lastName"
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
                        name="phone"
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
                      columns={[
                        {
                          accessorKey: "service",
                          header: "Service",
                        },
                        {
                          accessorKey: "staff",
                          header: "Staff",
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
                                {formatDate(row.original.date.toISOString())}
                              </div>
                            );
                          },
                        },
                        {
                          accessorKey: "duration",
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
                                Duration
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            );
                          },
                          cell: ({ row }) => {
                            return (
                              <div>{formatDuration(row.original.duration)}</div>
                            );
                          },
                        },
                      ]}
                      data={[
                        {
                          service: "Haircut",
                          staff: "John Doe",
                          date: new Date("2023-10-01T10:00:00Z"),
                          duration: 30,
                        },
                        {
                          service: "Manicure",
                          staff: "Jane Smith",
                          date: new Date("2023-10-02T11:00:00Z"),
                          duration: 45,
                        },
                        {
                          service: "Pedicure",
                          staff: "Alice Johnson",
                          date: new Date("2023-10-03T12:00:00Z"),
                          duration: 60,
                        },
                        {
                          service: "Facial",
                          staff: "Bob Brown",
                          date: new Date("2023-10-04T13:00:00Z"),
                          duration: 90,
                        },
                        {
                          service: "Massage",
                          staff: "Charlie White",
                          date: new Date("2023-10-05T14:00:00Z"),
                          duration: 120,
                        },
                        {
                          service: "Hair Coloring",
                          staff: "Diana Green",
                          date: new Date("2023-10-06T15:00:00Z"),
                          duration: 75,
                        },
                        {
                          service: "Waxing",
                          staff: "Eve Black",
                          date: new Date("2023-10-07T16:00:00Z"),
                          duration: 30,
                        },
                        {
                          service: "Eyebrow Shaping",
                          staff: "Frank Blue",
                          date: new Date("2023-10-08T17:00:00Z"),
                          duration: 20,
                        },
                        {
                          service: "Makeup",
                          staff: "Grace Yellow",
                          date: new Date("2023-10-09T18:00:00Z"),
                          duration: 90,
                        },
                      ]}
                      height={hasClientError ? "240px" : "310px"}
                      titleEmpty="No service history available."
                      searchColumn="service"
                      isShowPagination={false}
                    />
                  </div>
                )}
                {tab === "appointment" && (
                  <div>
                    <h2 className="text-lg font-semibold">Information</h2>
                    <div className="flex flex-col gap-3">
                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem className="flex">
                            <div className="flex items-start">
                              <Label className="whitespace-nowrap flex items-center pt-1 text-md min-w-[50px] text-right">
                                Date
                              </Label>
                              <div className="flex flex-col gap-1">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-2xs text-left font-normal ml-4",
                                          !field.value &&
                                            "text-muted-foreground",
                                        )}
                                        id="time"
                                      >
                                        {field.value ? (
                                          format(
                                            field.value,
                                            "MM/dd/yyyy hh:mm aa",
                                          )
                                        ) : (
                                          <span>MM/DD/YYYY hh:mm aa</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <div className="sm:flex">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={handleDateSelect}
                                        initialFocus
                                      />
                                      <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                                        <ScrollArea className="w-64 sm:w-auto">
                                          <div className="flex sm:flex-col p-2">
                                            {Array.from(
                                              { length: 12 },
                                              (_, i) => i + 1,
                                            )
                                              .reverse()
                                              .map((hour) => (
                                                <Button
                                                  key={hour}
                                                  size="icon"
                                                  variant={
                                                    field.value &&
                                                    field.value.getHours() %
                                                      12 ===
                                                      hour % 12
                                                      ? "default"
                                                      : "ghost"
                                                  }
                                                  className="sm:w-full shrink-0 aspect-square"
                                                  onClick={() =>
                                                    handleTimeChange(
                                                      "hour",
                                                      hour.toString(),
                                                    )
                                                  }
                                                >
                                                  {hour}
                                                </Button>
                                              ))}
                                          </div>
                                          <ScrollBar
                                            orientation="horizontal"
                                            className="sm:hidden"
                                          />
                                        </ScrollArea>
                                        <ScrollArea className="w-64 sm:w-auto">
                                          <div className="flex sm:flex-col p-2">
                                            {Array.from(
                                              { length: 12 },
                                              (_, i) => i * 5,
                                            ).map((minute) => (
                                              <Button
                                                key={minute}
                                                size="icon"
                                                variant={
                                                  field.value &&
                                                  field.value.getMinutes() ===
                                                    minute
                                                    ? "default"
                                                    : "ghost"
                                                }
                                                className="sm:w-full shrink-0 aspect-square"
                                                onClick={() =>
                                                  handleTimeChange(
                                                    "minute",
                                                    minute.toString(),
                                                  )
                                                }
                                              >
                                                {minute
                                                  .toString()
                                                  .padStart(2, "0")}
                                              </Button>
                                            ))}
                                          </div>
                                          <ScrollBar
                                            orientation="horizontal"
                                            className="sm:hidden"
                                          />
                                        </ScrollArea>
                                        <ScrollArea className="">
                                          <div className="flex sm:flex-col p-2">
                                            {["AM", "PM"].map((ampm) => (
                                              <Button
                                                key={ampm}
                                                size="icon"
                                                variant={
                                                  field.value &&
                                                  ((ampm === "AM" &&
                                                    field.value.getHours() <
                                                      12) ||
                                                    (ampm === "PM" &&
                                                      field.value.getHours() >=
                                                        12))
                                                    ? "default"
                                                    : "ghost"
                                                }
                                                className="sm:w-full shrink-0 aspect-square"
                                                onClick={() =>
                                                  handleTimeChange("ampm", ampm)
                                                }
                                              >
                                                {ampm}
                                              </Button>
                                            ))}
                                          </div>
                                        </ScrollArea>
                                      </div>
                                    </div>
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
                        name="staff"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-start">
                              <Label
                                htmlFor="staff"
                                className="whitespace-nowrap flex items-center pt-1 text-md min-w-[50px] text-right"
                              >
                                Staff
                              </Label>
                              <div className="flex flex-col gap-1">
                                <FormControl>
                                  <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-2xs justify-between ml-4"
                                        id="staff"
                                      >
                                        {field.value
                                          ? staffs.find(
                                              (staff) =>
                                                staff.value === field.value,
                                            )?.label
                                          : "Select staff..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-2xs p-0">
                                      <Command>
                                        <CommandInput placeholder="Search staff..." />
                                        <CommandList>
                                          <CommandEmpty>
                                            No staff found.
                                          </CommandEmpty>
                                          <CommandGroup>
                                            {staffs.map((staff) => (
                                              <CommandItem
                                                key={staff.value}
                                                value={staff.value}
                                                onSelect={(currentValue) => {
                                                  field.onChange(
                                                    currentValue === field.value
                                                      ? ""
                                                      : currentValue,
                                                  );
                                                  setOpen(false);
                                                }}
                                              >
                                                <Check
                                                  className={cn(
                                                    "mr-2 h-4 w-4",
                                                    field.value === staff.value
                                                      ? "opacity-100"
                                                      : "opacity-0",
                                                  )}
                                                />
                                                {staff.label}
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </FormControl>
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
                    <DataTable
                      columns={[
                        {
                          id: "select",
                          header: () => null, // Bỏ select all
                          cell: ({ row }) => {
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
                            const isSelected = row.getIsSelected();
                            const idx = selectedOrder.indexOf(row.id);
                            return (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(value) => {
                                    row.toggleSelected(!!value);
                                    setSelectedOrder((prev) => {
                                      if (value) {
                                        if (!prev.includes(row.id)) {
                                          // Add to form.services if not already present
                                          const currentServices =
                                            form.getValues("services") || [];
                                          const exists = currentServices.some(
                                            (s) =>
                                              s.name === row.original.name &&
                                              s.type === row.original.type,
                                          );
                                          if (!exists) {
                                            // Add order property to the service object
                                            const newService = {
                                              ...row.original,
                                              order: prev.length,
                                            };
                                            form.setValue("services", [
                                              ...currentServices,
                                              newService,
                                            ]);
                                          }
                                          return [...prev, row.id];
                                        }
                                        return prev;
                                      } else {
                                        // Remove from form.services
                                        const currentServices =
                                          form.getValues("services") || [];
                                        form.setValue(
                                          "services",
                                          currentServices.filter(
                                            (s) =>
                                              !(
                                                s.name === row.original.name &&
                                                s.type === row.original.type
                                              ),
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
                                {isSelected && idx !== -1 && (
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
                          accessorKey: "type",
                          header: "Type",
                        },
                        {
                          accessorKey: "name",
                          header: "Name",
                        },
                        {
                          accessorKey: "cost",
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
                                Cost
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            );
                          },
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
                                {formatDate(row.original.date.toISOString())}
                              </div>
                            );
                          },
                        },
                        {
                          accessorKey: "duration",
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
                                Duration
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            );
                          },
                          cell: ({ row }) => {
                            return (
                              <div>{formatDuration(row.original.duration)}</div>
                            );
                          },
                        },
                      ]}
                      data={[
                        {
                          type: "Manicure",
                          name: "Basic Manicure",
                          cost: "$25",
                          date: new Date("2023-10-01T10:00:00Z"),
                          duration: 45,
                        },
                        {
                          type: "Pedicure",
                          name: "Deluxe Pedicure",
                          cost: "$40",
                          date: new Date("2023-10-02T11:00:00Z"),
                          duration: 60,
                        },
                        {
                          type: "Nail",
                          name: "Acrylic Nails",
                          cost: "$60",
                          date: new Date("2023-10-03T12:00:00Z"),
                          duration: 90,
                        },
                        {
                          type: "Hair",
                          name: "Hair Coloring",
                          cost: "$100",
                          date: new Date("2023-10-04T13:00:00Z"),
                          duration: 120,
                        },
                        {
                          type: "Massage",
                          name: "Full Body Massage",
                          cost: "$80",
                          date: new Date("2023-10-05T14:00:00Z"),
                          duration: 60,
                        },
                        {
                          type: "Facial",
                          name: "Anti-Aging Facial",
                          cost: "$90",
                          date: new Date("2023-10-06T15:00:00Z"),
                          duration: 75,
                        },
                        {
                          type: "Waxing",
                          name: "Full Body Waxing",
                          cost: "$70",
                          date: new Date("2023-10-07T16:00:00Z"),
                          duration: 90,
                        },
                        {
                          type: "Makeup",
                          name: "Bridal Makeup",
                          cost: "$150",
                          date: new Date("2023-10-08T17:00:00Z"),
                          duration: 120,
                        },
                        {
                          type: "Eyebrow",
                          name: "Eyebrow Shaping",
                          cost: "$20",
                          date: new Date("2023-10-09T18:00:00Z"),
                          duration: 30,
                        },
                      ]}
                      height={hasAppointmentError ? "240px" : "310px"}
                      searchColumn="name"
                      isShowPagination={false}
                    />
                    {form.formState.errors.services && (
                      <FormMessage>
                        {form.formState.errors.services.message}
                      </FormMessage>
                    )}
                  </div>
                )}

                <div className="absolute bottom-0 right-0 flex justify-end gap-2 p-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      form.reset();
                      onOpenChange(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
