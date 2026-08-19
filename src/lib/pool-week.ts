import {
  addDays,
  addHours,
  getDay,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  startOfWeek,
  isBefore,
  isAfter,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const NY = "America/New_York";

export type PoolWindow =
  | { kind: "pick"; label: string }
  | { kind: "reveal"; label: string }
  | { kind: "closed"; label: string };

function atNy(
  weekStartSun: Date,
  dayOffsetFromSun: number,
  hour: number,
  minute: number,
): Date {
  const local = addDays(weekStartSun, dayOffsetFromSun);
  const h = setMilliseconds(
    setSeconds(setMinutes(setHours(local, hour), minute), 0),
    0,
  );
  return fromZonedTime(h, NY);
}

/** Sunday-start week in America/New_York for the given instant */
function nyWeekBounds(referenceUtc: Date) {
  const z = toZonedTime(referenceUtc, NY);
  const weekStartSun = startOfWeek(z, { weekStartsOn: 0 });
  const wedNoon = atNy(weekStartSun, 3, 12, 0);
  const satNoon = atNy(weekStartSun, 6, 12, 0);
  const prevSun = addDays(weekStartSun, -7);
  const prevSatNoon = atNy(prevSun, 6, 12, 0);
  return { wedNoon, satNoon, prevSatNoon };
}

/** Saturday 12:00 PM ET → following Tuesday 6:00 AM ET (66 hours later) */
function revealEndUtc(satNoonUtc: Date): Date {
  const z = toZonedTime(satNoonUtc, NY);
  return fromZonedTime(addHours(z, 66), NY);
}

function inRangeInclusiveStartExclusiveEnd(
  t: Date,
  start: Date,
  end: Date,
): boolean {
  return (
    (isAfter(t, start) || t.getTime() === start.getTime()) && isBefore(t, end)
  );
}

/**
 * Pick window: Wednesday 12:00 PM ET through Saturday 12:00 PM ET (same Sun-start week as that Wednesday).
 * Reveal window: Saturday 12:00 PM ET through the following Tuesday 6:00 AM ET.
 * Each page checks its own window independently.
 */
function isInPickWindow(now: Date): boolean {
  const { wedNoon, satNoon } = nyWeekBounds(now);
  return inRangeInclusiveStartExclusiveEnd(now, wedNoon, satNoon);
}

function isInRevealWindow(now: Date): boolean {
  const { satNoon, prevSatNoon } = nyWeekBounds(now);
  const prevRevealEnd = revealEndUtc(prevSatNoon);
  if (inRangeInclusiveStartExclusiveEnd(now, prevSatNoon, prevRevealEnd)) {
    return true;
  }
  const thisRevealEnd = revealEndUtc(satNoon);
  return inRangeInclusiveStartExclusiveEnd(now, satNoon, thisRevealEnd);
}

export function getPoolWindow(nowUtc: Date = new Date()): PoolWindow {
  const now = nowUtc;

  if (isInRevealWindow(now)) {
    return {
      kind: "reveal",
      label: "Saturday 12:00 PM – Tuesday 6:00 AM (ET)",
    };
  }

  if (isInPickWindow(now)) {
    return {
      kind: "pick",
      label: "Wednesday 12:00 PM – Saturday 12:00 PM (ET)",
    };
  }

  const dow = getDay(toZonedTime(now, NY));
  const label =
    dow === 0 || dow === 1 || dow === 2
      ? "Opens Wednesday 12:00 PM ET for weekly picks"
      : "Next pick window: Wednesday 12:00 PM ET";

  return { kind: "closed", label };
}

export function isPickWindowOpen(nowUtc: Date = new Date()): boolean {
  return isInPickWindow(nowUtc);
}

export function isRevealWindowOpen(nowUtc: Date = new Date()): boolean {
  return isInRevealWindow(nowUtc);
}
