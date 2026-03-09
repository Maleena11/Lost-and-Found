import { useState, useEffect } from 'react';
import axios from 'axios';
import { getTempUser } from '../../../shared/utils/tempUserAuth';

export default function AdminNoticeEditModal({ notice, isOpen, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'medium',
    startDate: '',
    endDate: '',
    targetAudience: 'all-users',
    attachments: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [tempUser, setTempUser] = useState(null);
  const [dateError, setDateError] = useState(null); // Add this state if not present

  // Initialize form data when notice prop changes
  useEffect(() => {
    if (notice) {
      setFormData({
        title: notice.title || '',
        content: notice.content || '',
        category: notice.category || 'general',
        priority: notice.priority || 'medium',
        startDate: notice.startDate ? new Date(notice.startDate).toISOString().split('T')[0] : '',
        endDate: notice.endDate ? new Date(notice.endDate).toISOString().split('T')[0] : '',
        targetAudience: notice.targetAudience || 'all-users',
        attachments: notice.attachments || []
      });
      setError(null);
    }

    // Get the current user
    const user = getTempUser();
    setTempUser(user);
  }, [notice]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    // Validate start date is not in the past
    if (name === 'startDate') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(value);
      if (startDate < today) {
        setDateError("Start date cannot be before today.");
        return;
      }
      // If endDate exists, check if it's before new startDate
      if (newFormData.endDate) {
        const endDate = new Date(newFormData.endDate);
        if (endDate < startDate) {
          setDateError("End date cannot be before start date.");
          return;
        }
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
    setDateError(null); // Clear error if validation passes
    setError && setError(null); // Clear other errors if present
  };

  // Handle file upload
  const handleFileUpload = (e) => {
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
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, ...fileData]
        }));
      });
    }
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!tempUser) {
        throw new Error("User information not available");
      }

      const updateData = {
        ...formData,
        userId: tempUser.id,
        postedBy: tempUser.id
      };

      const response = await axios.put(`http://localhost:3991/api/notices/${notice._id}`, updateData);
      
      // Call the onUpdate callback with the updated notice
      onUpdate(response.data.data);
      onClose();
    } catch (err) {
      console.error('Error updating notice:', err);
      setError(err.response?.data?.error || 'Failed to update notice');
    } finally {
      setIsSubmitting(false);
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

  // Get today's date as a string
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Edit Notice</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {dateError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {dateError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="col-span-full">
                <label htmlFor="title" className="block text-gray-700 font-medium mb-1">Title*</label>
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
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-gray-700 font-medium mb-1">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="announcement">Announcement</option>
                  <option value="service-update">Service Update</option>
                  <option value="emergency">Emergency</option>
                  <option value="general">General</option>
                  <option value="advisory">Advisory</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-gray-700 font-medium mb-1">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Target Audience */}
              <div>
                <label htmlFor="targetAudience" className="block text-gray-700 font-medium mb-1">Target Audience</label>
                <select
                  id="targetAudience"
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all-users">All Users</option>
                  <option value="passengers">Passengers</option>
                  <option value="staff">Staff</option>
                  <option value="drivers">Drivers</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="block text-gray-700 font-medium mb-1">Start Date*</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={getTodayString()} // Prevent past dates
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="block text-gray-700 font-medium mb-1">End Date (Optional)</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Content */}
              <div className="col-span-full">
                <label htmlFor="content" className="block text-gray-700 font-medium mb-1">Content*</label>
                {/* Content validation */}
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  maxLength="1000" // Add character limit
                  rows="5"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>

              {/* Current Attachments */}
              {formData.attachments.length > 0 && (
                <div className="col-span-full">
                  <label className="block text-gray-700 font-medium mb-2">Current Attachments</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {formData.attachments.map((attachment, index) => (
                      <div key={index} className="relative group border border-gray-200 rounded-lg overflow-hidden">
                        {isBase64Image(attachment) ? (
                          <div className="h-24">
                            <img 
                              src={attachment} 
                              alt={`Attachment ${index + 1}`} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        ) : (
                          <div className="h-24 bg-gray-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

              {/* Upload New Attachments */}
              <div className="col-span-full">
                <label htmlFor="attachments" className="block text-gray-700 font-medium mb-2">Add New Attachments</label>
                <input
                  type="file"
                  id="attachments"
                  name="attachments"
                  onChange={handleFileUpload}
                  multiple
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                {isSubmitting ? (
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
      </div>
    </div>
  );
}