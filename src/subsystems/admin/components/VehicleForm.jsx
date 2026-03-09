import { useState, useEffect } from "react";
import { api } from "../../../api";

export default function VehicleForm({ vehicle, onSaved }) {
  const [vehicleType, setVehicleType] = useState("Bus");
  const [vehicleId, setVehicleId] = useState("");
  const [plateNo, setPlateNo] = useState("");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState("Active");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Regex
  const vehicleIdRegex = /^[A-Z]{1}[0-9]{4}$/; // B0001
  const plateNoRegex = /^[A-Z]{3}-[0-9]{3}$/;  // XXX-123

  useEffect(() => {
    if (vehicle) {
      setVehicleType(vehicle.vehicleType || "Bus");
      setVehicleId(vehicle.vehicleId || "");
      setPlateNo(vehicle.plateNo || "");
      setCapacity(vehicle.capacity || "");
      setStatus(vehicle.status || "Active");
    } else {
      setVehicleType("Bus");
      setVehicleId(""); setPlateNo(""); setCapacity(""); setStatus("Active");
    }
    setSuccessMessage(""); setErrorMessage("");
  }, [vehicle]);

  const validateForm = () => {
    if (!vehicleType || !vehicleId || !plateNo || !capacity) return false;
    if (capacity <= 0 || capacity > 2000) return false;
    if (!vehicleIdRegex.test(vehicleId)) return false;
    if (!plateNoRegex.test(plateNo)) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(""); 
    setErrorMessage("");

    const data = {
      vehicleType,
      vehicleId,
      plateNo,
      capacity: Number(capacity),
      status
    };

    try {
      if (vehicle) {
        await api.put(`/vehicles/${vehicle._id}`, data);
      } else {
        await api.post("/vehicles", data);
      }

      setSuccessMessage("Vehicle saved successfully!");
      if (onSaved) onSaved();
      setVehicleType("Bus"); setVehicleId(""); setPlateNo(""); setCapacity(""); setStatus("Active");
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors) {
        setErrorMessage(Object.values(err.response.data.errors).join(", "));
      } else if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage("Error saving vehicle");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-3 border rounded">
      <h3 className="font-bold mb-2">{vehicle ? "Edit Vehicle" : "Add Vehicle"}</h3>

      <select
        className="border p-2 mb-2 w-full"
        value={vehicleType}
        onChange={e => setVehicleType(e.target.value)}
      >
        <option value="Bus">Bus</option>
        <option value="Train">Train</option>
      </select>

      <input
        className="border p-2 mb-2 w-full"
        placeholder="Vehicle ID (B0001)"
        value={vehicleId}
        onChange={e => setVehicleId(e.target.value.toUpperCase())}
        required
        disabled={!!vehicle}
      />
      {vehicleId && !vehicleIdRegex.test(vehicleId) && (
        <p className="text-red-500 mb-2">
          Vehicle ID must be B0001 format (1 uppercase letter + 4 digits)
        </p>
      )}

      <input
        className="border p-2 mb-2 w-full"
        placeholder="Plate No (XXX-123)"
        value={plateNo}
        onChange={e => setPlateNo(e.target.value.toUpperCase())}
        required
        disabled={!!vehicle}
      />
      {plateNo && !plateNoRegex.test(plateNo) && (
        <p className="text-red-500 mb-2">
          Plate No must be XXX-123 format (3 letters + dash + 3 digits)
        </p>
      )}

      <input
        className="border p-2 mb-2 w-full"
        placeholder="Capacity"
        type="number"
        value={capacity}
        onChange={e => setCapacity(e.target.value)}
      />
      {capacity && (capacity <= 0 || capacity > 2000) && (
        <p className="text-red-500 mb-2">Capacity must be between 1 and 2000</p>
      )}

      <select
        className="border p-2 mb-2 w-full"
        value={status}
        onChange={e => setStatus(e.target.value)}
      >
        <option>Active</option>
        <option>Inactive</option>
        <option>Maintenance</option>
      </select>

      {successMessage && <p className="text-green-500 mb-2">{successMessage}</p>}
      {errorMessage && <p className="text-red-500 mb-2">{errorMessage}</p>}

      <button
        type="submit"
        className="bg-green-400 text-black font-semibold px-4 py-2 rounded hover:bg-green-500"
        disabled={!validateForm() || loading}
      >
        {loading ? "Saving..." : vehicle ? "Update Vehicle" : "Add Vehicle"}
      </button>
    </form>
  );
}
