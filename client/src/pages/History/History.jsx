// client/src/pages/History/History.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { useToast } from '../../hooks/useToast';
import { apiFetch } from '../../services/api';
import {
  Clock,
  Search,
  Filter,
  X,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Utensils,
  Calendar,
  ArrowUpDown,
  Loader,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Trash2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function for conditional classes
const cn = (...inputs) => twMerge(clsx(inputs));

/* ─── status meta ─────────────────────────────────────────────── */
const statusMeta = {
  safe: { 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10', 
    border: 'border-emerald-500/20', 
    dot: 'bg-emerald-400', 
    icon: CheckCircle,
    label: 'Safe'
  },
  cautious: { 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/20', 
    dot: 'bg-amber-400', 
    icon: AlertTriangle,
    label: 'Cautious'
  },
  unsafe: { 
    color: 'text-rose-400', 
    bg: 'bg-rose-500/10', 
    border: 'border-rose-500/20', 
    dot: 'bg-rose-400', 
    icon: XCircle,
    label: 'Unsafe'
  },
};

const getMeta = (s) => statusMeta[s?.toLowerCase()] ?? statusMeta.safe;

/* ─── Skeleton Loader ─────────────────────────────────────────── */
const HistorySkeleton = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse bg-[#0d0d0d] rounded-xl">
        <div className="w-2 h-2 rounded-full bg-white/5 flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="w-1/3 h-3 bg-white/5 rounded" />
          <div className="w-1/2 h-2.5 bg-white/[0.03] rounded" />
        </div>
        <div className="w-12 h-5 bg-white/5 rounded-full" />
      </div>
    ))}
  </div>
);

/* ─── Empty State ─────────────────────────────────────────────── */
const EmptyState = ({ hasFilters, onClearFilters, onStartScanning }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
  >
    <div className="w-20 h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
      {hasFilters ? (
        <Filter className="w-10 h-10 text-gray-700" />
      ) : (
        <Utensils className="w-10 h-10 text-gray-700" />
      )}
    </div>
    <h3 className="text-lg font-medium text-white mb-2">
      {hasFilters ? 'No matching scans' : 'No items yet'}
    </h3>
    <p className="text-sm text-gray-600 max-w-sm mb-4">
      {hasFilters 
        ? 'Try adjusting your filters or search query to find what you\'re looking for.'
        : 'Start analyzing meals to build your health history.'
      }
    </p>
    {hasFilters && (
      <button
        onClick={onClearFilters}
        className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl text-sm border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
      >
        Clear filters
      </button>
    )}
    {!hasFilters && onStartScanning && (
      <button
        onClick={onStartScanning}
        className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl text-sm border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
      >
        Start
      </button>
    )}
  </motion.div>
);

/* ─── Action Sheet for Mobile ─────────────────────────────────── */
const ActionSheet = ({ isOpen, onClose, item, onDelete, formatDate }) => {
  if (!isOpen || !item) return null;
  
  const meta = getMeta(item.status);
  
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#0f0f0f] rounded-t-2xl border-t border-white/[0.07] overflow-hidden">
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>
          
          {/* Item Preview */}
          <div className="px-4 py-3 border-b border-white/[0.05]">
            <p className="text-xs text-gray-600 mb-1">Selected item</p>
            <p className="text-white font-medium">{item.foodName}</p>
            <p className="text-xs text-gray-700 mt-1">
              {formatDate(item.scannedAt)}
            </p>
          </div>
          
          {/* Actions */}
          <div className="py-2">
            <button
              onClick={() => {
                onDelete(item.id);
                onClose();
              }}
              className="w-full px-4 py-4 text-left text-rose-400 hover:bg-white/[0.03] transition-colors flex items-center gap-3"
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">Delete</span>
            </button>
            
            <button
              onClick={onClose}
              className="w-full px-4 py-4 text-left text-gray-500 hover:bg-white/[0.03] transition-colors flex items-center gap-3"
            >
              <X className="w-5 h-5" />
              <span>Cancel</span>
            </button>
          </div>
          
          {/* Safe Area for iOS */}
          <div className="h-safe-bottom" />
        </div>
      </motion.div>
    </>
  );
};

/* ─── Desktop Batch Delete Modal ─────────────────────────────────── */
const BatchDeleteModal = ({ isOpen, onClose, onConfirm, isDeleting }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  if (!isOpen) return null;
  
  const handleConfirm = () => {
    if (!startDate || !endDate) {
      return;
    }
    onConfirm(startDate, endDate);
  };
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-[#0f0f0f] border border-white/[0.07] rounded-2xl w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white mb-2">Delete scans by date range</h3>
            <p className="text-sm text-gray-600 mb-6">
              Select a date range to delete multiple scans at once.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 bg-[#111] border border-white/[0.07] rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-[#111] border border-white/[0.07] rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white/[0.05] rounded-xl text-sm text-gray-400 hover:bg-white/[0.08] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!startDate || !endDate || isDeleting}
                className="flex-1 px-4 py-2 bg-rose-500/20 text-rose-400 rounded-xl text-sm hover:bg-rose-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

/* ─── Modal Content Component ─────────────────────────────────── */
const ModalContent = ({ result, meta, StatusIcon, userFeedback, isSubmitting, isLoadingFeedback, handleFeedback, closeModal, isMobile }) => {
  const showTriggerTag = result.inputType === 'SPECIAL_KEY' || result.inputType === 'RESTAURANT_NAME';
  
  const getTriggerDisplay = () => {
    if (!result.triggerValue) return '';
    return result.triggerValue.charAt(0).toUpperCase() + result.triggerValue.slice(1);
  };
  
  const triggerDisplay = getTriggerDisplay();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="pt-0">
      <div className="flex items-start justify-between mb-3 pt-2 ">
        <div className="flex flex-col">
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
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full ${meta.color} ${meta.bg} ${meta.border}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {result.status?.toUpperCase()}
          </span>
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
        {[
          ['Best time', result.bestTime || result.bestTimeToEat], 
          ['Portion', result.maxServing || result.recommendedPortion]
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3.5 lg:p-4">
            <p className="text-[10px] text-gray-700 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm lg:text-base text-white">{value || 'N/A'}</p>
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
              <span key={i} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[11px] lg:text-xs border border-indigo-500/20">
                {alt}
              </span>
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

/* ═══════════════════════════════════════════════════════════════
   HISTORY PAGE WITH MODAL
══════════════════════════════════════════════════════════════ */
const History = () => {
  const { showError, showSuccess, showInfo } = useToast();

  // State
  const [scans, setScans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal states
  const [selectedScan, setSelectedScan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Feedback states
  const [userFeedback, setUserFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Delete-related states
  const [touchTimer, setTouchTimer] = useState(null);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [undoTimeout, setUndoTimeout] = useState(null);
  const [deletedItem, setDeletedItem] = useState(null);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  
  // Refs
  const observerTarget = useRef(null);
  const isFetchingRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const lastFiltersRef = useRef({ searchQuery: '', selectedStatus: null, sortOrder: 'desc' });
  
  // Modal drag refs
  const sheetY = useMotionValue(0);
  const dragStartY = useRef(0);
  const isDraggingSheet = useRef(false);
  const handleRef = useRef(null);

  // Fetch existing feedback when modal opens
  useEffect(() => {
    if (isModalOpen && selectedScan?.id) {
      fetchExistingFeedback(selectedScan.id);
    }
  }, [isModalOpen, selectedScan?.id]);

  const fetchExistingFeedback = async (scanId) => {
    try {
      setIsLoadingFeedback(true);
      const data = await apiFetch(`/feedback/status/${scanId}`);      
      if (data.success && data.hasFeedback) {
        setUserFeedback(data.feedbackType);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  // Handle window resize for mobile detection
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ─── fetch scans with filters ───────────────────────────────── */
  const fetchScans = useCallback(async (pageNum = 1, append = false) => {
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    const loadingSetter = append ? setIsLoadingMore : setIsLoading;
    loadingSetter(true);

    try {
      const params = new URLSearchParams();
      params.append('page', pageNum);
      params.append('limit', 20);
      if (searchQuery) params.append('search', searchQuery);
      if (selectedStatus) params.append('status', selectedStatus);
      params.append('sort', sortOrder);

      const data= await apiFetch(`/scans/history?${params.toString()}`);
      
      
      if (data.success) {
        const newScans = data.scans || [];
        
        if (append) {
          setScans(prev => [...prev, ...newScans]);
        } else {
          setScans(newScans);
        }
        
        setHasMore(data.hasMore || false);
        setTotalCount(data.total || newScans.length);
        lastFiltersRef.current = { searchQuery, selectedStatus, sortOrder };
      } else {
        showError(data.error || 'Failed to load history');
      }
    } catch (error) {
      console.error('Error fetching scans:', error);
      showError('Failed to load scan history');
    } finally {
      loadingSetter(false);
      isFetchingRef.current = false;
    }
  }, [searchQuery, selectedStatus, sortOrder, showError]);

  /* ─── load more scans ───────────────────────────────────────── */
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoading || isFetchingRef.current) return;
    const nextPage = Math.floor(scans.length / 20) + 1;
    fetchScans(nextPage, true);
  }, [hasMore, isLoadingMore, isLoading, scans.length, fetchScans]);

  /* ─── refresh scans ─────────────────────────────────────────── */
  const refreshScans = useCallback(() => {
    setIsRefreshing(true);
    setScans([]);
    setHasMore(true);
    fetchScans(1, false).finally(() => {
      setIsRefreshing(false);
    });
  }, [fetchScans]);

  /* ─── Initial load ──────────────────────────────────────────── */
  useEffect(() => {
    fetchScans(1, false);
  }, []);

  /* ─── Handle filter changes ─────────────────────────────────── */
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    
    const lastFilters = lastFiltersRef.current;
    const hasSearchChanged = lastFilters.searchQuery !== searchQuery;
    const hasStatusChanged = lastFilters.selectedStatus !== selectedStatus;
    const hasSortChanged = lastFilters.sortOrder !== sortOrder;
    
    if (hasSearchChanged || hasStatusChanged || hasSortChanged) {
      setScans([]);
      setHasMore(true);
      fetchScans(1, false);
    }
  }, [searchQuery, selectedStatus, sortOrder, fetchScans]);

  /* ─── Infinite scroll observer ──────────────────────────────── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading && !isFetchingRef.current) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, isLoadingMore, isLoading, loadMore]);

  /* ─── Delete Functions ───────────────────────────────────────── */
  const deleteScan = useCallback(async (scanId, showUndo = true) => {
    try {
      const data = await apiFetch(`/scans/${scanId}`, {
        method: 'DELETE'      });
      
      if (data.success) {
        // Store the deleted item for undo
        const deletedScan = scans.find(s => s.id === scanId);
        
        // Remove from local state
        setScans(prev => prev.filter(scan => scan.id !== scanId));
        setTotalCount(prev => prev - 1);
        
        if (showUndo && deletedScan) {
          // Show toast with undo button
          showInfo('Item deleted', {
            action: {
              label: 'Undo',
              onClick: () => {
                // Restore the deleted item
                setScans(prev => {
                  // Try to restore at original position
                  const newScans = [...prev];
                  const originalIndex = scans.findIndex(s => s.id === scanId);
                  if (originalIndex >= 0 && originalIndex < newScans.length) {
                    newScans.splice(originalIndex, 0, deletedScan);
                  } else {
                    newScans.unshift(deletedScan);
                  }
                  return newScans;
                });
                setTotalCount(prev => prev + 1);
                clearTimeout(undoTimeout);
                showInfo('Item restored');
              }
            },
            autoClose: 5000
          });
          
          // Auto-cancel undo option after 5 seconds
          const timeout = setTimeout(() => {
            setDeletedItem(null);
          }, 5000);
          setUndoTimeout(timeout);
        } else {
          showSuccess('Item deleted');
        }
        
        return true;
      } else {
        showError(data.error || 'Failed to delete');
        return false;
      }
    } catch (error) {
      console.error('Delete error:', error);
      showError('Failed to delete item');
      return false;
    }
  }, [scans, showSuccess, showError, showInfo, undoTimeout]);

  const handleBatchDelete = useCallback(async (startDate, endDate) => {
    if (!startDate || !endDate) {
      showError('Please select both start and end dates');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      showError('Start date must be before end date');
      return;
    }
    
    setIsDeletingBatch(true);
    
    try {
      const data = await apiFetch('/scans/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ startDate, endDate })
      });
      
      if (data.success) {
        showSuccess(`Deleted ${data.deletedCount} items`);
        refreshScans();
        setShowBatchDeleteModal(false);
      } else {
        showError(data.error || 'Failed to delete items');
      }
    } catch (error) {
      console.error('Batch delete error:', error);
      showError('Failed to delete items');
    } finally {
      setIsDeletingBatch(false);
    }
  }, [showSuccess, showError, refreshScans]);

  /* ─── Long Press Handlers ───────────────────────────────────── */
  const handleTouchStart = useCallback((e, scan) => {
    // Prevent if already showing action sheet
    if (isActionSheetOpen) return;
    
    // Clear any existing timer
    if (touchTimer) clearTimeout(touchTimer);
    
    // Store start position to detect scroll
    const startY = e.touches[0].clientY;
    
    const timer = setTimeout(() => {
      // Trigger haptic feedback if available
      if (window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      
      setItemToDelete(scan);
      setIsActionSheetOpen(true);
    }, 500);
    
    setTouchTimer(timer);
    
    // Store start position on the element for scroll detection
    e.currentTarget.dataset.startY = startY;
  }, [touchTimer, isActionSheetOpen]);

  const handleTouchMove = useCallback((e) => {
    if (!touchTimer) return;
    
    // If user scrolled significantly, cancel long press
    const currentY = e.touches[0].clientY;
    const startY = parseFloat(e.currentTarget.dataset.startY || 0);
    const scrollDelta = Math.abs(currentY - startY);
    
    if (scrollDelta > 10) {
      clearTimeout(touchTimer);
      setTouchTimer(null);
    }
  }, [touchTimer]);

  const handleTouchEnd = useCallback(() => {
    if (touchTimer) {
      clearTimeout(touchTimer);
      setTouchTimer(null);
    }
  }, [touchTimer]);

  /* ─── Modal handlers ────────────────────────────────────────── */
  const openModal = (scan) => {
    setSelectedScan(scan);
    setIsModalOpen(true);
    setUserFeedback(null);
    setIsSubmitting(false);
  };

  const closeModal = useCallback(() => {
    animate(sheetY, 0, { duration: 0 });
    setIsModalOpen(false);
    setSelectedScan(null);
    setUserFeedback(null);
    setIsSubmitting(false);
  }, [sheetY]);

  const handleFeedback = async (feedbackType) => {
    if (userFeedback || isSubmitting) return;
    if (!selectedScan?.id) return;
    
    setIsSubmitting(true);
    
    try {
      const data= await apiFetch('/feedback/submit', {
        method: 'POST',
        body: JSON.stringify({ scanId: selectedScan.id, feedbackType }),
      });
      
      
      
      if ( data.success) {
        setUserFeedback(feedbackType);
        showSuccess(feedbackType === 'good' ? 'Thanks for your feedback!' : 'Feedback recorded');
      } else {
        if (data.alreadyExists) {
          showError('You have already submitted feedback for this recommendation');
          fetchExistingFeedback(selectedScan.id);
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

  /* ─── Modal drag handlers ───────────────────────────────────── */
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

  /* ─── clear all filters ──────────────────────────────────────── */
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatus(null);
    setSortOrder('desc');
  };

  /* ─── format date with proper timezone handling ───────────────── */
  const formatDate = (dateString) => {
    // Parse the date as UTC and convert to local timezone
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const scanDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Format time in local timezone
    const formatTime = (d) => {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    if (scanDate.getTime() === today.getTime()) {
      return `Today at ${formatTime(date)}`;
    } else if (scanDate.getTime() === yesterday.getTime()) {
      return `Yesterday at ${formatTime(date)}`;
    } else if (today - scanDate < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Status filter options
  const statusFilters = [
    { value: null, label: 'All', color: 'gray' },
    { value: 'safe', label: 'Safe', color: 'emerald' },
    { value: 'cautious', label: 'Cautious', color: 'amber' },
    { value: 'unsafe', label: 'Unsafe', color: 'rose' }
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Serif+Display:ital@0;1&display=swap');
        
        #grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        
        .serif {
          font-family: 'DM Serif Display', Georgia, serif;
        }
        
        .scan-card {
          transition: all 0.2s ease;
        }
        
        .scan-card:hover {
          background: rgba(255, 255, 255, 0.03);
          transform: translateX(4px);
        }
        
        ::-webkit-scrollbar {
          width: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.06);
          border-radius: 99px;
        }
        
        .h-safe-bottom {
          height: env(safe-area-inset-bottom);
        }
      `}</style>

      <div id="grain" />
      
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <div className="relative min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8">
            
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="serif text-3xl sm:text-4xl text-white mb-2">
                    History
                  </h1>
                  <p className="text-sm text-gray-600">
                    {totalCount > 0 
                      ? `${totalCount} item${totalCount !== 1 ? 's' : ''} `
                      : 'Track your nutritional journey'
                    }
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isMobile && (
                    <button
                      onClick={() => setShowBatchDeleteModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 rounded-xl text-sm text-rose-400 hover:bg-rose-500/20 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={refreshScans}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Search and Filter Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-6"
            >
              <div className="flex flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by food name, restaurant or special key..."
                    className="w-full pl-10 pr-4 py-3 bg-[#111] border border-white/[0.07] rounded-xl text-sm text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-gray-700 hover:text-gray-500" />
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-center px-3 py-3 bg-[#111] border border-white/[0.07] rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <Filter className="w-4 h-4" />
                </button>
                
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-[#111] border border-white/[0.07] rounded-xl p-1">
                    {statusFilters.map((filter) => (
                      <button
                        key={filter.value || 'all'}
                        onClick={() => setSelectedStatus(filter.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedStatus === filter.value
                            ? `bg-${filter.color}-500/20 text-${filter.color}-400`
                            : 'text-gray-600 hover:text-gray-400'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111] border border-white/[0.07] rounded-xl text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="sm:hidden mt-3 space-y-3 overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-2">
                      {statusFilters.map((filter) => (
                        <button
                          key={filter.value || 'all'}
                          onClick={() => setSelectedStatus(filter.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedStatus === filter.value
                              ? `bg-${filter.color}-500/20 text-${filter.color}-400 border border-${filter.color}-500/20`
                              : 'bg-[#111] text-gray-600 border border-white/[0.07]'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className="flex items-center justify-between w-full px-4 py-2.5 bg-[#111] border border-white/[0.07] rounded-xl text-sm text-gray-400"
                    >
                      <span>Sort by date</span>
                      <div className="flex items-center gap-1">
                        <span>{sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}</span>
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </button>
                    
                    {(selectedStatus || sortOrder !== 'desc') && (
                      <button onClick={clearFilters} className="w-full py-2.5 text-center text-xs text-indigo-400">
                        Clear all filters
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* History List */}
            <div className="flex-1">
              {isLoading && scans.length === 0 ? (
                <HistorySkeleton />
              ) : scans.length === 0 ? (
                <EmptyState 
                  hasFilters={!!(selectedStatus || searchQuery)}
                  onClearFilters={clearFilters}
                  onStartScanning={() => window.location.href = '/'}
                />
              ) : (
                <div className={isMobile ? "space-y-0" : "space-y-2"}>
                  {scans.map((scan, index) => {
                    const meta = getMeta(scan.status);
                    const StatusIcon = meta.icon;
                    
                    return (
                      <React.Fragment key={scan.id}>
                        <motion.button
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(index * 0.02, 0.5) }}
                          onClick={() => openModal(scan)}
                          onTouchStart={isMobile ? (e) => handleTouchStart(e, scan) : undefined}
                          onTouchEnd={isMobile ? handleTouchEnd : undefined}
                          onTouchMove={isMobile ? handleTouchMove : undefined}
                          onContextMenu={(e) => {
                            if (isMobile) {
                              e.preventDefault();
                              return false;
                            }
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 transition-all text-left",
                            isMobile 
                              ? "py-2.5 px-3 active:bg-white/[0.02] cursor-pointer" 
                              : "px-5 py-4 bg-transparent rounded-xl hover:bg-white/[0.03] hover:translate-x-1 cursor-pointer"
                          )}
                          style={isMobile ? { touchAction: 'pan-y' } : undefined}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Status dot - both mobile and desktop */}
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
                            
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-medium truncate",
                                isMobile ? "text-sm text-white/90" : "text-sm text-white"
                              )}>
                                {scan.foodName}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span>{formatDate(scan.scannedAt)}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Status badge - desktop only */}
                          {!isMobile && (
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${meta.color} ${meta.bg} ${meta.border}`}>
                              <StatusIcon className="w-3 h-3" />
                              <span className="text-[10px] font-semibold">{meta.label}</span>
                            </div>
                          )}
                          
                          {/* Chevron - desktop only */}
                          {!isMobile && (
                            <ChevronRight className="w-4 h-4 text-gray-800 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                          )}
                        </motion.button>
                        
                        {/* Divider for mobile */}
                        {isMobile && index < scans.length - 1 && (
                          <div className="border-b border-white/[0.03] mx-3" />
                        )}
                      </React.Fragment>
                    );
                  })}
                  
                  {isLoadingMore && (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="w-5 h-5 text-indigo-400 animate-spin" />
                      <span className="ml-2 text-xs text-gray-700">Loading more...</span>
                    </div>
                  )}
                  
                  <div ref={observerTarget} className="h-4" />
                  
                  {!hasMore && scans.length > 0 && (
                    <div className="text-center py-8">
                      <p className="text-xs text-gray-700">✨ You've seen all {totalCount} scans</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Modal */}
      <AnimatePresence>
        {isModalOpen && selectedScan && !isMobile && (() => {
          const meta = getMeta(selectedScan.status);
          const StatusIcon = meta.icon;
          
          return (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={closeModal}
              />
              <motion.div
                key="desktop"
                initial={{ opacity: 0, scale: .96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: .96, y: 8 }}
                transition={{ duration: .2, ease: [.16, 1, .3, 1] }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={closeModal}
              >
                <div
                  className="bg-[#0f0f0f] border border-white/[0.07] rounded-2xl w-full max-w-lg lg:max-w-2xl xl:max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 lg:p-5 pt-0">
                    <ModalContent
                      result={selectedScan}
                      meta={meta}
                      StatusIcon={StatusIcon}
                      userFeedback={userFeedback}
                      isSubmitting={isSubmitting}
                      isLoadingFeedback={isLoadingFeedback}
                      handleFeedback={handleFeedback}
                      closeModal={closeModal}
                      isMobile={false}
                    />
                  </div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* Mobile Bottom Sheet Modal */}
      <AnimatePresence>
        {isModalOpen && selectedScan && isMobile && (() => {
          const meta = getMeta(selectedScan.status);
          const StatusIcon = meta.icon;
          
          return (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={closeModal}
              />
              <motion.div
                key="sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 36, mass: .8 }}
                style={{ y: sheetY }}
                className="fixed bottom-0 left-0 right-0 z-50 flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-[#0f0f0f] border-t border-white/[0.07] rounded-t-2xl shadow-[0_-24px_60px_rgba(0,0,0,0.7)] max-h-[88vh] flex flex-col overflow-hidden">
                  <div
                    ref={handleRef}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    className="flex-shrink-0 flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
                    style={{ touchAction: 'none' }}
                  >
                    <div className="w-9 h-1 bg-white/10 rounded-full" />
                  </div>
                  <div className="overflow-y-auto flex-1 overscroll-contain px-4 pt-0 pb-6">
                    <ModalContent
                      result={selectedScan}
                      meta={meta}
                      StatusIcon={StatusIcon}
                      userFeedback={userFeedback}
                      isSubmitting={isSubmitting}
                      isLoadingFeedback={isLoadingFeedback}
                      handleFeedback={handleFeedback}
                      closeModal={closeModal}
                      isMobile={true}
                    />
                  </div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* Action Sheet for Mobile Deletion */}
      <AnimatePresence>
        {isActionSheetOpen && itemToDelete && (
          <ActionSheet
            isOpen={isActionSheetOpen}
            onClose={() => {
              setIsActionSheetOpen(false);
              setItemToDelete(null);
            }}
            item={itemToDelete}
            onDelete={(scanId) => deleteScan(scanId, true)}
            formatDate={formatDate}
          />
        )}
      </AnimatePresence>

      {/* Batch Delete Modal for Desktop */}
      <AnimatePresence>
        {showBatchDeleteModal && (
          <BatchDeleteModal
            isOpen={showBatchDeleteModal}
            onClose={() => setShowBatchDeleteModal(false)}
            onConfirm={handleBatchDelete}
            isDeleting={isDeletingBatch}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default History;