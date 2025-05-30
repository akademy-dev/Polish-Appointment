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
import ServiceForm from "@/components/forms/ServiceForm";

const CreateInfoButton = ({ type }: { type: string }) => {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const getButtonLabel = (type: string) => {
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

  const getDialogDescription = (type: string) => {
    switch (type) {
      case "employees":
        return "Create a new employee with basic information, working time and time-off schedule.";
      case "customers":
        return "Create a new customer with basic information, contact information and address.";
      case "services":
        return "Create a new service with details and pricing.";
      default:
        return "Create a new item.";
    }
  };

  const getDialogForm = (type: string) => {
    switch (type) {
      case "employees":
        return <EmployeeForm />;
      case "customers":
        return <CustomerForm />;
      case "services":
        return <ServiceForm />;
      default:
        return null;
    }
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="default">{getButtonLabel(type)}</Button>
        </DrawerTrigger>
        <DrawerContent className="p-4">
          <DrawerHeader className="text-left">
            <DrawerTitle>{getButtonLabel(type)}</DrawerTitle>
          </DrawerHeader>
          {type === "employees" ? <EmployeeForm /> : <CustomerForm />}
          <DrawerFooter className="pt-4 px-0 pb-0">
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">{getButtonLabel(type)}</Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl 2xl:max-w-screen-2xl"
        aria-describedby="employee-form"
      >
        <DialogHeader>
          <DialogTitle>{getButtonLabel(type)}</DialogTitle>
          <DialogDescription className="hidden">
            {getDialogDescription(type)}
          </DialogDescription>
        </DialogHeader>
        {getDialogForm(type)}
      </DialogContent>
    </Dialog>
  );
};

export default CreateInfoButton;
