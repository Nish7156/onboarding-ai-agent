import { runAgent } from "./agent.js";
import { emailTool } from "./tools/emailTool.js";
import { calendarTool } from "./tools/calendarTool.js";

/**
 * Fully agentic onboarding workflow
 * @param {string} candidateName
 * @param {string} candidateEmail
 * @param {Array} hrEmails - List of HR emails (optional, agent can decide)
 * @param {Array} managerEmails - Manager emails (optional)
 */
export async function agenticOnboardCandidate(candidateName, candidateEmail, hrEmails = [], managerEmails = []) {
  console.log(`🚀 Starting fully agentic onboarding workflow for ${candidateName}...\n`);

  const results = [];

  // 1️⃣ Send welcome email
  results.push(await emailTool.func({name:candidateName, email:candidateEmail}));
  console.log(results[results.length - 1]);


  // 3️⃣ Schedule onboarding meeting
  const meetingRes = await calendarTool.func({
    candidateName: candidateName,
    candidateEmail: candidateEmail,
    hrEmails: hrEmails,
    managerEmails: managerEmails,
  });
  results.push(meetingRes);
  console.log(meetingRes, "LLL");

  // // 4️⃣ Notify via Slack
  // const slackRes = await runAgent(
  //   `Send a Slack message notifying the team that ${candidateName} is joining. Include meeting info.`
  // );
  // results.push(slackRes);
  // console.log(slackRes);

  // // 5️⃣ Optional tasks (chocolates, swag, etc.)
  // const swagRes = await runAgent(`Order chocolates or swag for ${candidateName}'s first day.`);
  // results.push(swagRes);
  // console.log(swagRes);

  console.log(`\n✅ Fully agentic onboarding workflow completed for ${candidateName}`);
  return results;
}
