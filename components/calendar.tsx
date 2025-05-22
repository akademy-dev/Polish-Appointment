'use client'

import { useNextCalendarApp, ScheduleXCalendar } from '@schedule-x/react'
import {
    createViewWeek,
} from '@schedule-x/calendar'
import { createEventsServicePlugin } from '@schedule-x/events-service'

import '@schedule-x/theme-default/dist/index.css'
import { useState } from "react";

function Calendar() {
    const eventsService = useState(() => createEventsServicePlugin())[0]



    const calendar = useNextCalendarApp({
        views: [createViewWeek()],
        events: [
            {
                id: '1',
                title: 'Event 1',
                start: '2025-05-22 10:00',
                end: '2025-05-22 12:00',
            },
        ],
        plugins: [eventsService],
        callbacks: {
            onRender: () => {
                // get all events
                eventsService.getAll()
            }
        },


    })






    return (
        <div>
            <ScheduleXCalendar calendarApp={calendar} />
        </div>
    )
}

export default Calendar