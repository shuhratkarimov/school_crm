"use client";

import { useState, useEffect } from "react";
import { LogOut, Settings, X, KeyRound, User, Mail, Eye, EyeOff, Edit, Save, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import API_URL from "../conf/api";
import { useAppContext } from "../context/AppContext";

function Header({ setIsAuthenticated }) {
  const { setMobileSidebarOpen } = useAppContext();
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState("light");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");

  const [user, setUser] = useState(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        localStorage.removeItem("savedEmail");
        setIsAuthenticated(false);
        navigate("/login");
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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_URL}/get-profile`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setTempUsername(data.user.username);
        } else {
          if (response.status === 401) {
            setIsAuthenticated(false);
            navigate("/login");
          }
          toast.error("Tizimga kirishda xatolik!")
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    setTimeout(() => {
      fetchUser();
    }, 1000);
  }, []);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/change-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          oldPassword,
          newPassword: newPassword,
        }),
      });

      if (response.ok) {
        setOldPassword("");
        setNewPassword("");
        setShowPasswordModal(false);
        toast.success("Parol muvaffaqiyatli yangilandi!");
      } else {
        const res = await response.json();
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("Parolni yangilashda xatolik yuz berdi!");
    }
  };

  const handleUsernameUpdate = async () => {
    if (!tempUsername.trim()) {
      toast.error("Foydalanuvchi nomi bo'sh bo'lishi mumkin emas!");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/update-profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          username: tempUsername,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setUser({ ...user, username: tempUsername });
        setIsEditingUsername(false);
        toast.success("Foydalanuvchi nomi muvaffaqiyatli yangilandi!");
      } else {
        const res = await response.json();
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("Foydalanuvchi nomini yangilashda xatolik yuz berdi!");
    }
  };

  const cancelEdit = () => {
    setTempUsername(user.username);
    setIsEditingUsername(false);
  };

  return (
    <div className="header flex justify-between items-center gap-3 flex-wrap rounded-xl">
      {/* Mobile hamburger + Logo */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 flex-shrink-0 overflow-hidden">
          <img
            src="/logo.png"
            alt="logo"
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>
        <h1 className="text-base sm:text-lg lg:text-xl text-gray-800 font-bold truncate">
          <span className="hidden sm:inline">"Intellectual Progress Star" o'quv markazi CRM tizimi</span>
          <span className="sm:hidden">Progress CRM</span>
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <button
          className="flex items-center gap-2 bg-[#104292] hover:bg-[#104292]/80 transition text-white px-3 sm:px-4 py-2 shadow-md hover:shadow-lg rounded-lg"
          onClick={() => setShowProfileModal(true)}
        >
          <Settings size={18} />
          <span className="hidden sm:inline">Sozlamalar</span>
        </button>
        <button
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 transition text-white px-3 sm:px-4 py-2 shadow-md hover:shadow-lg rounded-lg"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span className="hidden sm:inline">Chiqish</span>
        </button>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white shadow-2xl w-full max-w-md p-6 relative animate-scale-in">
            <button
              onClick={() => {
                setShowProfileModal(false);
                cancelEdit();
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-200"
            >
              <X size={24} />
            </button>

            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-[#104292] flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md">
                {user?.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <h2 className="text-2xl font-bold text-center text-gray-800">
                Sizning profilingiz
              </h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-3 bg-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <User size={24} className="text-gray-500 mr-3" />
                    <span className="text-sm text-gray-500">Foydalanuvchi nomi</span>
                  </div>
                  {!isEditingUsername ? (
                    <button
                      onClick={() => setIsEditingUsername(true)}
                      className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                    >
                      <Edit size={24} />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleUsernameUpdate}
                        className="text-green-500 hover:text-green-700 transition-colors p-1"
                      >
                        <Save size={24} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  )}
                </div>
                {isEditingUsername ? (
                  <input
                    type="text"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                ) : (
                  <p className="font-medium text-gray-800 ml-8">{user?.username || "Ma'lumot yo'q"}</p>
                )}
              </div>

              <div className="flex items-center p-3 bg-gray-100 shadow-sm">
                <Mail size={24} className="text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-800">{user?.email || "Ma'lumot yo'q"}</p>
                </div>
              </div>
            </div>

            <button
              className="w-full flex justify-center items-center py-3 px-4 bg-[#104292] transition-colors text-white font-medium shadow-md hover:shadow-lg"
              onClick={() => {
                setShowProfileModal(false);
                setShowPasswordModal(true);
              }}
            >
              <KeyRound size={24} className="mr-2" />
              Parolni yangilash
            </button>
          </div>
        </div>
      )}

      {/* Password Update Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white shadow-2xl w-full max-w-md p-6 relative animate-scale-in">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-200"
            >
              <X size={24} />
            </button>

            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#104292] flex items-center justify-center text-white mb-3 shadow-md">
                <KeyRound size={28} />
              </div>
              <h2 className="text-2xl font-bold text-center text-gray-800">
                Parolni yangilash
              </h2>
              <p className="text-gray-500 text-center mt-2">
                Xavfsiz parol yaratish uchun kamida 8 ta belgi kiriting
              </p>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-gray-700">Eski parol</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full border border-gray-300 px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                    placeholder="Hozirgi parolingizni kiriting"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  >
                    {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Yangi parol</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-300 px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                    placeholder="Yangi parolni kiriting"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors shadow-sm"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-[#104292] hover:bg-[#104292]/80 transition-colors text-white font-medium shadow-md hover:shadow-lg"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default Header;