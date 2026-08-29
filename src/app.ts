import express from "express";
import OpenAI from "openai";
import { openrouterApiKey, openrouterModel, port } from "../config";
import cors from "cors";
import { Request, Response } from "express";

interface Character {
  givenName: string;
  familyName: string;
  age: number;
  attributes: string[];
  occupation: string;
}

interface Story {
  theme: string;
  characters: Character[];
  location: string;
  time: string;
  plotPoint: string;
  conflict: string;
  ending: string;
  tone: string;
}

const RATE_LIMIT_PER_HOUR = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= RATE_LIMIT_PER_HOUR) {
    return true;
  }

  record.count += 1;
  return false;
}

const app = express();
app.use(
  cors({
    origin: [
      "https://tailspin.fun",
      "https://www.tailspin.fun",
      "http://localhost:8080",
      "http://localhost:3000",
    ],
  })
);
app.use(express.json());

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: openrouterApiKey,
  defaultHeaders: {
    "HTTP-Referer": "https://tailspin.fun",
    "X-Title": "Tailspin",
  },
});

async function generateStory(prompt: string) {
  try {
    const response = await openai.chat.completions.create({
      model: openrouterModel,
      messages: [
        {
          role: "system",
          content: "You write short PG-13 stories from the given story elements.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 4000,
    });

    const story = response.choices[0]?.message?.content;
    return story;
  } catch (error) {
    console.error(`Error generating story: ${error.name} ${error.message}`);
    throw error;
  }
}

app.post("/api/v1/create-story", async (req: Request, res: Response) => {
  if (isRateLimited(clientIp(req))) {
    return res.status(429).json({ msg: "Too many requests" });
  }

  const story: Story = req.body.story;

  if (!story) {
    return res.status(400).json({ msg: "No story data provided" });
  }
  const {
    theme,
    characters,
    location,
    time,
    plotPoint,
    conflict,
    ending,
    tone,
  } = story || {};

  if (!characters || characters.length === 0) {
    return res.status(400).json({ msg: "Incomplete story data provided" });
  }

  const charactersDetails = characters
    .map((character, index) => {
      return `Character ${index + 1}: ${character.givenName} ${
        character.familyName || ""
      }, Age: ${character.age}, Occupation: ${
        character.occupation
      }, Character Traits: ${character?.attributes?.join(", ")}
      `;
    })
    ?.join("\n");

  const prompt = `
    Write a complete short story of about 800 words for a PG-13 audience using the following elements. Give it a real ending; do not trail off.

    Title: ${theme}
    Location: ${location} 
    Time: ${time} 
    Conflict: ${conflict}
    Ending: ${ending}
    Tone: ${tone}
    Plot Point: ${plotPoint}
    ${charactersDetails}


    Use a narrative style of "${tone}" and a plot involving: "${plotPoint}". Employ witty dialogue and detailed inner monologues when appropriate. Create vivid descriptions of the characters and setting. The story should end on a ${ending} note. Literary devices such as foreshadowing, metaphor, or a plot twist may be used when they serve the story.
  `;

  try {
    const response = await generateStory(prompt);

    if (response) {
      return res.status(200).json({ story: response });
    } else {
      throw new Error("No response was returned from the model");
    }
  } catch (error) {
    console.error(`Error generating story: ${error.name} ${error.message}`);
    return res
      .status(500)
      .json({ msg: "Error generating story", error: error.message });
  }
});

// Start the server
const PORT = port || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
