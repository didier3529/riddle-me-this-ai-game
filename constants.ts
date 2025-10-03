
export const TOTAL_RIDDLES = 5;
export const POINTS_PER_RIDDLE = 20;
export const POINTS_PER_CLUE = 5;
// Using OpenAI GPT-3.5-turbo instead of Gemini

// Add uniqueness requirement to the prompt
export const riddleGenerationPrompt = `
Generate a unique and engaging riddle suitable for a general audience.
IMPORTANT: Create a completely original riddle that is unlikely to be commonly known.
Also provide the single, most common answer to the riddle.
Finally, create 4 distinct clues that progressively help in solving the riddle, but do not give the answer away too easily.

Return the response as a JSON object with the following exact structure:
{
  "riddle": "The text of the riddle itself.",
  "answer": "The correct answer to the riddle.",
  "clues": [
    "First clue text.",
    "Second clue text.",
    "Third clue text.",
    "Fourth clue text."
  ]
}

Ensure the clues are numbered implicitly by their order in the array.
Do not include any explanatory text outside of the JSON structure.
The riddle should be challenging but solvable.
`;

export const answerCheckingPrompt = (riddle: string, correctAnswer: string, userAnswer: string): string => `
You are an impartial judge for a riddle game.
The riddle was: "${riddle}"
The generally accepted correct answer is: "${correctAnswer}"
The user has submitted the answer: "${userAnswer}"

Please determine if the user's answer is correct. Consider minor misspellings, singular/plural forms, or very close synonyms as correct if the core meaning matches the accepted answer.
Respond with a JSON object with the following exact structure:
{
  "isCorrect": boolean // true if the user's answer is considered correct, false otherwise
}
Do not include any explanatory text outside of the JSON structure.
`;

// Demo riddles for fallback mode when API is unavailable
export const demoRiddles: Array<{
  riddle: string;
  answer: string;
  clues: string[];
}> = [
  {
    riddle: "I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?",
    answer: "echo",
    clues: [
      "I'm a sound phenomenon",
      "I repeat what you say",
      "I need a surface to bounce off",
      "I'm what you hear in empty spaces"
    ]
  },
  {
    riddle: "The more you take, the more you leave behind. What am I?",
    answer: "footsteps",
    clues: [
      "I'm related to walking",
      "I mark where you've been",
      "I disappear over time",
      "I'm made by feet"
    ]
  },
  {
    riddle: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
    answer: "map",
    clues: [
      "I show geographical features",
      "I help you navigate",
      "I'm flat and portable",
      "I represent real places"
    ]
  },
  {
    riddle: "I'm tall when I'm young, and short when I'm old. What am I?",
    answer: "candle",
    clues: [
      "I provide light",
      "I'm made of wax",
      "I get shorter as I burn",
      "I have a wick"
    ]
  },
  {
    riddle: "What has keys but no locks, space but no room, and you can enter but not go inside?",
    answer: "keyboard",
    clues: [
      "I'm used for typing",
      "I have letters and numbers",
      "I'm connected to computers",
      "I have keys that aren't for doors"
    ]
  }
];
    
