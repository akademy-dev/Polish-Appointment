import twilio from "twilio";
import type { NextApiRequest, NextApiResponse } from "next";
import { client } from "@/sanity/lib/client";
import { SEND_SMS_QUERY } from "@/sanity/lib/queries";
import { Appointment } from "@/models/appointment";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const twilioClient = twilio(accountSid, authToken);

function isUSPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("1") && digits.length === 11;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Bảo mật Cron Job
  const cronSecret = req.headers["authorization"];
  const VARIABLE_LIST = ["Customer", "Employee", "Service", "Date Time"];

  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const appointments: Appointment[] = await client.fetch(SEND_SMS_QUERY, {
      dateTime: new Date().toISOString(),
    });

    for (const appointment of appointments) {
      // check smsMessage, if have {variable} then replace with real value
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

      await twilioClient.messages.create({
        body: messageBody,
        from: twilioPhoneNumber,
        to: isUSPhoneNumber(appointment.customer.phone)
          ? appointment.customer.phone
          : `+1${appointment.customer.phone.replace(/\D/g, "")}`, // Ensure US format
      });
    }

    res.status(200).json({ success: true, message: "Notifications sent" });
  } catch (error) {
    console.error("Cron Job Error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to send notifications" });
  }
}
