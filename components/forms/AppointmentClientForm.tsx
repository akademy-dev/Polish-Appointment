import React, { useContext } from "react";
import { Input } from "../ui/input";
import { UseFormReturn } from "react-hook-form";
import { appointmentFormSchema } from "@/lib/validation";
import { z } from "zod";
import {
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
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn, formatMinuteDuration } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import DataTable from "@/components/DataTable";
import { format } from "date-fns";
import { Appointment } from "@/models/appointment";
import { CalendarContext } from "@/hooks/context";
import { toZonedTime } from "date-fns-tz";

const AppointmentClientForm = ({
  form,
  customers,
  customerValue,
  customerHistory,
  setCustomerValue,
  isSubmitting,
}: {
  form: UseFormReturn<z.infer<typeof appointmentFormSchema>>;
  customers: {
    value: string;
    label: string;
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
  }[];
  customerValue: string;
  setCustomerValue: (value: string) => void;
  customerHistory: Appointment[];
  isSubmitting: boolean;
}) => {
  const { timezone } = useContext(CalendarContext);
  const hasClientError = !!form.formState.errors.customer;
  const [customerOpen, setCustomerOpen] = React.useState(false);

  return (
    <div>
      {/* Client tab content */}
      <div className="flex flex-between justify-between items-center">
        <h2 className="text-lg font-semibold">Information</h2>
        <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={customerOpen}
              className="w-[250px] justify-between"
              disabled={isSubmitting}
            >
              {customerValue
                ? customers.find((customer) => customer.value === customerValue)
                    ?.label
                : "Search customer..."}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0 ">
            <Command
              filter={(value, search) => {
                const customer = customers.find((c) => c.value === value);
                return customer?.label
                  .toLowerCase()
                  .includes(search.toLowerCase())
                  ? 1
                  : 0;
              }}
            >
              <CommandInput placeholder="Search customer..." className="h-9" />
              <CommandList>
                <CommandEmpty>No customer found.</CommandEmpty>
                <CommandGroup>
                  {customers.map((customer) => (
                    <CommandItem
                      key={customer.value}
                      value={customer.value}
                      onSelect={(currentValue) => {
                        const newValue =
                          currentValue === customerValue ? "" : currentValue;
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
            accessorFn: (row) => row.service?.name ?? "",
            id: "serviceName",
            header: "Service",
          },
          {
            accessorFn: (row) => row.employee?.fullName ?? "",
            id: "staffName",
            header: "Staff",
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
              <div>{formatMinuteDuration(row.original.duration || 0)}</div>
            ),
          },
          {
            accessorKey: "date",
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
            cell: ({ row }) => {
              return (
                <div>
                  {format(
                    toZonedTime(new Date(row.original.startTime), timezone),
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
        searchColumn="serviceName"
        isShowPagination={false}
        title={"Customer History"}
        searchName={"Search Service"}
      />
    </div>
  );
};

export default AppointmentClientForm;
