import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function UserStats() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    newThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('http://localhost:3001/api/users');
      const users = Array.isArray(data) ? data : [];

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const total        = users.length;
      const active       = users.filter(u => u.status === 'Active').length;
      const inactive     = users.filter(u => u.status === 'Inactive').length;
      const admins       = users.filter(u => u.role === 'Admin').length;
      const newThisMonth = users.filter(u => u.createdAt && new Date(u.createdAt) >= startOfMonth).length;

      setStats({ total, active, inactive, admins, newThisMonth });

      const recent = [...users]
        .filter(u => u.createdAt)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentUsers(recent);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const initials = (name) =>
    name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';

  const avatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">User Statistics</h2>
        <Link to="/admin/dashboard/users" className="text-blue-600 hover:underline text-sm">
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
              <p className="text-sm text-blue-700 font-medium">Total Users</p>
              <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-sm text-green-700 font-medium">Active</p>
              <p className="text-2xl font-bold text-green-800">{stats.active}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <p className="text-sm text-purple-700 font-medium">Admins</p>
              <p className="text-2xl font-bold text-purple-800">{stats.admins}</p>
            </div>
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
              <p className="text-sm text-teal-700 font-medium">New This Month</p>
              <p className="text-2xl font-bold text-teal-800">{stats.newThisMonth}</p>
            </div>
          </div>

          <h3 className="text-md font-semibold text-gray-800 mb-3">Recently Joined</h3>
          <div className="space-y-2">
            {recentUsers.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-2">No users found</p>
            ) : (
              recentUsers.map(user => (
                <div
                  key={user._id}
                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center rounded-full w-8 h-8 text-xs font-semibold text-white ${avatarColor(user.name)}`}>
                      {initials(user.name)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.role}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status}
                    </span>
                    {user.createdAt && (
                      <span className="text-xs text-gray-400">{formatDate(user.createdAt)}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
