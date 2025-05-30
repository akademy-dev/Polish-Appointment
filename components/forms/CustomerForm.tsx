"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Customer } from "@/types/profile";
import { cn } from "@/lib/utils";

const customerFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

const CustomerForm = ({
  className,
  initialData,
  onSuccess,
  hideSubmitButton = false,
  formRef,
}: {
  className?: string;
  initialData?: Customer;
  onSuccess?: () => void;
  hideSubmitButton?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
}) => {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: initialData || {
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  function onSubmit(values: CustomerFormValues) {
    console.log("Customer Form Submitted:", values);
    onSuccess?.();
  }

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-4 py-2 max-w-3xl", className)}
      >
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="First name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="Phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!hideSubmitButton && (
          <div className="flex justify-end pt-4">
            <Button type="submit">Save Customer</Button>
          </div>
        )}
      </form>
    </Form>
  );
};

export default CustomerForm;
