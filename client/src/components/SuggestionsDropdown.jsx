// client/src/components/SuggestionsDropdown.jsx
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Search, Sparkles } from 'lucide-react';

const SuggestionsDropdown = ({
  suggestions,
  showSuggestions,
  selectedIndex,
  onSelect,
  onClose,
  inputRef
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && 
          !dropdownRef.current.contains(event.target) &&
          inputRef?.current &&
          !inputRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, inputRef]);

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {showSuggestions && suggestions.length > 0 && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute z-50 w-full mt-2 bg-[#0a0a0a] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm"
          style={{
            background: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <div className="max-h-64 overflow-y-auto py-2">
            {/* Header with count */}
            <div className="px-4 py-2 border-b border-white/[0.05]">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                {suggestions.length} suggestions
              </span>
            </div>
            
            {/* Suggestions list */}
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                onClick={() => onSelect(suggestion)}
                className={`w-full px-4 py-2.5 flex items-center gap-3 transition-all duration-150 ${
                  selectedIndex === index
                    ? 'bg-indigo-500/10 border-l-2 border-indigo-500'
                    : 'hover:bg-white/[0.03] border-l-2 border-transparent'
                }`}
              >
                <div className="flex-shrink-0">
                  {selectedIndex === index ? (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <Utensils className="w-3.5 h-3.5 text-gray-600" />
                  )}
                </div>
                <span className={`text-sm flex-1 text-left ${
                  selectedIndex === index ? 'text-indigo-300' : 'text-gray-400'
                }`}>
                  {suggestion}
                </span>
                <Search className="w-3 h-3 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
            
            {/* Footer tip */}
            <div className="px-4 py-2 border-t border-white/[0.05] mt-1">
              <div className="flex items-center justify-between text-[9px] text-gray-700">
                <span>↑ ↓ to navigate</span>
                <span>↵ to select</span>
                <span>ESC to close</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuggestionsDropdown;