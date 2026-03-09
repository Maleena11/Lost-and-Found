import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
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
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/report-item" element={<ReportItem />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/notice" element={<Notice />} />
        <Route path="/verification" element={<Verification />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/dashboard/allitems" element={<Items />} />
        <Route path="/admin/dashboard/users" element={<Users />} />
        <Route path="/admin/dashboard/settings" element={<Settings />} />
        <Route path="/admin/dashboard/notices" element={<AdminNotices />} />
        <Route path="/admin/dashboard/verification" element={<VerificationRequests />} />
        {/* Other Routes */}
        <Route path="/notification-settings" element={<NotificationSettings />} />
        <Route path="/edit-item/:id" element={<EditItem />} />
        <Route path="/create-notice" element={<CreateNotice />} />
        <Route path="/edit-notice/:id" element={<EditNotice />} />
        <Route path="/chat" element={<ChatBotWidget />} />
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
            <AllItems
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
          }
        />
        <Route
          path="/report"
          element={
            <Report
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
          }
        />
        <Route
          path="/users"
          element={
            <Users
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <Settings
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
          }
        />

     

      </Routes>
    </>
  );
}