// import { model } from "./config/llm.js";
// import { emailTool } from "./tools/emailTool.js";
// import { calendarTool } from "./tools/calendarTool.js";
// import { slackTool } from "./tools/slackTool.js";
// import { chocolateTool } from "./tools/chocolateTool.js";

// const tools = {
//   send_welcome_email: emailTool,
//   calendar_meet: calendarTool,
//   slack_broadcast: slackTool,
//   order_chocolates: chocolateTool,
// };

// /**
//  * Run multiple onboarding tasks in a fully agentic workflow
//  * @param {Array} tasks - list of task strings
//  * @param {Object} context - candidate and HR info
//  * @returns Array of task results [{task, tool, result}]
//  */
// export async function runAgenticWorkflow(tasks, context = {}) {
//   const results = [];

//   for (const task of tasks) {
//     const response = await model.invoke(`
//       You are an onboarding agent.
//       Available tools: send_welcome_email, calendar_meet, slack_broadcast, order_chocolates.
//       Rules:
//       - Always respond in JSON: {"tool":"tool_name","input":{...}}.
//       - Use the correct tool based on task.
//       Context: ${JSON.stringify(context)}
      
//       Task: ${task}
//     `);

//     let parsed;
//     try {
//       // Sometimes the model returns ```json ... ``` formatting
//       const cleaned = response.content.replace(/```json|```/g, "").trim();
//       parsed = JSON.parse(cleaned);
//     } catch (err) {
//       console.error("Failed to parse LLM response:", err);
//       parsed = { tool: "none", input: response.content };
//     }

//     // Execute the tool if available
//     if (parsed.tool && tools[parsed.tool]) {
//       const toolResult = await tools[parsed.tool].func(parsed.input);
//       results.push({ task, tool: parsed.tool, result: toolResult });
//     } else {
//       results.push({ task, tool: parsed.tool || null, result: parsed.input });
//     }
//   }

//   return results;
// }
import { model } from "./config/llm.js";
import { emailTool } from "./tools/emailTool.js";
import { calendarTool } from "./tools/calendarTool.js";
import { slackTool } from "./tools/slackTool.js";
import { chocolateTool } from "./tools/chocolateTool.js";
import { loadMemory, saveMemory } from "./utils/memory.js";
import { logTaskExecution } from "./utils/logger.js";

const tools = {
  send_welcome_email: emailTool,
  calendar_meet: calendarTool,
  slack_broadcast: slackTool,
  order_chocolates: chocolateTool,
};

/**
 * Execute a single task with retries and merged context
 */
async function executeTask(taskName, context, forcedTool = null, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const toolResponse = await model.invoke(`
        Task: "${taskName}"
        Context: ${JSON.stringify(context)}
        Rules:
        - Respond ONLY in JSON: {"tool":"tool_name","input":{...}}
        - Available tools: ${Object.keys(tools).join(", ")}
      `);

      const cleaned = toolResponse.content.replace(/```json|```/g, "").trim();
      const parsedTool = JSON.parse(cleaned);
      const toolName = forcedTool || parsedTool.tool;

      let result;
      if (toolName && tools[toolName]) {
        const toolInput = { ...parsedTool.input };
        if (toolName === "send_welcome_email") {
          toolInput.candidateName = context.candidateName;
          toolInput.candidateEmail = context.candidateEmail;
        }
        result = await tools[toolName].func(toolInput);
      } else {
        result = `❌ Tool "${toolName || "undefined"}" not available. Task skipped.`;
      }

      // --- Audit log ---
      logTaskExecution({
        task: taskName,
        tool: toolName,
        input: parsedTool.input,
        result,
        context,
        llmRaw: toolResponse.content,
        attempt,
      });

      return { task: taskName, tool: toolName, result };
    } catch (err) {
      if (attempt < retries) continue;

      const failResult = `❌ Failed after ${retries + 1} attempts: ${err.message}`;
      logTaskExecution({
        task: taskName,
        tool: forcedTool || null,
        input: null,
        result: failResult,
        context,
        llmRaw: null,
        attempt,
      });

      return { task: taskName, tool: null, result: failResult };
    }
  }
}


/**
 * Fully autonomous onboarding agent with memory
 */
export async function autonomousAgentWithMemory(goal, context = {},onProgress) {
  const memory = loadMemory();

  if (!context.candidateName || !context.candidateEmail) {
    onProgress?.({ type: "task", task: goal, status: "failed", result: msg });
    return [{ task: goal, tool: null, result: "❌ Missing candidateName or candidateEmail in context" }];
  }

  if (memory.onboardedCandidates.includes(context.candidateEmail)) {
    return [{ task: goal, tool: null, result: "Candidate already onboarded." }];
  }

  // 1️⃣ Generate subtasks
  let tasksQueue = [];
  try {
    const subtaskResponse = await model.invoke(`
      You are a highly autonomous and intelligent onboarding agent.
      
      Goal: "${goal}"
      Candidate Info: ${JSON.stringify({ candidateName: context.candidateName, candidateEmail: context.candidateEmail })}
      HR Info: ${JSON.stringify({ name: context.hrName })}
      Memory: ${JSON.stringify(memory)}
      
      Rules:
      1. Respond ONLY in valid JSON, strictly parseable.
      2. Format must be exactly:
      {
        "tasks": [
          {
            "name": "Descriptive task name",
            "tool": "tool_name",
            "priority": 1
          },
          ...
        ]
      }
      3. Use only these tools: ${Object.keys(tools).join(", ")}
      4. Each task must:
         - Have a human-readable descriptive name.
         - Use one of the available tools.
         - Have a priority number (1 = most urgent).
      5. Never invent new tools. If a requested task doesn’t match an available tool, mark it as "no_tool_available".
      6. Prioritize tasks based on urgency and logical onboarding sequence.
      7. Return tasks as an array in JSON. Do NOT include any explanations, comments, or markdown.
      8. If a task can’t be executed due to missing info, still include it with a note in the name like "(info missing)".
      
      Example valid output:
      {
        "tasks": [
          {
            "name": "Send welcome email to candidate",
            "tool": "send_welcome_email",
            "priority": 1
          },
          {
            "name": "Schedule onboarding calendar meeting",
            "tool": "calendar_meet",
            "priority": 2
          }
        ]
      }
      
      Generate subtasks for this goal now.
      `);
      

    console.log("LLM subtask response:", subtaskResponse.content);
    const cleaned = subtaskResponse.content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    tasksQueue = parsed.tasks || [];
  } catch (err) {
    console.error("Subtask generation failed:", err);
    return [{ task: goal, tool: null, result: "Failed to generate subtasks" }];
  }

  if (tasksQueue.length === 0) {
    return [{ task: goal, tool: null, result: "No subtasks generated" }];
  }

  // 2️⃣ Execute tasks sequentially
  const results = [];
  for (const task of tasksQueue) {
    onProgress?.({ type: "task", task: task.name, status: "started" });
    // task = { name, tool, priority }
    const res = await executeTask(task.name, context, task.tool);
    onProgress?.({ type: "task", task: task.name, status: "completed", results });
    results.push(res);
  }

  // 3️⃣ Update memory
  memory.onboardedCandidates.push(context.candidateEmail);
  memory.tasks.push(
    ...results.map(r => ({
      task: r.task,
      tool: r.tool,
      result: r.result,
      timestamp: new Date().toISOString(),
    }))
  );
  saveMemory(memory);

  return results;
}
