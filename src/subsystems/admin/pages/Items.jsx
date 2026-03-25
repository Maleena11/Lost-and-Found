import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import TopBar from "../components/TopBar";
import PDFGenerator from "../../lost-found-reporting/components/PDFGenerator";

// ─── Stage helpers ────────────────────────────────────────────────────────────

const FOUND_STAGES = [
  { key: "pending",  label: "Submitted",      short: "Submitted" },
  { key: "claimed",  label: "Claim Approved", short: "Approved"  },
  { key: "returned", label: "Collected",      short: "Collected" },
];

const LOST_STAGES = [
  { key: "pending",  label: "Reported",    short: "Reported" },
  { key: "claimed",  label: "Match Found", short: "Matched"  },
  { key: "returned", label: "Reunited",    short: "Reunited" },
];

const STAGE_ORDER = ["pending", "claimed", "returned"];

function getStageIndex(status) {
  const idx = STAGE_ORDER.indexOf(status);
  return idx === -1 ? -1 : idx; // -1 means expired
}

// Human-readable label per item type + status
function getStatusLabel(itemType, status) {
  if (status === "expired") return itemType === "lost" ? "Case Closed" : "Expired";
  const stages = itemType === "found" ? FOUND_STAGES : LOST_STAGES;
  return stages.find(s => s.key === status)?.label ?? status;
}

// Tailwind color set for each status
const STATUS_COLORS = {
  pending:  { bg: "bg-amber-50",   border: "border-amber-400",  text: "text-amber-700",  dot: "bg-amber-400"  },
  claimed:  { bg: "bg-blue-50",    border: "border-blue-400",   text: "text-blue-700",   dot: "bg-blue-400"   },
  returned: { bg: "bg-emerald-50", border: "border-emerald-400",text: "text-emerald-700",dot: "bg-emerald-500" },
  expired:  { bg: "bg-gray-100",   border: "border-gray-400",   text: "text-gray-500",   dot: "bg-gray-400"   },
};

// ─── Mini stage progress bar (3-step, hidden for expired) ─────────────────────
function StageProgress({ itemType, status }) {
  if (status === "expired") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 font-medium">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {getStatusLabel(itemType, status)}
      </span>
    );
  }

  const stages  = itemType === "found" ? FOUND_STAGES : LOST_STAGES;
  const current = getStageIndex(status);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {stages.map((stage, i) => {
          const done   = i < current;
          const active = i === current;
          return (
            <div key={stage.key} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
                done   ? "bg-emerald-500" :
                active ? (itemType === "found" ? "bg-blue-500" : "bg-orange-400") + " ring-2 ring-offset-1 " + (itemType === "found" ? "ring-blue-300" : "ring-orange-200") :
                "bg-gray-200"
              }`} />
              {i < stages.length - 1 && (
                <div className={`h-px w-6 flex-shrink-0 ${done ? "bg-emerald-400" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>
      <span className={`text-xs font-semibold ${
        status === "returned" ? "text-emerald-600" :
        itemType === "found"  ? "text-blue-600"    : "text-orange-500"
      }`}>
        {getStatusLabel(itemType, status)}
      </span>
    </div>
  );
}

// ─── Status badge pill ────────────────────────────────────────────────────────
function StatusBadge({ itemType, status }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.expired;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.border} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {getStatusLabel(itemType, status)}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  const colorMap = {
    blue:    "from-blue-500 to-blue-600",
    orange:  "from-orange-400 to-orange-500",
    green:   "from-emerald-500 to-emerald-600",
    amber:   "from-amber-400 to-amber-500",
    gray:    "from-gray-400 to-gray-500",
    purple:  "from-purple-500 to-purple-600",
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorMap[color] ?? colorMap.blue} flex items-center justify-center flex-shrink-0`}>
        <span className="text-white text-lg">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AllItems({ activeSection, setActiveSection, sidebarOpen, setSidebarOpen }) {
  const [items, setItems]               = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(null); // stores itemId being updated
  const [expandedRow, setExpandedRow]   = useState(null);

  const [filters, setFilters] = useState({
    search:   "",
    itemType: "all",
    status:   "all",
    category: "all",
    sort:     "newest",
  });

  const [currentPage, setCurrentPage]   = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { applyFilters(); }, [filters, items]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:3001/api/lost-found");
      setItems(data.data);
      setError(null);
    } catch {
      setError("Failed to load items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...items];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(i =>
        i.itemName.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
      );
    }
    if (filters.itemType !== "all") result = result.filter(i => i.itemType === filters.itemType);
    if (filters.status   !== "all") result = result.filter(i => i.status   === filters.status);
    if (filters.category !== "all") result = result.filter(i => i.category === filters.category);
    result.sort((a, b) => {
      const diff = new Date(a.createdAt) - new Date(b.createdAt);
      return filters.sort === "oldest" ? diff : -diff;
    });
    setFilteredItems(result);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () =>
    setFilters({ search: "", itemType: "all", status: "all", category: "all", sort: "newest" });

  const confirmDelete = (item) => { setItemToDelete(item); setShowDeleteModal(true); };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`http://localhost:3001/api/lost-found/${itemToDelete._id}`, {
        data: { userId: itemToDelete.userId },
      });
      setItems(prev => prev.filter(i => i._id !== itemToDelete._id));
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      alert("Failed to delete item. " + (err.response?.data?.error ?? ""));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusUpdate = async (itemId, newStatus) => {
    setStatusUpdateLoading(itemId);
    try {
      const { data } = await axios.patch(
        `http://localhost:3001/api/lost-found/${itemId}/status`,
        { status: newStatus }
      );
      setItems(prev => prev.map(i => i._id === itemId ? data.data : i));
    } catch (err) {
      alert("Failed to update status. " + (err.response?.data?.error ?? ""));
    } finally {
      setStatusUpdateLoading(null);
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = {
    total:    items.length,
    lost:     items.filter(i => i.itemType === "lost").length,
    found:    items.filter(i => i.itemType === "found").length,
    pending:  items.filter(i => i.status === "pending").length,
    claimed:  items.filter(i => i.status === "claimed").length,
    returned: items.filter(i => i.status === "returned").length,
  };

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages      = Math.ceil(filteredItems.length / itemsPerPage);
  const indexOfFirst    = (currentPage - 1) * itemsPerPage;
  const currentItems    = filteredItems.slice(indexOfFirst, indexOfFirst + itemsPerPage);
  const categories      = ["all", ...new Set(items.map(i => i.category))];

  const formatDate = (d) =>
    new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  // ── PDF data ───────────────────────────────────────────────────────────────
  const getPDFData = () => {
    const catBreakdown = {};
    filteredItems.forEach(i => { catBreakdown[i.category] = (catBreakdown[i.category] ?? 0) + 1; });
    return {
      stats: { ...stats, totalItems: filteredItems.length, expiredItems: filteredItems.filter(i => i.status === "expired").length, categoryBreakdown: catBreakdown, allItems: filteredItems },
      items: filteredItems,
      title: `Lost and Found Items Report - ${new Date().toLocaleDateString()}`,
      filterSummary: "",
    };
  };

  // ── Shell layout ───────────────────────────────────────────────────────────
  const Shell = ({ children }) => (
    <div className="flex">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 min-h-screen lg:ml-64 flex flex-col bg-gray-50">
        <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="All Lost & Found Items" subtitle="Manage and track all reported items" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );

  if (loading) return (
    <Shell>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-gray-500 font-medium">Loading items…</p>
        </div>
      </div>
    </Shell>
  );

  if (error) return (
    <Shell>
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={fetchItems} className="mt-3 text-sm text-red-700 underline">Try again</button>
      </div>
    </Shell>
  );

  return (
    <Shell>
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Lost &amp; Found Items</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track, manage, and update every reported item</p>
        </div>
        <div className="flex items-center gap-3">
          <PDFGenerator data={getPDFData()} />
          <button
            onClick={fetchItems}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Total Items"   value={stats.total}    icon="📦" color="blue"   />
        <StatCard label="Lost Reports"  value={stats.lost}     icon="🔍" color="orange" />
        <StatCard label="Found Reports" value={stats.found}    icon="✅" color="green"  />
        <StatCard label="Pending"       value={stats.pending}  icon="⏳" color="amber"  />
        <StatCard label="Claim Approved"value={stats.claimed}  icon="🏷️" color="purple" />
        <StatCard label="Collected"     value={stats.returned} icon="🎉" color="green"  />
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by name, description, location…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          {/* Item type */}
          <select name="itemType" value={filters.itemType} onChange={handleFilterChange}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="all">All Types</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>

          {/* Status */}
          <select name="status" value={filters.status} onChange={handleFilterChange}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="all">All Stages</option>
            <option value="pending">Pending / Not Found Yet</option>
            <option value="claimed">Claim Approved / Match Found</option>
            <option value="returned">Collected / Reunited</option>
            <option value="expired">Expired / Case Closed</option>
          </select>

          {/* Category */}
          <select name="category" value={filters.category} onChange={handleFilterChange}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
            {categories.map(c => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>

          {/* Sort by date */}
          <select name="sort" value={filters.sort} onChange={handleFilterChange}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Active filter pills + reset */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-200">
                "{filters.search}"
                <button onClick={() => setFilters(f => ({ ...f, search: "" }))} className="ml-0.5 hover:text-blue-900">×</button>
              </span>
            )}
            {filters.itemType !== "all" && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-200">
                Type: {filters.itemType}
                <button onClick={() => setFilters(f => ({ ...f, itemType: "all" }))} className="ml-0.5 hover:text-blue-900">×</button>
              </span>
            )}
            {filters.status !== "all" && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-200">
                Stage: {filters.status}
                <button onClick={() => setFilters(f => ({ ...f, status: "all" }))} className="ml-0.5 hover:text-blue-900">×</button>
              </span>
            )}
            {filters.category !== "all" && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-200">
                {filters.category}
                <button onClick={() => setFilters(f => ({ ...f, category: "all" }))} className="ml-0.5 hover:text-blue-900">×</button>
              </span>
            )}
            {filters.sort !== "newest" && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-200">
                Oldest First
                <button onClick={() => setFilters(f => ({ ...f, sort: "newest" }))} className="ml-0.5 hover:text-blue-900">×</button>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}</span>
            <button onClick={resetFilters} className="text-gray-400 hover:text-gray-600 underline underline-offset-2">Reset</button>
          </div>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reported</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Update Stage</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentItems.length > 0 ? currentItems.map(item => (
                <>
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === item._id ? null : item._id)}
                  >
                    {/* Item */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                          {item.images?.length > 0 ? (
                            <img src={item.images[0]} alt={item.itemName} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center text-base font-bold ${
                              item.itemType === "lost" ? "bg-orange-100 text-orange-500" : "bg-emerald-100 text-emerald-600"
                            }`}>
                              {item.itemName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate max-w-[140px]">{item.itemName}</p>
                          <p className="text-xs text-gray-400 capitalize mt-0.5">{item.category?.replace(/-/g, " ")}</p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.itemType === "lost"
                          ? "bg-orange-50 text-orange-600 border border-orange-200"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      }`}>
                        {item.itemType === "lost" ? "🔍" : "✅"} {item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm capitalize">{item.location}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{formatDate(item.createdAt)}</td>

                    {/* Stage progress */}
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <StageProgress itemType={item.itemType} status={item.status} />
                    </td>

                    {/* Update stage dropdown */}
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <div className="relative">
                        <select
                          value={item.status}
                          onChange={e => handleStatusUpdate(item._id, e.target.value)}
                          disabled={statusUpdateLoading === item._id}
                          className={`appearance-none pl-3 pr-7 py-1.5 text-xs font-semibold rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors disabled:opacity-50 ${
                            item.status === "pending"  ? "bg-amber-50   border-amber-300   text-amber-700"   :
                            item.status === "claimed"  ? "bg-blue-50    border-blue-300    text-blue-700"    :
                            item.status === "returned" ? "bg-emerald-50 border-emerald-300 text-emerald-700" :
                                                        "bg-gray-100   border-gray-300    text-gray-500"
                          }`}
                        >
                          {item.itemType === "found" ? (
                            <>
                              <option value="pending">Submitted</option>
                              <option value="claimed">Claim Approved</option>
                              <option value="returned">Collected by Owner</option>
                              <option value="expired">Expired</option>
                            </>
                          ) : (
                            <>
                              <option value="pending">Not Found Yet</option>
                              <option value="claimed">Match Found</option>
                              <option value="returned">Reunited</option>
                              <option value="expired">Case Closed</option>
                            </>
                          )}
                        </select>
                        {statusUpdateLoading === item._id && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedRow(expandedRow === item._id ? null : item._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                        <button
                          onClick={() => confirmDelete(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ── Expanded detail row ──────────────────────────────── */}
                  {expandedRow === item._id && (
                    <tr key={`${item._id}-detail`} className="bg-blue-50/40">
                      <td colSpan="7" className="px-6 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          {/* Description */}
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</p>
                            <p className="text-gray-700">{item.description || "—"}</p>
                          </div>
                          {/* Contact */}
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Reported By</p>
                            <p className="text-gray-700 font-medium">{item.contactInfo?.name || "—"}</p>
                            <p className="text-gray-500">{item.contactInfo?.email || ""}</p>
                            <p className="text-gray-500">{item.contactInfo?.phone || ""}</p>
                          </div>
                          {/* Stage summary */}
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Current Stage</p>
                            <StatusBadge itemType={item.itemType} status={item.status} />
                            <p className="text-xs text-gray-400 mt-2">
                              {item.itemType === "found" ? (
                                item.status === "pending"  ? "Item submitted — awaiting admin review." :
                                item.status === "claimed"  ? "Claim verified — owner notified to collect from office." :
                                item.status === "returned" ? "Owner has collected the item from the office." :
                                                             "Item was not collected and has expired."
                              ) : (
                                item.status === "pending"  ? "Report submitted — no matching found item yet." :
                                item.status === "claimed"  ? "A matching found item has been identified." :
                                item.status === "returned" ? "Owner has been reunited with their item." :
                                                             "Case closed — no match found within the time limit."
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )) : (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-4xl">🔎</span>
                      <p className="text-gray-500 font-medium">No items match your filters</p>
                      <button onClick={resetFilters} className="text-sm text-blue-600 hover:underline">Clear filters</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {filteredItems.length > itemsPerPage && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-700">{indexOfFirst + 1}</span>–
              <span className="font-semibold text-gray-700">{Math.min(indexOfFirst + itemsPerPage, filteredItems.length)}</span> of{" "}
              <span className="font-semibold text-gray-700">{filteredItems.length}</span> items
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >‹ Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-xs">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        currentPage === p
                          ? "bg-blue-600 text-white shadow-sm"
                          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                    >{p}</button>
                  )
                )}
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >Next ›</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete confirmation modal ──────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete Item</h3>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-gray-800">"{itemToDelete?.itemName}"</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
