import { useState } from "react";
import Sidebar from "./Sidebar";

export default function Settings({ activeSection, setActiveSection, sidebarOpen, setSidebarOpen }) {
  const [settings, setSettings] = useState({
    systemName: "Lost & Found System",
    adminEmail: "admin@lostandfound.com",
    itemsPerPage: 4,
    enableEmailNotifications: true
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
    // Save settings (in a real app, this would be an API call)
    console.log("Settings saved:", settings);
    setIsSaved(true);
    
    // Reset saved message after 3 seconds
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <main className="flex-1 min-h-screen bg-gray-100 p-6 lg:ml-64 transition-all duration-300">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">System Settings</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            {/* System Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">System Name</label>
              <input
                type="text"
                name="systemName"
                value={settings.systemName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Admin Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
              <input
                type="email"
                name="adminEmail"
                value={settings.adminEmail}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Items Per Page */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Items Per Page</label>
              <select
                name="itemsPerPage"
                value={settings.itemsPerPage}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="4">4</option>
                <option value="8">8</option>
                <option value="12">12</option>
                <option value="16">16</option>
                <option value="20">20</option>
              </select>
            </div>

            {/* Enable Email Notifications */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableEmailNotifications"
                name="enableEmailNotifications"
                checked={settings.enableEmailNotifications}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enableEmailNotifications" className="ml-2 block text-sm text-gray-900">
                Enable Email Notifications
              </label>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition duration-300 font-semibold"
              >
                Save Settings
              </button>
              
              {isSaved && (
                <span className="text-green-600 font-medium">
                  Settings saved successfully!
                </span>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}