// pages/DirectorLogin.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Moon,
  Sun,
  Globe,
  Sparkles
} from 'lucide-react';
import API_URL from '../conf/api';
import { AnimatePresence, motion } from 'framer-motion';
import { AppContext } from '../context/AppContext';

const DirectorLogin = ({ onLogin }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { language, darkMode, changeTheme, changeLanguage } = useContext(AppContext);
  const translations = {
    uz: {
      welcomeBack: "Xush kelibsiz!",
      signInToContinue: "Tizimga kirish",
      email: "Elektron pochta",
      password: "Parol",
      signIn: "Kirish",
      noAccount: "Hisobingiz yo'qmi?",
      contactAdmin: "Administrator bilan bog'lanishingiz kerak",
      invalidCredentials: "Email yoki parol noto'g'ri",
      required: "Majburiy maydon",
      invalidEmail: "Noto'g'ri email formati",
      passwordMinLength: "Parol kamida 6 belgidan iborat bo'lishi kerak",
      demoCredentials: "Demo ma'lumotlar",
      autoFill: "Avtomatik to'ldirish"
    },
    en: {
      welcomeBack: "Welcome Back!",
      signInToContinue: "Sign in to your account",
      email: "Email",
      password: "Password",
      signIn: "Sign In",
      noAccount: "Don't have an account?",
      contactAdmin: "Contact administrator",
      invalidCredentials: "Invalid email or password",
      required: "Required field",
      invalidEmail: "Invalid email format",
      passwordMinLength: "Password must be at least 6 characters",
      demoCredentials: "Demo credentials",
      autoFill: "Auto-fill"
    }
  };

  const t = translations[language];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = t.required;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t.invalidEmail;
    }

    if (!formData.password) {
      newErrors.password = t.required;
    } else if (formData.password.length < 6) {
      newErrors.password = t.passwordMinLength;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (loginError) {
      setLoginError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setLoginError('');

    try {
      const response = await fetch(`${API_URL}/director-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("savedEmail", formData.email);
        onLogin(true);
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/director-panel');
        }, 1500);
      } else {
        setLoginError(data.message || t.invalidCredentials);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setFormData({
      email: 'director@example.com',
      password: 'director123'
    });
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Animated circles */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-200/30 dark:bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-200/20 dark:bg-purple-500/5 rounded-full blur-3xl"></div>
        </div>

        {/* Grid overlay */}
        {/* <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" d="M54 27.5v5H38v-5h16zm-32 0v5H6v-5h16zm32-16v5H38v-5h16zm-32 0v5H6v-5h16z" fill="%239C92AC" fill-opacity="0.02" fill-rule="evenodd")></div> */}
      </div>

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
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="w-20 h-20 relative">
                <svg className="w-full h-full" viewBox="0 0 52 52">
                  <circle
                    className="stroke-green-500 fill-white dark:fill-gray-800"
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
                {language === 'uz' ? "Muvaffaqiyatli kirildi!" : "Login successful!"}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Theme and Language Controls */}
          <div className="absolute top-6 right-6 flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => changeLanguage(language === 'uz' ? 'en' : 'uz')}
              className="p-2.5 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50"
            >
              <Globe size={20} className="text-gray-700 dark:text-gray-300" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => changeTheme(!darkMode)}
              className="p-2.5 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50"
            >
              {darkMode ?
                <Sun size={20} className="text-yellow-500" /> :
                <Moon size={20} className="text-gray-700" />
              }
            </motion.button>
          </div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/30"
          >
            {/* Logo/Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <LogIn size={32} className="text-white" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2"
              >
                {t.welcomeBack}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 dark:text-gray-400"
              >
                {t.signInToContinue}
              </motion.p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-600 dark:text-red-400 text-center">
                      {loginError}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.email}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={20} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700/50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 dark:text-white ${errors.email
                      ? 'border-red-300 dark:border-red-700 focus:border-red-500'
                      : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                      }`}
                    placeholder="your@email.com"
                  />
                </div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                  >
                    <span>•</span> {errors.email}
                  </motion.p>
                )}
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.password}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={20} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-700/50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 dark:text-white ${errors.password
                      ? 'border-red-300 dark:border-red-700 focus:border-red-500'
                      : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                      }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ?
                      <EyeOff size={20} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" /> :
                      <Eye size={20} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                    }
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                  >
                    <span>•</span> {errors.password}
                  </motion.p>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {language === 'uz' ? 'Kirish...' : 'Signing in...'}
                    </div>
                  ) : (
                    t.signIn
                  )}
                </motion.button>
              </motion.div>

              {/* Contact Admin Link */}
            </form>
          </motion.div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes tickStroke {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default DirectorLogin;