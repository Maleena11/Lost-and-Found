import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import TopBar from '../components/TopBar';
import { CSVLink } from 'react-csv';

const EMPTY_STAGES = {
  stage1: { status: 'pending', notes: '' },
  stage2: { status: 'pending', notes: '' },
  stage3: { status: 'pending', notes: '' }
};

// ── In-modal photo gallery panel ───────────────────────────────────────────
function PhotoGalleryPanel({ images, activeIdx, setActiveIdx, accentColor, label, onLightboxOpen }) {
  const ring   = accentColor === 'teal' ? 'ring-teal-400 border-teal-400'   : 'ring-amber-400 border-amber-400';
  const empty  = accentColor === 'teal' ? 'bg-teal-50/60 border-teal-100'   : 'bg-amber-50/60 border-amber-100';

  if (!images || images.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-44 gap-2.5 rounded-xl border ${empty}`}>
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
          <i className="fas fa-image text-slate-300 text-lg"></i>
        </div>
        <p className="text-xs text-slate-400 font-medium">No photos submitted</p>
      </div>
    );
  }

  return (
    <div>
      {/* Main photo */}
      <div
        className="relative rounded-xl overflow-hidden cursor-zoom-in bg-slate-900 border border-slate-200 mb-2.5 group"
        style={{ aspectRatio: '4/3' }}
        onClick={() => onLightboxOpen(images, activeIdx, label)}
      >
        <img
          src={images[activeIdx]}
          alt={`${label} ${activeIdx + 1}`}
          className="w-full h-full object-contain select-none"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
          <div className="w-9 h-9 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <i className="fas fa-expand text-white text-xs"></i>
          </div>
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/55 text-white text-[10px] font-mono px-2 py-0.5 rounded-full pointer-events-none">
            {activeIdx + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`shrink-0 w-11 h-11 rounded-lg overflow-hidden border-2 transition-all ring-offset-1 ${
                i === activeIdx
                  ? `${ring} ring-1 opacity-100`
                  : 'border-transparent opacity-45 hover:opacity-75'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VerificationRequests({ activeSection, setActiveSection, sidebarOpen, setSidebarOpen }) {
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const [approvalStages, setApprovalStages] = useState(EMPTY_STAGES);

  // Lightbox
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0, label: '' });
  const [foundPhotoIdx, setFoundPhotoIdx]       = useState(0);
  const [claimantPhotoIdx, setClaimantPhotoIdx] = useState(0);

  useEffect(() => {
    if (!lightbox.open) return;
    const onKey = (e) => {
      if (e.key === 'Escape')      setLightbox(p => ({ ...p, open: false }));
      if (e.key === 'ArrowRight')  setLightbox(p => ({ ...p, index: (p.index + 1) % p.images.length }));
      if (e.key === 'ArrowLeft')   setLightbox(p => ({ ...p, index: (p.index - 1 + p.images.length) % p.images.length }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox.open]);

  const STAGE_CONFIGS = [
    { key: 'stage1', label: 'Stage 1: Basic Matching', description: 'Verify the claimed item matches the found item description', icon: 'fa-search' },
    { key: 'stage2', label: 'Stage 2: Ownership Verification', description: 'Confirm the proof of ownership is valid', icon: 'fa-shield-alt' },
    { key: 'stage3', label: 'Stage 3: Final Decision', description: 'Make the final approval or rejection decision', icon: 'fa-gavel', isFinal: true }
  ];

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
    // Merge with EMPTY_STAGES so missing fields from older documents are filled safely
    const saved = request.approvalStages || {};
    setApprovalStages({
      stage1: { ...EMPTY_STAGES.stage1, ...(saved.stage1 || {}) },
      stage2: { ...EMPTY_STAGES.stage2, ...(saved.stage2 || {}) },
      stage3: { ...EMPTY_STAGES.stage3, ...(saved.stage3 || {}) },
    });
    setFoundPhotoIdx(0);
    setClaimantPhotoIdx(0);
    setLightbox({ open: false, images: [], index: 0, label: '' });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setAdminNotes('');
    setApprovalStages(EMPTY_STAGES);
  };

  const handleSaveStages = async () => {
    setSaveLoading(true);
    try {
      await axios.patch(`http://localhost:3001/api/verification/${selectedRequest._id}/stages`, {
        approvalStages,
        notes: adminNotes
      });
      setSuccess('Progress saved successfully!');
      fetchVerificationRequests();
    } catch (err) {
      console.error('Error saving stage progress:', err);
      setError('Failed to save progress. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleStageDecision = async (stageKey, decision) => {
    const stageNum = parseInt(stageKey.replace('stage', ''));
    const updated = { ...approvalStages };
    updated[stageKey] = { ...updated[stageKey], status: decision };

    // Reset downstream stages when a stage is failed
    if (decision === 'failed') {
      for (let i = stageNum + 1; i <= 3; i++) {
        updated[`stage${i}`] = { ...updated[`stage${i}`], status: 'pending' };
      }
    }

    setApprovalStages(updated);

    // Stage 3 decision finalizes the request
    if (stageKey === 'stage3') {
      setSaveLoading(true);
      try {
        await axios.patch(`http://localhost:3001/api/verification/${selectedRequest._id}/stages`, {
          approvalStages: updated,
          notes: adminNotes
        });
      } catch {
        // Continue to status update even if stages patch fails
      } finally {
        setSaveLoading(false);
      }
      await handleStatusUpdate(selectedRequest._id, decision === 'passed' ? 'approved' : 'rejected');
    }
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

  // Returns { badge, subtitle } for the Status & Stage column
  const getStatusDisplay = (request) => {
    const { status } = request;
    const s = request.approvalStages;
    const s1 = s?.stage1?.status || 'pending';
    const s2 = s?.stage2?.status || 'pending';
    const s3 = s?.stage3?.status || 'pending';

    if (status === 'approved') {
      return { badge: 'Approved', subtitle: 'Verification Complete' };
    }
    if (status === 'rejected') {
      const failedAt = s3 === 'failed' ? 'Stage 3' : s2 === 'failed' ? 'Stage 2' : 'Stage 1';
      return { badge: 'Rejected', subtitle: `Failed at ${failedAt}` };
    }
    if (status === 'processed') {
      return { badge: 'Processed', subtitle: 'Case closed' };
    }

    // pending — work out which stage is active
    if (s1 === 'failed') return { badge: 'In Review', subtitle: 'Stage 1 – Basic Matching',        subtitleColor: 'text-red-500'  };
    if (s1 !== 'passed') return { badge: 'In Review', subtitle: 'Stage 1 – Basic Matching',        subtitleColor: 'text-gray-500' };
    if (s2 === 'failed') return { badge: 'In Review', subtitle: 'Stage 2 – Ownership Check',       subtitleColor: 'text-red-500'  };
    if (s2 !== 'passed') return { badge: 'In Review', subtitle: 'Stage 2 – Ownership Check',       subtitleColor: 'text-gray-500' };
    if (s3 === 'failed') return { badge: 'In Review', subtitle: 'Stage 3 – Final Decision',        subtitleColor: 'text-red-500'  };
    return                       { badge: 'In Review', subtitle: 'Stage 3 – Final Decision',        subtitleColor: 'text-gray-500' };
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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-indigo-50/30">
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
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-sm no-print shadow-sm">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <i className="fas fa-exclamation-circle text-red-500 text-sm"></i>
              </div>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-3 text-sm no-print shadow-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <i className="fas fa-check-circle text-emerald-500 text-sm"></i>
              </div>
              {success}
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 no-print">
            {/* Pending */}
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-amber-100/80 p-5 group hover:shadow-md transition-shadow">
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-amber-400/10 group-hover:bg-amber-400/15 transition-colors"></div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-600/70 uppercase tracking-widest mb-1">Pending</p>
                  <p className="text-4xl font-extrabold text-amber-500 leading-none">
                    {verificationRequests.filter(r => r.status === 'pending').length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-md shadow-amber-200">
                  <i className="fas fa-hourglass-half text-white text-sm"></i>
                </div>
              </div>
              <div className="mt-3 h-1 w-full bg-amber-50 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" style={{ width: `${verificationRequests.length ? (verificationRequests.filter(r=>r.status==='pending').length/verificationRequests.length)*100 : 0}%` }}></div>
              </div>
            </div>
            {/* Approved */}
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-emerald-100/80 p-5 group hover:shadow-md transition-shadow">
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-emerald-400/10 group-hover:bg-emerald-400/15 transition-colors"></div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-600/70 uppercase tracking-widest mb-1">Approved</p>
                  <p className="text-4xl font-extrabold text-emerald-500 leading-none">
                    {verificationRequests.filter(r => r.status === 'approved').length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md shadow-emerald-200">
                  <i className="fas fa-check text-white text-sm"></i>
                </div>
              </div>
              <div className="mt-3 h-1 w-full bg-emerald-50 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full" style={{ width: `${verificationRequests.length ? (verificationRequests.filter(r=>r.status==='approved').length/verificationRequests.length)*100 : 0}%` }}></div>
              </div>
            </div>
            {/* Rejected */}
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-rose-100/80 p-5 group hover:shadow-md transition-shadow">
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-rose-400/10 group-hover:bg-rose-400/15 transition-colors"></div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-rose-600/70 uppercase tracking-widest mb-1">Rejected</p>
                  <p className="text-4xl font-extrabold text-rose-500 leading-none">
                    {verificationRequests.filter(r => r.status === 'rejected').length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center shadow-md shadow-rose-200">
                  <i className="fas fa-times text-white text-sm"></i>
                </div>
              </div>
              <div className="mt-3 h-1 w-full bg-rose-50 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-rose-400 to-red-500 rounded-full" style={{ width: `${verificationRequests.length ? (verificationRequests.filter(r=>r.status==='rejected').length/verificationRequests.length)*100 : 0}%` }}></div>
              </div>
            </div>
            {/* Total */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-sm border border-blue-500/30 p-5 group hover:shadow-md transition-shadow">
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 group-hover:bg-white/15 transition-colors"></div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-200 uppercase tracking-widest mb-1">Total</p>
                  <p className="text-4xl font-extrabold text-white leading-none">
                    {verificationRequests.length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                  <i className="fas fa-layer-group text-white text-sm"></i>
                </div>
              </div>
              <p className="mt-3 text-sm text-blue-200/80">All verification requests</p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 mb-6 p-5 no-print">
            {/* Panel header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                <i className="fas fa-filter text-blue-500 text-[10px]"></i>
              </div>
              <span className="text-sm font-semibold text-gray-700">Filter & Search</span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end gap-3">
              {/* Search */}
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Name, email, item, location…"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-slate-50/80 placeholder-gray-300 transition-all"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
                </div>
              </div>

              {/* Status Filter */}
              <div className="min-w-[150px]">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50/80 text-gray-700 transition-all"
                >
                  <option value="all">All Requests</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="processed">Processed</option>
                </select>
              </div>

              {/* From Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">From</label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50/80 text-gray-700 transition-all"
                />
              </div>

              {/* To Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">To</label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50/80 text-gray-700 transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 shrink-0">
                {(dateFilter.startDate || dateFilter.endDate || searchTerm || statusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setDateFilter({ startDate: '', endDate: '' });
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="px-3 py-2.5 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-sm font-medium"
                  >
                    <i className="fas fa-times"></i>
                    Clear
                  </button>
                )}
                <CSVLink
                  data={csvData}
                  headers={csvHeaders}
                  filename={`verification-requests-${new Date().toISOString().split('T')[0]}.csv`}
                  className="px-3 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center gap-1.5 text-sm font-semibold shadow-sm shadow-emerald-200"
                >
                  <i className="fas fa-download"></i>
                  Export
                </CSVLink>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all flex items-center gap-1.5 text-sm font-semibold shadow-sm"
                >
                  <i className="fas fa-print"></i>
                  Print
                </button>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mt-4 pt-3.5 border-t border-gray-100/80 text-sm text-gray-400 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded-full text-xs">
                <i className="fas fa-list-ul text-[11px]"></i>
                {filteredRequests.length} result{filteredRequests.length !== 1 ? 's' : ''}
              </span>
              {searchTerm && (
                <span className="text-gray-400">matching <span className="text-blue-500 font-medium">"{searchTerm}"</span></span>
              )}
              {statusFilter !== 'all' && (
                <span className="text-gray-400">· status: <span className="font-medium text-gray-600 capitalize">{statusFilter}</span></span>
              )}
            </div>
          </div>

          {/* Verification Requests Table */}
          {loading ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-inner">
                  <i className="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Loading verification requests</p>
                  <p className="text-xs text-gray-400 mt-0.5">Please wait a moment…</p>
                </div>
              </div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center shadow-inner">
                  <i className="fas fa-inbox text-2xl text-gray-300"></i>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-700">No verification requests found</h3>
                  <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
                    {searchTerm || statusFilter !== 'all' || dateFilter.startDate || dateFilter.endDate
                      ? 'Try adjusting your filters or search term.'
                      : 'Requests will appear here once users submit claims.'}
                  </p>
                </div>
                {(searchTerm || statusFilter !== 'all' || dateFilter.startDate || dateFilter.endDate) && (
                  <button
                    onClick={() => {
                      setDateFilter({ startDate: '', endDate: '' });
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all text-sm font-semibold shadow-sm shadow-blue-200"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden">
                <div className="overflow-x-auto">
                  {/* table-fixed + colgroup locks every column to the same width on every page */}
                  <table className="w-full border-collapse table-fixed" style={{ minWidth: '980px' }}>
                    <colgroup>
                      <col style={{ width: '96px' }} />
                      <col style={{ width: '200px' }} />
                      <col style={{ width: '210px' }} />
                      <col style={{ width: '185px' }} />
                      <col style={{ width: '175px' }} />
                      <col style={{ width: '115px' }} />
                      <col style={{ width: '99px' }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                        <th className="px-5 py-4 text-left">
                          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">ID</span>
                        </th>
                        <th className="px-5 py-4 text-left">
                          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Claimant</span>
                        </th>
                        <th className="px-5 py-4 text-left">
                          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Item Details</span>
                        </th>
                        <th className="px-5 py-4 text-left">
                          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Contact</span>
                        </th>
                        <th className="px-5 py-4 text-left">
                          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Status</span>
                        </th>
                        <th className="px-5 py-4 text-left">
                          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Submitted</span>
                        </th>
                        <th className="py-4 text-left" style={{ paddingLeft: '12px', paddingRight: '4px' }}>
                          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Action</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRequests.map((request, idx) => {
                        const initials = request.claimantInfo.name
                          ? request.claimantInfo.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                          : '?';
                        // Hash based on the stable request ID — same request always gets the same colour across all pages
                        const avatarColors = [
                          'from-blue-400 to-indigo-500',
                          'from-violet-400 to-purple-500',
                          'from-rose-400 to-pink-500',
                          'from-amber-400 to-orange-500',
                          'from-teal-400 to-cyan-500',
                          'from-emerald-400 to-green-500',
                        ];
                        const idHash = request._id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                        const avatarGrad = avatarColors[idHash % avatarColors.length];

                        const statusStyles = {
                          pending:   'bg-amber-50 text-amber-600 border border-amber-200',
                          approved:  'bg-emerald-50 text-emerald-600 border border-emerald-200',
                          rejected:  'bg-rose-50 text-rose-600 border border-rose-200',
                          processed: 'bg-sky-50 text-sky-600 border border-sky-200',
                        };
                        const dotStyles = {
                          pending:   'bg-amber-400',
                          approved:  'bg-emerald-400',
                          rejected:  'bg-rose-400',
                          processed: 'bg-sky-400',
                        };
                        const { badge, subtitle, subtitleColor } = getStatusDisplay(request);

                        return (
                          <tr
                            key={request._id}
                            className={`group border-b border-gray-200/70 last:border-0 transition-colors hover:bg-blue-50/40 ${idx % 2 === 0 ? 'bg-white/60' : 'bg-slate-50/50'}`}
                          >
                            {/* ID */}
                            <td className="px-5 py-[18px] align-middle">
                              <span className="font-mono text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg tracking-wider whitespace-nowrap">
                                #{request._id.slice(-6).toUpperCase()}
                              </span>
                            </td>

                            {/* Claimant */}
                            <td className="px-5 py-[18px] align-middle">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${avatarGrad} flex items-center justify-center shrink-0 shadow-sm text-white text-sm font-bold`}>
                                  {initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-semibold text-gray-800 leading-5 truncate">
                                    {request.claimantInfo.name}
                                  </div>
                                  <div className="text-xs text-gray-400 leading-4 truncate mt-0.5">
                                    {request.claimantInfo.address || <span className="text-gray-200">—</span>}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Item Details */}
                            <td className="px-5 py-[18px] align-middle">
                              <div className="text-sm font-semibold text-gray-800 leading-5 truncate">
                                {request.itemId?.itemName || 'N/A'}
                              </div>
                              <div className="mt-1 h-[22px] flex items-center">
                                {request.itemId?.category ? (
                                  <span className="inline-block text-xs bg-indigo-50 text-indigo-500 font-semibold px-2 py-0.5 rounded-full border border-indigo-100 truncate max-w-full">
                                    {request.itemId.category}
                                  </span>
                                ) : <span className="text-xs text-gray-200">—</span>}
                              </div>
                              <div className="mt-1 flex items-center gap-1 h-[18px]">
                                <i className="fas fa-location-dot text-gray-300 text-[11px] shrink-0"></i>
                                <span className="text-xs text-gray-400 leading-none truncate">
                                  {request.itemId?.location || <span className="text-gray-200">—</span>}
                                </span>
                              </div>
                            </td>

                            {/* Contact */}
                            <td className="px-5 py-[18px] align-middle">
                              <div className="flex items-center gap-1.5 h-5">
                                <i className="fas fa-envelope text-gray-300 text-[11px] shrink-0"></i>
                                <span className="text-xs text-gray-600 leading-none truncate">
                                  {request.claimantInfo.email}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 h-5 mt-1.5">
                                <i className="fas fa-phone text-gray-300 text-[11px] shrink-0"></i>
                                <span className="text-xs text-gray-500 leading-none">
                                  {request.claimantInfo.phone}
                                </span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-5 py-[18px] align-middle">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusStyles[request.status] || statusStyles.processed}`}>
                                <span className={`w-2 h-2 rounded-full shrink-0 ${dotStyles[request.status] || dotStyles.processed}`}></span>
                                {badge}
                              </span>
                              <div className={`mt-1.5 text-xs font-medium leading-4 truncate ${subtitleColor || 'text-gray-400'}`}>
                                {subtitle}
                              </div>
                              <div className="mt-1 text-xs text-gray-400 leading-4 h-4">
                                {request.processedAt ? new Date(request.processedAt).toLocaleDateString() : ''}
                              </div>
                            </td>

                            {/* Submitted */}
                            <td className="px-5 py-[18px] align-middle whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-700 leading-5">
                                {new Date(request.submittedAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-400 leading-4 mt-0.5">
                                {new Date(request.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>

                            {/* Action */}
                            <td className="py-0 align-middle" style={{ paddingLeft: '12px', paddingRight: '4px' }}>
                              <button
                                onClick={() => openModal(request)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-semibold rounded-lg transition-all shadow-sm shadow-blue-200 group-hover:shadow-md group-hover:shadow-blue-200 whitespace-nowrap"
                              >
                                <i className="fas fa-eye text-[10px]"></i>
                                Review
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="bg-white/70 backdrop-blur-sm px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 mt-3 rounded-2xl border border-white/60 shadow-sm">
                <div className="text-sm text-gray-400 flex items-center gap-1.5">
                  <i className="fas fa-table-list text-gray-300 text-xs"></i>
                  Showing{' '}
                  <span className="font-semibold text-gray-600">{indexOfFirstRequest + 1}–{Math.min(indexOfLastRequest, filteredRequests.length)}</span>
                  {' '}of{' '}
                  <span className="font-semibold text-gray-600">{filteredRequests.length}</span> results
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-gray-300 transition-all"
                    >
                      <i className="fas fa-chevron-left text-[9px]"></i>
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all ${
                          currentPage === page
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm shadow-blue-200'
                            : 'border border-gray-200 text-gray-500 hover:bg-slate-50 hover:border-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-gray-300 transition-all"
                    >
                      Next
                      <i className="fas fa-chevron-right text-[9px]"></i>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Review Modal */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-[860px] w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">

              {/* ── Sticky Header ── */}
              <div className="relative bg-gradient-to-r from-[#0f1f3d] via-[#1a3560] to-[#1e4d8c] px-7 py-6 shrink-0 overflow-hidden">
                {/* Subtle radial glow top-right */}
                <div className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 rounded-full bg-blue-400/10 blur-2xl"></div>
                {/* Fine dot-grid texture overlay */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.04]"
                  style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '18px 18px' }}
                ></div>

                <div className="relative flex items-center justify-between gap-6">
                  {/* Left – label + title + ID */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300/70 mb-2 select-none">
                      Verification Request
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-[22px] font-bold text-white tracking-tight leading-none">
                        Review Claim
                      </h2>
                      {/* Claim ID badge */}
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-blue-200 bg-white/8 border border-white/15 px-2.5 py-1 rounded-md tracking-widest backdrop-blur-sm select-all">
                        <span className="text-blue-400/70 font-normal">#</span>
                        {selectedRequest._id.slice(-8).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Right – status pill + date + close */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      {/* Status pill */}
                      {(() => {
                        const pills = {
                          pending:   { bg: 'bg-amber-400/15',   border: 'border-amber-400/30',   text: 'text-amber-300',   dot: 'bg-amber-400'   },
                          approved:  { bg: 'bg-emerald-400/15', border: 'border-emerald-400/30', text: 'text-emerald-300', dot: 'bg-emerald-400' },
                          rejected:  { bg: 'bg-red-400/15',     border: 'border-red-400/30',     text: 'text-red-300',     dot: 'bg-red-400'     },
                          processed: { bg: 'bg-sky-400/15',     border: 'border-sky-400/30',     text: 'text-sky-300',     dot: 'bg-sky-400'     },
                        };
                        const p = pills[selectedRequest.status] || pills.processed;
                        const label = selectedRequest.status === 'pending' ? 'In Review'
                          : selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1);
                        return (
                          <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${p.bg} ${p.border} ${p.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.dot} shadow-sm`}></span>
                            {label}
                          </span>
                        );
                      })()}
                      <p className="text-[11px] text-blue-300/60 mt-1.5 font-medium">
                        Submitted&nbsp;
                        {new Date(selectedRequest.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Close button */}
                    <button
                      onClick={closeModal}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/15 transition-all"
                    >
                      <i className="fas fa-times text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Scrollable Body ── */}
              <div className="overflow-y-auto flex-1 bg-[#eef0f6]">
                <div className="p-6 space-y-4">

                  {/* Section 1 – Claimant + Found Item */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Claimant Information */}
                    <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-[3px] h-4 bg-blue-500 rounded-full"></div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Claimant Information</p>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: 'Full Name',      value: selectedRequest.claimantInfo.name,    icon: 'fa-user' },
                          { label: 'Email Address',  value: selectedRequest.claimantInfo.email,   icon: 'fa-envelope' },
                          { label: 'Phone',          value: selectedRequest.claimantInfo.phone,   icon: 'fa-phone' },
                          { label: 'Faculty / Year', value: selectedRequest.claimantInfo.address, icon: 'fa-building' },
                        ].map(({ label, value, icon }) => (
                          <div key={label} className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                              <i className={`fas ${icon} text-blue-500 text-xs`}></i>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                              <p className="text-sm text-slate-800 font-semibold break-words mt-0.5">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Found Item */}
                    <div className="bg-gradient-to-br from-teal-50/70 to-slate-50/40 border border-teal-100 rounded-xl p-5 shadow-md shadow-teal-100/40">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-[3px] h-4 bg-teal-500 rounded-full"></div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Found Item</p>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: 'Item Name',  value: selectedRequest.itemId?.itemName || 'N/A', icon: 'fa-tag' },
                          { label: 'Category',   value: selectedRequest.itemId?.category  || 'N/A', icon: 'fa-list' },
                          { label: 'Found At',   value: selectedRequest.itemId?.location  || 'N/A', icon: 'fa-map-marker-alt' },
                          { label: 'Date Found', value: selectedRequest.itemId?.dateTime
                              ? new Date(selectedRequest.itemId.dateTime).toLocaleDateString()
                              : 'N/A', icon: 'fa-calendar' },
                        ].map(({ label, value, icon }) => (
                          <div key={label} className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                              <i className={`fas ${icon} text-teal-600 text-xs`}></i>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                              <p className="text-sm text-slate-800 font-semibold break-words mt-0.5">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedRequest.itemId?.description && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Original Description</p>
                          <p className="text-sm text-slate-600 leading-relaxed">{selectedRequest.itemId.description}</p>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* ── Photo Comparison ── */}
                  {(() => {
                    const foundPhotos    = selectedRequest.itemId?.images     || [];
                    const claimantPhotos = selectedRequest.claimantImages     || [];
                    if (foundPhotos.length === 0 && claimantPhotos.length === 0) return null;
                    const openLb = (imgs, idx, lbl) => setLightbox({ open: true, images: imgs, index: idx, label: lbl });
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Header */}
                        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
                          <div className="w-[3px] h-4 bg-violet-500 rounded-full shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Photo Comparison</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Compare photos side-by-side to verify ownership</p>
                          </div>
                          <span className="text-[11px] text-slate-400 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shrink-0">
                            {foundPhotos.length + claimantPhotos.length} photo{(foundPhotos.length + claimantPhotos.length) !== 1 ? 's' : ''} total
                          </span>
                        </div>

                        {/* Two-column gallery */}
                        <div className="grid grid-cols-2 divide-x divide-slate-100">

                          {/* Left – Found Item */}
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-teal-400 shrink-0"></div>
                                <p className="text-xs font-bold text-teal-700 uppercase tracking-wide">Found Item</p>
                              </div>
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {foundPhotos.length} photo{foundPhotos.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <PhotoGalleryPanel
                              images={foundPhotos}
                              activeIdx={foundPhotoIdx}
                              setActiveIdx={setFoundPhotoIdx}
                              accentColor="teal"
                              label="Found Item"
                              onLightboxOpen={openLb}
                            />
                          </div>

                          {/* Right – Claimant */}
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></div>
                                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Claimant's Photos</p>
                              </div>
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {claimantPhotos.length} photo{claimantPhotos.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <PhotoGalleryPanel
                              images={claimantPhotos}
                              activeIdx={claimantPhotoIdx}
                              setActiveIdx={setClaimantPhotoIdx}
                              accentColor="amber"
                              label="Claimant's Photos"
                              onLightboxOpen={openLb}
                            />
                          </div>

                        </div>

                        {/* Footer hint */}
                        <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
                          <i className="fas fa-expand-alt text-slate-300 text-xs shrink-0"></i>
                          <p className="text-[11px] text-slate-400">
                            Click any photo to open full-screen · Use <kbd className="px-1 py-px bg-white border border-slate-200 rounded text-[10px] font-mono">←</kbd> <kbd className="px-1 py-px bg-white border border-slate-200 rounded text-[10px] font-mono">→</kbd> to navigate · <kbd className="px-1 py-px bg-white border border-slate-200 rounded text-[10px] font-mono">Esc</kbd> to close
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Section 2 – Ownership Verification */}
                  <div className="bg-gradient-to-br from-amber-50/70 to-white border border-amber-100 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-[3px] h-4 bg-amber-500 rounded-full"></div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Ownership Verification</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Item Description by Claimant</p>
                        <div className="bg-white rounded-lg p-3.5 text-sm text-slate-700 leading-relaxed border border-amber-100 min-h-[72px]">
                          {selectedRequest.verificationDetails.description}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Proof of Ownership</p>
                        <div className="bg-white rounded-lg p-3.5 text-sm text-slate-700 leading-relaxed border border-amber-100 min-h-[72px]">
                          {selectedRequest.verificationDetails.ownershipProof}
                        </div>
                      </div>
                      {selectedRequest.verificationDetails.additionalInfo && (
                        <div className="md:col-span-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Additional Information</p>
                          <div className="bg-white rounded-lg p-3.5 text-sm text-slate-700 leading-relaxed border border-amber-100">
                            {selectedRequest.verificationDetails.additionalInfo}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Processing record – only when processed */}
                  {selectedRequest.processedAt && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-[3px] h-4 bg-slate-400 rounded-full"></div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Processing Record</p>
                      </div>
                      <div className="flex flex-wrap gap-8">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Processed On</p>
                          <p className="text-sm text-slate-800 font-semibold mt-0.5">{new Date(selectedRequest.processedAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Processed By</p>
                          <p className="text-sm text-slate-800 font-semibold mt-0.5">{selectedRequest.processedBy || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 3 – Approval Stages */}
                  <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-indigo-100/60 rounded-xl overflow-hidden shadow-md shadow-indigo-100/30">

                    {/* Section heading */}
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-indigo-100/50 bg-white/60">
                      <div className="w-[3px] h-4 bg-indigo-500 rounded-full"></div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Approval Stages</p>
                        <p className="text-xs text-slate-400 mt-0.5">Complete each stage in order · Stage 3 finalizes the decision</p>
                      </div>
                    </div>

                    {/* Progress tracker */}
                    <div className="flex items-start px-10 pt-6 pb-4">
                      {STAGE_CONFIGS.map((s, idx) => {
                        const st = approvalStages[s.key];
                        const prevKey = idx > 0 ? `stage${idx}` : null;
                        const isCurrent = selectedRequest.status === 'pending' &&
                          st.status === 'pending' &&
                          (idx === 0 || (prevKey && approvalStages[prevKey].status === 'passed'));

                        return (
                          <div key={s.key} className="flex items-start flex-1 min-w-0">
                            {/* Node + label */}
                            <div className="flex flex-col items-center shrink-0">
                              {/* Outer ring only on current step */}
                              <div className={isCurrent ? 'p-1 rounded-full bg-blue-100/70' : 'p-1'}>
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                                  st.status === 'passed' ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-200' :
                                  st.status === 'failed'  ? 'bg-red-500 border-red-400 text-white shadow-sm shadow-red-200' :
                                  isCurrent              ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-200' :
                                                           'bg-white border-slate-200 text-slate-300'
                                }`}>
                                  {st.status === 'passed' ? <i className="fas fa-check text-[11px]"></i> :
                                   st.status === 'failed'  ? <i className="fas fa-times text-[11px]"></i> :
                                   isCurrent              ? <i className="fas fa-circle-notch text-[11px]"></i> :
                                                            <span>{idx + 1}</span>}
                                </div>
                              </div>
                              <p className={`text-[11px] mt-1.5 font-semibold text-center leading-tight max-w-[68px] ${
                                st.status === 'passed' ? 'text-emerald-600' :
                                st.status === 'failed'  ? 'text-red-500' :
                                isCurrent              ? 'text-blue-600' :
                                                         'text-slate-400'
                              }`}>
                                {['Basic\nMatching', 'Ownership\nCheck', 'Final\nDecision'][idx].split('\n').map((line, i) => (
                                  <span key={i} className="block">{line}</span>
                                ))}
                              </p>
                            </div>

                            {/* Connector */}
                            {idx < 2 && (
                              <div className={`flex-1 h-[2px] mt-[22px] mx-1 rounded-full transition-colors ${
                                st.status === 'passed' ? 'bg-emerald-400' : 'bg-slate-200'
                              }`}></div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Stage cards */}
                    <div className="px-5 pb-5 space-y-3">
                      {STAGE_CONFIGS.map((stageDef, idx) => {
                        const stage = approvalStages[stageDef.key];
                        const prevKey = idx > 0 ? `stage${idx}` : null;
                        const isEnabled = selectedRequest.status === 'pending' && (
                          idx === 0 || (prevKey && approvalStages[prevKey].status === 'passed')
                        );
                        const isCurrent = isEnabled && stage.status === 'pending';
                        const isLocked  = !isEnabled && selectedRequest.status === 'pending';

                        return (
                          <div
                            key={stageDef.key}
                            className={`rounded-xl overflow-hidden transition-all ${
                              isCurrent              ? 'border-2 border-blue-400 shadow-lg shadow-blue-100/50' :
                              stage.status === 'passed' ? 'border border-emerald-200' :
                              stage.status === 'failed'  ? 'border border-red-200' :
                                                           'border border-slate-200'
                            } ${isLocked ? 'opacity-40' : ''}`}
                          >
                            {/* Card header — colour changes per state */}
                            <div className={`flex items-center justify-between px-4 py-3 ${
                              isCurrent              ? 'bg-gradient-to-r from-blue-600 to-blue-500' :
                              stage.status === 'passed' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                              stage.status === 'failed'  ? 'bg-gradient-to-r from-red-500 to-red-400' :
                                                           'bg-slate-50 border-b border-slate-100'
                            }`}>
                              <div className="flex items-center gap-2.5">
                                {/* Step badge */}
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isCurrent || stage.status !== 'pending' ? 'bg-white/20 text-white' : 'bg-white text-slate-400'
                                }`}>
                                  {stage.status === 'passed' ? <i className="fas fa-check"></i> :
                                   stage.status === 'failed'  ? <i className="fas fa-times"></i> :
                                                                idx + 1}
                                </div>
                                <div>
                                  <p className={`text-sm font-semibold leading-tight ${
                                    isCurrent || stage.status !== 'pending' ? 'text-white' : 'text-slate-700'
                                  }`}>{stageDef.label}</p>
                                  <p className={`text-xs leading-tight mt-0.5 ${
                                    isCurrent              ? 'text-blue-100' :
                                    stage.status === 'passed' ? 'text-emerald-100' :
                                    stage.status === 'failed'  ? 'text-red-100' :
                                                               'text-slate-400'
                                  }`}>{stageDef.description}</p>
                                </div>
                              </div>

                              {/* State chip */}
                              {isCurrent && (
                                <span className="text-[11px] font-semibold text-white/90 bg-white/15 border border-white/20 px-2.5 py-1 rounded-full shrink-0">
                                  Active
                                </span>
                              )}
                              {stage.status === 'passed' && (
                                <span className="text-[11px] font-bold text-white bg-white/20 border border-white/25 px-2.5 py-1 rounded-full shrink-0">
                                  <i className="fas fa-check mr-1 text-[9px]"></i>Passed
                                </span>
                              )}
                              {stage.status === 'failed' && (
                                <span className="text-[11px] font-bold text-white bg-white/20 border border-white/25 px-2.5 py-1 rounded-full shrink-0">
                                  <i className="fas fa-times mr-1 text-[9px]"></i>Failed
                                </span>
                              )}
                              {isLocked && (
                                <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full shrink-0">
                                  <i className="fas fa-lock mr-1 text-[9px]"></i>Locked
                                </span>
                              )}
                            </div>

                            {/* Card body — actions + notes */}
                            {(isEnabled || stage.notes) && (
                              <div className="px-4 py-3 bg-white/90">
                                {/* Pass / Fail buttons */}
                                {isEnabled && (
                                  <div className="flex gap-2 mb-3">
                                    <button
                                      onClick={() => handleStageDecision(stageDef.key, 'passed')}
                                      disabled={actionLoading || saveLoading}
                                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${
                                        stage.status === 'passed'
                                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                          : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700'
                                      }`}
                                    >
                                      <i className="fas fa-check text-[10px]"></i>
                                      {stageDef.isFinal ? 'Approve Request' : 'Mark as Passed'}
                                    </button>
                                    <button
                                      onClick={() => handleStageDecision(stageDef.key, 'failed')}
                                      disabled={actionLoading || saveLoading}
                                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${
                                        stage.status === 'failed'
                                          ? 'bg-red-500 border-red-500 text-white shadow-sm'
                                          : 'bg-white border-slate-200 text-slate-600 hover:border-red-400 hover:bg-red-50 hover:text-red-600'
                                      }`}
                                    >
                                      <i className="fas fa-times text-[10px]"></i>
                                      {stageDef.isFinal ? 'Reject Request' : 'Mark as Failed'}
                                    </button>
                                  </div>
                                )}

                                {/* Notes textarea */}
                                <textarea
                                  value={stage.notes}
                                  onChange={(e) => setApprovalStages(prev => ({
                                    ...prev,
                                    [stageDef.key]: { ...prev[stageDef.key], notes: e.target.value }
                                  }))}
                                  disabled={!isEnabled}
                                  rows={2}
                                  placeholder="Stage notes…"
                                  className={`w-full text-xs rounded-lg px-3 py-2 resize-none transition-colors focus:outline-none ${
                                    isEnabled
                                      ? 'border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-300'
                                      : 'bg-slate-50 border border-slate-100 text-slate-500 cursor-default'
                                  }`}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 4 – Admin Notes */}
                  <div className="bg-gradient-to-br from-violet-50/40 to-slate-50 border border-violet-100/60 rounded-xl p-5 shadow-md shadow-violet-100/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-[3px] h-4 bg-violet-500 rounded-full"></div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Admin Notes</p>
                    </div>
                    {selectedRequest.notes && selectedRequest.status !== 'pending' && (
                      <div className="mb-3 bg-slate-50 rounded-lg p-3.5 text-sm text-slate-700 border border-slate-200 leading-relaxed">
                        {selectedRequest.notes}
                      </div>
                    )}
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows="3"
                      className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-sm text-slate-700 placeholder-slate-400 resize-none transition-colors"
                      placeholder="Add notes about your decision or any additional context…"
                    />
                  </div>

                </div>
              </div>

              {/* ── Sticky Footer ── */}
              <div className="bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between shrink-0 shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  {selectedRequest.status === 'pending'
                    ? 'Work through the approval stages to make a decision, then save your progress.'
                    : `This request was ${selectedRequest.status} on ${new Date(selectedRequest.processedAt || selectedRequest.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={closeModal}
                    disabled={actionLoading || saveLoading}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Close
                  </button>
                  {selectedRequest.status === 'pending' && (
                    <button
                      onClick={handleSaveStages}
                      disabled={saveLoading || actionLoading}
                      className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
                    >
                      {saveLoading ? (
                        <><i className="fas fa-spinner fa-spin text-xs"></i>Saving…</>
                      ) : (
                        <><i className="fas fa-save text-xs"></i>Save Progress</>
                      )}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── Lightbox ── */}
        {lightbox.open && (
          <div
            className="fixed inset-0 z-[60] bg-black/92 flex items-center justify-center p-4"
            onClick={() => setLightbox(p => ({ ...p, open: false }))}
          >
            <div
              className="relative flex flex-col items-center w-full max-w-4xl max-h-[92vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between w-full mb-3 px-1">
                <div>
                  <p className="text-white text-sm font-semibold leading-tight">{lightbox.label}</p>
                  {lightbox.images.length > 1 && (
                    <p className="text-slate-400 text-xs mt-0.5 font-mono">
                      {lightbox.index + 1} / {lightbox.images.length}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setLightbox(p => ({ ...p, open: false }))}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  aria-label="Close"
                >
                  <i className="fas fa-times text-sm"></i>
                </button>
              </div>

              {/* Image + nav arrows */}
              <div className="relative flex items-center justify-center w-full">
                {lightbox.images.length > 1 && (
                  <button
                    onClick={() => setLightbox(p => ({ ...p, index: (p.index - 1 + p.images.length) % p.images.length }))}
                    className="absolute left-0 -translate-x-5 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors shadow-lg"
                    aria-label="Previous"
                  >
                    <i className="fas fa-chevron-left text-sm"></i>
                  </button>
                )}

                <img
                  key={lightbox.index}
                  src={lightbox.images[lightbox.index]}
                  alt={`${lightbox.label} ${lightbox.index + 1}`}
                  className="max-w-full max-h-[74vh] object-contain rounded-xl shadow-2xl select-none"
                  draggable={false}
                />

                {lightbox.images.length > 1 && (
                  <button
                    onClick={() => setLightbox(p => ({ ...p, index: (p.index + 1) % p.images.length }))}
                    className="absolute right-0 translate-x-5 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors shadow-lg"
                    aria-label="Next"
                  >
                    <i className="fas fa-chevron-right text-sm"></i>
                  </button>
                )}
              </div>

              {/* Thumbnail strip */}
              {lightbox.images.length > 1 && (
                <div className="flex gap-2 justify-center mt-4 overflow-x-auto max-w-full pb-1">
                  {lightbox.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightbox(p => ({ ...p, index: i }))}
                      className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        i === lightbox.index
                          ? 'border-white opacity-100 ring-1 ring-white/40 ring-offset-1 ring-offset-black/50'
                          : 'border-transparent opacity-35 hover:opacity-65'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                    </button>
                  ))}
                </div>
              )}

              {/* Dismiss hint */}
              <p className="text-slate-600 text-[11px] mt-3">Click outside or press Esc to close</p>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}