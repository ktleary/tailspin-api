import express from "express";
import OpenAI from "openai";
import { openaiApiKey, port } from "../config";
import cors from "cors";
import { Request, Response } from "express";
import { verifyRequest } from "./verify-request";

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

interface CompletionParams {
  model: string;
  prompt: string;
  temperature: number;
  max_tokens: number;
}

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// models page: https://platform.openai.com/docs/models/gpt-3-5
const models = {
  "35Turbo1106": "gpt-3.5-turbo-1106",
  "35Turbo": "gpt-3.5-turbo",
  "35Turbo16k": "gpt-3.5-turbo-16k",
  "35TurboInstruct": "gpt-3.5-turbo-instruct",
  GPT4: "gpt-4",
};

const modelToUse = models["35TurboInstruct"];

async function generateStory(prompt: string) {
  try {
    const completionParams: CompletionParams = {
      model: modelToUse,
      prompt: prompt,
      temperature: 0.9,
      max_tokens: 2000,
    };

    const response: OpenAI.Completion = await openai.completions.create(
      completionParams
    );

    const story = response.choices[0].text;
    return story;
  } catch (error) {
    console.error(`Error generating story: ${error.name} ${error.message}`);
    throw error;
  }
}

app.post("/api/v1/create-story", async (req: Request, res: Response) => {
  const verified = verifyRequest(req);

  if (!verified) {
    return res.status(400).json({ msg: "Bad request" });
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
    Write a short story for a PG-13 audience using the following elements:

    Title: ${theme}
    Location: ${location} 
    Time: ${time} 
    Conflict: ${conflict}
    Ending: ${ending}
    Tone: ${tone}
    Plot Point: ${plotPoint}
    ${charactersDetails}


    Use a narrative style of "${tone}" and a plot involving: "${plotPoint}".  Employ witty dialogue and detailed inner monologues when appropriate. Create vivid descriptions of the characters and setting. The story should end on a ${ending} note. Feel free to inject literary devices including Foreshadowing, Hyperbole, Oxymoron, Flashback, Dramatic Irony, Metaphor, Epigraph, as well as plot twists, and surprize endings. Finally, tag the story with 3 hashtags.
  `;

  try {
    const response = await generateStory(prompt);

    if (response) {
      return res.status(200).json({ story: response });
    } else {
      throw new Error("No response was returned from OpenAI GPT-4");
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
