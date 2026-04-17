import { useState, useMemo, useEffect } from 'react';

// ── Zone catalogue (fallback) ─────────────────────────────────────────────────
const ZONES_FALLBACK = [
  { id: 'BF-CAN',    name: 'Campus Canteen',         floor: 'BF',  type: 'food',     keywords: ['canteen', 'cafeteria', 'basement canteen', 'bf-can', 'bf can', 'basement'] },
  { id: 'F1-A101',   name: 'Lecture Hall A101',       floor: '1F',  type: 'hall',     keywords: ['a101', 'hall a101', 'lecture a101'] },
  { id: 'F1-A102',   name: 'Lecture Hall A102',       floor: '1F',  type: 'hall',     keywords: ['a102', 'hall a102', 'lecture a102'] },
  { id: 'F1-NSTF',   name: 'Staff Rooms (1F)',        floor: '1F',  type: 'admin',    keywords: ['staff room', 'non-academic', 'nstf', '1f staff'] },
  { id: 'F2-CAF',    name: 'Cafe (2F)',               floor: '2F',  type: 'food',     keywords: ['cafe', '2nd floor cafe', 'f2-caf', 'f2 cafe'] },
  { id: 'F2-A201',   name: 'Lecture Hall A201',       floor: '2F',  type: 'hall',     keywords: ['a201', 'hall a201', 'lecture a201'] },
  { id: 'F2-A202',   name: 'Lecture Hall A202',       floor: '2F',  type: 'hall',     keywords: ['a202', 'hall a202', 'lecture a202'] },
  { id: 'F2-A203',   name: 'Lecture Hall A203',       floor: '2F',  type: 'hall',     keywords: ['a203', 'hall a203', 'lecture a203'] },
  { id: 'F2-IGR',    name: 'Indoor Game Room',        floor: '2F',  type: 'shared',   keywords: ['game room', 'indoor game', 'recreation', 'igr', 'game hall'] },
  { id: 'F3-SIS',    name: 'SIS Room',                floor: '3F',  type: 'sis',      keywords: ['sis', 'student information', 'sis room', 'sis counter'] },
  { id: 'F3-A301',   name: 'Lecture Hall A301',       floor: '3F',  type: 'hall',     keywords: ['a301', 'hall a301', 'lecture a301'] },
  { id: 'F3-A302',   name: 'Lecture Hall A302',       floor: '3F',  type: 'hall',     keywords: ['a302', 'hall a302', 'lecture a302'] },
  { id: 'F3-A303',   name: 'Lecture Hall A303',       floor: '3F',  type: 'hall',     keywords: ['a303', 'hall a303', 'lecture a303'] },
  { id: 'F3-A304',   name: 'Lecture Hall A304',       floor: '3F',  type: 'hall',     keywords: ['a304', 'hall a304', 'lecture a304'] },
  { id: 'F4-A402',   name: 'Computer Lab A402',       floor: '4F',  type: 'lab',      keywords: ['a402', 'lab a402', 'computer lab a402'] },
  { id: 'F4-A403',   name: 'Computer Lab A403',       floor: '4F',  type: 'lab',      keywords: ['a403', 'lab a403', 'computer lab a403'] },
  { id: 'F4-A404',   name: 'Computer Lab A404',       floor: '4F',  type: 'lab',      keywords: ['a404', 'lab a404', 'computer lab a404'] },
  { id: 'F4-A405',   name: 'Computer Lab A405',       floor: '4F',  type: 'lab',      keywords: ['a405', 'lab a405', 'computer lab a405'] },
  { id: 'F4-A406',   name: 'Lecture Hall A406',       floor: '4F',  type: 'hall',     keywords: ['a406', 'hall a406', 'lecture a406'] },
  { id: 'F5-A502',   name: 'Lecture Hall A502',       floor: '5F',  type: 'hall',     keywords: ['a502', 'hall a502', 'lecture a502'] },
  { id: 'F5-A503',   name: 'Lecture Hall A503',       floor: '5F',  type: 'hall',     keywords: ['a503', 'hall a503', 'lecture a503'] },
  { id: 'F5-STU',    name: 'Study Area',              floor: '5F',  type: 'shared',   keywords: ['study area', 'study room', 'reading room', 'study hall', 'f5 study'] },
  { id: 'F5-LIB',    name: 'Library',                 floor: '5F',  type: 'admin',    keywords: ['library', 'lib', 'sliit library'] },
  { id: 'F6-MO',     name: 'Main Office',             floor: '6F',  type: 'admin',    keywords: ['main office', 'front office', 'reception', 'f6 office', 'f6-mo'] },
  { id: 'F6-DEAN',   name: "Dean's Office",           floor: '6F',  type: 'admin',    keywords: ['dean', "dean's office", 'dean office', 'principal'] },
  { id: 'F6-ASTF',   name: 'Academic Staff Room',     floor: '6F',  type: 'admin',    keywords: ['academic staff', 'lecturer room', 'f6 staff', 'astf'] },
  { id: 'F6-DIN',    name: 'Staff Dining Area',       floor: '6F',  type: 'food',     keywords: ['staff dining', 'dining area', 'f6 dining'] },
  { id: 'GRD-FIELD', name: 'Open Ground / Parking',   floor: 'GRD', type: 'ground',   keywords: ['ground', 'field', 'outdoor', 'parking', 'campus ground', 'open area'] },
  { id: 'GRD-SEC',   name: 'Security / Main Gate',    floor: 'GRD', type: 'security', keywords: ['security', 'guard room', 'main gate', 'entrance gate', 'grd-sec'] },
];

function normaliseZone(z) {
  return { id: z.zoneId ?? z.id, name: z.name, floor: z.floor, type: z.type, keywords: z.keywords };
}

function makeMapper(zones) {
  return function mapLocationToZoneId(locationStr) {
    if (!locationStr) return null;
    const loc = locationStr.toLowerCase().trim();
    for (const zone of zones) {
      for (const kw of zone.keywords) {
        if (loc.includes(kw)) return zone.id;
      }
    }
    return null;
  };
}

function heatLevel(count, maxCount) {
  if (!count || maxCount === 0) return 0;
  const r = Math.min(count / maxCount, 1);
  if (r < 0.2)  return 1;
  if (r < 0.45) return 2;
  if (r < 0.7)  return 3;
  return 4;
}

const HEAT_STYLES = [
  null,
  { bg: 'rgba(254,243,199,0.9)', border: '#F59E0B', text: '#92400E', badge: '#D97706' },
  { bg: 'rgba(253,186,116,0.9)', border: '#EA580C', text: '#7C2D12', badge: '#C2410C' },
  { bg: 'rgba(249,115,22,0.92)', border: '#C2410C', text: '#fff',    badge: '#9A3412' },
  { bg: 'rgba(220,38,38,0.93)',  border: '#991B1B', text: '#fff',    badge: '#7F1D1D' },
];

const ZONE_TYPE_META = {
  hall:     { icon: 'fa-chalkboard-teacher', defaultBg: '#EFF6FF', defaultBorder: '#3B82F6', defaultText: '#1E40AF' },
  lab:      { icon: 'fa-laptop-code',        defaultBg: '#F0FDF4', defaultBorder: '#22C55E', defaultText: '#166534' },
  food:     { icon: 'fa-utensils',           defaultBg: '#FFF7ED', defaultBorder: '#F97316', defaultText: '#9A3412' },
  admin:    { icon: 'fa-building',           defaultBg: '#F5F3FF', defaultBorder: '#8B5CF6', defaultText: '#5B21B6' },
  shared:   { icon: 'fa-users',             defaultBg: '#F8FAFC', defaultBorder: '#94A3B8', defaultText: '#475569' },
  sis:      { icon: 'fa-id-card',           defaultBg: '#FDF2F8', defaultBorder: '#EC4899', defaultText: '#9D174D' },
  ground:   { icon: 'fa-tree',              defaultBg: '#F0FDF4', defaultBorder: '#4ADE80', defaultText: '#166534' },
  security: { icon: 'fa-shield-alt',        defaultBg: '#FFF1F2', defaultBorder: '#FB7185', defaultText: '#9F1239' },
};

// ── Floor plan — rooms grouped into labelled sections (building outline feature) ──
const FLOOR_PLAN = [
  {
    id: '6F', label: '6F', sub: 'Admin',
    accent: { bg: '#5B21B6', light: '#EDE9FE', border: '#7C3AED' },
    sections: [
      { label: 'Admin Offices', rooms: [
        { id: 'F6-MO',   short: 'Main\nOffice' },
        { id: 'F6-DEAN', short: "Dean's\nOffice" },
        { id: 'F6-ASTF', short: 'Academic\nStaff' },
      ]},
      { label: 'Dining', rooms: [
        { id: 'F6-DIN', short: 'Staff\nDining' },
      ]},
    ],
  },
  {
    id: '5F', label: '5F', sub: 'Study',
    accent: { bg: '#1D4ED8', light: '#EFF6FF', border: '#3B82F6' },
    sections: [
      { label: 'Lecture Halls', rooms: [
        { id: 'F5-A502', short: 'A502' },
        { id: 'F5-A503', short: 'A503' },
      ]},
      { label: 'Resources', rooms: [
        { id: 'F5-STU', short: 'Study\nArea' },
        { id: 'F5-LIB', short: 'Library' },
      ]},
    ],
  },
  {
    id: '4F', label: '4F', sub: 'Labs',
    accent: { bg: '#166534', light: '#F0FDF4', border: '#22C55E' },
    sections: [
      { label: 'Computer Labs', rooms: [
        { id: 'F4-A402', short: 'A402\nLab' },
        { id: 'F4-A403', short: 'A403\nLab' },
        { id: 'F4-A404', short: 'A404\nLab' },
        { id: 'F4-A405', short: 'A405\nLab' },
      ]},
      { label: 'Lecture Hall', rooms: [
        { id: 'F4-A406', short: 'A406\nHall' },
      ]},
    ],
  },
  {
    id: '3F', label: '3F', sub: 'Halls',
    accent: { bg: '#1D4ED8', light: '#EFF6FF', border: '#3B82F6' },
    sections: [
      { label: 'SIS', rooms: [
        { id: 'F3-SIS', short: 'SIS\nRoom' },
      ]},
      { label: 'Lecture Halls', rooms: [
        { id: 'F3-A301', short: 'A301' },
        { id: 'F3-A302', short: 'A302' },
        { id: 'F3-A303', short: 'A303' },
        { id: 'F3-A304', short: 'A304' },
      ]},
    ],
  },
  {
    id: '2F', label: '2F', sub: 'Halls',
    accent: { bg: '#1D4ED8', light: '#EFF6FF', border: '#3B82F6' },
    sections: [
      { label: 'Café', rooms: [
        { id: 'F2-CAF', short: 'Cafe' },
      ]},
      { label: 'Lecture Halls', rooms: [
        { id: 'F2-A201', short: 'A201' },
        { id: 'F2-A202', short: 'A202' },
        { id: 'F2-A203', short: 'A203' },
      ]},
      { label: 'Recreation', rooms: [
        { id: 'F2-IGR', short: 'Game\nRoom' },
      ]},
    ],
  },
  {
    id: '1F', label: '1F', sub: 'Entry',
    accent: { bg: '#0369A1', light: '#F0F9FF', border: '#38BDF8' },
    sections: [
      { label: 'Lecture Halls', rooms: [
        { id: 'F1-A101', short: 'A101 — Large Hall', wide: true },
        { id: 'F1-A102', short: 'A102' },
      ]},
      { label: 'Staff', rooms: [
        { id: 'F1-NSTF', short: 'Staff\nRooms' },
      ]},
    ],
  },
  {
    id: 'BF', label: 'BF', sub: 'Canteen',
    accent: { bg: '#9A3412', light: '#FFF7ED', border: '#F97316' },
    sections: [
      { label: 'Food & Beverages', rooms: [
        { id: 'BF-CAN', short: 'Campus Canteen', wide: true },
      ]},
    ],
  },
];

const CATEGORIES = [
  'all','student-id','laptop-tablet','books-notes','stationery','electronics',
  'lab-equipment','sports-equipment','clothing','jewelry','keys','wallet',
  'documents','water-bottle','other',
];

const TIME_RANGES = [
  { value: 'week',     label: 'Last 7 days' },
  { value: 'month',    label: 'Last 30 days' },
  { value: 'semester', label: 'This semester' },
  { value: 'year',     label: 'Last year' },
  { value: 'all',      label: 'All time' },
];

const STATUS_BADGE = {
  pending:  { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400',  label: 'Pending'  },
  claimed:  { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400',   label: 'Claimed'  },
  returned: { bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-400',label: 'Returned' },
  expired:  { bg: 'bg-gray-100',   text: 'text-gray-500',   border: 'border-gray-200',   dot: 'bg-gray-400',   label: 'Expired'  },
};

// ── Cluster Marker (Feature 3) ─────────────────────────────────────────────────
// Pin-shaped marker showing count + lost/found split strip.
// pulse=true adds a scale animation on peak-heat zones.
function ClusterMarker({ count, lost, found, heat, pulse }) {
  const bg      = heat?.badge || '#4F46E5';
  const lostPct = count > 0 ? Math.round((lost  / count) * 100) : 0;
  const fndPct  = count > 0 ? Math.round((found / count) * 100) : 0;

  return (
    <span
      className={`absolute -top-3 -right-2 z-20 flex flex-col items-center pointer-events-none select-none${pulse ? ' cluster-pulse' : ''}`}
    >
      {/* Bubble */}
      <span
        className="min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center text-white font-black shadow-lg border-2 border-white"
        style={{ fontSize: '9px', background: bg, lineHeight: 1 }}
      >
        {count > 99 ? '99+' : count}
      </span>
      {/* Pin tail */}
      <span
        className="w-0 h-0 -mt-px"
        style={{
          borderLeft:  '3px solid transparent',
          borderRight: '3px solid transparent',
          borderTop:   `5px solid ${bg}`,
        }}
      />
      {/* Lost / Found split strip */}
      <span className="flex rounded-full overflow-hidden mt-0.5" style={{ width: '20px', height: '3px' }}>
        <span style={{ width: `${lostPct}%`, background: '#F87171' }} />
        <span style={{ width: `${fndPct}%`,  background: '#34D399' }} />
      </span>
    </span>
  );
}

// ── Item Card ─────────────────────────────────────────────────────────────────
function ItemCard({ item }) {
  const s = STATUS_BADGE[item.status] || STATUS_BADGE.pending;
  const date = new Date(item.dateTime || item.createdAt);
  const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const isLost = item.itemType === 'lost';

  return (
    <div className="flex gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all duration-150 group">
      <div className={`w-11 h-11 rounded-lg flex-shrink-0 overflow-hidden border-2 flex items-center justify-center
        ${isLost ? 'border-red-100 bg-red-50' : 'border-emerald-100 bg-emerald-50'}`}>
        {item.thumbnail ? (
          <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <i className={`fas ${isLost ? 'fa-search text-red-300' : 'fa-box-open text-emerald-300'} text-sm`}></i>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="text-xs font-semibold text-gray-800 truncate leading-snug">{item.itemName}</p>
          <span className={`flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
            isLost ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <span className={`w-1 h-1 rounded-full ${isLost ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
            {isLost ? 'LOST' : 'FOUND'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md px-1.5 py-0.5 font-medium">
            {(item.category || 'other').replace(/-/g, ' ')}
          </span>
          <span className={`inline-flex items-center gap-1 text-[10px] rounded-md px-1.5 py-0.5 border font-medium ${s.bg} ${s.text} ${s.border}`}>
            <span className={`w-1 h-1 rounded-full ${s.dot}`}></span>
            {s.label}
          </span>
          <span className="text-[10px] text-gray-400 ml-auto tabular-nums">{dateStr}</span>
        </div>

        {item.location && (
          <p className="mt-1 text-[10px] text-gray-400 truncate">
            <i className="fas fa-map-marker-alt mr-1 text-indigo-300"></i>{item.location}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Zone Drill-Down Modal ─────────────────────────────────────────────────────
function ZoneDrillModal({ zone, items, onClose }) {
  const [tab, setTab]       = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const displayed = items.filter(item => {
    if (tab !== 'all' && item.itemType !== tab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.itemName?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const lostCount  = items.filter(i => i.itemType === 'lost').length;
  const foundCount = items.filter(i => i.itemType === 'found').length;
  const typeMeta   = ZONE_TYPE_META[zone.type] || ZONE_TYPE_META.shared;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

        <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #F8FAFF 0%, #F1F5FF 100%)' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: typeMeta.defaultBg, border: `1.5px solid ${typeMeta.defaultBorder}` }}>
              <i className={`fas ${typeMeta.icon} text-sm`} style={{ color: typeMeta.defaultText }}></i>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-mono font-bold tracking-wider text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded">
                  {zone.id}
                </span>
                <span className="text-[9px] text-gray-400 font-medium">{zone.floor}</span>
              </div>
              <h3 className="text-sm font-bold text-gray-800 leading-snug truncate">{zone.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500 font-medium">{items.length} reports total</span>
                <span className="flex items-center gap-1 text-[10px] text-red-500 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>{lostCount} lost
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>{foundCount} found
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition flex-shrink-0"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>

          {items.length > 0 && (
            <div className="mt-3">
              <div className="flex rounded-full overflow-hidden h-1.5 bg-gray-100">
                <div className="bg-red-400 transition-all duration-700" style={{ width: `${(lostCount / items.length) * 100}%` }}></div>
                <div className="bg-emerald-400 transition-all duration-700" style={{ width: `${(foundCount / items.length) * 100}%` }}></div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pt-3 pb-3 border-b border-gray-100 flex items-center gap-2 flex-shrink-0 bg-white">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {[
              { v: 'all',   l: `All (${items.length})` },
              { v: 'lost',  l: `Lost (${lostCount})` },
              { v: 'found', l: `Found (${foundCount})` },
            ].map(({ v, l }) => (
              <button
                key={v}
                onClick={() => setTab(v)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  tab === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >{l}</button>
            ))}
          </div>
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 text-xs pointer-events-none"></i>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items…"
              className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 bg-gray-50/50">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-400">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <i className="fas fa-inbox text-2xl opacity-50"></i>
              </div>
              <p className="text-sm font-medium">No items match</p>
              <p className="text-xs text-gray-400 mt-0.5">Try adjusting the filter</p>
            </div>
          ) : (
            displayed.map(item => <ItemCard key={item._id} item={item} />)
          )}
        </div>

        {displayed.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-white flex-shrink-0">
            <p className="text-[10px] text-gray-400 text-center">
              Showing <span className="font-semibold text-gray-600">{displayed.length}</span> of <span className="font-semibold text-gray-600">{items.length}</span> items at {zone.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CampusHeatmap({ rawItems = [] }) {
  const [filters, setFilters]       = useState({ category: 'all', itemType: 'all', timeRange: 'semester' });
  const [hovered, setHovered]       = useState(null);
  const [drillZone, setDrillZone]   = useState(null);
  const [zones, setZones]           = useState(ZONES_FALLBACK.map(normaliseZone));
  // Feature 1 — timeline animation
  const [isPlaying, setIsPlaying]   = useState(false);
  const [animFrame, setAnimFrame]   = useState(null); // null = not in animation mode
  // Feature 2 — full room labels toggle
  const [showLabels, setShowLabels] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/zones')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          setZones(json.data.map(normaliseZone));
        }
      })
      .catch(() => {});
  }, []);

  const zoneById            = useMemo(() => Object.fromEntries(zones.map(z => [z.id, z])), [zones]);
  const mapLocationToZoneId = useMemo(() => makeMapper(zones), [zones]);

  // Feature 1 — weekly animation frames across a 120-day semester (~17 frames)
  const animFrames = useMemo(() => {
    const semDays = 120;
    const now     = Date.now();
    const start   = now - semDays * 86400000;
    const weeks   = Math.ceil(semDays / 7);
    return Array.from({ length: weeks }, (_, w) => {
      const cutoff = Math.min(start + (w + 1) * 7 * 86400000, now);
      return {
        cutoff,
        label: new Date(cutoff).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      };
    });
  }, []);

  // Feature 1 — auto-advance timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setAnimFrame(prev => {
        const next = prev === null ? 0 : prev + 1;
        if (next >= animFrames.length) {
          setIsPlaying(false);
          return null;
        }
        return next;
      });
    }, 750);
    return () => clearInterval(timer);
  }, [isPlaying, animFrames.length]);

  // ── Shared filter helper (respects animation frame) ──────────────────────────
  function applyFilters(items) {
    if (filters.category !== 'all') items = items.filter(i => i.category === filters.category);
    if (filters.itemType !== 'all') items = items.filter(i => i.itemType === filters.itemType);

    if (animFrame !== null) {
      const semStart    = Date.now() - 120 * 86400000;
      const frameCutoff = animFrames[animFrame]?.cutoff ?? Date.now();
      items = items.filter(i => {
        const t = new Date(i.createdAt).getTime();
        return t >= semStart && t <= frameCutoff;
      });
    } else if (filters.timeRange !== 'all') {
      const days = { week: 7, month: 30, semester: 120, year: 365 }[filters.timeRange];
      if (days) {
        const cutoff = Date.now() - days * 86400000;
        items = items.filter(i => new Date(i.createdAt).getTime() >= cutoff);
      }
    }
    return items;
  }

  const zoneCounts = useMemo(() => {
    const items = applyFilters([...rawItems]);
    const counts = {};
    let unmapped = 0;
    items.forEach(item => {
      const zid = mapLocationToZoneId(item.location);
      if (!zid) { unmapped++; return; }
      if (!counts[zid]) counts[zid] = { total: 0, lost: 0, found: 0 };
      counts[zid].total++;
      if (item.itemType === 'lost') counts[zid].lost++;
      else counts[zid].found++;
    });
    return { counts, unmapped, filteredTotal: items.length };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawItems, filters, mapLocationToZoneId, animFrame, animFrames]);

  const maxCount = useMemo(
    () => Math.max(1, ...Object.values(zoneCounts.counts).map(z => z.total)),
    [zoneCounts.counts]
  );

  const hotspots = useMemo(() => {
    return Object.entries(zoneCounts.counts)
      .map(([id, c]) => ({ id, zone: zoneById[id], ...c }))
      .filter(h => h.zone)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [zoneCounts.counts, zoneById]);

  const drillItems = useMemo(() => {
    if (!drillZone) return [];
    return applyFilters([...rawItems])
      .filter(i => mapLocationToZoneId(i.location) === drillZone.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drillZone, rawItems, filters, mapLocationToZoneId, animFrame, animFrames]);

  const hoveredZone   = hovered ? zoneById[hovered] : null;
  const hoveredCounts = hovered ? (zoneCounts.counts[hovered] || { total: 0, lost: 0, found: 0 }) : null;
  const timeLabel     = animFrame !== null
    ? `Week ${animFrame + 1} · ${animFrames[animFrame]?.label}`
    : (TIME_RANGES.find(t => t.value === filters.timeRange)?.label ?? '');

  function setFilter(key, val) {
    setFilters(prev => ({ ...prev, [key]: val }));
  }

  const totalLost   = rawItems.filter(i => i.itemType === 'lost').length;
  const totalFound  = rawItems.filter(i => i.itemType === 'found').length;
  const activeZones = Object.keys(zoneCounts.counts).length;

  return (
    <>
      {/* ── Keyframe CSS for cluster pulse animation ── */}
      <style>{`
        @keyframes clusterPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.25); }
        }
        .cluster-pulse > span:first-child {
          animation: clusterPulse 1.3s ease-in-out infinite;
          display: inline-flex;
        }
      `}</style>

      {drillZone && (
        <ZoneDrillModal zone={drillZone} items={drillItems} onClose={() => setDrillZone(null)} />
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #FAFBFF 0%, #F3F4FF 100%)' }}>
          <div className="flex flex-wrap items-center justify-between gap-4">

            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-sm flex-shrink-0">
                <i className="fas fa-map-marked-alt text-white text-sm"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800 leading-tight">Campus Loss Heatmap</h3>
                <p
                  className="text-[11px] leading-tight mt-0.5"
                  style={{ color: animFrame !== null ? '#6366F1' : '#9CA3AF' }}
                >
                  SLIIT Kandy · {timeLabel}
                </p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                <span className="text-xs font-semibold text-red-600">{totalLost} Lost</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-semibold text-emerald-600">{totalFound} Found</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg">
                <i className="fas fa-map-pin text-indigo-400 text-[10px]"></i>
                <span className="text-xs font-semibold text-indigo-600">{activeZones} active zones</span>
              </div>
            </div>
          </div>

          {/* ── Filter bar ── */}
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            {/* Item type toggle */}
            <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
              {[['all', 'All'], ['lost', 'Lost'], ['found', 'Found']].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setFilter('itemType', v)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    filters.itemType === v
                      ? v === 'lost'  ? 'bg-red-500 text-white shadow-sm'
                      : v === 'found' ? 'bg-emerald-500 text-white shadow-sm'
                      :                 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >{l}</button>
              ))}
            </div>

            {/* Category */}
            <select
              value={filters.category}
              onChange={e => setFilter('category', e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 cursor-pointer shadow-sm"
            >
              <option value="all">All categories</option>
              {CATEGORIES.filter(c => c !== 'all').map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace(/-/g, ' ')}</option>
              ))}
            </select>

            {/* Time range — disabled during animation */}
            <select
              value={filters.timeRange}
              onChange={e => setFilter('timeRange', e.target.value)}
              disabled={animFrame !== null}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {TIME_RANGES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            {/* Feature 2 — Labels toggle */}
            <button
              onClick={() => setShowLabels(v => !v)}
              title="Toggle full room names"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition shadow-sm ${
                showLabels
                  ? 'bg-violet-600 text-white border-violet-600 shadow-violet-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fas fa-tag text-[10px]"></i>
              Labels
            </button>

            <span className="ml-auto text-[10px] text-gray-400">
              <span className="font-semibold text-gray-600">{zoneCounts.filteredTotal}</span> items mapped
              {zoneCounts.unmapped > 0 && (
                <span className="ml-1.5 text-gray-300">· {zoneCounts.unmapped} unrecognised</span>
              )}
            </span>
          </div>
        </div>

        {/* ── Feature 1: Timeline / Animation Controls ── */}
        <div className="px-5 py-3 border-b border-gray-100" style={{ background: '#F8FAFF' }}>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">Timeline</span>

            {/* Play */}
            <button
              onClick={() => { if (animFrame === null) setAnimFrame(0); setIsPlaying(true); }}
              disabled={isPlaying}
              title="Play animation"
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white shadow-sm transition flex-shrink-0"
            >
              <i className="fas fa-play text-[9px]"></i>
            </button>

            {/* Pause */}
            <button
              onClick={() => setIsPlaying(false)}
              disabled={!isPlaying}
              title="Pause"
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-gray-500 shadow-sm transition flex-shrink-0"
            >
              <i className="fas fa-pause text-[9px]"></i>
            </button>

            {/* Reset */}
            <button
              onClick={() => { setIsPlaying(false); setAnimFrame(null); }}
              title="Reset to filter view"
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 shadow-sm transition flex-shrink-0"
            >
              <i className="fas fa-stop text-[9px]"></i>
            </button>

            {/* Scrubber */}
            <input
              type="range"
              min={0}
              max={animFrames.length - 1}
              value={animFrame ?? 0}
              onChange={e => { setIsPlaying(false); setAnimFrame(Number(e.target.value)); }}
              className="flex-1 accent-indigo-600 cursor-pointer"
              style={{ height: '6px' }}
            />

            {/* Frame label */}
            <span
              className="text-[10px] font-bold w-16 text-right flex-shrink-0 tabular-nums"
              style={{ color: animFrame !== null ? '#6366F1' : '#D1D5DB' }}
            >
              {animFrame !== null ? animFrames[animFrame]?.label : 'Not set'}
            </span>
          </div>

          <p className="text-[9px] mt-1.5 text-center" style={{ color: animFrame !== null ? '#818CF8' : '#9CA3AF' }}>
            {animFrame !== null
              ? `Week ${animFrame + 1} of ${animFrames.length} — cumulative hotspot build-up since semester start`
              : 'Press ▶ to watch hotspots evolve across the semester'
            }
          </p>
        </div>

        <div className="flex flex-col lg:flex-row">

          {/* ── Floor Plan ── */}
          <div className="flex-1 p-5 overflow-x-auto">

            {/* Heat legend */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0">Heat Scale</span>
              <div className="flex items-center gap-1.5 flex-1">
                {[
                  { label: 'None',   bg: '#F3F4F6',             border: '#E5E7EB' },
                  { label: 'Low',    bg: 'rgba(254,243,199,0.9)',border: '#F59E0B' },
                  { label: 'Medium', bg: 'rgba(253,186,116,0.9)',border: '#EA580C' },
                  { label: 'High',   bg: 'rgba(249,115,22,0.92)',border: '#C2410C' },
                  { label: 'Peak',   bg: 'rgba(220,38,38,0.93)', border: '#991B1B' },
                ].map(({ label, bg, border }) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded" style={{ background: bg, border: `1.5px solid ${border}` }}></span>
                    <span className="text-[10px] text-gray-500 hidden sm:inline">{label}</span>
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-gray-400 flex-shrink-0">Click zone to explore</span>
            </div>

            {/* Feature 2 — Building outline header with blueprint corner markers */}
            <div className="relative mb-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-dashed border-indigo-300"></div>
              </div>
              <div className="relative flex justify-between items-center">
                <span className="w-3 h-3 rounded-sm bg-indigo-200 border-2 border-indigo-400 flex-shrink-0"></span>
                <span className="px-4 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full tracking-wider">
                  MAIN ACADEMIC BUILDING — BASEMENT + 6 FLOORS
                </span>
                <span className="w-3 h-3 rounded-sm bg-indigo-200 border-2 border-indigo-400 flex-shrink-0"></span>
              </div>
            </div>

            {/* Feature 2 — Floor rows with section dividers (building outline) */}
            <div
              className="rounded-xl overflow-hidden shadow-sm"
              style={{ border: '2px solid #818CF8', boxShadow: '0 0 0 1px #E0E7FF, 0 4px 12px rgba(99,102,241,0.08)' }}
            >
              {FLOOR_PLAN.map((floor, floorIdx) => (
                <div
                  key={floor.id}
                  className="flex items-stretch"
                  style={{ borderBottom: floorIdx < FLOOR_PLAN.length - 1 ? '1px solid #E0E7FF' : 'none' }}
                >
                  {/* Floor label */}
                  <div
                    className="w-12 flex-shrink-0 flex flex-col items-center justify-center text-center py-2 px-1"
                    style={{ background: floor.accent.light, borderRight: `2px solid ${floor.accent.border}` }}
                  >
                    <span className="text-[11px] font-black leading-tight" style={{ color: floor.accent.bg }}>{floor.label}</span>
                    <span className="text-[8px] leading-tight font-medium mt-0.5" style={{ color: floor.accent.bg, opacity: 0.75 }}>{floor.sub}</span>
                  </div>

                  {/* ELV shaft */}
                  <div
                    className="w-6 flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'linear-gradient(180deg, #1D9E75 0%, #0F6E56 100%)', borderRight: '1px solid #0A5242' }}
                  >
                    <span
                      className="text-[7px] font-bold text-white tracking-widest select-none"
                      style={{ writingMode: 'vertical-rl' }}
                    >ELV</span>
                  </div>

                  {/* Feature 2 — Sections with labelled dividers */}
                  <div className="flex-1 flex gap-0 p-2 items-start flex-wrap" style={{ background: '#FAFBFF' }}>
                    {floor.sections.map((section, sIdx) => (
                      <div
                        key={section.label}
                        className={`flex flex-col gap-1 ${sIdx > 0 ? 'border-l border-dashed border-indigo-200 pl-2 ml-1' : ''}`}
                      >
                        {/* Section label — building outline feature */}
                        <div className="flex items-center gap-1 px-0.5">
                          <span className="text-[7px] font-bold text-indigo-300 uppercase tracking-wider whitespace-nowrap leading-none">
                            {section.label}
                          </span>
                          <span className="flex-1 h-px bg-indigo-100 min-w-[6px]"></span>
                        </div>

                        {/* Rooms */}
                        <div className="flex flex-wrap gap-1.5">
                          {section.rooms.map(room => {
                            const zone     = zoneById[room.id];
                            const cnt      = zoneCounts.counts[room.id];
                            const level    = cnt ? heatLevel(cnt.total, maxCount) : 0;
                            const heat     = HEAT_STYLES[level];
                            const typeMeta = zone ? (ZONE_TYPE_META[zone.type] || ZONE_TYPE_META.shared) : null;
                            const isHov    = hovered === room.id;
                            const isPulse  = level === 4; // peak = pulse

                            const baseStyle = typeMeta
                              ? { background: typeMeta.defaultBg, borderColor: typeMeta.defaultBorder, color: typeMeta.defaultText }
                              : { background: '#F3F4F6', borderColor: '#D1D5DB', color: '#6B7280' };
                            const style = heat
                              ? { background: heat.bg, borderColor: heat.border, color: heat.text }
                              : baseStyle;

                            // Feature 2 — full label when showLabels is on
                            const displayLines = showLabels && zone?.name
                              ? [zone.name]
                              : room.short.split('\n');

                            return (
                              <button
                                key={room.id}
                                onMouseEnter={() => setHovered(room.id)}
                                onMouseLeave={() => setHovered(null)}
                                onClick={() => zone && cnt?.total > 0 ? setDrillZone(zone) : setHovered(isHov ? null : room.id)}
                                title={cnt?.total > 0 ? `${zone?.name}: ${cnt.total} item${cnt.total !== 1 ? 's' : ''}` : zone?.name}
                                className={`relative rounded-lg border-2 text-center leading-tight transition-all duration-150 cursor-pointer select-none
                                  ${room.wide ? 'flex-1' : ''}
                                  ${isHov ? 'scale-[1.07] z-10 shadow-lg ring-2 ring-indigo-300' : 'hover:scale-[1.04] hover:shadow-md hover:z-10'}`}
                                style={{
                                  ...style,
                                  minHeight: '38px',
                                  minWidth: room.wide ? '90px' : '48px',
                                  padding: '4px 6px',
                                  fontSize: '9px',
                                  fontWeight: 600,
                                  letterSpacing: '0.01em',
                                }}
                              >
                                {/* Feature 3 — Cluster marker replaces plain badge */}
                                {cnt && cnt.total > 0 && (
                                  <ClusterMarker
                                    count={cnt.total}
                                    lost={cnt.lost}
                                    found={cnt.found}
                                    heat={heat}
                                    pulse={isPulse}
                                  />
                                )}
                                {displayLines.map((line, i) => (
                                  <span key={i} className={`block ${showLabels ? 'truncate max-w-[72px]' : ''}`}>{line}</span>
                                ))}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Campus grounds */}
            <div className="mt-3">
              <div className="relative mb-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dashed border-green-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 py-0.5 text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full tracking-wider">
                    CAMPUS GROUNDS
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {[
                  { id: 'GRD-FIELD', label: 'Open Ground / Parking', icon: 'fa-tree' },
                  { id: 'GRD-SEC',   label: 'Security Gate',         icon: 'fa-shield-alt' },
                ].map(g => {
                  const cnt        = zoneCounts.counts[g.id];
                  const level      = cnt ? heatLevel(cnt.total, maxCount) : 0;
                  const heat       = HEAT_STYLES[level];
                  const isHov      = hovered === g.id;
                  const groundZone = zoneById[g.id];
                  const isPulse    = level === 4;

                  const style = heat
                    ? { background: heat.bg, borderColor: heat.border, color: heat.text }
                    : { background: '#F0FDF4', borderColor: '#86EFAC', color: '#166534' };

                  const displayLabel = showLabels && groundZone?.name ? groundZone.name : g.label;

                  return (
                    <button
                      key={g.id}
                      onMouseEnter={() => setHovered(g.id)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => groundZone && cnt?.total > 0 ? setDrillZone(groundZone) : setHovered(isHov ? null : g.id)}
                      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all flex-1
                        ${isHov ? 'scale-[1.02] shadow-lg ring-2 ring-green-200' : 'hover:shadow-md'}`}
                      style={style}
                    >
                      {/* Feature 3 — Cluster marker on grounds too */}
                      {cnt && cnt.total > 0 && (
                        <ClusterMarker
                          count={cnt.total}
                          lost={cnt.lost}
                          found={cnt.found}
                          heat={heat}
                          pulse={isPulse}
                        />
                      )}
                      <i className={`fas ${g.icon} text-xs`}></i>
                      <span>{displayLabel}</span>
                      {cnt && cnt.total > 0 && (
                        <span className="ml-auto opacity-80 text-[10px] font-bold">{cnt.total} items</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Info Panel ── */}
          <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col">

            {/* Zone detail on hover */}
            <div className="p-4 border-b border-gray-100 min-h-[130px] flex flex-col justify-center">
              {hoveredZone ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: (ZONE_TYPE_META[hoveredZone.type] || ZONE_TYPE_META.shared).defaultBg,
                        border: `1.5px solid ${(ZONE_TYPE_META[hoveredZone.type] || ZONE_TYPE_META.shared).defaultBorder}`,
                      }}>
                      <i className={`fas ${(ZONE_TYPE_META[hoveredZone.type] || ZONE_TYPE_META.shared).icon} text-[10px]`}
                        style={{ color: (ZONE_TYPE_META[hoveredZone.type] || ZONE_TYPE_META.shared).defaultText }}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-mono font-bold text-indigo-400 leading-none">{hoveredZone.id}</p>
                      <p className="text-xs font-bold text-gray-800 leading-snug truncate">{hoveredZone.name}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">Total items</span>
                      <span className="text-xs font-black text-gray-800">{hoveredCounts.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[11px] text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>Lost
                      </span>
                      <span className="text-xs font-semibold text-red-600">{hoveredCounts.lost}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[11px] text-emerald-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Found
                      </span>
                      <span className="text-xs font-semibold text-emerald-600">{hoveredCounts.found}</span>
                    </div>

                    {hoveredCounts.total > 0 && (
                      <div className="pt-1">
                        <div className="flex rounded-full overflow-hidden h-1.5 bg-gray-100">
                          <div className="bg-red-400" style={{ width: `${(hoveredCounts.lost / hoveredCounts.total) * 100}%` }}></div>
                          <div className="bg-emerald-400" style={{ width: `${(hoveredCounts.found / hoveredCounts.total) * 100}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {hoveredCounts.total > 0 && (
                    <button
                      onClick={() => setDrillZone(hoveredZone)}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold transition shadow-sm"
                    >
                      <i className="fas fa-list text-[10px]"></i>
                      View {hoveredCounts.total} item{hoveredCounts.total !== 1 ? 's' : ''}
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                    <i className="fas fa-hand-pointer text-gray-300 text-lg"></i>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Hover a zone to preview<br />
                    <span className="text-indigo-400 font-medium">Click</span> to explore items
                  </p>
                </div>
              )}
            </div>

            {/* Hotspot ranking */}
            <div className="p-4 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <i className="fas fa-fire text-orange-400 text-xs"></i>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Top Hotspots</p>
              </div>

              {hotspots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <i className="fas fa-map-pin text-gray-200 text-2xl mb-2"></i>
                  <p className="text-xs text-gray-400">No data for current filters</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {hotspots.map(({ id, zone, total, lost, found }, idx) => (
                    <button
                      key={id}
                      onMouseEnter={() => setHovered(id)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => zone && setDrillZone(zone)}
                      className={`w-full text-left rounded-xl px-3 py-2 transition-all duration-150 ${
                        hovered === id
                          ? 'bg-indigo-50 border border-indigo-200 shadow-sm'
                          : 'border border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 shadow-sm ${
                          idx === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white' :
                          idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                          idx === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white' :
                                      'bg-gray-100 text-gray-500'
                        }`}>{idx + 1}</span>
                        <span className="text-[11px] font-semibold text-gray-700 truncate flex-1 leading-snug">{zone?.name}</span>
                        <span className="text-xs font-black text-indigo-600 flex-shrink-0">{total}</span>
                      </div>
                      <div className="pl-7">
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.round((total / maxCount) * 100)}%`,
                              background: total === maxCount
                                ? 'linear-gradient(90deg, #DC2626, #EF4444)'
                                : total / maxCount > 0.6
                                  ? 'linear-gradient(90deg, #EA580C, #F97316)'
                                  : 'linear-gradient(90deg, #6366F1, #818CF8)',
                            }}
                          />
                        </div>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-[9px] font-semibold text-red-400">{lost} lost</span>
                          <span className="text-[9px] font-semibold text-emerald-500">{found} found</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
