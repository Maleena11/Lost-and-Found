import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { getTempUser } from "../../../shared/utils/tempUserAuth"; // Adjust the import based on your project structure

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function CreateNotice() {
  const navigate = useNavigate();
  const location = useLocation();
  const repostNotice = location.state?.repost || null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  // Items that should be flagged as urgent
  const URGENT_ITEMS = ["student-id", "laptop", "mobile-phone", "atm-card", "license"];

  const [formData, setFormData] = useState({
    title: repostNotice?.title || "",
    content: repostNotice?.content || "",
    category: repostNotice?.category || "lost-item",
    itemType: repostNotice?.itemType || "",
    priority: repostNotice?.priority || "medium",
    startDate: getTodayString(),
    endDate: "",
    targetAudience: repostNotice?.targetAudience || "all-students",
    attachments: repostNotice?.attachments || [],
    contactPhone: repostNotice?.contactPhone || "",
    contactEmail: repostNotice?.contactEmail || ""
  });
  const [dateError, setDateError] = useState(null);
  const [errors, setErrors] = useState({ contactPhone: '', contactEmail: '' });

  const phoneInputRegex = /^\d*$/;
  const emailValidRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    // Phone: only digits allowed; show error if not exactly 10 digits
    if (name === "contactPhone") {
      if (!phoneInputRegex.test(value)) return;
      if (value.length !== 10) {
        setErrors(prev => ({ ...prev, contactPhone: 'Phone number must be exactly 10 digits' }));
      } else {
        setErrors(prev => ({ ...prev, contactPhone: '' }));
      }
    }

    // Email: clear error while typing
    if (name === "contactEmail") {
      setErrors(prev => ({ ...prev, contactEmail: '' }));
    }

    // Validate end date is not before start date
    if (name === 'startDate' && newFormData.endDate) {
      const startDate = new Date(value);
      const endDate = new Date(newFormData.endDate);
      if (endDate < startDate) {
        setDateError("End date cannot be before start date.");
        return;
      }
    }

    // Validate end date is not before start date
    if (name === 'endDate' && newFormData.startDate) {
      const startDate = new Date(newFormData.startDate);
      const endDate = new Date(value);
      if (endDate < startDate) {
        setDateError("End date cannot be before start date.");
        return;
      }
    }

    // Auto-set priority to urgent for high-priority item types
    if (name === "itemType" && URGENT_ITEMS.includes(value)) {
      newFormData.priority = "urgent";
    }

    setFormData(newFormData);
    setDateError(null);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'contactPhone') {
      if (value.length !== 10) {
        setErrors(prev => ({ ...prev, contactPhone: 'Phone number must be exactly 10 digits' }));
      } else {
        setErrors(prev => ({ ...prev, contactPhone: '' }));
      }
    }
    if (name === 'contactEmail' && value) {
      if (!emailValidRegex.test(value)) {
        setErrors(prev => ({ ...prev, contactEmail: 'Enter a valid email address (e.g. user@example.com)' }));
      }
    }
  };

  const removeAttachment = (idx) => {
    setFormData(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    Promise.all(
      files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    )
    .then(fileUrls => {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...fileUrls]
      }));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate contact fields before submitting
      const newErrors = { contactPhone: '', contactEmail: '' };
      if (formData.contactPhone) {
        if (formData.contactPhone.length !== 10) {
          newErrors.contactPhone = 'Phone number must be exactly 10 digits';
        }
      }
      if (formData.contactEmail) {
        if (!emailValidRegex.test(formData.contactEmail)) {
          newErrors.contactEmail = 'Enter a valid email address (e.g. user@example.com)';
        }
      }
      if (newErrors.contactPhone || newErrors.contactEmail) {
        setErrors(newErrors);
        setIsSubmitting(false);
        return;
      }

      // Get current user id
      const user = getTempUser();
      const userId = user ? user.id : "unknown";
      
      await axios.post('http://localhost:3001/api/notices', {
        ...formData,
        userId: userId,
        postedBy: userId // Send both fields for consistency
      });
      
      setMessage({
        text: "Notice created successfully!",
        type: "success"
      });
      
      setTimeout(() => {
        navigate('/notice');
      }, 1500);
    } catch (error) {
      console.error("Error creating notice:", error);
      setMessage({
        text: error.response?.data?.message || "Failed to create notice",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-100">
      <Header />
      
      <main className="flex-1 w-full flex justify-center items-start p-6">
        <div className="w-full max-w-3xl bg-white shadow-lg rounded-xl p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-blue-800">
              {repostNotice ? 'Repost Archived Notice' : 'Create Item Notice'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {repostNotice
                ? 'The form has been pre-filled from the archived notice. Set new dates and submit to repost.'
                : 'Staff portal — publish a notice for a reported lost or found item on campus'}
            </p>
          </div>

          {repostNotice && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="fas fa-redo text-purple-600 text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-800">Reposting archived notice</p>
                <p className="text-xs text-purple-600 mt-0.5">
                  All original details have been pre-filled. Please set a new <strong>Start Date</strong> and <strong>Expiry Date</strong> before submitting.
                </p>
              </div>
            </div>
          )}

          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Title */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Notice Title*
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={(e) => {
                  // Only allow letters, numbers, spaces and basic punctuation
                  const regex = /^[a-zA-Z0-9 .,!?:;'-]*$/;
                  if (regex.test(e.target.value)) {
                    handleChange(e);
                  }
                }}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                maxLength="100"
              />
            </div>

            {/* Notice Type */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Notice Type*
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="lost-item">Lost Item Notice</option>
                <option value="found-item">Found Item Notice</option>
                <option value="announcement">General Announcement</option>
                <option value="advisory">Campus Advisory</option>
              </select>
            </div>

            {/* Item Type */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Item Type*
              </label>
              <select
                name="itemType"
                value={formData.itemType}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="">— Select item type —</option>
                <option value="student-id">Student ID Card</option>
                <option value="laptop">Laptop / Tablet</option>
                <option value="mobile-phone">Mobile Phone</option>
                <option value="atm-card">ATM / Bank Card</option>
                <option value="license">Driving License / NIC</option>
                <option value="wallet">Wallet / Purse</option>
                <option value="keys">Keys</option>
                <option value="books">Books / Lecture Notes</option>
                <option value="stationery">Stationery / USB Drive</option>
                <option value="clothing">Clothing / Bag</option>
                <option value="other">Other</option>
              </select>
              {URGENT_ITEMS.includes(formData.itemType) && (
                <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                  <i className="fas fa-exclamation-triangle"></i>
                  High-priority item — priority has been set to <strong>Urgent</strong> automatically.
                </p>
              )}
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Priority*
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${
                  formData.priority === 'urgent' ? 'border-red-400 bg-red-50 text-red-700 font-semibold' : 'border-gray-300'
                }`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="urgent">Urgent</option>
              </select>
              <p className="mt-1.5 text-xs text-gray-400">
                Urgent items (Student IDs, Laptops, ATM Cards, Mobile Phones, Licenses) are highlighted prominently on the notice board.
              </p>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Target Audience*
              </label>
              <select
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="all-students">All Students</option>
                <option value="undergraduate">Undergraduate Students</option>
                <option value="postgraduate">Postgraduate Students</option>
                <option value="academic-staff">Academic Staff</option>
                <option value="non-academic-staff">Non-Academic Staff</option>
                <option value="all-university">All University Community</option>
              </select>
            </div>

            {/* Content */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Notice Content*
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows="6"
                required
                maxLength="1000" // Add character limit
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Start Date*
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min="2026-01-01"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Notice Expiry Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min="2026-01-01"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
            </div>

            {/* Item Images */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Item Images
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Attach images of the item to help students identify it quickly.
              </p>
              <input
                type="file"
                onChange={handleFileUpload}
                accept="image/*"
                multiple
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              {formData.attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.attachments.map((src, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={src}
                        alt={`preview ${idx + 1}`}
                        className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-300 hover:bg-gray-400 text-gray-600 rounded-full flex items-center justify-center shadow transition-colors"
                      >
                        <i className="fas fa-times text-[9px]"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* Contact Phone */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Contact Phone
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${errors.contactPhone ? 'border-red-400' : 'border-gray-300'}`}
                maxLength="10"
                inputMode="numeric"
                placeholder="e.g. 0771234567"
              />
              {errors.contactPhone && (
                <p className="mt-1 text-xs text-red-600">{errors.contactPhone}</p>
              )}
            </div>

            {/* Contact Email */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${errors.contactEmail ? 'border-red-400' : 'border-gray-300'}`}
                maxLength="100"
                placeholder="e.g. user@example.com"
              />
              {errors.contactEmail && (
                <p className="mt-1 text-xs text-red-600">{errors.contactEmail}</p>
              )}
            </div>

            {dateError && (
              <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg">
                {dateError}
              </div>
            )}

            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={() => navigate('/notice')}
                className="flex-1 bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 transition duration-300 font-semibold shadow-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold shadow-md disabled:bg-blue-300"
              >
                {isSubmitting ? "Creating Notice..." : "Create Notice"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}