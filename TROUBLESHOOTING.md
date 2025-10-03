# Riddle Me This AI Game - Troubleshooting Guide

## Issue: Game Stuck on "Summoning a new riddle..." Loading Screen

### Root Cause Analysis
The game gets stuck because of API configuration issues with OpenRouter (OpenAI GPT-3.5-turbo). Here are the main problems identified:

1. **API Key Configuration**: The environment variable `VITE_OPENROUTER_API_KEY` may not be set
2. **API Response Parsing**: The JSON parsing might fail due to malformed AI responses
3. **Network Issues**: OpenRouter API calls might be failing
4. **Error Handling**: Errors aren't properly displayed to users

### Quick Fixes

#### 1. Set Up API Key
Create a `.env.local` file in the project root:
```bash
VITE_OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
```

#### 2. Alternative: Use Demo Mode
If you don't have an API key, we can implement a demo mode with pre-generated riddles.

#### 3. Check Browser Console
Open Developer Tools (F12) and check the Console tab for error messages when the loading screen appears.

### Debugging Steps

1. **Check Environment Variables**
   - Verify `.env.local` exists in project root
   - Ensure `VITE_OPENROUTER_API_KEY` is set correctly
   - Restart the dev server after adding env variables

2. **Test API Connection**
   - Check if OpenRouter API is accessible
   - Verify API key has sufficient credits
   - Test with a simple API call

3. **Improve Error Handling**
   - Add better error messages
   - Implement fallback mechanisms
   - Add timeout handling for API calls

### Immediate Solutions

#### Option 1: Fix API Configuration
```bash
# Create .env.local file
echo "VITE_OPENROUTER_API_KEY=your_key_here" > .env.local

# Restart dev server
npm run dev
```

#### Option 2: Implement Demo Mode
Add a demo mode that uses pre-generated riddles when API fails.

#### Option 3: Switch to Different API
Consider switching to a more reliable API service or implementing offline mode.

### Long-term Improvements

1. **Better Error Handling**
   - Show specific error messages to users
   - Implement retry mechanisms
   - Add offline/fallback mode

2. **API Response Validation**
   - Improve JSON parsing robustness
   - Add response structure validation
   - Handle malformed responses gracefully

3. **User Experience**
   - Add loading progress indicators
   - Implement timeout handling
   - Provide clear error recovery options

### Files to Modify

- `services/geminiService.ts` - Improve error handling and add fallbacks
- `App.tsx` - Better error display and user feedback
- `constants.ts` - Add demo riddles for fallback mode
- `.env.local` - Configure API key properly

### Testing Checklist

- [ ] API key is configured correctly
- [ ] Environment variables are loaded
- [ ] Network connectivity to OpenRouter
- [ ] API responses are valid JSON
- [ ] Error messages are user-friendly
- [ ] Fallback mode works when API fails
