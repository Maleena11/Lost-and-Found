import { useState, useEffect } from "react";
import { api } from "../../../api";
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
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
          <i className="fas fa-clipboard-list mr-2 text-blue-700"></i>
          Assignment Management
        </h2>
      </div>

      {/* Form for Add/Edit Assignment */}
      <div className="bg-white rounded-lg shadow mb-6">
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
      </div>

      {/* Search & Export Card */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Search & Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search by Vehicle, Driver, or Route"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* CSV Export Button */}
          <div className="flex justify-start">
            <CSVLink
              data={csvData}
              filename={"assignments.csv"}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <i className="fas fa-download mr-2"></i>
              Export CSV
            </CSVLink>
          </div>
        </div>
      </div>

      {/* Assignment Table Card */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Assignments List ({filteredAssignments.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conductor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cleaner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssignments.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <i className="fas fa-bus text-blue-500 mr-2"></i>
                      <div className="font-medium text-gray-900">{a.vehicle?.vehicleId || "-"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <i className="fas fa-user-tie text-blue-600 mr-2"></i>
                      <div className="text-gray-900">{a.driver?.name || "-"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <i className="fas fa-user text-green-600 mr-2"></i>
                      <div className="text-gray-900">{a.conductor?.name || "-"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <i className="fas fa-broom text-yellow-600 mr-2"></i>
                      <div className="text-gray-900">{a.cleaner?.name || "-"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <i className="fas fa-route text-purple-600 mr-2"></i>
                      <div className="font-medium text-blue-700">{a.route?.routeNumber || "-"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingAssignment(a)}
                        className="inline-flex items-center px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded transition-colors duration-200"
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(a._id)}
                        className="inline-flex items-center px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded transition-colors duration-200"
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <i className="fas fa-clipboard-list text-4xl mb-4 text-gray-300"></i>
                    <p className="text-lg font-medium">No assignments found</p>
                    <p className="text-sm">Try adjusting your search criteria or create a new assignment</p>
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
