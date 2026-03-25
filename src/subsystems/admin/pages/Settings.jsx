import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "../../../context/ThemeContext";
import Sidebar from "./Sidebar";
import TopBar from "../components/TopBar";
import WhatsAppAlertsPanel from "../components/WhatsAppAlertsPanel";

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm
            ${t.type === "success" ? "bg-green-600" : t.type === "error" ? "bg-red-600" : "bg-blue-600"}`}
        >
          <span className="mt-0.5 flex-shrink-0">
            {t.type === "success" && <CheckIcon className="w-4 h-4" />}
            {t.type === "error"   && <XIcon className="w-4 h-4" />}
            {t.type === "info"    && <InfoIcon className="w-4 h-4" />}
          </span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="opacity-70 hover:opacity-100 flex-shrink-0">
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        ${checked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
          transition duration-200 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ icon, title, description, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Field wrappers ───────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

function InputField({ label, hint, ...props }) {
  return (
    <Field label={label} hint={hint}>
      <input
        {...props}
        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          placeholder-gray-400 dark:placeholder-gray-500 transition"
      />
    </Field>
  );
}

function SelectField({ label, hint, children, ...props }) {
  return (
    <Field label={label} hint={hint}>
      <select
        {...props}
        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      >
        {children}
      </select>
    </Field>
  );
}

function ToggleRow({ label, description, name, checked, onChange, disabled }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0
      [&:not(:last-child)]:border-b [&:not(:last-child)]:border-gray-50 dark:[&:not(:last-child)]:border-gray-700">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={v => onChange({ target: { name, type: "checkbox", checked: v } })} disabled={disabled} />
    </div>
  );
}

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV = [
  { id: "general",       label: "General",        icon: <CogIcon /> },
  { id: "notifications", label: "Notifications",  icon: <BellIcon /> },
  { id: "display",       label: "Display",        icon: <DisplayIcon /> },
  { id: "data",          label: "Data & Retention",icon: <DatabaseIcon /> },
  { id: "security",      label: "Security",       icon: <ShieldIcon /> },
  { id: "about",         label: "About",          icon: <InfoIcon className="w-4 h-4" /> },
];

// ─── Default settings ─────────────────────────────────────────────────────────
const DEFAULTS = {
  // General
  systemName:        "UniFind — University Lost & Found",
  adminEmail:        "admin@unifind.university.edu",
  contactPhone:      "+1 (555) 000-0000",
  timezone:          "Asia/Colombo",
  language:          "en",
  // Notifications
  emailNotifications:  true,
  smsAlerts:           false,
  inAppNotifications:  true,
  notifyOnNewItem:     true,
  notifyOnClaim:       true,
  notifyOnExpiry:      false,
  // Display
  itemsPerPage:        "10",
  dateFormat:          "MMM DD, YYYY",
  theme:               "light",
  // Data & Retention
  retentionDays:       90,
  autoArchive:         true,
  archiveAfterDays:    30,
  // Security
  sessionTimeout:      "60",
  minPasswordLength:   "8",
  requireSpecialChars: true,
  twoFactorAuth:       false,
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Settings({ activeSection, setActiveSection, sidebarOpen: propSidebarOpen, setSidebarOpen: propSetSidebarOpen }) {
  const [sidebarOpen, setSidebarOpenLocal] = useState(false);
  const sidebarOpenState = propSidebarOpen !== undefined ? propSidebarOpen : sidebarOpen;
  const setSidebarOpen   = propSetSidebarOpen || setSidebarOpenLocal;

  const { theme: contextTheme, setTheme } = useTheme();

  const loadPersistedSettings = () => {
    try {
      const raw = localStorage.getItem("adminSettings");
      return raw ? { ...DEFAULTS, ...JSON.parse(raw), theme: contextTheme } : { ...DEFAULTS, theme: contextTheme };
    } catch {
      return { ...DEFAULTS, theme: contextTheme };
    }
  };

  const [settings, setSettings]   = useState(loadPersistedSettings);
  const [saved, setSaved]         = useState(loadPersistedSettings);
  const [activeNav, setActiveNav] = useState("general");
  const [isSaving, setIsSaving]   = useState(false);
  const [toasts, setToasts]       = useState([]);
  const [exportLoading, setExportLoading] = useState({});
  const contentRef = useRef(null);

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(saved);

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const handleExport = useCallback(async (type) => {
    setExportLoading(prev => ({ ...prev, [type]: true }));
    try {
      const endpoints = {
        users:  "http://localhost:3001/api/users",
        items:  "http://localhost:3001/api/lost-found",
        claims: "http://localhost:3001/api/verification",
      };
      const res = await fetch(endpoints[type]);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();
      const rows = Array.isArray(json) ? json : (json.data ?? json.users ?? json.items ?? json.claims ?? []);
      if (!rows.length) { addToast(`No ${type} data to export.`, "info"); return; }

      const flattenRow = (obj, prefix = "") =>
        Object.entries(obj).reduce((acc, [k, v]) => {
          const key = prefix ? `${prefix}_${k}` : k;
          if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
            Object.assign(acc, flattenRow(v, key));
          } else {
            acc[key] = Array.isArray(v) ? v.length : (v ?? "");
          }
          return acc;
        }, {});

      const flat = rows.map(r => flattenRow(r));
      const skip = new Set(["__v", "password"]);
      const headers = [...new Set(flat.flatMap(Object.keys))].filter(h => !skip.has(h));
      const escape = v => `"${String(v).replace(/"/g, '""')}"`;
      const csv = [headers.map(escape).join(","), ...flat.map(r => headers.map(h => escape(r[h] ?? "")).join(","))].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${type}_export_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully.`, "success");
    } catch (err) {
      addToast(`Export failed: ${err.message}`, "error");
    } finally {
      setExportLoading(prev => ({ ...prev, [type]: false }));
    }
  }, [addToast]);

  // ── Change handler ─────────────────────────────────────────────────────────
  const handleChange = useCallback(e => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }, []);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async e => {
    e?.preventDefault();
    setIsSaving(true);
    // Simulate async save
    await new Promise(r => setTimeout(r, 900));
    localStorage.setItem("adminSettings", JSON.stringify(settings));
    setSaved({ ...settings });
    setTheme(settings.theme);
    setIsSaving(false);
    addToast("Settings saved successfully!", "success");
  };

  // ── Discard ────────────────────────────────────────────────────────────────
  const handleDiscard = () => {
    setSettings({ ...saved });
    addToast("Changes discarded.", "info");
  };

  // ── Nav click scrolls to section on mobile ─────────────────────────────────
  const handleNav = id => {
    setActiveNav(id);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Warn before unload if unsaved
  useEffect(() => {
    const handler = e => { if (hasChanges) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  return (
    <div className="flex">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpenState} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 min-h-screen lg:ml-64 flex flex-col bg-gray-50 dark:bg-gray-900">
        <TopBar sidebarOpen={sidebarOpenState} setSidebarOpen={setSidebarOpen}
          title="System Settings" subtitle="Manage global system preferences and configuration" />

        <Toast toasts={toasts} remove={removeToast} />

        <main className="flex-1 flex flex-col overflow-hidden">

          {/* ── Unsaved changes banner ── */}
          {hasChanges && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0">
              <div className="flex items-center gap-2 text-amber-700 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.998L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.002C2.57 17.333 3.532 19 5.072 19z" />
                </svg>
                <span className="font-medium">You have unsaved changes.</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleDiscard}
                  className="text-xs px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-100 transition">
                  Discard
                </button>
                <button type="button" onClick={handleSave} disabled={isSaving}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition">
                  Save now
                </button>
              </div>
            </div>
          )}

          {/* Page Header Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 mx-4 mt-4 rounded-2xl px-5 py-5 shadow-lg shadow-blue-200 flex items-center gap-4 flex-shrink-0">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner flex-shrink-0">
              <i className="fas fa-cog text-white text-lg"></i>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">System Settings</h2>
              <p className="text-xs text-blue-100 mt-0.5">Configure and manage system-wide settings</p>
            </div>
          </div>

          {/* ── Two-column layout ── */}
          <div className="flex flex-1 overflow-hidden">

            {/* Left nav */}
            <aside className="hidden md:flex flex-col w-52 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 py-4 px-3 gap-0.5">
              {NAV.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNav(n.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition w-full text-left
                    ${activeNav === n.id
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"}`}
                >
                  <span className={`flex-shrink-0 ${activeNav === n.id ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}>
                    {n.icon}
                  </span>
                  {n.label}
                  {n.id === "notifications" && (settings.emailNotifications || settings.smsAlerts) && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-green-400" />
                  )}
                </button>
              ))}
            </aside>

            {/* Mobile nav (horizontal scroll) */}
            <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 overflow-x-auto flex-shrink-0 w-full">
              <div className="flex px-4 py-2 gap-1 w-max">
                {NAV.map(n => (
                  <button key={n.id} onClick={() => handleNav(n.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition
                      ${activeNav === n.id ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"}`}>
                    {n.icon}
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div ref={contentRef} className="flex-1 overflow-y-auto">
              <form onSubmit={handleSave}>
                <div className="p-6 space-y-6 max-w-2xl">

                  {/* ════════════════ GENERAL ════════════════ */}
                  {activeNav === "general" && (
                    <>
                      <SectionCard
                        icon={<CogIcon className="text-blue-600" />}
                        title="System Identity"
                        description="Basic information that identifies this Lost & Found system."
                      >
                        <div className="space-y-5">
                          <InputField label="System Name" name="systemName" value={settings.systemName}
                            onChange={handleChange} placeholder="e.g. UniFind Lost & Found" required
                            hint="Displayed in the header and all outgoing communications." />
                          <InputField label="Admin Email Address" type="email" name="adminEmail"
                            value={settings.adminEmail} onChange={handleChange}
                            placeholder="admin@example.com" required
                            hint="Used as the reply-to address for system emails." />
                          <InputField label="Contact Phone Number" type="tel" name="contactPhone"
                            value={settings.contactPhone} onChange={handleChange}
                            placeholder="+1 (555) 000-0000"
                            hint="Displayed on public-facing pages for enquiries." />
                        </div>
                      </SectionCard>

                      <SectionCard
                        icon={<GlobeIcon className="text-blue-600" />}
                        title="Localisation"
                        description="Time zone and language preferences for the system."
                      >
                        <div className="space-y-5">
                          <SelectField label="Time Zone" name="timezone" value={settings.timezone}
                            onChange={handleChange}>
                            <option value="Asia/Colombo">Asia/Colombo (UTC+5:30)</option>
                            <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
                            <option value="UTC">UTC (UTC+0:00)</option>
                            <option value="America/New_York">America/New_York (UTC−5:00)</option>
                            <option value="America/Los_Angeles">America/Los_Angeles (UTC−8:00)</option>
                            <option value="Europe/London">Europe/London (UTC±0:00)</option>
                            <option value="Europe/Paris">Europe/Paris (UTC+1:00)</option>
                            <option value="Australia/Sydney">Australia/Sydney (UTC+11:00)</option>
                          </SelectField>
                          <SelectField label="Language" name="language" value={settings.language}
                            onChange={handleChange}>
                            <option value="en">English</option>
                            <option value="si">Sinhala</option>
                            <option value="ta">Tamil</option>
                            <option value="fr">French</option>
                          </SelectField>
                        </div>
                      </SectionCard>
                    </>
                  )}

                  {/* ════════════════ NOTIFICATIONS ════════════════ */}
                  {activeNav === "notifications" && (
                    <>
                      <SectionCard
                        icon={<BellIcon className="text-blue-600" />}
                        title="Notification Channels"
                        description="Choose how the system sends alerts to administrators and users."
                      >
                        <div>
                          <ToggleRow label="Email Notifications" name="emailNotifications"
                            description="Send email alerts for item events and user actions."
                            checked={settings.emailNotifications} onChange={handleChange} />
                          <ToggleRow label="SMS Alerts" name="smsAlerts"
                            description="Send SMS messages to registered phone numbers."
                            checked={settings.smsAlerts} onChange={handleChange} />
                          <ToggleRow label="In-App Notifications" name="inAppNotifications"
                            description="Show notification badges inside the admin dashboard."
                            checked={settings.inAppNotifications} onChange={handleChange} />
                        </div>
                      </SectionCard>

                      <SectionCard
                        icon={<BellRingIcon className="text-blue-600" />}
                        title="Notification Triggers"
                        description="Select which events should trigger notifications."
                      >
                        <div>
                          <ToggleRow label="New Item Reported"
                            name="notifyOnNewItem"
                            description="Notify when a new lost or found item is submitted."
                            checked={settings.notifyOnNewItem} onChange={handleChange} />
                          <ToggleRow label="Claim Submitted"
                            name="notifyOnClaim"
                            description="Notify when a user submits a claim for verification."
                            checked={settings.notifyOnClaim} onChange={handleChange} />
                          <ToggleRow label="Item Expiry Warning"
                            name="notifyOnExpiry"
                            description="Notify when an item is approaching its retention deadline."
                            checked={settings.notifyOnExpiry} onChange={handleChange} />
                        </div>
                      </SectionCard>

                      <WhatsAppAlertsPanel />
                    </>
                  )}

                  {/* ════════════════ DISPLAY ════════════════ */}
                  {activeNav === "display" && (
                    <SectionCard
                      icon={<DisplayIcon className="text-blue-600" />}
                      title="Display Preferences"
                      description="Control how data and dates are presented in the dashboard."
                    >
                      <div className="space-y-5">
                        <SelectField label="Items Per Page" name="itemsPerPage"
                          value={settings.itemsPerPage} onChange={handleChange}
                          hint="Number of records shown per page across all tables.">
                          <option value="5">5 per page</option>
                          <option value="10">10 per page</option>
                          <option value="20">20 per page</option>
                          <option value="50">50 per page</option>
                          <option value="100">100 per page</option>
                        </SelectField>

                        <SelectField label="Date Format" name="dateFormat"
                          value={settings.dateFormat} onChange={handleChange}
                          hint="Applied to all dates shown in tables and reports.">
                          <option value="MMM DD, YYYY">Jan 01, 2025</option>
                          <option value="DD/MM/YYYY">01/01/2025</option>
                          <option value="MM/DD/YYYY">01/01/2025 (US)</option>
                          <option value="YYYY-MM-DD">2025-01-01 (ISO)</option>
                        </SelectField>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</label>
                          <div className="flex gap-3">
                            {[
                              { value: "light", label: "Light", icon: "☀️" },
                              { value: "dark",  label: "Dark",  icon: "🌙" },
                              { value: "auto",  label: "System",icon: "💻" },
                            ].map(opt => (
                              <label key={opt.value}
                                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition
                                  ${settings.theme === opt.value
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700"}`}>
                                <input type="radio" name="theme" value={opt.value}
                                  checked={settings.theme === opt.value} onChange={handleChange}
                                  className="sr-only" />
                                <span className="text-2xl">{opt.icon}</span>
                                <span className={`text-xs font-medium ${settings.theme === opt.value ? "text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}>
                                  {opt.label}
                                </span>
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Changes apply immediately after saving.</p>
                        </div>
                      </div>
                    </SectionCard>
                  )}

                  {/* ════════════════ DATA & RETENTION ════════════════ */}
                  {activeNav === "data" && (
                    <>
                      <SectionCard
                        icon={<DatabaseIcon className="text-blue-600" />}
                        title="Item Retention Policy"
                        description="Define how long items are kept before they are automatically expired or archived."
                      >
                        <div className="space-y-5">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Retention Period
                            </label>
                            <div className="flex items-center gap-3">
                              <input
                                type="number"
                                name="retentionDays"
                                value={settings.retentionDays}
                                onChange={handleChange}
                                min="7"
                                max="365"
                                className="w-28 px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-gray-100
                                  focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-medium"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">days</span>
                              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full transition-all"
                                  style={{ width: `${Math.min((settings.retentionDays / 365) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400 w-12 text-right">
                                {settings.retentionDays}d
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                              Items older than {settings.retentionDays} days will be marked as expired (7–365 days).
                            </p>
                          </div>

                          <ToggleRow label="Auto-Archive Expired Items"
                            name="autoArchive"
                            description="Automatically move expired items to the archive instead of deleting them."
                            checked={settings.autoArchive} onChange={handleChange} />

                          {settings.autoArchive && (
                            <div className="pl-4 border-l-2 border-blue-100">
                              <SelectField label="Archive After (days post-expiry)" name="archiveAfterDays"
                                value={settings.archiveAfterDays} onChange={handleChange}
                                hint="Items are archived this many days after their expiry date.">
                                <option value="7">7 days</option>
                                <option value="14">14 days</option>
                                <option value="30">30 days</option>
                                <option value="60">60 days</option>
                              </SelectField>
                            </div>
                          )}
                        </div>
                      </SectionCard>

                      <SectionCard
                        icon={<ExportIcon className="text-blue-600" />}
                        title="Data Export"
                        description="Download a snapshot of system data for backup or auditing."
                      >
                        <div className="flex flex-col sm:flex-row gap-3">
                          {[
                            { label: "Export Users",  type: "users",  icon: (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )},
                            { label: "Export Items",  type: "items",  icon: (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                              </svg>
                            )},
                            { label: "Export Claims", type: "claims", icon: (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                            )},
                          ].map(opt => (
                            <button key={opt.type} type="button"
                              onClick={() => handleExport(opt.type)}
                              disabled={!!exportLoading[opt.type]}
                              className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600
                                hover:border-blue-300 hover:bg-blue-50 dark:bg-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 transition group text-left
                                disabled:opacity-60 disabled:cursor-not-allowed">
                              <span className="text-blue-500 dark:text-blue-400 group-hover:text-blue-600 flex-shrink-0">
                                {exportLoading[opt.type]
                                  ? <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                  : opt.icon}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">{opt.label}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">CSV format</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </SectionCard>
                    </>
                  )}

                  {/* ════════════════ SECURITY ════════════════ */}
                  {activeNav === "security" && (
                    <>
                      <SectionCard
                        icon={<ShieldIcon className="text-blue-600" />}
                        title="Session & Access"
                        description="Control how long admin sessions stay active and access policies."
                      >
                        <div className="space-y-5">
                          <SelectField label="Session Timeout" name="sessionTimeout"
                            value={settings.sessionTimeout} onChange={handleChange}
                            hint="Inactive admin sessions will be logged out after this period.">
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="60">1 hour</option>
                            <option value="120">2 hours</option>
                            <option value="480">8 hours (never timeout)</option>
                          </SelectField>

                          <ToggleRow label="Two-Factor Authentication"
                            name="twoFactorAuth"
                            description="Require a one-time code in addition to password for admin logins."
                            checked={settings.twoFactorAuth} onChange={handleChange} />
                        </div>
                      </SectionCard>

                      <SectionCard
                        icon={<LockIcon className="text-blue-600" />}
                        title="Password Policy"
                        description="Set requirements for user and admin account passwords."
                      >
                        <div className="space-y-5">
                          <SelectField label="Minimum Password Length" name="minPasswordLength"
                            value={settings.minPasswordLength} onChange={handleChange}>
                            <option value="6">6 characters</option>
                            <option value="8">8 characters (recommended)</option>
                            <option value="10">10 characters</option>
                            <option value="12">12 characters (strong)</option>
                          </SelectField>

                          <ToggleRow label="Require Special Characters"
                            name="requireSpecialChars"
                            description="Passwords must contain at least one special character (e.g. !@#$%)."
                            checked={settings.requireSpecialChars} onChange={handleChange} />
                        </div>
                      </SectionCard>

                      {/* Danger zone */}
                      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/30 flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                            <DangerIcon className="text-red-500" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
                            <p className="text-xs text-red-400 mt-0.5">These actions are destructive and cannot be undone.</p>
                          </div>
                        </div>
                        <div className="p-6 space-y-3">
                          {[
                            { label: "Clear All Expired Items",    sub: "Permanently deletes all items past their retention date." },
                            { label: "Reset Notification Logs",    sub: "Wipes the notification delivery history." },
                            { label: "Factory Reset Settings",     sub: "Resets all settings to their default values.", danger: true },
                          ].map(action => (
                            <div key={action.label} className="flex items-center justify-between gap-4 py-2.5
                              [&:not(:last-child)]:border-b [&:not(:last-child)]:border-red-50 dark:[&:not(:last-child)]:border-red-900/20">
                              <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{action.label}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{action.sub}</p>
                              </div>
                              <button type="button"
                                onClick={() => addToast(`"${action.label}" requires confirmation — this feature is restricted.`, "error")}
                                className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium border transition
                                  ${action.danger
                                    ? "border-red-300 text-red-700 hover:bg-red-50"
                                    : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                                {action.danger ? "Reset" : "Clear"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ════════════════ ABOUT ════════════════ */}
                  {activeNav === "about" && (
                    <SectionCard
                      icon={<InfoIcon className="w-5 h-5 text-blue-600" />}
                      title="System Information"
                      description="Technical details about this Lost & Found installation."
                    >
                      <dl className="divide-y divide-gray-50 dark:divide-gray-700">
                        {[
                          { label: "Application",     value: "UniFind Lost & Found" },
                          { label: "Version",         value: "1.0.0" },
                          { label: "Environment",     value: "Production" },
                          { label: "Database",        value: "MongoDB Atlas" },
                          { label: "Backend Runtime", value: "Node.js + Express" },
                          { label: "Frontend",        value: "React 19 + Vite + Tailwind CSS" },
                          { label: "API Base URL",    value: "http://localhost:3001/api" },
                          { label: "Last Deploy",     value: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                        ].map(row => (
                          <div key={row.label} className="flex justify-between py-3 gap-4">
                            <dt className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{row.label}</dt>
                            <dd className="text-sm font-medium text-gray-800 dark:text-gray-100 text-right break-all">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </SectionCard>
                  )}

                  {/* ── Sticky save footer (shown for all tabs except About) ── */}
                  {activeNav !== "about" && (
                    <div className="flex items-center justify-between pt-2 pb-4 gap-4">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {hasChanges ? "Unsaved changes present." : "All settings are up to date."}
                      </p>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={handleDiscard} disabled={!hasChanges || isSaving}
                          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600
                            rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition">
                          Discard Changes
                        </button>
                        <button type="submit" disabled={isSaving || !hasChanges}
                          className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white
                            shadow-sm transition ${isSaving || !hasChanges
                              ? "bg-blue-300 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700"}`}>
                          {isSaving ? (
                            <>
                              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                              Saving…
                            </>
                          ) : (
                            <>
                              <SaveIcon />
                              Save Settings
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── SVG Icon Components ──────────────────────────────────────────────────────
function CogIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function BellIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
function BellRingIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
function DisplayIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
function DatabaseIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  );
}
function ShieldIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
function LockIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
function GlobeIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function ExportIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}
function DangerIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.998L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.002C2.57 17.333 3.532 19 5.072 19z" />
    </svg>
  );
}
function InfoIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function CheckIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
function XIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function SaveIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  );
}
