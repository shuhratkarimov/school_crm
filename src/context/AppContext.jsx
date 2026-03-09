import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import API_URL from "../conf/api";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [darkMode, setDarkModeState] = useState(false);
  const [language, setLanguageState] = useState("uz");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [directorAuthenticated, setDirectorAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  const handleDirectorLogout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.log(err);
    } finally {
      setDirectorAuthenticated(false);
      setUser(null);
      navigate("/director-panel/login", { replace: true });
    }
  }, [navigate]);

  const getMe = async () => {
    try {
      const res = await fetch(`${API_URL}/get-profile`, {
        credentials: "include",
      });
      const data = await res.json();
      setUser(data?.user);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    getMe();
  }, []);

  const syncPreferences = useCallback(async (nextPrefs) => {
    try {
      await fetch(`${API_URL}/director-panel/settings/preferences`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextPrefs),
      });
    } catch (err) {
      console.error("Preferences sync error:", err);
    }
  }, []);

  const applyTheme = useCallback((isDark) => {
    setDarkModeState(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const applyLanguage = useCallback((lang) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  }, []);

  const changeTheme = useCallback(
    async (isDark) => {
      applyTheme(isDark);
      await syncPreferences({
        theme: isDark ? "dark" : "light",
        language,
      });
    },
    [applyTheme, syncPreferences, language]
  );

  const changeLanguage = useCallback(
    async (lang) => {
      applyLanguage(lang);
      await syncPreferences({
        theme: darkMode ? "dark" : "light",
        language: lang,
      });
    },
    [applyLanguage, syncPreferences, darkMode]
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await fetch(`${API_URL}/director-panel/settings`, {
          credentials: "include",
        });

        const data = await res.json();

        const theme = data?.data?.preferences?.theme;
        const lang = data?.data?.preferences?.language;

        if (theme) {
          applyTheme(theme === "dark");
        } else {
          applyTheme(localStorage.getItem("theme") === "dark");
        }

        if (lang) {
          applyLanguage(lang);
        } else {
          const savedLang = localStorage.getItem("language");
          if (savedLang) applyLanguage(savedLang);
        }
      } catch (err) {
        console.error("Settings fetch error:", err);

        applyTheme(localStorage.getItem("theme") === "dark");

        const savedLang = localStorage.getItem("language");
        if (savedLang) applyLanguage(savedLang);
      } finally {
        setSettingsLoaded(true);
      }
    };

    bootstrap();
  }, [applyTheme, applyLanguage]);

  const value = useMemo(
    () => ({
      darkMode,
      language,
      settingsLoaded,
      directorAuthenticated,
      setDirectorAuthenticated,
      user,
      setUser,
      handleDirectorLogout,
      applyTheme,
      applyLanguage,
      changeTheme,
      changeLanguage,
    }),
    [
      darkMode,
      language,
      settingsLoaded,
      directorAuthenticated,
      user,
      handleDirectorLogout,
      applyTheme,
      applyLanguage,
      changeTheme,
      changeLanguage,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
};