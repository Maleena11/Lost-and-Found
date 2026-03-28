import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";

export default function NotificationSettings() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    receiveEmails: true,
    receiveInApp: true
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [toggleError, setToggleError] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Load saved email from localStorage and fetch existing preferences
  useEffect(() => {
    const savedEmail = localStorage.getItem("notif_email");
    if (savedEmail) {
      axios.get(`http://localhost:3001/api/notifications/preferences/${savedEmail}`)
        .then(res => {
          if (res.data.data) {
            const p = res.data.data;
            setForm({ name: p.name || "", email: p.email, receiveEmails: p.receiveEmails, receiveInApp: p.receiveInApp });
            setIsSubscribed(true);
          } else {
            setForm(prev => ({ ...prev, email: savedEmail }));
          }
        })
        .catch(() => setForm(prev => ({ ...prev, email: savedEmail })));
    }
  }, []);

  const handleUnsubscribe = async () => {
    if (!form.email) return;
    try {
      await axios.delete(`http://localhost:3001/api/notifications/preferences/${form.email}`);
      localStorage.removeItem("notif_email");
      setForm({ name: "", email: "", receiveEmails: true, receiveInApp: true });
      setIsSubscribed(false);
      setMessage({ text: "You have been unsubscribed successfully.", type: "success" });
    } catch (err) {
      setMessage({ text: "Failed to unsubscribe. Please try again.", type: "error" });
    }
  };

  const handleToggle = (field) => {
    setForm(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let valid = true;

    if (!form.name.trim()) {
      setNameError("Please enter your name");
      valid = false;
    } else if (form.name.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      valid = false;
    } else if (form.name.trim().length > 50) {
      setNameError("Name cannot exceed 50 characters");
      valid = false;
    } else {
      setNameError("");
    }

    if (!emailRegex.test(form.email)) {
      setEmailError("Please enter a valid email address");
      valid = false;
    } else {
      setEmailError("");
    }

    if (!form.receiveEmails && !form.receiveInApp) {
      setToggleError("Please enable at least one notification type");
      valid = false;
    } else {
      setToggleError("");
    }

    if (!valid) return;
    setIsSaving(true);
    try {
      await axios.post("http://localhost:3001/api/notifications/preferences", form);
      localStorage.setItem("notif_email", form.email.toLowerCase());
      setMessage({ text: "Subscribed successfully! You will receive email notifications for new notices.", type: "success" });
      setIsSubscribed(true);
    } catch (err) {
      setMessage({ text: err.response?.data?.error || "Failed to save preferences", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-100">
      <Header />
      <main className="flex-1 flex justify-center items-start p-6">
        <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-blue-800">Notification Settings</h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose how you want to be notified when new notices are posted.
            </p>
          </div>

          {message.text && (
            <div className={`mb-5 p-4 rounded-lg text-sm ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Name */}
            <div>
              <label className="block mb-1 font-semibold text-gray-700">Your Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => { setForm(prev => ({ ...prev, name: e.target.value })); setNameError(""); }}
                placeholder="e.g. Kamal Perera"
                maxLength={50}
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${nameError ? "border-red-400" : "border-gray-300"}`}
              />
              {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block mb-1 font-semibold text-gray-700">Email Address <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={e => { setForm(prev => ({ ...prev, email: e.target.value })); setEmailError(""); }}
                onBlur={() => { if (form.email && !emailRegex.test(form.email)) setEmailError("Please enter a valid email address"); }}
                placeholder="e.g. student@university.lk"
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${emailError ? "border-red-400" : "border-gray-300"}`}
                required
              />
              {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
              <p className="mt-1 text-xs text-gray-400">Used to identify you and send email notifications.</p>
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Email Notifications Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-700">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive an email when a new notice is posted</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("receiveEmails")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${form.receiveEmails ? "bg-blue-600" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.receiveEmails ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {toggleError && <p className="text-xs text-red-600 -mt-2">{toggleError}</p>}
            {/* In-App Notifications Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-700">In-App Notifications</p>
                <p className="text-sm text-gray-500">See a notification bell with alerts in the header</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("receiveInApp")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${form.receiveInApp ? "bg-blue-600" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.receiveInApp ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:bg-blue-300"
              >
                {isSaving ? "Subscribing..." : "Subscribe"}
              </button>

              {isSubscribed && (
                <button
                  type="button"
                  onClick={handleUnsubscribe}
                  className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold border border-red-500 hover:bg-red-600 transition"
                >
                  Unsubscribe
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
