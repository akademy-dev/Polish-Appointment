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
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const supabaseUrl = process.env.SUPABASE_URL;
// Use service role key for backend scripts to bypass RLS if needed, or fallback to key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
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
        // Calculate time window: 5 minutes ago to now
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        console.log("Checking for appointments between:", fiveMinutesAgo.toISOString(), "and", now.toISOString());

        // Fetch scheduled appointments from Supabase
        const { data: allScheduledAppointments, error: fetchError } = await supabase
            .from("appointments")
            .select(`
                id,
                start_time,
                end_time,
                status,
                reminder,
                reminder_datetime,
                customer:customers (
                    id,
                    first_name,
                    last_name,
                    phone
                ),
                employee:employees (
                    id,
                    first_name,
                    last_name
                ),
                service:services (
                    id,
                    name,
                    duration
                )
            `)
            .eq("status", "scheduled");

        if (fetchError) {
            throw new Error(`Failed to fetch appointments: ${fetchError.message}`);
        }

        console.log(`Debug: Total 'scheduled' appointments fetched: ${allScheduledAppointments?.length}`);

        // Filter appointments that have a reminder_datetime within the window
        const appointmentsToProcess = (allScheduledAppointments || []).filter((apt) => {
            const reminderDateTimes = apt.reminder_datetime;
            if (!Array.isArray(reminderDateTimes) || reminderDateTimes.length === 0) {
                return false;
            }

            // Check if any reminder time is in the window [fiveMinutesAgo, now]
            const hasMatch = reminderDateTimes.some((dtString: string) => {
                const dt = new Date(dtString);
                const isMatch = dt >= fiveMinutesAgo && dt <= now;
                // Log strictly for debugging near-matches
                if (!isMatch && dt > new Date(now.getTime() - 15 * 60 * 1000) && dt < new Date(now.getTime() + 15 * 60 * 1000)) {
                    console.log(`Debug: Near miss for Apt ${apt.id}. Reminder: ${dt.toISOString()}. Window: ${fiveMinutesAgo.toISOString()} - ${now.toISOString()}`);
                }
                return isMatch;
            });

            if (hasMatch) {
                console.log(`Debug: Match found for Apt ${apt.id}`);
            }

            return hasMatch;
        });

        console.log(`Found ${appointmentsToProcess.length} appointments to process for execution.`);

        // Fetch settings for timezone
        let settingData = {
            timezone: "UTC-7:00",
            minTime: "8:00 AM",
            maxTime: "6:00 PM",
            smsMessage:
                "Hi {Customer}, your appointment with {Employee} for {Service} is scheduled for {Date Time}. Please arrive 10 minutes early.",
        };

        const { data: settingsData, error: settingsError } = await supabase
            .from("settings")
            .select("*")
            .single();

        if (settingsData && !settingsError) {
            settingData = {
                ...settingData,
                ...settingsData,
                // Ensure timezone is valid or fallback
                timezone: settingsData.timezone || "UTC-7:00",
            };
        }

        for (const appointment of appointmentsToProcess) {
            const customerName = appointment.customer ? `${appointment.customer.first_name} ${appointment.customer.last_name}` : "Customer";
            console.log(`Processing appointment ID: ${appointment.id} for Customer: ${customerName}`);

            let messageBody =
                settingData.smsMessage ||
                "Hi {Customer}, your appointment with {Employee} for {Service} is scheduled for {Date Time}. Please arrive 10 minutes early.";

            VARIABLE_LIST.forEach((variable) => {
                const regex = new RegExp(`{${variable}}`, "g");
                switch (variable) {
                    case "Customer":
                        messageBody = messageBody.replace(
                            regex,
                            customerName
                        );
                        break;
                    case "Employee":
                        const employeeName = appointment.employee ? `${appointment.employee.first_name} ${appointment.employee.last_name}` : "Employee";
                        messageBody = messageBody.replace(
                            regex,
                            employeeName
                        );
                        break;
                    case "Service":
                        messageBody = messageBody.replace(regex, appointment.service?.name || "Service");
                        break;
                    case "Date Time":
                        // Format date based on settings timezone
                        const formattedDate = formatInTimeZone(
                            new Date(appointment.start_time),
                            parseOffset(settingData.timezone),
                            "yyyy-MM-dd hh:mm a"
                        );
                        messageBody = messageBody.replace(regex, formattedDate);
                        break;
                }
            });

            const toPhone = appointment.customer?.phone;
            if (!toPhone) {
                console.log(`Skipping appointment ${appointment.id}: No phone number for customer.`);
                continue;
            }

            console.log(`Sending SMS to ${toPhone}: "${messageBody}"`);

            try {
                await twilioClient.messages.create({
                    body: messageBody,
                    from: twilioPhoneNumber,
                    to: toPhone,
                });
                console.log(`SMS sent successfully to ${toPhone}`);
            } catch (smsError) {
                console.error(`Failed to send SMS to ${toPhone}:`, smsError);
            }
        }

        console.log("Fetching appointments to update status...");

        // Find scheduled appointments where end_time has passed
        const { data: appointmentsToUpdate, error: updateFetchError } = await supabase
            .from("appointments")
            .select("id")
            .eq("status", "scheduled")
            .lt("end_time", now.toISOString()); // end_time < now

        if (updateFetchError) {
            console.error("Error fetching appointments to update:", updateFetchError);
        } else {
            console.log(`Found ${(appointmentsToUpdate || []).length} appointments to mark as completed.`);

            for (const apt of (appointmentsToUpdate || [])) {
                console.log(`Updating status for appointment ${apt.id} to 'completed'.`);
                const { error: updateError } = await supabase
                    .from("appointments")
                    .update({ status: "completed" })
                    .eq("id", apt.id);

                if (updateError) {
                    console.error(`Failed to update appointment ${apt.id}:`, updateError);
                }
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