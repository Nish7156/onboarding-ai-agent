import { runAgent } from "./agent.js";
import { calendarTool } from "./tools/calendarTool.js";

// async function main() {
//   console.log(await runAgent("Send welcome email to john@example.com"));
//   console.log(await runAgent("Schedule onboarding meet with HR"));
//   console.log(await runAgent("Send message in Slack team channel about new candidate"));
//   console.log(await runAgent("Order chocolates for the candidate"));
// }

// main().catch(console.error);

// async function test() {
//   const emailRes = await runAgent("Send welcome email to alice@example.com");
//   console.log(emailRes);

//   const meetRes = await runAgent("Schedule onboarding meet with HR");
//   console.log(meetRes);
// }

// test();


// async function main() {
//   // Suppose you just provide new joiner's name
//   const newJoiner = "Nishant Shedage";

//   // await onboardCandidate(newJoiner);
  
// }

// main().catch(console.error);

// (async () => {
//   const res = await calendarTool.func();
//   console.log(res);
// })();


import { autonomousAgentWithMemory } from "./workflowAgent.js";

const hrEmails = ["hr1@example.com", "hr2@example.com"];
const managerEmails = ["manager@example.com"];

// (async () => {
//   await agenticOnboardCandidate("Nishant Shedage",'shedagenishant33@gmail.com', hrEmails, managerEmails);
// })();

// const tasks = [
//   "Send welcome email to Nishant Shedage",
//   "Schedule onboarding meet with HR",
//   "Send Slack message about Nishant joining",
//   "Order chocolates for Nishant's first day"
// ];

// const context = {
//   candidateName: "Nishant Shedage",
//   candidateEmail: "shedagenishant33@gmail.com",
//   hrEmails: ["hr1@example.com", "hr2@example.com"],
//   managerEmails: ["manager@example.com"]
// };

// const results = await runAgenticWorkflow(tasks, context);

// console.log("✅ Agentic Workflow Results:");
// results.forEach((r, i) => {
//   console.log(`${i + 1}. Task: ${r.task}`);
//   console.log(`   Tool Used: ${r.tool || "none"}`);
//   console.log(`   Result: ${r.result}\n`);
// });



// const context = {
//   candidateName: "Armani",
//   candidateEmail: "shedagenishant33@gmail.com",
//   hrEmails: ["hr1@example.com", "hr2@example.com"],
//   managerEmails: ["manager@example.com"],
//   phone: "+91-XXXXXXXXXX"
// };

// const results = await orchestrator("Onboard new candidate", context);

// results.forEach((r, i) => {
//   console.log(`${i + 1}. Task: ${r.taskName}`);
//   console.log(`   Tool: ${r.tool}`);
//   console.log(`   Result: ${r.result}`);
//   console.log(`   Status: ${r.status}\n`);
// });

// import express from "express";

// const app = express();
// app.use(express.json());

const context = {
  candidateName: "Nishant",
  candidateEmail: "Nishant@sorigin.com",
  hrName: "HR Person"
};

// const results = await autonomousAgentWithMemory("Onboard Nishant ", context);
// console.log(results);


import express from "express";

const app = express();
app.use(express.json());

app.post("/start-onboarding", async (req, res) => {
  const { goal, candidate } = req.body;

  const context = {
    candidateName: "Nishant",
    candidateEmail: "Nishant@sorigin.com",
    hrName: "HR Person"
  };
  

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Helper to send progress to FE
  const sendProgress = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Trigger your agent
    const results = await autonomousAgentWithMemory("onboard Nishant", context, sendProgress);

    // Send final results
    sendProgress({ type: "done", results });
    res.end();
  } catch (err) {
    sendProgress({ type: "error", message: err.message });
    res.end();
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
