import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { cn } from "@/lib/utils";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeFormSchema } from "@/lib/validation";
import { Form } from "@/components/ui/form";

import EmployeeInfoForm from "./EmployeeInfoForm";
import EmployeeWorkingForm from "./EmployeeWorkingForm";
import EmployeeTimeOffForm from "./EmployeeTimeOffForm";
import { Button } from "../ui/button";

const EmployeeForm = ({
  className,
  onSuccess,
  form: externalForm,
  hideSubmitButton = false,
  formRef,
}: {
  className?: string;
  onSuccess?: () => void;
  form?: UseFormReturn<z.infer<typeof employeeFormSchema>>;
  hideSubmitButton?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
}) => {
  const internalForm = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      position: "Employee",
      workingTimes: [],
      timeOffSchedule: [],
    },
  });

  const form = externalForm || internalForm;

  function onSubmit(values: z.infer<typeof employeeFormSchema>) {
    console.log(values);
    onSuccess?.();
  }

  return (
    <Tabs defaultValue="info" className={`w-full ${className}`}>
      <TabsList>
        <TabsTrigger value="info">Basic Information</TabsTrigger>
        <TabsTrigger value="working">Working Time</TabsTrigger>
        <TabsTrigger value="timeoff">Time-off Schedule</TabsTrigger>
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
          <TabsContent value="timeoff">
            <EmployeeTimeOffForm form={form} />
          </TabsContent>
          {!hideSubmitButton && (
            <div className="flex justify-end pt-4">
              <Button type="submit">Save</Button>
            </div>
          )}
        </form>
      </Form>
    </Tabs>
  );
};

export default EmployeeForm;
