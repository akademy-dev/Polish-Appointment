import * as React from "react";
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
import ServiceForm from "./forms/ServiceForm";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeFormSchema } from "@/lib/validation";

const CreateInfoButton = ({ type }: { type: string }) => {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const getTitle = (type: string) => {
    switch (type) {
      case "employees":
        return "New Employee";
      case "customers":
        return "New Customer";
      case "services":
        return "New Service";
      default:
        return "New Item";
    }
  };

  const getDescription = (type: string) => {
    switch (type) {
      case "employees":
        return "Create a new employee with basic information, working time and time-off schedule.";
      case "customers":
        return "Create a new customer with basic information, contact information and address.";
      case "services":
        return "Create a new service with details and pricing.";
      default:
        return "";
    }
  };

  const getToastDescription = (type: string) => {
    switch (type) {
      case "employees":
        return "New Employee created successfully";
      case "customers":
        return "New Customer created successfully";
      case "services":
        return "New Service created successfully";
      default:
        return "New Item created successfully";
    }
  };

  const renderForm = () => {
    switch (type) {
      case "employees":
        return (
          <EmployeeForm
            form={form}
            onSuccess={handleFormSuccess}
            hideSubmitButton={isMobile}
            formRef={isMobile ? formRef : undefined}
          />
        );
      case "customers":
        return <CustomerForm onSuccess={handleFormSuccess} />;
      case "services":
        return <ServiceForm onSuccess={handleFormSuccess} />;
      default:
        return null;
    }
  };
  // Ref để trigger form submit từ ngoài
  const formRef = React.useRef<HTMLFormElement>(null);

  // Shared form instance cho cả mobile và desktop
  const form = useForm<z.infer<typeof employeeFormSchema>>({
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

  // Callback function để đóng dialog/drawer khi save thành công
  const handleFormSuccess = () => {
    setOpen(false);
    // Reset form sau khi save thành công
    form.reset();
    toast.success("Success", {
      description: getToastDescription(type),
    });
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
          <Button variant="default">{getTitle(type)}</Button>
        </DrawerTrigger>
        <DrawerContent className="p-4 h-[95vh] flex flex-col">
          <DrawerHeader className="text-left flex-shrink-0">
            <DrawerTitle>{getTitle(type)}</DrawerTitle>
            <DrawerDescription className="hidden">
              {getDescription(type)}
            </DrawerDescription>
          </DrawerHeader>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto min-h-0 pb-4">
            {renderForm()}
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
        <Button variant="default">{getTitle(type)}</Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl 2xl:max-w-screen-2xl"
        aria-describedby="employee-form"
      >
        <DialogHeader>
          <DialogTitle>{getTitle(type)}</DialogTitle>
          <DialogDescription className="hidden">
            {getDescription(type)}
          </DialogDescription>
        </DialogHeader>
        {renderForm()}
      </DialogContent>
    </Dialog>
  );
};

export default CreateInfoButton;
