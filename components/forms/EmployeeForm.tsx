import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeFormSchema } from "@/lib/validation";
import { Form } from "@/components/ui/form";

import EmployeeInfoForm from "./EmployeeInfoForm";
import EmployeeWorkingForm from "./EmployeeWorkingForm";
import EmployeeTimeOffForm from "./EmployeeTimeOffForm";
import { Button } from "../ui/button";

const EmployeeForm = ({ className }: { className?: string }) => {
  const form = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      position: "Employee",
      workingTimes: [],
      timeOffSchedule: {
        date: Date.now().toString(),
        fromTime: "09:00",
        toTime: "17:00",
        reason: "",
      },
    },
  });

  function onSubmit(values: z.infer<typeof employeeFormSchema>) {
    console.log(values);
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
            <EmployeeTimeOffForm />
          </TabsContent>
          <div className="flex justify-end">
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Form>
    </Tabs>
  );
};

export default EmployeeForm;
