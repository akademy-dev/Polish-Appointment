import React from "react";
import { useState } from "react";
import { useMemo } from "react";
import { serviceFormSchema, ServiceFormValues } from "@/lib/validation";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Service } from "@/models/service";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { client } from "@/sanity/lib/client";
import { CATEGORIES_QUERY } from "@/sanity/lib/queries";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const intervals: number[] = [];
for (let min = 15; min <= 480; min += 15) {
  intervals.push(min);
}

const ServiceForm = ({
  className,
  initialData,
  onSuccess,
  hideSubmitButton = false,
  formRef,
  form: externalForm,
  isSubmitting = false,
}: {
  className?: string;
  initialData?: Service;
  onSuccess?: () => void;
  hideSubmitButton?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
  form?: UseFormReturn<ServiceFormValues>;
  isSubmitting?: boolean;
}) => {
  const internalForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: initialData || {
      category: {
        _ref: "",
        _type: "reference",
      },
      name: "",
      price: 0,
      duration: 15,
    },
  });

  const form = externalForm || internalForm;
  React.useEffect(() => {
    // Reset the form with initial data if provided
    if (initialData) {
      form.reset(initialData);
      console.log("Resetting form with duration:", initialData.duration);
    }
  }, [initialData, form]);

  function onSubmit() {
    onSuccess?.();
  }

  const [categories, setCategories] = React.useState<
    { _id: string; name: string }[]
  >([]);

  // Lấy tất cả category khi component mount
  React.useEffect(() => {
    async function fetchCategories() {
      try {
        const result = await client.fetch(CATEGORIES_QUERY);
        setCategories(result || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }

    fetchCategories();
  }, []);

  React.useEffect(() => {
    if (
      categories.length &&
      (!form.getValues("category") || !form.getValues("category")._ref)
    ) {
      form.setValue("category", {
        _ref: categories[0]._id,
        _type: "reference",
      });
    }
  }, [categories, form]);

  const [open, setOpen] = useState(false);

  const formatDuration = useMemo(() => {
    return (min: number): string => {
      const hr = Math.floor(min / 60);
      const m = min % 60;
      if (hr && m) return `${hr}hr ${m}min`;
      if (hr) return `${hr}hr`;
      return `${m}min`;
    };
  }, []);

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-4 p-1 max-w-3xl", className)}
      >
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => {
            const selectedCategory = categories.find(
              (cat) => cat._id === field.value?._ref
            );
            return (
              <FormItem>
                <FormLabel htmlFor="category">Category</FormLabel>
                <FormControl>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-2xs justify-between"
                        id="category"
                      >
                        {selectedCategory
                          ? selectedCategory.name
                          : "Select category..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-2xs p-0">
                      <Command>
                        <CommandInput placeholder="Search category..." />
                        <CommandList>
                          <CommandEmpty>No category found.</CommandEmpty>
                          <CommandGroup>
                            {categories.map((cat) => (
                              <CommandItem
                                key={cat._id}
                                value={cat._id}
                                onSelect={() => {
                                  field.onChange({
                                    _ref: cat._id,
                                    _type: "reference",
                                  });
                                  setOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value?._ref === cat._id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {cat.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="name">Name</FormLabel>
              <Input {...field} placeholder="Service Name" id="name" />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="price">Default Price</FormLabel>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  $
                </span>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="Service Price"
                  step="1"
                  className="pl-6"
                  id="price"
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel htmlFor="duration">Default Duration</FormLabel>
                <Select
                  onValueChange={(val) => {
                    if (val && intervals.includes(Number(val))) {
                      field.onChange(Number(val));
                    }
                  }}
                  value={
                    intervals.includes(field.value)
                      ? field.value.toString()
                      : intervals[0].toString()
                  }
                >
                  <SelectTrigger id="duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {intervals.map((min) => (
                      <SelectItem key={min} value={min.toString()}>
                        {formatDuration(min)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        {!hideSubmitButton && (
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};

export default ServiceForm;
