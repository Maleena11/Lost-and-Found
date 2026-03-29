import { useState, useEffect } from "react";
import { api } from "../api";
import VehicleForm from "./VehicleForm";
import { CSVLink } from "react-csv";

export default function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Fetch all vehicles from backend
  const fetchVehicles = async () => {
    try {
      const res = await api.get("/vehicles");
      setVehicles(res.data);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setVehicles([]);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Delete a vehicle
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vehicle?")) return;
    try {
      await api.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter vehicles safely
  const filteredVehicles = vehicles.filter((v) => {
    const searchMatch =
      (v.vehicleId || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.plateNo || "").toLowerCase().includes(search.toLowerCase());
    const statusMatch = filterStatus ? v.status === filterStatus : true;
    return searchMatch && statusMatch;
  });

  // CSV export data
  const csvData = filteredVehicles.map((v) => ({
    "Vehicle ID": v.vehicleId || "-",
    "Plate No": v.plateNo || "-",
    Capacity: v.capacity || "-",
    Status: v.status || "-",
  }));

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">🚍 Vehicle Management</h2>

      {/* Vehicle Form */}
      <VehicleForm
        vehicle={editingVehicle}
        onSaved={() => {
          setEditingVehicle(null);
          fetchVehicles();
        }}
      />

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-2 mb-2">
        <input
          type="text"
          placeholder="Search by Vehicle ID or Plate No..."
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
          <option value="Maintenance">Maintenance</option>
        </select>
      </div>

      {/* CSV Export */}
      <div className="mb-4 flex justify-start p-2">
        <CSVLink
          data={csvData}
          filename={"vehicles.csv"}
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

      {/* Vehicle Table */}
      <table className="w-full border border-gray-300 mt-2 table-auto">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Vehicle ID</th>
            <th className="border p-2">Plate No</th>
            <th className="border p-2">Capacity</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredVehicles.map((v) => (
            <tr key={v._id} className="hover:bg-gray-50">
              <td className="border p-2">{v.vehicleId || "-"}</td>
              <td className="border p-2">{v.plateNo || "-"}</td>
              <td className="border p-2">{v.capacity || "-"}</td>
              <td className="border p-2">{v.status || "-"}</td>
              <td className="border p-2 flex gap-2">
                <button
                  onClick={() => setEditingVehicle(v)}
                  className="bg-yellow-400 px-4 py-1 rounded hover:bg-yellow-500 min-w-[60px]"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(v._id)}
                  className="bg-red-400 px-4 py-1 rounded hover:bg-red-500 min-w-[60px]"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {filteredVehicles.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center p-2">
                No vehicles found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
