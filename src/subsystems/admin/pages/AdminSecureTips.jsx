import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TopBar from "../components/TopBar";
import Sidebar from "./Sidebar";

export default function AdminSecureTips({
  activeSection,
  setActiveSection,
  sidebarOpen: initialSidebarOpen,
  setSidebarOpen: setInitialSidebarOpen,
}) {
  const [tips, setTips] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewNotice, setPreviewNotice] = useState(null);
  const [activeTab, setActiveTab] = useState(activeSection || "secure-tips");
  const [sidebarIsOpen, setSidebarIsOpen] = useState(initialSidebarOpen || false);
  const [readTips, setReadTips] = useState(new Set());
  const [viewingFullTip, setViewingFullTip] = useState(null);

  const currentActiveSection = setActiveSection ? activeSection : activeTab;
  const setCurrentActiveSection = setActiveSection || setActiveTab;
  
  const currentSidebarOpen = setInitialSidebarOpen ? initialSidebarOpen : sidebarIsOpen;
  const setCurrentSidebarOpen = setInitialSidebarOpen || setSidebarIsOpen;

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:3001/api/notices/tips/all");
      setTips(response.data.data);
    } catch (error) {
      console.error("Error fetching tips:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTips = tips.filter(tip => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const userNameMatch = tip.userName?.toLowerCase().includes(q);
    const titleMatch = tip.noticeId?.title?.toLowerCase().includes(q);
    const contentMatch = tip.text?.toLowerCase().includes(q);
    return userNameMatch || titleMatch || contentMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        activeSection={currentActiveSection}
        setActiveSection={setCurrentActiveSection}
        sidebarOpen={currentSidebarOpen}
        setSidebarOpen={setCurrentSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-h-screen bg-gray-50 overflow-hidden lg:ml-64 transition-all duration-300">
        <TopBar sidebarOpen={currentSidebarOpen} setSidebarOpen={setCurrentSidebarOpen} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header & Controls */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600 shadow-inner shrink-0">
                <i className="fas fa-hand-holding text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Found Item Messages</h1>
                <p className="text-sm text-gray-500">Private messages from students attempting to identify found items.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
              <div className="relative flex-1 w-full">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input 
                  type="text" 
                  className="w-full pl-11 pr-10 py-2.5 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-gray-400/80"
                  placeholder="Search messages by sender name, item title, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    <i className="fas fa-times-circle text-base"></i>
                  </button>
                )}
              </div>
              <button 
                onClick={fetchTips}
                className="shrink-0 w-full sm:w-auto px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-blue-100"
              >
                <i className="fas fa-sync-alt"></i> Refresh
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">
                <i className="fas fa-circle-notch fa-spin text-3xl mb-2 text-blue-500"></i>
                <p>Loading secure tips...</p>
              </div>
            ) : filteredTips.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                  <i className="fas fa-search text-2xl text-gray-400"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-700">No matching messages found</h3>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your search terms or clearing the search bar.</p>
                <button onClick={() => setSearchQuery('')} className="mt-4 px-4 py-2 text-sm text-blue-600 font-semibold bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">Clear Search</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-cyan-50 outline outline-1 outline-cyan-200 border-y border-cyan-200 text-xs uppercase tracking-wider text-cyan-700 shadow-sm">
                      <th className="p-4 font-semibold w-[20%]">Reporting Student</th>
                      <th className="p-4 font-semibold w-[20%]">Found Item Context</th>
                      <th className="p-4 font-semibold w-[35%]">Private Tip</th>
                      <th className="p-4 font-semibold w-[15%] text-right">Received Date</th>
                      <th className="p-4 font-semibold w-[10%] text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredTips.map((tip) => (
                      <tr key={tip._id} className="hover:bg-blue-50/40 transition-colors group">
                        <td className="p-4 align-top">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm"
                                 style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                              {tip.userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col justify-center h-10 relative">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-gray-900 leading-tight">{tip.userName}</p>
                                {!readTips.has(tip._id) && (
                                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="New Message"></span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          {tip.noticeId ? (
                            <div className="bg-cyan-50/30 p-2.5 rounded-lg border border-cyan-100/50">
                              <p className="text-sm font-bold text-gray-800 leading-snug line-clamp-2">{tip.noticeId.title}</p>
                              {tip.noticeId.itemType && (
                                <p className="text-[11px] text-gray-500 font-medium mt-1">
                                  <i className="fas fa-box-open mr-1"></i> {tip.noticeId.itemType}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                              <span className="text-xs font-semibold text-red-500 flex items-center gap-1.5">
                                <i className="fas fa-exclamation-triangle"></i> Notice Deleted
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="bg-gradient-to-br from-orange-50/50 to-orange-100/30 p-3.5 rounded-xl border border-orange-200/60 relative group-hover:border-orange-300 transition-colors shadow-sm h-[68px] overflow-hidden">
                            <i className="fas fa-quote-left absolute top-3 left-3 text-orange-200/80 text-xl"></i>
                            <div className="pl-7">
                              <div className="text-sm text-gray-800 font-medium leading-relaxed text-justify line-clamp-2">
                                {tip.text}
                              </div>
                            </div>
                          </div>
                          {tip.text && tip.text.length > 100 && (
                            <button
                              onClick={() => setViewingFullTip(tip)}
                              className="mt-1 text-[10px] text-blue-500 hover:text-blue-700 font-bold uppercase tracking-wider focus:outline-none transition-colors w-full text-right pr-0.5"
                            >
                              See more →
                            </button>
                          )}
                        </td>
                        <td className="p-4 text-right align-middle">
                          <div className="inline-flex flex-col items-end px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
                            <p className="text-[12px] font-bold text-gray-700">
                              {new Date(tip.createdAt).toLocaleDateString(undefined, {month: 'short', day: '2-digit', year: 'numeric'})}
                            </p>
                            <p className="text-[10px] font-medium text-gray-400 mt-0.5 tracking-wide">
                              {new Date(tip.createdAt).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'})}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 text-center align-middle">
                          {tip.noticeId && (
                            <button
                              onClick={() => {
                                setPreviewNotice(tip.noticeId);
                                setReadTips(prev => new Set(prev).add(tip._id));
                              }}
                              className="inline-flex items-center justify-center gap-1.5 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 font-bold text-xs px-3.5 py-3 rounded-lg shadow-sm transition-all active:scale-95 group-hover:shadow-md"
                            >
                              <i className="fas fa-eye text-[10px]"></i> View
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        </main>
      </div>

      {viewingFullTip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingFullTip(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                  <i className="fas fa-quote-left text-orange-400 text-xs"></i>
                </div>
                <span className="text-sm font-bold text-gray-700">Full Message</span>
              </div>
              <button onClick={() => setViewingFullTip(null)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <i className="fas fa-times text-xs text-gray-500"></i>
              </button>
            </div>
            <div className="p-5">
              <div className="bg-gradient-to-br from-orange-50/50 to-orange-100/30 p-4 rounded-xl border border-orange-200/60 relative">
                <i className="fas fa-quote-left absolute top-3 left-3 text-orange-200 text-xl"></i>
                <p className="pl-7 text-sm text-gray-800 font-medium leading-relaxed">{viewingFullTip.text}</p>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <span>From: <strong className="text-gray-600">{viewingFullTip.userName}</strong></span>
                <span>{new Date(viewingFullTip.createdAt).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewNotice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[999] flex justify-center items-center p-4 transition-all" onClick={() => setPreviewNotice(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-6 pb-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-start justify-between relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-50 rounded-full blur-2xl opacity-70 pointer-events-none"></div>
              <div className="relative z-10 w-full pr-8">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                   <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${
                    previewNotice.category === 'lost-item' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    previewNotice.category === 'found-item' ? 'bg-cyan-50 text-cyan-800 border-cyan-300' :
                    previewNotice.category === 'announcement' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    previewNotice.category === 'advisory' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    <i className={
                      previewNotice.category === 'lost-item' ? 'fas fa-search text-orange-500' :
                      previewNotice.category === 'found-item' ? 'fas fa-hand-holding text-cyan-600' :
                      previewNotice.category === 'announcement' ? 'fas fa-bullhorn text-blue-500' :
                      previewNotice.category === 'advisory' ? 'fas fa-info-circle text-purple-500' :
                      'fas fa-tag text-gray-400'
                    }></i>
                    {previewNotice.category === 'lost-item' ? 'Lost Item' :
                     previewNotice.category === 'found-item' ? 'Found Item' : 
                     previewNotice.category.replace('-', ' ')}
                  </span>
                  {previewNotice.priority && (
                    <span className={`inline-block px-2.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${
                      previewNotice.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-200 shadow-sm' : 
                      previewNotice.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm' :
                      'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm'
                    }`}>
                      <i className="fas fa-flag mr-1"></i> {previewNotice.priority}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight leading-tight">{previewNotice.title}</h2>
              </div>
              <button onClick={() => setPreviewNotice(null)} className="absolute top-6 right-6 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors shadow-sm">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-gray-50/50 flex-1">
              
              {/* Meta Date */}
              <p className="text-xs text-gray-500 font-bold tracking-wide mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 text-blue-600 flex items-center justify-center"><i className="fas fa-calendar-day"></i></span>
                Posted {new Date(previewNotice.startDate || previewNotice.createdAt).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})}
              </p>

              {/* Clear, Unobscured Image Display */}
              {previewNotice.attachments?.length > 0 && previewNotice.attachments[0].length > 10 && (
                 <div className="mb-6 mt-2 rounded-[2rem] border-[3px] border-gray-100/80 bg-white shadow-sm flex justify-center items-center p-6 max-h-80 relative hover:border-blue-100 hover:shadow-md transition-all duration-300 group">
                    <div className="absolute inset-0 bg-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] pointer-events-none"></div>
                    <img src={previewNotice.attachments[0]} alt="Notice Subject" className="max-w-full max-h-64 object-contain rounded-xl drop-shadow-sm hover:scale-105 transition-transform duration-500 cursor-zoom-in relative z-10" />
                 </div>
              )}

              {/* Enhanced Description Card */}
              <div className="bg-white p-5 rounded-2xl border border-blue-100/60 shadow-sm shadow-blue-900/5 mb-6 relative hover:shadow-md transition-shadow">
                 <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-500 rounded-l-2xl"></div>
                 <h4 className="text-[10px] items-center flex gap-1.5 font-bold text-blue-400 uppercase tracking-widest mb-3">
                   <i className="fas fa-align-left"></i> Description
                 </h4>
                 <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {previewNotice.content}
                 </p>
              </div>

              {/* Grid Props */}
              <div className="grid grid-cols-2 gap-5">
                 
                 {/* Item Type */}
                 <div className="group bg-white p-4 rounded-2xl border border-purple-200 shadow-sm shadow-purple-500/5 hover:shadow-md hover:shadow-purple-500/10 hover:border-purple-300 hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 cursor-default">
                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-inner group-hover:from-purple-100 group-hover:to-purple-200 transition-colors">
                     <i className="fas fa-box-open text-xl group-hover:scale-110 transition-transform"></i>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Item Type</span>
                     <span className="text-[15px] font-black text-gray-800 capitalize leading-tight group-hover:text-purple-700 transition-colors">{previewNotice.itemType?.replace('-', ' ') || 'General'}</span>
                   </div>
                 </div>
                 
                 {/* Audience */}
                 <div className="group bg-white p-4 rounded-2xl border border-indigo-200 shadow-sm shadow-indigo-500/5 hover:shadow-md hover:shadow-indigo-500/10 hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 cursor-default">
                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner group-hover:from-indigo-100 group-hover:to-indigo-200 transition-colors">
                     <i className="fas fa-users text-xl group-hover:scale-110 transition-transform"></i>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Audience</span>
                     <span className="text-[15px] font-black text-gray-800 capitalize leading-tight group-hover:text-indigo-700 transition-colors">{previewNotice.targetAudience?.replace(/-/g, ' ') || 'All Students'}</span>
                   </div>
                 </div>

                 {/* Contact info */}
                 <div className="group bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm shadow-emerald-500/5 hover:shadow-md hover:shadow-emerald-500/10 hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 cursor-default">
                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner group-hover:from-emerald-100 group-hover:to-emerald-200 transition-colors">
                     <i className="fas fa-address-book text-xl group-hover:scale-110 transition-transform"></i>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Contact</span>
                     <div className="text-[15px] font-black text-gray-800 flex flex-col group-hover:text-emerald-700 transition-colors">
                       {previewNotice.contactPhone || previewNotice.contactEmail ? (
                         <>
                           {previewNotice.contactPhone && <span>{previewNotice.contactPhone}</span>}
                         </>
                       ) : <span className="text-gray-400 font-medium italic text-[13px]">System Handled</span>}
                     </div>
                   </div>
                 </div>

                 {/* Expiration */}
                 <div className="group bg-white p-4 rounded-2xl border border-rose-200 shadow-sm shadow-rose-500/5 hover:shadow-md hover:shadow-rose-500/10 hover:border-rose-300 hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 cursor-default">
                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-inner group-hover:from-rose-100 group-hover:to-rose-200 transition-colors">
                     <i className="fas fa-hourglass-end text-xl group-hover:rotate-12 transition-transform"></i>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Valid Until</span>
                     <span className="text-[15px] font-black text-gray-800 leading-tight group-hover:text-rose-700 transition-colors">
                       {previewNotice.endDate ? new Date(previewNotice.endDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : 'No Expiry'}
                     </span>
                   </div>
                 </div>

              </div>
            </div>
            
            {/* Footer */}
            <div className="py-4 px-6 border-t border-gray-100 bg-white flex justify-between items-center rounded-b-3xl">
              <span className="text-[10px] text-gray-400 font-mono tracking-wider"><i className="fas fa-fingerprint mr-1"></i> ID: {previewNotice._id}</span>
              <button onClick={() => setPreviewNotice(null)} className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-gray-900/20 active:scale-95">
                Dismiss Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
