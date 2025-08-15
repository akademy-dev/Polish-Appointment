import React from "react";
import { UseFormReturn } from "react-hook-form";
import { appointmentFormSchema } from "@/lib/validation";
import { z } from "zod";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
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

const AppointmentClientForm = ({
  form,
  customers,
  customerValue,
  setCustomerValue,
  isSubmitting,
  onCustomerCreated,
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
  onCustomerCreated?: () => void;
}) => {
  const [customerOpen, setCustomerOpen] = React.useState(false);
  const selectedCustomer = React.useMemo(
    () => customers.find((c) => c.value === customerValue),
    [customers, customerValue],
  );

  return (
    <div>
      {/* Client tab content */}
      <div className="flex flex-col gap-4">
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
              {selectedCustomer
                ? `${selectedCustomer.label}${selectedCustomer.phone ? ` - ${selectedCustomer.phone}` : ""}`
                : "Search customer..."}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0 ">
            <Command
              filter={(value, search) => {
                const customer = customers.find((c) => c.value === value);
                if (!customer) return 0;

                const searchLower = search.toLowerCase().trim();
                const searchDigits = search.replace(/\D/g, "");

                const nameLower = (customer.label ?? "").toLowerCase();
                const phoneLower = (customer.phone ?? "").toLowerCase();
                const phoneDigits = (customer.phone ?? "").replace(/\D/g, "");

                const matchByName = nameLower.includes(searchLower);
                const matchByPhoneText = phoneLower.includes(searchLower);
                const matchByPhoneDigits = searchDigits
                  ? phoneDigits.includes(searchDigits)
                  : false;

                return matchByName || matchByPhoneText || matchByPhoneDigits
                  ? 1
                  : 0;
              }}
            >
              <CommandInput
                placeholder="Search by name or phone..."
                className="h-9"
              />
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
                      {`${customer.label}${customer.phone ? ` - ${customer.phone}` : ""}`}
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
        <div className="w-fit">
          <CreateInfoButton 
            type={"customers"} 
            onSuccess={onCustomerCreated}
          />
        </div>
      </div>
    </div>
  );
};

export default AppointmentClientForm;
