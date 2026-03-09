import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import TopBar from '../components/TopBar';
import { getTempUser } from '../../../shared/utils/tempUserAuth';
import AdminNoticeEditModal from '../components/AdminNoticeEditModal';
import NoticePDFGenerator from '../../notice-management/components/NoticePDFGenerator';

export default function AdminNotices() {
  // Existing state variables
  const [editingNotice, setEditingNotice] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("notices");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cleanupStatus, setCleanupStatus] = useState(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  useEffect(() => {
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

  const handleDeleteConfirm = async (id) => {
    setDeleteLoading(true);
    try {
      await axios.delete(`http://localhost:3001/api/notices/${id}`);
      setNotices(notices.filter(notice => notice._id !== id));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting notice:', error);
      alert('Failed to delete notice');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter and search notices
  const filteredNotices = notices.filter(notice => {
    // Apply category filter
    if (filterCategory !== 'all' && notice.category !== filterCategory) {
      return false;
    }
    
    // Apply priority filter
    if (filterPriority !== 'all' && notice.priority !== filterPriority) {
      return false;
    }
    
    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        notice.title.toLowerCase().includes(searchLower) ||
        notice.content.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get priority badge styling
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return "bg-red-100 text-red-800 border border-red-300";
      case 'high':
        return "bg-orange-100 text-orange-800 border border-orange-300";
      case 'medium':
        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
      case 'low':
        return "bg-blue-100 text-blue-800 border border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300";
    }
  };

  // Add this function to handle opening the edit modal
  const handleEditClick = (notice, e) => {
    if (e) e.stopPropagation();
    setEditingNotice(notice);
    setShowEditModal(true);
  };

  // Add this function to handle notice updates
  const handleNoticeUpdate = (updatedNotice) => {
    // Update the notices array with the updated notice
    setNotices(notices.map(notice => 
      notice._id === updatedNotice._id ? updatedNotice : notice
    ));
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

  // Create filter summary for PDF report
  const getFilterSummary = () => {
    const filters = [];
    
    if (filterCategory !== 'all') {
      filters.push(`Category: ${filterCategory.charAt(0).toUpperCase() + filterCategory.slice(1)}`);
    }
    
    if (filterPriority !== 'all') {
      filters.push(`Priority: ${filterPriority.charAt(0).toUpperCase() + filterPriority.slice(1)}`);
    }
    
    if (searchTerm) {
      filters.push(`Search: "${searchTerm}"`);
    }
    
    if (filters.length === 0) {
      return "All notices";
    }
    
    return `Filtered by: ${filters.join(', ')}`;
  };

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

        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <div></div>
            <div className="flex gap-3 items-center flex-wrap">
              {cleanupStatus && (
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                  cleanupStatus.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {cleanupStatus.type === 'success'
                    ? cleanupStatus.deleted === 0
                      ? 'No expired notices found.'
                      : `${cleanupStatus.deleted} expired notice(s) removed.`
                    : 'Cleanup failed. Try again.'}
                </span>
              )}

              <button
                onClick={handleCleanupExpired}
                disabled={cleanupLoading}
                className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors flex items-center shadow-sm disabled:opacity-60"
                title="Delete all notices whose expiry date has passed"
              >
                {cleanupLoading ? (
                  <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <i className="fas fa-clock mr-2"></i>
                )}
                Clean Expired
              </button>

              {/* PDF generator button */}
              <NoticePDFGenerator
                notices={filteredNotices}
                filterSummary={getFilterSummary()}
              />

              <Link
                to="/create-notice"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
              >
                <i className="fas fa-plus mr-2"></i>
                Create Notice
              </Link>
            </div>
          </div>

          {/* Filters and search */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or content"
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 w-full"
                >
                  <option value="all">All Categories</option>
                  <option value="lost-item">Lost Item Notice</option>
                  <option value="found-item">Found Item Notice</option>
                  <option value="announcement">Announcement</option>
                  <option value="advisory">Advisory</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 w-full"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notices list */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 p-4 rounded-lg text-red-700 text-center">
              {error}
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="bg-white p-8 rounded-lg text-center text-gray-600 shadow-sm">
              <i className="fas fa-info-circle text-4xl mb-4 text-blue-500"></i>
              <p className="text-lg">No notices found matching your criteria.</p>
              {(searchTerm || filterCategory !== 'all' || filterPriority !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('all');
                    setFilterPriority('all');
                  }}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category & Priority
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Range
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posted By
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNotices.map((notice) => (
                    <tr key={notice._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {notice.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                          {notice.content.substring(0, 60)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          <span className="px-2 py-1 text-xs rounded-full inline-flex items-center justify-center bg-blue-100 text-blue-800">
                            {notice.category.charAt(0).toUpperCase() + notice.category.slice(1).replace('-', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full inline-flex items-center justify-center ${getPriorityBadge(notice.priority)}`}>
                            {notice.priority.charAt(0).toUpperCase() + notice.priority.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(notice.startDate)}
                          {notice.endDate && (
                            <>
                              <br />
                              <span className="text-xs">to</span>
                              <br />
                              {formatDate(notice.endDate)}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {notice.userId || notice.postedBy || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => handleEditClick(notice, e)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100"
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => setConfirmDelete(notice._id)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100"
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this notice? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleteLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(confirmDelete)}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
              >
                {deleteLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete Notice"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}