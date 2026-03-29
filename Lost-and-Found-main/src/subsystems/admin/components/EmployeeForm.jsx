import { useState, useEffect } from "react";
import { api } from "../../../api";

export default function EmployeeForm({ employee, onSaved }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [contact, setContact] = useState("");
  const [nic, setNic] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setName(employee.name || "");
      setRole(employee.role || "");
      setContact(employee.contact || "");
      setNic(employee.nic || "");
      setLicenseNo(employee.licenseNo || "");
    } else {
      setName(""); setRole(""); setContact(""); setNic(""); setLicenseNo("");
    }
    setErrors({});
  }, [employee]);

  const validateForm = () => {
    const newErrors = {};

    if (!name) newErrors.name = "Name is required";
    if (!role) newErrors.role = "Role is required";

    if (!contact) newErrors.contact = "Contact is required";
    else if (!/^\d{10}$/.test(contact)) newErrors.contact = "Contact must be 10 digits";

    if (!nic) newErrors.nic = "NIC is required";
    else if (!/^(\d{9}[vV]|\d{12})$/.test(nic)) newErrors.nic = "NIC must be 9 digits + V or 12 digits";

    if (role === "Driver") {
      if (!licenseNo) newErrors.licenseNo = "License number is required for drivers";
      else if (!/^[A-Z]{1}\d{7}$/.test(licenseNo.replace(/[\s-]/g, "")))
        newErrors.licenseNo = "License number is invalid (1 letter + 7 digits)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = { name, role, contact, nic };
      if (role === "Driver") data.licenseNo = licenseNo;

      if (employee) await api.put(`/employees/${employee._id}`, data);
      else await api.post("/employees", data);

      if (onSaved) onSaved();
      setName(""); setRole(""); setContact(""); setNic(""); setLicenseNo("");
      setErrors({});
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors); // backend validation errors
      } else {
        setErrors({ general: "Failed to save employee" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded">
      <h3 className="text-xl font-bold mb-2">👨‍💼 Employee Management</h3>

      <input
        className="border p-2 mb-2 w-full"
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      {errors.name && <p className="text-red-500 mb-2">{errors.name}</p>}

      <select
        className="border p-2 mb-2 w-full"
        value={role}
        onChange={e => setRole(e.target.value)}
      >
        <option value="">Select Role</option>
        <option value="Driver">Driver</option>
        <option value="Conductor">Conductor</option>
        <option value="Cleaner">Cleaner</option>
      </select>
      {errors.role && <p className="text-red-500 mb-2">{errors.role}</p>}

      <input
        className="border p-2 mb-2 w-full"
        placeholder="Contact (10 digits)"
        value={contact}
        onChange={e => setContact(e.target.value.replace(/\D/, ''))}
      />
      {errors.contact && <p className="text-red-500 mb-2">{errors.contact}</p>}

      <input
        className="border p-2 mb-2 w-full"
        placeholder="NIC (Old or New)"
        value={nic}
        onChange={e => setNic(e.target.value)}
      />
      {errors.nic && <p className="text-red-500 mb-2">{errors.nic}</p>}

      {role === "Driver" && (
        <input
          className="border p-2 mb-2 w-full"
          placeholder="License Number (1 letter + 7 digits)"
          value={licenseNo}
          onChange={e => setLicenseNo(e.target.value)}
        />
      )}
      {errors.licenseNo && <p className="text-red-500 mb-2">{errors.licenseNo}</p>}

      {errors.general && <p className="text-red-500 mb-2">{errors.general}</p>}

      <button
        type="submit"
        className="bg-green-400 text-black font-semibold px-4 py-2 rounded hover:bg-green-500"
        disabled={loading}
      >
        {loading ? "Saving..." : employee ? "Update Employee" : "Add Employee"}
      </button>
    </form>
  );
}
