
export const TOTAL_RIDDLES = 5;
export const POINTS_PER_RIDDLE = 20;
export const POINTS_PER_CLUE = 5;
export const GEMINI_TEXT_MODEL = "gemini-2.5-flash-preview-04-17";

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
    
