import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { getTempUser } from "../../../shared/utils/tempUserAuth";

export default function NoticeSection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState(null);

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
  }, [searchParams, notices]);

  const [highlightedNoticeId, setHighlightedNoticeId] = useState(null);

  // Auto-scroll and highlight notice if noticeId is in URL (from notification click)
  useEffect(() => {
    const noticeId = searchParams.get('noticeId');
    if (noticeId && notices.length > 0) {
      setHighlightedNoticeId(noticeId);
      setTimeout(() => {
        const el = document.getElementById(`notice-${noticeId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      // Remove highlight after 3 seconds
      setTimeout(() => setHighlightedNoticeId(null), 3000);
    }
  }, [searchParams, notices]);

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

  const openNoticeDetails = (notice) => {
    setSelectedNotice(notice);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedNotice(null);
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
      case 'lost-item':     return "bg-white text-gray-700 border border-gray-500 font-bold";
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
        <div className={`flex items-center gap-3 bg-white border-2 rounded-xl px-4 py-3 shadow-sm transition-colors ${showDropdown ? 'border-blue-400' : 'border-gray-200 hover:border-gray-300'}`}>
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

        {/* Hint text */}
        {!searchQuery && (
          <p className="mt-1.5 text-xs text-gray-400 px-1">
            Tip: Type <span className="font-medium text-blue-500">"lost black wallet"</span> — the system suggests matching <span className="font-medium">found</span> notices automatically.
          </p>
        )}

        {/* Filter Panel — Dropdown */}
        <div className="mt-4 bg-gray-50 border-2 border-gray-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Main Toggle Header */}
          <button
            onClick={() => setShowFilterPanel(prev => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-150 hover:to-gray-100 transition-colors group"
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
              className={`group flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 relative bg-white ${
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
                isUrgent ? 'bg-gradient-to-br from-red-50/60 to-orange-50/20'
                : isMedium ? 'bg-gradient-to-br from-green-50/60 to-emerald-50/20'
                : isLow ? 'bg-gradient-to-br from-yellow-50/60 to-amber-50/20'
                : 'bg-gradient-to-br from-gray-50/60 to-white'
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
                <h3 className={`font-extrabold text-sm leading-snug mb-2 ${
                  isUrgent ? 'text-red-900' : isMedium ? 'text-green-900' : isLow ? 'text-amber-900' : 'text-gray-900'
                }`}>
                  {notice.title}
                </h3>
                {notice.category !== 'found-item' && (
                  <p className="text-gray-500 text-xs flex-1 leading-relaxed line-clamp-3">
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
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-3xl w-full max-h-[92vh] sm:max-h-[88vh] overflow-y-auto shadow-2xl">

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
                </div>
                <h3 className="text-xl font-bold text-gray-900">{selectedNotice.title}</h3>
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
                  <span>Posted on {formatDate(selectedNotice.createdAt || new Date())}</span>
                </div>
                {selectedNotice.startDate && (
                  <div className="flex items-center gap-1.5">
                    <i className="fas fa-calendar-check"></i>
                    <span>Active from {formatDate(selectedNotice.startDate)}</span>
                  </div>
                )}
                {selectedNotice.endDate && (
                  <div className="flex items-center gap-1.5">
                    <i className="fas fa-clock"></i>
                    <span>Valid until {formatDate(selectedNotice.endDate)}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              {selectedNotice.category === 'found-item' ? (
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-shield-alt text-blue-500 text-sm"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-800">Description hidden</p>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                      The description for found item notices is restricted to prevent fraudulent claims.
                      If you believe this item belongs to you, please contact the notice poster directly using the contact details below.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed mb-6">
                  {selectedNotice.content}
                </p>
              )}

              {/* Image gallery */}
              {selectedNotice.attachments && selectedNotice.attachments.some(att => isBase64Image(att)) && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <i className="fas fa-images"></i> Attached Images
                    <span className="text-gray-400 font-normal normal-case tracking-normal">(click to enlarge)</span>
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
