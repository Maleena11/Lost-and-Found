import { useState, useEffect } from "react";
import { api } from "../../../api";
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
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
          <i className="fas fa-route mr-2 text-blue-700"></i>
          Route Management
        </h2>
      </div>

      {/* Route Form */}
      <div className="bg-white rounded-lg shadow mb-6">
        <RouteForm
          route={editingRoute}
          onSaved={() => {
            setEditingRoute(null); // Clear editing
            fetchRoutes();         // Refresh list
          }}
        />
      </div>

      {/* Search & Filter Card */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Search & Filter</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by Route Number, Start or End Location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* CSV Export Button */}
          <div className="flex justify-start">
            <CSVLink
              data={csvData}
              filename={"routes.csv"}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <i className="fas fa-download mr-2"></i>
              Export CSV
            </CSVLink>
          </div>
        </div>
      </div>

      {/* Routes Table Card */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Routes List ({filteredRoutes.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoutes.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-blue-700">{r.routeNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{r.startLocation}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{r.endLocation}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {r.distanceKm} km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      r.status === 'Active' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingRoute(r)}
                        className="inline-flex items-center px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded transition-colors duration-200"
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r._id)}
                        className="inline-flex items-center px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded transition-colors duration-200"
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* No routes found */}
              {filteredRoutes.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <i className="fas fa-route text-4xl mb-4 text-gray-300"></i>
                    <p className="text-lg font-medium">No routes found</p>
                    <p className="text-sm">Try adjusting your search or filter criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
