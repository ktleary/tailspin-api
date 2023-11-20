import express from "express";
import OpenAI from "openai";
import { openaiApiKey, port } from "../config";
import cors from "cors";
import { Request, Response } from "express";

interface Character {
  name: string;
  age: number;
  // ... other character properties
}

interface Story {
  theme: string;
  characters: Character[];
  setting: string;
  plotPoint: string;
  conflict: string;
  // ... other story properties
}

const app = express();
app.use(cors());
app.use(express.json()); // for parsing application/json

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

app.post("/api/v1/create-story", async (req: Request, res: Response) => {
  const story: Story = req.body.story;
  const { theme, characters, setting, plotPoint, conflict } = story;

  console.log(
    `theme=${theme} characters=${characters} setting=${setting} plotPoint=${plotPoint}`
  );

  // Validate the input
  if (
    !theme ||
    !characters ||
    characters.length === 0 ||
    !setting ||
    !plotPoint
  ) {
    return res.status(400).json({ msg: "Incomplete story data provided" });
  }

  // Construct the characters details string
  const charactersDetails = characters
    .map((character, index) => {
      return `Character ${index + 1}: ${character.name}, Age: ${character.age}`; // Add other character details
    })
    .join("\n");

  // Construct the prompt
  const prompt = `
    Create a short story with the following elements:

    Theme: ${theme}
    Conflict: ${conflict}
    ${charactersDetails}
    Plot Point: ${plotPoint}
    Setting: ${setting}

    Please weave these elements into a coherent narrative with a beginning, middle, and end, focusing on the theme of identity crisis and the internal conflict faced by the characters. Highlight how the setting influences the story and integrate the plot point meaningfully.
  `;

  console.log(prompt);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function generateStory(prompt: string) {
    try {
      // const completionParams: OpenAI.Completion.CompletionCreateParams = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const completionParams: any = {
        model: modelToUse,
        //"text-davinci-003", // Use the appropriate Davinci model text-davinci-003
        prompt: prompt,
        temperature: 0.7,
        max_tokens: 1000, // Adjust based on your needs
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await openai.completions.create(completionParams);
      console.log(response);
      /*
      {
  warning: 'This model version is deprecated. Migrate before January 4, 2024 to avoid disruption of service. Learn more https://platform.openai.com/docs/deprecations',
  id: 'cmpl-8MrT0GN5V4dHQEAJbbEamOTkyUkVI',
  object: 'text_completion',
  created: 1700459434,
  model: 'text-davinci-003',
  choices: [
    {
      text: '\n' +
        "Bob had just turned 27 and had decided to take a trip to Paris to celebrate. It was a much needed es
        //... more
        /*
        */

      // const completion: OpenAI.Chat.ChatCompletion =
      //   await openai.chat.completions.create(params);

      const story = response.choices[0].text;
      console.log(response, story);
      return story;
      // return completion;
      // return completion.data.choices[0].text;
    } catch (error) {
      console.error(`Error generating story: ${error.name} ${error.message}`);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function generateGPTXStory(prompt: string) {
    try {
      const params: OpenAI.Chat.ChatCompletionCreateParams = {
        messages: [
          {
            role: "system",
            content:
              "You are a creative writer. Please write a short story with the following details.",
          },
          {
            role: "user",
            content: `Theme: Man vs Nature
                      Conflict: Character vs Nature
                      Character 1: Bob, Age: 27
                      Plot Point: A mysterious discovery
                      Setting: Paris
      
                      Please weave these elements into a coherent narrative with a beginning, middle, and end, focusing on the theme of identity crisis and the internal conflict faced by the characters. Highlight how the setting influences the story and integrate the plot point meaningfully.`,
          },
        ],
        model: modelToUse,
      };
      const completion: OpenAI.Chat.ChatCompletion =
        await openai.chat.completions.create(params);

      /*
        {
    "story": {
        "choices": [
            {
                "finish_reason": "stop",
                "index": 0,
                "message": {
                    "content": "Title: \"The Veins of The Seine\"\n\nIn the heart of Paris, amidst the bustling crowds and timeless architecture, lived Bob, a curious and adventurous 27-year-old. Having
                    //... more

                    */

      const story = completion.choices[0].message.content;
      console.log(completion, story);
      return story;
      // return completion.data.choices[0].text;
    } catch (error) {
      console.error(
        `Error generating story with completions: ${error.name} ${error.message}`
      );
      throw error;
    }
  }

  const testing = false;

  // const generateFn = useGPTX ? generateGPTXStory : generateStory;

  if (!testing) {
    try {
      const response = await generateStory(prompt);
      console.log(response);

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
  } else {
    return res.status(200).json({ story: "This is a test story" });
  }
});

// Start the server
const PORT = port || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
