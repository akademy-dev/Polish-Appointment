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

const CreateInfoButton = ({ type }: { type: string }) => {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

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
      description: `New ${
        type === "employees" ? "Employee" : "Customer"
      } created successfully`,
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
          <Button variant="default">
            {type === "employees" ? "New Employee" : "New Customer"}
          </Button>
        </DrawerTrigger>
        <DrawerContent className="p-4 h-[95vh] flex flex-col">
          <DrawerHeader className="text-left flex-shrink-0">
            <DrawerTitle>
              {type === "employees" ? "New Employee" : "New Customer"}
            </DrawerTitle>
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
