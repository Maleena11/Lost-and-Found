import { useState } from "react";
import { api } from "../api";

export default function WhatsAppAlert({ employee }) {
  const [loading, setLoading] = useState(false); // Track loading state for button

  // --- Function to send WhatsApp alert ---
  const sendAlert = async () => {
    const phone = employee?.contact || employee?.phone;
    if (!phone) {
      alert("Employee phone number not found."); // Show error if no phone
      return;
    }

    setLoading(true); // Start loading
    try {
      // API call to send WhatsApp message
      await api.post("/alerts/whatsapp", {
        phone: employee.contact,
        message: "Checking alert, contact relevant officers",
      });
      alert("Message sent successfully!"); // Success feedback
    } catch (err) {
      console.error(err);
      alert("Failed to send message."); // Error feedback
    } finally {
      setLoading(false); // End loading
    }
  };

  return (
    <button
      onClick={sendAlert} // Trigger alert on click
      disabled={loading}  // Disable button while sending
      style={{
        backgroundColor: "#1e3a8a", // Dark blue
        color: "white",
        padding: "8px 16px",
        borderRadius: "5px",
        cursor: loading ? "not-allowed" : "pointer",
        marginLeft: "8px",
        fontWeight: 600,
        transition: "background-color 0.2s",
      }}
      // Hover effect
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#162f6f"}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#1e3a8a"}
    >
      {loading ? "Sending..." : "Send WhatsApp Alert"} {/* Button label changes while loading */}
    </button>
  );
}
