import { useState } from "react";
import EmployeeList from "./components/EmployeeList";
import VehicleList from "./components/VehicleList";
import RouteList from "./components/RouteList";
import AssignmentList from "./components/AssignmentList";
import Dashboard from "./components/Dashboard";
import "./App.css";   // Import global CSS

export default function App() {
  const [activeTab, setActiveTab] = useState("employees"); // Track active tab
  
  const tabs = [
    { key: "employees", label: "Employees" },
    { key: "vehicles", label: "Vehicles" },
    { key: "routes", label: "Routes" },
    { key: "assignments", label: "Assignments" },
    { key: "dashboard", label: "Dashboard" }, // Dashboard tab at the end
  ];

  return (
    <div className="App">
      <h1 className="text-3xl font-bold text-center mb-6">
        Fleet Management Dashboard
      </h1>

      {/* Top Navigation Bar */}
      <div className="topbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)} // Switch active tab
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`} // Highlight active tab
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === "employees" && <EmployeeList />}
        {activeTab === "vehicles" && <VehicleList />}
        {activeTab === "routes" && <RouteList />}
        {activeTab === "assignments" && <AssignmentList />}
        {activeTab === "dashboard" && <Dashboard />}
      </div>

      {/* Inline CSS for tabs */}
      <style>{`
        .tab-btn {
          background-color: white;
          color: black;
          border: 1px solid #ccc;
          padding: 10px 15px;
          margin-right: 8px;
          cursor: pointer;
          border-radius: 4px;
          transition: background-color 0.3s, color 0.3s;
          font-size: 16px;
        }

        .tab-btn:hover {
          background-color: #eee;
        }

        .tab-btn.active {
          background-color: #042241; /* Dark blue for active tab */
          color: white;
        }

        .topbar {
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
