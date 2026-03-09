import { useState } from "react";
import EmployeeList from "../components/EmployeeList";
import VehicleList from "../components/VehicleList";
import RouteList from "../components/RouteList";
import AssignmentList from "../components/AssignmentList";
import Dashboard from "../components/Dashboard";
import Sidebar from "./Sidebar";

export default function FleetManage() {
  const [activeTab, setActiveTab] = useState("employees");
  const [activeSection, setActiveSection] = useState("fleet");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const tabs = [
    { key: "employees", label: "Employees", icon: "fas fa-users" },
    { key: "vehicles", label: "Vehicles", icon: "fas fa-bus" },
    { key: "routes", label: "Routes", icon: "fas fa-route" },
    { key: "assignments", label: "Assignments", icon: "fas fa-clipboard-list" },
    { key: "dashboard", label: "Dashboard", icon: "fas fa-chart-line" },
  ];

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
      <main className="flex-1 min-h-screen bg-gray-100 lg:ml-64 transition-all duration-300">
        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center justify-between bg-white shadow-sm p-4">
          <h1 className="text-xl font-bold text-blue-700">Fleet Management</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-blue-700 p-2"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>

        {/* Page content */}
        <div className="p-6">
          {/* Page header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-3xl font-bold text-blue-700 mb-4 md:mb-0">
              Fleet Management Dashboard
            </h1>
          </div>

          {/* Navigation tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center px-6 py-4 text-sm font-medium transition-colors duration-200 border-b-2 whitespace-nowrap ${
                      activeTab === tab.key
                        ? "text-blue-700 border-blue-700 bg-blue-50"
                        : "text-gray-600 border-transparent hover:text-blue-700 hover:bg-gray-50"
                    }`}
                  >
                    <i className={`${tab.icon} mr-2`}></i>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              {activeTab === "employees" && <EmployeeList />}
              {activeTab === "vehicles" && <VehicleList />}
              {activeTab === "routes" && <RouteList />}
              {activeTab === "assignments" && <AssignmentList />}
              {activeTab === "dashboard" && <Dashboard />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}