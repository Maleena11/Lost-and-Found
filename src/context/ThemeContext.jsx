import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const ThemeContext = createContext(null);

function applyTheme(isDark) {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("app_theme") || "light";
  });
  const [noticeTheme, setNoticeThemeState] = useState(() => {
    return localStorage.getItem("notice_theme") || "light";
  });
  
  const location = useLocation();

  const isAdminPath = location.pathname.startsWith("/admin") || 
                      location.pathname.startsWith("/create-notice") || 
                      location.pathname.startsWith("/edit-notice") || 
                      ["/items", "/report", "/users", "/settings"].some(p => location.pathname === p || location.pathname.startsWith(p + "/"));
                      
  const isNoticeBoard = !isAdminPath;

  const getIsDark = (t) => {
    if (t === "dark") return true;
    if (t === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  };

  useEffect(() => {
    const activeTheme = isNoticeBoard ? noticeTheme : theme;
    applyTheme(getIsDark(activeTheme));
  }, [theme, noticeTheme, isNoticeBoard]);

  useEffect(() => {
    if (isNoticeBoard ? noticeTheme !== "auto" : theme !== "auto") return;
    
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      const activeTheme = isNoticeBoard ? noticeTheme : theme;
      if (activeTheme === "auto") {
        applyTheme(e.matches);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, noticeTheme, isNoticeBoard]);

  const setAdminTheme = (t) => {
    localStorage.setItem("app_theme", t);
    setThemeState(t);
  };

  const setNoticeTheme = (t) => {
    localStorage.setItem("notice_theme", t);
    setNoticeThemeState(t);
  };

  const currentSetTheme = isNoticeBoard ? setNoticeTheme : setAdminTheme;
  const currentTheme = isNoticeBoard ? noticeTheme : theme;

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setTheme: currentSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
