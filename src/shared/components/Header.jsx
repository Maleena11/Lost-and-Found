import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthModal from "./AuthModal";
import { useAuth } from "../utils/AuthContext";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [active, setActive] = useState("Home");
  const [notifications, setNotifications] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  const navLinks = ["Home", "Report Item", "Notice", "Verification", "Contact"];
  const notifEmail = localStorage.getItem("notif_email");
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const current = navLinks.find(link => {
      const path = link === "Home" ? "/" : `/${link.toLowerCase().replace(/ /g, "-")}`;
      return location.pathname === path;
    });
    if (current) setActive(current);
  }, [location]);

  // Fetch in-app notifications if student email is set
  useEffect(() => {
    if (!notifEmail) return;
    const fetchNotifications = () => {
      axios.get(`http://localhost:3001/api/notifications/in-app/${notifEmail}`)
        .then(res => setNotifications(res.data.data || []))
        .catch(() => {});
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [notifEmail]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = async () => {
    if (!notifEmail) return;
    await axios.put(`http://localhost:3001/api/notifications/in-app/mark-all-read/${notifEmail}`).catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markOneRead = async (id) => {
    await axios.put(`http://localhost:3001/api/notifications/in-app/${id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const handleNotificationClick = async (n) => {
    await markOneRead(n._id);
    setBellOpen(false);
    if (n.noticeId) {
      navigate(`/notice?noticeId=${n.noticeId}&t=${Date.now()}`);
    } else {
      navigate('/notice');
    }
  };

  const categoryLabel = (cat) => ({ 'lost-item': 'Lost', 'found-item': 'Found', announcement: 'Notice', advisory: 'Advisory' }[cat] || cat);
  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <>
      <header className="bg-gradient-to-r from-blue-600 to-blue-900 text-white shadow-md w-full">
        <div className="mx-auto flex justify-between items-center p-4 max-w-6xl w-full">
          <div className="flex items-center gap-3">
            <i className="fas fa-graduation-cap text-3xl"></i>
            <h1 className="text-xl font-bold">UniFind - Lost & Found</h1>
          </div>

          <nav className="flex items-center gap-6">
            <ul className="flex gap-6 text-white">
              {navLinks.map((link) => {
                const path = link === "Home" ? "/" : `/${link.toLowerCase().replace(/ /g, "-")}`;
                return (
                  <li key={link}>
                    <Link
                      to={path}
                      className={`text-white hover:text-gray-200 transition ${active === link ? "font-bold underline" : ""}`}
                    >
                      {link}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Bell icon — only shown when student email is set */}
            {notifEmail && (
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setBellOpen(prev => !prev)}
                  className="relative text-white hover:text-gray-200 focus:outline-none"
                  title="Notifications"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {bellOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl z-50 border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <span className="font-semibold text-gray-800 text-sm">Notifications</span>
                      <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                            Mark all read
                          </button>
                        )}
                        <Link to="/notification-settings" className="text-xs text-gray-400 hover:text-gray-600">
                          Settings
                        </Link>
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-8">No notifications yet</p>
                      ) : (
                        notifications.slice(0, 10).map(n => (
                          <div
                            key={n._id}
                            onClick={() => handleNotificationClick(n)}
                            className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${!n.isRead ? "bg-blue-50" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium text-gray-800 truncate ${!n.isRead ? "font-semibold" : ""}`}>{n.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                              </div>
                              {!n.isRead && <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{categoryLabel(n.category)}</span>
                              <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notification settings link (always visible) */}
            <Link to="/notification-settings" className="text-white hover:text-gray-200 transition" title="Notification Settings">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>

            {/* Auth buttons */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-blue-500">
              {user ? (
                <>
                  <Link
                    to="/account"
                    className="text-sm text-blue-100 hover:text-white transition hidden sm:flex items-center gap-1"
                    title="My Account"
                  >
                    <i className="fas fa-user-circle mr-1" />
                    {user.name || user.email}
                  </Link>
                  <button
                    onClick={() => { logout(); navigate("/login"); }}
                    className="text-sm font-semibold bg-white text-blue-700 hover:bg-blue-50 transition px-4 py-1.5 rounded-lg shadow-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-white hover:text-blue-100 transition px-3 py-1.5 rounded-lg hover:bg-white hover:bg-opacity-10"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-semibold bg-white text-blue-700 hover:bg-blue-50 transition px-4 py-1.5 rounded-lg shadow-sm"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}

{/*
export default function Header2({ setSidebarOpen }) {
    return (
    <header className="h-16 bg-white shadow flex items-center justify-between px-4 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          className="lg:hidden text-blue-600 text-2xl"
        >
          <i className="fas fa-bars"></i>
        </button>
        <h1 className="text-xl font-bold text-blue-600">Admin Dashboard</h1>
      </div>
      <div className="flex items-center">
        <img
          src="https://ui-avatars.com/api/?name=Admin+User&background=random"
          alt="Admin"
          className="w-10 h-10 rounded-full mr-2"
        />
        <span>Admin</span>
      </div>
    </header>
  );
}
*/}
