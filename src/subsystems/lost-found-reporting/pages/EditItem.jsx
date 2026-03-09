import { useState, useEffect } from "react";
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
    // Get the temporary user
    const user = getTempUser();
    setTempUser(user);

    // Fetch the item details
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/lost-found/${id}`);
      const item = response.data.data;

      // Verify the current user owns this item
      const user = getTempUser();
      if (item.userId !== user.id) {
        throw new Error("You don't have permission to edit this item");
      }

      // Format the date for the datetime-local input
      const dateObj = new Date(item.dateTime);
      const formattedDate = dateObj.toISOString().slice(0, 16); // Format: "YYYY-MM-DDThh:mm"

      setFormData({
        ...item,
        dateTime: formattedDate
      });

    } catch (err) {
      console.error("Error fetching item:", err);
      setError(err.message || "Failed to load item details");
      // Redirect to notices page after a delay if there's an error
      setTimeout(() => navigate('/notice'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      // Handle nested objects like contactInfo.name
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = (e) => {
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
    .then(newImages => {
      setFormData(prev => ({
        ...prev,
        images: [...newImages] // Replace with new images
      }));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!tempUser) {
        throw new Error("User information not available");
      }

      // Prepare the update data
      const updateData = {
        ...formData,
        userId: tempUser.id // Include userId for permission check
      };

      const response = await axios.put(`http://localhost:3001/api/lost-found/${id}`, updateData);

      setMessage({
        text: "Item updated successfully!",
        type: "success"
      });

      // Redirect after successful update
      setTimeout(() => navigate('/notice'), 2000);
    } catch (error) {
      setMessage({
        text: error.response?.data?.error || error.message || "Failed to update item",
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

            {/* Report Type Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-1">Report Type</h2>
              <p className="text-xs text-gray-500 mb-4">Update whether this is a lost or found item report.</p>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.itemType === 'lost'
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    id="lostItem"
                    name="itemType"
                    value="lost"
                    checked={formData.itemType === "lost"}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <i className={`fas fa-search-minus text-2xl mb-2 ${formData.itemType === 'lost' ? 'text-red-500' : 'text-gray-300'}`}></i>
                  <span className={`font-semibold text-sm ${formData.itemType === 'lost' ? 'text-red-700' : 'text-gray-500'}`}>Lost Item</span>
                  <span className="text-xs mt-1 text-gray-400 text-center">Something you've lost</span>
                </label>

                <label className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.itemType === 'found'
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    id="foundItem"
                    name="itemType"
                    value="found"
                    checked={formData.itemType === "found"}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <i className={`fas fa-hand-holding text-2xl mb-2 ${formData.itemType === 'found' ? 'text-green-500' : 'text-gray-300'}`}></i>
                  <span className={`font-semibold text-sm ${formData.itemType === 'found' ? 'text-green-700' : 'text-gray-500'}`}>Found Item</span>
                  <span className="text-xs mt-1 text-gray-400 text-center">Something you've found</span>
                </label>
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
                  <p className="text-xs text-gray-400">Update the information about this item</p>
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
                    onChange={(e) => {
                      const regex = /^[a-zA-Z0-9 ]*$/;
                      if (regex.test(e.target.value)) handleChange(e);
                    }}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Blue Samsung Laptop, Student ID Card, Black Wallet"
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
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
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
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Please describe the item in detail (color, brand, markings, student ID number, etc.)"
                  />
                </div>

                {/* Location & DateTime */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Campus Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g. Library, Block A, Canteen, Lab"
                    />
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
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    name="contactInfo.name"
                    value={formData.contactInfo.name || ""}
                    onChange={(e) => {
                      const regex = /^[a-zA-Z0-9!@#$%^&*()_+={}\[\]:;"'<>.,?/-]*$/;
                      if (regex.test(e.target.value)) handleChange(e);
                    }}
                    placeholder="Your full name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    name="contactInfo.phone"
                    value={formData.contactInfo.phone || ""}
                    onChange={(e) => {
                      const regex = /^[0-9]{0,10}$/;
                      if (regex.test(e.target.value)) handleChange(e);
                    }}
                    placeholder="07X XXX XXXX"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-5">
                <label className="block mb-1.5 text-sm font-medium text-gray-700">University Email</label>
                <input
                  type="email"
                  name="contactInfo.email"
                  value={formData.contactInfo.email || ""}
                  onChange={(e) => {
                    const regex = /^[a-zA-Z0-9@.]*$/;
                    if (regex.test(e.target.value)) handleChange(e);
                  }}
                  placeholder="yourname@university.edu"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Image Upload Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-camera text-purple-500 text-sm"></i>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-800">Item Images</h2>
                  <p className="text-xs text-gray-400">Uploading new images will replace the existing ones</p>
                </div>
              </div>

              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                <i className="fas fa-cloud-upload-alt text-3xl text-gray-300 mb-2"></i>
                <span className="text-sm text-gray-500 font-medium">Click to upload new photos</span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG supported</span>
                <input type="file" onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
              </label>

              {formData.images && formData.images.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Current Images</p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative rounded-xl overflow-hidden border border-gray-200">
                        <img
                          src={img}
                          alt={`Preview ${index + 1}`}
                          className="h-24 w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
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
