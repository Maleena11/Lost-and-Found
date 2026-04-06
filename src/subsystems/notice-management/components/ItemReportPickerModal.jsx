import { useState, useEffect } from "react";
import axios from "axios";

const TYPE_COLORS = {
  lost:  { bg: "bg-red-100",   text: "text-red-700",   border: "border-red-200",   label: "Lost"  },
  found: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", label: "Found" },
};

const CATEGORY_LABELS = {
  "student-id":       "Student ID",
  "laptop-tablet":    "Laptop / Tablet",
  "books-notes":      "Books / Notes",
  "stationery":       "Stationery",
  "electronics":      "Electronics",
  "lab-equipment":    "Lab Equipment",
  "sports-equipment": "Sports Equipment",
  "clothing":         "Clothing",
  "jewelry":          "Jewelry",
  "keys":             "Keys",
  "wallet":           "Wallet",
  "documents":        "Documents",
  "water-bottle":     "Water Bottle",
  "other":            "Other",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Detail Card View ────────────────────────────────────────────────────────
function DetailView({ item, onBack, onUse }) {
  const typeStyle = TYPE_COLORS[item.itemType] || TYPE_COLORS.lost;
  const thumbnail = item.thumbnail || item.images?.[0];
  const [fullImage, setFullImage] = useState(null);

  useEffect(() => {
    if (!item._id) return;
    axios.get(`http://localhost:3001/api/lost-found/${item._id}`)
      .then(res => {
        const full = res.data?.data || res.data;
        if (full.images?.[0]) setFullImage(full.images[0]);
      })
      .catch(() => {});
  }, [item._id]);

  const displayImage = fullImage || thumbnail;

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Hero Image */}
      <div className="relative flex-shrink-0 h-52 bg-gray-900 overflow-hidden rounded-t-2xl">
        {displayImage ? (
          <>
            {/* Blurred background */}
            <img src={displayImage} alt="" aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-50" />
            {/* Full-quality image */}
            <img src={displayImage} alt={item.itemName}
              className="relative z-10 h-full mx-auto object-contain drop-shadow-2xl" />
            {/* Subtle shimmer overlay while upgrading from thumbnail to full */}
            {!fullImage && thumbnail && (
              <div className="absolute inset-0 z-20 bg-white/10 animate-pulse" />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="fas fa-image text-5xl text-gray-600"></i>
          </div>
        )}

        {/* Dark gradient at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent z-20" />

        {/* Floating back button */}
        <button type="button" onClick={onBack}
          className="absolute top-3 left-3 z-30 w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-colors">
          <i className="fas fa-arrow-left text-xs"></i>
        </button>

        {/* Item name + badge overlaid on gradient */}
        <div className="absolute bottom-0 inset-x-0 z-30 px-4 pb-3 flex items-end justify-between gap-2">
          <h3 className="text-base font-extrabold text-white leading-snug drop-shadow line-clamp-2">{item.itemName}</h3>
          <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
            {typeStyle.label}
          </span>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2">
          <InfoRow icon="fa-tag"            label="Category"   value={CATEGORY_LABELS[item.category] || item.category} />
          <InfoRow icon="fa-map-marker-alt" label="Location"   value={item.location} />
          <InfoRow icon="fa-calendar-alt"   label="Date & Time" value={formatDateTime(item.dateTime)} />
          {item.faculty    && <InfoRow icon="fa-university" label="Faculty"     value={item.faculty} />}
          {item.department && <InfoRow icon="fa-sitemap"    label="Department"  value={item.department} />}
          {item.building   && <InfoRow icon="fa-building"   label="Building"    value={item.building} />}
          {item.yearGroup  && <InfoRow icon="fa-users"      label="Year Group"  value={item.yearGroup} />}
        </div>

        <div className="border-t border-gray-100" />

        {/* Description */}
        {item.itemType === "found" ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-start gap-3">
            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <i className="fas fa-shield-alt text-blue-500 text-xs"></i>
            </div>
            <div>
              <p className="text-sm font-bold text-blue-800">Description hidden</p>
              <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                Hidden to prevent fraudulent claims on found items.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              {item.description || "No description provided."}
            </p>
          </div>
        )}

        {/* Contact Info */}
        {(item.contactInfo?.name || item.contactInfo?.phone || item.contactInfo?.email) && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Contact</p>
            <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 space-y-1.5">
              {item.contactInfo?.name  && <InfoRow icon="fa-user"     label="Name"  value={item.contactInfo.name}  small />}
              {item.contactInfo?.phone && <InfoRow icon="fa-phone"    label="Phone" value={item.contactInfo.phone} small />}
              {item.contactInfo?.email && <InfoRow icon="fa-envelope" label="Email" value={item.contactInfo.email} small />}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between items-center flex-shrink-0">
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors">
          <i className="fas fa-arrow-left text-xs"></i>
          Back
        </button>
        <button type="button" onClick={() => onUse(item)}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
          <i className="fas fa-magic text-xs"></i>
          Use this Report
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, small }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <i className={`fas ${icon} ${small ? "text-xs" : "text-sm"} text-gray-400 mt-0.5 w-4 flex-shrink-0`}></i>
      <div className="min-w-0">
        <span className="text-xs text-gray-400">{label}: </span>
        <span className={`${small ? "text-xs" : "text-sm"} text-gray-700 font-medium break-words`}>{value}</span>
      </div>
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────
export default function ItemReportPickerModal({ onSelect, onClose, preloadedItems, preloadError }) {
  const [items, setItems]             = useState(preloadedItems || []);
  const [loading, setLoading]         = useState(preloadedItems === null);
  const [error, setError]             = useState(preloadError || null);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState("all");
  const [previewItem, setPreviewItem] = useState(null);
  const [lightbox, setLightbox]       = useState(null); // { thumbnail, itemId, itemName }
  const [lightboxFull, setLightboxFull] = useState(null);

  const openLightbox = (e, item) => {
    e.stopPropagation();
    setLightbox({ thumbnail: item.thumbnail, itemId: item._id, itemName: item.itemName });
    setLightboxFull(null);
    axios.get(`http://localhost:3001/api/lost-found/${item._id}`)
      .then(res => {
        const full = res.data?.data || res.data;
        if (full.images?.[0]) setLightboxFull(full.images[0]);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (preloadedItems !== null) return;
    // Fetch lean list — images excluded for speed
    axios
      .get("http://localhost:3001/api/lost-found/?lean=true")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setItems(data);
      })
      .catch(() => setError("Failed to load item reports."))
      .finally(() => setLoading(false));
  }, [preloadedItems]);

  const handleCardClick = (item) => {
    setPreviewItem(item);
  };

  const filtered = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.itemName?.toLowerCase().includes(search.toLowerCase()) ||
      item.location?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || item.itemType === filter;
    return matchesSearch && matchesFilter;
  });

  const lostCount  = items.filter((i) => i.itemType === "lost").length;
  const foundCount = items.filter((i) => i.itemType === "found").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">

      {/* Lightbox */}
      {lightbox && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => { setLightbox(null); setLightboxFull(null); }}
        >
          <button
            type="button"
            className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
            onClick={() => { setLightbox(null); setLightboxFull(null); }}
          >
            <i className="fas fa-times"></i>
          </button>
          <div className="relative max-w-sm w-full mx-6" onClick={e => e.stopPropagation()}>
            <img
              src={lightboxFull || lightbox.thumbnail}
              alt={lightbox.itemName}
              className="w-full rounded-2xl shadow-2xl object-contain max-h-[70vh]"
            />
            {!lightboxFull && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
                <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              </div>
            )}
            <p className="text-center text-white/80 text-sm mt-3 font-medium">{lightbox.itemName}</p>
          </div>
        </div>
      )}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">

        {previewItem ? (
          <>
            {/* Close button overlay */}
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 bg-white border border-gray-200 hover:bg-gray-100 rounded-full flex items-center justify-center shadow-sm transition-colors"
              >
                <i className="fas fa-times text-gray-500 text-sm"></i>
              </button>
            </div>
            <DetailView
              item={previewItem}
              onBack={() => setPreviewItem(null)}
              onUse={onSelect}
            />
          </>
        ) : (

        /* ── LIST VIEW ── */
        <>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white rounded-t-2xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <i className="fas fa-file-alt text-white text-sm"></i>
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">Select Item Report</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Click a report to view full details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <i className="fas fa-times text-gray-500 text-sm"></i>
              </button>
            </div>

            {/* Search */}
            <div className="relative mt-3">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by item name or location..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
              />
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mt-3">
              {[
                { key: "all",   label: `All (${items.length})`  },
                { key: "lost",  label: `Lost (${lostCount})`    },
                { key: "found", label: `Found (${foundCount})`  },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    filter === tab.key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {loading && (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-500"></div>
              </div>
            )}
            {error && (
              <div className="text-center text-red-600 py-10">
                <i className="fas fa-exclamation-circle text-2xl mb-2 block"></i>
                {error}
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className="text-center text-gray-400 py-10">
                <i className="fas fa-inbox text-3xl mb-2 block"></i>
                No item reports found.
              </div>
            )}
            {!loading && !error && filtered.map((item) => {
              const typeStyle = TYPE_COLORS[item.itemType] || TYPE_COLORS.lost;
              const thumbnail = item.thumbnail || item.images?.[0];
              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => handleCardClick(item)}
                  className="w-full border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all text-left group bg-white overflow-hidden"
                >
                  {/* Top row: image + header info */}
                  <div className="flex gap-3 p-3">
                    {/* Thumbnail */}
                    <div
                      className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-50 flex items-center justify-center group/thumb"
                      onClick={thumbnail ? (e) => openLightbox(e, item) : undefined}
                    >
                      {thumbnail ? (
                        <>
                          <img src={thumbnail} alt={item.itemName} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-colors flex items-center justify-center">
                            <i className="fas fa-search-plus text-white text-lg opacity-0 group-hover/thumb:opacity-100 transition-opacity drop-shadow"></i>
                          </div>
                        </>
                      ) : (
                        <i className="fas fa-image text-gray-300 text-2xl"></i>
                      )}
                    </div>

                    {/* Name + badges + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-gray-800 leading-snug line-clamp-2">{item.itemName}</p>
                        <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
                          {typeStyle.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <i className="fas fa-tag text-gray-400 w-3"></i>
                          {CATEGORY_LABELS[item.category] || item.category}
                        </span>
                        {item.location && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <i className="fas fa-map-marker-alt text-gray-400 w-3"></i>
                            {item.location}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <i className="fas fa-calendar-alt text-gray-300 w-3"></i>
                          {formatDate(item.dateTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description — hidden for found items only */}
                  {item.itemType === "found" ? (
                    <div className="px-3 pb-2">
                      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <i className="fas fa-shield-alt text-blue-500 text-xs flex-shrink-0"></i>
                        <p className="text-xs text-blue-700 font-medium">
                          Description is hidden for found items to prevent fraudulent claims.
                        </p>
                      </div>
                    </div>
                  ) : (
                    item.description && (
                      <div className="px-3 pb-2">
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                          {item.description}
                        </p>
                      </div>
                    )
                  )}

                  {/* Footer: contact info (always visible) + view details */}
                  <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/60">
                    <div className="flex items-center gap-3">
                      {item.contactInfo?.phone && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <i className="fas fa-phone text-gray-400 w-3"></i>
                          {item.contactInfo.phone}
                        </span>
                      )}
                      {item.contactInfo?.email && (
                        <span className="text-xs text-gray-500 flex items-center gap-1 truncate max-w-[150px]">
                          <i className="fas fa-envelope text-gray-400 w-3"></i>
                          {item.contactInfo.email}
                        </span>
                      )}
                      {!item.contactInfo?.phone && !item.contactInfo?.email && (
                        <span className="text-xs text-gray-400 italic">No contact info</span>
                      )}
                    </div>
                    <span className="text-xs text-blue-500 font-semibold flex items-center gap-1 group-hover:text-blue-700 transition-colors flex-shrink-0">
                      View details
                      <i className="fas fa-chevron-right text-xs group-hover:translate-x-0.5 transition-transform"></i>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* List Footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between items-center flex-shrink-0">
            <p className="text-xs text-gray-400">{filtered.length} report{filtered.length !== 1 ? "s" : ""} shown</p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
        )}
      </div>
    </div>
  );
}
