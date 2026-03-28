import { useState, useEffect } from "react";
import { api } from "../api";
import RouteForm from "./RouteForm";
import { CSVLink } from "react-csv";

export default function RouteList() {
  // --- State ---
  const [routes, setRoutes] = useState([]);          // All routes
  const [editingRoute, setEditingRoute] = useState(null); // Route being edited
  const [search, setSearch] = useState("");          // Search text
  const [filterStatus, setFilterStatus] = useState(""); // Status filter

  // --- Fetch all routes from backend ---
  const fetchRoutes = async () => {
    try {
      const res = await api.get("/routes");
      setRoutes(res.data);
    } catch (err) {
      console.error("Error fetching routes:", err);
      setRoutes([]);
    }
  };

  // --- Load routes when component mounts ---
  useEffect(() => {
    fetchRoutes();
  }, []);

  // --- Delete route by ID ---
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this route?")) return; // Confirm first
    try {
      await api.delete(`/routes/${id}`);
      fetchRoutes(); // Refresh list
    } catch (err) {
      console.error(err);
    }
  };

  // --- Filter routes based on search and status ---
  const filteredRoutes = routes.filter((r) => {
    const searchMatch =
      r.routeNumber?.toLowerCase().includes(search.toLowerCase()) ||
      r.startLocation?.toLowerCase().includes(search.toLowerCase()) ||
      r.endLocation?.toLowerCase().includes(search.toLowerCase());
    const statusMatch = filterStatus ? r.status === filterStatus : true;
    return searchMatch && statusMatch;
  });

  // --- Prepare data for CSV export ---
  const csvData = filteredRoutes.map((r) => ({
    "Route Number": r.routeNumber || "-",
    "Start Location": r.startLocation || "-",
    "End Location": r.endLocation || "-",
    "Distance (km)": r.distanceKm || "-",
    Status: r.status || "-",
  }));

  return (
    <div className="p-4">
      {/* --- Route Form --- */}
      <RouteForm
        route={editingRoute}
        onSaved={() => {
          setEditingRoute(null); // Clear editing
          fetchRoutes();         // Refresh list
        }}
      />

      {/* --- Search & Status Filter --- */}
      <div className="flex flex-wrap gap-2 mb-2">
        <input
          type="text"
          placeholder="Search by Route Number, Start or End Location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 w-full md:w-1/2 rounded"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border p-2 w-full md:w-1/4 rounded"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* --- CSV Export Button --- */}
      <div className="mb-4 flex justify-start p-2">
        <CSVLink
          data={csvData}
          filename={"routes.csv"}
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

      {/* --- Routes Table --- */}
      <table className="w-full border border-gray-300 mt-2 table-auto">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Route Number</th>
            <th className="border p-2">Start Location</th>
            <th className="border p-2">End Location</th>
            <th className="border p-2">Distance (km)</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRoutes.map((r) => (
            <tr key={r._id} className="hover:bg-gray-50">
              <td className="border p-2">{r.routeNumber}</td>
              <td className="border p-2">{r.startLocation}</td>
              <td className="border p-2">{r.endLocation}</td>
              <td className="border p-2">{r.distanceKm}</td>
              <td className="border p-2">{r.status}</td>
              <td className="border p-2 flex gap-2">
                {/* Edit button */}
                <button
                  onClick={() => setEditingRoute(r)}
                  className="bg-yellow-400 px-4 py-1 rounded hover:bg-yellow-500 min-w-[60px]"
                >
                  Edit
                </button>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(r._id)}
                  className="bg-red-400 px-4 py-1 rounded hover:bg-red-500 min-w-[60px]"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {/* No routes found */}
          {filteredRoutes.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center p-2">
                No routes found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
