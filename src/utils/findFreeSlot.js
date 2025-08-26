import { getCalendarClient } from "./calendarClient.js";
import { zonedTimeToUtc } from "date-fns-tz";

const MEETING_DURATION = 30; // minutes
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 18;
const TIMEZONE = "Asia/Kolkata";
const INCREMENT = 15; // minutes
const MAX_DAYS_LOOKAHEAD = 7;

export const findFreeSlot = async () => {
  const cal = await getCalendarClient();
  const now = new Date();

  for (let dayOffset = 0; dayOffset < MAX_DAYS_LOOKAHEAD; dayOffset++) {
    const day = new Date();
    day.setDate(day.getDate() + dayOffset);

    // Determine initial slotStart
    let slotStart = new Date(day);
    if (dayOffset === 0) {
      // Today
      if (now.getHours() >= WORK_END_HOUR) {
        // Past work hours, skip to tomorrow
        continue;
      } else if (now.getHours() < WORK_START_HOUR) {
        slotStart.setHours(WORK_START_HOUR, 0, 0, 0);
      } else {
        // Current time rounded up to next increment
        const minutes = Math.ceil(now.getMinutes() / INCREMENT) * INCREMENT;
        slotStart.setHours(now.getHours(), minutes, 0, 0);
      }
    } else {
      // Future day
      slotStart.setHours(WORK_START_HOUR, 0, 0, 0);
    }

    const endOfDay = new Date(day);
    endOfDay.setHours(WORK_END_HOUR, 0, 0, 0);

    const utcSlotStart = zonedTimeToUtc(slotStart, TIMEZONE);
    const utcEndOfDay = zonedTimeToUtc(endOfDay, TIMEZONE);

    const eventsRes = await cal.events.list({
      calendarId: "primary",
      timeMin: utcSlotStart.toISOString(),
      timeMax: utcEndOfDay.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = eventsRes.data.items || [];

    const isFree = (start, end) => {
      return !events.some((ev) => {
        const evStart = new Date(ev.start.dateTime || ev.start.date);
        const evEnd = new Date(ev.end.dateTime || ev.end.date);
        return start < evEnd && end > evStart;
      });
    };

    while (slotStart.getTime() + MEETING_DURATION * 60 * 1000 <= endOfDay.getTime()) {
      const slotEnd = new Date(slotStart.getTime() + MEETING_DURATION * 60 * 1000);
      if (isFree(slotStart, slotEnd)) {
        return { start: slotStart, end: slotEnd };
      }
      slotStart = new Date(slotStart.getTime() + INCREMENT * 60 * 1000);
    }
  }

  return null;
};
