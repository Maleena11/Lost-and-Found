import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Sidebar({ activeSection: propActiveSection, setActiveSection: propSetActiveSection, sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const [localActiveSection, setLocalActiveSection] = useState(propActiveSection || "dashboard");

  const activeSection = propActiveSection || localActiveSection;
  const setActiveSection = propSetActiveSection || setLocalActiveSection;

  const navSections = [
    {
      label: "OVERVIEW",
      items: [
        { id: "dashboard", label: "Dashboard", icon: "fa-tachometer-alt", path: "/admin/dashboard" },
      ]
    },
    {
      label: "LOST & FOUND",
      items: [
        { id: "items", label: "All Items", icon: "fa-box-open", path: "/admin/dashboard/allitems" },
        { id: "verification", label: "Verification", icon: "fa-check-circle", path: "/admin/dashboard/verification" },
      ]
    },
    {
      label: "COMMUNICATIONS",
      items: [
        { id: "notices", label: "Notices", icon: "fa-bullhorn", path: "/admin/dashboard/notices" },
      ]
    },
    {
      label: "ADMINISTRATION",
      items: [
        { id: "users", label: "Users", icon: "fa-users", path: "/admin/dashboard/users" },
        { id: "report", label: "Report Item", icon: "fa-plus-circle", path: "/report-item" },
      ]
    },
    {
      label: "SYSTEM",
      items: [
        { id: "settings", label: "Settings", icon: "fa-cog", path: "/admin/dashboard/settings" },
      ]
    }
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
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-blue-600 via-blue-700 to-blue-900 text-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <i className="fas fa-graduation-cap text-white text-base"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">UniFind</h2>
              <p className="text-xs text-blue-200 mt-0.5">Admin Management Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
          {navSections.map(section => (
            <div key={section.label}>
              <p className="text-xs text-blue-300 uppercase font-semibold tracking-wider px-3 mb-1.5">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(link => (
                  <button
                    key={link.id}
                    onClick={() => handleNavigation(link.path, link.id)}
                    className={`flex items-center px-3 py-2.5 text-left w-full rounded-lg transition-all duration-150 text-sm group ${
                      activeSection === link.id
                        ? "bg-white/20 text-white shadow-lg"
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                    }`}
                    style={activeSection !== link.id ? {} : {}}
                  >
                    <span className={`w-7 h-7 rounded-md flex items-center justify-center mr-3 flex-shrink-0 text-xs transition-colors ${
                      activeSection === link.id ? "bg-white/20" : "bg-white/10 group-hover:bg-white/20"
                    }`}>
                      <i className={`fas ${link.icon}`}></i>
                    </span>
                    <span className="font-medium">{link.label}</span>
                    {activeSection === link.id && (
                      <i className="fas fa-chevron-right ml-auto text-xs opacity-50"></i>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Admin Profile + Logout */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/10 mb-1">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              A
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white leading-tight truncate">Administrator</p>
              <p className="text-xs text-blue-200 truncate">UniFind Admin</p>
            </div>
          </div>

          <button
            className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm text-blue-100 hover:bg-red-500/20 hover:text-red-200 transition-all duration-150"
            onClick={() => navigate("/")}
          >
            <span className="w-7 h-7 rounded-md flex items-center justify-center mr-3 bg-white/10">
              <i className="fas fa-sign-out-alt text-xs"></i>
            </span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
