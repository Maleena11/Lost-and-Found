const OpenAI = require("openai");

// Initialize OpenAI with GitHub Models API
const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1-mini";

const openai = new OpenAI({ 
  baseURL: endpoint, 
  apiKey: token 
});

// Handle chat requests
const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
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
      timestamp: new Date().toISOString()
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
    
    res.status(500).json({ 
      reply: "I'm sorry, I'm having trouble responding right now. Please try again." 
    });
  }
};

module.exports = {
  handleChat
};