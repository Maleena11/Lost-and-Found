import { useState, useEffect } from "react";
import { api } from "../../../api";
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
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
          <i className="fas fa-users mr-2 text-blue-700"></i>
          Employee Management
        </h2>
      </div>

      {/* Employee Form (Add/Edit) */}
      <div className="bg-white rounded-lg shadow mb-6">
        <EmployeeForm
          employee={editingEmployee}
          onSaved={() => {
            setEditingEmployee(null);
            fetchEmployees(); // Refresh list after saving
          }}
        />
      </div>

      {/* Search and Filters Card */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Search & Filter</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by name, role, contact, NIC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="Driver">Driver</option>
            <option value="Conductor">Conductor</option>
            <option value="Cleaner">Cleaner</option>
          </select>
          
          {/* CSV Export Button */}
          <div className="flex justify-start">
            <CSVLink
              data={csvData}
              filename={"employees.csv"}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <i className="fas fa-download mr-2"></i>
              Export CSV
            </CSVLink>
          </div>
        </div>
      </div>

      {/* Employee Table Card */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Employees List ({filteredEmployees.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alert</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((e) => (
                <tr key={e._id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{e.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      e.role === 'Driver' ? 'bg-blue-100 text-blue-800' :
                      e.role === 'Conductor' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {e.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{e.contact}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{e.nic}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingEmployee(e)}
                        className="inline-flex items-center px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded transition-colors duration-200"
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(e._id)}
                        className="inline-flex items-center px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded transition-colors duration-200"
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Delete
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleSendAlert(e)}
                      className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors duration-200"
                    >
                      <i className="fas fa-bell mr-1"></i>
                      Send Alert
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <i className="fas fa-users text-4xl mb-4 text-gray-300"></i>
                    <p className="text-lg font-medium">No employees found</p>
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
