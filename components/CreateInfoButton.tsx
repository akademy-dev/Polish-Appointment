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

const CreateInfoButton = ({ type }: { type: string }) => {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="default">
            {type === "employees" ? "New Employee" : "New Customer"}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>
              {type === "employees" ? "New Employee" : "New Customer"}
            </DrawerTitle>
          </DrawerHeader>
          {type === "employees" ? <EmployeeForm /> : <CustomerForm />}
          <DrawerFooter className="pt-2">
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
        {type === "employees" ? <EmployeeForm /> : <CustomerForm />}
      </DialogContent>
    </Dialog>
  );
};

export default CreateInfoButton;
