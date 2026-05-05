import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

export function formatRelative(date: Date | string | number): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function describeCron(cron: string): string {
  // Tiny cron describer for the most common schedule shapes.
  // For anything fancy, keep the raw expression visible.
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return cron;
  const [min, hour, dom, mon, dow] = parts;
  const time = (() => {
    if (min === "*" || hour === "*") return null;
    const h = parseInt(hour, 10);
    const m = parseInt(min, 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = ((h + 11) % 12) + 1;
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  })();
  if (dom === "*" && mon === "*" && dow === "*" && time)
    return `Every day at ${time} PST`;
  if (dom === "*" && mon === "*" && dow === "1-5" && time)
    return `Weekdays at ${time} PST`;
  if (dom === "*" && mon === "*" && /^\d(,\d)*$/.test(dow) && time)
    return `Weekly (${dow}) at ${time} PST`;
  return `cron: ${cron}`;
}
