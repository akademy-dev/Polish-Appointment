"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "../ui/button";
import { employeeFormSchema } from "@/lib/validation";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Textarea } from "../ui/textarea";
import { dayLabels, daysOfMonth, timeRange } from "./EmployeeWorkingForm";
import MultipleSelector from "../ui/multi-select";

const timeScheduleFormTabs = ["Exact", "Daily", "Weekly", "Monthly"];

const TimeOffScheduleForm = ({
  form,
  selectedTimeOffScheduleIndex,
}: {
  form: UseFormReturn<z.infer<typeof employeeFormSchema>>;
  selectedTimeOffScheduleIndex: number;
}) => {
  console.log("selectedTimeOffScheduleIndex", selectedTimeOffScheduleIndex);

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case "Exact":
        form.setValue(`timeOffSchedule.${selectedTimeOffScheduleIndex}`, {
          ...form.getValues(`timeOffSchedule.${selectedTimeOffScheduleIndex}`),
          date: new Date(),
          period: "Exact",
          dayOfWeek: [],
          dayOfMonth: [],
        });
        break;
      case "Daily":
        form.setValue(`timeOffSchedule.${selectedTimeOffScheduleIndex}`, {
          ...form.getValues(`timeOffSchedule.${selectedTimeOffScheduleIndex}`),
          date: undefined,
          period: "Daily",
          dayOfWeek: [],
          dayOfMonth: [],
        });
        break;
      case "Weekly":
        form.setValue(`timeOffSchedule.${selectedTimeOffScheduleIndex}`, {
          ...form.getValues(`timeOffSchedule.${selectedTimeOffScheduleIndex}`),
          date: undefined,
          period: "Weekly",
          dayOfWeek: [],
          dayOfMonth: [],
        });
        break;
      case "Monthly":
        form.setValue(`timeOffSchedule.${selectedTimeOffScheduleIndex}`, {
          ...form.getValues(`timeOffSchedule.${selectedTimeOffScheduleIndex}`),
          date: undefined,
          period: "Monthly",
          dayOfWeek: [],
          dayOfMonth: [],
        });
        break;
      default:
        break;
    }
  };

  const calculateIndex = () => {
    const schedule = form.getValues(
      `timeOffSchedule.${selectedTimeOffScheduleIndex}`
    );
    if (!schedule || !schedule.period) return 0;
    switch (schedule.period) {
      case "Exact":
        return 0;
      case "Daily":
        return 1;
      case "Weekly":
        return 2;
      case "Monthly":
        return 3;
      default:
        return 0;
    }
  };

  const index = calculateIndex();

  return (
    <Tabs
      defaultValue={timeScheduleFormTabs[index]}
      className="w-full bg-secondary pt-2 px-2"
      onValueChange={handleTabChange}
    >
      <TabsList className="flex-between w-full">
        {timeScheduleFormTabs.map((tab) => (
          <TabsTrigger key={tab} value={tab}>
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>

      {timeScheduleFormTabs.map((tab) => {
        return (
          <TabsContent key={tab} value={tab} className="w-full mt-2">
            <div className="space-y-4">
              {tab === "Exact" && (
                <FormField
                  control={form.control}
                  name={`timeOffSchedule.${selectedTimeOffScheduleIndex}.date`}
                  render={({ field }) => (
                    <FormItem className="flex-between">
                      <FormLabel className="text-lg-medium">Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[240px] pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value || new Date(), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              return (
                                date <
                                new Date(
                                  new Date().setDate(new Date().getDate() - 1)
                                )
                              );
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {tab === "Daily" && (
                <div className="flex-between">
                  <p className="text-lg-medium">Everyday</p>
                </div>
              )}

              {tab === "Weekly" && (
                <FormField
                  control={form.control}
                  name={`timeOffSchedule.${selectedTimeOffScheduleIndex}.dayOfWeek`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg-medium">
                        Days of the week
                      </FormLabel>
                      <MultipleSelector
                        {...field}
                        value={field.value?.map((v) => ({
                          value: v.toString(),
                          label: dayLabels[v - 1],
                        }))}
                        defaultOptions={dayLabels.map((day, index) => ({
                          value: (index + 1).toString(),
                          label: day,
                        }))}
                        onChange={(value) => {
                          field.onChange(value.map((v) => Number(v.value)));
                        }}
                        placeholder=""
                        emptyIndicator={
                          <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                            No results found.
                          </p>
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {tab === "Monthly" && (
                <FormField
                  control={form.control}
                  name={`timeOffSchedule.${selectedTimeOffScheduleIndex}.dayOfMonth`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg-medium">
                        Days of the month
                      </FormLabel>
                      <MultipleSelector
                        {...field}
                        value={field.value?.map((v) => ({
                          value: v.toString(),
                          label: v.toString(),
                        }))}
                        defaultOptions={daysOfMonth.map((day) => ({
                          value: day.toString(),
                          label: day.toString(),
                        }))}
                        onChange={(value) => {
                          field.onChange(value.map((v) => Number(v.value)));
                        }}
                        placeholder=""
                        emptyIndicator={
                          <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                            No results found.
                          </p>
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <hr />

              <div className="grid grid-rows-2 my-4">
                <p className="text-lg-medium grid-rows-1">Time</p>
                <div className="flex-between gap-4 w-full grid-rows-2">
                  <FormField
                    control={form.control}
                    name={`timeOffSchedule.${selectedTimeOffScheduleIndex}.from`}
                    render={({ field }) => (
                      <FormItem className="flex-between">
                        <FormLabel>From</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeRange.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`timeOffSchedule.${selectedTimeOffScheduleIndex}.to`}
                    render={({ field }) => (
                      <FormItem className="flex-between">
                        <FormLabel>To</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeRange.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <hr />

              <FormField
                control={form.control}
                name={`timeOffSchedule.${selectedTimeOffScheduleIndex}.reason`}
                render={({ field }) => (
                  <FormItem className="flex-between my-4">
                    <FormLabel className="text-lg-medium">Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Enter reason"
                        className="bg-background resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
};

export default TimeOffScheduleForm;
