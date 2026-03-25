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
    // Focus after render
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
    // Allow only digits, max 6
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
      // Refresh list so expiry badge updates
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
      // Remove from list on success
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

  // Derive unique categories present in the loaded data
  const availableCategories = [...new Set(
    requests.map((r) => r.itemId?.category).filter(Boolean)
  )].sort();

  const filtered = requests.filter((r) => {
    const item = r.itemId;
    const matchesCategory = categoryFilter === "all" || item?.category === categoryFilter;
    const matchesSearch = !search || (
      item?.itemName?.toLowerCase().includes(search.toLowerCase()) ||
      item?.location?.toLowerCase().includes(search.toLowerCase()) ||
      r.claimantInfo?.name?.toLowerCase().includes(search.toLowerCase())
    );
    return matchesCategory && matchesSearch;
  });

  const Shell = ({ children }) => (
    <div className="flex">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex-1 min-h-screen lg:ml-64 flex flex-col bg-gray-50">
        <TopBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title="Confirm Collection"
          subtitle="Verify the claimant's PIN to mark item as collected"
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );

  if (loading)
    return (
      <Shell>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600" />
            <p className="text-sm text-gray-500 font-medium">Loading approved claims…</p>
          </div>
        </div>
      </Shell>
    );

  if (error)
    return (
      <Shell>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={fetchApprovedRequests} className="mt-3 text-sm text-red-700 underline">
            Try again
          </button>
        </div>
      </Shell>
    );

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Confirm Collection</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ask the claimant for their Collection PIN (sent by email) before confirming
          </p>
        </div>
        <button
          onClick={fetchApprovedRequests}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Summary banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-lg flex-shrink-0">
          🔐
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-800">
            {requests.length} claim{requests.length !== 1 ? "s" : ""} awaiting collection
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            Each claimant received a 6-digit Collection PIN in their approval email. Enter it below to confirm pickup.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by item, location, or claimant…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category filter */}
      {availableCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              categoryFilter === "all"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            All
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === categoryFilter ? "all" : cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize ${
                categoryFilter === cat
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              {cat.replace(/-/g, " ")}
            </button>
          ))}
        </div>
      )}

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="text-5xl">✅</span>
            <p className="text-gray-700 font-semibold text-lg">
              {search || categoryFilter !== "all" ? "No items match your filters" : "All collections confirmed!"}
            </p>
            <p className="text-sm text-gray-400">
              {search || categoryFilter !== "all"
                ? "Try adjusting your search or category filter."
                : "There are no approved claims pending collection right now."}
            </p>
            {(search || categoryFilter !== "all") && (
              <button
                onClick={() => { setSearch(""); setCategoryFilter("all"); }}
                className="text-sm text-blue-600 hover:underline mt-1"
              >
                Clear filters
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
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
              >
                {/* Image */}
                <div className="h-40 bg-emerald-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {item?.images?.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.itemName}
                      className="w-full h-full object-cover cursor-zoom-in"
                      onClick={() => setLightbox({ images: item.images, index: 0 })}
                    />
                  ) : (
                    <span className="text-5xl font-bold text-emerald-200">
                      {item?.itemName?.charAt(0).toUpperCase() ?? "?"}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  {/* Title + badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm leading-tight">{item?.itemName}</p>
                      <p className="text-xs text-gray-400 capitalize mt-0.5">{item?.category?.replace(/-/g, " ")}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Claim Approved
                      </span>
                      {pinExpired && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          PIN Expired
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-gray-500">
                    {item?.location && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="capitalize">{item.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Reported {formatDate(item?.createdAt)}</span>
                    </div>
                    {request.claimantInfo?.name && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate font-medium text-gray-700">{request.claimantInfo.name}</span>
                      </div>
                    )}
                    {request.claimantInfo?.email && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{request.claimantInfo.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Regenerate PIN button — shown when PIN is expired or after a failed attempt */}
                  {(pinExpired || rs?.error) && (
                    <div className="mt-2">
                      {rs?.error && (
                        <p className="text-xs text-red-600 font-medium mb-1.5">{rs.error}</p>
                      )}
                      <button
                        onClick={() => handleRegeneratePin(request._id)}
                        disabled={rs?.loading}
                        className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                      >
                        {rs?.loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Regenerating…
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
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
                        <label className="block text-xs font-semibold text-gray-600">
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
                            ps.error ? "border-red-400 bg-red-50" : "border-gray-300"
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
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Verifying…
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Confirm
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => cancelPin(request._id)}
                            disabled={ps.submitting}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => openPinInput(request._id)}
                        className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
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
                  // swipe left → next
                  setLightbox((lb) => ({ ...lb, index: Math.min(lb.index + 1, lb.images.length - 1) }));
                } else {
                  // swipe right → prev
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

            {/* Prev */}
            {lightbox.index > 0 && (
              <button
                onClick={() => setLightbox((lb) => ({ ...lb, index: lb.index - 1 }))}
                className="absolute left-[-48px] text-white bg-black/50 hover:bg-black/70 rounded-full w-9 h-9 flex items-center justify-center text-xl"
              >
                ‹
              </button>
            )}

            {/* Next */}
            {lightbox.index < lightbox.images.length - 1 && (
              <button
                onClick={() => setLightbox((lb) => ({ ...lb, index: lb.index + 1 }))}
                className="absolute right-[-48px] text-white bg-black/50 hover:bg-black/70 rounded-full w-9 h-9 flex items-center justify-center text-xl"
              >
                ›
              </button>
            )}

            {/* Dot indicators */}
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

          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full w-9 h-9 flex items-center justify-center text-xl leading-none"
          >
            ×
          </button>
        </div>
      )}
    </Shell>
  );
}
