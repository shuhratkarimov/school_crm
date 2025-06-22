"use client";

import { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import LoginAnimation from "../components/LoginAnimation";
import ChartAnimation from "../components/Chart";

function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Emailni localStorage'dan olish
  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Email yoki parol noto‘g‘ri");
      }

      // Emailni localStorage'ga saqlash
      localStorage.setItem("savedEmail", email);

      setIsAuthenticated(true);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Kirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Sichqoncha harakati uchun gradient effekt
  const handleMouseMove = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    button.style.setProperty("--mouse-x", `${x}px`);
    button.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div className="login-container">
      <LoginAnimation />
      <div className="login-card">
        <h2 className="login-title">CRM panelga kirish</h2>
        <p className="login-subtitle">Tizimga kirish uchun ma'lumotlarni kiriting</p>

        {error && <div className="error-message" style={{fontSize: "15px"}}>{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="form-input custom-placeholder"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email kiriting"
              required
              autoComplete="username"
              style={{fontSize: "18px", background: "transparent", border: "1px solid black"}}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Parol
            </label>
            <input
              type="password"
              id="password"
              style={{fontSize: "18px", background: "transparent", border: "1px solid black"}}
              className="form-input custom-placeholder" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parolni kiriting"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
            onMouseMove={handleMouseMove}
            onMouseLeave={(e) => {
              e.currentTarget.style.setProperty("--mouse-x", "-100px");
              e.currentTarget.style.setProperty("--mouse-y", "-100px");
            }}
          >
            {loading ? <FaSpinner className="spinner" /> : "Kirish"}
          </button>
        </form>
      </div>
      <ChartAnimation />
    </div>
  );
}

export default Login;