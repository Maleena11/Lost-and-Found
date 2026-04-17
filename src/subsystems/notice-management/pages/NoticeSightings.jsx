import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { getTempUser } from "../../../shared/utils/tempUserAuth";

export default function NoticeSightings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFromAlert = searchParams.get('alert') === 'true';
  const [notice, setNotice] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [tempUser, setTempUser] = useState(null);

  useEffect(() => {
    const user = getTempUser();
    setTempUser(user);
    if (!user) {
      navigate('/login');
      return;
    }
    fetchNoticeAndComments();
  }, [id, navigate]);

  const fetchNoticeAndComments = async () => {
    setLoading(true);
    setLoadingComments(true);
    try {
      const noticeRes = await axios.get(`http://localhost:3001/api/notices/${id}`);
      setNotice(noticeRes.data.data);
      
      const commentsRes = await axios.get(`http://localhost:3001/api/notices/${id}/comments`);
      setComments(commentsRes.data.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
      setLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !tempUser) return;
    setPostingComment(true);
    try {
      const response = await axios.post(`http://localhost:3001/api/notices/${id}/comments`, {
        userId: tempUser.id,
        userName: tempUser.name || 'Student',
        text: newComment.trim(),
        isAnonymous: isAnonymous
      });
      setComments([response.data.data, ...comments]);
      setNewComment('');
      setIsAnonymous(false);
    } catch (err) {
      console.error("Error posting sighting:", err);
      alert("Failed to post sighting.");
    } finally {
      setPostingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex justify-center items-center flex-col gap-4">
          <h2 className="text-xl font-bold text-gray-700">Notice not found</h2>
          <button onClick={() => navigate('/notice')} className="text-blue-500 hover:underline">Return to Notice Board</button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      {/* Dynamic Header mimicking frontend aesthetics */}
      <div className="bg-gradient-to-r from-[#0f1f4d] via-[#162660] to-[#1a1050] pt-12 pb-24 relative overflow-hidden text-center text-white">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <h1 className="text-3xl font-extrabold relative z-10">Community Sightings</h1>
        <p className="text-blue-200 mt-2 relative z-10 text-sm">Help your community by sharing details if you've seen this item.</p>
      </div>

      <main className="flex-1 px-4 -mt-16 w-full pb-16 z-20 relative">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 items-start">
          
          {/* Info Card - Left side */}
          <div className={`w-full md:w-1/3 bg-white rounded-2xl overflow-hidden sticky top-8 transition-all duration-1000 ${isFromAlert ? 'border-[3px] border-blue-200/50 shadow-[0_0_25px_rgba(191,219,254,0.6)] animate-pulse-light' : 'border border-gray-100 shadow-lg'}`}>
            {isFromAlert && (
              <style>{`
                @keyframes pulse-light {
                  0%, 100% { box-shadow: 0 0 15px rgba(191,219,254,0.4); }
                  50% { box-shadow: 0 0 30px rgba(147,197,253,0.8); }
                }
                .animate-pulse-light { animation: pulse-light 3s ease-in-out infinite; }
              `}</style>
            )}
            {notice.attachments && notice.attachments.some(att => att.startsWith('data:image')) && (
                <img
                  src={notice.attachments.find(att => att.startsWith('data:image'))}
                  alt="Item"
                  className="w-full h-48 object-cover"
                />
            )}
            <div className="p-5">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-orange-50 text-orange-700 border border-orange-200 mb-3">
                <i className="fas fa-search text-orange-500"></i>
                Lost Item
              </span>
              <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2">{notice.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-4">{notice.content}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button onClick={() => navigate('/notice')} className="w-full text-center py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm transition-colors">
                  <i className="fas fa-arrow-left mr-2 text-xs"></i> Back to Board
                </button>
              </div>
            </div>
          </div>

          {/* Sightings Area - Right side */}
          <div className="w-full md:w-2/3 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <i className="fas fa-users text-blue-600 text-lg"></i>
              </div>
              <div>
                <h4 className="font-extrabold text-gray-800 text-lg">Sightings & Help</h4>
                <p className="text-xs text-gray-400 font-medium">Post details to reunite this item with its owner</p>
              </div>
            </div>

            {/* Input Box */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-2xl p-1 border border-blue-100 shadow-sm mb-8">
              <div className="bg-white rounded-xl p-4 shadow-inner focus-within:ring-2 focus-within:ring-blue-400 transition-shadow duration-300">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="I think I saw this item..."
                  className="w-full bg-transparent border-none outline-none text-[15px] text-gray-700 resize-none min-h-[80px]"
                />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-500 border-gray-300 cursor-pointer focus:ring-blue-400"
                    />
                    <span className="text-xs text-gray-500 font-semibold group-hover:text-gray-700 transition-colors">Post Anonymously</span>
                  </label>
                  <button
                    onClick={handlePostComment}
                    disabled={!newComment.trim() || postingComment}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md disabled:shadow-none hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    {postingComment ? <><i className="fas fa-circle-notch fa-spin"></i> Posting</> : <><i className="fas fa-paper-plane"></i> Share Sighting</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {loadingComments ? (
                <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div></div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-eye-slash text-gray-400 text-xl"></i>
                  </div>
                  <h5 className="font-semibold text-gray-700 mb-1">No sightings yet</h5>
                  <p className="text-sm text-gray-400">Be the first to help out if you have information!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center text-xs font-bold text-white shadow-sm ${comment.isAnonymous ? 'bg-gradient-to-br from-gray-400 to-gray-500' : 'bg-gradient-to-br from-teal-400 to-emerald-500'}`}>
                          {comment.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 leading-tight">{comment.userName}</p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {new Date(comment.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-[14px] text-gray-700 leading-relaxed ml-10 pl-0.5">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
