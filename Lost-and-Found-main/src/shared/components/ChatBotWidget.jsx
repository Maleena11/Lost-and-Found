import { useState } from "react";
import axios from "axios";

export default function ChatBot() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! I am your Lost & Found assistant. How can I help you?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { sender: "user", text: input }]);
    const userMessage = input;
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:3001/chat", { message: userMessage });
      const botReply = res.data.reply || "Sorry, I didn't understand that.";
      setMessages(prev => [...prev, { sender: "bot", text: botReply }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: "bot", text: "Error connecting to server." }]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 w-80 bg-white border-2 border-gray-400 rounded-lg shadow-lg flex flex-col z-50">
      <div className="p-3 flex-1 overflow-y-auto max-h-96 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-md ${
              msg.sender === "bot" ? "bg-gray-200 text-black text-left" : "bg-gray-800 text-white text-right"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="flex border-t border-gray-200">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 outline-none rounded-l-md bg-white text-gray-800 placeholder-gray-400"
          onKeyDown={e => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="bg-gray-900 text-white px-4 rounded-r-md hover:bg-gray-700 transition"
          disabled={loading}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
