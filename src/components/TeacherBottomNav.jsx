"use client";

import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  CreditCard,
  LogOut,
  Headphones,
} from "lucide-react";
import { toast } from "react-hot-toast";
import API_URL from "../conf/api";

function TeacherBottomNav({ onSupportClick }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      id: "dashboard",
      label: "Bosh sahifa",
      icon: BookOpen,
      path: "/teacher/dashboard",
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

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/90 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 transition-colors"
            >
              {active && (
                <motion.div
                  layoutId="teacher-bottom-nav-active-pill"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}

              <motion.div
                className={`relative z-10 flex flex-col items-center justify-center gap-1 ${
                  active ? "text-white" : "text-blue-600"
                }`}
                animate={{
                  scale: active ? 1.05 : 1,
                  y: active ? -1 : 0,
                }}
                transition={{ duration: 0.2 }}
              >
                <Icon size={19} />
                <span className="text-[11px] leading-none font-medium">
                  {item.label}
                </span>
              </motion.div>
            </button>
          );
        })}

        <button
          onClick={() => {
            if (onSupportClick) {
              onSupportClick();
              return;
            }
            navigate("/teacher/dashboard");
          }}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-blue-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
        >
          <Headphones size={19} />
          <span className="text-[11px] leading-none font-medium">Yordam</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-red-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={19} />
          <span className="text-[11px] leading-none font-medium">Chiqish</span>
        </button>
      </div>
    </nav>
  );
}

export default TeacherBottomNav;