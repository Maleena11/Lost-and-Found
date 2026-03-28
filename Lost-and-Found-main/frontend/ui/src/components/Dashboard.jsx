import { useEffect, useState } from "react";
import { api } from "../api";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts";

export default function Dashboard() {
  // --- State variables for dashboard data ---
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // --- Fetch data from API on component mount ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eRes, vRes, rRes, aRes] = await Promise.all([
          api.get("/employees"),
          api.get("/vehicles"),
          api.get("/routes"),
          api.get("/assignments"),
        ]);
        setEmployees(eRes.data);
        setVehicles(vRes.data);
        setRoutes(rRes.data);
        setAssignments(aRes.data);
      } catch (err) {
        console.error("Error loading dashboard data: ", err);
      }
    };
    fetchData();
  }, []);

  // --- 1️⃣ Employees by Role (Pie Chart) ---
  const employeeRoles = employees.reduce((acc, emp) => {
    acc[emp.role] = (acc[emp.role] || 0) + 1; // Count employees per role
    return acc;
  }, {});
  const employeeData = Object.keys(employeeRoles).map(role => ({
    name: role,
    value: employeeRoles[role],
  }));

  // --- 2️⃣ Vehicles by Status (Pie Chart) ---
  const vehicleStatuses = vehicles.reduce((acc, v) => {
    acc[v.status || "Unknown"] = (acc[v.status || "Unknown"] || 0) + 1;
    return acc;
  }, {});
  const vehicleData = Object.keys(vehicleStatuses).map(status => ({
    name: status,
    value: vehicleStatuses[status],
  }));

  // --- 3️⃣ Assignments per Route (Bar Chart) ---
  const routeAssignments = routes.map(r => ({
    name: r.routeNumber,
    count: assignments.filter(a => a.route?._id === r._id).length,
  }));

  // Colors for pie charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A855F7"];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">📊 Dashboard Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pie Chart: Employees by Role */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Employees by Role</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={employeeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {employeeData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart: Vehicles by Status */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Vehicles by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={vehicleData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#82ca9d"
                label
              >
                {vehicleData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart: Assignments per Route */}
        <div className="bg-white shadow rounded-lg p-4 col-span-1 md:col-span-2 lg:col-span-1">
          <h3 className="text-lg font-semibold mb-2">Assignments per Route</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={routeAssignments}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
