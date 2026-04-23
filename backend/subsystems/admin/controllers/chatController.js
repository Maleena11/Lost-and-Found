const OpenAI = require("openai");

// Initialize OpenAI with GitHub Models API
const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1-mini";

const openai = token
  ? new OpenAI({
      baseURL: endpoint,
      apiKey: token
    })
  : null;

function normalizeMessage(rawMessage = "") {
  return rawMessage
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(message, keywords) {
  return keywords.some((keyword) => message.includes(keyword));
}

function buildFallbackReply(rawMessage = "") {
  const message = normalizeMessage(rawMessage);

  if (!message) {
    return "Please type a message and I will help you with lost and found questions.";
  }

  if (/\b(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(message)) {
    return "Hello! I can help you report a lost item, report a found item, or explain how to check the item board.";
  }

  if (message.includes("lost")) {
    return "If you lost an item, open the report item page and submit the item name, category, last known location, date, and any identifying details.";
  }

  if (message.includes("found")) {
    return "If you found an item, please create a report with the item details, where it was found, when it was found, and a clear description or photo if available.";
  }

  if (
    includesAny(message, [
      "claim",
      "claims",
      "collect",
      "collection",
      "verify",
      "verified",
      "verification",
      "varification",
      "ownership",
      "owner",
      "proof"
    ])
  ) {
    return "To verify and claim an item: 1. Open the matching found item listing. 2. Submit your claim with your name, email, phone number, and item details. 3. Add proof of ownership such as identifying marks, receipts, or other unique details. 4. Wait for admin review and approval. 5. If approved, use the collection instructions or PIN provided to receive the item.";
  }

  if (message.includes("notice") || message.includes("board")) {
    return "You can use the notice or item board sections to review reported items and check whether a matching item has already been posted.";
  }

  return "I can help with lost item reports, found item reports, notices, and claim verification. Tell me what happened and I will guide you.";
}

// Handle chat requests
const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!openai) {
      return res.json({
        reply: buildFallbackReply(message),
        timestamp: new Date().toISOString(),
        source: "fallback"
      });
    }

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant for a Lost and Found System. Help users with questions about lost items, found items, and general inquiries about the system."
        },
        {
          role: "user", 
          content: message
        }
      ]
    });
    
    res.json({ 
      reply: response.choices[0].message.content,
      timestamp: new Date().toISOString(),
      source: "openai"
    });
  } catch (err) {
    console.error("Chat error:", err);

    if (err.code === 'insufficient_quota') {
      return res.status(429).json({ 
        reply: "I'm currently unavailable due to quota limits. Please try again later." 
      });
    }
    
    if (err.code === 'invalid_api_key') {
      return res.status(500).json({ 
        reply: "Chat service is temporarily unavailable." 
      });
    }

    res.json({
      reply: buildFallbackReply(req.body?.message),
      timestamp: new Date().toISOString(),
      source: "fallback"
    });
  }
};

module.exports = {
  buildFallbackReply,
  handleChat,
  normalizeMessage
};
