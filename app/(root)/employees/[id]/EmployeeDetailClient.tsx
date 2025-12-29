"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeFormSchema } from "@/lib/validation";
import { z } from "zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { updateEmployee, createEmployee } from "@/lib/actions";
import { toast } from "sonner";
import { EmployeeWithRelations } from "@/data/employee";
import { ServiceWithCategory } from "@/data/service";
import { WorkingTime, TimeOffSchedule } from "@/models/profile";
import { AssignedService } from "@/models/assignedService";
import { useServices } from "@/hooks/use-services";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Service } from "@/models/service";
import { Category } from "@/models/category";
import { formatMinuteDuration } from "@/lib/utils";
import ConfirmDialog from "@/components/ConfirmDialog";

interface EmployeeDetailClientProps {
  employee: EmployeeWithRelations | null;
  allServices: ServiceWithCategory[];
  categories: Category[];
}

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const timeRange = [
  "08:00 AM",
  "08:15 AM",
  "08:30 AM",
  "08:45 AM",
  "09:00 AM",
  "09:15 AM",
  "09:30 AM",
  "09:45 AM",
  "10:00 AM",
  "10:15 AM",
  "10:30 AM",
  "10:45 AM",
  "11:00 AM",
  "11:15 AM",
  "11:30 AM",
  "11:45 AM",
  "12:00 PM",
  "12:15 PM",
  "12:30 PM",
  "12:45 PM",
  "01:00 PM",
  "01:15 PM",
  "01:30 PM",
  "01:45 PM",
  "02:00 PM",
  "02:15 PM",
  "02:30 PM",
  "02:45 PM",
  "03:00 PM",
  "03:15 PM",
  "03:30 PM",
  "03:45 PM",
  "04:00 PM",
  "04:15 PM",
  "04:30 PM",
  "04:45 PM",
  "05:00 PM",
  "05:15 PM",
  "05:30 PM",
  "05:45 PM",
  "06:00 PM",
];

// Helper function to generate time options in 15-minute intervals
const generateTimeOptions = () => {
  const options = [];
  for (let minutes = 15; minutes <= 480; minutes += 15) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const label =
      hours > 0
        ? `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim()
        : `${minutes}m`;
    options.push({ value: minutes, label });
  }
  return options;
};

const EmployeeDetailClient = ({
  employee,
  allServices,
  categories,
}: EmployeeDetailClientProps) => {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use props directly
  const services = allServices as unknown as Service[];
  const servicesLoading = false;
  const isCreateMode = !employee;
  const [selectedForAction, setSelectedForAction] = useState<{
    [key: string]: boolean;
  }>({});
  const [pendingChanges, setPendingChanges] = useState<{
    [key: string]: AssignedService;
  }>({});
  const [draftValues, setDraftValues] = useState<{
    [key: string]: Partial<AssignedService>;
  }>({});
  const [showDoneConfirmDialog, setShowDoneConfirmDialog] = useState(false);

  const timeOptions = generateTimeOptions();

  const form = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),
    mode: "onChange",
    defaultValues: {
      firstName: employee?.first_name || employee?.firstName || "",
      lastName: employee?.last_name || employee?.lastName || "",
      phone: employee?.phone || "",
      position: (employee?.position as "owner" | "serviceProvider" | "backRoom") || "backRoom",
      note: employee?.note || "",
      workingTimes: (employee?.workingTimes || []).map((wt) => ({
        day: wt.day || "",
        from: wt.from || "",
        to: wt.to || "",
      })),
      assignedServices: (employee?.assignedServices || []).map((as) => ({
        serviceId: as.serviceId || "",
        price: as.price || 0,
        duration: as.duration || 0,
        processTime: as.processTime || 0,
        processTime: as.processTime || 0,
      })),
      hourlyRate: employee?.hourly_rate || employee?.hourlyRate || 0,
    },
  });

  // Watch for changes (for both create and edit mode)
  useEffect(() => {
    const subscription = form.watch(() => {
      setIsDirty(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Basic fields for enabling Create button
  const [firstNameValue, lastNameValue, phoneValue] = form.watch([
    "firstName",
    "lastName",
    "phone",
  ]);
  const basicsFilled =
    !!firstNameValue?.toString().trim() &&
    !!lastNameValue?.toString().trim() &&
    !!phoneValue?.toString().trim();

  const employeeName = isCreateMode
    ? "New Employee"
    : (employee.first_name || employee.firstName || "") +
    " " +
    (employee.last_name || employee.lastName || "");

  const watchedWorkingTimes = form.watch("workingTimes");
  const workingTimeMap = new Map(
    (watchedWorkingTimes || []).map((wt) => [wt.day, wt])
  );

  const watchedAssignedServices = form.watch("assignedServices");

  const getAssignedServiceIds = () => {
    return watchedAssignedServices
      .map((item: AssignedService) => item.serviceId)
      .filter(Boolean);
  };

  const getServicesByCategory = (isAssigned: boolean) => {
    const assignedIds = getAssignedServiceIds();
    const filteredServices = isAssigned
      ? services.filter((service) => assignedIds.includes(service._id))
      : services.filter((service) => !assignedIds.includes(service._id));

    return filteredServices.reduce(
      (acc, service) => {
        const categoryName = service.category.name;
        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }
        acc[categoryName].push(service);
        return acc;
      },
      {} as Record<string, Service[]>,
    );
  };

  const handleServiceToggle = (
    serviceId: string,
    checked: boolean,
    section: "assigned" | "available",
  ) => {
    setSelectedForAction({
      ...selectedForAction,
      [serviceId]: checked,
    });

    if (section === "available" && checked) {
      const service = services.find((s) => s._id === serviceId);
      if (service) {
        const draftData = draftValues[serviceId];
        const newService: AssignedService = {
          serviceId,
          price: draftData?.price ?? service.price,
          duration: draftData?.duration ?? service.duration,
          processTime: draftData?.processTime ?? service.duration,
        };
        setPendingChanges({
          ...pendingChanges,
          [serviceId]: newService,
        });
      }
    } else if (section === "available" && !checked) {
      const newPending = { ...pendingChanges };
      delete newPending[serviceId];
      setPendingChanges(newPending);
    }
  };

  const handleSelectAllCategory = (
    categoryServices: Service[],
    checked: boolean,
    section: "assigned" | "available",
  ) => {
    const newSelectedForAction = { ...selectedForAction };
    categoryServices.forEach((service) => {
      newSelectedForAction[service._id] = checked;
    });
    setSelectedForAction(newSelectedForAction);

    if (section === "available") {
      if (checked) {
        const newPendingChanges = { ...pendingChanges };
        categoryServices.forEach((service) => {
          const draftData = draftValues[service._id];
          newPendingChanges[service._id] = {
            serviceId: service._id,
            price: draftData?.price ?? service.price,
            duration: draftData?.duration ?? service.duration,
            processTime: draftData?.processTime ?? service.duration,
          };
        });
        setPendingChanges(newPendingChanges);
      } else {
        const newPendingChanges = { ...pendingChanges };
        categoryServices.forEach((service) => {
          delete newPendingChanges[service._id];
        });
        setPendingChanges(newPendingChanges);
      }
    }
  };

  const updateServiceField = (
    serviceId: string,
    field: keyof AssignedService,
    value: string | number | boolean,
    section: "assigned" | "available",
  ) => {
    if (section === "assigned") {
      const currentAssigned = form.getValues("assignedServices") || [];
      const serviceIndex = currentAssigned.findIndex(
        (item: AssignedService) => item.serviceId === serviceId,
      );

      if (serviceIndex >= 0) {
        form.setValue(`assignedServices.${serviceIndex}.${field}`, value, {
          shouldDirty: true,
        });
      }
    } else {
      if (pendingChanges[serviceId]) {
        setPendingChanges({
          ...pendingChanges,
          [serviceId]: {
            ...pendingChanges[serviceId],
            [field]: value,
          },
        });
      } else {
        setDraftValues({
          ...draftValues,
          [serviceId]: {
            ...draftValues[serviceId],
            [field]: value,
          },
        });
      }
    }
  };

  const handleSaveAssigned = () => {
    const currentAssigned = form.getValues("assignedServices") || [];
    const selectedServiceIds = Object.keys(selectedForAction).filter(
      (serviceId) => selectedForAction[serviceId],
    );

    if (selectedServiceIds.length === 0) {
      toast.info("No services selected", {
        description: "Please select at least one service to remove",
      });
      return;
    }

    const filteredServices = currentAssigned.filter(
      (item: AssignedService) => !selectedServiceIds.includes(item.serviceId),
    );

    form.setValue("assignedServices", filteredServices, {
      shouldDirty: true,
    });
    setSelectedForAction({});
    setIsDirty(true);

    toast.success("Services removed successfully", {
      description: `${selectedServiceIds.length} service(s) removed from assigned services`,
    });
  };

  const handleCancelAssigned = () => {
    setSelectedForAction({});
  };

  const handleSaveAvailable = () => {
    const currentAssigned = form.getValues("assignedServices") || [];
    const selectedServiceIds = Object.keys(selectedForAction).filter(
      (serviceId) => selectedForAction[serviceId],
    );

    if (selectedServiceIds.length === 0) {
      toast.info("No services selected", {
        description: "Please select at least one service to assign",
      });
      return;
    }

    const newServices = selectedServiceIds
      .map((serviceId) => pendingChanges[serviceId])
      .filter(Boolean);

    if (newServices.length === 0) {
      toast.warning("No valid services to add", {
        description: "Please configure the selected services before saving",
      });
      return;
    }

    form.setValue("assignedServices", [...currentAssigned, ...newServices], {
      shouldDirty: true,
    });
    setPendingChanges({});
    setSelectedForAction({});
    setIsDirty(true);

    toast.success("Services assigned successfully", {
      description: `${newServices.length} service(s) added to assigned services`,
    });
  };

  const handleCancelAvailable = () => {
    setPendingChanges({});
    setSelectedForAction({});

    const assignedIds = getAssignedServiceIds();
    const newDraftValues = { ...draftValues };
    Object.keys(newDraftValues).forEach((serviceId) => {
      if (!assignedIds.includes(serviceId)) {
        delete newDraftValues[serviceId];
      }
    });
    setDraftValues(newDraftValues);
  };

  const renderServiceTable = (
    categoryServices: Service[],
    section: "assigned" | "available",
  ) => {
    const isAssignedSection = section === "assigned";

    const getServiceSelection = (service: Service) => {
      return !!selectedForAction[service._id];
    };

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">
              <div className="flex items-center space-x-2">
                <span>Service</span>
              </div>
            </TableHead>
            <TableHead className="w-[120px]">Price</TableHead>
            <TableHead className="w-[120px]">Duration</TableHead>
            <TableHead className="w-[140px]">Process Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categoryServices.map((service) => {
            const isSelected = getServiceSelection(service);
            const assignedData = watchedAssignedServices.find(
              (assigned: AssignedService) => assigned.serviceId === service._id,
            );
            const pendingData = pendingChanges[service._id];
            const draftData = draftValues[service._id];

            let serviceData;
            if (isAssignedSection) {
              serviceData = assignedData || draftData;
            } else {
              serviceData = pendingData || draftData;
            }

            return (
              <TableRow key={service._id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleServiceToggle(
                          service._id,
                          checked as boolean,
                          section,
                        )
                      }
                    />
                    <span className="font-medium">{service.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={(() => {
                      if (isAssignedSection && assignedData) {
                        return assignedData.price;
                      }
                      return serviceData?.price ?? service.price;
                    })()}
                    onChange={(e) =>
                      updateServiceField(
                        service._id,
                        "price",
                        Number(e.target.value),
                        section,
                      )
                    }
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={(() => {
                      if (isAssignedSection && assignedData) {
                        return assignedData.duration.toString();
                      }
                      return (
                        serviceData?.duration ?? service.duration
                      ).toString();
                    })()}
                    onValueChange={(value) =>
                      updateServiceField(
                        service._id,
                        "duration",
                        Number(value),
                        section,
                      )
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={(() => {
                      if (isAssignedSection && assignedData) {
                        return assignedData.processTime.toString();
                      }
                      return (
                        serviceData?.processTime ?? service.duration
                      ).toString();
                    })()}
                    onValueChange={(value) =>
                      updateServiceField(
                        service._id,
                        "processTime",
                        Number(value),
                        section,
                      )
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  const handleSave = async () => {
    if (isCreateMode && !isDirty) {
      // For create mode, allow save even if not dirty (initial state)
      setIsDirty(true);
    } else if (!isDirty) {
      return;
    }

    setIsSubmitting(true);
    try {
      const formValues = form.getValues();
      const formData = new FormData();
      formData.append("firstName", formValues.firstName);
      formData.append("lastName", formValues.lastName);
      formData.append("phone", formValues.phone || "");
      formData.append("position", formValues.position);
      formData.append("position", formValues.position);
      formData.append("note", formValues.note || "");
      formData.append("hourlyRate", String(formValues.hourlyRate || 0));

      if (isCreateMode) {
        // Create new employee
        const result = await createEmployee(
          formData,
          formValues.workingTimes as unknown as WorkingTime[],
          [] as TimeOffSchedule[],
          formValues.assignedServices as unknown as AssignedService[]
        );

        if (result.status === "SUCCESS" && result._id) {
          setIsDirty(false);
          // Reset form to mark as not dirty
          form.reset(form.getValues());
          toast.success("Success", {
            description: "Employee created successfully",
          });
          // Navigate to the employee list page
          router.push("/employees");
          router.refresh();
        } else {
          toast.error("Error", {
            description: result.error || "Failed to create employee",
          });
        }
      } else {
        // Update existing employee
        const result = await updateEmployee(
          employee!.id,
          formData,
          formValues.workingTimes as unknown as WorkingTime[],
          [] as TimeOffSchedule[],
          formValues.assignedServices as unknown as AssignedService[]
        );

        if (result.status === "SUCCESS") {
          setIsDirty(false);
          // Reset form to mark as not dirty
          form.reset(form.getValues());
          toast.success("Success", {
            description: "Employee updated successfully",
          });
          router.refresh();
        } else {
          toast.error("Error", {
            description: result.error || "Failed to update employee",
          });
        }
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setIsDirty(false);
  };

  const handleDone = () => {
    // Check if form has changes - use form.formState.isDirty as the source of truth
    const hasChanges = form.formState.isDirty;

    // For create mode, also check if form has any values filled
    const formValues = form.getValues();
    const hasFormData = isCreateMode && (
      formValues.firstName?.trim() ||
      formValues.lastName?.trim() ||
      formValues.phone?.trim() ||
      (formValues.workingTimes && formValues.workingTimes.length > 0) ||
      (formValues.assignedServices && formValues.assignedServices.length > 0)
    );

    if (hasChanges || hasFormData) {
      setShowDoneConfirmDialog(true);
    } else {
      router.push("/employees");
    }
  };

  const handleConfirmDone = () => {
    setShowDoneConfirmDialog(false);
    router.push("/employees");
  };

  const handleCancelDone = () => {
    setShowDoneConfirmDialog(false);
  };

  return (
    <Form {...form}>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="heading">Employees</h2>
            <h3 className="text-2xl font-bold mt-2">{employeeName}</h3>
          </div>
        </div>

        <Accordion type="single" collapsible defaultValue="basic">
          <AccordionItem value="basic">
            <AccordionTrigger className="text-primary hover:text-primary/90">
              Basics
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">
                          First Name
                        </label>
                        <input
                          {...field}
                          className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        />
                      </div>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">
                          Last Name
                        </label>
                        <input
                          {...field}
                          className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        />
                      </div>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">
                          Phone
                        </label>
                        <input
                          {...field}
                          className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        />
                      </div>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">
                          Position
                        </label>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="serviceProvider">
                              Service Provider
                            </SelectItem>
                            <SelectItem value="backRoom">Back Room</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Note
                        </label>
                        <textarea
                          {...field}
                          className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                        />
                      </div>
                    )}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="working">
            <AccordionTrigger className="text-primary hover:text-primary/90">
              Scheduling Hours
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 p-4">
                <FormField
                  control={form.control}
                  name="workingTimes"
                  render={() => (
                    <>
                      {dayLabels.map((day) => {
                        const workingTime = workingTimeMap.get(day);
                        const isWorking = !!workingTime;

                        return (
                          <FormField
                            key={day}
                            control={form.control}
                            name="workingTimes"
                            render={({ field }) => (
                              <div className="flex items-center gap-3">
                                <FormControl>
                                  <Checkbox
                                    checked={isWorking}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([
                                          ...(field.value || []),
                                          {
                                            day,
                                            from: "09:30 AM",
                                            to: "06:00 PM",
                                          },
                                        ]);
                                      } else {
                                        field.onChange(
                                          (field.value || []).filter(
                                            (wt) => wt.day !== day
                                          )
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <span className="font-medium min-w-[80px]">
                                  {day}
                                </span>
                                {isWorking ? (
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={workingTime.from}
                                      onValueChange={(from) => {
                                        field.onChange(
                                          (field.value || []).map((wt) =>
                                            wt.day === day ? { ...wt, from } : wt
                                          )
                                        );
                                      }}
                                    >
                                      <SelectTrigger className="h-8 w-[120px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {timeRange.map((time) => (
                                          <SelectItem key={time} value={time}>
                                            {time}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <span className="text-sm text-muted-foreground">
                                      -
                                    </span>
                                    <Select
                                      value={workingTime.to}
                                      onValueChange={(to) => {
                                        field.onChange(
                                          (field.value || []).map((wt) =>
                                            wt.day === day ? { ...wt, to } : wt
                                          )
                                        );
                                      }}
                                    >
                                      <SelectTrigger className="h-8 w-[120px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {timeRange.map((time) => (
                                          <SelectItem key={time} value={time}>
                                            {time}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    {day === "Mon" ? "CLOSED" : "OFF"}
                                  </span>
                                )}
                              </div>
                            )}
                          />
                        );
                      })}
                    </>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="assigned-services">
            <AccordionTrigger className="text-primary hover:text-primary/90">
              Assigned Services (
              {Object.values(getServicesByCategory(true)).flat().length})
            </AccordionTrigger>
            <AccordionContent>
              {servicesLoading ? (
                <div className="p-4">Loading services...</div>
              ) : (
                <>
                  <div className="space-y-6 p-4">
                    {Object.keys(getServicesByCategory(true)).length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No services assigned yet.
                      </p>
                    ) : (
                      Object.entries(getServicesByCategory(true)).map(
                        ([categoryName, categoryServices]) => (
                          <div key={categoryName} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold">
                                {categoryName}
                              </h3>
                              <Button
                                onClick={() => {
                                  const allSelected = categoryServices.every(
                                    (service) => selectedForAction[service._id],
                                  );
                                  handleSelectAllCategory(
                                    categoryServices,
                                    !allSelected,
                                    "assigned",
                                  );
                                }}
                              >
                                Select all
                              </Button>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                              {renderServiceTable(categoryServices, "assigned")}
                            </div>
                          </div>
                        ),
                      )
                    )}
                  </div>

                  <div className="flex gap-2 justify-end mt-4 pt-4 px-4">
                    <Button
                      variant="outline"
                      onClick={handleCancelAssigned}
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveAssigned} type="button">
                      Save
                    </Button>
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="available-services">
            <AccordionTrigger className="text-primary hover:text-primary/90">
              Available Services (
              {Object.values(getServicesByCategory(false)).flat().length})
            </AccordionTrigger>
            <AccordionContent>
              {servicesLoading ? (
                <div className="p-4">Loading services...</div>
              ) : (
                <>
                  <div className="space-y-6 p-4">
                    {Object.entries(getServicesByCategory(false)).map(
                      ([categoryName, categoryServices]) => (
                        <div key={categoryName} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                              {categoryName}
                            </h3>
                            <Button
                              type="button"
                              onClick={() => {
                                const allSelected = categoryServices.every(
                                  (service) => !!selectedForAction[service._id],
                                );
                                handleSelectAllCategory(
                                  categoryServices,
                                  !allSelected,
                                  "available",
                                );
                              }}
                            >
                              Select all
                            </Button>
                          </div>

                          <div className="border rounded-lg overflow-hidden">
                            {renderServiceTable(categoryServices, "available")}
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="flex gap-2 justify-end mt-4 pt-4 px-4">
                    <Button
                      variant="outline"
                      onClick={handleCancelAvailable}
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveAvailable} type="button">
                      Save
                    </Button>
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="time-tracking">
            <AccordionTrigger className="text-primary hover:text-primary/90">
              {/* Time Tracking */}
              Hourly Rate ($)
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">
                        Set the hourly rate for this employee used in time tracking reports.
                      </label>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="max-w-[200px]"
                        />
                      </FormControl>
                      {/* <p className="text-xs text-muted-foreground">
                        Set the hourly rate for this employee used in time tracking reports.
                      </p> */}
                    </div>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            disabled={
              isSubmitting ||
              (isCreateMode
                ? !basicsFilled
                : !form.formState.isDirty)
            }
            onClick={handleSave}
          >
            {isSubmitting
              ? isCreateMode
                ? "Creating..."
                : "Saving..."
              : isCreateMode
                ? "Create"
                : "Save"}
          </Button>
          {!isCreateMode && (
            <Button
              variant="ghost"
              disabled={!form.formState.isDirty || isSubmitting}
              onClick={handleCancel}
            >
              Cancel Changes
            </Button>
          )}
          <Button variant="default" onClick={handleDone}>
            Done
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={showDoneConfirmDialog}
        onOpenChange={setShowDoneConfirmDialog}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to leave without saving?"
        onConfirm={handleConfirmDone}
        onCancel={handleCancelDone}
        confirmText="Leave Without Saving"
      />
    </Form>
  );
};

export default EmployeeDetailClient;

