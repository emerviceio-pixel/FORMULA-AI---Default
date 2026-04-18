import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Lock, 
  Key, 
  Shield,
  AlertCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Recovery Word Input Component
const RecoveryWordInput = ({ value, onChange }) => {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      }}
      className={`w-full px-4 py-3 bg-gray-900/50 border rounded-lg focus:outline-none text-white text-sm transition-colors ${
        isFocused
          ? 'border-primary-500/30 bg-gray-900/80'
          : 'border-gray-800 hover:border-gray-700'
      }`}
      placeholder="Enter your recovery word"
      autoComplete="off"
    />
  );
};

const PinVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyPin, resetPin, getPinAttemptStatus, isLoading } = useAuth();
  
  const [pin, setPin] = useState(['', '', '', '']);
  const [focusedPinIndex, setFocusedPinIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [showResetForm, setShowResetForm] = useState(false);
  const [pinMismatch, setPinMismatch] = useState(false);
  const [resetData, setResetData] = useState({
    recoveryWord: '',
    newPin: ['', '', '', ''],
    confirmPin: ['', '', '', '']
  });
  const [focusedResetIndex, setFocusedResetIndex] = useState(0);
  const [focusedConfirmIndex, setFocusedConfirmIndex] = useState(0);
  
  // Single modal state - handles both loading and result
  const [modalState, setModalState] = useState(null); // 'loading', 'success', 'failed'
  const [modalMessage, setModalMessage] = useState('');
  
  const inputRefs = useRef([]);
  const resetInputRefs = useRef([]);
  const confirmInputRefs = useRef([]);

  const isNewSession = location.state?.isNewSession || true;

  // Auto-hide modal after 2 seconds on success/failed
  useEffect(() => {
    if (modalState === 'success' || modalState === 'failed') {
      const timer = setTimeout(() => {
        setModalState(null);
        setModalMessage('');
        
        // Navigate on success
        if (modalState === 'success') {
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [modalState, navigate, location.state?.from?.pathname]);

  // Handle PIN input
  const handlePinChange = (index, value) => {
    if (lockoutTime > 0) return;
    if (!/^\d?$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    
    if (value && index < 3) {
      setFocusedPinIndex(index + 1);
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const handlePinKeyDown = (e, index) => {
    if (lockoutTime > 0) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      return;
    }
    
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        setFocusedPinIndex(index - 1);
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 10);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setFocusedPinIndex(index - 1);
      setTimeout(() => {
        inputRefs.current[index - 1]?.focus();
      }, 10);
    } else if (e.key === 'ArrowRight' && index < 3) {
      setFocusedPinIndex(index + 1);
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  // Handle reset PIN input
  const handleResetPinChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    
    const newPin = [...resetData.newPin];
    newPin[index] = value;
    setResetData(prev => ({ ...prev, newPin }));
    
    // Reset mismatch when user changes new PIN
    setPinMismatch(false);
    
    if (value && index < 3) {
      setFocusedResetIndex(index + 1);
      setTimeout(() => {
        resetInputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const handleResetPinKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      return;
    }
    
    if (e.key === 'Backspace') {
      if (!resetData.newPin[index] && index > 0) {
        setFocusedResetIndex(index - 1);
        setTimeout(() => {
          resetInputRefs.current[index - 1]?.focus();
        }, 10);
      }
    }
  };

  const handleConfirmPinChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    
    const newPin = [...resetData.confirmPin];
    newPin[index] = value;
    setResetData(prev => ({ ...prev, confirmPin: newPin }));
    
    // Live mismatch check
    const newPinValue = resetData.newPin.join('');
    const confirmPinValue = newPin.join('');
    setPinMismatch(newPinValue !== confirmPinValue && newPinValue.length === 4 && newPin.join('').length === 4);
    
    if (value && index < 3) {
      setFocusedConfirmIndex(index + 1);
      setTimeout(() => {
        confirmInputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const handleConfirmPinKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      return;
    }
    
    if (e.key === 'Backspace') {
      if (!resetData.confirmPin[index] && index > 0) {
        setFocusedConfirmIndex(index - 1);
        setTimeout(() => {
          confirmInputRefs.current[index - 1]?.focus();
        }, 10);
      }
    }
  };

  const handleRecoveryWordChange = (value) => {
    setResetData(prev => ({ ...prev, recoveryWord: value }));
  };

  const isResetFormValid = () => {
    const hasRecoveryWord = resetData.recoveryWord?.trim().length > 0;
    const isNewPinComplete = resetData.newPin.every(digit => digit !== '');
    const isConfirmPinComplete = resetData.confirmPin.every(digit => digit !== '');
    const doPinsMatch = resetData.newPin.join('') === resetData.confirmPin.join('');
    
    return hasRecoveryWord && isNewPinComplete && isConfirmPinComplete && doPinsMatch;
  };

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.every(digit => digit !== '') && !showResetForm && lockoutTime === 0 && !modalState) {
      handleSubmit();
    }
  }, [pin, showResetForm, lockoutTime, modalState]);

  // Handle lockout timer
  useEffect(() => {
    let timer;
    if (lockoutTime > 0) {
      timer = setInterval(() => {
        setLockoutTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTime]);

  // Load current attempt status on mount
  useEffect(() => {
    const loadAttemptStatus = async () => {
      try {
        const status = await getPinAttemptStatus();
        if (status.success) {
          setAttempts(status.attempts || 0);
          setLockoutTime(status.remainingTime || 0);
        }
      } catch (error) {
      }
    };

    loadAttemptStatus();
  }, [getPinAttemptStatus]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (lockoutTime > 0) {
      setModalState('failed');
      setModalMessage(`Please wait ${lockoutTime} seconds before trying again`);
      return;
    }

    const enteredPin = pin.join('');
    if (enteredPin.length !== 4) {
      setModalState('failed');
      setModalMessage('Please enter a 4-digit PIN');
      return;
    }

    // Show loading modal
    setModalState('loading');
    setModalMessage('');

    try {
      const result = await verifyPin(enteredPin);
      
      if (result.success) {
        setModalState('success');
        setModalMessage('PIN verified successfully!');
        setAttempts(0);
        setLockoutTime(0);
      } else {
        setModalState('failed');
        setModalMessage(result.error || 'Invalid PIN');
        
        setAttempts(result.attempts || 0);
        
        if (result.locked) {
          setLockoutTime(result.remainingTime || 0);
        }
        
        setPin(['', '', '', '']);
        setFocusedPinIndex(0);
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 10);
      }
    } catch (error) {
      setModalState('failed');
      setModalMessage(error.message || 'Verification failed');
      setPin(['', '', '', '']);
      setFocusedPinIndex(0);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 10);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    
    const { recoveryWord, newPin, confirmPin } = resetData;
    
    if (!recoveryWord.trim()) {
      setModalState('failed');
      setModalMessage('Please enter your recovery word');
      return;
    }

    if (newPin.some(digit => !digit)) {
      setModalState('failed');
      setModalMessage('Please enter a 4-digit new PIN');
      return;
    }

    if (confirmPin.some(digit => !digit)) {
      setModalState('failed');
      setModalMessage('Please confirm your new PIN');
      return;
    }

    const newPinStr = newPin.join('');
    const confirmPinStr = confirmPin.join('');
    
    if (newPinStr !== confirmPinStr) {
      setModalState('failed');
      setModalMessage('PINs do not match');
      return;
    }

    setModalState('loading');
    setModalMessage('');

    try {
      await resetPin(recoveryWord, newPinStr);
      setModalState('success');
      setModalMessage('Successful! Login with your new PIN.');
      
        setTimeout(() => {
          navigate('/onboarding', { replace: true });
        }, 1500);
    } catch (error) {
      setModalState('failed');
      setModalMessage(error.message || 'PIN reset failed. Check your recovery word.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render PIN input boxes
  const renderPinInputs = (type, values, focusedIndex, onChange, onKeyDown, refs, disabled = false) => {
    return (
      <div className="flex justify-center gap-3">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={`${type}-${index}`}
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
              onFocus={() => {
                if (type === 'reset') setFocusedResetIndex(index);
                else if (type === 'confirm') setFocusedConfirmIndex(index);
                else setFocusedPinIndex(index);
              }}
              disabled={disabled}
              className={`w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl sm:text-3xl font-light bg-gray-900/50 border-2 rounded-xl focus:outline-none transition-all ${
                disabled
                  ? 'border-gray-800 bg-gray-900/30 text-gray-600 cursor-not-allowed'
                  : values[index]
                    ? 'border-primary-500/30 bg-primary-500/5 text-white'
                    : focusedIndex === index
                      ? 'border-primary-500/30 bg-gray-900/80 text-white'
                      : 'border-gray-800 bg-gray-900/30 text-white hover:border-gray-700'
              }`}
              inputMode="numeric"
              autoComplete="off"
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
        className="fixed top-6 left-4 sm:left-8 flex items-center gap-2 px-4 py-2 hover:bg-gray-800/50 rounded-lg transition-colors text-sm text-gray-400 hover:text-gray-300"
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
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            >
              {showResetForm ? (
                <RefreshCw className="w-8 h-8 text-primary-400" />
              ) : (
                <Lock className="w-8 h-8 text-primary-400" />
              )}
            </motion.div>
            
            <h1 className="text-2xl sm:text-3xl font-light text-white mb-2 tracking-tight">
              {showResetForm ? 'Reset PIN' : 'Welcome Back'}
            </h1>
            
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              {showResetForm 
                ? 'Enter your recovery word to reset your PIN'
                : isNewSession 
                  ? 'Enter your 4-digit PIN to continue'
                  : 'Please verify your identity to continue'
              }
            </p>
          </div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900/30 rounded-xl border border-gray-800 p-6 sm:p-8"
          >
            {showResetForm ? (
              // Reset PIN Form
              <form onSubmit={handleResetSubmit} className="space-y-6">
                {/* Recovery Word */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary-400" />
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recovery Word
                    </label>
                  </div>
                  
                  <RecoveryWordInput 
                    value={resetData.recoveryWord}
                    onChange={handleRecoveryWordChange}
                  />
                  
                  <p className="text-xs text-gray-600">
                    Enter the word you set during registration
                  </p>
                </div>

                {/* New PIN */}
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New PIN
                  </label>
                  
                  {renderPinInputs(
                    'reset',
                    resetData.newPin,
                    focusedResetIndex,
                    handleResetPinChange,
                    handleResetPinKeyDown,
                    resetInputRefs
                  )}
                </div>

                {/* Confirm New PIN */}
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confirm PIN
                  </label>
                  
                  {renderPinInputs(
                    'confirm',
                    resetData.confirmPin,
                    focusedConfirmIndex,
                    handleConfirmPinChange,
                    handleConfirmPinKeyDown,
                    confirmInputRefs
                  )}
                  {pinMismatch && (
                    <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg animate-in fade-in duration-200">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <p className="text-xs text-amber-400">PINs don't match. Please try again.</p>
                    </div>
                  )}
                </div>

                {/* Security Note */}
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-white mb-1">Security Reminder</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        After resetting your PIN, you'll be able to login with the new PIN immediately.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetForm(false);
                      setResetData({
                        recoveryWord: '',
                        newPin: ['', '', '', ''],
                        confirmPin: ['', '', '', '']
                      });
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !isResetFormValid()}
                    className="flex-1 px-4 py-2.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg transition-colors border border-primary-500/20 text-sm disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                        Resetting...
                      </span>
                    ) : (
                      'Reset PIN'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // PIN Verification Form
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* PIN Input */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enter your PIN
                    </label>
                  </div>
                  
                  {renderPinInputs(
                    'verify',
                    pin,
                    focusedPinIndex,
                    handlePinChange,
                    handlePinKeyDown,
                    inputRefs,
                    lockoutTime > 0
                  )}
                  
                  <p className="text-xs text-center text-gray-600">
                    Will auto-submit when complete
                  </p>
                </div>

                {/* Attempts & Lockout Status */}
                <AnimatePresence>
                  {attempts > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className={`p-4 rounded-lg border ${
                        lockoutTime > 0
                          ? 'bg-red-500/5 border-red-500/20'
                          : 'bg-yellow-500/5 border-yellow-500/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          lockoutTime > 0 ? 'text-red-400' : 'text-yellow-400'
                        }`} />
                        <div>
                          <h4 className="text-sm font-medium text-white mb-1">
                            {lockoutTime > 0 ? 'Account Locked' : 'Invalid PIN'}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {lockoutTime > 0
                              ? `Too many attempts. Try again in ${formatTime(lockoutTime)}.`
                              : `${3 - attempts} attempt${attempts === 2 ? '' : 's'} remaining.`
                            }
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  {lockoutTime > 0 && (
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Locked for {formatTime(lockoutTime)}</span>
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={pin.some(digit => !digit) || lockoutTime > 0 || modalState === 'loading'}
                    className="w-full py-2.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg transition-colors border border-primary-500/20 text-sm disabled:opacity-50"
                  >
                    {modalState === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      'Verify & Continue'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowResetForm(true)}
                    className="w-full py-2 text-gray-500 hover:text-gray-400 text-sm transition-colors"
                  >
                    Forgot your PIN?
                  </button>
                </div>
              </form>
            )}
          </motion.div>

          {/* Back to Login */}
          {!showResetForm && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => navigate('/onboarding')}
              className="w-full mt-4 text-center text-xs text-gray-600 hover:text-gray-500 transition-colors"
            >
              Use different account
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Modal Sheet - Handles both Loading and Result States */}
      <AnimatePresence>
        {modalState && (
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
              <div className={`bg-gray-900 rounded-xl border shadow-xl p-3 pointer-events-auto w-auto min-w-[180px] mx-4 transition-all ${
                modalState === 'success' 
                  ? 'border-green-500/50' 
                  : modalState === 'failed' 
                    ? 'border-red-500/50' 
                    : 'border-gray-800'
              }`}>
                <div className="flex flex-col items-center gap-2 text-center">
                  {/* Loading State */}
                  {modalState === 'loading' && (
                    <>
                      <div className="relative">
                        <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-400 rounded-full animate-spin" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white">
                          Verifying PIN
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Please wait...
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Success State */}
                  {modalState === 'success' && (
                    <>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/20">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-green-400">
                          Success
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {modalMessage || 'PIN verified!'}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Failed State */}
                  {modalState === 'failed' && (
                    <>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/20">
                        <XCircle className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-red-400">
                          Failed
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {modalMessage || 'Invalid PIN'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PinVerification;