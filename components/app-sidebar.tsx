'use client'
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
} from "@/components/ui/sidebar"
import { Calendar } from "./ui/calendar"
import React from "react"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"



export function AppSidebar() {
    const [date, setDate] = React.useState<Date | undefined>(new Date())

    return (
        <Sidebar>
            <SidebarContent className="px-4 py-4">
                <span className="text-m font-bold">Calendar</span>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                />
                <span className="text-m font-bold mt-2">Navigation</span>
                <span className="text-xs">Weekly jump</span>
                <div className="flex space-x-1">
                    <Button variant="outline" size="sm" className="text-accent-blue">-1</Button>
                    <Button variant="outline" size="sm" className="text-accent-blue">-2</Button>
                    <Button variant="outline" size="sm" className="text-accent-blue">-3</Button>
                    <Button variant="outline" size="sm" className="text-accent-blue">-4</Button>
                </div>
                <div className="flex space-x-1">
                    <Button variant="outline" size="sm" className="text-accent-blue">+1</Button>
                    <Button variant="outline" size="sm" className="text-accent-blue">+2</Button>
                    <Button variant="outline" size="sm" className="text-accent-blue">+3</Button>
                    <Button variant="outline" size="sm" className="text-accent-blue">+4</Button>
                </div>
                <span className="text-m font-bold mt-2">View options</span>
                <div className="flex items-center space-x-2">
                    <Checkbox id="cancelled" />
                    <label
                        htmlFor="cancelled"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Show cancelled
                    </label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="timre-off" />
                    <label
                        htmlFor="time-off"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Show time-off staffs
                    </label>
                </div>
            </SidebarContent>
        </Sidebar>
    )
}
