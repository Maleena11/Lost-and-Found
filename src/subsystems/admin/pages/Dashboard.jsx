import { useState, useEffect } from "react";
import axios from "axios";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import Sidebar from "./Sidebar";
import TopBar from "../components/TopBar";
import { useNavigate } from 'react-router-dom';
import ItemsStats from '../components/ItemsStats';
import NoticeStats from '../components/NoticeStats';


// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Initialize the state here
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [stats, setStats] = useState({
    totalItems: 0,
    lostItems: 0,
    foundItems: 0,
    claimedItems: 0,
    pendingItems: 0,
    returnedItems: 0,
    expiredItems: 0,
    categoryBreakdown: {},
    facultyBreakdown: {},
    departmentBreakdown: {},
    buildingBreakdown: {},
    yearGroupBreakdown: {},
    recentItems: [],
    monthlyStats: [],
    rawItems: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("week"); // "week", "month", "year"

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:3001/api/lost-found");
      const items = response.data.data;

      // Process the data for stats
      processItemsData(items);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const processItemsData = (items) => {
    // Basic stats
    const lostItems = items.filter(item => item.itemType === "lost");
    const foundItems = items.filter(item => item.itemType === "found");
    const claimedItems = items.filter(item => item.status === "claimed");
    const pendingItems = items.filter(item => item.status === "pending");
    const returnedItems = items.filter(item => item.status === "returned");
    const expiredItems = items.filter(item => item.status === "expired");

    // Category breakdown
    const categoryBreakdown = {};
    items.forEach(item => {
      if (item.category) categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
    });

    // Faculty / Department / Building / YearGroup breakdowns
    const facultyBreakdown = {};
    const departmentBreakdown = {};
    const buildingBreakdown = {};
    const yearGroupBreakdown = {};
    items.forEach(item => {
      if (item.faculty)    facultyBreakdown[item.faculty]       = (facultyBreakdown[item.faculty]    || 0) + 1;
      if (item.department) departmentBreakdown[item.department] = (departmentBreakdown[item.department] || 0) + 1;
      if (item.building)   buildingBreakdown[item.building]     = (buildingBreakdown[item.building]  || 0) + 1;
      if (item.yearGroup)  yearGroupBreakdown[item.yearGroup]   = (yearGroupBreakdown[item.yearGroup] || 0) + 1;
    });

    // Recent items (last 5)
    const recentItems = [...items]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // Monthly stats for charts
    const monthlyStats = getMonthlyStats(items);

    setStats({
      totalItems: items.length,
      lostItems: lostItems.length,
      foundItems: foundItems.length,
      claimedItems: claimedItems.length,
      pendingItems: pendingItems.length,
      returnedItems: returnedItems.length,
      expiredItems: expiredItems.length,
      categoryBreakdown,
      facultyBreakdown,
      departmentBreakdown,
      buildingBreakdown,
      yearGroupBreakdown,
      recentItems,
      monthlyStats,
      rawItems: items
    });
  };

  const getMonthlyStats = (items) => {
    // Get data for the last 6 months
    const monthlyData = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      
      const monthItems = items.filter(item => {
        const itemDate = new Date(item.createdAt);
        return itemDate.getMonth() === month.getMonth() && 
               itemDate.getFullYear() === month.getFullYear();
      });
      
      const lostCount = monthItems.filter(item => item.itemType === 'lost').length;
      const foundCount = monthItems.filter(item => item.itemType === 'found').length;
      
      monthlyData.push({
        month: monthName,
        lost: lostCount,
        found: foundCount,
        total: lostCount + foundCount
      });
    }
    
    return monthlyData;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Helper function to get color class based on status
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'claimed':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 min-h-screen lg:ml-64 flex flex-col bg-gray-50">
          <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Dashboard Overview" subtitle="UniFind — University Lost & Found Management" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 min-h-screen lg:ml-64 flex flex-col bg-gray-50">
          <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Dashboard Overview" subtitle="UniFind — University Lost & Found Management" />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-red-700 text-center max-w-sm">
              <i className="fas fa-exclamation-circle text-3xl mb-3 text-red-400"></i>
              <p className="font-medium">{error}</p>
              <button onClick={fetchDashboardData} className="mt-4 text-sm text-blue-600 hover:underline">
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Data for Pie Chart - Status Distribution
  const statusData = {
    labels: ['Pending', 'Claimed', 'Returned', 'Expired'],
    datasets: [
      {
        data: [stats.pendingItems, stats.claimedItems, stats.returnedItems, stats.expiredItems],
        backgroundColor: [
          'rgba(255, 206, 86, 0.6)', // yellow for pending
          'rgba(75, 192, 192, 0.6)', // green for claimed
          'rgba(54, 162, 235, 0.6)', // blue for returned
          'rgba(255, 99, 132, 0.6)', // red for expired
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Data for Bar Chart - Monthly Statistics
  const monthlyData = {
    labels: stats.monthlyStats.map(stat => stat.month),
    datasets: [
      {
        label: 'Lost Items',
        data: stats.monthlyStats.map(stat => stat.lost),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'Found Items',
        data: stats.monthlyStats.map(stat => stat.found),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <div className="flex-1 min-h-screen lg:ml-64 flex flex-col bg-gray-50">
        <TopBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title="Dashboard Overview"
          subtitle="UniFind — University Lost & Found Management"
        />

        <main className="flex-1 p-6">
          {/* Quick action */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => navigate('/report-item')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <i className="fas fa-plus"></i> Report New Item
            </button>
          </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                <i className="fas fa-layer-group text-xl"></i>
              </div>
              <div className="ml-4">
                <h2 className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Total Items</h2>
                <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.totalItems}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center text-xs text-gray-400">
              <i className="fas fa-info-circle mr-1"></i> All reported items on campus
            </div>
          </div>

          {/* Lost Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-red-100 text-red-500">
                <i className="fas fa-search text-xl"></i>
              </div>
              <div className="ml-4">
                <h2 className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Lost Items</h2>
                <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.lostItems}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center text-xs text-gray-400">
              <i className="fas fa-info-circle mr-1"></i> Items reported as lost by students
            </div>
          </div>

          {/* Found Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-green-100 text-green-600">
                <i className="fas fa-hand-holding text-xl"></i>
              </div>
              <div className="ml-4">
                <h2 className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Found Items</h2>
                <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.foundItems}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center text-xs text-gray-400">
              <i className="fas fa-info-circle mr-1"></i> Items turned in across campus
            </div>
          </div>

          {/* Pending Claims */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-yellow-100 text-yellow-600">
                <i className="fas fa-hourglass-half text-xl"></i>
              </div>
              <div className="ml-4">
                <h2 className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Pending Claims</h2>
                <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.pendingItems}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center text-xs text-gray-400">
              <i className="fas fa-info-circle mr-1"></i> Awaiting verification & return
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Status Distribution Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-gray-800 text-base font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                <i className="fas fa-chart-pie text-purple-500 text-xs"></i>
              </span>
              Item Status Distribution
            </h2>
            <div className="h-64">
              <Pie data={statusData} options={{ 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: {
                      color: '#374151' // Darker text for legend
                    }
                  }
                }
              }} />
            </div>
          </div>

          {/* Monthly Statistics Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-gray-800 text-base font-semibold flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <i className="fas fa-chart-bar text-blue-500 text-xs"></i>
                </span>
                Monthly Statistics
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setDateRange("week")}
                  className={`px-3 py-1 text-xs rounded-md ${dateRange === "week" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
                >
                  Week
                </button>
                <button 
                  onClick={() => setDateRange("month")}
                  className={`px-3 py-1 text-xs rounded-md ${dateRange === "month" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
                >
                  Month
                </button>
                <button 
                  onClick={() => setDateRange("year")}
                  className={`px-3 py-1 text-xs rounded-md ${dateRange === "year" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
                >
                  Year
                </button>
              </div>
            </div>
            <div className="h-64">
              <Bar 
                data={monthlyData} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                        color: '#374151' // Darker text for y-axis
                      },
                      grid: {
                        color: '#E5E7EB' // Light grid lines
                      }
                    },
                    x: {
                      ticks: {
                        color: '#374151' // Darker text for x-axis
                      },
                      grid: {
                        color: '#E5E7EB' // Light grid lines
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      labels: {
                        color: '#374151' // Darker text for legend
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* ── Analysis & Statistics ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
              <i className="fas fa-chart-line text-indigo-500 text-xs"></i>
            </span>
            <h2 className="text-base font-semibold text-gray-800">Analysis &amp; Statistics</h2>
          </div>

          {/* Percentage Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Recovery Rate */}
            {(() => {
              const recovered = stats.claimedItems + stats.returnedItems;
              const pct = stats.totalItems ? Math.round((recovered / stats.totalItems) * 100) : 0;
              return (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recovery Rate</span>
                    <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <i className="fas fa-check-double text-green-500 text-xs"></i>
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{pct}%</p>
                  <p className="text-xs text-gray-400 mt-1">{recovered} of {stats.totalItems} items recovered</p>
                  <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })()}

            {/* Lost Rate */}
            {(() => {
              const pct = stats.totalItems ? Math.round((stats.lostItems / stats.totalItems) * 100) : 0;
              return (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lost Rate</span>
                    <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <i className="fas fa-search text-red-500 text-xs"></i>
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-red-500">{pct}%</p>
                  <p className="text-xs text-gray-400 mt-1">{stats.lostItems} items reported lost</p>
                  <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-red-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })()}

            {/* Found Rate */}
            {(() => {
              const pct = stats.totalItems ? Math.round((stats.foundItems / stats.totalItems) * 100) : 0;
              return (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Found Rate</span>
                    <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <i className="fas fa-hand-holding text-blue-500 text-xs"></i>
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-blue-500">{pct}%</p>
                  <p className="text-xs text-gray-400 mt-1">{stats.foundItems} items turned in</p>
                  <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })()}

            {/* Pending Rate */}
            {(() => {
              const pct = stats.totalItems ? Math.round((stats.pendingItems / stats.totalItems) * 100) : 0;
              return (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Rate</span>
                    <span className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <i className="fas fa-hourglass-half text-yellow-500 text-xs"></i>
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-yellow-500">{pct}%</p>
                  <p className="text-xs text-gray-400 mt-1">{stats.pendingItems} items awaiting action</p>
                  <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-yellow-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Status Breakdown + Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center">
                  <i className="fas fa-tasks text-purple-500 text-xs"></i>
                </span>
                Status Breakdown
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Pending",  count: stats.pendingItems,  bar: "bg-yellow-400", text: "text-yellow-600", chip: "bg-yellow-50 text-yellow-700" },
                  { label: "Claimed",  count: stats.claimedItems,  bar: "bg-green-400",  text: "text-green-600",  chip: "bg-green-50 text-green-700"  },
                  { label: "Returned", count: stats.returnedItems, bar: "bg-blue-400",   text: "text-blue-600",   chip: "bg-blue-50 text-blue-700"   },
                  { label: "Expired",  count: stats.expiredItems,  bar: "bg-red-400",    text: "text-red-600",    chip: "bg-red-50 text-red-700"    },
                ].map(({ label, count, bar, text, chip }) => {
                  const pct = stats.totalItems ? Math.round((count / stats.totalItems) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${bar}`}></span>
                          <span className="text-sm text-gray-700">{label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${chip}`}>{count} items</span>
                          <span className={`text-sm font-bold w-10 text-right ${text}`}>{pct}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`${bar} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Breakdown with percentages */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center">
                  <i className="fas fa-tags text-green-500 text-xs"></i>
                </span>
                Category Breakdown
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.categoryBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => {
                    const pct = stats.totalItems ? Math.round((count / stats.totalItems) * 100) : 0;
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-gray-700 capitalize">{category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{count} items</span>
                            <span className="text-sm font-bold text-blue-600 w-10 text-right">{pct}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="p-6">
            <h2 className="text-gray-800 text-base font-semibold mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                <i className="fas fa-clock text-orange-500 text-xs"></i>
              </span>
              Recent Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left text-gray-600 text-sm">
                    <th className="pb-3 font-semibold">Item</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentItems.map(item => (
                    <tr key={item._id} className="border-t border-gray-100">
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center ${
                            item.itemType === "lost" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"
                          }`}>
                            {item.itemType === "lost" ? "L" : "F"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{item.itemName}</p>
                            <p className="text-gray-600 text-xs">{item.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-gray-700">{item.itemType}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-700">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={() => navigate('/admin/dashboard/allitems')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All Items
              </button>
            </div>
          </div>
        </div>

        {/* ── Location & Trend Analytics ── */}
        {(() => {
          const items = stats.rawItems || [];
          const total = items.length;

          // 1. Top Reported Locations (from existing `location` text field)
          const locMap = {};
          items.forEach(item => {
            if (item.location) locMap[item.location.trim()] = (locMap[item.location.trim()] || 0) + 1;
          });
          const locRank = Object.entries(locMap).sort(([, a], [, b]) => b - a).slice(0, 6);
          const maxLoc = locRank[0]?.[1] || 1;

          // 2. Reporting Activity by Day of Week
          const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dayCount = [0, 0, 0, 0, 0, 0, 0];
          items.forEach(item => { dayCount[new Date(item.createdAt).getDay()]++; });
          const maxDay = Math.max(...dayCount, 1);
          const busiestDay = dayCount.indexOf(Math.max(...dayCount));

          // 3. Pending Items Aging (how long unresolved items have been open)
          const now = Date.now();
          const ageBuckets = [
            { label: 'Fresh',   sub: '0 – 7 days',  color: 'bg-green-400',  text: 'text-green-600',  chip: 'bg-green-50 text-green-700',  count: 0 },
            { label: 'Recent',  sub: '8 – 30 days',  color: 'bg-yellow-400', text: 'text-yellow-600', chip: 'bg-yellow-50 text-yellow-700', count: 0 },
            { label: 'Old',     sub: '31 – 90 days', color: 'bg-orange-400', text: 'text-orange-600', chip: 'bg-orange-50 text-orange-700', count: 0 },
            { label: 'Overdue', sub: '90+ days',     color: 'bg-red-400',    text: 'text-red-600',    chip: 'bg-red-50 text-red-700',      count: 0 },
          ];
          items.filter(i => i.status === 'pending').forEach(item => {
            const d = Math.floor((now - new Date(item.createdAt)) / 86400000);
            if      (d <= 7)  ageBuckets[0].count++;
            else if (d <= 30) ageBuckets[1].count++;
            else if (d <= 90) ageBuckets[2].count++;
            else              ageBuckets[3].count++;
          });
          const totalPending = ageBuckets.reduce((s, b) => s + b.count, 0);
          const maxAge = Math.max(...ageBuckets.map(b => b.count), 1);

          // 4. Lost vs Found split per category (top 5 by total)
          const catMap = {};
          items.forEach(item => {
            if (!catMap[item.category]) catMap[item.category] = { lost: 0, found: 0 };
            item.itemType === 'lost' ? catMap[item.category].lost++ : catMap[item.category].found++;
          });
          const catEntries = Object.entries(catMap)
            .sort(([, a], [, b]) => (b.lost + b.found) - (a.lost + a.found))
            .slice(0, 5);

          return (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                  <i className="fas fa-map-marked-alt text-violet-500 text-xs"></i>
                </span>
                <h2 className="text-base font-semibold text-gray-800">Location &amp; Trend Analytics</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Panel 1 — Top Reported Locations */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center">
                      <i className="fas fa-map-marker-alt text-violet-500 text-xs"></i>
                    </span>
                    Top Reported Locations
                  </h3>
                  {locRank.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">No location data available yet</p>
                  ) : (
                    <div className="space-y-3">
                      {locRank.map(([loc, count], i) => (
                        <div key={loc}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                              <span className="text-sm text-gray-700 truncate">{loc}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <span className="text-xs text-gray-400">{count} items</span>
                              <span className="text-sm font-bold text-violet-600 w-10 text-right">{total ? Math.round((count / total) * 100) : 0}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-violet-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.round((count / maxLoc) * 100)}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Panel 2 — Reporting Activity by Day of Week */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center">
                      <i className="fas fa-calendar-alt text-orange-500 text-xs"></i>
                    </span>
                    Reporting Activity by Day
                  </h3>
                  <p className="text-xs text-gray-400 mb-4 ml-8">
                    Busiest day: <span className="font-semibold text-orange-500">{DAY_LABELS[busiestDay]}</span>
                    {dayCount[busiestDay] > 0 && <span> ({dayCount[busiestDay]} reports)</span>}
                  </p>
                  <div className="flex items-end gap-2 h-28">
                    {DAY_LABELS.map((day, i) => {
                      const pct = Math.round((dayCount[i] / maxDay) * 100);
                      const isMax = i === busiestDay;
                      return (
                        <div key={day} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs text-gray-500">{dayCount[i] > 0 ? dayCount[i] : ''}</span>
                          <div className="w-full rounded-t-md transition-all duration-500 min-h-[4px]"
                            style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: isMax ? '#f97316' : '#fed7aa' }}
                          ></div>
                          <span className={`text-xs font-medium ${isMax ? 'text-orange-600' : 'text-gray-400'}`}>{day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Panel 3 — Pending Items Aging */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-sky-100 flex items-center justify-center">
                      <i className="fas fa-clock text-sky-500 text-xs"></i>
                    </span>
                    Pending Items Aging
                  </h3>
                  <p className="text-xs text-gray-400 mb-4 ml-8">{totalPending} unresolved item{totalPending !== 1 ? 's' : ''} currently pending</p>
                  <div className="space-y-3">
                    {ageBuckets.map(({ label, sub, color, text, chip, count }) => {
                      const pct = totalPending ? Math.round((count / totalPending) * 100) : 0;
                      return (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div>
                              <span className="text-sm font-medium text-gray-700">{label}</span>
                              <span className="text-xs text-gray-400 ml-1.5">({sub})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${chip}`}>{count}</span>
                              <span className={`text-sm font-bold w-10 text-right ${text}`}>{pct}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Panel 4 — Lost vs Found by Category */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-teal-100 flex items-center justify-center">
                      <i className="fas fa-exchange-alt text-teal-500 text-xs"></i>
                    </span>
                    Lost vs Found by Category
                  </h3>
                  {catEntries.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">No category data available yet</p>
                  ) : (
                    <div className="space-y-3">
                      {catEntries.map(([cat, { lost, found }]) => {
                        const catTotal = lost + found;
                        const lostPct  = catTotal ? Math.round((lost  / catTotal) * 100) : 0;
                        const foundPct = catTotal ? Math.round((found / catTotal) * 100) : 0;
                        return (
                          <div key={cat}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-700 capitalize">{cat}</span>
                              <span className="text-xs text-gray-400">{catTotal} total</span>
                            </div>
                            <div className="flex w-full h-2 rounded-full overflow-hidden bg-gray-100">
                              {lostPct  > 0 && <div className="bg-red-400  h-full transition-all duration-500" style={{ width: `${lostPct}%`  }} title={`Lost ${lostPct}%`}></div>}
                              {foundPct > 0 && <div className="bg-teal-400 h-full transition-all duration-500" style={{ width: `${foundPct}%` }} title={`Found ${foundPct}%`}></div>}
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-xs text-red-400">{lost > 0 ? `${lost} lost (${lostPct}%)` : ''}</span>
                              <span className="text-xs text-teal-500">{found > 0 ? `${found} found (${foundPct}%)` : ''}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-red-400"></span> Lost</span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span> Found</span>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* Notice and Items Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <ItemsStats />
          <NoticeStats />
        </div>
        </main>
      </div>
    </div>
  );
}