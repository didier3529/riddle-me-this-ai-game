import React, { useState } from 'react';

const App: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="bg-slate-800 p-8 rounded-xl shadow-2xl text-center max-w-md mx-auto ring-1 ring-slate-700">
      <h1 className="text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
        Debug Test
      </h1>
      <p className="text-slate-300 mb-8 text-lg">
        If you can see this, React is working!
      </p>
      <p className="text-slate-300 mb-4">
        Count: {count}
      </p>
      <button 
        onClick={() => setCount(count + 1)}
        className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105"
      >
        Test Button (Click me!)
      </button>
    </div>
  );
};

export default App;
