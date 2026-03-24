import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./shared/components/ProtectedRoute";
import AdminRoute from "./shared/components/AdminRoute";
import ReportItem from "./subsystems/lost-found-reporting/pages/ReportItem";
import Contact from "./shared/components/contact";
import Notice from "./subsystems/notice-management/components/Notice";
import Verification from "./subsystems/claim-verification/components/Verification";
import AdminLogin from "./subsystems/admin/pages/AdminLogin";
import Dashboard from "./subsystems/admin/pages/Dashboard";
import Users from "./subsystems/admin/pages/Users";
import Settings from "./subsystems/admin/pages/Settings";
import Items from "./subsystems/admin/pages/Items";
import EditItem from "./subsystems/lost-found-reporting/pages/EditItem";
import CreateNotice from "./subsystems/notice-management/pages/CreateNotice";
import EditNotice from "./subsystems/notice-management/pages/EditNotice";
import AdminNotices from "./subsystems/admin/pages/AdminNotices";
import NotificationSettings from "./subsystems/claim-verification/pages/NotificationSettings";
import ChatBotWidget from "./shared/components/ChatBotWidget";
import AllItems from "./subsystems/admin/pages/Items";
import Report from "./subsystems/admin/pages/Reports";
import VerificationRequests from "./subsystems/admin/pages/VerificationRequests";
import UserAccount from "./pages/UserAccount";


export default function App() {
    const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const renderSection = () => {
    switch (activeSection) {
      case "items": return <Items />;
      case "report": return <ReportItem />;
      case "users": return <Users />;
      case "settings": return <Settings />;
      default: return <Dashboard />;
    }
  };
  return (
    <>
      <Routes>
        {/* Auth Routes (public) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Home — public */}
        <Route path="/" element={<Home />} />

        {/* Protected Routes — must be logged in */}
        <Route path="/report-item" element={<ProtectedRoute><ReportItem /></ProtectedRoute>} />
        <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
        <Route path="/notice" element={<ProtectedRoute><Notice /></ProtectedRoute>} />
        <Route path="/verification" element={<ProtectedRoute><Verification /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/dashboard/allitems" element={<AdminRoute><Items /></AdminRoute>} />
        <Route path="/admin/dashboard/users" element={<AdminRoute><Users /></AdminRoute>} />
        <Route path="/admin/dashboard/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/admin/dashboard/notices" element={<AdminRoute><AdminNotices /></AdminRoute>} />
        <Route path="/admin/dashboard/verification" element={<AdminRoute><VerificationRequests /></AdminRoute>} />
        {/* Other Protected Routes */}
        <Route path="/account" element={<ProtectedRoute><UserAccount /></ProtectedRoute>} />
        <Route path="/notification-settings" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
        <Route path="/edit-item/:id" element={<ProtectedRoute><EditItem /></ProtectedRoute>} />
        <Route path="/create-notice" element={<AdminRoute><CreateNotice /></AdminRoute>} />
        <Route path="/edit-notice/:id" element={<AdminRoute><EditNotice /></AdminRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatBotWidget /></ProtectedRoute>} />
         <Route
          path="/"
          element={
            <Dashboard
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
          }
        />
        <Route
          path="/items"
          element={
            <AdminRoute>
              <AllItems
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
            </AdminRoute>
          }
        />
        <Route
          path="/report"
          element={
            <AdminRoute>
              <Report
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
            </AdminRoute>
          }
        />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <Users
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
            </AdminRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <AdminRoute>
              <Settings
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
            </AdminRoute>
          }
        />

     

      </Routes>
    </>
  );
}