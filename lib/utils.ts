import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
  console.log(response);
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
