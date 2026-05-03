"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  FileText,
  CreditCard,
  LogOut,
  Headphones,
  Menu,
  X,
  Lightbulb,
  User,
} from "lucide-react";
import { toast } from "react-hot-toast";
import API_URL, { resolveImgUrl } from "../conf/api";

function TeacherBottomNav({ onSupportClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(
    () => localStorage.getItem("teacher_avatar") || ""
  );

  const fetchAvatar = async () => {
    try {
      const res = await fetch(`${API_URL}/teacher/profile`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const url = data?.img_url || "";
      setAvatarUrl(url);
      if (url) localStorage.setItem("teacher_avatar", url);
      else localStorage.removeItem("teacher_avatar");
    } catch {}
  };

  useEffect(() => {
    fetchAvatar();
    const onUpdated = () => fetchAvatar();
    window.addEventListener("teacher-profile-updated", onUpdated);
    return () => window.removeEventListener("teacher-profile-updated", onUpdated);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const menuItems = [
    {
      id: "dashboard",
      label: "Bosh sahifa",
      icon: BookOpen,
      path: "/teacher/dashboard",
    },
    {
      id: "articles",
      label: "Foydali maqolalar",
      icon: Lightbulb,
      path: "/teacher/articles",
    },
    {
      id: "test-results",
      label: "Testlar",
      icon: FileText,
      path: "/teacher/test-results",
    },
    {
      id: "payments",
      label: "To'lovlar",
      icon: CreditCard,
      path: "/teacher/payments",
    },
    {
      id: "profile",
      label: "Profilim",
      icon: User,
      path: "/teacher/profile",
    },
  ];

  const isActive = (path) => {
    if (path === "/teacher/dashboard") {
      return (
        location.pathname === "/teacher/dashboard" ||
        location.pathname.startsWith("/teacher/attendance/")
      );
    }
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_URL}/teacher_logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Server error");
      }

      toast.success("Chiqish amalga oshirildi");
      navigate("/teacher/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Chiqishda xatolik yuz berdi");
    }
  };

  const handleSupport = () => {
    setOpen(false);
    if (onSupportClick) onSupportClick();
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-12 bg-white/95 backdrop-blur border-b border-slate-200 flex items-center px-3 gap-2 shadow-sm">
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
          aria-label="Menyu"
        >
          <Menu size={20} />
        </button>
        <button
          type="button"
          onClick={() => navigate("/teacher/profile")}
          className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-slate-100"
        >
          <img
            src={avatarUrl ? resolveImgUrl(avatarUrl) : "/logo.png"}
            alt="profil"
            className="w-7 h-7 rounded-full object-cover bg-white border border-slate-200"
          />
          <span className="text-sm font-semibold text-slate-800">Ustoz paneli</span>
        </button>
      </div>

      {/* Drawer + backdrop */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => navigate("/teacher/profile")}
                  className="flex items-center gap-2 text-left hover:opacity-90"
                >
                  <img
                    src={avatarUrl ? resolveImgUrl(avatarUrl) : "/logo.png"}
                    alt="profil"
                    className="w-9 h-9 rounded-xl object-cover bg-white border border-slate-200"
                  />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Ustoz paneli</p>
                    <p className="text-[11px] text-slate-500">Profilni ochish</p>
                  </div>
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
                  aria-label="Yopish"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-3">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-left transition ${
                        active
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </button>
                  );
                })}

                <div className="my-2 border-t border-slate-100" />

                <button
                  onClick={handleSupport}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-left text-blue-600 hover:bg-blue-50 transition"
                >
                  <Headphones size={20} />
                  <span className="font-medium text-sm">Yordam</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut size={20} />
                  <span className="font-medium text-sm">Chiqish</span>
                </button>
              </nav>

              <div className="px-5 py-3 border-t border-slate-100 text-center text-xs text-slate-400">
                © {new Date().getFullYear()} Progress Education
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default TeacherBottomNav;
