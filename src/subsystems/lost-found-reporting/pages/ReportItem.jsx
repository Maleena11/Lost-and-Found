import { useState, useEffect } from "react";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import axios from "axios";
import { getTempUser } from "../../../shared/utils/tempUserAuth"; // Import the temp user utility

export default function ReportItem() {
  const [formData, setFormData] = useState({
    itemType: "lost", // Default to lost item
    itemName: "",
    category: "student-id",
    description: "",
    location: "",
    faculty: "",
    department: "",
    building: "",
    yearGroup: "",
    dateTime: "",
    images: [],
    contactInfo: {
      name: "",
      phone: "",
      email: "",
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Get the temporary user when component mounts
  const [tempUser, setTempUser] = useState(null);

  useEffect(() => {
    // Get or create temporary user ..
    const user = getTempUser();
    setTempUser(user);

    // Pre-fill contact info with temp user data
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        name: user.name || "",
        email: user.email || "",
        phone: prev.contactInfo.phone
      }
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      // Handle nested objects like contactInfo.name
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    // Process each file to create base64 strings
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
    .then(base64Images => {
      setFormData(prev => ({
        ...prev,
        images: [...base64Images]
      }));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: "", type: "" });

    try {
      if (!tempUser) {
        throw new Error("User information not available");
      }

      // Add the current timestamp if not provided
      const dataToSubmit = {
        ...formData,
        userId: tempUser.id, // Use the temp user ID
        dateTime: formData.dateTime || new Date().toISOString()
      };

      const response = await axios.post('http://localhost:3001/api/lost-found', dataToSubmit);

      setMessage({
        text: `${formData.itemType === 'lost' ? 'Lost' : 'Found'} item reported successfully!`,
        type: "success"
      });

      // Reset the form after successful submission but keep user contact info
      setFormData({
        itemType: "lost",
        itemName: "",
        category: "student-id",
        description: "",
        location: "",
        faculty: "",
        department: "",
        building: "",
        yearGroup: "",
        dateTime: "",
        images: [],
        contactInfo: {
          name: tempUser.name || "",
          phone: formData.contactInfo.phone,
          email: tempUser.email || "",
        }
      });
    } catch (error) {
      setMessage({
        text: error.response?.data?.error || error.message || "Failed to submit report. Please try again.",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <span className="text-white font-medium">Report Item</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Lost & Found Report</h1>
          <p className="text-blue-200 text-sm">
            Submit a report to help reunite lost items with their owners across campus.
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
              <h2 className="text-base font-semibold text-gray-800 mb-1">What would you like to report?</h2>
              <p className="text-xs text-gray-500 mb-4">Select whether you lost an item or found one on campus.</p>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.itemType === 'lost'
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="itemType"
                    value="lost"
                    checked={formData.itemType === "lost"}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <i className={`fas fa-search-minus text-2xl mb-2 ${formData.itemType === 'lost' ? 'text-red-500' : 'text-gray-300'}`}></i>
                  <span className={`font-semibold text-sm ${formData.itemType === 'lost' ? 'text-red-700' : 'text-gray-500'}`}>I Lost an Item</span>
                  <span className="text-xs mt-1 text-gray-400 text-center">Report something you've lost</span>
                </label>

                <label className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.itemType === 'found'
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="itemType"
                    value="found"
                    checked={formData.itemType === "found"}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <i className={`fas fa-hand-holding text-2xl mb-2 ${formData.itemType === 'found' ? 'text-green-500' : 'text-gray-300'}`}></i>
                  <span className={`font-semibold text-sm ${formData.itemType === 'found' ? 'text-green-700' : 'text-gray-500'}`}>I Found an Item</span>
                  <span className="text-xs mt-1 text-gray-400 text-center">Report something you've found</span>
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
                  <p className="text-xs text-gray-400">Provide as much detail as possible to improve matching</p>
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
                    <p className="text-xs text-gray-400 mt-1">Leave blank to use current time</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-university text-indigo-500 text-sm"></i>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-800">Academic Information</h2>
                  <p className="text-xs text-gray-400">Helps identify incident hotspots and patterns (optional)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Faculty */}
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Faculty</label>
                  <select
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select faculty (optional)</option>
                    <option value="Computing">Faculty of Computing</option>
                    <option value="Engineering">Faculty of Engineering</option>
                    <option value="Business">Faculty of Business</option>
                    <option value="Humanities & Sciences">Faculty of Humanities &amp; Sciences</option>
                    <option value="Architecture">Faculty of Architecture</option>
                    <option value="Medicine">Faculty of Medicine</option>
                    <option value="Law">Faculty of Law</option>
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select department (optional)</option>
                    <optgroup label="Computing">
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Information Systems">Information Systems</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Data Science">Data Science</option>
                    </optgroup>
                    <optgroup label="Engineering">
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Electronics">Electronics</option>
                    </optgroup>
                    <optgroup label="Business">
                      <option value="Business Management">Business Management</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                      <option value="Accounting">Accounting</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="Human Sciences">Human Sciences</option>
                      <option value="Architecture & Design">Architecture &amp; Design</option>
                      <option value="Medicine & Surgery">Medicine &amp; Surgery</option>
                      <option value="Law">Law</option>
                    </optgroup>
                  </select>
                </div>

                {/* Building */}
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Campus Building / Area</label>
                  <select
                    name="building"
                    value={formData.building}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select building (optional)</option>
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
                </div>

                {/* Year Group */}
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Year Group</label>
                  <select
                    name="yearGroup"
                    value={formData.yearGroup}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select year group (optional)</option>
                    <option value="Year 1">Year 1</option>
                    <option value="Year 2">Year 2</option>
                    <option value="Year 3">Year 3</option>
                    <option value="Year 4">Year 4</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Staff">Staff / Faculty</option>
                  </select>
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
                    value={formData.contactInfo.name}
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
                    value={formData.contactInfo.phone}
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
                  value={formData.contactInfo.email}
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
                  <h2 className="text-base font-semibold text-gray-800">Upload Images</h2>
                  <p className="text-xs text-gray-400">Photos help identify the item faster (optional)</p>
                </div>
              </div>

              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                <i className="fas fa-cloud-upload-alt text-3xl text-gray-300 mb-2"></i>
                <span className="text-sm text-gray-500 font-medium">Click to upload photos</span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG supported</span>
                <input type="file" onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
              </label>

              {formData.images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 md:grid-cols-4 gap-3">
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
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
                formData.itemType === 'lost'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Submitting Report...
                </>
              ) : (
                <>
                  <i className={`fas ${formData.itemType === 'lost' ? 'fa-search-minus' : 'fa-hand-holding'}`}></i>
                  Submit {formData.itemType === 'lost' ? 'Lost' : 'Found'} Item Report
                </>
              )}
            </button>

          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
