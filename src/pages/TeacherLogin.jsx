"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";

function TeacherLogin({ setTeacherAuthenticated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/teacher_login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.status === "success") {
        setTeacherAuthenticated(true);
        setShowSuccess(true);
        setTimeout(() => navigate("/teacher/dashboard"), 2000);
      } else {
        toast.error(data.message || "Login xatolik");
      }
    } catch (err) {
      toast.error(`Server bilan aloqa xatolik: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-50 relative overflow-hidden px-4">
      <ToastContainer />

      {/* Success overlay */}
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
              transition={{ duration: 0.6, ease: "easeOut" }}
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
                    style={{ animation: "tickStroke 0.6s forwards" }}
                  />
                  <path
                    className="stroke-green-500"
                    fill="none"
                    d="M14.1 27.2l7.1 7.2 16.7-16.8"
                    strokeDasharray="48"
                    strokeDashoffset="48"
                    style={{ animation: "tickStroke 0.3s 0.8s forwards" }}
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
          transition={{ duration: 0.8 }}
        />

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-2">
          "Intellectual Progress Star"
        </h1>
        <p className="text-center text-gray-600 text-sm sm:text-base mb-6">
          <span className="text-blue-600 font-semibold">Ustozlar</span> platformasiga xush kelibsiz!
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Foydalanuvchi nomi
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parol
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              autoComplete="current-password"
              required
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center disabled:opacity-60"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75"/>
              </svg>
            ) : (
              "Kirish"
            )}
          </motion.button>
        </form>
      </motion.div>

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

export default TeacherLogin;
