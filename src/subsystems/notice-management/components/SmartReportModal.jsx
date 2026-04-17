import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

let cachedModel = null;
let modelLoadPromise = null;

const ITEM_TYPE_OPTIONS = [
  { value: 'student-id',   label: 'Student ID' },
  { value: 'mobile-phone', label: 'Mobile Phone' },
  { value: 'laptop',       label: 'Laptop / Tablet' },
  { value: 'wallet',       label: 'Wallet / Purse' },
  { value: 'headphones',   label: 'Headphones / Earphones' },
  { value: 'water-bottle', label: 'Water Bottle' },
  { value: 'bag',          label: 'Bag / Backpack' },
  { value: 'watch',        label: 'Watch / Accessory' },
  { value: 'umbrella',     label: 'Umbrella' },
  { value: 'atm-card',     label: 'ATM / Bank Card' },
  { value: 'license',      label: 'License / Document' },
  { value: 'keys',         label: 'Keys' },
  { value: 'books',        label: 'Books / Notes' },
  { value: 'stationery',   label: 'Stationery' },
  { value: 'clothing',     label: 'Clothing' },
  { value: 'other',        label: 'Other' }
];

const URGENT_ITEMS = ['student-id', 'mobile-phone', 'laptop', 'atm-card', 'license', 'wallet'];

const TARGET_AUDIENCE_OPTIONS = [
  { value: 'all-students',      label: 'All Students' },
  { value: 'undergraduate',     label: 'Undergraduate Students' },
  { value: 'postgraduate',      label: 'Postgraduate Students' },
  { value: 'academic-staff',    label: 'Academic Staff' },
  { value: 'non-academic-staff',label: 'Non-Academic Staff' },
  { value: 'all-university',    label: 'All University Community' }
];

// Keywords are matched against actual MobileNet v2 / ImageNet label strings.
// Rule order matters: more specific rules should come first.
const DETECTION_RULES = [
  {
    itemType: 'student-id',
    title: 'Student ID Card',
    keywords: ['student id', 'student card', 'identity card', 'id card', 'badge', 'name tag', 'card index', 'envelope']
  },
  {
    itemType: 'mobile-phone',
    title: 'Mobile Phone',
    keywords: [
      'cellular telephone', 'cell', 'cellphone', 'mobile phone', 'smartphone',
      'iphone', 'android', 'phone', 'mobile', 'hand-held computer', 'dial telephone',
      'radio telephone', 'radiotelephone'
    ]
  },
  {
    itemType: 'laptop',
    title: 'Laptop / Tablet',
    keywords: [
      'laptop', 'laptop computer', 'notebook computer', 'notebook', 'macbook',
      'tablet', 'tablet computer', 'ipad', 'personal computer', 'desktop computer',
      'monitor', 'screen', 'computer keyboard'
    ]
  },
  {
    itemType: 'wallet',
    title: 'Wallet',
    keywords: [
      'wallet', 'billfold', 'notecase', 'pocketbook', 'purse',
      'clutch bag', 'coin bag', 'change purse'
    ]
  },
  {
    itemType: 'headphones',
    title: 'Headphones',
    keywords: [
      'headphone', 'headset', 'earphone', 'earbud', 'earplug',
      'loudspeaker', 'speaker', 'amplifier', 'microphone',
      'iPod', 'mp3 player', 'walkman'
    ]
  },
  {
    itemType: 'water-bottle',
    title: 'Water Bottle',
    keywords: [
      'water bottle', 'pop bottle', 'soda bottle', 'water jug', 'bottle',
      'thermos', 'canteen', 'carafe', 'drinking vessel', 'flask',
      'measuring cup', 'measure', 'beaker', 'test tube', 'container',
      'cylinder', 'barrel', 'bucket', 'pitcher', 'tumbler'
    ]
  },
  {
    itemType: 'bag',
    title: 'Bag / Backpack',
    keywords: [
      'backpack', 'back pack', 'knapsack', 'rucksack',
      'handbag', 'tote bag', 'shoulder bag', 'mailbag',
      'duffel bag', 'suitcase', 'briefcase', 'luggage'
    ]
  },
  {
    itemType: 'watch',
    title: 'Watch',
    keywords: [
      'digital watch', 'analog clock', 'stopwatch', 'wristwatch', 'ticker',
      'watch', 'wall clock', 'timepiece', 'chronograph', 'sundial', 'hourglass'
    ]
  },
  {
    itemType: 'umbrella',
    title: 'Umbrella',
    keywords: ['umbrella', 'sunshade', 'parasol']
  },
  {
    itemType: 'atm-card',
    title: 'Bank Card',
    keywords: ['credit card', 'debit card', 'bank card', 'atm card', 'plastic card']
  },
  {
    itemType: 'license',
    title: 'Document',
    keywords: [
      'passport', 'license', 'licence', 'document', 'paper',
      'book jacket', 'menu', 'comic book', 'binder', 'file', 'letter'
    ]
  },
  {
    itemType: 'keys',
    title: 'Keys',
    keywords: [
      'key', 'keyring', 'keychain', 'padlock', 'combination lock', 'lock',
      'remote control', 'remote', 'car key', 'fob', 'key fob',
      'ignition', 'car remote', 'push button', 'button'
    ]
  },
  {
    itemType: 'books',
    title: 'Book / Notes',
    keywords: [
      'book', 'comic book', 'library', 'text book', 'booklet',
      'pad', 'spiral', 'notebook'
    ]
  },
  {
    itemType: 'stationery',
    title: 'Stationery Item',
    keywords: [
      'pen', 'pencil', 'ballpoint', 'fountain pen', 'marker', 'highlighter',
      'eraser', 'rubber eraser', 'pencil box', 'pencil case', 'pencil sharpener',
      'scissors', 'stapler', 'calculator',
      'usb', 'flash drive', 'thumb drive', 'memory stick'
    ]
  },
  {
    itemType: 'clothing',
    title: 'Clothing Item',
    keywords: [
      'jacket', 'coat', 'sweatshirt', 'jersey', 'shirt', 'sweater',
      'cap', 'hat', 'cowboy hat', 'baseball cap', 'beanie',
      'shoe', 'sandal', 'sock', 'glove', 'scarf', 'tie', 'dress',
      'trousers', 'pants', 'skirt', 'hoodie'
    ]
  },
  {
    itemType: 'other',
    title: 'Item',
    keywords: ['object', 'thing', 'item', 'tool', 'device', 'equipment']
  }
];

function normalizePredictionText(predictions = []) {
  return predictions
    .flatMap((prediction) => prediction.className.split(','))
    .map((label) => label.trim().toLowerCase())
    .filter(Boolean);
}

// Bidirectional match: "cell" hits "cellular telephone" and vice-versa.
function keywordHits(label, keyword) {
  return label.includes(keyword) || keyword.includes(label);
}

function detectItemFromPredictions(predictions = []) {
  const labels = normalizePredictionText(predictions);

  // Weight: prediction rank 0 = 1.0, rank 1 = 0.85, rank 2 = 0.7 …
  // Each prediction may expand to multiple comma-split sub-labels;
  // track sub-label index separately so early sub-labels carry more weight.
  const weightedLabels = [];
  predictions.forEach((pred, predIdx) => {
    const subLabels = pred.className.split(',').map(l => l.trim().toLowerCase()).filter(Boolean);
    subLabels.forEach((sub, subIdx) => {
      weightedLabels.push({
        label: sub,
        weight: Math.max(0.15, (1 - predIdx * 0.15) * (1 - subIdx * 0.1))
      });
    });
  });

  const scoredMatches = DETECTION_RULES.map((rule) => {
    const score = weightedLabels.reduce((total, { label, weight }) => {
      const hit = rule.keywords.some((keyword) => keywordHits(label, keyword));
      return hit ? total + weight : total;
    }, 0);
    return { ...rule, score };
  }).sort((a, b) => b.score - a.score);

  const bestMatch = scoredMatches[0];
  const topConfidence = predictions[0]?.probability || 0;

  // When both the model confidence and keyword score are too low, don't guess —
  // flag as uncertain so the UI can ask the user to select manually.
  const isUncertain =
    (!bestMatch || bestMatch.score <= 0) ||
    (topConfidence < 0.30 && bestMatch.score < 0.5);

  if (isUncertain) {
    return { itemType: 'other', detectedTitle: 'Item', confidenceLabel: 'low', uncertain: true };
  }

  const confidenceLabel =
    bestMatch.score >= 1.5 && topConfidence >= 0.5 ? 'high' :
    bestMatch.score >= 0.5 && topConfidence >= 0.3 ? 'moderate' : 'low';

  return {
    itemType: bestMatch.itemType,
    detectedTitle: bestMatch.title,
    confidenceLabel,
    uncertain: false
  };
}

function generateNoticeContent(detection, probability) {
  const conf = `${probability}% AI confidence`;
  const name = detection.detectedTitle.toLowerCase();
  const templates = {
    'mobile-phone':  `A mobile phone was found on campus. AI image analysis identified this as a ${name} (${conf}). If this device belongs to you, please contact me with identifying details such as the brand, model, or lock screen description to verify ownership.`,
    'laptop':        `A laptop or tablet was found on campus. AI analysis identified this as a ${name} (${conf}). This is a high-value item — please contact me promptly with proof of ownership such as the device serial number or login email.`,
    'wallet':        `A wallet was found on campus. AI identified this as a ${name} (${conf}). Please contact me and describe the wallet's colour, brand, or contents to confirm it belongs to you.`,
    'headphones':    `A pair of headphones or earphones was found on campus. AI identified this as ${name} (${conf}). Please contact me with the brand, model, or case colour to confirm ownership.`,
    'water-bottle':  `A water bottle was found on campus. AI identified this as a ${name} (${conf}). Contact me with the bottle colour, brand, or any personalised markings to claim it.`,
    'bag':           `A bag or backpack was found on campus. AI identified this as a ${name} (${conf}). Please contact me and describe the bag's colour, brand, or any contents visible on top to verify ownership.`,
    'watch':         `A watch or accessory was found on campus. AI identified this as a ${name} (${conf}). Please describe the brand, colour, or strap style to verify ownership.`,
    'umbrella':      `An umbrella was found on campus. AI identified this as a ${name} (${conf}). Contact me with the colour or brand to claim it.`,
    'student-id':    `A student ID card was found on campus. AI identified this as a ${name} (${conf}). The rightful owner may contact me directly or visit the Lost & Found office to retrieve it.`,
    'atm-card':      `A bank or ATM card was found on campus. AI identified this as a ${name} (${conf}). Please contact me immediately — this is a sensitive item requiring urgent attention.`,
    'license':       `An important document or license was found on campus. AI identified this as a ${name} (${conf}). Please contact me with details to verify ownership.`,
    'keys':          `A set of keys was found on campus. AI identified this as a ${name} (${conf}). Please contact me with a description of the keychain or number of keys to claim them.`,
    'books':         `A book or set of notes was found on campus. AI identified this as a ${name} (${conf}). Contact me with the title or your name written inside to claim it.`,
    'stationery':    `A stationery item was found on campus. AI identified this as a ${name} (${conf}). Contact me if this belongs to you.`,
    'clothing':      `A clothing item was found on campus. AI identified this as a ${name} (${conf}). Please contact me with a description of the item to claim it.`,
  };
  return templates[detection.itemType] ||
    `An item was found on campus. AI analysis suggests it may be a ${name} (${conf}). Please contact me if this belongs to you.`;
}

async function loadSmartReportModel() {
  if (cachedModel) {
    return cachedModel;
  }

  if (!modelLoadPromise) {
    modelLoadPromise = (async () => {
      await window.tf.ready();
      const loadedModel = await window.mobilenet.load({ version: 2, alpha: 1.0 });
      cachedModel = loadedModel;
      return loadedModel;
    })().catch((error) => {
      modelLoadPromise = null;
      throw error;
    });
  }

  return modelLoadPromise;
}

export function preloadSmartReportModel() {
  return loadSmartReportModel().catch((err) => {
    console.error("Failed to preload MobileNet", err);
    return null;
  });
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function formatDateInput(date) {
  return date.toISOString().split('T')[0];
}

function getExpiryDateForPriority(priority, startDate = getTodayDate()) {
  const date = new Date(startDate);

  if (priority === 'urgent') {
    date.setMonth(date.getMonth() + 3);
  } else if (priority === 'medium') {
    date.setMonth(date.getMonth() + 1);
  } else {
    date.setDate(date.getDate() + 14);
  }

  return formatDateInput(date);
}

function getDefaultExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return formatDateInput(date);
}

function resolvePriority(itemType) {
  if (URGENT_ITEMS.includes(itemType)) return 'urgent';
  if (['keys', 'books', 'stationery', 'headphones', 'watch'].includes(itemType)) return 'medium';
  return 'low';
}

function resolveTargetAudience(itemType) {
  if (['student-id', 'books', 'stationery'].includes(itemType)) return 'all-students';
  return 'all-university';
}

export default function SmartReportModal({ onClose, tempUser }) {
  const [model, setModel] = useState(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [isInferencing, setIsInferencing] = useState(false);
  const [aiPredictions, setAiPredictions] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'found-item',
    itemType: 'other',
    priority: 'low',
    targetAudience: 'all-university',
    content: '',
    startDate: getTodayDate(),
    endDate: getDefaultExpiryDate(),
    contactPhone: '',
    contactEmail: tempUser?.email || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await loadSmartReportModel();
        setModel(loadedModel);
      } catch (err) {
        console.error("Failed to load MobileNet", err);
      } finally {
        setLoadingModel(false);
      }
    };
    loadModel();
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
      setAiPredictions(null); // Reset until analyzed
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imgRef.current || !model) return;
    setIsInferencing(true);

    try {
      // Classify with topK=10 for broader label coverage → better keyword matching
      const predictions = await model.classify(imgRef.current, 10);
      setAiPredictions(predictions);

      const probability = ((predictions[0]?.probability || 0) * 100).toFixed(1);
      const detection = detectItemFromPredictions(predictions);

      setFormData(prev => {
        if (detection.uncertain) {
          // Low confidence — leave itemType for the user to select manually,
          // but still populate a generic title/content so the form isn't empty.
          return {
            ...prev,
            title: 'Found Item',
            content: `I found an item on campus. The AI scan could not confidently identify it (${probability}% model confidence). Please review the image and select the correct item type above, then update the description before submitting.`
          };
        }
        const nextPriority = resolvePriority(detection.itemType);
        return {
          ...prev,
          title: `Found ${detection.detectedTitle}`,
          itemType: detection.itemType,
          priority: nextPriority,
          targetAudience: resolveTargetAudience(detection.itemType),
          endDate: getExpiryDateForPriority(nextPriority, prev.startDate),
          content: generateNoticeContent(detection, probability)
        };
      });

    } catch (err) {
      console.error("AI Inference failed", err);
    } finally {
      setIsInferencing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tempUser) return alert("Please log in first");

    const normalizedPhone = formData.contactPhone.trim();
    if (normalizedPhone && !/^\d{10}$/.test(normalizedPhone)) {
      setPhoneError('Telephone number must be exactly 10 digits.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Map to notice schema
      const payload = {
        userId: tempUser.id,
        postedBy: tempUser.name || 'Student',
        title: formData.title,
        content: formData.content,
        category: formData.category,
        itemType: formData.itemType,
        priority: formData.priority,
        targetAudience: formData.targetAudience,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        attachments: [imagePreview], // Base64
        aiMetadata: {
          rawLabels: aiPredictions?.map(p => p.className),
          confidence: aiPredictions?.[0]?.probability
        }
      };

      await axios.post('http://localhost:3001/api/notices/smart-report', payload);
      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to submit item report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 px-6 py-5 flex justify-between items-center text-white">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/12 shadow-[0_14px_30px_rgba(255,255,255,0.12)] backdrop-blur-sm overflow-hidden">
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.48),transparent_38%),radial-gradient(circle_at_75%_78%,rgba(254,240,138,0.28),transparent_36%),linear-gradient(160deg,rgba(125,211,252,0.38),rgba(244,114,182,0.3)_46%,rgba(253,224,71,0.24))]"></span>
                <span className="absolute inset-[3px] rounded-[14px] bg-gradient-to-br from-white/26 via-white/12 to-transparent"></span>
                <svg
                  viewBox="0 0 48 48"
                  className="relative z-10 h-8 w-8 drop-shadow-[0_4px_12px_rgba(255,255,255,0.45)]"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M22 10c-2.8 0-5 1.8-6 4.2a5.9 5.9 0 0 0-8 5.5c0 2 .9 3.7 2.3 4.8A6.3 6.3 0 0 0 10 36c1.2 1.2 2.9 2 4.8 2H22V10Z"
                    fill="#ffffff"
                  />
                  <path
                    d="M26 10c2.8 0 5 1.8 6 4.2a5.9 5.9 0 0 1 8 5.5c0 2-.9 3.7-2.3 4.8A6.3 6.3 0 0 1 38 36c-1.2 1.2-2.9 2-4.8 2H26V10Z"
                    fill="#ffffff"
                  />
                  <path
                    d="M24 10v28"
                    stroke="rgba(167,139,250,0.95)"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18 15.5c1.8 0 3.2 1.4 3.2 3.2M16.5 23.5c2.7 0 4.7 2 4.7 4.7M30 15.5c-1.8 0-3.2 1.4-3.2 3.2M31.5 23.5c-2.7 0-4.7 2-4.7 4.7"
                    stroke="rgba(196,181,253,0.9)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              Smart Notice Creator
            </h2>
            <p className="text-xs text-indigo-200 mt-1">100% In-Browser Edge ML - No Data Leaves Your Device</p>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {submitSuccess ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-3xl mb-4">
              <i className="fas fa-check"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Report Sent to Admin!</h3>
            <p className="text-gray-500 max-w-md mx-auto mt-2">Your smart report is pending approval. Once approved, it will be posted publicly on the Notice Board.</p>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {loadingModel ? (
              <div className="flex flex-col items-center justify-center py-12">
                <i className="fas fa-brain fa-wobble text-4xl text-purple-400 mb-4 animate-bounce"></i>
                <p className="font-semibold text-gray-700">Downloading MobileNet Edge Engine...</p>
                <div className="w-48 h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 w-1/2 animate-[progress_1s_ease-in-out_infinite]" />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Upload Section */}
                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-300 text-center relative group">
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  {!imagePreview ? (
                    <div className="py-6">
                      <div className="w-12 h-12 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-purple-500 text-xl group-hover:scale-110 transition-transform">
                        <i className="fas fa-camera"></i>
                      </div>
                      <p className="font-semibold text-gray-700">Tap to upload item photo</p>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden shadow-inner bg-black flex justify-center">
                      <img ref={imgRef} src={imagePreview} alt="Preview" className="max-h-56 object-contain" crossOrigin="anonymous" />
                      {!aiPredictions && !isInferencing && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 pointer-events-none">
                          <button onClick={(e) => { e.preventDefault(); handleAnalyze(); }} className="pointer-events-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-6 rounded-full shadow-lg shadow-purple-500/30 flex items-center gap-2 transform hover:scale-105 transition-all">
                            <i className="fas fa-cog"></i> Scan Image
                          </button>
                        </div>
                      )}
                      
                      {isInferencing && (
                        <div className="absolute inset-0 bg-indigo-900/80 flex flex-col items-center justify-center z-20 text-white">
                           <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-3"></div>
                           <p className="font-bold tracking-widest text-sm">ANALYZING PIXELS...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Results & Form */}
                {aiPredictions && (
                  <form onSubmit={handleSubmit} className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
                    
                    {(() => {
                      const det = detectItemFromPredictions(aiPredictions);
                      const prob = (aiPredictions[0].probability * 100).toFixed(1);
                      return det.uncertain ? (
                        <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl flex gap-4">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                            <i className="fas fa-exclamation-triangle text-lg"></i>
                          </div>
                          <div>
                            <h4 className="font-bold text-amber-800">Low Confidence — {prob}%</h4>
                            <p className="text-xs text-amber-700 font-medium mt-0.5">AI could not confidently identify this item. Please select the correct <strong>Item Type</strong> from the dropdown below before submitting.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-4">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                            <i className="fas fa-robot text-lg"></i>
                          </div>
                          <div>
                            <h4 className="font-bold text-indigo-900">AI Confidence: {prob}%</h4>
                            <p className="text-xs text-indigo-700 font-medium">Detected: <strong>{det.detectedTitle}</strong> &mdash; {det.confidenceLabel} match</p>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 font-semibold text-gray-700">Notice Title*</label>
                        <input required type="text" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none" />
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold text-gray-700">Notice Type*</label>
                        <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none">
                          <option value="lost-item">Lost Item Notice</option>
                          <option value="found-item">Found Item Notice</option>
                          <option value="announcement">General Announcement</option>
                          <option value="advisory">Campus Advisory</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold text-gray-700">Item Type*</label>
                      <select
                        value={formData.itemType}
                        onChange={e => {
                          const nextItemType = e.target.value;
                          const nextPriority = resolvePriority(nextItemType);
                          setFormData({
                            ...formData,
                            itemType: nextItemType,
                            priority: nextPriority,
                            targetAudience: resolveTargetAudience(nextItemType),
                            endDate: getExpiryDateForPriority(nextPriority, formData.startDate)
                          });
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
                      >
                        {ITEM_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {URGENT_ITEMS.includes(formData.itemType) && (
                        <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                          <i className="fas fa-exclamation-triangle"></i>
                          High-priority item. Priority has been set to <strong>Urgent</strong>.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 font-semibold text-gray-700">Priority*</label>
                        <select
                          value={formData.priority}
                          onChange={e => {
                            const nextPriority = e.target.value;
                            setFormData({
                              ...formData,
                              priority: nextPriority,
                              endDate: getExpiryDateForPriority(nextPriority, formData.startDate)
                            });
                          }}
                          className={`w-full border rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none ${
                            formData.priority === 'urgent' ? 'border-red-300 bg-red-50 text-red-700 font-semibold' : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold text-gray-700">Target Audience*</label>
                        <select
                          value={formData.targetAudience}
                          onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
                        >
                          {TARGET_AUDIENCE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold text-gray-700">Notice Content*</label>
                      <textarea required value={formData.content} onChange={e=>setFormData({...formData, content: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none resize-none h-28" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 font-semibold text-gray-700">Start Date*</label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={e => {
                            const nextStartDate = e.target.value;
                            setFormData({
                              ...formData,
                              startDate: nextStartDate,
                              endDate: getExpiryDateForPriority(formData.priority, nextStartDate)
                            });
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold text-gray-700">Notice Expiry Date</label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 font-semibold text-gray-700">Contact Email</label>
                        <input required type="email" value={formData.contactEmail} onChange={e=>setFormData({...formData, contactEmail: e.target.value})} placeholder="Owner to contact you" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold text-gray-700">Contact Phone</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={10}
                          value={formData.contactPhone}
                          onChange={e => {
                            const digitsOnly = e.target.value.replace(/\D/g, '');
                            setFormData({ ...formData, contactPhone: digitsOnly });
                            if (phoneError) {
                              setPhoneError('');
                            }
                          }}
                          placeholder="10-digit phone number"
                          className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm outline-none ${
                            phoneError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`}
                        />
                        {phoneError && (
                          <p className="mt-1.5 text-xs text-red-600 font-medium">{phoneError}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold text-gray-700">Item Images</label>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 flex items-center gap-3">
                        <img src={imagePreview} alt="Uploaded item" className="w-20 h-20 object-cover rounded-lg border border-gray-200 bg-white" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Scanned image attached</p>
                          <p className="text-xs text-gray-500">This uploaded image will be submitted with the notice.</p>
                        </div>
                      </div>
                    </div>

                    <button disabled={isSubmitting} type="submit" className="w-full text-white font-bold py-3 rounded-xl mt-4 shadow-lg shadow-purple-900/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-center" style={{background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #7c3aed 100%)'}} onMouseEnter={e => e.currentTarget.style.background='linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #6d28d9 100%)'} onMouseLeave={e => e.currentTarget.style.background='linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #7c3aed 100%)'}>
                      {isSubmitting ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                      <span>Submit to Admin View</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}
