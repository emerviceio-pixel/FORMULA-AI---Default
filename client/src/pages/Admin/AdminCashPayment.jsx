// client/src/pages/Dashboard/AdminCashPayment.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, Search, User, CheckCircle, AlertCircle, Calendar
} from 'lucide-react';
import { apiFetch } from '../../services/api';

const AdminCashPayment = () => {
  const [step, setStep] = useState('search'); // search, confirm, complete
  const [searchEmail, setSearchEmail] = useState('');
  const [user, setUser] = useState(null);
  const [isPremiumActive, setIsPremiumActive] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    plan: 'monthly',
    amount: 49.90,
    currency: 'GHS',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const searchUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch(`/admin/users/search?email=${encodeURIComponent(searchEmail)}`);
      
      if (data.success && data.data.length > 0) {
        const foundUser = data.data[0];
        
        setUser(foundUser);
        
        // Check if user has active premium subscription
        const subscriptionType = foundUser.subscription?.toLowerCase() || 'free';
        const hasEndDate = foundUser.subscriptionEndDate ? true : false;
        const isNotExpired = foundUser.subscriptionEndDate ? new Date(foundUser.subscriptionEndDate) > new Date() : false;
        
        // Premium is active only if subscription is "premium" AND it has a valid end date that hasn't expired
        const hasActivePremium = subscriptionType === 'premium' && hasEndDate && isNotExpired;
        
        setIsPremiumActive(hasActivePremium);
        
        setStep('confirm');
      } else {
        alert('User not found');
      }
    } catch (error) {
      alert('Error searching for user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const processCashPayment = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/cash-payment', {
        method: 'POST',
        body: JSON.stringify({
          userId: user._id,
          ...paymentDetails
        })
      });
      
      if (data.success) {
        setStep('complete');
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      alert('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#0d0d0d] p-6">
      <div className="flex items-center gap-3 mb-6 pt-20">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-light text-white">Cash Payment</h2>
          <p className="text-[11px] text-gray-600">Record offline premium upgrades</p>
        </div>
      </div>

      {step === 'search' && (
        <motion.form 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={(e) => {
            searchUser(e);
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-[11px] text-gray-600 uppercase tracking-wider mb-2 block">
              User Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-3 bg-[#111] border border-white/[0.07] rounded-xl text-white text-sm placeholder-gray-700 focus:outline-none focus:border-amber-500/40"
                required
              />
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-600" />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !searchEmail}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-white rounded-xl text-sm transition-colors"
          >
            {loading ? 'Searching...' : 'Find User'}
          </button>
        </motion.form>
      )}

      {step === 'confirm' && user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* User Preview Card */}
          <div className="p-4 bg-[#111] rounded-xl border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-white">{user.email}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] text-gray-700">Current Plan</p>
                <p className="text-white capitalize">{user.subscription || 'free'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-700">Country</p>
                <p className="text-white">{user.country || 'N/A'}</p>
              </div>
            </div>
            {user.subscriptionEndDate && (
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/[0.05]">
                <Calendar className="w-3 h-3 text-gray-600" />
                <p className="text-[10px] text-gray-600">
                  Expires: {formatDate(user.subscriptionEndDate)}
                </p>
              </div>
            )}
          </div>

          {/* Check if user has active premium - Show warning instead of form */}
          {isPremiumActive ? (
            <div className="p-4 bg-amber-500/5 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-400 mb-1">
                    Premium Already Active
                  </h4>
                </div>
              </div>
            </div>
          ) : (
            /* Payment Form - Only shown if no active premium */
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-600 uppercase tracking-wider mb-2 block">
                  Plan
                </label>
                <select
                  value={paymentDetails.plan}
                  onChange={(e) => {
                    const plan = e.target.value;
                    setPaymentDetails({
                      ...paymentDetails,
                      plan,
                      amount: plan === 'monthly' ? 49.90 : 499.00
                    });
                  }}
                  className="w-full px-4 py-3 bg-[#111] border border-white/[0.07] rounded-xl text-white text-sm"
                >
                  <option value="monthly">Monthly - GHS 49.90</option>
                  <option value="yearly">Yearly - GHS 499.00</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-600 uppercase tracking-wider mb-2 block">
                  Amount Received
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-600">GHS</span>
                  <input
                    type="number"
                    value={paymentDetails.amount}
                    onChange={(e) => setPaymentDetails({
                      ...paymentDetails,
                      amount: parseFloat(e.target.value)
                    })}
                    step="0.01"
                    min="0"
                    className="w-full pl-12 pr-4 py-3 bg-[#111] border border-white/[0.07] rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-600 uppercase tracking-wider mb-2 block">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentDetails.notes}
                  onChange={(e) => setPaymentDetails({
                    ...paymentDetails,
                    notes: e.target.value
                  })}
                  placeholder="Receipt number, location, etc."
                  rows="2"
                  className="w-full px-4 py-3 bg-[#111] border border-white/[0.07] rounded-xl text-white text-sm placeholder-gray-700"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => {
                    setStep('search');
                    setSearchEmail('');
                    setUser(null);
                    setIsPremiumActive(false);
                  }}
                  className="flex-1 py-3 bg-white/[0.04] hover:bg-white/[0.07] text-gray-400 rounded-xl text-sm"
                >
                  Back
                </button>
                <button
                  onClick={processCashPayment}
                  disabled={loading}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Show Back button only when premium is active (no confirm form) */}
          {isPremiumActive && (
            <div className="flex gap-3 pt-3">
              <button
                onClick={() => {
                  setStep('search');
                  setSearchEmail('');
                  setUser(null);
                  setIsPremiumActive(false);
                }}
                className="w-full py-3 bg-white/[0.04] hover:bg-white/[0.07] text-gray-400 rounded-xl text-sm"
              >
                Search Another User
              </button>
            </div>
          )}
        </motion.div>
      )}

      {step === 'complete' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg text-white mb-2">Payment Recorded!</h3>
          <p className="text-sm text-gray-500 mb-6">
            Premium access activated for {user?.email}
          </p>
          <button
            onClick={() => {
              setStep('search');
              setSearchEmail('');
              setUser(null);
              setIsPremiumActive(false);
            }}
            className="px-6 py-3 bg-white/[0.04] hover:bg-white/[0.07] text-gray-400 rounded-xl text-sm"
          >
            New Payment
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default AdminCashPayment;