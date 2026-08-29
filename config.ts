import { config } from "dotenv";

config();

export const openrouterApiKey = process.env.OPENROUTER_API_KEY;
export const openrouterModel =
  process.env.OPENROUTER_MODEL || "deepseek/deepseek-v4-flash-0731";
export const port = process.env.PORT || 3000;
export const stamp = process.env.STAMP || new Date().getTime();
