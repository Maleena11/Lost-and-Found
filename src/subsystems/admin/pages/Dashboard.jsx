import { useState, useEffect } from "react";
import axios from "axios";
import { Doughnut, Pie, Bar } from "react-chartjs-2";
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
import CampusHeatmap from '../components/CampusHeatmap';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ── Chart default theme ──────────────────────────────────────────────────────
const CHART_DEFAULTS = {
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#64748b', font: { size: 11, family: 'inherit' }, boxWidth: 10, padding: 14 } } },
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState({
    totalItems: 0, lostItems: 0, foundItems: 0, claimedItems: 0,
    pendingItems: 0, returnedItems: 0, expiredItems: 0,
    categoryBreakdown: {}, facultyBreakdown: {}, departmentBreakdown: {},
    buildingBreakdown: {}, yearGroupBreakdown: {}, recentItems: [],
    monthlyStats: [], rawItems: []
  });

  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [dateRange, setDateRange] = useState("month");
  const [recentFilter, setRecentFilter] = useState("all");
  const [collapsedSections, setCollapsedSections] = useState({});
  const toggleSection = (key) => setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  const [activeNav, setActiveNav] = useState('kpis');

  const [systemStats, setSystemStats] = useState({
    totalUsers: 0, pendingVerifications: 0, totalNotices: 0, urgentNotices: 0,
  });

  useEffect(() => { fetchDashboardData(); fetchSystemStats(); }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:3001/api/lost-found");
      processItemsData(response.data.data);
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
      const users       = usersRes.status === 'fulfilled' ? (Array.isArray(usersRes.value.data) ? usersRes.value.data : []) : [];
      const verifications = verRes.status === 'fulfilled' ? (Array.isArray(verRes.value.data) ? verRes.value.data : (verRes.value.data?.data || [])) : [];
      const notices     = noticesRes.status === 'fulfilled' ? (noticesRes.value.data?.data || noticesRes.value.data || []) : [];
      setSystemStats({
        totalUsers: users.length,
        pendingVerifications: verifications.filter(v => v.status === 'pending').length,
        totalNotices: Array.isArray(notices) ? notices.length : 0,
        urgentNotices: Array.isArray(notices) ? notices.filter(n => n.priority === 'urgent' || n.category === 'emergency').length : 0,
      });
    } catch (err) { console.error("Error fetching system stats:", err); }
  };

  const processItemsData = (items) => {
    const lostItems    = items.filter(i => i.itemType === "lost");
    const foundItems   = items.filter(i => i.itemType === "found");
    const claimedItems = items.filter(i => i.status === "claimed");
    const pendingItems = items.filter(i => i.status === "pending");
    const returnedItems = items.filter(i => i.status === "returned");
    const expiredItems = items.filter(i => i.status === "expired");

    const categoryBreakdown = {};
    items.forEach(item => { if (item.category) categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1; });

    const facultyBreakdown = {}, departmentBreakdown = {}, buildingBreakdown = {}, yearGroupBreakdown = {};
    items.forEach(item => {
      if (item.faculty)    facultyBreakdown[item.faculty]       = (facultyBreakdown[item.faculty]    || 0) + 1;
      if (item.department) departmentBreakdown[item.department] = (departmentBreakdown[item.department] || 0) + 1;
      if (item.building)   buildingBreakdown[item.building]     = (buildingBreakdown[item.building]  || 0) + 1;
      if (item.yearGroup)  yearGroupBreakdown[item.yearGroup]   = (yearGroupBreakdown[item.yearGroup] || 0) + 1;
    });

    const recentItems  = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
    const monthlyStats = getMonthlyStats(items, dateRange);

    setStats({
      totalItems: items.length, lostItems: lostItems.length, foundItems: foundItems.length,
      claimedItems: claimedItems.length, pendingItems: pendingItems.length,
      returnedItems: returnedItems.length, expiredItems: expiredItems.length,
      categoryBreakdown, facultyBreakdown, departmentBreakdown, buildingBreakdown,
      yearGroupBreakdown, recentItems, monthlyStats, rawItems: items
    });
  };

  const getMonthlyStats = (items, range) => {
    const today = new Date();
    if (range === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today); d.setDate(today.getDate() - (6 - i));
        const label = d.toLocaleDateString('default', { weekday: 'short' });
        const dayItems = items.filter(item => { const id = new Date(item.createdAt); return id.getDate() === d.getDate() && id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear(); });
        const lost = dayItems.filter(i => i.itemType === 'lost').length;
        const found = dayItems.filter(i => i.itemType === 'found').length;
        return { month: label, lost, found, total: lost + found };
      });
    }
    if (range === 'year') {
      return Array.from({ length: 12 }, (_, i) => {
        const m = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
        const label = m.toLocaleString('default', { month: 'short', year: '2-digit' });
        const monthItems = items.filter(item => { const id = new Date(item.createdAt); return id.getMonth() === m.getMonth() && id.getFullYear() === m.getFullYear(); });
        const lost = monthItems.filter(i => i.itemType === 'lost').length;
        const found = monthItems.filter(i => i.itemType === 'found').length;
        return { month: label, lost, found, total: lost + found };
      });
    }
    return Array.from({ length: 6 }, (_, i) => {
      const m = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
      const label = m.toLocaleString('default', { month: 'short' });
      const monthItems = items.filter(item => { const id = new Date(item.createdAt); return id.getMonth() === m.getMonth() && id.getFullYear() === m.getFullYear(); });
      const lost = monthItems.filter(i => i.itemType === 'lost').length;
      const found = monthItems.filter(i => i.itemType === 'found').length;
      return { month: label, lost, found, total: lost + found };
    });
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':  return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'claimed':  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'returned': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'expired':  return 'bg-red-100 text-red-700 border-red-200';
      default:         return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // ── Loading / Error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 min-h-screen lg:ml-64 flex flex-col bg-slate-50">
          <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Dashboard Overview" subtitle="UniFind — University Lost & Found Management" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="relative mx-auto mb-4 w-14 h-14">
                <div className="absolute inset-0 rounded-full border-2 border-blue-100"></div>
                <div className="absolute inset-0 rounded-full border-t-2 border-blue-600 animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                  <i className="fas fa-search text-blue-500 text-sm"></i>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600">Loading dashboard…</p>
              <p className="text-xs text-gray-400 mt-1">Fetching your data</p>
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
        <div className="flex-1 min-h-screen lg:ml-64 flex flex-col bg-slate-50">
          <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Dashboard Overview" subtitle="UniFind — University Lost & Found Management" />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-white border border-red-100 shadow-lg rounded-2xl p-8 text-center max-w-sm">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-red-400 text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Unable to load data</h3>
              <p className="text-sm text-gray-500 mb-5">{error}</p>
              <button onClick={fetchDashboardData} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
                <i className="fas fa-redo mr-2 text-xs"></i>Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Chart data ──────────────────────────────────────────────────────────────
  const statusData = {
    labels: ['Pending', 'Claimed', 'Returned', 'Expired'],
    datasets: [{
      data: [stats.pendingItems, stats.claimedItems, stats.returnedItems, stats.expiredItems],
      backgroundColor: ['#F59E0B', '#10B981', '#3B82F6', '#EF4444'],
      borderColor: '#ffffff',
      borderWidth: 3,
    }],
  };

  const monthlyData = {
    labels: stats.monthlyStats.map(s => s.month),
    datasets: [
      { label: 'Lost',  data: stats.monthlyStats.map(s => s.lost),  backgroundColor: 'rgba(239,68,68,0.65)',  borderColor: '#EF4444', borderWidth: 1, borderRadius: 5, borderSkipped: false },
      { label: 'Found', data: stats.monthlyStats.map(s => s.found), backgroundColor: 'rgba(16,185,129,0.65)', borderColor: '#10B981', borderWidth: 1, borderRadius: 5, borderSkipped: false },
    ],
  };

  const categoryEntries = Object.entries(stats.categoryBreakdown).sort(([, a], [, b]) => b - a).slice(0, 7);
  const categoryPieData = {
    labels: categoryEntries.map(([cat]) => cat.charAt(0).toUpperCase() + cat.slice(1)),
    datasets: [{
      data: categoryEntries.map(([, c]) => c),
      backgroundColor: ['#6366F1','#10B981','#F59E0B','#EF4444','#3B82F6','#EC4899','#8B5CF6'],
      borderColor: '#ffffff',
      borderWidth: 3,
    }],
  };

  const lostVsFoundItems = stats.rawItems || [];
  const catLostFound = {};
  lostVsFoundItems.forEach(item => {
    if (!item.category) return;
    if (!catLostFound[item.category]) catLostFound[item.category] = { lost: 0, found: 0 };
    item.itemType === 'lost' ? catLostFound[item.category].lost++ : catLostFound[item.category].found++;
  });
  const topCatEntries = Object.entries(catLostFound).sort(([, a], [, b]) => (b.lost + b.found) - (a.lost + a.found)).slice(0, 6);
  const lostVsFoundBarData = {
    labels: topCatEntries.map(([cat]) => cat.charAt(0).toUpperCase() + cat.slice(1)),
    datasets: [
      { label: 'Lost',  data: topCatEntries.map(([, v]) => v.lost),  backgroundColor: 'rgba(239,68,68,0.70)',  borderColor: '#EF4444', borderWidth: 1, borderRadius: 5, borderSkipped: false },
      { label: 'Found', data: topCatEntries.map(([, v]) => v.found), backgroundColor: 'rgba(16,185,129,0.70)', borderColor: '#10B981', borderWidth: 1, borderRadius: 5, borderSkipped: false },
    ],
  };

  // ── Derived metrics ──────────────────────────────────────────────────────────
  const recoveryRate   = stats.totalItems ? Math.round(((stats.claimedItems + stats.returnedItems) / stats.totalItems) * 100) : 0;
  const todayStr       = new Date().toDateString();
  const yesterdayStr   = new Date(Date.now() - 86400000).toDateString();
  const todayItems     = stats.rawItems.filter(i => new Date(i.createdAt).toDateString() === todayStr).length;
  const yesterdayItems = stats.rawItems.filter(i => new Date(i.createdAt).toDateString() === yesterdayStr).length;
  const todayTrend     = todayItems - yesterdayItems;
  const overduePending = stats.rawItems.filter(i => i.status === 'pending' && Math.floor((Date.now() - new Date(i.createdAt)) / 86400000) > 30).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const savedDateFormat = (() => {
    try { return JSON.parse(localStorage.getItem("adminSettings") || "{}").dateFormat || "MMM DD, YYYY"; }
    catch { return "MMM DD, YYYY"; }
  })();
  const formatBannerDate = (fmt) => {
    const d = new Date();
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    switch (fmt) {
      case 'DD/MM/YYYY': return `${weekday}, ${dd}/${mm}/${yyyy}`;
      case 'MM/DD/YYYY': return `${weekday}, ${mm}/${dd}/${yyyy}`;
      case 'YYYY-MM-DD': return `${weekday}, ${yyyy}-${mm}-${dd}`;
      default: return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  // ── Export CSV ───────────────────────────────────────────────────────────────
  const exportToCSV = () => {
    const now = new Date();
    const rows = [];
    rows.push(['UniFind — Dashboard Report', '', `Generated: ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`]);
    rows.push([]);
    rows.push(['SUMMARY']); rows.push(['Metric', 'Value']);
    rows.push(['Total Items', stats.totalItems]); rows.push(['Lost Items', stats.lostItems]);
    rows.push(['Found Items', stats.foundItems]); rows.push(['Pending Items', stats.pendingItems]);
    rows.push(['Claimed Items', stats.claimedItems]); rows.push(['Returned Items', stats.returnedItems]);
    rows.push(['Expired Items', stats.expiredItems]); rows.push(['Recovery Rate', `${recoveryRate}%`]);
    rows.push(['Registered Users', systemStats.totalUsers]);
    rows.push(['Pending Verifications', systemStats.pendingVerifications]);
    rows.push(['Active Notices', systemStats.totalNotices]);
    rows.push(['Overdue Pending Items', overduePending]); rows.push([]);
    rows.push(['CATEGORY BREAKDOWN']); rows.push(['Category', 'Count', 'Percentage']);
    Object.entries(stats.categoryBreakdown).sort(([, a], [, b]) => b - a).forEach(([cat, count]) => {
      rows.push([cat, count, `${stats.totalItems ? Math.round((count / stats.totalItems) * 100) : 0}%`]);
    });
    rows.push([]); rows.push(['MONTHLY STATISTICS']); rows.push(['Month', 'Lost', 'Found', 'Total']);
    stats.monthlyStats.forEach(m => rows.push([m.month, m.lost, m.found, m.total]));
    rows.push([]); rows.push(['ALL ITEMS']); rows.push(['Item Name', 'Type', 'Category', 'Status', 'Location', 'Date Reported']);
    stats.rawItems.forEach(item => rows.push([item.itemName||'', item.itemType||'', item.category||'', item.status||'', item.location||'', item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '']));
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `unifind-report-${now.toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Print Report ─────────────────────────────────────────────────────────────
  const printReport = () => {
    const now     = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const categoryRows = Object.entries(stats.categoryBreakdown).sort(([, a], [, b]) => b - a).map(([cat, count]) => {
      const pct = stats.totalItems ? Math.round((count / stats.totalItems) * 100) : 0;
      return `<tr><td style="padding:7px 14px;border-bottom:1px solid #e5e7eb;text-transform:capitalize">${cat}</td><td style="padding:7px 14px;border-bottom:1px solid #e5e7eb;text-align:right">${count}</td><td style="padding:7px 14px;border-bottom:1px solid #e5e7eb;text-align:right">${pct}%</td></tr>`;
    }).join('');
    const monthlyRows = stats.monthlyStats.map(m => `<tr><td style="padding:7px 14px;border-bottom:1px solid #e5e7eb">${m.month}</td><td style="padding:7px 14px;border-bottom:1px solid #e5e7eb;text-align:right">${m.lost}</td><td style="padding:7px 14px;border-bottom:1px solid #e5e7eb;text-align:right">${m.found}</td><td style="padding:7px 14px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${m.total}</td></tr>`).join('');
    const kpi = (value, label) => `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px"><div style="font-size:26px;font-weight:700;color:#111">${value}</div><div style="font-size:11px;color:#6b7280;margin-top:2px">${label}</div></div>`;
    const html = `<!DOCTYPE html><html><head><title>UniFind Dashboard Report</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,-apple-system,sans-serif;color:#111;padding:36px;line-height:1.5}h1{font-size:22px;font-weight:700}.sub{color:#6b7280;font-size:13px;margin:4px 0 28px}.section{margin-bottom:28px}h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#6b7280;border-bottom:2px solid #e5e7eb;padding-bottom:6px;margin-bottom:14px}.grid{display:grid;gap:10px;margin-bottom:10px}.g4{grid-template-columns:repeat(4,1fr)}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;padding:7px 14px;background:#f3f4f6;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280}@media print{body{padding:16px}}</style></head><body><h1>UniFind — Dashboard Report</h1><p class="sub">Generated on ${dateStr}</p><div class="section"><h2>Items Overview</h2><div class="grid g4">${kpi(stats.totalItems,'Total Items')}${kpi(stats.lostItems,'Lost Items')}${kpi(stats.foundItems,'Found Items')}${kpi(stats.pendingItems,'Pending')}${kpi(stats.claimedItems,'Claimed')}${kpi(stats.returnedItems,'Returned')}${kpi(stats.expiredItems,'Expired')}${kpi(recoveryRate+'%','Recovery Rate')}</div></div><div class="section"><h2>System Overview</h2><div class="grid g4">${kpi(systemStats.totalUsers,'Registered Users')}${kpi(systemStats.pendingVerifications,'Pending Verifications')}${kpi(systemStats.totalNotices,'Active Notices')}${kpi(overduePending,'Overdue Pending Items')}</div></div><div class="section"><h2>Category Breakdown</h2><table><thead><tr><th>Category</th><th style="text-align:right">Count</th><th style="text-align:right">Share</th></tr></thead><tbody>${categoryRows}</tbody></table></div><div class="section"><h2>Monthly Statistics</h2><table><thead><tr><th>Month</th><th style="text-align:right">Lost</th><th style="text-align:right">Found</th><th style="text-align:right">Total</th></tr></thead><tbody>${monthlyRows}</tbody></table></div></body></html>`;
    const win = window.open('', '_blank', 'width=920,height=720');
    win.document.open(); win.document.write(html); win.document.close(); win.focus(); win.print();
  };

  // ── Reusable sub-components ──────────────────────────────────────────────────
  const SectionHeader = ({ color, title, sectionKey }) => (
    <div className="flex items-center gap-3 mb-5 cursor-pointer select-none group" onClick={() => toggleSection(sectionKey)}>
      <div className={`w-1 h-6 rounded-full ${color}`}></div>
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex-1 group-hover:text-gray-700 transition-colors">{title}</h2>
      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
        <i className={`fas fa-chevron-${collapsedSections[sectionKey] ? 'down' : 'up'} text-gray-400 text-[10px]`}></i>
      </div>
    </div>
  );

  const ChartCard = ({ icon, iconBg, iconColor, title, subtitle, children, action }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 pt-5 pb-3 flex items-center justify-between gap-3 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <i className={`fas ${icon} ${iconColor} text-sm`}></i>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 leading-tight">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 min-h-screen lg:ml-64 flex flex-col bg-[#f1f5f9]">
        <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Dashboard Overview" subtitle="UniFind — University Lost & Found Management" />

        {/* ── Section Navigation ─────────────────────────────────────────── */}
        <nav className="sticky top-16 z-20 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="flex items-center overflow-x-auto px-4 lg:px-6 gap-0.5" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'kpis',        label: 'Overview',    icon: 'fa-th-large'       },
              { id: 'analytics',   label: 'Analytics',   icon: 'fa-chart-bar'      },
              { id: 'performance', label: 'Performance', icon: 'fa-chart-line'     },
              { id: 'recent',      label: 'Recent Items',icon: 'fa-clock'          },
              { id: 'locations',   label: 'Locations',   icon: 'fa-map-marker-alt' },
              { id: 'modules',     label: 'Modules',     icon: 'fa-puzzle-piece'   },
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setActiveNav(id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                  activeNav === id
                    ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <i className={`fas ${icon} ${activeNav === id ? 'text-blue-500' : 'text-gray-400'} text-[11px]`}></i>
                {label}
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-1 p-5 lg:p-6 space-y-5">

          {/* ── Welcome Banner ─────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl text-white" style={{ background: "linear-gradient(135deg, #0c1a4e 0%, #1a2d72 50%, #0f1f5c 100%)" }}>
            {/* animated top stripe */}
            <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #34d399, #60a5fa, #a78bfa, #f472b6, #34d399)", backgroundSize: "300% 100%", animation: "shimmer 5s linear infinite" }} />
            <style>{`@keyframes shimmer { 0%{background-position:0% 0%} 100%{background-position:300% 0%} }`}</style>
            {/* dot grid */}
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
            {/* gloss */}
            <div className="absolute top-0 left-0 right-0 h-1/2 opacity-[0.03]" style={{ background: "linear-gradient(180deg, white, transparent)" }} />

            <div className="relative px-6 py-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                {/* Left: greeting block */}
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-[11px] font-semibold text-blue-200 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse flex-shrink-0"></span>
                    System Live · Admin Portal
                  </div>
                  <h1 className="text-2xl font-extrabold tracking-tight leading-snug">
                    {greeting}, Admin
                    <span className="block text-sm font-normal text-blue-300 mt-1 flex items-center gap-2">
                      <i className="fas fa-calendar-day text-teal-400 text-[11px]"></i>
                      {formatBannerDate(savedDateFormat)}
                    </span>
                  </h1>

                  {/* quick stats pills */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {[
                      { label: 'Items Today', value: todayItems, icon: 'fa-calendar-day', accent: 'bg-white/10 border-white/15',
                        extra: todayTrend !== 0 ? <span className={`text-[10px] font-bold ml-1 ${todayTrend > 0 ? 'text-orange-300' : 'text-emerald-300'}`}>{todayTrend > 0 ? `+${todayTrend}` : todayTrend}</span> : null },
                      { label: 'Recovery', value: `${recoveryRate}%`, icon: 'fa-chart-line', accent: 'bg-teal-500/20 border-teal-400/30' },
                      { label: 'Pending', value: stats.pendingItems, icon: 'fa-hourglass-half', accent: stats.pendingItems > 0 ? 'bg-amber-500/20 border-amber-400/30' : 'bg-white/10 border-white/15' },
                    ].map(({ label, value, icon, accent, extra }) => (
                      <div key={label} className={`inline-flex items-center gap-2 ${accent} border rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm`}>
                        <i className={`fas ${icon} text-blue-300 text-[10px]`}></i>
                        <span className="text-white font-bold">{value}</span>
                        <span className="text-blue-300">{label}</span>
                        {extra}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: KPI tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-2.5 flex-shrink-0">
                  {[
                    { label: 'Total',    value: stats.totalItems,   icon: 'fa-layer-group',   bg: 'bg-white/10',          accent: '#93c5fd' },
                    { label: 'Lost',     value: stats.lostItems,    icon: 'fa-search',         bg: 'bg-red-500/15',        accent: '#fca5a5' },
                    { label: 'Found',    value: stats.foundItems,   icon: 'fa-hand-holding',   bg: 'bg-emerald-500/15',    accent: '#6ee7b7' },
                    { label: 'Returned', value: stats.returnedItems,icon: 'fa-check-double',   bg: 'bg-sky-500/15',        accent: '#7dd3fc' },
                  ].map(({ label, value, icon, bg, accent }) => (
                    <div key={label} className={`${bg} border border-white/10 rounded-xl px-4 py-3 text-center min-w-[80px] backdrop-blur-sm`}>
                      <i className={`fas ${icon} text-[11px] mb-1.5 block`} style={{ color: accent }}></i>
                      <p className="text-2xl font-extrabold leading-tight text-white">{value}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: accent }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Action Alerts ──────────────────────────────────────────────── */}
          {(systemStats.pendingVerifications > 0 || overduePending > 0 || stats.expiredItems > 0 || systemStats.urgentNotices > 0) && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-0.5">Requires Attention</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {systemStats.pendingVerifications > 0 && (
                  <button onClick={() => navigate('/admin/dashboard/verification')}
                    className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 hover:shadow-sm transition-all text-left group">
                    <span className="w-10 h-10 rounded-xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center flex-shrink-0 transition-colors">
                      <i className="fas fa-shield-alt text-amber-600 text-sm"></i>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-800">{systemStats.pendingVerifications} Pending Verification{systemStats.pendingVerifications !== 1 ? 's' : ''}</p>
                      <p className="text-xs text-amber-500 mt-0.5">Tap to review</p>
                    </div>
                    <i className="fas fa-arrow-right text-amber-300 text-xs flex-shrink-0"></i>
                  </button>
                )}
                {overduePending > 0 && (
                  <button onClick={() => navigate('/admin/dashboard/allitems')}
                    className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4 hover:bg-rose-100 hover:shadow-sm transition-all text-left group">
                    <span className="w-10 h-10 rounded-xl bg-rose-100 group-hover:bg-rose-200 flex items-center justify-center flex-shrink-0 transition-colors">
                      <i className="fas fa-hourglass-end text-rose-600 text-sm"></i>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-rose-800">{overduePending} Overdue Pending Item{overduePending !== 1 ? 's' : ''}</p>
                      <p className="text-xs text-rose-500 mt-0.5">Open &gt; 30 days</p>
                    </div>
                    <i className="fas fa-arrow-right text-rose-300 text-xs flex-shrink-0"></i>
                  </button>
                )}
                {systemStats.urgentNotices > 0 && (
                  <button onClick={() => navigate('/admin/dashboard/notices')}
                    className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl p-4 hover:bg-purple-100 hover:shadow-sm transition-all text-left group">
                    <span className="w-10 h-10 rounded-xl bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center flex-shrink-0 transition-colors">
                      <i className="fas fa-bullhorn text-purple-600 text-sm"></i>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-purple-800">{systemStats.urgentNotices} Urgent Notice{systemStats.urgentNotices !== 1 ? 's' : ''}</p>
                      <p className="text-xs text-purple-500 mt-0.5">Emergency priority</p>
                    </div>
                    <i className="fas fa-arrow-right text-purple-300 text-xs flex-shrink-0"></i>
                  </button>
                )}
                {stats.expiredItems > 0 && (
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <span className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-calendar-times text-gray-400 text-sm"></i>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-600">{stats.expiredItems} Expired Item{stats.expiredItems !== 1 ? 's' : ''}</p>
                      <p className="text-xs text-gray-400 mt-0.5">No longer active</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Toolbar row: Quick Actions + Export ───────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Quick Actions */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {[
                  { label: 'Report Item',    icon: 'fa-plus',           path: '/report-item',                           bg: 'bg-blue-600 hover:bg-blue-700'     },
                  { label: 'Verifications',  icon: 'fa-check-circle',   path: '/admin/dashboard/verification',          bg: 'bg-amber-500 hover:bg-amber-600'   },
                  { label: 'Post Notice',    icon: 'fa-bullhorn',       path: '/admin/dashboard/notices',               bg: 'bg-purple-600 hover:bg-purple-700' },
                  { label: 'Expired',        icon: 'fa-calendar-times', path: '/admin/dashboard/notices?filter=expired',bg: 'bg-rose-500 hover:bg-rose-600'     },
                  { label: 'Manage Users',   icon: 'fa-users',          path: '/admin/dashboard/users',                 bg: 'bg-slate-600 hover:bg-slate-700'   },
                ].map(({ label, icon, path, bg }) => (
                  <button key={label} onClick={() => navigate(path)}
                    className={`flex flex-col items-center justify-center gap-2 ${bg} text-white text-xs font-semibold px-2 py-3 rounded-xl transition-all shadow-sm hover:shadow-md`}>
                    <i className={`fas ${icon} text-base`}></i>
                    <span className="leading-tight text-center">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Export */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Reports & Export</p>
              <p className="text-xs text-gray-400 mb-4">Download or print a full data summary</p>
              <div className="flex flex-col gap-2 mt-auto">
                <button onClick={exportToCSV}
                  className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
                  <i className="fas fa-file-csv text-emerald-600"></i>
                  Export CSV
                </button>
                <button onClick={printReport}
                  className="flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
                  <i className="fas fa-print text-blue-600"></i>
                  Print Report
                </button>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* KPIs SECTION                                                       */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeNav === 'kpis' && (
            <>
              {/* Primary KPI row */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-0.5">Items Overview</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Items',    value: stats.totalItems,   sub: 'All reported items',          icon: 'fa-layer-group',   gradient: 'from-blue-500 to-indigo-600',  border: 'border-l-blue-500',   textColor: 'text-blue-700'   },
                    { label: 'Lost Items',     value: stats.lostItems,    sub: 'Reported missing',            icon: 'fa-search',         gradient: 'from-red-500 to-rose-600',     border: 'border-l-red-400',    textColor: 'text-red-700'    },
                    { label: 'Found Items',    value: stats.foundItems,   sub: 'Turned in on campus',         icon: 'fa-hand-holding',   gradient: 'from-emerald-500 to-teal-600', border: 'border-l-emerald-500',textColor: 'text-emerald-700'},
                    { label: 'Pending Claims', value: stats.pendingItems, sub: 'Awaiting return',             icon: 'fa-hourglass-half', gradient: 'from-amber-500 to-orange-500', border: 'border-l-amber-400',  textColor: 'text-amber-700'  },
                  ].map(({ label, value, sub, icon, gradient, border, textColor }) => (
                    <div key={label} className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${border} shadow-sm p-5 flex flex-col gap-4`}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                          <i className={`fas ${icon} text-white text-sm`}></i>
                        </div>
                      </div>
                      <div>
                        <p className={`text-4xl font-extrabold ${textColor} leading-none`}>{value}</p>
                        <p className="text-xs text-gray-400 mt-1.5 leading-tight">{sub}</p>
                      </div>
                      {/* mini bar showing share */}
                      <div className="w-full bg-gray-100 rounded-full h-1">
                        <div className={`h-1 rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
                          style={{ width: stats.totalItems ? `${Math.min(100, Math.round((value / stats.totalItems) * 100))}%` : '0%' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recovery metric + System KPIs */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Recovery rate prominent card */}
                <div className="lg:col-span-1 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-5 text-white shadow-md flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold text-teal-100 uppercase tracking-wider">Recovery Rate</p>
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                      <i className="fas fa-chart-line text-white text-sm"></i>
                    </div>
                  </div>
                  <div>
                    <p className="text-5xl font-extrabold leading-none">{recoveryRate}%</p>
                    <p className="text-teal-100 text-xs mt-2">{stats.claimedItems + stats.returnedItems} of {stats.totalItems} items recovered</p>
                  </div>
                  <div className="mt-4 w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full transition-all duration-700" style={{ width: `${recoveryRate}%` }}></div>
                  </div>
                </div>

                {/* System KPI grid */}
                <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Registered Users',  value: systemStats.totalUsers,           sub: 'All accounts',           icon: 'fa-users',        gradient: 'from-slate-500 to-slate-700',  border: 'border-l-slate-400',  textColor: 'text-slate-700',  path: '/admin/dashboard/users' },
                    { label: 'Pending Reviews',   value: systemStats.pendingVerifications, sub: 'Verification queue',     icon: 'fa-shield-alt',   gradient: systemStats.pendingVerifications > 0 ? 'from-amber-500 to-orange-500' : 'from-gray-400 to-gray-500', border: systemStats.pendingVerifications > 0 ? 'border-l-amber-400' : 'border-l-gray-300', textColor: systemStats.pendingVerifications > 0 ? 'text-amber-700' : 'text-gray-500', path: '/admin/dashboard/verification' },
                    { label: 'Active Notices',    value: systemStats.totalNotices,         sub: 'Campus announcements',   icon: 'fa-bullhorn',     gradient: 'from-purple-500 to-violet-600', border: 'border-l-purple-400', textColor: 'text-purple-700', path: '/admin/dashboard/notices' },
                    { label: 'Items Returned',    value: stats.returnedItems,              sub: 'Successfully recovered', icon: 'fa-check-double', gradient: 'from-sky-500 to-blue-600',      border: 'border-l-sky-400',    textColor: 'text-sky-700',    path: '/admin/dashboard/allitems' },
                  ].map(({ label, value, sub, icon, gradient, border, textColor, path }) => (
                    <button key={label} onClick={() => navigate(path)}
                      className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${border} p-4 flex items-center gap-3 hover:shadow-md transition-all text-left group`}>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                        <i className={`fas ${icon} text-white text-sm`}></i>
                      </div>
                      <div className="overflow-hidden">
                        <p className={`text-2xl font-extrabold leading-tight ${textColor}`}>{value}</p>
                        <p className="text-xs font-semibold text-gray-600 leading-tight truncate">{label}</p>
                        <p className="text-xs text-gray-400 truncate">{sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* ANALYTICS SECTION                                                  */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeNav === 'analytics' && (
            <div>
              <SectionHeader color="bg-blue-600" title="Analytics Overview" sectionKey="analytics" />
              {!collapsedSections.analytics && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                    {/* Status Doughnut */}
                    <ChartCard icon="fa-chart-pie" iconBg="bg-purple-100" iconColor="text-purple-600" title="Item Status Distribution" subtitle="Breakdown by current lifecycle status">
                      <div className="h-64 relative">
                        <Doughnut data={statusData} options={{ ...CHART_DEFAULTS, cutout: '65%', plugins: { ...CHART_DEFAULTS.plugins, tooltip: { callbacks: { label: (ctx) => { const total = ctx.dataset.data.reduce((a, b) => a + b, 0); const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : 0; return `  ${ctx.label}: ${ctx.parsed} (${pct}%)`; } } } } }} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <p className="text-3xl font-extrabold text-gray-800">{recoveryRate}%</p>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Recovery</p>
                        </div>
                      </div>
                      {/* mini legend row */}
                      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-50">
                        {[['Pending', stats.pendingItems, 'bg-amber-400'],['Claimed', stats.claimedItems, 'bg-emerald-500'],['Returned', stats.returnedItems, 'bg-blue-500'],['Expired', stats.expiredItems, 'bg-red-500']].map(([l, v, c]) => (
                          <div key={l} className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${c} flex-shrink-0`}></span>
                            <span className="text-xs text-gray-500">{l}</span>
                            <span className="text-xs font-bold text-gray-700">{v}</span>
                          </div>
                        ))}
                      </div>
                    </ChartCard>

                    {/* Monthly Bar */}
                    <ChartCard icon="fa-chart-bar" iconBg="bg-blue-100" iconColor="text-blue-600" title="Monthly Statistics"
                      subtitle={dateRange === 'week' ? 'Last 7 days' : dateRange === 'year' ? 'Last 12 months' : 'Last 6 months'}
                      action={
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                          {['week', 'month', 'year'].map(r => (
                            <button key={r} onClick={() => setDateRange(r)}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${dateRange === r ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </button>
                          ))}
                        </div>
                      }>
                      <div className="h-64">
                        <Bar data={monthlyData} options={{ ...CHART_DEFAULTS, scales: { y: { beginAtZero: true, ticks: { precision: 0, color: '#94a3b8' }, grid: { color: '#f1f5f9' } }, x: { ticks: { color: '#94a3b8' }, grid: { display: false } } }, plugins: { ...CHART_DEFAULTS.plugins, tooltip: { callbacks: { label: (ctx) => { const total = ctx.chart.data.datasets.reduce((a, ds) => a + (ds.data[ctx.dataIndex] || 0), 0); const pct = total ? ((ctx.parsed.y / total) * 100).toFixed(1) : 0; return `  ${ctx.dataset.label}: ${ctx.parsed.y} (${pct}%)`; } } } } }} />
                      </div>
                    </ChartCard>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Lost vs Found per category */}
                    <ChartCard icon="fa-chart-bar" iconBg="bg-rose-100" iconColor="text-rose-600" title="Lost vs Found by Category" subtitle="Top 6 categories compared side by side">
                      <div className="h-64">
                        {topCatEntries.length > 0 ? (
                          <Bar data={lostVsFoundBarData} options={{ ...CHART_DEFAULTS, scales: { x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0, color: '#94a3b8' }, grid: { color: '#f1f5f9' } } }, plugins: { ...CHART_DEFAULTS.plugins, tooltip: { callbacks: { label: (ctx) => { const total = ctx.chart.data.datasets.reduce((a, ds) => a + (ds.data[ctx.dataIndex] || 0), 0); const pct = total ? ((ctx.parsed.y / total) * 100).toFixed(1) : 0; return `  ${ctx.dataset.label}: ${ctx.parsed.y} (${pct}%)`; } } } } }} />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center text-gray-400">
                              <i className="fas fa-chart-bar text-2xl mb-2 block text-gray-200"></i>
                              <p className="text-sm">No category data yet</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </ChartCard>

                    {/* Category pie */}
                    <ChartCard icon="fa-chart-pie" iconBg="bg-indigo-100" iconColor="text-indigo-600" title="Category Distribution" subtitle="Share of items per category">
                      <div className="h-64">
                        {categoryEntries.length > 0 ? (
                          <Pie data={categoryPieData} options={{ ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, legend: { position: 'right', labels: { color: '#64748b', boxWidth: 10, font: { size: 11 }, padding: 12 } }, tooltip: { callbacks: { label: (ctx) => { const total = ctx.dataset.data.reduce((a, b) => a + b, 0); const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : 0; return `  ${ctx.label}: ${ctx.parsed} (${pct}%)`; } } } } }} />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center text-gray-400">
                              <i className="fas fa-chart-pie text-2xl mb-2 block text-gray-200"></i>
                              <p className="text-sm">No category data yet</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </ChartCard>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* PERFORMANCE SECTION                                                */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeNav === 'performance' && (
            <div>
              <SectionHeader color="bg-indigo-500" title="Performance Metrics" sectionKey="performance" />
              {!collapsedSections.performance && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                    {[
                      { label: 'Recovery Rate', value: recoveryRate, detail: `${stats.claimedItems + stats.returnedItems} of ${stats.totalItems} recovered`, gradient: 'from-emerald-500 to-teal-600', bar: 'bg-emerald-500', iconBg: 'bg-emerald-100', icon: 'fa-check-double', iconColor: 'text-emerald-600' },
                      { label: 'Lost Rate',     value: stats.totalItems ? Math.round((stats.lostItems / stats.totalItems) * 100) : 0,    detail: `${stats.lostItems} items reported lost`,     gradient: 'from-red-500 to-rose-600',     bar: 'bg-red-500',     iconBg: 'bg-red-100',    icon: 'fa-search',         iconColor: 'text-red-600'    },
                      { label: 'Found Rate',    value: stats.totalItems ? Math.round((stats.foundItems / stats.totalItems) * 100) : 0,   detail: `${stats.foundItems} items turned in`,        gradient: 'from-blue-500 to-indigo-600',  bar: 'bg-blue-500',    iconBg: 'bg-blue-100',   icon: 'fa-hand-holding',   iconColor: 'text-blue-600'   },
                      { label: 'Pending Rate',  value: stats.totalItems ? Math.round((stats.pendingItems / stats.totalItems) * 100) : 0, detail: `${stats.pendingItems} items awaiting action`, gradient: 'from-amber-500 to-orange-500', bar: 'bg-amber-500',   iconBg: 'bg-amber-100',  icon: 'fa-hourglass-half', iconColor: 'text-amber-600'  },
                    ].map(({ label, value, detail, gradient, bar, iconBg, icon, iconColor }) => (
                      <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
                            <i className={`fas ${icon} ${iconColor} text-sm`}></i>
                          </div>
                        </div>
                        <p className={`text-4xl font-extrabold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{value}%</p>
                        <p className="text-xs text-gray-400 mt-1.5">{detail}</p>
                        <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
                          <div className={`${bar} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${value}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Status breakdown */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <h3 className="text-sm font-semibold text-gray-800 mb-5 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                          <i className="fas fa-tasks text-purple-600 text-xs"></i>
                        </span>
                        Status Breakdown
                      </h3>
                      <div className="space-y-4">
                        {[
                          { label: 'Pending',  count: stats.pendingItems,  bar: 'bg-gradient-to-r from-amber-400 to-orange-400',   chip: 'bg-amber-50 text-amber-700 border-amber-100'  },
                          { label: 'Claimed',  count: stats.claimedItems,  bar: 'bg-gradient-to-r from-emerald-400 to-teal-500',   chip: 'bg-emerald-50 text-emerald-700 border-emerald-100'},
                          { label: 'Returned', count: stats.returnedItems, bar: 'bg-gradient-to-r from-blue-400 to-indigo-500',    chip: 'bg-blue-50 text-blue-700 border-blue-100'     },
                          { label: 'Expired',  count: stats.expiredItems,  bar: 'bg-gradient-to-r from-red-400 to-rose-500',       chip: 'bg-red-50 text-red-700 border-red-100'        },
                        ].map(({ label, count, bar, chip }) => {
                          const pct = stats.totalItems ? Math.round((count / stats.totalItems) * 100) : 0;
                          return (
                            <div key={label}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-700 font-medium">{label}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${chip}`}>{count}</span>
                                  <span className="text-sm font-bold text-gray-600 w-9 text-right">{pct}%</span>
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

                    {/* Category breakdown */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <h3 className="text-sm font-semibold text-gray-800 mb-5 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <i className="fas fa-tags text-emerald-600 text-xs"></i>
                        </span>
                        Category Breakdown
                      </h3>
                      <div className="space-y-4">
                        {(() => {
                          const COLORS = [
                            { bar: 'bg-gradient-to-r from-indigo-500 to-violet-500', chip: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                            { bar: 'bg-gradient-to-r from-emerald-500 to-teal-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                            { bar: 'bg-gradient-to-r from-amber-500 to-orange-400', chip: 'bg-amber-50 text-amber-700 border-amber-100' },
                            { bar: 'bg-gradient-to-r from-red-500 to-rose-400',     chip: 'bg-red-50 text-red-700 border-red-100' },
                            { bar: 'bg-gradient-to-r from-blue-500 to-sky-500',     chip: 'bg-blue-50 text-blue-700 border-blue-100' },
                            { bar: 'bg-gradient-to-r from-pink-500 to-rose-500',    chip: 'bg-pink-50 text-pink-700 border-pink-100' },
                            { bar: 'bg-gradient-to-r from-gray-400 to-slate-500',   chip: 'bg-gray-50 text-gray-600 border-gray-200' },
                          ];
                          return Object.entries(stats.categoryBreakdown).sort(([, a], [, b]) => b - a).map(([category, count], idx) => {
                            const pct = stats.totalItems ? Math.round((count / stats.totalItems) * 100) : 0;
                            const { bar, chip } = COLORS[idx % COLORS.length];
                            return (
                              <div key={category}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-gray-700 font-medium capitalize">{category}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${chip}`}>{count}</span>
                                    <span className="text-sm font-bold text-gray-600 w-9 text-right">{pct}%</span>
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
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* RECENT ITEMS SECTION                                               */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeNav === 'recent' && (() => {
            const filteredRecent = recentFilter === 'all' ? stats.recentItems : stats.recentItems.filter(i => i.itemType === recentFilter);
            return (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                      <i className="fas fa-clock text-orange-500 text-sm"></i>
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-800">Recent Items</h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {filteredRecent.length} {recentFilter === 'all' ? 'latest' : recentFilter} item{filteredRecent.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                      {[
                        { key: 'all',   label: 'All',   count: stats.recentItems.length },
                        { key: 'lost',  label: 'Lost',  count: stats.recentItems.filter(i => i.itemType === 'lost').length },
                        { key: 'found', label: 'Found', count: stats.recentItems.filter(i => i.itemType === 'found').length },
                      ].map(({ key, label, count }) => (
                        <button key={key} onClick={() => setRecentFilter(key)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            recentFilter === key
                              ? key === 'lost' ? 'bg-white text-orange-600 shadow-sm' : key === 'found' ? 'bg-white text-emerald-600 shadow-sm' : 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}>
                          {label}
                          <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                            recentFilter === key
                              ? key === 'lost' ? 'bg-orange-100 text-orange-600' : key === 'found' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                              : 'bg-gray-200 text-gray-500'
                          }`}>{count}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => navigate('/admin/dashboard/allitems')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors">
                      View All <i className="fas fa-arrow-right ml-1 text-[10px]"></i>
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/80">
                        {['Item', 'Type', 'Location', 'Date', 'Status'].map(h => (
                          <th key={h} className="px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredRecent.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                              <i className="fas fa-inbox text-gray-300 text-base"></i>
                            </div>
                            <p className="text-sm text-gray-400">No {recentFilter} items found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredRecent.map((item) => {
                          const imgSrc = item.images?.[0] || null;
                          const isLost = item.itemType === 'lost';
                          return (
                            <tr key={item._id} className="hover:bg-slate-50/60 transition-colors group">
                              <td className="px-6 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden bg-gray-100 border border-gray-200">
                                    {imgSrc ? (
                                      <img src={imgSrc} alt={item.itemName} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <i className="fas fa-image text-gray-300 text-xs"></i>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">{item.itemName}</p>
                                    <p className="text-xs text-gray-400 capitalize mt-0.5">{item.category}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-3.5">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${isLost ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isLost ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                                  {isLost ? 'Lost' : 'Found'}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-sm text-gray-500">
                                {item.location ? (
                                  <span className="flex items-center gap-1.5">
                                    <i className="fas fa-map-marker-alt text-gray-300 text-[10px]"></i>
                                    {item.location}
                                  </span>
                                ) : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-6 py-3.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                              <td className="px-6 py-3.5">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusColor(item.status)}`}>
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

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* LOCATIONS SECTION                                                  */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeNav === 'locations' && (() => {
            const items = stats.rawItems || [];
            const total = items.length;

            const normalizeLocation = (loc) => { const l = loc.trim().toLowerCase(); if (l.includes('canteen') || l.includes('cafeteria')) return 'canteen'; return l; };
            const locMap = {};
            items.forEach(item => { if (item.location) { const key = normalizeLocation(item.location); locMap[key] = (locMap[key] || 0) + 1; } });
            const locRank = Object.entries(locMap).sort(([, a], [, b]) => b - a).slice(0, 6).map(([loc, count]) => [loc.charAt(0).toUpperCase() + loc.slice(1), count]);
            const maxLoc = locRank[0]?.[1] || 1;

            const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayCount = [0, 0, 0, 0, 0, 0, 0];
            items.forEach(item => { dayCount[new Date(item.createdAt).getDay()]++; });
            const maxDay = Math.max(...dayCount, 1);
            const busiestDay = dayCount.indexOf(Math.max(...dayCount));

            const now2 = Date.now();
            const ageBuckets = [
              { label: 'Fresh',   sub: '0 – 7 days',  bar: 'bg-gradient-to-r from-emerald-400 to-teal-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-100', count: 0 },
              { label: 'Recent',  sub: '8 – 30 days',  bar: 'bg-gradient-to-r from-yellow-400 to-amber-500', chip: 'bg-yellow-50 text-yellow-700 border-yellow-100',   count: 0 },
              { label: 'Aging',   sub: '31 – 90 days', bar: 'bg-gradient-to-r from-orange-400 to-red-400',   chip: 'bg-orange-50 text-orange-700 border-orange-100',   count: 0 },
              { label: 'Overdue', sub: '90+ days',     bar: 'bg-gradient-to-r from-red-500 to-rose-600',     chip: 'bg-red-50 text-red-700 border-red-100',            count: 0 },
            ];
            items.filter(i => i.status === 'pending').forEach(item => {
              const d = Math.floor((now2 - new Date(item.createdAt)) / 86400000);
              if (d <= 7) ageBuckets[0].count++; else if (d <= 30) ageBuckets[1].count++; else if (d <= 90) ageBuckets[2].count++; else ageBuckets[3].count++;
            });
            const totalPending = ageBuckets.reduce((s, b) => s + b.count, 0);

            return (
              <div>
                <SectionHeader color="bg-violet-500" title="Location & Trend Analytics" sectionKey="location" />
                {!collapsedSections.location && (
                  <>
                    <div className="mb-5">
                      <CampusHeatmap rawItems={stats.rawItems} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                      {/* Top Locations */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-gray-800 mb-5 flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                            <i className="fas fa-map-marker-alt text-violet-600 text-xs"></i>
                          </span>
                          Top Reported Locations
                        </h3>
                        {locRank.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-10">No location data available</p>
                        ) : (
                          <div className="space-y-4">
                            {locRank.map(([loc, count], i) => (
                              <div key={loc}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                                    <span className="text-sm text-gray-700 font-medium truncate">{loc}</span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                    <span className="text-xs text-gray-400">{count}</span>
                                    <span className="text-sm font-bold text-violet-600 w-9 text-right">{total ? Math.round((count / total) * 100) : 0}%</span>
                                  </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                  <div className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.round((count / maxLoc) * 100)}%` }}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Day of week */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                            <i className="fas fa-calendar-alt text-orange-500 text-xs"></i>
                          </span>
                          Reporting Activity by Day
                        </h3>
                        <p className="text-xs text-gray-400 mb-5 ml-9">
                          Busiest: <span className="font-bold text-orange-500">{DAY_LABELS[busiestDay]}</span>
                          {dayCount[busiestDay] > 0 && <span className="text-gray-400"> ({dayCount[busiestDay]} reports)</span>}
                        </p>
                        <div className="flex items-end gap-2 h-28">
                          {DAY_LABELS.map((day, i) => {
                            const pct = Math.round((dayCount[i] / maxDay) * 100);
                            const isMax = i === busiestDay;
                            return (
                              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                                {dayCount[i] > 0 && <span className="text-[10px] text-gray-400 font-medium">{dayCount[i]}</span>}
                                <div className="w-full rounded-t-lg transition-all duration-500 min-h-[6px]"
                                  style={{ height: `${Math.max(pct, 4)}%`, background: isMax ? 'linear-gradient(to top, #ea580c, #f97316)' : '#fed7aa' }}></div>
                                <span className={`text-xs font-semibold ${isMax ? 'text-orange-600' : 'text-gray-400'}`}>{day}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Pending aging */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center">
                            <i className="fas fa-clock text-sky-600 text-xs"></i>
                          </span>
                          Pending Items Aging
                        </h3>
                        <p className="text-xs text-gray-400 mb-5 ml-9">{totalPending} unresolved item{totalPending !== 1 ? 's' : ''} currently pending</p>
                        <div className="space-y-4">
                          {ageBuckets.map(({ label, sub, bar, chip, count }) => {
                            const pct = totalPending ? Math.round((count / totalPending) * 100) : 0;
                            return (
                              <div key={label}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">{label}</span>
                                    <span className="text-xs text-gray-400 ml-1.5">({sub})</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${chip}`}>{count}</span>
                                    <span className="text-sm font-bold text-gray-600 w-9 text-right">{pct}%</span>
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

                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* MODULES SECTION                                                    */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeNav === 'modules' && (
            <div>
              <SectionHeader color="bg-slate-400" title="Module Statistics" sectionKey="modules" />
              {!collapsedSections.modules && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <ItemsStats />
                    <NoticeStats />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                    <UserStats />
                    <VerificationStats />
                  </div>
                  <div className="mt-5">
                    <TopReporters />
                  </div>
                  <div className="mt-5">
                    <PotentialMatches />
                  </div>
                </>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
