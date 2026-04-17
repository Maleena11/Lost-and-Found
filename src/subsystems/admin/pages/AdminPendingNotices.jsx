import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import TopBar from '../components/TopBar';

export default function AdminPendingNotices() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("pending-notices");
  const [actionLoading, setActionLoading] = useState(null);
  const [redirectingNoticeId, setRedirectingNoticeId] = useState(null);
  const [previewNotice, setPreviewNotice] = useState(null);

  useEffect(() => { fetchPendingNotices(); }, []);

  const fetchPendingNotices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/notices/pending');
      setNotices(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching pending notices:", err);
      setError("Failed to load pending notices.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    setActionLoading(id);
    try {
      const response = await axios.patch(`http://localhost:3001/api/notices/${id}/status`, { status });
      setNotices(prev => prev.filter(n => n._id !== id));

      if (status === 'approved' && response.data?.data?._id) {
        const approvedNoticeId = response.data.data._id;
        setRedirectingNoticeId(approvedNoticeId);
        setTimeout(() => {
          navigate(`/notice?noticeId=${approvedNoticeId}`);
        }, 900);
      }
    } catch (err) {
      console.error('Error updating notice status:', err);
      alert('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const isBase64Image = (str) => str && str.startsWith('data:image/');

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 lg:ml-64 flex flex-col">
        <TopBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title="Pending Smart Reports"
          subtitle="Review and approve AI-generated item reports"
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
          {/* Header Area */}
          <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm border border-indigo-200">
              <i className="fas fa-clock text-2xl"></i>
              </div>
            <div>
              <h2 className="font-extrabold text-2xl text-gray-800">Pending Approvals</h2>
              <p className="text-gray-500 font-medium">Review AI-assisted student reports before they go public</p>
            </div>
            <div className="ml-auto text-sm bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded-full">
              {notices.length} Pending
            </div>
          </div>

          {redirectingNoticeId && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <i className="fas fa-check-circle"></i>
              <span className="font-medium">Notice approved successfully. Redirecting to the Notice Board now...</span>
            </div>
          )}

          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-3">
               <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
               <p className="text-gray-500 font-medium">Loading reports...</p>
             </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-red-700 font-medium flex items-center gap-3">
              <i className="fas fa-exclamation-triangle"></i> {error}
            </div>
          ) : notices.length === 0 ? (
            <div className="bg-white border text-center py-24 rounded-3xl shadow-sm">
               <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                 <i className="fas fa-check-double text-3xl text-green-400"></i>
               </div>
               <h3 className="text-xl font-bold text-gray-800">All caught up!</h3>
               <p className="text-gray-400 mt-2">There are no pending smart reports right now.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden mr-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="bg-indigo-50 border-b border-indigo-100">
                    <tr className="text-left text-[11px] uppercase tracking-wider text-indigo-800">
                      <th className="px-5 py-4 font-extrabold">Item</th>
                      <th className="px-5 py-4 font-extrabold">AI Review</th>
                      <th className="px-5 py-4 font-extrabold text-center">Contact</th>
                      <th className="px-5 py-4 font-extrabold text-center">Details</th>
                      <th className="px-5 py-4 font-extrabold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {notices.map((notice) => (
                      <tr key={notice._id} className="hover:bg-indigo-50/40 transition-colors align-top">
                        <td className="px-5 py-4">
                          <div className="w-32 h-28 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
                            {notice.attachments && notice.attachments.some(isBase64Image) ? (
                              <img
                                src={notice.attachments.find(isBase64Image)}
                                className="w-full h-full object-cover"
                                alt="Item"
                                crossOrigin="anonymous"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <i className="fas fa-image text-3xl"></i>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 min-w-[210px]">
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">
                              <i className="fas fa-robot text-indigo-500"></i>
                              AI Analysis
                            </div>
                            <div className="flex gap-2 flex-wrap mb-2">
                              <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-1 rounded border ${notice.category === 'found-item' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                {notice.category.replace('-', ' ')}
                              </span>
                              {notice.itemType && (
                                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-1 rounded border bg-violet-50 text-violet-700 border-violet-200">
                                  {notice.itemType.replace('-', ' ')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-indigo-700">
                              {notice.aiMetadata?.confidence ? `${(notice.aiMetadata.confidence * 100).toFixed(1)}% Confident` : 'Manual Report'}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <div className="space-y-2 text-sm text-gray-600 min-w-[190px] max-w-[220px] mx-auto">
                            <div className="flex items-start gap-2 justify-start">
                              <i className="fas fa-envelope text-gray-400 w-4 mt-0.5"></i>
                              <span className="break-all">{notice.contactEmail || 'No email provided'}</span>
                            </div>
                            <div className="flex items-start gap-2 justify-start">
                              <i className="fas fa-phone text-gray-400 w-4 mt-0.5"></i>
                              <span>{notice.contactPhone || 'No phone provided'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <div className="flex justify-center">
                            <button
                              onClick={() => setPreviewNotice(notice)}
                              className="inline-flex flex-col items-center gap-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 text-indigo-700 font-bold px-5 py-1.5 rounded-2xl transition-all shadow-sm hover:shadow-md"
                            >
                              <i className="fas fa-eye text-indigo-400 text-lg"></i>
                              <span className="text-xs">View Details</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleStatusUpdate(notice._id, 'rejected')}
                              disabled={actionLoading === notice._id || redirectingNoticeId === notice._id}
                              className="bg-red-400 border border-red-500 text-white hover:bg-red-500 font-bold px-4 py-2.5 rounded-xl transition-colors shadow shadow-red-400/30 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[126px]"
                            >
                              <i className="fas fa-times"></i> Reject
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(notice._id, 'approved')}
                              disabled={actionLoading === notice._id || !!redirectingNoticeId}
                              className="bg-green-400 border border-green-500 text-white hover:bg-green-500 font-bold px-4 py-2.5 rounded-xl transition-colors shadow shadow-green-400/30 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[126px]"
                            >
                              {actionLoading === notice._id ? <i className="fas fa-circle-notch fa-spin"></i> : <><i className="fas fa-check"></i> Approve</>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>

      {/* Notice Details Modal */}
      {previewNotice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewNotice(null)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 px-6 py-5 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <i className="fas fa-file-alt text-white"></i>
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Notice Details</h3>
                  <p className="text-indigo-300 text-xs mt-0.5">Submitted by {previewNotice.postedBy || 'Student'} · {new Date(previewNotice.createdAt).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}</p>
                </div>
              </div>
              <button onClick={() => setPreviewNotice(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Image */}
              {previewNotice.attachments?.some(isBase64Image) && (
                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm max-h-56 flex justify-center bg-gray-50">
                  <img src={previewNotice.attachments.find(isBase64Image)} alt="Item" className="max-h-56 object-contain" />
                </div>
              )}

              {/* Title */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Notice Title</p>
                <p className="text-lg font-extrabold text-gray-800">{previewNotice.title}</p>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-2">
                <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full border ${previewNotice.category === 'found-item' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                  {previewNotice.category?.replace('-', ' ')}
                </span>
                {previewNotice.itemType && (
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full border bg-violet-50 text-violet-700 border-violet-200">
                    {previewNotice.itemType.replace(/-/g, ' ')}
                  </span>
                )}
                <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full border ${previewNotice.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-200' : previewNotice.priority === 'medium' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                  {previewNotice.priority} priority
                </span>
                {previewNotice.targetAudience && (
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                    {previewNotice.targetAudience.replace(/-/g, ' ')}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">{previewNotice.content}</p>
              </div>

              {/* Dates + Contact grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Start Date</p>
                  <p className="text-sm font-semibold text-gray-700">{previewNotice.startDate ? new Date(previewNotice.startDate).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }) : '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Expiry Date</p>
                  <p className="text-sm font-semibold text-gray-700">{previewNotice.endDate ? new Date(previewNotice.endDate).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }) : 'No expiry'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contact Email</p>
                  <p className="text-sm font-semibold text-gray-700 break-all">{previewNotice.contactEmail || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contact Phone</p>
                  <p className="text-sm font-semibold text-gray-700">{previewNotice.contactPhone || '—'}</p>
                </div>
              </div>

              {/* AI Metadata */}
              {previewNotice.aiMetadata?.confidence && (
                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 flex items-center gap-3">
                  <i className="fas fa-robot text-indigo-400"></i>
                  <p className="text-sm font-semibold text-indigo-700">
                    AI Confidence: <strong>{(previewNotice.aiMetadata.confidence * 100).toFixed(1)}%</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
              <p className="text-[10px] text-gray-400 font-mono">ID: {previewNotice._id}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { handleStatusUpdate(previewNotice._id, 'rejected'); setPreviewNotice(null); }}
                  disabled={actionLoading === previewNotice._id}
                  className="bg-red-400 hover:bg-red-500 border border-red-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <i className="fas fa-times text-xs"></i> Reject
                </button>
                <button
                  onClick={() => { handleStatusUpdate(previewNotice._id, 'approved'); setPreviewNotice(null); }}
                  disabled={actionLoading === previewNotice._id || !!redirectingNoticeId}
                  className="bg-green-400 hover:bg-green-500 border border-green-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <i className="fas fa-check text-xs"></i> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
