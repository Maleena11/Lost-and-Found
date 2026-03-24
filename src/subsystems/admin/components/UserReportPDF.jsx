import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

// ─── Colour palette ───────────────────────────────────────────────────────────
const BLUE   = "#2563EB";
const PURPLE = "#7C3AED";
const GREEN  = "#16A34A";
const RED    = "#DC2626";
const GRAY   = "#6B7280";
const LIGHT  = "#F3F4F6";
const DARK   = "#111827";

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    paddingTop: 0,
    paddingBottom: 50,
    paddingHorizontal: 0,
    fontSize: 9,
    color: DARK,
  },

  // ── Header band ──────────────────────────────────────────────────────────────
  headerBand: {
    backgroundColor: BLUE,
    paddingVertical: 28,
    paddingHorizontal: 40,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  reportTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  reportSubtitle: {
    color: "#BFDBFE",
    fontSize: 10,
    marginTop: 4,
  },
  badgeBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "flex-end",
  },
  badgeLabel: { color: "#BFDBFE", fontSize: 8, marginBottom: 2 },
  badgeValue: { color: "#FFFFFF", fontSize: 10, fontFamily: "Helvetica-Bold" },

  // ── Body padding ─────────────────────────────────────────────────────────────
  body: { paddingHorizontal: 40 },

  // ── Section title ────────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginTop: 22,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1.5,
    borderBottomColor: BLUE,
  },

  // ── Stat cards ───────────────────────────────────────────────────────────────
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  statCard: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  statLabel: { fontSize: 8, color: GRAY, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  statSub: { fontSize: 7, color: GRAY, marginTop: 2 },

  // ── Filter info ───────────────────────────────────────────────────────────────
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  filterChip: {
    backgroundColor: LIGHT,
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  filterChipLabel: { color: GRAY, fontSize: 8 },
  filterChipValue: { color: DARK, fontSize: 8, fontFamily: "Helvetica-Bold" },

  // ── Table ─────────────────────────────────────────────────────────────────────
  table: { marginTop: 4 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BLUE,
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableHeaderCell: {
    color: "#FFFFFF",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    alignItems: "center",
  },
  tableRowAlt: { backgroundColor: "#F9FAFB" },
  tableCell: { fontSize: 8.5, color: DARK },
  tableCellMuted: { fontSize: 8, color: GRAY },

  // Column widths
  colNo:     { width: "5%" },
  colName:   { width: "22%" },
  colEmail:  { width: "30%" },
  colRole:   { width: "13%" },
  colStatus: { width: "13%" },
  colJoined: { width: "17%" },

  // ── Role / Status badges ──────────────────────────────────────────────────────
  badge: {
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 7,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 7.5, fontFamily: "Helvetica-Bold" },

  // ── Summary line ─────────────────────────────────────────────────────────────
  summaryBox: {
    marginTop: 16,
    backgroundColor: LIGHT,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryText: { fontSize: 8.5, color: GRAY },
  summaryValue: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: DARK },

  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: BLUE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
  },
  footerText: { color: "#BFDBFE", fontSize: 8 },
  footerBold: { color: "#FFFFFF", fontSize: 8, fontFamily: "Helvetica-Bold" },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = dateStr => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
};

const RoleBadge = ({ role }) => (
  <View style={[s.badge, { backgroundColor: role === "Admin" ? "#EDE9FE" : "#DBEAFE" }]}>
    <Text style={[s.badgeText, { color: role === "Admin" ? PURPLE : BLUE }]}>{role}</Text>
  </View>
);

const StatusBadge = ({ status }) => (
  <View style={[s.badge, { backgroundColor: status === "Active" ? "#DCFCE7" : "#FEE2E2" }]}>
    <Text style={[s.badgeText, { color: status === "Active" ? GREEN : RED }]}>{status}</Text>
  </View>
);

// ─── PDF Document ─────────────────────────────────────────────────────────────
export default function UserReportPDF({ users, filters, generatedAt }) {
  const totalUsers    = users.length;
  const activeUsers   = users.filter(u => u.status === "Active").length;
  const inactiveUsers = users.filter(u => u.status === "Inactive").length;
  const adminUsers    = users.filter(u => u.role === "Admin").length;
  const regularUsers  = users.filter(u => u.role === "User").length;

  const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  return (
    <Document
      title="User Management Report"
      author="Lost & Found Admin"
      subject="User Management Report"
      creator="Lost & Found System"
    >
      <Page size="A4" style={s.page}>

        {/* ── Header Band ── */}
        <View style={s.headerBand}>
          <View style={s.headerTop}>
            <View>
              <Text style={s.reportTitle}>User Management Report</Text>
              <Text style={s.reportSubtitle}>Lost &amp; Found System — Admin Dashboard</Text>
            </View>
            <View style={s.badgeBox}>
              <Text style={s.badgeLabel}>Generated on</Text>
              <Text style={s.badgeValue}>{generatedAt}</Text>
            </View>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={s.body}>

          {/* ── Stats ── */}
          <Text style={s.sectionTitle}>Overview</Text>
          <View style={s.statsRow}>
            <View style={[s.statCard, { backgroundColor: "#EFF6FF" }]}>
              <Text style={[s.statLabel, { color: BLUE }]}>Total Users</Text>
              <Text style={[s.statValue, { color: BLUE }]}>{totalUsers}</Text>
              <Text style={s.statSub}>All registered accounts</Text>
            </View>
            <View style={[s.statCard, { backgroundColor: "#F0FDF4" }]}>
              <Text style={[s.statLabel, { color: GREEN }]}>Active</Text>
              <Text style={[s.statValue, { color: GREEN }]}>{activeUsers}</Text>
              <Text style={s.statSub}>{activeRate}% of total users</Text>
            </View>
            <View style={[s.statCard, { backgroundColor: "#FEF2F2" }]}>
              <Text style={[s.statLabel, { color: RED }]}>Inactive</Text>
              <Text style={[s.statValue, { color: RED }]}>{inactiveUsers}</Text>
              <Text style={s.statSub}>{100 - activeRate}% of total users</Text>
            </View>
            <View style={[s.statCard, { backgroundColor: "#F5F3FF" }]}>
              <Text style={[s.statLabel, { color: PURPLE }]}>Admins</Text>
              <Text style={[s.statValue, { color: PURPLE }]}>{adminUsers}</Text>
              <Text style={s.statSub}>{regularUsers} regular users</Text>
            </View>
          </View>

          {/* ── Applied Filters ── */}
          <Text style={s.sectionTitle}>Applied Filters</Text>
          <View style={s.filterRow}>
            <View style={s.filterChip}>
              <Text style={s.filterChipLabel}>Search: </Text>
              <Text style={s.filterChipValue}>{filters.search || "None"}</Text>
            </View>
            <View style={s.filterChip}>
              <Text style={s.filterChipLabel}>Role: </Text>
              <Text style={s.filterChipValue}>{filters.role}</Text>
            </View>
            <View style={s.filterChip}>
              <Text style={s.filterChipLabel}>Status: </Text>
              <Text style={s.filterChipValue}>{filters.status}</Text>
            </View>
            <View style={s.filterChip}>
              <Text style={s.filterChipLabel}>Records shown: </Text>
              <Text style={s.filterChipValue}>{totalUsers}</Text>
            </View>
          </View>

          {/* ── Users Table ── */}
          <Text style={s.sectionTitle}>User List</Text>
          <View style={s.table}>
            {/* Table header */}
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderCell, s.colNo]}>#</Text>
              <Text style={[s.tableHeaderCell, s.colName]}>Name</Text>
              <Text style={[s.tableHeaderCell, s.colEmail]}>Email</Text>
              <Text style={[s.tableHeaderCell, s.colRole]}>Role</Text>
              <Text style={[s.tableHeaderCell, s.colStatus]}>Status</Text>
              <Text style={[s.tableHeaderCell, s.colJoined]}>Joined</Text>
            </View>

            {/* Table rows */}
            {users.length === 0 ? (
              <View style={[s.tableRow, { justifyContent: "center", paddingVertical: 16 }]}>
                <Text style={{ color: GRAY, fontSize: 9 }}>No users match the selected filters.</Text>
              </View>
            ) : (
              users.map((user, idx) => (
                <View
                  key={user._id || user.id || idx}
                  style={[s.tableRow, idx % 2 === 1 && s.tableRowAlt]}
                >
                  <Text style={[s.tableCellMuted, s.colNo]}>{idx + 1}</Text>
                  <View style={s.colName}>
                    <Text style={[s.tableCell, { fontFamily: "Helvetica-Bold" }]}>{user.name || "—"}</Text>
                    <Text style={[s.tableCellMuted, { marginTop: 1 }]}>
                      #{(user._id || user.id || "").toString().slice(-6)}
                    </Text>
                  </View>
                  <Text style={[s.tableCell, s.colEmail]}>{user.email}</Text>
                  <View style={s.colRole}>
                    <RoleBadge role={user.role} />
                  </View>
                  <View style={s.colStatus}>
                    <StatusBadge status={user.status} />
                  </View>
                  <Text style={[s.tableCellMuted, s.colJoined]}>{fmt(user.createdAt)}</Text>
                </View>
              ))
            )}
          </View>

          {/* ── Summary Line ── */}
          <View style={s.summaryBox}>
            <Text style={s.summaryText}>Report covers {totalUsers} user(s) — Active: {activeUsers} · Inactive: {inactiveUsers} · Admins: {adminUsers}</Text>
            <Text style={s.summaryValue}>Generated: {generatedAt}</Text>
          </View>

        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Lost &amp; Found System — Confidential</Text>
          <Text style={s.footerText}>
            <Text style={s.footerBold}>Page </Text>
            <Text
              render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`}
            />
          </Text>
        </View>

      </Page>
    </Document>
  );
}
