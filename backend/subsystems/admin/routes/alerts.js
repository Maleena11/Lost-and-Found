const express = require("express");
const router = express.Router();
const twilio = require("twilio");

// Helper function: Convert local Sri Lankan phone numbers to E.164 format
// Example: "0712345678" -> "+94712345678"
function formatPhoneNumber(localNumber) {
  const digits = localNumber.replace(/\D/g, ""); // Remove non-digits
  if (digits.startsWith("0")) return "+94" + digits.substring(1);
  if (digits.startsWith("94")) return "+" + digits;
  return "+" + digits; // fallback
}

// POST endpoint -> /api/alerts/whatsapp
router.post("/whatsapp", async (req, res) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !whatsappFrom) {
      return res.status(500).json({
        error: "WhatsApp service not configured",
        details: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM must be set in .env",
      });
    }

    const { phone, message } = req.body;

    // Check if phone and message are provided
    if (!phone || !message) {
      return res.status(400).json({ error: "Phone and message are required" });
    }

    // Format number into WhatsApp-compatible format
    const formattedPhone = "whatsapp:" + formatPhoneNumber(phone);

    // Initialize Twilio client and send message
    const client = twilio(accountSid, authToken);
    const sentMessage = await client.messages.create({
      from: whatsappFrom,
      to: formattedPhone,
      body: message,
    });

    // Respond with success and message SID
    res.json({ success: true, sid: sentMessage.sid });
  } catch (err) {
    console.error("Error sending WhatsApp message:", err);

    // Respond with error details
    res.status(500).json({
      error: "Failed to send WhatsApp message",
      details: err.message || err,
    });
  }
});

// Export router to use in server.js or app.js
module.exports = router;
