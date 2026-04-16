import { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:3001/api/zones';

const ZONE_TYPES = ['hall', 'lab', 'food', 'admin', 'shared', 'sis', 'ground', 'security'];

const TYPE_STYLES = {
  hall:     { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300'   },
  lab:      { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300'  },
  food:     { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300'  },
  admin:    { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300' },
  shared:   { bg: 'bg-gray-100',   text: 'text-gray-600',   border: 'border-gray-300'   },
  sis:      { bg: 'bg-pink-100',   text: 'text-pink-700',   border: 'border-pink-300'   },
  ground:   { bg: 'bg-emerald-100',text: 'text-emerald-700',border: 'border-emerald-300'},
  security: { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300'    },
};

const EMPTY_FORM = { zoneId: '', name: '', floor: '', type: 'hall', keywords: '' };

function TypeBadge({ type }) {
  const s = TYPE_STYLES[type] || TYPE_STYLES.shared;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      {type}
    </span>
  );
}

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
    <form onSubmit={handleSubmit} className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-widest mb-2">
        {initial ? 'Edit Zone' : 'Add New Zone'}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Zone ID</label>
          <input
            required
            value={form.zoneId}
            onChange={e => set('zoneId', e.target.value)}
            disabled={!!initial}
            placeholder="e.g. F3-A305"
            className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-gray-100 disabled:text-gray-400 font-mono uppercase"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Floor</label>
          <input
            required
            value={form.floor}
            onChange={e => set('floor', e.target.value)}
            placeholder="e.g. 3F"
            className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono uppercase"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
        <input
          required
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. Lecture Hall A305"
          className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
        <select
          value={form.type}
          onChange={e => set('type', e.target.value)}
          className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {ZONE_TYPES.map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Keywords
          <span className="ml-1 font-normal text-gray-400">(comma-separated, used for location matching)</span>
        </label>
        <textarea
          rows={2}
          value={form.keywords}
          onChange={e => set('keywords', e.target.value)}
          placeholder="e.g. a305, hall a305, lecture a305"
          className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
        />
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition disabled:opacity-60"
        >
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Zone'}
        </button>
      </div>
    </form>
  );
}

export default function ZoneManager() {
  const [zones, setZones]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [search, setSearch]       = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterFloor, setFilterFloor] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null); // zone object

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/all`);
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

  const handleAdd = async (formData) => {
    setSaving(true);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      showToast(`Zone "${json.data.name}" added.`);
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
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      showToast(`Zone "${json.data.name}" updated.`);
      setEditingId(null);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (zone) => {
    try {
      const res = await fetch(`${API}/${zone._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !zone.isActive }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      showToast(`Zone "${zone.name}" ${json.data.isActive ? 'enabled' : 'disabled'}.`);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (zone) => {
    try {
      const res = await fetch(`${API}/${zone._id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      showToast(json.message);
      setConfirmDelete(null);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Derived filter values
  const floors = ['all', ...new Set(zones.map(z => z.floor).sort())];

  const filtered = zones.filter(z => {
    const matchSearch = !search || z.name.toLowerCase().includes(search.toLowerCase())
      || z.zoneId.toLowerCase().includes(search.toLowerCase())
      || z.keywords.some(k => k.includes(search.toLowerCase()));
    const matchType  = filterType  === 'all' || z.type  === filterType;
    const matchFloor = filterFloor === 'all' || z.floor === filterFloor;
    return matchSearch && matchType && matchFloor;
  });

  const counts = ZONE_TYPES.reduce((acc, t) => {
    acc[t] = zones.filter(z => z.type === t && z.isActive).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm w-80
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          <span>{toast.type === 'error' ? '✕' : '✓'}</span>
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 text-xs">✕</button>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-trash-alt text-red-600 text-sm"></i>
            </div>
            <h3 className="text-sm font-semibold text-gray-800 text-center mb-1">Delete Zone?</h3>
            <p className="text-xs text-gray-500 text-center mb-4">
              <span className="font-medium text-gray-700">{confirmDelete.name}</span> ({confirmDelete.zoneId}) will be permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-3 py-2 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Campus Zone Management</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage the zones shown on the heatmap. Changes take effect immediately.
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setEditingId(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex-shrink-0"
        >
          <i className={`fas fa-${showAdd ? 'times' : 'plus'} text-[10px]`}></i>
          {showAdd ? 'Cancel' : 'Add Zone'}
        </button>
      </div>

      {/* Type summary chips */}
      <div className="flex flex-wrap gap-1.5">
        {ZONE_TYPES.map(t => {
          const s = TYPE_STYLES[t];
          return (
            <button
              key={t}
              onClick={() => setFilterType(filterType === t ? 'all' : t)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition
                ${filterType === t ? `${s.bg} ${s.text} ${s.border} shadow-sm` : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
            >
              {t}
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold
                ${filterType === t ? `${s.text} bg-white/60` : 'bg-gray-200 text-gray-500'}`}>
                {counts[t] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Add form */}
      {showAdd && (
        <ZoneForm
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          saving={saving}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs pointer-events-none"></i>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search zones…"
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <select
          value={filterFloor}
          onChange={e => setFilterFloor(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {floors.map(f => (
            <option key={f} value={f}>{f === 'all' ? 'All floors' : `Floor ${f}`}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} of {zones.length} zone{zones.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Zone table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-400 text-sm">
          <i className="fas fa-spinner fa-spin text-indigo-400"></i>
          Loading zones…
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-600 flex items-center gap-2">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
          <button onClick={load} className="ml-auto underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-xs text-gray-400">
          No zones match your filters.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(zone => (
            <div key={zone._id}>
              {editingId === zone._id ? (
                <ZoneForm
                  initial={{
                    zoneId: zone.zoneId,
                    name: zone.name,
                    floor: zone.floor,
                    type: zone.type,
                    keywords: zone.keywords.join(', '),
                  }}
                  onSave={data => handleUpdate(zone._id, data)}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              ) : (
                <div className={`flex items-start gap-3 p-3 rounded-xl border transition group
                  ${zone.isActive
                    ? 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm'
                    : 'bg-gray-50 border-gray-200 opacity-60'}`}
                >
                  {/* Zone ID + floor */}
                  <div className="flex-shrink-0 w-20 text-center">
                    <p className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md px-1.5 py-0.5 mb-1">
                      {zone.zoneId}
                    </p>
                    <p className="text-[9px] text-gray-400 font-medium">{zone.floor}</p>
                  </div>

                  {/* Name + keywords */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-semibold text-gray-800 truncate">{zone.name}</p>
                      <TypeBadge type={zone.type} />
                      {!zone.isActive && (
                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">
                          disabled
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {zone.keywords.length === 0 ? (
                        <span className="text-[10px] text-gray-300 italic">No keywords</span>
                      ) : zone.keywords.map(kw => (
                        <span key={kw}
                          className="inline-block text-[9px] bg-gray-100 text-gray-500 border border-gray-200 rounded px-1.5 py-0.5 font-mono">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      title="Edit zone"
                      onClick={() => { setEditingId(zone._id); setShowAdd(false); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                    >
                      <i className="fas fa-pencil-alt text-xs"></i>
                    </button>
                    <button
                      title={zone.isActive ? 'Disable zone' : 'Enable zone'}
                      onClick={() => handleToggleActive(zone)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition
                        ${zone.isActive
                          ? 'text-gray-400 hover:bg-amber-50 hover:text-amber-600'
                          : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                    >
                      <i className={`fas fa-${zone.isActive ? 'eye-slash' : 'eye'} text-xs`}></i>
                    </button>
                    <button
                      title="Delete zone"
                      onClick={() => setConfirmDelete(zone)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
