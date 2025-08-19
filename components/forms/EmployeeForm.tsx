import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { cn } from "@/lib/utils";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeFormSchema } from "@/lib/validation";
import { Form } from "@/components/ui/form";
import { AlertCircle } from "lucide-react";

import EmployeeInfoForm from "./EmployeeInfoForm";
import EmployeeWorkingForm from "./EmployeeWorkingForm";
import { Button } from "../ui/button";
import EmployeeAssignedServiceForm from "./EmployeeAssignedServiceForm";

const EmployeeForm = ({
  className,
  onSuccess,
  form: externalForm,
  hideSubmitButton = false,
  formRef,
  isSubmitting = false,
}: {
  className?: string;
  onSuccess?: () => void;
  form?: UseFormReturn<z.infer<typeof employeeFormSchema>>;
  hideSubmitButton?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
  isSubmitting?: boolean;
}) => {
  const internalForm = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      position: "backRoom",
      note: "",
      workingTimes: [],
      assignedServices: [],
    },
  });

  const form = externalForm || internalForm;

  // Check for errors in each tab
  const infoTabErrors =
    form.formState.errors.firstName ||
    form.formState.errors.lastName ||
    form.formState.errors.phone ||
    form.formState.errors.position;

  const workingTabErrors = form.formState.errors.workingTimes;



  function onSubmit() {
    onSuccess?.();
  }

  return (
    <Tabs defaultValue="info" className={`w-full ${className}`}>
      <TabsList>
        <TabsTrigger
          value="info"
          className={cn(
            "relative",
            infoTabErrors &&
              "text-red-700 data-[state=active]:text-red-800 data-[state=active]:bg-red-50 border-red-200",
          )}
          disabled={isSubmitting}
        >
          <div className="flex items-center gap-2">
            Basic Information
            {infoTabErrors && <AlertCircle className="h-4 w-4 text-red-600" />}
          </div>
        </TabsTrigger>
        <TabsTrigger
          value="working"
          className={cn(
            "relative",
            workingTabErrors &&
              "text-red-700 data-[state=active]:text-red-800 data-[state=active]:bg-red-50 border-red-200",
          )}
          disabled={isSubmitting}
        >
          <div className="flex items-center gap-2">
            Working Time
            {workingTabErrors && (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
          </div>
        </TabsTrigger>

        <TabsTrigger
          value="services"
          className={cn("relative")}
          disabled={isSubmitting}
        >
          <div className="flex items-center gap-2">Services</div>
        </TabsTrigger>
      </TabsList>

      <Form {...form}>
        <form
          ref={formRef}
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn("", className)}
        >
          <TabsContent value="info">
            <EmployeeInfoForm form={form} />
          </TabsContent>
          <TabsContent value="working">
            <EmployeeWorkingForm form={form} />
          </TabsContent>

          <TabsContent value="services">
            <EmployeeAssignedServiceForm form={form} />
          </TabsContent>
          {!hideSubmitButton && (
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </Tabs>
  );
};

export default EmployeeForm;
