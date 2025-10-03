import React, { useState } from 'react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'NotStarted' | 'Playing' | 'GameOver'>('NotStarted');
  const [numPlayers, setNumPlayers] = useState<1 | 2>(1);

  const handleStartGame = (players: 1 | 2) => {
    setNumPlayers(players);
    setGameState('Playing');
  };

  if (gameState === 'NotStarted') {
    return (
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl text-center max-w-md mx-auto ring-1 ring-slate-700">
        <h1 className="text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">Riddle Me This!</h1>
        <p className="text-slate-300 mb-8 text-lg">Test your wits against AI-generated riddles. Play solo or challenge a friend!</p>
        <div className="space-y-4">
          <button onClick={() => handleStartGame(1)} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-50">
            1 Player (Turn-based)
          </button>
          <button onClick={() => handleStartGame(2)} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50">
            2 Players (Simultaneous)
          </button>
        </div>
        <p className="mt-6 text-sm text-yellow-500">Debug: API_KEY = {String(process.env.API_KEY)}</p>
      </div>
    );
  }

  if (gameState === 'GameOver') {
    return (
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl text-center max-w-lg mx-auto ring-1 ring-slate-700">
        <h1 className="text-4xl font-bold mb-6 text-sky-400">Game Over!</h1>
        <p className="text-xl text-slate-300 mb-4">Final Score: 0 points</p>
        <button
          onClick={() => setGameState('NotStarted')}
          className="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
        >
          Play Again?
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-2xl w-full ring-1 ring-slate-700">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-sky-400 mb-2">Game Started!</h2>
        <p className="text-xl text-slate-300">Playing with {numPlayers} player(s)</p>
        <button
          onClick={() => setGameState('GameOver')}
          className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md"
        >
          End Game (Test)
        </button>
      </div>
    </div>
  );
};

export default App;
