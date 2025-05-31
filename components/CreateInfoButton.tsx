"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import CustomerForm from "./forms/CustomerForm";
import EmployeeForm from "./forms/EmployeeForm";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeFormSchema } from "@/lib/validation";
import { useRef, useState } from "react";
import { createEmployee } from "@/lib/actions";
import { TimeOffSchedule, WorkingTime } from "@/models/profile";

const CreateInfoButton = ({ type }: { type: string }) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  // Ref để trigger form submit từ ngoài
  const formRef = useRef<HTMLFormElement>(null);

  // Shared form instance cho cả mobile và desktop
  const form = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      position: "backRoom",
      workingTimes: [],
      timeOffSchedule: [],
    },
  });

  // Callback function để đóng dialog/drawer khi save thành công
  const handleFormSuccess = async () => {
    try {
      const formValues = form.getValues();
      console.log("formValues", formValues);

      const formData = new FormData();
      formData.append("firstName", formValues.firstName);
      formData.append("lastName", formValues.lastName);
      formData.append("phone", formValues.phone || "");
      formData.append("position", formValues.position);

      const result = await createEmployee(
        formData,
        formValues.workingTimes as unknown as WorkingTime[],
        formValues.timeOffSchedule as unknown as TimeOffSchedule[]
      );

      // Reset form sau khi save thành công
      if (result.status == "SUCCESS") {
        setOpen(false);
        form.reset();
        toast.success("Success", {
          description: `New ${
            type === "employees" ? "Employee" : "Customer"
          } created successfully`,
        });
      } else {
        toast.error("Error", {
          description: result.error,
        });
      }
    } catch (error) {
      console.log(error);
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    }
  };

  // Handle submit từ drawer footer
  const handleDrawerSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  // Handle khi đóng/mở dialog để reset form
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);

    if (newOpen) {
      // Reset form khi mở dialog để đảm bảo form clean cho employee mới
      form.reset();
    } else {
      // Reset form khi đóng dialog (trường hợp user cancel)
      form.reset();
    }
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          <Button variant="default">
            {type === "employees" ? "New Employee" : "New Customer"}
          </Button>
        </DrawerTrigger>
        <DrawerContent className="p-4 h-[95vh] flex flex-col">
          <DrawerHeader className="text-left flex-shrink-0">
            <DrawerTitle>
              {type === "employees" ? "New Employee" : "New Customer"}
            </DrawerTitle>
            <DrawerDescription className="hidden">
              {type === "employees"
                ? "Create a new employee with basic information, working time and time-off schedule."
                : "Create a new customer with basic information, contact information and address."}
            </DrawerDescription>
          </DrawerHeader>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto min-h-0 pb-4">
            {type === "employees" ? (
              <EmployeeForm
                form={form}
                onSuccess={handleFormSuccess}
                hideSubmitButton={true}
                formRef={formRef}
              />
            ) : (
              <CustomerForm onSuccess={handleFormSuccess} />
            )}
          </div>

          {/* Fixed footer with buttons */}
          <DrawerFooter className="pt-2 px-0 pb-0 flex-shrink-0 border-t">
            {type === "employees" && (
              <Button onClick={handleDrawerSubmit}>Save</Button>
            )}
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default">
          {type === "employees" ? "New Employee" : "New Customer"}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl 2xl:max-w-screen-2xl"
        aria-describedby="employee-form"
      >
        <DialogHeader>
          <DialogTitle>
            {type === "employees" ? "New Employee" : "New Customer"}
          </DialogTitle>
          <DialogDescription className="hidden">
            {type === "employees"
              ? "Create a new employee with basic information, working time and time-off schedule."
              : "Create a new customer with basic information, contact information and address."}
          </DialogDescription>
        </DialogHeader>
        {type === "employees" ? (
          <EmployeeForm form={form} onSuccess={handleFormSuccess} />
        ) : (
          <CustomerForm onSuccess={handleFormSuccess} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateInfoButton;
