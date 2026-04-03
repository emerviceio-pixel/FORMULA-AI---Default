import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Sparkles } from 'lucide-react';

const ValidationErrorModal = ({ isOpen, onClose, error, suggestion, onUseSuggestion, type }) => {
  if (!isOpen) return null;

  // Special handling for MEAL_TYPE_INVALID - show clean, simple modal
  const isMealTypeInvalid = type === 'MEAL_TYPE_INVALID';
  const displayError = isMealTypeInvalid ? 'Invalid: try Special Keys' : error;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-[#0f0f0f] border border-white/[0.07] rounded-2xl max-w-sm w-full p-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Simple header for MEAL_TYPE_INVALID */}
          {isMealTypeInvalid ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <h3 className="text-white text-sm font-medium">Notice</h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/[0.05] rounded-lg transition-colors">
                  <X className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>
              
              <p className="text-gray-300 text-sm text-center py-2">
                {displayError}
              </p>
              
              <button
                onClick={onClose}
                className="w-full mt-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] text-gray-400 rounded-lg text-xs transition-colors"
              >
                Close
              </button>
            </>
          ) : (
            /* Full modal for other error types (INVALID, SUGGESTION, UNCLEAR) */
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  </div>
                  <h3 className="text-white font-medium">Invalid Input</h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/[0.05] rounded-lg transition-colors">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <p className="text-gray-300 text-sm mb-6">{displayError}</p>

              {suggestion && (
                <div className="flex items-center gap-3 p-3 bg-indigo-500/5 rounded-xl mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-sm text-gray-400">Did you mean:</span>
                  <button
                    onClick={onUseSuggestion}
                    className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-sm hover:bg-indigo-500/20 transition-colors"
                  >
                    {suggestion}
                  </button>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-gray-300 rounded-xl text-sm transition-colors"
              >
                Try Again
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ValidationErrorModal;