import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { apiFetch } from '../../services/api';
import {
  Crown,
  Check,
  X,
  Zap,
  Shield,
  Users,
  Sparkles,
  CreditCard,
  Lock,
  Clock,
  Star,
  TrendingUp,
  Award,
  Phone,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Calendar,
  ShieldCheck,
  InfinityIcon
} from 'lucide-react';

const Subscription = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const [mobileMoney, setMobileMoney] = useState({
    provider: '',
    accountNumber: '',
    countryCode: ''
  });

  // Get subscription renewal date (30 days from now)
  const getRenewalDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const plans = [
    {
      id: 'premium',
      name: 'Premium',
      price: 'GHC39.9',
      period: 'month',
      description: 'Everything you need for optimal health',
      icon: <Crown className="w-5 h-5" />,
      badge: 'Most Popular',
      features: [
        { text: 'Unlimited scans', included: true },
        { text: 'Restaurant Menu Analysis', included: true },
        { text: 'Advanced AI recommendations', included: true },
        { text: 'Personalized meal plans', included: true },
        { text: 'Priority health risk alerts', included: true },
        { text: '24/7 Priority support', included: true },
        { text: 'Ad-free experience', included: true },
        { text: 'Early access to new features', included: true }
      ]
    }
  ];

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      const paymentData = {
        plan: 'premium',
        paymentMethod: paymentMethod,
        ...(paymentMethod === 'mobile' && {
          mobileMoney: {
            provider: mobileMoney.provider,
            accountNumber: `${mobileMoney.countryCode}${mobileMoney.accountNumber}`
          }
        })
      };

      const data = await apiFetch('/subscription/initialize', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
      
      if (data.success) {
        window.location.href = result.authorizationUrl;
      } else {
        showError(result.error);
      }
    } catch (error) {
      showError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardInput = (field, value) => {
    let formattedValue = value;
    if (field === 'number') {
      formattedValue = value.replace(/\D/g, '').slice(0, 16);
      if (formattedValue.length > 0) {
        formattedValue = formattedValue.match(/.{1,4}/g).join(' ');
      }
    } else if (field === 'expiry') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
      if (formattedValue.length > 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2);
      }
    } else if (field === 'cvc') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    }
    setCardDetails(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Your premium features will be downgraded immediately after cancellation.')) {
      return;
    }
    
    try {
      const data = await apiFetch('/subscription/cancel', {
        method: 'POST'
      });
      
      if (data.success) {
        showSuccess('Cancellation sucessful.');
        window.location.reload();
      }
    } catch (error) {
      showError('Cancellation failed');
    }
  };

  const currentPlan = profile?.subscription || 'free';
  const renewalDate = getRenewalDate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, gray 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 mb-4">
            <Crown className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-light text-white mb-3 tracking-tight">
            Upgrade Your Health Journey
          </h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto">
            Unlock the full potential of AI-powered food analysis with unlimited scans and personalized recommendations
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mb-12"
        >
          {[
            { value: '99%', label: 'Accuracy Rate' },
            { value: '10K+', label: 'Foods Analyzed' },
            { value: '24/7', label: 'AI Support' },
            { value: 'Flexibility', label: 'Cancel Anytime' }
          ].map((stat, index) => (
            <div key={index} className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 text-center">
              <div className="text-xl font-light text-white mb-1">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Current Plan Status - If Premium */}
        {currentPlan === 'premium' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-medium text-white">Premium Plan Active</h3>
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full">
                        Active
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                      <div className="flex items-center text-gray-500">
                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                        Renews {renewalDate}
                      </div>
                      <div className="flex items-center text-gray-500">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                        Auto-renewal enabled
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleCancelSubscription}
                  className="px-4 py-2 text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
                >
                  Cancel Plan
                </button>
              </div>

              {/* Premium Features Preview */}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: <InfinityIcon className="w-4 h-4" />, text: 'Unlimited Scans' },
                    { icon: <Sparkles className="w-4 h-4" />, text: 'Advanced AI' },
                    { icon: <Shield className="w-4 h-4" />, text: 'Priority Support' },
                    { icon: <TrendingUp className="w-4 h-4" />, text: 'Ad-Free' }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-800/30 rounded-lg">
                      <div className="text-yellow-400">{feature.icon}</div>
                      <span className="text-xs text-gray-300">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Plan Selection & Payment - Only if not premium */}
        {currentPlan !== 'premium' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Plan Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded-full border border-yellow-500/20 mb-4">
                  <Star className="w-3 h-3" />
                  Most Popular
                </div>

                {/* Plan Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-medium text-white mb-1">Premium Plan</h3>
                    <p className="text-sm text-gray-500">Everything you need for optimal health</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-light text-white">GHC39.9</div>
                    <div className="text-xs text-gray-500">per month</div>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {plans[0].features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <X className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <span className={`text-sm ${feature.included ? 'text-gray-300' : 'text-gray-600'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => setSelectedPlan('premium')}
                  className="w-full py-3 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg transition-colors border border-primary-500/20 text-sm font-medium"
                >
                  Selected Plan
                </button>
              </div>
            </motion.div>

            {/* Payment Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-1"
            >
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 sticky top-6">
                <h3 className="text-lg font-medium text-white mb-4">Complete Payment</h3>
                
                {/* Plan Summary */}
                <div className="bg-gray-800/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Premium Plan</span>
                    <span className="text-lg font-medium text-white">GHC39.9</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Next billing</span>
                    <span className="text-gray-400">{renewalDate}</span>
                  </div>
                </div>

                {/* Security Note */}
                <div className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg mb-6">
                  <Lock className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-medium text-white mb-1">Bank-Level Security</div>
                    <div className="text-xs text-gray-500">256-bit SSL encryption</div>
                  </div>
                </div>

                {/* Total & Payment Button */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-t border-gray-800">
                    <span className="text-sm text-gray-400">Total</span>
                    <span className="text-xl font-light text-white">GHC39.9</span>
                  </div>
                  
                  <button
                    onClick={handleUpgrade}
                    disabled={isProcessing}
                    className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Complete Payment
                      </>
                    )}
                  </button>
                  
                  <p className="text-xs text-center text-gray-600">
                    By completing your purchase, you agree to our{' '}
                    <a href="/terms" className="text-primary-400 hover:text-primary-300">
                      Terms
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-primary-400 hover:text-primary-300">
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Guarantee Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 pt-8 border-t border-gray-800/50"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { icon: <Users className="w-4 h-4" />, title: '24/7 Support', desc: 'Expert assistance anytime' },
              { icon: <Award className="w-4 h-4" />, title: 'Trusted by Thousands', desc: 'Join our health community' }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-gray-900/30 rounded-lg">
                <div className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center border border-primary-500/20">
                  <div className="text-primary-400">{item.icon}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-6">
            <p className="text-xs text-gray-600">
              Questions? <a href="#" className="text-primary-400 hover:text-primary-300">Contact support</a> or read our <a href="#" className="text-primary-400 hover:text-primary-300">FAQ</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Subscription;