import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  CreditCard,
  ClipboardCheck,
  MessageSquare,
  GraduationCap,
  School,
  DollarSign,
  NotebookPen,
  Trophy,
  TestTubeDiagonal,
  UserPlus,
  ChevronDown,
  Loader2,
  Link as LinkIcon,
  LifeBuoy,
  Bug,
  Lightbulb,
  X,
  Send,
} from "lucide-react";
import API_URL from "../conf/api";

function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [unansweredRequests, setUnansweredRequests] = useState(0);
  const [notInterviewedStudents, setNotInterviewedStudents] = useState(0);

  // Support modal states
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportMessage, setSupportMessage] = useState({
    type: "",
    text: "",
  });

  const [supportForm, setSupportForm] = useState({
    type: "feedback", // feedback | bug
    subject: "",
    message: "",
  });

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const appealsResponse = await fetch(`${API_URL}/get_appeals`);
        let appealsData = [];
        if (appealsResponse.ok) {
          appealsData = await appealsResponse.json();
          const unansweredCount = Array.isArray(appealsData)
            ? appealsData.filter((request) => !request.answer).length
            : 0;
          setUnansweredRequests(unansweredCount);
        }

        const studentsResponse = await fetch(`${API_URL}/get-new-students`, {
          method: "GET",
          credentials: "include",
        });
        let studentsData = [];
        if (studentsResponse.ok) {
          studentsData = await studentsResponse.json();
          const notInterviewedCount = Array.isArray(studentsData)
            ? studentsData.filter((student) => !student.interviewed).length
            : 0;
          setNotInterviewedStudents(notInterviewedCount);
        }
      } catch (error) {
        console.error("API xatosi:", error);
      }
    };

    fetchCounts();
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    setOpenMenus({});
  };

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleMouseEnter = () => {
    if (isCollapsed) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(setTimeout(() => setIsHovered(true), 150));
    }
  };

  const handleMouseLeave = () => {
    if (isCollapsed) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(setTimeout(() => setIsHovered(false), 300));
    }
  };

  const openSupportModal = () => {
    setSupportMessage({ type: "", text: "" });
    setShowSupportModal(true);
  };

  const closeSupportModal = () => {
    if (supportLoading) return;
    setShowSupportModal(false);
    setSupportMessage({ type: "", text: "" });
  };

  const handleSupportChange = (e) => {
    const { name, value } = e.target;
    setSupportForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitSupport = async (e) => {
    e.preventDefault();

    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      setSupportMessage({
        type: "error",
        text: "Mavzu va xabar maydonlarini to‘ldiring.",
      });
      return;
    }

    try {
      setSupportLoading(true);
      setSupportMessage({ type: "", text: "" });

      const response = await fetch(`${API_URL}/feedbacks/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type: supportForm.type,
          subject: supportForm.subject,
          message: supportForm.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Xatolik yuz berdi");
      }

      setSupportMessage({
        type: "success",
        text: "Xabaringiz muvaffaqiyatli yuborildi.",
      });

      setSupportForm({
        type: "feedback",
        subject: "",
        message: "",
      });

      setTimeout(() => {
        setShowSupportModal(false);
        setSupportMessage({ type: "", text: "" });
      }, 900);
    } catch (error) {
      setSupportMessage({
        type: "error",
        text: error.message || "Serverga yuborishda xatolik yuz berdi.",
      });
    } finally {
      setSupportLoading(false);
    }
  };

  const menuItems = [
    { path: "/dashboard", label: "Bosh sahifa", icon: Home },
    {
      label: "O‘quv jarayoni",
      icon: Users,
      children: [
        { path: "/students", label: "O‘quvchilar", icon: Users },
        { path: "/attendance", label: "Guruhlar", icon: ClipboardCheck },
        { path: "/teachers", label: "Ustozlar", icon: GraduationCap },
        { path: "/rooms", label: "Sinfxonalar", icon: School },
        { path: "/reserve", label: "Zaxira o'quvchilar", icon: ClipboardCheck },
      ],
    },
    {
      label: "Moliya",
      icon: DollarSign,
      children: [
        { path: "/payments", label: "To‘lovlar", icon: CreditCard },
        { path: "/expenses", label: "Xarajatlar", icon: DollarSign },
      ],
    },
    {
      label: "Baholash",
      icon: Trophy,
      children: [
        { path: "/test-results", label: "Test natijalari", icon: TestTubeDiagonal },
        { path: "/achievements", label: "Yutuqlar", icon: Trophy },
      ],
    },
    {
      label: "Qo‘shimcha",
      icon: NotebookPen,
      badge: unansweredRequests + notInterviewedStudents,
      children: [
        {
          path: "/requests",
          label: "Bot murojaatlar",
          icon: MessageSquare,
          badge: unansweredRequests,
        },
        { path: "/notes", label: "Qaydlar", icon: NotebookPen },
        {
          path: "/new-students",
          label: " Qiziqishlar",
          icon: UserPlus,
          badge: notInterviewedStudents,
        },
        { path: "/link-generator", label: "Havola yaratuvchi", icon: LinkIcon },
      ],
    },
  ];

  const expandedWidth = isHovered && isCollapsed;

  return (
    <>
      <div
        className={`fixed left-0 top-0 h-screen flex flex-col bg-gradient-to-b from-blue-900 to-blue-800 text-white p-4 transition-all duration-300 z-50 ${
          isCollapsed ? "w-16" : "w-64"
        } ${expandedWidth ? "!w-64 shadow-xl" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header */}
        <div className="flex justify-center items-center mb-6 pb-4 border-b border-blue-700 relative">
          <h2 className="text-xl font-semibold whitespace-nowrap text-center">
            Progress | Admin
          </h2>
        </div>

        {/* Scrollable Menu */}
        <nav className="flex-1 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            if (!item.children) {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center min-h-10 p-2 rounded-lg mb-1 transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-md"
                      : "hover:bg-blue-700"
                  } ${isCollapsed && !expandedWidth ? "justify-center" : "justify-start"}`}
                >
                  <Icon size={18} className={isCollapsed && !expandedWidth ? "" : "mr-3"} />
                  {(!isCollapsed || expandedWidth) && <span>{item.label}</span>}
                  {isActive && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </Link>
              );
            }

            const isMenuOpen = openMenus[item.label] || expandedWidth;

            return (
              <div key={item.label} className="mb-2">
                <div
                  onClick={() => toggleMenu(item.label)}
                  className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    isMenuOpen ? "bg-blue-700" : "hover:bg-blue-700"
                  } ${isCollapsed && !expandedWidth ? "justify-center" : "justify-between"}`}
                >
                  <div className="flex items-center">
                    <Icon size={18} className={isCollapsed && !expandedWidth ? "" : "mr-3"} />
                    {(!isCollapsed || expandedWidth) && <span>{item.label}</span>}
                  </div>

                  {(!isCollapsed || expandedWidth) && (
                    <div className="flex items-center gap-2">
                      {item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 ml-0.5">
                          {item.badge}
                        </span>
                      )}
                      <div
                        className={`transform transition-transform duration-200 ${
                          isMenuOpen ? "rotate-180" : ""
                        }`}
                      >
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  )}
                </div>

                {isMenuOpen && (!isCollapsed || expandedWidth) && (
                  <div className="ml-6 pl-2 border-l border-blue-700 mt-1">
                    {item.children.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = location.pathname === sub.path;

                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          className={`flex items-center min-h-8 p-2 rounded-lg mb-1 transition-all duration-200 ${
                            isSubActive ? "bg-blue-600 shadow-md" : "hover:bg-blue-700"
                          }`}
                        >
                          <SubIcon size={16} className="mr-2" />
                          <span>{sub.label}</span>

                          {sub.badge > 0 && (
                            <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 ml-1">
                              {sub.badge}
                            </span>
                          )}

                          {isSubActive && (
                            <div className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="pt-4 mt-4 border-t border-blue-700 space-y-2">
          <button
            onClick={openSupportModal}
            className={`w-full flex items-center rounded-xl border border-blue-500/40 bg-white/10 hover:bg-white/15 px-3 py-3 transition-all duration-200 shadow-sm ${
              isCollapsed && !expandedWidth ? "justify-center" : "justify-start"
            }`}
          >
            <LifeBuoy size={18} className={isCollapsed && !expandedWidth ? "" : "mr-3"} />
            {(!isCollapsed || expandedWidth) && (
              <div className="text-left">
                <p className="text-sm font-semibold">Qo‘llab-quvvatlash</p>
                <p className="text-[11px] text-blue-100">Fikr yoki xatolik yuborish</p>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-[fadeIn_.2s_ease-out]">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div>
                <h3 className="text-lg font-semibold">Qo‘llab-quvvatlash</h3>
                <p className="text-sm text-blue-100">
                  Fikr bildiring yoki xatolik haqida yozing
                </p>
              </div>
              <button
                onClick={closeSupportModal}
                disabled={supportLoading}
                className="p-2 rounded-lg hover:bg-white/10 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitSupport} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Murojaat turi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setSupportForm((prev) => ({ ...prev, type: "feedback" }))
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition ${
                      supportForm.type === "feedback"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <Lightbulb size={18} />
                    Fikr / taklif
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSupportForm((prev) => ({ ...prev, type: "bug" }))
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition ${
                      supportForm.type === "bug"
                        ? "border-red-600 bg-red-50 text-red-700"
                        : "border-gray-200 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <Bug size={18} />
                    Xatolik
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mavzu
                </label>
                <input
                  type="text"
                  name="subject"
                  value={supportForm.subject}
                  onChange={handleSupportChange}
                  placeholder="Masalan: To‘lov sahifasida muammo"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xabar
                </label>
                <textarea
                  name="message"
                  value={supportForm.message}
                  onChange={handleSupportChange}
                  rows={5}
                  placeholder="Muammoni yoki taklifingizni batafsil yozing..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {supportMessage.text && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm font-medium ${
                    supportMessage.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {supportMessage.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeSupportModal}
                  disabled={supportLoading}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                >
                  Bekor qilish
                </button>

                <button
                  type="submit"
                  disabled={supportLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                >
                  {supportLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Yuborilmoqda...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Yuborish
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;