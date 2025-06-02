# Riddle Me This AI Game

## Introduction
"Riddle Me This" is an interactive AI-powered riddle game that challenges players with unique, dynamically generated riddles. Built using React and TypeScript, the game leverages Google's Gemini AI to create engaging riddles and evaluate player answers. Players can enjoy the game solo or compete with a friend in a two-player mode.

## Features
- AI-generated unique riddles using Google's Gemini API
- Single-player and two-player game modes
- Strategic clue system that affects scoring
- Real-time answer evaluation
- Progressive difficulty with a set number of riddles per game

## How to Install and Run

### Prerequisites
- Node.js (latest LTS version recommended)
- A Gemini API key from Google AI Studio

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/riddle-me-this-ai-game.git
   cd riddle-me-this-ai-game
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to the URL shown in your terminal (typically http://localhost:5173)

## How to Play

### Single Player Mode
- Start a new game by selecting "1 Player"
- Read the riddle and try to solve it
- Use clues if you're stuck, but remember each clue reduces your potential points
- Type your answer and submit
- Play through all five riddles to complete the game

### Two Player Mode
- Select "2 Players" to start a competitive game
- Players take turns answering riddles
- The first player to hit "Hit Me" gets to answer
- If they answer correctly, they earn points
- If they answer incorrectly, the other player gets the points
- The player with the most points after five riddles wins

## Code Analysis

### Architecture
The project follows a modern React application structure with TypeScript for type safety. Key components include:

1. **App Component (`App.tsx`)**: The main component managing game state, player interactions, and UI rendering.

2. **Gemini Service (`geminiService.ts`)**: Handles API communication with Google's Gemini AI for riddle generation and answer validation.

3. **Types and Constants**: Well-defined TypeScript interfaces and game constants that maintain code clarity and consistency.

4. **UI Components**: Modular components for loading indicators, modals, and game elements.

The application uses React hooks extensively for state management, avoiding the need for additional state management libraries.

### Notable Technical Implementations

1. **AI Integration**: The application uses Google's Gemini AI to generate unique riddles and evaluate user answers, with careful prompt engineering to ensure quality responses.

2. **JSON Parsing**: Robust parsing of AI responses with fallback mechanisms to handle various response formats.

3. **Session Management**: Tracking of riddles to prevent duplicates within and across game sessions.

4. **Responsive Design**: Tailwind CSS for a responsive and visually appealing interface.

## Challenges and Solutions

### Challenge 1: Type Safety with API Responses
**Problem**: The Gemini API's response type (`response.text`) could potentially be undefined, causing TypeScript errors.

**Solution**: Implemented null coalescing operators to provide fallback values:
```typescript
const parsedData = parseGeminiJsonResponse<RiddleData>(response.text || "");
```

### Challenge 2: Parsing Inconsistent AI Responses
**Problem**: The AI sometimes returned responses in different formats (with or without markdown code fences, extra text).

**Solution**: Created a robust parsing function with regex pattern matching and multiple fallback attempts.

### Challenge 3: Preventing Duplicate Riddles
**Problem**: The AI occasionally generated similar or identical riddles.

**Solution**: Implemented a caching system with similarity detection to ensure variety.

### Challenge 4: Environment Variable Configuration
**Problem**: Ensuring the API key is properly loaded from environment variables.

**Solution**: Configured Vite to properly expose environment variables to the client-side code.

## Review and Future Improvements

### Strengths
- Engaging gameplay with AI-generated content ensuring high replayability
- Clean, responsive UI with intuitive controls
- Well-structured codebase with good separation of concerns
- Robust error handling for AI interactions

### Areas for Improvement
1. **State Management**: For larger scale, consider using a state management library like Redux or Zustand
2. **Offline Support**: Add caching for previously generated riddles to allow limited offline play
3. **Accessibility**: Enhance keyboard navigation and screen reader support
4. **Multiplayer**: Implement real-time multiplayer using WebSockets
5. **Difficulty Levels**: Add options for different difficulty settings
6. **Categories**: Introduce riddle categories (e.g., wordplay, math, logic)
7. **Progressive Web App**: Convert to a PWA for better mobile experience

## License
This project is open source and available under the [MIT License](LICENSE).

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

