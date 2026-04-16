import { createContext, useContext, useEffect, useState } from "react";

const API_BASE = "http://localhost:3001";

const DEFAULTS = {
  timezone: "Asia/Colombo",
  language: "en",
  dateFormat: "MMM DD, YYYY",
};

const SettingsContext = createContext(DEFAULTS);

export function SettingsProvider({ children }) {
  const [localeSettings, setLocaleSettings] = useState(() => {
    // Seed from localStorage cache while API loads
    try {
      const raw = localStorage.getItem("adminSettings");
      const cached = raw ? JSON.parse(raw) : {};
      return {
        timezone:   cached.timezone   || DEFAULTS.timezone,
        language:   cached.language   || DEFAULTS.language,
        dateFormat: cached.dateFormat || DEFAULTS.dateFormat,
      };
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/settings`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setLocaleSettings({
          timezone:   data.timezone   || DEFAULTS.timezone,
          language:   data.language   || DEFAULTS.language,
          dateFormat: data.dateFormat || DEFAULTS.dateFormat,
        });
      })
      .catch(() => {/* silently fall back to cached values */});
  }, []);

  return (
    <SettingsContext.Provider value={localeSettings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useLocaleSettings() {
  return useContext(SettingsContext);
}
