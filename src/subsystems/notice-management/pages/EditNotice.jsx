import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from '../../../shared/components/Header';
import Footer from '../../../shared/components/Footer';
import { getTempUser } from "../../../shared/utils/tempUserAuth";

export default function EditNotice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [tempUser, setTempUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateError, setDateError] = useState(null); // Add this state if not present
  const [phoneError, setPhoneError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
    priority: "medium",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    targetAudience: "all-users",
    attachments: [],
    contactPhone: "",
    contactEmail: ""
  });

  useEffect(() => {
    // Get the temporary user
    const user = getTempUser();
    setTempUser(user);

    // If notice was passed via location state, use it
    if (location.state && location.state.notice) {
      const notice = location.state.notice;
      
      // Verify the current user owns this notice
      if (user && (notice.postedBy === user.id || notice.userId === user.id || user.role === 'admin')) {
        setFormData({
          title: notice.title || '',
          content: notice.content || '',
          category: notice.category || 'general',
          priority: notice.priority || 'medium',
          startDate: notice.startDate ? new Date(notice.startDate).toISOString().split('T')[0] : '',
          endDate: notice.endDate ? new Date(notice.endDate).toISOString().split('T')[0] : '',
          targetAudience: notice.targetAudience || 'all-users',
          attachments: notice.attachments || [],
          contactPhone: notice.contactPhone || "",
          contactEmail: notice.contactEmail || ""
        });
        setLoading(false);
      } else {
        setError("You don't have permission to edit this notice");
        // Redirect to notices page after a delay if there's a permission error
        setTimeout(() => navigate('/notice'), 3000);
      }
    } else {
      // Otherwise fetch the notice data from the API
      fetchNotice();
    }
  }, [id, location.state, navigate]);

  const fetchNotice = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/notices/${id}`);
      const notice = response.data.data;
      
      // Verify the current user owns this notice
      const user = getTempUser();
      if (!user || (notice.postedBy !== user.id && notice.userId !== user.id && user.role !== 'admin')) {
        throw new Error("You don't have permission to edit this notice");
      }
      
      setFormData({
        title: notice.title || '',
        content: notice.content || '',
        category: notice.category || 'general',
        priority: notice.priority || 'medium',
        startDate: notice.startDate ? new Date(notice.startDate).toISOString().split('T')[0] : '',
        endDate: notice.endDate ? new Date(notice.endDate).toISOString().split('T')[0] : '',
        targetAudience: notice.targetAudience || 'all-users',
        attachments: notice.attachments || [],
        contactPhone: notice.contactPhone || "",
        contactEmail: notice.contactEmail || ""
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching notice:', err);
      setError(err.message || 'Failed to load notice data. Please try again.');
      // Redirect to notices page after a delay if there's an error
      setTimeout(() => navigate('/notice'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneBlur = () => {
    if (formData.contactPhone && formData.contactPhone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits.");
    } else {
      setPhoneError(null);
    }
  };

  const handleEmailBlur = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.contactEmail && !emailRegex.test(formData.contactEmail)) {
      setEmailError("Enter a valid email address (e.g. user@example.com).");
    } else {
      setEmailError(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    // Phone number validation: only digits, max 10
    if (name === "contactPhone") {
      if (!/^\d*$/.test(value)) return; // block non-digits
      if (value.length > 10) return;    // block more than 10 digits
      setPhoneError(null);
    }

    // Email validation: clear error while user is typing
    if (name === "contactEmail") {
      setEmailError(null);
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

    setFormData(newFormData);
    setDateError(null);
    setError && setError(null);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
      Promise.all(
        files.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
        })
      ).then(fileData => {
        setFormData({
          ...formData,
          attachments: [...formData.attachments, ...fileData]
        });
      });
    }
  };

  const removeAttachment = (indexToRemove) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, index) => index !== indexToRemove)
    });
  };

  // Update the handleSubmit function with proper date handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    
    try {
      if (!tempUser) {
        throw new Error("User information not available");
      }

      // Validate contact phone
      if (formData.contactPhone && formData.contactPhone.length !== 10) {
        setPhoneError("Phone number must be exactly 10 digits.");
        setSubmitLoading(false);
        return;
      }

      // Validate contact email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.contactEmail && !emailRegex.test(formData.contactEmail)) {
        setEmailError("Enter a valid email address (e.g. user@example.com).");
        setSubmitLoading(false);
        return;
      }

      // Create a copy of the form data to modify
      const dataToSubmit = { ...formData };
      
      // Format startDate with time at the beginning of the day
      if (dataToSubmit.startDate) {
        const startDate = new Date(dataToSubmit.startDate);
        startDate.setUTCHours(0, 0, 0, 0);
        dataToSubmit.startDate = startDate.toISOString();
      }
      
      // Format endDate with time at the end of the day to ensure it's after startDate
      if (dataToSubmit.endDate) {
        const endDate = new Date(dataToSubmit.endDate);
        endDate.setUTCHours(23, 59, 59, 999);
        dataToSubmit.endDate = endDate.toISOString();
      } else {
        // If no end date is provided, remove it from the data to submit
        delete dataToSubmit.endDate;
      }
      
      // Add user IDs
      dataToSubmit.userId = tempUser.id;
      dataToSubmit.postedBy = tempUser.id;

      // Debug the payload before sending
      console.log("Updating notice with data:", dataToSubmit);

      const response = await axios.put(`http://localhost:3001/api/notices/${id}`, dataToSubmit);
      console.log("Update response:", response.data);
      
      navigate('/notice');
    } catch (err) {
      console.error('Error updating notice:', err);
      
      // Add better error reporting
      if (err.response && err.response.data) {
        console.error('Server error details:', err.response.data);
        setError(`Failed to update notice: ${err.response.data.error || 'Unknown server error'}`);
      } else {
        setError('Failed to update notice. Please try again.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Check if a string is a base64 image
  const isBase64Image = (str) => {
    if (!str) return false;
    return (
      str.startsWith('data:image/jpeg') || 
      str.startsWith('data:image/png') || 
      str.startsWith('data:image/gif') || 
      str.startsWith('data:image/webp') ||
      str.startsWith('data:image/svg')
    );
  };

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-gray-100 p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-gray-100 p-6 flex justify-center items-center">
          <div className="bg-red-100 p-4 rounded-lg text-red-700 text-center">
            <p>{error}</p>
            <p className="mt-2 text-sm">Redirecting to notices page...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-100 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center text-blue-800 mb-6">Edit Notice</h1>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 font-medium mb-2">Title*</label>
              {/* Title validation */}
              <input
                type="text"
                id="title"
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
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="category" className="block text-gray-700 font-medium mb-2">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="announcement">Announcement</option>
                  <option value="service-update">Service Update</option>
                  <option value="emergency">Emergency</option>
                  <option value="general">General</option>
                  <option value="advisory">Advisory</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="priority" className="block text-gray-700 font-medium mb-2">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="content" className="block text-gray-700 font-medium mb-2">Content*</label>
              {/* Content validation */}
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows="6"
                maxLength="1000" // Add character limit
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="startDate" className="block text-gray-700 font-medium mb-2">Start Date*</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min="2026-01-01"
                  required
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-gray-700 font-medium mb-2">End Date (Optional)</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="targetAudience" className="block text-gray-700 font-medium mb-2">Target Audience</label>
              <select
                id="targetAudience"
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all-users">All Users</option>
                <option value="passengers">Passengers</option>
                <option value="staff">Staff</option>
                <option value="drivers">Drivers</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  onBlur={handlePhoneBlur}
                  inputMode="numeric"
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${phoneError ? 'border-red-500' : 'border-gray-300'}`}
                  maxLength="10"
                  placeholder="e.g. 0771234567"
                />
                {phoneError && (
                  <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                )}
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Contact Email
                </label>
                <input
                  type="text"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  onBlur={handleEmailBlur}
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${emailError ? 'border-red-500' : 'border-gray-300'}`}
                  maxLength="100"
                  placeholder="e.g. user@example.com"
                />
                {emailError && (
                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}
              </div>
            </div>

            {/* Current attachments */}
            {formData.attachments.length > 0 && (
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Current Attachments</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.attachments.map((attachment, index) => (
                    <div key={index} className="relative group border border-gray-200 rounded-lg overflow-hidden">
                      {isBase64Image(attachment) ? (
                        <div className="h-32">
                          <img 
                            src={attachment} 
                            alt={`Attachment ${index + 1}`} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      ) : (
                        <div className="h-32 bg-gray-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                      
                      <button 
                        type="button" 
                        onClick={() => removeAttachment(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove attachment"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add new attachments */}
            <div className="mb-6">
              <label htmlFor="attachments" className="block text-gray-700 font-medium mb-2">Add New Attachments</label>
              <input
                type="file"
                id="attachments"
                name="attachments"
                onChange={handleFileChange}
                multiple
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Date error message */}
            {dateError && (
              <div className="col-span-2 text-red-600 text-sm mt-1">
                {dateError}
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => navigate('/notice')}
                disabled={submitLoading}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                {submitLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}