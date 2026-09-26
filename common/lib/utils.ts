import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const nameFillers = new Set(["a", "an", "the", "build", "create", "make"]);

export function projectNameFromPrompt(prompt: string): string {
  const words = prompt
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  while (words.length > 0 && nameFillers.has(words[0].toLowerCase())) words.shift();
  const titleWords = words.slice(0, 6);
  if (titleWords.length === 0) return "Untitled app";
  const title = titleWords
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  return title.slice(0, 48);
}

export function greetingFor(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
