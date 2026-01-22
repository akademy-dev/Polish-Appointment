import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
import { formatInTimeZone } from "date-fns-tz";
import * as dotenv from "dotenv";
import * as path from "path";
import { parseOffset } from "@/lib/utils";

// Load .env.local
dotenv.config({ path: path.resolve(".env") });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER; 
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey || !accountSid || !authToken || !messagingServiceSid) {
    console.error("Missing credentials. Please check .env for TWILIO_MESSAGING_SERVICE_SID and others.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

const twilioClient = twilio(accountSid, authToken);

async function runCronJob() {
    console.log("----------------------------------------");
    console.log("Cron job started at:", new Date().toISOString());
    const VARIABLE_LIST = ["Customer", "Employee", "Service", "Date Time"];

    try {
        const now = new Date();
        const windowStart = new Date(now.getTime() - 2 * 60 * 1000);
        const windowEnd = new Date(now.getTime() + 2 * 60 * 1000);

        console.log("Checking for appointments between:", windowStart.toISOString(), "and", windowEnd.toISOString());

        // Fetch scheduled appointments from Supabase
        const { data: allScheduledAppointments, error: fetchError } = await supabase
            .rpc("get_scheduled_appointments");

        if (fetchError) {
            throw new Error(`Failed to fetch appointments: ${fetchError.message}`);
        }

        console.log(`Debug: Total 'scheduled' appointments fetched: ${allScheduledAppointments?.length}`);

        // Filter appointments based on logic provided
        const appointmentsToProcess = (allScheduledAppointments || []).filter((apt) => {
            const reminderDateTimes = apt.reminder_datetime;

            if (!Array.isArray(reminderDateTimes) || reminderDateTimes.length === 0) {
                return false;
            }

            const hasMatch = reminderDateTimes.some((dtString: string) => {
                const dt = new Date(dtString);
                const isMatch = dt >= windowStart && dt <= windowEnd;
                return isMatch;
            });

            return hasMatch;
        });

        console.log(`Found ${appointmentsToProcess.length} appointments to process for execution.`);

        // Fetch settings for timezone
        let settingData = {
            timezone: "UTC-7:00",
            minTime: "8:00 AM",
            maxTime: "6:00 PM",
            smsMessage:
                "Hi {Customer}, your appointment with {Employee} for {Service} is scheduled for {Date Time}. Please arrive 10 minutes early. Reply STOP to unsubscribe.",
        };

        const { data: settingsData } = await supabase.from("settings").select("*").single();

        if (settingsData) {
            settingData = { ...settingData, ...settingsData };
        }

        if (!settingData.smsMessage.includes("STOP")) {
            settingData.smsMessage += " Reply STOP to unsubscribe.";
        }

        for (const appointment of appointmentsToProcess) {
            const customerObj = Array.isArray(appointment.customer)
                ? appointment.customer[0]
                : appointment.customer;

            if (customerObj?.id) {
                const aptTime = new Date(appointment.start_time);
                const startOfDay = new Date(aptTime);
                startOfDay.setHours(0, 0, 0, 0);

                const { data: earlierAppointments } = await supabase
                    .rpc("get_earlier_appointments", {
                        p_customer_id: customerObj.id,
                        p_start_of_day: startOfDay.toISOString(),
                        p_end_time: appointment.start_time
                    });

                if (earlierAppointments && earlierAppointments.length > 0) {
                    console.log(`Skipping SMS for Apt ${appointment.id}: Found earlier appointment today.`);
                    continue;
                }
            }

            const customerName = customerObj ? `${customerObj.first_name} ${customerObj.last_name}` : "Customer";
            console.log(`Processing appointment ID: ${appointment.id} for Customer: ${customerName}`);

            let messageBody = settingData.smsMessage;

            VARIABLE_LIST.forEach((variable) => {
                const regex = new RegExp(`{${variable}}`, "g");
                switch (variable) {
                    case "Customer":
                        messageBody = messageBody.replace(regex, customerName);
                        break;
                    case "Employee":
                        const employeeName = appointment.employee ? `${appointment.employee.first_name} ${appointment.employee.last_name}` : "Employee";
                        messageBody = messageBody.replace(regex, employeeName);
                        break;
                    case "Service":
                        messageBody = messageBody.replace(regex, appointment.service?.name || "Service");
                        break;
                    case "Date Time":
                        const formattedDate = formatInTimeZone(
                            new Date(appointment.start_time),
                            parseOffset(settingData.timezone) || -420, // Fallback an toàn
                            "yyyy-MM-dd hh:mm a"
                        );
                        messageBody = messageBody.replace(regex, formattedDate);
                        break;
                }
            });

            let toPhone = appointment.customer?.phone;
            if (!toPhone) {
                console.log(`Skipping appointment ${appointment.id}: No phone number.`);
                continue;
            }

            toPhone = toPhone.replace(/\D/g, "");
            if (toPhone.length === 10) {
                toPhone = `+1${toPhone}`;
            } else if (toPhone.length === 11 && toPhone.startsWith("1")) {
                toPhone = `+${toPhone}`;
            }

            if (!toPhone.startsWith("+1") || toPhone.length < 12) {
                console.log(`Skipping invalid phone number format: ${appointment.customer?.phone} -> Normalized: ${toPhone}`);
                continue;
            }

            console.log(`Sending SMS to ${toPhone} via Service SID: ${messagingServiceSid}`);

            try {
                await twilioClient.messages.create({
                    body: messageBody,
                    messagingServiceSid: messagingServiceSid,
                    to: toPhone,
                });
                console.log(`SMS sent successfully to ${toPhone}`);
            } catch (smsError) {
                console.error(`Failed to send SMS to ${toPhone}:`, smsError);
            }
        }

        console.log("Cron job finished successfully.");
        console.log("----------------------------------------");
        process.exit(0);
    } catch (error) {
        console.error("Cron Job Error:", error);
        process.exit(1);
    }
}

runCronJob();