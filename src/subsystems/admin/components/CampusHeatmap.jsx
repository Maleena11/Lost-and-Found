import { useState, useMemo } from 'react';

// ── Zone catalogue ────────────────────────────────────────────────────────────
// Each zone has an id, display name, floor, visual type, and keyword list used
// to fuzzy-match free-text location strings entered by users.
const ZONES = [
  // Basement
  { id: 'BF-CAN',    name: 'Campus Canteen',         floor: 'BF',  type: 'food',     keywords: ['canteen', 'cafeteria', 'basement canteen', 'bf-can', 'bf can', 'basement'] },
  // 1st floor
  { id: 'F1-A101',   name: 'Lecture Hall A101',       floor: '1F',  type: 'hall',     keywords: ['a101', 'hall a101', 'lecture a101'] },
  { id: 'F1-A102',   name: 'Lecture Hall A102',       floor: '1F',  type: 'hall',     keywords: ['a102', 'hall a102', 'lecture a102'] },
  { id: 'F1-NSTF',   name: 'Staff Rooms (1F)',        floor: '1F',  type: 'admin',    keywords: ['staff room', 'non-academic', 'nstf', '1f staff'] },
  // 2nd floor
  { id: 'F2-CAF',    name: 'Cafe (2F)',               floor: '2F',  type: 'food',     keywords: ['cafe', '2nd floor cafe', 'f2-caf', 'f2 cafe'] },
  { id: 'F2-A201',   name: 'Lecture Hall A201',       floor: '2F',  type: 'hall',     keywords: ['a201', 'hall a201', 'lecture a201'] },
  { id: 'F2-A202',   name: 'Lecture Hall A202',       floor: '2F',  type: 'hall',     keywords: ['a202', 'hall a202', 'lecture a202'] },
  { id: 'F2-A203',   name: 'Lecture Hall A203',       floor: '2F',  type: 'hall',     keywords: ['a203', 'hall a203', 'lecture a203'] },
  { id: 'F2-IGR',    name: 'Indoor Game Room',        floor: '2F',  type: 'shared',   keywords: ['game room', 'indoor game', 'recreation', 'igr', 'game hall'] },
  // 3rd floor
  { id: 'F3-SIS',    name: 'SIS Room',                floor: '3F',  type: 'sis',      keywords: ['sis', 'student information', 'sis room', 'sis counter'] },
  { id: 'F3-A301',   name: 'Lecture Hall A301',       floor: '3F',  type: 'hall',     keywords: ['a301', 'hall a301', 'lecture a301'] },
  { id: 'F3-A302',   name: 'Lecture Hall A302',       floor: '3F',  type: 'hall',     keywords: ['a302', 'hall a302', 'lecture a302'] },
  { id: 'F3-A303',   name: 'Lecture Hall A303',       floor: '3F',  type: 'hall',     keywords: ['a303', 'hall a303', 'lecture a303'] },
  { id: 'F3-A304',   name: 'Lecture Hall A304',       floor: '3F',  type: 'hall',     keywords: ['a304', 'hall a304', 'lecture a304'] },
  // 4th floor
  { id: 'F4-A402',   name: 'Computer Lab A402',       floor: '4F',  type: 'lab',      keywords: ['a402', 'lab a402', 'computer lab a402'] },
  { id: 'F4-A403',   name: 'Computer Lab A403',       floor: '4F',  type: 'lab',      keywords: ['a403', 'lab a403', 'computer lab a403'] },
  { id: 'F4-A404',   name: 'Computer Lab A404',       floor: '4F',  type: 'lab',      keywords: ['a404', 'lab a404', 'computer lab a404'] },
  { id: 'F4-A405',   name: 'Computer Lab A405',       floor: '4F',  type: 'lab',      keywords: ['a405', 'lab a405', 'computer lab a405'] },
  { id: 'F4-A406',   name: 'Lecture Hall A406',       floor: '4F',  type: 'hall',     keywords: ['a406', 'hall a406', 'lecture a406'] },
  // 5th floor
  { id: 'F5-A502',   name: 'Lecture Hall A502',       floor: '5F',  type: 'hall',     keywords: ['a502', 'hall a502', 'lecture a502'] },
  { id: 'F5-A503',   name: 'Lecture Hall A503',       floor: '5F',  type: 'hall',     keywords: ['a503', 'hall a503', 'lecture a503'] },
  { id: 'F5-STU',    name: 'Study Area',              floor: '5F',  type: 'shared',   keywords: ['study area', 'study room', 'reading room', 'study hall', 'f5 study'] },
  { id: 'F5-LIB',    name: 'Library',                 floor: '5F',  type: 'admin',    keywords: ['library', 'lib', 'sliit library'] },
  // 6th floor
  { id: 'F6-MO',     name: 'Main Office',             floor: '6F',  type: 'admin',    keywords: ['main office', 'front office', 'reception', 'f6 office', 'f6-mo'] },
  { id: 'F6-DEAN',   name: "Dean's Office",           floor: '6F',  type: 'admin',    keywords: ['dean', "dean's office", 'dean office', 'principal'] },
  { id: 'F6-ASTF',   name: 'Academic Staff Room',     floor: '6F',  type: 'admin',    keywords: ['academic staff', 'lecturer room', 'f6 staff', 'astf'] },
  { id: 'F6-DIN',    name: 'Staff Dining Area',       floor: '6F',  type: 'food',     keywords: ['staff dining', 'dining area', 'f6 dining'] },
  // Campus grounds
  { id: 'GRD-FIELD', name: 'Open Ground / Parking',   floor: 'GRD', type: 'ground',   keywords: ['ground', 'field', 'outdoor', 'parking', 'campus ground', 'open area'] },
  { id: 'GRD-SEC',   name: 'Security / Main Gate',    floor: 'GRD', type: 'security', keywords: ['security', 'guard room', 'main gate', 'entrance gate', 'grd-sec'] },
];

const ZONE_BY_ID = Object.fromEntries(ZONES.map(z => [z.id, z]));

// ── Location → Zone mapper ────────────────────────────────────────────────────
function mapLocationToZoneId(locationStr) {
  if (!locationStr) return null;
  const loc = locationStr.toLowerCase().trim();
  for (const zone of ZONES) {
    for (const kw of zone.keywords) {
      if (loc.includes(kw)) return zone.id;
    }
  }
  return null;
}

// ── Heatmap colour based on item count ───────────────────────────────────────
function heatStyle(count, maxCount) {
  if (!count || maxCount === 0) return null;
  const r = Math.min(count / maxCount, 1);
  if (r < 0.2)  return { bg: 'rgba(254,243,199,0.85)', border: '#F59E0B', text: '#92400E' }; // amber-100
  if (r < 0.45) return { bg: 'rgba(252,211,77,0.85)',  border: '#D97706', text: '#78350F' }; // amber-300
  if (r < 0.7)  return { bg: 'rgba(249,115,22,0.85)',  border: '#C2410C', text: '#fff'    }; // orange-500
  return             { bg: 'rgba(220,38,38,0.9)',       border: '#991B1B', text: '#fff'    }; // red-600
}

// ── Floor plan definition ─────────────────────────────────────────────────────
const FLOOR_PLAN = [
  {
    id: '6F', label: '6F', sub: 'Admin', labelStyle: { background: '#EEEDFE', borderColor: '#534AB7', color: '#3C3489' },
    rooms: [
      { id: 'F6-MO',   short: 'Main\nOffice' },
      { id: 'F6-DEAN', short: "Dean's\nOffice" },
      { id: 'F6-ASTF', short: 'Academic\nStaff' },
      { id: 'F6-DIN',  short: 'Staff\nDining' },
    ],
  },
  {
    id: '5F', label: '5F', sub: 'Study', labelStyle: { background: '#E6F1FB', borderColor: '#B5D4F4', color: '#0C447C' },
    rooms: [
      { id: 'F5-A502', short: 'A502' },
      { id: 'F5-A503', short: 'A503' },
      { id: 'F5-STU',  short: 'Study\nArea' },
      { id: 'F5-LIB',  short: 'Library' },
    ],
  },
  {
    id: '4F', label: '4F', sub: 'Labs', labelStyle: { background: '#EAF3DE', borderColor: '#3B6D11', color: '#27500A' },
    rooms: [
      { id: 'F4-A402', short: 'A402\nLab' },
      { id: 'F4-A403', short: 'A403\nLab' },
      { id: 'F4-A404', short: 'A404\nLab' },
      { id: 'F4-A405', short: 'A405\nLab' },
      { id: 'F4-A406', short: 'A406\nHall' },
    ],
  },
  {
    id: '3F', label: '3F', sub: 'Halls', labelStyle: { background: '#E6F1FB', borderColor: '#B5D4F4', color: '#0C447C' },
    rooms: [
      { id: 'F3-SIS',  short: 'SIS\nRoom' },
      { id: 'F3-A301', short: 'A301' },
      { id: 'F3-A302', short: 'A302' },
      { id: 'F3-A303', short: 'A303' },
      { id: 'F3-A304', short: 'A304' },
    ],
  },
  {
    id: '2F', label: '2F', sub: 'Halls', labelStyle: { background: '#E6F1FB', borderColor: '#B5D4F4', color: '#0C447C' },
    rooms: [
      { id: 'F2-CAF',  short: 'Cafe' },
      { id: 'F2-A201', short: 'A201' },
      { id: 'F2-A202', short: 'A202' },
      { id: 'F2-A203', short: 'A203' },
      { id: 'F2-IGR',  short: 'Game\nRoom' },
    ],
  },
  {
    id: '1F', label: '1F', sub: 'Entry', labelStyle: { background: '#E6F1FB', borderColor: '#B5D4F4', color: '#0C447C' },
    rooms: [
      { id: 'F1-A101', short: 'A101\nLarge Hall', wide: true },
      { id: 'F1-A102', short: 'A102' },
      { id: 'F1-NSTF', short: 'Staff\nRooms' },
    ],
  },
  {
    id: 'BF', label: 'BF', sub: 'Canteen', labelStyle: { background: '#FAEEDA', borderColor: '#FAC775', color: '#633806' },
    rooms: [
      { id: 'BF-CAN', short: 'Campus Canteen', wide: true },
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function CampusHeatmap({ rawItems = [] }) {
  const [filters, setFilters] = useState({ category: 'all', itemType: 'all', timeRange: 'semester' });
  const [hovered, setHovered] = useState(null); // zone id

  // Apply filters and compute per-zone counts
  const zoneCounts = useMemo(() => {
    let items = rawItems;

    if (filters.category !== 'all') {
      items = items.filter(i => i.category === filters.category);
    }
    if (filters.itemType !== 'all') {
      items = items.filter(i => i.itemType === filters.itemType);
    }
    if (filters.timeRange !== 'all') {
      const ms = { week: 7, month: 30, semester: 120, year: 365 };
      const days = ms[filters.timeRange];
      if (days) {
        const cutoff = Date.now() - days * 86400000;
        items = items.filter(i => new Date(i.createdAt).getTime() >= cutoff);
      }
    }

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
  }, [rawItems, filters]);

  const maxCount = useMemo(
    () => Math.max(1, ...Object.values(zoneCounts.counts).map(z => z.total)),
    [zoneCounts.counts]
  );

  // Sorted hotspot list for sidebar
  const hotspots = useMemo(() => {
    return Object.entries(zoneCounts.counts)
      .map(([id, c]) => ({ id, zone: ZONE_BY_ID[id], ...c }))
      .filter(h => h.zone)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [zoneCounts.counts]);

  const hoveredZone = hovered ? ZONE_BY_ID[hovered] : null;
  const hoveredCounts = hovered ? (zoneCounts.counts[hovered] || { total: 0, lost: 0, found: 0 }) : null;

  const timeLabel = TIME_RANGES.find(t => t.value === filters.timeRange)?.label ?? '';

  function setFilter(key, val) {
    setFilters(prev => ({ ...prev, [key]: val }));
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <i className="fas fa-map-marked-alt text-indigo-600 text-sm"></i>
          </span>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Campus Loss Heatmap</h3>
            <p className="text-xs text-gray-400">SLIIT Kandy — items by zone · {timeLabel}</p>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Item type toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {[['all','All'],['lost','Lost'],['found','Found']].map(([v,l]) => (
              <button
                key={v}
                onClick={() => setFilter('itemType', v)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  filters.itemType === v
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >{l}</button>
            ))}
          </div>

          {/* Category */}
          <select
            value={filters.category}
            onChange={e => setFilter('category', e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
          >
            <option value="all">All categories</option>
            {CATEGORIES.filter(c => c !== 'all').map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace(/-/g,' ')}</option>
            ))}
          </select>

          {/* Time range */}
          <select
            value={filters.timeRange}
            onChange={e => setFilter('timeRange', e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
          >
            {TIME_RANGES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0">

        {/* ── Campus floor plan ── */}
        <div className="flex-1 p-4 overflow-x-auto">
          {/* Colour scale legend */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">Intensity:</span>
            {[
              { label: 'None',   bg: '#F3F4F6', border: '#D1D5DB' },
              { label: 'Low',    bg: 'rgba(254,243,199,0.85)', border: '#F59E0B' },
              { label: 'Medium', bg: 'rgba(252,211,77,0.85)',  border: '#D97706' },
              { label: 'High',   bg: 'rgba(249,115,22,0.85)', border: '#C2410C' },
              { label: 'Peak',   bg: 'rgba(220,38,38,0.9)',   border: '#991B1B' },
            ].map(({ label, bg, border }) => (
              <div key={label} className="flex items-center gap-1">
                <span className="w-4 h-4 rounded border" style={{ background: bg, borderColor: border }}></span>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
            <span className="ml-2 text-xs text-gray-400">
              · {zoneCounts.filteredTotal} item{zoneCounts.filteredTotal !== 1 ? 's' : ''} mapped
              {zoneCounts.unmapped > 0 && <span className="ml-1 text-gray-300">({zoneCounts.unmapped} unrecognised location{zoneCounts.unmapped !== 1 ? 's' : ''})</span>}
            </span>
          </div>

          {/* Building label */}
          <div className="text-center text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg py-1.5 mb-2">
            Main Academic Building — Basement + 6 Floors
          </div>

          {/* Floor rows */}
          <div className="border-2 rounded-xl p-2 space-y-1.5" style={{ borderColor: '#3B6D11', background: '#EAF3DE' }}>
            {FLOOR_PLAN.map(floor => (
              <div key={floor.id} className="flex items-stretch gap-0 min-w-0">
                {/* Floor label */}
                <div
                  className="w-10 flex-shrink-0 flex flex-col items-center justify-center rounded-l-md border text-center py-1 px-0.5"
                  style={floor.labelStyle}
                >
                  <span className="text-xs font-bold leading-tight">{floor.label}</span>
                  <span className="text-[9px] leading-tight opacity-75">{floor.sub}</span>
                </div>

                {/* Entrance bar */}
                <div className="w-5 flex-shrink-0 flex items-center justify-center"
                  style={{ background: '#1D9E75', borderTop: '1px solid #0F6E56', borderBottom: '1px solid #0F6E56' }}>
                  <span className="text-[7px] font-semibold text-white"
                    style={{ writingMode: 'vertical-rl', letterSpacing: '0.05em' }}>ELV</span>
                </div>

                {/* Rooms */}
                <div className="flex-1 flex flex-wrap gap-1 p-1 bg-white border border-blue-200 rounded-r-md items-center">
                  {floor.rooms.map(room => {
                    const zone = ZONE_BY_ID[room.id];
                    const cnt = zoneCounts.counts[room.id];
                    const heat = cnt ? heatStyle(cnt.total, maxCount) : null;
                    const isHov = hovered === room.id;

                    const defaultStyle = zone
                      ? {
                          hall:     { background: '#E6F1FB', borderColor: '#185FA5', color: '#0C447C' },
                          lab:      { background: '#EAF3DE', borderColor: '#3B6D11', color: '#27500A' },
                          food:     { background: '#FAEEDA', borderColor: '#854F0B', color: '#633806' },
                          admin:    { background: '#EEEDFE', borderColor: '#534AB7', color: '#3C3489' },
                          shared:   { background: '#F1EFE8', borderColor: '#5F5E5A', color: '#444441' },
                          sis:      { background: '#FBEAF0', borderColor: '#993556', color: '#72243E' },
                          ground:   { background: '#EAF3DE', borderColor: '#3B6D11', color: '#27500A' },
                          security: { background: '#FCEBEB', borderColor: '#A32D2D', color: '#791F1F' },
                        }[zone.type] || { background: '#F3F4F6', borderColor: '#D1D5DB', color: '#6B7280' }
                      : { background: '#F3F4F6', borderColor: '#D1D5DB', color: '#6B7280' };

                    const style = heat
                      ? { background: heat.bg, borderColor: heat.border, color: heat.text }
                      : defaultStyle;

                    return (
                      <button
                        key={room.id}
                        onMouseEnter={() => setHovered(room.id)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => setHovered(isHov ? null : room.id)}
                        className={`relative rounded-md border text-center leading-tight transition-all duration-150 cursor-pointer
                          ${room.wide ? 'flex-1' : ''} ${isHov ? 'scale-105 z-10 shadow-md' : 'hover:scale-[1.03] hover:shadow-sm'}`}
                        style={{
                          ...style,
                          minHeight: '34px',
                          minWidth: room.wide ? '80px' : '44px',
                          padding: '3px 5px',
                          fontSize: '9px',
                          fontWeight: 500,
                        }}
                      >
                        {/* Count badge */}
                        {cnt && cnt.total > 0 && (
                          <span
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold shadow"
                            style={{ fontSize: '8px', background: heat ? heat.border : '#6366F1', lineHeight: 1 }}
                          >
                            {cnt.total > 9 ? '9+' : cnt.total}
                          </span>
                        )}
                        {room.short.split('\n').map((line, i) => (
                          <span key={i} className="block">{line}</span>
                        ))}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Campus grounds row */}
          <div className="mt-1.5 flex gap-2">
            {[
              { id: 'GRD-FIELD', label: 'Open Ground', icon: 'fa-leaf' },
              { id: 'GRD-SEC',   label: 'Security Gate', icon: 'fa-shield-alt' },
            ].map(g => {
              const cnt = zoneCounts.counts[g.id];
              const heat = cnt ? heatStyle(cnt.total, maxCount) : null;
              const isHov = hovered === g.id;
              const style = heat
                ? { background: heat.bg, borderColor: heat.border, color: heat.text }
                : { background: '#F0FDF4', borderColor: '#86EFAC', color: '#166534' };

              return (
                <button
                  key={g.id}
                  onMouseEnter={() => setHovered(g.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setHovered(isHov ? null : g.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all flex-1
                    ${isHov ? 'scale-[1.02] shadow-md' : 'hover:shadow-sm'}`}
                  style={style}
                >
                  {cnt && cnt.total > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold shadow"
                      style={{ fontSize: '8px', background: heat ? heat.border : '#6366F1' }}
                    >
                      {cnt.total > 9 ? '9+' : cnt.total}
                    </span>
                  )}
                  <i className={`fas ${g.icon} text-xs`}></i>
                  {g.label}
                  {cnt && <span className="ml-auto opacity-70">{cnt.total} items</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Info panel ── */}
        <div className="w-full lg:w-60 border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col">

          {/* Hover info */}
          <div className="p-4 border-b border-gray-100 min-h-[110px]">
            {hoveredZone ? (
              <>
                <p className="text-xs font-mono text-indigo-500 mb-1">{hoveredZone.id}</p>
                <p className="text-sm font-semibold text-gray-800 mb-2">{hoveredZone.name}</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Total items</span>
                    <span className="font-bold text-gray-800">{hoveredCounts.total}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-red-400">Lost</span>
                    <span className="font-semibold text-red-600">{hoveredCounts.lost}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-500">Found</span>
                    <span className="font-semibold text-emerald-600">{hoveredCounts.found}</span>
                  </div>
                </div>
                {hoveredCounts.total > 0 && (
                  <p className="mt-2 text-[10px] text-gray-400 italic">
                    {hoveredZone.name} — {hoveredCounts.total} item{hoveredCounts.total !== 1 ? 's' : ''} {filters.timeRange === 'all' ? 'total' : timeLabel.toLowerCase()}
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-2">
                <i className="fas fa-hand-pointer text-gray-300 text-2xl mb-2"></i>
                <p className="text-xs text-gray-400">Hover or click a zone<br />to see item counts</p>
              </div>
            )}
          </div>

          {/* Hotspot ranking */}
          <div className="p-4 flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Top Hotspots</p>
            {hotspots.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No data for current filters</p>
            ) : (
              <div className="space-y-2">
                {hotspots.map(({ id, zone, total, lost, found }, idx) => (
                  <button
                    key={id}
                    onMouseEnter={() => setHovered(id)}
                    onMouseLeave={() => setHovered(null)}
                    className={`w-full text-left rounded-lg px-2.5 py-2 transition-all ${
                      hovered === id ? 'bg-indigo-50 border border-indigo-200' : 'border border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        idx === 0 ? 'bg-amber-400 text-white' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        idx === 2 ? 'bg-orange-300 text-white' :
                                    'bg-gray-100 text-gray-500'
                      }`}>{idx + 1}</span>
                      <span className="text-xs font-medium text-gray-700 truncate flex-1">{zone?.name}</span>
                      <span className="text-xs font-bold text-indigo-600 flex-shrink-0">{total}</span>
                    </div>
                    <div className="ml-7">
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.round((total / maxCount) * 100)}%`,
                            background: total === maxCount ? '#DC2626' : total / maxCount > 0.6 ? '#F97316' : '#A78BFA',
                          }}
                        />
                      </div>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-[9px] text-red-400">{lost}L</span>
                        <span className="text-[9px] text-emerald-500">{found}F</span>
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
  );
}
