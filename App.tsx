
import { useWallet } from '@solana/wallet-adapter-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Modal from './components/Modal';
import SocialButtons from './components/SocialButtons';
import { POINTS_PER_CLUE, POINTS_PER_RIDDLE, TOTAL_RIDDLES } from './constants';
import { checkUserAnswer, fetchRiddleAndClues } from './services/geminiService';
import { AnswerEvaluation, GameState, PlayerScore, RiddleData } from './types';

const App: React.FC = () => {
  const { publicKey, connected, connecting } = useWallet();
  const [gameState, setGameState] = useState<GameState>(GameState.NotStarted);
  const [numPlayers, setNumPlayers] = useState<1 | 2>(1);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1); // For 1-player or whose "turn" it conceptually is for 2-player highlighting
  const [activePlayerForAnswer, setActivePlayerForAnswer] = useState<1 | 2 | null>(null); // Who hit "Hit Me"
  const [scores, setScores] = useState<PlayerScore>({ player1: 0, player2: 0 });
  
  const [currentRiddleData, setCurrentRiddleData] = useState<RiddleData | null>(null);
  const [revealedClues, setRevealedClues] = useState<boolean[]>([]);
  const [currentRiddlePotentialPoints, setCurrentRiddlePotentialPoints] = useState<number>(POINTS_PER_RIDDLE);
  
  const [userGuess, setUserGuess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [totalRiddlesPlayedInGame, setTotalRiddlesPlayedInGame] = useState<number>(0);
  const [isGuessSubmitted, setIsGuessSubmitted] = useState<boolean>(false);
  const [lastGuessEvaluation, setLastGuessEvaluation] = useState<AnswerEvaluation | null>(null);

  const [feedbackModalOpen, setFeedbackModalOpen] = useState<boolean>(false);
  const [feedbackModalTitle, setFeedbackModalTitle] = useState<string>("");
  const [feedbackModalMessage, setFeedbackModalMessage] = useState<string>("");
  const [gameSession, setGameSession] = useState<string>(Date.now().toString());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const questionVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);

  const resetRiddleState = () => {
    setIsGuessSubmitted(false);
    setLastGuessEvaluation(null);
    setUserGuess('');
    setRevealedClues([]);
    setCurrentRiddlePotentialPoints(POINTS_PER_RIDDLE);
    setActivePlayerForAnswer(null);
    setApiError(null);
  };


  const loadNewRiddle = useCallback(async () => {
    setIsLoading(true);
    resetRiddleState(); // Reset relevant state before loading

    // Check if API key is available
    const apiKey = process.env.VITE_OPENROUTER_API_KEY || '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';
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      setApiError("API Key not configured. Please set your VITE_OPENROUTER_API_KEY in the .env file.");
      setIsLoading(false);
      return;
    }

    // Pass the current game session to help track riddle uniqueness
    const result = await fetchRiddleAndClues(gameSession);
    if ('message' in result) { 
      setApiError(result.message);
    } else { 
      setCurrentRiddleData(result);
      setRevealedClues(new Array(result.clues.length).fill(false));
      // Check if we're in demo mode by looking at console logs or API key status
      const apiKey = process.env.VITE_OPENROUTER_API_KEY || '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';
      setIsDemoMode(!apiKey || apiKey === 'your_openrouter_api_key_here');
    }
    setIsLoading(false);
  }, [gameSession]);

  useEffect(() => {
    if (gameState === GameState.Playing && !currentRiddleData && totalRiddlesPlayedInGame === 0 && !isLoading && !isPlayingVideo) {
      loadNewRiddle();
    }
  }, [gameState, totalRiddlesPlayedInGame, isLoading, currentRiddleData, loadNewRiddle, isPlayingVideo]);

  const handleStartGame = (players: 1 | 2) => {
    setNumPlayers(players);
    setScores({ player1: 0, player2: 0 });
    setCurrentPlayer(1);
    setActivePlayerForAnswer(null);
    setTotalRiddlesPlayedInGame(0);
    setCurrentRiddleData(null);
    setIsPlayingVideo(false); // Video already playing, now we transition to game
    setGameState(GameState.Playing);
    // Video will end and call handleVideoEnd which will load the first riddle
  };

  const handleRevealClue = (index: number) => {
    if (revealedClues[index] || isGuessSubmitted || activePlayerForAnswer !== null || isLoading) return;

    const newRevealedClues = [...revealedClues];
    newRevealedClues[index] = true;
    setRevealedClues(newRevealedClues);
    setCurrentRiddlePotentialPoints(prev => Math.max(0, prev - POINTS_PER_CLUE));
  };

  const handleHitMe = (player: 1 | 2) => {
    if (activePlayerForAnswer !== null || isGuessSubmitted || isLoading || numPlayers !== 2) return;
    setActivePlayerForAnswer(player);
    setUserGuess(''); // Clear shared input field for the active player
  };

  const handleSubmitGuess = async () => {
    if (!userGuess.trim() || !currentRiddleData || isGuessSubmitted) return;
    // For 2-player mode, ensure an active player has hit "Hit Me"
    if (numPlayers === 2 && activePlayerForAnswer === null) return; 

    setIsLoading(true);
    setApiError(null);
    
    const result = await checkUserAnswer(currentRiddleData.riddle, currentRiddleData.answer, userGuess);
    
    if ('message' in result) { 
      setApiError(result.message);
      setFeedbackModalTitle("Error");
      setFeedbackModalMessage(result.message || "Could not verify your answer. Please try again.");
      setFeedbackModalOpen(true);
    } else { 
      setLastGuessEvaluation(result);
      let pointsAwarded = 0;
      let modalTitle = "";
      let modalMsg = "";

      const answeringPlayer = numPlayers === 2 ? activePlayerForAnswer : currentPlayer;
      const nonAnsweringPlayer = numPlayers === 2 ? (activePlayerForAnswer === 1 ? 2 : 1) : null;

      if (result.isCorrect) {
        pointsAwarded = currentRiddlePotentialPoints;
        setScores(prevScores => ({
          ...prevScores,
          [answeringPlayer === 1 ? 'player1' : 'player2']: prevScores[answeringPlayer === 1 ? 'player1' : 'player2'] + pointsAwarded,
        }));
        modalTitle = `Player ${answeringPlayer} Correct!`;
        modalMsg = `Player ${answeringPlayer} earned ${pointsAwarded} points!`;
      } else { // Incorrect Answer
        if (numPlayers === 2 && nonAnsweringPlayer) {
          pointsAwarded = currentRiddlePotentialPoints; // Other player gets points
           setScores(prevScores => ({
            ...prevScores,
            [nonAnsweringPlayer === 1 ? 'player1' : 'player2']: prevScores[nonAnsweringPlayer === 1 ? 'player1' : 'player2'] + pointsAwarded,
          }));
          modalTitle = `Player ${answeringPlayer} Incorrect!`;
          modalMsg = `The answer was "${currentRiddleData.answer}". Player ${nonAnsweringPlayer} gets ${pointsAwarded} points!`;
        } else { // 1 Player mode or unhandled 2 player case (should not happen with nonAnsweringPlayer check)
          modalTitle = "Incorrect!";
          modalMsg = `That wasn't the right answer. The correct answer was: "${currentRiddleData.answer}".`;
        }
      }
      setFeedbackModalTitle(modalTitle);
      setFeedbackModalMessage(modalMsg);
      setFeedbackModalOpen(true);
    }
    setIsLoading(false);
    setIsGuessSubmitted(true);
  };
  
  const handleModalCloseAndProceed = () => {
    setFeedbackModalOpen(false); 
    setIsLoading(true); 

    if (totalRiddlesPlayedInGame >= TOTAL_RIDDLES - 1) {
      setGameState(GameState.GameOver);
      setIsLoading(false); 
    } else {
      const nextTotalRiddlesPlayed = totalRiddlesPlayedInGame + 1;
      setTotalRiddlesPlayedInGame(nextTotalRiddlesPlayed);
      
      if (numPlayers === 2) {
        // currentPlayer still toggles to indicate whose "conceptual" turn it would be for highlighting if no one hit "Hit Me"
         setCurrentPlayer(prev => prev === 1 ? 2 : 1); 
      }
      // Reset for next riddle/turn
      // resetRiddleState(); // This is called in loadNewRiddle
      setCurrentRiddleData(null); 
      loadNewRiddle(); 
    }
  };


  const handleRestart = () => {
    setGameState(GameState.NotStarted);
    setCurrentRiddleData(null); 
    setTotalRiddlesPlayedInGame(0); 
    setApiError(null); 
    setIsPlayingVideo(false);
    resetRiddleState();
    // Reset videos
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    if (questionVideoRef.current) {
      questionVideoRef.current.pause();
      questionVideoRef.current.currentTime = 0;
    }
    // Create a new game session ID to track a new set of 5 riddles
    setGameSession(Date.now().toString());
  };

  const handleVideoEnd = () => {
    setIsPlayingVideo(false);
    // Start loading the first riddle after video ends
    if (gameState === GameState.Playing) {
      loadNewRiddle();
    }
  };

  // Function to get video source based on current riddle
  const getQuestionVideo = () => {
    const currentRiddleNumber = totalRiddlesPlayedInGame + 1;
    if (currentRiddleNumber === 1) {
      return '/Question 1.mp4';
    } else if (currentRiddleNumber === 2) {
      return '/Question 2.mp4';
    } else if (currentRiddleNumber === 3) {
      return 'question 3.mp4';
    } else if (currentRiddleNumber === 4) {
      return 'question 4.mp4';
    } else if (currentRiddleNumber === 5) {
      return 'question 5.mp4';
    } else {
      return '/Question 1.mp4'; // fallback
    }
  };

  // Function to get background image based on current riddle (for fallback)
  const getBackgroundImage = () => {
    const currentRiddleNumber = totalRiddlesPlayedInGame + 1;
    if (currentRiddleNumber === 1) {
      return 'Question 1.png';
    } else if (currentRiddleNumber === 2) {
      return 'Question 2.png';
    } else if (currentRiddleNumber === 3) {
      return 'question 3.png';
    } else if (currentRiddleNumber === 4) {
      return 'Question 4.png';
    } else {
      return 'u5228372594_make_it_169_very_igh_quality_--ar_9151_--stylize__80f0db7f-2e20-47b0-b3b7-fb025a0c2468_0.png';
    }
  };

  const renderGameContent = () => {
    if (isLoading && !currentRiddleData && gameState === GameState.Playing && !feedbackModalOpen) {
      return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-blue-400 text-lg">Loading next question...</p>
          </div>
        </div>
      );
    }
    if (apiError && !currentRiddleData) { 
      return <div className="text-center p-8">
        <h2 className="text-2xl text-red-400 mb-4">Oops! Something went wrong.</h2>
        <p className="text-slate-300 mb-4">{apiError}</p>
        <div className="bg-slate-700 p-4 rounded-md mb-6 text-left">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Troubleshooting:</h3>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• Check your internet connection</li>
            <li>• Verify API key is set in .env.local file</li>
            <li>• Open browser console (F12) for detailed error messages</li>
            <li>• Try refreshing the page</li>
          </ul>
        </div>
        <div className="space-x-4">
          <button
            onClick={loadNewRiddle}
            className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold py-2 px-6 rounded-md transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={handleRestart}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-md transition-colors"
          >
            Restart Game
          </button>
        </div>
      </div>;
    }
    if (!currentRiddleData) return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-400 text-lg">Preparing the game...</p>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen flex flex-col items-center justify-end p-6 relative overflow-hidden pb-20">
        {/* Holographic Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-indigo-500/10 pointer-events-none animate-pulse" />
        <div className="absolute top-20 left-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-700" />

        <div className="w-full max-w-2xl space-y-8 relative z-10">
          {/* Answer Form */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-2xl opacity-50 group-hover:opacity-75 blur-xl transition duration-500 animate-pulse" />
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 rounded-2xl opacity-30 blur transition duration-500" />

            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 border-2 border-cyan-400/30 shadow-[0_0_50px_rgba(34,211,238,0.3)] hover:shadow-[0_0_80px_rgba(34,211,238,0.5)] transition-all duration-500">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmitGuess(); }} className="space-y-4">
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl opacity-20 blur" />
            <input
              type="text"
              value={userGuess}
              onChange={(e) => setUserGuess(e.target.value)}
                    placeholder="Type your answer here..."
              disabled={isLoading}
                    className="relative w-full bg-white/5 border-2 border-cyan-400/40 text-white placeholder:text-white/40 h-14 text-lg rounded-xl backdrop-blur-sm focus:border-cyan-400/80 focus:ring-2 focus:ring-cyan-400/50 focus:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all p-4"
                  />
          </div>

                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition animate-pulse" />
                <button
                    type="submit"
                    disabled={!userGuess.trim() || isLoading}
                    className="relative w-full h-14 text-lg font-semibold overflow-hidden group/btn rounded-xl border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-transform group-hover/btn:scale-105" />
                    <span className="relative z-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                      {isLoading && !lastGuessEvaluation ? 'Loading...' : 'Submit Guess'}
                    </span>
                </button>
              </div>
              </form>
              </div>
          </div>
        
          {apiError && isGuessSubmitted && (
            <p className="text-red-400 text-sm mt-2 text-center">{apiError}</p>
          )}
        </div>
        
        {/* Score Display at Bottom */}
        <div className="flex justify-center mt-8">
          <div className="relative group/score w-full max-w-md">
            {/* Multiple glow layers for depth */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 blur-2xl opacity-40 group-hover/score:opacity-60 transition animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 blur-xl opacity-30 transition" />

            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl px-12 py-6 border-2 border-cyan-400/30 shadow-[0_0_40px_rgba(34,211,238,0.3)] hover:shadow-[0_0_60px_rgba(34,211,238,0.5)] transition-all duration-500">
              <div className="text-sm text-cyan-300/80 mb-2 text-center font-medium tracking-wider uppercase">
                Score
              </div>
              <div className="text-6xl font-bold text-center bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
                {scores.player1}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const Scoreboard = () => {
    return (
      <div className="flex justify-center mb-8">
        <div className="relative group/score w-full max-w-md">
          {/* Multiple glow layers for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 blur-2xl opacity-40 group-hover/score:opacity-60 transition animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 blur-xl opacity-30 transition" />

          <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl px-12 py-6 border-2 border-cyan-400/30 shadow-[0_0_40px_rgba(34,211,238,0.3)] hover:shadow-[0_0_60px_rgba(34,211,238,0.5)] transition-all duration-500">
            <div className="text-sm text-cyan-300/80 mb-2 text-center font-medium tracking-wider uppercase">
              Score
          </div>
            <div className="text-6xl font-bold text-center bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
              {scores.player1}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (gameState === GameState.NotStarted) {
    return (
      <div className="relative w-full h-screen overflow-hidden" style={{
        boxShadow: 'inset 0 0 0 2px rgba(0, 191, 255, 0.3), 0 0 20px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(0, 191, 255, 0.2)',
        borderRadius: '8px',
        margin: '8px'
      }}>
        {/* Social Buttons - Top Right */}
        <div className="fixed top-4 right-4 z-50">
          <SocialButtons />
        </div>
        {/* Video Background */}
        <video
          ref={videoRef}
          muted
          loop={false}
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
          onEnded={handleVideoEnd}
        >
          <source src="/Landing page.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Video Mixing Container */}
        <div className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {/* Main.mov Transparent Video Overlay - Try different blend modes */}
          <video
            muted
            loop
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover video-overlay"
            style={{ 
              pointerEvents: 'none'
            }}
            onLoadStart={() => console.log('Main video loading started')}
            onCanPlay={() => console.log('Main video can play')}
            onError={(e) => console.error('Main video error:', e)}
          >
            <source src="/Main.mp4" type="video/mp4" />
            <source src="/Main.mov" type="video/quicktime" />
            <source src="/Main.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
          
          {/* Alternative blend mode overlay */}
          <video
            muted
            loop
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover video-overlay-overlay"
            style={{ 
              pointerEvents: 'none',
              display: 'none' // Hidden by default, can be toggled
            }}
            onLoadStart={() => console.log('Main.mov overlay video loading started')}
            onCanPlay={() => console.log('Main.mov overlay video can play')}
            onError={(e) => console.error('Main.mov overlay video error:', e)}
          >
            <source src="/Main.mov" type="video/quicktime" />
            <source src="/Main.mov" type="video/mp4" />
            <source src="/Main.mov" type="video/x-msvideo" />
            Your browser does not support the video tag.
          </video>
        </div>
        
        {/* Video Overlay for readability - reduced opacity */}
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Main Menu Content - Black Start Button */}
        <div className="relative z-10 flex items-end justify-center min-h-screen pb-20">
          <button 
            onClick={() => handleStartGame(1)} 
            className="bg-black border-2 border-gray-600 text-white font-bold py-3 px-8 text-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 rounded-lg"
            style={{
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            START
              </button>
        </div>
      </div>
    );
  }



  if (gameState === GameState.GameOver) {
    const winner = numPlayers === 1 ? 'Player 1' : (scores.player1 > scores.player2 ? 'Player 1' : (scores.player2 > scores.player1 ? 'Player 2' : 'It\'s a Tie!'));
    const p1FinalScore = scores.player1;
    const p2FinalScore = scores.player2;
    return (
      <div className="relative w-full min-h-screen overflow-hidden flex items-center justify-center" style={{
        boxShadow: 'inset 0 0 0 2px rgba(0, 191, 255, 0.3), 0 0 20px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(0, 191, 255, 0.2)',
        borderRadius: '8px',
        margin: '8px'
      }}>
        {/* Social Buttons - Top Right */}
        <div className="fixed top-4 right-4 z-50">
          <SocialButtons />
        </div>
        <div className="relative group w-full max-w-lg">
          {/* Holographic glow effects */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-2xl opacity-50 group-hover:opacity-75 blur-xl transition duration-500 animate-pulse" />
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 rounded-2xl opacity-30 blur transition duration-500" />
          
          <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 border-2 border-cyan-400/30 shadow-[0_0_50px_rgba(34,211,238,0.3)] hover:shadow-[0_0_80px_rgba(34,211,238,0.5)] transition-all duration-500 text-center">
            <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
              Game Over!
            </h1>
            
            {numPlayers === 2 && winner !== "It's a Tie!" && (
              <p className="text-2xl text-cyan-300 mb-4 font-semibold">{winner} wins!</p>
            )}
            {winner === "It's a Tie!" && (
              <p className="text-2xl text-cyan-300 mb-4 font-semibold">It's a Tie!</p>
            )}
            
            <div className="text-xl text-white mb-4">
              <p className="mb-2">Player 1: {p1FinalScore} points</p>
              {numPlayers === 2 && <p className="mb-2">Player 2: {p2FinalScore} points</p>}
              {numPlayers === 1 && <p className="mb-4">Final Score: {p1FinalScore} points</p>}
            </div>
            
            {/* Prize Claim Section */}
            <div className="mt-6 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border-2 border-green-400/30 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              <h2 className="text-2xl text-green-300 mb-3 font-bold">
                Congrats, {numPlayers === 1 ? 'Player 1' : (scores.player1 > scores.player2 ? 'Player 1' : 'Player 2')} Wins!
              </h2>
              {connected ? (
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg blur opacity-60" />
                  <button
                    onClick={() => console.log('Claim Prize clicked')}
                    className="relative bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-3 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all font-semibold"
                  >
                    Claim Pump.fun Fees Prize!
                  </button>
                </div>
              ) : (
                <p className="text-green-300">Connect wallet to claim prize!</p>
              )}
            </div>
            
            <div className="mt-6 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition animate-pulse" />
              <button
                onClick={handleRestart}
                className="relative w-full h-12 text-lg font-semibold overflow-hidden group/btn rounded-xl border-2 border-green-400/50 shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:shadow-[0_0_50px_rgba(34,197,94,0.6)] transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 transition-transform group-hover/btn:scale-105" />
                <span className="relative z-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                  Play Again?
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  

  return (
    <div className="relative w-full min-h-screen overflow-hidden" style={{
      boxShadow: 'inset 0 0 0 2px rgba(0, 191, 255, 0.3), 0 0 20px rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(0, 191, 255, 0.2)',
      borderRadius: '8px',
      margin: '8px'
    }}>
      {/* Social Buttons - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <SocialButtons />
      </div>
      {/* Question Video Background */}
      {gameState === GameState.Playing && currentRiddleData && (
        <video
          ref={questionVideoRef}
          muted
          loop
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={getQuestionVideo()} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
      
      {/* Fallback Background Image */}
      {(!currentRiddleData || gameState !== GameState.Playing) && (
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `url('${getBackgroundImage()}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}
      
      {/* Main.mov Transparent Video Overlay - Always visible */}
      <video
        muted
        loop
        autoPlay
        className="absolute inset-0 w-full h-full object-cover mix-blend-screen"
        style={{ 
          zIndex: 1,
          pointerEvents: 'none'
        }}
      >
        <source src="/Main.mov" type="video/quicktime" />
        <source src="/Main.mov" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Video Overlay for readability */}
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="relative z-10">
        {renderGameContent()}
      </div>
        
        <Modal
          isOpen={feedbackModalOpen}
          onClose={handleModalCloseAndProceed}
          title={feedbackModalTitle}
        >
          <p>{feedbackModalMessage}</p>
        {isLoading && lastGuessEvaluation !== null && gameState === GameState.Playing && (
            <div className="mt-4 flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2 shadow-[0_0_20px_rgba(34,211,238,0.6)]"></div>
                <p className="text-sm text-cyan-300">Loading next riddle...</p>
            </div>
        )}
        </Modal>
    </div>
  );
};

export default App;


