import React from "react";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const timeRange = [
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

export const daysOfMonth = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 26, 27, 28, 29, 30, 31,
];

const EmployeeWorkingForm = ({
  form,
}: {
  form: UseFormReturn<z.infer<typeof employeeFormSchema>>;
}) => {
  console.log(form.watch("workingTimes"));

  return (
    <>
      <div className="grid-center grid-rows-10 gap-1 p-1">
        <div className="row-span-1">
          <p className="text-xl-semibold">Working time</p>
        </div>

        <div className="row-span-9 flex flex-col h-full">
          <FormField
            control={form.control}
            name="workingTimes"
            render={() => (
              <FormItem className="grid grid-rows-7 gap-1 h-full">
                {dayLabels.map((item) => (
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
                                          from: "08:00 AM",
                                          to: "05:45 PM",
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
                                <Select
                                  onValueChange={(from) => {
                                    field.onChange(
                                      field.value?.map((value) =>
                                        value.day === item
                                          ? { ...value, from }
                                          : value
                                      )
                                    );
                                  }}
                                  defaultValue={
                                    field.value?.find(
                                      (value) => value.day === item
                                    )?.from
                                  }
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
                                <FormLabel>To</FormLabel>
                                <Select
                                  onValueChange={(to) => {
                                    field.onChange(
                                      field.value?.map((value) =>
                                        value.day === item
                                          ? { ...value, to }
                                          : value
                                      )
                                    );
                                  }}
                                  defaultValue={
                                    field.value?.find(
                                      (value) => value.day === item
                                    )?.to
                                  }
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
        </div>
      </div>
    </>
  );
};

export default EmployeeWorkingForm;
