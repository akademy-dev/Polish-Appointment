import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  appointmentFormSchema,
  appointmentTimeOffSchema,
} from "@/lib/validation";
import { z } from "zod";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Appointment } from "@/models/appointment";
import CreateInfoButton from "@/components/CreateInfoButton";
import AppointmentTimeOffForm from "./AppointmentTimeOffForm";
import { getProfileName } from "@/models/profile";

const AppointmentClientForm = ({
  form,
  customers: initialCustomers,
  customerValue,
  setCustomerValue,
  isSubmitting,
  onCustomerCreated,
  timeOffForm,
  onTimeOffSubmit,
  selectedEmployee,
  type,
}: {
  form: UseFormReturn<z.infer<typeof appointmentFormSchema>>;
  customers?: {
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
  onCustomerCreated?: () => void;
  timeOffForm: UseFormReturn<z.infer<typeof appointmentTimeOffSchema>>;
  onTimeOffSubmit?: () => void;
  selectedEmployee?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  type?: "create" | "edit";
}) => {
  const [customerOpen, setCustomerOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState<
    {
      value: string;
      label: string;
      _id: string;
      firstName: string;
      lastName: string;
      phone: string;
    }[]
  >(initialCustomers || []);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Fetch current customer when editing
  React.useEffect(() => {
    if (type === "edit" && customerValue && initialCustomers?.length === 0) {
      const fetchCurrentCustomer = async () => {
        try {
          const customerId = form.getValues("customer._ref");
          if (customerId) {
            const response = await fetch(`/api/customers?id=${customerId}`);
            const result = await response.json();
            if (result && result.id) {
              setCustomers([
                {
                  _id: result.id,
                  value: result.id,
                  label:
                    `${result.first_name || ""} ${result.last_name || ""}`.trim(),
                  firstName: result.first_name,
                  lastName: result.last_name,
                  phone: result.phone || "",
                },
              ]);
            }
          }
        } catch (error) {
        }
      };
      fetchCurrentCustomer();
    } else if (initialCustomers && initialCustomers.length > 0) {
      setCustomers(initialCustomers);
    }
  }, [type, customerValue, form, initialCustomers]);

  // Search customers with debounce
  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If search query is empty, show initial customers
    if (searchQuery.trim().length === 0) {
      setCustomers(initialCustomers || []);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const searchTerm = searchQuery.trim();
        const customersRes = await fetch(
          `/api/customers?search=${encodeURIComponent(searchTerm)}`
        ).then((res) => res.json());
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
          }))
        );
      } catch (error) {
        setCustomers([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const selectedCustomer = React.useMemo(
    () => customers.find((c) => c.value === customerValue),
    [customers, customerValue]
  );

  return (
    <div className="flex gap-6 w-full">
      {/* Client Search Section */}
      <div className="w-1/3">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Client search</h2>
          <Popover
            open={customerOpen}
            onOpenChange={(open) => {
              setCustomerOpen(open);
              if (!open) {
                // Reset search when closing popover
                setSearchQuery("");
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={customerOpen}
                className="w-[250px] justify-between"
                disabled={isSubmitting}
              >
                {selectedCustomer
                  ? `${selectedCustomer.label}${selectedCustomer.phone ? ` - ${selectedCustomer.phone}` : ""}`
                  : "Search customer..."}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0 ">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search by name or phone..."
                  className="h-9"
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  {isSearching ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : customers.length === 0 ? (
                    <CommandEmpty>No customer found.</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {customers.map((customer) => (
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
                            setSearchQuery("");

                            const selected = customers.find(
                              (c) => c.value === newValue
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
                          {`${customer.label}${customer.phone ? ` - ${customer.phone}` : ""}`}
                          <Check
                            className={cn(
                              "ml-auto",
                              customerValue === customer.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <div className="w-fit">
            <CreateInfoButton
              type={"customers"}
              onSuccess={onCustomerCreated}
            />
          </div>
        </div>
      </div>
      {/* Divider */}
      <div className="w-px bg-black self-stretch"></div>

      {/* Time Off Schedule Section */}
      <div className="w-2/3">
        <AppointmentTimeOffForm
          form={timeOffForm}
          isSubmitting={isSubmitting}
          onSubmit={onTimeOffSubmit}
          selectedEmployee={selectedEmployee}
        />
      </div>
    </div>
  );
};

export default AppointmentClientForm;
