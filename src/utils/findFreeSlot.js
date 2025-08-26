import { getCalendarClient } from "./calendarClient.js";


// Meeting settings
const MEETING_DURATION = 30; // minutes
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 18;
const TIMEZONE = "Asia/Kolkata";
const INCREMENT = 15; // minutes
const MAX_DAYS_LOOKAHEAD = 7; // check next 7 days

export const findFreeSlot = async () => {
  const cal = await getCalendarClient();

  const parseDate = (iso) => new Date(iso);

  for (let dayOffset = 0; dayOffset < MAX_DAYS_LOOKAHEAD; dayOffset++) {
    const day = new Date();
    day.setDate(day.getDate() + dayOffset);

    // Start and end of workday
    let slotStart = new Date(day);
    slotStart.setHours(WORK_START_HOUR, 0, 0, 0);

    const endOfDay = new Date(day);
    endOfDay.setHours(WORK_END_HOUR, 0, 0, 0);

    // Fetch events for the day
    const eventsRes = await cal.events.list({
      calendarId: "primary",
      timeMin: slotStart.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = eventsRes.data.items || [];

    const isFree = (start, end) => {
      if (start.getHours() < WORK_START_HOUR || end.getHours() > WORK_END_HOUR) return false;
      return !events.some((ev) => {
        const evStart = parseDate(ev.start.dateTime || ev.start.date);
        const evEnd = parseDate(ev.end.dateTime || ev.end.date);
        return start < evEnd && end > evStart; // overlap check
      });
    };

    // Find first available slot
    while (slotStart.getHours() + MEETING_DURATION / 60 <= WORK_END_HOUR) {
      const slotEnd = new Date(slotStart.getTime() + MEETING_DURATION * 60 * 1000);
      if (isFree(slotStart, slotEnd)) {
        return { start: slotStart, end: slotEnd };
      }
      slotStart = new Date(slotStart.getTime() + INCREMENT * 60 * 1000);
    }
  }

  // No slot found in all days
  return null;
};
