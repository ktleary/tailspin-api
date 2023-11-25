import { config } from "dotenv";

config();

export const openaiApiKey = process.env.OPENAI_API_KEY;
export const port = process.env.PORT || 3000;
export const stamp = process.env.STAMP || new Date().getTime();
