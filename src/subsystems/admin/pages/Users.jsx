import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { pdf } from "@react-pdf/renderer";
import Sidebar from "./Sidebar";
import TopBar from "../components/TopBar";
import { validateUserForm, getFieldClassName } from "../../../shared/utils/userValidation";
import UserReportPDF from "../components/UserReportPDF";

// ─── Toast Notification Component ───────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm transition-all duration-300 ${
            toast.type === "success" ? "bg-green-600" :
            toast.type === "error"   ? "bg-red-600"   :
            "bg-blue-600"
          }`}
        >
          <span className="mt-0.5 flex-shrink-0">
            {toast.type === "success" && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.type === "error" && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {toast.type === "info" && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" />
              </svg>
            )}
          </span>
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="ml-auto opacity-70 hover:opacity-100">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── User Avatar ─────────────────────────────────────────────────────────────
function UserAvatar({ name, size = "sm" }) {
  const initials = name
    ? name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  const colors = [
    "bg-blue-500", "bg-purple-500", "bg-green-500",
    "bg-yellow-500", "bg-red-500", "bg-indigo-500", "bg-pink-500"
  ];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const sizeClass = size === "xl" ? "w-16 h-16 text-lg" : size === "lg" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";

  return (
    <span className={`inline-flex items-center justify-center rounded-full font-semibold text-white ${color} ${sizeClass}`}>
      {initials}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="pl-4 pr-2 py-4"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

const PAGE_SIZE = 8;

export default function UserManagement({ activeSection, setActiveSection, sidebarOpen, setSidebarOpen }) {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);

  // ── Toast ──
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // ── Search / Filter ──
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // ── Pagination ──
  const [currentPage, setCurrentPage] = useState(1);

  // ── Report generation ──
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // ── Add User Form ──
  const [showAddForm, setShowAddForm]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "", status: "" });
  const [newUserErrors, setNewUserErrors]   = useState({});
  const [newUserTouched, setNewUserTouched] = useState({});
  const [isFormValid, setIsFormValid]       = useState(false);

  // ── Edit Modal ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser]     = useState(null);
  const [editUser, setEditUser] = useState({ name: "", email: "", role: "User", status: "Active" });
  const [editUserErrors, setEditUserErrors]   = useState({});
  const [editUserTouched, setEditUserTouched] = useState({});
  const [isEditFormValid, setIsEditFormValid] = useState(false);

  // ── Delete Modal ──
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete]       = useState(null);
  const [isDeleting, setIsDeleting]           = useState(false);

  // ── View Modal ──
  const [showViewModal, setShowViewModal]     = useState(false);
  const [viewingUser, setViewingUser]         = useState(null);
  const [viewStats, setViewStats]             = useState({ itemsReported: 0, claimsSubmitted: 0 });
  const [loadingViewStats, setLoadingViewStats] = useState(false);

  // ── Role Promotion Confirmation ──
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);

  // ── Bulk Selection ──
  const [selectedIds, setSelectedIds]             = useState(new Set());
  const [isBulkProcessing, setIsBulkProcessing]   = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("http://localhost:3001/api/users");
      setUsers(data);
    } catch {
      addToast("Failed to fetch users. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Validation effects ────────────────────────────────────────────────────
  useEffect(() => {
    const errs = validateUserForm(newUser, true);
    setNewUserErrors(errs);
    setIsFormValid(Object.keys(errs).length === 0);
  }, [newUser]);

  useEffect(() => {
    const errs = validateUserForm(editUser, false);
    setEditUserErrors(errs);
    setIsEditFormValid(Object.keys(errs).length === 0);
  }, [editUser]);

  // ── Filtered / Paginated list ─────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const matchSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole   = filterRole   === "All" || u.role   === filterRole;
    const matchStatus = filterStatus === "All" || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages  = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage    = Math.min(currentPage, totalPages);
  const pagedUsers  = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 on filter change; also clear selection
  useEffect(() => { setCurrentPage(1); setSelectedIds(new Set()); }, [search, filterRole, filterStatus]);

  // ── Bulk selection derived ──
  const pagedIds        = pagedUsers.map(u => u._id || u.id);
  const allPageSelected = pagedIds.length > 0 && pagedIds.every(id => selectedIds.has(id));
  const somePageSelected = pagedIds.some(id => selectedIds.has(id)) && !allPageSelected;

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalUsers    = users.length;
  const activeUsers   = users.filter(u => u.status === "Active").length;
  const adminUsers    = users.filter(u => u.role === "Admin").length;
  const inactiveUsers = users.filter(u => u.status === "Inactive").length;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNewUserChange = e => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
    setNewUserTouched(prev => ({ ...prev, [name]: true }));
  };
  const handleNewUserBlur = e => setNewUserTouched(prev => ({ ...prev, [e.target.name]: true }));

  const handleAddUser = async e => {
    e.preventDefault();
    setNewUserTouched({ name: true, email: true, password: true, confirmPassword: true, role: true, status: true });
    if (!isFormValid) { addToast("Please fix validation errors before submitting.", "error"); return; }
    setIsSubmitting(true);
    try {
      const { data } = await axios.post("http://localhost:3001/api/users", newUser);
      setUsers(prev => [...prev, data]);
      setNewUser({ name: "", email: "", password: "", confirmPassword: "", role: "", status: "" });
      setNewUserTouched({});
      setShowAddForm(false);
      addToast("User created successfully!", "success");
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to create user.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = id => {
    const user = users.find(u => (u._id || u.id) === id);
    if (!user) return;
    setEditingUser(user);
    setEditUser({ name: user.name, email: user.email, role: user.role, status: user.status });
    setEditUserTouched({});
    setShowEditModal(true);
  };

  const handleEditUserChange = e => {
    const { name, value } = e.target;
    setEditUser(prev => ({ ...prev, [name]: value }));
    setEditUserTouched(prev => ({ ...prev, [name]: true }));
  };
  const handleEditUserBlur = e => setEditUserTouched(prev => ({ ...prev, [e.target.name]: true }));

  const handleUpdateUser = async e => {
    e.preventDefault();
    setEditUserTouched({ name: true, email: true, role: true, status: true });
    if (!isEditFormValid) { addToast("Please fix validation errors before updating.", "error"); return; }
    // Gate: promoting to Admin requires confirmation
    if (editingUser.role !== "Admin" && editUser.role === "Admin") {
      setShowRoleConfirm(true);
      return;
    }
    await commitUserUpdate();
  };

  const commitUserUpdate = async () => {
    setIsSubmitting(true);
    try {
      const userId = editingUser._id || editingUser.id;
      const { data } = await axios.put(`http://localhost:3001/api/users/${userId}`, editUser);
      setUsers(prev => prev.map(u => (u._id || u.id) === userId ? { ...u, ...data } : u));
      setShowEditModal(false);
      setShowRoleConfirm(false);
      setEditingUser(null);
      addToast("User updated successfully!", "success");
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to update user.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = id => {
    const user = users.find(u => (u._id || u.id) === id);
    if (user) { setUserToDelete(user); setShowDeleteModal(true); }
  };

  const handleOpenView = async id => {
    const user = users.find(u => (u._id || u.id) === id);
    if (!user) return;
    setViewingUser(user);
    setViewStats({ itemsReported: 0, claimsSubmitted: 0 });
    setShowViewModal(true);
    setLoadingViewStats(true);
    try {
      const [itemsRes, claimsRes] = await Promise.all([
        axios.get("http://localhost:3001/api/lost-found"),
        axios.get("http://localhost:3001/api/verification"),
      ]);
      const userId = user._id || user.id;
      const itemsReported   = itemsRes.data.filter(i => i.userId === userId).length;
      const claimsSubmitted = claimsRes.data.filter(c => c.claimantInfo?.email === user.email).length;
      setViewStats({ itemsReported, claimsSubmitted });
    } catch {
      // stats stay at 0 if fetch fails
    } finally {
      setLoadingViewStats(false);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const userId = userToDelete._id || userToDelete.id;
      await axios.delete(`http://localhost:3001/api/users/${userId}`);
      setUsers(prev => prev.filter(u => (u._id || u.id) !== userId));
      setShowDeleteModal(false);
      setUserToDelete(null);
      addToast("User deleted successfully.", "success");
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to delete user.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStatus = async id => {
    const user = users.find(u => (u._id || u.id) === id);
    if (!user) return;
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    try {
      await axios.put(`http://localhost:3001/api/users/${id}`, { ...user, status: newStatus });
      setUsers(prev => prev.map(u => (u._id || u.id) === id ? { ...u, status: newStatus } : u));
      addToast(`User ${newStatus === "Active" ? "activated" : "deactivated"} successfully.`, "success");
    } catch {
      addToast("Failed to update user status.", "error");
    }
  };

  // ── Bulk handlers ─────────────────────────────────────────────────────────
  const toggleSelectOne = id => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds(prev => { const next = new Set(prev); pagedIds.forEach(id => next.delete(id)); return next; });
    } else {
      setSelectedIds(prev => { const next = new Set(prev); pagedIds.forEach(id => next.add(id)); return next; });
    }
  };

  const handleBulkStatus = async newStatus => {
    setIsBulkProcessing(true);
    try {
      const targets = users.filter(u => selectedIds.has(u._id || u.id) && u.status !== newStatus);
      await Promise.all(
        targets.map(u => axios.put(`http://localhost:3001/api/users/${u._id || u.id}`, { ...u, status: newStatus }))
      );
      setUsers(prev => prev.map(u => selectedIds.has(u._id || u.id) ? { ...u, status: newStatus } : u));
      setSelectedIds(new Set());
      addToast(`${targets.length} user${targets.length !== 1 ? "s" : ""} ${newStatus === "Active" ? "activated" : "deactivated"}.`, "success");
    } catch {
      addToast("Some updates failed. Please try again.", "error");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
      await Promise.all(
        [...selectedIds].map(id => axios.delete(`http://localhost:3001/api/users/${id}`))
      );
      setUsers(prev => prev.filter(u => !selectedIds.has(u._id || u.id)));
      const count = selectedIds.size;
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      addToast(`${count} user${count !== 1 ? "s" : ""} deleted.`, "success");
    } catch {
      addToast("Some deletions failed. Please try again.", "error");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const showFieldError = (field, touched, errors) => touched[field] && errors[field];

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const generatedAt = new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
      const blob = await pdf(
        <UserReportPDF
          users={filteredUsers}
          filters={{ search, role: filterRole, status: filterStatus }}
          generatedAt={generatedAt}
        />
      ).toBlob();
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = `user-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      addToast("Report downloaded successfully!", "success");
    } catch (err) {
      console.error("PDF generation error:", err);
      addToast("Failed to generate report. Please try again.", "error");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const formatDate = dateStr => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 min-h-screen lg:ml-64 flex flex-col bg-gray-50">
        <TopBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title="User Management"
          subtitle="Manage system users and their permissions"
        />

        <Toast toasts={toasts} removeToast={removeToast} />

        <main className="flex-1 p-6 space-y-6">

          {/* ── Stats Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Users"
              value={totalUsers}
              color="bg-blue-50"
              icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />
            <StatCard
              label="Active Users"
              value={activeUsers}
              color="bg-green-50"
              icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              label="Admins"
              value={adminUsers}
              color="bg-purple-50"
              icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
            />
            <StatCard
              label="Inactive"
              value={inactiveUsers}
              color="bg-red-50"
              icon={<svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
            />
          </div>

          {/* ── Toolbar ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Role filter */}
                <select
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                  className={`text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${filterRole !== "All" ? "border-blue-400 bg-blue-50 text-blue-700 font-medium" : "border-gray-200"}`}
                >
                  <option value="All">All Roles</option>
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>

                {/* Status filter */}
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className={`text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${filterStatus !== "All" ? "border-blue-400 bg-blue-50 text-blue-700 font-medium" : "border-gray-200"}`}
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>

                {/* Clear filters */}
                {(search || filterRole !== "All" || filterStatus !== "All") && (
                  <button
                    onClick={() => { setSearch(""); setFilterRole("All"); setFilterStatus("All"); }}
                    className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Clear
                  </button>
                )}

                <div className="w-px h-6 bg-gray-200 hidden sm:block" />

                {/* Generate Report button */}
                <button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport || loading}
                  title="Download PDF report of current filtered users"
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                  {isGeneratingReport ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Generating…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export PDF
                    </>
                  )}
                </button>

                {/* Add User button */}
                <button
                  onClick={() => { setShowAddForm(true); setNewUserTouched({}); }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add User
                </button>
              </div>
            </div>

            {/* Active filter summary */}
            {(search || filterRole !== "All" || filterStatus !== "All") && (
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-xs text-gray-400">Filters:</span>
                {search && (
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    Search: "{search}"
                    <button onClick={() => setSearch("")} className="hover:text-blue-900"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </span>
                )}
                {filterRole !== "All" && (
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                    Role: {filterRole}
                    <button onClick={() => setFilterRole("All")} className="hover:text-purple-900"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </span>
                )}
                {filterStatus !== "All" && (
                  <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Status: {filterStatus}
                    <button onClick={() => setFilterStatus("All")} className="hover:text-green-900"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-auto">{filteredUsers.length} result{filteredUsers.length !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          {/* ── Bulk Action Bar ── */}
          {selectedIds.size > 0 && (
            <div className="bg-blue-600 rounded-xl px-5 py-3 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <span className="text-sm font-semibold text-white">
                  {selectedIds.size} user{selectedIds.size !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-blue-200 hover:text-white underline underline-offset-2 transition"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkStatus("Active")}
                  disabled={isBulkProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Activate
                </button>
                <button
                  onClick={() => handleBulkStatus("Inactive")}
                  disabled={isBulkProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  Deactivate
                </button>
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={isBulkProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete
                </button>
                {isBulkProcessing && (
                  <svg className="animate-spin w-4 h-4 text-white ml-1" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* ── Users Table ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-800">
                  {filteredUsers.length === users.length
                    ? "All Users"
                    : "Filtered Results"}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {filteredUsers.length === users.length ? totalUsers : `${filteredUsers.length} of ${totalUsers}`}
                </span>
              </div>
              <button onClick={fetchUsers} title="Refresh list" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="pl-4 pr-2 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        ref={el => { if (el) el.indeterminate = somePageSelected; }}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                  ) : pagedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <svg className="mx-auto w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm text-gray-500 font-medium">No users found</p>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  ) : (
                    pagedUsers.map(user => (
                      <tr key={user._id || user.id} className={`transition-colors ${selectedIds.has(user._id || user.id) ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                        {/* Checkbox */}
                        <td className="pl-4 pr-2 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(user._id || user.id)}
                            onChange={() => toggleSelectOne(user._id || user.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        {/* User */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleOpenView(user._id || user.id)}
                            className="flex items-center gap-3 text-left group"
                            title="View user profile"
                          >
                            <UserAvatar name={user.name} size="lg" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition">{user.name}</p>
                              <p className="text-xs text-gray-400">#{(user._id || user.id).toString().slice(-6)}</p>
                            </div>
                          </button>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>

                        {/* Role */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.role === "Admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {user.role === "Admin" && (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            )}
                            {user.role}
                          </span>
                        </td>

                        {/* Status toggle */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleStatus(user._id || user.id)}
                            title="Click to toggle status"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                              user.status === "Active"
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-red-100 text-red-600 hover:bg-red-200"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === "Active" ? "bg-green-500" : "bg-red-500"}`} />
                            {user.status}
                          </button>
                        </td>

                        {/* Joined */}
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(user.createdAt)}</td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(user._id || user.id)}
                              title="Edit user"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleOpenDelete(user._id || user.id)}
                              title="Delete user"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {!loading && filteredUsers.length > PAGE_SIZE && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} users
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                        safePage === i + 1
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Bulk Delete Confirmation Modal ── */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.998L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.002C2.57 17.333 3.532 19 5.072 19z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Delete {selectedIds.size} User{selectedIds.size !== 1 ? "s" : ""}?</h2>
              <p className="text-sm text-gray-500 mb-6">
                This will permanently delete <span className="font-semibold text-gray-800">{selectedIds.size} selected user{selectedIds.size !== 1 ? "s" : ""}</span>. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={isBulkProcessing}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkProcessing}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-white transition ${
                    isBulkProcessing ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isBulkProcessing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Deleting…
                    </>
                  ) : "Delete All"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View User Modal ── */}
      {showViewModal && viewingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">User Profile</h2>
              <button onClick={() => setShowViewModal(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Avatar + name hero */}
            <div className="px-6 pt-6 pb-4 flex items-center gap-4">
              <UserAvatar name={viewingUser.name} size="xl" />
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-gray-900 truncate">{viewingUser.name}</p>
                <p className="text-sm text-gray-500 truncate">{viewingUser.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    viewingUser.role === "Admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {viewingUser.role === "Admin" && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    )}
                    {viewingUser.role}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    viewingUser.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${viewingUser.status === "Active" ? "bg-green-500" : "bg-red-500"}`} />
                    {viewingUser.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="px-6 pb-4 space-y-2.5">
              <div className="flex items-center justify-between py-2.5 border-t border-gray-50">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">User ID</span>
                <span className="text-sm font-mono text-gray-600">#{(viewingUser._id || viewingUser.id).toString().slice(-10)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-gray-50">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Email</span>
                <span className="text-sm text-gray-700">{viewingUser.email}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-gray-50">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Role</span>
                <span className="text-sm text-gray-700">{viewingUser.role}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-gray-50">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Status</span>
                <span className="text-sm text-gray-700">{viewingUser.status}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-gray-50">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Joined</span>
                <span className="text-sm text-gray-700">{formatDate(viewingUser.createdAt)}</span>
              </div>
            </div>

            {/* Activity summary */}
            <div className="px-6 pb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Activity Summary</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  {loadingViewStats ? (
                    <div className="h-7 w-8 mx-auto bg-blue-200 rounded animate-pulse mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-blue-700">{viewStats.itemsReported}</p>
                  )}
                  <p className="text-xs text-blue-500 font-medium mt-0.5">Items Reported</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  {loadingViewStats ? (
                    <div className="h-7 w-8 mx-auto bg-purple-200 rounded animate-pulse mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-purple-700">{viewStats.claimsSubmitted}</p>
                  )}
                  <p className="text-xs text-purple-500 font-medium mt-0.5">Claims Submitted</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => { setShowViewModal(false); handleOpenEdit(viewingUser._id || viewingUser.id); }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add User Modal ── */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Add New User</h2>
                  <p className="text-xs text-gray-500">Fill in the details to create a new account</p>
                </div>
              </div>
              <button onClick={() => setShowAddForm(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleAddUser} className="px-6 py-5 space-y-4">
              {/* Name & Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={newUser.name} onChange={handleNewUserChange} onBlur={handleNewUserBlur}
                    placeholder="e.g. Jane Smith"
                    className={getFieldClassName("name", newUserTouched, newUserErrors)} />
                  {showFieldError("name", newUserTouched, newUserErrors) && (
                    <p className="mt-1 text-xs text-red-600">{newUserErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role <span className="text-red-500">*</span></label>
                  <select name="role" value={newUser.role} onChange={handleNewUserChange} onBlur={handleNewUserBlur}
                    className={getFieldClassName("role", newUserTouched, newUserErrors)}>
                    <option value="">Select role</option>
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                  {showFieldError("role", newUserTouched, newUserErrors) && (
                    <p className="mt-1 text-xs text-red-600">{newUserErrors.role}</p>
                  )}
                </div>
              </div>

              {/* Email & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={newUser.email} onChange={handleNewUserChange} onBlur={handleNewUserBlur}
                    placeholder="jane@example.com"
                    className={getFieldClassName("email", newUserTouched, newUserErrors)} />
                  {showFieldError("email", newUserTouched, newUserErrors) && (
                    <p className="mt-1 text-xs text-red-600">{newUserErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status <span className="text-red-500">*</span></label>
                  <select name="status" value={newUser.status} onChange={handleNewUserChange} onBlur={handleNewUserBlur}
                    className={getFieldClassName("status", newUserTouched, newUserErrors)}>
                    <option value="">Select status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {showFieldError("status", newUserTouched, newUserErrors) && (
                    <p className="mt-1 text-xs text-red-600">{newUserErrors.status}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                  <input type="password" name="password" value={newUser.password} onChange={handleNewUserChange} onBlur={handleNewUserBlur}
                    placeholder="Min. 6 characters"
                    className={getFieldClassName("password", newUserTouched, newUserErrors)} />
                  {showFieldError("password", newUserTouched, newUserErrors) && (
                    <p className="mt-1 text-xs text-red-600">{newUserErrors.password}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                  <input type="password" name="confirmPassword" value={newUser.confirmPassword} onChange={handleNewUserChange} onBlur={handleNewUserBlur}
                    placeholder="Re-enter password"
                    className={getFieldClassName("confirmPassword", newUserTouched, newUserErrors)} />
                  {showFieldError("confirmPassword", newUserTouched, newUserErrors) && (
                    <p className="mt-1 text-xs text-red-600">{newUserErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => { setShowAddForm(false); setNewUser({ name: "", email: "", password: "", confirmPassword: "", role: "", status: "" }); setNewUserTouched({}); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting || !isFormValid}
                  className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition text-white ${
                    isSubmitting || !isFormValid ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  }`}>
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Creating…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Role Promotion Confirmation Modal ── */}
      {showRoleConfirm && editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6">
              {/* Icon */}
              <div className="mx-auto mb-4 w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>

              {/* Title */}
              <h2 className="text-lg font-semibold text-gray-900 text-center mb-1">Promote to Admin?</h2>
              <p className="text-sm text-gray-500 text-center mb-5">
                You are granting <span className="font-semibold text-gray-800">{editingUser.name}</span> full administrator access.
              </p>

              {/* Role change pill */}
              <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-xl px-4 py-3 mb-5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">User</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Admin
                </span>
              </div>

              {/* Warning note */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
                <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.998L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.002C2.57 17.333 3.532 19 5.072 19z" />
                </svg>
                <p className="text-xs text-amber-700">Admins have full access to manage users, items, and system settings. Only promote trusted users.</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRoleConfirm(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={commitUserUpdate}
                  disabled={isSubmitting}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl text-white transition ${
                    isSubmitting ? "bg-purple-300 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Saving…
                    </>
                  ) : "Yes, Promote"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <UserAvatar name={editingUser?.name} size="lg" />
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Edit User</h2>
                  <p className="text-xs text-gray-500">{editingUser?.email}</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={editUser.name} onChange={handleEditUserChange} onBlur={handleEditUserBlur}
                  className={getFieldClassName("name", editUserTouched, editUserErrors)} />
                {showFieldError("name", editUserTouched, editUserErrors) && (
                  <p className="mt-1 text-xs text-red-600">{editUserErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <input type="email" name="email" value={editUser.email} onChange={handleEditUserChange} onBlur={handleEditUserBlur}
                  className={getFieldClassName("email", editUserTouched, editUserErrors)} />
                {showFieldError("email", editUserTouched, editUserErrors) && (
                  <p className="mt-1 text-xs text-red-600">{editUserErrors.email}</p>
                )}
              </div>

              {/* Role & Status in a row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                  <select name="role" value={editUser.role} onChange={handleEditUserChange} onBlur={handleEditUserBlur}
                    className={getFieldClassName("role", editUserTouched, editUserErrors)}>
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                  {showFieldError("role", editUserTouched, editUserErrors) && (
                    <p className="mt-1 text-xs text-red-600">{editUserErrors.role}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select name="status" value={editUser.status} onChange={handleEditUserChange} onBlur={handleEditUserBlur}
                    className={getFieldClassName("status", editUserTouched, editUserErrors)}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {showFieldError("status", editUserTouched, editUserErrors) && (
                    <p className="mt-1 text-xs text-red-600">{editUserErrors.status}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting || !isEditFormValid}
                  className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg text-white transition ${
                    isSubmitting || !isEditFormValid ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  }`}>
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Saving…
                    </>
                  ) : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.998L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.002C2.57 17.333 3.532 19 5.072 19z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Delete User</h2>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-800">{userToDelete?.name}</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                  Cancel
                </button>
                <button onClick={confirmDelete} disabled={isDeleting}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-white transition ${
                    isDeleting ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                  }`}>
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Deleting…
                    </>
                  ) : "Delete User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
