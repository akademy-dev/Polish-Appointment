import React from "react";
import { Checkbox } from "../ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { employeeFormSchema } from "@/lib/validation";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimePicker } from "../ui/time-picker";

const dateLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EmployeeWorkingForm = ({
  form,
}: {
  form: UseFormReturn<z.infer<typeof employeeFormSchema>>;
}) => {
  console.log(form.watch("workingTimes"));

  return (
    <>
      <div className="grid-center grid-rows-10 gap-1">
        <div className="row-span-1">
          <p className="text-xl-semibold">Working time</p>
        </div>

        <div className="row-span-9 flex flex-col h-full">
          <FormField
            control={form.control}
            name="workingTimes"
            render={() => (
              <FormItem className="grid grid-rows-7 gap-1 h-full">
                {dateLabels.map((item) => (
                  <FormField
                    key={item}
                    control={form.control}
                    name="workingTimes"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item}
                          className="col-span-1 grid grid-cols-7"
                        >
                          <div className="flex items-center gap-2 col-span-1">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.some(
                                  (value) => value.day === item
                                )}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...field.value,
                                        {
                                          day: item,
                                          from: new Date().toISOString(),
                                          to: new Date().toISOString(),
                                        },
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value.day !== item
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel>{item}</FormLabel>
                          </div>

                          <div className="flex items-center gap-2 justify-start col-span-6">
                            {field.value?.find(
                              (value) => value.day === item
                            ) ? (
                              <>
                                <Popover>
                                  <FormControl>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-[280px] justify-start text-left font-normal",
                                          !field.value &&
                                            "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value?.find(
                                          (value) => value.day === item
                                        )?.from ? (
                                          format(
                                            field.value?.find(
                                              (value) => value.day === item
                                            )?.from as unknown as Date,
                                            "PPP HH:mm:ss"
                                          )
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                      </Button>
                                    </PopoverTrigger>
                                  </FormControl>
                                  <PopoverContent className="w-auto p-0">
                                    <div className="p-3">
                                      <TimePicker
                                        setDate={(date) => {
                                          const currentValue =
                                            field.value || [];
                                          const updatedValue = currentValue.map(
                                            (value) => {
                                              if (value.day === item) {
                                                return {
                                                  ...value,
                                                  from: date?.toISOString(),
                                                };
                                              }
                                              return value;
                                            }
                                          );
                                          field.onChange(updatedValue);
                                        }}
                                        date={
                                          field.value?.find(
                                            (value) => value.day === item
                                          )?.from
                                            ? new Date(
                                                field.value.find(
                                                  (value) => value.day === item
                                                )?.from as string
                                              )
                                            : undefined
                                        }
                                      />
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                <FormLabel>To</FormLabel>
                                <Popover>
                                  <FormControl>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-[280px] justify-start text-left font-normal",
                                          !field.value &&
                                            "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value?.find(
                                          (value) => value.day === item
                                        )?.to ? (
                                          format(
                                            field.value?.find(
                                              (value) => value.day === item
                                            )?.to as unknown as Date,
                                            "PPP HH:mm:ss"
                                          )
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                      </Button>
                                    </PopoverTrigger>
                                  </FormControl>
                                  <PopoverContent className="w-auto p-0">
                                    <div className="p-3 border-t border-border">
                                      <TimePicker
                                        setDate={(date) => {
                                          const currentValue =
                                            field.value || [];
                                          const updatedValue = currentValue.map(
                                            (value) => {
                                              if (value.day === item) {
                                                return {
                                                  ...value,
                                                  to: date?.toISOString(),
                                                };
                                              }
                                              return value;
                                            }
                                          );
                                          field.onChange(updatedValue);
                                        }}
                                        date={
                                          field.value?.find(
                                            (value) => value.day === item
                                          )?.to
                                            ? new Date(
                                                field.value.find(
                                                  (value) => value.day === item
                                                )?.to as string
                                              )
                                            : undefined
                                        }
                                      />
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </>
                            ) : (
                              <FormLabel>OFF</FormLabel>
                            )}
                          </div>
                        </FormItem>
                      );
                    }}
                  />
                ))}
                <FormMessage />
              </FormItem>
            )}
          />
          {/* <FormField
              control={form.control}
              name="workingTime.from"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormControl>
                 
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

          {/* <FormField
              control={form.control}
              name="workingTime.to"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormControl>
                 
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
        </div>
      </div>
    </>
  );
};

export default EmployeeWorkingForm;
