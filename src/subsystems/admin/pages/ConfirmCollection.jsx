import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import TopBar from "../components/TopBar";

export default function ConfirmCollection({ activeSection, setActiveSection, sidebarOpen, setSidebarOpen }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [lightbox, setLightbox] = useState(null); // { images: [], index: 0 }
  const touchStartX = useRef(null);

  // Per-card PIN state: { [requestId]: { pin, submitting, error } }
  const [pinState, setPinState] = useState({});
  // Per-card regenerate state: { [requestId]: { loading, done, error } }
  const [regenState, setRegenState] = useState({});
  const pinInputRefs = useRef({});

  useEffect(() => { fetchApprovedRequests(); }, []);

  const fetchApprovedRequests = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:3001/api/verification");
      const approved = data.data.filter((r) => r.status === "approved");
      setRequests(approved);
      setError(null);
    } catch {
      setError("Failed to load items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openPinInput = (requestId) => {
    setPinState((prev) => ({
      ...prev,
      [requestId]: { pin: "", submitting: false, error: null },
    }));
    setTimeout(() => pinInputRefs.current[requestId]?.focus(), 50);
  };

  const cancelPin = (requestId) => {
    setPinState((prev) => {
      const next = { ...prev };
      delete next[requestId];
      return next;
    });
  };

  const handlePinChange = (requestId, value) => {
    if (/^\d{0,6}$/.test(value)) {
      setPinState((prev) => ({
        ...prev,
        [requestId]: { ...prev[requestId], pin: value, error: null },
      }));
    }
  };

  const handleRegeneratePin = async (requestId) => {
    setRegenState((prev) => ({ ...prev, [requestId]: { loading: true, done: false, error: null } }));
    try {
      await axios.patch(`http://localhost:3001/api/verification/${requestId}/regenerate-pin`);
      setRegenState((prev) => ({ ...prev, [requestId]: { loading: false, done: true, error: null } }));
      fetchApprovedRequests();
    } catch (err) {
      const msg = err.response?.data?.error ?? "Failed to regenerate PIN.";
      setRegenState((prev) => ({ ...prev, [requestId]: { loading: false, done: false, error: msg } }));
    }
  };

  const handleConfirm = async (requestId) => {
    const state = pinState[requestId];
    if (!state?.pin || state.pin.length < 6) {
      setPinState((prev) => ({
        ...prev,
        [requestId]: { ...prev[requestId], error: "Please enter the 6-digit PIN." },
      }));
      return;
    }

    setPinState((prev) => ({
      ...prev,
      [requestId]: { ...prev[requestId], submitting: true, error: null },
    }));

    try {
      await axios.post(
        `http://localhost:3001/api/verification/${requestId}/confirm-collection`,
        { pin: state.pin }
      );
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
      setPinState((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
    } catch (err) {
      const msg = err.response?.data?.error ?? "Failed to confirm collection.";
      setPinState((prev) => ({
        ...prev,
        [requestId]: { ...prev[requestId], submitting: false, error: msg },
      }));
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const availableCategories = [...new Set(
    requests.map((r) => r.itemId?.category).filter(Boolean)
  )].sort();

  const filtered = requests
    .filter((r) => {
      const item = r.itemId;
      const matchesCategory = categoryFilter === "all" || item?.category === categoryFilter;
      const matchesSearch = !search || (
        item?.itemName?.toLowerCase().includes(search.toLowerCase()) ||
        item?.location?.toLowerCase().includes(search.toLowerCase()) ||
        r.claimantInfo?.name?.toLowerCase().includes(search.toLowerCase())
      );
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      const aTime = new Date(a.submittedAt).getTime();
      const bTime = new Date(b.submittedAt).getTime();
      return sortOrder === "oldest" ? aTime - bTime : bTime - aTime;
    });

  // Count items by category for stats
  const expiredCount = requests.filter((r) =>
    r.collectionPinExpiry && new Date() > new Date(r.collectionPinExpiry)
  ).length;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-indigo-50/30">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 lg:ml-64 flex flex-col">
        <TopBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title="Confirm Collection"
          subtitle="Verify the claimant's PIN to mark item as collected"
        />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">

            {/* Stats Row */}
            <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Awaiting",
                  count: requests.length,
                  icon: "fa-box-open",
                  accent: "#2563eb",
                  accentLight: "rgba(59,130,246,0.12)",
                  accentBg: "rgba(219,234,254,0.7)",
                  accentBorder: "rgba(59,130,246,0.5)",
                  barGrad: "linear-gradient(90deg,#60a5fa,#2563eb)",
                },
                {
                  label: "PIN Expired",
                  count: expiredCount,
                  icon: "fa-clock",
                  accent: "#dc2626",
                  accentLight: "rgba(248,113,113,0.12)",
                  accentBg: "rgba(254,226,226,0.7)",
                  accentBorder: "rgba(248,113,113,0.5)",
                  barGrad: "linear-gradient(90deg,#f87171,#dc2626)",
                },
                {
                  label: "Valid PIN",
                  count: requests.length - expiredCount,
                  icon: "fa-check-circle",
                  accent: "#059669",
                  accentLight: "rgba(52,211,153,0.12)",
                  accentBg: "rgba(209,250,229,0.7)",
                  accentBorder: "rgba(52,211,153,0.5)",
                  barGrad: "linear-gradient(90deg,#34d399,#059669)",
                },
                {
                  label: "Showing",
                  count: filtered.length,
                  icon: "fa-filter",
                  isTotal: true,
                },
              ].map(({ label, count, icon, accent, accentLight, accentBg, accentBorder, barGrad, isTotal }) => (
                <div
                  key={label}
                  className="relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:scale-[1.025] cursor-default"
                  style={{
                    background: isTotal ? "rgba(238,242,255,0.8)" : accentBg,
                    boxShadow: "0 2px 14px rgba(0,0,0,0.06)",
                    border: isTotal ? "2px solid rgba(99,102,241,0.45)" : `2px solid ${accentBorder}`,
                  }}
                >
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.15em]"
                        style={{ color: isTotal ? "#6366f1" : accent }}>
                        {label}
                      </p>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={isTotal
                          ? { background: "rgba(99,102,241,0.12)", border: "1.5px solid rgba(99,102,241,0.3)" }
                          : { background: accentLight, border: `1.5px solid ${accentBorder}` }}>
                        <i className={`fas ${icon} text-xs`} style={{ color: isTotal ? "#6366f1" : accent }}></i>
                      </div>
                    </div>
                    <p className="text-4xl font-black leading-none tracking-tight"
                      style={{ color: isTotal ? "#6366f1" : accent }}>
                      {count}
                    </p>
                    {!isTotal && (
                      <div className="mt-4 h-[3px] w-full rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.1)" }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${requests.length ? (count / requests.length) * 100 : 0}%`,
                            background: barGrad,
                          }}
                        />
                      </div>
                    )}
                    {isTotal && (
                      <p className="mt-3 text-xs font-medium" style={{ color: "rgba(99,102,241,0.6)" }}>
                        Filtered results
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Dark filter bar */}
            <div
              className="rounded-xl shadow-md mb-5"
              style={{ background: "linear-gradient(135deg,#1e2d4a 0%,#1e3461 100%)", border: "1px solid rgba(147,197,253,0.15)" }}
            >
              <div className="flex flex-wrap items-end gap-2 p-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs"></i>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by item, location, or claimant…"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-transparent bg-white/10 placeholder-white/35 text-white/85 transition-all"
                  />
                </div>

                {/* Category filter */}
                {availableCategories.length > 0 && (
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 bg-white/10 text-white/85 transition-all"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="all" style={{ background: "#0d1f40" }}>All Categories</option>
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat} style={{ background: "#0d1f40" }}>
                        {cat.replace(/-/g, " ")}
                      </option>
                    ))}
                  </select>
                )}

                {/* Clear + Refresh */}
                <div className="flex gap-1.5 ml-auto shrink-0">
                  {(search || categoryFilter !== "all") && (
                    <button
                      onClick={() => { setSearch(""); setCategoryFilter("all"); }}
                      className="px-3 py-2 border border-white/20 text-white/60 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1.5 text-sm font-medium"
                    >
                      <i className="fas fa-times text-xs"></i>
                      Clear
                    </button>
                  )}
                  <button
                    onClick={fetchApprovedRequests}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm font-semibold"
                  >
                    <i className="fas fa-sync-alt text-xs"></i>
                    Refresh
                  </button>
                </div>
              </div>

              {/* Results summary */}
              <div className="px-3 py-2 border-t border-white/10 bg-white/[0.04] rounded-b-xl flex items-center gap-2 flex-wrap">
                <span className="text-xs text-white/50">
                  Showing <span className="text-white/80 font-semibold">{filtered.length}</span> of{" "}
                  <span className="text-white/80 font-semibold">{requests.length}</span> approved claims
                </span>
                {categoryFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 bg-indigo-400/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full text-xs">
                    <i className="fas fa-tag text-[9px]"></i>
                    {categoryFilter}
                    <button onClick={() => setCategoryFilter("all")} className="ml-0.5 hover:text-white">
                      <i className="fas fa-times text-[8px]"></i>
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Sub-header */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4 px-5 py-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Approved Claims</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {filtered.length} claim{filtered.length !== 1 ? "s" : ""} awaiting collection confirmation
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortOrder(o => o === "oldest" ? "newest" : "oldest")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  title={sortOrder === "oldest" ? "Showing oldest first — click for newest first" : "Showing newest first — click for oldest first"}
                >
                  <i className={`fas fa-sort-amount-${sortOrder === "oldest" ? "up" : "down"} text-xs text-slate-400`}></i>
                  {sortOrder === "oldest" ? "Oldest First" : "Newest First"}
                </button>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <i className="fas fa-lock text-[9px]"></i>
                  PIN verification required
                </span>
              </div>
            </div>

            {/* Loading */}
            {loading ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin text-xl text-blue-500"></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Loading approved claims</p>
                    <p className="text-xs text-slate-400 mt-0.5">Please wait a moment…</p>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                    <i className="fas fa-exclamation-circle text-xl text-red-400"></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{error}</p>
                  </div>
                  <button
                    onClick={fetchApprovedRequests}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all text-sm font-semibold shadow-sm"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center shadow-inner border border-emerald-100">
                    <i className="fas fa-check-double text-2xl text-emerald-400"></i>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-700">
                      {search || categoryFilter !== "all" ? "No items match your filters" : "All collections confirmed!"}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
                      {search || categoryFilter !== "all"
                        ? "Try adjusting your search or category filter."
                        : "There are no approved claims pending collection right now."}
                    </p>
                  </div>
                  {(search || categoryFilter !== "all") && (
                    <button
                      onClick={() => { setSearch(""); setCategoryFilter("all"); }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all text-sm font-semibold shadow-sm shadow-blue-200"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((request) => {
                  const item = request.itemId;
                  const ps = pinState[request._id];
                  const showPinForm = !!ps;
                  const rs = regenState[request._id];
                  const pinExpired = request.collectionPinExpiry && new Date() > new Date(request.collectionPinExpiry);

                  return (
                    <div
                      key={request._id}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col border-l-4 border-l-emerald-400 hover:shadow-md transition-shadow"
                    >
                      {/* Image */}
                      <div className="h-44 bg-slate-900 flex items-center justify-center overflow-hidden flex-shrink-0 relative group cursor-zoom-in"
                        onClick={() => item?.images?.length > 0 && setLightbox({ images: item.images, index: 0 })}
                      >
                        {item?.images?.length > 0 ? (
                          <>
                            <img
                              src={item.images[0]}
                              alt={item.itemName}
                              className="w-full h-full object-contain select-none"
                              draggable={false}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                              <div className="w-9 h-9 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                <i className="fas fa-expand text-white text-xs"></i>
                              </div>
                            </div>
                          </>
                        ) : (
                          <span className="text-5xl font-black text-slate-700 select-none">
                            {item?.itemName?.charAt(0).toUpperCase() ?? "?"}
                          </span>
                        )}
                      </div>

                      {/* Body */}
                      <div className="p-4 flex flex-col gap-3 flex-1">
                        {/* Title + badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm leading-tight">{item?.itemName}</p>
                            <p className="text-xs text-slate-400 capitalize mt-0.5">{item?.category?.replace(/-/g, " ")}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                              <i className="fas fa-check-circle text-[9px]"></i>
                              Claim Approved
                            </span>
                            {pinExpired && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                                <i className="fas fa-clock text-[9px]"></i>
                                PIN Expired
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 text-xs text-slate-500">
                          {item?.location && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                                <i className="fas fa-map-marker-alt text-[9px] text-slate-400"></i>
                              </div>
                              <span className="capitalize">{item.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                              <i className="fas fa-calendar text-[9px] text-slate-400"></i>
                            </div>
                            <span>Reported {formatDate(item?.createdAt)}</span>
                          </div>
                          {request.claimantInfo?.name && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                                <i className="fas fa-user text-[9px] text-slate-400"></i>
                              </div>
                              <span className="truncate font-medium text-slate-700">{request.claimantInfo.name}</span>
                            </div>
                          )}
                          {request.claimantInfo?.email && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                                <i className="fas fa-envelope text-[9px] text-slate-400"></i>
                              </div>
                              <span className="truncate">{request.claimantInfo.email}</span>
                            </div>
                          )}
                        </div>

                        {/* Regenerate PIN */}
                        {(pinExpired || rs?.error) && (
                          <div>
                            {rs?.error && (
                              <p className="text-xs text-red-600 font-medium mb-1.5">{rs.error}</p>
                            )}
                            <button
                              onClick={() => handleRegeneratePin(request._id)}
                              disabled={rs?.loading}
                              className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                            >
                              {rs?.loading ? (
                                <>
                                  <i className="fas fa-spinner fa-spin text-xs"></i>
                                  Regenerating…
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-sync-alt text-xs"></i>
                                  Regenerate PIN &amp; Resend Email
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* PIN form or Confirm button */}
                        <div className="mt-auto">
                          {showPinForm ? (
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-slate-600">
                                Enter Claimant's Collection PIN
                              </label>
                              <input
                                ref={(el) => (pinInputRefs.current[request._id] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={ps.pin}
                                onChange={(e) => handlePinChange(request._id, e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleConfirm(request._id)}
                                placeholder="6-digit PIN"
                                className={`w-full text-center tracking-[0.3em] text-lg font-bold px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                                  ps.error ? "border-red-400 bg-red-50" : "border-slate-200"
                                }`}
                              />
                              {ps.error && (
                                <p className="text-xs text-red-600 font-medium">{ps.error}</p>
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleConfirm(request._id)}
                                  disabled={ps.submitting || ps.pin.length < 6}
                                  className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                                >
                                  {ps.submitting ? (
                                    <>
                                      <i className="fas fa-spinner fa-spin text-xs"></i>
                                      Verifying…
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-check text-xs"></i>
                                      Confirm
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => cancelPin(request._id)}
                                  disabled={ps.submitting}
                                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => openPinInput(request._id)}
                              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-emerald-200"
                            >
                              <i className="fas fa-lock text-xs"></i>
                              Enter Collection PIN
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const diff = touchStartX.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 50) {
                if (diff > 0) {
                  setLightbox((lb) => ({ ...lb, index: Math.min(lb.index + 1, lb.images.length - 1) }));
                } else {
                  setLightbox((lb) => ({ ...lb, index: Math.max(lb.index - 1, 0) }));
                }
              }
              touchStartX.current = null;
            }}
          >
            <img
              src={lightbox.images[lightbox.index]}
              alt={`Image ${lightbox.index + 1}`}
              className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain"
            />
            {lightbox.index > 0 && (
              <button
                onClick={() => setLightbox((lb) => ({ ...lb, index: lb.index - 1 }))}
                className="absolute left-[-48px] text-white bg-black/50 hover:bg-black/70 rounded-full w-9 h-9 flex items-center justify-center text-xl"
              >
                ‹
              </button>
            )}
            {lightbox.index < lightbox.images.length - 1 && (
              <button
                onClick={() => setLightbox((lb) => ({ ...lb, index: lb.index + 1 }))}
                className="absolute right-[-48px] text-white bg-black/50 hover:bg-black/70 rounded-full w-9 h-9 flex items-center justify-center text-xl"
              >
                ›
              </button>
            )}
            {lightbox.images.length > 1 && (
              <div className="absolute bottom-[-28px] flex gap-2 justify-center">
                {lightbox.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setLightbox((lb) => ({ ...lb, index: i }))}
                    className={`w-2 h-2 rounded-full transition-colors ${i === lightbox.index ? "bg-white" : "bg-white/40"}`}
                  />
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full w-9 h-9 flex items-center justify-center text-xl leading-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
