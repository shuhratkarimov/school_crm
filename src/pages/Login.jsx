"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import LoginLoading from "../components/LoginLoading";
import { Eye, EyeOff } from "lucide-react";
import API_URL from "../conf/api";

function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) setEmail(savedEmail);
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Email yoki parol noto‘g‘ri");

      localStorage.setItem("savedEmail", email);

      setIsAuthenticated(true);
      setShowSuccess(true);

      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      toast.error(err.message || "Kirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-50 relative overflow-hidden px-4">

      {/* ✅ Success overlay (tick bilan) */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="w-20 h-20 relative">
                <svg className="w-full h-full" viewBox="0 0 52 52">
                  <circle
                    className="stroke-green-500 fill-white"
                    cx="26"
                    cy="26"
                    r="25"
                    fill="none"
                    strokeWidth="2"
                    strokeDasharray="166"
                    strokeDashoffset="166"
                    style={{ animation: "tickStroke 0.3s forwards" }}
                  />
                  <path
                    className="stroke-green-500"
                    fill="none"
                    strokeWidth="2"
                    d="M14.1 27.2l7.1 7.2 16.7-16.8"
                    strokeDasharray="48"
                    strokeDashoffset="48"
                    style={{ animation: "tickStroke 0.3s 0.3s forwards" }}
                  />
                </svg>
              </div>
              <p className="text-white text-lg font-semibold">
                Muvaffaqiyatli kirildi!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card */}
      <motion.div
        className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl w-full max-w-md p-8 border border-gray-100 flex flex-col items-center pt-20"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Logo */}
        <motion.img
          src="/logo.png"
          alt="progress_logo"
          className="h-32 w-auto mb-6 top-0 left-1/33 transform -translate-x-1/2 absolute"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-2">
          "Intellectual Progress Star"
        </h1>
        <p className="text-center text-gray-600 text-sm sm:text-base mb-6">
          <span className="text-blue-600 font-semibold">Admin</span> paneliga kirish
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              placeholder="Email kiriting"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parol
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                placeholder="Parolni kiriting"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center disabled:opacity-60"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
          >
            {loading ? (
              <LoginLoading />
            ) : (
              "Kirish"
            )}
          </motion.button>
        </form>

        <div className="text-right mt-4 w-full">
          <span
            onClick={() => navigate("/teacher/login")}
            className="text-blue-600 underline cursor-pointer hover:text-blue-400"
          >
            Ustozlar paneliga o'tish
          </span>
        </div>
      </motion.div>

      {/* ✅ tick animatsiya keyframes */}
      <style>{`
        @keyframes tickStroke {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;
