
import { RiddleData, AnswerEvaluation, AIServiceError } from '../types';
import { riddleGenerationPrompt, answerCheckingPrompt } from '../constants';

// Ensure API_KEY is handled by the environment.
const API_KEY = process.env.VITE_OPENROUTER_API_KEY || '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';

if (!API_KEY) {
  console.error("API_KEY for OpenRouter is not set. Please set the API_KEY environment variable.");
}

function parseGeminiJsonResponse<T,>(responseText: string): T | null {
  let jsonStr = responseText.trim();
  // Regex to remove optional markdown fences (```json ... ``` or ``` ... ```)
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[1]) {
    jsonStr = match[1].trim();
  }
  
  try {
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.error("Failed to parse JSON response:", error, "Raw text:", responseText);
    // Attempt to find JSON within a potentially larger string
    const jsonWithinStringMatch = jsonStr.match(/({[\s\S]*}|\[[\s\S]*\])/);
    if (jsonWithinStringMatch && jsonWithinStringMatch[0]) {
      try {
        return JSON.parse(jsonWithinStringMatch[0]) as T;
      } catch (e) {
        console.error("Failed to parse extracted JSON:", e);
      }
    }
    return null;
  }
}

// Create a cache to store previously shown riddles
// This will persist during the session but reset on page refresh
const previousRiddles: Set<string> = new Set();

// Create a map to store riddles by session
const riddlesBySession: Map<string, Set<string>> = new Map();

// Helper function to check if a riddle is similar to previous ones
const isSimilarToExisting = (newRiddle: RiddleData): boolean => {
  // Check if the exact same answer exists
  for (const existingRiddleKey of previousRiddles) {
    const existingRiddle = JSON.parse(existingRiddleKey);
    
    // If the answer is the same or very similar, consider it a duplicate
    if (existingRiddle.answer.toLowerCase() === newRiddle.answer.toLowerCase()) {
      return true;
    }
    
    // Check for high similarity in the riddle text itself
    if (existingRiddle.riddle.toLowerCase().includes(newRiddle.riddle.toLowerCase()) ||
        newRiddle.riddle.toLowerCase().includes(existingRiddle.riddle.toLowerCase())) {
      return true;
    }
  }
  return false;
};

export const fetchRiddleAndClues = async (sessionId: string = 'default'): Promise<RiddleData | AIServiceError> => {
  if (!API_KEY) return { message: "API Key not configured." };
  
  // Get or create the set of riddles for this session
  if (!riddlesBySession.has(sessionId)) {
    riddlesBySession.set(sessionId, new Set());
  }
  const sessionRiddles = riddlesBySession.get(sessionId)!;
  
  // Maximum attempts to get a unique riddle
  const maxAttempts = 3;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Riddle Me This Game',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: riddleGenerationPrompt
            }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.choices[0]?.message?.content || "";
      
      const parsedData = parseGeminiJsonResponse<RiddleData>(responseText);
      if (parsedData && parsedData.riddle && parsedData.answer && Array.isArray(parsedData.clues) && parsedData.clues.length === 4) {
        
        // Create a key for this riddle
        const riddleKey = JSON.stringify({
          riddle: parsedData.riddle,
          answer: parsedData.answer
        });
        
        // Check if this riddle is similar to ones we've seen before in this session
        if (sessionRiddles.has(riddleKey) || isSimilarToExisting(parsedData)) {
          attempts++;
          console.log(`Duplicate riddle detected (attempt ${attempts}/${maxAttempts}), trying again...`);
          continue;
        }
        
        // Store this riddle in our session cache
        sessionRiddles.add(riddleKey);
        // Also add to global cache to prevent repeats across sessions
        previousRiddles.add(riddleKey);
        
        return parsedData;
      }
      
      console.error("Invalid riddle data structure received:", parsedData, "Raw text:", responseText);
      attempts++;
    } catch (error) {
      console.error("Error fetching riddle:", error);
      attempts++;
    }
  }
  
  return { message: "Failed to fetch a unique riddle after multiple attempts. Please try again." };
};

export const checkUserAnswer = async (riddle: string, correctAnswer: string, userAnswer: string): Promise<AnswerEvaluation | AIServiceError> => {
  if (!API_KEY) return { message: "API Key not configured." };
  try {
    const prompt = answerCheckingPrompt(riddle, correctAnswer, userAnswer);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Riddle Me This Game',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || "";

    const parsedData = parseGeminiJsonResponse<AnswerEvaluation>(responseText);
    if (parsedData && typeof parsedData.isCorrect === 'boolean') {
      return parsedData;
    }
    console.error("Invalid answer evaluation structure:", parsedData, "Raw text:", responseText);
    return { message: "Failed to evaluate the answer. The AI's response was not in the expected format." };
  } catch (error) {
    console.error("Error checking answer:", error);
    return { message: `Error checking answer: ${error instanceof Error ? error.message : String(error)}` };
  }
};
    


