"use client";
import React from "react";
import { Button } from "./ui/button";
import { History, Pencil } from "lucide-react";
import { Human } from "./HumanList";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Label } from "./ui/label";
import SearchForm from "./SearchForm";
import { Separator } from "@/components/ui/separator";
import DataTable, { columns, HistoryData } from "./DataTable";

enum CardButtonType {
  History = "History",
  Edit = "Edit",
}

const historyData: HistoryData[] = [
  {
    service: "Service 1",
    customer: "Customer 1",
    date: new Date().toISOString(),
    duration: 60,
  },
  {
    service: "Service 2",
    customer: "Customer 2",
    date: new Date().toISOString(),
    duration: 120,
  },
  {
    service: "Service 3",
    customer: "Customer 3",
    date: new Date().toISOString(),
    duration: 15,
  },
  {
    service: "Service 4",
    customer: "Customer 4",
    date: new Date().toISOString(),
    duration: 20,
  },
];

const HumanCard = ({ human }: { human: Human }) => {
  return (
    <li className="flex-between human_card">
      <div className="flex flex-col">
        <p className="text-lg font-bold">{human.name}</p>
        <p className="text-sm font-semibold">{human.position}</p>
      </div>
      <div className="flex-between h-8  space-x-1">
        <CardButton human={human} type={CardButtonType.Edit} />
        <Separator orientation="vertical" className="bg-primary" />
        <CardButton human={human} type={CardButtonType.History} />
      </div>
    </li>
  );
};

const CardButton = ({
  human,
  type,
}: {
  human: Human;
  type: CardButtonType;
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          {type === CardButtonType.History ? (
            <History className="size-6" />
          ) : (
            <Pencil className="size-6" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>{human.name}</SheetTitle>
          <SheetDescription>{human.position}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 p-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {CardButtonType.History}
            </Label>
            <div className="col-span-3">
              <SearchForm />
            </div>
          </div>
          <DataTable columns={columns} data={historyData} />
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default HumanCard;
