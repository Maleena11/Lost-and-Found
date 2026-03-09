import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import TopBar from '../components/TopBar';
import { CSVLink } from 'react-csv';

export default function VerificationRequests({ activeSection, setActiveSection, sidebarOpen, setSidebarOpen }) {
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(10);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchVerificationRequests();
  }, []);

  const fetchVerificationRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/verification');
      setVerificationRequests(response.data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching verification requests:', err);
      setError('Failed to load verification requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    setActionLoading(true);
    try {
      await axios.patch(`http://localhost:3001/api/verification/${requestId}/status`, {
        status,
        notes: adminNotes,
        processedBy: 'admin' // You might want to use actual admin ID
      });

      setSuccess(`Verification request ${status} successfully!`);
      setShowModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      fetchVerificationRequests(); // Refresh the list
    } catch (err) {
      console.error('Error updating verification request:', err);
      setError('Failed to update verification request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (request) => {
    setSelectedRequest(request);
    setAdminNotes(request.notes || '');
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setAdminNotes('');
  };

  // Filter requests based on status, search term, and date range
  const filteredRequests = verificationRequests.filter(request => {
    // Status filter
    if (statusFilter !== 'all' && request.status !== statusFilter) return false;
    
    // Search filter (search in multiple fields)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = request.claimantInfo.name.toLowerCase().includes(searchLower);
      const matchesEmail = request.claimantInfo.email.toLowerCase().includes(searchLower);
      const matchesPhone = request.claimantInfo.phone.toLowerCase().includes(searchLower);
      const matchesItem = request.itemId?.itemName?.toLowerCase().includes(searchLower);
      const matchesCategory = request.itemId?.category?.toLowerCase().includes(searchLower);
      const matchesLocation = request.itemId?.location?.toLowerCase().includes(searchLower);
      
      if (!matchesName && !matchesEmail && !matchesPhone && !matchesItem && !matchesCategory && !matchesLocation) {
        return false;
      }
    }
    
    // Date filter
    if (dateFilter.startDate || dateFilter.endDate) {
      const requestDate = new Date(request.submittedAt);
      if (dateFilter.startDate && requestDate < new Date(dateFilter.startDate)) return false;
      if (dateFilter.endDate && requestDate > new Date(dateFilter.endDate + 'T23:59:59')) return false;
    }
    
    return true;
  });

  // Pagination logic
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'fa-clock';
      case 'approved': return 'fa-check-circle';
      case 'rejected': return 'fa-times-circle';
      case 'processed': return 'fa-check-double';
      default: return 'fa-question-circle';
    }
  };

  // Prepare CSV data
  const csvData = filteredRequests.map(request => ({
    'Request ID': request._id,
    'Claimant Name': request.claimantInfo.name,
    'Email': request.claimantInfo.email,
    'Phone': request.claimantInfo.phone,
    'Address': request.claimantInfo.address,
    'Item Name': request.itemId?.itemName || 'N/A',
    'Item Category': request.itemId?.category || 'N/A',
    'Location Found': request.itemId?.location || 'N/A',
    'Date Found': request.itemId?.dateTime ? new Date(request.itemId.dateTime).toLocaleDateString() : 'N/A',
    'Status': request.status.charAt(0).toUpperCase() + request.status.slice(1),
    'Submitted Date': new Date(request.submittedAt).toLocaleDateString(),
    'Submitted Time': new Date(request.submittedAt).toLocaleTimeString(),
    'Processed Date': request.processedAt ? new Date(request.processedAt).toLocaleDateString() : 'N/A',
    'Processed By': request.processedBy || 'N/A',
    'Claimant Description': request.verificationDetails.description,
    'Ownership Proof': request.verificationDetails.ownershipProof,
    'Additional Info': request.verificationDetails.additionalInfo || 'N/A',
    'Admin Notes': request.notes || 'N/A'
  }));

  const csvHeaders = [
    { label: 'Request ID', key: 'Request ID' },
    { label: 'Claimant Name', key: 'Claimant Name' },
    { label: 'Email', key: 'Email' },
    { label: 'Phone', key: 'Phone' },
    { label: 'Address', key: 'Address' },
    { label: 'Item Name', key: 'Item Name' },
    { label: 'Item Category', key: 'Item Category' },
    { label: 'Location Found', key: 'Location Found' },
    { label: 'Date Found', key: 'Date Found' },
    { label: 'Status', key: 'Status' },
    { label: 'Submitted Date', key: 'Submitted Date' },
    { label: 'Submitted Time', key: 'Submitted Time' },
    { label: 'Processed Date', key: 'Processed Date' },
    { label: 'Processed By', key: 'Processed By' },
    { label: 'Claimant Description', key: 'Claimant Description' },
    { label: 'Ownership Proof', key: 'Ownership Proof' },
    { label: 'Additional Info', key: 'Additional Info' },
    { label: 'Admin Notes', key: 'Admin Notes' }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-full-width { width: 100% !important; margin: 0 !important; }
          .print-break { page-break-after: always; }
          body { print-color-adjust: exact; }
        }
      `}</style>

      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        className="no-print"
      />

      <div className="flex-1 lg:ml-64 flex flex-col">
        <div className="no-print">
          <TopBar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            title="Verification Requests"
            subtitle="Review and approve item ownership verification requests"
          />
        </div>

        <main className="flex-1 p-6 print-full-width">
        <div className="max-w-7xl mx-auto">
          {/* Alerts */}

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded no-print">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded no-print">
              {success}
            </div>
          )}

          {/* Filters and Stats */}
          <div className="bg-white rounded-lg shadow mb-6 p-6 no-print">
            {/* Search and Filters Row */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search:</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, email, phone, item, category, or location..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                  </div>
                </div>

                {/* Status Filter */}
                <div className="min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Requests</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="processed">Processed</option>
                  </select>
                </div>
              </div>

              {/* Export Button */}
              <div className="flex gap-2">
                <CSVLink
                  data={csvData}
                  headers={csvHeaders}
                  filename={`verification-requests-${new Date().toISOString().split('T')[0]}.csv`}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-download"></i>
                  Export CSV
                </CSVLink>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-print"></i>
                  Print
                </button>
              </div>
            </div>

            {/* Date Filter Row */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date:</label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date:</label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {(dateFilter.startDate || dateFilter.endDate || searchTerm) && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setDateFilter({ startDate: '', endDate: '' });
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-times"></i>
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-yellow-50 p-3 rounded">
                <div className="text-2xl font-bold text-yellow-600">
                  {verificationRequests.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-sm text-yellow-700">Pending</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {verificationRequests.filter(r => r.status === 'approved').length}
                </div>
                <div className="text-sm text-green-700">Approved</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {verificationRequests.filter(r => r.status === 'rejected').length}
                </div>
                <div className="text-sm text-red-700">Rejected</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {verificationRequests.length}
                </div>
                <div className="text-sm text-blue-700">Total</div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredRequests.length} of {verificationRequests.length} verification requests
              {searchTerm && ` matching "${searchTerm}"`}
              {statusFilter !== 'all' && ` with status "${statusFilter}"`}
            </div>
          </div>

          {/* Verification Requests Table */}
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center no-print">
              <div className="flex flex-col items-center">
                <i className="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
                <p className="text-gray-600 text-lg">Loading verification requests...</p>
              </div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="flex flex-col items-center">
                <i className="fas fa-inbox text-5xl text-gray-400 mb-4"></i>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No verification requests found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || dateFilter.startDate || dateFilter.endDate
                    ? 'Try adjusting your search criteria or filters.'
                    : 'Verification requests will appear here when users submit claims.'}
                </p>
                {(searchTerm || statusFilter !== 'all' || dateFilter.startDate || dateFilter.endDate) && (
                  <button
                    onClick={() => {
                      setDateFilter({ startDate: '', endDate: '' });
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Request ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Claimant Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Processed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentRequests.map((request) => (
                        <tr key={request._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-900">
                              {request._id.slice(-6).toUpperCase()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.claimantInfo.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.claimantInfo.address}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.itemId?.itemName || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.itemId?.category || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                Found at: {request.itemId?.location || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-400">
                                {request.itemId?.dateTime ? new Date(request.itemId.dateTime).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-gray-900">
                                {request.claimantInfo.email}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.claimantInfo.phone}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                              <i className={`fas ${getStatusIcon(request.status)} mr-1`}></i>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(request.submittedAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(request.submittedAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {request.processedAt ? (
                              <div>
                                <div className="text-sm text-gray-900">
                                  {new Date(request.processedAt).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  By: {request.processedBy || 'N/A'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Pending</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => openModal(request)}
                              className="text-blue-600 hover:text-blue-900 mr-3 flex items-center gap-1"
                            >
                              <i className="fas fa-eye"></i>
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200 mt-6 rounded-lg shadow">
                  <div className="text-sm text-gray-700">
                    Showing {indexOfFirstRequest + 1} to {Math.min(indexOfLastRequest, filteredRequests.length)} of {filteredRequests.length} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 ${
                          currentPage === page ? 'bg-blue-500 text-white border-blue-500' : ''
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Enhanced Review Modal */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Verification Request Review</h2>
                    <p className="text-blue-100 text-sm">
                      Request ID: <span className="font-mono bg-blue-800 px-2 py-1 rounded">
                        {selectedRequest._id.slice(-8).toUpperCase()}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-white hover:text-gray-300 transition-colors p-2 hover:bg-blue-800 rounded-lg"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
                <div className="p-6 space-y-6">
                  
                  {/* Status Banner */}
                  <div className={`p-4 rounded-lg border-l-4 ${
                    selectedRequest.status === 'pending' ? 'bg-yellow-50 border-yellow-400' :
                    selectedRequest.status === 'approved' ? 'bg-green-50 border-green-400' :
                    selectedRequest.status === 'rejected' ? 'bg-red-50 border-red-400' :
                    'bg-blue-50 border-blue-400'
                  }`}>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                        <i className={`fas ${getStatusIcon(selectedRequest.status)} mr-2`}></i>
                        {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                      </span>
                      <div className="ml-4 text-sm text-gray-600">
                        Submitted on {new Date(selectedRequest.submittedAt).toLocaleDateString()} at{' '}
                        {new Date(selectedRequest.submittedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Left Column */}
                    <div className="space-y-6">
                      
                      {/* Claimant Information Card */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                        <div className="flex items-center mb-4">
                          <div className="bg-blue-500 text-white p-2 rounded-lg mr-3">
                            <i className="fas fa-user text-lg"></i>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800">Claimant Information</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <i className="fas fa-user w-5 text-gray-500 mr-3"></i>
                            <span className="font-medium text-gray-700 w-20">Name:</span>
                            <span className="text-gray-900">{selectedRequest.claimantInfo.name}</span>
                          </div>
                          <div className="flex items-center">
                            <i className="fas fa-envelope w-5 text-gray-500 mr-3"></i>
                            <span className="font-medium text-gray-700 w-20">Email:</span>
                            <span className="text-gray-900">{selectedRequest.claimantInfo.email}</span>
                          </div>
                          <div className="flex items-center">
                            <i className="fas fa-phone w-5 text-gray-500 mr-3"></i>
                            <span className="font-medium text-gray-700 w-20">Phone:</span>
                            <span className="text-gray-900">{selectedRequest.claimantInfo.phone}</span>
                          </div>
                          <div className="flex items-start">
                            <i className="fas fa-map-marker-alt w-5 text-gray-500 mr-3 mt-1"></i>
                            <span className="font-medium text-gray-700 w-20">Address:</span>
                            <span className="text-gray-900">{selectedRequest.claimantInfo.address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Verification Details Card */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
                        <div className="flex items-center mb-4">
                          <div className="bg-yellow-500 text-white p-2 rounded-lg mr-3">
                            <i className="fas fa-shield-alt text-lg"></i>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800">Ownership Verification</h3>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <i className="fas fa-info-circle mr-2"></i>Item Description by Claimant:
                            </label>
                            <div className="bg-white p-3 rounded border text-gray-800 text-sm leading-relaxed">
                              {selectedRequest.verificationDetails.description}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <i className="fas fa-certificate mr-2"></i>Proof of Ownership:
                            </label>
                            <div className="bg-white p-3 rounded border text-gray-800 text-sm leading-relaxed">
                              {selectedRequest.verificationDetails.ownershipProof}
                            </div>
                          </div>
                          {selectedRequest.verificationDetails.additionalInfo && (
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <i className="fas fa-plus-circle mr-2"></i>Additional Information:
                              </label>
                              <div className="bg-white p-3 rounded border text-gray-800 text-sm leading-relaxed">
                                {selectedRequest.verificationDetails.additionalInfo}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      
                      {/* Item Information Card */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                        <div className="flex items-center mb-4">
                          <div className="bg-green-500 text-white p-2 rounded-lg mr-3">
                            <i className="fas fa-box text-lg"></i>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800">Found Item Details</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <i className="fas fa-tag w-5 text-gray-500 mr-3"></i>
                            <span className="font-medium text-gray-700 w-24">Item:</span>
                            <span className="text-gray-900 font-semibold">{selectedRequest.itemId?.itemName || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <i className="fas fa-list w-5 text-gray-500 mr-3"></i>
                            <span className="font-medium text-gray-700 w-24">Category:</span>
                            <span className="text-gray-900">{selectedRequest.itemId?.category || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <i className="fas fa-map-marker-alt w-5 text-gray-500 mr-3"></i>
                            <span className="font-medium text-gray-700 w-24">Location:</span>
                            <span className="text-gray-900">{selectedRequest.itemId?.location || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <i className="fas fa-calendar w-5 text-gray-500 mr-3"></i>
                            <span className="font-medium text-gray-700 w-24">Date Found:</span>
                            <span className="text-gray-900">
                              {selectedRequest.itemId?.dateTime ? 
                                new Date(selectedRequest.itemId.dateTime).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Item Description */}
                        {selectedRequest.itemId?.description && (
                          <div className="mt-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Original Description:
                            </label>
                            <div className="bg-white p-3 rounded border text-gray-800 text-sm leading-relaxed">
                              {selectedRequest.itemId.description}
                            </div>
                          </div>
                        )}
                        
                        {/* Item Images */}
                        {selectedRequest.itemId?.images && selectedRequest.itemId.images.length > 0 && (
                          <div className="mt-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              <i className="fas fa-images mr-2"></i>Item Photos:
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              {selectedRequest.itemId.images.map((image, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={image}
                                    alt={`Found item ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 hover:border-green-400 transition-colors cursor-pointer"
                                    onClick={() => window.open(image, '_blank')}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                    <i className="fas fa-expand text-white opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Click images to view full size</p>
                          </div>
                        )}
                      </div>

                      {/* Processing Information Card */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                        <div className="flex items-center mb-4">
                          <div className="bg-gray-500 text-white p-2 rounded-lg mr-3">
                            <i className="fas fa-cogs text-lg"></i>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800">Processing Information</h3>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Request ID:</span>
                            <span className="font-mono text-gray-900">{selectedRequest._id.slice(-8).toUpperCase()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Current Status:</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                              {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Submitted:</span>
                            <span className="text-gray-900">{new Date(selectedRequest.submittedAt).toLocaleString()}</span>
                          </div>
                          {selectedRequest.processedAt && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Processed:</span>
                                <span className="text-gray-900">{new Date(selectedRequest.processedAt).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Processed By:</span>
                                <span className="text-gray-900">{selectedRequest.processedBy || 'N/A'}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Notes Section */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
                    <div className="flex items-center mb-4">
                      <div className="bg-purple-500 text-white p-2 rounded-lg mr-3">
                        <i className="fas fa-sticky-note text-lg"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Admin Notes</h3>
                    </div>
                    
                    {selectedRequest.notes && selectedRequest.status !== 'pending' && (
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Previous Notes:</label>
                        <div className="bg-white p-3 rounded border text-gray-800 text-sm leading-relaxed">
                          {selectedRequest.notes}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {selectedRequest.status === 'pending' ? 'Add Processing Notes:' : 'Update Notes:'}
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows="4"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        placeholder="Add notes about your decision, any additional verification required, or other relevant information..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <i className="fas fa-info-circle mr-2"></i>
                  Review all information carefully before making a decision
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                    disabled={actionLoading}
                  >
                    <i className="fas fa-times mr-2"></i>Cancel
                  </button>
                  
                  {selectedRequest.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(selectedRequest._id, 'rejected')}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>Processing...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-times-circle mr-2"></i>Reject Request
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedRequest._id, 'approved')}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>Processing...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check-circle mr-2"></i>Approve Request
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}