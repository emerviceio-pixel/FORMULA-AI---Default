import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Eye, EyeOff, Shield, ChevronLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const PinSetup = () => {
  const navigate = useNavigate();
  const { setupPin, isLoading } = useAuth();
  
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [recoveryWord, setRecoveryWord] = useState('');
  const [showRecoveryWord, setShowRecoveryWord] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  
  // Live validation states
  const [pinMismatch, setPinMismatch] = useState(false);
  const [isPinComplete, setIsPinComplete] = useState(false);
  const [isConfirmComplete, setIsConfirmComplete] = useState(false);
  
  // Status display states
  const [statusDisplay, setStatusDisplay] = useState(null); // 'success' or 'failed'
  const [statusMessage, setStatusMessage] = useState('');
  
  const pinInputRefs = useRef([]);
  const confirmPinInputRefs = useRef([]);
  const recoveryWordInputRef = useRef(null);

  // Auto-hide status after 2 seconds
  useEffect(() => {
    if (statusDisplay) {
      const timer = setTimeout(() => {
        setStatusDisplay(null);
        setStatusMessage('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [statusDisplay]);

  // Live validation for PIN mismatch
  useEffect(() => {
    const pinComplete = pin.every(digit => digit !== '');
    const confirmComplete = confirmPin.every(digit => digit !== '');
    
    setIsPinComplete(pinComplete);
    setIsConfirmComplete(confirmComplete);
    
    if (pinComplete && confirmComplete) {
      setPinMismatch(pin.join('') !== confirmPin.join(''));
    } else {
      setPinMismatch(false);
    }
  }, [pin, confirmPin]);

  // Function to toggle PIN visibility (shows all digits, not just last)
  const togglePinVisibility = (type) => {
    if (type === 'recovery') {
      setShowRecoveryWord(!showRecoveryWord);
    }
  };

  const handlePinChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    
    if (value && index < 3) {
      pinInputRefs.current[index + 1]?.focus();
    }
    
    if (index === 3 && value && !pin.includes('')) {
      confirmPinInputRefs.current[0]?.focus();
    }
  };

  const handleConfirmPinChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    
    const newConfirmPin = [...confirmPin];
    newConfirmPin[index] = value;
    setConfirmPin(newConfirmPin);
    
    if (value && index < 3) {
      confirmPinInputRefs.current[index + 1]?.focus();
    }
    
    if (index === 3 && value && !confirmPin.includes('')) {
      recoveryWordInputRef.current?.focus();
    }
  };

  const handleKeyDown = (e, index, type) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      if (type === 'pin') {
        const newPin = [...pin];
        if (newPin[index]) {
          newPin[index] = '';
          setPin(newPin);
        } else if (index > 0) {
          pinInputRefs.current[index - 1]?.focus();
        }
      } else {
        const newConfirmPin = [...confirmPin];
        if (newConfirmPin[index]) {
          newConfirmPin[index] = '';
          setConfirmPin(newConfirmPin);
        } else if (index > 0) {
          confirmPinInputRefs.current[index - 1]?.focus();
        }
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      if (type === 'pin') {
        pinInputRefs.current[index - 1]?.focus();
      } else {
        confirmPinInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowRight' && index < 3) {
      e.preventDefault();
      if (type === 'pin') {
        pinInputRefs.current[index + 1]?.focus();
      } else {
        confirmPinInputRefs.current[index + 1]?.focus();
      }
    } else if (!/^\d$/.test(e.key) && !e.metaKey && !e.ctrlKey && e.key !== 'Tab') {
      e.preventDefault();
    }
  };

  const validateForm = () => {
    if (pin.some(digit => !digit)) {
      setStatusDisplay('failed');
      setStatusMessage('Please enter a 4-digit PIN');
      pinInputRefs.current[pin.findIndex(digit => !digit)]?.focus();
      return false;
    }

    if (pin.join('') !== confirmPin.join('')) {
      setStatusDisplay('failed');
      setStatusMessage('PINs do not match');
      confirmPinInputRefs.current[0]?.focus();
      setConfirmPin(['', '', '', '']);
      return false;
    }

    if (recoveryWord.trim().length < 3) {
      setStatusDisplay('failed');
      setStatusMessage('Recovery word must be at least 3 characters');
      recoveryWordInputRef.current?.focus();
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await setupPin(pin.join(''), recoveryWord.trim());
      setStatusDisplay('success');
      setStatusMessage('PIN setup successful!');
      
      setTimeout(() => {
        navigate('/profile-setup');
      }, 1500);
    } catch (error) {
      setStatusDisplay('failed');
      setStatusMessage(error.message || 'Failed to setup PIN');
    }
  };

  const renderPinInputs = (type, values, refs, onChange, onKeyDown, isConfirmField = false) => {
    return (
      <div className="flex justify-center gap-3">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <input
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="password"
              maxLength="1"
              value={values[index]}
              onChange={(e) => onChange(index, e.target.value)}
              onKeyDown={(e) => onKeyDown(e, index)}
              onFocus={() => setFocusedField(`${type}-${index}`)}
              onBlur={() => setFocusedField(null)}
              className={`w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl sm:text-3xl font-light bg-gray-900/50 border-2 rounded-xl focus:outline-none transition-all text-white ${
                values[index]
                  ? 'border-primary-500/30 bg-primary-500/5'
                  : focusedField === `${type}-${index}`
                    ? 'border-primary-500/30 bg-gray-900/80'
                    : 'border-gray-800 bg-gray-900/30 hover:border-gray-700'
              } ${
                isConfirmField && pinMismatch && values[index] && values.join('').length === 4
                  ? 'border-red-500/50 bg-red-500/5'
                  : ''
              }`}
              inputMode="numeric"
              autoComplete="off"
              autoFocus={type === 'pin' && index === 0}
            />
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, gray 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        onClick={() => navigate('/onboarding')}
        className="fixed top-6 left-4 sm:left-8 flex items-center gap-2 px-4 py-2 bg-gray-900/50 hover:bg-gray-800/50 rounded-lg transition-colors text-sm text-gray-400 hover:text-gray-300"
      >
        <ChevronLeft className="w-4 h-4" />
      </motion.button>

      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-light text-white mb-2 tracking-tight pt-16">
              Secure Your Account
            </h1>
            
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Setup a 4-digit PIN and recovery word for account security
            </p>
          </div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900/30 rounded-xl p-6 sm:p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* PIN Setup */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Create 4-digit PIN
                  </label>
                </div>
                
                {renderPinInputs(
                  'pin',
                  pin,
                  pinInputRefs,
                  handlePinChange,
                  (e, index) => handleKeyDown(e, index, 'pin'),
                  false
                )}
                
                <p className="text-xs text-center text-gray-600">
                  Enter your PIN digit by digit
                </p>
              </div>

              {/* Confirm PIN */}
              <div className="space-y-4">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Confirm 4-digit PIN
                </label>
                
                {renderPinInputs(
                  'confirm',
                  confirmPin,
                  confirmPinInputRefs,
                  handleConfirmPinChange,
                  (e, index) => handleKeyDown(e, index, 'confirm'),
                  true
                )}
                
                {/* Live PIN mismatch message */}
                <AnimatePresence>
                  {pinMismatch && isPinComplete && isConfirmComplete && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center justify-center gap-2 text-red-400 text-xs"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>PINs do not match</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Recovery Word */}
              <div className="space-y-3">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recovery Word
                  <span className="text-gray-600 ml-2 font-normal lowercase">
                    (for PIN reset)
                  </span>
                </label>
                
                <div className="relative">
                  <input
                    ref={recoveryWordInputRef}
                    type={showRecoveryWord ? "text" : "password"}
                    value={recoveryWord}
                    onChange={(e) => setRecoveryWord(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmit(e);
                    }}
                    onFocus={() => setFocusedField('recovery')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full px-4 py-3 bg-gray-900/50 border rounded-lg focus:outline-none text-white text-sm pr-12 transition-colors ${
                      focusedField === 'recovery'
                        ? 'border-primary-500/30 bg-gray-900/80'
                        : 'border-gray-800 hover:border-gray-700'
                    }`}
                    placeholder="Enter a memorable word"
                    minLength={3}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => togglePinVisibility('recovery')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                  >
                    {showRecoveryWord ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                <p className="text-xs text-gray-600">
                  Choose a word you'll remember but others won't guess
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg transition-colors border border-primary-500/20 text-sm font-medium disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                    Setting up...
                  </span>
                ) : (
                  'Continue to Profile Setup'
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && !statusDisplay && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl p-6 pointer-events-auto">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-400 rounded-full animate-spin" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Setting up PIN</div>
                    <div className="text-xs text-gray-500 mt-0.5">Please wait...</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Status Display Overlay - Success/Failed */}
      <AnimatePresence>
        {statusDisplay && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className={`bg-gray-900 rounded-xl border shadow-2xl p-6 pointer-events-auto max-w-sm w-full mx-4 ${
                statusDisplay === 'success' ? 'border-green-500/50' : 'border-red-500/50'
              }`}>
                <div className="flex flex-col items-center gap-4 text-center">
                  {/* Status Icon */}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    statusDisplay === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {statusDisplay === 'success' ? (
                      <CheckCircle className="w-7 h-7 text-green-400" />
                    ) : (
                      <XCircle className="w-7 h-7 text-red-400" />
                    )}
                  </div>
                  
                  {/* Status Text */}
                  <div>
                    <div className={`text-xl font-semibold ${
                      statusDisplay === 'success' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {statusDisplay === 'success' ? 'Success' : 'Failed'}
                    </div>
                    <div className="text-sm text-gray-400 mt-2">
                      {statusMessage}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PinSetup;