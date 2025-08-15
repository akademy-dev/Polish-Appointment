"use client";

import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { employeeFormSchema } from "@/lib/validation";
import { useServices } from "@/hooks/use-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AssignedService } from "@/models/assignedService";
import { Service } from "@/models/service";

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

const EmployeeAssignedServiceForm = ({
  form,
}: {
  form: UseFormReturn<z.infer<typeof employeeFormSchema>>;
}) => {
  const { services, loading, error } = useServices();
  const [pendingChanges, setPendingChanges] = useState<{
    [key: string]: AssignedService;
  }>({});
  const [draftValues, setDraftValues] = useState<{
    [key: string]: Partial<AssignedService>;
  }>({});
  // State để track việc chọn checkbox riêng biệt với assigned status
  const [selectedForAction, setSelectedForAction] = useState<{
    [key: string]: boolean;
  }>({});

  const timeOptions = generateTimeOptions();

  // Watch for changes in assignedServices to trigger re-render
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
    // Chỉ update selectedForAction state
    setSelectedForAction({
      ...selectedForAction,
      [serviceId]: checked,
    });

    // Nếu service được chọn trong available section, chuẩn bị draft data
    if (section === "available" && checked) {
      const service = services.find((s) => s._id === serviceId);
      if (service) {
        const draftData = draftValues[serviceId];
        const newService: AssignedService = {
          serviceId,
          price: draftData?.price ?? service.price,
          duration: draftData?.duration ?? service.duration,
          processTime: draftData?.processTime ?? service.duration,
          showOnline: draftData?.showOnline ?? service.showOnline,
        };
        setPendingChanges({
          ...pendingChanges,
          [serviceId]: newService,
        });
      }
    } else if (section === "available" && !checked) {
      // Remove from pending changes nếu uncheck
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
    // Update selectedForAction cho tất cả services trong category
    const newSelectedForAction = { ...selectedForAction };
    categoryServices.forEach((service) => {
      newSelectedForAction[service._id] = checked;
    });
    setSelectedForAction(newSelectedForAction);

    if (section === "available") {
      if (checked) {
        // Add all services to pending changes in one update
        const newPendingChanges = { ...pendingChanges };
        categoryServices.forEach((service) => {
          const draftData = draftValues[service._id];
          newPendingChanges[service._id] = {
            serviceId: service._id,
            price: draftData?.price ?? service.price,
            duration: draftData?.duration ?? service.duration,
            processTime: draftData?.processTime ?? service.duration,
            showOnline: draftData?.showOnline ?? service.showOnline,
          };
        });
        setPendingChanges(newPendingChanges);
      } else {
        // Remove all services from pending changes in one update
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
      // For assigned services, always update the form directly
      const currentAssigned = form.getValues("assignedServices") || [];
      const serviceIndex = currentAssigned.findIndex(
        (item: AssignedService) => item.serviceId === serviceId,
      );

      if (serviceIndex >= 0) {
        form.setValue(`assignedServices.${serviceIndex}.${field}`, value);
        console.log(
          `Updated assignedServices.${serviceIndex}.${field} to:`,
          value,
        );
      }
    } else {
      // For available services
      if (pendingChanges[serviceId]) {
        // Update pending changes for services that are in pending state
        setPendingChanges({
          ...pendingChanges,
          [serviceId]: {
            ...pendingChanges[serviceId],
            [field]: value,
          },
        });
      } else {
        // Update draft values for services that aren't in pending state
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
    // Remove selected services from assigned services
    const currentAssigned = form.getValues("assignedServices") || [];
    const selectedServiceIds = Object.keys(selectedForAction).filter(
      (serviceId) => selectedForAction[serviceId],
    );

    const filteredServices = currentAssigned.filter(
      (item: AssignedService) => !selectedServiceIds.includes(item.serviceId),
    );

    form.setValue("assignedServices", filteredServices);

    // Clear all selections sau khi save
    setSelectedForAction({});
  };

  const handleCancelAssigned = () => {
    // Clear all selections
    setSelectedForAction({});
  };

  const handleSaveAvailable = () => {
    // Apply pending changes for selected services to form
    const currentAssigned = form.getValues("assignedServices") || [];
    const selectedServiceIds = Object.keys(selectedForAction).filter(
      (serviceId) => selectedForAction[serviceId],
    );

    const newServices = selectedServiceIds
      .map((serviceId) => pendingChanges[serviceId])
      .filter(Boolean);

    form.setValue("assignedServices", [...currentAssigned, ...newServices]);

    // Clear pending changes và selections sau khi save
    setPendingChanges({});
    setSelectedForAction({});
  };

  const handleCancelAvailable = () => {
    // Clear pending changes và selections
    setPendingChanges({});
    setSelectedForAction({});

    // Clear draft values for services that aren't assigned
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
      // Sử dụng selectedForAction thay vì assigned status
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
            <TableHead className="w-[140px]">Shows Online</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categoryServices.map((service) => {
            const isSelected = getServiceSelection(service);
            const assignedData = watchedAssignedServices.find(
              (assigned: AssignedService) => assigned.serviceId === service._id,
            );

            // Debug: Log assigned data for this service
            if (isAssignedSection && service._id) {
              console.log(`Service ${service.name} (${service._id}):`, {
                assignedData,
                showOnline: assignedData?.showOnline,
                allAssignedServices: watchedAssignedServices,
              });
            }
            const pendingData = pendingChanges[service._id];
            const draftData = draftValues[service._id];

            // Determine which data to show
            let serviceData;
            if (isAssignedSection) {
              // For assigned services, always use assignedData if available
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
                <TableCell>
                  <Select
                    value={(() => {
                      if (isAssignedSection && assignedData) {
                        // For assigned services, always use the employee's assigned value
                        const value = assignedData.showOnline.toString();
                        console.log(
                          `ShowOnline value for ${service.name}:`,
                          value,
                          "from assignedData:",
                          assignedData.showOnline,
                        );
                        return value;
                      }
                      // For available services or fallback
                      const value = (
                        serviceData?.showOnline ?? service.showOnline
                      ).toString();
                      console.log(
                        `ShowOnline value for ${service.name}:`,
                        value,
                        "from fallback",
                      );
                      return value;
                    })()}
                    onValueChange={(value) => {
                      console.log(
                        `Changing showOnline for ${service._id} from ${serviceData?.showOnline} to ${value === "true"}`,
                      );
                      updateServiceField(
                        service._id,
                        "showOnline",
                        value === "true",
                        section,
                      );
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
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

  if (loading) {
    return <div className="p-4">Loading services...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">Error loading services: {error}</div>
    );
  }

  const assignedByCategory = getServicesByCategory(true);
  const availableByCategory = getServicesByCategory(false);

  return (
    <div className="space-y-6">
      <Accordion type="single" className="w-full">
        <AccordionItem value="assigned">
          <AccordionTrigger className="text-lg font-semibold">
            Assigned Services ({Object.values(assignedByCategory).flat().length}
            )
          </AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-[400px] w-full">
              <div className="space-y-6 pr-4">
                {Object.keys(assignedByCategory).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No services assigned yet.
                  </p>
                ) : (
                  Object.entries(assignedByCategory).map(
                    ([categoryName, categoryServices]) => (
                      <div key={categoryName} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold ">
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

                        {categoryServices !==
                          Object.entries(assignedByCategory)[
                            Object.entries(assignedByCategory).length - 1
                          ][1] && <Separator className="mt-6" />}
                      </div>
                    ),
                  )
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
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
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="available">
          <AccordionTrigger className="text-lg font-semibold">
            Available Services (
            {Object.values(availableByCategory).flat().length})
          </AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-[500px] w-full">
              <div className="space-y-6 pr-4">
                {Object.entries(availableByCategory).map(
                  ([categoryName, categoryServices]) => (
                    <div key={categoryName} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold ">
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

                      {categoryServices !==
                        Object.entries(availableByCategory)[
                          Object.entries(availableByCategory).length - 1
                        ][1] && <Separator className="mt-6" />}
                    </div>
                  ),
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default EmployeeAssignedServiceForm;
