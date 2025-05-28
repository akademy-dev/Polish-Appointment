"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "../ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";
import { employeeFormSchema } from "@/lib/validation";
import { useEffect } from "react";

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
import { TimeOffScheduleCardProps } from "./TimeOffScheduleCard";

const timeScheduleFormTabs = ["Exact", "Daily", "Weekly", "Monthly", "Yearly"];

const TimeOffScheduleForm = ({
  selectedTimeOffSchedule,
  setSelectedTimeOffSchedule,
}: {
  selectedTimeOffSchedule: TimeOffScheduleCardProps | null;
  setSelectedTimeOffSchedule: (
    timeOffSchedule: TimeOffScheduleCardProps | null
  ) => void;
}) => {
  const form = useFormContext<z.infer<typeof employeeFormSchema>>();

  useEffect(() => {
    if (selectedTimeOffSchedule) {
      form.setValue("timeOffSchedule", {
        date: selectedTimeOffSchedule.date,
        fromTime: selectedTimeOffSchedule.fromTime,
        toTime: selectedTimeOffSchedule.toTime,
        reason: selectedTimeOffSchedule.reason,
      });
    }
    return () => {
      form.setValue("timeOffSchedule", {
        date: "",
        fromTime: "",
        toTime: "",
        reason: "",
      });
    };
  }, [selectedTimeOffSchedule, form]);

  return (
    <Tabs
      defaultValue={timeScheduleFormTabs[0]}
      className="w-full bg-secondary py-2 px-2"
    >
      <TabsList className="flex-between w-full">
        {timeScheduleFormTabs.map((tab) => (
          <TabsTrigger key={tab} value={tab}>
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>

      {timeScheduleFormTabs.map((tab) => (
        <TabsContent key={tab} value={tab} className="w-full mt-2">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="timeOffSchedule.date"
              render={({ field }) => (
                <FormItem className="flex-between gap-4 mb-4">
                  <FormLabel className="text-lg-medium">Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[280px] justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value && field.value !== "" ? (
                          (() => {
                            try {
                              const date = new Date(field.value);
                              if (isNaN(date.getTime())) {
                                return <span>Invalid date</span>;
                              }
                              return format(date, "PPP");
                            } catch (error) {
                              console.error(
                                "Date formatting error:",
                                error,
                                "Value:",
                                field.value
                              );
                              return <span>Invalid date</span>;
                            }
                          })()
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          field.value
                            ? (() => {
                                try {
                                  const date = new Date(field.value);
                                  return isNaN(date.getTime())
                                    ? undefined
                                    : date;
                                } catch {
                                  return undefined;
                                }
                              })()
                            : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            const isoString = date.toISOString();
                            field.onChange(isoString);
                          }
                        }}
                        disabled={(date) =>
                          date < new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <hr />

            <div className="grid grid-rows-2 my-4">
              <p className="text-lg-medium grid-rows-1">Time</p>
              <div className="flex-between gap-4 w-full grid-rows-2">
                {/* <FormField
                  control={form.control}
                  name="timeOffSchedule.fromTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                      
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
                {/* <FormField
                  control={form.control}
                  name="timeOffSchedule.toTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                      
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
              </div>
            </div>

            <hr />

            <FormField
              control={form.control}
              name="timeOffSchedule.reason"
              render={({ field }) => (
                <FormItem className="flex-between gap-4 my-4">
                  <FormLabel className="text-lg-medium">Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Enter reason"
                      className="bg-background resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <hr />

            <div className="flex item-centers justify-end mt-2">
              <Button
                onClick={() => {
                  setSelectedTimeOffSchedule(null);
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default TimeOffScheduleForm;
