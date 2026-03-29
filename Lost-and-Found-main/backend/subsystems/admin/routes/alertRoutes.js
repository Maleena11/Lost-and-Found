import express from "express";
import twilio from "twilio";

const router = express.Router();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send WhatsApp alert
router.post("/whatsapp", async (req, res) => {
  const { phone, message } = req.body;

  try {
    await client.messages.create({
      from: "whatsapp:" + process.env.TWILIO_PHONE,
      to: "whatsapp:" + phone,  // employee number with country code
      body: message,
    });

    res.json({ success: true, msg: "WhatsApp alert sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Error sending WhatsApp" });
  }
});

export default router;
