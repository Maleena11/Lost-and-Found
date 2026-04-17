import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { getTempUser } from "../../../shared/utils/tempUserAuth";
import { translateText, speakText, stopSpeaking, t } from "../../../shared/utils/accessibilityUtils";
import SmartReportModal, { preloadSmartReportModel } from "./SmartReportModal";

export default function NoticeSection() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSmartReportModal, setShowSmartReportModal] = useState(false);
  const [isAlertItem, setIsAlertItem] = useState(false);
  const [showForwardAlertModal, setShowForwardAlertModal] = useState(false);
  const [forwardAlertEmail, setForwardAlertEmail] = useState('');
  const [sendingForwardAlert, setSendingForwardAlert] = useState(false);
  const [forwardAlertSuccess, setForwardAlertSuccess] = useState(false);
  const [forwardAlertError, setForwardAlertError] = useState('');
  const [tempUser, setTempUser] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState(null);

  // Accessibility state
  const [targetLang, setTargetLang] = useState('en');
  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedContent, setTranslatedContent] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  // Secure Tips state
  const [secureTipContent, setSecureTipContent] = useState('');
  const [postingSecureTip, setPostingSecureTip] = useState(false);
  const [secureTipSuccess, setSecureTipSuccess] = useState(false);

  // Smart search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredNotices, setFilteredNotices] = useState(null);
  const searchRef = useRef(null);

  // Filter state
  const [filterPriority, setFilterPriority] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [openFilterSections, setOpenFilterSections] = useState({ priority: false, category: false });

  const toggleFilterSection = (section) =>
    setOpenFilterSections(prev => ({ ...prev, [section]: !prev[section] }));

  // Stop words for smart keyword extraction
  const STOP_WORDS = new Set(['lost','found','a','the','my','i','is','it','was',
    'have','has','in','on','at','to','for','of','and','or','with','can','please',
    'help','me','some','any','do','did','been','are','was','were','will','would']);

  const parseQuery = (input) => {
    const lower = input.toLowerCase();
    let category = '';
    if (lower.includes('lost'))       category = 'found-item';
    else if (lower.includes('found')) category = 'lost-item';
    const keywords = lower.split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.has(w)).join(' ');
    return { keywords, category };
  };

  useEffect(() => {
    const user = getTempUser();
    setTempUser(user);
    fetchNotices();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const startPreload = () => {
      if (!cancelled) {
        preloadSmartReportModel();
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(startPreload, { timeout: 1500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(startPreload, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  // Auto-trigger search if ?q= param is present (e.g. from Hero search)
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && notices.length > 0) {
      setSearchQuery(q);
      const { keywords } = parseQuery(q);
      if (keywords) {
        const kws = keywords.split(/\s+/);
        const matched = notices.filter(n =>
          kws.some(k =>
            n.title?.toLowerCase().includes(k) ||
            n.content?.toLowerCase().includes(k) ||
            n.itemType?.toLowerCase().includes(k)
          )
        );
        setFilteredNotices(matched);
      }
    }
  }, [searchParams, notices, selectedNotice]);

  const [highlightedNoticeId, setHighlightedNoticeId] = useState(null);

  // Auto-scroll and highlight notice if noticeId is in URL (from notification click)
  useEffect(() => {
    const noticeId = searchParams.get('noticeId');
    if (noticeId && notices.length > 0) {
      const targetNotice = notices.find(n => String(n._id) === noticeId);
      setHighlightedNoticeId(noticeId);
      setTimeout(() => {
        const el = document.getElementById(`notice-${noticeId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      if (targetNotice && (!selectedNotice || String(selectedNotice._id) !== noticeId)) {
        setIsAlertItem(false);
        setSelectedNotice(targetNotice);
        setShowModal(true);
      }
      // Remove highlight after 3 seconds
      setTimeout(() => setHighlightedNoticeId(null), 3000);
    }
  }, [searchParams, notices]);

  // Auto-open Notice Modal if alertItem is in URL
  useEffect(() => {
    const alertItemId = searchParams.get('alertItem');
    if (alertItemId && notices.length > 0) {
      const targetNotice = notices.find(n => String(n._id) === alertItemId);
      if (targetNotice && (!selectedNotice || String(selectedNotice._id) !== alertItemId)) {
        setIsAlertItem(true);
        setSelectedNotice(targetNotice);
        setShowModal(true);
      }
    }
  }, [searchParams, notices, selectedNotice]);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/notices');
      setNotices(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching notices:", err);
      setError("Failed to load notices. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (noticeId) => {
    setLoadingComments(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/notices/${noticeId}/comments`);
      setComments(response.data.data);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !tempUser) return;
    setPostingComment(true);
    try {
      const response = await axios.post(`http://localhost:3001/api/notices/${selectedNotice._id}/comments`, {
        userId: tempUser.id,
        userName: tempUser.name || 'Student',
        text: newComment.trim(),
        isAnonymous: isAnonymous
      });
      setComments([response.data.data, ...comments]);
      setNewComment('');
      setIsAnonymous(false);
    } catch (err) {
      console.error("Error posting comment:", err);
      alert("Failed to post comment.");
    } finally {
      setPostingComment(false);
    }
  };

  const handleForwardAlertSubmit = async () => {
    if (!forwardAlertEmail.trim()) return;
    
    const emailRegex = /^it\d{8}@my\.sliit\.lk$/i;
    if (!emailRegex.test(forwardAlertEmail)) {
      setForwardAlertError('Please enter a valid SLIIT student email (e.g., itxxxxxxxx@my.sliit.lk).');
      return;
    }

    setSendingForwardAlert(true);
    setForwardAlertError('');
    setForwardAlertSuccess(false);

    try {
      await axios.post(`http://localhost:3001/api/notices/${selectedNotice._id}/forward-alert`, {
        friendEmail: forwardAlertEmail.trim()
      });
      setForwardAlertSuccess(true);
      setForwardAlertEmail('');
      setTimeout(() => {
        setShowForwardAlertModal(false);
        setForwardAlertSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Error sending forward alert:", err);
      setForwardAlertError(err.response?.data?.message || "Failed to send alert. Try again.");
    } finally {
      setSendingForwardAlert(false);
    }
  };

  const handlePostSecureTip = async () => {
    if (!secureTipContent.trim() || !tempUser) return;
    setPostingSecureTip(true);
    setSecureTipSuccess(false);
    try {
      await axios.post(`http://localhost:3001/api/notices/${selectedNotice._id}/tips`, {
        userId: tempUser.id,
        userName: tempUser.name || 'Student',
        text: secureTipContent.trim()
      });
      setSecureTipContent('');
      setSecureTipSuccess(true);
      setTimeout(() => setSecureTipSuccess(false), 4000);
    } catch (err) {
      console.error("Error posting secure tip:", err);
      alert("Failed to send private tip.");
    } finally {
      setPostingSecureTip(false);
    }
  };

  const handleSpeakText = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const contentToSpeak = selectedNotice.category === 'found-item' 
        ? "Description hidden for security reasons. Please contact poster directly."
        : (translatedContent || selectedNotice.content);
        
      const textToRead = `${translatedTitle || selectedNotice.title}. ${contentToSpeak}`;
      
      let speakLang = 'en-US';
      if (targetLang === 'si') speakLang = 'si-LK';
      if (targetLang === 'ta') speakLang = 'ta-IN';
      if (targetLang === 'fr') speakLang = 'fr-FR';
      if (targetLang === 'zh-CN') speakLang = 'zh-CN';

      speakText(textToRead, speakLang, () => setIsSpeaking(false));
    }
  };

  useEffect(() => {
    if (!selectedNotice) {
      setTargetLang('en');
      setTranslatedTitle('');
      setTranslatedContent('');
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    if (targetLang === 'en') {
      setTranslatedTitle(selectedNotice.title);
      setTranslatedContent(selectedNotice.content);
      return;
    }

    const translateNotice = async () => {
      setIsTranslating(true);
      const [newTitle, newContent] = await Promise.all([
        translateText(selectedNotice.title, targetLang),
        translateText(selectedNotice.content, targetLang)
      ]);
      setTranslatedTitle(newTitle);
      setTranslatedContent(newContent);
      setIsTranslating(false);
    };

    translateNotice();
  }, [targetLang, selectedNotice]);

  const openNoticeDetails = (notice) => {
    setSelectedNotice(notice);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedNotice(null);
    setSecureTipContent('');
    setSecureTipSuccess(false);
    setIsAlertItem(false);
    stopSpeaking();
    setIsSpeaking(false);
    setTargetLang('en');
    
    if (searchParams.get('alertItem')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('alertItem');
      setSearchParams(newParams, { replace: true });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const str = String(dateString);
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch.map(Number);
      return new Date(year, month - 1, day).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getPriorityBadgeStyle = (priority) => {
    switch (priority) {
      case 'urgent':   return "bg-red-100 text-red-700 border border-red-200";
      case 'high':     return "bg-orange-100 text-orange-700 border border-orange-200";
      case 'medium':   return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case 'low':      return "bg-blue-100 text-blue-700 border border-blue-200";
      default:         return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const getPriorityDotColor = (priority) => {
    switch (priority) {
      case 'urgent': return "bg-red-500";
      case 'high':   return "bg-orange-500";
      case 'medium': return "bg-yellow-500";
      case 'low':    return "bg-blue-500";
      default:       return "bg-gray-400";
    }
  };

  const getCategoryBadgeStyle = (category) => {
    switch (category) {
      case 'lost-item':     return "bg-orange-50 text-orange-800 border border-orange-400 font-bold";
      case 'found-item':    return "bg-cyan-50 text-cyan-800 border border-cyan-300 font-bold";
      case 'announcement':  return "bg-purple-100 text-purple-700 border border-purple-200";
      case 'service-update':return "bg-blue-100 text-blue-700 border border-blue-200";
      case 'emergency':     return "bg-red-100 text-red-700 border border-red-200";
      case 'advisory':      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      default:              return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'lost-item':     return "fas fa-search";
      case 'found-item':    return "fas fa-hand-holding";
      case 'announcement':  return "fas fa-bullhorn";
      case 'advisory':      return "fas fa-info-circle";
      case 'emergency':     return "fas fa-exclamation-triangle";
      default:              return "fas fa-tag";
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'lost-item':  return "Lost Item";
      case 'found-item': return "Found Item";
      default: return category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
    }
  };

  const getItemTypeLabel = (itemType) => {
    const labels = {
      'student-id':   'Student ID Card',
      'laptop':       'Laptop / Tablet',
      'mobile-phone': 'Mobile Phone',
      'atm-card':     'ATM / Bank Card',
      'license':      'Driving License / NIC',
      'wallet':       'Wallet / Purse',
      'keys':         'Keys',
      'books':        'Books / Lecture Notes',
      'stationery':   'Stationery / USB Drive',
      'clothing':     'Clothing / Bag',
      'other':        'Other',
    };
    return labels[itemType] || itemType;
  };

  const getItemTypeIcon = (itemType) => {
    const icons = {
      'student-id':   'fas fa-id-card',
      'laptop':       'fas fa-laptop',
      'mobile-phone': 'fas fa-mobile-alt',
      'atm-card':     'fas fa-credit-card',
      'license':      'fas fa-id-badge',
      'wallet':       'fas fa-wallet',
      'keys':         'fas fa-key',
      'books':        'fas fa-book',
      'stationery':   'fas fa-pen',
      'clothing':     'fas fa-tshirt',
      'other':        'fas fa-box-open',
    };
    return icons[itemType] || 'fas fa-tag';
  };

  const getTargetAudienceLabel = (audience) => {
    const labels = {
      'all-students':       'All Students',
      'undergraduate':      'Undergraduate Students',
      'postgraduate':       'Postgraduate Students',
      'academic-staff':     'Academic Staff',
      'non-academic-staff': 'Non-Academic Staff',
      'all-university':     'All University Community',
    };
    return labels[audience] || audience;
  };

  const isBase64Image = (str) => {
    if (!str) return false;
    return (
      str.startsWith('data:image/jpeg') ||
      str.startsWith('data:image/png') ||
      str.startsWith('data:image/gif') ||
      str.startsWith('data:image/webp') ||
      str.startsWith('data:image/svg')
    );
  };

  const userOwnsNotice = (notice) => {
    if (!tempUser || !notice) return false;
    return (notice.userId === tempUser.id) ||
           (notice.userId === "Admin" && tempUser.role === "admin") ||
           (tempUser.role === "admin");
  };

  useEffect(() => {
    if (tempUser && notices.length > 0) {
      console.log("Current user:", tempUser);
      console.log("First notice:", notices[0]);
      console.log("User owns notice?", userOwnsNotice(notices[0]));
    }
  }, [tempUser, notices]);

  // Debounced auto-suggestion fetch
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      const { keywords, category } = parseQuery(searchQuery);
      if (!keywords) { setSuggestions([]); return; }
      try {
        const params = new URLSearchParams({ q: keywords });
        if (category) params.append('category', category);
        const res = await axios.get(`http://localhost:3001/api/notices/search?${params}`);
        setSuggestions(res.data.data || []);
        setShowDropdown(true);
      } catch { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown when clicking outside search box
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applySearch = () => {
    const { keywords } = parseQuery(searchQuery);
    if (!keywords) { setFilteredNotices(null); return; }
    const kws = keywords.split(/\s+/);
    const matched = notices.filter(n =>
      kws.some(k =>
        n.title?.toLowerCase().includes(k) ||
        n.content?.toLowerCase().includes(k) ||
        n.itemType?.toLowerCase().includes(k)
      )
    );
    setFilteredNotices(matched);
    setShowDropdown(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    setFilteredNotices(null);
  };

  const clearFilters = () => {
    setFilterPriority(null);
    setFilterCategory(null);
  };

  const hasActiveFilters = filterPriority || filterCategory;

  const getDisplayNotices = () => {
    let base = filteredNotices ?? notices;
    if (filterPriority) base = base.filter(n => n.priority === filterPriority);
    if (filterCategory) base = base.filter(n => n.category === filterCategory);
    return base;
  };

  const selectSuggestion = (notice) => {
    setFilteredNotices([notice]);
    setShowDropdown(false);
    setSearchQuery(notice.title);
  };

  const handleEditNotice = (notice, e) => {
    e.stopPropagation();
    navigate(`/edit-notice/${notice._id}`, { state: { notice } });
  };

  const showDeleteConfirmation = (notice, e) => {
    e.stopPropagation();
    setNoticeToDelete(notice);
    setConfirmDelete(true);
  };

  const cancelDelete = () => {
    setNoticeToDelete(null);
    setConfirmDelete(false);
  };

  const handleDeleteNotice = async () => {
    if (!noticeToDelete) return;

    setDeleteLoading(true);
    try {
      await axios.delete(`http://localhost:3001/api/notices/${noticeToDelete._id}`);
      setNotices(notices.filter(notice => notice._id !== noticeToDelete._id));
      setConfirmDelete(false);
      setNoticeToDelete(null);
      if (selectedNotice && selectedNotice._id === noticeToDelete._id) closeModal();
    } catch (err) {
      console.error("Error deleting notice:", err);
      alert("Failed to delete the notice. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <section className="mt-12 pb-8">

      {/* Smart Search Bar */}
      <div>
        {/* Smart Search Bar */}
        <div className="relative mb-6" ref={searchRef}>
        <div className="flex flex-col sm:flex-row gap-4 items-stretch w-full">
        <div className={`notice-search-bar flex-1 flex items-center gap-3 bg-white border-2 rounded-xl px-4 py-2 shadow-sm transition-colors ${showDropdown ? 'border-blue-400' : 'border-gray-200 hover:border-gray-300'}`}>
          <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applySearch(); if (e.key === 'Escape') setShowDropdown(false); }}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder="Search notices... e.g. lost black wallet, found laptop"
            className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm"
          />
          {searchQuery && (
            <button onClick={clearSearch} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <button onClick={() => setShowSmartReportModal(true)} className="group relative flex items-center justify-center gap-3 px-6 py-2 rounded-xl font-bold text-white overflow-hidden shadow-[0_10px_24px_rgba(67,56,202,0.24)] hover:shadow-[0_14px_30px_rgba(109,40,217,0.3)] hover:-translate-y-0.5 transition-all duration-300 flex-shrink-0 border border-violet-300/30">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-violet-800 to-purple-800 bg-[length:200%_100%] animate-[gradient_4s_ease-in-out_infinite]" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-fuchsia-200/10 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/12 shadow-[0_10px_22px_rgba(255,255,255,0.1)] backdrop-blur-sm overflow-hidden">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.48),transparent_38%),radial-gradient(circle_at_75%_78%,rgba(254,240,138,0.28),transparent_36%),linear-gradient(160deg,rgba(125,211,252,0.38),rgba(244,114,182,0.3)_46%,rgba(253,224,71,0.24))]"></span>
              <span className="absolute inset-[2px] rounded-[10px] bg-gradient-to-br from-white/26 via-white/12 to-transparent"></span>
              <svg
                viewBox="0 0 48 48"
                className="relative z-10 h-6 w-6 drop-shadow-[0_4px_12px_rgba(255,255,255,0.42)]"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M22 10c-2.8 0-5 1.8-6 4.2a5.9 5.9 0 0 0-8 5.5c0 2 .9 3.7 2.3 4.8A6.3 6.3 0 0 0 10 36c1.2 1.2 2.9 2 4.8 2H22V10Z"
                  fill="#ffffff"
                />
                <path
                  d="M26 10c2.8 0 5 1.8 6 4.2a5.9 5.9 0 0 1 8 5.5c0 2-.9 3.7-2.3 4.8A6.3 6.3 0 0 1 38 36c-1.2 1.2-2.9 2-4.8 2H26V10Z"
                  fill="#ffffff"
                />
                <path
                  d="M24 10v28"
                  stroke="rgba(167,139,250,0.95)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
                <path
                  d="M18 15.5c1.8 0 3.2 1.4 3.2 3.2M16.5 23.5c2.7 0 4.7 2 4.7 4.7M30 15.5c-1.8 0-3.2 1.4-3.2 3.2M31.5 23.5c-2.7 0-4.7 2-4.7 4.7"
                  stroke="rgba(196,181,253,0.9)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="relative z-10 tracking-wide text-sm whitespace-nowrap">Smart Notice Creator</span>
            <style>{`@keyframes gradient { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }`}</style>
          </button>
        </div>

        {/* Hint text */}
        {!searchQuery && (
          <p className="notice-search-tip mt-1.5 text-xs text-gray-400 px-1">
            Tip: Type <span className="font-medium text-blue-500">"lost black wallet"</span> — the system suggests matching <span className="font-medium">found</span> notices automatically.
          </p>
        )}

        {/* Filter Panel — Dropdown */}
        <div className="notice-filter-panel mt-4 bg-gray-50 border-2 border-gray-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Main Toggle Header */}
          <button
            onClick={() => setShowFilterPanel(prev => !prev)}
            className="notice-filter-header w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-150 hover:to-gray-100 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${showFilterPanel ? 'bg-blue-500' : 'bg-blue-100'}`}>
                <i className={`fas fa-filter text-xs transition-colors ${showFilterPanel ? 'text-white' : 'text-blue-500'}`}></i>
              </div>
              <span className="text-sm font-bold text-gray-700">Filter Notices</span>
              {hasActiveFilters && (
                <span className="text-xs bg-blue-600 text-white font-semibold px-2 py-0.5 rounded-full">
                  {[filterPriority, filterCategory].filter(Boolean).length} active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={e => { e.stopPropagation(); clearFilters(); }}
                  className="text-xs text-red-400 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg border border-red-100"
                >
                  <i className="fas fa-undo text-xs"></i> Reset
                </button>
              )}
              <i className={`fas fa-chevron-down text-gray-400 text-xs transition-transform duration-200 ${showFilterPanel ? 'rotate-180' : ''}`}></i>
            </div>
          </button>

          {/* Priority — shown only when filter panel is open */}
          {showFilterPanel && (
            <div className="border-t border-gray-200">
              <div className="border-b border-gray-100">
                <button
                  onClick={() => toggleFilterSection('priority')}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${openFilterSections.priority ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-50'}`}>
                      <i className={`fas fa-flag text-sm transition-colors ${openFilterSections.priority ? 'text-blue-500' : 'text-gray-400'}`}></i>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-700">Priority Level</p>
                      <p className="text-xs text-gray-400">Filter by urgency</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {filterPriority && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">{filterPriority}</span>
                    )}
                    <i className={`fas fa-chevron-down text-gray-400 text-xs transition-transform duration-200 ${openFilterSections.priority ? 'rotate-180' : ''}`}></i>
                  </div>
                </button>

                {openFilterSections.priority && (
                  <div className="px-3 sm:px-4 pb-4 pt-1 grid grid-cols-3 gap-2 sm:gap-2.5 bg-gray-50/50">
                    {[
                      { value: 'urgent', label: 'Urgent', icon: 'fas fa-exclamation-circle',
                        active: 'bg-red-50 text-red-600 border-red-400',
                        inactive: 'bg-white text-red-400 border-red-200 hover:border-red-300 hover:bg-red-50',
                        dot: 'bg-red-500 animate-ping', activeDot: 'bg-red-500 animate-ping',
                        count: notices.filter(n => n.priority === 'urgent').length },
                      { value: 'medium', label: 'Medium', icon: 'fas fa-minus-circle',
                        active: 'bg-green-50 text-green-700 border-green-400',
                        inactive: 'bg-white text-green-500 border-green-200 hover:border-green-300 hover:bg-green-50',
                        dot: 'bg-green-400', activeDot: 'bg-green-500',
                        count: notices.filter(n => n.priority === 'medium').length },
                      { value: 'low', label: 'Low', icon: 'fas fa-arrow-circle-down',
                        active: 'bg-yellow-50 text-yellow-700 border-yellow-400',
                        inactive: 'bg-white text-yellow-500 border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50',
                        dot: 'bg-yellow-400', activeDot: 'bg-yellow-500',
                        count: notices.filter(n => n.priority === 'low').length },
                    ].map(({ value, label, icon, active, inactive, dot, activeDot, count }) => (
                      <button
                        key={value}
                        onClick={() => setFilterPriority(filterPriority === value ? null : value)}
                        className={`relative flex flex-col items-center gap-2 py-3 sm:py-4 px-2 sm:px-3 rounded-2xl border-2 font-semibold transition-all duration-200 ${filterPriority === value ? active : inactive}`}
                      >
                        {filterPriority === value && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-white rounded-full border border-current flex items-center justify-center">
                            <i className="fas fa-check" style={{ fontSize: '8px' }}></i>
                          </div>
                        )}
                        <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${filterPriority === value ? activeDot : dot}`}></span>
                        <i className={`${icon} text-xl sm:text-2xl`}></i>
                        <span className="text-xs sm:text-sm font-extrabold tracking-wide">{label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white border border-gray-200 text-gray-500">
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lost / Found — always visible */}
          <div className="border-t border-gray-200 px-4 pb-4 pt-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-tag text-orange-500 text-xs"></i>
              </div>
              <p className="text-sm font-semibold text-gray-700">Lost / Found Item</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'lost-item',  label: 'Lost Item',  icon: 'fas fa-search',      desc: 'Items being searched',
                  active: 'bg-orange-50 text-orange-700 border-orange-400',
                  inactive: 'bg-white text-orange-500 border-orange-200 hover:border-orange-300 hover:bg-orange-50',
                  count: notices.filter(n => n.category === 'lost-item').length },
                { value: 'found-item', label: 'Found Item', icon: 'fas fa-hand-holding', desc: 'Items recovered',
                  active: 'bg-cyan-50 text-cyan-700 border-cyan-400',
                  inactive: 'bg-white text-cyan-500 border-cyan-200 hover:border-cyan-300 hover:bg-cyan-50',
                  count: notices.filter(n => n.category === 'found-item').length },
              ].map(({ value, label, icon, desc, active, inactive, count }) => (
                <button
                  key={value}
                  onClick={() => setFilterCategory(filterCategory === value ? null : value)}
                  className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 font-semibold text-sm transition-all duration-200 ${filterCategory === value ? active : inactive}`}
                >
                  {filterCategory === value && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full border border-current flex items-center justify-center">
                      <i className="fas fa-check" style={{ fontSize: '8px' }}></i>
                    </div>
                  )}
                  <i className={`${icon} text-xl ${filterCategory === value ? 'animate-bounce' : ''}`}></i>
                  <div className="text-left">
                    <p className="font-bold leading-tight">{label}</p>
                    <p className="text-xs mt-0.5 text-gray-400">{desc}</p>
                    <span className="inline-block text-xs mt-1 px-2 py-0.5 rounded-full font-bold bg-white border border-gray-200 text-gray-500">
                      {count} notices
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter active banner */}
        {filteredNotices !== null && (
          <div className="mt-2 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <span>Showing <strong>{filteredNotices.length}</strong> result{filteredNotices.length !== 1 ? 's' : ''} for "<strong>{searchQuery}</strong>"</span>
            <button onClick={() => { clearSearch(); clearFilters(); }} className="ml-auto text-blue-500 hover:text-blue-700 font-medium text-xs">Clear filter</button>
          </div>
        )}

        {/* Suggestions dropdown */}
        {showDropdown && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-40 overflow-hidden">
            {suggestions.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">No suggestions found for "{searchQuery}"</p>
            ) : (
              <>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs text-gray-500 font-medium">
                    {parseQuery(searchQuery).category === 'found-item' ? '🔍 Showing found notices (you may have lost this)' :
                     parseQuery(searchQuery).category === 'lost-item' ? '🔍 Showing lost notices (you may have found this)' :
                     '🔍 Matching notices'}
                  </p>
                </div>
                {suggestions.slice(0, 5).map(n => (
                  <div
                    key={n._id}
                    onClick={() => selectSuggestion(n)}
                    className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      n.priority === 'urgent' ? 'bg-red-500' :
                      n.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          n.category === 'found-item' ? 'bg-cyan-100 text-cyan-700' :
                          n.category === 'lost-item'  ? 'bg-red-100 text-red-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {n.category.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                        <span className="text-xs text-gray-400 uppercase font-semibold">{n.priority}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 truncate">{n.title}</p>
                      {n.category !== 'found-item' && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{n.content?.substring(0, 80)}...</p>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={applySearch}
                  className="w-full text-center text-sm text-blue-600 font-medium py-3 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                >
                  See all results for "{parseQuery(searchQuery).keywords}"
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {showSmartReportModal && (
        <SmartReportModal 
          tempUser={tempUser}
          onClose={() => setShowSmartReportModal(false)}
        />
      )}

      {/* Content */}
      <div className="mt-8">
      {loading ? (
        <div className="flex flex-col justify-center items-center h-48 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-sm text-gray-400">Loading notices...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-8 rounded-2xl text-red-700 text-center flex flex-col items-center gap-2">
          <i className="fas fa-exclamation-circle text-3xl text-red-400"></i>
          <p className="font-medium">{error}</p>
        </div>
      ) : (getDisplayNotices().length === 0 && (filteredNotices !== null || hasActiveFilters)) ? (
        <div className="bg-white border border-gray-100 shadow-sm p-12 rounded-2xl text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <i className="fas fa-search text-2xl text-gray-300"></i>
          </div>
          <p className="text-gray-600 font-medium">No notices matched your filters.</p>
          <button onClick={() => { clearSearch(); clearFilters(); }} className="text-sm text-blue-600 hover:underline font-medium">Clear filters and show all</button>
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-white border border-gray-100 shadow-sm p-12 rounded-2xl text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <i className="fas fa-bell-slash text-2xl text-gray-300"></i>
          </div>
          <p className="text-gray-600 font-medium">No notices available at this time.</p>
          <p className="text-sm text-gray-400">Check back later for updates from campus administration.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...getDisplayNotices()]
            .sort((a, b) => {
              const order = { urgent: 0, medium: 1, low: 2 };
              return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
            })
            .map((notice) => {
            const isUrgent = notice.priority === 'urgent';
            const isMedium = notice.priority === 'medium';
            const isLow = notice.priority === 'low';
            return (
            <div
              id={`notice-${notice._id}`}
              key={notice._id}
              className={`notice-card group flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 relative bg-white ${
                highlightedNoticeId === notice._id ? 'ring-4 ring-blue-600 ring-offset-2 scale-105' : ''
              } ${
                isUrgent
                  ? 'shadow-lg shadow-red-100/80 ring-2 ring-red-200 hover:shadow-2xl hover:shadow-red-200/60 urgent-card-pulse'
                  : isMedium
                  ? 'shadow-md shadow-green-100/60 ring-1 ring-green-200 hover:shadow-xl hover:shadow-green-100/50'
                  : isLow
                  ? 'shadow-md shadow-yellow-100/60 ring-1 ring-yellow-200 hover:shadow-xl hover:shadow-yellow-100/50'
                  : 'shadow-md ring-1 ring-gray-200 hover:shadow-xl'
              }`}
              onClick={() => openNoticeDetails(notice)}
            >
              {/* Thick top gradient accent bar */}
              {isUrgent && <div className="h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 animate-pulse flex-shrink-0" />}
              {isMedium && <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-400 flex-shrink-0" />}
              {isLow && <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-300 flex-shrink-0" />}

              {/* Header area — "Official Notice" label + category + circular priority seal */}
              <div className={`px-4 pt-4 pb-3.5 flex items-start justify-between gap-3 ${
                isUrgent ? 'card-header-urgent bg-gradient-to-br from-red-50/60 to-orange-50/20'
                : isMedium ? 'card-header-medium bg-gradient-to-br from-green-50/60 to-emerald-50/20'
                : isLow ? 'card-header-low bg-gradient-to-br from-yellow-50/60 to-amber-50/20'
                : 'card-header-default bg-gradient-to-br from-gray-50/60 to-white'
              }`}>
                <div className="flex-1 min-w-0">
                  {/* Official Notice label */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.15em] uppercase px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md shadow-sm">
                      <i className="fas fa-university text-blue-500 text-xs"></i>
                      Official Notice
                    </span>
                  </div>
                  {/* Category badge — Lost/Found only */}
                  {notice.category === 'lost-item' && (
                    <div className="mb-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-white text-gray-700 border border-gray-400 shadow-sm">
                        <i className="fas fa-search text-orange-500 animate-bounce-slow"></i>
                        Lost Item
                      </span>
                    </div>
                  )}
                  {notice.category === 'found-item' && (
                    <div className="mb-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-white text-gray-700 border border-gray-400 shadow-sm">
                        <i className="fas fa-hand-holding text-cyan-500 animate-bounce-slow"></i>
                        Found Item
                      </span>
                    </div>
                  )}
                </div>

                {/* Circular priority seal — like an official stamp */}
                {isUrgent && (
                  <div className="flex-shrink-0 w-[54px] h-[54px] sm:w-[68px] sm:h-[68px] rounded-full border-[3px] border-red-400 bg-gradient-to-br from-red-50 via-rose-50 to-red-100 flex flex-col items-center justify-center shadow-lg shadow-red-200 -mt-0.5 relative">
                    <div className="absolute inset-[4px] rounded-full border border-red-300 opacity-50"></div>
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 animate-ping flex-shrink-0 mb-0.5 sm:mb-1"></span>
                    <span className="text-[8px] sm:text-[9px] font-black text-red-600 leading-none tracking-widest uppercase">Urgent</span>
                  </div>
                )}
                {isMedium && (
                  <div className="flex-shrink-0 w-[54px] h-[54px] sm:w-[68px] sm:h-[68px] rounded-full border-[3px] border-green-400 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 flex flex-col items-center justify-center shadow-lg shadow-green-200 -mt-0.5 relative">
                    <div className="absolute inset-[4px] rounded-full border border-green-300 opacity-50"></div>
                    <i className="fas fa-minus text-green-500 text-sm sm:text-base mb-0.5 sm:mb-1"></i>
                    <span className="text-[8px] sm:text-[9px] font-black text-green-700 leading-none tracking-widest uppercase">Medium</span>
                  </div>
                )}
                {isLow && (
                  <div className="flex-shrink-0 w-[54px] h-[54px] sm:w-[68px] sm:h-[68px] rounded-full border-[3px] border-yellow-400 bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 flex flex-col items-center justify-center shadow-lg shadow-yellow-200 -mt-0.5 relative">
                    <div className="absolute inset-[4px] rounded-full border border-yellow-300 opacity-50"></div>
                    <i className="fas fa-chevron-down text-yellow-500 text-sm sm:text-base mb-0.5 sm:mb-1"></i>
                    <span className="text-[8px] sm:text-[9px] font-black text-yellow-700 leading-none tracking-widest uppercase">Low</span>
                  </div>
                )}
              </div>

              {/* Gradient fade divider */}
              <div className={`mx-4 h-px ${
                isUrgent ? 'bg-gradient-to-r from-red-200 via-red-100 to-transparent'
                : isMedium ? 'bg-gradient-to-r from-green-200 via-green-100 to-transparent'
                : isLow ? 'bg-gradient-to-r from-yellow-200 via-yellow-100 to-transparent'
                : 'bg-gradient-to-r from-gray-200 via-gray-100 to-transparent'
              }`} />

              {/* Full-width framed image */}
              {notice.attachments && notice.attachments.length > 0 &&
                notice.attachments.some(att => isBase64Image(att)) && (
                <div className="mt-3 flex-shrink-0">
                  {/* Outer mat — priority-tinted gradient */}
                  <div className={`p-1 shadow-md ${
                    isUrgent ? 'bg-gradient-to-br from-red-100 via-rose-100 to-orange-100'
                    : isMedium ? 'bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100'
                    : isLow ? 'bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100'
                    : 'bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-50'
                  }`}>
                    {/* Inner mat — white */}
                    <div className="bg-white p-1 shadow-inner">
                      <img
                        src={notice.attachments.find(att => isBase64Image(att))}
                        alt="Notice attachment"
                        className="w-full object-cover"
                        style={{ height: '260px' }}
                      />
                    </div>
                  </div>
                  {/* Frame caption */}
                  <div className="flex items-center justify-center gap-2 mt-2 mx-4">
                    <span className="flex-1 h-px bg-gray-200"></span>
                    <span className="text-xs text-gray-400 font-semibold tracking-widest uppercase flex items-center gap-1">
                      <i className="fas fa-camera text-gray-300 text-xs"></i> Photo
                    </span>
                    <span className="flex-1 h-px bg-gray-200"></span>
                  </div>
                </div>
              )}

              {/* Content body */}
              <div className="px-4 pt-3 pb-2 flex-1 flex flex-col">
                <h3 className="card-title font-extrabold text-base leading-tight tracking-wide mb-2 text-black">
                  {notice.title}
                </h3>
                {notice.category !== 'found-item' && (
                  <p className="card-body-text text-gray-500 text-xs flex-1 leading-relaxed line-clamp-3">
                    {notice.content.length > 120 ? `${notice.content.substring(0, 120)}...` : notice.content}
                  </p>
                )}
              </div>

              {/* Footer strip */}
              <div className={`px-4 py-2.5 flex items-center justify-between flex-wrap gap-1 text-xs border-t flex-shrink-0 ${
                isUrgent ? 'border-red-100 bg-red-50/25'
                : isMedium ? 'border-green-100 bg-green-50/25'
                : isLow ? 'border-yellow-100 bg-yellow-50/25'
                : 'border-gray-100 bg-gray-50/20'
              }`}>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <i className="fas fa-calendar-alt text-xs"></i>
                  <span>{formatDate(notice.createdAt || new Date())}</span>
                </div>
                {notice.endDate ? (
                  <div className={`flex items-center gap-1 font-semibold ${isUrgent ? 'text-red-500' : isMedium ? 'text-green-600' : isLow ? 'text-yellow-600' : 'text-gray-400'}`}>
                    <i className="fas fa-hourglass-half text-xs"></i>
                    <span>Exp. {formatDate(notice.endDate)}</span>
                  </div>
                ) : (
                  <span className="text-blue-500 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
                    View <i className="fas fa-arrow-right text-xs"></i>
                  </span>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Notice Detail Modal */}
      {showModal && selectedNotice && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className={`bg-white rounded-t-2xl sm:rounded-2xl max-w-3xl w-full max-h-[92vh] sm:max-h-[88vh] overflow-y-auto shadow-2xl transition-all duration-700 ${isAlertItem ? 'border-4 border-blue-400 shadow-[0_0_45px_rgba(96,165,250,0.8)] animate-pulse-light' : ''}`}>
            {isAlertItem && (
               <style>{`
                 @keyframes pulse-light {
                   0%, 100% { box-shadow: 0 0 20px rgba(191,219,254,0.6); border-color: rgba(147,197,253,0.7); }
                   50% { box-shadow: 0 0 50px rgba(59,130,246,0.9); border-color: rgba(59,130,246,1); }
                 }
                 .animate-pulse-light { animation: pulse-light 2s ease-in-out infinite; }
               `}</style>
            )}

            {/* Image header (if available) */}
            {selectedNotice.attachments && selectedNotice.attachments.some(att => isBase64Image(att)) ? (
              <div className="relative h-72 w-full overflow-hidden rounded-t-2xl">
                <img
                  src={selectedNotice.attachments.find(att => isBase64Image(att))}
                  alt="Notice header"
                  className="w-full h-full object-cover object-center"
                />
                {/* Gradient overlay so text/button always readable */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/60 rounded-t-2xl" />
                {/* Close button — on image, always visible with dark circle */}
                <button
                  onClick={closeModal}
                  className="absolute top-3 right-3 w-9 h-9 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors shadow-lg"
                >
                  <i className="fas fa-times text-white text-sm"></i>
                </button>
              </div>
            ) : (
              /* No image — close button sits in header row */
              null
            )}

            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${getPriorityBadgeStyle(selectedNotice.priority)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDotColor(selectedNotice.priority)}`}></span>
                    {selectedNotice.priority.charAt(0).toUpperCase() + selectedNotice.priority.slice(1)}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${getCategoryBadgeStyle(selectedNotice.category)}`}>
                    <i className={`${getCategoryIcon(selectedNotice.category)} text-xs`}></i>
                    {getCategoryLabel(selectedNotice.category)}
                  </span>
                  {selectedNotice.itemType && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 bg-white text-gray-600 border border-gray-300">
                      <i className={`${getItemTypeIcon(selectedNotice.itemType)} text-gray-400 text-xs`}></i>
                      {getItemTypeLabel(selectedNotice.itemType)}
                    </span>
                  )}
                  {selectedNotice.targetAudience && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 bg-white text-gray-600 border border-gray-300">
                      <i className="fas fa-users text-gray-400 text-xs"></i>
                      {getTargetAudienceLabel(selectedNotice.targetAudience)}
                    </span>
                  )}
                  {selectedNotice.category === 'found-item' && (
                    <div className="relative inline-block ml-1">
                      <button
                        onClick={() => setShowForwardAlertModal(!showForwardAlertModal)}
                        className="text-xs px-3.5 py-1.5 rounded-full font-bold flex items-center gap-2 text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] hover:bg-right hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ring-2 ring-indigo-500/30 ring-offset-1"
                      >
                        <i className="fas fa-paper-plane text-white/90 text-xs z-10 animate-pulse"></i>
                        {t('forwardAlert', targetLang)}
                      </button>
                      
                      {showForwardAlertModal && (
                        <div className="absolute top-full right-0 mt-3 w-[360px] max-w-[90vw] bg-white/95 backdrop-blur-[12px] border border-indigo-100/80 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] z-[100] p-6 text-left origin-top-right ring-1 ring-black/5">
                          <h4 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2"><i className="fas fa-envelope text-indigo-500"></i> Alert a Friend</h4>
                          <p className="text-sm text-gray-500 mb-5 leading-relaxed whitespace-normal">Send an anonymous email alert to a friend if you recognize this item. Only SLIIT student emails allowed.</p>
                          
                          {forwardAlertSuccess ? (
                            <div className="bg-green-50 text-green-700 text-sm p-3.5 rounded-xl border border-green-200 flex items-center gap-2.5 font-semibold">
                              <i className="fas fa-check-circle text-lg"></i> Alert Sent Successfully!
                            </div>
                          ) : (
                            <div>
                              <input 
                                type="email" 
                                placeholder="itxxxxxxxx@my.sliit.lk" 
                                value={forwardAlertEmail}
                                onChange={(e) => setForwardAlertEmail(e.target.value)}
                                className="w-full text-sm px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 mb-3.5 bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all placeholder-gray-400"
                              />
                              {forwardAlertError && <p className="text-xs text-red-600 mb-4 leading-relaxed bg-red-50/80 p-3 rounded-xl border border-red-100 font-medium">{forwardAlertError}</p>}
                              <div className="flex gap-2.5 pt-1">
                                <button 
                                  onClick={handleForwardAlertSubmit} 
                                  disabled={sendingForwardAlert}
                                  className="group flex-1 flex flex-row items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] text-white text-sm font-bold py-2.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:bg-right disabled:opacity-60 disabled:hover:bg-left disabled:hover:translate-y-0 disabled:cursor-not-allowed transition-all duration-300 ring-2 ring-indigo-500/30 ring-offset-1"
                                >
                                  {sendingForwardAlert ? (
                                    <><i className="fas fa-circle-notch fa-spin"></i> Sending...</>
                                  ) : (
                                    <>{t('forwardAlert', targetLang)} <i className="fas fa-paper-plane text-white/80 group-hover:animate-pulse text-xs"></i></>
                                  )}
                                </button>
                                <button 
                                  onClick={() => { setShowForwardAlertModal(false); setForwardAlertError(''); }}
                                  className="flex-1 bg-gray-100 text-gray-700 text-sm font-bold py-2.5 rounded-xl hover:bg-gray-200 hover:shadow-sm focus:ring-2 focus:ring-gray-300 transition-all"
                                >
                                  {t('cancel', targetLang)}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {isTranslating ? <div className="h-6 bg-gray-200 animate-pulse rounded w-3/4"></div> : (translatedTitle || selectedNotice.title)}
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Show close button in header only when there is no image */}
                {(!selectedNotice.attachments || !selectedNotice.attachments.some(att => isBase64Image(att))) && (
                <button
                  onClick={closeModal}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-times text-gray-500 text-sm"></i>
                </button>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* Date row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400 mb-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-1.5">
                  <i className="fas fa-calendar-alt"></i>
                  <span>{t('postedOn', targetLang)} {formatDate(selectedNotice.createdAt || new Date())}</span>
                </div>
                {selectedNotice.startDate && (
                  <div className="flex items-center gap-1.5">
                    <i className="fas fa-calendar-check"></i>
                    <span>{t('activeFrom', targetLang)} {formatDate(selectedNotice.startDate)}</span>
                  </div>
                )}
                {selectedNotice.endDate && (
                  <div className="flex items-center gap-1.5">
                    <i className="fas fa-clock"></i>
                    <span>{t('validUntil', targetLang)} {formatDate(selectedNotice.endDate)}</span>
                  </div>
                )}
              </div>

              {/* Accessibility Bar */}
              <div className="flex flex-wrap items-center gap-3 mb-6 px-4 py-2 bg-blue-50/50 rounded-xl border border-blue-100/50">
                <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                  <i className="fas fa-universal-access text-blue-500"></i>
                </div>
                <div className="h-4 w-px bg-blue-200 mx-1 hidden sm:block"></div>
                
                <select 
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="bg-white border border-blue-200 text-blue-800 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-2.5 py-1.5 outline-none font-medium cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <option value="en">English (Default)</option>
                  <option value="si">සිංහල (Sinhala)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="fr">Français (French)</option>
                  <option value="zh-CN">中文 (Chinese)</option>
                </select>
                
                <button 
                  onClick={handleSpeakText}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${isSpeaking ? 'bg-indigo-500 text-white shadow-md animate-pulse' : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:shadow-sm'}`}
                >
                  {isSpeaking ? (
                    <><i className="fas fa-stop"></i> {t('stop', targetLang)}</>
                  ) : (
                    <><i className="fas fa-volume-up"></i> {t('listen', targetLang)}</>
                  )}
                </button>
                {isTranslating && <i className="fas fa-circle-notch fa-spin text-blue-500 text-xs ml-2"></i>}
              </div>

              {/* Content */}
              {selectedNotice.category === 'found-item' ? (
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-shield-alt text-blue-500 text-sm"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-800">{t('descriptionHidden', targetLang)}</p>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                      {t('hiddenWarning', targetLang)}
                    </p>
                  </div>
                </div>
              ) : (
                isTranslating ? (
                  <div className="space-y-2 mb-6">
                    <div className="h-4 bg-gray-200 animate-pulse rounded w-full"></div>
                    <div className="h-4 bg-gray-200 animate-pulse rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed mb-6">
                    {translatedContent || selectedNotice.content}
                  </p>
                )
              )}

              {/* Image gallery */}
              {selectedNotice.attachments && selectedNotice.attachments.some(att => isBase64Image(att)) && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <i className="fas fa-images"></i> {t('attachedImages', targetLang)}
                    <span className="text-gray-400 font-normal normal-case tracking-normal">{t('clickToEnlarge', targetLang)}</span>
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedNotice.attachments
                      .filter(att => isBase64Image(att))
                      .map((imageUrl, index) => (
                        <div
                          key={index}
                          onClick={() => setLightboxImage(imageUrl)}
                          className="rounded-xl overflow-hidden border border-gray-100 shadow-sm cursor-zoom-in hover:shadow-md hover:border-blue-200 transition-all group relative"
                        >
                          <img
                            src={imageUrl}
                            alt={`Image ${index + 1}`}
                            className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                            <i className="fas fa-search-plus text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg"></i>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Other attachments */}
              {selectedNotice.attachments && selectedNotice.attachments.some(att => !isBase64Image(att)) && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <i className="fas fa-paperclip"></i> Other Attachments
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {selectedNotice.attachments
                      .filter(att => !isBase64Image(att))
                      .map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200 text-sm text-gray-600"
                        >
                          <i className="fas fa-file text-gray-400"></i>
                          Attachment {index + 1}
                        </a>
                      ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {(selectedNotice.contactPhone || selectedNotice.contactEmail) && (
                <div className="mb-5 pb-5 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <i className="fas fa-address-card"></i> Contact Information
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {selectedNotice.contactPhone && (
                      <div className="flex items-center gap-1.5">
                        <i className="fas fa-phone text-gray-400 text-xs"></i>
                        <span>{selectedNotice.contactPhone}</span>
                      </div>
                    )}
                    {selectedNotice.contactEmail && (
                      <div className="flex items-center gap-1.5">
                        <i className="fas fa-envelope text-gray-400 text-xs"></i>
                        <span>{selectedNotice.contactEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Premium Community Sightings Link Banner (Only for Lost Items) */}
              {selectedNotice.category === 'lost-item' && (
                <div className="mb-6 mt-2 mx-4 sm:mx-6 relative overflow-hidden rounded-2xl shadow-md border border-indigo-100/60 group">
                  {/* Animated Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-purple-50/80 z-0"></div>
                  
                  {/* Decorative Glows */}
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full blur-3xl opacity-[0.15] group-hover:opacity-30 transition-opacity duration-700"></div>
                  <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-gradient-to-tr from-teal-300 to-blue-300 rounded-full blur-2xl opacity-[0.15] group-hover:opacity-30 transition-opacity duration-700"></div>

                  <div className="relative z-10 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5">
                    {/* Icon Container */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px] shadow-lg shadow-blue-500/20 transform group-hover:-translate-y-1 group-hover:shadow-indigo-500/40 transition-all duration-300">
                        <div className="w-full h-full bg-white/95 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <i className="fas fa-users text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl group-hover:scale-110 transition-transform duration-300"></i>
                        </div>
                      </div>
                      {/* Pulse indicator */}
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse shadow-sm"></div>
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="font-extrabold text-gray-800 text-lg sm:text-xl mb-1.5 tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
                        Community Sightings
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold bg-gradient-to-r from-orange-400 to-red-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                          <i className="fas fa-search text-[8px]"></i> Explore
                        </span>
                      </h4>
                      <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto sm:mx-0">
                        Join the search! Check tips from others or post a clue to help reunite this item with its owner.
                      </p>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                      <button
                        onClick={() => navigate(`/notice-sightings/${selectedNotice._id}`)}
                        className="w-full sm:w-auto relative overflow-hidden bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 text-blue-800 font-extrabold px-6 py-3 rounded-xl shadow-[0_4px_14px_0_rgba(147,197,253,0.5)] border-[1.5px] border-blue-400/80 hover:border-blue-500 hover:text-blue-900 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2.5 group/btn"
                      >
                        {/* CSS-based Shimmer effect (moves left to right) */}
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                        <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
                        <span>View Sightings</span>
                        <i className="fas fa-arrow-right text-[13px] text-blue-600 transform group-hover/btn:translate-x-1 transition-transform"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Secure Tip Drop (Only for Found Items) */}
              {selectedNotice.category === 'found-item' && (
                <div className="mb-6 mt-4 mx-4 sm:mx-6 relative overflow-hidden rounded-2xl shadow-md border border-cyan-100/60 bg-gradient-to-br from-cyan-50/50 via-blue-50/30 to-cyan-50/50 p-5 sm:p-6 group">
                  <div className="flex flex-col sm:flex-row items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white shrink-0">
                      <i className="fas fa-user-secret text-xl"></i>
                    </div>
                    <div className="text-center sm:text-left">
                      <h4 className="font-extrabold text-gray-800 text-lg flex items-center justify-center sm:justify-start gap-2">
                        Secure Tip Drop
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                          <i className="fas fa-lock text-[8px]"></i> Private
                        </span>
                      </h4>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">Send a secure lead directly to the finder and system admins.</p>
                    </div>
                  </div>

                  {tempUser ? (
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 border border-cyan-100 shadow-inner focus-within:ring-2 focus-within:ring-cyan-300/50 transition-all">
                      <textarea
                        value={secureTipContent}
                        onChange={(e) => setSecureTipContent(e.target.value)}
                        placeholder="e.g., I know who this belongs to, let me text them..."
                        className="w-full bg-transparent border-none outline-none text-sm text-gray-700 resize-none placeholder-gray-400 p-1"
                        rows="2"
                      />
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100/80">
                        <p className="text-[10px] text-gray-400 font-medium max-w-[60%] leading-tight flex items-start gap-1">
                          <i className="fas fa-shield-alt text-cyan-400 mt-0.5"></i> 
                          <span>This tip is encrypted and will NOT be publicly visible.</span>
                        </p>
                        <button
                          onClick={handlePostSecureTip}
                          disabled={!secureTipContent.trim() || postingSecureTip}
                          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-[11px] font-bold px-4 py-2.5 rounded-xl shadow-md disabled:shadow-none transition-all flex items-center gap-1.5 transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                          {postingSecureTip ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                          {postingSecureTip ? 'Sending...' : 'Send Tip'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-xl text-center border border-amber-200 font-medium shadow-inner">
                      <i className="fas fa-exclamation-circle mr-1.5 text-amber-500"></i> Please log in to submit a secure tip.
                    </p>
                  )}
                  {secureTipSuccess && (
                    <div className="mt-4 bg-cyan-100 text-cyan-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-[pulse_0.5s_ease-in-out]">
                      <i className="fas fa-check-circle text-cyan-600 text-sm"></i> Secure tip sent successfully! Admins have been notified.
                    </div>
                  )}
                </div>
              )}

              {/* Close button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={closeModal}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* Lightbox overlay */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <i className="fas fa-times text-white text-lg"></i>
          </button>

          {/* Image */}
          <img
            src={lightboxImage}
            alt="Enlarged view"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />

          {/* Hint */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
            Click anywhere outside to close
          </p>
        </div>
      )}

    </section>
  );
}
