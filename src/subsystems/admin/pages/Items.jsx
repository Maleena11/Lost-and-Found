import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import TopBar from "../components/TopBar";
import PDFGenerator from "../../lost-found-reporting/components/PDFGenerator";

export default function AllItems({ activeSection, setActiveSection, sidebarOpen, setSidebarOpen }) {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  
  
  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    itemType: "all", // "all", "lost", "found"
    status: "all",   // "all", "pending", "claimed", "returned", "expired"
    category: "all"  // "all" or any category value
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  useEffect(() => {
    fetchItems();
  }, []);
  
  useEffect(() => {
    // Apply filters whenever filters or items change
    applyFilters();
  }, [filters, items]);
  
  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/lost-found`);
      const fetchedItems = response.data.data;
      setItems(fetchedItems);
      setFilteredItems(fetchedItems);
      setError(null);
    } catch (err) {
      console.error("Error fetching items:", err);
      setError("Failed to load items. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate statistics for PDF report
  const calculateStats = () => {
    // Currently visible items (based on filters)
    const visibleItems = filteredItems;
    
    // Basic stats
    const lostItems = visibleItems.filter(item => item.itemType === "lost");
    const foundItems = visibleItems.filter(item => item.itemType === "found");
    const claimedItems = visibleItems.filter(item => item.status === "claimed");
    const pendingItems = visibleItems.filter(item => item.status === "pending");
    const returnedItems = visibleItems.filter(item => item.status === "returned");
    const expiredItems = visibleItems.filter(item => item.status === "expired");

    // Category breakdown
    const categoryBreakdown = {};
    visibleItems.forEach(item => {
      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = 0;
      }
      categoryBreakdown[item.category]++;
    });

    return {
      totalItems: visibleItems.length,
      lostItems: lostItems.length,
      foundItems: foundItems.length,
      claimedItems: claimedItems.length,
      pendingItems: pendingItems.length,
      returnedItems: returnedItems.length,
      expiredItems: expiredItems.length,
      categoryBreakdown,
      allItems: visibleItems
    };
  };
  
  // Prepare data for PDF export
  const getPDFData = () => {
    const stats = calculateStats();
    return {
      stats: stats,
      items: filteredItems,
      dateRange: "custom",
      title: `Lost and Found Items Report - ${new Date().toLocaleDateString()}`,
      filterSummary: `Filters: ${filters.itemType !== "all" ? `Type: ${filters.itemType}, ` : ""}${filters.status !== "all" ? `Status: ${filters.status}, ` : ""}${filters.category !== "all" ? `Category: ${filters.category}` : ""}`.replace(/, $/g, "")
    };
  };
  
  const applyFilters = () => {
    let result = [...items];
    
    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(item => 
        item.itemName.toLowerCase().includes(searchTerm) || 
        item.description.toLowerCase().includes(searchTerm) ||
        item.location.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by item type
    if (filters.itemType !== "all") {
      result = result.filter(item => item.itemType === filters.itemType);
    }
    
    // Filter by status
    if (filters.status !== "all") {
      result = result.filter(item => item.status === filters.status);
    }
    
    // Filter by category
    if (filters.category !== "all") {
      result = result.filter(item => item.category === filters.category);
    }
    
    setFilteredItems(result);
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      search: "",
      itemType: "all",
      status: "all",
      category: "all"
    });
  };
  
  const confirmDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };
  
  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleteLoading(true);
    try {
      await axios.delete(`http://localhost:3001/api/lost-found/${itemToDelete._id}`, {
        data: { userId: itemToDelete.userId } // Admin should be able to delete any item
      });
      
      // Remove item from state
      setItems(items.filter(item => item._id !== itemToDelete._id));
      setFilteredItems(filteredItems.filter(item => item._id !== itemToDelete._id));
      setShowDeleteModal(false);
      setItemToDelete(null);
      
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item. " + (error.response?.data?.error || ""));
    } finally {
      setDeleteLoading(false);
    }
  };
  
  const handleStatusUpdate = async (itemId, newStatus) => {
    setStatusUpdateLoading(true);
    try {
      const response = await axios.patch(`http://localhost:3001/api/lost-found/${itemId}/status`, {
        status: newStatus
      });
      
      // Update item in state
      const updatedItem = response.data.data;
      setItems(items.map(item => item._id === itemId ? updatedItem : item));
      setFilteredItems(filteredItems.map(item => item._id === itemId ? updatedItem : item));
      
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. " + (error.response?.data?.error || ""));
    } finally {
      setStatusUpdateLoading(false);
    }
  };
  
  // Get current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (isNaN(d)) return "—";
    const day        = String(d.getDate()).padStart(2, "0");
    const month      = String(d.getMonth() + 1).padStart(2, "0");
    const year       = d.getFullYear();
    const monthShort = d.toLocaleDateString("en-US", { month: "short" });
    try {
      const fmt = (JSON.parse(localStorage.getItem("adminSettings") || "{}")).dateFormat || "MMM DD, YYYY";
      if (fmt === "DD/MM/YYYY") return `${day}/${month}/${year}`;
      if (fmt === "MM/DD/YYYY") return `${month}/${day}/${year}`;
      if (fmt === "YYYY-MM-DD") return `${year}-${month}-${day}`;
      return `${monthShort} ${day}, ${year}`;
    } catch {
      return `${monthShort} ${day}, ${year}`;
    }
  };
  
  // Get unique categories for filter dropdown
  const categories = ["all", ...new Set(items.map(item => item.category))];
  
  if (loading) {
    return (
      <div className="flex">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 min-h-screen lg:ml-64 flex flex-col bg-gray-50">
          <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="All Lost & Found Items" subtitle="Manage and track all reported items" />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 min-h-screen lg:ml-64 flex flex-col bg-gray-50">
          <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="All Lost & Found Items" subtitle="Manage and track all reported items" />
          <div className="p-6">
            <div className="bg-red-100 p-4 rounded-lg text-red-700 text-center">{error}</div>
          </div>
        </div>
      </div>
    );
  }

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
          title="All Lost & Found Items"
          subtitle="Manage and track all reported items"
        />
        <main className="flex-1 p-6">
        <div className="px-0 py-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">All Lost & Found Items</h1>
            <div className="flex items-center space-x-3">
              {/* PDF Export Button */}
              <PDFGenerator data={getPDFData()} />
              
              <button
                onClick={fetchItems}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          {(filters.search || filters.itemType !== "all" || filters.status !== "all" || filters.category !== "all") && (
            <div className="mb-4 bg-blue-50 p-3 rounded-md text-sm text-blue-800">
              <span className="font-medium">Active Filters:</span>
              {filters.search && <span className="ml-2">Search: "{filters.search}"</span>}
              {filters.itemType !== "all" && (
                <span className="ml-2">Type: {filters.itemType.charAt(0).toUpperCase() + filters.itemType.slice(1)}</span>
              )}
              {filters.status !== "all" && (
                <span className="ml-2">Status: {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}</span>
              )}
              {filters.category !== "all" && (
                <span className="ml-2">Category: {filters.category.charAt(0).toUpperCase() + filters.category.slice(1)}</span>
              )}
              <span className="ml-2 font-medium">({filteredItems.length} items)</span>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search items..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                <select
                  name="itemType"
                  value={filters.itemType}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="claimed">Claimed</option>
                  <option value="returned">Returned</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="text-gray-600 hover:text-gray-800 px-3 py-1 text-sm"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.length > 0 ? (
                    currentItems.map(item => (
                      <tr key={item._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                              item.itemType === "lost" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
                            }`}>
                              {item.images && item.images.length > 0 ? (
                                <img src={item.images[0]} alt={item.itemName} className="h-10 w-10 rounded-full object-cover" />
                              ) : (
                                <span className="text-lg font-semibold">{item.itemName.charAt(0)}</span>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                              <div className="text-sm text-gray-600">{item.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.itemType === "lost" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"
                          }`}>
                            {item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {item.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusUpdate(item._id, e.target.value)}
                            disabled={statusUpdateLoading}
                            className={`text-sm rounded-md border text-gray-800 ${
                              item.status === "pending" ? "border-yellow-400 bg-yellow-50" :
                              item.status === "claimed" ? "border-green-400 bg-green-50" :
                              item.status === "returned" ? "border-blue-400 bg-blue-50" :
                              "border-red-400 bg-red-50"
                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            <option value="pending">Pending</option>
                            <option value="claimed">Claimed</option>
                            <option value="returned">Returned</option>
                            <option value="expired">Expired</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => confirmDelete(item)}
                            className="text-red-600 hover:text-red-900 mr-3"
                          >
                            Delete
                          </button>
                          
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-700">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredItems.length > itemsPerPage && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                      <span className="font-medium">
                        {indexOfLastItem > filteredItems.length ? filteredItems.length : indexOfLastItem}
                      </span>{" "}
                      of <span className="font-medium">{filteredItems.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {Array.from({ length: Math.ceil(filteredItems.length / itemsPerPage) }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => paginate(index + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === index + 1
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredItems.length / itemsPerPage)))}
                        disabled={currentPage === Math.ceil(filteredItems.length / itemsPerPage)}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm mx-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to delete this item? This action cannot be undone.
                </p>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setItemToDelete(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
                  >
                    {deleteLoading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </main>
      </div>
    </div>
  );
}
