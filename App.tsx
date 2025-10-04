
import React, { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import LoadingSpinner from './components/LoadingSpinner';
import Modal from './components/Modal';
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
    if (gameState === GameState.Playing && !currentRiddleData && totalRiddlesPlayedInGame === 0 && !isLoading) {
      loadNewRiddle();
    }
  }, [gameState, totalRiddlesPlayedInGame, isLoading, currentRiddleData, loadNewRiddle]);

  const handleStartGame = (players: 1 | 2) => {
    setNumPlayers(players);
    setScores({ player1: 0, player2: 0 });
    setCurrentPlayer(1);
    setActivePlayerForAnswer(null);
    setTotalRiddlesPlayedInGame(0);
    setCurrentRiddleData(null); 
    setGameState(GameState.Playing);
    loadNewRiddle(); 
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
    resetRiddleState();
    // Create a new game session ID to track a new set of 5 riddles
    setGameSession(Date.now().toString());
  };

  const renderGameContent = () => {
    if (isLoading && !currentRiddleData && gameState === GameState.Playing && !feedbackModalOpen) {
      return <div className="flex flex-col items-center justify-center h-64"><LoadingSpinner size="w-16 h-16" /><p className="mt-4 text-lg text-sky-300">Summoning a new riddle...</p></div>;
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
    if (!currentRiddleData) return <div className="flex flex-col items-center justify-center h-64"><LoadingSpinner size="w-16 h-16" /><p className="mt-4 text-lg text-sky-300">Preparing the game...</p></div>;

    const cluesDisabled = isGuessSubmitted || activePlayerForAnswer !== null || isLoading;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-sky-400 mb-2">Riddle Time!</h2>
          <p className="text-xl text-slate-300 leading-relaxed whitespace-pre-wrap">{currentRiddleData.riddle}</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-amber-400 mb-3">Clues (Reveal wisely! Each costs {POINTS_PER_CLUE} points):</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentRiddleData.clues.map((clue, index) => (
              <button
                key={index}
                onClick={() => handleRevealClue(index)}
                disabled={revealedClues[index] || cluesDisabled}
                className={`p-3 rounded-md text-left transition-all duration-200 ease-in-out transform hover:scale-105
                  ${revealedClues[index] 
                    ? 'bg-slate-700 cursor-default' 
                    : 'bg-indigo-600 hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50'}
                  ${cluesDisabled ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              >
                {revealedClues[index] ? (
                  <>
                    <span className="font-semibold text-sky-300 block mb-1">Clue {index + 1}:</span>
                    <span className="text-slate-300">{clue}</span>
                  </>
                ) : (
                  <span className="font-semibold text-slate-100">Reveal Clue {index + 1}</span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Player Interaction Area */}
        {numPlayers === 1 && !isGuessSubmitted && (
          <div className="mt-6">
            <label htmlFor="userGuess" className="block text-lg font-medium text-slate-300 mb-1">Your Answer:</label>
            <input
              type="text"
              id="userGuess"
              value={userGuess}
              onChange={(e) => setUserGuess(e.target.value)}
              placeholder="Type your guess here..."
              disabled={isLoading}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400 disabled:opacity-60"
            />
            <button
              onClick={handleSubmitGuess}
              disabled={!userGuess.trim() || isLoading}
              className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading && !lastGuessEvaluation ? <LoadingSpinner size="w-5 h-5 mr-2" /> : null}
              Submit Guess
            </button>
          </div>
        )}

        {numPlayers === 2 && (
          <div className="mt-8">
            {activePlayerForAnswer === null && !isGuessSubmitted && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleHitMe(1)}
                  disabled={isLoading}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  Player 1: Hit Me!
                </button>
                <button
                  onClick={() => handleHitMe(2)}
                  disabled={isLoading}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  Player 2: Hit Me!
                </button>
              </div>
            )}

            {activePlayerForAnswer !== null && !isGuessSubmitted && (
              <div className="mt-6 text-center">
                <p className={`text-2xl font-semibold mb-4 ${activePlayerForAnswer === 1 ? 'text-rose-400' : 'text-teal-400'}`}>
                  Player {activePlayerForAnswer} is answering!
                </p>
                <label htmlFor="userGuess" className="sr-only">Player {activePlayerForAnswer}'s Answer:</label>
                <input
                  type="text"
                  id="userGuess"
                  value={userGuess}
                  onChange={(e) => setUserGuess(e.target.value)}
                  placeholder={`Player ${activePlayerForAnswer}, type your guess...`}
                  disabled={isLoading}
                  className="w-full max-w-lg mx-auto p-3 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400 disabled:opacity-60"
                />
                <button
                  onClick={handleSubmitGuess}
                  disabled={!userGuess.trim() || isLoading}
                  className="w-full max-w-lg mx-auto mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading && !lastGuessEvaluation ? <LoadingSpinner size="w-5 h-5 mr-2" /> : null}
                  Submit Guess
                </button>
              </div>
            )}
             {activePlayerForAnswer === null && numPlayers === 2 && isGuessSubmitted && (
                <p className="text-center text-slate-400 mt-4">Waiting for next riddle...</p>
            )}
          </div>
        )}
        
        {apiError && isGuessSubmitted && (
           <p className="text-red-400 text-sm mt-2 text-center">{apiError}</p>
        )}
      </div>
    );
  };
  
  const Scoreboard = () => {
    let p1Pulse = false;
    let p2Pulse = false;

    if (gameState === GameState.Playing) {
      if (numPlayers === 1) {
        p1Pulse = true;
      } else { // numPlayers === 2
        if (activePlayerForAnswer === 1) p1Pulse = true;
        else if (activePlayerForAnswer === 2) p2Pulse = true;
        else if (currentPlayer === 1) p1Pulse = true; // Default to currentPlayer if no one actively answering
        else p2Pulse = true;
      }
    }

    return (
      <div className="bg-slate-900/70 backdrop-blur-sm p-4 rounded-lg shadow-md mb-6 ring-1 ring-slate-700">
        <h3 className="text-xl font-semibold text-center text-sky-400 mb-3">
          Riddle {Math.min(totalRiddlesPlayedInGame + 1, TOTAL_RIDDLES)} of {TOTAL_RIDDLES}
          {isDemoMode && <span className="ml-2 text-xs bg-yellow-500 text-yellow-900 px-2 py-1 rounded">DEMO MODE</span>}
        </h3>
        <div className={`grid ${numPlayers === 2 ? 'grid-cols-2 gap-4' : 'grid-cols-1'} text-center`}>
          <div>
            <p className={`text-lg font-medium ${p1Pulse ? 'text-amber-400 animate-pulse' : 'text-slate-300'}`}>
              Player 1 Score
            </p>
            <p className="text-3xl font-bold text-green-400">{scores.player1}</p>
          </div>
          {numPlayers === 2 && (
            <div>
              <p className={`text-lg font-medium ${p2Pulse ? 'text-amber-400 animate-pulse' : 'text-slate-300'}`}>
                Player 2 Score
              </p>
              <p className="text-3xl font-bold text-green-400">{scores.player2}</p>
            </div>
          )}
        </div>
        {gameState === GameState.Playing && currentRiddleData && (
           <p className="text-center mt-3 text-md text-slate-400">
              Current Riddle Value: <span className="font-bold text-yellow-400">{currentRiddlePotentialPoints} pts</span>
          </p>
        )}
      </div>
    );
  };

  if (gameState === GameState.NotStarted) {
    return (
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl text-center max-w-md mx-auto ring-1 ring-slate-700">
        <h1 className="text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">Riddle Me This!</h1>
        <p className="text-slate-300 mb-8 text-lg">Test your wits against AI-generated riddles. Play solo or challenge a friend!</p>
        
        {/* Simple Wallet Connection */}
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-pink-500 hover:!from-purple-600 hover:!to-pink-600 !border-0 !rounded-lg !font-semibold !text-white" />
          </div>
          {connecting && <p className="text-sm text-yellow-400 mb-4">🔄 Connecting...</p>}
          {connected && publicKey && (
            <p className="text-sm text-green-400 mb-4">
              ✅ Connected: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <button onClick={() => handleStartGame(1)} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-50">
            1 Player (Turn-based)
          </button>
          <button onClick={() => handleStartGame(2)} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50">
            2 Players (Simultaneous)
          </button>
          
          {/* Simple Wallet Success Message */}
          {connected && (
            <div className="mt-4 p-4 bg-green-900/30 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm font-semibold">✅ Wallet Connected Successfully!</p>
              <p className="text-slate-300 text-xs mt-1">
                Your wallet is ready. You can now play the game!
              </p>
            </div>
          )}
        </div>
        
        <p className="mt-6 text-sm text-green-500">✅ Ready to play!</p>
      </div>
    );
  }



  if (gameState === GameState.GameOver) {
    const winner = numPlayers === 1 ? 'Player 1' : (scores.player1 > scores.player2 ? 'Player 1' : (scores.player2 > scores.player1 ? 'Player 2' : 'It\'s a Tie!'));
    const p1FinalScore = scores.player1;
    const p2FinalScore = scores.player2;
    return (
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl text-center max-w-lg mx-auto ring-1 ring-slate-700">
        <h1 className="text-4xl font-bold mb-6 text-sky-400">Game Over!</h1>
        {numPlayers === 2 && winner !== "It's a Tie!" && <p className="text-2xl text-amber-400 mb-2">{winner} wins!</p>}
        {winner === "It's a Tie!" && <p className="text-2xl text-amber-400 mb-2">It's a Tie!</p>}
         <p className="text-xl text-slate-300 mb-1">Player 1: {p1FinalScore} points</p>
        {numPlayers === 2 && <p className="text-xl text-slate-300 mb-4">Player 2: {p2FinalScore} points</p>}
        {numPlayers === 1 && <p className="text-xl text-slate-300 mb-4">Final Score: {p1FinalScore} points</p>}
        <button
          onClick={handleRestart}
          className="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
        >
          Play Again?
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-800/80 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-2xl w-full ring-1 ring-slate-700">
      {/* Wallet Status Bar */}
      <div className="flex justify-between items-center mb-4 p-3 bg-slate-700/50 rounded-lg">
        <div className="flex items-center space-x-3">
          {connected && publicKey ? (
            <>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-300">
                Wallet: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
              </span>
            </>
          ) : (
            <>
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-sm text-slate-400">Wallet not connected</span>
            </>
          )}
        </div>
        <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-pink-500 hover:!from-purple-600 hover:!to-pink-600 !border-0 !rounded-md !font-semibold !text-white !text-sm !py-2 !px-4" />
      </div>

      <Scoreboard />
      {renderGameContent()}
      <Modal
        isOpen={feedbackModalOpen}
        onClose={handleModalCloseAndProceed}
        title={feedbackModalTitle}
      >
        <p>{feedbackModalMessage}</p>
        {isLoading && lastGuessEvaluation !== null && gameState === GameState.Playing && (
            <div className="mt-4 flex flex-col items-center">
                <LoadingSpinner size="w-8 h-8" /> 
                <p className="text-sm text-slate-400 mt-2">Loading next riddle...</p>
            </div>
        )}
      </Modal>
    </div>
  );
};

export default App;


