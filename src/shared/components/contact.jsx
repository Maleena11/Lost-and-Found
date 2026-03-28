import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    const formatted = name === "name"
      ? value.replace(/\b\w/g, (c) => c.toUpperCase())
      : value;
    setFormData({ ...formData, [name]: formatted });
  };

  const validateEmail = (value) => {
    const pattern = /^it\d{8}@my\.sliit\.lk$/;
    if (!pattern.test(value)) {
      setEmailError("Email must be in the format: it########@my.sliit.lk");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validateName = (value) => {
    const parts = value.trim().split(/\s+/);
    if (parts.length < 2 || parts[1] === "") {
      setNameError("Please enter both your first and last name.");
      return false;
    }
    setNameError("");
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateName(formData.name)) return;
    if (!validateEmail(formData.email)) return;
    setSubmitting(true);
    // Simulate submission delay
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1200);
  };

  const contactCards = [
    {
      icon: "fa-map-marker-alt",
      color: "bg-blue-100 text-blue-600",
      border: "border-t-4 border-t-blue-500",
      title: "Visit Us",
      lines: ["Student Services Building", "Ground Floor, Room 101", "University Campus"]
    },
    {
      icon: "fa-phone",
      color: "bg-green-100 text-green-600",
      border: "border-t-4 border-t-green-500",
      title: "Call Us",
      lines: ["+94 77 123 4567", "+94 11 234 5678", "Mon – Fri, 8AM – 6PM"]
    },
    {
      icon: "fa-envelope",
      color: "bg-orange-100 text-orange-600",
      border: "border-t-4 border-t-orange-400",
      title: "Email Us",
      lines: ["lostandfound@university.edu", "support@university.edu"]
    },
    {
      icon: "fa-clock",
      color: "bg-purple-100 text-purple-600",
      border: "border-t-4 border-t-purple-500",
      title: "Office Hours",
      lines: ["Monday – Friday: 8AM – 6PM", "Saturday: 9AM – 1PM", "Sunday: Closed"]
    }
  ];

  const faqs = [
    {
      icon: "fa-search",
      question: "How do I report a lost item?",
      answer: "Go to the Report Item page, fill in the details about your lost item, and submit. You'll be notified if a match is found."
    },
    {
      icon: "fa-hand-holding",
      question: "I found an item — what should I do?",
      answer: "Visit the Report Item page and select \"I Found an Item\". Provide details and location so the owner can claim it."
    },
    {
      icon: "fa-shield-alt",
      question: "How does the verification process work?",
      answer: "Visit the Verification page, select the found item that matches yours, and submit your ownership proof. Bring your Student ID when collecting."
    },
    {
      icon: "fa-bell",
      question: "How will I be notified about my item?",
      answer: "We will contact you via the email or phone number you provided in your report when a matching item is found."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50">
      <Header />

      {/* Page Banner */}
      <div className="relative overflow-hidden text-white" style={{ background: "linear-gradient(135deg, #0f1f4d 0%, #162660 40%, #1a1050 100%)" }}>
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #34d399, #60a5fa, #a78bfa, #f472b6, #34d399)", backgroundSize: "200% 100%", animation: "shimmer 4s linear infinite" }} />
        <style>{`@keyframes shimmer { 0%{background-position:0% 0%} 100%{background-position:200% 0%} }`}</style>
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ background: "linear-gradient(120deg, transparent 30%, white 50%, transparent 70%)" }} />

        <div className="max-w-7xl mx-auto px-6 py-10 relative">
          <div className="flex items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-blue-300 text-xs mb-4">
                <i className="fas fa-home text-[10px]"></i>
                <span>Home</span>
                <i className="fas fa-chevron-right text-[10px]"></i>
                <span className="text-white font-semibold">Contact</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-[11px] font-semibold text-blue-200 mb-3 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                Student Services
              </div>
              <h1 className="text-4xl font-extrabold mb-2 tracking-tight leading-tight">
                Get in<br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #6ee7b7, #5eead4)" }}>
                  Touch
                </span>
              </h1>
              <p className="text-blue-200 text-sm max-w-xl leading-relaxed mt-1">
                Have a question or need help? We're here for you. Reach out and our team will respond promptly.
              </p>
              <div className="flex flex-wrap gap-2.5 mt-5">
                {[
                  { icon: "fa-map-marker-alt", text: "Visit Us",     color: "text-amber-300"  },
                  { icon: "fa-phone",          text: "Call Us",      color: "text-blue-300"   },
                  { icon: "fa-envelope",       text: "Email Us",     color: "text-emerald-300"},
                  { icon: "fa-clock",          text: "Office Hours", color: "text-violet-300" },
                ].map(({ icon, text, color }) => (
                  <div key={text} className="flex items-center gap-2 bg-white/10 hover:bg-white/[0.15] transition-colors border border-white/10 rounded-lg px-3 py-1.5 text-xs backdrop-blur-sm">
                    <i className={`fas ${icon} ${color} text-[11px]`}></i>
                    <span className="text-white/90">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex flex-col items-center gap-4 flex-shrink-0">
              <div className="relative">
                <div className="w-36 h-36 rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl shadow-black/40 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <i className="fas fa-headset text-white/80 text-5xl"></i>
                </div>
                <div className="absolute -top-2 -right-2 w-9 h-9 bg-green-400 rounded-full flex items-center justify-center shadow-lg border-2 border-green-300">
                  <i className="fas fa-check text-white text-sm"></i>
                </div>
                <div className="absolute -bottom-2 -left-2 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-md border-2 border-amber-300">
                  <i className="fas fa-star text-white text-[10px]"></i>
                </div>
              </div>
              <div className="text-center">
                <p className="text-blue-300 text-[11px] font-bold tracking-widest uppercase">We're Here to Help</p>
                <p className="text-white/50 text-[10px] mt-0.5">Mon – Fri, 8am – 5pm</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-10 max-w-6xl mx-auto w-full">

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {contactCards.map((card, i) => (
            <div key={i} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 ${card.border}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${card.color}`}>
                <i className={`fas ${card.icon} text-base`}></i>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{card.title}</p>
                {card.lines.map((line, j) => (
                  <p key={j} className="text-sm text-gray-700 leading-relaxed">{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Main content: Form + FAQ side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Contact Form */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 border-l-4 border-l-blue-500 border-r-4 border-r-blue-500">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-paper-plane text-blue-600 text-sm"></i>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800">Send Us a Message</h2>
                <p className="text-xs text-gray-400">We'll get back to you within 24 hours</p>
              </div>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-check-circle text-3xl text-green-500"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Message Sent!</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Thank you for reaching out. Our team will review your message and get back to you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <i className="fas fa-arrow-left text-xs"></i>
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => { handleChange(e); if (nameError) validateName(e.target.value); }}
                      onBlur={(e) => validateName(e.target.value)}
                      required
                      placeholder="Your full name"
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${nameError ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                    />
                    {nameError && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i>
                        {nameError}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      University Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => { handleChange(e); if (emailError) validateEmail(e.target.value); }}
                      onBlur={(e) => validateEmail(e.target.value)}
                      required
                      placeholder="it########@my.sliit.lk"
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${emailError ? "border-red-400 bg-red-50" : "border-gray-200"}`}
                    />
                    {emailError && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i>
                        {emailError}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">— Select a subject —</option>
                    <option value="general">General Inquiry</option>
                    <option value="lost-item">Lost Item Inquiry</option>
                    <option value="found-item">Found Item Inquiry</option>
                    <option value="verification">Verification / Claim Process</option>
                    <option value="technical">Technical Support</option>
                    <option value="feedback">Feedback / Suggestion</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={(e) => { if (e.target.value.length <= 300) handleChange(e); }}
                    required
                    rows="5"
                    maxLength={300}
                    placeholder="Describe your inquiry in detail..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{formData.message.length}/300</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 transition-all duration-200 shadow-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* FAQ / Quick Help */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Quick Help header card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 border-t-4 border-t-orange-400">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-question-circle text-orange-500 text-sm"></i>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-800">Quick Help</h2>
                  <p className="text-xs text-gray-400">Common questions answered</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {faqs.map((faq, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className={`fas ${faq.icon} text-gray-500 text-xs`}></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-0.5">{faq.question}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency notice */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <i className="fas fa-shield-alt text-blue-200"></i>
                <h3 className="font-semibold text-sm">Need Urgent Help?</h3>
              </div>
              <p className="text-xs text-blue-200 mb-4 leading-relaxed">
                For urgent lost item cases (e.g. Student ID, important documents), visit us in person at the Student Services Office during working hours.
              </p>
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                <i className="fas fa-map-marker-alt text-blue-300 text-xs"></i>
                <span className="text-xs text-blue-100">Student Services Building, Room 101</span>
              </div>
            </div>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
