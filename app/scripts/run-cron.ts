import twilio from "twilio";
import {
  SEND_SMS_QUERY,
  TIMEZONE_QUERY,
  UPDATE_APPOINTMENT_STATUS_QUERY,
} from "@/sanity/lib/queries";
import { Appointment } from "@/models/appointment";
import { formatInTimeZone } from "date-fns-tz";

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "next-sanity";
import { parseOffset } from "@/lib/utils";

// Load .env.local
dotenv.config({ path: path.resolve(".env.local") });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
const token = process.env.SANITY_WRITE_TOKEN;

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false, // Set to false for write operations
});

const twilioClient = twilio(accountSid, authToken);

async function runCronJob() {
  const VARIABLE_LIST = ["Customer", "Employee", "Service", "Date Time"];
  try {
    // Tính khoảng thời gian: từ 5 phút trước đến hiện tại (sử dụng UTC để tránh lệ thuộc timezone cục bộ)
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Cập nhật truy vấn để lấy các cuộc hẹn trong khoảng thời gian
    const appointments: Appointment[] = await client.fetch(SEND_SMS_QUERY, {
      startTime: fiveMinutesAgo.toISOString(),
      endTime: now.toISOString(),
    });

    console.log("[Cron Script] Fetching timezone settings...");
    let timezone;
    try {
      timezone = await client.fetch(TIMEZONE_QUERY);
      console.log("[Cron Script] Successfully fetched timezone:", {
        hasTimezone: !!timezone?.timezone,
        timezone: timezone?.timezone,
        hasSmsMessage: !!timezone?.smsMessage,
      });
    } catch (error: any) {
      console.error("[Cron Script] Error fetching timezone:", {
        error: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      throw error;
    }

    console.log("Start Time:", fiveMinutesAgo.toISOString());
    console.log("End Time:", now.toISOString());
    console.log("Appointments to process:", appointments);
    console.log("Timezone:", timezone);
    console.log("SMS Message Template:", timezone.smsMessage || "Default message");

    for (const appointment of appointments) {
      let messageBody = timezone.smsMessage || "Hi {Customer}, your appointment with {Employee} for {Service} is scheduled for {Date Time}. Please arrive 10 minutes early.";
      VARIABLE_LIST.forEach((variable) => {
        const regex = new RegExp(`{${variable}}`, "g");
        switch (variable) {
          case "Customer":
            messageBody = messageBody.replace(
              regex,
              `${appointment.customer.firstName} ${appointment.customer.lastName}`,
            );
            break;
          case "Employee":
            messageBody = messageBody.replace(
              regex,
              `${appointment.employee.firstName} ${appointment.employee.lastName}`,
            );
            break;
          case "Service":
            messageBody = messageBody.replace(regex, appointment.service.name);
            break;
          case "Date Time":
            // Sử dụng Intl.DateTimeFormat để format theo timezone cụ thể, tránh lệ thuộc timezone cục bộ của server
            const formattedDate = formatInTimeZone(
              new Date(appointment.startTime),
              parseOffset(timezone.timezone || "UTC-7:00"),
              "yyyy-MM-dd hh:mm a",
            );
            messageBody = messageBody.replace(regex, formattedDate);

            break;
        }
      });

      console.log(messageBody);

      await twilioClient.messages.create({
        body: messageBody,
        from: twilioPhoneNumber,
        to: appointment.customer.phone,
      });
    }

    const appointmentScheduled: {
      _id: string;
      status: string;
    }[] = await client.fetch(UPDATE_APPOINTMENT_STATUS_QUERY, {
      date: now.toISOString(),
    });

    console.log("Appointments to update:", appointmentScheduled);

    for (const appointment of appointmentScheduled) {
      await writeClient
        .patch(appointment._id)
        .set({ status: "completed" })
        .commit();
    }
    // Cập nhật trạng thái của các cuộc hẹn đã endTime
    process.exit(0); // Exit with code 0 for success
  } catch (error) {
    console.error("Cron Job Error:", error);
    process.exit(1); // Exit with code 1 for error
  }
}

runCronJob();
