import { useState, useEffect } from "react";
import { api } from "../../../api";

export default function RouteForm({ route, onSaved }) {
  // --- Form state ---
  const [routeNumber, setRouteNumber] = useState("");
  const [name, setName] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [stops, setStops] = useState("");
  const [status, setStatus] = useState("Active");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Populate form when editing ---
  useEffect(() => {
    if (route) {
      setRouteNumber(route.routeNumber || "");
      setName(route.name || "");
      setStartLocation(route.startLocation || "");
      setEndLocation(route.endLocation || "");
      setDistanceKm(route.distanceKm || "");
      setStops(route.stops || "");
      setStatus(route.status || "Active");
    } else {
      setRouteNumber("");
      setName("");
      setStartLocation("");
      setEndLocation("");
      setDistanceKm("");
      setStops("");
      setStatus("Active");
    }
    setErrorMessage("");
    setSuccessMessage("");
  }, [route]);

  // --- Handle form submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // --- Validation ---
    if (!/^[A-Z]{1}[0-9]{2,4}$/.test(routeNumber)) {
      return setErrorMessage("Route number must start with a letter followed by 2-4 digits (e.g., R101)");
    }
    if (!name.trim()) {
      return setErrorMessage("Route name is required");
    }
    if (!startLocation || !endLocation) {
      return setErrorMessage("Start and End locations are required");
    }
    if (!distanceKm || distanceKm <= 0) {
      return setErrorMessage("Distance must be a positive number");
    }
    if (!stops || stops <= 0) {
      return setErrorMessage("Number of stops must be at least 1");
    }

    const data = { 
      routeNumber, 
      name: name.trim(), 
      startLocation, 
      endLocation, 
      distanceKm: parseFloat(distanceKm),
      stops: parseInt(stops),
      status 
    };
    setLoading(true);

    try {
      if (route) {
        // Update existing route
        await api.put(`/routes/${route._id}`, data);
      } else {
        // Create new route
        await api.post("/routes", data);
      }

      setSuccessMessage("Route saved successfully!");
      if (onSaved) onSaved();

      // Reset form after save
      setRouteNumber("");
      setName("");
      setStartLocation("");
      setEndLocation("");
      setDistanceKm("");
      setStops("");
      setStatus("Active");
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.error || err.response?.data?.message || "Error saving route. Maybe Route Number already exists?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded">
      <h3 className="text-xl font-bold mb-2">{route ? "Edit Route" : "Route Management"} 🛣️</h3>

      {/* Route Number */}
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Route Number (e.g., R101)"
        value={routeNumber}
        onChange={(e) => setRouteNumber(e.target.value.toUpperCase())}
        required
        disabled={!!route} // disable when editing
      />

      {/* Route Name */}
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Route Name (e.g., Main City Route)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      {/* Start Location */}
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Start Location"
        value={startLocation}
        onChange={(e) => setStartLocation(e.target.value)}
        required
      />

      {/* End Location */}
      <input
        className="border p-2 mb-2 w-full"
        placeholder="End Location"
        value={endLocation}
        onChange={(e) => setEndLocation(e.target.value)}
        required
      />

      {/* Distance */}
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Distance (km)"
        type="number"
        min="0.1"
        step="0.1"
        value={distanceKm}
        onChange={(e) => setDistanceKm(e.target.value)}
        required
      />

      {/* Number of Stops */}
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Number of Stops"
        type="number"
        min="1"
        value={stops}
        onChange={(e) => setStops(e.target.value)}
        required
      />

      {/* Status */}
      <select
        className="border p-2 mb-2 w-full"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option>Active</option>
        <option>Inactive</option>
      </select>

      {/* Feedback messages */}
      {errorMessage && <p className="text-red-500 mb-2">{errorMessage}</p>}
      {successMessage && <p className="text-green-500 mb-2">{successMessage}</p>}

      {/* Submit button */}
      <button
        type="submit"
        className="bg-green-400 text-black font-semibold px-4 py-2 rounded hover:bg-green-500"
        disabled={loading}
      >
        {loading ? "Saving..." : route ? "Update Route" : "Add Route"}
      </button>
    </form>
  );
}
