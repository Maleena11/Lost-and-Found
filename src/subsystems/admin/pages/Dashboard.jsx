import { useState, useEffect } from "react";
import axios from "axios";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import Sidebar from "./Sidebar";
import TopBar from "../components/TopBar";
import { useNavigate } from 'react-router-dom';
import ItemsStats from '../components/ItemsStats';
import NoticeStats from '../components/NoticeStats';
import UserStats from '../components/UserStats';
import VerificationStats from '../components/VerificationStats';
import TopReporters from '../components/TopReporters';
import PotentialMatches from '../components/PotentialMatches';



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
  const [recentFilter, setRecentFilter] = useState("all"); // "all", "lost", "found"
  const [collapsedSections, setCollapsedSections] = useState({});
  const toggleSection = (key) => setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  const [activeNav, setActiveNav] = useState('kpis');

  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    pendingVerifications: 0,
    totalNotices: 0,
    urgentNotices: 0,
  });

  useEffect(() => {
    fetchDashboardData();
    fetchSystemStats();
  }, [dateRange]);

  useEffect(() => {
    if (loading) return;
    const sectionIds = ['kpis', 'analytics', 'performance', 'recent', 'locations', 'modules'];
    const visible = new Set();
    const observers = [];

    const pickActive = () => {
      for (const id of sectionIds) {
        if (visible.has(id)) { setActiveNav(id); return; }
      }
    };

    sectionIds.forEach(id => {
      const el = document.getElementById(`section-${id}`);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) visible.add(id); else visible.delete(id);
          pickActive();
        },
        { threshold: 0.1, rootMargin: '-100px 0px 0px 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [loading]);

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

  const fetchSystemStats = async () => {
    try {
      const [usersRes, verRes, noticesRes] = await Promise.allSettled([
        axios.get("http://localhost:3001/api/users"),
        axios.get("http://localhost:3001/api/verification"),
        axios.get("http://localhost:3001/api/notices"),
      ]);
      const users = usersRes.status === 'fulfilled'
        ? (Array.isArray(usersRes.value.data) ? usersRes.value.data : []) : [];
      const verifications = verRes.status === 'fulfilled'
        ? (Array.isArray(verRes.value.data) ? verRes.value.data : (verRes.value.data?.data || [])) : [];
      const notices = noticesRes.status === 'fulfilled'
        ? (noticesRes.value.data?.data || noticesRes.value.data || []) : [];
      setSystemStats({
        totalUsers: users.length,
        pendingVerifications: verifications.filter(v => v.status === 'pending').length,
        totalNotices: Array.isArray(notices) ? notices.length : 0,
        urgentNotices: Array.isArray(notices)
          ? notices.filter(n => n.priority === 'urgent' || n.category === 'emergency').length : 0,
      });
    } catch (err) {
      console.error("Error fetching system stats:", err);
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

    // Recent items (last 8)
    const recentItems = [...items]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);

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

  // Data for Pie Chart - Category Distribution
  const categoryEntries = Object.entries(stats.categoryBreakdown).sort(([, a], [, b]) => b - a).slice(0, 7);
  const categoryPieData = {
    labels: categoryEntries.map(([cat]) => cat.charAt(0).toUpperCase() + cat.slice(1)),
    datasets: [
      {
        data: categoryEntries.map(([, count]) => count),
        backgroundColor: [
          'rgba(99, 102, 241, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(107, 114, 128, 0.7)',
        ],
        borderColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(107, 114, 128, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Data for Grouped Bar Chart - Lost vs Found by Category (top 6)
  const lostVsFoundItems = stats.rawItems || [];
  const catLostFound = {};
  lostVsFoundItems.forEach(item => {
    if (!item.category) return;
    if (!catLostFound[item.category]) catLostFound[item.category] = { lost: 0, found: 0 };
    item.itemType === 'lost' ? catLostFound[item.category].lost++ : catLostFound[item.category].found++;
  });
  const topCatEntries = Object.entries(catLostFound)
    .sort(([, a], [, b]) => (b.lost + b.found) - (a.lost + a.found))
    .slice(0, 6);
  const lostVsFoundBarData = {
    labels: topCatEntries.map(([cat]) => cat.charAt(0).toUpperCase() + cat.slice(1)),
    datasets: [
      {
        label: 'Lost',
        data: topCatEntries.map(([, v]) => v.lost),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Found',
        data: topCatEntries.map(([, v]) => v.found),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // Derived metrics for banner
  const recoveryRate = stats.totalItems
    ? Math.round(((stats.claimedItems + stats.returnedItems) / stats.totalItems) * 100)
    : 0;

  // Today's activity
  const todayStr = new Date().toDateString();
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
  const todayItems = stats.rawItems.filter(i => new Date(i.createdAt).toDateString() === todayStr).length;
  const yesterdayItems = stats.rawItems.filter(i => new Date(i.createdAt).toDateString() === yesterdayStr).length;
  const todayTrend = todayItems - yesterdayItems;

  // Overdue pending: pending items open for more than 30 days
  const overduePending = stats.rawItems.filter(
    i => i.status === 'pending' && Math.floor((Date.now() - new Date(i.createdAt)) / 86400000) > 30
  ).length;

  // Respect the saved date format from Settings
  const savedDateFormat = (() => {
    try { return JSON.parse(localStorage.getItem("adminSettings") || "{}").dateFormat || "MMM DD, YYYY"; }
    catch { return "MMM DD, YYYY"; }
  })();
  const formatBannerDate = (fmt) => {
    const d = new Date();
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    const dd   = String(d.getDate()).padStart(2, '0');
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    switch (fmt) {
      case 'DD/MM/YYYY': return `${weekday}, ${dd}/${mm}/${yyyy}`;
      case 'MM/DD/YYYY': return `${weekday}, ${mm}/${dd}/${yyyy}`;
      case 'YYYY-MM-DD': return `${weekday}, ${yyyy}-${mm}-${dd}`;
      default:           return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  // ── Export to CSV ──
  const exportToCSV = () => {
    const now = new Date();
    const rows = [];

    rows.push(['UniFind — Dashboard Report', '', `Generated: ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`]);
    rows.push([]);

    rows.push(['SUMMARY']);
    rows.push(['Metric', 'Value']);
    rows.push(['Total Items',           stats.totalItems]);
    rows.push(['Lost Items',            stats.lostItems]);
    rows.push(['Found Items',           stats.foundItems]);
    rows.push(['Pending Items',         stats.pendingItems]);
    rows.push(['Claimed Items',         stats.claimedItems]);
    rows.push(['Returned Items',        stats.returnedItems]);
    rows.push(['Expired Items',         stats.expiredItems]);
    rows.push(['Recovery Rate',         `${recoveryRate}%`]);
    rows.push(['Registered Users',      systemStats.totalUsers]);
    rows.push(['Pending Verifications', systemStats.pendingVerifications]);
    rows.push(['Active Notices',        systemStats.totalNotices]);
    rows.push(['Overdue Pending Items', overduePending]);
    rows.push([]);

    rows.push(['CATEGORY BREAKDOWN']);
    rows.push(['Category', 'Count', 'Percentage']);
    Object.entries(stats.categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .forEach(([cat, count]) => {
        const pct = stats.totalItems ? Math.round((count / stats.totalItems) * 100) : 0;
        rows.push([cat, count, `${pct}%`]);
      });
    rows.push([]);

    rows.push(['MONTHLY STATISTICS (LAST 6 MONTHS)']);
    rows.push(['Month', 'Lost', 'Found', 'Total']);
    stats.monthlyStats.forEach(m => rows.push([m.month, m.lost, m.found, m.total]));
    rows.push([]);

    rows.push(['ALL ITEMS']);
    rows.push(['Item Name', 'Type', 'Category', 'Status', 'Location', 'Date Reported']);
    stats.rawItems.forEach(item => {
      rows.push([
        item.itemName  || '',
        item.itemType  || '',
        item.category  || '',
        item.status    || '',
        item.location  || '',
        item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
      ]);
    });

    const csv = rows
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `unifind-report-${now.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Print Report ──
  const printReport = () => {
    const now     = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const categoryRows = Object.entries(stats.categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, count]) => {
        const pct = stats.totalItems ? Math.round((count / stats.totalItems) * 100) : 0;
        return `<tr>
          <td style="padding:7px 14px;border-bottom:1px solid #e5e7eb;text-transform:capitalize">${cat}</td>
          <td style="padding:7px 14px;border-bottom:1px solid #e5e7eb;text-align:right">${count}</td>
          <td style="padding:7px 14px;border-bottom:1px solid #e5e7eb;text-align:right">${pct}%</td>
        </tr>`;
      }).join('');

    const monthlyRows = stats.monthlyStats.map(m => `<tr>
      <td style="padding:7px 14px;border-bottom:1px solid #e5e7eb">${m.month}</td>
      <td style="padding:7px 14px;border-bottom:1px solid #e5e7eb;text-align:right">${m.lost}</td>
      <td style="padding:7px 14px;border-bottom:1px solid #e5e7eb;text-align:right">${m.found}</td>
      <td style="padding:7px 14px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${m.total}</td>
    </tr>`).join('');

    const kpi = (value, label) =>
      `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px">
        <div style="font-size:26px;font-weight:700;color:#111">${value}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:2px">${label}</div>
      </div>`;

    const html = `<!DOCTYPE html><html><head><title>UniFind Dashboard Report</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: system-ui, -apple-system, sans-serif; color: #111; padding: 36px; line-height: 1.5; }
      h1  { font-size: 22px; font-weight: 700; }
      .sub { color: #6b7280; font-size: 13px; margin: 4px 0 28px; }
      .section { margin-bottom: 28px; }
      h2  { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em;
            color: #6b7280; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 14px; }
      .grid { display: grid; gap: 10px; margin-bottom: 10px; }
      .g4  { grid-template-columns: repeat(4, 1fr); }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th { text-align: left; padding: 7px 14px; background: #f3f4f6;
           font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; }
      @media print { body { padding: 16px; } }
    </style></head><body>
      <h1>UniFind — Dashboard Report</h1>
      <p class="sub">Generated on ${dateStr}</p>

      <div class="section">
        <h2>Items Overview</h2>
        <div class="grid g4">
          ${kpi(stats.totalItems,   'Total Items')}
          ${kpi(stats.lostItems,    'Lost Items')}
          ${kpi(stats.foundItems,   'Found Items')}
          ${kpi(stats.pendingItems, 'Pending')}
          ${kpi(stats.claimedItems,  'Claimed')}
          ${kpi(stats.returnedItems, 'Returned')}
          ${kpi(stats.expiredItems,  'Expired')}
          ${kpi(recoveryRate + '%',  'Recovery Rate')}
        </div>
      </div>

      <div class="section">
        <h2>System Overview</h2>
        <div class="grid g4">
          ${kpi(systemStats.totalUsers,           'Registered Users')}
          ${kpi(systemStats.pendingVerifications, 'Pending Verifications')}
          ${kpi(systemStats.totalNotices,         'Active Notices')}
          ${kpi(overduePending,                   'Overdue Pending Items')}
        </div>
      </div>

      <div class="section">
        <h2>Category Breakdown</h2>
        <table>
          <thead><tr><th>Category</th><th style="text-align:right">Count</th><th style="text-align:right">Share</th></tr></thead>
          <tbody>${categoryRows}</tbody>
        </table>
      </div>

      <div class="section">
        <h2>Monthly Statistics — Last 6 Months</h2>
        <table>
          <thead><tr><th>Month</th><th style="text-align:right">Lost</th><th style="text-align:right">Found</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>${monthlyRows}</tbody>
        </table>
      </div>
    </body></html>`;

    const win = window.open('', '_blank', 'width=920,height=720');
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
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
      <div className="flex-1 min-h-screen lg:ml-64 flex flex-col bg-slate-50">
        <TopBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title="Dashboard Overview"
          subtitle="UniFind — University Lost & Found Management"
        />

        {/* ── Sticky Section Nav ── */}
        <nav className="sticky top-16 z-20 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="flex items-center overflow-x-auto px-4 lg:px-6" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'kpis',        label: 'KPIs',        icon: 'fa-tachometer-alt' },
              { id: 'analytics',   label: 'Analytics',   icon: 'fa-chart-bar'      },
              { id: 'performance', label: 'Performance', icon: 'fa-chart-line'     },
              { id: 'recent',      label: 'Recent Items',icon: 'fa-clock'          },
              { id: 'locations',   label: 'Locations',   icon: 'fa-map-marker-alt' },
              { id: 'modules',     label: 'Modules',     icon: 'fa-th-large'       },
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => {
                  document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  setActiveNav(id);
                }}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                  activeNav === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className={`fas ${icon} text-xs`}></i>
                {label}
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-1 p-6 space-y-6">

          {/* ── Welcome Banner ── */}
          <div className="relative overflow-hidden rounded-2xl text-white shadow-xl shadow-black/20" style={{ background: "linear-gradient(135deg, #0f1f4d 0%, #162660 40%, #1a1050 100%)" }}>
            {/* Shimmer line */}
            <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #34d399, #60a5fa, #a78bfa, #f472b6, #34d399)", backgroundSize: "200% 100%", animation: "shimmer 4s linear infinite" }} />
            <style>{`@keyframes shimmer { 0%{background-position:0% 0%} 100%{background-position:200% 0%} }`}</style>
            {/* Dot grid overlay */}
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
            {/* Gloss overlay */}
            <div className="absolute inset-0 opacity-[0.04]" style={{ background: "linear-gradient(120deg, transparent 30%, white 50%, transparent 70%)" }} />

            <div className="relative px-6 py-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-[11px] font-semibold text-blue-200 mb-3 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                    Admin Dashboard
                  </div>
                  <h1 className="text-2xl font-extrabold tracking-tight leading-tight">
                    UniFind —{" "}
                    <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #5eead4, #67e8f9)" }}>
                      Lost &amp; Found System
                    </span>
                  </h1>
                  <p className="text-blue-300 text-sm mt-1.5 flex items-center gap-1.5">
                    <i className="fas fa-calendar-alt text-[11px] text-teal-400"></i>
                    {formatBannerDate(savedDateFormat)}
                  </p>
                </div>

                <div className="flex gap-3 flex-wrap">
                  {[
                    { label: 'Total Items',   value: stats.totalItems,   icon: 'fa-boxes',          accent: 'bg-white/10 border-white/15' },
                    { label: 'Pending',       value: stats.pendingItems, icon: 'fa-hourglass-half',  accent: 'bg-amber-500/20 border-amber-400/30' },
                    { label: 'Recovery Rate', value: `${recoveryRate}%`, icon: 'fa-chart-line',      accent: 'bg-teal-500/20 border-teal-400/30' },
                    { label: 'Today',         value: todayItems,         icon: 'fa-calendar-day',    accent: 'bg-sky-500/20 border-sky-400/30', trend: todayTrend },
                  ].map(({ label, value, icon, accent, trend }) => (
                    <div key={label} className={`${accent} border rounded-xl px-4 py-3 text-center min-w-[84px] backdrop-blur-sm`}>
                      <i className={`fas ${icon} text-blue-300 text-[11px] mb-1 block`}></i>
                      <p className="text-2xl font-bold leading-tight">{value}</p>
                      <p className="text-blue-300 text-[11px] mt-0.5 whitespace-nowrap">{label}</p>
                      {trend !== undefined && (
                        <p className={`text-[10px] font-semibold mt-0.5 ${trend > 0 ? 'text-orange-300' : trend < 0 ? 'text-emerald-300' : 'text-blue-300'}`}>
                          {trend > 0 ? `+${trend} vs yesterday` : trend < 0 ? `${trend} vs yesterday` : 'same as yesterday'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Action Alerts ── */}
          {(systemStats.pendingVerifications > 0 || overduePending > 0 || stats.expiredItems > 0 || systemStats.urgentNotices > 0) && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Action Required</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {systemStats.pendingVerifications > 0 && (
                  <button
                    onClick={() => navigate('/admin/dashboard/verification')}
                    className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors text-left group"
                  >
                    <span className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 transition-colors">
                      <i className="fas fa-shield-alt text-amber-600"></i>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-800">
                        {systemStats.pendingVerifications} Pending Verification{systemStats.pendingVerifications !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-amber-600">Tap to review now</p>
                    </div>
                    <i className="fas fa-chevron-right text-amber-400 text-xs flex-shrink-0"></i>
                  </button>
                )}
                {overduePending > 0 && (
                  <button
                    onClick={() => navigate('/admin/dashboard/allitems')}
                    className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4 hover:bg-rose-100 transition-colors text-left group"
                  >
                    <span className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-200 transition-colors">
                      <i className="fas fa-hourglass-end text-rose-600"></i>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-rose-800">
                        {overduePending} Overdue Pending Item{overduePending !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-rose-600">Open &gt; 30 days — needs attention</p>
                    </div>
                    <i className="fas fa-chevron-right text-rose-400 text-xs flex-shrink-0"></i>
                  </button>
                )}
                {systemStats.urgentNotices > 0 && (
                  <button
                    onClick={() => navigate('/admin/dashboard/notices')}
                    className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl p-4 hover:bg-purple-100 transition-colors text-left group"
                  >
                    <span className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                      <i className="fas fa-bullhorn text-purple-600"></i>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-purple-800">
                        {systemStats.urgentNotices} Urgent Notice{systemStats.urgentNotices !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-purple-600">Emergency or high-priority</p>
                    </div>
                    <i className="fas fa-chevron-right text-purple-400 text-xs flex-shrink-0"></i>
                  </button>
                )}
                {stats.expiredItems > 0 && (
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <span className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-calendar-times text-gray-500"></i>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700">
                        {stats.expiredItems} Expired Item{stats.expiredItems !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500">No longer active</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Quick Actions ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: 'Report New Item',      icon: 'fa-plus',           path: '/report-item',                  bg: 'bg-blue-600 hover:bg-blue-700',     },
                { label: 'Review Verifications', icon: 'fa-check-circle',   path: '/admin/dashboard/verification', bg: 'bg-amber-500 hover:bg-amber-600',   },
                { label: 'Post Notice',          icon: 'fa-bullhorn',       path: '/admin/dashboard/notices',      bg: 'bg-purple-600 hover:bg-purple-700', },
                { label: 'View Expired Notices', icon: 'fa-calendar-times', path: '/admin/dashboard/notices?filter=expired', bg: 'bg-rose-500 hover:bg-rose-600',     },
                { label: 'Manage Users',         icon: 'fa-users',          path: '/admin/dashboard/users',        bg: 'bg-slate-700 hover:bg-slate-800',   },
              ].map(({ label, icon, path, bg }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className={`flex items-center justify-center gap-2 ${bg} text-white text-sm font-medium px-4 py-3 rounded-xl transition-all shadow-sm hover:shadow-md w-full`}
                >
                  <i className={`fas ${icon} text-sm`}></i>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Export & Reports ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-100 rounded-xl px-5 py-3 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-gray-700">Reports & Export</p>
              <p className="text-xs text-gray-400">Download or print a summary of all current dashboard data</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-sm font-medium px-4 py-2 rounded-lg transition-all"
              >
                <i className="fas fa-file-csv text-emerald-600 text-sm"></i>
                Export CSV
              </button>
              <button
                onClick={printReport}
                className="flex items-center gap-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-sm font-medium px-4 py-2 rounded-lg transition-all"
              >
                <i className="fas fa-print text-blue-600 text-sm"></i>
                Print Report
              </button>
            </div>
          </div>

          {/* ── KPI Cards ── */}
          <div id="section-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Total Items',    value: stats.totalItems,   sub: 'All reported items on campus',      icon: 'fa-layer-group',  iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   border: 'border-l-blue-500',   numColor: 'text-blue-700'   },
              { label: 'Lost Items',     value: stats.lostItems,    sub: 'Reported missing by students',      icon: 'fa-search',       iconBg: 'bg-red-100',    iconColor: 'text-red-500',    border: 'border-l-red-400',    numColor: 'text-red-600'    },
              { label: 'Found Items',    value: stats.foundItems,   sub: 'Turned in across campus',           icon: 'fa-hand-holding', iconBg: 'bg-emerald-100',iconColor: 'text-emerald-600',border: 'border-l-emerald-500',numColor: 'text-emerald-700'},
              { label: 'Pending Claims', value: stats.pendingItems, sub: 'Awaiting verification & return',    icon: 'fa-hourglass-half',iconBg: 'bg-amber-100', iconColor: 'text-amber-600',  border: 'border-l-amber-400',  numColor: 'text-amber-700'  },
            ].map(({ label, value, sub, icon, iconBg, iconColor, border, numColor }) => (
              <div key={label} className={`bg-white rounded-xl shadow-sm border-l-4 ${border} border border-gray-100 p-5 flex flex-col gap-3`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                  <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
                    <i className={`fas ${icon} ${iconColor} text-sm`}></i>
                  </div>
                </div>
                <p className={`text-3xl font-bold ${numColor}`}>{value}</p>
                <p className="text-xs text-gray-400 leading-tight">{sub}</p>
              </div>
            ))}
          </div>

          {/* ── System Overview KPIs ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Registered Users',  value: systemStats.totalUsers,            sub: 'All accounts',           icon: 'fa-users',        iconBg: 'bg-slate-100',  iconColor: 'text-slate-600',  border: 'border-l-slate-400',  numColor: 'text-slate-700',  path: '/admin/dashboard/users' },
              { label: 'Pending Reviews',   value: systemStats.pendingVerifications,  sub: 'Verification queue',     icon: 'fa-shield-alt',   iconBg: systemStats.pendingVerifications > 0 ? 'bg-amber-100' : 'bg-gray-100', iconColor: systemStats.pendingVerifications > 0 ? 'text-amber-600' : 'text-gray-400', border: systemStats.pendingVerifications > 0 ? 'border-l-amber-400' : 'border-l-gray-300', numColor: systemStats.pendingVerifications > 0 ? 'text-amber-700' : 'text-gray-500', path: '/admin/dashboard/verification' },
              { label: 'Active Notices',    value: systemStats.totalNotices,          sub: 'Campus announcements',   icon: 'fa-bullhorn',     iconBg: 'bg-purple-100', iconColor: 'text-purple-600', border: 'border-l-purple-400', numColor: 'text-purple-700', path: '/admin/dashboard/notices' },
              { label: 'Items Returned',    value: stats.returnedItems,               sub: 'Successfully recovered', icon: 'fa-check-double', iconBg: 'bg-teal-100',   iconColor: 'text-teal-600',   border: 'border-l-teal-400',   numColor: 'text-teal-700',   path: '/admin/dashboard/allitems' },
            ].map(({ label, value, sub, icon, iconBg, iconColor, border, numColor, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className={`bg-white rounded-xl shadow-sm border-l-4 ${border} border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition-all text-left cursor-pointer`}
              >
                <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                  <i className={`fas ${icon} ${iconColor} text-sm`}></i>
                </div>
                <div>
                  <p className={`text-xl font-bold leading-tight ${numColor}`}>{value}</p>
                  <p className="text-xs font-semibold text-gray-600">{label}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
              </button>
            ))}
          </div>

          {/* ── Analytics Overview ── */}
          <div id="section-analytics">
            <div className="flex items-center gap-3 mb-4 cursor-pointer select-none" onClick={() => toggleSection('analytics')}>
              <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex-1">Analytics Overview</h2>
              <i className={`fas fa-chevron-${collapsedSections.analytics ? 'down' : 'up'} text-gray-400 text-xs`}></i>
            </div>
            {!collapsedSections.analytics && (<>

            {/* Row 1: Status Distribution + Monthly Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Status Distribution Pie */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <i className="fas fa-chart-pie text-purple-500 text-sm"></i>
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Item Status Distribution</h3>
                    <p className="text-xs text-gray-400">Breakdown by current status</p>
                  </div>
                </div>
                <div className="h-64">
                  <Pie data={statusData} options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { labels: { color: '#374151', font: { size: 12 } } },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                            return `  ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                          },
                        },
                      },
                    },
                  }} />
                </div>
              </div>

              {/* Monthly Statistics Bar */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <i className="fas fa-chart-bar text-blue-500 text-sm"></i>
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">Monthly Statistics</h3>
                      <p className="text-xs text-gray-400">Lost &amp; found trend over 6 months</p>
                    </div>
                  </div>
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    {['week', 'month', 'year'].map(r => (
                      <button
                        key={r}
                        onClick={() => setDateRange(r)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${dateRange === r ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-64">
                  <Bar data={monthlyData} options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: { beginAtZero: true, ticks: { precision: 0, color: '#6B7280' }, grid: { color: '#F3F4F6' } },
                      x: { ticks: { color: '#6B7280' }, grid: { display: false } },
                    },
                    plugins: {
                      legend: { labels: { color: '#374151', font: { size: 12 } } },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => {
                            const total = ctx.chart.data.datasets.reduce((a, ds) => a + (ds.data[ctx.dataIndex] || 0), 0);
                            const pct = total ? ((ctx.parsed.y / total) * 100).toFixed(1) : 0;
                            return `  ${ctx.dataset.label}: ${ctx.parsed.y} (${pct}% of month)`;
                          },
                        },
                      },
                    },
                  }} />
                </div>
              </div>
            </div>

            {/* Row 2: Lost vs Found by Category + Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lost vs Found Grouped Bar */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                    <i className="fas fa-chart-bar text-rose-500 text-sm"></i>
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Lost vs Found by Category</h3>
                    <p className="text-xs text-gray-400">Top 6 categories compared</p>
                  </div>
                </div>
                <div className="h-64">
                  {topCatEntries.length > 0 ? (
                    <Bar data={lostVsFoundBarData} options={{
                      maintainAspectRatio: false,
                      scales: {
                        x: { ticks: { color: '#6B7280', font: { size: 11 } }, grid: { display: false } },
                        y: { beginAtZero: true, ticks: { precision: 0, color: '#6B7280' }, grid: { color: '#F3F4F6' } },
                      },
                      plugins: {
                        legend: { labels: { color: '#374151', boxWidth: 12, font: { size: 11 } } },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => {
                              const total = ctx.chart.data.datasets.reduce((a, ds) => a + (ds.data[ctx.dataIndex] || 0), 0);
                              const pct = total ? ((ctx.parsed.y / total) * 100).toFixed(1) : 0;
                              return `  ${ctx.dataset.label}: ${ctx.parsed.y} (${pct}% of category)`;
                            },
                          },
                        },
                      },
                    }} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">No category data</div>
                  )}
                </div>
              </div>

              {/* Category Distribution Pie */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <i className="fas fa-chart-pie text-indigo-500 text-sm"></i>
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Category Distribution</h3>
                    <p className="text-xs text-gray-400">Share of items per category</p>
                  </div>
                </div>
                <div className="h-64">
                  {categoryEntries.length > 0 ? (
                    <Pie data={categoryPieData} options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'right', labels: { color: '#374151', boxWidth: 12, font: { size: 11 } } },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => {
                              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                              const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                              return `  ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                            },
                          },
                        },
                      },
                    }} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">No category data</div>
                  )}
                </div>
              </div>
            </div>
            </>)}
          </div>

          {/* ── Performance Metrics ── */}
          <div id="section-performance">
            <div className="flex items-center gap-3 mb-4 cursor-pointer select-none" onClick={() => toggleSection('performance')}>
              <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex-1">Performance Metrics</h2>
              <i className={`fas fa-chevron-${collapsedSections.performance ? 'down' : 'up'} text-gray-400 text-xs`}></i>
            </div>
            {!collapsedSections.performance && (<>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Recovery Rate', value: recoveryRate, detail: `${stats.claimedItems + stats.returnedItems} of ${stats.totalItems} recovered`, barColor: 'bg-emerald-500', icon: 'fa-check-double', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-500', numColor: 'text-emerald-600' },
                { label: 'Lost Rate',     value: stats.totalItems ? Math.round((stats.lostItems / stats.totalItems) * 100) : 0,    detail: `${stats.lostItems} items reported lost`,     barColor: 'bg-red-400',    icon: 'fa-search',       iconBg: 'bg-red-100',    iconColor: 'text-red-500',    numColor: 'text-red-500'    },
                { label: 'Found Rate',    value: stats.totalItems ? Math.round((stats.foundItems / stats.totalItems) * 100) : 0,   detail: `${stats.foundItems} items turned in`,        barColor: 'bg-blue-400',   icon: 'fa-hand-holding', iconBg: 'bg-blue-100',   iconColor: 'text-blue-500',   numColor: 'text-blue-500'   },
                { label: 'Pending Rate',  value: stats.totalItems ? Math.round((stats.pendingItems / stats.totalItems) * 100) : 0, detail: `${stats.pendingItems} items awaiting action`, barColor: 'bg-amber-400',  icon: 'fa-hourglass-half',iconBg: 'bg-amber-100', iconColor: 'text-amber-500',  numColor: 'text-amber-500'  },
              ].map(({ label, value, detail, barColor, icon, iconBg, iconColor, numColor }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
                    <span className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
                      <i className={`fas ${icon} ${iconColor} text-xs`}></i>
                    </span>
                  </div>
                  <p className={`text-3xl font-bold ${numColor}`}>{value}%</p>
                  <p className="text-xs text-gray-400 mt-1">{detail}</p>
                  <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                    <div className={`${barColor} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Status Breakdown + Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-5 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center">
                    <i className="fas fa-tasks text-purple-500 text-xs"></i>
                  </span>
                  Status Breakdown
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Pending',  count: stats.pendingItems,  bar: 'bg-amber-400',   text: 'text-amber-600',  chip: 'bg-amber-50 text-amber-700'  },
                    { label: 'Claimed',  count: stats.claimedItems,  bar: 'bg-emerald-400', text: 'text-emerald-600',chip: 'bg-emerald-50 text-emerald-700'},
                    { label: 'Returned', count: stats.returnedItems, bar: 'bg-blue-400',    text: 'text-blue-600',   chip: 'bg-blue-50 text-blue-700'    },
                    { label: 'Expired',  count: stats.expiredItems,  bar: 'bg-red-400',     text: 'text-red-600',    chip: 'bg-red-50 text-red-700'      },
                  ].map(({ label, count, bar, text, chip }) => {
                    const pct = stats.totalItems ? Math.round((count / stats.totalItems) * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${bar}`}></span>
                            <span className="text-sm text-gray-700">{label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${chip}`}>{count} items</span>
                            <span className={`text-sm font-bold w-10 text-right ${text}`}>{pct}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className={`${bar} h-2 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-5 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                    <i className="fas fa-tags text-emerald-500 text-xs"></i>
                  </span>
                  Category Breakdown
                </h3>
                <div className="space-y-4">
                  {(() => {
                    const CAT_COLORS = [
                      { bar: 'bg-indigo-500', text: 'text-indigo-600', dot: 'bg-indigo-500' },
                      { bar: 'bg-emerald-500', text: 'text-emerald-600', dot: 'bg-emerald-500' },
                      { bar: 'bg-amber-500',  text: 'text-amber-600',  dot: 'bg-amber-500'  },
                      { bar: 'bg-red-500',    text: 'text-red-600',    dot: 'bg-red-500'    },
                      { bar: 'bg-blue-500',   text: 'text-blue-600',   dot: 'bg-blue-500'   },
                      { bar: 'bg-pink-500',   text: 'text-pink-600',   dot: 'bg-pink-500'   },
                      { bar: 'bg-gray-500',   text: 'text-gray-600',   dot: 'bg-gray-500'   },
                    ];
                    return Object.entries(stats.categoryBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, count], idx) => {
                        const pct = stats.totalItems ? Math.round((count / stats.totalItems) * 100) : 0;
                        const { bar, text, dot } = CAT_COLORS[idx % CAT_COLORS.length];
                        return (
                          <div key={category}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`}></span>
                                <span className="text-sm text-gray-700 capitalize">{category}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">{count} items</span>
                                <span className={`text-sm font-bold w-10 text-right ${text}`}>{pct}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className={`${bar} h-2 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>
            </div>
            </>)}
          </div>

          {/* ── Recent Items ── */}
          {(() => {
            const filteredRecent = recentFilter === 'all'
              ? stats.recentItems
              : stats.recentItems.filter(i => i.itemType === recentFilter);
            return (
              <div id="section-recent" className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <i className="fas fa-clock text-orange-500 text-sm"></i>
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-800">Recent Items</h2>
                      <p className="text-xs text-gray-400">
                        {filteredRecent.length} {recentFilter === 'all' ? 'latest' : recentFilter} item{filteredRecent.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Filter tabs */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                      {[
                        { key: 'all',   label: 'All',   count: stats.recentItems.length },
                        { key: 'lost',  label: 'Lost',  count: stats.recentItems.filter(i => i.itemType === 'lost').length },
                        { key: 'found', label: 'Found', count: stats.recentItems.filter(i => i.itemType === 'found').length },
                      ].map(({ key, label, count }) => (
                        <button
                          key={key}
                          onClick={() => setRecentFilter(key)}
                          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                            recentFilter === key
                              ? key === 'lost'
                                ? 'bg-white text-orange-600 shadow-sm'
                                : key === 'found'
                                ? 'bg-white text-emerald-600 shadow-sm'
                                : 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {label}
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                            recentFilter === key
                              ? key === 'lost' ? 'bg-orange-100 text-orange-600' : key === 'found' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                              : 'bg-gray-200 text-gray-500'
                          }`}>{count}</span>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => navigate('/admin/dashboard/allitems')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      View All
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Item', 'Type', 'Location', 'Date', 'Status'].map(h => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredRecent.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                            No {recentFilter} items found.
                          </td>
                        </tr>
                      ) : (
                        filteredRecent.map((item, idx) => {
                          const imgSrc = item.images?.[0] || null;
                          const isLost = item.itemType === 'lost';
                          return (
                            <tr key={item._id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                              <td className="px-6 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden bg-gray-100 border border-gray-200">
                                    {imgSrc ? (
                                      <img src={imgSrc} alt={item.itemName} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <i className="fas fa-image text-gray-300 text-xs"></i>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">{item.itemName}</p>
                                    <p className="text-xs text-gray-400 capitalize">{item.category}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-3.5">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isLost ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                  {isLost ? 'Lost' : 'Found'}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-sm text-gray-600">
                                {item.location || <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-6 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                                {formatDate(item.createdAt)}
                              </td>
                              <td className="px-6 py-3.5">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(item.status)}`}>
                                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

        {/* ── Location & Trend Analytics ── */}
        {(() => {
          const items = stats.rawItems || [];
          const total = items.length;

          // 1. Top Reported Locations (from existing `location` text field)
          const normalizeLocation = (loc) => {
            const l = loc.trim().toLowerCase();
            if (l.includes('canteen') || l.includes('cafeteria')) return 'canteen';
            return l;
          };
          const locMap = {};
          items.forEach(item => {
            if (item.location) {
              const key = normalizeLocation(item.location);
              locMap[key] = (locMap[key] || 0) + 1;
            }
          });
          const locRank = Object.entries(locMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6)
            .map(([loc, count]) => [loc.charAt(0).toUpperCase() + loc.slice(1), count]);
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
            <div id="section-locations">
              <div className="flex items-center gap-3 mb-4 cursor-pointer select-none" onClick={() => toggleSection('location')}>
                <div className="w-1 h-5 bg-violet-500 rounded-full"></div>
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex-1">Location &amp; Trend Analytics</h2>
                <i className={`fas fa-chevron-${collapsedSections.location ? 'down' : 'up'} text-gray-400 text-xs`}></i>
              </div>
              {!collapsedSections.location && (

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

              </div>
              )}
            </div>
          );
        })()}

          {/* ── Module Stats ── */}
          <div id="section-modules">
            <div className="flex items-center gap-3 mb-4 cursor-pointer select-none" onClick={() => toggleSection('modules')}>
              <div className="w-1 h-5 bg-slate-400 rounded-full"></div>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex-1">Module Statistics</h2>
              <i className={`fas fa-chevron-${collapsedSections.modules ? 'down' : 'up'} text-gray-400 text-xs`}></i>
            </div>
            {!collapsedSections.modules && (<>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ItemsStats />
              <NoticeStats />
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserStats />
            <VerificationStats />
          </div>

          <TopReporters />

          <PotentialMatches />
            </>)}
          </div>

        </main>
      </div>
    </div>
  );
}