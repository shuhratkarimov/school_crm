"use client";

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  FileText,
  CreditCard,
  LogOut,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { toast } from "react-hot-toast";
import API_URL from "../conf/api";

export default function TeacherSidebar() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: "dashboard", label: "Bosh sahifa", icon: BookOpen, path: "/teacher/dashboard" },
    { id: "test-results", label: "Test natijalari", icon: FileText, path: "/teacher/test-results" },
    { id: "payments", label: "To'lovlar", icon: CreditCard, path: "/teacher/payments" },
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
      console.error(error);
      toast.error("Chiqishda xatolik yuz berdi");
    }
  };

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300
      bg-gradient-to-b from-[#104292] to-[#0a2e68] shadow-2xl
      ${isSidebarCollapsed ? "w-20" : "w-64"}`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between p-5">
        {!isSidebarCollapsed && (
          <h2 className="text-white font-semibold text-lg tracking-wide">
            Ustoz | Progress
          </h2>
        )}

        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-2 rounded-full border border-white/10 bg-white/10 hover:bg-white/20 transition text-white"
        >
          {isSidebarCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-3">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.path)}
                  title={isSidebarCollapsed ? item.label : ""}
                  className={`group relative flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all
                  ${
                    active
                      ? "bg-white text-[#104292] shadow-lg"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }
                  
                  `}
                >
                  {/* active indicator */}
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-blue-400"></span>
                  )}

                  <div
                    className={`p-2 rounded-full border ${
                      active
                        ? "bg-blue-100 text-blue-600 border-blue-600"
                        : "bg-white/10 group-hover:bg-white/20 border-white/10"
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  {!isSidebarCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* LOGOUT */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          title={isSidebarCollapsed ? "Chiqish" : ""}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl
          text-white/80 hover:text-red-400 hover:bg-red-500/10 transition"
        >
          <div className="p-2 rounded-full border border-white/10 bg-white/10 hover:bg-white/20">
            <LogOut size={18} />
          </div>

          {!isSidebarCollapsed && <span>Chiqish</span>}
        </button>
      </div>
    </aside>
  );
}