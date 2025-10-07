
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="relative group w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modal-appear">
        {/* Holographic glow effects */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-2xl opacity-50 group-hover:opacity-75 blur-xl transition duration-500 animate-pulse" />
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 rounded-2xl opacity-30 blur transition duration-500" />
        
        <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 border-2 border-cyan-400/30 shadow-[0_0_50px_rgba(34,211,238,0.3)] hover:shadow-[0_0_80px_rgba(34,211,238,0.5)] transition-all duration-500">
          {title && (
            <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
              {title}
            </h2>
          )}
          <div className="text-white mb-8 text-center leading-relaxed">{children}</div>
          
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition animate-pulse" />
            <button
              onClick={onClose}
              className="relative w-full h-12 text-lg font-semibold overflow-hidden group/btn rounded-xl border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-transform group-hover/btn:scale-105" />
              <span className="relative z-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                Close
              </span>
            </button>
          </div>
        </div>
      </div>
      {/* Tailwind JIT might not pick up dynamic animation names. Using a global style for simplicity here. */}
      <style>{`
        @keyframes modal-appear-animation {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modal-appear {
          animation: modal-appear-animation 0.3s forwards;
        }
      `}</style>
    </div>
  );
};

export default Modal;
    