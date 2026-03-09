import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import TopBar from "../components/TopBar";
import { validateUserForm, getFieldClassName } from "../../../shared/utils/userValidation";

export default function UserManagement({ activeSection, setActiveSection, sidebarOpen, setSidebarOpen }) {
  // State for users from database
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for new user form
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    status: ""
  });

  // Validation state
  const [newUserErrors, setNewUserErrors] = useState({});
  const [newUserTouched, setNewUserTouched] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for edit user modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUser, setEditUser] = useState({
    name: "",
    email: "",
    role: "User",
    status: "Active"
  });

  // Edit form validation state
  const [editUserErrors, setEditUserErrors] = useState({});
  const [editUserTouched, setEditUserTouched] = useState({});
  const [isEditFormValid, setIsEditFormValid] = useState(false);
  
  // State for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Fetch users from the database
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/users');
      setUsers(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // Real-time validation effects
  useEffect(() => {
    const errors = validateUserForm(newUser, true);
    setNewUserErrors(errors);
    setIsFormValid(Object.keys(errors).length === 0);
  }, [newUser]);

  useEffect(() => {
    const errors = validateUserForm(editUser, false);
    setEditUserErrors(errors);
    setIsEditFormValid(Object.keys(errors).length === 0);
  }, [editUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Mark field as touched
    setNewUserTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleInputBlur = (e) => {
    const { name } = e.target;
    setNewUserTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditUser(prev => ({
      ...prev,
      [name]: value
    }));

    // Mark field as touched for edit form
    setEditUserTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleEditInputBlur = (e) => {
    const { name } = e.target;
    setEditUserTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched to show all errors
    setNewUserTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      role: true,
      status: true
    });

    // Check if form is valid
    if (!isFormValid) {
      alert("Please fix the validation errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await axios.post('http://localhost:3001/api/users', newUser);
      
      // Add the new user to the local state
      setUsers([...users, response.data]);
      
      // Reset form and hide it
      setNewUser({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "",
        status: ""
      });
      setNewUserTouched({});
      setShowAddUserForm(false);
      setError(null);
      
      alert("User created successfully!");
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err.response?.data?.error || "Failed to create user");
      alert(err.response?.data?.error || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = (id) => {
    const user = users.find(u => (u._id || u.id) === id);
    if (user) {
      setEditingUser(user);
      setEditUser({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      });
      setEditUserTouched({});
      setShowEditModal(true);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched to show all errors
    setEditUserTouched({
      name: true,
      email: true,
      role: true,
      status: true
    });

    // Check if form is valid
    if (!isEditFormValid) {
      alert("Please fix the validation errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const userId = editingUser._id || editingUser.id;
      const response = await axios.put(`http://localhost:3001/api/users/${userId}`, editUser);
      
      // Update the user in local state
      setUsers(users.map(user => 
        (user._id || user.id) === userId 
          ? { ...user, ...response.data }
          : user
      ));
      
      setShowEditModal(false);
      setEditingUser(null);
      setError(null);
      alert("User updated successfully!");
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err.response?.data?.error || "Failed to update user");
      alert(err.response?.data?.error || "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (id) => {
    const user = users.find(u => (u._id || u.id) === id);
    if (user) {
      setUserToDelete(user);
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const userId = userToDelete._id || userToDelete.id;
      await axios.delete(`http://localhost:3001/api/users/${userId}`);
      
      // Remove user from local state
      setUsers(users.filter(user => (user._id || user.id) !== userId));
      
      setShowDeleteModal(false);
      setUserToDelete(null);
      setError(null);
      alert("User deleted successfully!");
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err.response?.data?.error || "Failed to delete user");
      alert(err.response?.data?.error || "Failed to delete user");
    }
  };

  const toggleUserStatus = async (id) => {
    try {
      const userToUpdate = users.find(user => user.id === id || user._id === id);
      if (!userToUpdate) return;
      
      const newStatus = userToUpdate.status === "Active" ? "Inactive" : "Active";
      
      await axios.put(`http://localhost:3001/api/users/${id}`, {
        ...userToUpdate,
        status: newStatus
      });
      
      // Update local state with the response
      setUsers(users.map(user => 
        (user.id === id || user._id === id) 
          ? { ...user, status: newStatus }
          : user
      ));
      
    } catch (err) {
      console.error("Error updating user status:", err);
      alert("Failed to update user status");
    }
  };

  // Helper function to show field error
  const showFieldError = (fieldName, touched, errors) => {
    return touched[fieldName] && errors[fieldName];
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <div className="flex-1 min-h-screen lg:ml-64 flex flex-col bg-gray-50">
        <TopBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title="User Management"
          subtitle="Manage system users and their permissions"
        />
        <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">All Users</h2>
          <button
            onClick={() => setShowAddUserForm(!showAddUserForm)}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
          >
            {showAddUserForm ? "Cancel" : "Add New User"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading Display */}
        {loading && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            Loading users...
          </div>
        )}

        {/* Add New User Form */}
        {showAddUserForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New User</h2>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={newUser.name}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="Enter user name"
                  className={getFieldClassName("name", newUserTouched, newUserErrors)}
                  required
                />
                {showFieldError("name", newUserTouched, newUserErrors) && (
                  <p className="mt-1 text-sm text-red-600">{newUserErrors.name}</p>
                )}
              </div>
              
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="Enter user email"
                  className={getFieldClassName("email", newUserTouched, newUserErrors)}
                  required
                />
                {showFieldError("email", newUserTouched, newUserErrors) && (
                  <p className="mt-1 text-sm text-red-600">{newUserErrors.email}</p>
                )}
              </div>
              
              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="Enter password (min 6 characters)"
                  className={getFieldClassName("password", newUserTouched, newUserErrors)}
                  required
                />
                {showFieldError("password", newUserTouched, newUserErrors) && (
                  <p className="mt-1 text-sm text-red-600">{newUserErrors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={newUser.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="Confirm password"
                  className={getFieldClassName("confirmPassword", newUserTouched, newUserErrors)}
                  required
                />
                {showFieldError("confirmPassword", newUserTouched, newUserErrors) && (
                  <p className="mt-1 text-sm text-red-600">{newUserErrors.confirmPassword}</p>
                )}
              </div>
              
              {/* Role Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  name="role"
                  value={newUser.role}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className={getFieldClassName("role", newUserTouched, newUserErrors)}
                >
                  <option value="">Select a role</option>
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
                {showFieldError("role", newUserTouched, newUserErrors) && (
                  <p className="mt-1 text-sm text-red-600">{newUserErrors.role}</p>
                )}
              </div>
              
              {/* Status Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={newUser.status}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className={getFieldClassName("status", newUserTouched, newUserErrors)}
                >
                  <option value="">Select a status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {showFieldError("status", newUserTouched, newUserErrors) && (
                  <p className="mt-1 text-sm text-red-600">{newUserErrors.status}</p>
                )}
              </div>
              
              {/* Form Validation Summary */}
              <div className="md:col-span-2 lg:col-span-3">
                {!isFormValid && Object.keys(newUserTouched).length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <p className="text-yellow-800 text-sm font-medium">
                      Please fix the validation errors above before submitting.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="md:col-span-2 lg:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className={`py-2 px-4 rounded-md transition duration-300 ${
                    isSubmitting || !isFormValid
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-green-600 hover:bg-green-700"
                  } text-white`}
                >
                  {isSubmitting ? "Creating..." : "Add User"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {loading ? "Loading users..." : "No users found"}
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user._id || user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-blue-700">{`#${(user._id || user.id).toString().slice(-4)}`}</td>
                    <td className="px-6 py-4">{user.name}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === "Admin" 
                          ? "bg-purple-100 text-purple-800" 
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleUserStatus(user._id || user.id)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === "Active" 
                            ? "bg-green-100 text-green-800 hover:bg-green-200" 
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        {user.status}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition mr-2"
                        onClick={() => handleEditUser(user._id || user.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        onClick={() => handleDeleteUser(user._id || user.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit User</h2>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editUser.name}
                    onChange={handleEditInputChange}
                    onBlur={handleEditInputBlur}
                    placeholder="Enter user name"
                    className={getFieldClassName("name", editUserTouched, editUserErrors)}
                    required
                  />
                  {showFieldError("name", editUserTouched, editUserErrors) && (
                    <p className="mt-1 text-sm text-red-600">{editUserErrors.name}</p>
                  )}
                </div>
                
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editUser.email}
                    onChange={handleEditInputChange}
                    onBlur={handleEditInputBlur}
                    placeholder="Enter user email"
                    className={getFieldClassName("email", editUserTouched, editUserErrors)}
                    required
                  />
                  {showFieldError("email", editUserTouched, editUserErrors) && (
                    <p className="mt-1 text-sm text-red-600">{editUserErrors.email}</p>
                  )}
                </div>
                
                {/* Role Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    name="role"
                    value={editUser.role}
                    onChange={handleEditInputChange}
                    onBlur={handleEditInputBlur}
                    className={getFieldClassName("role", editUserTouched, editUserErrors)}
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                  {showFieldError("role", editUserTouched, editUserErrors) && (
                    <p className="mt-1 text-sm text-red-600">{editUserErrors.role}</p>
                  )}
                </div>
                
                {/* Status Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={editUser.status}
                    onChange={handleEditInputChange}
                    onBlur={handleEditInputBlur}
                    className={getFieldClassName("status", editUserTouched, editUserErrors)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {showFieldError("status", editUserTouched, editUserErrors) && (
                    <p className="mt-1 text-sm text-red-600">{editUserErrors.status}</p>
                  )}
                </div>

                {/* Edit Form Validation Summary */}
                {!isEditFormValid && Object.keys(editUserTouched).length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-yellow-800 text-sm font-medium">
                      Please fix the validation errors above before updating.
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !isEditFormValid}
                    className={`px-4 py-2 rounded-md transition ${
                      isSubmitting || !isEditFormValid
                        ? "bg-gray-400 cursor-not-allowed" 
                        : "bg-blue-600 hover:bg-blue-700"
                    } text-white`}
                  >
                    {isSubmitting ? "Updating..." : "Update User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirm Delete</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete user <strong>{userToDelete?.name}</strong>? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}