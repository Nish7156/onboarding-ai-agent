import { DynamicTool } from "@langchain/core/tools";
import { WebClient } from "@slack/web-api";


export const slackTool = new DynamicTool({
  name: "slack_broadcast",
  description: "Send a dummy message to Slack team channel.",
  func: async (message) => {
    return `💬 Slack message broadcasted to #onboarding-team: "${message || "New candidate onboarded!"}"`;
  },
});



const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

// export const slackTool = new DynamicTool({
//   name: "slack_broadcast",
//   description: "Send a personalized welcome message to Slack team channel.",
//   func: async (input) => {
//     try {
//       const candidateName = input.candidateName || "New candidate";
//       const role = input.role || "your role"; // optional
//       const message = `🎉 Welcome ${candidateName} to the team! We are excited to have you on board${role ? ` as ${role}` : ""}!`;

//       const res = await slackClient.chat.postMessage({
//         channel: process.env.SLACK_CHANNEL_ID,
//         text: message,
//       });

//       if (res.ok) {
//         return `💬 Slack message sent successfully to channel: "${message}"`;
//       } else {
//         return `❌ Slack API error: ${res.error}`;
//       }
//     } catch (err) {
//       return `❌ Failed to send Slack message: ${err.message}`;
//     }
//   },
// });
