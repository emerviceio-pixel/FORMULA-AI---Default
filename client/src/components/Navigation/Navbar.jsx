import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
  HelpCircle,
  ChevronRight,
  Zap,
  ScanIcon,
  Clock,
  Shield
} from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout, isAdmin } = useAuth();
  const { showSuccess } = useToast();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMenuAnimating, setIsMenuAnimating] = useState(false);

  // Handle scroll effect with throttling
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change - immediate
  useEffect(() => {
    if (showMobileMenu) {
      setShowMobileMenu(false);
    }
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileMenu]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/onboarding');
    } catch (error) {
    }
  };

  // Memoized menu toggle for better performance
  const toggleMobileMenu = useCallback(() => {
    setIsMenuAnimating(true);
    setShowMobileMenu(prev => !prev);
    // Reset animation flag after transition
    setTimeout(() => setIsMenuAnimating(false), 300);
  }, []);

  const navItems = [
    { path: '/', label: 'Scan', icon: <ScanIcon className="w-5 h-5" />, description: 'Health insights' },
    { path: '/profile', label: 'Profile', icon: <User className="w-5 h-5" />, description: 'Manage account' },
    { path: '/history', label: 'History', icon: <Clock className="w-5 h-5" />, description: 'View all scans' },
    { path: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, description: 'Preferences' },
  ];

  return (
    <>
      {/* Desktop Navbar - Elegant & Calm */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className={`hidden md:flex fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-gray-900/80 backdrop-blur-md border-b border-gray-800/50 shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto w-full px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Brand - Elegant */}
            <div className="flex items-center space-x-8">
              <NavLink
                to="/"
                className="flex items-center space-x-3 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-500/20 rounded-xl blur-md group-hover:blur-lg transition-all" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-white tracking-tight">Fomula</span>
                  <span className="text-[10px] text-gray-500 tracking-wider">AI HEALTH</span>
                </div>
              </NavLink>

              {/* Navigation Links - Subtle */}
              <div className="flex items-center space-x-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? 'text-primary-400'
                          : 'text-gray-400 hover:text-gray-200'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="relative z-10">{item.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="desktop-nav-indicator"
                            className="absolute inset-0 bg-primary-500/10 rounded-lg"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}

                  {/* ⭐ ADMIN LINK - Only show if user is admin */}
                  {isAdmin && (
                    <NavLink
                      to="/admin"
                      className={({ isActive }) =>
                        `relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                          isActive
                            ? 'text-indigo-400 bg-indigo-500/10'
                            : 'text-gray-400 hover:text-gray-200'
                        }`
                      }
                    >
                      <Shield className="w-4 h-4" />
                      <span>Admin</span>
                      {({ isActive }) => isActive && (
                        <motion.div
                          layoutId="desktop-nav-indicator"
                          className="absolute inset-0 bg-indigo-500/10 rounded-lg"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </NavLink>
                  )}
              </div>
            </div>

            {/* User Profile - Minimal */}
            <div className="flex items-center">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-3 px-3 py-1.5 rounded-lg hover:bg-gray-800/50 transition-all duration-300 group"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-400" />
                  </div>
                  {profile?.subscription === 'premium' && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-gray-900" />
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium text-white">{profile?.nickname || 'User'}</div>
                  <div className="text-xs text-gray-500">
                    {profile?.subscription === 'premium' ? 'Premium' : 'Free'}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navbar - Clean & Fast */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 px-4 py-2.5"
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <NavLink
            to="/"
            className="flex items-center space-x-2.5 active:opacity-70 transition-opacity"
            onClick={() => setShowMobileMenu(false)}
          >
            <div>
              <h1 className="text-base font-semibold text-white">Fomula</h1>
              <p className="text-[8px] text-gray-500 tracking-wider">AI HEALTH</p>
            </div>
          </NavLink>

          {/* Menu Button - Fast response */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.1 }}
            onClick={toggleMobileMenu}
            className="relative w-9 h-9 flex items-center justify-center  hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {showMobileMenu ? (
              <X className="w-4 h-4 text-white" />
            ) : (
              <Menu className="w-4 h-4 text-white" />
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Mobile Menu - Optimized for speed */}
      <AnimatePresence mode="wait">
        {showMobileMenu && (
          <>
            {/* Backdrop - Simple fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={toggleMobileMenu}
            />
            
            {/* Menu Panel - Fast spring */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ 
                type: 'spring', 
                damping: 30, 
                stiffness: 300,
                mass: 0.8
              }}
              className="md:hidden fixed top-0 right-0 bottom-0 w-[85%] max-w-sm z-50 bg-gray-900 shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Header - Minimal */}
                <div className="flex items-center justify-between p-5 border-b border-gray-800/50">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h2 className="text-base font-semibold text-white">Menu</h2>
                    </div>
                  </div>
                </div>

                {/* User Info - Compact */}
                <div className="p-5 bg-gradient-to-r from-primary-500/5 to-transparent border-b border-gray-800/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-xl flex items-center justify-center ">
                      <User className="w-6 h-6 text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {profile?.nickname || 'Guest User'}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {profile?.email || 'Not signed in'}
                      </p>
                      {profile?.subscription !== 'premium' && (
                        <NavLink
                          to="settings/subscription"
                          className="inline-flex items-center mt-1.5 text-xs text-primary-400"
                          onClick={toggleMobileMenu}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Upgrade
                        </NavLink>
                      )}
                    </div>
                    {profile?.subscription === 'premium' && (
                      <Crown className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>
                </div>

                {/* Navigation - Clean list */}
                <div className="flex-1 overflow-y-auto py-3 px-3">
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={toggleMobileMenu}
                        className={({ isActive }) =>
                          `flex items-center justify-between p-3 rounded-xl transition-all duration-150 ${
                            isActive
                              ? 'bg-primary-500/10 text-primary-400'
                              : 'text-gray-400 hover:bg-gray-800/80 hover:text-gray-200'
                          }`
                        }
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-800/80 rounded-lg flex items-center justify-center">
                            {item.icon}
                          </div>
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </NavLink>
                    ))}

                    {/* ⭐ ADMIN LINK - Mobile */}
                    {isAdmin && (
                      <NavLink
                        to="/admin"
                        onClick={toggleMobileMenu}
                        className={({ isActive }) =>
                          `flex items-center justify-between p-3 rounded-xl transition-all duration-150 ${
                            isActive
                              ? 'bg-indigo-500/10 text-indigo-400'
                              : 'text-gray-400 hover:bg-gray-800/80 hover:text-gray-200'
                          }`
                        }
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-800/80 rounded-lg flex items-center justify-center">
                            <Shield className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">Admin Panel</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </NavLink>
                    )}

                    {/* Support Link */}
                    <button
                      onClick={() => {
                        navigate('/settings/faq');
                        toggleMobileMenu();
                      }}
                      className="w-full flex items-center justify-between p-3 text-gray-400 hover:bg-gray-800/80 hover:text-gray-200 rounded-xl transition-all duration-150"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-800/80 rounded-lg flex items-center justify-center">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">Help</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </button>
                  </div>
                </div>

                {/* Logout - Simple */}
                <div className="p-4 border-t border-gray-800/50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors duration-150 text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;