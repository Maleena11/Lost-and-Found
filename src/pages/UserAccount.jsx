import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../shared/utils/AuthContext";
import Header from "../shared/components/Header";
import Footer from "../shared/components/Footer";

const API = "http://localhost:3001/api";

/* ── helpers ─────────────────────────────────────────────────── */
function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

const CLAIM_STATUS = {
  pending:   { bg: "bg-amber-50",  border: "border-amber-300", text: "text-amber-700",  dot: "bg-amber-400",  accent: "bg-amber-400",  icon: "fas fa-hourglass-half", label: "Pending Review" },
  approved:  { bg: "bg-green-50",  border: "border-green-300", text: "text-green-700",  dot: "bg-green-500",  accent: "bg-green-500",  icon: "fas fa-check-circle",   label: "Approved" },
  rejected:  { bg: "bg-red-50",    border: "border-red-300",   text: "text-red-700",    dot: "bg-red-500",    accent: "bg-red-500",    icon: "fas fa-times-circle",   label: "Rejected" },
  processed: { bg: "bg-blue-50",   border: "border-blue-300",  text: "text-blue-800",   dot: "bg-blue-700",   accent: "bg-blue-700",   icon: "fas fa-clipboard-check",label: "Processed" },
};

const NOTIF_PRIORITY = {
  high:   { bar: "bg-red-500",    icon: "fas fa-exclamation-circle text-red-500" },
  medium: { bar: "bg-amber-400",  icon: "fas fa-info-circle text-amber-500" },
  low:    { bar: "bg-blue-400",   icon: "fas fa-bell text-blue-500" },
};

const STAGE_STATE = {
  passed:  { bg: "bg-green-500", ring: "ring-2 ring-green-300", text: "text-white",      icon: "fas fa-check",      label: "Passed" },
  failed:  { bg: "bg-red-500",   ring: "ring-2 ring-red-300",   text: "text-white",      icon: "fas fa-times",      label: "Failed" },
  pending: { bg: "bg-gray-200",  ring: "ring-2 ring-gray-200",  text: "text-gray-400",   icon: "fas fa-ellipsis-h", label: "Pending" },
};

/* ── sub-components ──────────────────────────────────────────── */
function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
        <i className={`${icon} text-xl ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <i className={`${icon} w-4 text-sm`} />
      <span className="flex-1 text-left">{label}</span>
      {badge != null && badge > 0 && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${active ? "bg-white text-slate-900" : "bg-red-500 text-white"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

/* ── main page ───────────────────────────────────────────────── */
export default function UserAccount() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("claims");
  const [claims, setClaims] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [resendingPin, setResendingPin] = useState({});
  const [deletingClaim, setDeletingClaim] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null); // claimId awaiting confirmation
  const [claimSort, setClaimSort] = useState("newest");
  const [claimFilter, setClaimFilter] = useState("all");

  const email = user?.email || "";
  const initials = (user?.name || email || "U").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
    if (!email) return;
    setLoadingClaims(true);
    axios.get(`${API}/verification/user/${encodeURIComponent(email)}`)
      .then(res => setClaims(res.data.data || []))
      .catch(() => setClaims([]))
      .finally(() => setLoadingClaims(false));
  }, [email]);

  useEffect(() => {
    if (!email) return;
    setLoadingNotifs(true);
    axios.get(`${API}/notifications/in-app/${encodeURIComponent(email)}`)
      .then(res => setNotifications(res.data.data || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoadingNotifs(false));
  }, [email]);

  const markRead = async (id) => {
    await axios.put(`${API}/notifications/in-app/${id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await axios.put(`${API}/notifications/in-app/mark-all-read/${encodeURIComponent(email)}`).catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const resendPin = async (claimId) => {
    setResendingPin(prev => ({ ...prev, [claimId]: true }));
    try {
      await axios.patch(`${API}/verification/${claimId}/regenerate-pin`);
      alert("A new collection PIN has been sent to your registered email address.");
    } catch {
      alert("Failed to resend PIN. Please try again or contact the Lost & Found Office.");
    } finally {
      setResendingPin(prev => ({ ...prev, [claimId]: false }));
    }
  };

  const deleteClaim = async (claimId) => {
    setConfirmDelete(null);
    setDeletingClaim(prev => ({ ...prev, [claimId]: true }));
    try {
      await axios.delete(`${API}/verification/${claimId}`);
      setClaims(prev => prev.filter(c => c._id !== claimId));
    } catch {
      alert("Failed to delete claim. Please try again.");
      setDeletingClaim(prev => ({ ...prev, [claimId]: false }));
    }
  };

  const unread   = notifications.filter(n => !n.isRead).length;
  const pending  = claims.filter(c => c.status === "pending").length;
  const approved = claims.filter(c => c.status === "approved").length;
  const rejected = claims.filter(c => c.status === "rejected").length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />

      {/* ── Hero banner ───────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white overflow-hidden">
        {/* Subtle dot-grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/25 flex items-center justify-center text-2xl font-bold shadow-xl backdrop-blur-sm">
              {initials}
            </div>
            <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-green-400 border-2 border-slate-900 rounded-full" title="Active" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-1">
              <i className="fas fa-graduation-cap mr-1.5" />Student Account
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{user?.name || "My Account"}</h1>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
              <i className="fas fa-envelope text-slate-500" />{email}
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2.5 flex-wrap">
            <Link
              to="/report-item"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 transition-colors text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-orange-900/30"
            >
              <i className="fas fa-plus" /> Report Item
            </Link>
            <Link
              to="/verification"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors text-white text-sm font-semibold px-5 py-2.5 rounded-xl border border-white/20 backdrop-blur-sm"
            >
              <i className="fas fa-search" /> Browse Items
            </Link>
          </div>
        </div>

        {/* Stat strip */}
        <div className="relative max-w-7xl mx-auto px-6 pb-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 border border-white/10 rounded-t-2xl overflow-hidden divide-x divide-white/10">
            {[
              { label: "Total Claims", value: claims.length, icon: "fas fa-file-alt",        color: "text-slate-300" },
              { label: "Pending",      value: pending,       icon: "fas fa-hourglass-half",   color: "text-amber-300" },
              { label: "Approved",     value: approved,      icon: "fas fa-check-circle",     color: "text-green-400" },
              { label: "Rejected",     value: rejected,      icon: "fas fa-times-circle",     color: "text-red-400" },
            ].map(s => (
              <div key={s.label} className="bg-white/5 hover:bg-white/10 transition-colors px-5 py-4 text-center">
                <i className={`${s.icon} ${s.color} text-lg mb-1 block`} />
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto w-full px-6 py-8 flex gap-6 items-start">

        {/* ── Sidebar ───────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-60 flex-shrink-0 sticky top-6 gap-3">

          {/* User card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-blue-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.name || "Student"}</p>
              <p className="text-xs text-gray-400 truncate">{email}</p>
            </div>
          </div>

          {/* Nav */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold px-3 pt-1 pb-2">Navigation</p>
            <SidebarLink icon="fas fa-file-alt"  label="My Claims"     active={tab === "claims"}        onClick={() => setTab("claims")} />
            <SidebarLink icon="fas fa-bell"      label="Notifications" active={tab === "notifications"} onClick={() => setTab("notifications")} badge={unread} />
            <SidebarLink icon="fas fa-user"      label="Profile"       active={tab === "profile"}       onClick={() => setTab("profile")} />

            <div className="border-t border-gray-100 mt-2 pt-2 flex flex-col gap-0.5">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold px-3 pb-1">Quick Links</p>
              <Link to="/notification-settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                <i className="fas fa-cog w-4 text-slate-400 text-sm" /> Notification Settings
              </Link>
              <Link to="/notice" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                <i className="fas fa-bullhorn w-4 text-slate-400 text-sm" /> View Notices
              </Link>
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <i className="fas fa-sign-out-alt w-4 text-sm" /> Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden flex w-full mb-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-1.5 gap-1">
          {[
            { id: "claims",        icon: "fas fa-file-alt", label: "Claims" },
            { id: "notifications", icon: "fas fa-bell",     label: "Notifications", badge: unread },
            { id: "profile",       icon: "fas fa-user",     label: "Profile" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center py-2 rounded-xl text-xs font-semibold transition-all relative ${
                tab === t.id ? "bg-slate-900 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <i className={`${t.icon} text-base mb-0.5`} />
              {t.label}
              {t.badge > 0 && (
                <span className="absolute top-1.5 right-3 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content panel ─────────────────────────────────── */}
        <main className="flex-1 min-w-0">

          {/* ══ CLAIMS ══════════════════════════════════════════ */}
          {tab === "claims" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
                    My Claims
                    {claims.length > 0 && (
                      <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">{claims.length}</span>
                    )}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">Track your item verification requests</p>
                </div>
                <Link
                  to="/verification"
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 transition-colors text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm"
                >
                  <i className="fas fa-plus" /> New Claim
                </Link>
              </div>

              {/* Filter + sort bar */}
              {!loadingClaims && claims.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  {/* Status filter pills */}
                  {[
                    { key: "all",      label: "All" },
                    { key: "pending",  label: "Pending" },
                    { key: "approved", label: "Approved" },
                    { key: "rejected", label: "Rejected" },
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setClaimFilter(f.key)}
                      className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg border transition-all ${
                        claimFilter === f.key
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white text-slate-600 border-gray-300 hover:border-slate-400 hover:text-slate-800"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}

                  {/* Divider */}
                  <div className="h-5 w-px bg-gray-300 mx-1" />

                  {/* Sort dropdown */}
                  <div className="relative">
                    <select
                      value={claimSort}
                      onChange={e => setClaimSort(e.target.value)}
                      className="appearance-none text-xs font-semibold bg-white border border-gray-300 hover:border-slate-400 text-slate-700 px-3.5 py-1.5 pr-8 rounded-lg cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                    <i className="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none" />
                  </div>
                </div>
              )}

              {loadingClaims ? (
                <div className="flex items-center justify-center py-24">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
                </div>
              ) : claims.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-16 flex flex-col items-center text-center px-6">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <i className="fas fa-inbox text-4xl text-slate-400" />
                  </div>
                  <h3 className="font-bold text-slate-700 text-lg mb-1">No Claims Yet</h3>
                  <p className="text-slate-400 text-sm max-w-xs">You haven't submitted any item claims. Browse found items to start a claim.</p>
                  <Link to="/verification" className="mt-5 inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
                    <i className="fas fa-search" /> Browse Found Items
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {(() => {
                    const filtered = [...claims]
                      .filter(c => claimFilter === "all" || c.status === claimFilter)
                      .sort((a, b) => {
                        const da = new Date(a.submittedAt), db = new Date(b.submittedAt);
                        return claimSort === "newest" ? db - da : da - db;
                      });
                    if (filtered.length === 0) return (
                      <div className="col-span-full py-12 flex flex-col items-center text-center">
                        <i className="fas fa-filter text-3xl text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium text-sm">No {claimFilter} claims found.</p>
                        <button onClick={() => setClaimFilter("all")} className="mt-3 text-xs text-slate-600 underline underline-offset-2 hover:text-slate-900">Clear filter</button>
                      </div>
                    );
                    return filtered.map(claim => {
                    const s = CLAIM_STATUS[claim.status] || CLAIM_STATUS.pending;
                    return (
                      <div key={claim._id} className="bg-white rounded-2xl border-2 border-gray-400 shadow-md hover:shadow-xl hover:border-gray-500 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">

                        {/* Image / thumbnail area */}
                        <div className="relative h-48 bg-slate-200 flex-shrink-0">
                          {claim.itemId?.images?.[0] ? (
                            <img
                              src={claim.itemId.images[0]}
                              alt={claim.itemId?.itemName || "Item"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center ${s.bg}`}>
                              <i className={`${s.icon} ${s.text} text-6xl opacity-40`} />
                            </div>
                          )}
                          {/* Dark gradient overlay for readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                          {/* Status badge overlay */}
                          <span className={`absolute top-3 right-3 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg border-2 ${s.bg} ${s.text} ${s.border}`}>
                            <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                          {/* Top accent bar — thicker */}
                          <div className={`absolute top-0 left-0 right-0 h-1.5 ${s.accent}`} />
                        </div>

                        {/* Card body */}
                        <div className="flex-1 flex flex-col p-4 gap-3">

                          {/* Item name + meta tags */}
                          <div>
                            <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-1">
                              {claim.itemId?.itemName || "Unknown Item"}
                            </h3>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {claim.itemId?.category && (
                                <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                                  <i className="fas fa-tag text-slate-400 text-[10px]" /> {claim.itemId.category}
                                </span>
                              )}
                              {claim.itemId?.location && (
                                <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                                  <i className="fas fa-map-marker-alt text-slate-400 text-[10px]" /> {claim.itemId.location}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                                <i className="fas fa-calendar-alt text-slate-400 text-[10px]" /> {timeAgo(claim.submittedAt)}
                              </span>
                            </div>
                            {claim.verificationDetails?.description && (
                              <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                {claim.verificationDetails.description}
                              </p>
                            )}
                          </div>

                          {/* Verification stages */}
                          <div className="mt-auto bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Verification Progress</p>
                            <div className="flex items-center">
                              {["stage1", "stage2", "stage3"].map((stageKey, i) => {
                                const stage = claim.approvalStages?.[stageKey] || {};
                                const st = STAGE_STATE[stage.status] || STAGE_STATE.pending;
                                return (
                                  <div key={stageKey} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center gap-1">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${st.bg} ${st.ring} ${st.text} flex-shrink-0 shadow-sm`}>
                                        <i className={`${st.icon} text-xs`} />
                                      </div>
                                      <div className="text-center">
                                        <p className="text-[10px] font-semibold text-slate-700">Stage {i + 1}</p>
                                        <p className={`text-[9px] font-medium capitalize ${stage.status === "passed" ? "text-green-600" : stage.status === "failed" ? "text-red-500" : "text-slate-400"}`}>
                                          {stage.status || "Pending"}
                                        </p>
                                      </div>
                                    </div>
                                    {i < 2 && (
                                      <div className={`flex-1 h-0.5 mx-1.5 mb-4 rounded-full ${
                                        stage.status === "passed" ? "bg-green-400" : "bg-gray-200"
                                      }`} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Collection notice for approved claims */}
                          {claim.status === "approved" && (
                            <div className="border border-green-200 rounded-xl overflow-hidden">
                              <div className="flex items-center gap-2 bg-green-600 px-3 py-2">
                                <i className="fas fa-check-circle text-white text-xs" />
                                <p className="text-xs font-semibold text-white tracking-wide">Item Ready for Collection</p>
                              </div>
                              <div className="bg-green-50 px-3 py-2.5 flex flex-col gap-2">
                                <p className="text-xs text-green-800 leading-relaxed">
                                  Visit the <span className="font-semibold">Lost &amp; Found Office</span> with your{" "}
                                  <span className="font-semibold">Student ID</span> and <span className="font-semibold">Collection PIN</span>.
                                </p>
                                {claim.collectionPinExpiry && (
                                  <p className="text-xs text-green-700 flex items-center gap-1 font-medium">
                                    <i className="fas fa-clock" />
                                    PIN valid until:{" "}
                                    <span className="font-semibold">
                                      {new Date(claim.collectionPinExpiry).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                  </p>
                                )}
                                <button
                                  onClick={() => resendPin(claim._id)}
                                  disabled={resendingPin[claim._id]}
                                  className="self-start text-xs text-green-700 hover:text-green-900 font-medium underline underline-offset-2 disabled:opacity-50 transition"
                                >
                                  {resendingPin[claim._id] ? (
                                    <><i className="fas fa-spinner fa-spin mr-1" />Sending…</>
                                  ) : (
                                    <><i className="fas fa-redo mr-1" />Resend PIN</>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Admin notes */}
                          {claim.notes && (
                            <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                              <i className="fas fa-comment-dots text-slate-400 mt-0.5 flex-shrink-0 text-xs" />
                              <p className="text-xs text-slate-700"><span className="font-semibold">Admin note:</span> {claim.notes}</p>
                            </div>
                          )}

                          {/* Delete — rejected claims only */}
                          {claim.status === "rejected" && (
                            confirmDelete === claim._id ? (
                              <div className="border border-red-200 bg-red-50 rounded-xl p-3 flex flex-col gap-2">
                                <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
                                  <i className="fas fa-exclamation-circle" /> Remove this claim?
                                </p>
                                <p className="text-xs text-red-600 leading-relaxed">This action cannot be undone.</p>
                                <div className="flex gap-2 mt-1">
                                  <button
                                    onClick={() => deleteClaim(claim._id)}
                                    disabled={deletingClaim[claim._id]}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
                                  >
                                    {deletingClaim[claim._id] ? (
                                      <><i className="fas fa-spinner fa-spin" /> Removing…</>
                                    ) : (
                                      <><i className="fas fa-trash-alt" /> Yes, Remove</>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="flex-1 bg-white hover:bg-gray-100 border border-gray-300 text-gray-600 text-xs font-semibold py-2 rounded-lg transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDelete(claim._id)}
                                disabled={deletingClaim[claim._id]}
                                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
                              >
                                <i className="fas fa-trash-alt" /> Remove Claim
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                    });
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ══ NOTIFICATIONS ════════════════════════════════════ */}
          {tab === "notifications" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Notifications</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {unread > 0 ? `You have ${unread} unread notification${unread > 1 ? "s" : ""}` : "You're all caught up"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors px-4 py-2 rounded-xl"
                    >
                      <i className="fas fa-check-double" /> Mark all read
                    </button>
                  )}
                  <Link
                    to="/notification-settings"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors px-4 py-2 rounded-xl"
                  >
                    <i className="fas fa-cog" /> Settings
                  </Link>
                </div>
              </div>

              {loadingNotifs ? (
                <div className="flex items-center justify-center py-24">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-16 flex flex-col items-center text-center px-6">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <i className="fas fa-bell-slash text-4xl text-slate-400" />
                  </div>
                  <h3 className="font-bold text-slate-700 text-lg mb-1">No Notifications</h3>
                  <p className="text-slate-400 text-sm max-w-xs">Enable notifications to stay updated on new campus notices and item alerts.</p>
                  <Link to="/notification-settings" className="mt-5 inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
                    <i className="fas fa-cog" /> Set Up Notifications
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                  {notifications.map((n) => {
                    const p = NOTIF_PRIORITY[n.priority] || NOTIF_PRIORITY.low;
                    return (
                      <div
                        key={n._id}
                        onClick={() => !n.isRead && markRead(n._id)}
                        className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors ${
                          n.isRead ? "hover:bg-slate-50" : "bg-blue-50/60 hover:bg-blue-50"
                        }`}
                      >
                        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${n.isRead ? "bg-gray-200" : p.bar}`} />
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0 border border-gray-200">
                          <i className={`${p.icon} text-sm`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm text-slate-800 ${!n.isRead ? "font-semibold" : ""}`}>{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1.5">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.isRead && (
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-800 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ PROFILE ══════════════════════════════════════════ */}
          {tab === "profile" && (
            <div>
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-800">Profile</h2>
                <p className="text-sm text-slate-500 mt-0.5">Your account information</p>
              </div>

              <div className="grid gap-5">
                {/* Profile card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Banner */}
                  <div className="h-16 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900" />
                  <div className="px-6 pb-6">
                    {/* Avatar overlapping banner */}
                    <div className="-mt-8 mb-4 flex items-end justify-between">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-blue-900 flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white">
                        {initials}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                          <i className="fas fa-user-graduate mr-1" />{user?.role || "Student"}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${user?.status === "Inactive" ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
                          <i className={`fas fa-circle mr-1 text-[8px] ${user?.status === "Inactive" ? "text-gray-400" : "text-green-500"}`} />
                          {user?.status || "Active"}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">{user?.name || "—"}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{email}</p>

                    <div className="grid sm:grid-cols-2 gap-3 mt-5">
                      {[
                        { icon: "fas fa-user",       label: "Full Name",  value: user?.name },
                        { icon: "fas fa-envelope",   label: "Email",      value: user?.email },
                        { icon: "fas fa-shield-alt", label: "Role",       value: user?.role || "User" },
                        { icon: "fas fa-toggle-on",  label: "Status",     value: user?.status || "Active" },
                      ].map(field => (
                        <div key={field.label} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                          <p className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5 font-semibold uppercase tracking-wide">
                            <i className={`${field.icon} text-slate-300`} /> {field.label}
                          </p>
                          <p className="text-sm font-semibold text-slate-700">{field.value || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Account activity */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <StatCard icon="fas fa-file-alt"     label="Total Claims"   value={claims.length}        color="text-blue-700"   bg="bg-blue-100" />
                  <StatCard icon="fas fa-check-circle" label="Approved"       value={approved}             color="text-green-700"  bg="bg-green-100" />
                  <StatCard icon="fas fa-bell"         label="Notifications"  value={notifications.length} color="text-amber-700"  bg="bg-amber-100" />
                </div>

                {/* Quick actions */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h4 className="font-bold text-slate-700 mb-4 text-xs uppercase tracking-widest">Quick Actions</h4>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {[
                      { to: "/report-item",           icon: "fas fa-plus-circle", label: "Report a Lost or Found Item",     color: "text-blue-700",   bg: "bg-blue-50 hover:bg-blue-100",   border: "border-blue-100" },
                      { to: "/verification",          icon: "fas fa-search",      label: "Search & Claim Found Items",      color: "text-green-700",  bg: "bg-green-50 hover:bg-green-100", border: "border-green-100" },
                      { to: "/notification-settings", icon: "fas fa-bell",        label: "Manage Notification Preferences", color: "text-amber-700",  bg: "bg-amber-50 hover:bg-amber-100", border: "border-amber-100" },
                      { to: "/notice",                icon: "fas fa-bullhorn",    label: "View Campus Notices",             color: "text-purple-700", bg: "bg-purple-50 hover:bg-purple-100", border: "border-purple-100" },
                    ].map(a => (
                      <Link
                        key={a.to}
                        to={a.to}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${a.bg} ${a.border}`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0`}>
                          <i className={`${a.icon} ${a.color} text-sm`} />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{a.label}</span>
                        <i className="fas fa-chevron-right text-slate-300 ml-auto text-xs" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Sign out */}
                <button
                  onClick={() => { logout(); navigate("/login"); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors text-sm font-semibold"
                >
                  <i className="fas fa-sign-out-alt" /> Sign Out of Account
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      <Footer />
    </div>
  );
}
