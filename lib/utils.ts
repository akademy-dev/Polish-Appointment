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

export function getTimeFromDate(date: Date) {
  let hours = date.getHours().toString();
  let minutes = date.getMinutes().toString();

  hours = hours.length < 2 ? "0" + hours : hours;
  minutes = minutes.length < 2 ? "0" + minutes : minutes;

  return hours + ":" + minutes;
}
