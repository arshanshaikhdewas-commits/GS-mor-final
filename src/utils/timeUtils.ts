export interface TimeBreakdown {
  hours: number;
  minutes: number;
  seconds: number;
  totalDecimalHours: number;
  formattedTimeStr: string;
}

/**
 * Converts hours, minutes, and seconds to total decimal hours based on:
 * 1 Hour = 60 Minutes
 * 1 Minute = 60 Seconds
 */
export function timeToDecimalHours(hours: number, minutes: number, seconds: number = 0): number {
  const h = isNaN(hours) || hours < 0 ? 0 : hours;
  const m = isNaN(minutes) || minutes < 0 ? 0 : minutes;
  const s = isNaN(seconds) || seconds < 0 ? 0 : seconds;
  return h + m / 60 + s / 3600;
}

/**
 * Converts decimal hours to hours, minutes, seconds breakdown.
 * Formula:
 * Minutes = (Decimal Portion) * 60
 * Seconds = (Remaining Decimal Portion) * 60
 */
export function decimalHoursToTime(decimalHours: number): TimeBreakdown {
  if (isNaN(decimalHours) || decimalHours <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, totalDecimalHours: 0, formattedTimeStr: "0 hrs 0 mins" };
  }

  const totalSeconds = Math.round(decimalHours * 3600);
  const hours = Math.floor(totalSeconds / 3600);
  const remainingSeconds = totalSeconds % 3600;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  let parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hr${hours !== 1 ? "s" : ""}`);
  if (minutes > 0 || hours === 0) parts.push(`${minutes} min${minutes !== 1 ? "s" : ""}`);
  if (seconds > 0) parts.push(`${seconds} sec${seconds !== 1 ? "s" : ""}`);

  return {
    hours,
    minutes,
    seconds,
    totalDecimalHours: decimalHours,
    formattedTimeStr: parts.join(" ")
  };
}

/**
 * Flexible parser for user inputs such as:
 * - "8:30" or "8:30:00" -> 8.5 hrs
 * - "8h 30m" or "8 hr 30 min" -> 8.5 hrs
 * - "8.5" -> 8.5 hrs
 * - "8.30" if interpreted as HH.MM (8 hrs 30 mins) -> 8.5 hrs
 */
export function parseTimeStringToHours(input: string, isDotAsMinutes = false): number {
  if (!input || !input.trim()) return 0;
  const str = input.trim();

  // 1. Colon format e.g. "8:30" or "1:45:30"
  if (str.includes(":")) {
    const parts = str.split(":").map((p) => parseFloat(p.trim()) || 0);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    const s = parts[2] || 0;
    return h + m / 60 + s / 3600;
  }

  // 2. Text format e.g. "8h 30m" or "8 hrs 30 mins"
  const textMatch = str.match(
    /^(?:(\d+(?:\.\d+)?)\s*(?:h|hr|hours?))?\s*(?:(\d+(?:\.\d+)?)\s*(?:m|min|minutes?))?\s*(?:(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?))?$/i
  );
  if (textMatch && (textMatch[1] || textMatch[2] || textMatch[3])) {
    const h = parseFloat(textMatch[1] || "0") || 0;
    const m = parseFloat(textMatch[2] || "0") || 0;
    const s = parseFloat(textMatch[3] || "0") || 0;
    return h + m / 60 + s / 3600;
  }

  // 3. Dot format e.g. "8.30" where user enabled dot as minutes
  if (isDotAsMinutes && str.includes(".")) {
    const parts = str.split(".");
    const h = parseInt(parts[0], 10) || 0;
    const mRaw = parts[1] ? parts[1].padEnd(2, "0").slice(0, 2) : "0";
    const m = parseInt(mRaw, 10) || 0;
    return h + m / 60;
  }

  // 4. Standard float fallback
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Calculates working hours from Start Time and End Time (in HH:MM 24h format).
 * E.g. start "09:00", end "17:30", breakMins 30 -> 8.0 hours.
 */
export function calculateDurationFromTimes(
  startTime: string,
  endTime: string,
  breakMinutes: number = 0
): { totalDecimalHours: number; hours: number; minutes: number } {
  if (!startTime || !endTime) return { totalDecimalHours: 0, hours: 0, minutes: 0 };

  const [sH, sM] = startTime.split(":").map((n) => parseInt(n, 10) || 0);
  const [eH, eM] = endTime.split(":").map((n) => parseInt(n, 10) || 0);

  let startTotalMins = sH * 60 + sM;
  let endTotalMins = eH * 60 + eM;

  // Handle overnight shift (e.g. 10 PM to 6 AM)
  if (endTotalMins < startTotalMins) {
    endTotalMins += 24 * 60;
  }

  let netMins = endTotalMins - startTotalMins - (breakMinutes || 0);
  if (netMins < 0) netMins = 0;

  const hours = Math.floor(netMins / 60);
  const minutes = netMins % 60;
  const totalDecimalHours = parseFloat((netMins / 60).toFixed(4));

  return { totalDecimalHours, hours, minutes };
}
