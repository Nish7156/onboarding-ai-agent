import { DynamicTool } from "@langchain/core/tools";
import { getCalendarClient } from "../utils/calendarClient.js";
import { findFreeSlot } from "../utils/findFreeSlot.js";

const TIMEZONE = "Asia/Kolkata";

export const calendarTool = new DynamicTool({
  name: "calendar_meet",
  description:
    "Automatically find free slots over multiple days, schedule an onboarding meeting with HR, candidate, and managers, create Google Meet, and send invites.",
  func: async ({ candidateName, candidateEmail, hrEmails = [], managerEmails = [] }) => {
    if (!candidateName || !candidateEmail) {
      return "❌ Candidate name and email are required to schedule the meeting.";
    }

    const cal = await getCalendarClient();

    // Find a free slot
    const slot = await findFreeSlot();
    if (!slot) {
      return "❌ No free 30-minute slots available in the next 7 days during working hours (9 AM - 6 PM).";
    }

    // Build participant list: candidate + HR + managers
    const participants = [
      { email: candidateEmail },
      ...hrEmails.map((email) => ({ email })),
      ...managerEmails.map((email) => ({ email })),
    ];

    // return `✅ Meeting scheduled for ${candidateName}`

    // Create the event with Google Meet
    const event = await cal.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: `HR Onboarding: ${candidateName}`,
        description: `Automated onboarding meeting for ${candidateName}`,
        start: { dateTime: slot.start.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: slot.end.toISOString(), timeZone: TIMEZONE },
        attendees: participants,
        conferenceData: { createRequest: { requestId: `onboard-${Date.now()}` } },
      },
      conferenceDataVersion: 1,
      sendUpdates: "all", // Sends invite emails automatically
    });

    const meetLink = event.data.conferenceData?.entryPoints?.[0]?.uri || "No Meet link";

    return `✅ Meeting scheduled for ${candidateName} on ${slot.start.toLocaleString("en-IN", {
      timeZone: TIMEZONE,
      hour12: true,
      dateStyle: "short",
      timeStyle: "short",
    })}. Google Meet link: ${meetLink}`;
  },
});
