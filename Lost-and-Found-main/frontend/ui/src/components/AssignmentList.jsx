import { useState, useEffect } from "react";
import { api } from "../api";
import AssignmentForm from "./AssignmentForm";
import { CSVLink } from "react-csv";

export default function AssignmentList() {
  // --- State ---
  const [assignments, setAssignments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [search, setSearch] = useState("");

  // Fetch all data from API
  const fetchData = async () => {
    try {
      const [aRes, vRes, eRes, rRes] = await Promise.all([
        api.get("/assignments"),
        api.get("/vehicles"),
        api.get("/employees"),
        api.get("/routes"),
      ]);
      setAssignments(aRes.data);
      setVehicles(vRes.data);
      setEmployees(eRes.data);
      setRoutes(rRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Handle delete assignment
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      await api.delete(`/assignments/${id}`);
      fetchData(); // Refresh list
    } catch (err) {
      console.error(err);
    }
  };

  // --- Filter assignments based on search ---
  const filteredAssignments = assignments.filter(
    (a) =>
      a.vehicle?.vehicleId?.toLowerCase().includes(search.toLowerCase()) ||
      a.driver?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.route?.routeNumber?.toLowerCase().includes(search.toLowerCase())
  );

  // Prepare CSV data
  const csvData = filteredAssignments.map((a) => ({
    Vehicle: a.vehicle?.vehicleId || "-",
    Driver: a.driver?.name || "-",
    Conductor: a.conductor?.name || "-",
    Cleaner: a.cleaner?.name || "-",
    Route: a.route?.routeNumber || "-",
  }));

  return (
    <div className="p-4">
      {/* Form for Add/Edit Assignment */}
      <AssignmentForm
        assignment={editingAssignment}
        vehicles={vehicles}
        employees={employees}
        routes={routes}
        onSaved={() => {
          setEditingAssignment(null);
          fetchData();
        }}
      />

      {/* Search input */}
      <input
        type="text"
        placeholder="Search by Vehicle, Driver, or Route"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 mb-2 w-full rounded"
      />

      {/* CSV Export Button */}
      <div className="mb-4 flex justify-start p-2">
        <CSVLink
          data={csvData}
          filename={"assignments.csv"}
          style={{
            backgroundColor: "#042241ff",
            borderRadius: "0.375rem",
            padding: "0.5rem 1rem",
            color: "white",
            fontWeight: 600,
            fontSize: "16px",
            whiteSpace: "nowrap",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
          }}
        >
          📥 Export CSV
        </CSVLink>
      </div>

      {/* Assignment Table */}
      <table className="w-full border border-gray-300 mt-2 table-auto">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Vehicle</th>
            <th className="border p-2">Driver</th>
            <th className="border p-2">Conductor</th>
            <th className="border p-2">Cleaner</th>
            <th className="border p-2">Route</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAssignments.map((a) => (
            <tr key={a._id} className="hover:bg-gray-50">
              <td className="border p-2">{a.vehicle?.vehicleId || "-"}</td>
              <td className="border p-2">{a.driver?.name || "-"}</td>
              <td className="border p-2">{a.conductor?.name || "-"}</td>
              <td className="border p-2">{a.cleaner?.name || "-"}</td>
              <td className="border p-2">{a.route?.routeNumber || "-"}</td>
              <td className="border p-2 flex gap-2">
                {/* Edit button */}
                <button
                  onClick={() => setEditingAssignment(a)}
                  className="bg-yellow-400 text-black font-semibold px-4 py-1 rounded hover:bg-yellow-500 min-w-[60px]"
                >
                  Edit
                </button>
                {/* Delete button */}
                <button
                  onClick={() => handleDelete(a._id)}
                  className="bg-red-400 text-black font-semibold px-4 py-1 rounded hover:bg-red-500 min-w-[60px]"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {filteredAssignments.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center p-2">
                No assignments found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
