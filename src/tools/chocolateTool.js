import { DynamicTool } from "@langchain/core/tools";

export const chocolateTool = new DynamicTool({
  name: "order_chocolates",
  description: "Order chocolates for the candidate (dummy).",
  func: async () => {
    return "🍫 Chocolates ordered successfully from store (dummy).";
  },
});
