import { useState, useEffect } from 'react';
import axios from 'axios';
import { getTempUser } from '../../../shared/utils/tempUserAuth';
import ItemImagePickerModal from '../../notice-management/components/ItemImagePickerModal';

const URGENT_ITEMS = ['student-id', 'laptop', 'mobile-phone', 'atm-card', 'license'];

export default function AdminNoticeEditModal({ notice, isOpen, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    title: '', content: '', category: 'general', itemType: '', priority: 'medium',
    startDate: '', endDate: '', targetAudience: 'all-users', attachments: [],
    contactPhone: '', contactEmail: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState(null);
  const [errors, setErrors]             = useState({ contactPhone: '', contactEmail: '' });
  const [tempUser, setTempUser]         = useState(null);
  const [dateError, setDateError]       = useState(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const phoneInputRegex = /^\d*$/;
  const emailValidRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    if (notice) {
      setFormData({
        title:          notice.title || '',
        content:        notice.content || '',
        category:       notice.category || 'general',
        itemType:       notice.itemType || '',
        priority:       notice.priority || 'medium',
        startDate:      notice.startDate ? new Date(notice.startDate).toISOString().split('T')[0] : '',
        endDate:        notice.endDate   ? new Date(notice.endDate).toISOString().split('T')[0]   : '',
        targetAudience: notice.targetAudience || 'all-users',
        attachments:    notice.attachments || [],
        contactPhone:   notice.contactPhone || '',
        contactEmail:   notice.contactEmail || ''
      });
      setError(null);
      setDateError(null);
      setErrors({ contactPhone: '', contactEmail: '' });
    }
    const user = getTempUser();
    setTempUser(user);
  }, [notice]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if (name === 'contactPhone') {
      if (!phoneInputRegex.test(value)) return;
      setErrors(prev => ({ ...prev, contactPhone: value.length !== 10 ? 'Phone number must be exactly 10 digits' : '' }));
    }
    if (name === 'contactEmail') {
      setErrors(prev => ({ ...prev, contactEmail: '' }));
    }
    if (name === 'startDate' && newFormData.endDate) {
      if (new Date(newFormData.endDate) < new Date(value)) { setDateError("End date cannot be before start date."); return; }
    }
    if (name === 'endDate' && newFormData.startDate) {
      if (new Date(value) < new Date(newFormData.startDate)) { setDateError("End date cannot be before start date."); return; }
    }
    if (name === 'itemType' && URGENT_ITEMS.includes(value)) {
      newFormData.priority = 'urgent';
    }
    setFormData(newFormData);
    setDateError(null);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'contactPhone' && value.length !== 10) {
      setErrors(prev => ({ ...prev, contactPhone: 'Phone number must be exactly 10 digits' }));
    }
    if (name === 'contactEmail' && value && !emailValidRegex.test(value)) {
      setErrors(prev => ({ ...prev, contactEmail: 'Enter a valid email address (e.g. user@example.com)' }));
    }
  };

  const handleImagePickerSelect = (selectedImages) => {
    setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...selectedImages] }));
    setShowImagePicker(false);
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const newErrors = { contactPhone: '', contactEmail: '' };
    if (formData.contactPhone && formData.contactPhone.length !== 10) newErrors.contactPhone = 'Phone number must be exactly 10 digits';
    if (formData.contactEmail && !emailValidRegex.test(formData.contactEmail)) newErrors.contactEmail = 'Enter a valid email address (e.g. user@example.com)';
    if (newErrors.contactPhone || newErrors.contactEmail) { setErrors(newErrors); setIsSubmitting(false); return; }
    try {
      if (!tempUser) throw new Error("User information not available");
      const response = await axios.put(`http://localhost:3001/api/notices/${notice._id}`, {
        ...formData, userId: tempUser.id, postedBy: tempUser.id
      });
      onUpdate(response.data.data);
      onClose();
    } catch (err) {
      console.error('Error updating notice:', err);
      setError(err.response?.data?.error || 'Failed to update notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBase64Image = (str) => str && (
    str.startsWith('data:image/jpeg') || str.startsWith('data:image/png') ||
    str.startsWith('data:image/gif')  || str.startsWith('data:image/webp') ||
    str.startsWith('data:image/svg')
  );

  const getPriorityAccent = (p) => {
    if (p === 'urgent') return 'from-red-500 to-rose-400';
    if (p === 'medium') return 'from-green-500 to-emerald-400';
    if (p === 'low')    return 'from-yellow-400 to-amber-300';
    return 'from-blue-600 to-indigo-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-3xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Priority accent bar */}
        <div className={`h-1.5 bg-gradient-to-r ${getPriorityAccent(formData.priority)} flex-shrink-0`}></div>

        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-gradient-to-r from-blue-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <i className="fas fa-pen text-white text-sm"></i>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Edit Notice</h2>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{notice?.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
          >
            <i className="fas fa-times text-gray-500 text-sm"></i>
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {/* Error banners */}
          {(error || dateError) && (
            <div className="mb-5 flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <i className="fas fa-exclamation-circle text-red-400 mt-0.5 flex-shrink-0"></i>
              <span>{error || dateError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Notice Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={e => { if (/^[a-zA-Z0-9 .,!?:;'-]*$/.test(e.target.value)) handleChange(e); }}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
                placeholder="Enter notice title..."
              />
            </div>

            {/* Category + Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
                <div className="relative">
                  <i className="fas fa-tag absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 appearance-none bg-white transition-colors"
                  >
                    <option value="lost-item">Lost Item Notice</option>
                    <option value="found-item">Found Item Notice</option>
                    <option value="announcement">Announcement</option>
                    <option value="advisory">Advisory</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Priority</label>
                <div className="relative">
                  <i className="fas fa-flag absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none transition-colors ${
                      formData.priority === 'urgent' ? 'border-red-300 bg-red-50 text-red-700'
                      : formData.priority === 'medium' ? 'border-green-300 bg-green-50 text-green-700'
                      : formData.priority === 'low'    ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Item Type */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Item Type <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <i className="fas fa-box absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <select
                  name="itemType"
                  value={formData.itemType}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 appearance-none bg-white transition-colors"
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
              </div>
              {URGENT_ITEMS.includes(formData.itemType) && (
                <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                  <i className="fas fa-exclamation-triangle"></i>
                  High-priority item — priority has been set to <strong>Urgent</strong> automatically.
                </p>
              )}
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Target Audience</label>
              <div className="relative">
                <i className="fas fa-users absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <select
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 appearance-none bg-white transition-colors"
                >
                  <option value="all-students">All Students</option>
                  <option value="undergraduate">Undergraduate Students</option>
                  <option value="postgraduate">Postgraduate Students</option>
                  <option value="academic-staff">Academic Staff</option>
                  <option value="non-academic-staff">Non-Academic Staff</option>
                  <option value="all-university">All University Community</option>
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Start Date <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <i className="fas fa-calendar-plus absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    min="2026-01-01"
                    required
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Expiry Date</label>
                <div className="relative">
                  <i className="fas fa-hourglass-end absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min="2026-01-01"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Notice Content <span className="text-red-400">*</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                maxLength="1000"
                rows="5"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-colors resize-none"
                placeholder="Enter notice content..."
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{formData.content.length}/1000</p>
            </div>

            {/* Attachments */}
            {formData.attachments.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Current Attachments</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {formData.attachments.map((attachment, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                      {isBase64Image(attachment) ? (
                        <img src={attachment} alt={`Attachment ${index + 1}`} className="w-full h-24 object-cover" />
                      ) : (
                        <div className="h-24 bg-gray-50 flex items-center justify-center">
                          <i className="fas fa-file text-gray-300 text-2xl"></i>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Add New Images</label>
              <p className="text-xs text-gray-400 mb-2">Select images from existing item reports to attach to this notice.</p>
              <button
                type="button"
                onClick={() => setShowImagePicker(true)}
                className="flex items-center gap-2 px-4 py-2 border border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm shadow-sm"
              >
                <i className="fas fa-images"></i>
                Select from Item Reports
              </button>
            </div>

            {showImagePicker && (
              <ItemImagePickerModal
                onSelect={handleImagePickerSelect}
                onClose={() => setShowImagePicker(false)}
              />
            )}

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Contact Phone</label>
              <div className="relative">
                <i className="fas fa-phone absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength="10"
                  inputMode="numeric"
                  placeholder="e.g. 0771234567"
                  className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors ${errors.contactPhone ? 'border-red-300' : 'border-gray-200'}`}
                />
              </div>
              {errors.contactPhone && <p className="mt-1 text-xs text-red-600">{errors.contactPhone}</p>}
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Contact Email</label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength="100"
                  placeholder="e.g. user@example.com"
                  className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors ${errors.contactEmail ? 'border-red-300' : 'border-gray-200'}`}
                />
              </div>
              {errors.contactEmail && <p className="mt-1 text-xs text-red-600">{errors.contactEmail}</p>}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors text-sm font-bold flex items-center gap-2 shadow-sm disabled:opacity-60"
              >
                {isSubmitting
                  ? <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>Saving...</>
                  : <><i className="fas fa-save text-sm"></i>Save Changes</>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
