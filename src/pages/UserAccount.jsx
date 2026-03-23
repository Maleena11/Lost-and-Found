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
  pending:   { bg: "bg-amber-100",   ring: "ring-amber-300",  text: "text-amber-800",  dot: "bg-amber-400",  icon: "fas fa-hourglass-half", label: "Pending Review" },
  approved:  { bg: "bg-green-100",   ring: "ring-green-300",  text: "text-green-800",  dot: "bg-green-500",  icon: "fas fa-check-circle",   label: "Approved" },
  rejected:  { bg: "bg-red-100",     ring: "ring-red-300",    text: "text-red-800",    dot: "bg-red-500",    icon: "fas fa-times-circle",   label: "Rejected" },
  processed: { bg: "bg-blue-100",    ring: "ring-blue-300",   text: "text-blue-800",   dot: "bg-blue-500",   icon: "fas fa-clipboard-check",label: "Processed" },
};

const NOTIF_PRIORITY = {
  high:   { bar: "bg-red-500",    icon: "fas fa-exclamation-circle text-red-500" },
  medium: { bar: "bg-amber-400",  icon: "fas fa-info-circle text-amber-500" },
  low:    { bar: "bg-blue-400",   icon: "fas fa-bell text-blue-500" },
};

const STAGE_STATE = {
  passed:  { ring: "ring-2 ring-green-400", bg: "bg-green-500", text: "text-white", icon: "fas fa-check" },
  failed:  { ring: "ring-2 ring-red-400",   bg: "bg-red-500",   text: "text-white", icon: "fas fa-times" },
  pending: { ring: "ring-2 ring-gray-200",  bg: "bg-gray-200",  text: "text-gray-400", icon: "fas fa-ellipsis-h" },
};

/* ── sub-components ──────────────────────────────────────────── */
function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4`}>
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-blue-600 text-white shadow-md shadow-blue-200"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <i className={`${icon} w-4`} />
      <span className="flex-1 text-left">{label}</span>
      {badge != null && badge > 0 && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${active ? "bg-white text-blue-700" : "bg-red-500 text-white"}`}>
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

  const unread      = notifications.filter(n => !n.isRead).length;
  const pending     = claims.filter(c => c.status === "pending").length;
  const approved    = claims.filter(c => c.status === "approved").length;
  const rejected    = claims.filter(c => c.status === "rejected").length;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      {/* ── Hero banner ───────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-white bg-opacity-20 border-2 border-white border-opacity-40 flex items-center justify-center text-3xl font-bold shadow-lg flex-shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1">
            <p className="text-blue-200 text-sm font-medium mb-1">
              <i className="fas fa-graduation-cap mr-1.5" />
              Student Account
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold">{user?.name || "My Account"}</h1>
            <p className="text-blue-200 text-sm mt-1">
              <i className="fas fa-envelope mr-1.5" />{email}
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex gap-3 flex-wrap">
            <Link
              to="/report-item"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 transition text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow"
            >
              <i className="fas fa-plus" /> Report Item
            </Link>
            <Link
              to="/verification"
              className="inline-flex items-center gap-2 bg-white bg-opacity-15 hover:bg-opacity-25 transition text-white text-sm font-semibold px-5 py-2.5 rounded-xl border border-white border-opacity-30"
            >
              <i className="fas fa-search" /> Browse Found Items
            </Link>
          </div>
        </div>

        {/* Stat strip */}
        <div className="max-w-7xl mx-auto px-6 pb-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white bg-opacity-10 rounded-t-2xl overflow-hidden">
            {[
              { label: "Total Claims",   value: claims.length, icon: "fas fa-file-alt" },
              { label: "Pending",        value: pending,       icon: "fas fa-hourglass-half" },
              { label: "Approved",       value: approved,      icon: "fas fa-check-circle" },
              { label: "Rejected",       value: rejected,      icon: "fas fa-times-circle" },
            ].map(s => (
              <div key={s.label} className="bg-white bg-opacity-10 px-6 py-4 text-center">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-blue-200 text-xs mt-0.5"><i className={`${s.icon} mr-1`} />{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto w-full px-6 py-8 flex gap-7 items-start">

        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 flex-shrink-0 gap-1.5 bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sticky top-6">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold px-4 pt-2 pb-1">Navigation</p>
          <SidebarLink icon="fas fa-file-alt"     label="My Claims"      active={tab === "claims"}        onClick={() => setTab("claims")} />
          <SidebarLink icon="fas fa-bell"         label="Notifications"  active={tab === "notifications"} onClick={() => setTab("notifications")} badge={unread} />
          <SidebarLink icon="fas fa-user"         label="Profile"        active={tab === "profile"}       onClick={() => setTab("profile")} />

          <div className="border-t border-gray-100 mt-2 pt-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold px-4 pb-1">Quick Links</p>
            <Link to="/notification-settings" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition">
              <i className="fas fa-cog w-4" /> Notification Settings
            </Link>
            <Link to="/notice" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition">
              <i className="fas fa-bullhorn w-4" /> View Notices
            </Link>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition"
            >
              <i className="fas fa-sign-out-alt w-4" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden flex w-full mb-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 gap-1">
          {[
            { id: "claims",        icon: "fas fa-file-alt", label: "Claims" },
            { id: "notifications", icon: "fas fa-bell",     label: "Notifications", badge: unread },
            { id: "profile",       icon: "fas fa-user",     label: "Profile" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center py-2 rounded-xl text-xs font-medium transition relative ${
                tab === t.id ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
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

        {/* Content panel */}
        <main className="flex-1 min-w-0">

          {/* ══ CLAIMS ══════════════════════════════════════════ */}
          {tab === "claims" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">My Claims</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Track your item verification requests</p>
                </div>
                <Link
                  to="/verification"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm"
                >
                  <i className="fas fa-plus" /> New Claim
                </Link>
              </div>

              {loadingClaims ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : claims.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center text-center px-6">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-inbox text-4xl text-blue-300" />
                  </div>
                  <h3 className="font-semibold text-gray-700 text-lg mb-1">No Claims Yet</h3>
                  <p className="text-gray-400 text-sm max-w-xs">You haven't submitted any item claims. Browse found items to start a claim.</p>
                  <Link to="/verification" className="mt-5 inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm">
                    <i className="fas fa-search" /> Browse Found Items
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {claims.map(claim => {
                    const s = CLAIM_STATUS[claim.status] || CLAIM_STATUS.pending;
                    return (
                      <div key={claim._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        {/* colour top bar by status */}
                        <div className={`h-1.5 ${claim.status === "approved" ? "bg-green-500" : claim.status === "rejected" ? "bg-red-500" : claim.status === "processed" ? "bg-blue-500" : "bg-amber-400"}`} />

                        <div className="p-5">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                              <i className={`${s.icon} ${s.text} text-lg`} />
                            </div>

                            {/* Main content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <h3 className="font-semibold text-gray-800 text-base">
                                  {claim.itemId?.itemName || "Unknown Item"}
                                </h3>
                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ring-1 ${s.bg} ${s.text} ${s.ring}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                  {s.label}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                                {claim.itemId?.category && (
                                  <span className="flex items-center gap-1">
                                    <i className="fas fa-tag" /> {claim.itemId.category}
                                  </span>
                                )}
                                {claim.itemId?.location && (
                                  <span className="flex items-center gap-1">
                                    <i className="fas fa-map-marker-alt" /> {claim.itemId.location}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <i className="fas fa-calendar-alt" /> Submitted {timeAgo(claim.submittedAt)}
                                </span>
                              </div>

                              <p className="mt-2.5 text-sm text-gray-600 line-clamp-2">
                                {claim.verificationDetails?.description}
                              </p>
                            </div>
                          </div>

                          {/* Verification stages */}
                          <div className="mt-4 pt-4 border-t border-gray-50">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Verification Progress</p>
                            <div className="flex items-center gap-3">
                              {["stage1", "stage2", "stage3"].map((s, i) => {
                                const stage = claim.approvalStages?.[s] || {};
                                const st = STAGE_STATE[stage.status] || STAGE_STATE.pending;
                                return (
                                  <div key={s} className="flex items-center gap-2 flex-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${st.bg} ${st.ring} ${st.text} flex-shrink-0`}>
                                      <i className={`${st.icon} text-xs`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-700">Stage {i + 1}</p>
                                      <p className="text-xs text-gray-400 capitalize">{stage.status || "pending"}</p>
                                    </div>
                                    {i < 2 && <div className="w-6 h-px bg-gray-200 hidden sm:block" />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Admin notes */}
                          {claim.notes && (
                            <div className="mt-3 flex items-start gap-2.5 bg-blue-50 rounded-xl p-3">
                              <i className="fas fa-comment-dots text-blue-400 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-blue-700"><span className="font-semibold">Admin note:</span> {claim.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ NOTIFICATIONS ════════════════════════════════════ */}
          {tab === "notifications" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {unread > 0 ? `You have ${unread} unread notification${unread > 1 ? "s" : ""}` : "You're all caught up"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition px-4 py-2 rounded-xl"
                    >
                      <i className="fas fa-check-double" /> Mark all read
                    </button>
                  )}
                  <Link
                    to="/notification-settings"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition px-4 py-2 rounded-xl"
                  >
                    <i className="fas fa-cog" /> Settings
                  </Link>
                </div>
              </div>

              {loadingNotifs ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center text-center px-6">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-bell-slash text-4xl text-blue-300" />
                  </div>
                  <h3 className="font-semibold text-gray-700 text-lg mb-1">No Notifications</h3>
                  <p className="text-gray-400 text-sm max-w-xs">Enable notifications to stay updated on new campus notices and item alerts.</p>
                  <Link to="/notification-settings" className="mt-5 inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm">
                    <i className="fas fa-cog" /> Set Up Notifications
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {notifications.map((n, idx) => {
                    const p = NOTIF_PRIORITY[n.priority] || NOTIF_PRIORITY.low;
                    return (
                      <div
                        key={n._id}
                        onClick={() => !n.isRead && markRead(n._id)}
                        className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${
                          n.isRead ? "hover:bg-gray-50" : "bg-blue-50 hover:bg-blue-100"
                        }`}
                      >
                        {/* Priority colour bar */}
                        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${n.isRead ? "bg-gray-200" : p.bar}`} />

                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0 border border-gray-100`}>
                          <i className={`${p.icon} text-sm`} />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm text-gray-800 ${!n.isRead ? "font-semibold" : ""}`}>{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1.5">{timeAgo(n.createdAt)}</p>
                        </div>

                        {/* Unread dot */}
                        {!n.isRead && (
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
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
                <h2 className="text-xl font-bold text-gray-800">Profile</h2>
                <p className="text-sm text-gray-500 mt-0.5">Your account information</p>
              </div>

              <div className="grid gap-5">
                {/* Profile card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {initials}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{user?.name || "—"}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold">
                          <i className="fas fa-user-graduate mr-1" />{user?.role || "Student"}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${user?.status === "Inactive" ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
                          <i className={`fas fa-circle mr-1 text-[8px] ${user?.status === "Inactive" ? "text-gray-400" : "text-green-500"}`} />
                          {user?.status || "Active"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { icon: "fas fa-user",       label: "Full Name",  value: user?.name },
                      { icon: "fas fa-envelope",   label: "Email",      value: user?.email },
                      { icon: "fas fa-shield-alt", label: "Role",       value: user?.role || "User" },
                      { icon: "fas fa-toggle-on",  label: "Status",     value: user?.status || "Active" },
                    ].map(field => (
                      <div key={field.label} className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1.5">
                          <i className={`${field.icon} w-3`} /> {field.label}
                        </p>
                        <p className="text-sm font-medium text-gray-800">{field.value || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account activity */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <StatCard icon="fas fa-file-alt"     label="Total Claims"   value={claims.length} color="text-blue-600"   bg="bg-blue-100" />
                  <StatCard icon="fas fa-check-circle" label="Approved"       value={approved}      color="text-green-600"  bg="bg-green-100" />
                  <StatCard icon="fas fa-bell"         label="Notifications"  value={notifications.length} color="text-amber-600"  bg="bg-amber-100" />
                </div>

                {/* Quick actions */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h4 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Quick Actions</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { to: "/report-item",           icon: "fas fa-plus-circle",     label: "Report a Lost or Found Item", color: "text-blue-600",  bg: "bg-blue-50 hover:bg-blue-100" },
                      { to: "/verification",          icon: "fas fa-search",          label: "Search & Claim Found Items",  color: "text-green-600", bg: "bg-green-50 hover:bg-green-100" },
                      { to: "/notification-settings", icon: "fas fa-bell",            label: "Manage Notification Preferences", color: "text-amber-600", bg: "bg-amber-50 hover:bg-amber-100" },
                      { to: "/notice",                icon: "fas fa-bullhorn",        label: "View Campus Notices",         color: "text-purple-600", bg: "bg-purple-50 hover:bg-purple-100" },
                    ].map(a => (
                      <Link
                        key={a.to}
                        to={a.to}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${a.bg}`}
                      >
                        <i className={`${a.icon} ${a.color} text-lg w-5`} />
                        <span className="text-sm font-medium text-gray-700">{a.label}</span>
                        <i className="fas fa-chevron-right text-gray-300 ml-auto text-xs" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Sign out */}
                <button
                  onClick={() => { logout(); navigate("/login"); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition text-sm font-semibold"
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
