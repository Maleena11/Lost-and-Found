import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import TopBar from '../components/TopBar';
import { getTempUser } from '../../../shared/utils/tempUserAuth';
import AdminNoticeEditModal from '../components/AdminNoticeEditModal';
import NoticePDFGenerator from '../../notice-management/components/NoticePDFGenerator';

export default function AdminNotices() {
  const location = useLocation();
  const isExpiredFilter = new URLSearchParams(location.search).get('filter') === 'expired';
  const navigate = useNavigate();
  const [editingNotice, setEditingNotice]     = useState(null);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [notices, setNotices]                 = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const [activeSection, setActiveSection]     = useState("notices");
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [confirmDelete, setConfirmDelete]     = useState(null);
  const [filterCategory, setFilterCategory]   = useState('all');
  const [filterPriority, setFilterPriority]   = useState('all');
  const [searchTerm, setSearchTerm]           = useState('');
  const [cleanupStatus, setCleanupStatus]     = useState(null);
  const [cleanupLoading, setCleanupLoading]   = useState(false);
  const [showMoreMenu, setShowMoreMenu]       = useState(false);
  const moreMenuRef                           = useRef(null);
  const [archivedNotices, setArchivedNotices] = useState([]);
  const [showArchived, setShowArchived]       = useState(false);
  const [archivedLoading, setArchivedLoading] = useState(false);

  useEffect(() => { fetchNotices(); }, []);

  useEffect(() => {
    const handler = (e) => { if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) setShowMoreMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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

  const handleDeleteConfirm = async (id) => {
    setDeleteLoading(true);
    try {
      await axios.delete(`http://localhost:3001/api/notices/${id}`);
      setNotices(notices.filter(n => n._id !== id));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting notice:', error);
      alert('Failed to delete notice');
    } finally {
      setDeleteLoading(false);
    }
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const filteredNotices = notices.filter(notice => {
    if (isExpiredFilter) {
      if (!notice.endDate) return false;
      const [y, m, d] = notice.endDate.toString().substring(0, 10).split('-').map(Number);
      if (new Date(y, m - 1, d) >= today) return false;
    }
    if (filterCategory !== 'all' && notice.category !== filterCategory) return false;
    if (filterPriority !== 'all' && notice.priority !== filterPriority) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return notice.title.toLowerCase().includes(s) || notice.content.toLowerCase().includes(s);
    }
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const [year, month, day] = dateString.toString().substring(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleEditClick = (notice, e) => {
    if (e) e.stopPropagation();
    setEditingNotice(notice);
    setShowEditModal(true);
  };

  const handleNoticeUpdate = (updatedNotice) => {
    setNotices(notices.map(n => n._id === updatedNotice._id ? updatedNotice : n));
  };

  const fetchArchivedNotices = async () => {
    setArchivedLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/notices/archived');
      setArchivedNotices(response.data.data || []);
    } catch (err) {
      console.error("Error fetching archived notices:", err);
    } finally {
      setArchivedLoading(false);
    }
  };

  const toggleArchived = () => {
    if (!showArchived) fetchArchivedNotices();
    setShowArchived(prev => !prev);
  };

  const handleCleanupExpired = async () => {
    setCleanupLoading(true);
    setCleanupStatus(null);
    try {
      const response = await axios.delete('http://localhost:3001/api/notices/expired');
      const { deleted } = response.data;
      setCleanupStatus({ type: 'success', deleted });
      if (deleted > 0) fetchNotices();
    } catch (err) {
      console.error('Cleanup error:', err);
      setCleanupStatus({ type: 'error' });
    } finally {
      setCleanupLoading(false);
      setTimeout(() => setCleanupStatus(null), 5000);
    }
  };

  const getFilterSummary = () => {
    const filters = [];
    if (filterCategory !== 'all') filters.push(`Category: ${filterCategory}`);
    if (filterPriority !== 'all') filters.push(`Priority: ${filterPriority}`);
    if (searchTerm) filters.push(`Search: "${searchTerm}"`);
    return filters.length === 0 ? "All notices" : `Filtered by: ${filters.join(', ')}`;
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'urgent': return { bg: 'bg-red-100 text-red-700 border border-red-200',   dot: 'bg-red-500 animate-ping', label: 'Urgent',  icon: 'fas fa-exclamation-circle text-red-500' };
      case 'medium': return { bg: 'bg-green-100 text-green-700 border border-green-200', dot: 'bg-green-500', label: 'Medium', icon: 'fas fa-minus-circle text-green-500' };
      case 'low':    return { bg: 'bg-yellow-100 text-yellow-700 border border-yellow-200', dot: 'bg-yellow-400', label: 'Low',    icon: 'fas fa-arrow-circle-down text-yellow-500' };
      default:       return { bg: 'bg-gray-100 text-gray-600 border border-gray-200',  dot: 'bg-gray-400', label: priority, icon: 'fas fa-circle text-gray-400' };
    }
  };

  const getCategoryConfig = (category) => {
    switch (category) {
      case 'lost-item':    return { bg: 'bg-orange-50 text-orange-700 border border-orange-200', icon: 'fas fa-search text-orange-500',      label: 'Lost Item' };
      case 'found-item':   return { bg: 'bg-cyan-50 text-cyan-800 border border-cyan-300', icon: 'fas fa-hand-holding text-cyan-600', label: 'Found Item' };
      case 'announcement': return { bg: 'bg-blue-100 text-blue-700 border border-blue-200',     icon: 'fas fa-bullhorn text-blue-500',       label: 'Announcement' };
      case 'advisory':     return { bg: 'bg-purple-50 text-purple-700 border border-purple-200', icon: 'fas fa-info-circle text-purple-500',  label: 'Advisory' };
      default:             return { bg: 'bg-gray-50 text-gray-600 border border-gray-200',      icon: 'fas fa-tag text-gray-400',            label: category };
    }
  };

  const getRowAccent = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-l-4 border-l-red-400';
      case 'medium': return 'border-l-4 border-l-green-400';
      case 'low':    return 'border-l-4 border-l-yellow-400';
      default:       return 'border-l-4 border-l-gray-200';
    }
  };

  const isBase64Image = (str) => str && (
    str.startsWith('data:image/jpeg') || str.startsWith('data:image/png') ||
    str.startsWith('data:image/gif')  || str.startsWith('data:image/webp') ||
    str.startsWith('data:image/svg')
  );

  const urgentCount = notices.filter(n => n.priority === 'urgent').length;
  const mediumCount = notices.filter(n => n.priority === 'medium').length;
  const lowCount    = notices.filter(n => n.priority === 'low').length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 lg:ml-64 flex flex-col">
        <TopBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title="Notices Management"
          subtitle="Create, edit and manage university notices"
        />

        <main className="flex-1 p-4 sm:p-6">

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl" style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <i className="fas fa-bullhorn text-3xl" style={{ color: "#3b82f6" }}></i>
              </div>
              <div>
                <h2 className="font-extrabold text-3xl leading-tight" style={{ color: "#2a4d7a" }}>All Notices</h2>
                <p className="text-base text-gray-400 leading-none mt-1">University announcements & updates</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* More Actions Dropdown */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setShowMoreMenu(p => !p)}
                  className="flex items-center gap-0 px-0 py-0 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95 shadow-sm overflow-hidden"
                  style={{ background: showMoreMenu ? "#2a4d7a" : "#3a6496", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#2a4d7a"}
                  onMouseLeave={e => { if (!showMoreMenu) e.currentTarget.style.background = "#3a6496"; }}
                  onMouseDown={e => e.currentTarget.style.background = "#162d4a"}
                  onMouseUp={e => e.currentTarget.style.background = "#2a4d7a"}
                >
                  {/* Left: icon + label */}
                  <span className="flex items-center gap-2.5 px-3.5 py-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0" style={{ background: "rgba(59,130,246,0.2)" }}>
                      <i className="fas fa-sliders-h text-xs" style={{ color: "#60a5fa" }}></i>
                    </span>
                    <span>Actions</span>
                  </span>
                  {/* Divider + chevron section */}
                  <span className="flex items-center self-stretch px-2.5" style={{ borderLeft: "1px solid rgba(255,255,255,0.15)", background: showMoreMenu ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.08)" }}>
                    <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${showMoreMenu ? 'rotate-180' : ''}`} style={{ color: "#93c5fd" }}></i>
                  </span>
                </button>

                {showMoreMenu && (
                  <div className="absolute right-0 mt-1.5 w-52 rounded-xl shadow-xl z-20 overflow-hidden" style={{ background: "#1e3a5f", border: "1px solid rgba(59,130,246,0.2)" }}>
                    {/* Clean Expired */}
                    <button
                      onClick={() => { handleCleanupExpired(); setShowMoreMenu(false); }}
                      disabled={cleanupLoading}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                      style={{ color: "#ffffff" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.12)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0" style={{ background: "rgba(59,130,246,0.2)" }}>
                        {cleanupLoading
                          ? <svg className="animate-spin w-3.5 h-3.5" style={{ color: "#60a5fa" }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                          : <i className="fas fa-broom text-xs" style={{ color: "#60a5fa" }}></i>
                        }
                      </span>
                      {cleanupLoading ? "Cleaning..." : "Clean Expired"}
                    </button>
                    {/* Divider */}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />
                    {/* Export PDF */}
                    <div onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.12)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"} style={{ transition: "background 0.15s" }}>
                      <NoticePDFGenerator notices={filteredNotices} filterSummary={getFilterSummary()} />
                    </div>
                  </div>
                )}
              </div>

              {/* Archived */}
              <button
                onClick={toggleArchived}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95 shadow-sm"
                style={{
                  background: showArchived ? "#2a4d7a" : "#3a6496",
                  border: showArchived ? "1px solid rgba(59,130,246,0.35)" : "1px solid rgba(255,255,255,0.08)",
                  color: showArchived ? "#93c5fd" : "#ffffff"
                }}
                onMouseEnter={e => { if (!showArchived) e.currentTarget.style.background = "#2a4d7a"; }}
                onMouseLeave={e => { if (!showArchived) e.currentTarget.style.background = "#3a6496"; }}
                onMouseDown={e => e.currentTarget.style.background = "#162d4a"}
                onMouseUp={e => e.currentTarget.style.background = "#2a4d7a"}
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0" style={{ background: "rgba(59,130,246,0.2)" }}>
                  <i className="fas fa-archive text-xs" style={{ color: "#60a5fa" }}></i>
                </span>
                <span>Archived</span>
                {archivedNotices.length > 0 && (
                  <span className="text-sm font-bold" style={{ color: "#ffffff" }}>
                    {archivedNotices.length}
                  </span>
                )}
              </button>

              {/* Create Notice — primary action */}
              <Link
                to="/create-notice"
                className="relative flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 active:scale-95 overflow-hidden group"
                style={{
                  background: "linear-gradient(135deg, #1d6fce 0%, #1a56a8 50%, #1e3a5f 100%)",
                  border: "1px solid rgba(99,160,255,0.5)",
                  color: "#ffffff",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #2979d8 0%, #1d6fce 50%, #2a4d7a 100%)";
                  e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.2)";
                  e.currentTarget.style.borderColor = "rgba(99,160,255,0.8)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #1d6fce 0%, #1a56a8 50%, #1e3a5f 100%)";
                  e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.15)";
                  e.currentTarget.style.borderColor = "rgba(99,160,255,0.5)";
                }}
                onMouseDown={e => e.currentTarget.style.background = "linear-gradient(135deg, #1a56a8 0%, #1043a0 50%, #162d4a 100%)"}
                onMouseUp={e => e.currentTarget.style.background = "linear-gradient(135deg, #2979d8 0%, #1d6fce 50%, #2a4d7a 100%)"}
              >
                {/* Diagonal gloss */}
                <span className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)" }} />
                {/* Shimmer sweep */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }} />
                <span className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0" style={{ background: "rgba(255,255,255,0.2)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)" }}>
                  <i className="fas fa-plus text-xs text-white"></i>
                </span>
                <span style={{ color: "#ffffff", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>Create Notice</span>
              </Link>
            </div>
          </div>

          {/* Expired filter indicator */}
          {isExpiredFilter && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
              <i className="fas fa-calendar-times text-rose-500"></i>
              Showing expired notices only — notices whose end date has passed.
              <Link to="/admin/dashboard/notices" className="ml-auto text-xs text-rose-600 hover:text-rose-800 underline font-semibold">
                View all notices
              </Link>
            </div>
          )}

          {/* Cleanup status toast */}
          {cleanupStatus && (
            <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-sm ${
              cleanupStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <i className={`fas ${cleanupStatus.type === 'success' ? 'fa-check-circle text-green-500' : 'fa-exclamation-circle text-red-500'}`}></i>
              {cleanupStatus.type === 'success'
                ? cleanupStatus.deleted === 0 ? 'No expired notices found.' : `${cleanupStatus.deleted} expired notice(s) removed successfully.`
                : 'Cleanup failed. Please try again.'}
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Notices', value: notices.length, icon: 'fas fa-layer-group', bg: 'bg-blue-100', iconBg: 'bg-blue-200', iconColor: 'text-blue-600', border: 'border-2 border-blue-300', textColor: 'text-blue-700', subColor: 'text-blue-400' },
              { label: 'Urgent',        value: urgentCount,    icon: 'fas fa-exclamation-circle', bg: 'bg-red-100',    iconBg: 'bg-red-200',    iconColor: 'text-red-600',   border: 'border-2 border-red-300',   textColor: 'text-red-700',   subColor: 'text-red-400' },
              { label: 'Medium',        value: mediumCount,    icon: 'fas fa-minus-circle',       bg: 'bg-green-100',  iconBg: 'bg-green-200',  iconColor: 'text-green-600', border: 'border-2 border-green-300', textColor: 'text-green-700', subColor: 'text-green-400' },
              { label: 'Low',           value: lowCount,       icon: 'fas fa-arrow-circle-down',  bg: 'bg-yellow-100', iconBg: 'bg-yellow-200', iconColor: 'text-yellow-600',border: 'border-2 border-yellow-300',textColor: 'text-yellow-700',subColor: 'text-yellow-500' },
            ].map(({ label, value, icon, bg, iconBg, iconColor, border, textColor, subColor }) => (
              <div key={label} className={`${bg} ${border} rounded-2xl px-5 py-5 flex items-center gap-4 shadow-md hover:shadow-lg transition-shadow duration-200`}>
                <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0`}>
                  <i className={`${icon} ${iconColor} text-2xl`}></i>
                </div>
                <div>
                  <p className={`text-4xl font-black ${textColor} leading-none`}>{value}</p>
                  <p className={`text-sm ${textColor} font-bold mt-1`}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Archived Notices Panel */}
          {showArchived && (
            <div className="mb-6">
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-archive text-blue-500 text-xs"></i>
                  </div>
                  <span className="text-sm font-bold text-blue-700">Archived Notices</span>
                  {archivedNotices.length > 0 && (
                    <span className="ml-1 text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">{archivedNotices.length}</span>
                  )}
                  <button onClick={() => setShowArchived(false)} className="ml-auto w-6 h-6 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors">
                    <i className="fas fa-times text-blue-500 text-xs"></i>
                  </button>
                </div>
                <div className="p-4">
                  {archivedLoading ? (
                    <div className="flex items-center justify-center py-10 gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
                      <span className="text-sm text-gray-400">Loading archived notices...</span>
                    </div>
                  ) : archivedNotices.length === 0 ? (
                    <div className="bg-white border border-gray-100 shadow-sm p-10 rounded-2xl text-center flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-archive text-2xl text-blue-300"></i>
                      </div>
                      <p className="text-gray-600 font-medium">No archived notices yet.</p>
                      <p className="text-sm text-gray-400">Urgent notices that reach their deadline will appear here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {archivedNotices.map((notice) => {
                        const cc = getCategoryConfig(notice.category);
                        return (
                          <div key={notice._id} className="bg-white rounded-2xl border-2 border-gray-300 ring-1 ring-gray-200 overflow-hidden hover:shadow-md hover:border-gray-400 transition-all duration-200">
                            <div className="h-1.5 bg-gradient-to-r from-blue-400 to-gray-400" />
                            <div className="p-5">
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                                  <i className="fas fa-archive text-xs"></i> Archived
                                </span>
                                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-700 border border-red-200">
                                  Urgent
                                </span>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${cc.bg}`}>
                                  <i className={`${cc.icon} text-xs`}></i>
                                  {cc.label}
                                </span>
                              </div>
                              <h3 className="font-semibold text-base mb-2 leading-snug text-gray-500 line-through">
                                {notice.title}
                              </h3>
                              <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                                {notice.content.length > 150 ? `${notice.content.substring(0, 150)}...` : notice.content}
                              </p>
                              <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-1.5">
                                  <i className="fas fa-calendar-alt"></i>
                                  <span>Posted {formatDate(notice.createdAt || new Date())}</span>
                                </div>
                                {notice.archivedAt && (
                                  <div className="flex items-center gap-1.5 text-blue-400 font-medium">
                                    <i className="fas fa-archive"></i>
                                    <span>Archived {formatDate(notice.archivedAt)}</span>
                                  </div>
                                )}
                              </div>
                              <div className="mt-4 flex justify-center">
                                <button
                                  onClick={() => navigate('/create-notice', { state: { repost: notice } })}
                                  className="flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
                                >
                                  <i className="fas fa-redo text-xs"></i>
                                  Repost to Notice Board
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Filter & Search Panel */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl shadow-sm mb-6 overflow-hidden">
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-filter text-blue-500 text-xs"></i>
              </div>
              <span className="text-sm font-bold text-blue-700">Filter & Search</span>
              {(searchTerm || filterCategory !== 'all' || filterPriority !== 'all') && (
                <button
                  onClick={() => { setSearchTerm(''); setFilterCategory('all'); setFilterPriority('all'); }}
                  className="ml-auto text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg border border-red-100 transition-colors"
                >
                  <i className="fas fa-undo text-xs"></i> Reset
                </button>
              )}
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-blue-50">
              {/* Search */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Search</label>
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Title or content..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors"
                  />
                </div>
              </div>
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
                <div className="relative">
                  <i className="fas fa-tag absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 appearance-none transition-colors"
                  >
                    <option value="all">All Categories</option>
                    <option value="lost-item">Lost Item Notice</option>
                    <option value="found-item">Found Item Notice</option>
                    <option value="announcement">Announcement</option>
                    <option value="advisory">Advisory</option>
                  </select>
                </div>
              </div>
              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Priority</label>
                <div className="relative">
                  <i className="fas fa-flag absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <select
                    value={filterPriority}
                    onChange={e => setFilterPriority(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 appearance-none transition-colors"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>
            {filteredNotices.length !== notices.length && (
              <div className="px-4 py-2 text-xs font-medium flex items-center gap-1.5 border-t" style={{ background: "rgba(30,58,95,0.06)", borderColor: "rgba(30,58,95,0.1)", color: "#2a4d7a" }}>
                <i className="fas fa-info-circle"></i>
                Showing <strong>{filteredNotices.length}</strong> of <strong>{notices.length}</strong> notices
              </div>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-sm text-gray-400">Loading notices...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 p-8 rounded-2xl text-red-700 text-center flex flex-col items-center gap-2">
              <i className="fas fa-exclamation-circle text-3xl text-red-400"></i>
              <p className="font-medium">{error}</p>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="bg-white border border-gray-100 shadow-sm p-12 rounded-2xl text-center flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <i className="fas fa-bell-slash text-2xl text-gray-300"></i>
              </div>
              <p className="text-gray-600 font-medium">No notices matched your filters.</p>
              <button
                onClick={() => { setSearchTerm(''); setFilterCategory('all'); setFilterPriority('all'); }}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {/* Table header */}
              <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest flex items-center gap-1.5">
                  <i className="fas fa-list text-blue-500"></i> All Notices
                </p>
                <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full">
                  {filteredNotices.length} notice{filteredNotices.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-50 border-b border-blue-100">
                      <th className="px-5 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Notice</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Category</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Item Image</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Priority</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Date Range</th>
                      <th className="px-5 py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredNotices]
                      .sort((a, b) => {
                        const order = { urgent: 0, medium: 1, low: 2 };
                        return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
                      })
                      .map((notice) => {
                        const pc = getPriorityConfig(notice.priority);
                        const cc = getCategoryConfig(notice.category);
                        return (
                          <tr
                            key={notice._id}
                            className="hover:bg-gray-50 transition-colors group border-b border-gray-200"
                          >
                            {/* Notice title + preview */}
                            <td className="px-5 py-4">
                              <p className="text-sm font-bold text-gray-900 max-w-xs truncate">{notice.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate leading-relaxed">
                                {notice.content.substring(0, 70)}...
                              </p>
                            </td>

                            {/* Category badge */}
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${cc.bg}`}>
                                <i className={`${cc.icon} text-xs`}></i>
                                {cc.label}
                              </span>
                            </td>

                            {/* Item Image */}
                            <td className="px-5 py-4">
                              {notice.attachments && notice.attachments.some(a => isBase64Image(a)) ? (
                                <img
                                  src={notice.attachments.find(a => isBase64Image(a))}
                                  alt="Item"
                                  className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                                  <i className="fas fa-image text-gray-300 text-sm"></i>
                                </div>
                              )}
                            </td>

                            {/* Priority badge */}
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${pc.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pc.dot}`}></span>
                                {pc.label}
                              </span>
                            </td>

                            {/* Date range */}
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                  <i className="fas fa-calendar-alt text-gray-400 text-xs"></i>
                                  <span>{formatDate(notice.startDate)}</span>
                                </div>
                                {notice.endDate && (
                                  <div className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
                                    <i className="fas fa-hourglass-end text-xs"></i>
                                    <span>Exp. {formatDate(notice.endDate)}</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-4 text-right">
                              <div className="flex justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={e => handleEditClick(notice, e)}
                                  className="flex items-center gap-1.5 text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                                  title="Edit"
                                >
                                  <i className="fas fa-pen text-xs"></i>
                                  Edit
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(notice._id)}
                                  className="flex items-center gap-1.5 text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
                                  title="Delete"
                                >
                                  <i className="fas fa-trash text-xs"></i>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit Notice Modal */}
      <AdminNoticeEditModal
        notice={editingNotice}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={handleNoticeUpdate}
      />

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-red-500 to-rose-400"></div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-trash text-red-500 text-lg"></i>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Delete Notice</h3>
                  <p className="text-sm text-gray-500">Are you sure you want to delete this notice? This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setConfirmDelete(null)}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteConfirm(confirmDelete)}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-semibold flex items-center gap-2 shadow-sm disabled:opacity-60"
                >
                  {deleteLoading
                    ? <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>Deleting...</>
                    : <><i className="fas fa-trash text-xs"></i>Delete Notice</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
