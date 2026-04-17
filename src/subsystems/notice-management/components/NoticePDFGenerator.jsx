import { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import sliitLogo from '../../../assets/SLIIT_Logo_Crest.png';

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  indigo900: '#1e1b4b',
  indigo700: '#3730a3',
  indigo600: '#4f46e5',
  indigo100: '#e0e7ff',
  indigo50:  '#eef2ff',
  cyan700:   '#0e7490',
  cyan50:    '#ecfeff',
  orange700: '#c2410c',
  orange50:  '#fff7ed',
  violet700: '#6d28d9',
  violet50:  '#f5f3ff',
  blue700:   '#1d4ed8',
  blue50:    '#eff6ff',
  red700:    '#b91c1c',
  red50:     '#fef2f2',
  green700:  '#15803d',
  green50:   '#f0fdf4',
  yellow700: '#a16207',
  yellow50:  '#fefce8',
  gray800:   '#1f2937',
  gray700:   '#374151',
  gray600:   '#4b5563',
  gray500:   '#6b7280',
  gray400:   '#9ca3af',
  gray200:   '#e5e7eb',
  gray100:   '#f3f4f6',
  gray50:    '#f9fafb',
  white:     '#ffffff',
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 64,
    paddingHorizontal: 36,
    backgroundColor: C.white,
    fontFamily: 'Helvetica',
  },

  // ── Cover header ──
  coverBand: {
    backgroundColor: C.indigo900,
    marginHorizontal: -36,
    paddingHorizontal: 36,
    paddingTop: 32,
    paddingBottom: 24,
    marginBottom: 24,
  },
  coverEyebrow: {
    fontSize: 8,
    color: '#a5b4fc',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  coverTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    marginBottom: 4,
  },
  coverSubtitle: {
    fontSize: 10,
    color: '#c7d2fe',
    marginBottom: 16,
  },
  coverMeta: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 4,
  },
  coverMetaItem: {
    fontSize: 8,
    color: '#a5b4fc',
  },
  coverMetaValue: {
    fontSize: 9,
    color: C.white,
    fontFamily: 'Helvetica-Bold',
  },
  coverDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 14,
  },

  // ── Section titles ──
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.indigo700,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.indigo100,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionBlock: {
    marginBottom: 32,
  },

  // ── Stat grid ──
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  statCard: {
    width: '31%',
    backgroundColor: C.gray50,
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: C.indigo600,
  },
  statCardAccent: { borderLeftColor: C.indigo600 },
  statCardCyan:   { borderLeftColor: C.cyan700, backgroundColor: C.cyan50 },
  statCardOrange: { borderLeftColor: C.orange700, backgroundColor: C.orange50 },
  statCardViolet: { borderLeftColor: C.violet700, backgroundColor: C.violet50 },
  statCardBlue:   { borderLeftColor: C.blue700, backgroundColor: C.blue50 },
  statCardGreen:  { borderLeftColor: C.green700, backgroundColor: C.green50 },
  statLabel: {
    fontSize: 7,
    color: C.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: C.gray800,
    lineHeight: 1,
  },
  statSub: {
    fontSize: 7,
    color: C.gray400,
    marginTop: 2,
  },

  // ── Priority pills ──
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  pillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  pillCount: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Table ──
  table: {
    borderWidth: 1,
    borderColor: C.gray200,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tHead: {
    flexDirection: 'row',
    backgroundColor: C.indigo900,
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  tHeadCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#c7d2fe',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: C.gray100,
    alignItems: 'center',
  },
  tRowAlt: {
    backgroundColor: C.gray50,
  },
  tCell: {
    fontSize: 8,
    color: C.gray700,
  },
  tCellBold: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.gray800,
  },

  // Column widths — notice table
  col_no:       { width: '4%'  },
  col_title:    { width: '24%' },
  col_cat:      { width: '13%' },
  col_type:     { width: '13%' },
  col_priority: { width: '10%' },
  col_audience: { width: '15%' },
  col_contact:  { width: '21%' },

  // Column widths — audience table
  colA_label: { width: '60%' },
  colA_count: { width: '20%' },
  colA_pct:   { width: '20%' },

  // ── Inline badge ──
  badge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: C.gray200,
    paddingTop: 8,
  },
  footerLeft: {
    fontSize: 8,
    color: C.indigo600,
    fontFamily: 'Helvetica-Bold',
  },
  footerRight: {
    fontSize: 7,
    color: C.gray400,
  },

  // ── Item type dist ──
  itemTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  itemTypeCard: {
    width: '23%',
    backgroundColor: C.gray50,
    borderRadius: 5,
    padding: 7,
    borderWidth: 1,
    borderColor: C.gray200,
    alignItems: 'center',
  },
  itemTypeCount: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: C.indigo700,
  },
  itemTypeLabel: {
    fontSize: 6,
    color: C.gray500,
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Truncate long strings cleanly for table cells
const trunc = (str, max = 24) => {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
};

// Keep email on one line — show full if ≤26 chars, otherwise clip after @domain start
const shortEmail = (email) => {
  if (!email) return null;
  if (email.length <= 26) return email;
  const atIdx = email.indexOf('@');
  if (atIdx > 0) return email.slice(0, atIdx) + '@…';
  return trunc(email, 24);
};

const pct = (n, total) => total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`;

const categoryLabel = (cat) => {
  const map = {
    'lost-item':    'Lost Item',
    'found-item':   'Found Item',
    'announcement': 'Announcement',
    'advisory':     'Advisory',
  };
  return map[cat] || (cat ? cat.replace(/-/g, ' ') : '—');
};

const itemTypeLabel = (t) => {
  if (!t) return '—';
  return t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const priorityColors = {
  urgent: { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' },
  medium: { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  low:    { bg: '#fefce8', text: '#a16207', dot: '#eab308' },
};

const categoryColors = {
  'lost-item':    { bg: '#fff7ed', text: '#c2410c' },
  'found-item':   { bg: '#ecfeff', text: '#0e7490' },
  'announcement': { bg: '#eff6ff', text: '#1d4ed8' },
  'advisory':     { bg: '#f5f3ff', text: '#6d28d9' },
};

// ─── PDF Document ─────────────────────────────────────────────────────────────
const NoticePDF = ({ data }) => {
  const notices     = data.notices  || [];
  const filterSummary = data.filterSummary || '';
  const total       = notices.length;
  const generatedAt = new Date();

  // Category counts
  const catCount = {
    lostItem:     notices.filter(n => n.category === 'lost-item').length,
    foundItem:    notices.filter(n => n.category === 'found-item').length,
    announcement: notices.filter(n => n.category === 'announcement').length,
    advisory:     notices.filter(n => n.category === 'advisory').length,
  };

  // Priority counts
  const priCount = {
    urgent: notices.filter(n => n.priority === 'urgent').length,
    medium: notices.filter(n => n.priority === 'medium').length,
    low:    notices.filter(n => n.priority === 'low').length,
  };

  // Audience counts
  const AUDIENCES = [
    { key: 'all-university',    label: 'All University Community' },
    { key: 'all-students',      label: 'All Students' },
    { key: 'undergraduate',     label: 'Undergraduate Students' },
    { key: 'postgraduate',      label: 'Postgraduate Students' },
    { key: 'academic-staff',    label: 'Academic Staff' },
    { key: 'non-academic-staff',label: 'Non-Academic Staff' },
  ];
  const audienceCounts = AUDIENCES.map(a => ({
    ...a,
    count: notices.filter(n => n.targetAudience === a.key).length,
  })).filter(a => a.count > 0);

  // Item type distribution (top 8)
  const itemTypeMap = {};
  notices.forEach(n => {
    if (n.itemType) itemTypeMap[n.itemType] = (itemTypeMap[n.itemType] || 0) + 1;
  });
  const topItemTypes = Object.entries(itemTypeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <Document title="UniFind Administrative Report">
      <Page size="A4" style={s.page}>

        {/* ── Cover Band ── */}
        <View style={s.coverBand}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={s.coverEyebrow}>University Lost & Found Management</Text>
              <Text style={s.coverTitle}>UniFind Notice Board</Text>
              <Text style={s.coverSubtitle}>Administrative Report — Official Notice Record</Text>
            </View>
            <Image src={sliitLogo} style={{ width: 64, height: 72, objectFit: 'contain', marginRight: 20 }} />
          </View>
          <View style={s.coverDivider} />
          <View style={s.coverMeta}>
            <View>
              <Text style={s.coverMetaItem}>Generated On</Text>
              <Text style={s.coverMetaValue}>{generatedAt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
            <View>
              <Text style={s.coverMetaItem}>Time</Text>
              <Text style={s.coverMetaValue}>{generatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View>
              <Text style={s.coverMetaItem}>Total Notices</Text>
              <Text style={s.coverMetaValue}>{total}</Text>
            </View>
            {filterSummary ? (
              <View>
                <Text style={s.coverMetaItem}>Filter Applied</Text>
                <Text style={s.coverMetaValue}>{filterSummary}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Notice Overview ── */}
        <View style={[s.sectionBlock, { marginTop: 14 }]}>
          <Text style={s.sectionTitle}>Notice Overview</Text>
          <View style={s.statGrid}>
            <View style={[s.statCard, s.statCardAccent]}>
              <Text style={s.statLabel}>Total Notices</Text>
              <Text style={s.statValue}>{total}</Text>
              <Text style={s.statSub}>All categories combined</Text>
            </View>
            <View style={[s.statCard, s.statCardOrange]}>
              <Text style={s.statLabel}>Lost Items</Text>
              <Text style={[s.statValue, { color: C.orange700 }]}>{catCount.lostItem}</Text>
              <Text style={s.statSub}>{pct(catCount.lostItem, total)} of total</Text>
            </View>
            <View style={[s.statCard, s.statCardCyan]}>
              <Text style={s.statLabel}>Found Items</Text>
              <Text style={[s.statValue, { color: C.cyan700 }]}>{catCount.foundItem}</Text>
              <Text style={s.statSub}>{pct(catCount.foundItem, total)} of total</Text>
            </View>
            <View style={[s.statCard, s.statCardBlue]}>
              <Text style={s.statLabel}>Announcements</Text>
              <Text style={[s.statValue, { color: C.blue700 }]}>{catCount.announcement}</Text>
              <Text style={s.statSub}>{pct(catCount.announcement, total)} of total</Text>
            </View>
            <View style={[s.statCard, s.statCardViolet]}>
              <Text style={s.statLabel}>Advisories</Text>
              <Text style={[s.statValue, { color: C.violet700 }]}>{catCount.advisory}</Text>
              <Text style={s.statSub}>{pct(catCount.advisory, total)} of total</Text>
            </View>
            <View style={[s.statCard, s.statCardGreen]}>
              <Text style={s.statLabel}>Item Recovery Rate</Text>
              <Text style={[s.statValue, { color: C.green700 }]}>
                {catCount.lostItem > 0 ? pct(catCount.foundItem, catCount.lostItem + catCount.foundItem) : '—'}
              </Text>
              <Text style={s.statSub}>Found vs Lost+Found</Text>
            </View>
          </View>
        </View>

        {/* ── Priority Breakdown ── */}
        <View style={s.sectionBlock}>
          <Text style={s.sectionTitle}>Priority Breakdown</Text>
          <View style={s.pillRow}>
            {[
              { key: 'urgent', label: 'Urgent' },
              { key: 'medium', label: 'Medium' },
              { key: 'low',    label: 'Low'    },
            ].map(({ key, label }) => {
              const col = priorityColors[key];
              return (
                <View key={key} style={[s.pillCard, { backgroundColor: col.bg, width: '31%' }]}>
                  <View style={[s.pillDot, { backgroundColor: col.dot }]} />
                  <View>
                    <Text style={[s.pillLabel, { color: col.text }]}>{label}</Text>
                    <Text style={[s.pillCount, { color: col.text }]}>{priCount[key]}</Text>
                  </View>
                  <Text style={[s.statSub, { marginLeft: 'auto', color: col.text, opacity: 0.7 }]}>
                    {pct(priCount[key], total)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Category Visual Bar ── */}
        {total > 0 && (
          <View style={s.sectionBlock}>
            <Text style={s.sectionTitle}>Category Breakdown</Text>
            {/* Stacked bar */}
            <View style={{ flexDirection: 'row', height: 18, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
              {catCount.lostItem > 0 && (
                <View style={{ flex: catCount.lostItem, backgroundColor: '#f97316' }} />
              )}
              {catCount.foundItem > 0 && (
                <View style={{ flex: catCount.foundItem, backgroundColor: '#06b6d4' }} />
              )}
              {catCount.announcement > 0 && (
                <View style={{ flex: catCount.announcement, backgroundColor: '#3b82f6' }} />
              )}
              {catCount.advisory > 0 && (
                <View style={{ flex: catCount.advisory, backgroundColor: '#8b5cf6' }} />
              )}
            </View>
            {/* Legend */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[
                { label: 'Lost Items',     count: catCount.lostItem,     color: '#f97316' },
                { label: 'Found Items',    count: catCount.foundItem,    color: '#06b6d4' },
                { label: 'Announcements',  count: catCount.announcement, color: '#3b82f6' },
                { label: 'Advisories',     count: catCount.advisory,     color: '#8b5cf6' },
              ].filter(l => l.count > 0).map(l => (
                <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: l.color }} />
                  <Text style={{ fontSize: 8, color: C.gray600 }}>{l.label}</Text>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gray800 }}>
                    {l.count} ({pct(l.count, total)})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Item Type Distribution ── */}
        {topItemTypes.length > 0 && (
          <View style={[s.sectionBlock, { marginTop: 14 }]}>
            <Text style={s.sectionTitle}>Item Type Distribution</Text>
            <View style={s.itemTypeGrid}>
              {topItemTypes.map(([type, count]) => (
                <View key={type} style={s.itemTypeCard}>
                  <Text style={s.itemTypeCount}>{count}</Text>
                  <Text style={s.itemTypeLabel}>{itemTypeLabel(type)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Target Audience Distribution (Page 2) ── */}
        {audienceCounts.length > 0 && (
          <View break style={[s.sectionBlock, { marginTop: 28 }]}>
            <Text style={s.sectionTitle}>Target Audience Distribution</Text>
            <View style={{ gap: 10 }}>
              {audienceCounts.map((a) => {
                const barPct = total === 0 ? 0 : Math.round((a.count / total) * 100);
                return (
                  <View key={a.key}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 9, color: C.gray700, fontFamily: 'Helvetica-Bold' }}>{a.label}</Text>
                      <Text style={{ fontSize: 9, color: C.gray500 }}>{a.count} notices · {barPct}%</Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: C.gray100, borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{ height: 8, width: `${barPct}%`, backgroundColor: C.indigo600, borderRadius: 4 }} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Notice List Table ── */}
        <View style={[s.sectionBlock, { marginTop: 28 }]}>
          <Text style={s.sectionTitle}>
            Notice List{notices.length > 20 ? ` (showing 20 of ${notices.length})` : ` (${notices.length} total)`}
          </Text>
          <View style={s.table}>
            <View style={s.tHead}>
              <Text style={[s.tHeadCell, s.col_no]}>#</Text>
              <Text style={[s.tHeadCell, s.col_title]}>Title</Text>
              <Text style={[s.tHeadCell, s.col_cat]}>Category</Text>
              <Text style={[s.tHeadCell, s.col_type]}>Item Type</Text>
              <Text style={[s.tHeadCell, s.col_priority]}>Priority</Text>
              <Text style={[s.tHeadCell, s.col_audience]}>Audience</Text>
              <Text style={[s.tHeadCell, s.col_contact]}>Contact</Text>
            </View>

            {notices.slice(0, 20).map((n, i) => {
              const catCol = categoryColors[n.category] || { bg: C.gray100, text: C.gray600 };
              const priCol = priorityColors[n.priority] || priorityColors.low;
              const contactDisplay = n.contactEmail
                ? shortEmail(n.contactEmail)
                : n.contactPhone
                  ? n.contactPhone
                  : trunc(n.postedBy, 18);
              return (
                <View key={i} wrap={false} style={[s.tRow, i % 2 === 1 ? s.tRowAlt : {}]}>
                  <Text style={[s.tCell, s.col_no, { color: C.gray400 }]}>{i + 1}</Text>
                  <Text style={[s.tCellBold, s.col_title]} numberOfLines={2}>{trunc(n.title, 34) || '—'}</Text>
                  <View style={s.col_cat}>
                    <Text style={[s.badge, { backgroundColor: catCol.bg, color: catCol.text }]}>
                      {categoryLabel(n.category)}
                    </Text>
                  </View>
                  <Text style={[s.tCell, s.col_type]}>{trunc(itemTypeLabel(n.itemType), 14)}</Text>
                  <View style={s.col_priority}>
                    <Text style={[s.badge, { backgroundColor: priCol.bg, color: priCol.text }]}>
                      {n.priority ? n.priority.charAt(0).toUpperCase() + n.priority.slice(1) : '—'}
                    </Text>
                  </View>
                  <Text style={[s.tCell, s.col_audience]}>
                    {n.targetAudience ? trunc(n.targetAudience.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), 18) : '—'}
                  </Text>
                  <Text style={[s.tCell, s.col_contact, { fontSize: 7 }]} numberOfLines={1}>{contactDisplay}</Text>
                </View>
              );
            })}

            {notices.length === 0 && (
              <View style={s.tRow}>
                <Text style={[s.tCell, { width: '100%', textAlign: 'center', color: C.gray400, fontStyle: 'italic' }]}>
                  No notices found
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>UniFind Administrator Portal  |  Official Notice Record</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text
              style={[s.footerRight, { color: C.indigo600, fontFamily: 'Helvetica-Bold' }]}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            />
            <Text style={s.footerRight}>© {generatedAt.getFullYear()} UniFind · Confidential</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};

// ─── Export Button ────────────────────────────────────────────────────────────
const NoticePDFGenerator = ({ notices, filterSummary = '' }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = async () => {
    setIsGenerating(true);
    try {
      const validNotices = Array.isArray(notices) ? notices : [];
      const blob = await pdf(
        <NoticePDF data={{ notices: validNotices, filterSummary }} />
      ).toBlob();

      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `unifind-notice-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate report: ' + (err.message || 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePdf}
      disabled={isGenerating}
      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50"
      style={{ background: 'transparent', border: 'none', color: '#ffffff' }}
      onMouseEnter={e => { if (!isGenerating) e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span
        className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0"
        style={{ background: 'rgba(99,102,241,0.25)' }}
      >
        {isGenerating
          ? <svg className="animate-spin w-3.5 h-3.5" style={{ color: '#a5b4fc' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          : <i className="fas fa-file-pdf text-xs" style={{ color: '#a5b4fc' }}></i>
        }
      </span>
      <span>{isGenerating ? 'Generating PDF...' : 'Export PDF Report'}</span>
    </button>
  );
};

export default NoticePDFGenerator;
