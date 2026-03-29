import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import axios from "axios";
import { validateRouteForm, getFieldClassName } from "../../../shared/utils/routeValidation";

const API_URL = "http://localhost:3001/api/routes";

export default function RoutesTips({ activeSection, setActiveSection, sidebarOpen, setSidebarOpen }) {
  const [routes, setRoutes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [newRoute, setNewRoute] = useState({
    routeNumber: "",
    name: "",
    startLocation: "",
    endLocation: "",
    distanceKm: 0,
    stops: 1,
    status: ""
  });

  // Validation state
  const [routeErrors, setRouteErrors] = useState({});
  const [routeTouched, setRouteTouched] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRoutes = async () => {
    try {
      const res = await axios.get(API_URL);
      setRoutes(res.data);
    } catch (err) {
      console.error("Error fetching routes:", err);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  // Real-time validation effect
  useEffect(() => {
    const errors = validateRouteForm(newRoute);
    setRouteErrors(errors);
    setIsFormValid(Object.keys(errors).length === 0);
  }, [newRoute]);

  // Helper function to show field error
  const showFieldError = (fieldName, touched, errors) => {
    return touched[fieldName] && errors[fieldName];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRoute(prev => ({ 
      ...prev, 
      [name]: name === "stops" || name === "distanceKm" ? parseFloat(value) || 0 : value 
    }));
    
    // Mark field as touched
    setRouteTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleInputBlur = (e) => {
    const { name } = e.target;
    setRouteTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched to show all errors
    setRouteTouched({
      routeNumber: true,
      name: true,
      startLocation: true,
      endLocation: true,
      distanceKm: true,
      stops: true,
      status: true
    });

    // Check if form is valid
    if (!isFormValid) {
      alert("Please fix the validation errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editingRoute) {
        await axios.put(`${API_URL}/${editingRoute._id}`, newRoute);
        setEditingRoute(null);
      } else {
        await axios.post(API_URL, newRoute);
      }
      setShowForm(false);
      setNewRoute({ routeNumber: "", name: "", startLocation: "", endLocation: "", distanceKm: 0, stops: 1, status: "" });
      setRouteTouched({});
      fetchRoutes();
      alert(`Route ${editingRoute ? 'updated' : 'created'} successfully!`);
    } catch (err) {
      console.error("Error saving route:", err);
      alert(err.response?.data?.error || "Failed to save route. Check backend logs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRoute = (route) => {
    setEditingRoute(route);
    setNewRoute(route);
    setRouteTouched({});
    setShowForm(true);
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm("Are you sure you want to delete this route?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchRoutes();
    } catch (err) {
      console.error("Error deleting route:", err);
      alert("Failed to delete route.");
    }
  };

  // ----------- REPORT GENERATION -----------
  const handleDownloadRoutesReport = () => {
    if (routes.length === 0) {
      alert("No routes to generate report.");
      return;
    }

    const headers = ["Route Number", "Name", "Start Location", "End Location", "Distance (km)", "Stops", "Status"];
    const csvRows = [headers.join(",")];

    routes.forEach(route => {
      const row = [
        route.routeNumber,
        route.name,
        route.startLocation,
        route.endLocation,
        route.distanceKm,
        route.stops,
        route.status
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `routes_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 min-h-screen bg-gray-100 p-6 lg:ml-64 transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">Routes & Trips Management</h1>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadRoutesReport}
              className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-300"
            >
              Download Routes Report
            </button>
            <button
              onClick={() => { 
                setShowForm(!showForm); 
                setEditingRoute(null); 
                setNewRoute({ routeNumber: "", name: "", startLocation: "", endLocation: "", distanceKm: 0, stops: 1, status: "" }); 
                setRouteTouched({});
              }}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
            >
              {showForm ? "Cancel" : "Add New Route"}
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{editingRoute ? "Edit Route" : "Add New Route"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Route Number</label>
                <input
                  type="text"
                  name="routeNumber"
                  value={newRoute.routeNumber}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="Enter route number (e.g., R101)"
                  className={getFieldClassName("routeNumber", routeTouched, routeErrors)}
                  required
                />
                {showFieldError("routeNumber", routeTouched, routeErrors) && (
                  <p className="mt-1 text-sm text-red-600">{routeErrors.routeNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={newRoute.name}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="Enter route name"
                  className={getFieldClassName("name", routeTouched, routeErrors)}
                  required
                />
                {showFieldError("name", routeTouched, routeErrors) && (
                  <p className="mt-1 text-sm text-red-600">{routeErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Location</label>
                <input
                  type="text"
                  name="startLocation"
                  value={newRoute.startLocation}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="Enter start location"
                  className={getFieldClassName("startLocation", routeTouched, routeErrors)}
                  required
                />
                {showFieldError("startLocation", routeTouched, routeErrors) && (
                  <p className="mt-1 text-sm text-red-600">{routeErrors.startLocation}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Location</label>
                <input
                  type="text"
                  name="endLocation"
                  value={newRoute.endLocation}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="Enter end location"
                  className={getFieldClassName("endLocation", routeTouched, routeErrors)}
                  required
                />
                {showFieldError("endLocation", routeTouched, routeErrors) && (
                  <p className="mt-1 text-sm text-red-600">{routeErrors.endLocation}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Distance (km)</label>
                <input
                  type="number"
                  name="distanceKm"
                  min="0.1"
                  step="0.1"
                  value={newRoute.distanceKm}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="Enter distance in km"
                  className={getFieldClassName("distanceKm", routeTouched, routeErrors)}
                  required
                />
                {showFieldError("distanceKm", routeTouched, routeErrors) && (
                  <p className="mt-1 text-sm text-red-600">{routeErrors.distanceKm}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stops</label>
                <input
                  type="number"
                  name="stops"
                  min="1"
                  value={newRoute.stops}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="Enter number of stops"
                  className={getFieldClassName("stops", routeTouched, routeErrors)}
                  required
                />
                {showFieldError("stops", routeTouched, routeErrors) && (
                  <p className="mt-1 text-sm text-red-600">{routeErrors.stops}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={newRoute.status}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className={getFieldClassName("status", routeTouched, routeErrors)}
                >
                  <option value="">Select status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {showFieldError("status", routeTouched, routeErrors) && (
                  <p className="mt-1 text-sm text-red-600">{routeErrors.status}</p>
                )}
              </div>
              {/* Form Validation Summary */}
              <div className="md:col-span-2 lg:col-span-3">
                {!isFormValid && Object.keys(routeTouched).length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <p className="text-yellow-800 text-sm font-medium">
                      Please fix the validation errors above before submitting.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex items-end">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !isFormValid}
                  className={`py-2 px-4 rounded-md transition duration-300 ${
                    isSubmitting || !isFormValid
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-green-600 hover:bg-green-700"
                  } text-white`}
                >
                  {isSubmitting ? (editingRoute ? "Updating..." : "Adding...") : (editingRoute ? "Update Route" : "Add Route")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Routes Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Route Number</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Start Location</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">End Location</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Distance (km)</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Stops</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {routes.map(route => (
                <tr key={route._id} className="hover:bg-gray-50 transition text-black">
                  <td className="px-6 py-4 font-semibold text-blue-700">{route.routeNumber}</td>
                  <td className="px-6 py-4">{route.name}</td>
                  <td className="px-6 py-4">{route.startLocation}</td>
                  <td className="px-6 py-4">{route.endLocation}</td>
                  <td className="px-6 py-4">{route.distanceKm} km</td>
                  <td className="px-6 py-4">{route.stops}</td>
                  <td className={`px-6 py-4 font-semibold ${route.status === "Active" ? "text-green-500" : "text-red-500"}`}>{route.status}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handleEditRoute(route)}
                      className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRoute(route._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
