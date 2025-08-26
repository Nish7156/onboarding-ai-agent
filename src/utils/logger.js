import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "agent_logs.json");

export function logTask(task, tool, result, status = "success") {
  const logs = fs.existsSync(LOG_FILE) ? JSON.parse(fs.readFileSync(LOG_FILE, "utf-8")) : [];
  logs.push({
    timestamp: new Date().toISOString(),
    task,
    tool,
    result,
    status
  });
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}


const LOG_FILE_AUDIT = path.join(process.cwd(), "onboarding-audit.log");

export function logTaskExecution(logEntry) {
  const entry = `[${new Date().toISOString()}] ${JSON.stringify(logEntry)}\n`;
  fs.appendFileSync(LOG_FILE_AUDIT, entry);
}