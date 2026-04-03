import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import axios from 'axios';
import { useToast } from '../../hooks/useToast';
import {
  User,
  CreditCard,
  HelpCircle,
  Trash2,
  LogOut,
  ChevronRight,
  Eye,
  EyeOff,
  XCircle,
  AlertTriangle,
  Sparkles,
  Settings as SettingsIcon,
  Key
} from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { profile, logout, resetPin } = useAuth();
  const { showSuccess, showError } = useToast();

  // ===========================================
  // PIN Reset State
  // ===========================================
  const [showPinReset, setShowPinReset] = useState(false);
  const [pinData, setPinData] = useState({
    recoveryWord: '',
    newPin: '',
    confirmPin: ''
  });
  const [showRecoveryWord, setShowRecoveryWord] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // ===========================================
  // Account Deletion State
  // ===========================================
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteFeedback, setDeleteFeedback] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // ===========================================
  // Handlers
  // ===========================================

  // Account Deletion Handler
const handleAccountDeletion = async () => {
  if (!deleteReason.trim()) {
    showError('Please provide a reason for deletion');
    return;
  }

  if (!window.confirm('⚠️ PERMANENT ACCOUNT DELETION ⚠️\n\nThis action cannot be undone.')) {
    return;
  }

  setIsDeleting(true);
  try {
    // Use the new authService method
    const response = await authService.deleteAccount(deleteReason, deleteFeedback);
    
    if (response.success) {
      showSuccess('Account deleted successfully');
      setShowDeleteModal(false);
      await logout(); // This already uses authService.logout()
      navigate('/onboarding', { 
        state: { message: 'Your account has been permanently deleted.' } 
      });
    }
  } catch (error) {
    showError(error.message || 'Failed to delete account');
  } finally {
    setIsDeleting(false);
  }
};

  // PIN Reset Handler
  const handlePinReset = async () => {
    // Validation
    if (pinData.newPin !== pinData.confirmPin) {
      showError('New PINs do not match');
      return;
    }

    if (pinData.newPin.length !== 4 || pinData.confirmPin.length !== 4) {
      showError('PIN must be 4 digits');
      return;
    }

    if (!pinData.recoveryWord.trim()) {
      showError('Recovery word is required');
      return;
    }

    try {
      const result = await resetPin(pinData.recoveryWord, pinData.newPin);
      
      if (result.success) {
        showSuccess('PIN reset successfully');
        setShowPinReset(false);
        setPinData({
          recoveryWord: '',
          newPin: '',
          confirmPin: ''
        });
      }
    } catch (error) {
      showError(error.message || 'Failed to reset PIN');
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/onboarding');
    } catch (error) {
      showError('Failed to logout');
    }
  };

  // ===========================================
  // Settings Sections Configuration
  // ===========================================
  const settingsSections = [
    {
      title: 'Profile & Security',
      icon: <User className="w-4 h-4" />,
      items: [
        {
          label: 'Personal Information',
          description: 'Update your profile details',
          action: () => navigate('/profile'),
        },
        {
          label: 'Security & PIN',
          description: 'Change PIN and security settings',
          action: () => setShowPinReset(true),
        }
      ]
    },
    {
      title: 'Account Management',
      icon: <SettingsIcon className="w-4 h-4" />,
      items: [
        {
          label: 'Subscription',
          description: profile?.subscription === 'premium' 
            ? 'Manage your premium plan' 
            : 'Upgrade to premium',
          action: () => navigate('/settings/subscription'),
        },
        {
          label: 'FAQ & Support',
          description: 'Get help and find answers',
          action: () => navigate('/settings/faq'),
        }
      ]
    }
  ];

  // ===========================================
  // Render
  // ===========================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, gray 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl  from-primary-500/10 to-primary-600/10 mb-6 ">
              <SettingsIcon className="w-8 h-8 text-primary-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-light text-white mb-3 tracking-tight">
              Settings
            </h1>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
              Manage your account preferences and security settings
            </p>
          </motion.div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {settingsSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 + 0.2 }}
              className="space-y-3"
            >
              {/* Section Header */}
              <div className="flex items-center space-x-2 px-1">
                <div className="w-5 h-5 rounded-full bg-primary-500/10 flex items-center justify-center">
                  {section.icon}
                </div>
                <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h2>
              </div>

              {/* Section Items */}
              <div className="sm:bg-gray-900/30 sm:rounded-xl sm:border sm:border-gray-800/50 sm:divide-y sm:divide-gray-800/50">
                {section.items.map((item, itemIndex) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (sectionIndex * 0.1) + (itemIndex * 0.05) + 0.3 }}
                  >
                    <button
                      onClick={item.action}
                      className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-800/30 transition-colors group sm:first:rounded-t-xl sm:last:rounded-b-xl border-b border-gray-800/30 sm:border-0 last:border-0"
                    >
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-3">
                          <div className="text-gray-400 group-hover:text-gray-300 transition-colors">
                            {item.icon}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white mb-0.5">
                              {item.label}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3 mt-8"
          >
            <div className="flex items-center space-x-2 px-1">
              <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-3 h-3 text-red-400" />
              </div>
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                ACTION
              </h2>
            </div>

            <div className="sm:bg-gray-900/30 sm:rounded-xl sm:border sm:border-gray-800/50 sm:divide-y sm:divide-gray-800/50">
              {/* Delete Account Option */}
              <div className="p-3 sm:p-4 border-b border-gray-800/30 sm:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <div>
                      <div className="text-sm font-medium text-white mb-0.5">
                        Delete Account
                      </div>
                      <div className="text-xs text-gray-500">
                        Permanently delete your account and all data
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Logout Option */}
              <div className="p-3 sm:p-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <LogOut className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-white mb-0.5">
                        Sign Out
                      </div>
                      <div className="text-xs text-gray-500">
                        Logout from your account
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Version Info */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-2 text-xs text-gray-600">
              <Sparkles className="w-3 h-3" />
              <span>Version 1.0.0</span>
            </div>
          </div>
        </div>

        {/* PIN Reset Modal */}
        <AnimatePresence>
          {showPinReset && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                onClick={() => setShowPinReset(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none"
              >
                <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <div>
                      <h3 className="text-lg font-medium text-white">Reset PIN</h3>
                      <p className="text-sm text-gray-500 mt-1">Enter your recovery word to set a new PIN</p>
                    </div>
                    <button
                      onClick={() => setShowPinReset(false)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <XCircle className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4">
                    {/* Recovery Word */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                        Recovery Word
                      </label>
                      <div className="relative">
                        <input
                          type={showRecoveryWord ? 'text' : 'password'}
                          value={pinData.recoveryWord}
                          onChange={(e) =>
                            setPinData((prev) => ({
                              ...prev,
                              recoveryWord: e.target.value
                            }))
                          }
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-primary-500/50 focus:outline-none text-white text-sm pr-12 transition-colors"
                          placeholder="Enter your recovery word"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRecoveryWord(!showRecoveryWord)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                        >
                          {showRecoveryWord ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New PIN */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                        New PIN
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPin ? 'text' : 'password'}
                          value={pinData.newPin}
                          onChange={(e) =>
                            setPinData((prev) => ({
                              ...prev,
                              newPin: e.target.value.replace(/\D/g, '').slice(0, 4)
                            }))
                          }
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-primary-500/50 focus:outline-none text-white text-center text-xl tracking-widest pr-12 transition-colors"
                          maxLength={4}
                          placeholder="••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPin(!showNewPin)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                        >
                          {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm PIN */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                        Confirm New PIN
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPin ? 'text' : 'password'}
                          value={pinData.confirmPin}
                          onChange={(e) =>
                            setPinData((prev) => ({
                              ...prev,
                              confirmPin: e.target.value.replace(/\D/g, '').slice(0, 4)
                            }))
                          }
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-primary-500/50 focus:outline-none text-white text-center text-xl tracking-widest pr-12 transition-colors"
                          maxLength={4}
                          placeholder="••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPin(!showConfirmPin)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                        >
                          {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-800">
                    <button
                      onClick={() => setShowPinReset(false)}
                      className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePinReset}
                      className="px-4 py-2 text-sm bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg transition-colors border border-primary-500/20"
                    >
                      Reset PIN
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Delete Account Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                onClick={() => setShowDeleteModal(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none"
              >
                <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
                  <div className="p-6 border-b border-gray-800">
                    <h3 className="text-lg font-medium text-white">Delete Account</h3>
                    <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                        Reason for leaving
                      </label>
                      <select
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:border-primary-500/50 focus:outline-none"
                      >
                        <option value="">Select a reason</option>
                        <option value="privacy">Privacy concerns</option>
                        <option value="features">Missing features</option>
                        <option value="complexity">Too complex</option>
                        <option value="found-better">Found a better service</option>
                        <option value="not-using">Not using the service</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                        Feedback (optional)
                      </label>
                      <textarea
                        value={deleteFeedback}
                        onChange={(e) => setDeleteFeedback(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:border-primary-500/50 focus:outline-none"
                        placeholder="How can we improve?"
                        rows="3"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-800">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAccountDeletion}
                      disabled={isDeleting || !deleteReason}
                      className="px-4 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Settings;