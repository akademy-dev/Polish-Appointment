"use client";
import React, { useState, useRef } from "react";
import { Button } from "./ui/button";
import { History, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import DataTable, { columns, historyData } from "./DataTable";
import {
  Profile,
  getProfileName,
  getProfileRole,
  isEmployee,
} from "@/types/profile";
import { useIsMobile } from "@/hooks/use-mobile";
import EmployeeForm from "./forms/EmployeeForm";
import CustomerForm from "./forms/CustomerForm";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeFormSchema, EmployeeFormValues } from "@/lib/validation";
import { toast } from "sonner";

enum CardButtonType {
  History = "History",
  Edit = "Edit",
}

const ProfileCard = ({ profile }: { profile: Profile }) => {
  return (
    <li className="flex-between line_card">
      <div className="flex flex-col ">
        <p className="text-lg font-bold">{getProfileName(profile)}</p>
        <p className="text-sm font-semibold">{getProfileRole(profile)}</p>
      </div>
      <div className="flex-between h-5 space-x-1">
        <CardButton human={profile} type={CardButtonType.Edit} />
        <CardButton human={profile} type={CardButtonType.History} />
      </div>
    </li>
  );
};

const CardButton = ({
  human,
  type,
}: {
  human: Profile;
  type: CardButtonType;
}) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const formRef = useRef<HTMLFormElement>(null);

  const employeeFormInstance = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
  });

  const handleFormSuccess = () => {
    setOpen(false);
    toast.success("Success", {
      description: `${getProfileName(human)} updated successfully`,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && type === CardButtonType.Edit) {
      if (isEmployee(human)) {
        // Convert Employee to EmployeeFormValues
        const formData = {
          firstName: human.firstName,
          lastName: human.lastName,
          phone: human.phone,
          position: human.position,
          workingTimes: human.workingTimes.map((wt) => ({
            from: wt.from,
            to: wt.to,
            day: wt.day,
          })),
          timeOffSchedule: human.timeOffSchedule.map((to) => ({
            from: to.from,
            to: to.to,
            reason: "",
            period: to.period as "Exact" | "Weekly" | "Monthly",
            date: to.date,
            dayOfWeek: to.dayOfWeek,
            dayOfMonth: to.dayOfMonth,
          })),
        };
        employeeFormInstance.reset(formData);
      }
    } else if (!newOpen && type === CardButtonType.Edit) {
      if (isEmployee(human)) {
        employeeFormInstance.reset(); // Reset on close if it was an edit
      }
    }
  };

  const title =
    type === CardButtonType.Edit
      ? `Edit ${getProfileName(human)}`
      : `${getProfileName(human)}'s History`;
  const description =
    type === CardButtonType.Edit
      ? `Update details for ${getProfileName(human)}.`
      : `View service history for ${getProfileName(human)}.`;

  const renderForm = () => {
    if (type === CardButtonType.Edit) {
      if (isEmployee(human)) {
        return (
          <EmployeeForm
            form={employeeFormInstance}
            onSuccess={handleFormSuccess}
            hideSubmitButton={isMobile} // Hide internal button for drawer
            formRef={formRef}
          />
        );
      }
      return (
        <CustomerForm
          initialData={human}
          onSuccess={handleFormSuccess}
          hideSubmitButton={isMobile}
          formRef={formRef}
        />
      );
    }
    return <DataTable columns={columns} data={historyData} />;
  };

  const FormDialogOrDrawer = isMobile ? Drawer : Dialog;
  const FormTrigger = isMobile ? DrawerTrigger : DialogTrigger;
  const FormContent = isMobile ? DrawerContent : DialogContent;
  const FormHeader = isMobile ? DrawerHeader : DialogHeader;
  const FormTitle = isMobile ? DrawerTitle : DialogTitle;
  const FormDescription = isMobile ? DrawerDescription : DialogDescription;
  const FormFooter = isMobile ? DrawerFooter : React.Fragment;
  const FormClose = isMobile ? DrawerClose : React.Fragment;

  return (
    <FormDialogOrDrawer
      open={open}
      onOpenChange={handleOpenChange}
      modal={true}
    >
      <FormTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className={`${
            type === CardButtonType.History
              ? "bg-yellow-500 hover:bg-yellow-400"
              : ""
          }`}
          aria-label={
            type === CardButtonType.History ? "View History" : "Edit Profile"
          }
        >
          {type === CardButtonType.History ? (
            <History className="size-5" aria-hidden="true" />
          ) : (
            <Pencil className="size-5" aria-hidden="true" />
          )}
        </Button>
      </FormTrigger>
      <FormContent
        className={
          isMobile
            ? "p-4 h-[95vh] flex flex-col"
            : "sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl 2xl:max-w-screen-2xl"
        }
      >
        <FormHeader className={isMobile ? "text-left flex-shrink-0" : ""}>
          <FormTitle>{title}</FormTitle>
          <FormDescription>{description}</FormDescription>
        </FormHeader>

        <div
          className={
            isMobile ? "flex-1 overflow-y-auto min-h-0 pb-4" : "grid gap-4 py-4"
          }
        >
          {renderForm()}
        </div>

        {isMobile && (
          <FormFooter className="pt-2 px-0 pb-0 flex-shrink-0 border-t">
            {type === CardButtonType.Edit && (
              <Button onClick={() => formRef.current?.requestSubmit()}>
                Save Changes
              </Button>
            )}
            <FormClose asChild>
              <Button variant="outline">Close</Button>
            </FormClose>
          </FormFooter>
        )}
      </FormContent>
    </FormDialogOrDrawer>
  );
};

export default ProfileCard;
