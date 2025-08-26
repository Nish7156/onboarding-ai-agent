import { getCalendarClient } from "./calendarClient.js";
import { DateTime } from "luxon";

const MEETING_DURATION = 30; // minutes
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 18;
const TIMEZONE = "Asia/Kolkata";
const INCREMENT = 15; // minutes
const MAX_DAYS_LOOKAHEAD = 7;

export const findFreeSlot = async () => {
  const cal = await getCalendarClient();
  const now = DateTime.now().setZone(TIMEZONE);

  for (let dayOffset = 0; dayOffset < MAX_DAYS_LOOKAHEAD; dayOffset++) {
    let day = now.plus({ days: dayOffset }).startOf("day");

    // Determine initial slotStart
    let slotStart = day;
    if (dayOffset === 0) {
      if (now.hour >= WORK_END_HOUR) continue; // past work hours
      if (now.hour < WORK_START_HOUR) {
        slotStart = day.set({ hour: WORK_START_HOUR, minute: 0 });
      } else {
        const minutes = Math.ceil(now.minute / INCREMENT) * INCREMENT;
        slotStart = day.set({ hour: now.hour, minute: minutes });
      }
    } else {
      slotStart = day.set({ hour: WORK_START_HOUR, minute: 0 });
    }

    const endOfDay = day.set({ hour: WORK_END_HOUR, minute: 0 });

    const utcSlotStart = slotStart.toUTC().toISO();
    const utcEndOfDay = endOfDay.toUTC().toISO();

    const eventsRes = await cal.events.list({
      calendarId: "primary",
      timeMin: utcSlotStart,
      timeMax: utcEndOfDay,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = eventsRes.data.items || [];

    const isFree = (start, end) => {
      return !events.some((ev) => {
        const evStart = ev.start.dateTime
          ? DateTime.fromISO(ev.start.dateTime, { zone: TIMEZONE })
          : DateTime.fromISO(ev.start.date + "T00:00:00", { zone: TIMEZONE });
        const evEnd = ev.end.dateTime
          ? DateTime.fromISO(ev.end.dateTime, { zone: TIMEZONE })
          : DateTime.fromISO(ev.end.date + "T23:59:59", { zone: TIMEZONE });
        return start < evEnd && end > evStart;
      });
    };

    while (slotStart.plus({ minutes: MEETING_DURATION }) <= endOfDay) {
      const slotEnd = slotStart.plus({ minutes: MEETING_DURATION });
      if (isFree(slotStart, slotEnd)) {
        return { start: slotStart.toJSDate(), end: slotEnd.toJSDate() };
      }
      slotStart = slotStart.plus({ minutes: INCREMENT });
    }
  }

  return null;
};
