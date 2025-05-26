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

import { Separator } from "@/components/ui/separator";
import DataTable, { columns, historyData } from "./DataTable";

enum CardButtonType {
  History = "History",
  Edit = "Edit",
}

const HumanCard = ({ human }: { human: Human }) => {
  return (
    <li className="flex-between line_card">
      <div className="flex flex-col">
        <p className="text-lg font-bold">{human.name}</p>
        <p className="text-sm font-semibold">{human.position}</p>
      </div>
      <div className="flex-between h-5  space-x-1">
        <CardButton human={human} type={CardButtonType.Edit} />
        <Separator orientation="vertical" className="border-black-1-25" />
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
            <History className="size-5" />
          ) : (
            <Pencil className="size-5" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl"
        closeButton={false}
      >
        <SheetHeader>
          <SheetTitle>{human.name}</SheetTitle>
          <SheetDescription>{human.position}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 p-4">
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
