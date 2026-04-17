import { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:3001/api/zones';

const ZONE_TYPES = ['hall', 'lab', 'food', 'admin', 'shared', 'sis', 'ground', 'security'];

const TYPE_META = {
  hall:     { bg: 'bg-blue-50 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-400',   border: 'border-blue-200 dark:border-blue-700',   activeBg: 'bg-blue-100 dark:bg-blue-900/50',   label: 'Hall'     },
  lab:      { bg: 'bg-green-50 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-400',  border: 'border-green-200 dark:border-green-700',  activeBg: 'bg-green-100 dark:bg-green-900/50', label: 'Lab'      },
  food:     { bg: 'bg-amber-50 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-400',  border: 'border-amber-200 dark:border-amber-700',  activeBg: 'bg-amber-100 dark:bg-amber-900/50', label: 'Food'     },
  admin:    { bg: 'bg-violet-50 dark:bg-violet-900/30',text: 'text-violet-700 dark:text-violet-400',border: 'border-violet-200 dark:border-violet-700',activeBg: 'bg-violet-100 dark:bg-violet-900/50',label: 'Admin'    },
  shared:   { bg: 'bg-gray-50 dark:bg-gray-700/50',   text: 'text-gray-600 dark:text-gray-400',    border: 'border-gray-200 dark:border-gray-600',    activeBg: 'bg-gray-100 dark:bg-gray-700',      label: 'Shared'   },
  sis:      { bg: 'bg-pink-50 dark:bg-pink-900/30',    text: 'text-pink-700 dark:text-pink-400',    border: 'border-pink-200 dark:border-pink-700',    activeBg: 'bg-pink-100 dark:bg-pink-900/50',   label: 'SIS'      },
  ground:   { bg: 'bg-emerald-50 dark:bg-emerald-900/30',text:'text-emerald-700 dark:text-emerald-400',border:'border-emerald-200 dark:border-emerald-700',activeBg:'bg-emerald-100 dark:bg-emerald-900/50',label:'Ground'  },
  security: { bg: 'bg-red-50 dark:bg-red-900/30',     text: 'text-red-700 dark:text-red-400',      border: 'border-red-200 dark:border-red-700',      activeBg: 'bg-red-100 dark:bg-red-900/50',     label: 'Security' },
};

const INPUT_CLS =
  'w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl ' +
  'bg-gray-50 dark:bg-gray-700 dark:text-gray-100 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ' +
  'placeholder-gray-400 dark:placeholder-gray-500 transition';

const EMPTY_FORM = { zoneId: '', name: '', floor: '', type: 'hall', keywords: '' };

// ── Type badge ──────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const m = TYPE_META[type] || TYPE_META.shared;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${m.bg} ${m.text} ${m.border}`}>
      {m.label}
    </span>
  );
}

// ── Zone form ───────────────────────────────────────────────────────────────
function ZoneForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = e => {
    e.preventDefault();
    const keywords = form.keywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);
    onSave({ ...form, keywords });
  };

  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-900/20 overflow-hidden">
      {/* Form header */}
      <div className="px-5 py-3.5 border-b border-indigo-200 dark:border-indigo-700 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
          <i className={`fas fa-${initial ? 'pencil-alt' : 'plus'} text-indigo-600 dark:text-indigo-400 text-[10px]`}></i>
        </div>
        <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
          {initial ? 'Edit Zone' : 'Add New Zone'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Zone ID
            </label>
            <input
              required
              value={form.zoneId}
              onChange={e => set('zoneId', e.target.value.toUpperCase())}
              disabled={!!initial}
              placeholder="e.g. F3-A305"
              className={`${INPUT_CLS} font-mono disabled:opacity-50 disabled:cursor-not-allowed`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Floor
            </label>
            <input
              required
              value={form.floor}
              onChange={e => set('floor', e.target.value.toUpperCase())}
              placeholder="e.g. 3F"
              className={`${INPUT_CLS} font-mono`}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Display Name
          </label>
          <input
            required
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Lecture Hall A305"
            className={INPUT_CLS}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Zone Type
          </label>
          <select
            value={form.type}
            onChange={e => set('type', e.target.value)}
            className={INPUT_CLS}
          >
            {ZONE_TYPES.map(t => (
              <option key={t} value={t}>{TYPE_META[t]?.label || t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Location Keywords
            <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">
              comma-separated, used for heatmap matching
            </span>
          </label>
          <textarea
            rows={2}
            value={form.keywords}
            onChange={e => set('keywords', e.target.value)}
            placeholder="e.g. a305, hall a305, lecture a305"
            className={`${INPUT_CLS} resize-none`}
          />
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            These keywords are matched against item location descriptions to assign zones.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {initial ? 'Save Changes' : 'Add Zone'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function ZoneManager() {
  const [zones, setZones]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState(null);
  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]   = useState('all');
  const [filterFloor, setFilterFloor] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API}/all`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setZones(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async formData => {
    setSaving(true);
    try {
      const res  = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      showToast(`Zone "${json.data.name}" added successfully.`);
      setShowAdd(false);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id, formData) => {
    setSaving(true);
    try {
      const res  = await fetch(`${API}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      showToast(`Zone "${json.data.name}" updated successfully.`);
      setEditingId(null);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async zone => {
    try {
      const res  = await fetch(`${API}/${zone._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !zone.isActive }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      showToast(`Zone "${zone.name}" ${json.data.isActive ? 'enabled' : 'disabled'}.`);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async zone => {
    try {
      const res  = await fetch(`${API}/${zone._id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      showToast(json.message);
      setConfirmDelete(null);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const floors   = ['all', ...new Set(zones.map(z => z.floor).sort())];
  const filtered = zones.filter(z => {
    const q = search.toLowerCase();
    const matchSearch = !q || z.name.toLowerCase().includes(q) || z.zoneId.toLowerCase().includes(q) || z.keywords.some(k => k.includes(q));
    const matchType   = filterType  === 'all' || z.type  === filterType;
    const matchFloor  = filterFloor === 'all' || z.floor === filterFloor;
    return matchSearch && matchType && matchFloor;
  });

  const counts = ZONE_TYPES.reduce((acc, t) => {
    acc[t] = zones.filter(z => z.type === t && z.isActive).length;
    return acc;
  }, {});

  const activeCount   = zones.filter(z => z.isActive).length;
  const inactiveCount = zones.length - activeCount;

  return (
    <div className="space-y-5">

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm w-80
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          <span className="flex-shrink-0">
            {toast.type === 'error'
              ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            }
          </span>
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 transition flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-80 mx-4 border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-center mb-1">Delete Zone?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">
              <span className="font-medium text-gray-700 dark:text-gray-300">{confirmDelete.name}</span>
              <span className="font-mono text-xs ml-1 text-gray-400">({confirmDelete.zoneId})</span>
              {" "}will be permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Zones',  value: zones.length,   color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Active',       value: activeCount,    color: 'text-emerald-600 dark:text-emerald-400',bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Disabled',     value: inactiveCount,  color: 'text-gray-500 dark:text-gray-400',    bg: 'bg-gray-50 dark:bg-gray-700/40' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3.5 text-center border border-gray-100 dark:border-gray-700`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Zone type filter chips */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Filter by type</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition
              ${filterType === 'all'
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-600 shadow-sm'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
          >
            All
            <span className="w-4 h-4 rounded-full bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold flex items-center justify-center">
              {zones.length}
            </span>
          </button>
          {ZONE_TYPES.map(t => {
            const m = TYPE_META[t];
            return (
              <button
                key={t}
                onClick={() => setFilterType(filterType === t ? 'all' : t)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition
                  ${filterType === t
                    ? `${m.activeBg} ${m.text} ${m.border} shadow-sm`
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
              >
                {m.label}
                <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center
                  ${filterType === t ? 'bg-white/60 dark:bg-black/20' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'}`}>
                  {counts[t] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + floor filter + Add Zone button */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search zones by name, ID, or keyword…"
            className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 transition"
          />
        </div>
        <select
          value={filterFloor}
          onChange={e => setFilterFloor(e.target.value)}
          className="px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        >
          {floors.map(f => (
            <option key={f} value={f}>{f === 'all' ? 'All floors' : `Floor ${f}`}</option>
          ))}
        </select>
        <button
          onClick={() => { setShowAdd(!showAdd); setEditingId(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm flex-shrink-0
            ${showAdd
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
        >
          {showAdd ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Zone
            </>
          )}
        </button>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">
        Showing {filtered.length} of {zones.length} zone{zones.length !== 1 ? 's' : ''}
      </p>

      {/* Add form */}
      {showAdd && (
        <ZoneForm onSave={handleAdd} onCancel={() => setShowAdd(false)} saving={saving} />
      )}

      {/* Zone list */}
      {loading ? (
        <div className="flex items-center justify-center py-14 gap-3 text-gray-400 dark:text-gray-500 text-sm">
          <svg className="animate-spin w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading zones…
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.998L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.002C2.57 17.333 3.532 19 5.072 19z" />
          </svg>
          <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
          <button onClick={load} className="text-sm font-medium text-red-700 dark:text-red-400 underline hover:no-underline transition">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-1">
            <svg className="w-6 h-6 text-gray-300 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No zones match your filters</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700/60">
          {filtered.map(zone => (
            <div key={zone._id}>
              {editingId === zone._id ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/30">
                  <ZoneForm
                    initial={{
                      zoneId:   zone.zoneId,
                      name:     zone.name,
                      floor:    zone.floor,
                      type:     zone.type,
                      keywords: zone.keywords.join(', '),
                    }}
                    onSave={data => handleUpdate(zone._id, data)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                  />
                </div>
              ) : (
                <div
                  className={`flex items-start gap-4 px-4 py-3.5 group transition
                    ${zone.isActive
                      ? 'bg-white dark:bg-gray-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'
                      : 'bg-gray-50/60 dark:bg-gray-800/50 opacity-60'}`}
                >
                  {/* Zone ID badge */}
                  <div className="flex-shrink-0 w-[72px] text-center pt-0.5">
                    <p className="text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-700/50 rounded-lg px-1.5 py-0.5 leading-tight">
                      {zone.zoneId}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-1">{zone.floor}</p>
                  </div>

                  {/* Name + type + keywords */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{zone.name}</p>
                      <TypeBadge type={zone.type} />
                      {!zone.isActive && (
                        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-2 py-0.5">
                          disabled
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {zone.keywords.length === 0 ? (
                        <span className="text-[10px] text-gray-300 dark:text-gray-600 italic">No keywords set</span>
                      ) : zone.keywords.map(kw => (
                        <span
                          key={kw}
                          className="inline-block text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5 font-mono"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      title="Edit zone"
                      onClick={() => { setEditingId(zone._id); setShowAdd(false); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      title={zone.isActive ? 'Disable zone' : 'Enable zone'}
                      onClick={() => handleToggleActive(zone)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition
                        ${zone.isActive
                          ? 'text-gray-400 dark:text-gray-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400'
                          : 'text-gray-400 dark:text-gray-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {zone.isActive
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        }
                      </svg>
                    </button>
                    <button
                      title="Delete zone"
                      onClick={() => setConfirmDelete(zone)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Help note */}
      {zones.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Hover over a zone row to reveal edit, toggle, and delete actions. Changes are applied immediately.
        </p>
      )}
    </div>
  );
}
