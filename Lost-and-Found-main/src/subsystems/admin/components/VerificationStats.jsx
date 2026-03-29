import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function VerificationStats() {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [recentPending, setRecentPending] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('http://localhost:3001/api/verification');
      const requests = Array.isArray(data) ? data : (data.data || []);

      const total    = requests.length;
      const pending  = requests.filter(r => r.status === 'pending').length;
      const approved = requests.filter(r => r.status === 'approved').length;
      const rejected = requests.filter(r => r.status === 'rejected').length;

      setStats({ total, pending, approved, rejected });

      const recent = [...requests]
        .filter(r => r.status === 'pending')
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
        .slice(0, 5);
      setRecentPending(recent);
    } catch (error) {
      console.error('Error fetching verification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Verification Requests</h2>
        <Link to="/admin/dashboard/verification" className="text-blue-600 hover:underline text-sm">
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
              <p className="text-sm text-blue-700 font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <p className="text-sm text-yellow-700 font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-sm text-green-700 font-medium">Approved</p>
              <p className="text-2xl font-bold text-green-800">{stats.approved}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <p className="text-sm text-red-700 font-medium">Rejected</p>
              <p className="text-2xl font-bold text-red-800">{stats.rejected}</p>
            </div>
          </div>

          {stats.pending > 0 && (
            <div className="mb-4 flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-2.5 rounded-lg">
              <i className="fas fa-exclamation-triangle text-yellow-500 flex-shrink-0"></i>
              <span><strong>{stats.pending}</strong> request{stats.pending !== 1 ? 's' : ''} awaiting your review</span>
              <Link to="/admin/dashboard/verification" className="ml-auto text-yellow-700 hover:text-yellow-900 font-medium underline underline-offset-2 flex-shrink-0">
                Review now
              </Link>
            </div>
          )}

          <h3 className="text-md font-semibold text-gray-800 mb-3">Pending Requests</h3>
          <div className="space-y-2">
            {recentPending.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-2">No pending requests</p>
            ) : (
              recentPending.map(req => (
                <div
                  key={req._id}
                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {req.itemId?.itemName || 'Unknown Item'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500">
                        {req.claimantInfo?.name || 'Unknown claimant'}
                      </span>
                      {req.itemId?.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {req.itemId.category}
                        </span>
                      )}
                      {req.submittedAt && (
                        <span className="text-xs text-gray-400">{formatDate(req.submittedAt)}</span>
                      )}
                    </div>
                  </div>
                  <Link
                    to="/admin/dashboard/verification"
                    className="ml-3 flex-shrink-0 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium px-2.5 py-1 rounded-md transition-colors"
                  >
                    Review
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
