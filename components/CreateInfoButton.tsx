"use client";
import { useState, useRef } from "react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import TimeScheduleCard, { TimeScheduleCardProps } from "./TimeScheduleCard";
import TimeScheduleForm from "./TimeScheduleForm";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import SelectTime from "./SelectTime";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeFormSchema } from "@/lib/validation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getTimeFromDate } from "@/lib/utils";

const dateLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CreateInfoButton = ({ type }: { type: string }) => {
  // 1. Define your form.
  const form = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: "",
      role: "Employee",
      workingTimeSchedule: {
        from: "07:00",
        to: "19:00",
        days: [],
      },
    },
  });
  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof employeeFormSchema>) {
    console.log(values);
  }

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [timeScheduleCardData, setTimeScheduleCardData] = useState<
    TimeScheduleCardProps[]
  >([
    { id: "1", date: "Every Day", time: "", reason: "Sick" },
    {
      id: "2",
      date: "Every Wednesday",
      time: "",
      reason: "One day a week off",
    },
    {
      id: "3",
      date: "May 20, 2025",
      time: "10:00 - 12:00",
      reason: "Birthday",
    },
    { id: "4", date: "Day 03 Every Month", time: "", reason: "Public Holiday" },
    { id: "5", date: "March Every Year", time: "", reason: "Sabbath" },
  ]);

  const handleAddTimeScheduleCard = () => {
    setTimeScheduleCardData([
      { id: Date.now().toString(), date: "", time: "", reason: "" },
      ...timeScheduleCardData,
    ]);

    // Use setTimeout to ensure the new element is rendered before scrolling
    setTimeout(() => {
      const scrollContainer = scrollContainerRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 0);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="default" className="sm:whitespace-nowrap">
          {type === "employees" ? "New Employee" : "New Customer"}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>New Employee</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 p-4">
              <div className="grid grid-cols-5 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Employee">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid-center">
                <p className="text-xl-semibold">Working time</p>
              </div>

              <div className="grid-center grid-rows-2 gap-4">
                <div className="row-span-1 flex gap-4">
                  <FormField
                    control={form.control}
                    name="workingTimeSchedule"
                    render={({ field }) => (
                      <FormItem className="col-span-1">
                        <FormControl>
                          <SelectTime
                            label="From"
                            date={
                              new Date("2025-05-27T" + field.value.from + ":00")
                            }
                            setDate={(date) => {
                              field.onChange({
                                ...field.value,
                                from: getTimeFromDate(date),
                              });
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="workingTimeSchedule"
                    render={({ field }) => (
                      <FormItem className="col-span-1">
                        <FormControl>
                          <SelectTime
                            label="To"
                            date={
                              new Date("2025-05-27T" + field.value.to + ":00")
                            }
                            setDate={(date) => {
                              field.onChange({
                                ...field.value,
                                to: getTimeFromDate(date),
                              });
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="workingTimeSchedule.days"
                  render={() => (
                    <FormItem className="flex flex-col">
                      <div className="flex-between gap-1">
                        {dateLabels.map((item) => (
                          <FormField
                            key={item}
                            control={form.control}
                            name="workingTimeSchedule.days"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item}
                                  className="flex-between gap-1"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                              ...field.value,
                                              item,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== item
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel>{item}</FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid-center grid-cols-3 gap-4">
                <p className="col-span-2 text-xl-semibold">Time-off schedule</p>
                <Button
                  variant="outline"
                  className="col-span-1"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddTimeScheduleCard();
                  }}
                >
                  Add new entry
                </Button>
              </div>

              <ScrollArea
                ref={scrollContainerRef}
                className="h-37 rounded-md border"
              >
                {timeScheduleCardData.map((card) => (
                  <TimeScheduleCard
                    key={card.id}
                    {...card}
                    onRemove={() => {
                      setTimeScheduleCardData(
                        timeScheduleCardData.filter((c) => c.id !== card.id)
                      );
                    }}
                  />
                ))}
                <ScrollBar orientation="vertical" />
              </ScrollArea>

              <div className="grid rounded-md border">
                <TimeScheduleForm />
              </div>
            </div>
            <SheetFooter className="py-0">
              <Button type="submit">Save</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default CreateInfoButton;
