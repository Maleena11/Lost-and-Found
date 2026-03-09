import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getTempUser } from "../../../shared/utils/tempUserAuth";

export default function NoticeSection() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState(null);

  // Smart search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredNotices, setFilteredNotices] = useState(null);
  const searchRef = useRef(null);

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
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
      case 'announcement':  return "bg-purple-100 text-purple-700 border border-purple-200";
      case 'service-update':return "bg-blue-100 text-blue-700 border border-blue-200";
      case 'emergency':     return "bg-red-100 text-red-700 border border-red-200";
      case 'advisory':      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      default:              return "bg-green-100 text-green-700 border border-green-200";
    }
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

      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <i className="fas fa-bullhorn text-blue-600 text-sm"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">University Notices</h2>
            <p className="text-xs text-gray-400">Official announcements from campus administration</p>
          </div>
        </div>
        <Link
          to="/create-notice"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
        >
          <i className="fas fa-plus text-xs"></i>
          Create Notice
        </Link>
      </div>

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

        {/* Filter active banner */}
        {filteredNotices !== null && (
          <div className="mt-2 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <span>Showing <strong>{filteredNotices.length}</strong> result{filteredNotices.length !== 1 ? 's' : ''} for "<strong>{searchQuery}</strong>"</span>
            <button onClick={clearSearch} className="ml-auto text-blue-500 hover:text-blue-700 font-medium text-xs">Clear filter</button>
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
                          n.category === 'found-item' ? 'bg-green-100 text-green-700' :
                          n.category === 'lost-item'  ? 'bg-red-100 text-red-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {n.category.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                        <span className="text-xs text-gray-400 uppercase font-semibold">{n.priority}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{n.content?.substring(0, 80)}...</p>
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
      ) : (filteredNotices !== null && filteredNotices.length === 0) ? (
        <div className="bg-white border border-gray-100 shadow-sm p-12 rounded-2xl text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <i className="fas fa-search text-2xl text-gray-300"></i>
          </div>
          <p className="text-gray-600 font-medium">No notices matched your search.</p>
          <button onClick={clearSearch} className="text-sm text-blue-600 hover:underline font-medium">Clear search and show all</button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...(filteredNotices ?? notices)]
            .sort((a, b) => {
              const order = { urgent: 0, medium: 1, low: 2 };
              return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
            })
            .map((notice) => {
            const isUrgent = notice.priority === 'urgent';
            return (
            <div
              key={notice._id}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer transition-all duration-200 group relative ${
                isUrgent
                  ? 'border-2 border-red-300 hover:shadow-lg hover:shadow-red-100'
                  : 'border border-gray-100 hover:shadow-md'
              }`}
              onClick={() => openNoticeDetails(notice)}
            >
              {/* Urgent top accent bar */}
              {isUrgent && <div className="h-1.5 bg-gradient-to-r from-red-500 to-orange-400" />}

              {/* Edit/Delete actions for owner */}
              {userOwnsNotice(notice) && (
                <div className="absolute top-3 right-3 flex gap-2 z-10">
                  <button
                    onClick={(e) => handleEditNotice(notice, e)}
                    className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
                    title="Edit Notice"
                  >
                    <i className="fas fa-pen text-xs"></i>
                  </button>
                  <button
                    onClick={(e) => showDeleteConfirmation(notice, e)}
                    className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                    title="Delete Notice"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
              )}

              {/* Notice image */}
              {notice.attachments && notice.attachments.length > 0 &&
                notice.attachments.some(att => isBase64Image(att)) && (
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={notice.attachments.find(att => isBase64Image(att))}
                    alt="Notice attachment"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Urgent overlay badge on image */}
                  {isUrgent && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block"></span>
                      URGENT
                    </div>
                  )}
                </div>
              )}

              <div className="p-5">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {isUrgent ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 bg-red-100 text-red-700 border border-red-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      Urgent
                    </span>
                  ) : (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${getPriorityBadgeStyle(notice.priority)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDotColor(notice.priority)}`}></span>
                      {notice.priority.charAt(0).toUpperCase() + notice.priority.slice(1)}
                    </span>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getCategoryBadgeStyle(notice.category)}`}>
                    {notice.category.charAt(0).toUpperCase() + notice.category.slice(1).replace(/-/g, ' ')}
                  </span>
                </div>

                <h3 className={`font-semibold text-base mb-2 leading-snug ${isUrgent ? 'text-red-900' : 'text-gray-900'}`}>
                  {notice.title}
                </h3>

                <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {notice.content.length > 150 ? `${notice.content.substring(0, 150)}...` : notice.content}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1.5">
                    <i className="fas fa-calendar-alt"></i>
                    <span>{formatDate(notice.createdAt || new Date())}</span>
                  </div>
                  {notice.endDate && (
                    <div className={`flex items-center gap-1.5 font-medium ${isUrgent ? 'text-red-500' : 'text-gray-400'}`}>
                      <i className="fas fa-hourglass-half"></i>
                      <span>Expires {formatDate(notice.endDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Notice Detail Modal */}
      {showModal && selectedNotice && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[88vh] overflow-y-auto shadow-2xl">

            {/* Image header (if available) */}
            {selectedNotice.attachments && selectedNotice.attachments.some(att => isBase64Image(att)) && (
              <div className="relative h-52 w-full overflow-hidden rounded-t-2xl">
                <img
                  src={selectedNotice.attachments.find(att => isBase64Image(att))}
                  alt="Notice header"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60 rounded-t-2xl"></div>
              </div>
            )}

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${getPriorityBadgeStyle(selectedNotice.priority)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDotColor(selectedNotice.priority)}`}></span>
                    {selectedNotice.priority.charAt(0).toUpperCase() + selectedNotice.priority.slice(1)}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getCategoryBadgeStyle(selectedNotice.category)}`}>
                    {selectedNotice.category.charAt(0).toUpperCase() + selectedNotice.category.slice(1).replace('-', ' ')}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{selectedNotice.title}</h3>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {userOwnsNotice(selectedNotice) && (
                  <>
                    <button
                      onClick={(e) => { e.preventDefault(); closeModal(); navigate(`/edit-notice/${selectedNotice._id}`, { state: { notice: selectedNotice } }); }}
                      className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                      title="Edit Notice"
                    >
                      <i className="fas fa-pen text-xs"></i>
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); closeModal(); showDeleteConfirmation(selectedNotice, e); }}
                      className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Delete Notice"
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </button>
                  </>
                )}
                <button
                  onClick={closeModal}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-times text-gray-500 text-sm"></i>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Date row */}
              <div className="flex items-center justify-between text-xs text-gray-400 mb-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-1.5">
                  <i className="fas fa-calendar-alt"></i>
                  <span>Posted on {formatDate(selectedNotice.createdAt || new Date())}</span>
                </div>
                {selectedNotice.endDate && (
                  <div className="flex items-center gap-1.5">
                    <i className="fas fa-clock"></i>
                    <span>Valid until {formatDate(selectedNotice.endDate)}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed mb-6">
                {selectedNotice.content}
              </p>

              {/* Image gallery */}
              {selectedNotice.attachments && selectedNotice.attachments.some(att => isBase64Image(att)) && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <i className="fas fa-images"></i> Attached Images
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedNotice.attachments
                      .filter(att => isBase64Image(att))
                      .map((imageUrl, index) => (
                        <div key={index} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                          <img
                            src={imageUrl}
                            alt={`Image ${index + 1}`}
                            className="w-full h-36 object-cover"
                          />
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

      {/* Delete Confirmation Modal */}
      {confirmDelete && noticeToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-trash text-red-500"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Notice</h3>
            </div>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-gray-800">"{noticeToDelete.title}"</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteNotice}
                disabled={deleteLoading}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <><i className="fas fa-spinner fa-spin text-xs"></i> Deleting...</>
                ) : (
                  <><i className="fas fa-trash text-xs"></i> Delete Notice</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
