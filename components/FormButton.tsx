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
import ServiceForm from "./forms/ServiceForm";
import DataTable, { columns, historyData } from "./DataTable";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  appointmentFormSchema,
  customerFormSchema,
  employeeFormSchema,
  serviceFormSchema,
} from "@/lib/validation";
import { useRef, useState, ReactNode, useEffect } from "react";
import {
  createEmployee,
  createCustomer,
  updateEmployee,
  updateCustomer,
  updateService,
  createService,
  createAppointment,
  deleteEmployee,
  deleteCustomer,
  deleteService,
} from "@/lib/actions";
import {
  TimeOffSchedule,
  WorkingTime,
  Profile,
  getProfileName,
  isEmployee,
  Customer,
  getProfileId,
} from "@/models/profile";
import { getServiceId, Service } from "@/models/service";
import { AppointmentForm } from "@/components/forms/AppointmentForm";

type FormMode = "create" | "edit" | "history" | "delete";
type FormType = "employees" | "customers" | "services" | "schedule";

interface FormButtonProps {
  children: ReactNode;
  mode: FormMode;
  type: FormType;
  profile?: Profile; // For edit mode
  service?: Service;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "destructive"
    | "secondary"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const FormButton = ({
  children,
  mode,
  type,
  profile,
  service,
  variant = "default",
  size = "default",
  className = "",
}: FormButtonProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();
  const formRef = useRef<HTMLFormElement>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Aggressively fix aria-hidden conflicts using MutationObserver
  useEffect(() => {
    if (open) {
      let observer: MutationObserver | null = null;

      // Function to remove aria-hidden from main and body
      const removeAriaHidden = () => {
        const mainElement = document.querySelector("main");
        const bodyElement = document.body;

        if (mainElement?.hasAttribute("aria-hidden")) {
          mainElement.removeAttribute("aria-hidden");
        }
        if (mainElement?.hasAttribute("data-aria-hidden")) {
          mainElement.removeAttribute("data-aria-hidden");
        }
        if (bodyElement?.hasAttribute("aria-hidden")) {
          bodyElement.removeAttribute("aria-hidden");
        }
      };

      // Immediately remove aria-hidden
      removeAriaHidden();

      // Set up observer to watch for aria-hidden being re-added
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "attributes") {
            const target = mutation.target as Element;
            if (
              (target.tagName === "MAIN" || target.tagName === "BODY") &&
              (mutation.attributeName === "aria-hidden" ||
                mutation.attributeName === "data-aria-hidden")
            ) {
              // Remove aria-hidden immediately if it gets re-added
              if (target.hasAttribute("aria-hidden")) {
                target.removeAttribute("aria-hidden");
              }
              if (target.hasAttribute("data-aria-hidden")) {
                target.removeAttribute("data-aria-hidden");
              }
            }
          }
        });
      });

      // Start observing
      const mainElement = document.querySelector("main");
      const bodyElement = document.body;

      if (mainElement) {
        observer.observe(mainElement, {
          attributes: true,
          attributeFilter: ["aria-hidden", "data-aria-hidden"],
        });
      }
      if (bodyElement) {
        observer.observe(bodyElement, {
          attributes: true,
          attributeFilter: ["aria-hidden", "data-aria-hidden"],
        });
      }

      // Also run a periodic check every 100ms
      const intervalId = setInterval(removeAriaHidden, 100);

      // Cleanup
      return () => {
        if (observer) {
          observer.disconnect();
        }
        clearInterval(intervalId);
      };
    }
  }, [open]);

  // Form instances
  const employeeForm = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      position: "backRoom",
      workingTimes: [],
      timeOffSchedules: [],
    },
  });

  const customerForm = useForm<z.infer<typeof customerFormSchema>>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  const serviceForm = useForm<z.infer<typeof serviceFormSchema>>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      duration: 15,
      category: {
        _ref: "",
        _type: "reference",
      },
      showOnline: true,
    },
  });

  const appointmentForm = useForm<z.infer<typeof appointmentFormSchema>>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      customer: {
        firstName: "",
        lastName: "",
        phone: "",
        _ref: "",
        _type: "reference",
      },
      employee: {
        _ref: "",
        _type: "reference",
      },
      time: "",
      note: "",
      reminder: true,
      services: [],
    },
  });

  // Get appropriate form instance based on type
  const getFormInstance = () => {
    switch (type) {
      case "employees":
        return employeeForm;
      case "customers":
        return customerForm;
      case "services":
        return serviceForm;
      case "schedule":
        return appointmentForm;
      default:
        return employeeForm;
    }
  };

  // Get title based on mode and type
  const getTitle = () => {
    if (mode === "history" && profile) {
      return `${getProfileName(profile)}'s History`;
    }
    if (mode === "edit" && profile) {
      return `Edit ${getProfileName(profile)}`;
    }
    if (mode === "edit" && service) {
      return `Edit ${service.name}`;
    }
    if (mode === "delete" && profile) {
      return `Delete ${getProfileName(profile)}`;
    }
    // Create mode
    switch (type) {
      case "employees":
        return "New Employee";
      case "customers":
        return "New Customer";
      case "services":
        return "New Service";
      case "schedule":
        return "New Appointment";
      default:
        return "New Item";
    }
  };

  // Get description based on mode and type
  const getDescription = () => {
    if (mode === "history" && profile) {
      return `View service history for ${getProfileName(profile)}.`;
    }
    if (mode === "edit" && profile) {
      return `Update details for ${getProfileName(profile)}.`;
    }
    if (mode === "edit" && service) {
      return `Update details for ${service.name}.`;
    }
    if (mode === "delete" && profile) {
      return `Delete ${getProfileName(profile)}.`;
    }
    // Create mode
    switch (type) {
      case "employees":
        return "Create a new employee with basic information, working time and time-off schedule.";
      case "customers":
        return "Create a new customer with basic information, contact information and address.";
      case "services":
        return "Create a new service with details and pricing.";
      case "schedule":
        return "Create a new appointment with service, customer and employee.";
      default:
        return "";
    }
  };

  // Get toast description
  const getToastDescription = () => {
    if (mode === "edit" && profile) {
      return `${getProfileName(profile)} updated successfully`;
    } else if (mode === "edit" && service) {
      return `${service.name} updated successfully`;
    }
    // Create mode
    switch (type) {
      case "employees":
        return "New Employee created successfully";
      case "customers":
        return "New Customer created successfully";
      case "services":
        return "New Service created successfully";
      case "schedule":
        return "New Appointment created successfully";
      default:
        return "Operation completed successfully";
    }
  };

  // Get submit button text based on state and mode
  const getSubmitButtonText = () => {
    if (isSubmitting) {
      return mode === "edit" ? "Updating..." : "Creating...";
    }
    return "Save";
  };

  // Handle employee form success
  const handleEmployeeSuccess = async () => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);

    try {
      const formValues = employeeForm.getValues();
      console.log("Employee formValues", formValues);

      const formData = new FormData();
      formData.append("firstName", formValues.firstName);
      formData.append("lastName", formValues.lastName);
      formData.append("phone", formValues.phone || "");
      formData.append("position", formValues.position);

      if (mode === "edit" && profile) {
        // Update mode - include _id
        const profileId = getProfileId(profile);
        console.log("Updating employee with ID:", profileId);

        const result = await updateEmployee(
          profileId,
          formData,
          formValues.workingTimes as unknown as WorkingTime[],
          formValues.timeOffSchedules as unknown as TimeOffSchedule[],
        );

        if (result.status == "SUCCESS") {
          setOpen(false);
          employeeForm.reset();
          toast.success("Success", {
            description: getToastDescription(),
          });
        } else {
          toast.error("Error", {
            description: result.error,
          });
        }
        return;
      }

      // Create mode
      const result = await createEmployee(
        formData,
        formValues.workingTimes as unknown as WorkingTime[],
        formValues.timeOffSchedules as unknown as TimeOffSchedule[],
      );

      if (result.status == "SUCCESS") {
        setOpen(false);
        employeeForm.reset();
        toast.success("Success", {
          description: getToastDescription(),
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle customer form success
  const handleCustomerSuccess = async () => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);

    try {
      const formValues = customerForm.getValues();
      console.log("Customer formValues", formValues);

      const formData = new FormData();
      formData.append("firstName", formValues.firstName);
      formData.append("lastName", formValues.lastName);
      formData.append("phone", formValues.phone || "");

      if (mode === "edit" && profile) {
        // Update mode - include _id
        const profileId = getProfileId(profile);
        console.log("Updating customer with ID:", profileId);

        const result = await updateCustomer(profileId, formData);

        if (result.status == "SUCCESS") {
          setOpen(false);
          customerForm.reset();
          toast.success("Success", {
            description: getToastDescription(),
          });
        } else {
          toast.error("Error", {
            description: result.error,
          });
        }
        return;
      }

      // Create mode
      const result = await createCustomer(formData);

      console.log("Customer creation result:", result);

      if (result.status == "SUCCESS") {
        setOpen(false);
        customerForm.reset();
        toast.success("Success", {
          description: getToastDescription(),
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle service form success
  const handleServiceSuccess = async () => {
    try {
      if (isSubmitting) return; // Prevent double submission
      setIsSubmitting(true);

      const formValues = serviceForm.getValues();
      const formData = new FormData();
      formData.append("name", formValues.name);
      formData.append("price", formValues.price.toString());
      formData.append("duration", formValues.duration.toString());
      formData.append("showOnline", formValues.showOnline.toString());

      if (mode === "edit" && service) {
        // Update mode - include _id
        if (!service) {
          toast.error("Error", {
            description: "Service not found for update",
          });
          return;
        }
        const result = await updateService(getServiceId(service), formData);

        if (result.status == "SUCCESS") {
          setOpen(false);
          serviceForm.reset();
          toast.success("Success", {
            description: getToastDescription(),
          });
        } else {
          toast.error("Error", {
            description: result.error,
          });
        }
        return;
      }

      // Create mode
      const result = await createService(formData, formValues.category);
      if (result.status == "SUCCESS") {
        setOpen(false);
        serviceForm.reset();
        toast.success("Success", {
          description: getToastDescription(),
        });
        return;
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

  // Handle appointment form success
  const handleAppointmentSuccess = async () => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);

    try {
      const formValues = appointmentForm.getValues();

      const formData = new FormData();
      formData.append("time", formValues.time);
      formData.append("note", formValues.note || "");
      formData.append("reminder", formValues.reminder.toString());
      if (formValues.customer._ref) {
        // Create mode
        const result = await createAppointment(
          formData,
          {
            _ref: formValues.customer._ref,
            _type: formValues.customer._type,
          },
          formValues.employee,
          formValues.services,
        );

        if (result.status == "SUCCESS") {
          setOpen(false);
          appointmentForm.reset();
          toast.success("Success", {
            description: getToastDescription(),
          });
        } else {
          toast.error("Error", {
            description: result.error,
          });
        }
      } else {
        // create customer then get customer ID to create appointment
        const customerFormData = new FormData();
        customerFormData.append("firstName", formValues.customer.firstName);
        customerFormData.append("lastName", formValues.customer.lastName);
        customerFormData.append("phone", formValues.customer.phone || "");

        const customerResult = await createCustomer(customerFormData);
        console.log("Customer creation result:", customerResult);
        if (customerResult.status === "SUCCESS") {
          // Now create appointment with new customer
          const customerId = customerResult._id; // Assuming data contains the new customer object
          const result = await createAppointment(
            formData,
            {
              _ref: customerId,
              _type: "reference",
            },
            formValues.employee,
            formValues.services,
          );

          if (result.status === "SUCCESS") {
            setOpen(false);
            appointmentForm.reset();
            toast.success("Success", {
              description: getToastDescription(),
            });
          } else {
            toast.error("Error", {
              description: result.error,
            });
          }
        } else {
          toast.error("Error", {
            description: customerResult.error,
          });
        }
      }
    } catch (error) {
      console.log(error);
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Main form success handler
  const handleFormSuccess = async () => {
    switch (type) {
      case "employees":
        await handleEmployeeSuccess();
        break;
      case "customers":
        await handleCustomerSuccess();
        break;
      case "services":
        await handleServiceSuccess();
        break;
      case "schedule":
        await handleAppointmentSuccess();
        break;
      default:
        console.log("Unknown form type:", type);
    }
  };

  // Render appropriate form based on mode and type
  const renderForm = () => {
    if (mode === "history") {
      return <DataTable columns={columns} data={historyData} />;
    }

    switch (type) {
      case "employees":
        return (
          <EmployeeForm
            form={employeeForm}
            onSuccess={handleFormSuccess}
            hideSubmitButton={isMobile}
            formRef={isMobile ? formRef : undefined}
            isSubmitting={isSubmitting}
          />
        );
      case "customers":
        return (
          <CustomerForm
            form={customerForm}
            onSuccess={handleFormSuccess}
            hideSubmitButton={isMobile}
            formRef={isMobile ? formRef : undefined}
            initialData={
              mode === "edit" && type === "customers"
                ? (profile as Customer)
                : undefined
            }
            isSubmitting={isSubmitting}
          />
        );
      case "services":
        return (
          <ServiceForm
            form={serviceForm}
            onSuccess={handleFormSuccess}
            hideSubmitButton={isMobile}
            formRef={isMobile ? formRef : undefined}
            isSubmitting={isSubmitting}
            initialData={
              mode === "edit" && service ? (service as Service) : undefined
            }
          />
        );
      case "schedule":
        return (
          <AppointmentForm
            form={appointmentForm}
            onSuccess={handleFormSuccess}
            hideSubmitButton={isMobile}
            formRef={isMobile ? formRef : undefined}
            isSubmitting={isSubmitting}
          />
        );

      default:
        return null;
    }
  };

  // Handle submit from drawer footer
  const handleDrawerSubmit = () => {
    if (isSubmitting || !formRef.current) return;
    formRef.current.requestSubmit();
  };

  // Handle open/close dialog để reset form
  const handleOpenChange = (newOpen: boolean) => {
    if (isSubmitting && !newOpen) return; // Prevent closing while submitting
    setOpen(newOpen);

    if (newOpen) {
      setIsSubmitting(false); // Reset submitting state when opening
      const currentForm = getFormInstance();

      if (
        mode === "edit" &&
        profile &&
        type === "employees" &&
        isEmployee(profile)
      ) {
        // Load existing employee data
        const formData = {
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          phone: profile.phone || "",
          position: profile.position || "serviceProvider",
          workingTimes:
            profile.workingTimes?.map((wt) => ({
              from: wt.from || "",
              to: wt.to || "",
              day: wt.day || "",
            })) || [],
          timeOffSchedules:
            profile.timeOffSchedules?.map((to) => ({
              from: to.from || "",
              to: to.to || "",
              reason: to.reason || "",
              period:
                (to.period as "Exact" | "Daily" | "Weekly" | "Monthly") ||
                "Exact",
              date: to.date ? new Date(to.date) : undefined,
              dayOfWeek: to.dayOfWeek || [],
              dayOfMonth: to.dayOfMonth || [],
            })) || [],
        };
        employeeForm.reset(formData);
      } else if (mode === "edit" && profile && type === "customers") {
        // Load existing customer data via CustomerForm's initialData prop
        // CustomerForm will handle the reset internally
      } else {
        // Create mode - reset to defaults
        currentForm.reset();
      }
    } else {
      // Reset form on close
      const currentForm = getFormInstance();
      currentForm.reset();
      setIsSubmitting(false); // Reset submitting state when closing
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (mode === "delete") {
      try {
        setIsSubmitting(true);

        if (profile) {
          if (type === "employees") {
            const result = await deleteEmployee(getProfileId(profile));
            if (result.status === "SUCCESS") {
              setOpen(false);
              setConfirmDialogOpen(false);
              toast.success("Success", {
                description: `${getProfileName(profile)} deleted successfully`,
              });
            } else {
              toast.error("Error", {
                description: result.error,
              });
            }
          } else if (type === "customers") {
            const result = await deleteCustomer(getProfileId(profile));
            if (result.status === "SUCCESS") {
              setOpen(false);
              setConfirmDialogOpen(false);
              toast.success("Success", {
                description: `${getProfileName(profile)} deleted successfully`,
              });
            } else {
              toast.error("Error", {
                description: result.error,
              });
            }
          }
        } else if (service && type === "services") {
          const result = await deleteService(getServiceId(service));
          if (result.status === "SUCCESS") {
            setOpen(false);
            setConfirmDialogOpen(false);
            toast.success("Success", {
              description: `${service.name} deleted successfully`,
            });
          } else {
            toast.error("Error", {
              description: result.error,
            });
          }
        }
      } catch (error) {
        console.log(error);
        toast.error("Error", {
          description: "An unexpected error occurred",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Render delete confirmation content
  const renderDeleteConfirmation = () => {
    const itemName = profile
      ? getProfileName(profile)
      : service?.name || "item";

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{itemName}</strong>? This
          action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setConfirmDialogOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    );
  };

  // Handle main dialog/drawer open for delete mode
  const handleMainOpenChange = (newOpen: boolean) => {
    if (mode === "delete" && newOpen) {
      // For delete mode, show confirmation dialog instead
      setConfirmDialogOpen(true);
      return;
    }

    // Regular open/close logic for other modes
    handleOpenChange(newOpen);
  };

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={handleMainOpenChange}>
          <DrawerTrigger asChild>
            <Button variant={variant} size={size} className={className}>
              {children}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="p-4 h-[95vh] flex flex-col">
            <DrawerHeader className="text-left flex-shrink-0 px-0">
              <DrawerTitle>{getTitle()}</DrawerTitle>
              <DrawerDescription className="sr-only">
                {getDescription()}
              </DrawerDescription>
            </DrawerHeader>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto min-h-0 pb-4">
              {renderForm()}
            </div>

            {/* Fixed footer with buttons */}
            <DrawerFooter className="pt-2 px-0 pb-0 flex-shrink-0 border-t">
              {(mode === "edit" || mode === "create") && (
                <Button onClick={handleDrawerSubmit} disabled={isSubmitting}>
                  {getSubmitButtonText()}
                </Button>
              )}
              <DrawerClose asChild>
                <Button variant="outline" disabled={isSubmitting}>
                  {mode === "history" ? "Close" : "Cancel"}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Delete Confirmation Dialog for Mobile */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {renderDeleteConfirmation()}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant={variant} size={size} className={className}>
            {children}
          </Button>
        </DialogTrigger>
        <DialogContent
          className={`sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl`}
          aria-describedby="form-dialog"
        >
          <DialogHeader>
            <DialogTitle>{getTitle()}</DialogTitle>

            <DialogDescription className="sr-only">
              {getDescription()}
            </DialogDescription>
          </DialogHeader>
          {renderForm()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          {renderDeleteConfirmation()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FormButton;
