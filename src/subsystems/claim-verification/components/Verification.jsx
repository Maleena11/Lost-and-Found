import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { useState, useEffect } from "react";
import { api } from "../../../api";
import { useAuth } from "../../../shared/utils/AuthContext";

// ── Constants ────────────────────────────────────────────────────────────────

const FACULTY_OPTIONS = [
  { value: "Faculty of Computing",            label: "Faculty of Computing" },
  { value: "Faculty of Engineering",          label: "Faculty of Engineering" },
  { value: "Faculty of Business",             label: "Faculty of Business" },
  { value: "Faculty of Humanities & Sciences",label: "Faculty of Humanities & Sciences" },
  { value: "Faculty of Architecture",         label: "Faculty of Architecture" },
  { value: "Faculty of Medicine",             label: "Faculty of Medicine" },
  { value: "Faculty of Law",                  label: "Faculty of Law" },
];

const YEAR_OPTIONS = [
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
  "Masters (MSc)",
  "PhD",
  "Postgraduate Diploma",
  "Other",
];

// ── Field-level validators ───────────────────────────────────────────────────

const VALIDATORS = {
  name: (v) => {
    if (!v.trim()) return "Full name is required.";
    if (!/^[A-Za-z\s]+$/.test(v.trim()))
      return "Full name must contain letters only — no numbers or special characters.";
    if (v.trim().length < 2) return "Full name must be at least 2 characters.";
    if (v.trim().length > 60) return "Full name must be 60 characters or fewer.";
    return "";
  },
  studentId: (v) => {
    if (!v || v.trim() === "IT" || v.trim() === "")
      return "Student ID is required.";
    if (!/^IT\d{8}$/.test(v.trim()))
      return "Student ID must start with 'IT' followed by exactly 8 digits (e.g. IT21123456).";
    return "";
  },
  email: (v) => {
    if (!v.trim()) return "University email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()))
      return "Enter a valid email address.";
    if (!/\.(lk|edu|ac\.lk|edu\.lk|ac\.uk|edu\.au)$/i.test(v.trim()))
      return "Please use your official university email address (e.g. it21xxxxxx@my.sliit.lk).";
    return "";
  },
  phone: (v) => {
    if (!v.trim()) return "Contact number is required.";
    if (!/^07\d{8}$/.test(v.trim()))
      return "Enter a valid Sri Lankan mobile number starting with 07 (e.g. 0712345678).";
    return "";
  },
  faculty: (v) => {
    if (!v) return "Please select your faculty / department.";
    return "";
  },
  yearOfStudy: (v) => {
    if (!v) return "Please select your year / level of study.";
    return "";
  },
  semester: (v) => {
    if (!v) return "Please select your semester.";
    return "";
  },
  description: (v) => {
    if (!v.trim()) return "Item description is required.";
    if (v.trim().length < 20)
      return "Please provide more detail — at least 20 characters.";
    return "";
  },
  ownershipProof: (v) => {
    if (!v.trim()) return "Proof of ownership is required.";
    if (v.trim().length < 10)
      return "Please provide more detail about your proof of ownership.";
    return "";
  },
};

function runValidate(formData) {
  const errors = {};
  Object.entries(VALIDATORS).forEach(([field, fn]) => {
    const msg = fn(formData[field] ?? "");
    if (msg) errors[field] = msg;
  });
  return errors;
}

// ── Small reusable UI pieces ─────────────────────────────────────────────────

function ErrorMsg({ error }) {
  if (!error) return null;
  return (
    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5 font-medium">
      <i className="fas fa-exclamation-circle flex-shrink-0" />
      {error}
    </p>
  );
}

function Field({ label, required, hint, error, touched, children }) {
  return (
    <div className="flex flex-col gap-0">
      <label className="block mb-2 text-sm font-semibold text-gray-800 flex items-center gap-1.5">
        {label}
        {required && (
          <span className="text-red-500 text-xs font-bold leading-none">*</span>
        )}
      </label>
      {children}
      {touched && error ? (
        <ErrorMsg error={error} />
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500 flex items-start gap-1.5">
          <i className="fas fa-info-circle text-blue-400 mt-0.5 flex-shrink-0" />
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function SectionHeader({ icon, iconBg, iconColor, step, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
      <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <i className={`fas ${icon} ${iconColor} text-sm`} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-800">{step} — {title}</h2>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function Verification() {
  const { user } = useAuth();

  const [foundItems, setFoundItems]     = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [search, setSearch]             = useState("");
  const [loading, setLoading]           = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState("");
  const [claimRef, setClaimRef]         = useState("");

  const [formData, setFormData] = useState({
    name:          "",
    studentId:     "IT",
    email:         "",
    phone:         "",
    faculty:       "",
    yearOfStudy:   "",
    semester:      "",
    description:   "",
    ownershipProof:"",
    additionalInfo:"",
    declaration:   false,
  });

  const [touched, setTouched]   = useState({});
  const [errors, setErrors]     = useState({});
  const [claimantImages, setClaimantImages] = useState([]);
  const [imageError, setImageError]         = useState("");

  const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const MAX_IMAGES = 5;

  // Pre-fill from authenticated user account
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name:  user.name  || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  // ── Image upload ──────────────────────────────────────────────────────────

  const handleImageUpload = (e) => {
    setImageError("");
    const files = Array.from(e.target.files);
    const remaining = MAX_IMAGES - claimantImages.length;
    if (files.length > remaining) {
      setImageError(`You can upload at most ${MAX_IMAGES} images. ${claimantImages.length} already added.`);
    }
    const valid = files.slice(0, remaining).filter(f => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setImageError("Only JPG, PNG, and WebP images are supported.");
        return false;
      }
      return true;
    });
    valid.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setClaimantImages(prev => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (idx) => {
    setClaimantImages(prev => prev.filter((_, i) => i !== idx));
    setImageError("");
  };

  // ── Data fetching ─────────────────────────────────────────────────────────

  useEffect(() => { fetchFoundItems(); }, []);

  const fetchFoundItems = async () => {
    setLoading(true);
    try {
      const response = await api.get("/lost-found");
      setFoundItems(
        response.data.data.filter(
          item => item.itemType === "found" && item.status === "pending"
        )
      );
      setError("");
    } catch {
      setError("Failed to load found items. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleCardSelect = (item) => {
    setSelectedItem(prev => prev?._id === item._id ? null : item);
    setError("");
    setClaimRef("");
  };

  const filteredFoundItems = foundItems.filter(item => {
    const q = search.toLowerCase();
    return (
      item.itemName?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q)
    );
  });

  // ── Form handlers ─────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    const updated = { ...formData, [name]: newValue };
    setFormData(updated);
    // Live-validate field if already touched
    if (touched[name] && VALIDATORS[name]) {
      setErrors(prev => ({ ...prev, [name]: VALIDATORS[name](newValue) }));
    }
  };

  // Student ID: enforce "IT" prefix + digits only
  const handleStudentIdChange = (e) => {
    let val = e.target.value.toUpperCase();
    // Always keep "IT" prefix
    if (!val.startsWith("IT")) val = "IT";
    // After "IT", allow only digits, max 8
    const digits = val.slice(2).replace(/\D/g, "").slice(0, 8);
    const cleaned = "IT" + digits;
    const updated = { ...formData, studentId: cleaned };
    setFormData(updated);
    if (touched.studentId) {
      setErrors(prev => ({ ...prev, studentId: VALIDATORS.studentId(cleaned) }));
    }
  };

  // Full name: letters and spaces only
  const handleNameChange = (e) => {
    const val = e.target.value;
    // Allow letters, spaces, and common name characters while typing
    if (/^[A-Za-z\s]*$/.test(val)) {
      const updated = { ...formData, name: val };
      setFormData(updated);
      if (touched.name) {
        setErrors(prev => ({ ...prev, name: VALIDATORS.name(val) }));
      }
    }
  };

  // Phone: digits only, max 10
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    const updated = { ...formData, phone: val };
    setFormData(updated);
    if (touched.phone) {
      setErrors(prev => ({ ...prev, phone: VALIDATORS.phone(val) }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    if (VALIDATORS[name]) {
      setErrors(prev => ({ ...prev, [name]: VALIDATORS[name](formData[name] ?? "") }));
    }
  };

  // ── Validation & submit ───────────────────────────────────────────────────

  const REQUIRED_FIELDS = ["name", "studentId", "email", "phone", "faculty", "yearOfStudy", "semester", "description", "ownershipProof"];

  const currentErrors = runValidate(formData);
  const isFormValid = (
    REQUIRED_FIELDS.every(f => !currentErrors[f]) &&
    formData.declaration &&
    selectedItem
  );

  const activeStep = claimRef
    ? 4
    : selectedItem
      ? (REQUIRED_FIELDS.every(f => !currentErrors[f]) ? 3 : 2)
      : 1;

  const steps = [
    { num: 1, label: "Select Item",     icon: "fa-search"       },
    { num: 2, label: "Your Details",    icon: "fa-id-card"      },
    { num: 3, label: "Ownership Proof", icon: "fa-shield-alt"   },
    { num: 4, label: "Confirmation",    icon: "fa-check-circle" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Touch all fields to show all errors at once
    const allTouched = Object.fromEntries(REQUIRED_FIELDS.map(f => [f, true]));
    setTouched(allTouched);
    const errs = runValidate(formData);
    setErrors(errs);

    if (!isFormValid) {
      setError("Please complete all required fields correctly and accept the declaration before submitting.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await api.post("/verification", {
        itemId: selectedItem._id,
        claimantInfo: {
          name:    formData.name,
          email:   formData.email,
          phone:   formData.phone,
          address: `${formData.faculty} — ${formData.yearOfStudy}${formData.semester ? `, ${formData.semester}` : ""}`,
        },
        verificationDetails: {
          description:    formData.description,
          ownershipProof: `[Student ID: ${formData.studentId}] ${formData.ownershipProof}`,
          additionalInfo: formData.additionalInfo,
        },
        claimantImages,
      });

      const ref = `CLM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      setClaimRef(ref);

      setFormData({
        name: "", studentId: "IT", email: "", phone: "", faculty: "",
        yearOfStudy: "", semester: "", description: "", ownershipProof: "",
        additionalInfo: "", declaration: false,
      });
      setClaimantImages([]);
      setImageError("");
      setSelectedItem(null);
      setTouched({});
      setErrors({});
      fetchFoundItems();

    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit your claim. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  const inputClass = (name) =>
    `w-full border-2 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-150 ${
      touched[name] && errors[name]
        ? "border-red-400 bg-red-50 text-red-900 placeholder:text-red-300 focus:ring-red-200 focus:border-red-500"
        : touched[name] && !errors[name]
          ? "border-green-400 bg-green-50 focus:ring-green-200 focus:border-green-500"
          : "border-gray-300 bg-white text-gray-800 placeholder:text-gray-400 hover:border-gray-400 focus:ring-blue-200 focus:border-blue-500"
    }`;

  // ── Submission Success ────────────────────────────────────────────────────
  if (claimRef) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg">

            {/* Card */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">

              {/* Top gradient banner */}
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500" />

              {/* Hero section */}
              <div className="bg-gradient-to-b from-emerald-50 to-white px-8 pt-10 pb-6 text-center">
                {/* Animated success ring */}
                <div className="relative inline-flex items-center justify-center mb-5">
                  <div className="absolute w-24 h-24 rounded-full bg-emerald-100 opacity-60 animate-ping" style={{ animationDuration: "2s", animationIterationCount: 1 }} />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                    <i className="fas fa-check text-white text-3xl" />
                  </div>
                </div>

                <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight mb-1">
                  Claim Submitted!
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                  Your ownership claim has been received and is now under review by the Student Services team.
                </p>
              </div>

              <div className="px-8 pb-8 space-y-5">

                {/* Reference number box */}
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl px-6 py-5 text-center overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                  <p className="text-blue-200 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">
                    Claim Reference Number
                  </p>
                  <p className="text-white text-xl font-mono font-extrabold tracking-widest drop-shadow">
                    {claimRef}
                  </p>
                  <p className="text-blue-300 text-[11px] mt-1.5 flex items-center justify-center gap-1">
                    <i className="fas fa-bookmark text-[9px]" /> Save this for your records
                  </p>
                </div>

                {/* What happens next */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fas fa-road text-slate-400" /> What Happens Next
                  </p>
                  <div className="space-y-4">
                    {[
                      {
                        icon: "fa-clock",
                        color: "bg-amber-100 text-amber-600",
                        title: "Under Review",
                        desc: <>Our team will review your submitted details within <strong className="text-gray-800">1–2 business days</strong>.</>,
                      },
                      {
                        icon: "fa-envelope",
                        color: "bg-blue-100 text-blue-600",
                        title: "Email Notification",
                        desc: "You will receive a confirmation email to the address you provided.",
                      },
                      {
                        icon: "fa-id-card",
                        color: "bg-emerald-100 text-emerald-600",
                        title: "Collect Your Item",
                        desc: <>Once approved, visit the <strong className="text-gray-800">Student Services Office</strong> with your Student ID and this reference number.</>,
                      },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${step.color}`}>
                          <i className={`fas ${step.icon} text-xs`} />
                        </div>
                        <div className="pt-0.5">
                          <p className="text-xs font-bold text-gray-700 mb-0.5">{step.title}</p>
                          <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    onClick={() => setClaimRef("")}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold transition-all duration-200 shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 flex items-center gap-2 justify-center"
                  >
                    <i className="fas fa-plus-circle text-xs" /> Submit Another Claim
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-bold transition-all duration-200 flex items-center gap-2 justify-center"
                  >
                    <i className="fas fa-print text-xs" /> Print Confirmation
                  </button>
                </div>

              </div>
            </div>

            {/* Subtle footer note */}
            <p className="text-center text-xs text-gray-400 mt-4">
              <i className="fas fa-lock text-[10px] mr-1" />
              Your claim is securely stored. Reference ID saved at submission time.
            </p>

          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Main Form ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50">
      <Header />

      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-950 text-white py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-blue-300 text-xs mb-3">
            <i className="fas fa-home text-xs" />
            <span>Home</span>
            <i className="fas fa-chevron-right text-xs" />
            <span className="text-white font-medium">Claim Verification</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Item Ownership Verification</h1>
          <p className="text-blue-300 text-sm max-w-xl">
            Submit a formal claim for a found item. All claims are reviewed by the Student Services team
            and require valid student identification for collection.
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            {[
              { icon: "fa-clock",   text: "Processing: 1–2 business days" },
              { icon: "fa-id-card", text: "Student ID required for collection" },
              { icon: "fa-lock",    text: "Secure & Confidential" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 text-xs">
                <i className={`fas ${icon} text-blue-300`} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">

        {/* Step Progress */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-100 mx-12 hidden sm:block" />
            {steps.map((step) => {
              const done   = step.num < activeStep;
              const active = step.num === activeStep;
              return (
                <div key={step.num} className="flex flex-col items-center gap-2 z-10 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                    done   ? "bg-green-500 text-white" :
                    active ? "bg-blue-600 text-white ring-4 ring-blue-100" :
                             "bg-gray-100 text-gray-400"
                  }`}>
                    {done
                      ? <i className="fas fa-check text-xs" />
                      : <i className={`fas ${step.icon} text-xs`} />
                    }
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-semibold ${done ? "text-green-600" : active ? "text-blue-600" : "text-gray-400"}`}>
                      Step {step.num}
                    </p>
                    <p className="text-xs text-gray-400 hidden sm:block">{step.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 p-4 rounded-xl flex items-start gap-3 bg-red-50 border border-red-200 text-red-800">
            <i className="fas fa-exclamation-circle text-red-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-5">

          {/* ── Step 1 — Item Catalogue ──────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeader
              icon="fa-th-large" iconBg="bg-blue-100" iconColor="text-blue-600"
              step="Step 1" title="Select the Item to Claim"
              subtitle="Browse available found items and click one to select it"
            />

            {loading ? (
              <div className="flex flex-col items-center py-12 gap-3 text-gray-400">
                <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-sm">Loading found items...</span>
              </div>
            ) : foundItems.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-inbox text-3xl text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 font-medium">No found items are currently awaiting claims.</p>
                <p className="text-xs text-gray-400">Check back later or visit the Notice Board.</p>
              </div>
            ) : (
              <>
                {/* Search + count row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                  <div className="relative flex-1">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search by name, category or location..."
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <i className="fas fa-times-circle text-xs" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400">
                      {filteredFoundItems.length} of {foundItems.length} item{foundItems.length !== 1 ? "s" : ""}
                    </span>
                    {selectedItem && (
                      <button
                        onClick={() => setSelectedItem(null)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <i className="fas fa-times text-xs" /> Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Catalogue grid */}
                {filteredFoundItems.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    No items match "<span className="font-medium text-gray-600">{search}</span>"
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredFoundItems.map(item => {
                      const isSelected = selectedItem?._id === item._id;
                      return (
                        <div
                          key={item._id}
                          onClick={() => handleCardSelect(item)}
                          className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 group ${
                            isSelected
                              ? "border-blue-500 shadow-md ring-2 ring-blue-100"
                              : "border-gray-100 hover:border-blue-300 hover:shadow-sm"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                              <i className="fas fa-check text-white text-xs" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 z-10">
                            <span className="bg-black/50 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm capitalize">
                              {item.category?.replace(/-/g, " ")}
                            </span>
                          </div>
                          <div className="h-36 bg-gray-100 overflow-hidden">
                            {item.images?.[0] ? (
                              <img
                                src={item.images[0]}
                                alt={item.itemName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
                                <i className="fas fa-image text-3xl" />
                                <span className="text-xs text-gray-400">No image</span>
                              </div>
                            )}
                          </div>
                          <div className={`p-3 transition-colors ${isSelected ? "bg-blue-50" : "bg-white"}`}>
                            <p className="text-xs font-bold text-gray-800 truncate leading-snug">{item.itemName}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                              <i className="fas fa-map-marker-alt text-gray-400 flex-shrink-0" />
                              {item.location}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <i className="fas fa-calendar text-gray-300 flex-shrink-0" />
                              {new Date(item.dateTime).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                            {isSelected && (
                              <p className="mt-2 text-xs font-semibold text-blue-600 flex items-center gap-1">
                                <i className="fas fa-check-circle" /> Selected
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!selectedItem && (
                  <p className="text-center text-xs text-gray-400 mt-4">
                    <i className="fas fa-hand-pointer mr-1" />
                    Click on an item above to select it and proceed with your claim.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Selected Item Preview */}
          {selectedItem && (
            <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
              <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fas fa-box-open text-blue-500 text-sm" />
                  <span className="text-sm font-semibold text-blue-700">Selected Item Details</span>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">
                  Pending Claim
                </span>
              </div>
              <div className="p-6 flex flex-col sm:flex-row gap-5">
                <div className="sm:w-40 flex-shrink-0">
                  {selectedItem.images?.length > 0 ? (
                    <>
                      <img
                        src={selectedItem.images[0]}
                        alt={selectedItem.itemName}
                        className="w-full h-32 sm:h-36 object-cover rounded-xl border border-gray-100"
                      />
                      {selectedItem.images.length > 1 && (
                        <div className="grid grid-cols-3 gap-1 mt-2">
                          {selectedItem.images.slice(1, 4).map((img, idx) => (
                            <img key={idx} src={img} alt={`view ${idx + 2}`} className="h-10 w-full object-cover rounded-lg border border-gray-100" />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-32 sm:h-36 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center gap-2 text-gray-300">
                      <i className="fas fa-image text-3xl" />
                      <span className="text-xs text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Item Name",      value: selectedItem.itemName,                       icon: "fa-tag" },
                    { label: "Category",        value: selectedItem.category?.replace(/-/g, " "),  icon: "fa-folder", capitalize: true },
                    { label: "Found Location",  value: selectedItem.location,                      icon: "fa-map-marker-alt" },
                    { label: "Date Found",      value: formatDate(selectedItem.dateTime),          icon: "fa-calendar" },
                  ].map(({ label, value, icon, capitalize }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
                      <p className={`text-sm text-gray-700 flex items-center gap-1.5 ${capitalize ? "capitalize" : ""}`}>
                        <i className={`fas ${icon} text-gray-300 text-xs`} />{value}
                      </p>
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Description</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedItem.description}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2 & 3 — Form ────────────────────────────────────────── */}
          {selectedItem && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

              {/* ── Step 2 — Student Information ─────────────────────────── */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-orange-400 to-amber-400" />
                <div className="p-6">
                <SectionHeader
                  icon="fa-id-card" iconBg="bg-orange-100" iconColor="text-orange-500"
                  step="Step 2" title="Student Information"
                  subtitle="Provide your university identity details — all fields are required"
                />

                {/* Pre-fill notice */}
                {user && (
                  <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
                    <i className="fas fa-user-circle text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                      <span className="font-semibold">Auto-filled from your account.</span>{" "}
                      Your name and email have been pre-populated. Please verify they are correct before submitting.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* Full Name */}
                  <Field
                    label="Full Name"
                    required
                    hint="Letters only — as it appears on your Student ID card"
                    error={errors.name}
                    touched={touched.name}
                  >
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleNameChange}
                        onBlur={handleBlur}
                        placeholder="e.g. Kavindu Perera"
                        maxLength={60}
                        className={inputClass("name")}
                      />
                      {touched.name && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2">
                          {errors.name
                            ? <i className="fas fa-times-circle text-red-400 text-sm" />
                            : <i className="fas fa-check-circle text-green-400 text-sm" />
                          }
                        </span>
                      )}
                    </div>
                  </Field>

                  {/* Student ID */}
                  <Field
                    label="Student ID Number"
                    required
                    hint={!touched.studentId ? 'Format: IT followed by 8 digits — e.g. IT21123456' : undefined}
                    error={errors.studentId}
                    touched={touched.studentId}
                  >
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                          {formData.studentId.slice(0, 2)}
                        </span>
                      </div>
                      <input
                        type="text"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleStudentIdChange}
                        onBlur={handleBlur}
                        placeholder="IT21123456"
                        maxLength={10}
                        className={`${inputClass("studentId")} pl-14 font-mono tracking-wider`}
                      />
                      {touched.studentId && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2">
                          {errors.studentId
                            ? <i className="fas fa-times-circle text-red-400 text-sm" />
                            : <i className="fas fa-check-circle text-green-400 text-sm" />
                          }
                        </span>
                      )}
                    </div>
                    {!touched.studentId && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <i className="fas fa-info-circle text-blue-400" />
                        Your Student ID always starts with <span className="font-bold text-blue-600">IT</span>
                      </p>
                    )}
                  </Field>

                  {/* University Email */}
                  <Field
                    label="University Email"
                    required
                    hint={!touched.email ? "Use your official university email (e.g. it21xxxxxx@my.sliit.lk)" : undefined}
                    error={errors.email}
                    touched={touched.email}
                  >
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="it21xxxxxx@my.sliit.lk"
                        className={inputClass("email")}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {user?.email && formData.email === user.email && (
                          <i className="fas fa-lock text-blue-400 text-xs" title="From your account" />
                        )}
                        {touched.email && (
                          errors.email
                            ? <i className="fas fa-times-circle text-red-400 text-sm" />
                            : <i className="fas fa-check-circle text-green-400 text-sm" />
                        )}
                      </span>
                    </div>
                  </Field>

                  {/* Contact Number */}
                  <Field
                    label="Contact Number"
                    required
                    hint={!touched.phone ? "Sri Lankan mobile number — e.g. 0712345678" : undefined}
                    error={errors.phone}
                    touched={touched.phone}
                  >
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <i className="fas fa-phone text-gray-400 text-xs" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        onBlur={handleBlur}
                        placeholder="0712345678"
                        maxLength={10}
                        className={`${inputClass("phone")} pl-9 font-mono`}
                      />
                      {touched.phone && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2">
                          {errors.phone
                            ? <i className="fas fa-times-circle text-red-400 text-sm" />
                            : <i className="fas fa-check-circle text-green-400 text-sm" />
                          }
                        </span>
                      )}
                    </div>
                  </Field>

                  {/* Faculty / Department */}
                  <Field
                    label="Faculty / Department"
                    required
                    error={errors.faculty}
                    touched={touched.faculty}
                  >
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <i className="fas fa-university text-gray-400 text-xs" />
                      </div>
                      <select
                        name="faculty"
                        value={formData.faculty}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`${inputClass("faculty")} pl-9 appearance-none bg-white`}
                      >
                        <option value="">— Select your faculty —</option>
                        {FACULTY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {touched.faculty
                          ? errors.faculty
                            ? <i className="fas fa-times-circle text-red-400 text-sm" />
                            : <i className="fas fa-check-circle text-green-400 text-sm" />
                          : <i className="fas fa-chevron-down text-gray-400 text-xs" />
                        }
                      </span>
                    </div>
                  </Field>

                  {/* Year / Level of Study */}
                  <Field
                    label="Year / Level of Study"
                    required
                    error={errors.yearOfStudy}
                    touched={touched.yearOfStudy}
                  >
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <i className="fas fa-graduation-cap text-gray-400 text-xs" />
                      </div>
                      <select
                        name="yearOfStudy"
                        value={formData.yearOfStudy}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`${inputClass("yearOfStudy")} pl-9 appearance-none bg-white`}
                      >
                        <option value="">— Select year —</option>
                        {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {touched.yearOfStudy
                          ? errors.yearOfStudy
                            ? <i className="fas fa-times-circle text-red-400 text-sm" />
                            : <i className="fas fa-check-circle text-green-400 text-sm" />
                          : <i className="fas fa-chevron-down text-gray-400 text-xs" />
                        }
                      </span>
                    </div>
                  </Field>

                  {/* Semester */}
                  <Field
                    label="Semester"
                    required
                    error={errors.semester}
                    touched={touched.semester}
                  >
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <i className="fas fa-calendar-alt text-gray-400 text-xs" />
                      </div>
                      <select
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`${inputClass("semester")} pl-9 appearance-none bg-white`}
                      >
                        <option value="">— Select semester —</option>
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 2">Semester 2</option>
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {touched.semester
                          ? errors.semester
                            ? <i className="fas fa-times-circle text-red-400 text-sm" />
                            : <i className="fas fa-check-circle text-green-400 text-sm" />
                          : <i className="fas fa-chevron-down text-gray-400 text-xs" />
                        }
                      </span>
                    </div>
                  </Field>

                </div>
                </div>
              </div>

              {/* ── Step 3 — Ownership Verification ──────────────────────── */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-purple-400 to-violet-500" />
                <div className="p-6">
                <SectionHeader
                  icon="fa-shield-alt" iconBg="bg-purple-100" iconColor="text-purple-500"
                  step="Step 3" title="Ownership Verification"
                  subtitle="Provide evidence that proves the item belongs to you"
                />

                <div className="flex flex-col gap-5">

                  {/* Description */}
                  <Field
                    label="Describe the Item in Your Own Words"
                    required
                    hint={!touched.description
                      ? "Include colour, brand, model, stickers, scratches, or any identifying characteristics not visible in the public listing."
                      : undefined
                    }
                    error={errors.description}
                    touched={touched.description}
                  >
                    <div className="relative">
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        rows="4"
                        placeholder="e.g. Black HP laptop with a cracked bottom-left corner, a SLIIT sticker on the lid, and a blue phone case in the bag..."
                        className={`${inputClass("description")} resize-none`}
                      />
                      {touched.description && (
                        <span className="absolute right-3 top-3">
                          {errors.description
                            ? <i className="fas fa-times-circle text-red-400 text-sm" />
                            : <i className="fas fa-check-circle text-green-400 text-sm" />
                          }
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      {touched.description && errors.description
                        ? <ErrorMsg error={errors.description} />
                        : <span />
                      }
                      <span className={`text-xs ml-auto ${formData.description.length < 20 ? "text-gray-400" : "text-green-500"}`}>
                        {formData.description.length} chars {formData.description.length < 20 ? `(${20 - formData.description.length} more needed)` : "✓"}
                      </span>
                    </div>
                  </Field>

                  {/* Ownership Proof */}
                  <Field
                    label="Proof of Ownership"
                    required
                    hint={!touched.ownershipProof
                      ? "Provide verifiable proof: serial number, IMEI, purchase receipt details, saved content, engraving, or student ID found on the item."
                      : undefined
                    }
                    error={errors.ownershipProof}
                    touched={touched.ownershipProof}
                  >
                    <div className="relative">
                      <textarea
                        name="ownershipProof"
                        value={formData.ownershipProof}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        rows="3"
                        placeholder="e.g. Serial number: SN123456789, or purchase receipt from Softlogic dated Jan 2024, or IMEI: 123456789012345..."
                        className={`${inputClass("ownershipProof")} resize-none`}
                      />
                      {touched.ownershipProof && (
                        <span className="absolute right-3 top-3">
                          {errors.ownershipProof
                            ? <i className="fas fa-times-circle text-red-400 text-sm" />
                            : <i className="fas fa-check-circle text-green-400 text-sm" />
                          }
                        </span>
                      )}
                    </div>
                  </Field>

                  {/* Additional Info */}
                  <Field
                    label="Additional Supporting Information"
                    hint="Optional — include circumstances of loss, approximate time, or any other details that support your claim."
                  >
                    <textarea
                      name="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={handleChange}
                      rows="3"
                      placeholder="e.g. I lost it on the 104 bus from Malabe to Colombo on Tuesday morning around 8:30 AM..."
                      className="w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </Field>

                  {/* Supporting Photos */}
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Supporting Photos
                      <span className="ml-1.5 text-xs text-gray-400 font-normal">(Optional — up to {MAX_IMAGES} images)</span>
                    </label>
                    <p className="text-xs text-gray-400 mb-3">
                      Upload photos that prove you owned this item — e.g. a photo of you with the item, a screenshot, a receipt, or any other visual evidence.
                    </p>

                    {claimantImages.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                        {claimantImages.map((src, idx) => (
                          <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
                            <img src={src} alt={`Supporting photo ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                            >
                              <i className="fas fa-times text-[9px]" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/30 text-white text-[9px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              Photo {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {claimantImages.length < MAX_IMAGES && (
                      <label className="flex flex-col items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200 shadow-sm">
                          <i className="fas fa-camera text-blue-500 text-base" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-700">Click to upload photos</p>
                          <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP · Max {MAX_IMAGES} images</p>
                        </div>
                        <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple onChange={handleImageUpload} className="hidden" />
                      </label>
                    )}

                    {imageError && (
                      <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle" /> {imageError}
                      </p>
                    )}
                    {claimantImages.length >= MAX_IMAGES && (
                      <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                        <i className="fas fa-info-circle" /> Maximum of {MAX_IMAGES} photos reached. Remove one to add another.
                      </p>
                    )}
                  </div>

                  {/* What to bring notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <i className="fas fa-info-circle text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-semibold mb-1">Documents Required for Collection</p>
                      <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                        <li>Valid Student ID card (physical)</li>
                        <li>This claim's reference number (emailed to you)</li>
                        <li>Any supporting proof of ownership if applicable</li>
                      </ul>
                    </div>
                  </div>

                  {/* Declaration */}
                  <div className={`border rounded-xl p-4 transition-colors ${
                    !formData.declaration
                      ? "bg-gray-50 border-gray-200"
                      : "bg-green-50 border-green-200"
                  }`}>
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        name="declaration"
                        checked={formData.declaration}
                        onChange={handleChange}
                        className="mt-0.5 w-4 h-4 accent-blue-600 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700 leading-relaxed">
                        <span className="font-semibold text-gray-800">Declaration: </span>
                        I hereby declare that the information provided in this claim is true and accurate to the best of my knowledge.
                        I understand that submitting a false or fraudulent claim may result in{" "}
                        <span className="font-medium">disciplinary action</span> in accordance with university regulations.
                      </span>
                    </label>
                    {!formData.declaration && touched.declaration === undefined && (
                      <p className="mt-2 text-xs text-gray-400 ml-7">
                        <i className="fas fa-exclamation-circle mr-1" />
                        You must accept the declaration to submit your claim.
                      </p>
                    )}
                  </div>

                </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-4 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${
                  isFormValid && !submitting
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 cursor-pointer"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {submitting ? (
                  <><i className="fas fa-spinner fa-spin" /> Submitting Claim...</>
                ) : (
                  <><i className="fas fa-paper-plane" /> Submit Ownership Claim</>
                )}
              </button>

              {!isFormValid && !submitting && (
                <p className="text-center text-xs text-gray-400">
                  <i className="fas fa-lock mr-1" />
                  Complete all required fields, correct any errors, and accept the declaration to enable submission.
                </p>
              )}

            </form>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
