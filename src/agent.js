import { model } from "./config/llm.js";
import { emailTool } from "./tools/emailTool.js";
import { calendarTool } from "./tools/calendarTool.js";
import { slackTool } from "./tools/slackTool.js";
import { chocolateTool } from "./tools/chocolateTool.js";

const tools = {
  send_welcome_email: emailTool,
  calendar_meet: calendarTool,
  slack_broadcast: slackTool,
  order_chocolates: chocolateTool,
};

export async function runAgent(task) {
  const response = await model.invoke(
    `You are an onboarding agent.
     Available tools: send_welcome_email, calendar_meet, slack_broadcast, order_chocolates.
     Rules:
     - Always respond in JSON format {"tool":"tool_name","input":"some input"}.
     - If task is about sending email -> use send_welcome_email.
     - If task is about scheduling meet -> use calendar_meet.
     - If task is about Slack -> use slack_broadcast.
     - If task is about chocolates -> use order_chocolates.
     
     Task: ${task}`
  );

  let parsed;
  try {
    parsed = JSON.parse(response.content.trim());
  } catch {
    parsed = { tool: "none", input: response.content };
  }

  if (parsed.tool === "none") {
    return parsed.input;
  } else if (tools[parsed.tool]) {
    return await tools[parsed.tool].func(parsed.input);
  } else {
    return "I don’t know how to handle this.";
  }
}
