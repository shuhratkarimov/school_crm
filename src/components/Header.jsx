"use client";

import { useState, useEffect } from "react";
import { LogOut, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

function Header({ setIsAuthenticated }) {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState("light");
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.body.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.body.classList.toggle("dark", newTheme === "dark");
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
        method: "POST",
        credentials: "include", // HttpOnly cookie'larni yuborish
      });

      if (response.ok) {
        localStorage.removeItem("savedEmail"); // Saqlangan emailni o‘chirish
        setIsAuthenticated(false);
        navigate("/login"); // Login sahifasiga yo‘naltirish
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("savedEmail");
      setIsAuthenticated(false);
      navigate("/login");
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
  };

  return (
    <div className="header">
      <div>
        <h1>{t("header.title")}</h1>
        <p style={{ fontStyle: "italic" }}>Passion, purpose, progress</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {/* <User size={20} /> */}
          {/* <span>{t("header.admin")}</span> */}
        </div>
        {/* <button className="btn btn-secondary" onClick={toggleTheme}>
          {theme === "light" ? t("header.darkMode") : t("header.lightMode")}
        </button> */}
        {/* <select
          className="btn btn-secondary"
          value={i18n.language}
          onChange={(e) => changeLanguage(e.target.value)}
        >
          <option value="uz">O‘zbekcha</option>
          <option value="en">English</option>
        </select> */}
        <button
          className="btn btn-primary"
          onClick={handleLogout}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <LogOut size={16} className="mr-2" />
          {t("header.logout")}
        </button>
      </div>
    </div>
  );
}

export default Header;