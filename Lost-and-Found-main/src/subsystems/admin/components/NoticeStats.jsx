import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function NoticeStats() {
  const [stats, setStats] = useState({
    total: 0,
    emergency: 0,
    announcement: 0,
    serviceUpdate: 0,
    urgent: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentNotices, setRecentNotices] = useState([]);

  useEffect(() => {
    fetchNoticeStats();
  }, []);

  const fetchNoticeStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/notices');
      const notices = response.data.data || [];
      
      // Calculate stats
      const total = notices.length;
      const emergency = notices.filter(n => n.category === 'emergency').length;
      const announcement = notices.filter(n => n.category === 'announcement').length;
      const serviceUpdate = notices.filter(n => n.category === 'service-update').length;
      const urgent = notices.filter(n => n.priority === 'urgent').length;
      
      setStats({
        total,
        emergency,
        announcement,
        serviceUpdate,
        urgent
      });
      
      // Get 5 most recent notices
      const recent = [...notices]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      
      setRecentNotices(recent);
    } catch (error) {
      console.error("Error fetching notice stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Notice Statistics</h2>
        <Link to="/admin/dashboard/notices" className="text-blue-600 hover:underline text-sm">
          View All
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-700 font-medium">Total Notices</p>
              <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <p className="text-sm text-red-700 font-medium">Emergency</p>
              <p className="text-2xl font-bold text-red-800">{stats.emergency}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <p className="text-sm text-purple-700 font-medium">Announcements</p>
              <p className="text-2xl font-bold text-purple-800">{stats.announcement}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <p className="text-sm text-orange-700 font-medium">Urgent Priority</p>
              <p className="text-2xl font-bold text-orange-800">{stats.urgent}</p>
            </div>
          </div>
          
          <h3 className="text-md font-semibold text-gray-800 mb-3">Recent Notices</h3>
          <div className="space-y-2">
            {recentNotices.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-2">No notices found</p>
            ) : (
              recentNotices.map(notice => (
                <div 
                  key={notice._id} 
                  className="flex justify-between items-start py-2 px-3 rounded-md hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-medium truncate">{notice.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        notice.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        notice.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {notice.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(notice.createdAt || notice.startDate)}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/edit-notice/${notice._id}`}
                    className="text-blue-600 hover:text-blue-800 ml-2"
                  >
                    <i className="fas fa-pencil-alt"></i>
                  </Link>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}