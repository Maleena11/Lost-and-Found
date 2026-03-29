import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { getTempUser } from "../../../shared/utils/tempUserAuth"; // Adjust the import based on your project structure
import ItemImagePickerModal from "../components/ItemImagePickerModal";
import ItemReportPickerModal from "../components/ItemReportPickerModal";

/**
 * University-ready priority resolver.
 *
 * Priority is based on three axes:
 *   Financial Value  |  Academic Importance  |  Personal Data Risk
 *
 * URGENT  — losing this item blocks university access, exams, or finances
 * MEDIUM  — expensive/study-critical but not an immediate access emergency
 * LOW     — common convenience items, short expiry, high replacement rate
 */
function resolveItemTypeAndPriority(category, itemName = "") {
  const name = itemName.toLowerCase();

  // ── URGENT keyword groups ────────────────────────────────────────────────
  // Official documents
  const isStudentId  = /student id|student card/.test(name);
  const isNIC        = /\bnic\b|national id|national identity/.test(name);
  const isPassport   = /passport/.test(name);
  const isLicense    = /driving licen|driver.s licen|licence/.test(name);
  const isAdmission  = /admission slip|hall ticket|exam card/.test(name);
  const isDocument   = isNIC || isPassport || isLicense || isAdmission;

  // High-value electronics
  const isPhone      = /phone|mobile|iphone|android|samsung|huawei|oppo|xiaomi|smartphone/.test(name);
  const isLaptop     = /laptop|notebook|macbook|chromebook|dell|hp |lenovo|asus/.test(name);
  const isTablet     = /tablet|ipad|galaxy tab/.test(name);
  const isSmartwatch = /smartwatch|smart watch|apple watch|galaxy watch|fitbit/.test(name);

  // Financial items
  const isWallet     = /wallet|purse/.test(name);
  const isATM        = /atm|credit card|debit card|bank card|visa|mastercard|passbook/.test(name);

  // Access keys
  const isCarKey     = /car key|car fob|vehicle key|motor key|bike key|motorbike key|key fob/.test(name);
  const isHostelKey  = /hostel key|room key|dorm key|locker key/.test(name);
  const isUrgentKey  = isCarKey || isHostelKey;

  // Medical
  const isMedical    = /inhaler|prescription|glasses|spectacles|eyeglass|medication|medicine|epipen/.test(name);

  // ── MEDIUM keyword groups ────────────────────────────────────────────────
  const isCalculator = /calculator/.test(name);
  const isLabCoat    = /lab coat|laboratory coat/.test(name);
  const isDrawing    = /drawing set|drawing tool|compass set|protractor set/.test(name);
  const isHeadphone  = /headphone|earphone|earbud|airpod|earpiece/.test(name);
  const isPowerBank  = /power bank|powerbank/.test(name);
  const isCharger    = /charger|charging adapter/.test(name);
  const isUSB        = /\busb\b|flash drive|thumb drive|pendrive/.test(name);
  const isBag        = /backpack|laptop bag|laptop sleeve|gym bag|sling bag|shoulder bag/.test(name);
  const isFountainPen = /fountain pen/.test(name);
  const isEDictionary = /electronic dictionary|e-dictionary/.test(name);
  const isWatch      = /\bwatch\b/.test(name) && !isSmartwatch;
  const isJacket     = /jacket|blazer|branded/.test(name);
  const isExpTextbook = /textbook|reference book/.test(name);

  // ── LOW keyword groups ───────────────────────────────────────────────────
  const isDailyStationery = /\bpen\b|pencil|eraser|ruler|highlighter|marker|pencil case|notebook|exercise book/.test(name);
  const isDailyApparel    = /umbrella|scarf|cap\b|hat\b|beanie|sweater|hoodie/.test(name);
  const isContainer       = /water bottle|waterbottle|lunch box|lunchbox|coffee mug|flask|thermos/.test(name);
  const isMisc            = /phone cover|phone case|keychain|key chain|trinket|charging cable|earphone case/.test(name);

  // ── Category + keyword resolution ───────────────────────────────────────
  switch (category) {

    // ── Student ID ──
    case "student-id":
      return { itemType: "student-id", priority: "urgent" };

    // ── Laptop / Tablet ──
    case "laptop-tablet":
      return { itemType: "laptop", priority: "urgent" };

    // ── Electronics ──
    case "electronics":
      if (isPhone || isSmartwatch)    return { itemType: "mobile-phone", priority: "urgent" };
      if (isLaptop || isTablet)       return { itemType: "laptop",       priority: "urgent" };
      if (isHeadphone || isPowerBank) return { itemType: "other",        priority: "medium" };
      if (isCharger || isUSB)         return { itemType: "stationery",   priority: "medium" };
      return                                 { itemType: "other",        priority: "medium" };

    // ── Wallet / Financial ──
    case "wallet":
      if (isATM)  return { itemType: "atm-card", priority: "urgent" };
      return             { itemType: "wallet",   priority: "urgent" };

    // ── Documents ──
    case "documents":
      if (isATM)      return { itemType: "atm-card",   priority: "urgent" };
      if (isNIC || isPassport || isLicense || isAdmission)
                      return { itemType: "license",    priority: "urgent" };
      return                 { itemType: "license",    priority: "urgent" };

    // ── Keys ──
    case "keys":
      if (isUrgentKey) return { itemType: "keys", priority: "urgent" };
      return                  { itemType: "keys", priority: "medium" };

    // ── Clothing ──
    case "clothing":
      if (isJacket)          return { itemType: "clothing", priority: "medium" };
      if (isDailyApparel)    return { itemType: "clothing", priority: "low"    };
      return                        { itemType: "clothing", priority: "low"    };

    // ── Jewelry ──
    case "jewelry":
      if (isWatch) return { itemType: "other", priority: "medium" };
      return              { itemType: "other", priority: "medium" };

    // ── Books / Notes ──
    case "books-notes":
      if (isExpTextbook) return { itemType: "books", priority: "medium" };
      return                    { itemType: "books", priority: "low"    };

    // ── Stationery ──
    case "stationery":
      if (isFountainPen || isEDictionary || isCalculator)
        return { itemType: "stationery", priority: "medium" };
      return   { itemType: "stationery", priority: "low"    };

    // ── Sports Equipment ──
    case "sports-equipment":
      return { itemType: "other", priority: "low" };

    // ── Lab Equipment ──
    case "lab-equipment":
      if (isLabCoat || isDrawing) return { itemType: "other", priority: "medium" };
      return                             { itemType: "other", priority: "low"    };

    // ── Water Bottle ──
    case "water-bottle":
      return { itemType: "other", priority: "low" };

    // ── Other / fallback — use item name keywords ──
    default: {
      // Urgent
      if (isStudentId)                return { itemType: "student-id",   priority: "urgent" };
      if (isDocument)                 return { itemType: "license",      priority: "urgent" };
      if (isPhone || isSmartwatch)    return { itemType: "mobile-phone", priority: "urgent" };
      if (isLaptop || isTablet)       return { itemType: "laptop",       priority: "urgent" };
      if (isATM)                      return { itemType: "atm-card",     priority: "urgent" };
      if (isWallet)                   return { itemType: "wallet",       priority: "urgent" };
      if (isUrgentKey)                return { itemType: "keys",         priority: "urgent" };
      if (isMedical)                  return { itemType: "other",        priority: "urgent" };
      // Medium
      if (isCalculator || isDrawing || isLabCoat || isExpTextbook)
                                      return { itemType: "other",        priority: "medium" };
      if (isHeadphone || isPowerBank) return { itemType: "other",        priority: "medium" };
      if (isCharger || isUSB)         return { itemType: "stationery",   priority: "medium" };
      if (isBag)                      return { itemType: "other",        priority: "medium" };
      if (isFountainPen || isEDictionary) return { itemType: "stationery", priority: "medium" };
      if (isWatch || isJacket)        return { itemType: "other",        priority: "medium" };
      // Low
      if (isDailyStationery)          return { itemType: "stationery",   priority: "low" };
      if (isDailyApparel)             return { itemType: "clothing",     priority: "low" };
      if (isContainer)                return { itemType: "other",        priority: "low" };
      if (isMisc)                     return { itemType: "other",        priority: "low" };
      // Default
      return                                 { itemType: "other",        priority: "medium" };
    }
  }
}

/**
 * Derives the target audience from the item report fields.
 *
 * Logic:
 *  - yearGroup present         → undergraduate (year groups only apply to undergrads)
 *  - lab-equipment category    → all-university (staff & students use labs)
 *  - sports-equipment category → all-university (open to all)
 *  - student-id / books-notes
 *    / stationery / clothing   → all-students
 *  - documents / electronics
 *    / laptop-tablet / wallet  → all-university (staff carry these too)
 *  - everything else           → all-students (safest university default)
 */
function resolveTargetAudience(category, yearGroup = "") {
  if (yearGroup) return "undergraduate";

  switch (category) {
    case "student-id":
    case "books-notes":
    case "stationery":
    case "sports-equipment":
    case "water-bottle":
      return "all-students";

    case "lab-equipment":
    case "documents":
    case "electronics":
    case "laptop-tablet":
    case "wallet":
    case "keys":
    case "jewelry":
    case "clothing":
    case "other":
      return "all-university";

    default:
      return "all-students";
  }
}

const CATEGORY_LABELS = {
  "student-id":       "Student ID",
  "laptop-tablet":    "Laptop / Tablet",
  "books-notes":      "Books / Notes",
  "stationery":       "Stationery",
  "electronics":      "Electronics",
  "lab-equipment":    "Lab Equipment",
  "sports-equipment": "Sports Equipment",
  "clothing":         "Clothing",
  "jewelry":          "Jewelry",
  "keys":             "Keys",
  "wallet":           "Wallet",
  "documents":        "Documents",
  "water-bottle":     "Water Bottle",
  "other":            "Other",
};

const getTodayString = () => toDateString(new Date());

/** Formats a Date object to YYYY-MM-DD string */
const toDateString = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * Calculates the notice expiry date from a given start date based on priority.
 *   urgent  → 3 months  (90 days)
 *   medium  → 4 weeks   (28 days)
 *   low     → 2 weeks   (14 days)
 */
const getExpiryDateString = (priority, fromDate) => {
  const d = new Date(fromDate);
  if (priority === "urgent") {
    d.setMonth(d.getMonth() + 3); // exactly 3 calendar months
  } else {
    const DURATION_DAYS = { medium: 28, low: 14 };
    d.setDate(d.getDate() + (DURATION_DAYS[priority] ?? 28));
  }
  return toDateString(d);
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
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showReportPicker, setShowReportPicker] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [pendingFields, setPendingFields] = useState(new Set());
  const [preloadedReports, setPreloadedReports] = useState(null);
  const [preloadError, setPreloadError] = useState(null);
  const [attachmentLightbox, setAttachmentLightbox] = useState(null);

  // Preload reports in the background as soon as the page mounts
  useEffect(() => {
    axios.get("http://localhost:3001/api/lost-found/?lean=true")
      .then(res => setPreloadedReports(Array.isArray(res.data) ? res.data : res.data.data || []))
      .catch(() => setPreloadError("Failed to load item reports."));
  }, []);

  const handleOpenReportPicker = () => {
    setShowReportPicker(true);
  };

  const PRIORITY_STYLE = {
    urgent: {
      card:  "border-red-300 bg-red-50",
      icon:  "bg-red-500",
      title: "text-red-800",
      inner: "border-red-200",
      hint:  "text-red-600",
      badge: "bg-red-100 text-red-700 border border-red-200",
      label: "Urgent",
    },
    medium: {
      card:  "border-green-300 bg-green-50",
      icon:  "bg-green-500",
      title: "text-green-800",
      inner: "border-green-200",
      hint:  "text-green-600",
      badge: "bg-green-100 text-green-700 border border-green-200",
      label: "Medium",
    },
    low: {
      card:  "border-yellow-300 bg-yellow-50",
      icon:  "bg-yellow-400",
      title: "text-yellow-800",
      inner: "border-yellow-200",
      hint:  "text-yellow-700",
      badge: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      label: "Low",
    },
  };
  const ps = PRIORITY_STYLE[formData.priority] || PRIORITY_STYLE.medium;

  const phoneInputRegex = /^\d*$/;
  const emailValidRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Returns blue highlight class for fields the user still needs to fill manually
  const getPendingClass = (fieldName) =>
    selectedReport && pendingFields.has(fieldName)
      ? "ring-2 ring-blue-300 bg-blue-50"
      : "";

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

    // Remove blue highlight once the user fills this field
    if (pendingFields.has(name)) {
      setPendingFields(prev => { const s = new Set(prev); s.delete(name); return s; });
    }
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

  const handleImagePickerSelect = (selectedImages) => {
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...selectedImages]
    }));
    setShowImagePicker(false);
  };

  const handleReportSelect = async (report) => {
    const noticeCategory = report.itemType === "lost" ? "lost-item" : "found-item";
    const { itemType: noticeItemType, priority } = resolveItemTypeAndPriority(report.category, report.itemName);

    const reportDate = report.dateTime
      ? new Date(report.dateTime).toLocaleDateString("en-GB", {
          day: "numeric", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        })
      : null;

    const typeLabel = report.itemType === "lost" ? "Lost" : "Found";
    const title = `${typeLabel} Item: ${report.itemName}`;

    const contentLines = [
      `A ${report.itemType} ${report.itemName} has been reported at ${report.location}.`,
      "",
      `Description: ${report.description}`,
      "",
    ];
    if (reportDate)       contentLines.push(`Date & Time: ${reportDate}`);
    if (report.location)  contentLines.push(`Location: ${report.location}`);
    if (report.faculty)   contentLines.push(`Faculty: ${report.faculty}`);
    if (report.department) contentLines.push(`Department: ${report.department}`);
    if (report.building)  contentLines.push(`Building: ${report.building}`);
    contentLines.push("", "If you have any information, please contact us using the details provided below.");

    const hasPhone = !!report.contactInfo?.phone;
    const hasEmail = !!report.contactInfo?.email;

    // Fetch full item to get images
    let images = [];
    try {
      const res = await axios.get(`http://localhost:3001/api/lost-found/${report._id}`);
      const full = res.data?.data || res.data;
      images = full.images || [];
    } catch { /* proceed without images */ }

    setFormData(prev => ({
      ...prev,
      title:        title.slice(0, 100),
      category:     noticeCategory,
      itemType:     noticeItemType,
      priority:     priority,
      content:      contentLines.join("\n").slice(0, 1000),
      attachments:  images,
      contactPhone: hasPhone ? report.contactInfo.phone : "",
      contactEmail: hasEmail ? report.contactInfo.email : "",
      startDate:      report.dateTime ? toDateString(new Date(report.dateTime)) : getTodayString(),
      endDate:        getExpiryDateString(priority, report.dateTime || new Date()),
      targetAudience: resolveTargetAudience(report.category, report.yearGroup),
    }));

    const pending = new Set();
    if (!hasPhone) pending.add("contactPhone");
    if (!hasEmail) pending.add("contactEmail");
    setPendingFields(pending);

    setSelectedReport({ ...report, images });
    setShowReportPicker(false);
    setErrors({ contactPhone: '', contactEmail: '' });
    setDateError(null);
  };

  const handleClearReport = () => {
    setSelectedReport(null);
    setPendingFields(new Set());
    setFormData({
      title: "", content: "", category: "lost-item", itemType: "",
      priority: "medium", startDate: getTodayString(), endDate: "",
      targetAudience: "all-students", attachments: [],
      contactPhone: "", contactEmail: "",
    });
    setErrors({ contactPhone: '', contactEmail: '' });
    setDateError(null);
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

            {/* ── Quick Fill from Item Report ── */}
              <div className={`rounded-xl border-2 transition-all ${
                selectedReport
                  ? ps.card
                  : "border-dashed border-blue-300 bg-blue-50/40"
              }`}>
                {!selectedReport ? (
                  /* Empty state — invite user to pick */
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className="fas fa-magic text-blue-600 text-sm"></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-800">Auto-fill from Item Report</p>
                        <p className="text-xs text-blue-500 mt-0.5">
                          Select an existing item report to instantly populate the form fields below.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenReportPicker}
                      className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <i className="fas fa-file-alt text-xs"></i>
                      Select Item Report
                    </button>
                  </div>
                ) : (
                  /* Filled state — colour-coded by priority */
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 ${ps.icon} rounded-full flex items-center justify-center`}>
                          <i className="fas fa-check text-white text-xs"></i>
                        </div>
                        <p className={`text-sm font-bold ${ps.title}`}>Form auto-filled from report</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ps.badge}`}>
                          {ps.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleOpenReportPicker}
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2"
                        >
                          Change
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={handleClearReport}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold underline underline-offset-2"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    {/* Report detail card */}
                    <div className={`bg-white rounded-lg border ${ps.inner} overflow-hidden`}>
                      {/* Header row: image(s) + name/badges */}
                      <div className="flex gap-3 px-4 pt-4 pb-3">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          {(selectedReport.thumbnail || selectedReport.images?.[0]) ? (
                            <img
                              src={selectedReport.thumbnail || selectedReport.images?.[0]}
                              alt={selectedReport.itemName}
                              className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                              <i className="fas fa-image text-gray-300 text-xl"></i>
                            </div>
                          )}
                        </div>

                        {/* Name + badges */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-800">{selectedReport.itemName}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              selectedReport.itemType === "lost"
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}>
                              {selectedReport.itemType === "lost" ? "Lost" : "Found"}
                            </span>
                            <span className="text-xs text-gray-500">
                              <i className="fas fa-tag mr-1 text-gray-400"></i>
                              {CATEGORY_LABELS[selectedReport.category] || selectedReport.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-100 mx-4" />

                      {/* Details grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 px-4 py-3 text-xs text-gray-600">
                        {selectedReport.location && (
                          <div className="flex items-start gap-2">
                            <i className="fas fa-map-marker-alt text-gray-400 mt-0.5 w-3 flex-shrink-0"></i>
                            <span><span className="font-semibold text-gray-700">Location: </span>{selectedReport.location}</span>
                          </div>
                        )}
                        {selectedReport.dateTime && (
                          <div className="flex items-start gap-2">
                            <i className="fas fa-calendar-alt text-gray-400 mt-0.5 w-3 flex-shrink-0"></i>
                            <span>
                              <span className="font-semibold text-gray-700">Date: </span>
                              {new Date(selectedReport.dateTime).toLocaleDateString("en-GB", {
                                day: "2-digit", month: "short", year: "numeric"
                              })}
                              {" "}
                              {new Date(selectedReport.dateTime).toLocaleTimeString("en-GB", {
                                hour: "2-digit", minute: "2-digit"
                              })}
                            </span>
                          </div>
                        )}
                        {selectedReport.contactInfo?.phone && (
                          <div className="flex items-start gap-2">
                            <i className="fas fa-phone text-gray-400 mt-0.5 w-3 flex-shrink-0"></i>
                            <span><span className="font-semibold text-gray-700">Phone: </span>{selectedReport.contactInfo.phone}</span>
                          </div>
                        )}
                        {selectedReport.contactInfo?.email && (
                          <div className="flex items-start gap-2">
                            <i className="fas fa-envelope text-gray-400 mt-0.5 w-3 flex-shrink-0"></i>
                            <span className="break-all"><span className="font-semibold text-gray-700">Email: </span>{selectedReport.contactInfo.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {selectedReport.description && (
                        <>
                          <div className="border-t border-gray-100 mx-4" />
                          <div className="px-4 py-3">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Description</p>
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                              {selectedReport.description}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <p className={`text-xs ${ps.hint} mt-2 flex items-center gap-1`}>
                      <i className="fas fa-info-circle"></i>
                      Report details auto-filled.
                      <span className="text-blue-500 font-semibold ml-1">Fields highlighted in blue need to be filled manually.</span>
                    </p>
                  </div>
                )}
              </div>

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
                className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${getPendingClass("title")}`}
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
                className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${getPendingClass("category")}`}
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
                className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${getPendingClass("itemType")}`}
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
                } ${getPendingClass("priority")}`}
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
                className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${getPendingClass("targetAudience")}`}
              >
                <option value="" disabled>— Select target audience —</option>
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
                maxLength="1000"
                className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${getPendingClass("content")}`}
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
                  className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${getPendingClass("startDate")}`}
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
                  className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${getPendingClass("endDate")}`}
                />
              </div>
            </div>

            {/* Item Images */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Item Images
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Select images from existing item reports to attach to this notice.
              </p>
              <button
                type="button"
                onClick={() => setShowImagePicker(true)}
                className="flex items-center gap-2 px-4 py-2 border border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm shadow-sm"
              >
                <i className="fas fa-images"></i>
                Select from Item Reports
              </button>
              {formData.attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.attachments.map((src, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={src}
                        alt={`preview ${idx + 1}`}
                        className="h-16 w-16 object-cover rounded-lg border border-gray-200 cursor-pointer"
                        onClick={() => setAttachmentLightbox(src)}
                      />
                      {/* Zoom hint */}
                      <div
                        className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center cursor-pointer"
                        onClick={() => setAttachmentLightbox(src)}
                      >
                        <i className="fas fa-search-plus text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity drop-shadow"></i>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-300 hover:bg-gray-400 text-gray-600 rounded-full flex items-center justify-center shadow transition-colors z-10"
                      >
                        <i className="fas fa-times text-[9px]"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Attachment lightbox */}
              {attachmentLightbox && (
                <div
                  className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                  onClick={() => setAttachmentLightbox(null)}
                >
                  <button
                    type="button"
                    className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
                    onClick={() => setAttachmentLightbox(null)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                  <img
                    src={attachmentLightbox}
                    alt="Full view"
                    className="max-w-lg w-full mx-6 rounded-2xl shadow-2xl object-contain max-h-[80vh]"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              )}
            </div>

            {showImagePicker && (
              <ItemImagePickerModal
                onSelect={handleImagePickerSelect}
                onClose={() => setShowImagePicker(false)}
              />
            )}

            {showReportPicker && (
              <ItemReportPickerModal
                onSelect={handleReportSelect}
                onClose={() => setShowReportPicker(false)}
                preloadedItems={preloadedReports}
                preloadError={preloadError}
              />
            )}


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
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${errors.contactPhone ? 'border-red-400' : 'border-gray-300'} ${getPendingClass("contactPhone")}`}
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
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${errors.contactEmail ? 'border-red-400' : 'border-gray-300'} ${getPendingClass("contactEmail")}`}
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