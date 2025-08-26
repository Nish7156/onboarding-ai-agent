import fs from "fs";
import path from "path";

const MEMORY_FILE = path.join(process.cwd(), "agentMemory.json");

// Load memory
export function loadMemory() {
  if (fs.existsSync(MEMORY_FILE)) {
    const data = fs.readFileSync(MEMORY_FILE, "utf-8");
    return JSON.parse(data);
  }
  return { onboardedCandidates: [], tasks: [] };
}

// Save memory
export function saveMemory(memory) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}
