import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function ItemsStats() {
  const [stats, setStats] = useState({
    total: 0,
    lost: 0,
    found: 0,
    claimed: 0,
    returned: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    fetchItemStats();
  }, []);

  const fetchItemStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/lost-found');
      const items = response.data.data || [];
      
      // Calculate stats
      const total = items.length;
      const lost = items.filter(item => item.itemType === 'lost').length;
      const found = items.filter(item => item.itemType === 'found').length;
      const claimed = items.filter(item => item.status === 'claimed').length;
      const returned = items.filter(item => item.status === 'returned').length;
      const pending = items.filter(item => item.status === 'pending').length;
      
      setStats({
        total,
        lost,
        found,
        claimed,
        returned,
        pending
      });
      
      // Get 5 most recent items
      const recent = [...items]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      
      setRecentItems(recent);
    } catch (error) {
      console.error("Error fetching item stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'claimed':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Item Statistics</h2>
        <Link to="/admin/dashboard/allitems" className="text-blue-600 hover:underline text-sm">
          View All
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-700 font-medium">Total Items</p>
              <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <p className="text-sm text-orange-700 font-medium">Lost Items</p>
              <p className="text-2xl font-bold text-orange-800">{stats.lost}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-sm text-green-700 font-medium">Found Items</p>
              <p className="text-2xl font-bold text-green-800">{stats.found}</p>
            </div>
          </div>
          
          <h3 className="text-md font-semibold text-gray-800 mb-3">Recent Items</h3>
          <div className="space-y-2">
            {recentItems.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-2">No items found</p>
            ) : (
              recentItems.map(item => (
                <div 
                  key={item._id} 
                  className="flex justify-between items-start py-2 px-3 rounded-md hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-medium truncate">{item.itemName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.itemType === 'lost' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {item.itemType}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(item.createdAt || item.dateTime)}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/edit-item/${item._id}`}
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