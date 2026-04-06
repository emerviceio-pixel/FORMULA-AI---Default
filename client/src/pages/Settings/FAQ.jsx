import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  HelpCircle,
  ChevronDown,
  Shield,
  CreditCard,
  User,
  BarChart3,
  Smartphone,
  Lock,
  Zap,
  Mail,
  ExternalLink,
  Sparkles
} from 'lucide-react';

const FAQ = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [openItems, setOpenItems] = useState({});
  const { profile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    
    // Function to show/hide Tidio widget
    const toggleTidioWidget = (show) => {
      const tidioWidget = document.querySelector('#tidio-chat, .tidio-chat');
      if (tidioWidget) {
        tidioWidget.style.display = show ? 'block' : 'none';
      }
    };

    // Load Tidio script if not already loaded
    if (!window.tidioChatScript) {
      const script = document.createElement('script');
      script.src = '//code.tidio.co/8lxqyd0qglxcovgevwep9oc5exuedhtf.js';
      script.async = true;
      script.id = 'tidio-chat-script';
      
      script.onload = () => {
        window.tidioChatScript = true;
        setTimeout(() => toggleTidioWidget(true), 1000);
        
        if (profile && window.tidioChatApi) {
          window.tidioChatApi.setVisitorData({
            email: profile.email,
            name: profile.nickname,
            custom: {
              country: profile.country,
              subscription: profile.subscription,
              userId: profile.id
            }
          });
        }
      };
      
      document.body.appendChild(script);
    } else {
      toggleTidioWidget(true);
    }

    return () => {
      toggleTidioWidget(false);
    };
  }, [profile, isLoading]); 

  const categories = [
    { id: 'general', label: 'General', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'account', label: 'Account', icon: <User className="w-4 h-4" /> },
    { id: 'subscription', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield className="w-4 h-4" /> },
    { id: 'features', label: 'Features', icon: <Zap className="w-4 h-4" /> },
    { id: 'technical', label: 'Tech', icon: <Smartphone className="w-4 h-4" /> },
  ];

  const faqItems = {
    general: [
      {
        question: 'What is Fomula?',
        answer: 'Fomula is an AI-powered meal coach that helps health-conscious users make safe and informed food choices based on their physical profile, activity level, and health conditions.',
        tags: ['overview', 'purpose']
      },
      {
        question: 'How does the AI analysis work?',
        answer: 'Our AI uses machine learning algorithms trained on extensive nutritional databases and medical experts. When you scan a food item, it analyzes the nutritional content against your profile data to determine safety levels.',
        tags: ['ai', 'technology']
      },
      {
        question: 'What to search?',
        answer: 'No need to be descriptive. Just type/search any food item, drink, popular Restaurant or Special Keys for personalized recommendation.',
        tags: ['smart', 'health']

      },
      {
        question: 'Is Fomula free to use?',
        answer: 'Yes, we offer a free plan with 5 daily food scans. For unlimited scans and advanced features, we offer a Premium subscription at GHC39.99/month.',
        tags: ['pricing', 'free']
      },
      {
        question: 'What is the purpose of your feedback?',
        answer: 'We collect, analyze and identify common patterns(esp. bad response) to train and improve our AI.',
        tags: ['AI', 'training']
      },
      {
        question: 'Can I use Fomula for medical advice?',
        answer: 'No. Fomula is designed for informational purposes only and should not be used as a substitute for professional medical advice.',
        tags: ['medical', 'disclaimer']
      }
    ],
    account: [
      {
        question: 'How do I reset my PIN?',
        answer: 'Click "Forgot PIN" on the login screen and enter your recovery word. You\'ll then be able to set a new 4-digit PIN.',
        tags: ['pin', 'security']
      },
      {
        question: 'Can I change my health profile?',
        answer: 'Yes, you can update your profile at any time from the Profile page. Health conditions and allergies are encrypted for privacy.',
        tags: ['profile', 'update']
      },
      {
        question: 'How do I delete my account?',
        answer: 'Account deletion is available in Settings under "Account" section. Once deleted, all your data will be permanently removed.',
        tags: ['delete', 'account']
      },
    ],
    subscription: [
      {
        question: 'What are the benefits of Premium?',
        answer: 'Premium includes: Unlimited scans, AI-powered food alternatives, priority support, no ads, and custom health insights.',
        tags: ['premium', 'benefits']
      },
      {
        question: 'How does billing work?',
        answer: 'Premium is GHC39.99/month billed monthly. You can cancel anytime and your subscription will be downgraded immediately.',
        tags: ['billing', 'payment']
      },
      {
        question: 'How do I cancel my subscription?',
        answer: 'You can cancel your Premium subscription at any time from the Subscription page in Settings.',
        tags: ['cancel', 'subscription']
      }
    ],
    privacy: [
      {
        question: 'How is my health data protected?',
        answer: 'Your health conditions and allergies are encrypted using AES-256 encryption. They are only decrypted for AI analysis.',
        tags: ['encryption', 'privacy']
      },
      {
        question: 'What data we you collect?',
        answer: 'We collect your profile information, food scan history, and preferences. We never sell your personal data.',
        tags: ['data', 'collection']
      },
      {
        question: 'How long is my data stored?',
        answer: 'Your data is stored as long as your account is active. Upon deletion, all data is removed within 30 days.',
        tags: ['storage', 'retention']
      }
    ],
    features: [
      {
        question: 'How accurate is the food analysis?',
        answer: 'Our AI achieves 95%+ accuracy for common food items. Accuracy may vary for uncommon or complex dishes.',
        tags: ['accuracy', 'ai']
      },
      {
        question: 'Can I scan restaurant meals?',
        answer: 'Yes, you can search for any popular restaurant name and our AI will recommend the best dish if any',
        tags: ['restaurant', 'scan']
      },
      {
        question: 'Does Fomula track calories?',
        answer: 'Yes, our AI can estimate nutritional values including calories, protein, carbs, fat, sugar, and sodium.',
        tags: ['tracking', 'nutrition']
      }
    ],
    technical: [
      {
        question: 'Which devices are supported?',
        answer: 'Fomula works on all modern browsers on desktop and mobile. Native mobile apps are planned for the future.',
        tags: ['devices', 'browsers']
      },
      {
        question: 'Do I need an internet connection?',
        answer: 'Yes, an internet connection is required for AI analysis and database access.',
        tags: ['offline', 'internet']
      },
      {
        question: 'Report an issue?',
        answer: 'Talk to our Customer Care via the chat widget below the screen for effective support.',
        tags: ['support', 'bugs']
      }
    ]
  };

  const toggleItem = (category, index) => {
    const key = `${category}-${index}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const filteredItems = faqItems[activeCategory];

  const contactOptions = [
    {
      title: 'Email Support',
      description: 'Get help via email',
      icon: <Mail className="w-5 h-5" />,
      action: () => window.location.href = 'mailto:support@Fomula.app',
      buttonText: 'support@Fomula.app'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, gray 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {/* Header - Minimal & Elegant */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl">
              <HelpCircle className="w-8 h-8 text-primary-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-light text-white mb-3 tracking-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
              Find answers to common questions about Fomula. 
              Can't find what you're looking for? Contact our support team.
            </p>
          </motion.div>
        </div>

        {/* Mobile Categories - Scrollable Pills */}
        <div className="lg:hidden mb-8">
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-950 to-transparent z-10 pointer-events-none" />
            
            <div 
              className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-full transition-all flex-shrink-0 ${
                    activeCategory === category.id
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-800 hover:text-gray-300'
                  }`}
                >
                  {category.icon}
                  <span className="text-sm font-medium whitespace-nowrap">{category.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Categories - Sidebar */}
        <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 w-48">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-1"
          >
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all ${
                  activeCategory === category.id
                    ? 'bg-primary-500/10 text-primary-400'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                {category.icon}
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            ))}
          </motion.div>
        </div>

        {/* FAQ Content */}
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3 sm:space-y-4"
        >
          {/* Category Header - Minimal */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {categories.find(c => c.id === activeCategory)?.label}
              </span>
              <span className="text-xs text-gray-600">•</span>
              <span className="text-xs text-gray-500">
                {filteredItems.length} articles
              </span>
            </div>
          </div>

          {/* FAQ Items - Clean Accordion */}
          <AnimatePresence mode="wait">
            {filteredItems.map((item, index) => {
              const key = `${activeCategory}-${index}`;
              const isOpen = openItems[key];
              
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ delay: index * 0.03 }}
                  className="group"
                >
                  <button
                    onClick={() => toggleItem(activeCategory, index)}
                    className="w-full text-left"
                  >
                    <div className={`py-4 sm:py-5 border-b border-gray-800/80 transition-colors ${
                      isOpen ? 'border-primary-500/20' : 'hover:border-gray-700'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className={`text-base sm:text-lg transition-colors ${
                            isOpen ? 'text-primary-400' : 'text-gray-300 group-hover:text-white'
                          }`}>
                            {item.question}
                          </h3>
                          
                          {/* Tags - Subtle */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs text-gray-600"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <ChevronDown
                          className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-600 transition-all duration-300 flex-shrink-0 ${
                            isOpen ? 'transform rotate-180 text-primary-400' : ''
                          }`}
                        />
                      </div>

                      {/* Answer - Smooth Expand */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 pb-2">
                              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                                {item.answer}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Still Need Help Section - Minimal Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 sm:mt-20"
        >
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-light text-white mb-2">
              Still Need Help?
            </h2>
            <p className="text-sm text-gray-500">
              Our support team is here to assist you
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {contactOptions.map((option, index) => (
              <motion.div
                key={option.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="group"
              >
                <button
                  onClick={option.action}
                  className="w-full p-5 bg-gray-900/50 rounded-xl border border-gray-800 hover:border-gray-700 transition-all text-left"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500/20 transition-colors">
                      {option.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium mb-1">
                        {option.title}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {option.buttonText}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                  </div>
                </button>
              </motion.div>
            ))}
          </div>

          {/* Response Time - Subtle */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 text-xs text-gray-600">
              <Sparkles className="w-3 h-3" />
              <span>Response time: 12-24 hours</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;