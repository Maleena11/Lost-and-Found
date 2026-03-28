import { useState, useEffect } from 'react';
import axios from 'axios';

// --- Matching helpers ---

/** Normalise a location string into a set of significant words */
function locationWords(str) {
  if (!str) return new Set();
  const STOP = new Set(['the', 'a', 'an', 'at', 'in', 'on', 'of', 'near', 'by', 'and', 'or']);
  return new Set(
    str.toLowerCase().split(/[\s,/\-]+/).filter(w => w.length > 2 && !STOP.has(w))
  );
}

/** Jaccard-style overlap between two word-sets → 0‥1 */
function locationSimilarity(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let common = 0;
  a.forEach(w => { if (b.has(w)) common++; });
  return common / Math.max(a.size, b.size);
}

/** Days between two ISO date strings */
function daysBetween(d1, d2) {
  return Math.abs(new Date(d1) - new Date(d2)) / 86400000;
}

/**
 * Score a (lost, found) pair.
 * Returns null if the pair should be discarded, otherwise a confidence object.
 */
function scorePair(lost, found) {
  // Category must match exactly
  if (!lost.category || lost.category !== found.category) return null;
  // Only consider active/pending items
  if (['returned', 'expired'].includes(lost.status)) return null;
  if (['returned', 'expired'].includes(found.status)) return null;

  const days = daysBetween(lost.createdAt, found.createdAt);
  // Ignore pairs reported more than 90 days apart
  if (days > 90) return null;

  const locA = locationWords(lost.location);
  const locB = locationWords(found.location);
  const locSim = locationSimilarity(locA, locB);

  // Scoring (0‥100)
  let score = 0;

  // Date proximity  (max 40 pts)
  if (days <= 3)       score += 40;
  else if (days <= 7)  score += 32;
  else if (days <= 14) score += 22;
  else if (days <= 30) score += 12;
  else                 score += 4;

  // Location similarity (max 40 pts)
  score += Math.round(locSim * 40);

  // Name word overlap bonus (max 20 pts)
  const nameA = locationWords(lost.itemName);
  const nameB = locationWords(found.itemName);
  const nameSim = locationSimilarity(nameA, nameB);
  score += Math.round(nameSim * 20);

  if (score < 10) return null;   // too weak — discard

  let confidence, color, bg, ring;
  if (score >= 60) {
    confidence = 'High'; color = 'text-emerald-700'; bg = 'bg-emerald-50'; ring = 'ring-emerald-300';
  } else if (score >= 30) {
    confidence = 'Medium'; color = 'text-amber-700'; bg = 'bg-amber-50'; ring = 'ring-amber-300';
  } else {
    confidence = 'Low'; color = 'text-gray-600'; bg = 'bg-gray-50'; ring = 'ring-gray-200';
  }

  return { score, confidence, color, bg, ring, days: Math.round(days) };
}

function formatDate(ds) {
  return new Date(ds).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function ItemCard({ item, label, labelColor, labelBg }) {
  const img = item.images?.[0];
  return (
    <div className="flex items-start gap-3 min-w-0">
      <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden bg-gray-100 border border-gray-200">
        {img ? (
          <img src={img} alt={item.itemName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="fas fa-image text-gray-300 text-sm"></i>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${labelBg} ${labelColor}`}>{label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">{item.category}</span>
        </div>
        <p className="text-sm font-semibold text-gray-800 truncate">{item.itemName}</p>
        {item.location && (
          <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
            <i className="fas fa-map-marker-alt text-gray-300 text-[10px]"></i>
            {item.location}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.createdAt)}</p>
      </div>
    </div>
  );
}

export default function PotentialMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'High' | 'Medium' | 'Low'

  useEffect(() => {
    fetchAndMatch();
  }, []);

  const fetchAndMatch = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('http://localhost:3001/api/lost-found');
      const items = data.data || [];

      const lostItems  = items.filter(i => i.itemType === 'lost');
      const foundItems = items.filter(i => i.itemType === 'found');

      const pairs = [];
      lostItems.forEach(lost => {
        foundItems.forEach(found => {
          const result = scorePair(lost, found);
          if (result) {
            pairs.push({ id: `${lost._id}-${found._id}`, lost, found, ...result });
          }
        });
      });

      // Sort by score desc, keep top 20
      pairs.sort((a, b) => b.score - a.score);
      setMatches(pairs.slice(0, 20));
    } catch (err) {
      console.error('Error computing potential matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all' ? matches : matches.filter(m => m.confidence === filter);

  const counts = {
    all: matches.length,
    High: matches.filter(m => m.confidence === 'High').length,
    Medium: matches.filter(m => m.confidence === 'Medium').length,
    Low: matches.filter(m => m.confidence === 'Low').length,
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
            <i className="fas fa-link text-violet-600 text-sm"></i>
          </span>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Potential Item Matches</h2>
            <p className="text-xs text-gray-400">Lost &amp; found items that may belong together</p>
          </div>
        </div>

        {/* Confidence filter tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {['all', 'High', 'Medium', 'Low'].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setExpanded(null); }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                filter === f ? 'bg-white shadow-sm text-violet-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : f}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                filter === f ? 'bg-violet-100 text-violet-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-gray-400">
          <i className="fas fa-check-circle text-3xl mb-3 text-gray-200"></i>
          <p className="text-sm font-medium">No {filter !== 'all' ? filter.toLowerCase() + '-confidence ' : ''}matches found</p>
          <p className="text-xs mt-1">Matches appear when lost &amp; found items share the same category and location.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {filtered.map(match => {
            const isOpen = expanded === match.id;
            return (
              <li key={match.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : match.id)}
                  className="w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Confidence badge */}
                    <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ring-1 ${match.bg} ${match.color} ${match.ring}`}>
                      {match.confidence}
                    </span>

                    {/* Lost item summary */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="flex-shrink-0 text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">LOST</span>
                          <span className="text-sm font-medium text-gray-800 truncate">{match.lost.itemName}</span>
                        </div>
                        <i className="fas fa-arrows-alt-h text-gray-300 text-xs hidden sm:block flex-shrink-0"></i>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="flex-shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">FOUND</span>
                          <span className="text-sm font-medium text-gray-800 truncate">{match.found.itemName}</span>
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs text-gray-400 capitalize flex items-center gap-1">
                          <i className="fas fa-tag text-gray-300 text-[10px]"></i>
                          {match.lost.category}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <i className="fas fa-calendar-alt text-gray-300 text-[10px]"></i>
                          {match.days === 0 ? 'Same day' : `${match.days}d apart`}
                        </span>
                        {match.lost.location && (
                          <span className="text-xs text-gray-400 truncate flex items-center gap-1">
                            <i className="fas fa-map-marker-alt text-gray-300 text-[10px]"></i>
                            {match.lost.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expand chevron */}
                    <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-gray-300 text-xs flex-shrink-0 transition-transform`}></i>
                  </div>
                </button>

                {/* Expanded detail panel */}
                {isOpen && (
                  <div className={`px-6 pb-5 pt-1 ${match.bg} border-t border-gray-100`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-orange-100">
                        <ItemCard
                          item={match.lost}
                          label="LOST"
                          labelColor="text-orange-700"
                          labelBg="bg-orange-100"
                        />
                        {match.lost.description && (
                          <p className="text-xs text-gray-500 mt-3 line-clamp-2">{match.lost.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-50 text-yellow-700`}>
                            {match.lost.status}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-emerald-100">
                        <ItemCard
                          item={match.found}
                          label="FOUND"
                          labelColor="text-emerald-700"
                          labelBg="bg-emerald-100"
                        />
                        {match.found.description && (
                          <p className="text-xs text-gray-500 mt-3 line-clamp-2">{match.found.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700`}>
                            {match.found.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score breakdown */}
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                      <i className="fas fa-info-circle text-gray-300"></i>
                      Match score <span className="font-semibold text-gray-600">{match.score}/100</span>
                      &mdash; same category, {match.days}d apart
                      {match.lost.location && match.found.location && ', overlapping location'}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
