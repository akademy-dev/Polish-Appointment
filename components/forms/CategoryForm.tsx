"use client";

import React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createCategory } from "@/lib/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Name too long"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  onSuccess?: (category: { _id: string; id: string; name: string }) => void;
  onCancel?: () => void;
  className?: string;
}

const CategoryForm = ({
  onSuccess,
  onCancel,
  className,
}: CategoryFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: CategoryFormValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", values.name);

      const result = await createCategory(formData);

      if (result.status === "SUCCESS") {
        const newCategory = {
          _id: result._id,
          id: result._id,
          name: values.name,
        };

        toast.success("Success", {
          description: "Category created successfully",
        });

        form.reset();
        onSuccess?.(newCategory);
      } else {
        toast.error("Error", {
          description: result.error || "Failed to create category",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-4", className)}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="category-name">Category Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter category name"
                  id="category-name"
                  disabled={isSubmitting}
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Creating..." : "Create Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CategoryForm;
