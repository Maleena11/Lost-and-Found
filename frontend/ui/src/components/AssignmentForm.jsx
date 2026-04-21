import { useState, useEffect } from "react";
import { api } from "../api";

// AssignmentForm component: Add or Edit Assignments
export default function AssignmentForm({ assignment, onSaved, vehicles, employees, routes }) {
  // Form state
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [conductorId, setConductorId] = useState("");
  const [cleanerId, setCleanerId] = useState("");
  const [routeId, setRouteId] = useState("");

  // Messages and loading state
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // When assignment prop changes, pre-fill form for edit
  useEffect(() => {
    if (assignment) {
      setVehicleId(assignment.vehicle?._id || "");
      setDriverId(assignment.driver?._id || "");
      setConductorId(assignment.conductor?._id || "");
      setCleanerId(assignment.cleaner?._id || "");
      setRouteId(assignment.route?._id || "");
    } else {
      setVehicleId(""); setDriverId(""); setConductorId(""); setCleanerId(""); setRouteId("");
    }
    setErrorMessage(""); setSuccessMessage("");
  }, [assignment]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); setSuccessMessage("");

    // --- Frontend validations ---
    if (!vehicleId) return setErrorMessage("Vehicle selection is required.");
    if (!driverId) return setErrorMessage("Driver selection is required.");
    if (!cleanerId) return setErrorMessage("Cleaner is required for every assignment.");

    // If vehicle is a bus, conductor is required
    const selectedVehicle = vehicles.find(v => v._id === vehicleId);
    if (selectedVehicle?.vehicleType === "Bus" && !conductorId) {
      return setErrorMessage("Conductor is required for buses.");
    }

    // Prepare data to send
    const data = { vehicle: vehicleId, driver: driverId, conductor: conductorId, cleaner: cleanerId, route: routeId };
    setLoading(true);

    try {
      // If editing, PUT request; else, POST request
      if (assignment) await api.put(`/assignments/${assignment._id}`, data);
      else await api.post("/assignments", data);

      setSuccessMessage("Assignment saved successfully!");
      if (onSaved) onSaved(); // callback to refresh list or close form
      setVehicleId(""); setDriverId(""); setConductorId(""); setCleanerId(""); setRouteId("");
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Error saving assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded">
      <h3 className="text-xl font-bold mb-2">🚍 Assignment Management</h3>

      {/* Vehicle selection */}
      <select className="border p-2 mb-2 w-full" value={vehicleId} onChange={e => setVehicleId(e.target.value)} required>
        <option value="">Select Vehicle</option>
        {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleId}</option>)}
      </select>

      {/* Driver selection */}
      <select className="border p-2 mb-2 w-full" value={driverId} onChange={e => setDriverId(e.target.value)} required>
        <option value="">Select Driver</option>
        {employees.filter(e => e.role === "Driver").map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
      </select>

      {/* Conductor selection (optional, required only for buses) */}
      <select className="border p-2 mb-2 w-full" value={conductorId} onChange={e => setConductorId(e.target.value)}>
        <option value="">Select Conductor (required for buses)</option>
        {employees.filter(e => e.role === "Conductor").map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
      </select>

      {/* Cleaner selection */}
      <select className="border p-2 mb-2 w-full" value={cleanerId} onChange={e => setCleanerId(e.target.value)} required>
        <option value="">Select Cleaner</option>
        {employees.filter(e => e.role === "Cleaner").map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
      </select>

      {/* Route selection */}
      <select className="border p-2 mb-2 w-full" value={routeId} onChange={e => setRouteId(e.target.value)} required>
        <option value="">Select Route</option>
        {routes.map(r => <option key={r._id} value={r._id}>{r.routeNumber}</option>)}
      </select>

      {/* Error / Success messages */}
      {errorMessage && <p className="text-red-500 mb-2">{errorMessage}</p>}
      {successMessage && <p className="text-green-500 mb-2">{successMessage}</p>}

      {/* Submit button */}
      <button
        type="submit"
        className="bg-green-400 text-black font-semibold px-4 py-2 rounded hover:bg-green-500"
        disabled={loading}
      >
        {loading ? "Saving..." : assignment ? "Update Assignment" : "Add Assignment"}
      </button>
    </form>
  );
}
