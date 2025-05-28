import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { formatDate, formatDuration } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { clientFormSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

export const CreateAppointmentDialog: React.FC<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ isOpen, onOpenChange }) => {
  const [tab, setTab] = React.useState("client");
  // Define the form
  const form = useForm<z.infer<typeof clientFormSchema>>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  // define a submit handler
  function onSubmit(data: z.infer<typeof clientFormSchema>) {
    console.log("Form submitted with data:", data);
    // Here you would typically handle the form submission, e.g., send data to an API
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 [&>button]:hidden min-w-[800px] max-w-none w-auto min-h-[600px]">
        <VisuallyHidden>
          <DialogTitle>Create Appointment</DialogTitle>
        </VisuallyHidden>
        <div className="flex">
          {/* Left: Tabs for Client and Appointment */}
          <div className="shadow-2xl p-2  bg-secondary rounded-bl-lg rounded-tl-lg">
            <Tabs value={tab} onValueChange={setTab} orientation="vertical">
              <TabsList className="items-start bg-transparent p-0 w-full">
                <TabsTrigger value="client">Client</TabsTrigger>
                <TabsTrigger value="appointment">Appointment</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {/* Right: Tab Content */}

          <div className="flex-1 p-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {tab === "client" && (
                  <div>
                    {/* Client tab content */}
                    <div className="flex flex-between justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold mb-2">
                        Basic Information
                      </h2>
                      <div className="relative max-w-sm">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Search className="w-4 h-4 text-black" />
                        </span>
                        <Input className="pl-10" placeholder="Search" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-start gap-4">
                                <Label
                                  htmlFor="firstName"
                                  className="whitespace-nowrap flex items-center pt-1 text-md min-w-[120px] text-right"
                                >
                                  First Name
                                </Label>
                                <div className="flex flex-col gap-1">
                                  <Input
                                    type="text"
                                    id="firstName"
                                    placeholder="First Name"
                                    className="w-m"
                                    {...field}
                                  />
                                  <FormMessage className="pl-1" />
                                </div>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-start gap-4">
                                <Label
                                  htmlFor="lastName"
                                  className="whitespace-nowrap flex items-center pt-1 text-md min-w-[120px] text-right"
                                >
                                  Last Name
                                </Label>
                                <div className="flex flex-col gap-1">
                                  <Input
                                    type="text"
                                    id="lastName"
                                    placeholder="Last Name"
                                    className="w-m"
                                    {...field}
                                  />
                                  <FormMessage className=" pl-1" />
                                </div>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-start gap-4">
                                <Label
                                  htmlFor="phone"
                                  className="whitespace-nowrap flex items-center pt-1 text-md min-w-[120px] text-right"
                                >
                                  Phone Number
                                </Label>
                                <div className="flex flex-col gap-1">
                                  <Input
                                    type="text"
                                    id="phone"
                                    placeholder="Phone Number"
                                    className="w-m"
                                    {...field}
                                  />
                                  <FormMessage className=" pl-1" />
                                </div>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <DataTable
                      columns={[
                        {
                          accessorKey: "service",
                          header: "Service",
                        },
                        {
                          accessorKey: "staff",
                          header: "Staff",
                        },
                        {
                          accessorKey: "date",
                          header: ({ column }) => {
                            return (
                              <Button
                                variant="ghost"
                                onClick={() =>
                                  column.toggleSorting(
                                    column.getIsSorted() === "asc",
                                  )
                                }
                              >
                                Date
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            );
                          },
                          cell: ({ row }) => {
                            return (
                              <div>
                                {formatDate(row.original.date.toISOString())}
                              </div>
                            );
                          },
                        },
                        {
                          accessorKey: "duration",
                          header: ({ column }) => {
                            return (
                              <Button
                                variant="ghost"
                                onClick={() =>
                                  column.toggleSorting(
                                    column.getIsSorted() === "asc",
                                  )
                                }
                              >
                                Duration
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            );
                          },
                          cell: ({ row }) => {
                            return (
                              <div>{formatDuration(row.original.duration)}</div>
                            );
                          },
                        },
                      ]}
                      data={[
                        {
                          service: "Haircut",
                          staff: "John Doe",
                          date: new Date("2023-10-01T10:00:00Z"),
                          duration: 30,
                        },
                        {
                          service: "Manicure",
                          staff: "Jane Smith",
                          date: new Date("2023-10-02T11:00:00Z"),
                          duration: 45,
                        },
                        {
                          service: "Pedicure",
                          staff: "Alice Johnson",
                          date: new Date("2023-10-03T12:00:00Z"),
                          duration: 60,
                        },
                        {
                          service: "Facial",
                          staff: "Bob Brown",
                          date: new Date("2023-10-04T13:00:00Z"),
                          duration: 90,
                        },
                        {
                          service: "Massage",
                          staff: "Charlie White",
                          date: new Date("2023-10-05T14:00:00Z"),
                          duration: 120,
                        },
                        {
                          service: "Hair Coloring",
                          staff: "Diana Green",
                          date: new Date("2023-10-06T15:00:00Z"),
                          duration: 75,
                        },
                        {
                          service: "Waxing",
                          staff: "Eve Black",
                          date: new Date("2023-10-07T16:00:00Z"),
                          duration: 30,
                        },
                        {
                          service: "Eyebrow Shaping",
                          staff: "Frank Blue",
                          date: new Date("2023-10-08T17:00:00Z"),
                          duration: 20,
                        },
                        {
                          service: "Makeup",
                          staff: "Grace Yellow",
                          date: new Date("2023-10-09T18:00:00Z"),
                          duration: 90,
                        },
                      ]}
                      height="200px"
                      titleEmpty="No service history available."
                      searchColumn="service"
                    />
                  </div>
                )}
                {tab === "appointment" && <div></div>}
                <div className="flex justify-end mt-4 gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      form.reset();
                      onOpenChange(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
