import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Sidebar({ activeSection: propActiveSection, setActiveSection: propSetActiveSection, sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const [localActiveSection, setLocalActiveSection] = useState(propActiveSection || "dashboard");

  const activeSection = propActiveSection || localActiveSection;
  const setActiveSection = propSetActiveSection || setLocalActiveSection;

  const navSections = [
    {
      label: "Overview",
      items: [
        { id: "dashboard", label: "Dashboard", icon: "fa-chart-pie", path: "/admin/dashboard" },
      ]
    },
    {
      label: "Lost & Found",
      items: [
        { id: "items", label: "All Items", icon: "fa-boxes", path: "/admin/dashboard/allitems" },
        { id: "verification", label: "Verification", icon: "fa-shield-alt", path: "/admin/dashboard/verification" },
        { id: "confirm-collection", label: "Confirm Collection", icon: "fa-clipboard-check", path: "/admin/dashboard/verification/confirm-collection", sub: true },
      ]
    },
    {
      label: "Communications",
      items: [
        { id: "notices", label: "Notices", icon: "fa-bullhorn", path: "/admin/dashboard/notices" },
      ]
    },
    {
      label: "Administration",
      items: [
        { id: "users", label: "Users", icon: "fa-users", path: "/admin/dashboard/users" },
        { id: "report", label: "Report Item", icon: "fa-plus-circle", path: "/report-item" },
      ]
    },
  ];

  const handleNavigation = (path, id) => {
    try {
      setActiveSection(id);
    } catch {
      // no-op
    }
    if (setSidebarOpen) setSidebarOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setSidebarOpen && setSidebarOpen(false)}
      />

      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300 flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{ background: "linear-gradient(180deg, #1e3a5f 0%, #162d4a 60%, #0f1f33 100%)" }}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
              <i className="fas fa-graduation-cap text-white text-sm"></i>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight tracking-wide">UniFind</h2>
              <p className="text-xs mt-0.5" style={{ color: "#7ba3cc" }}>Admin Management Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-5"
          style={{ scrollbarWidth: "none" }}>
          {navSections.map(section => (
            <div key={section.label}>
              <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-2"
                style={{ color: "#4a7ba3", letterSpacing: "0.1em" }}>
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(link => {
                  const isActive = activeSection === link.id;
                  return (
                    <button
                      key={link.id}
                      onClick={() => handleNavigation(link.path, link.id)}
                      className={`flex items-center text-left w-full rounded-lg transition-all duration-200 text-sm group relative ${
                        link.sub ? "pl-8 pr-3 py-2" : "px-3 py-2.5"
                      }`}
                      style={
                        isActive
                          ? { background: "rgba(59,130,246,0.18)", color: "#ffffff" }
                          : { color: "#94b8d4" }
                      }
                      onMouseEnter={e => {
                        if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                        if (!isActive) e.currentTarget.style.color = "#c8dff0";
                      }}
                      onMouseLeave={e => {
                        if (!isActive) e.currentTarget.style.background = "transparent";
                        if (!isActive) e.currentTarget.style.color = "#94b8d4";
                      }}
                    >
                      {/* Active left accent bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                          style={{ background: "#3b82f6" }} />
                      )}

                      {/* Sub-item connector */}
                      {link.sub && (
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-px"
                          style={{ background: "#2d5a8a" }} />
                      )}

                      {/* Icon */}
                      <span className={`flex items-center justify-center rounded-md mr-2.5 flex-shrink-0 transition-colors ${
                        link.sub ? "w-6 h-6 text-xs" : "w-7 h-7 text-xs"
                      }`}
                        style={
                          isActive
                            ? { background: "rgba(59,130,246,0.3)", color: "#60a5fa" }
                            : { background: "rgba(255,255,255,0.06)", color: "#7ba3cc" }
                        }
                      >
                        <i className={`fas ${link.icon}`}></i>
                      </span>

                      <span className={`font-medium flex-1 ${link.sub ? "text-xs" : "text-sm"}`}>
                        {link.label}
                      </span>

                      {isActive && (
                        <i className="fas fa-chevron-right text-xs ml-auto" style={{ color: "#3b82f6", opacity: 0.7 }}></i>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-4 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />

        {/* Admin Profile + Logout */}
        <div className="p-3 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
              A
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-white leading-tight truncate">Administrator</p>
              <p className="text-xs truncate" style={{ color: "#7ba3cc" }}>UniFind Admin</p>
            </div>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#22c55e" }} />
          </div>

          <button
            className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group"
            style={{ color: "#94b8d4" }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(239,68,68,0.12)";
              e.currentTarget.style.color = "#fca5a5";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#94b8d4";
            }}
            onClick={() => navigate("/")}
          >
            <span className="w-7 h-7 rounded-md flex items-center justify-center mr-2.5 flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <i className="fas fa-sign-out-alt text-xs"></i>
            </span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
