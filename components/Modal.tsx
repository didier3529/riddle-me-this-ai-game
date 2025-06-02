
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modal-appear">
        {title && <h2 className="text-2xl font-bold mb-4 text-sky-400">{title}</h2>}
        <div className="text-slate-300 mb-6">{children}</div>
        <button
          onClick={onClose}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-50"
        >
          Close
        </button>
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
    