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
  Link as LinkIcon,
  HelpCircle,
} from "lucide-react";
import API_URL from "../conf/api";
import FeedbackModal from "./FeedbackModal";

function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [unansweredRequests, setUnansweredRequests] = useState(0);
  const [notInterviewedStudents, setNotInterviewedStudents] = useState(0);
  const [showSupportModal, setShowSupportModal] = useState(false);

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

  const openSupportModal = () => {
    setShowSupportModal(true);
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
          label: "Qiziqishlar",
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
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col bg-gradient-to-b from-blue-900 to-blue-800 p-4 text-white transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        } ${expandedWidth ? "!w-64 shadow-xl" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative mb-6 flex items-center justify-center border-b border-blue-700 pb-4">
          <h2 className="whitespace-nowrap text-center text-xl font-semibold">
            Progress | Admin
          </h2>
        </div>

        <nav className="flex-1 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            if (!item.children) {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative mb-1 flex min-h-10 items-center rounded-xl p-2 transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-md"
                      : "hover:bg-blue-700"
                  } ${isCollapsed && !expandedWidth ? "justify-center" : "justify-start"}`}
                >
                  <Icon size={18} className={isCollapsed && !expandedWidth ? "" : "mr-3"} />
                  {(!isCollapsed || expandedWidth) && <span>{item.label}</span>}
                  {isActive && (
                    <div className="absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              );
            }

            const isMenuOpen = openMenus[item.label] || expandedWidth;

            return (
              <div key={item.label} className="mb-2">
                <div
                  onClick={() => toggleMenu(item.label)}
                  className={`flex cursor-pointer items-center rounded-xl p-2 transition-all duration-200 ${
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
                        <span className="ml-0.5 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
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
                  <div className="ml-6 mt-1 border-l border-blue-700 pl-2">
                    {item.children.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = location.pathname === sub.path;

                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          className={`mb-1 flex min-h-8 items-center rounded-xl p-2 transition-all duration-200 ${
                            isSubActive ? "bg-blue-600 shadow-md" : "hover:bg-blue-700"
                          }`}
                        >
                          <SubIcon size={16} className="mr-2" />
                          <span>{sub.label}</span>

                          {sub.badge > 0 && (
                            <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                              {sub.badge}
                            </span>
                          )}

                          {isSubActive && (
                            <div className="ml-2 h-2 w-2 rounded-full bg-yellow-300 animate-pulse" />
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

        <div className="mt-4 space-y-2 border-t border-blue-700 pt-4">
          <button
            onClick={openSupportModal}
            className={`w-full rounded-xl border border-blue-500/40 bg-white/10 px-3 py-3 shadow-sm transition-all duration-200 hover:bg-white/15 ${
              isCollapsed && !expandedWidth ? "flex justify-center" : "flex justify-start"
            } items-center`}
          >
            <HelpCircle size={18} className={isCollapsed && !expandedWidth ? "" : "mr-3"} />
            {(!isCollapsed || expandedWidth) && (
              <div className="text-left">
                <p className="text-sm font-semibold">Qo‘llab-quvvatlash</p>
                <p className="text-[11px] text-blue-100">Fikr yoki xatolik yuborish</p>
              </div>
            )}
          </button>
        </div>
      </div>

      <FeedbackModal
        open={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        senderType="user"
      />
    </>
  );
}

export default Sidebar;