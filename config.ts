// Purpose: Configuration file for the server
import { config } from "dotenv";

config();

export const openaiApiKey = process.env.OPENAI_API_KEY;
export const port = process.env.PORT || 3000;
