import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "../components/TopBar";

export default function Settings({ activeSection, setActiveSection, sidebarOpen: propSidebarOpen, setSidebarOpen: propSetSidebarOpen }) {
  const [sidebarOpen, setSidebarOpenLocal] = useState(false);
  const sidebarOpenState = propSidebarOpen !== undefined ? propSidebarOpen : sidebarOpen;
  const setSidebarOpen = propSetSidebarOpen || setSidebarOpenLocal;

  const [settings, setSettings] = useState({
    systemName: "UniFind — University Lost & Found",
    adminEmail: "admin@unifind.university.edu",
    itemsPerPage: 10,
    enableEmailNotifications: true,
    enableSMSAlerts: false,
    retentionDays: 90
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Settings saved:", settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpenState}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 min-h-screen lg:ml-64 flex flex-col bg-gray-50">
        <TopBar
          sidebarOpen={sidebarOpenState}
          setSidebarOpen={setSidebarOpen}
          title="System Settings"
          subtitle="Configure system preferences and notifications"
        />

        <main className="flex-1 p-6">
          <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">

            {/* General Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <i className="fas fa-sliders-h text-blue-600 text-xs"></i>
                </span>
                <h2 className="text-sm font-semibold text-gray-800">General Settings</h2>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">System Name</label>
                  <input
                    type="text"
                    name="systemName"
                    value={settings.systemName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin Email</label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={settings.adminEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Items Per Page</label>
                  <select
                    name="itemsPerPage"
                    value={settings.itemsPerPage}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Item Retention (days)</label>
                  <input
                    type="number"
                    name="retentionDays"
                    value={settings.retentionDays}
                    onChange={handleChange}
                    min="30"
                    max="365"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Items older than this many days will be marked expired.</p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <i className="fas fa-bell text-green-600 text-xs"></i>
                </span>
                <h2 className="text-sm font-semibold text-gray-800">Notification Settings</h2>
              </div>
              <div className="p-6 space-y-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email Notifications</p>
                    <p className="text-xs text-gray-500 mt-0.5">Send email alerts for new items and claims</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="enableEmailNotifications"
                      checked={settings.enableEmailNotifications}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
                  </div>
                </label>
                <div className="border-t border-gray-50"></div>
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <p className="text-sm font-medium text-gray-700">SMS Alerts</p>
                    <p className="text-xs text-gray-500 mt-0.5">Send SMS notifications to registered contacts</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="enableSMSAlerts"
                      checked={settings.enableSMSAlerts}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>
            </div>

            {/* Save */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
              >
                <i className="fas fa-save"></i>
                Save Settings
              </button>
              {isSaved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <i className="fas fa-check-circle"></i>
                  Settings saved successfully!
                </span>
              )}
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
