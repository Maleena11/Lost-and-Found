import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import axios from "axios";
import { getTempUser } from "../../../shared/utils/tempUserAuth";

export default function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tempUser, setTempUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [errors, setErrors] = useState({});

  // One ref per image slot for replace functionality
  const replaceInputRefs = [useRef(null), useRef(null)];

  const [formData, setFormData] = useState({
    itemType: "",
    itemName: "",
    category: "",
    description: "",
    location: "",
    dateTime: "",
    images: [],
    contactInfo: {
      name: "",
      phone: "",
      email: "",
    }
  });

  useEffect(() => {
    const user = getTempUser();
    setTempUser(user);
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/lost-found/${id}`);
      const item = response.data.data;

      const user = getTempUser();
      if (item.userId !== user.id) {
        throw new Error("You don't have permission to edit this item");
      }

      const dateObj = new Date(item.dateTime);
      const formattedDate = dateObj.toISOString().slice(0, 16);

      setFormData({
        ...item,
        dateTime: formattedDate
      });

    } catch (err) {
      console.error("Error fetching item:", err);
      setError(err.message || "Failed to load item details");
      setTimeout(() => navigate('/notice'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (key) => {
    if (errors[key]) setErrors(prev => { const e = { ...prev }; delete e[key]; return e; });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) newErrors.description = "Description is required.";
    if (!formData.location.trim()) newErrors.location = "Campus location is required.";

    if (!formData.contactInfo.name.trim()) {
      newErrors.contactName = "Full name is required.";
    } else if (formData.contactInfo.name.trim().split(/\s+/).length < 2) {
      newErrors.contactName = "Please enter your first and last name.";
    }
    if (!formData.contactInfo.phone.trim()) {
      newErrors.contactPhone = "Phone number is required.";
    } else if (formData.contactInfo.phone.length !== 10) {
      newErrors.contactPhone = "Phone number must be exactly 10 digits.";
    }
    if (!formData.contactInfo.email.trim()) {
      newErrors.contactEmail = "University email is required.";
    } else if (!/^it\d{8}@my\.sliit\.lk$/.test(formData.contactInfo.email)) {
      newErrors.contactEmail = "Email must be in the format: it12345678@my.sliit.lk";
    }

    if (!formData.images || formData.images.length === 0) {
      newErrors.images = "Please upload at least one image.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
      const errorKey = { "contactInfo.name": "contactName", "contactInfo.phone": "contactPhone", "contactInfo.email": "contactEmail" }[name];
      if (errorKey) clearError(errorKey);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      clearError(name);
    }
  };

  // Add images up to maximum of 2
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 2 - formData.images.length;
    if (remaining <= 0) return;

    const filesToProcess = files.slice(0, remaining);

    Promise.all(
      filesToProcess.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }))
    ).then(base64Images => {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...base64Images]
      }));
      clearError("images");
    });

    e.target.value = "";
  };

  // Replace a specific image by index
  const handleReplaceImage = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData(prev => {
        const updated = [...prev.images];
        updated[index] = ev.target.result;
        return { ...prev, images: updated };
      });
      clearError("images");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!validateForm()) {
      setMessage({ text: "Please fill in all required fields before saving.", type: "error" });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!tempUser) throw new Error("User information not available");

      const updateData = { ...formData, userId: tempUser.id };
      await axios.put(`http://localhost:3001/api/lost-found/${id}`, updateData);

      setMessage({ text: "Item updated successfully!", type: "success" });
      setTimeout(() => navigate('/notice'), 2000);
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || err.message || "Failed to update item",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-gray-50">
        <Header />
        <main className="flex-1 w-full flex justify-center items-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-sm text-gray-500">Loading item details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-gray-50">
        <Header />
        <main className="flex-1 w-full flex justify-center items-center p-6">
          <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-red-700 text-center max-w-md">
            <i className="fas fa-exclamation-circle text-3xl mb-3 text-red-400"></i>
            <p className="font-semibold">{error}</p>
            <p className="mt-2 text-sm text-red-400">Redirecting to notices page...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50">
      <Header />

      {/* Page Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-blue-200 text-sm mb-2">
            <i className="fas fa-home text-xs"></i>
            <span>Home</span>
            <i className="fas fa-chevron-right text-xs"></i>
            <span>Notice</span>
            <i className="fas fa-chevron-right text-xs"></i>
            <span className="text-white font-medium">Edit Item</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">
            Edit {formData.itemType === 'lost' ? 'Lost' : 'Found'} Item Report
          </h1>
          <p className="text-blue-200 text-sm">
            Update the details of your previously submitted report.
          </p>
        </div>
      </div>

      <main className="flex-1 w-full flex justify-center items-start px-4 py-8">
        <div className="w-full max-w-3xl">

          {/* Alert Message */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <i className={`fas ${message.type === 'success' ? 'fa-check-circle text-green-500' : 'fa-exclamation-circle text-red-500'} mt-0.5 flex-shrink-0`}></i>
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Report Type — read-only display */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-1">Report Type</h2>
              <p className="text-xs text-gray-400 mb-4">Report type cannot be changed after submission.</p>
              <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 w-fit ${
                formData.itemType === 'lost'
                  ? 'border-red-300 bg-red-50'
                  : 'border-green-300 bg-green-50'
              }`}>
                <i className={`fas ${formData.itemType === 'lost' ? 'fa-search-minus text-red-500' : 'fa-hand-holding text-green-500'} text-xl`}></i>
                <div>
                  <span className={`font-semibold text-sm ${formData.itemType === 'lost' ? 'text-red-700' : 'text-green-700'}`}>
                    {formData.itemType === 'lost' ? 'Lost Item' : 'Found Item'}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formData.itemType === 'lost' ? "Something you've lost" : "Something you've found"}
                  </p>
                </div>
                <i className="fas fa-lock text-gray-300 ml-3 text-sm"></i>
              </div>
            </div>

            {/* Item Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-tag text-blue-600 text-sm"></i>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-800">Item Details</h2>
                  <p className="text-xs text-gray-400">Item name and category cannot be changed after submission.</p>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                {/* Item Name */}
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="itemName"
                    value={formData.itemName}
                    disabled
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    disabled
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  >
                    <option value="">Select a category</option>
                    <option value="student-id">Student ID / Access Card</option>
                    <option value="laptop-tablet">Laptop / Tablet</option>
                    <option value="books-notes">Books & Lecture Notes</option>
                    <option value="stationery">Stationery / USB Drive</option>
                    <option value="electronics">Electronics</option>
                    <option value="lab-equipment">Lab Equipment</option>
                    <option value="sports-equipment">Sports Equipment</option>
                    <option value="clothing">Clothing</option>
                    <option value="jewelry">Jewelry / Accessories</option>
                    <option value="keys">Keys</option>
                    <option value="wallet">Wallet / Purse</option>
                    <option value="documents">Documents / Certificates</option>
                    <option value="water-bottle">Water Bottle / Lunch Box</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${errors.description ? 'border-red-400' : 'border-gray-200'}`}
                    placeholder="Please describe the item in detail (color, brand, markings, student ID number, etc.)"
                  />
                  {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                </div>

                {/* Location & DateTime */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Campus Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${errors.location ? 'border-red-400' : 'border-gray-200'}`}
                    >
                      <option value="">Select location</option>
                      <option value="Main Library">Main Library</option>
                      <option value="Block A">Block A</option>
                      <option value="Block B">Block B</option>
                      <option value="Block C">Block C</option>
                      <option value="Lab Block">Lab Block</option>
                      <option value="Lecture Hall Complex">Lecture Hall Complex</option>
                      <option value="Canteen / Cafeteria">Canteen / Cafeteria</option>
                      <option value="Sports Complex">Sports Complex</option>
                      <option value="Admin Building">Admin Building</option>
                      <option value="Auditorium">Auditorium</option>
                      <option value="Student Center">Student Center</option>
                      <option value="Parking Area">Parking Area</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      name="dateTime"
                      value={formData.dateTime}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-user text-orange-500 text-sm"></i>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-800">Student Contact Information</h2>
                  <p className="text-xs text-gray-400">So we can reach you when a match is found</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactInfo.name"
                    value={formData.contactInfo.name || ""}
                    onChange={(e) => {
                      const regex = /^[a-zA-Z0-9!@#$%^&*()_+={}\[\]:;"'<>.,?/ -]*$/;
                      if (regex.test(e.target.value)) handleChange(e);
                    }}
                    placeholder="Your full name"
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.contactName ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {errors.contactName && <p className="mt-1 text-xs text-red-500">{errors.contactName}</p>}
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contactInfo.phone"
                    value={formData.contactInfo.phone || ""}
                    onChange={(e) => {
                      const regex = /^[0-9]{0,10}$/;
                      if (regex.test(e.target.value)) handleChange(e);
                    }}
                    placeholder="07X XXX XXXX"
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.contactPhone ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {errors.contactPhone && <p className="mt-1 text-xs text-red-500">{errors.contactPhone}</p>}
                </div>
              </div>
              <div className="mt-5">
                <label className="block mb-1.5 text-sm font-medium text-gray-700">
                  University Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="contactInfo.email"
                  value={formData.contactInfo.email || ""}
                  onChange={(e) => {
                    const regex = /^[a-zA-Z0-9@.]*$/;
                    if (regex.test(e.target.value)) handleChange(e);
                  }}
                  placeholder="it12345678@my.sliit.lk"
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.contactEmail ? 'border-red-400' : 'border-gray-200'}`}
                />
                {errors.contactEmail && <p className="mt-1 text-xs text-red-500">{errors.contactEmail}</p>}
              </div>
            </div>

            {/* Image Upload Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-camera text-purple-500 text-sm"></i>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-800">
                    Item Images <span className="text-red-500">*</span>
                  </h2>
                  <p className="text-xs text-gray-400">Maximum 2 images. Click an image to replace it.</p>
                </div>
              </div>

              {/* Upload area — only shown when fewer than 2 images */}
              {formData.images.length < 2 && (
                <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all ${errors.images ? 'border-red-400' : 'border-gray-300'}`}>
                  <i className="fas fa-cloud-upload-alt text-3xl text-gray-300 mb-2"></i>
                  <span className="text-sm text-gray-500 font-medium">Click to upload photos</span>
                  <span className="text-xs text-gray-400 mt-1">
                    PNG, JPG, JPEG — {2 - formData.images.length} slot{2 - formData.images.length !== 1 ? 's' : ''} remaining
                  </span>
                  <input
                    type="file"
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                </label>
              )}

              {errors.images && <p className="mt-2 text-xs text-red-500">{errors.images}</p>}

              {/* Image previews */}
              {formData.images && formData.images.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
                    Current Images ({formData.images.length}/2)
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative w-28 h-28 rounded-xl overflow-hidden border border-gray-200 group">
                        <img
                          src={img}
                          alt={`Preview ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {/* Overlay actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {/* Replace button */}
                          <label
                            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center cursor-pointer hover:bg-white transition-colors"
                            title="Replace image"
                          >
                            <i className="fas fa-sync-alt text-blue-600 text-xs"></i>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={replaceInputRefs[index]}
                              onChange={(e) => handleReplaceImage(e, index)}
                            />
                          </label>
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                            title="Remove image"
                          >
                            <i className="fas fa-trash text-red-500 text-xs"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Hover over an image to replace or remove it.</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/notice')}
                className="flex-1 py-4 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <i className="fas fa-arrow-left"></i>
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Save Changes
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
