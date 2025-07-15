import twilio from "twilio";
import {
  SEND_SMS_QUERY,
  UPDATE_APPOINTMENT_STATUS_QUERY,
} from "@/sanity/lib/queries";
import { Appointment } from "@/models/appointment";

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "next-sanity";

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
    // Tính khoảng thời gian: từ 5 phút trước đến hiện tại
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Cập nhật truy vấn để lấy các cuộc hẹn trong khoảng thời gian
    const appointments: Appointment[] = await client.fetch(SEND_SMS_QUERY, {
      startTime: fiveMinutesAgo.toISOString(),
      endTime: now.toISOString(),
    });

    console.log("Start Time:", fiveMinutesAgo.toISOString());
    console.log("End Time:", now.toISOString());
    console.log("Appointments to process:", appointments);

    for (const appointment of appointments) {
      let messageBody = appointment.smsMessage;
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
            messageBody = messageBody.replace(
              regex,
              new Date(appointment.startTime).toLocaleString(),
            );
            break;
        }
      });

      // Gửi thông báo qua Twilio
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
  } catch (error) {
    console.error("Cron Job Error:", error);
  }
}

runCronJob();
