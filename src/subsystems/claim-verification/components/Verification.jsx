import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { useState, useEffect } from "react";
import { api } from "../../../api";

const YEAR_OPTIONS = [
  "Year 1 (L1)",
  "Year 2 (L2)",
  "Year 3 (L3)",
  "Year 4 (L4)",
  "Masters (MSc)",
  "PhD",
  "Postgraduate Diploma",
  "Other",
];

//label

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block mb-1.5 text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function SectionHeader({ icon, iconBg, iconColor, step, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
      <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <i className={`fas ${icon} ${iconColor} text-sm`}></i>
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-800">{step} — {title}</h2>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

export default function Verification() {
  const [foundItems, setFoundItems]     = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [search, setSearch]             = useState('');
  const [loading, setLoading]           = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');
  const [claimRef, setClaimRef]         = useState('');

  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    phone: '',
    faculty: '',
    yearOfStudy: '',
    description: '',
    ownershipProof: '',
    additionalInfo: '',
    declaration: false,
  });

  const [touched, setTouched] = useState({});

  useEffect(() => { fetchFoundItems(); }, []);

  const fetchFoundItems = async () => {
    setLoading(true);
    try {
      const response = await api.get('/lost-found');
      setFoundItems(
        response.data.data.filter(
          item => item.itemType === 'found' && item.status === 'pending'
        )
      );
      setError('');
    } catch {
      setError('Failed to load found items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCardSelect = (item) => {
    setSelectedItem(prev => prev?._id === item._id ? null : item);
    setError('');
    setClaimRef('');
  };

  const filteredFoundItems = foundItems.filter(item => {
    const q = search.toLowerCase();
    return (
      item.itemName?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q)
    );
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleBlur = (e) => setTouched(prev => ({ ...prev, [e.target.name]: true }));

  const requiredFields = ['name', 'studentId', 'email', 'phone', 'faculty', 'yearOfStudy', 'description', 'ownershipProof'];
  const isFormValid = requiredFields.every(f => formData[f]?.toString().trim()) && formData.declaration && selectedItem;

  const activeStep = claimRef ? 4 : selectedItem ? (requiredFields.every(f => formData[f]?.toString().trim()) ? 3 : 2) : 1;

  const steps = [
    { num: 1, label: "Select Item",      icon: "fa-search"      },
    { num: 2, label: "Your Details",     icon: "fa-id-card"     },
    { num: 3, label: "Ownership Proof",  icon: "fa-shield-alt"  },
    { num: 4, label: "Confirmation",     icon: "fa-check-circle" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setError('Please complete all required fields and accept the declaration before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/verification', {
        itemId: selectedItem._id,
        claimantInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: `${formData.faculty} — ${formData.yearOfStudy}`,
        },
        verificationDetails: {
          description: formData.description,
          ownershipProof: `[Student ID: ${formData.studentId}] ${formData.ownershipProof}`,
          additionalInfo: formData.additionalInfo,
        },
      });

      // Generate a local reference code
      const ref = `CLM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,5).toUpperCase()}`;
      setClaimRef(ref);

      setFormData({
        name: '', studentId: '', email: '', phone: '', faculty: '',
        yearOfStudy: '', description: '', ownershipProof: '',
        additionalInfo: '', declaration: false,
      });
      setSelectedItem(null);
      setTouched({});
      fetchFoundItems();

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit your claim. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const inputClass = (name) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
      touched[name] && !formData[name]?.toString().trim()
        ? 'border-red-300 bg-red-50'
        : 'border-gray-200 bg-white'
    }`;

  // ── Submission Success ───────────────────────────────────────────────────────
  if (claimRef) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-gray-50">
        <Header />
        <main className="flex-1 px-4 py-12 max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Top accent */}
            <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500" />

            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <i className="fas fa-check-circle text-green-500 text-4xl"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Claim Submitted Successfully</h2>
              <p className="text-gray-500 text-sm mb-6">
                Your ownership claim has been received and is under review by the Student Services team.
              </p>

              {/* Reference number */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-6 inline-block">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Claim Reference Number</p>
                <p className="text-2xl font-mono font-bold text-blue-700 tracking-widest">{claimRef}</p>
                <p className="text-xs text-gray-400 mt-1">Keep this number for your records</p>
              </div>

              {/* Next steps */}
              <div className="text-left bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
                <p className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <i className="fas fa-list-ol text-blue-500"></i> What Happens Next
                </p>
                <ol className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">1</span>
                    Our team will review your submitted details within <strong>1–2 business days</strong>.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">2</span>
                    You will receive a confirmation email to the address you provided.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">3</span>
                    Once approved, visit the <strong>Student Services Office</strong> with your Student ID card and this reference number to collect your item.
                  </li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setClaimRef('')}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition flex items-center gap-2 justify-center"
                >
                  <i className="fas fa-plus-circle"></i> Submit Another Claim
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition flex items-center gap-2 justify-center"
                >
                  <i className="fas fa-print"></i> Print Confirmation
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Main Form ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50">
      <Header />

      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-950 text-white py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-blue-300 text-xs mb-3">
            <i className="fas fa-home text-xs"></i>
            <span>Home</span>
            <i className="fas fa-chevron-right text-xs"></i>
            <span className="text-white font-medium">Claim Verification</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Item Ownership Verification</h1>
          <p className="text-blue-300 text-sm max-w-xl">
            Submit a formal claim for a found item. All claims are reviewed by the Student Services team and require valid student identification for collection.
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 text-xs">
              <i className="fas fa-clock text-blue-300"></i>
              <span>Processing: 1–2 business days</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 text-xs">
              <i className="fas fa-id-card text-blue-300"></i>
              <span>Student ID required for collection</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 text-xs">
              <i className="fas fa-lock text-blue-300"></i>
              <span>Secure & Confidential</span>
            </div>
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
                    done   ? 'bg-green-500 text-white' :
                    active ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                             'bg-gray-100 text-gray-400'
                  }`}>
                    {done
                      ? <i className="fas fa-check text-xs" />
                      : <i className={`fas ${step.icon} text-xs`} />
                    }
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-semibold ${done ? 'text-green-600' : active ? 'text-blue-600' : 'text-gray-400'}`}>
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

          {/* Step 1 — Item Catalogue */}
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
                        onClick={() => setSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <i className="fas fa-times-circle text-xs" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400">
                      {filteredFoundItems.length} of {foundItems.length} item{foundItems.length !== 1 ? 's' : ''}
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
                              ? 'border-blue-500 shadow-md ring-2 ring-blue-100'
                              : 'border-gray-100 hover:border-blue-300 hover:shadow-sm'
                          }`}
                        >
                          {/* Selected checkmark */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                              <i className="fas fa-check text-white text-xs" />
                            </div>
                          )}

                          {/* Category badge */}
                          <div className="absolute top-2 left-2 z-10">
                            <span className="bg-black/50 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm capitalize">
                              {item.category?.replace(/-/g, ' ')}
                            </span>
                          </div>

                          {/* Image */}
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

                          {/* Card info */}
                          <div className={`p-3 transition-colors ${isSelected ? 'bg-blue-50' : 'bg-white'}`}>
                            <p className="text-xs font-bold text-gray-800 truncate leading-snug">{item.itemName}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                              <i className="fas fa-map-marker-alt text-gray-400 flex-shrink-0" />
                              {item.location}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <i className="fas fa-calendar text-gray-300 flex-shrink-0" />
                              {new Date(item.dateTime).toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' })}
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

                {/* Selection prompt */}
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
                    { label: "Item Name",     value: selectedItem.itemName,                      icon: "fa-tag" },
                    { label: "Category",       value: selectedItem.category?.replace(/-/g, ' '), icon: "fa-folder", capitalize: true },
                    { label: "Found Location", value: selectedItem.location,                     icon: "fa-map-marker-alt" },
                    { label: "Date Found",     value: formatDate(selectedItem.dateTime),         icon: "fa-calendar" },
                  ].map(({ label, value, icon, capitalize }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
                      <p className={`text-sm text-gray-700 flex items-center gap-1.5 ${capitalize ? 'capitalize' : ''}`}>
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

          {/* Step 2 & 3 — Form */}
          {selectedItem && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

              {/* Step 2 — Student Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <SectionHeader
                  icon="fa-id-card" iconBg="bg-orange-100" iconColor="text-orange-500"
                  step="Step 2" title="Student Information"
                  subtitle="Provide your university identity details — all fields are required"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  <Field label="Full Name" required hint="As it appears on your Student ID card">
                    <input
                      type="text" name="name" value={formData.name}
                      onChange={handleChange} onBlur={handleBlur}
                      placeholder="e.g. Kavindu Perera"
                      className={inputClass('name')}
                    />
                  </Field>

                  <Field label="Student ID Number" required hint="Your university registration / index number">
                    <input
                      type="text" name="studentId" value={formData.studentId}
                      onChange={handleChange} onBlur={handleBlur}
                      placeholder="e.g. IT21123456"
                      className={inputClass('studentId')}
                    />
                  </Field>

                  <Field label="University Email" required hint="Use your official university email (@sliit.lk, etc.)">
                    <input
                      type="email" name="email" value={formData.email}
                      onChange={handleChange} onBlur={handleBlur}
                      placeholder="it21xxxxxx@my.sliit.lk"
                      className={inputClass('email')}
                    />
                  </Field>

                  <Field label="Contact Number" required>
                    <input
                      type="tel" name="phone" value={formData.phone}
                      onChange={handleChange} onBlur={handleBlur}
                      placeholder="07X XXX XXXX"
                      className={inputClass('phone')}
                    />
                  </Field>

                  <Field label="Faculty / Department" required>
                    <input
                      type="text" name="faculty" value={formData.faculty}
                      onChange={handleChange} onBlur={handleBlur}
                      placeholder="e.g. Faculty of Computing"
                      className={inputClass('faculty')}
                    />
                  </Field>

                  <Field label="Year / Level of Study" required>
                    <select
                      name="yearOfStudy" value={formData.yearOfStudy}
                      onChange={handleChange} onBlur={handleBlur}
                      className={inputClass('yearOfStudy')}
                    >
                      <option value="">— Select your year —</option>
                      {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </Field>

                </div>
              </div>

              {/* Step 3 — Ownership Verification */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <SectionHeader
                  icon="fa-shield-alt" iconBg="bg-purple-100" iconColor="text-purple-500"
                  step="Step 3" title="Ownership Verification"
                  subtitle="Provide evidence that proves the item belongs to you"
                />

                <div className="flex flex-col gap-5">

                  <Field
                    label="Describe the Item in Your Own Words"
                    required
                    hint="Include unique features, colour, brand, model, stickers, scratches, or any identifying characteristics not visible in the public listing."
                  >
                    <textarea
                      name="description" value={formData.description}
                      onChange={handleChange} onBlur={handleBlur}
                      rows="4"
                      placeholder="e.g. Black HP laptop with a cracked bottom-left corner, a SLIIT sticker on the lid, and a blue phone case in the bag..."
                      className={`${inputClass('description')} resize-none`}
                    />
                  </Field>

                  <Field
                    label="Proof of Ownership"
                    required
                    hint="Provide verifiable proof: serial number, IMEI, purchase receipt details, saved content/files, engraving, or student ID found on the item."
                  >
                    <textarea
                      name="ownershipProof" value={formData.ownershipProof}
                      onChange={handleChange} onBlur={handleBlur}
                      rows="3"
                      placeholder="e.g. Serial number: SN123456789, or purchase receipt from Softlogic dated Jan 2024, or IMEI: 123456789012345..."
                      className={`${inputClass('ownershipProof')} resize-none`}
                    />
                  </Field>

                  <Field
                    label="Additional Supporting Information"
                    hint="Optional — include circumstances of loss, approximate time, or any other details that support your claim."
                  >
                    <textarea
                      name="additionalInfo" value={formData.additionalInfo}
                      onChange={handleChange}
                      rows="3"
                      placeholder="e.g. I lost it on the 104 bus from Malabe to Colombo on Tuesday morning around 8:30 AM..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </Field>

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
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
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
                        I hereby declare that the information provided in this claim is true and accurate to the best of my knowledge. I understand that submitting a false or fraudulent claim may result in <span className="font-medium">disciplinary action</span> in accordance with university regulations.
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !isFormValid}
                className={`w-full py-4 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${
                  isFormValid && !submitting
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 cursor-pointer'
                    : 'bg-gray-300 cursor-not-allowed'
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
                  Complete all required fields and accept the declaration to enable submission.
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
