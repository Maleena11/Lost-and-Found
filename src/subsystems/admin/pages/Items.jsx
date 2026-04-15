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
function StatCard({ label, value, icon, color, total }) {
  const themes = {
    blue:   { gradient: "from-blue-500 to-indigo-600",    iconBg: "bg-blue-100",    iconText: "text-blue-600",    pillBg: "bg-blue-100",    pillText: "text-blue-700",    bar: "bg-blue-500",    border: "border-blue-100"    },
    orange: { gradient: "from-orange-400 to-amber-500",   iconBg: "bg-orange-100",  iconText: "text-orange-600",  pillBg: "bg-orange-100",  pillText: "text-orange-700",  bar: "bg-orange-400",  border: "border-orange-100"  },
    green:  { gradient: "from-emerald-500 to-teal-600",   iconBg: "bg-emerald-100", iconText: "text-emerald-600", pillBg: "bg-emerald-100", pillText: "text-emerald-700", bar: "bg-emerald-500", border: "border-emerald-100" },
    amber:  { gradient: "from-amber-400 to-yellow-500",   iconBg: "bg-amber-100",   iconText: "text-amber-600",   pillBg: "bg-amber-100",   pillText: "text-amber-700",   bar: "bg-amber-400",   border: "border-amber-100"   },
    purple: { gradient: "from-purple-500 to-violet-600",  iconBg: "bg-purple-100",  iconText: "text-purple-600",  pillBg: "bg-purple-100",  pillText: "text-purple-700",  bar: "bg-purple-500",  border: "border-purple-100"  },
    gray:   { gradient: "from-gray-400 to-gray-600",      iconBg: "bg-gray-100",    iconText: "text-gray-600",    pillBg: "bg-gray-100",    pillText: "text-gray-700",    bar: "bg-gray-400",    border: "border-gray-200"    },
  };
  const t   = themes[color] ?? themes.blue;
  const pct = total ? Math.round((value / total) * 100) : null;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${t.border} overflow-hidden hover:shadow-md transition-all duration-200 group`}>
      {/* Colored top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${t.gradient}`} />

      <div className="p-4">
        {/* Icon + percentage pill */}
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${t.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}>
            <i className={`${icon} ${t.iconText} text-sm`}></i>
          </div>
          {pct !== null && (
            <span className={`text-[10px] font-bold ${t.pillText} ${t.pillBg} px-2 py-0.5 rounded-full leading-none`}>
              {pct}%
            </span>
          )}
        </div>

        {/* Value + label */}
        <p className="text-[26px] font-extrabold text-gray-800 leading-none tracking-tight">{value}</p>
        <p className="text-xs text-gray-500 font-medium mt-1 leading-snug">{label}</p>

        {/* Mini progress bar */}
        {pct !== null && (
          <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${t.bar} transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
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
  const CATEGORY_LABELS = {
    "student-id":       "Student ID / Access Card",
    "laptop-tablet":    "Laptop / Tablet",
    "books-notes":      "Books & Lecture Notes",
    "stationery":       "Stationery / USB Drive",
    "electronics":      "Electronics",
    "lab-equipment":    "Lab Equipment",
    "sports-equipment": "Sports Equipment",
    "clothing":         "Clothing",
    "jewelry":          "Jewelry / Accessories",
    "keys":             "Keys",
    "wallet":           "Wallet / Purse",
    "documents":        "Documents / Certificates",
    "water-bottle":     "Water Bottle / Lunch Box",
    "other":            "Other",
  };
  const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS);

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
      {/* ── Page Header Banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl text-white shadow-xl shadow-black/20 mb-6" style={{ background: "linear-gradient(135deg, #0f1f4d 0%, #162660 40%, #1a1050 100%)" }}>
        <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #34d399, #60a5fa, #a78bfa, #f472b6, #34d399)", backgroundSize: "200% 100%", animation: "shimmer 4s linear infinite" }} />
        <style>{`
          @keyframes shimmer { 0%{background-position:0% 0%} 100%{background-position:200% 0%} }
          .dark-select option { background-color: #0d1f40; color: rgba(255,255,255,0.85); }
          .dark-select option:hover, .dark-select option:focus, .dark-select option:checked { background-color: #1a3a6e; color: #fff; }
        `}</style>
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ background: "linear-gradient(120deg, transparent 30%, white 50%, transparent 70%)" }} />

        <div className="relative px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-[11px] font-semibold text-purple-200 mb-3 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                Lost &amp; Found Management
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight leading-tight">
                All{" "}
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #5eead4, #67e8f9)" }}>
                  Lost &amp; Found Items
                </span>
              </h1>
              <p className="text-blue-300 text-sm mt-1.5 flex items-center gap-1.5">
                <i className="fas fa-boxes text-[11px] text-teal-400"></i>
                Track, manage, and update every reported item
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <PDFGenerator data={getPDFData()} />
              <button
                onClick={fetchItems}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Total Items"    value={stats.total}    icon="fas fa-layer-group"     color="blue"   />
        <StatCard label="Lost Reports"   value={stats.lost}     icon="fas fa-search-location" color="orange" total={stats.total} />
        <StatCard label="Found Reports"  value={stats.found}    icon="fas fa-check-circle"    color="green"  total={stats.total} />
        <StatCard label="Pending"        value={stats.pending}  icon="fas fa-hourglass-half"  color="amber"  total={stats.total} />
        <StatCard label="Claim Approved" value={stats.claimed}  icon="fas fa-tag"             color="purple" total={stats.total} />
        <StatCard label="Collected"      value={stats.returned} icon="fas fa-hand-holding"    color="blue"   total={stats.total} />
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="rounded-xl shadow-md mb-5" style={{ background: "linear-gradient(135deg, #1e2d4a 0%, #1e3461 100%)", border: "1px solid rgba(147,197,253,0.15)" }}>
        {/* Top row: search + selects + actions */}
        <div className="flex flex-wrap items-end gap-2 p-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs"></i>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by name, description, location…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-transparent bg-white/10 placeholder-white/35 text-white/85 transition-all"
            />
          </div>

          {/* Item type */}
          <select name="itemType" value={filters.itemType} onChange={handleFilterChange}
            className="dark-select border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 bg-white/10 text-white/85 transition-all">
            <option value="all">All Types</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>

          {/* Status */}
          <select name="status" value={filters.status} onChange={handleFilterChange}
            className="dark-select border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 bg-white/10 text-white/85 transition-all">
            <option value="all">All Stages</option>
            <option value="pending">Pending / Not Found Yet</option>
            <option value="claimed">Claim Approved / Match Found</option>
            <option value="returned">Collected / Reunited</option>
            <option value="expired">Expired / Case Closed</option>
          </select>

          {/* Category */}
          <select name="category" value={filters.category} onChange={handleFilterChange}
            className="dark-select border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 bg-white/10 text-white/85 transition-all">
            <option value="all">All Categories</option>
            {CATEGORY_KEYS.map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>

          {/* Sort */}
          <select name="sort" value={filters.sort} onChange={handleFilterChange}
            className="dark-select border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 bg-white/10 text-white/85 transition-all">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          {/* Action buttons */}
          <div className="flex gap-1.5 ml-auto shrink-0">
            {(filters.search || filters.itemType !== "all" || filters.status !== "all" || filters.category !== "all" || filters.sort !== "newest") && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 border border-white/20 text-white/60 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                <i className="fas fa-times text-xs"></i>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results summary bar */}
        <div className="px-3 py-2 border-t border-white/10 bg-white/[0.04] rounded-b-xl flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 bg-blue-400/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full text-xs">
            <i className="fas fa-list-ul text-[10px]"></i>
            {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
          </span>
          {filters.search && (
            <span className="text-xs text-white/40">matching <span className="text-blue-300 font-medium">"{filters.search}"</span></span>
          )}
          {filters.itemType !== "all" && (
            <span className="text-xs text-white/40">· type: <span className="font-medium text-white/70 capitalize">{filters.itemType}</span></span>
          )}
          {filters.status !== "all" && (
            <span className="text-xs text-white/40">· stage: <span className="font-medium text-white/70 capitalize">{filters.status}</span></span>
          )}
          {filters.category !== "all" && (
            <span className="inline-flex items-center gap-1 bg-indigo-400/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full text-xs">
              <i className="fas fa-tag text-[9px]"></i>
              {CATEGORY_LABELS[filters.category] ?? filters.category}
              <button onClick={() => setFilters(f => ({ ...f, category: "all" }))} className="ml-0.5 hover:text-white">
                <i className="fas fa-times text-[8px]"></i>
              </button>
            </span>
          )}
          {filters.sort !== "newest" && (
            <span className="inline-flex items-center gap-1 bg-blue-400/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full text-xs">
              <i className="fas fa-sort text-[9px]"></i>
              Oldest First
              <button onClick={() => setFilters(f => ({ ...f, sort: "newest" }))} className="ml-0.5 hover:text-white">
                <i className="fas fa-times text-[8px]"></i>
              </button>
            </span>
          )}
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            {/* ── Header ── */}
            <thead>
              <tr style={{ background: "linear-gradient(135deg, #e8eef7 0%, #dce6f5 100%)" }}>
                <th className="px-5 py-3.5 text-left">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 uppercase tracking-widest">
                    <i className="fas fa-box text-blue-500 text-[10px]"></i>Item
                  </span>
                </th>
                <th className="px-5 py-3.5 text-left">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 uppercase tracking-widest">
                    <i className="fas fa-tags text-blue-500 text-[10px]"></i>Type
                  </span>
                </th>
                <th className="px-5 py-3.5 text-left">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 uppercase tracking-widest">
                    <i className="fas fa-map-marker-alt text-blue-500 text-[10px]"></i>Location
                  </span>
                </th>
                <th className="px-5 py-3.5 text-left">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 uppercase tracking-widest">
                    <i className="fas fa-calendar-alt text-blue-500 text-[10px]"></i>Reported
                  </span>
                </th>
                <th className="px-5 py-3.5 text-left">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 uppercase tracking-widest">
                    <i className="fas fa-stream text-blue-500 text-[10px]"></i>Stage
                  </span>
                </th>
                <th className="px-5 py-3.5 text-left">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 uppercase tracking-widest">
                    <i className="fas fa-pen text-blue-500 text-[10px]"></i>Update Stage
                  </span>
                </th>
                <th className="px-5 py-3.5 text-center">
                  <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-widest">Actions</span>
                </th>
              </tr>
            </thead>

            {/* ── Body ── */}
            <tbody className="divide-y divide-gray-50">
              {currentItems.length > 0 ? currentItems.map((item, idx) => (
                <>
                  <tr
                    key={item._id}
                    onClick={() => setExpandedRow(expandedRow === item._id ? null : item._id)}
                    className={`group cursor-pointer transition-all duration-150 border-l-4 ${
                      expandedRow === item._id
                        ? "bg-blue-50/60 border-l-blue-500"
                        : idx % 2 === 0
                          ? "bg-white border-l-transparent hover:bg-blue-50/30 hover:border-l-blue-400"
                          : "bg-gray-50/40 border-l-transparent hover:bg-blue-50/30 hover:border-l-blue-400"
                    }`}
                  >

                    {/* Item */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden ring-1 ring-gray-200 shadow-sm">
                          {item.images?.length > 0 ? (
                            <img src={item.images[0]} alt={item.itemName} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center text-base font-extrabold ${
                              item.itemType === "lost" ? "bg-gradient-to-br from-orange-100 to-amber-100 text-orange-500"
                                                      : "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600"
                            }`}>
                              {item.itemName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate max-w-[150px] leading-snug">{item.itemName}</p>
                          <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-medium capitalize">
                            <i className="fas fa-tag text-[8px]"></i>
                            {item.category?.replace(/-/g, " ") || "—"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        item.itemType === "lost"
                          ? "bg-orange-50 text-orange-600 border-orange-200"
                          : "bg-emerald-50 text-emerald-600 border-emerald-200"
                      }`}>
                        <i className={`${item.itemType === "lost" ? "fas fa-search text-orange-400" : "fas fa-check-circle text-emerald-400"} text-[10px]`}></i>
                        {item.itemType === "lost" ? "Lost" : "Found"}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                          <i className="fas fa-map-marker-alt text-blue-400 text-[9px]"></i>
                        </span>
                        <span className="text-gray-700 text-xs capitalize leading-snug max-w-[110px] truncate">{item.location || "—"}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-gray-700 text-xs font-medium">{formatDate(item.createdAt)}</p>
                    </td>

                    {/* Stage */}
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <StageProgress itemType={item.itemType} status={item.status} />
                    </td>

                    {/* Update stage */}
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="relative inline-flex items-center">
                        <select
                          value={item.status}
                          onChange={e => handleStatusUpdate(item._id, e.target.value)}
                          disabled={statusUpdateLoading === item._id}
                          className={`appearance-none pl-2.5 pr-7 py-1.5 text-xs font-semibold rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all disabled:opacity-50 cursor-pointer ${
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
                        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                          {statusUpdateLoading === item._id
                            ? <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            : <i className="fas fa-chevron-down text-[8px] text-gray-400"></i>
                          }
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          title="View details"
                          onClick={() => setExpandedRow(expandedRow === item._id ? null : item._id)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            expandedRow === item._id
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600"
                          }`}
                        >
                          <i className={`${expandedRow === item._id ? "fas fa-chevron-up" : "fas fa-eye"} text-xs`}></i>
                        </button>
                        <button
                          title="Delete item"
                          onClick={() => confirmDelete(item)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ── Expanded detail panel ── */}
                  {expandedRow === item._id && (
                    <tr key={`${item._id}-detail`}>
                      <td colSpan="7" className="px-0 py-0">
                        <div className="mx-4 my-3 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 overflow-hidden shadow-inner">
                          {/* Panel header */}
                          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-100 bg-blue-50/60">
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                              <i className="fas fa-info text-white text-[9px]"></i>
                            </div>
                            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Item Details</p>
                            <span className="ml-auto text-[10px] text-blue-400">ID: {item._id?.slice(-8)}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-blue-100">
                            {/* Description */}
                            <div className="px-5 py-4">
                              <p className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">
                                <i className="fas fa-align-left"></i>Description
                              </p>
                              <p className="text-gray-700 text-sm leading-relaxed">{item.description || <span className="text-gray-400 italic">No description provided</span>}</p>
                            </div>

                            {/* Reporter */}
                            <div className="px-5 py-4">
                              <p className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">
                                <i className="fas fa-user"></i>Reported By
                              </p>
                              <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                  <span className="text-white text-xs font-bold">
                                    {item.contactInfo?.name?.charAt(0)?.toUpperCase() || "?"}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-gray-800 font-semibold text-sm leading-snug">{item.contactInfo?.name || "—"}</p>
                                  {item.contactInfo?.email && (
                                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                                      <i className="fas fa-envelope text-[9px] text-gray-400"></i>{item.contactInfo.email}
                                    </p>
                                  )}
                                  {item.contactInfo?.phone && (
                                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                                      <i className="fas fa-phone text-[9px] text-gray-400"></i>{item.contactInfo.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Stage summary */}
                            <div className="px-5 py-4">
                              <p className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">
                                <i className="fas fa-stream"></i>Current Stage
                              </p>
                              <StatusBadge itemType={item.itemType} status={item.status} />
                              <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
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
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )) : (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                        <i className="fas fa-search text-gray-300 text-2xl"></i>
                      </div>
                      <div>
                        <p className="text-gray-600 font-semibold text-sm">No items match your filters</p>
                        <p className="text-gray-400 text-xs mt-1">Try adjusting or clearing your filters to see results.</p>
                      </div>
                      <button
                        onClick={resetFilters}
                        className="mt-1 inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <i className="fas fa-times text-[10px]"></i>Clear Filters
                      </button>
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
