// client/src/pages/Dashboard/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { apiFetch } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, Crown, TrendingUp, Globe, Shield, Mail,
  ThumbsUp, ThumbsDown, BarChart3, AlertCircle, Sparkles,
  Filter, X, RefreshCw, Activity, Award, Zap,
  ChevronLeft, ChevronRight, Eye, EyeOff, DollarSign,
  Calendar, CreditCard, Clock, CheckCircle, XCircle, 
  Smartphone, CreditCard as CardIcon, Wallet, MoreHorizontal,
   Download, FileText, FileJson
} from 'lucide-react';

/* ─── tiny helpers ─────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
});

const Card = ({ children, className = '', delay = 0 }) => (
  <motion.div
    {...fadeUp(delay)}
    className={`rounded-2xl bg-[#0a0a0f] border border-white/[0.04] shadow-xl ${className}`}
  >
    {children}
  </motion.div>
);

const SectionLabel = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 mb-5">
    <div className="w-5 h-5 rounded-md bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
      <Icon className="w-3 h-3 text-indigo-400/70" />
    </div>
    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">{label}</span>
  </div>
);

const StatCard = ({ label, value, icon: Icon, color, delay }) => {
  const colors = {
    blue:   { ring: 'border-blue-500/10',   bg: 'bg-blue-500/5',   text: 'text-blue-400/90'   },
    green:  { ring: 'border-green-500/10',  bg: 'bg-green-500/5',  text: 'text-green-400/90'  },
    gray:   { ring: 'border-white/5',        bg: 'bg-white/[0.02]',  text: 'text-gray-400/90'   },
    purple: { ring: 'border-purple-500/10', bg: 'bg-purple-500/5', text: 'text-purple-400/90' },
    red:    { ring: 'border-rose-500/10',   bg: 'bg-rose-500/5',   text: 'text-rose-400/90'   },
    amber:  { ring: 'border-amber-500/10',  bg: 'bg-amber-500/5',  text: 'text-amber-400/90'  },
  };
  const c = colors[color] ?? colors.gray;
  return (
    <Card delay={delay} className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2">{label}</p>
          <p className={`text-2xl font-light ${c.text}`}>{value ?? '—'}</p>
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${c.bg} ${c.ring}`}>
          <Icon className={`w-4 h-4 ${c.text}`} />
        </div>
      </div>
    </Card>
  );
};

// Helper function for payment type icons
const getPaymentTypeIcon = (type) => {
  switch(type) {
    case 'mobile_money': return <Smartphone className="w-3.5 h-3.5 text-gray-400" />;
    case 'card': return <CardIcon className="w-3.5 h-3.5 text-gray-400" />;
    case 'cash': return <Wallet className="w-3.5 h-3.5 text-gray-400" />;
    default: return <CreditCard className="w-3.5 h-3.5 text-gray-400" />;
  }
};

const TABS = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'feedback',  label: 'Feedback'  },
  { id: 'activity',  label: 'Activity'  },
  { id: 'revenue',   label: 'Revenue'   },
];

/* ═══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const { profile, isLoading: authLoading } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  // Admin authorization states
  const [adminAuthChecking, setAdminAuthChecking] = useState(true);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);

  const [dashboardData, setDashboardData]       = useState(null);
  const [searchEmail, setSearchEmail]           = useState('');
  const [searchResults, setSearchResults]       = useState([]);
  const [isLoading, setIsLoading]               = useState(false);
  const [activeTimeRange, setActiveTimeRange]   = useState('10m');
  const [activeUsers, setActiveUsers]           = useState([]);



  const [feedbackAnalytics, setFeedbackAnalytics] = useState(null);
  const [feedbackList, setFeedbackList]           = useState([]);
  const [feedbackLoading, setFeedbackLoading]     = useState(false);
  const [activeTab, setActiveTab]                 = useState('overview');
  const [feedbackPage, setFeedbackPage]           = useState(1);
  const [feedbackTotalPages, setFeedbackTotalPages] = useState(1);
  const [showFilters, setShowFilters]             = useState(false);
  const [feedbackFilter, setFeedbackFilter]       = useState({ type: '', country: '', inputType: '' });
  const [availableFilters, setAvailableFilters]   = useState({ countries: [], inputTypes: [] });

  // Revenue tab state
  const [revenueData, setRevenueData] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [revenuePage, setRevenuePage] = useState(1);
  const [revenueItemsPerPage] = useState(5);

  // export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDateRange, setExportDateRange] = useState({ start: '', end: '' });
  const [exportFeedbackType, setExportFeedbackType] = useState('all'); // 'all', 'good', 'bad'
  const [exportFormat, setExportFormat] = useState('csv'); // 'csv', 'json', 'pdf'
  const [exportLoading, setExportLoading] = useState(false);

  // Check admin authorization
  useEffect(() => {
    const checkAdminAuth = async () => {
      if (!authLoading) {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (profile?.admin) {
          setIsAdminAuthorized(true);
        } else {
          window.location.href = '/dashboard';
        }
        setAdminAuthChecking(false);
      }
    };
    
    checkAdminAuth();
  }, [profile, authLoading]);

  useEffect(() => {
    if (profile?.admin && isAdminAuthorized) {
      apiFetch('/admin/dashboard')
        .then(r => r.json())
        .then(d => { if (d.success) setDashboardData(d.data); })
        .catch(() => showError('Failed to load dashboard data'));
    }
  }, [profile, isAdminAuthorized]);

  useEffect(() => {
    if (profile?.admin && activeTab === 'feedback' && isAdminAuthorized) {
      setFeedbackLoading(true);
      apiFetch('/admin/feedback/analytics')
        .then(r => r.json())
        .then(d => { if (d.success) setFeedbackAnalytics(d.data); })
        .catch(() => showError('Failed to load feedback analytics'))
        .finally(() => setFeedbackLoading(false));
    }
  }, [profile, activeTab, isAdminAuthorized]);

  useEffect(() => {
    if (!profile?.admin || activeTab !== 'activity') return;
    const load = () =>
      apiFetch(`/admin/active-users?range=${activeTimeRange}`)
        .then(r => r.json())
        .then(d => { if (d.success) setActiveUsers(d.data.users); });
    load();
    const iv = activeTimeRange === '10m' ? setInterval(load, 30000) : null;
    return () => iv && clearInterval(iv);
  }, [profile, activeTab, activeTimeRange, isAdminAuthorized]);

  useEffect(() => {
    if (!profile?.admin || activeTab !== 'feedback' || !isAdminAuthorized) return;
    setFeedbackLoading(true);
    const params = new URLSearchParams({ page: feedbackPage, limit: 10 });
    if (feedbackFilter.type)      params.append('type',      feedbackFilter.type);
    if (feedbackFilter.country)   params.append('country',   feedbackFilter.country);
    if (feedbackFilter.inputType) params.append('inputType', feedbackFilter.inputType);
    apiFetch(`/admin/feedback/list?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setFeedbackList(d.data.feedback);
          setFeedbackTotalPages(d.data.pagination.totalPages);
          if (d.data.filters) setAvailableFilters({ countries: d.data.filters.countries || [], inputTypes: d.data.filters.inputTypes || [] });
        }
      })
      .catch(() => showError('Failed to load feedback list'))
      .finally(() => setFeedbackLoading(false));
  }, [profile, activeTab, feedbackPage, feedbackFilter, isAdminAuthorized]);

  // Fetch revenue data when revenue tab is active
  useEffect(() => {
    if (profile?.admin && activeTab === 'revenue' && isAdminAuthorized) {
      fetchMonthlyRevenue();
    }
  }, [profile, activeTab, selectedYear, selectedMonth, isAdminAuthorized]);



  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setIsLoading(true);
    try {
      const res  = await apiFetch(`/admin/users/search?email=${encodeURIComponent(searchEmail)}`);
      
      if (data.success) { setSearchResults(data.data); if (!data.data.length) showSuccess('No users found'); }
    } catch { showError('Search failed'); }
    finally { setIsLoading(false); }
  };

  const fetchMonthlyRevenue = async () => {
    setRevenueLoading(true);
    try {
      const res = await apiFetch(`/admin/revenue/monthly?year=${selectedYear}&month=${selectedMonth}`);
      
      if (data.success) {
        setRevenueData(data.data);
        setRevenuePage(1); // Reset to first page on new data
      } else showError(data.error || 'Failed to load revenue data');
    } catch (error) {
      showError('Failed to load revenue data');
    } finally {
      setRevenueLoading(false);
    }
  };

  const handleFilterChange = (key, val) => { setFeedbackFilter(p => ({ ...p, [key]: val })); setFeedbackPage(1); };
  const handleClearFilters = () => { setFeedbackFilter({ type: '', country: '', inputType: '' }); setFeedbackPage(1); };
  const activeFilterCount = Object.values(feedbackFilter).filter(Boolean).length;

  // Generate year options (last 3 years + current + next)
  const yearOptions = () => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  };

  const handleExportFeedback = async () => {
    if (!exportDateRange.start || !exportDateRange.end) {
      showError('Please select both start and end dates');
      return;
    }

    setExportLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: exportDateRange.start,
        endDate: exportDateRange.end,
        feedbackType: exportFeedbackType,
        format: exportFormat
      });

      const response = await apiFetch(`/admin/feedback/export?${params}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Handle different formats
      if (exportFormat === 'csv' || exportFormat === 'json') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `feedback_export_${exportDateRange.start}_to_${exportDateRange.end}.${exportFormat}`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?(.+)"?/);
          if (match) filename = match[1];
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSuccess('Export completed successfully!');
      } else if (exportFormat === 'pdf') {
        // For PDF, we get the blob and open in new tab
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Clean up the URL after a delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
        
        showSuccess('PDF generated successfully!');
      }

      setShowExportModal(false);
      setExportDateRange({ start: '', end: '' });
      setExportFeedbackType('all');
    } catch (error) {
      showError(error.message || 'Failed to export data');
    } finally {
      setExportLoading(false);
    }
  };

  // Paginate transactions
  const paginatedTransactions = revenueData?.transactions 
    ? revenueData.transactions.slice(
        (revenuePage - 1) * revenueItemsPerPage, 
        revenuePage * revenueItemsPerPage
      )
    : [];

  const totalTransactionPages = revenueData?.transactions 
    ? Math.ceil(revenueData.transactions.length / revenueItemsPerPage)
    : 0;

  /* ─── loading states ───────────────────────────────────────── */
  if (authLoading || adminAuthChecking) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500/60 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-400/40" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Verifying admin access</p>
            <p className="text-[10px] text-gray-700 tracking-widest uppercase">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdminAuthorized) return null;

  /* ─── main dashboard ────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white/90" style={{ fontFamily:"'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Serif+Display:ital@0;1&display=swap');
        #grain2 { position:fixed; inset:0; pointer-events:none; z-index:9999; opacity:0.015;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        ::-webkit-scrollbar { width:4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.04); border-radius:99px; }
        ::-webkit-scrollbar-track { background: transparent; }
        .tab-btn { position:relative; padding:8px 16px; font-size:12px; font-weight:500; letter-spacing:.03em; transition:color .15s; }
        .tab-btn.active { color:#fff; }
        .tab-btn:not(.active) { color: rgba(255,255,255,.3); }
        .tab-btn:not(.active):hover { color: rgba(255,255,255,.5); }
        select option { background:#111; }
        
        /* Horizontal scrollable tabs for mobile */
        .scrollable-tabs {
          overflow-x: auto;
          overflow-y: hidden;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          padding-bottom: 2px;
        }
        .scrollable-tabs::-webkit-scrollbar {
          height: 2px;
        }
        .scrollable-tabs::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 99px;
        }
        .scrollable-tabs::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
      `}</style>
      <div id="grain2" />

      {/* subtle grid bg */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage:'linear-gradient(rgba(255,255,255,.01) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.01) 1px,transparent 1px)',
        backgroundSize:'48px 48px',
      }} />

      {/* top glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] pointer-events-none"
        style={{ background:'radial-gradient(ellipse at 50% 0%,rgba(99,102,241,.05) 0%,transparent 70%)' }} />

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-14 pb-24">

        {/* ── Header ── */}
        <motion.div {...fadeUp(0)} className="mb-10 pt-14 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-light text-white/90" style={{ fontFamily:"'DM Serif Display', serif" }}>
              Control Centre
            </h1>
            <p className="text-[12px] text-gray-600 mt-1.5">Monitor users, subscriptions, revenue, and AI feedback quality</p>
          </div>

          {/* Cash Payment Button */}
          <button
            onClick={() => navigate('/admin/cash-payment')}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl text-gray-400 text-sm transition-colors border border-white/[0.04]"
          >
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Cash Payment</span>
          </button>
        </motion.div>

        {/* ── Tab Nav with horizontal scroll on mobile ── */}
        <motion.div {...fadeUp(0.06)} className="mb-8 border-b border-white/[0.04]">
          <div className="scrollable-tabs flex items-center gap-1 pb-0">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`tab-btn flex-shrink-0 ${activeTab === t.id ? 'active' : ''}`}
              >
                {t.label}
                {activeTab === t.id && (
                  <motion.div
                    layoutId="admin-tab-line"
                    className="absolute bottom-0 left-0 right-0 h-px bg-indigo-400/60"
                    transition={{ type:'spring', bounce:.2, duration:.5 }}
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ══════ DYNAMIC TAB CONTENT ══════ */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:.2 }}>

              {/* Stats row */}
              {dashboardData && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  <StatCard label="Total Users"       value={dashboardData.totalUsers}      icon={Users}     color="blue"   delay={0.05} />
                  <StatCard label="Premium Users"     value={dashboardData.premiumUsers}    icon={Crown}     color="green"  delay={0.10} />
                  <StatCard label="Free Users"        value={dashboardData.freeUsers}       icon={Users}     color="gray"   delay={0.15} />
                  <StatCard 
                    label="Total Revenue (GHS)" value={`GHS ${dashboardData.totalTransactionsAmount?.toFixed(2) || '0.00'}`} icon={DollarSign} color="purple" delay={0.20} 
                  />
                </div>
              )}

              {/* Users by Country */}
              {dashboardData && (
                <Card delay={0.25} className="p-6 mb-6">
                  <SectionLabel icon={Globe} label="Users by Country" />
                  <div className="divide-y divide-white/[0.02]">
                    {dashboardData.usersByCountry.map((c, i) => (
                      <div key={i} className="flex items-center justify-between py-3">
                        <span className="text-sm text-gray-500">{c._id || 'Unknown'}</span>
                        <div className="flex items-center gap-3">
                          {/* mini bar */}
                          <div className="w-24 h-1 bg-white/[0.02] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500/40 rounded-full"
                              style={{ width: `${Math.min(100, (c.count / (dashboardData.totalUsers || 1)) * 100 * 3)}%` }}
                            />
                          </div>
                          <span className="text-sm text-white/70 w-6 text-right">{c.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Email Search */}
              <Card delay={0.3} className="p-6">
                <SectionLabel icon={Mail} label="Search Users by Email" />
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-5">
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="flex-1 px-4 py-3 bg-[#111] border border-white/[0.04] rounded-xl text-white/80 text-sm placeholder-gray-700 focus:outline-none focus:border-indigo-500/30 transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isLoading || !searchEmail.trim()}
                      className="px-5 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 disabled:opacity-20 text-white/80 rounded-xl text-sm transition-colors flex items-center gap-2 border border-indigo-500/20"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                      Search
                    </button>
                    {searchResults.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setSearchEmail(''); setSearchResults([]); }}
                        className="px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] text-gray-600 rounded-xl text-sm transition-colors border border-white/[0.04]"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </form>

                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity:0, y:8 }}
                      animate={{ opacity:1, y:0 }}
                      exit={{ opacity:0, y:8 }}
                      className="space-y-3"
                    >
                      <p className="text-[11px] text-gray-700">{searchResults.length} result{searchResults.length > 1 ? 's' : ''}</p>
                      {searchResults.map((user) => (
                        <div key={user._id} className="p-4 bg-[#111] rounded-xl border border-white/[0.04]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              {[['Email', user.email], ['Name', user.nickname], ['Country', user.country]].map(([k, v]) => (
                                <div key={k}>
                                  <p className="text-[10px] text-gray-700 uppercase tracking-wider mb-0.5">{k}</p>
                                  <p className="text-sm text-white/70">{v || '—'}</p>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-[10px] text-gray-700 uppercase tracking-wider mb-0.5">Subscription</p>
                                <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${
                                  user.subscription === 'premium'
                                    ? 'bg-emerald-500/5 text-emerald-400/80 border border-emerald-500/10'
                                    : 'bg-white/[0.02] text-gray-600 border border-white/[0.04]'
                                }`}>{user.subscription}</span>
                              </div>
                              {[['Joined', new Date(user.createdAt).toLocaleDateString()], ['Total Scans', user.totalScans ?? 0]].map(([k, v]) => (
                                <div key={k}>
                                  <p className="text-[10px] text-gray-700 uppercase tracking-wider mb-0.5">{k}</p>
                                  <p className="text-sm text-white/70">{v}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          )}

          {/* ══════ FEEDBACK ══════ */}
          {activeTab === 'feedback' && (
            <motion.div key="feedback" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:.2 }}>
              {feedbackLoading && !feedbackAnalytics ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-500/60 rounded-full animate-spin" />
                  <p className="text-[12px] text-gray-700">Loading analytics…</p>
                </div>
              ) : feedbackAnalytics && (
                <>
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <StatCard label="Total Feedback" value={feedbackAnalytics.totalFeedback} icon={BarChart3} color="blue"   delay={0.05} />
                    <StatCard label="Good Feedback"  value={feedbackAnalytics.goodFeedback}  icon={ThumbsUp}  color="green"  delay={0.10} />
                    <StatCard label="Bad Feedback"   value={feedbackAnalytics.badFeedback}   icon={ThumbsDown} color="red"  delay={0.15} />
                    <StatCard label="Accuracy Rate"  value={`${feedbackAnalytics.accuracyRate}%`} icon={Award} color="purple" delay={0.20} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    {/* By Input Type */}
                    <Card delay={0.25} className="p-6">
                      <SectionLabel icon={Zap} label="By Input Type" />
                      <div className="divide-y divide-white/[0.02]">
                        {feedbackAnalytics.feedbackByInputType.map((item, i) => (
                          <div key={i} className="flex items-center justify-between py-3">
                            <span className="text-sm text-gray-500 capitalize">{item._id || 'Unknown'}</span>
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="text-emerald-400/70">↑{item.good}</span>
                              <span className="text-rose-400/70">↓{item.bad}</span>
                              <span className="text-gray-600 w-12 text-right">{item.total} total</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* By Country */}
                    <Card delay={0.3} className="p-6">
                      <SectionLabel icon={Globe} label="By Country (Top 10)" />
                      <div className="divide-y divide-white/[0.02]">
                        {feedbackAnalytics.feedbackByCountry.slice(0, 10).map((item, i) => (
                          <div key={i} className="flex items-center justify-between py-3">
                            <span className="text-sm text-gray-500">{item._id || 'Unknown'}</span>
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="text-emerald-400/70">↑{item.good}</span>
                              <span className="text-rose-400/70">↓{item.bad}</span>
                              <span className="text-gray-600 w-12 text-right">{item.total} total</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    {/* Daily Trends */}
                    {feedbackAnalytics.dailyTrends?.length > 0 && (
                      <Card delay={0.35} className="p-6">
                        <SectionLabel icon={Activity} label="Daily Trends (7 Days)" />
                        <div className="divide-y divide-white/[0.02]">
                          {feedbackAnalytics.dailyTrends.map((day, i) => {
                            const rate = day.total ? Math.round((day.good / day.total) * 100) : 0;
                            return (
                              <div key={i} className="flex items-center justify-between py-3">
                                <span className="text-sm text-gray-500">
                                  {new Date(day._id).toLocaleDateString(undefined, { month:'short', day:'numeric' })}
                                </span>
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-1 bg-white/[0.02] rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500/50 rounded-full" style={{ width:`${rate}%` }} />
                                  </div>
                                  <span className="text-[11px] text-gray-600 w-8 text-right">{rate}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    )}

                    {/* Problematic Inputs */}
                    <Card delay={0.4} className="p-6">
                      <SectionLabel icon={AlertCircle} label="Problematic Inputs" />
                      {feedbackAnalytics.problematicInputs.length > 0 ? (
                        <div className="divide-y divide-white/[0.02]">
                          {feedbackAnalytics.problematicInputs.map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-3">
                              <span className="text-sm text-gray-500 italic truncate max-w-[60%]">"{item._id}"</span>
                              <span className="text-[11px] text-rose-400/70 flex-shrink-0">{item.count} reports</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-700">
                          <Sparkles className="w-5 h-5 mb-2" />
                          <p className="text-sm">No problematic inputs</p>
                        </div>
                      )}
                    </Card>
                  </div>

                  {/* Feedback List */}
                  <Card delay={0.45} className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                      <SectionLabel icon={Sparkles} label="Recent Feedback" />
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setShowFilters(p => !p)}
                          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] border transition-colors flex-1 sm:flex-none ${
                            showFilters
                              ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400/70'
                              : 'bg-white/[0.02] border-white/[0.04] text-gray-600 hover:text-gray-500'
                          }`}
                        >
                          <Filter className="w-3 h-3" />
                          Filters
                          {activeFilterCount > 0 && (
                            <span className="w-4 h-4 bg-indigo-500/20 text-indigo-400/70 text-[9px] rounded-full flex items-center justify-center">
                              {activeFilterCount}
                            </span>
                          )}
                        </button>
                        
                        <button
                          onClick={() => setShowExportModal(true)}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/70 hover:bg-emerald-500/20 transition-colors flex-1 sm:flex-none"
                        >
                          <Download className="w-3 h-3" />
                          Export Data
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {showFilters && (
                        <motion.div
                          initial={{ opacity:0, height:0 }}
                          animate={{ opacity:1, height:'auto' }}
                          exit={{ opacity:0, height:0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 pb-4 border-b border-white/[0.03]">
                            {[
                              { key:'type', label:'Type', options:[{v:'',l:'All Types'},{v:'good',l:'Good'},{v:'bad',l:'Bad'}] },
                              { key:'country', label:'Country', options:[{v:'',l:'All Countries'},...availableFilters.countries.map(c=>({v:c,l:c}))] },
                              { key:'inputType', label:'Input Type', options:[{v:'',l:'All Types'},...availableFilters.inputTypes.map(t=>({v:t,l:t}))] },
                            ].map(({ key, options }) => (
                              <select
                                key={key}
                                value={feedbackFilter[key]}
                                onChange={(e) => handleFilterChange(key, e.target.value)}
                                className="px-3 py-2.5 bg-[#111] border border-white/[0.04] rounded-xl text-white/70 text-sm focus:outline-none focus:border-indigo-500/30 transition-colors"
                              >
                                {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                              </select>
                            ))}
                          </div>
                          {activeFilterCount > 0 && (
                            <div className="flex justify-end mb-4">
                              <button onClick={handleClearFilters} className="flex items-center gap-1.5 text-[12px] text-gray-600 hover:text-gray-500 transition-colors">
                                <X className="w-3 h-3" />Clear filters
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Export Modal */}
                    <AnimatePresence>
                      {showExportModal && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                          onClick={() => setShowExportModal(false)}
                        >
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0a0a0f] border border-white/[0.04] rounded-2xl p-6 max-w-md w-full shadow-2xl"
                          >
                            <div className="flex items-center justify-between mb-5">
                              <h3 className="text-lg font-light text-white/90">Export Feedback Data</h3>
                              <button
                                onClick={() => setShowExportModal(false)}
                                className="p-1 rounded-lg hover:bg-white/[0.04] transition-colors"
                              >
                                <X className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>

                            <div className="space-y-4">
                              {/* Date Range */}
                              <div>
                                <label className="block text-[11px] text-gray-600 uppercase tracking-wider mb-2">
                                  Date Range
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <input
                                      type="date"
                                      value={exportDateRange.start}
                                      onChange={(e) => setExportDateRange({ ...exportDateRange, start: e.target.value })}
                                      className="w-full px-3 py-2 bg-[#111] border border-white/[0.04] rounded-xl text-white/70 text-sm focus:outline-none focus:border-indigo-500/30 transition-colors"
                                    />
                                    <p className="text-[10px] text-gray-700 mt-1">Start Date</p>
                                  </div>
                                  <div>
                                    <input
                                      type="date"
                                      value={exportDateRange.end}
                                      onChange={(e) => setExportDateRange({ ...exportDateRange, end: e.target.value })}
                                      className="w-full px-3 py-2 bg-[#111] border border-white/[0.04] rounded-xl text-white/70 text-sm focus:outline-none focus:border-indigo-500/30 transition-colors"
                                    />
                                    <p className="text-[10px] text-gray-700 mt-1">End Date</p>
                                  </div>
                                </div>
                              </div>

                              {/* Feedback Type Filter */}
                              <div>
                                <label className="block text-[11px] text-gray-600 uppercase tracking-wider mb-2">
                                  Feedback Type
                                </label>
                                <div className="flex gap-2">
                                  {[
                                    { value: 'all', label: 'All Types' },
                                    { value: 'good', label: 'Good Only' },
                                    { value: 'bad', label: 'Bad Only' }
                                  ].map(option => (
                                    <button
                                      key={option.value}
                                      onClick={() => setExportFeedbackType(option.value)}
                                      className={`flex-1 px-3 py-2 rounded-xl text-sm transition-colors ${
                                        exportFeedbackType === option.value
                                          ? 'bg-indigo-600/10 border border-indigo-500/20 text-white/80'
                                          : 'bg-white/[0.02] border border-white/[0.04] text-gray-600 hover:text-gray-500'
                                      }`}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Export Format */}
                              <div>
                                <label className="block text-[11px] text-gray-600 uppercase tracking-wider mb-2">
                                  Export Format
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { value: 'csv', label: 'CSV', icon: FileText, desc: 'Best for AI analysis' },
                                    { value: 'json', label: 'JSON', icon: FileJson, desc: 'Raw data' },
                                    { value: 'pdf', label: 'PDF', icon: Download, desc: 'Human readable' }
                                  ].map(option => (
                                    <button
                                      key={option.value}
                                      onClick={() => setExportFormat(option.value)}
                                      className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                                        exportFormat === option.value
                                          ? 'bg-indigo-600/10 border border-indigo-500/20'
                                          : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04]'
                                      }`}
                                    >
                                      <option.icon className={`w-4 h-4 ${
                                        exportFormat === option.value ? 'text-indigo-400/70' : 'text-gray-600'
                                      }`} />
                                      <span className={`text-[11px] font-medium ${
                                        exportFormat === option.value ? 'text-white/70' : 'text-gray-600'
                                      }`}>{option.label}</span>
                                      {exportFormat === option.value && (
                                        <span className="text-[9px] text-gray-700 mt-0.5">{option.desc}</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-3 pt-4">
                                <button
                                  onClick={() => setShowExportModal(false)}
                                  className="flex-1 px-4 py-2.5 bg-white/[0.02] hover:bg-white/[0.04] text-gray-600 rounded-xl text-sm transition-colors border border-white/[0.04]"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleExportFeedback}
                                  disabled={exportLoading || !exportDateRange.start || !exportDateRange.end}
                                  className="flex-1 px-4 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 disabled:opacity-20 disabled:cursor-not-allowed text-white/70 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-indigo-500/20"
                                >
                                  {exportLoading ? (
                                    <><RefreshCw className="w-4 h-4 animate-spin" /> Exporting...</>
                                  ) : (
                                    <><Download className="w-4 h-4" /> Export</>
                                  )}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>



                    {feedbackLoading ? (
                      <div className="flex justify-center py-10">
                        <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-500/60 rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2.5">
                          {feedbackList.map((fb) => (
                            <div key={fb._id} className="p-4 bg-[#111] rounded-xl border border-white/[0.04] hover:border-white/5 transition-colors">
                              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm text-white/80 font-medium truncate">{fb.originalInput}</p>
                                  <p className="text-[11px] text-gray-700 mt-0.5">
                                    {fb.userId?.email || 'Anonymous'}
                                    {fb.userCountry && <> · {fb.userCountry}</>}
                                    {fb.inputType && <> · {fb.inputType}</>}
                                  </p>
                                </div>
                                <span className={`flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                                  fb.feedbackType === 'good'
                                    ? 'bg-emerald-500/5 text-emerald-400/70 border-emerald-500/10'
                                    : 'bg-rose-500/5 text-rose-400/70 border-rose-500/10'
                                }`}>
                                  {fb.feedbackType === 'good' ? '↑ Good' : '↓ Bad'}
                                </span>
                              </div>
                              {fb.aiResponse?.reason && (
                                <p className="text-[12px] text-gray-600 leading-relaxed line-clamp-2">
                                  {fb.aiResponse.reason.substring(0, 160)}…
                                </p>
                              )}
                              <p className="text-[11px] text-gray-800 mt-2">
                                {new Date(fb.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>

                        {feedbackTotalPages > 1 && (
                          <div className="flex items-center justify-center gap-3 mt-6">
                            <button
                              onClick={() => setFeedbackPage(p => Math.max(1, p - 1))}
                              disabled={feedbackPage === 1}
                              className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] disabled:opacity-20 transition-colors border border-white/[0.04]"
                            >
                              <ChevronLeft className="w-4 h-4 text-gray-500" />
                            </button>
                            <span className="text-[12px] text-gray-600">
                              {feedbackPage} / {feedbackTotalPages}
                            </span>
                            <button
                              onClick={() => setFeedbackPage(p => Math.min(feedbackTotalPages, p + 1))}
                              disabled={feedbackPage === feedbackTotalPages}
                              className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] disabled:opacity-20 transition-colors border border-white/[0.04]"
                            >
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </Card>
                </>
              )}
            </motion.div>
          )}

          {/* ══════ ACTIVITY ══════ */}
          {activeTab === 'activity' && (
            <motion.div key="activity" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:.2 }}>

              {/* Time range */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[11px] text-gray-600 uppercase tracking-widest">Range</span>
                <div className="flex gap-1.5">
                  {[['10m','Live'],['24h','24h'],['7d','7d'],['30d','30d']].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setActiveTimeRange(val)}
                      className={`px-3.5 py-1.5 rounded-xl text-[12px] border transition-colors ${
                        activeTimeRange === val
                          ? 'bg-indigo-600/10 border-indigo-500/20 text-white/80'
                          : 'bg-white/[0.02] border-white/[0.04] text-gray-600 hover:text-gray-500'
                      }`}
                    >
                      {label}
                      {val === '10m' && activeTimeRange === '10m' && (
                        <span className="ml-1.5 inline-flex w-1.5 h-1.5 bg-emerald-400/70 rounded-full animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Card delay={0.05} className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <SectionLabel icon={Activity} label={`Active Users · ${activeUsers.length}`} />
                  {activeTimeRange === '10m' && (
                    <span className="text-[11px] text-emerald-400/70 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400/70 rounded-full animate-pulse" />
                      Live · refreshes every 30s
                    </span>
                  )}
                </div>

                {activeUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-700">
                    <Users className="w-6 h-6 mb-1" />
                    <p className="text-sm">No active users in this window</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.02] max-h-[520px] overflow-y-auto">
                    {activeUsers.map((user, i) => (
                      <motion.div
                        key={user._id}
                        initial={{ opacity:0, x:-6 }}
                        animate={{ opacity:1, x:0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center justify-between py-3.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-gray-400 truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${
                            user.subscription === 'premium'
                              ? 'bg-emerald-500/5 text-emerald-400/70 border-emerald-500/10'
                              : 'bg-white/[0.02] text-gray-600 border-white/[0.04]'
                          }`}>
                            {user.subscription}
                          </span>
                          <span className="text-[11px] text-gray-700 hidden sm:block">
                            {new Date(user.lastActiveAt).toLocaleString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* ══════ REVENUE ══════ */}
          {activeTab === 'revenue' && (
            <motion.div key="revenue" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:.2 }}>
              
              {/* Date selector */}
              <Card delay={0.05} className="p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <SectionLabel icon={Calendar} label="Revenue Period" />
                  <div className="flex gap-3 overflow-x-auto pb-1 sm:pb-0 scrollable-tabs">
                    <select 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-4 py-2.5 bg-[#111] border border-white/[0.04] rounded-xl text-white/70 text-sm focus:outline-none focus:border-indigo-500/30 transition-colors min-w-[100px] flex-shrink-0"
                    >
                      {yearOptions().map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <select 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-4 py-2.5 bg-[#111] border border-white/[0.04] rounded-xl text-white/70 text-sm focus:outline-none focus:border-indigo-500/30 transition-colors min-w-[140px] flex-shrink-0"
                    >
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i+1} value={i+1}>
                          {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={fetchMonthlyRevenue}
                      disabled={revenueLoading}
                      className="px-5 py-2.5 bg-indigo-600/5 hover:bg-indigo-600/10 disabled:opacity-20 text-white/70 rounded-xl text-sm transition-colors flex items-center gap-2 border border-indigo-500/20 flex-shrink-0"
                    >
                      {revenueLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Refresh
                    </button>
                  </div>
                </div>
              </Card>

              {/* Revenue summary cards */}
              {revenueLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-500/60 rounded-full animate-spin" />
                  <p className="text-[12px] text-gray-700">Loading revenue data…</p>
                </div>
              ) : revenueData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <StatCard 
                      label="Total Revenue" 
                      value={`GHS ${revenueData.summary.totalRevenue?.toFixed(2) || '0.00'}`} 
                      icon={DollarSign} 
                      color="green" 
                      delay={0.1} 
                    />
                    <StatCard 
                      label="Total Transactions" 
                      value={revenueData.summary.totalTransactions || 0} 
                      icon={CreditCard} 
                      color="blue" 
                      delay={0.15} 
                    />
                    <StatCard 
                      label="Period" 
                      value={`${revenueData.period.monthName} ${revenueData.period.year}`} 
                      icon={Calendar} 
                      color="amber" 
                      delay={0.2} 
                    />
                  </div>

                  {/* Currency breakdown */}
                  {Object.keys(revenueData.summary.currencies || {}).length > 0 && (
                    <Card delay={0.25} className="p-6 mb-6">
                      <SectionLabel icon={Globe} label="Revenue by Currency" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(revenueData.summary.currencies).map(([currency, data], i) => (
                          <div key={currency} className="p-4 bg-[#111] rounded-xl border border-white/[0.04]">
                            <p className="text-[10px] text-gray-700 uppercase mb-1">{currency}</p>
                            <p className="text-xl font-light text-white/80 mb-1">
                              {currency === 'GHS' ? 'GHS ' : ''}{data.amount?.toFixed(2) || '0.00'}
                            </p>
                            <p className="text-[11px] text-gray-600">{data.count || 0} transactions</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Transactions Table - UPDATED FORMAT */}
                  <Card delay={0.3} className="p-6">
                    <SectionLabel icon={BarChart3} label="Transaction History" />
                    
                    {revenueData.transactions && revenueData.transactions.length > 0 ? (
                      <>
                        {/* Desktop/Tablet View */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-white/[0.03]">
                                <th className="text-left py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                                <th className="text-left py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                                <th className="text-right py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                                <th className="text-left py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Payment Type</th>
                                <th className="text-left py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Expiry Date</th>
                                <th className="text-left py-3 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                              {paginatedTransactions.map((tx, index) => (
                                <tr key={tx._id || index} className="hover:bg-white/[0.01] transition-colors">
                                  <td className="py-4 text-sm">
                                    <div className="flex flex-col">
                                      <span className="text-white/70">{new Date(tx.paymentDate).toLocaleDateString()}</span>
                                      <span className="text-[10px] text-gray-600">
                                        {new Date(tx.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-4 text-sm text-gray-400 max-w-[150px] truncate">
                                    {tx.userEmail || 'N/A'}
                                  </td>
                                  <td className="py-4 text-right text-sm text-green-400/80 font-medium">
                                    GHS {tx.amount?.toFixed(2) || '0.00'}
                                  </td>
                                  <td className="py-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-white/50">
                                        {getPaymentTypeIcon(tx.paymentMethod)}
                                      </span>
                                      <span className="text-sm capitalize text-gray-500">
                                        {tx.paymentMethod?.replace('_', ' ') || 'N/A'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-4 text-sm text-gray-500">
                                    {tx.endDate ? new Date(tx.endDate).toLocaleDateString() : '—'}
                                  </td>
                                  <td className="py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                                      tx.status === 'active' || tx.status === 'success'
                                        ? 'bg-emerald-500/5 text-emerald-400/70 border-emerald-500/10'
                                        : tx.status === 'failed' || tx.status === 'expired'
                                        ? 'bg-rose-500/5 text-rose-400/70 border-rose-500/10'
                                        : 'bg-amber-500/5 text-amber-400/70 border-amber-500/10'
                                    }`}>
                                      {tx.status === 'active' || tx.status === 'success' ? (
                                        <><CheckCircle className="w-3 h-3" /> Success</>
                                      ) : tx.status === 'failed' ? (
                                        <><XCircle className="w-3 h-3" /> Failed</>
                                      ) : (
                                        <><MoreHorizontal className="w-3 h-3" /> {tx.status}</>
                                      )}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile View - Card Layout */}
                        <div className="md:hidden space-y-3">
                          {paginatedTransactions.map((tx, index) => (
                            <div key={tx._id || index} className="p-4 bg-[#111] rounded-xl border border-white/[0.04] space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm text-white/70 font-medium">{tx.userEmail || 'N/A'}</p>
                                  <p className="text-[10px] text-gray-600 mt-0.5">
                                    {new Date(tx.paymentDate).toLocaleString()}
                                  </p>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-semibold border ${
                                  tx.status === 'active' || tx.status === 'success'
                                    ? 'bg-emerald-500/5 text-emerald-400/70 border-emerald-500/10'
                                    : tx.status === 'failed' || tx.status === 'expired'
                                    ? 'bg-rose-500/5 text-rose-400/70 border-rose-500/10'
                                    : 'bg-amber-500/5 text-amber-400/70 border-amber-500/10'
                                }`}>
                                  {tx.status === 'active' || tx.status === 'success' ? 'Success' : tx.status}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="text-[9px] text-gray-700 uppercase">Amount</p>
                                  <p className="text-green-400/80 font-medium">GHS {tx.amount?.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-gray-700 uppercase">Payment Type</p>
                                  <p className="capitalize text-gray-500">{tx.paymentMethod?.replace('_', ' ')}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-gray-700 uppercase">Expiry</p>
                                  <p className="text-gray-500">{tx.endDate ? new Date(tx.endDate).toLocaleDateString() : '—'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination */}
                        {totalTransactionPages > 1 && (
                          <div className="flex items-center justify-center gap-3 mt-6">
                            <button
                              onClick={() => setRevenuePage(p => Math.max(1, p - 1))}
                              disabled={revenuePage === 1}
                              className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] disabled:opacity-20 transition-colors border border-white/[0.04]"
                            >
                              <ChevronLeft className="w-4 h-4 text-gray-500" />
                            </button>
                            <span className="text-[12px] text-gray-600">
                              {revenuePage} / {totalTransactionPages}
                            </span>
                            <button
                              onClick={() => setRevenuePage(p => Math.min(totalTransactionPages, p + 1))}
                              disabled={revenuePage === totalTransactionPages}
                              className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] disabled:opacity-20 transition-colors border border-white/[0.04]"
                            >
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-700">
                        <DollarSign className="w-8 h-8 mb-3 opacity-30" />
                        <p className="text-sm">No transactions for this period</p>
                        <p className="text-[11px] mt-1">Try selecting a different month</p>
                      </div>
                    )}
                  </Card>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-700">
                  <DollarSign className="w-8 h-8 mb-3 opacity-30" />
                  <p className="text-sm">No revenue data available</p>
                  <p className="text-[11px] mt-1">Select a period to view revenue</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;