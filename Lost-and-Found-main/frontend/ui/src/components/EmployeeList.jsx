import { useState, useEffect } from "react";
import { api } from "../api";
import EmployeeForm from "./EmployeeForm";
import { CSVLink } from "react-csv";

export default function EmployeeList() {
  // --- State variables ---
  const [employees, setEmployees] = useState([]);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");

  // --- Fetch all employees from backend API ---
  const fetchEmployees = async () => {
    try {
      const res = await api.get("/employees");
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
      setEmployees([]);
    }
  };

  useEffect(() => {
    fetchEmployees(); // Fetch employees on component mount
  }, []);

  // --- Delete employee ---
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee?")) return;
    try {
      await api.delete(`/employees/${id}`);
      fetchEmployees(); // Refresh list after deletion
    } catch (err) {
      console.error(err);
    }
  };

  // --- Send alert to employee (placeholder for WhatsApp/SMS) ---
  const handleSendAlert = async (employee) => {
    try {
      alert(`Alert sent to ${employee.name} (${employee.contact})`);
      // In production, replace alert with API call to Twilio/WhatsApp backend
    } catch (err) {
      console.error(err);
      alert("Failed to send alert");
    }
  };

  // --- Filter employees by search text and role ---
  const filteredEmployees = employees.filter((e) => {
    const searchMatch =
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.role?.toLowerCase().includes(search.toLowerCase()) ||
      e.contact?.toLowerCase().includes(search.toLowerCase()) ||
      e.nic?.toLowerCase().includes(search.toLowerCase());
    const roleMatch = filterRole ? e.role === filterRole : true;
    return searchMatch && roleMatch;
  });

  // --- CSV export data preparation ---
  const csvData = filteredEmployees.map((e) => ({
    Name: e.name || "-",
    Role: e.role || "-",
    Contact: e.contact || "-",
    NIC: e.nic || "-",
  }));

  return (
    <div className="p-4">
      {/* Employee Form (Add/Edit) */}
      <EmployeeForm
        employee={editingEmployee}
        onSaved={() => {
          setEditingEmployee(null);
          fetchEmployees(); // Refresh list after saving
        }}
      />

      {/* Search and role filter */}
      <div className="flex flex-wrap gap-2 mb-2">
        <input
          type="text"
          placeholder="Search by name, role, contact, NIC..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 w-full md:w-1/2 rounded"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="border p-2 w-full md:w-1/4 rounded"
        >
          <option value="">All Roles</option>
          <option value="Driver">Driver</option>
          <option value="Conductor">Conductor</option>
          <option value="Cleaner">Cleaner</option>
        </select>
      </div>

      {/* CSV Export Button */}
      <div className="mb-4 flex justify-start p-2">
        <CSVLink
          data={csvData}
          filename={"employees.csv"}
          style={{
            backgroundColor: "#042241",
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

      {/* Employee Table */}
      <table className="w-full border border-gray-300 mt-2 table-auto">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Name</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Contact</th>
            <th className="border p-2">NIC</th>
            <th className="border p-2">Actions</th>
            <th className="border p-2">Send Alert</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((e) => (
            <tr key={e._id} className="hover:bg-gray-50">
              <td className="border p-2">{e.name}</td>
              <td className="border p-2">{e.role}</td>
              <td className="border p-2">{e.contact}</td>
              <td className="border p-2">{e.nic}</td>
              <td className="border p-2 flex gap-2">
                {/* Edit button */}
                <button
                  onClick={() => setEditingEmployee(e)}
                  className="bg-yellow-400 px-4 py-1 rounded hover:bg-yellow-500 min-w-[60px]"
                >
                  Edit
                </button>
                {/* Delete button */}
                <button
                  onClick={() => handleDelete(e._id)}
                  className="bg-red-400 px-4 py-1 rounded hover:bg-red-500 min-w-[60px]"
                >
                  Delete
                </button>
              </td>
              {/* Send alert button */}
              <td className="border p-2 flex justify-center">
                <button
                  onClick={() => handleSendAlert(e)}
                  style={{
                    backgroundColor: "#042241",
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
                  📢 Send Alert
                </button>
              </td>
            </tr>
          ))}
          {filteredEmployees.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center p-2">
                No employees found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
