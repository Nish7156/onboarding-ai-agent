import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { DynamicTool } from "@langchain/core/tools";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  // LLM (Gemini)
  const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-2.0-flash",
    temperature: 0,
  });

  // Tools
  const calculator = new DynamicTool({
    name: "calculator",
    description: "Solve math expressions (e.g., 23*7+10).",
    func: async (input) => {
      try {
        return Function(`"use strict"; return (${input})`)().toString();
      } catch {
        return "Error: invalid math expression.";
      }
    },
  });

  const wikiSearch = new DynamicTool({
    name: "wiki_search",
    description: "Search a topic on Wikipedia and return short summary.",
    func: async (query) => {
      try {
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            query
          )}`
        );
        if (!res.ok) return "No results found.";
        const data = await res.json();
        return data.extract || "No summary available.";
      } catch {
        return "Error fetching Wikipedia.";
      }
    },
  });

  const getTodos = new DynamicTool({
    name: "get_todos",
    description: "Fetch a fake TODO item from jsonplaceholder API (testing only).",
    func: async (input) => {
      try {
        const todoId = String(input).trim().replace(/\D/g, ""); // keep only digits
        if (!todoId) return "Error: invalid todo ID.";
        
        const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${todoId}`);
        if (!res.ok) return "Error: failed to fetch todos.";
        
        const data = await res.json();
        return JSON.stringify(data);
      } catch {
        return "Error fetching todos.";
      }
    },
  });
  

  const tools = { calculator, wiki_search: wikiSearch, get_todos: getTodos };

  // Simple agent loop
  async function askAgent(question) {
    // Step 1: Ask LLM which tool to use
    const response = await model.invoke(
      `You are a simple AI agent. 
       Available tools: calculator, wiki_search, get_todos.
       Rules:
       - If the question is math, output: {"tool":"calculator","input":"expression"}
       - If it asks about a topic, output: {"tool":"wiki_search","input":"query"}
       - If it asks for a todo (e.g., "What is the todo 1?"), output: {"tool":"get_todos","input":"1"}
       - If no tool is needed, output: {"tool":"none","input":"answer directly"}.
      
       Question: ${question}`
    );
  
    let parsed;
    try {
      parsed = JSON.parse(response.content.trim());
    } catch {
      parsed = { tool: "none", input: response.content };
    }
  
    let answer;
    if (parsed.tool === "none") {
      answer = parsed.input;
    } else if (tools[parsed.tool]) {
      answer = await tools[parsed.tool].func(parsed.input);
    } else {
      answer = "I don't know how to handle this.";
    }
  
    // ✅ Final output only: answer + token usage
    // console.log("Answer:", answer);
    // console.log("Tokens used:", response.usage?.totalTokens || "N/A");
  
    return answer;
  }
  
  
  // Test runs
  // console.log(await askAgent("What is 2000+2000?"));
  console.log(await askAgent("What is the todo 1?"));
}

main().catch(console.error);
