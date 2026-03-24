import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const MEDAL_COLORS = [
  'bg-yellow-400 text-white',   // 1st — gold
  'bg-gray-300 text-gray-700',  // 2nd — silver
  'bg-amber-600 text-white',    // 3rd — bronze
];

const avatarColor = (name) => {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
};

const initials = (name) =>
  name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';

export default function TopReporters() {
  const [reporters, setReporters] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, usersRes] = await Promise.all([
        axios.get('http://localhost:3001/api/lost-found'),
        axios.get('http://localhost:3001/api/users'),
      ]);

      const items = itemsRes.data.data || [];
      const users = Array.isArray(usersRes.data) ? usersRes.data : [];

      // Build a userId → user lookup map
      const userMap = {};
      users.forEach(u => { userMap[u._id] = u; });

      // Count items per userId
      const counts = {};
      const typeCounts = {}; // track lost vs found per user
      items.forEach(item => {
        const uid = item.userId || 'unknown';
        counts[uid] = (counts[uid] || 0) + 1;
        if (!typeCounts[uid]) typeCounts[uid] = { lost: 0, found: 0 };
        item.itemType === 'lost' ? typeCounts[uid].lost++ : typeCounts[uid].found++;
      });

      // Sort descending and take top 7
      const top = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 7)
        .map(([uid, count], idx) => {
          const user = userMap[uid];
          return {
            rank: idx + 1,
            uid,
            name:  user?.fullname || user?.name || 'Unknown User',
            email: user?.email    || '',
            status: user?.status  || '',
            role:   user?.role    || '',
            count,
            lost:  typeCounts[uid]?.lost  || 0,
            found: typeCounts[uid]?.found || 0,
          };
        });

      setReporters(top);
      setTotalItems(items.length);
    } catch (err) {
      console.error('Error fetching top reporters:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Top Reporters</h2>
        <Link to="/admin/dashboard/users" className="text-blue-600 hover:underline text-sm">
          View All Users
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : reporters.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">No report data available</p>
      ) : (
        <div className="space-y-3">
          {reporters.map(({ rank, name, email, status, role, count, lost, found }) => {
            const sharePct = totalItems ? Math.round((count / totalItems) * 100) : 0;
            const medal    = MEDAL_COLORS[rank - 1];

            return (
              <div key={rank} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                {/* Rank badge */}
                <div className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${medal || 'bg-gray-100 text-gray-500'}`}>
                  {rank}
                </div>

                {/* Avatar */}
                <span className={`inline-flex items-center justify-center rounded-full w-9 h-9 text-sm font-semibold text-white flex-shrink-0 ${avatarColor(name)}`}>
                  {initials(name)}
                </span>

                {/* Name + email */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                    {role === 'Admin' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Admin</span>
                    )}
                    {status === 'Inactive' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Inactive</span>
                    )}
                  </div>
                  {email && <p className="text-xs text-gray-400 truncate">{email}</p>}

                  {/* Mini breakdown bar */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 flex h-1.5 rounded-full overflow-hidden bg-gray-100">
                      {lost  > 0 && <div className="bg-red-400  h-full transition-all" style={{ width: `${Math.round((lost  / count) * 100)}%` }} title={`${lost} lost`}></div>}
                      {found > 0 && <div className="bg-teal-400 h-full transition-all" style={{ width: `${Math.round((found / count) * 100)}%` }} title={`${found} found`}></div>}
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {lost > 0 && <span className="text-red-400">{lost}L </span>}
                      {found > 0 && <span className="text-teal-500">{found}F</span>}
                    </span>
                  </div>
                </div>

                {/* Count + share */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-bold text-gray-800">{count}</p>
                  <p className="text-[10px] text-gray-400">{sharePct}% of total</p>
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span> Lost
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span> Found
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
