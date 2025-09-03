"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, FileText, CreditCard, LogOut, ChevronLeft, Menu } from "lucide-react";
import { toast } from "react-hot-toast";

export default function TeacherSidebar({ activeMenu, setActiveMenu }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { id: "dashboard", label: "Bosh sahifa", icon: BookOpen, path: "/teacher/dashboard" },
    { id: "test-results", label: "Test natijalari", icon: FileText, path: "/teacher/test-results" },
    { id: "payments", label: "To'lovlar", icon: CreditCard, path: "/teacher/payments" },
  ];

  const handleLogout = () => {
    toast("Chiqish amalga oshirilmoqda...");
    setTimeout(() => {
      navigate("/teacher/login");
    }, 2000);
  };

  return (
    <aside
      className={`hidden md:block bg-white shadow-lg h-screen sticky top-0 transition-all duration-300 ${
        isSidebarCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="p-4 flex justify-between items-center">
        {!isSidebarCollapsed && (
          <h2 className="text-xl font-bold text-gray-800">Ustoz paneli</h2>
        )}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          {isSidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      <nav className="px-2">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  setActiveMenu(item.id);
                  navigate(item.path);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition ${
                  activeMenu === item.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                }`}
                title={isSidebarCollapsed ? item.label : ""}
              >
                <item.icon size={20} />
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
              title={isSidebarCollapsed ? "Chiqish" : ""}
            >
              <LogOut size={20} />
              {!isSidebarCollapsed && <span>Chiqish</span>}
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}