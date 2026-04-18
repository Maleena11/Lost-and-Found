/**
 * Utility functions for built-in Accessibility and Multi-lingual support
 */

/**
 * Translates text securely using public Google Translate API
 * @param {string} text - The text to translate
 * @param {string} targetLangCode - The 2-letter lang code (e.g., 'si' for Sinhala, 'ta' for Tamil, 'en' for English)
 * @returns {Promise<string>} - The translated string
 */
export const translateText = async (text, targetLangCode) => {
  if (!text) return '';
  if (targetLangCode === 'en' || !targetLangCode) return text; // Base language

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLangCode}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // The google API returns an array of sentences. We need to join them.
    if (data && data[0]) {
      return data[0].map(sentenceArray => sentenceArray[0]).join('');
    }
  } catch (error) {
    console.error("Translation Engine Error:", error);
  }
  return text; // Fallback to original
};

/**
 * Reads text out loud using native Web Speech API
 * @param {string} text - Text to speak
 * @param {string} langCode - Language dialect (e.g., 'en-US', 'si-LK')
 * @param {Function} onEnd - Callback fired when speech completes
 */
export const speakText = (text, langCode = 'en-US', onEnd = null) => {
  if (!('speechSynthesis' in window)) return;
  
  // Clear any existing speaking to avoid overlap
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to set dialect natively
  utterance.lang = langCode;
  utterance.rate = 0.95; // Slightly slower for accessibility clarity
  
  if (onEnd) {
    utterance.onend = onEnd;
  }
  
  // Some browsers need a slight delay before speaking
  setTimeout(() => window.speechSynthesis.speak(utterance), 50);
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const dictionary = {
  'en': {
    'urgent': 'Urgent', 'high': 'High', 'medium': 'Medium', 'low': 'Low',
    'postedOn': 'Posted on', 'activeFrom': 'Active from', 'validUntil': 'Valid until',
    'attachedImages': 'Attached Images', 'clickToEnlarge': '(click to enlarge)',
    'descriptionHidden': 'Description hidden',
    'hiddenWarning': 'The description for found item notices is restricted to prevent fraudulent claims. If you believe this item belongs to you, please contact the notice poster directly using the contact details below.',
    'forwardAlert': 'Forward Alert', 'listen': 'Listen', 'stop': 'Stop', 'cancel': 'Cancel'
  },
  'si': {
    'urgent': 'හදිසි', 'high': 'ඉහළ', 'medium': 'මධ්‍යම', 'low': 'පහළ',
    'postedOn': 'පළ කළේ', 'activeFrom': 'ක්‍රියාත්මක දිනය', 'validUntil': 'වලංගු දිනය',
    'attachedImages': 'අමුණා ඇති පින්තූර', 'clickToEnlarge': '(විශාල කිරීමට ක්ලික් කරන්න)',
    'descriptionHidden': 'විස්තර සඟවා ඇත',
    'hiddenWarning': 'වංචා වළක්වා ගැනීම සඳහා හමුවූ භාණ්ඩවල විස්තර සීමා කර ඇත. මෙය ඔබට අයත් යැයි හැඟේ නම්, කරුණාකර පහත තොරතුරු භාවිතයෙන් දැන්වීම පළ කළ තැනැත්තා අමතන්න.',
    'forwardAlert': 'දැනුම්දීම යවන්න', 'listen': 'සවන් දෙන්න', 'stop': 'නවතන්න', 'cancel': 'අවලංගු කරන්න'
  },
  'ta': {
    'urgent': 'அவசரம்', 'high': 'உயர்', 'medium': 'நடுத்தரம்', 'low': 'குறைந்த',
    'postedOn': 'பதிவிடப்பட்டது', 'activeFrom': 'தொடங்கும் தேதி', 'validUntil': 'செல்லுபடியாகும் வரை',
    'attachedImages': 'இணைக்கப்பட்ட படங்கள்', 'clickToEnlarge': '(பெரிதாக்க கிளிக் செய்யவும்)',
    'descriptionHidden': 'விளக்கம் மறைக்கப்பட்டுள்ளது',
    'hiddenWarning': 'மோசடிகளை தவிர்ப்பதற்காக கண்டெடுக்கப்பட்ட பொருட்களின் விவரங்கள் கட்டுப்படுத்தப்பட்டுள்ளன. இது உங்களுக்கு சொந்தமானது என கருதினால், கீழே உள்ள தொடர்பு விவரங்கள் மூலம் பதிவிட்டவரை நேரடியாக தொடர்பு கொள்ளவும்.',
    'forwardAlert': 'அலர்ட் அனுப்பு', 'listen': 'கேட்கவும்', 'stop': 'நிறுத்து', 'cancel': 'ரத்துசெய்'
  },
  'fr': {
    'urgent': 'Urgent', 'high': 'Haut', 'medium': 'Moyen', 'low': 'Bas',
    'postedOn': 'Publié le', 'activeFrom': 'Actif à partir de', 'validUntil': 'Valable jusqu\'au',
    'attachedImages': 'Images jointes', 'clickToEnlarge': '(cliquez pour agrandir)',
    'descriptionHidden': 'Description masquée',
    'hiddenWarning': 'La description des objets trouvés est restreinte pour éviter les réclamations frauduleuses. Si vous pensez que cet objet vous appartient, veuillez contacter l\'auteur directement via les coordonnées ci-dessous.',
    'forwardAlert': 'Alerter un ami', 'listen': 'Écouter', 'stop': 'Arrêter', 'cancel': 'Annuler'
  },
  'zh-CN': {
    'urgent': '紧急', 'high': '高', 'medium': '中', 'low': '低',
    'postedOn': '发布于', 'activeFrom': '生效于', 'validUntil': '有效期至',
    'attachedImages': '附加图片', 'clickToEnlarge': '(点击放大)',
    'descriptionHidden': '描述已隐藏',
    'hiddenWarning': '为防止虚假认领，发现物品的描述已限制显示。如果您认为此物属于您，请通过下方联系方式直接联系发布者。',
    'forwardAlert': '转发警报', 'listen': '收听', 'stop': '停止', 'cancel': '取消'
  }
};

export const t = (key, langCode = 'en') => {
  const langDict = dictionary[langCode] || dictionary['en'];
  return langDict[key] || dictionary['en'][key] || key;
};
