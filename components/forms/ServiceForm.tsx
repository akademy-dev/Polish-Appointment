import React from "react";
import { useState } from "react";
import { useMemo } from "react";
import { serviceFormSchema, ServiceFormValues } from "@/lib/validation";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Service } from "@/models/service";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/use-categories";
import CategoryForm from "@/components/forms/CategoryForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
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
  categories: externalCategories,
}: {
  className?: string;
  initialData?: Service;
  onSuccess?: () => void;
  hideSubmitButton?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
  form?: UseFormReturn<ServiceFormValues>;
  isSubmitting?: boolean;
  categories?: { _id: string; name: string }[];
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
      // Transform initialData to match form format
      // Get category ID from initialData.category._id or initialData.category.id
      const categoryId =
        initialData.category?._id || initialData.category?.id || "";
      const formData = {
        name: initialData.name,
        price: initialData.price,
        duration: initialData.duration,
        category: {
          _ref: categoryId,
          _type: "reference" as const,
        },
      };
      form.reset(formData);
    }
  }, [initialData, form]);

  function onSubmit() {
    onSuccess?.();
  }

  // Use categories from hook for global caching
  const {
    categories: cachedCategories,
    loading: categoriesLoading,
    refetch,
  } = useCategories();

  // State for create category dialog
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] =
    useState(false);

  // Handle category creation success
  const handleCategoryCreated = (newCategory: {
    _id: string;
    name: string;
  }) => {
    // Refetch categories to update cache
    refetch();

    // Select the newly created category
    form.setValue("category", {
      _ref: newCategory._id,
      _type: "reference",
    });

    // Close dialog
    setShowCreateCategoryDialog(false);
  };

  // Use external categories if provided, otherwise use cached categories
  const categories = externalCategories || cachedCategories;

  React.useEffect(() => {
    // Only set default category if:
    // 1. Categories are loaded
    // 2. No initialData is provided (create mode)
    // 3. Form doesn't have a category set
    if (
      categories.length &&
      !initialData &&
      (!form.getValues("category") || !form.getValues("category")._ref)
    ) {
      form.setValue("category", {
        _ref: categories[0]._id,
        _type: "reference",
      });
    }
  }, [categories, form, initialData, categoriesLoading]);

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
        className={cn("space-y-4 w-full", className)}
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
                        className="w-full justify-between"
                        id="category"
                        disabled={isSubmitting}
                      >
                        {selectedCategory
                          ? selectedCategory.name
                          : "Select category..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Search category..." />
                        <CommandList className="max-h-[200px]">
                          <CommandEmpty>No category found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                setOpen(false);
                                setShowCreateCategoryDialog(true);
                              }}
                              className="border-b mb-1 pb-2"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add new category
                            </CommandItem>
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
              <FormControl>
                <Input
                  {...field}
                  placeholder="Service Name"
                  id="name"
                  disabled={isSubmitting}
                />
              </FormControl>
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
              <FormControl>
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
                    disabled={isSubmitting}
                  />
                </div>
              </FormControl>
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
                <FormControl>
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
                    disabled={isSubmitting}
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
                </FormControl>
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

      {/* Create Category Dialog */}
      <Dialog
        open={showCreateCategoryDialog}
        onOpenChange={setShowCreateCategoryDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category for organizing your services.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            onSuccess={handleCategoryCreated}
            onCancel={() => setShowCreateCategoryDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </Form>
  );
};

export default ServiceForm;
