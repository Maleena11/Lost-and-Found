import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { useAuth } from "../../../shared/utils/AuthContext";

const API = "http://localhost:3001/api/lost-found";

const LOCATIONS = [
  "Library", "A101 Lecture Hall", "A102 Lecture Hall", "A403 Lecture Hall",
  "A404 Lecture Hall", "Study Area", "Canteen", "Game Room",
  "Ground", "Auditorium", "Cafe", "Parking", "Other",
];

const CATEGORIES = {
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

// ── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return "just now";
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  return `${days}d ago`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatSightingDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatDateTimeForInput(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function isStale(dateStr) {
  return Date.now() - new Date(dateStr).getTime() > 48 * 3600000;
}

function isHot(dateStr) {
  return Date.now() - new Date(dateStr).getTime() < 24 * 3600000;
}

function activeSightings(sightings = []) {
  return sightings.filter(s => !s.dismissed);
}

function latestSighting(sightings = []) {
  const active = activeSightings(sightings);
  if (!active.length) return null;
  return active.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b);
}

function visibleSightingsForItem(item, authUser) {
  const sightings = item?.sightings || [];
  if (!authUser) return [];

  const ownerEmail = normalizeEmail(item?.contactInfo?.email);
  const viewerEmail = normalizeEmail(authUser.email);
  const ownerById = item?.userId === String(authUser.id);
  const ownerByEmail = ownerEmail && viewerEmail && ownerEmail === viewerEmail;

  if (ownerById || ownerByEmail) return sightings;

  return sightings.filter((sighting) => {
    const reporterEmail = normalizeEmail(sighting.reporterEmail);
    return reporterEmail && reporterEmail === viewerEmail;
  });
}

// ── Sighting Trail Timeline ───────────────────────────────────────────────────
function SightingTrail({
  sightings,
  isOwner,
  viewerEmail,
  onReact,
  onEditSighting,
  onDeleteSighting,
  reactionLoadingId,
  actionLoadingId,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState({ location: "", dateTime: "", note: "" });
  const [actionError, setActionError] = useState("");
  const active = (isOwner ? activeSightings(sightings) : sightings).sort(
    (a, b) => new Date(a.dateTime) - new Date(b.dateTime)
  );

  if (!active.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-inner">
          <i className="fas fa-binoculars text-slate-400 text-lg"></i>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-500">No sightings yet</p>
          <p className="text-xs text-slate-400 mt-0.5">Be the first to help by reporting where you saw this item</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0 pt-1">
      {active.map((s, i) => {
        const stale  = isStale(s.createdAt);
        const hot    = isHot(s.createdAt);
        const isLast = i === active.length - 1;
        const dayAge = Math.floor((Date.now() - new Date(s.createdAt).getTime()) / 86400000);
        const isReporter = normalizeEmail(s.reporterEmail) === normalizeEmail(viewerEmail);
        const isEditing = editingId === s._id;
        const isBusy = actionLoadingId === s._id;
        const isLocked = s.helpful;

        const dotColor = s.helpful
          ? "bg-emerald-500 ring-emerald-200"
          : s.dismissed
          ? "bg-rose-300 ring-rose-100"
          : stale
          ? "bg-slate-300 ring-slate-100"
          : hot
          ? "bg-orange-500 ring-orange-200"
          : "bg-blue-500 ring-blue-200";

        return (
          <div key={s._id} className="flex gap-3 group">
            {/* Connector column */}
            <div className="flex flex-col items-center flex-shrink-0 pt-3">
              <div className={`w-3 h-3 rounded-full ring-2 flex-shrink-0 transition-all ${dotColor} ${hot && !s.helpful && !s.dismissed ? "animate-pulse" : ""}`} />
              {!isLast && (
                <div className="w-px flex-1 min-h-[20px] mt-1"
                  style={{ background: stale ? "#e2e8f0" : "linear-gradient(to bottom, #bfdbfe, #e0e7ff)" }} />
              )}
            </div>

            {/* Card */}
            <div className={`flex-1 mb-3 rounded-xl border transition-all ${
              s.helpful
                ? "bg-emerald-50 border-emerald-200 shadow-sm"
                : s.dismissed
                ? "bg-rose-50 border-rose-200 shadow-sm"
                : stale
                ? "bg-slate-50 border-slate-200 opacity-60"
                : hot
                ? "bg-orange-50 border-orange-200 shadow-sm"
                : "bg-white border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md"
            }`}>
              {/* Card header */}
              <div className="flex items-start justify-between gap-2 px-3 pt-3 pb-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  {/* Location pill */}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                    s.helpful ? "bg-emerald-100 text-emerald-700" :
                    s.dismissed ? "bg-rose-100 text-rose-700" :
                    hot        ? "bg-orange-100 text-orange-700"  :
                    stale      ? "bg-slate-100 text-slate-500"    :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    <i className="fas fa-map-marker-alt text-[10px]"></i>
                    {s.location}
                  </span>

                  {/* Status badges */}
                  {isLast && !stale && !s.dismissed && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      hot ? "bg-orange-500 text-white" : "bg-blue-600 text-white"
                    }`}>
                      {hot && <span className="w-1 h-1 rounded-full bg-white animate-pulse inline-block"></span>}
                      {hot ? "Latest Active" : "Most Recent"}
                    </span>
                  )}
                  {s.helpful && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                      <i className="fas fa-check text-[8px]"></i> Confirmed Helpful
                    </span>
                  )}
                  {s.dismissed && !isOwner && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">
                      <i className="fas fa-eye-slash text-[8px]"></i> Dismissed
                    </span>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                  <i className="fas fa-clock mr-1"></i>
                  {formatSightingDate(s.dateTime)}
                </span>
              </div>

              {/* Note */}
              {isEditing ? (
                <div className="mx-3 mb-2">
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Location
                      </label>
                      <select
                        value={editingForm.location}
                        onChange={(e) => setEditingForm((prev) => ({ ...prev, location: e.target.value }))}
                        className="w-full rounded-lg border border-blue-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a location...</option>
                        {LOCATIONS.map((location) => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Date and Time
                      </label>
                      <input
                        type="datetime-local"
                        value={editingForm.dateTime}
                        onChange={(e) => setEditingForm((prev) => ({ ...prev, dateTime: e.target.value }))}
                        className="w-full rounded-lg border border-blue-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Message
                      </label>
                      <textarea
                        value={editingForm.note}
                        onChange={(e) => setEditingForm((prev) => ({ ...prev, note: e.target.value }))}
                        rows={3}
                        maxLength={300}
                        className="w-full rounded-lg border border-blue-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Update your sighting message"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">{editingForm.note.length}/300</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingForm({ location: "", dateTime: "", note: "" });
                          setActionError("");
                        }}
                        disabled={isBusy}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setActionError("");
                            await onEditSighting(s._id, editingForm);
                            setEditingId(null);
                            setEditingForm({ location: "", dateTime: "", note: "" });
                          } catch (err) {
                            setActionError(err?.message || "Failed to update sighting.");
                          }
                        }}
                        disabled={isBusy}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isBusy
                          ? <><i className="fas fa-spinner fa-spin text-[10px]"></i> Saving...</>
                          : <><i className="fas fa-save text-[10px]"></i> Save</>}
                      </button>
                    </div>
                  </div>
                </div>
              ) : s.note && (
                <div className={`mx-3 mb-2 px-3 py-2 rounded-lg text-xs leading-relaxed italic border-l-2 ${
                  s.helpful ? "bg-emerald-50 border-emerald-300 text-emerald-800" :
                  s.dismissed ? "bg-rose-50 border-rose-200 text-rose-700" :
                  stale      ? "bg-slate-50 border-slate-300 text-slate-500"      :
                  hot        ? "bg-orange-50 border-orange-300 text-orange-800"   :
                  "bg-slate-50 border-blue-300 text-slate-600"
                }`}>
                  "{s.note}"
                </div>
              )}

              {actionError && (isEditing || isReporter) && (
                <p className="mx-3 mb-2 text-[11px] text-rose-600">{actionError}</p>
              )}

              {/* Stale warning */}
              {stale && (
                <div className="mx-3 mb-2 flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                  <i className="fas fa-exclamation-triangle text-amber-500"></i>
                  <span>{dayAge}d old - this sighting may no longer be current</span>
                </div>
              )}

              {isReporter && (
                <div className="flex gap-2 px-3 pb-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(s._id);
                      setEditingForm({
                        location: s.location || "",
                        dateTime: formatDateTimeForInput(s.dateTime),
                        note: s.note || "",
                      });
                      setActionError("");
                    }}
                    disabled={isBusy || isLocked}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <i className="fas fa-pen text-[10px]"></i> Edit sighting
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm("Delete this sighting?")) return;
                      try {
                        setActionError("");
                        await onDeleteSighting(s._id);
                        if (editingId === s._id) {
                          setEditingId(null);
                          setEditingForm({ location: "", dateTime: "", note: "" });
                        }
                      } catch (err) {
                        setActionError(err?.message || "Failed to delete sighting.");
                      }
                    }}
                    disabled={isBusy || isLocked}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-medium bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isBusy
                      ? <><i className="fas fa-spinner fa-spin text-[10px]"></i> Deleting...</>
                      : <><i className="fas fa-trash text-[10px]"></i> Delete</>}
                  </button>
                </div>
              )}

              {isReporter && isLocked && !isEditing && (
                <p className="px-3 pb-3 text-[11px] text-emerald-700">
                  This sighting was marked helpful, so it can no longer be edited or deleted.
                </p>
              )}

              {/* Owner reaction buttons */}
              {isOwner && !s.helpful && !s.dismissed && (
                <div className="flex gap-2 px-3 pb-3 pt-1">
                  <button
                    onClick={() => onReact(s._id, "helpful")}
                    disabled={reactionLoadingId === s._id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {reactionLoadingId === s._id
                      ? <><i className="fas fa-spinner fa-spin text-[10px]"></i> Saving…</>
                      : <><i className="fas fa-check text-[10px]"></i> Mark as Helpful</>}
                  </button>
                  <button
                    onClick={() => onReact(s._id, "dismissed")}
                    disabled={reactionLoadingId === s._id}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <i className="fas fa-times text-[10px]"></i> Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── "I Saw This" inline form ──────────────────────────────────────────────────
function SightingForm({ itemId, reporterEmail, onSuccess, onCancel }) {
  const [loc, setLoc]       = useState("");
  const [dt, setDt]         = useState(() => new Date().toISOString().slice(0, 16));
  const [note, setNote]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loc) { setError("Please select a location."); return; }
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`${API}/${itemId}/sightings`, {
        location: loc, dateTime: dt, note, reporterEmail,
      });
      onSuccess(data.sightings);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit sighting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-2.5">
        <div>
          <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
            Where did you see it? *
          </label>
          <select
            value={loc}
            onChange={e => setLoc(e.target.value)}
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a location…</option>
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
            When?
          </label>
          <input
            type="datetime-local"
            value={dt}
            onChange={e => setDt(e.target.value)}
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
            Any extra detail? (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. left on a chair near the entrance"
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <i className="fas fa-exclamation-circle"></i> {error}
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {loading
              ? <><i className="fas fa-spinner fa-spin"></i> Submitting…</>
              : <><i className="fas fa-paper-plane"></i> Submit Sighting</>}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Notification Bell ─────────────────────────────────────────────────────────
function NotificationBell({ email }) {
  const [notifs, setNotifs]   = useState([]);
  const [open, setOpen]       = useState(false);
  const ref                   = useRef(null);

  useEffect(() => {
    if (!email) return;
    
    // Initial fetch
    axios.get(`${API}/sighting-notifications/${email}`)
      .then(r => setNotifs(r.data.data))
      .catch(() => {});

    // Setup Socket connection
    const socket = io("http://localhost:3001");
    
    socket.emit("join_notifications", email);

    socket.on("new_sighting_notification", (newNotif) => {
      // Prepend the new notification to the list instantly
      setNotifs((prev) => [newNotif, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [email]);

  // close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifs.filter(n => !n.isRead).length;

  const markRead = async (id) => {
    try {
      await axios.patch(`${API}/sighting-notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {
      // Ignore notification read failures and leave the item unread.
    }
  };

  if (!email) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
      >
        <i className="fas fa-bell text-white text-sm"></i>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <i className="fas fa-eye text-blue-500"></i> Sighting Alerts
            </p>
            {unread > 0 && (
              <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                {unread} new
              </span>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {notifs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No sighting alerts yet.</p>
            ) : notifs.map(n => (
              <div
                key={n._id}
                onClick={() => markRead(n._id)}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-blue-50" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.isRead ? "bg-gray-300" : "bg-blue-500"}`} />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      New sighting on your <span className="text-blue-600">{n.itemName}</span>
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Spotted near {n.sightingLocation}
                      {n.message && ` · "${n.message}"`}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ItemBoard() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [activeTab, setActiveTab]       = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // sighting state
  const [sightingModalItem, setSightingModalItem] = useState(null); // item whose sighting form is open
  const [sightingLoadingId, setSightingLoadingId] = useState(null);
  const [sightingActionLoadingId, setSightingActionLoadingId] = useState(null);
  const authUserEmail = authUser?.email || null;

  // password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction]         = useState(null);
  const [passwordInput, setPasswordInput]         = useState("");
  const [passwordError, setPasswordError]         = useState("");
  const [passwordLoading, setPasswordLoading]     = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}?lean=true`);
      setItems(response.data.data);
      setError(null);
    } catch {
      setError("Failed to load items. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const openItemDetails = async (item) => {
    setSelectedItem(item);
    setActiveImageIndex(0);
    setSightingModalItem(null);
    setShowModal(true);
    try {
      const response = await axios.get(`${API}/${item._id}`);
      setSelectedItem(response.data.data);
    } catch {
      // Keep the modal open with the existing item preview if refresh fails.
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setSightingModalItem(null);
  };

  const handleDeleteItem = async (itemId) => {
    setDeleteLoading(true);
    try {
      await axios.delete(`${API}/${itemId}`, { data: { userId: authUser?.id } });
      setItems(items.filter(i => i._id !== itemId));
      closeModal();
    } catch (err) {
      alert("Failed to delete item. " + (err.response?.data?.error || ""));
    } finally {
      setDeleteLoading(false);
    }
  };

  const openPasswordModal = (action) => {
    setPendingAction(action);
    setPasswordInput("");
    setPasswordError("");
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPendingAction(null);
    setPasswordInput("");
    setPasswordError("");
  };

  const handlePasswordConfirm = async () => {
    if (!passwordInput) { setPasswordError("Please enter your password."); return; }
    if (!authUser?.email) { setPasswordError("Could not identify your account. Please log in again."); return; }
    if (!selectedItem || !authUser || selectedItem.userId !== authUser.id) {
      setPasswordError("You can only edit or delete items that you reported.");
      return;
    }
    setPasswordLoading(true);
    setPasswordError("");
    try {
      await axios.post("http://localhost:3001/api/users/login", {
        email: authUser.email, password: passwordInput,
      });
      closePasswordModal();
      if (pendingAction === "edit") navigate(`/edit-item/${selectedItem._id}`);
      else if (pendingAction === "delete") handleDeleteItem(selectedItem._id);
    } catch (err) {
      setPasswordError(err.response?.data?.error || "Incorrect password. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Called after a sighting is successfully submitted
  const handleSightingSuccess = (updatedSightings, itemId) => {
    setSightingModalItem(null);
    setSelectedItem(prev => prev ? { ...prev, sightings: updatedSightings } : prev);
    // also patch the card-level list so the badge updates
    setItems(prev => prev.map(i =>
      i._id === itemId ? { ...i, sightings: updatedSightings } : i
    ));
  };

  // Owner reacts to a sighting (helpful / dismissed)
  const handleReact = async (sightingId, reaction) => {
    if (!authUser) return;
    setSightingLoadingId(sightingId);
    try {
      const { data } = await axios.patch(
        `${API}/${selectedItem._id}/sightings/${sightingId}`,
        { userId: authUser?.id, userEmail: authUser?.email, reaction }
      );
      setSelectedItem(prev => ({ ...prev, sightings: data.sightings }));
      setItems(prev => prev.map(i =>
        i._id === selectedItem._id ? { ...i, sightings: data.sightings } : i
      ));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save reaction. Please try again.");
    }
    setSightingLoadingId(null);
  };

  const syncSightingsForItem = (itemId, updatedSightings) => {
    setSelectedItem(prev => prev && prev._id === itemId ? { ...prev, sightings: updatedSightings } : prev);
    setItems(prev => prev.map(i =>
      i._id === itemId ? { ...i, sightings: updatedSightings } : i
    ));
  };

  const handleEditSighting = async (sightingId, formData) => {
    if (!selectedItem || !authUserEmail) return;
    setSightingActionLoadingId(sightingId);
    try {
      if (!formData.location) {
        throw new Error("Please select a location.");
      }
      if (!formData.dateTime) {
        throw new Error("Please choose the date and time.");
      }
      const { data } = await axios.put(
        `${API}/${selectedItem._id}/sightings/${sightingId}`,
        {
          reporterEmail: authUserEmail,
          location: formData.location,
          dateTime: formData.dateTime,
          note: formData.note,
        }
      );
      syncSightingsForItem(selectedItem._id, data.sightings);
    } catch (err) {
      throw new Error(err.response?.data?.error || "Failed to update sighting.");
    } finally {
      setSightingActionLoadingId(null);
    }
  };

  const handleDeleteSighting = async (sightingId) => {
    if (!selectedItem || !authUserEmail) return;
    setSightingActionLoadingId(sightingId);
    try {
      const { data } = await axios.delete(
        `${API}/${selectedItem._id}/sightings/${sightingId}`,
        { data: { reporterEmail: authUserEmail } }
      );
      syncSightingsForItem(selectedItem._id, data.sightings);
    } catch (err) {
      throw new Error(err.response?.data?.error || "Failed to delete sighting.");
    } finally {
      setSightingActionLoadingId(null);
    }
  };

  const filteredItems = items
    .filter(item => {
      const typeMatch     = activeTab === "all" || item.itemType === activeTab;
      const categoryMatch = selectedCategory === "all" || item.category === selectedCategory;
      return typeMatch && categoryMatch;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const userOwnsItem = (item) => {
    if (!authUser) return false;
    if (item.userId === String(authUser.id)) return true;
    if (item.contactInfo?.email && authUser.email &&
        item.contactInfo.email.toLowerCase() === authUser.email.toLowerCase()) return true;
    return false;
  };

  const getItemImage = (item) => {
    if (item.images && item.images.length > 0) return item.images[0];
    if (item.thumbnail) return item.thumbnail;
    return null;
  };

  const tabs = [
    { key: "all",   label: "All Items",   icon: "fa-th-large"    },
    { key: "lost",  label: "Lost Items",  icon: "fa-search-minus" },
    { key: "found", label: "Found Items", icon: "fa-hand-holding" },
  ];

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50">
      <Header />

      {/* Page Banner */}
      <div className="relative overflow-hidden text-white" style={{ background: "linear-gradient(135deg, #0f1f4d 0%, #162660 40%, #1a1050 100%)" }}>
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #34d399, #60a5fa, #a78bfa, #f472b6, #34d399)", backgroundSize: "200% 100%", animation: "shimmer 4s linear infinite" }} />
        <style>{`@keyframes shimmer { 0%{background-position:0% 0%} 100%{background-position:200% 0%} }`}</style>
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="max-w-7xl mx-auto px-6 py-10 relative">
          <div className="flex items-center justify-between gap-8">

            {/* Left text */}
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-blue-300 text-xs mb-4">
                <i className="fas fa-home text-[10px]"></i>
                <span>Home</span>
                <i className="fas fa-chevron-right text-[10px]"></i>
                <span className="text-white font-semibold">Lost &amp; Found Board</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-[11px] font-semibold text-blue-200 mb-3 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                Lost &amp; Found System
              </div>
              <h1 className="text-4xl font-extrabold mb-2 tracking-tight leading-tight">
                Campus Lost &amp; Found<br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #fdba74, #fcd34d)" }}>
                  Board
                </span>
              </h1>
              <p className="text-blue-200 text-sm max-w-xl leading-relaxed mt-1">
                Browse reported lost and found items across the university campus.
              </p>
              <div className="flex flex-wrap gap-2.5 mt-5">
                {[
                  { icon: "fa-th-large",     text: "All Items",    color: "text-orange-300" },
                  { icon: "fa-search-minus", text: "Lost Items",   color: "text-blue-300"   },
                  { icon: "fa-hand-holding", text: "Found Items",  color: "text-violet-300" },
                  { icon: "fa-eye",          text: "Sighting Trail", color: "text-teal-300" },
                ].map(({ icon, text, color }) => (
                  <div key={text} className="flex items-center gap-2 bg-white/10 hover:bg-white/[0.15] transition-colors border border-white/10 rounded-lg px-3 py-1.5 text-xs backdrop-blur-sm">
                    <i className={`fas ${icon} ${color} text-[11px]`}></i>
                    <span className="text-white/90">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: icon + CTA + bell */}
            <div className="hidden lg:flex flex-col items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-3 self-end mb-1">
                <NotificationBell email={authUserEmail} />
              </div>
              <div className="relative">
                <div className="w-36 h-36 rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl shadow-black/40 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <i className="fas fa-clipboard-list text-white/80 text-5xl"></i>
                </div>
                <div className="absolute -top-2 -right-2 w-9 h-9 bg-orange-400 rounded-full flex items-center justify-center shadow-lg border-2 border-orange-300">
                  <i className="fas fa-search text-white text-sm"></i>
                </div>
                <div className="absolute -bottom-2 -left-2 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-md border-2 border-amber-300">
                  <i className="fas fa-tag text-white text-[10px]"></i>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-center">
                <Link
                  to="/report-item"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold text-xs transition-colors shadow-lg"
                >
                  <i className="fas fa-plus text-[11px]"></i> Report an Item
                </Link>
                <Link
                  to="/notice"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-semibold text-xs transition-colors border border-white/20"
                >
                  <i className="fas fa-bullhorn text-[11px]"></i> View Notices
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full">

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <i className={`fas ${tab.icon} text-xs`}></i>
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === tab.key ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {tab.key === "all" ? items.length : items.filter(i => i.itemType === tab.key).length}
              </span>
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-sm text-gray-500 font-medium flex items-center gap-1.5 mr-1">
            <i className="fas fa-filter text-gray-400 text-xs"></i> Category:
          </span>
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedCategory === "all"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            All Categories
          </button>
          {Object.entries(CATEGORIES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Item Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-sm text-gray-400">Loading items...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 p-8 rounded-2xl text-red-700 text-center flex flex-col items-center gap-2">
            <i className="fas fa-exclamation-circle text-3xl text-red-400"></i>
            <p className="font-medium">{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white border border-gray-100 shadow-sm p-12 rounded-2xl text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <i className="fas fa-inbox text-2xl text-gray-300"></i>
            </div>
            <p className="text-gray-600 font-medium">
              No {activeTab === "all" ? "" : activeTab} items{selectedCategory !== "all" ? ` in "${CATEGORIES[selectedCategory]}"` : ""} found.
            </p>
            <p className="text-sm text-gray-400">Be the first to report one!</p>
            <Link
              to="/report-item"
              className="mt-2 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-plus text-xs"></i> Report an Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredItems.map(item => {
              const active  = activeSightings(item.sightings || []);
              const latest  = latestSighting(item.sightings || []);
              const hot     = latest && isHot(latest.createdAt);

              return (
                <div
                  key={item._id}
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group relative ${
                    item.itemType === "found" ? "border-green-400" : "border-red-400"
                  }`}
                  onClick={() => openItemDetails(item)}
                >
                  {/* Your Post badge */}
                  {userOwnsItem(item) && (
                    <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
                      Your Post
                    </div>
                  )}

                  {/* Item type badge */}
                  <div className={`absolute top-3 right-3 z-10 text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm ${
                    item.itemType === "found" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  }`}>
                    {item.itemType === "found" ? "Found" : "Lost"}
                  </div>

                  {/* Image */}
                  <div className="relative w-full overflow-hidden bg-gray-50" style={{ paddingBottom: "65%" }}>
                    {getItemImage(item) ? (
                      <img
                        src={getItemImage(item)}
                        alt={item.itemName}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300">
                        <i className="fas fa-image text-4xl"></i>
                        <span className="text-xs text-gray-400">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2 truncate">{item.itemName}</h3>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1.5">
                      <i className="fas fa-map-marker-alt text-gray-400 flex-shrink-0"></i>
                      <span className="truncate">{item.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-2">
                      <i className="fas fa-clock flex-shrink-0"></i>
                      <span>{formatDate(item.dateTime)}</span>
                    </div>

                    {/* Sighting badge — only on lost items with sightings */}
                    {item.itemType === "lost" && active.length > 0 && (
                      <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg w-fit ${
                        hot ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                      }`}>
                        {hot
                          ? <span className="animate-pulse">🔥</span>
                          : <span>👀</span>}
                        {active.length} sighting{active.length > 1 ? "s" : ""}
                        {latest && <span className="font-normal text-gray-400">· {timeAgo(latest.createdAt)}</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Item Detail Modal */}
        {showModal && selectedItem && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">

              {/* Modal Header */}
              <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between ${
                selectedItem.itemType === "found" ? "bg-green-50" : "bg-red-50"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedItem.itemType === "found" ? "bg-green-100" : "bg-red-100"
                  }`}>
                    <i className={`fas ${selectedItem.itemType === "found" ? "fa-hand-holding text-green-600" : "fa-search-minus text-red-600"}`}></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{selectedItem.itemName}</h3>
                    <span className={`text-xs font-semibold ${selectedItem.itemType === "found" ? "text-green-600" : "text-red-600"}`}>
                      {selectedItem.itemType === "found" ? "Found Item" : "Lost Item"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-full bg-white/70 hover:bg-white flex items-center justify-center transition-colors shadow-sm"
                >
                  <i className="fas fa-times text-gray-500 text-sm"></i>
                </button>
              </div>

              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">

                  {/* Left: Image + owner actions */}
                  <div className="md:w-5/12">
                    {selectedItem.images && selectedItem.images.length > 0 ? (
                      <img
                        src={selectedItem.images[activeImageIndex]}
                        alt={selectedItem.itemName}
                        className="w-full h-52 object-cover rounded-xl mb-3 border border-gray-100"
                      />
                    ) : (
                      <div className="w-full h-52 bg-gray-50 rounded-xl mb-3 flex flex-col items-center justify-center border border-gray-100 gap-2">
                        <i className="fas fa-image text-4xl text-gray-200"></i>
                        <span className="text-xs text-gray-400">No image available</span>
                      </div>
                    )}

                    {selectedItem.images && selectedItem.images.length > 1 && (
                      <div className="flex gap-2 mb-3">
                        {selectedItem.images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIndex(idx)}
                            className={`flex-1 rounded-lg overflow-hidden border-2 transition-all ${
                              activeImageIndex === idx ? "border-blue-500 shadow-md" : "border-gray-100 hover:border-gray-300"
                            }`}
                          >
                            <img src={img} alt={`View ${idx + 1}`} className="w-full h-14 object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    {userOwnsItem(selectedItem) && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openPasswordModal("edit"); }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          <i className="fas fa-pen text-xs"></i> Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openPasswordModal("delete"); }}
                          disabled={deleteLoading}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          <i className="fas fa-trash text-xs"></i> Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: Details */}
                  <div className="md:w-7/12">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        selectedItem.itemType === "found" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {selectedItem.itemType === "found" ? "Found Item" : "Lost Item"}
                      </span>
                      {selectedItem.category && (
                        <span className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-50 text-blue-700 capitalize">
                          {selectedItem.category.replace(/-/g, " ")}
                        </span>
                      )}
                      {selectedItem.status && (
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          selectedItem.status === "pending"  ? "bg-yellow-100 text-yellow-700" :
                          selectedItem.status === "claimed"  ? "bg-green-100 text-green-700"   :
                          selectedItem.status === "returned" ? "bg-blue-100 text-blue-700"     :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                        </span>
                      )}
                    </div>

                    {/* Detail rows */}
                    <div className="space-y-4 mb-5">
                      {selectedItem.itemType === "found" ? (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fas fa-shield-alt text-blue-500 text-xs"></i>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-0.5">Description</p>
                            <p className="text-xs text-blue-700 leading-relaxed bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                              Description is hidden for found items to protect against fraudulent claims.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fas fa-align-left text-gray-500 text-xs"></i>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Description</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{selectedItem.description}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="fas fa-map-marker-alt text-gray-500 text-xs"></i>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Campus Location</p>
                          <p className="text-sm text-gray-700">{selectedItem.location}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="fas fa-calendar text-gray-500 text-xs"></i>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Date &amp; Time</p>
                          <p className="text-sm text-gray-700">{formatDate(selectedItem.dateTime)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    {selectedItem.contactInfo && Object.values(selectedItem.contactInfo).some(v => v) && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mb-5">
                        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <i className="fas fa-user"></i> Student Contact
                        </p>
                        <div className="space-y-2">
                          {selectedItem.contactInfo.name && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <i className="fas fa-user-circle text-blue-400 w-4 text-center"></i>
                              <span>{selectedItem.contactInfo.name}</span>
                            </div>
                          )}
                          {selectedItem.contactInfo.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <i className="fas fa-phone text-blue-400 w-4 text-center"></i>
                              <span>{selectedItem.contactInfo.phone}</span>
                            </div>
                          )}
                          {selectedItem.contactInfo.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <i className="fas fa-envelope text-blue-400 w-4 text-center"></i>
                              <span>{selectedItem.contactInfo.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Sighting Trail — only on lost items ── */}
                    {selectedItem.itemType === "lost" && (() => {
                      const isOwner = userOwnsItem(selectedItem);
                      const visibleSightings = visibleSightingsForItem(selectedItem, authUser);
                      const sightingCount = activeSightings(visibleSightings).length;
                      const latest = latestSighting(visibleSightings);
                      const hot = latest && isHot(latest.createdAt);
                      return (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                          {/* Section header */}
                          <div className={`px-4 py-3 flex items-center justify-between ${
                            hot && sightingCount > 0
                              ? "bg-gradient-to-r from-orange-500 to-amber-500"
                              : sightingCount > 0
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                              : "bg-gradient-to-r from-slate-600 to-slate-700"
                          }`}>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <i className="fas fa-route text-white text-sm"></i>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-white tracking-tight">Sighting Trail</h4>
                                  {sightingCount > 0 && (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/30 text-white text-[10px] font-bold">
                                      {sightingCount}
                                    </span>
                                  )}
                                  {hot && sightingCount > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white/25 text-white px-2 py-0.5 rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block"></span>
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-white/70 mt-0.5">
                                  {sightingCount === 0
                                    ? isOwner
                                      ? "Community sightings of this item will appear here"
                                      : "Only sightings you submit for this item will appear here"
                                    : latest
                                    ? `Last seen ${timeAgo(latest.createdAt)} · ${latest.location}`
                                    : isOwner
                                    ? `${sightingCount} community sighting${sightingCount > 1 ? "s" : ""}`
                                    : `${sightingCount} of your sighting${sightingCount > 1 ? "s" : ""}`}
                                </p>
                              </div>
                            </div>

                            {!isOwner && (
                              <button
                                onClick={() => setSightingModalItem(selectedItem)}
                                className="inline-flex items-center gap-1.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold px-3 py-2 rounded-xl transition-colors shadow-sm flex-shrink-0"
                              >
                                <i className="fas fa-eye text-[11px]"></i> I Saw This
                              </button>
                            )}
                          </div>

                          {/* Stats bar — only when there are sightings */}
                          {sightingCount > 0 && (
                            <div className="flex divide-x divide-slate-100 bg-slate-50 border-b border-slate-200">
                              {[
                                {
                                  label: "Total Sightings",
                                  value: sightingCount,
                                  icon: "fa-eye",
                                  color: "text-blue-600",
                                },
                                {
                                  label: "Helpful",
                                  value: visibleSightings.filter(s => s.helpful).length,
                                  icon: "fa-check-circle",
                                  color: "text-emerald-600",
                                },
                                {
                                  label: "Last Seen",
                                  value: latest ? timeAgo(latest.createdAt) : "—",
                                  icon: "fa-clock",
                                  color: "text-orange-500",
                                },
                              ].map(stat => (
                                <div key={stat.label} className="flex-1 flex flex-col items-center py-2.5 px-2">
                                  <i className={`fas ${stat.icon} ${stat.color} text-xs mb-1`}></i>
                                  <span className={`text-sm font-bold ${stat.color}`}>{stat.value}</span>
                                  <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wide mt-0.5">{stat.label}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Timeline body */}
                          <div className="p-4 bg-white max-h-72 overflow-y-auto">
                            <SightingTrail
                              sightings={visibleSightings}
                              isOwner={isOwner}
                              viewerEmail={authUserEmail}
                              onReact={handleReact}
                              onEditSighting={handleEditSighting}
                              onDeleteSighting={handleDeleteSighting}
                              reactionLoadingId={sightingLoadingId}
                              actionLoadingId={sightingActionLoadingId}
                            />
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sighting Form Modal */}
        {sightingModalItem && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                    <i className="fas fa-eye text-blue-600 text-sm"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-tight">Report a Sighting</h3>
                    <p className="text-xs text-gray-500 truncate max-w-[220px]">{sightingModalItem.itemName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSightingModalItem(null)}
                  className="w-8 h-8 rounded-full bg-white/70 hover:bg-white flex items-center justify-center transition-colors shadow-sm"
                >
                  <i className="fas fa-times text-gray-500 text-sm"></i>
                </button>
              </div>
              <div className="p-6">
                <SightingForm
                  itemId={sightingModalItem._id}
                  reporterEmail={authUserEmail}
                  onSuccess={(updatedSightings) => handleSightingSuccess(updatedSightings, sightingModalItem._id)}
                  onCancel={() => setSightingModalItem(null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Password Confirmation Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pendingAction === "delete" ? "bg-red-100" : "bg-blue-100"}`}>
                  <i className={`fas fa-lock text-sm ${pendingAction === "delete" ? "text-red-600" : "text-blue-600"}`}></i>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Confirm Your Identity</h3>
                  <p className="text-xs text-gray-500">
                    Enter your account password to {pendingAction === "delete" ? "delete" : "edit"} this item
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Account Password
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handlePasswordConfirm()}
                  placeholder="Enter your password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                {passwordError && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <i className="fas fa-exclamation-circle"></i> {passwordError}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={closePasswordModal}
                  disabled={passwordLoading}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordConfirm}
                  disabled={passwordLoading}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                    pendingAction === "delete" ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {passwordLoading
                    ? <><i className="fas fa-spinner fa-spin text-xs"></i> Verifying...</>
                    : <><i className={`fas ${pendingAction === "delete" ? "fa-trash" : "fa-pen"} text-xs`}></i> {pendingAction === "delete" ? "Delete" : "Edit"}</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
