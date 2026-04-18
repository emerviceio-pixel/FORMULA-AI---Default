// client/src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { useCountdown } from '../../hooks/useCountdown';
import ValidationErrorModal from '../../components/ValidationErrorModal';
import { ghanaianFoodsRestaurants } from '../../hooks/ghanaianFoods';
import SuggestionsDropdown from '../../components/SuggestionsDropdown';

import {
  CheckCircle, AlertTriangle, XCircle,
  X,  RefreshCw, ThumbsUp, ThumbsDown,
  Sparkles, ArrowRight
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────── */
const statusMeta = {
  safe:     { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400', icon: CheckCircle  },
  cautious: { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   dot: 'bg-amber-400',   icon: AlertTriangle },
  unsafe:   { color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',     dot: 'bg-rose-400',    icon: XCircle       },
};
const getMeta = (s) => statusMeta[s?.toLowerCase()] ?? statusMeta.safe;

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { profile, isLoading: authLoading } = useAuth();
  const { showError, showSuccess, showInfo } = useToast();

  // Search & Analysis states
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suggestedCorrection, setSuggestedCorrection] = useState('');
  
  // UI states
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [inputFocused, setInputFocused] = useState(false);
  
  // Feedback states - Clean version
  const [userFeedback, setUserFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  
  // Scan limit states
  const [scanStatus] = useState(null);
  const [localScanStatus, setLocalScanStatus] = useState(null);
  const [resetTimestamp, setResetTimestamp] = useState(null);
  
  // Validation states
  const [validationError, setValidationError] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  
  // Suggestions states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  // Refs
  const suggestionsContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  
  /* ── framer-motion value for sheet drag ── */
  const sheetY = useMotionValue(0);
  const dragStartY = useRef(0);
  const isDraggingSheet = useRef(false);
  const handleRef = useRef(null);

  const displayScanStatus = localScanStatus || scanStatus;

  // Use the countdown hook
  const { formattedTime: countdownTime } = useCountdown(
    resetTimestamp,
    () => {
      refreshScanStatus();
    }
  );

  // Fetch existing feedback when modal opens
  useEffect(() => {
    if (isModalOpen && result?.id) {
      fetchExistingFeedback(result.id);
    }
  }, [isModalOpen, result?.id]);

  const fetchExistingFeedback = async (scanId) => {
    try {
      setIsLoadingFeedback(true);
      const dataponse = await apiFetch(`/feedback/status/${scanId}`);
      
      if (data.success && data.hasFeedback) {
        setUserFeedback(data.feedbackType);
      }
    } catch (error) {
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Fetch initial scan status on component mount
  useEffect(() => {
    const fetchInitialScanStatus = async () => {
      try {
        const data = await apiFetch('/scans/status/me');

          

          if (data.success) {
            setLocalScanStatus(data.scanStatus);
            setResetTimestamp(data.scanStatus.resetTimestamp);
          }
        
      } catch (error) {
      }
    };
    
    fetchInitialScanStatus();
  }, []);

  useEffect(() => {
    // Check if there's a selected scan in sessionStorage (from History page)
    const selectedScan = sessionStorage.getItem('selectedScan');
    if (selectedScan) {
      try {
        const scan = JSON.parse(selectedScan);
        setResult(scan);
        setIsModalOpen(true);
        sessionStorage.removeItem('selectedScan');
      } catch (e) {
      }
    }
  }, []);

  // Effect to check if reset should have happened
  useEffect(() => {
    if (displayScanStatus?.limitReached && resetTimestamp) {
      const timeUntilReset = resetTimestamp - Date.now();
      if (timeUntilReset <= 0) {
        refreshScanStatus();
      }
    }
  }, [resetTimestamp, displayScanStatus?.limitReached]);

  const refreshScanStatus = async () => {
    try {
      const data = await apiFetch('/scans/status/me');      
        
        if (data.success) {
          setLocalScanStatus(data.scanStatus);
          setResetTimestamp(data.scanStatus.resetTimestamp);
          return data.scanStatus;
        }

    } catch (error) {
    }
    return null;
  };

  const handleAnalyzeWithQuery = async (query, e) => {
    e.preventDefault();
    
    if (!query.trim() || authLoading) return;
    
    setIsLoading(true);
    
    try {
      const data = await apiFetch('/analyzer/validate-and-analyze', {
        method: 'POST',
        body: JSON.stringify({ foodName: query }),
      });

      if (!data.success) {
        switch (data.type) {
        case 'INVALID':
          setValidationError({
            message: data.error,
            type: 'INVALID'
          });
          setShowValidationModal(true);
          break;

          case 'MEAL_TYPE_INVALID':
          setValidationError({
            message: data.error || 'Invalid: try Special Keys',
            type: 'MEAL_TYPE_INVALID'
          });
          setShowValidationModal(true);
          break;

        case 'SUGGESTION':
          setValidationError({
            message: data.error,
            suggestion: data.suggestedCorrection,
            type: 'SUGGESTION'
          });
          setShowValidationModal(true);
          break;

        case 'UNCLEAR':
          setValidationError({
            message: data.error || 'Input unclear. Please be more specific.',
            type: 'UNCLEAR'
          });
          setShowValidationModal(true);
          break;
            
        case 'SCAN_LIMIT_REACHED':
          setLocalScanStatus({ 
            scansUsed: data.scansUsed, 
            scanLimit: data.scanLimit, 
            remaining: 0, 
            isPremium: data.isPremium || false, 
            resetIn: data.resetIn,
            resetTimestamp: data.resetTimestamp,
            limitReached: true
          });
          setResetTimestamp(data.resetTimestamp);
          showError(data.error || 'Daily scan limit reached');
          break;
            
        case 'PREMIUM_REQUIRED':
          showError('This feature requires a premium subscription');
          if (window.confirm('Upgrade to Premium to access special keys and restaurant analysis?')) {
            window.location.href = '/settings/subscription';
          }
          break;
            
        default:
          showError(data.error || 'Analysis failed. Please try again.');
        }
        
        if (data.scanStatus) {
          setLocalScanStatus(data.scanStatus);
          setResetTimestamp(data.scanStatus.resetTimestamp);
        }
        
        setIsLoading(false);
        return;
      }

      // Successful analysis
      setResult({ 
        ...data.scan, 
        inputType: data.type 
      });
      setIsModalOpen(true);
      
      if (data.scanStatus) {
        setLocalScanStatus(data.scanStatus);
        setResetTimestamp(data.scanStatus.resetTimestamp);
        
        if (!data.scanStatus.isPremium && 
            data.scanStatus.remaining !== 'Unlimited' && 
            data.scanStatus.remaining <= 3 && 
            data.scanStatus.remaining > 0) {
          showInfo(`${data.scanStatus.remaining} scan${data.scanStatus.remaining > 1 ? 's' : ''} remaining.`);
        }
      }
      
      showSuccess('Analysis complete!');
      setSearchQuery('');
      setSuggestedCorrection('');
      
    } catch (error) {      
      if (error.message === 'Failed to fetch') {
        showError('Network error. Please check your connection.');
      } else if (error.message === 'Server returned non-JSON response') {
        showError('Server error. Please try again later.');
      } else {
        showError('Analysis failed. Please try again.');
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    handleAnalyzeWithQuery(searchQuery, e);
  };

  const handleRegenerate = async () => {
    if (!result?.id) return;
    
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      const limitRes = await apiFetch('/regenerate/limit');
      const limitData = limitRes;
      
      if (limitData.remaining === 0) {
        showError(`Please wait ${limitData.resetIn} seconds.`);
        setIsLoading(false);
        return;
      }
    } catch (error) {
    }
    
    try {
      const data = await apiFetch('/regenerate/recommendation', {
        method: 'POST',
        body: JSON.stringify({ scanId: result.id }),
      });

      

      
      if (data.success) {
        setResult({ ...data.scan, inputType: data.scan.inputType });
        showSuccess('New recommendation generated!');
        
        if (data.remaining <= 2 && data.remaining > 0) {
          showInfo(`${data.remaining} regeneration${data.remaining === 1 ? '' : 's'} remaining this minute.`);
        } else if (data.remaining === 0) {
          showError(`Regeneration limit reached. Please wait ${data.resetIn || 60} seconds.`);
        }
      } else {
        if (data.type === 'RATE_LIMIT_EXCEEDED') {
          showError(`Too many attempts. Please wait ${data.retryAfter} seconds.`);
        } else {
          showError(data.error || 'Regeneration failed');
        }
      }
    } catch (error) {
      showError('Regeneration failed. Please try again.');
    } finally {
      const elapsed = Date.now() - startTime;
      const minLoadingTime = 300;
      
      if (elapsed < minLoadingTime) {
        setTimeout(() => setIsLoading(false), minLoadingTime - elapsed);
      } else {
        setIsLoading(false);
      }
    }
  };

  const handleFeedback = async (feedbackType) => {
    if (userFeedback || isSubmitting) return;
    if (!result?.id) return;
    
    setIsSubmitting(true);
    
    try {
      const data = await apiFetch('/feedback/submit', {
        method: 'POST',
        body: JSON.stringify({ scanId: result.id, feedbackType }),
      });
      
      

      
      if ( data.success) {
        setUserFeedback(feedbackType);
        showSuccess(feedbackType === 'good' ? 'Thanks for your feedback!' : 'Feedback recorded');
      } else {
        if (data.alreadyExists) {
          showError('You have already submitted feedback for this recommendation');
          fetchExistingFeedback(result.id);
        } else {
          showError(data.error || 'Failed to submit feedback');
        }
      }
    } catch { 
      showError('Failed to submit feedback. Please try again.'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  // helper: smart capitalization
  const formatSearchText = (text) => {
    if (!text) return text;

    const lowerCaseWords = new Set([
      "and", "with", "of", "in", "on", "at", "to", "for", "by", "or", "the"
    ]);

    const specialCases = {
      kfc: "KFC",
      iphone: "iPhone",
      mcdonalds: "McDonalds",
      usa: "USA",
    };

    return text
      .toLowerCase()
      .split(" ")
      .map((word, index) => {
        if (!word) return word;

        // special cases override everything
        if (specialCases[word]) return specialCases[word];

        // keep lowercase words unless first word
        if (index !== 0 && lowerCaseWords.has(word)) {
          return word;
        }

        // default: capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  };


  // debounce ref (put this at component level)
  const formatTimeoutRef = useRef(null);


  const handleSearchChange = (e) => {
    const v = e.target.value;

    // 1. Update immediately (natural typing)
    setSearchQuery(v);

    // 2. Clear correction if needed
    if (suggestedCorrection) {
      setSuggestedCorrection('');
    }

    // 3. Suggestions (use raw input for better matching)
    const newSuggestions = getSuggestions(v);
    setSuggestions(newSuggestions);
    setShowSuggestions(v.trim().length > 0 && newSuggestions.length > 0);
    setSelectedSuggestionIndex(-1);

    // 4. Apply smart formatting AFTER user pauses typing
    if (formatTimeoutRef.current) {
      clearTimeout(formatTimeoutRef.current);
    }

    formatTimeoutRef.current = setTimeout(() => {
      setSearchQuery((prev) => formatSearchText(prev));
    }, 500); // adjust delay (400–700ms feels best)
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      const selectedSuggestion = suggestions[selectedSuggestionIndex];
      setSearchQuery(selectedSuggestion);
      setShowSuggestions(false);
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} };
        handleAnalyzeWithQuery(selectedSuggestion, fakeEvent);
      }, 50);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    
    // Focus input and place cursor at the end
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        // Set cursor to the end of the text
        const length = searchInputRef.current.value.length;
        searchInputRef.current.setSelectionRange(length, length);
      }
    }, 10);
  };

  const getSuggestions = useCallback((query) => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase().trim();
    const filtered = ghanaianFoodsRestaurants.filter(item =>
      item.toLowerCase().includes(searchTerm)
    );
    
    return filtered.slice(0, 8);
  }, []);
  
  const closeModal = useCallback(() => {
    animate(sheetY, 0, { duration: 0 });
    setIsModalOpen(false);
    setResult(null);
    setUserFeedback(null);
    setIsSubmitting(false);
  }, [sheetY]);

  const onPointerDown = (e) => {
    if (!isMobile) return;
    e.stopPropagation();
    isDraggingSheet.current = true;
    dragStartY.current = e.clientY;
    handleRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDraggingSheet.current) return;
    const delta = e.clientY - dragStartY.current;
    if (delta > 0) sheetY.set(delta);
  };

  const onPointerUp = () => {
    if (!isDraggingSheet.current) return;
    isDraggingSheet.current = false;
    const cur = sheetY.get();
    if (cur > 140) {
      animate(sheetY, window.innerHeight, { duration: 0.25, ease: 'easeIn' }).then(closeModal);
    } else {
      animate(sheetY, 0, { type: 'spring', stiffness: 420, damping: 38 });
    }
  };
  
  const scanLimitPercent = displayScanStatus
    ? ((displayScanStatus.scansUsed || 0) / (typeof displayScanStatus.scanLimit === 'number' ? displayScanStatus.scanLimit : 1)) * 100
    : 0;
  
  const scanBarColor = !displayScanStatus ? 'bg-indigo-500'
    : displayScanStatus.remaining === 0 || displayScanStatus.remaining === '0' ? 'bg-indigo-500'
    : displayScanStatus.remaining <= 3 ? 'bg-indigo-500'
    : 'bg-indigo-500';
  
  const inputDisabled = isLoading || (displayScanStatus && !displayScanStatus.isPremium && displayScanStatus.remaining === 0);

  const resetDisplay = countdownTime || displayScanStatus?.resetIn;

  if (authLoading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] text-gray-700 tracking-widest uppercase">Loading</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Serif+Display:ital@0;1&display=swap');
        #grain { position:fixed; inset:0; pointer-events:none; z-index:9999; opacity:0.03;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .search-ring { transition: box-shadow .3s ease; }
        .search-ring.on { box-shadow: 0 0 0 1px rgba(99,102,241,.4), 0 4px 60px rgba(99,102,241,.12); }
        .chip { transition: background .15s, color .15s, border-color .15s; }
        .chip:hover:not(:disabled) { background: rgba(99,102,241,.12); color:#a5b4fc; border-color: rgba(99,102,241,.25); }
        .scan-row { transition: background .12s; }
        .scan-row:hover { background: rgba(255,255,255,.025); }
        .scan-row:hover .scan-name { color:#fff; }
        .h-scroll::-webkit-scrollbar { height:3px; }
        .h-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,.05); border-radius:99px; }
        .h-scroll { scrollbar-width:thin; scrollbar-color: rgba(255,255,255,.05) transparent; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.06); border-radius:99px; }
      `}</style>

      <div id="grain" />
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage:'linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)',
        backgroundSize:'48px 48px',
      }} />

      <motion.div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] pointer-events-none"
        animate={{ opacity: inputFocused ? 1 : 0.35 }}
        transition={{ duration: 0.55 }}
        style={{ background:'radial-gradient(ellipse at 50% 0%,rgba(99,102,241,.13) 0%,transparent 70%)' }}
      />

      <div className="relative min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-24 pb-6 sm:pb-8 lg:pb-12">
            
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [.16, 1, .3, 1] }}
            className="mb-6 sm:mb-8 lg:mb-12"
          >
            <h1 className="serif text-2xl sm:text-3xl pt-7 md:text-4xl lg:text-5xl xl:text-6xl leading-tight text-center mb-2">
              <span className="text-gradient-main">
                What are you eating{" "}
              </span>
              <span className="text-gradient-accent italic">
                today?
              </span>
            </h1>
          </motion.div>

            <div className="w-full max-w-3xl mx-auto mb-8 lg:mb-12">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative" ref={suggestionsContainerRef}>
                  <form 
                    onSubmit={(e) => {
                      setShowSuggestions(false);
                      handleAnalyze(e);
                    }}
                  >
                    <div className="relative group">
                      <div className={`absolute -inset-[1px] rounded-xl sm:rounded-2xl transition-opacity duration-500 pointer-events-none ${
                        inputFocused ? 'opacity-100' : 'opacity-0'
                      }`} style={{
                        background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,.12), transparent 70%)'
                      }} />
                      
                      <div className={`relative rounded-xl sm:rounded-2xl bg-[#0c0c0c] border transition-all duration-300 ${
                        inputFocused 
                          ? 'border-indigo-500/30 shadow-[0_0_0_1px_rgba(99,102,241,0.15),0_8px_40px_rgba(0,0,0,0.4)]' 
                          : 'border-white/[0.1] group-hover:border-white/[0.1] shadow-lg'
                      }`}>
                        
                        <AnimatePresence>
                          {isLoading && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-[#0a0a0a]/85 backdrop-blur-sm rounded-xl sm:rounded-2xl z-20 flex items-center justify-center"
                            >
                              <div className="flex items-center gap-3">
                                
                                {/* Calm Thinking Dots */}
                                <div className="flex items-center gap-1.5">
                                  {[0, 1, 2].map((i) => (
                                    <motion.div
                                      key={i}
                                      className="w-1.5 h-1.5 rounded-full bg-indigo-400/70"
                                      animate={{
                                        opacity: [0.3, 1, 0.3],
                                        scale: [0.9, 1.15, 0.9],
                                      }}
                                      transition={{
                                        duration: 1.6,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: i * 0.25,
                                      }}
                                    />
                                  ))}
                                </div>

                                {/* Text */}
                                <motion.span
                                  className="text-xs text-gray-400 tracking-wide font-medium"
                                  animate={{ opacity: [0.6, 1, 0.6] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                >
                                  Analyzing…
                                </motion.span>

                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex items-center gap-1">
                          <motion.div 
                            className="pl-4 sm:pl-5 pointer-events-none"
                            animate={inputFocused ? { scale: 1.05, x: -1 } : { scale: 1, x: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                          >
                            <svg 
                              className={`w-4 h-4 transition-all duration-300 ease-out ${
                                inputFocused 
                                  ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]' 
                                  : searchQuery.trim()
                                    ? 'text-gray-400 group-hover:text-indigo-400/50'
                                    : 'text-gray-600 group-hover:text-gray-400'
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24" 
                              strokeWidth={1.8}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </motion.div>
                          
                          <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            placeholder="Any meal, drink, restaurant, or special keys…"
                            disabled={inputDisabled}
                            autoFocus
                            className="flex-1 bg-transparent px-2 py-3 sm:py-4 text-[15px] text-white placeholder:text-gray-600 focus:outline-none disabled:opacity-40 font-normal tracking-wide"
                          />
                          
                          {/* Enhanced submit button with better transition */}
                          <motion.button
                            type="submit"
                            disabled={inputDisabled || !searchQuery.trim()}
                            whileHover={!inputDisabled && searchQuery.trim() ? { scale: 1.02 } : {}}
                            whileTap={!inputDisabled && searchQuery.trim() ? { scale: 0.98 } : {}}
                            className={`relative m-1.5 sm:m-2 flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
                              !inputDisabled && searchQuery.trim()
                                ? 'bg-indigo-500/40 hover:bg-indigo-500 shadow-sm hover:shadow-indigo-500/15 cursor-pointer'
                                : 'bg-white/5 cursor-not-allowed'
                            }`}
                          >
                            <ArrowRight className={`w-4 h-4 transition-all duration-200 ${
                              !inputDisabled && searchQuery.trim() 
                                ? 'text-white group-hover/btn:translate-x-0.5' 
                                : 'text-gray-600'
                            }`} />
                          </motion.button>
                        </div>

                        {displayScanStatus && (!displayScanStatus.isPremium || displayScanStatus.scanLimit !== 'Unlimited') && (
                          <div className="absolute -bottom-[1px] left-4 sm:left-5 right-4 sm:right-5">
                            <motion.div
                              className={`h-[2px] rounded-full ${scanBarColor}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(scanLimitPercent, 100)}%` }}
                              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </form>

                  <SuggestionsDropdown
                    suggestions={suggestions}
                    showSuggestions={showSuggestions}
                    selectedIndex={selectedSuggestionIndex}
                    onSelect={handleSuggestionSelect}
                    onClose={() => setShowSuggestions(false)}
                    inputRef={searchInputRef}
                  />

                  {suggestedCorrection && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2.5 flex items-center gap-2 px-1"
                    >
                      <span className="text-[11px] text-gray-600 font-medium tracking-wide">Did you mean:</span>
                      <button
                        onClick={() => {
                          const correction = suggestedCorrection;
                          setSearchQuery(correction);
                          setSuggestedCorrection('');
                          setShowSuggestions(false);
                          setTimeout(() => {
                            const fakeEvent = { preventDefault: () => {} };
                            handleAnalyzeWithQuery(correction, fakeEvent);
                          }, 50);
                        }}
                        className="group px-3 py-1 bg-indigo-500/8 hover:bg-indigo-500/12 text-indigo-400 rounded-lg text-[11px] font-medium border border-indigo-500/15 hover:border-indigo-500/25 transition-all duration-200 flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3 h-3 opacity-80 group-hover:opacity-100 transition-opacity" />
                        {suggestedCorrection}
                      </button>
                    </motion.div>
                  )}

                  {displayScanStatus && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="flex items-center justify-between mt-2.5 px-1"
                    >
                      <div className="flex items-center gap-3">
                        {!displayScanStatus.isPremium ? (
                          displayScanStatus.limitReached ? (
                            <span className="text-[11px] text-rose-400/80 font-medium flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-rose-400/60 animate-pulse" />
                              Limit reached · Resets in{' '}
                              <span className={`font-mono ${!resetDisplay?.includes('s') ? 'flash-digits' : ''}`}>
                                {resetDisplay || 'a few hours'}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-600 font-mono">
                              {displayScanStatus.scansUsed || 0}/{displayScanStatus.scanLimit} scans
                              {displayScanStatus.remaining <= 3 && displayScanStatus.remaining > 0 && (
                                <span className="text-amber-500/80 ml-1.5 animate-pulse">· {displayScanStatus.remaining} left</span>
                              )}
                            </span>
                          )
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-indigo-400/70 font-medium tracking-wide">
                              ✦ Premium
                              {displayScanStatus.scanLimit === 'Unlimited' 
                                ? ' · Unlimited' 
                                : ` · ${displayScanStatus.scansUsed}/${displayScanStatus.scanLimit}`}
                            </span>
                            {displayScanStatus.limitReached && (
                              <span className="text-[11px] text-amber-500/70">
                                · Resets in{' '}
                                <span className={`font-mono ${!resetDisplay?.includes('s') ? 'flash-digits' : ''}`}>
                                  {resetDisplay || 'a few hours'}
                                </span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-gray-700 font-mono tracking-wide">⌘⏎</span>
                        <span className="text-[10px] text-gray-700">to analyze</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity:0, y:12 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:.14, duration:.5, ease:[.16,1,.3,1] }}
              className="mb-6 sm:mb-8 w-full"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Special Keys</span>
              </div>
              <div className="relative w-full">
                <div className="flex gap-2 overflow-x-auto pb-2 px-4 sm:px-6 md:justify-center md:overflow-x-visible md:flex-wrap" 
                    style={{ 
                      WebkitOverflowScrolling: 'none',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'auto'
                    }}>
                  {['Breakfast','Lunch','Dinner','Snack','Fruit'].map(item => (
                    <button
                      key={item}
                      onClick={() => setSearchQuery(item)}
                      disabled={inputDisabled}
                      className="chip flex-shrink-0 md:flex-shrink px-3.5 py-1.5 bg-white/[0.04] border border-white/[0.1] rounded-full text-[12px] text-gray-500 disabled:opacity-20 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            <p className="text-center text-[9px] sm:text-[10px] text-gray-800 mt-4 sm:mt-6">
              All analyses are personalized to your health profile
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && result && (() => {
          const meta = getMeta(result.status);
          const StatusIcon = meta.icon;
          return (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                exit={{ opacity:0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={closeModal}
              />

              {isMobile ? (
                <motion.div
                  key="sheet"
                  initial={{ y:'100%' }}
                  animate={{ y:0 }}
                  exit={{ y:'100%' }}
                  transition={{ type:'spring', stiffness:380, damping:36, mass:.8 }}
                  style={{ y: sheetY }}
                  className="fixed bottom-0 left-0 right-0 z-50 flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-gray-900/90 backdrop-blur-xl border-t border-white/[0.1] rounded-t-2xl shadow-[0_-24px_60px_rgba(0,0,0,0.7)] max-h-[88vh] flex flex-col overflow-hidden">
                    <div
                      ref={handleRef}
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onPointerCancel={onPointerUp}
                      className="flex-shrink-0 flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
                      style={{ touchAction:'none' }}
                    >
                      <div className="w-9 h-1 bg-white/10 rounded-full" />
                    </div>
                    <div className="overflow-y-auto flex-1 overscroll-contain px-5 pb-8">
                      <ModalContent
                        result={result}
                        meta={meta}
                        StatusIcon={StatusIcon}
                        isLoading={isLoading}
                        userFeedback={userFeedback}
                        isSubmitting={isSubmitting}
                        isLoadingFeedback={isLoadingFeedback}
                        handleRegenerate={handleRegenerate}
                        handleFeedback={handleFeedback}
                        closeModal={closeModal}
                        isMobile={true}
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="desktop"
                  initial={{ opacity:0, scale:.96, y:8 }}
                  animate={{ opacity:1, scale:1, y:0 }}
                  exit={{ opacity:0, scale:.96, y:8 }}
                  transition={{ duration:.2, ease:[.16,1,.3,1] }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  onClick={closeModal}
                >
                  <div
                    className="bg-[#0f0f0f] border border-white/[0.1] rounded-2xl w-full max-w-lg lg:max-w-2xl xl:max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-6 lg:p-8">
                      <ModalContent
                        result={result}
                        meta={meta}
                        StatusIcon={StatusIcon}
                        isLoading={isLoading}
                        userFeedback={userFeedback}
                        isSubmitting={isSubmitting}
                        isLoadingFeedback={isLoadingFeedback}
                        handleRegenerate={handleRegenerate}
                        handleFeedback={handleFeedback}
                        closeModal={closeModal}
                        isMobile={false}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          );
        })()}
      </AnimatePresence>
      
      <ValidationErrorModal
        isOpen={showValidationModal}
        onClose={() => {
          setShowValidationModal(false);
          setValidationError(null);
        }}
        error={validationError?.message}
        suggestion={validationError?.suggestion}
        onUseSuggestion={() => {
          setSearchQuery(validationError.suggestion);
          setShowValidationModal(false);
          setValidationError(null);
          setTimeout(() => handleAnalyze(new Event('submit')), 100);
        }}
      />
    </div>
  );
};

/* Modal Content Component */
const ModalContent = ({ result, meta, StatusIcon, isLoading, userFeedback, isSubmitting, isLoadingFeedback, handleRegenerate, handleFeedback, closeModal, isMobile }) => {
  const showTriggerTag = result.inputType === 'SPECIAL_KEY' || result.inputType === 'RESTAURANT_NAME';
  
  const getTriggerDisplay = () => {
    if (!result.triggerValue) return '';
    return result.triggerValue.charAt(0).toUpperCase() + result.triggerValue.slice(1);
  };
  
  const triggerDisplay = getTriggerDisplay();

  return (
 <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-start justify-between mb-3 pt-0">
        <div className="flex flex-col pt-2">
          {showTriggerTag && (
            <div className="inline-flex items-center px-3 py-1.5 rounded-full mb-1">
              <span className="text-[11px] font-medium text-blue-400">{triggerDisplay}</span>
            </div>
          )}
          <h2 className="text-2xl lg:text-3xl pt-4 text-white mt-0 mb-0 leading-snug" style={{ fontFamily: "'DM Serif Display', serif" }}>
            {result.foodName}
          </h2>
        </div>
        <div className="flex items-start gap-2">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full  ${meta.color} ${meta.bg} ${meta.border}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {result.status}
          </span>
          {(result.inputType === 'SPECIAL_KEY' || result.inputType === 'RESTAURANT_NAME') && (
            <button
              onClick={handleRegenerate}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-gray-500 text-xs transition-colors disabled:opacity-30"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              {!isMobile && <span>Regenerate</span>}
            </button>
          )}
          {!isMobile && (
            <button onClick={closeModal} className="p-1.5 bg-white/[0.05] hover:bg-white/[0.08] rounded-xl transition-colors">
              <X className="w-3.5 h-3.5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 lg:p-5 mb-3">
        <p className="text-sm lg:text-base text-gray-300 leading-relaxed">{result.reason}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {[['Best time', result.bestTime], ['Portion', result.maxServing]].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3.5 lg:p-4">
            <p className="text-[10px] text-gray-700 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm lg:text-base text-white">{value}</p>
          </div>
        ))}
      </div>

      {result.tips?.length > 0 && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 lg:p-5 mb-3">
          <p className="text-[10px] text-gray-700 uppercase tracking-wider mb-2.5">Tips</p>
          <ul className="space-y-2">
            {result.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm lg:text-base text-gray-300">
                <span className="text-indigo-400 mt-[3px] flex-shrink-0">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.alternatives?.length > 0 && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 lg:p-5 mb-5">
          <p className="text-[10px] text-gray-700 uppercase tracking-wider mb-2.5">Alternatives</p>
          <div className="flex flex-wrap gap-1.5">
            {result.alternatives.map((alt, i) => (
              <span key={i} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[11px] lg:text-xs border border-indigo-500/20">{alt}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-5 pt-4 border-t border-white/[0.05]">
        <p className="text-[11px] lg:text-xs text-gray-700">
          {userFeedback ? (
            userFeedback === 'good' ? '🙌 Thanks for your feedback!' : '🫤 Feedback recorded'
          ) : (
            'Was this helpful?'
          )}
        </p>
        <button
          onClick={() => handleFeedback('good')}
          disabled={!!userFeedback || isSubmitting || isLoadingFeedback}
          className="p-2 rounded-full hover:bg-white/[0.05] transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ThumbsUp 
            className={`w-4 h-4 lg:w-5 lg:h-5 ${
              userFeedback === 'good' ? 'text-emerald-400' : 'text-gray-700'
            }`} 
          />
        </button>
        <button
          onClick={() => handleFeedback('bad')}
          disabled={!!userFeedback || isSubmitting || isLoadingFeedback}
          className="p-2 rounded-full hover:bg-white/[0.05] transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ThumbsDown 
            className={`w-4 h-4 lg:w-5 lg:h-5 ${
              userFeedback === 'bad' ? 'text-rose-400' : 'text-gray-700'
            }`} 
          />
        </button>
      </div>

      {isMobile && (
        <button
          onClick={closeModal}
          className="w-full mt-5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] text-gray-600 text-sm transition-colors border border-white/[0.05]"
        >
          Close
        </button>
      )}
    </div>
  );
};

export default Dashboard;