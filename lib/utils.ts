import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import moment from "moment";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getTimeFromDate(date: Date) {
  let hours = date.getHours().toString();
  let minutes = date.getMinutes().toString();

  hours = hours.length < 2 ? "0" + hours : hours;
  minutes = minutes.length < 2 ? "0" + minutes : minutes;

  return hours + ":" + minutes;
}

export function convertTimeStringToMinutes(time: string) {
  //check AM and PM to add time
  const [hours, minutes] = time.split(":");
  const isAM = time.includes("AM");

  return parseInt(hours) * 60 + parseInt(minutes) + (isAM ? 0 : 12 * 60);
}

export function parseServerActionResponse<T>(response: T) {
  return JSON.parse(JSON.stringify(response));
}

export function formatDuration(duration: number) {
  //check if duration is less than 60
  if (duration < 60) {
    return `${duration} minutes`;
  }
  //check if duration is less than 120
  if (duration < 120) {
    return `${duration / 60} hours`;
  }
  return `${duration / 60} hours`;
}

export function formatMinuteDuration(minutes: number): string {
  if (minutes <= 0) return "0min";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}min`;
  }
  if (remainingMinutes === 0) {
    return `${hours}hr`;
  }
  return `${hours}hr ${remainingMinutes}min`;
}

export function parseOffset(timezone: string): string {
  // Match "UTC+7", "UTC-7", "UTC+07:30", "UTC-07:30"
  const match = timezone.match(/^UTC([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (match) {
    const sign = match[1];
    const hours = match[2].padStart(2, "0");
    const minutes = match[3] ? match[3].padStart(2, "0") : "00";
    return `${sign}${hours}:${minutes}`;
  }
  return "+00:00"; // Default to UTC if parsing fails
}

export function getIanaTimezone(timezone: string): string {
  // If already a valid IANA name, return as is
  if (moment.tz.zone(timezone)) return timezone;

  // If we get a fixed UTC offset like "-07:00" or "+02:00",
  // map it to a stable IANA zone under Etc/GMT.
  // IMPORTANT: the sign is inverted in Etc/GMT (Etc/GMT+7 === UTC-7).
  const fixedOffsetMatch = timezone.match(/^([+-])(\d{2}):(\d{2})$/);
  if (fixedOffsetMatch) {
    const sign = fixedOffsetMatch[1]; // "+" | "-"
    const hours = Number(fixedOffsetMatch[2]);
    const minutes = Number(fixedOffsetMatch[3]);

    // Our UI currently only uses whole-hour offsets. If minutes are non-zero,
    // we can't represent it with Etc/GMT reliably.
    if (minutes === 0) {
      if (hours === 0) return "UTC";
      const invertedSign = sign === "+" ? "-" : "+";
      // Etc/GMT uses no leading zero (Etc/GMT+7, not Etc/GMT+07)
      return `Etc/GMT${invertedSign}${hours}`;
    }
  }

  // Try to convert offset (e.g. "-07:00") to IANA name
  const offsetMinutes = moment.duration(timezone).asMinutes();
  const possibleZones = moment.tz.names().filter((zone) => {
    // Use current date for offset comparison
    return moment.tz(zone).utcOffset() === offsetMinutes;
  });
  return possibleZones.length > 0 ? possibleZones[0] : "UTC";
}

/**
 * Safely parse a timestamptz string from Supabase to a Date object
 * Handles null, undefined, and invalid date strings gracefully
 */
export function safeParseDate(
  dateString: string | null | undefined | Date
): Date | null {
  // If already a Date object, return it
  if (dateString instanceof Date) {
    return isNaN(dateString.getTime()) ? null : dateString;
  }

  // If null or undefined, return null
  if (!dateString) {
    return null;
  }

  // If empty string, return null
  if (typeof dateString === "string" && dateString.trim() === "") {
    return null;
  }

  // Try to parse the date string
  try {
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch (error) {
    return null;
  }
}

/**
 * Calculate duration in minutes from startTime and endTime
 * Returns 0 if either time is invalid
 */
export function calculateDuration(
  startTime: string | null | undefined,
  endTime: string | null | undefined
): number {
  const start = safeParseDate(startTime);
  const end = safeParseDate(endTime);

  if (!start || !end) {
    return 0;
  }

  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60)); // Convert to minutes
}

// export function formatToISO8601(
//   currentDate: Date,
//   standardTime: string,
//   timezone: string,
// ): string {
//   // Clone the currentDate to avoid mutating it
//   const date = new Date(currentDate);
//
//   // Parse the standardTime (e.g., "8:00 AM" or "6:00 PM")
//   const [time, period] = standardTime.split(" ");
//   // eslint-disable-next-line prefer-const
//   let [hours, minutes] = time.split(":").map(Number);
//
//   // Convert 12-hour format to 24-hour format
//   if (period.toUpperCase() === "PM" && hours !== 12) {
//     hours += 12;
//   } else if (period.toUpperCase() === "AM" && hours === 12) {
//     hours = 0;
//   }
//
//   // Parse the timezone offset (e.g., "-7:00")
//   const [offsetHours, offsetMinutes] = timezone.split(":").map(Number);
//   const offsetMs = (offsetHours * 60 + offsetMinutes) * 60 * 1000;
//
//   // Set the date to midnight of the given date
//   date.setHours(0, 0, 0, 0);
//
//   // Calculate the UTC time that corresponds to the desired local time in the target timezone
//   // Local time in target timezone = UTC time + target timezone offset
//   // Therefore, UTC time = Local time - target timezone offset
//   const localTimeMs =
//     date.getTime() + hours * 60 * 60 * 1000 + minutes * 60 * 1000;
//   const utcTimeMs = localTimeMs - offsetMs;
//   const targetTime = new Date(utcTimeMs);
//
//   // Format to ISO 8601
//   const year = targetTime.getUTCFullYear();
//   const month = String(targetTime.getUTCMonth() + 1).padStart(2, "0");
//   const day = String(targetTime.getUTCDate()).padStart(2, "0");
//   const hoursFormatted = String(hours).padStart(2, "0"); // Use input hours directly
//   const minutesFormatted = String(minutes).padStart(2, "0");
//   const secondsFormatted = "00";
//   const offsetSign = offsetHours < 0 ? "-" : "+";
//   const offsetHoursFormatted = String(Math.abs(offsetHours)).padStart(2, "0");
//   const offsetMinutesFormatted = String(Math.abs(offsetMinutes)).padStart(
//     2,
//     "0",
//   );
//
//   return `${year}-${month}-${day}T${hoursFormatted}:${minutesFormatted}:${secondsFormatted}${offsetSign}${offsetHoursFormatted}:${offsetMinutesFormatted}`;
// }
