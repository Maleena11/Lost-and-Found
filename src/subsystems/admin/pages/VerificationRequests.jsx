import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import TopBar from '../components/TopBar';
import { CSVLink } from 'react-csv';
import { useSocket } from '../../../shared/hooks/useSocket';

const EMPTY_STAGES = {
  stage1: { status: 'pending', notes: '' },
  stage2: { status: 'pending', notes: '' },
  stage3: { status: 'pending', notes: '' }
};

const REJECTION_REASONS = {
  stage1: [
    "Description doesn't match item",
    "Category mismatch",
    "Location details don't match",
    "Date / time inconsistency",
    "Not enough detail provided",
  ],
  stage2: [
    "Ownership proof insufficient",
    "Proof document unclear or unverifiable",
    "Photos don't match item",
    "Identity not verified",
    "No supporting evidence submitted",
  ],
  stage3: [
    "Insufficient overall evidence",
    "Stronger claim exists for this item",
    "Suspicious or duplicate submission",
    "Claimant unresponsive",
    "Other (see notes)",
  ],
};

// ── In-modal photo gallery panel ───────────────────────────────────────────
function PhotoGalleryPanel({ images, activeIdx, setActiveIdx, accentColor, label, onLightboxOpen }) {
  const ring   = accentColor === 'teal' ? 'ring-teal-400 border-teal-400'   : 'ring-amber-400 border-amber-400';
  const empty  = accentColor === 'teal' ? 'bg-teal-50/60 border-teal-100'   : 'bg-amber-50/60 border-amber-100';

  if (!images || images.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-44 gap-2.5 rounded-xl border ${empty}`}>
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
          <i className="fas fa-image text-slate-300 text-lg"></i>
        </div>
        <p className="text-xs text-slate-400 font-medium">No photos submitted</p>
      </div>
    );
  }

  return (
    <div>
      {/* Main photo */}
      <div
        className="relative rounded-xl overflow-hidden cursor-zoom-in bg-slate-900 border border-slate-400 mb-2.5 group"
        style={{ aspectRatio: '4/3' }}
        onClick={() => onLightboxOpen(images, activeIdx, label)}
      >
        <img
          src={images[activeIdx]}
          alt={`${label} ${activeIdx + 1}`}
          className="w-full h-full object-contain select-none"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
          <div className="w-9 h-9 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <i className="fas fa-expand text-white text-xs"></i>
          </div>
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/55 text-white text-[10px] font-mono px-2 py-0.5 rounded-full pointer-events-none">
            {activeIdx + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`shrink-0 w-11 h-11 rounded-lg overflow-hidden border-2 transition-all ring-offset-1 ${
                i === activeIdx
                  ? `${ring} ring-1 opacity-100`
                  : 'border-transparent opacity-45 hover:opacity-75'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Side-by-side Claim Comparison Modal ──────────────────────────────────
function ClaimCompareModal({ claimA, claimB, onClose }) {
  const [photoIdxA, setPhotoIdxA] = useState(0);
  const [photoIdxB, setPhotoIdxB] = useState(0);
  const [lightbox, setLightbox]   = useState({ open: false, images: [], index: 0, label: '' });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (lightbox.open) setLightbox(p => ({ ...p, open: false }));
        else onClose();
      }
      if (!lightbox.open) return;
      if (e.key === 'ArrowRight') setLightbox(p => ({ ...p, index: (p.index + 1) % p.images.length }));
      if (e.key === 'ArrowLeft')  setLightbox(p => ({ ...p, index: (p.index - 1 + p.images.length) % p.images.length }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox.open, onClose]);

  const openLb = (imgs, idx, lbl) => setLightbox({ open: true, images: imgs, index: idx, label: lbl });

  const statusStyles = {
    pending:   'bg-amber-50 text-amber-600 border-amber-200',
    approved:  'bg-emerald-50 text-emerald-600 border-emerald-200',
    rejected:  'bg-rose-50 text-rose-600 border-rose-200',
    processed: 'bg-sky-50 text-sky-600 border-sky-200',
  };

  const ClaimColumn = ({ claim, accent, photoIdx, setPhotoIdx }) => {
    const photos = claim.claimantImages || [];
    const recommendation = claim?.recommendation || null;
    const engineScore = recommendation?.score ?? computeConfidenceScore(claim).total;
    const engineBand =
      recommendation?.band ||
      (engineScore >= 70 ? 'High' : engineScore >= 40 ? 'Medium' : 'Low');
    const engineAction =
      recommendation?.actionLabel ||
      (engineBand === 'High' ? 'Approve Candidate' : engineBand === 'Medium' ? 'Manual Review' : 'Needs More Evidence');
    const accentMap = {
      blue:   { bar: 'bg-blue-500', head: 'bg-gradient-to-br from-blue-50 to-white border-blue-100', icon: 'bg-blue-100 text-blue-500', label: 'text-blue-700 bg-blue-50 border-blue-200' },
      violet: { bar: 'bg-violet-500', head: 'bg-gradient-to-br from-violet-50 to-white border-violet-100', icon: 'bg-violet-100 text-violet-500', label: 'text-violet-700 bg-violet-50 border-violet-200' },
    };
    const a = accentMap[accent];
    const engineTheme = {
      High: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Medium: 'bg-amber-50 text-amber-700 border-amber-200',
      Low: 'bg-red-50 text-red-700 border-red-200',
    }[engineBand];

    return (
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Claimant header card */}
        <div className={`rounded-xl border p-4 shadow-sm ${a.head}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-[3px] h-4 ${a.bar} rounded-full`}></div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Claimant</p>
            <span className={`ml-auto text-[10px] font-semibold border px-2 py-0.5 rounded-full capitalize ${statusStyles[claim.status] || statusStyles.processed}`}>
              {claim.status}
            </span>
          </div>
          <div className="space-y-2.5">
            {[
              { icon: 'fa-user',     val: claim.claimantInfo.name },
              { icon: 'fa-envelope', val: claim.claimantInfo.email },
              { icon: 'fa-phone',    val: claim.claimantInfo.phone },
              { icon: 'fa-building', val: claim.claimantInfo.address },
            ].map(({ icon, val }) => val ? (
              <div key={icon} className="flex items-center gap-2.5">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${a.icon}`}>
                  <i className={`fas ${icon} text-[10px]`}></i>
                </div>
                <p className="text-sm text-slate-700 font-medium truncate">{val}</p>
              </div>
            ) : null)}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400">
            <i className="fas fa-clock text-[10px]"></i>
            {new Date(claim.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        {/* Engine rate */}
        <div className="bg-white border border-slate-400 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Engine Rate</p>
              <p className="text-[10px] text-slate-400 mt-1">Claim recommendation score</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${engineTheme}`}>
              <i className="fas fa-gauge-high text-[10px]"></i>
              {engineBand}
            </span>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="text-3xl font-extrabold tabular-nums text-slate-800 leading-none">
              {engineScore}
              <span className="text-sm font-medium text-slate-400">/100</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 text-right">
              {engineAction}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white border border-slate-400 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Item Description</p>
          <p className="text-sm text-slate-700 leading-relaxed">{claim.verificationDetails.description || <span className="text-slate-300 italic">None provided</span>}</p>
        </div>

        {/* Ownership Proof */}
        <div className="bg-white border border-slate-400 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Ownership Proof</p>
          <p className="text-sm text-slate-700 leading-relaxed">{claim.verificationDetails.ownershipProof || <span className="text-slate-300 italic">None provided</span>}</p>
        </div>

        {/* Additional Info */}
        {claim.verificationDetails.additionalInfo && (
          <div className="bg-white border border-slate-400 rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Additional Info</p>
            <p className="text-sm text-slate-700 leading-relaxed">{claim.verificationDetails.additionalInfo}</p>
          </div>
        )}

        {/* Photos */}
        <div className="bg-white border border-slate-400 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Photos
            <span className="ml-2 text-slate-300 normal-case font-normal">{photos.length} submitted</span>
          </p>
          <PhotoGalleryPanel
            images={photos}
            activeIdx={photoIdx}
            setActiveIdx={setPhotoIdx}
            accentColor={accent === 'blue' ? 'teal' : 'amber'}
            label="Claimant's Photos"
            onLightboxOpen={openLb}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[55] p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#0f1f3d] via-[#1a3560] to-[#1e4d8c] px-7 py-5 shrink-0 overflow-hidden">
          <div className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 rounded-full bg-blue-400/10 blur-2xl"></div>
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '18px 18px' }}></div>
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300/70 mb-1.5">Side-by-Side Comparison</p>
              <h2 className="text-xl font-bold text-white tracking-tight">Compare Claims</h2>
              <p className="text-xs text-blue-300/60 mt-1">{claimA.itemId?.itemName || 'Item'}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-400 shrink-0"></span>
                <span className="text-xs text-white/80 font-medium">{claimA.claimantInfo.name}</span>
              </div>
              <span className="text-white/30 text-lg font-thin">vs</span>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-violet-400 shrink-0"></span>
                <span className="text-xs text-white/80 font-medium">{claimB.claimantInfo.name}</span>
              </div>
              <button
                onClick={onClose}
                className="ml-2 w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/15 flex items-center justify-center transition-all"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 bg-[#eef0f6] p-6">
          {/* Column labels */}
          <div className="grid grid-cols-2 gap-5 mb-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Claim A</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0"></span>
              <p className="text-xs font-bold text-violet-600 uppercase tracking-wider">Claim B</p>
            </div>
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-2 gap-5">
            <ClaimColumn claim={claimA} accent="blue"   photoIdx={photoIdxA} setPhotoIdx={setPhotoIdxA} />
            <ClaimColumn claim={claimB} accent="violet" photoIdx={photoIdxB} setPhotoIdx={setPhotoIdxB} />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-end shrink-0 shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-400 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>

      {/* Inner lightbox */}
      {lightbox.open && (
        <div
          className="fixed inset-0 z-[70] bg-black/92 flex items-center justify-center p-4"
          onClick={() => setLightbox(p => ({ ...p, open: false }))}
        >
          <div className="relative flex flex-col items-center w-full max-w-4xl max-h-[92vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full mb-3 px-1">
              <p className="text-white text-sm font-semibold">{lightbox.label}</p>
              <button onClick={() => setLightbox(p => ({ ...p, open: false }))} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>
            <div className="relative flex items-center justify-center w-full">
              {lightbox.images.length > 1 && (
                <button onClick={() => setLightbox(p => ({ ...p, index: (p.index - 1 + p.images.length) % p.images.length }))}
                  className="absolute left-0 -translate-x-5 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
                  <i className="fas fa-chevron-left text-sm"></i>
                </button>
              )}
              <img src={lightbox.images[lightbox.index]} alt="" className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl" draggable={false} />
              {lightbox.images.length > 1 && (
                <button onClick={() => setLightbox(p => ({ ...p, index: (p.index + 1) % p.images.length }))}
                  className="absolute right-0 translate-x-5 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
                  <i className="fas fa-chevron-right text-sm"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Confidence Score Logic ────────────────────────────────────────────────────
const STOPWORDS = new Set([
  'a','an','the','is','are','was','were','in','on','at','of','to','for','and',
  'or','but','it','its','this','that','i','my','have','had','with','been','be',
  'by','from','as','so','if','up','not','can','will','do','did','he','she',
  'they','we','you','your','our','their','has','there','some','one','all',
]);

function extractKeywords(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

function computeConfidenceScore(claim) {
  if (!claim) return { total: 0, completeness: 0, textMatch: 0, imageSubmitted: 0 };

  const vd  = claim.verificationDetails || {};
  const ci  = claim.claimantInfo        || {};
  const imgs = claim.claimantImages     || [];

  // A. Completeness — 50 pts
  let completeness = 0;
  const desc = (vd.description || '').trim();
  if      (desc.length >= 50) completeness += 15;
  else if (desc.length >= 20) completeness +=  8;

  if ((vd.ownershipProof || '').trim().length > 0) completeness += 15;
  if ((vd.additionalInfo || '').trim().length > 0) completeness += 10;

  const infoFields   = [ci.name, ci.email, ci.phone, ci.address];
  const filledFields = infoFields.filter(f => f && String(f).trim().length > 0).length;
  completeness += Math.round((filledFields / 4) * 10);

  // B. Text Match — 30 pts (Jaccard similarity on keywords)
  let textMatch = 0;
  const claimWords = extractKeywords(desc);
  const itemWords  = extractKeywords(claim.itemId?.description || '');
  if (claimWords.length > 0 && itemWords.length > 0) {
    const claimSet = new Set(claimWords);
    const itemSet  = new Set(itemWords);
    const intersection = [...claimSet].filter(w => itemSet.has(w)).length;
    const union        = new Set([...claimSet, ...itemSet]).size;
    textMatch = union > 0 ? Math.round((intersection / union) * 30) : 0;
  }

  // C. Image Submitted — 20 pts
  const imageSubmitted = imgs.length >= 1 ? 20 : 0;

  const total = Math.min(100, completeness + textMatch + imageSubmitted);
  return { total, completeness, textMatch, imageSubmitted };
}

// ── ConfidenceScore Component ─────────────────────────────────────────────────
function ConfidenceScore({ claim }) {
  const [open, setOpen] = useState(false);
  const legacy = computeConfidenceScore(claim);
  const recommendation = claim?.recommendation || null;
  const total = recommendation?.score ?? legacy.total;

  const band =
    recommendation?.band ||
    (total >= 70 ? 'High' : total >= 40 ? 'Medium' : 'Low');
  const actionLabel = recommendation?.actionLabel || (band === 'High' ? 'Approve Candidate' : band === 'Medium' ? 'Manual Review' : 'Needs More Evidence');
  const summary = recommendation?.summary || 'Fallback score derived from the current claim details.';
  const reasons = recommendation?.reasons?.length ? recommendation.reasons : ['Detailed recommendation factors will appear after the claim is refreshed.'];
  const risks = recommendation?.risks || [];
  const competingClaims = recommendation?.competingClaims ?? 0;

  const theme = {
    High: {
      bar:    'bg-emerald-500',
      glow:   'shadow-emerald-200',
      border: 'border-emerald-200',
      bg:     'bg-gradient-to-br from-emerald-50 to-white',
      badge:  'bg-emerald-100 text-emerald-700 border-emerald-200',
      track:  'bg-emerald-100',
      label:  'text-emerald-700',
      icon:   'text-emerald-500',
      dot:    'bg-emerald-500',
    },
    Medium: {
      bar:    'bg-amber-400',
      glow:   'shadow-amber-200',
      border: 'border-amber-200',
      bg:     'bg-gradient-to-br from-amber-50 to-white',
      badge:  'bg-amber-100 text-amber-700 border-amber-200',
      track:  'bg-amber-100',
      label:  'text-amber-700',
      icon:   'text-amber-500',
      dot:    'bg-amber-400',
    },
    Low: {
      bar:    'bg-red-500',
      glow:   'shadow-red-200',
      border: 'border-red-200',
      bg:     'bg-gradient-to-br from-red-50 to-white',
      badge:  'bg-red-100 text-red-700 border-red-200',
      track:  'bg-red-100',
      label:  'text-red-700',
      icon:   'text-red-500',
      dot:    'bg-red-500',
    },
  }[band];

  const bandIcon = band === 'High' ? 'fa-circle-check' : band === 'Medium' ? 'fa-circle-half-stroke' : 'fa-circle-xmark';

  const breakdownSource = recommendation?.breakdown || {
    completeness: { score: legacy.completeness, max: 50 },
    textMatch: { score: legacy.textMatch, max: 30 },
    imageEvidence: { score: legacy.imageSubmitted, max: 20 },
  };

  const breakdown = [
    { key: 'completeness', label: 'Completeness', icon: 'fa-list-check', desc: 'Description, proof, and claimant detail quality' },
    { key: 'textMatch', label: 'Text Match', icon: 'fa-spell-check', desc: 'Keyword overlap with the found item description' },
    { key: 'locationMatch', label: 'Location Match', icon: 'fa-location-dot', desc: 'Claim context versus the item location' },
    { key: 'imageEvidence', label: 'Image Evidence', icon: 'fa-images', desc: 'Claimant submitted supporting photos' },
    { key: 'stageProgress', label: 'Stage Progress', icon: 'fa-list-ol', desc: 'Passed verification stages so far' },
    { key: 'competition', label: 'Competition', icon: 'fa-people-arrows', desc: 'Penalty for competing pending claims' },
  ].filter(({ key }) => breakdownSource[key]);

  return (
    <div className={`rounded-xl border ${theme.border} ${theme.bg} shadow-sm ${theme.glow} p-5 relative`}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme.badge} border`}>
            <i className={`fas fa-gauge-high text-sm ${theme.icon}`}></i>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Claim Recommendation Engine</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Real-time decision support for this claim</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Band badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${theme.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`}></span>
            <i className={`fas ${bandIcon} text-[10px]`}></i>
            {band}
          </span>
          <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border border-slate-200 bg-white text-slate-600">
            {actionLabel}
          </span>
          {/* Score number */}
          <span className={`text-2xl font-extrabold tabular-nums leading-none ${theme.label}`}>
            {total}
            <span className="text-sm font-medium text-slate-400">/100</span>
          </span>
          {/* Info toggle */}
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
            title="Show breakdown"
          >
            <i className={`fas ${open ? 'fa-chevron-up' : 'fa-info-circle'} text-xs`}></i>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`w-full h-2.5 rounded-full ${theme.track} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${theme.bar} transition-all duration-700`}
          style={{ width: `${total}%` }}
        />
      </div>

      {/* Band labels underneath bar */}
      <div className="flex justify-between mt-1.5 px-0.5">
        <span className={`text-[9px] font-semibold ${band === 'Low' ? theme.label : 'text-slate-300'}`}>Low (0–39)</span>
        <span className={`text-[9px] font-semibold ${band === 'Medium' ? theme.label : 'text-slate-300'}`}>Medium (40–69)</span>
        <span className={`text-[9px] font-semibold ${band === 'High' ? theme.label : 'text-slate-300'}`}>High (70–100)</span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3 items-start">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recommendation Summary</p>
          <p className="mt-1.5 text-sm font-semibold text-slate-700">{actionLabel}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{summary}</p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">
          <i className="fas fa-code-compare text-slate-400"></i>
          {competingClaims} competing claim{competingClaims === 1 ? '' : 's'}
        </div>
      </div>

      {/* Breakdown panel */}
      {open && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Score Breakdown</p>
          {breakdown.map(({ key, label, icon, desc }) => {
            const { score: scored, max } = breakdownSource[key];
            const pct = Math.round((scored / max) * 100);
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <i className={`fas ${icon} text-[10px] ${theme.icon}`}></i>
                    <span className="text-xs font-semibold text-slate-600">{label}</span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">— {desc}</span>
                  </div>
                  <span className="text-xs font-bold tabular-nums text-slate-700">
                    {scored}<span className="text-slate-400 font-normal">/{max}</span>
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${theme.bar} opacity-70`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Positive Signals</p>
              <ul className="mt-2 space-y-1.5">
                {reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-2 text-xs text-emerald-900">
                    <i className="fas fa-check-circle mt-0.5 text-[10px] text-emerald-500"></i>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Risk Flags</p>
              <ul className="mt-2 space-y-1.5">
                {(risks.length ? risks : ['No major risk flags detected by the current rules.']).map((risk) => (
                  <li key={risk} className="flex items-start gap-2 text-xs text-amber-900">
                    <i className="fas fa-triangle-exclamation mt-0.5 text-[10px] text-amber-500"></i>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total</span>
            <span className={`text-sm font-extrabold tabular-nums ${theme.label}`}>
              {total}<span className="text-slate-400 font-normal text-xs">/100</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerificationRequests({ activeSection, setActiveSection, sidebarOpen, setSidebarOpen }) {
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [quickActionLoading, setQuickActionLoading] = useState(null); // requestId being quick-actioned

  const [approvalStages, setApprovalStages] = useState(EMPTY_STAGES);

  // Rejection reason picker
  const [rejectionPicker, setRejectionPicker] = useState(null); // stageKey | null
  const [pendingReason, setPendingReason]     = useState('');

  // Lightbox
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0, label: '' });
  const [foundPhotoIdx, setFoundPhotoIdx]       = useState(0);
  const [claimantPhotoIdx, setClaimantPhotoIdx] = useState(0);

  // Compare
  const [compareIds, setCompareIds]         = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => {
    if (!lightbox.open) return;
    const onKey = (e) => {
      if (e.key === 'Escape')      setLightbox(p => ({ ...p, open: false }));
      if (e.key === 'ArrowRight')  setLightbox(p => ({ ...p, index: (p.index + 1) % p.images.length }));
      if (e.key === 'ArrowLeft')   setLightbox(p => ({ ...p, index: (p.index - 1 + p.images.length) % p.images.length }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox.open]);

  const STAGE_CONFIGS = [
    { key: 'stage1', label: 'Stage 1: Basic Matching', description: 'Verify the claimed item matches the found item description', icon: 'fa-search' },
    { key: 'stage2', label: 'Stage 2: Ownership Verification', description: 'Confirm the proof of ownership is valid', icon: 'fa-shield-alt' },
    { key: 'stage3', label: 'Stage 3: Final Decision', description: 'Make the final approval or rejection decision', icon: 'fa-gavel', isFinal: true }
  ];

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(10);

  // Filters
  const [statusFilter, setStatusFilter] = useState('pending');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedFoundItemId, setSelectedFoundItemId] = useState(null);
  const [sortOrder, setSortOrder] = useState('oldest');

  // Bulk selection
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  // Collection confirmation modal
  const [collectionModal, setCollectionModal] = useState({ open: false, request: null, pin: '', loading: false, error: '' });

  // Delete state: id of the request awaiting confirmation, or null
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Quick-action confirm popup: { id, status, name } or null
  const [quickConfirm, setQuickConfirm] = useState(null);

  // Real-time flash tracker: requestId → true for 3s after an update
  const [liveFlash, setLiveFlash] = useState({});

  // Socket.IO — receive live claim updates emitted by the server
  const handleClaimUpdated = useCallback((payload) => {
    const { claim } = payload;
    if (!claim) return;

    setVerificationRequests(prev => {
      const idx = prev.findIndex(r => r._id === claim._id);
      if (idx === -1) {
        // New claim not yet in the list — prepend it
        return [claim, ...prev];
      }
      const next = [...prev];
      // Preserve populated itemId if the socket stripped images
      next[idx] = { ...next[idx], ...claim, itemId: claim.itemId || next[idx].itemId };
      return next;
    });

    // Flash the row/card
    setLiveFlash(prev => ({ ...prev, [claim._id]: true }));
    setTimeout(() => setLiveFlash(prev => { const n = { ...prev }; delete n[claim._id]; return n; }), 3000);

    setSuccess(`Live update: claim for "${claim.itemId?.itemName || 'item'}" was ${claim.status}`);
    setTimeout(() => setSuccess(''), 4000);
  }, []);

  useSocket({ isAdmin: true, handlers: { claimUpdated: handleClaimUpdated } });

  useEffect(() => {
    fetchVerificationRequests();
  }, []);

  const fetchVerificationRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/verification');
      setVerificationRequests(response.data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching verification requests:', err);
      setError('Failed to load verification requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (requestId, status) => {
    setQuickActionLoading(requestId + status);
    try {
      await axios.patch(`http://localhost:3001/api/verification/${requestId}/status`, {
        status,
        notes: '',
        processedBy: 'admin'
      });
      setSuccess(`Claim ${status} successfully!`);
      fetchVerificationRequests();
    } catch (err) {
      console.error('Error quick-actioning verification request:', err);
      setError('Failed to update request. Please try again.');
    } finally {
      setQuickActionLoading(null);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    setActionLoading(true);
    try {
      await axios.patch(`http://localhost:3001/api/verification/${requestId}/status`, {
        status,
        notes: adminNotes,
        processedBy: 'admin' // You might want to use actual admin ID
      });

      setSuccess(`Verification request ${status} successfully!`);
      setShowModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      fetchVerificationRequests(); // Refresh the list
    } catch (err) {
      console.error('Error updating verification request:', err);
      setError('Failed to update verification request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (request) => {
    setSelectedRequest(request);
    setAdminNotes(request.notes || '');
    // Merge with EMPTY_STAGES so missing fields from older documents are filled safely
    const saved = request.approvalStages || {};
    setApprovalStages({
      stage1: { ...EMPTY_STAGES.stage1, ...(saved.stage1 || {}) },
      stage2: { ...EMPTY_STAGES.stage2, ...(saved.stage2 || {}) },
      stage3: { ...EMPTY_STAGES.stage3, ...(saved.stage3 || {}) },
    });
    setFoundPhotoIdx(0);
    setClaimantPhotoIdx(0);
    setLightbox({ open: false, images: [], index: 0, label: '' });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setAdminNotes('');
    setApprovalStages(EMPTY_STAGES);
  };

  const toggleCompare = (id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id]; // replace oldest
      return [...prev, id];
    });
  };

  const handleSaveStages = async () => {
    setSaveLoading(true);
    try {
      await axios.patch(`http://localhost:3001/api/verification/${selectedRequest._id}/stages`, {
        approvalStages,
        notes: adminNotes
      });
      setSuccess('Progress saved successfully!');
      fetchVerificationRequests();
    } catch (err) {
      console.error('Error saving stage progress:', err);
      setError('Failed to save progress. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleStageDecision = async (stageKey, decision, rejectionNote = '') => {
    const stageNum = parseInt(stageKey.replace('stage', ''));
    const updated = { ...approvalStages };
    const existingNotes = updated[stageKey].notes || '';
    updated[stageKey] = {
      ...updated[stageKey],
      status: decision,
      notes: rejectionNote
        ? rejectionNote + (existingNotes ? '\n' + existingNotes : '')
        : existingNotes,
    };

    // Reset downstream stages when a stage is failed
    if (decision === 'failed') {
      for (let i = stageNum + 1; i <= 3; i++) {
        updated[`stage${i}`] = { ...updated[`stage${i}`], status: 'pending' };
      }
    }

    setApprovalStages(updated);

    // Any failed stage immediately rejects the request; Stage 3 passed finalizes as approved
    if (decision === 'failed' || stageKey === 'stage3') {
      setSaveLoading(true);
      try {
        await axios.patch(`http://localhost:3001/api/verification/${selectedRequest._id}/stages`, {
          approvalStages: updated,
          notes: adminNotes
        });
      } catch {
        // Continue to status update even if stages patch fails
      } finally {
        setSaveLoading(false);
      }
      await handleStatusUpdate(selectedRequest._id, decision === 'passed' ? 'approved' : 'rejected');
    }
  };

  // Group all requests by found item for the left pane (always over the full set)
  const foundItemGroups = useMemo(() => {
    const groups = {};
    verificationRequests.forEach(req => {
      const id = req.itemId?._id || '__unknown__';
      if (!groups[id]) {
        groups[id] = {
          itemId: id,
          itemName: req.itemId?.itemName || 'Unknown Item',
          category: req.itemId?.category || '',
          location: req.itemId?.location || '',
          claims: [],
        };
      }
      groups[id].claims.push(req);
    });
    return Object.values(groups).sort((a, b) => {
      // Items with no pending claims (fully resolved) sink to bottom
      const aPending = a.claims.filter(c => c.status === 'pending').length;
      const bPending = b.claims.filter(c => c.status === 'pending').length;
      const aResolved = aPending === 0 ? 1 : 0;
      const bResolved = bPending === 0 ? 1 : 0;
      if (aResolved !== bResolved) return aResolved - bResolved;
      // Within active items: more pending first, then more total claims
      if (bPending !== aPending) return bPending - aPending;
      return b.claims.length - a.claims.length;
    });
  }, [verificationRequests]);

  // Derive sorted unique categories from all requests
  const availableCategories = useMemo(() => {
    const cats = new Set();
    verificationRequests.forEach(r => { if (r.itemId?.category) cats.add(r.itemId.category); });
    return [...cats].sort();
  }, [verificationRequests]);

  // Filter requests based on status, category, search term, date range, and selected item
  const filteredRequests = verificationRequests.filter(request => {
    // Item filter (left-pane selection)
    if (selectedFoundItemId && (request.itemId?._id || '__unknown__') !== selectedFoundItemId) return false;

    // Status filter
    if (statusFilter !== 'all' && request.status !== statusFilter) return false;

    // Category filter
    if (categoryFilter !== 'all' && request.itemId?.category !== categoryFilter) return false;

    // Search filter (search in multiple fields)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = request.claimantInfo.name.toLowerCase().includes(searchLower);
      const matchesEmail = request.claimantInfo.email.toLowerCase().includes(searchLower);
      const matchesPhone = request.claimantInfo.phone.toLowerCase().includes(searchLower);
      const matchesItem = request.itemId?.itemName?.toLowerCase().includes(searchLower);
      const matchesCategory = request.itemId?.category?.toLowerCase().includes(searchLower);
      const matchesLocation = request.itemId?.location?.toLowerCase().includes(searchLower);

      if (!matchesName && !matchesEmail && !matchesPhone && !matchesItem && !matchesCategory && !matchesLocation) {
        return false;
      }
    }

    // Date filter
    if (dateFilter.startDate || dateFilter.endDate) {
      const requestDate = new Date(request.submittedAt);
      if (dateFilter.startDate && requestDate < new Date(dateFilter.startDate)) return false;
      if (dateFilter.endDate && requestDate > new Date(dateFilter.endDate + 'T23:59:59')) return false;
    }

    return true;
  });

  // Reset to page 1, clear compare + bulk + quick-confirm selection whenever filters change
  useEffect(() => { setCurrentPage(1); setCompareIds([]); setBulkSelected(new Set()); setBulkConfirm(false); setQuickConfirm(null); }, [selectedFoundItemId, statusFilter, categoryFilter, searchTerm, dateFilter, sortOrder]);

  const toggleBulkSelect = (id) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setBulkConfirm(false);
  };

  const handleBulkReject = async () => {
    if (!bulkConfirm) { setBulkConfirm(true); return; }
    setBulkLoading(true);
    setBulkConfirm(false);
    try {
      await Promise.all([...bulkSelected].map(id =>
        axios.patch(`http://localhost:3001/api/verification/${id}/status`, {
          status: 'rejected', notes: 'Bulk rejected by admin', processedBy: 'admin'
        })
      ));
      setSuccess(`${bulkSelected.size} claim${bulkSelected.size !== 1 ? 's' : ''} rejected successfully.`);
      setBulkSelected(new Set());
      fetchVerificationRequests();
    } catch {
      setError('Bulk reject failed. Please try again.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return; }
    setDeleteLoading(id);
    setDeleteConfirm(null);
    try {
      await axios.delete(`http://localhost:3001/api/verification/${id}`);
      setVerificationRequests(prev => prev.filter(r => r._id !== id));
      setSuccess('Record deleted successfully.');
      closeModal();
    } catch {
      setError('Failed to delete record. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleConfirmCollection = async () => {
    if (!collectionModal.pin || collectionModal.pin.length !== 6) {
      setCollectionModal(prev => ({ ...prev, error: 'Please enter the full 6-digit PIN' }));
      return;
    }
    setCollectionModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      await axios.post(`http://localhost:3001/api/verification/${collectionModal.request._id}/confirm-collection`, {
        pin: collectionModal.pin
      });
      setCollectionModal({ open: false, request: null, pin: '', loading: false, error: '' });
      setSuccess(`Item collection confirmed — ${collectionModal.request.claimantInfo.name} has received their item.`);
      fetchVerificationRequests();
    } catch (err) {
      setCollectionModal(prev => ({
        ...prev,
        loading: false,
        error: err.response?.data?.error || 'Something went wrong. Please try again.'
      }));
    }
  };

  // Build a quick lookup: itemId → total claim count (over ALL requests, not just filtered)
  const claimCountByItemId = useMemo(() => {
    const map = {};
    foundItemGroups.forEach(g => { map[g.itemId] = g.claims.length; });
    return map;
  }, [foundItemGroups]);

  // Sort filtered requests by submitted date (oldest/newest first)
  const sortedFilteredRequests = useMemo(() => {
    const resolved = (s) => (s === 'approved' || s === 'rejected' || s === 'processed' ? 1 : 0);
    return [...filteredRequests].sort((a, b) => {
      // Resolved always sink to bottom
      const resolvedDiff = resolved(a.status) - resolved(b.status);
      if (resolvedDiff !== 0) return resolvedDiff;
      // Within each group, sort by date
      const aTime = new Date(a.submittedAt).getTime();
      const bTime = new Date(b.submittedAt).getTime();
      return sortOrder === 'oldest' ? aTime - bTime : bTime - aTime;
    });
  }, [filteredRequests, sortOrder]);

  // Pagination logic
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = sortedFilteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);
  const statusCounts = {
    pending: verificationRequests.filter(r => r.status === 'pending').length,
    approved: verificationRequests.filter(r => r.status === 'approved').length,
    rejected: verificationRequests.filter(r => r.status === 'rejected').length,
    total: verificationRequests.length,
  };
  const activeFiltersCount = [
    statusFilter !== 'all',
    categoryFilter !== 'all',
    !!selectedFoundItemId,
    !!searchTerm,
    !!dateFilter.startDate,
    !!dateFilter.endDate,
  ].filter(Boolean).length;
  const latestSubmission = verificationRequests.length
    ? new Date(Math.max(...verificationRequests.map(r => new Date(r.submittedAt).getTime())))
    : null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'fa-clock';
      case 'approved': return 'fa-check-circle';
      case 'rejected': return 'fa-times-circle';
      case 'processed': return 'fa-check-double';
      default: return 'fa-question-circle';
    }
  };

  // Returns { badge, subtitle } for the Status & Stage column
  const getStatusDisplay = (request) => {
    const { status } = request;
    const s = request.approvalStages;
    const s1 = s?.stage1?.status || 'pending';
    const s2 = s?.stage2?.status || 'pending';
    const s3 = s?.stage3?.status || 'pending';

    if (status === 'approved') {
      return { badge: 'Approved', subtitle: 'Awaiting Collection', subtitleColor: 'text-teal-500' };
    }
    if (status === 'rejected') {
      const failedAt = s3 === 'failed' ? 'Stage 3' : s2 === 'failed' ? 'Stage 2' : 'Stage 1';
      return { badge: 'Rejected', subtitle: `Failed at ${failedAt}` };
    }
    if (status === 'processed') {
      return { badge: 'Processed', subtitle: 'Case closed' };
    }

    // pending — work out which stage is active
    if (s1 === 'failed') return { badge: 'In Review', subtitle: 'Stage 1 – Basic Matching',        subtitleColor: 'text-red-500'  };
    if (s1 !== 'passed') return { badge: 'In Review', subtitle: 'Stage 1 – Basic Matching',        subtitleColor: 'text-gray-500' };
    if (s2 === 'failed') return { badge: 'In Review', subtitle: 'Stage 2 – Ownership Check',       subtitleColor: 'text-red-500'  };
    if (s2 !== 'passed') return { badge: 'In Review', subtitle: 'Stage 2 – Ownership Check',       subtitleColor: 'text-gray-500' };
    if (s3 === 'failed') return { badge: 'In Review', subtitle: 'Stage 3 – Final Decision',        subtitleColor: 'text-red-500'  };
    return                       { badge: 'In Review', subtitle: 'Stage 3 – Final Decision',        subtitleColor: 'text-gray-500' };
  };

  // Prepare CSV data
  const csvData = filteredRequests.map(request => ({
    'Request ID': request._id,
    'Claimant Name': request.claimantInfo.name,
    'Email': request.claimantInfo.email,
    'Phone': request.claimantInfo.phone,
    'Address': request.claimantInfo.address,
    'Item Name': request.itemId?.itemName || 'N/A',
    'Item Category': request.itemId?.category || 'N/A',
    'Location Found': request.itemId?.location || 'N/A',
    'Date Found': request.itemId?.dateTime ? new Date(request.itemId.dateTime).toLocaleDateString() : 'N/A',
    'Status': request.status.charAt(0).toUpperCase() + request.status.slice(1),
    'Submitted Date': new Date(request.submittedAt).toLocaleDateString(),
    'Submitted Time': new Date(request.submittedAt).toLocaleTimeString(),
    'Processed Date': request.processedAt ? new Date(request.processedAt).toLocaleDateString() : 'N/A',
    'Processed By': request.processedBy || 'N/A',
    'Claimant Description': request.verificationDetails.description,
    'Ownership Proof': request.verificationDetails.ownershipProof,
    'Additional Info': request.verificationDetails.additionalInfo || 'N/A',
    'Admin Notes': request.notes || 'N/A'
  }));

  const csvHeaders = [
    { label: 'Request ID', key: 'Request ID' },
    { label: 'Claimant Name', key: 'Claimant Name' },
    { label: 'Email', key: 'Email' },
    { label: 'Phone', key: 'Phone' },
    { label: 'Address', key: 'Address' },
    { label: 'Item Name', key: 'Item Name' },
    { label: 'Item Category', key: 'Item Category' },
    { label: 'Location Found', key: 'Location Found' },
    { label: 'Date Found', key: 'Date Found' },
    { label: 'Status', key: 'Status' },
    { label: 'Submitted Date', key: 'Submitted Date' },
    { label: 'Submitted Time', key: 'Submitted Time' },
    { label: 'Processed Date', key: 'Processed Date' },
    { label: 'Processed By', key: 'Processed By' },
    { label: 'Claimant Description', key: 'Claimant Description' },
    { label: 'Ownership Proof', key: 'Ownership Proof' },
    { label: 'Additional Info', key: 'Additional Info' },
    { label: 'Admin Notes', key: 'Admin Notes' }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-indigo-50/30">
      {/* Print styles */}
      <style>{`
        /* Dark select dropdown options */
        .dark-select option {
          background-color: #0d1f40;
          color: rgba(255, 255, 255, 0.85);
        }
        .dark-select option:hover,
        .dark-select option:focus,
        .dark-select option:checked {
          background-color: #1a3a6e;
          color: #fff;
        }

        @media print {
          /* ── Reset & base ── */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: #fff !important; font-family: 'Segoe UI', system-ui, sans-serif; }
          .print-only-header { display: block !important; }

          /* ── Hide non-content UI ── */
          .no-print,
          [class*="Sidebar"],
          [class*="TopBar"],
          button:not(.print-keep),
          input[type="checkbox"],
          input[type="text"],
          select,
          .fa-spinner { display: none !important; }

          /* ── Page layout ── */
          html, body { margin: 0; padding: 0; }
          .flex.min-h-screen { display: block !important; background: #fff !important; }
          .flex-1.lg\\:ml-64 { margin-left: 0 !important; }
          main { padding: 0 !important; }
          .max-w-7xl { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }

          /* ── Print header ── */
          main::before {
            content: "";
            display: block;
            height: 6px;
            background: linear-gradient(90deg, #1e3a8a 0%, #3b82f6 50%, #6366f1 100%);
            margin-bottom: 24px;
            border-radius: 0 0 4px 4px;
          }
          main::after {
            content: "Lost & Found — Verification Requests Report  ·  Printed: " attr(data-print-date);
            display: block;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            margin-top: 32px;
          }

          /* ── Two-pane → single column ── */
          .flex.gap-4.items-start {
            display: block !important;
          }

          /* Left pane removed — item filter is now a dropdown */

          /* ── Right pane: claims list ── */
          .flex-1.min-w-0 { width: 100% !important; }

          /* Sub-header strip */
          .bg-white\\/80.backdrop-blur-sm.rounded-2xl.shadow-sm.border.border-white\\/60.mb-3 {
            border: 1.5px solid #e2e8f0 !important;
            border-radius: 10px !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            background: #f8fafc !important;
          }
          .bg-white\\/80.backdrop-blur-sm.rounded-2xl.shadow-sm.border.border-white\\/60.mb-3 button { display: none !important; }

          /* ── Claim cards ── */
          .space-y-2 > div {
            border: 1.5px solid #e2e8f0 !important;
            border-radius: 10px !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            background: #fff !important;
            page-break-inside: avoid;
            margin-bottom: 8px !important;
          }
          /* Stale highlight preserved */
          .space-y-2 > div[class*="border-orange"] {
            border-color: #fed7aa !important;
            background: #fff7ed !important;
          }

          /* Hide action buttons inside claim cards */
          .space-y-2 > div button { display: none !important; }
          /* Hide checkbox column spacer */
          .pt-3 .w-4 { display: none !important; }

          /* Avatar — print as circle with initials */
          .w-10.h-10.rounded-xl {
            width: 32px !important;
            height: 32px !important;
            border-radius: 50% !important;
            font-size: 11px !important;
            flex-shrink: 0 !important;
          }

          /* Status badges */
          span[class*="bg-amber-50"] { background: #fffbeb !important; color: #d97706 !important; border-color: #fde68a !important; }
          span[class*="bg-emerald-50"] { background: #ecfdf5 !important; color: #059669 !important; border-color: #a7f3d0 !important; }
          span[class*="bg-rose-50"] { background: #fff1f2 !important; color: #e11d48 !important; border-color: #fecdd3 !important; }
          span[class*="bg-sky-50"] { background: #f0f9ff !important; color: #0284c7 !important; border-color: #bae6fd !important; }

          /* ── Pagination — hide ── */
          nav, .flex.items-center.justify-between.pt-4 { display: none !important; }

          /* ── Page breaks ── */
          .print-break { page-break-after: always; }
          @page {
            size: A4 portrait;
            margin: 16mm 14mm 16mm 14mm;
          }
        }
      `}</style>

      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        className="no-print"
      />

      <div className="flex-1 lg:ml-64 flex flex-col">
        <div className="no-print">
          <TopBar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            title="Verification Requests"
            subtitle="Review and approve item ownership verification requests"
          />
        </div>

        <main className="flex-1 p-6 print-full-width bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.08),_transparent_28%),linear-gradient(180deg,#f6f8fc_0%,#eef4ff_45%,#f8fafc_100%)]" data-print-date={new Date().toLocaleString()}>
        <div className="max-w-7xl mx-auto">

          {/* ── Print-only report header ── */}
          <div className="print-only-header mb-6" style={{display:'none'}}>
            <div style={{background:'linear-gradient(135deg,#1e3a8a 0%,#3b82f6 60%,#6366f1 100%)', borderRadius:'12px', padding:'20px 24px 16px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <p style={{color:'#bfdbfe',fontSize:'10px',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:'4px'}}>Lost &amp; Found System</p>
                  <h1 style={{color:'#fff',fontSize:'20px',fontWeight:800,margin:0}}>Verification Requests Report</h1>
                </div>
                <div style={{textAlign:'right'}}>
                  <p style={{color:'#bfdbfe',fontSize:'10px',margin:0}}>Printed on</p>
                  <p style={{color:'#fff',fontSize:'12px',fontWeight:600,margin:0}}>{new Date().toLocaleString()}</p>
                  <p style={{color:'#bfdbfe',fontSize:'10px',marginTop:'4px'}}>{filteredRequests.length} claim{filteredRequests.length !== 1 ? 's' : ''} shown</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-sm no-print shadow-sm">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <i className="fas fa-exclamation-circle text-red-500 text-sm"></i>
              </div>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-3 text-sm no-print shadow-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <i className="fas fa-check-circle text-emerald-500 text-sm"></i>
              </div>
              {success}
            </div>
          )}

          {/* Real-time indicator */}
          <div className="no-print mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Queue
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-full shadow-sm">
              <i className="fas fa-layer-group text-[10px]"></i>
              {statusCounts.total} claims total
            </span>
          </div>

          {/* Stats Row */}
          <div className="no-print mb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                label: 'Pending',
                count: statusCounts.pending,
                icon: 'fa-hourglass-half',
                accent: '#d97706',
                accentLight: 'rgba(251,191,36,0.12)',
                accentBg: 'rgba(254,243,199,0.7)',
                accentBorder: 'rgba(251,191,36,0.5)',
                barGrad: 'linear-gradient(90deg,#fbbf24,#f97316)',
              },
              {
                label: 'Approved',
                count: statusCounts.approved,
                icon: 'fa-check',
                accent: '#059669',
                accentLight: 'rgba(52,211,153,0.12)',
                accentBg: 'rgba(209,250,229,0.7)',
                accentBorder: 'rgba(52,211,153,0.5)',
                barGrad: 'linear-gradient(90deg,#34d399,#10b981)',
              },
              {
                label: 'Rejected',
                count: statusCounts.rejected,
                icon: 'fa-times',
                accent: '#e11d48',
                accentLight: 'rgba(251,113,133,0.12)',
                accentBg: 'rgba(255,228,230,0.7)',
                accentBorder: 'rgba(251,113,133,0.5)',
                barGrad: 'linear-gradient(90deg,#fb7185,#f43f5e)',
              },
              {
                label: 'Total',
                count: statusCounts.total,
                icon: 'fa-layer-group',
                isTotal: true,
              },
            ].map(({ label, count, icon, accent, accentLight, accentBg, accentBorder, barGrad, isTotal }) => (
              <div
                key={label}
                className="relative overflow-hidden rounded-[24px] p-5 transition-all duration-200 hover:-translate-y-0.5 cursor-default shadow-[0_16px_36px_rgba(15,23,42,0.08)]"
                style={{
                  background: isTotal ? 'linear-gradient(135deg,rgba(224,231,255,0.92),rgba(255,255,255,0.98))' : `linear-gradient(135deg,${accentBg},rgba(255,255,255,0.96))`,
                  border: isTotal ? '1px solid rgba(99,102,241,0.28)' : `1px solid ${accentBorder}`,
                }}
              >
                <div className="absolute inset-x-5 top-0 h-1 rounded-b-full" style={{background: isTotal ? 'linear-gradient(90deg,#6366f1,#3b82f6)' : barGrad}} />

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em]"
                      style={{color: isTotal ? '#6366f1' : accent}}>
                      {label}
                    </p>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={isTotal
                        ? {background: 'rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.3)'}
                        : {background: accentLight, border: `1.5px solid ${accentBorder}`}}>
                      <i className={`fas ${icon} text-sm`} style={{color: isTotal ? '#6366f1' : accent}}></i>
                    </div>
                  </div>

                  <p className="text-[40px] font-black leading-none tracking-tight"
                    style={{color: isTotal ? '#312e81' : accent}}>
                    {count}
                  </p>

                  {!isTotal && (
                    <div className="mt-4 h-[3px] w-full rounded-full overflow-hidden" style={{background:'rgba(0,0,0,0.1)'}}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${verificationRequests.length ? (count / verificationRequests.length) * 100 : 0}%`,
                          background: barGrad,
                        }}
                      />
                    </div>
                  )}

                  {isTotal && (
                    <p className="mt-3 text-xs font-medium" style={{color:'rgba(99,102,241,0.6)'}}>
                      All verification requests
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Filters and Search */}
          <div className="rounded-[26px] border border-[#244a86] bg-gradient-to-br from-[#17315c] via-[#163564] to-[#0f2347] shadow-[0_22px_50px_rgba(15,35,71,0.35)] mb-5 no-print overflow-hidden">
            {/* Top row: search + selects + dates + actions */}
            <div className="flex flex-wrap items-end gap-2 p-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name, email, item, location..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-3 text-sm text-slate-700 placeholder-slate-400 transition-all focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="dark-select rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 transition-all focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="processed">Processed</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="dark-select rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 transition-all focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
              >
                <option value="all">All Categories</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Item Filter Dropdown */}
              <select
                value={selectedFoundItemId || 'all'}
                onChange={(e) => setSelectedFoundItemId(e.target.value === 'all' ? null : e.target.value)}
                className="dark-select rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 transition-all focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
              >
                <option value="all">All Items ({verificationRequests.length})</option>
                {foundItemGroups.map(group => {
                  const pendingCount = group.claims.filter(c => c.status === 'pending').length;
                  return (
                    <option key={group.itemId} value={group.itemId}>
                      {group.itemName}{pendingCount > 0 ? ` (${pendingCount} pending)` : ` (${group.claims.length} claims)`}
                    </option>
                  );
                })}
              </select>

              {/* From Date */}
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 transition-all focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
              />

              {/* To Date */}
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 transition-all focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
              />

              {/* Action Buttons */}
              <div className="flex gap-1.5 ml-auto shrink-0">
                {(dateFilter.startDate || dateFilter.endDate || searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || selectedFoundItemId) && (
                  <button
                    onClick={() => {
                      setDateFilter({ startDate: '', endDate: '' });
                      setSearchTerm('');
                      setStatusFilter('all');
                      setCategoryFilter('all');
                      setSelectedFoundItemId(null);
                    }}
                    className="px-4 py-3 border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-sm font-semibold"
                  >
                    <i className="fas fa-times text-xs"></i>
                    Clear
                  </button>
                )}
                <CSVLink
                  data={csvData}
                  headers={csvHeaders}
                  filename={`verification-requests-${new Date().toISOString().split('T')[0]}.csv`}
                  className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl transition-colors flex items-center gap-1.5 text-sm font-semibold shadow-sm shadow-emerald-200"
                >
                  <i className="fas fa-download text-xs"></i>
                  Export
                </CSVLink>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-3 bg-[#17315c] hover:bg-[#0f2347] text-white rounded-2xl transition-colors flex items-center gap-1.5 text-sm font-semibold shadow-sm shadow-slate-300"
                >
                  <i className="fas fa-print text-xs"></i>
                  Print
                </button>
              </div>
            </div>

            {/* Results Summary bar */}
            <div className="px-4 py-3 border-t border-white/10 bg-[#0f2347]/70 rounded-b-[26px] flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-sky-400/15 text-sky-100 font-semibold px-2.5 py-1 rounded-full text-xs border border-sky-300/20">
                <i className="fas fa-list-ul text-[10px]"></i>
                {filteredRequests.length} result{filteredRequests.length !== 1 ? 's' : ''}
              </span>
              {searchTerm && (
                <span className="text-xs text-blue-100/75">matching <span className="text-sky-200 font-medium">"{searchTerm}"</span></span>
              )}
              {statusFilter !== 'all' && (
                <span className="text-xs text-blue-100/75">status: <span className="font-semibold text-white capitalize">{statusFilter}</span></span>
              )}
              {categoryFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-indigo-400/15 text-indigo-100 font-semibold px-2.5 py-1 rounded-full text-xs border border-indigo-300/20">
                  <i className="fas fa-tag text-[9px]"></i>
                  {categoryFilter}
                  <button onClick={() => setCategoryFilter('all')} className="ml-0.5 hover:text-white">
                    <i className="fas fa-times text-[8px]"></i>
                  </button>
                </span>
              )}
              {selectedFoundItemId && (
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full text-xs">
                  <i className="fas fa-box text-[9px]"></i>
                  {foundItemGroups.find(g => g.itemId === selectedFoundItemId)?.itemName || 'Item'}
                  <button onClick={() => setSelectedFoundItemId(null)} className="ml-0.5 hover:text-blue-900">
                    <i className="fas fa-times text-[8px]"></i>
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Claims List */}
          <div>
            <div className="w-full">

              {/* Claims sub-header */}
              <div className="bg-white/95 rounded-[24px] border border-slate-200 shadow-[0_12px_30px_rgba(15,23,42,0.06)] mb-4 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      {selectedFoundItemId
                        ? (foundItemGroups.find(g => g.itemId === selectedFoundItemId)?.itemName || 'Claims')
                        : 'All Claims'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {filteredRequests.length} claim{filteredRequests.length !== 1 ? 's' : ''}
                      {selectedFoundItemId ? ' for this item' : ' across all items'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Sort toggle */}
                  <button
                    onClick={() => setSortOrder(o => o === 'oldest' ? 'newest' : 'oldest')}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors"
                    title={sortOrder === 'oldest' ? 'Showing oldest first — click for newest first' : 'Showing newest first — click for oldest first'}
                  >
                    <i className={`fas fa-sort-amount-${sortOrder === 'oldest' ? 'up' : 'down'} text-xs text-slate-400`}></i>
                    {sortOrder === 'oldest' ? 'Oldest First' : 'Newest First'}
                  </button>
                  {selectedFoundItemId && (
                    <button
                      onClick={() => setSelectedFoundItemId(null)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors"
                    >
                      <i className="fas fa-times text-xs"></i>
                      Show All
                    </button>
                  )}
                </div>
              </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-slate-400 shadow-sm p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <i className="fas fa-spinner fa-spin text-xl text-blue-500"></i>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600">Loading verification requests</p>
                  <p className="text-xs text-slate-400 mt-0.5">Please wait a moment…</p>
                </div>
              </div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-400 shadow-sm p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center shadow-inner">
                  <i className="fas fa-inbox text-2xl text-gray-300"></i>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-700">No verification requests found</h3>
                  <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
                    {searchTerm || statusFilter !== 'all' || dateFilter.startDate || dateFilter.endDate
                      ? 'Try adjusting your filters or search term.'
                      : 'Requests will appear here once users submit claims.'}
                  </p>
                </div>
                {(searchTerm || statusFilter !== 'all' || dateFilter.startDate || dateFilter.endDate) && (
                  <button
                    onClick={() => {
                      setDateFilter({ startDate: '', endDate: '' });
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all text-sm font-semibold shadow-sm shadow-blue-200"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* ── Bulk Action Toolbar ── */}
              {bulkSelected.size > 0 && (() => {
                const pendingOnPage = currentRequests.filter(r => r.status === 'pending');
                const allOnPageSelected = pendingOnPage.length > 0 && pendingOnPage.every(r => bulkSelected.has(r._id));
                return (
                  <div className="mb-2 flex items-center gap-3 px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-xl shadow-sm">
                    {/* Select-all checkbox */}
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={() => {
                        setBulkSelected(prev => {
                          const next = new Set(prev);
                          if (allOnPageSelected) pendingOnPage.forEach(r => next.delete(r._id));
                          else pendingOnPage.forEach(r => next.add(r._id));
                          return next;
                        });
                        setBulkConfirm(false);
                      }}
                      className="w-4 h-4 accent-rose-500 cursor-pointer shrink-0"
                    />
                    <span className="text-sm font-semibold text-rose-700 flex items-center gap-1.5 flex-1">
                      <i className="fas fa-check-square text-rose-400 text-xs"></i>
                      {bulkSelected.size} claim{bulkSelected.size !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={handleBulkReject}
                      disabled={bulkLoading}
                      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
                        bulkConfirm
                          ? 'bg-rose-600 border-rose-600 text-white shadow-sm shadow-rose-300 animate-pulse'
                          : 'bg-white border-rose-300 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600'
                      }`}
                    >
                      {bulkLoading
                        ? <><i className="fas fa-spinner fa-spin text-[10px]"></i> Rejecting…</>
                        : bulkConfirm
                          ? <><i className="fas fa-exclamation-triangle text-[10px]"></i> Confirm Reject {bulkSelected.size}</>
                          : <><i className="fas fa-times-circle text-[10px]"></i> Reject Selected</>
                      }
                    </button>
                    <button
                      onClick={() => { setBulkSelected(new Set()); setBulkConfirm(false); }}
                      className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
                    >
                      <i className="fas fa-times text-[10px]"></i>
                      Clear
                    </button>
                  </div>
                );
              })()}

              {/* ── Claims Table ── */}
              <div className="bg-white/95 rounded-[24px] border border-slate-400 shadow-[0_18px_45px_rgba(15,23,42,0.06)] overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-200/80">
                      <th className="w-8 px-4 py-3 text-left border-b border-r border-slate-400"></th>
                      <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 border-b border-r border-slate-400">Claimant</th>
                      {!selectedFoundItemId && (
                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 border-b border-r border-slate-400">Item</th>
                      )}
                      <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 border-b border-r border-slate-400">Submitted</th>
                      <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 border-b border-r border-slate-400">Status</th>
                      <th className="px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 border-b border-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRequests.map((request) => {
                      const initials = request.claimantInfo.name
                        ? request.claimantInfo.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                        : '?';
                      const avatarColors = [
                        'from-blue-400 to-indigo-500', 'from-violet-400 to-purple-500',
                        'from-rose-400 to-pink-500',   'from-amber-400 to-orange-500',
                        'from-teal-400 to-cyan-500',   'from-emerald-400 to-green-500',
                      ];
                      const idHash = request._id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                      const avatarGrad = avatarColors[idHash % avatarColors.length];
                      const statusStyles = {
                        pending:   'bg-amber-50 text-amber-600 border border-amber-200',
                        approved:  'bg-emerald-50 text-emerald-600 border border-emerald-200',
                        rejected:  'bg-rose-50 text-rose-600 border border-rose-200',
                        processed: 'bg-sky-50 text-sky-600 border border-sky-200',
                      };
                      const dotStyles = {
                        pending: 'bg-amber-400', approved: 'bg-emerald-400',
                        rejected: 'bg-rose-400', processed: 'bg-sky-400',
                      };
                      const { badge, subtitle, subtitleColor } = getStatusDisplay(request);
                      const ageMs = Date.now() - new Date(request.submittedAt).getTime();
                      const ageDays = Math.floor(ageMs / 86400000);
                      const ageLabel = ageDays === 0 ? 'Today' : ageDays === 1 ? '1 day' : `${ageDays} days`;
                      const ageTier =
                        request.status !== 'pending' ? null :
                        ageDays === 0               ? 'new' :
                        ageDays <= 2                ? 'amber' :
                        ageDays <= 7                ? 'red' : 'critical';

                      const isLive = !!liveFlash[request._id];
                      const rowBg = bulkSelected.has(request._id)
                        ? 'bg-rose-50/60'
                        : isLive
                        ? 'bg-blue-50'
                        : 'bg-white hover:bg-slate-50/60';
                      const leftAccent = isLive
                        ? 'border-l-4 border-l-blue-500'
                        : ({
                          pending:   'border-l-4 border-l-blue-400',
                          approved:  'border-l-4 border-l-emerald-400',
                          rejected:  'border-l-4 border-l-rose-400',
                          processed: 'border-l-4 border-l-sky-400',
                        }[request.status] || 'border-l-4 border-l-slate-300');

                      return (
                        <tr key={request._id} className={`transition-colors ${rowBg} ${leftAccent} hover:shadow-[inset_0_0_0_9999px_rgba(248,250,252,0.55)]`}>

                          {/* Checkbox */}
                          <td className="px-4 py-3 border-b border-r border-slate-400">
                            {request.status === 'pending' ? (
                              <input
                                type="checkbox"
                                checked={bulkSelected.has(request._id)}
                                onChange={() => toggleBulkSelect(request._id)}
                                onClick={e => e.stopPropagation()}
                                className="w-4 h-4 accent-rose-500 cursor-pointer"
                              />
                            ) : (
                              <div className="w-4" />
                            )}
                          </td>

                          {/* Claimant */}
                          <td className="px-4 py-3 border-b border-r border-slate-400">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm`}>
                                {initials}
                              </div>
                              <p className="text-sm font-semibold text-slate-800 leading-tight">{request.claimantInfo.name}</p>
                            </div>
                          </td>

                          {/* Item */}
                          {!selectedFoundItemId && (
                            <td className="px-4 py-3 border-b border-r border-slate-400">
                              {request.itemId?.itemName ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-sm font-medium text-slate-700">{request.itemId.itemName}</span>
                                  {request.itemId?.category && (
                                    <span className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                      {request.itemId.category}
                                    </span>
                                  )}
                                  {(() => {
                                    const n = claimCountByItemId[request.itemId?._id || '__unknown__'] || 0;
                                    if (n < 2) return null;
                                    return (
                                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-500 border border-rose-100">
                                        {n} claims
                                      </span>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 italic">—</span>
                              )}
                            </td>
                          )}

                          {/* Submitted date */}
                          <td className="px-4 py-3 whitespace-nowrap border-b border-r border-slate-400">
                            <div className="flex flex-col gap-0.5">
                              {ageTier && (() => {
                                const tierStyle = {
                                  new:      'bg-blue-50 text-blue-600 border-blue-200',
                                  amber:    'bg-amber-50 text-amber-600 border-amber-200',
                                  red:      'bg-red-50 text-red-600 border-red-200',
                                  critical: 'bg-red-100 text-red-700 border-red-300',
                                }[ageTier];
                                const tierIcon = ageTier === 'new' ? 'fa-bolt' : 'fa-clock';
                                const tierSuffix = ageTier === 'critical' ? ' — Action needed' : ageTier === 'red' ? ' — Overdue' : '';
                                return (
                                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold border px-1.5 py-0.5 rounded w-fit ${tierStyle} ${ageTier === 'critical' ? 'animate-pulse' : ''}`}>
                                    <i className={`fas ${tierIcon} text-[9px]`}></i>
                                    {ageLabel}{tierSuffix}
                                  </span>
                                );
                              })()}
                              <span className="text-xs text-slate-500">
                                {new Date(request.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 border-b border-r border-slate-400">
                            <div className="flex flex-col gap-0.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap w-fit ${statusStyles[request.status] || statusStyles.processed}`}>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[request.status] || dotStyles.processed}`}></span>
                                {badge}
                              </span>
                              {isLive && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded w-fit animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> LIVE
                                </span>
                              )}
                              {subtitle && (
                                <p className={`text-[11px] font-medium ${subtitleColor || 'text-slate-400'}`}>{subtitle}</p>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 border-b border-slate-400">
                            <div className="flex items-center gap-1.5 justify-end">
                              {/* Compare toggle */}
                              {(() => {
                                const thisItemId = request.itemId?._id || '__unknown__';
                                if ((claimCountByItemId[thisItemId] || 0) < 2) return null;
                                const isSel = compareIds.includes(request._id);
                                const firstSelectedItemId = compareIds.length > 0
                                  ? (verificationRequests.find(r => r._id === compareIds[0])?.itemId?._id || '__unknown__')
                                  : null;
                                const isDisabled = !isSel && (compareIds.length >= 2 || (firstSelectedItemId && firstSelectedItemId !== thisItemId));
                                const disabledTitle = compareIds.length >= 2
                                  ? 'Deselect one claim first'
                                  : firstSelectedItemId && firstSelectedItemId !== thisItemId
                                    ? 'Can only compare claims for the same item'
                                    : '';
                                return (
                                  <button
                                    onClick={() => toggleCompare(request._id)}
                                    disabled={isDisabled}
                                    title={isDisabled ? disabledTitle : isSel ? 'Remove from comparison' : 'Add to comparison'}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap disabled:opacity-30 disabled:cursor-not-allowed ${
                                      isSel
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
                                    }`}
                                  >
                                    <i className={`fas ${isSel ? 'fa-check-square' : 'fa-columns'} text-xs`}></i>
                                    {isSel ? 'Selected' : 'Compare'}
                                  </button>
                                );
                              })()}

                              {/* Quick-action Approve / Reject — pending only */}
                              {request.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => setQuickConfirm({ id: request._id, status: 'approved', name: request.claimantInfo.name })}
                                    disabled={quickActionLoading !== null}
                                    title="Approve"
                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow-sm"
                                  >
                                    {quickActionLoading === request._id + 'approved'
                                      ? <i className="fas fa-spinner fa-spin text-xs"></i>
                                      : <i className="fas fa-check text-xs"></i>}
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => setQuickConfirm({ id: request._id, status: 'rejected', name: request.claimantInfo.name })}
                                    disabled={quickActionLoading !== null}
                                    title="Reject"
                                    className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-500 border border-rose-200 hover:border-rose-300 text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                                  >
                                    {quickActionLoading === request._id + 'rejected'
                                      ? <i className="fas fa-spinner fa-spin text-xs"></i>
                                      : <i className="fas fa-times text-xs"></i>}
                                    Reject
                                  </button>
                                </>
                              )}

                              {/* Review button */}
                              <button
                                onClick={() => openModal(request)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[#1a3560] hover:bg-[#0f2347] text-white text-xs font-semibold rounded-lg transition-all shadow-sm whitespace-nowrap"
                              >
                                <i className="fas fa-eye text-xs"></i>
                                Review
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white/95 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 mt-3 rounded-[24px] border border-slate-200 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                <div className="text-sm text-gray-400 flex items-center gap-1.5">
                  <i className="fas fa-table-list text-gray-300 text-xs"></i>
                  Showing{' '}
                  <span className="font-semibold text-gray-600">{indexOfFirstRequest + 1}–{Math.min(indexOfLastRequest, filteredRequests.length)}</span>
                  {' '}of{' '}
                  <span className="font-semibold text-gray-600">{filteredRequests.length}</span> results
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                      <i className="fas fa-chevron-left text-[9px]"></i>
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all ${
                          currentPage === page
                            ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm shadow-sky-200'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                      Next
                      <i className="fas fa-chevron-right text-[9px]"></i>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
            </div>{/* end claims inner */}
          </div>{/* end claims layout */}
        </div>

        {/* ── Floating Compare Bar ── */}
        {compareIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 no-print">
            <div className="bg-gradient-to-r from-[#1a3560] to-[#1e4d8c] text-white rounded-2xl shadow-2xl shadow-indigo-900/40 px-5 py-3.5 flex items-center gap-4 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2">
                <i className="fas fa-columns text-blue-300 text-sm"></i>
                <span className="text-sm font-semibold">
                  {compareIds.length === 1 ? 'Select 1 more claim to compare' : '2 claims selected'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {compareIds.length === 2 && (
                  <button
                    onClick={() => setShowCompareModal(true)}
                    className="px-4 py-2 bg-white text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <i className="fas fa-exchange-alt text-[10px]"></i>
                    Compare Side-by-Side
                  </button>
                )}
                <button
                  onClick={() => setCompareIds([])}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors border border-white/10"
                  title="Clear selection"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Claim Comparison Modal ── */}
        {showCompareModal && compareIds.length === 2 && (() => {
          const claimA = verificationRequests.find(r => r._id === compareIds[0]);
          const claimB = verificationRequests.find(r => r._id === compareIds[1]);
          if (!claimA || !claimB) return null;
          return (
            <ClaimCompareModal
              claimA={claimA}
              claimB={claimB}
              onClose={() => setShowCompareModal(false)}
            />
          );
        })()}

        {/* ── Quick-Action Confirmation Popup ── */}
        {quickConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setQuickConfirm(null)}>
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Coloured top strip */}
              <div className={`h-1.5 w-full ${quickConfirm.status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'}`} />

              <div className="px-6 py-5">
                {/* Icon + heading */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    quickConfirm.status === 'approved' ? 'bg-emerald-50' : 'bg-rose-50'
                  }`}>
                    <i className={`fas ${quickConfirm.status === 'approved' ? 'fa-check-circle text-emerald-500' : 'fa-times-circle text-rose-500'} text-lg`}></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {quickConfirm.status === 'approved' ? 'Approve this claim?' : 'Reject this claim?'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">{quickConfirm.name}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-500 mb-5">
                  Are you sure you want to <span className={`font-semibold ${quickConfirm.status === 'approved' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {quickConfirm.status === 'approved' ? 'approve' : 'reject'}
                  </span> this claim? This action will update the claimant's status immediately.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const { id, status } = quickConfirm;
                      setQuickConfirm(null);
                      handleQuickAction(id, status);
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${
                      quickConfirm.status === 'approved'
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-rose-500 hover:bg-rose-600'
                    }`}
                  >
                    Yes, {quickConfirm.status === 'approved' ? 'Approve' : 'Reject'}
                  </button>
                  <button
                    onClick={() => setQuickConfirm(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-400 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-[860px] w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">

              {/* ── Sticky Header ── */}
              <div className="relative bg-gradient-to-r from-[#0f1f3d] via-[#1a3560] to-[#1e4d8c] px-7 py-6 shrink-0 overflow-hidden">
                {/* Subtle radial glow top-right */}
                <div className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 rounded-full bg-blue-400/10 blur-2xl"></div>
                {/* Fine dot-grid texture overlay */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.04]"
                  style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '18px 18px' }}
                ></div>

                <div className="relative flex items-center justify-between gap-6">
                  {/* Left – label + title + ID */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300/70 mb-2 select-none">
                      Verification Request
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-[22px] font-bold text-white tracking-tight leading-none">
                        Review Claim
                      </h2>
                      {/* Claim ID badge */}
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-blue-200 bg-white/8 border border-white/15 px-2.5 py-1 rounded-md tracking-widest backdrop-blur-sm select-all">
                        <span className="text-blue-400/70 font-normal">#</span>
                        {selectedRequest._id.slice(-8).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Right – status pill + date + close */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      {/* Status pill */}
                      {(() => {
                        const pills = {
                          pending:   { bg: 'bg-amber-400/15',   border: 'border-amber-400/30',   text: 'text-amber-300',   dot: 'bg-amber-400'   },
                          approved:  { bg: 'bg-emerald-400/15', border: 'border-emerald-400/30', text: 'text-emerald-300', dot: 'bg-emerald-400' },
                          rejected:  { bg: 'bg-red-400/15',     border: 'border-red-400/30',     text: 'text-red-300',     dot: 'bg-red-400'     },
                          processed: { bg: 'bg-sky-400/15',     border: 'border-sky-400/30',     text: 'text-sky-300',     dot: 'bg-sky-400'     },
                        };
                        const p = pills[selectedRequest.status] || pills.processed;
                        const label = selectedRequest.status === 'pending' ? 'In Review'
                          : selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1);
                        return (
                          <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${p.bg} ${p.border} ${p.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.dot} shadow-sm`}></span>
                            {label}
                          </span>
                        );
                      })()}
                      <p className="text-[11px] text-blue-300/60 mt-1.5 font-medium flex items-center gap-2 flex-wrap">
                        <span>
                          Submitted&nbsp;
                          {new Date(selectedRequest.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {selectedRequest.status === 'pending' && (() => {
                          const days = Math.floor((Date.now() - new Date(selectedRequest.submittedAt).getTime()) / 86400000);
                          const label = days === 0 ? 'Today' : days === 1 ? '1 day pending' : `${days} days pending`;
                          const style =
                            days === 0  ? 'bg-blue-400/20 text-blue-200 border-blue-400/30' :
                            days <= 2   ? 'bg-amber-400/20 text-amber-200 border-amber-400/30' :
                            days <= 7   ? 'bg-red-400/20 text-red-200 border-red-400/30' :
                                          'bg-red-500/30 text-red-100 border-red-400/50 animate-pulse';
                          const icon = days === 0 ? 'fa-bolt' : 'fa-hourglass-half';
                          return (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style}`}>
                              <i className={`fas ${icon} text-[9px]`}></i>
                              {label}{days > 7 ? ' — Action needed' : days > 2 ? ' — Overdue' : ''}
                            </span>
                          );
                        })()}
                      </p>
                    </div>

                    {/* Close button */}
                    <button
                      onClick={closeModal}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/15 transition-all"
                    >
                      <i className="fas fa-times text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Scrollable Body ── */}
              <div className="overflow-y-auto flex-1 bg-[#eef0f6]">
                <div className="p-6 space-y-4">

                  {/* Confidence Score */}
                  <ConfidenceScore claim={selectedRequest} />

                  {/* Section 1 – Claimant + Found Item */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Claimant Information */}
                    <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-[3px] h-4 bg-blue-500 rounded-full"></div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Claimant Information</p>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: 'Full Name',      value: selectedRequest.claimantInfo.name,    icon: 'fa-user' },
                          { label: 'Email Address',  value: selectedRequest.claimantInfo.email,   icon: 'fa-envelope' },
                          { label: 'Phone',          value: selectedRequest.claimantInfo.phone,   icon: 'fa-phone' },
                          { label: 'Faculty / Year', value: selectedRequest.claimantInfo.address, icon: 'fa-building' },
                        ].map(({ label, value, icon }) => (
                          <div key={label} className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                              <i className={`fas ${icon} text-blue-500 text-xs`}></i>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                              <p className="text-sm text-slate-800 font-semibold break-words mt-0.5">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Found Item */}
                    <div className="bg-gradient-to-br from-teal-50/70 to-slate-50/40 border border-teal-100 rounded-xl p-5 shadow-md shadow-teal-100/40">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-[3px] h-4 bg-teal-500 rounded-full"></div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Found Item</p>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: 'Item Name',  value: selectedRequest.itemId?.itemName || 'N/A', icon: 'fa-tag' },
                          { label: 'Category',   value: selectedRequest.itemId?.category  || 'N/A', icon: 'fa-list' },
                          { label: 'Found At',   value: selectedRequest.itemId?.location  || 'N/A', icon: 'fa-map-marker-alt' },
                          { label: 'Date Found', value: selectedRequest.itemId?.dateTime
                              ? new Date(selectedRequest.itemId.dateTime).toLocaleDateString()
                              : 'N/A', icon: 'fa-calendar' },
                        ].map(({ label, value, icon }) => (
                          <div key={label} className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                              <i className={`fas ${icon} text-teal-600 text-xs`}></i>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                              <p className="text-sm text-slate-800 font-semibold break-words mt-0.5">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedRequest.itemId?.description && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Original Description</p>
                          <p className="text-sm text-slate-600 leading-relaxed">{selectedRequest.itemId.description}</p>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* ── Photo Comparison ── */}
                  {(() => {
                    const foundPhotos    = selectedRequest.itemId?.images     || [];
                    const claimantPhotos = selectedRequest.claimantImages     || [];
                    if (foundPhotos.length === 0 && claimantPhotos.length === 0) return null;
                    const openLb = (imgs, idx, lbl) => setLightbox({ open: true, images: imgs, index: idx, label: lbl });
                    return (
                      <div className="bg-white border border-slate-400 rounded-xl overflow-hidden shadow-sm">
                        {/* Header */}
                        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
                          <div className="w-[3px] h-4 bg-violet-500 rounded-full shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Photo Comparison</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Compare photos side-by-side to verify ownership</p>
                          </div>
                          <span className="text-[11px] text-slate-400 bg-white border border-slate-400 px-2.5 py-0.5 rounded-full shrink-0">
                            {foundPhotos.length + claimantPhotos.length} photo{(foundPhotos.length + claimantPhotos.length) !== 1 ? 's' : ''} total
                          </span>
                        </div>

                        {/* Two-column gallery */}
                        <div className="grid grid-cols-2 divide-x divide-slate-100">

                          {/* Left – Found Item */}
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-teal-400 shrink-0"></div>
                                <p className="text-xs font-bold text-teal-700 uppercase tracking-wide">Found Item</p>
                              </div>
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {foundPhotos.length} photo{foundPhotos.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <PhotoGalleryPanel
                              images={foundPhotos}
                              activeIdx={foundPhotoIdx}
                              setActiveIdx={setFoundPhotoIdx}
                              accentColor="teal"
                              label="Found Item"
                              onLightboxOpen={openLb}
                            />
                          </div>

                          {/* Right – Claimant */}
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></div>
                                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Claimant's Photos</p>
                              </div>
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {claimantPhotos.length} photo{claimantPhotos.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <PhotoGalleryPanel
                              images={claimantPhotos}
                              activeIdx={claimantPhotoIdx}
                              setActiveIdx={setClaimantPhotoIdx}
                              accentColor="amber"
                              label="Claimant's Photos"
                              onLightboxOpen={openLb}
                            />
                          </div>

                        </div>

                        {/* Footer hint */}
                        <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
                          <i className="fas fa-expand-alt text-slate-300 text-xs shrink-0"></i>
                          <p className="text-[11px] text-slate-400">
                            Click any photo to open full-screen · Use <kbd className="px-1 py-px bg-white border border-slate-400 rounded text-[10px] font-mono">←</kbd> <kbd className="px-1 py-px bg-white border border-slate-400 rounded text-[10px] font-mono">→</kbd> to navigate · <kbd className="px-1 py-px bg-white border border-slate-400 rounded text-[10px] font-mono">Esc</kbd> to close
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Section 2 – Ownership Verification */}
                  <div className="bg-gradient-to-br from-amber-50/70 to-white border border-amber-100 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-[3px] h-4 bg-amber-500 rounded-full"></div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Ownership Verification</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Item Description by Claimant</p>
                        <div className="bg-white rounded-lg p-3.5 text-sm text-slate-700 leading-relaxed border border-amber-100 min-h-[72px]">
                          {selectedRequest.verificationDetails.description}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Proof of Ownership</p>
                        <div className="bg-white rounded-lg p-3.5 text-sm text-slate-700 leading-relaxed border border-amber-100 min-h-[72px]">
                          {selectedRequest.verificationDetails.ownershipProof}
                        </div>
                      </div>
                      {selectedRequest.verificationDetails.additionalInfo && (
                        <div className="md:col-span-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Additional Information</p>
                          <div className="bg-white rounded-lg p-3.5 text-sm text-slate-700 leading-relaxed border border-amber-100">
                            {selectedRequest.verificationDetails.additionalInfo}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Processing record – only when processed */}
                  {selectedRequest.processedAt && (
                    <div className="bg-slate-50 border border-slate-400 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-[3px] h-4 bg-slate-400 rounded-full"></div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Processing Record</p>
                      </div>
                      <div className="flex flex-wrap gap-8">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Processed On</p>
                          <p className="text-sm text-slate-800 font-semibold mt-0.5">{new Date(selectedRequest.processedAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Processed By</p>
                          <p className="text-sm text-slate-800 font-semibold mt-0.5">{selectedRequest.processedBy || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 3 – Approval Stages */}
                  <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-indigo-100/60 rounded-xl overflow-hidden shadow-md shadow-indigo-100/30">

                    {/* Section heading */}
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-indigo-100/50 bg-white/60">
                      <div className="w-[3px] h-4 bg-indigo-500 rounded-full"></div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Approval Stages</p>
                        <p className="text-xs text-slate-400 mt-0.5">Complete each stage in order · Stage 3 finalizes the decision</p>
                      </div>
                    </div>

                    {/* Progress tracker */}
                    <div className="flex items-start px-10 pt-6 pb-4">
                      {STAGE_CONFIGS.map((s, idx) => {
                        const st = approvalStages[s.key];
                        const prevKey = idx > 0 ? `stage${idx}` : null;
                        const isCurrent = selectedRequest.status === 'pending' &&
                          st.status === 'pending' &&
                          (idx === 0 || (prevKey && approvalStages[prevKey].status === 'passed'));

                        return (
                          <div key={s.key} className="flex items-start flex-1 min-w-0">
                            {/* Node + label */}
                            <div className="flex flex-col items-center shrink-0">
                              {/* Outer ring only on current step */}
                              <div className={isCurrent ? 'p-1 rounded-full bg-blue-100/70' : 'p-1'}>
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                                  st.status === 'passed' ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-200' :
                                  st.status === 'failed'  ? 'bg-red-500 border-red-400 text-white shadow-sm shadow-red-200' :
                                  isCurrent              ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-200' :
                                                           'bg-white border-slate-200 text-slate-300'
                                }`}>
                                  {st.status === 'passed' ? <i className="fas fa-check text-[11px]"></i> :
                                   st.status === 'failed'  ? <i className="fas fa-times text-[11px]"></i> :
                                   isCurrent              ? <i className="fas fa-circle-notch text-[11px]"></i> :
                                                            <span>{idx + 1}</span>}
                                </div>
                              </div>
                              <p className={`text-[11px] mt-1.5 font-semibold text-center leading-tight max-w-[68px] ${
                                st.status === 'passed' ? 'text-emerald-600' :
                                st.status === 'failed'  ? 'text-red-500' :
                                isCurrent              ? 'text-blue-600' :
                                                         'text-slate-400'
                              }`}>
                                {['Basic\nMatching', 'Ownership\nCheck', 'Final\nDecision'][idx].split('\n').map((line, i) => (
                                  <span key={i} className="block">{line}</span>
                                ))}
                              </p>
                            </div>

                            {/* Connector */}
                            {idx < 2 && (
                              <div className={`flex-1 h-[2px] mt-[22px] mx-1 rounded-full transition-colors ${
                                st.status === 'passed' ? 'bg-emerald-400' : 'bg-slate-200'
                              }`}></div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Stage cards */}
                    <div className="px-5 pb-5 space-y-3">
                      {STAGE_CONFIGS.map((stageDef, idx) => {
                        const stage = approvalStages[stageDef.key];
                        const prevKey = idx > 0 ? `stage${idx}` : null;
                        const isEnabled = selectedRequest.status === 'pending' && (
                          idx === 0 || (prevKey && approvalStages[prevKey].status === 'passed')
                        );
                        const isCurrent = isEnabled && stage.status === 'pending';
                        const isLocked  = !isEnabled && selectedRequest.status === 'pending';

                        return (
                          <div
                            key={stageDef.key}
                            className={`rounded-xl overflow-hidden transition-all ${
                              isCurrent              ? 'border-2 border-blue-400 shadow-lg shadow-blue-100/50' :
                              stage.status === 'passed' ? 'border border-emerald-200' :
                              stage.status === 'failed'  ? 'border border-red-200' :
                                                           'border border-slate-400'
                            } ${isLocked ? 'opacity-40' : ''}`}
                          >
                            {/* Card header — colour changes per state */}
                            <div className={`flex items-center justify-between px-4 py-3 ${
                              isCurrent              ? 'bg-gradient-to-r from-blue-600 to-blue-500' :
                              stage.status === 'passed' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                              stage.status === 'failed'  ? 'bg-gradient-to-r from-red-500 to-red-400' :
                                                           'bg-slate-50 border-b border-slate-100'
                            }`}>
                              <div className="flex items-center gap-2.5">
                                {/* Step badge */}
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isCurrent || stage.status !== 'pending' ? 'bg-white/20 text-white' : 'bg-white text-slate-400'
                                }`}>
                                  {stage.status === 'passed' ? <i className="fas fa-check"></i> :
                                   stage.status === 'failed'  ? <i className="fas fa-times"></i> :
                                                                idx + 1}
                                </div>
                                <div>
                                  <p className={`text-sm font-semibold leading-tight ${
                                    isCurrent || stage.status !== 'pending' ? 'text-white' : 'text-slate-700'
                                  }`}>{stageDef.label}</p>
                                  <p className={`text-xs leading-tight mt-0.5 ${
                                    isCurrent              ? 'text-blue-100' :
                                    stage.status === 'passed' ? 'text-emerald-100' :
                                    stage.status === 'failed'  ? 'text-red-100' :
                                                               'text-slate-400'
                                  }`}>{stageDef.description}</p>
                                </div>
                              </div>

                              {/* State chip */}
                              {isCurrent && (
                                <span className="text-[11px] font-semibold text-white/90 bg-white/15 border border-white/20 px-2.5 py-1 rounded-full shrink-0">
                                  Active
                                </span>
                              )}
                              {stage.status === 'passed' && (
                                <span className="text-[11px] font-bold text-white bg-white/20 border border-white/25 px-2.5 py-1 rounded-full shrink-0">
                                  <i className="fas fa-check mr-1 text-[9px]"></i>Passed
                                </span>
                              )}
                              {stage.status === 'failed' && (
                                <span className="text-[11px] font-bold text-white bg-white/20 border border-white/25 px-2.5 py-1 rounded-full shrink-0">
                                  <i className="fas fa-times mr-1 text-[9px]"></i>Failed
                                </span>
                              )}
                              {isLocked && (
                                <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full shrink-0">
                                  <i className="fas fa-lock mr-1 text-[9px]"></i>Locked
                                </span>
                              )}
                            </div>

                            {/* Card body — actions + notes */}
                            {(isEnabled || stage.notes) && (
                              <div className="px-4 py-3 bg-white/90">
                                {/* Pass / Fail buttons */}
                                {isEnabled && (
                                  <div className="flex gap-2 mb-3">
                                    <button
                                      onClick={() => {
                                        setRejectionPicker(null);
                                        setPendingReason('');
                                        handleStageDecision(stageDef.key, 'passed');
                                      }}
                                      disabled={actionLoading || saveLoading}
                                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${
                                        stage.status === 'passed'
                                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                          : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700'
                                      }`}
                                    >
                                      <i className="fas fa-check text-[10px]"></i>
                                      {stageDef.isFinal ? 'Approve Request' : 'Mark as Passed'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setPendingReason('');
                                        setRejectionPicker(prev => prev === stageDef.key ? null : stageDef.key);
                                      }}
                                      disabled={actionLoading || saveLoading}
                                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${
                                        stage.status === 'failed'
                                          ? 'bg-red-500 border-red-500 text-white shadow-sm'
                                          : rejectionPicker === stageDef.key
                                          ? 'bg-red-50 border-red-400 text-red-600'
                                          : 'bg-white border-slate-200 text-slate-600 hover:border-red-400 hover:bg-red-50 hover:text-red-600'
                                      }`}
                                    >
                                      <i className="fas fa-times text-[10px]"></i>
                                      {stageDef.isFinal ? 'Reject Request' : 'Mark as Failed'}
                                    </button>
                                  </div>
                                )}

                                {/* Rejection reason picker */}
                                {isEnabled && rejectionPicker === stageDef.key && (
                                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50/60 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-red-500 mb-2 flex items-center gap-1.5">
                                      <i className="fas fa-circle-exclamation text-[10px]"></i>
                                      Select a rejection reason
                                    </p>
                                    <div className="flex flex-col gap-1.5 mb-3">
                                      {REJECTION_REASONS[stageDef.key].map(reason => (
                                        <label
                                          key={reason}
                                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer text-xs font-medium transition-all ${
                                            pendingReason === reason
                                              ? 'bg-red-100 border-red-400 text-red-700'
                                              : 'bg-white border-slate-200 text-slate-600 hover:border-red-300 hover:bg-red-50/50'
                                          }`}
                                        >
                                          <input
                                            type="radio"
                                            name={`reason-${stageDef.key}`}
                                            value={reason}
                                            checked={pendingReason === reason}
                                            onChange={() => setPendingReason(reason)}
                                            className="accent-red-500 shrink-0"
                                          />
                                          {reason}
                                        </label>
                                      ))}
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => { setRejectionPicker(null); setPendingReason(''); }}
                                        className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        disabled={!pendingReason || actionLoading || saveLoading}
                                        onClick={() => {
                                          handleStageDecision(stageDef.key, 'failed', pendingReason);
                                          setRejectionPicker(null);
                                          setPendingReason('');
                                        }}
                                        className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-red-500 text-white border border-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                                      >
                                        <i className="fas fa-times text-[10px]"></i>
                                        Confirm {stageDef.isFinal ? 'Rejection' : 'Failure'}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Show stored rejection reason on failed stages */}
                                {stage.status === 'failed' && stage.notes && (
                                  <div className="mb-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                    <i className="fas fa-circle-xmark text-red-400 text-xs mt-0.5 shrink-0"></i>
                                    <p className="text-xs text-red-700 font-medium leading-snug">{stage.notes.split('\n')[0]}</p>
                                  </div>
                                )}

                                {/* Notes textarea */}
                                <textarea
                                  value={stage.notes}
                                  onChange={(e) => setApprovalStages(prev => ({
                                    ...prev,
                                    [stageDef.key]: { ...prev[stageDef.key], notes: e.target.value }
                                  }))}
                                  disabled={!isEnabled}
                                  rows={2}
                                  placeholder="Stage notes…"
                                  className={`w-full text-xs rounded-lg px-3 py-2 resize-none transition-colors focus:outline-none ${
                                    isEnabled
                                      ? 'border border-slate-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-300'
                                      : 'bg-slate-50 border border-slate-100 text-slate-500 cursor-default'
                                  }`}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 4 – Admin Notes */}
                  <div className="bg-gradient-to-br from-violet-50/40 to-slate-50 border border-violet-100/60 rounded-xl p-5 shadow-md shadow-violet-100/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-[3px] h-4 bg-violet-500 rounded-full"></div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Admin Notes</p>
                    </div>
                    {selectedRequest.notes && selectedRequest.status !== 'pending' && (
                      <div className="mb-3 bg-slate-50 rounded-lg p-3.5 text-sm text-slate-700 border border-slate-400 leading-relaxed">
                        {selectedRequest.notes}
                      </div>
                    )}
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows="3"
                      className="w-full border border-slate-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-sm text-slate-700 placeholder-slate-400 resize-none transition-colors"
                      placeholder="Add notes about your decision or any additional context…"
                    />
                  </div>

                </div>
              </div>

              {/* ── Sticky Footer ── */}
              <div className="bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between shrink-0 shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  {selectedRequest.status === 'pending'
                    ? 'Work through the approval stages to make a decision, then save your progress.'
                    : `This request was ${selectedRequest.status} on ${new Date(selectedRequest.processedAt || selectedRequest.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`}
                </p>
                <div className="flex items-center gap-3">
                  {/* Delete — only for resolved records */}
                  {['approved', 'rejected', 'processed'].includes(selectedRequest.status) && (
                    <button
                      onClick={() => handleDelete(selectedRequest._id)}
                      disabled={deleteLoading === selectedRequest._id}
                      className={`px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                        deleteConfirm === selectedRequest._id
                          ? 'bg-red-600 border-red-600 text-white animate-pulse'
                          : 'bg-white border-red-200 text-red-500 hover:bg-red-50'
                      }`}
                    >
                      {deleteLoading === selectedRequest._id
                        ? <><i className="fas fa-spinner fa-spin text-xs"></i>Deleting…</>
                        : deleteConfirm === selectedRequest._id
                          ? <><i className="fas fa-exclamation-triangle text-xs"></i>Confirm Delete?</>
                          : <><i className="fas fa-trash text-xs"></i>Delete Record</>
                      }
                    </button>
                  )}
                  <button
                    onClick={closeModal}
                    disabled={actionLoading || saveLoading}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-400 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Close
                  </button>
                  {selectedRequest.status === 'pending' && (
                    <button
                      onClick={handleSaveStages}
                      disabled={saveLoading || actionLoading}
                      className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
                    >
                      {saveLoading ? (
                        <><i className="fas fa-spinner fa-spin text-xs"></i>Saving…</>
                      ) : (
                        <><i className="fas fa-save text-xs"></i>Save Progress</>
                      )}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── Collection Confirmation Modal ── */}
        {collectionModal.open && collectionModal.request && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="relative bg-gradient-to-r from-teal-600 to-emerald-600 px-7 py-6 overflow-hidden">
                <div className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-200/70 mb-1.5">Item Handover</p>
                    <h2 className="text-xl font-bold text-white tracking-tight">Confirm Collection</h2>
                    <p className="text-teal-100 text-xs mt-1">Enter the 6-digit PIN from the student's approval email</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 shrink-0">
                    <i className="fas fa-hand-holding text-white text-lg"></i>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">

                {/* Claimant + item summary */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-400">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-white text-sm font-bold">
                        {collectionModal.request.claimantInfo.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{collectionModal.request.claimantInfo.name}</p>
                      <p className="text-xs text-slate-500 truncate">{collectionModal.request.claimantInfo.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                    <i className="fas fa-tag text-slate-300 text-[10px]"></i>
                    <span className="font-semibold text-slate-700">{collectionModal.request.itemId?.itemName || 'Item'}</span>
                    {collectionModal.request.itemId?.category && (
                      <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-indigo-100">
                        {collectionModal.request.itemId.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* PIN input */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                    Collection PIN
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={collectionModal.pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCollectionModal(prev => ({ ...prev, pin: val, error: '' }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && collectionModal.pin.length === 6) handleConfirmCollection();
                      if (e.key === 'Escape') setCollectionModal({ open: false, request: null, pin: '', loading: false, error: '' });
                    }}
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                    className="w-full text-center text-4xl font-mono font-black tracking-[0.5em] py-5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all text-slate-700 placeholder-slate-200"
                  />
                  {/* PIN progress dots */}
                  <div className="flex justify-center gap-2 mt-3">
                    {[0,1,2,3,4,5].map(i => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i < collectionModal.pin.length
                            ? 'bg-teal-500 scale-110'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  {/* Error message */}
                  {collectionModal.error && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                      <i className="fas fa-exclamation-circle shrink-0"></i>
                      {collectionModal.error}
                    </div>
                  )}
                </div>

                {/* Info hint */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-700">
                  <i className="fas fa-info-circle shrink-0 mt-0.5 text-blue-400"></i>
                  <span>
                    The student received this PIN when their claim was approved. Ask them to show it on their phone or a printed copy.
                    Also verify their <strong>Student ID</strong> before confirming.
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => setCollectionModal({ open: false, request: null, pin: '', loading: false, error: '' })}
                  disabled={collectionModal.loading}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-400 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCollection}
                  disabled={collectionModal.loading || collectionModal.pin.length !== 6}
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-teal-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {collectionModal.loading ? (
                    <><i className="fas fa-spinner fa-spin text-xs"></i> Confirming…</>
                  ) : (
                    <><i className="fas fa-check-circle text-xs"></i> Confirm Handover</>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── Lightbox ── */}
        {lightbox.open && (
          <div
            className="fixed inset-0 z-[60] bg-black/92 flex items-center justify-center p-4"
            onClick={() => setLightbox(p => ({ ...p, open: false }))}
          >
            <div
              className="relative flex flex-col items-center w-full max-w-4xl max-h-[92vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between w-full mb-3 px-1">
                <div>
                  <p className="text-white text-sm font-semibold leading-tight">{lightbox.label}</p>
                  {lightbox.images.length > 1 && (
                    <p className="text-slate-400 text-xs mt-0.5 font-mono">
                      {lightbox.index + 1} / {lightbox.images.length}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setLightbox(p => ({ ...p, open: false }))}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  aria-label="Close"
                >
                  <i className="fas fa-times text-sm"></i>
                </button>
              </div>

              {/* Image + nav arrows */}
              <div className="relative flex items-center justify-center w-full">
                {lightbox.images.length > 1 && (
                  <button
                    onClick={() => setLightbox(p => ({ ...p, index: (p.index - 1 + p.images.length) % p.images.length }))}
                    className="absolute left-0 -translate-x-5 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors shadow-lg"
                    aria-label="Previous"
                  >
                    <i className="fas fa-chevron-left text-sm"></i>
                  </button>
                )}

                <img
                  key={lightbox.index}
                  src={lightbox.images[lightbox.index]}
                  alt={`${lightbox.label} ${lightbox.index + 1}`}
                  className="max-w-full max-h-[74vh] object-contain rounded-xl shadow-2xl select-none"
                  draggable={false}
                />

                {lightbox.images.length > 1 && (
                  <button
                    onClick={() => setLightbox(p => ({ ...p, index: (p.index + 1) % p.images.length }))}
                    className="absolute right-0 translate-x-5 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors shadow-lg"
                    aria-label="Next"
                  >
                    <i className="fas fa-chevron-right text-sm"></i>
                  </button>
                )}
              </div>

              {/* Thumbnail strip */}
              {lightbox.images.length > 1 && (
                <div className="flex gap-2 justify-center mt-4 overflow-x-auto max-w-full pb-1">
                  {lightbox.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightbox(p => ({ ...p, index: i }))}
                      className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        i === lightbox.index
                          ? 'border-white opacity-100 ring-1 ring-white/40 ring-offset-1 ring-offset-black/50'
                          : 'border-transparent opacity-35 hover:opacity-65'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                    </button>
                  ))}
                </div>
              )}

              {/* Dismiss hint */}
              <p className="text-slate-600 text-[11px] mt-3">Click outside or press Esc to close</p>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
