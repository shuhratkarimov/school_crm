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
  ChevronRight,
  Menu,
  X,
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

  // Sidebar holatini localStorage'dan olish
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Sidebar holatini localStorage'ga saqlash
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // O‘qilmagan murojaatlar va suhbatlashilmagan o‘quvchilar sonini olish
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // O‘qilmagan murojaatlar sonini olish
        const appealsResponse = await fetch(`${API_URL}/get_appeals`);
        let appealsData = [];
        if (appealsResponse.ok) {
          appealsData = await appealsResponse.json();
          const unansweredCount = Array.isArray(appealsData)
            ? appealsData.filter((request) => !request.answer).length
            : 0;
          setUnansweredRequests(unansweredCount);
        }

        // Suhbatlashilmagan yangi o‘quvchilar sonini olish
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
      ],
    },
    {
      label: "Moliyaviy",
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
      badge: unansweredRequests + notInterviewedStudents, // Umumiy badge soni
      children: [
        {
          path: "/requests",
          label: "Murojaatlar",
          icon: MessageSquare,
          badge: unansweredRequests,
        },
        { path: "/notes", label: "Qaydlar", icon: NotebookPen },
        {
          path: "/new-students",
          label: "Yangi o‘quvchilar",
          icon: UserPlus,
          badge: notInterviewedStudents,
        },
      ],
    },
  ];

  const expandedWidth = isHovered && isCollapsed;

  return (
    <div
      className={`fixed left-0 top-0 h-screen flex flex-col bg-gradient-to-b from-blue-900 to-blue-800 text-white p-4 transition-all duration-300 z-50 ${
        isCollapsed ? "w-16" : "w-52"
      } ${expandedWidth ? "!w-64 shadow-xl" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="flex justify-center items-center mb-6 pb-4 border-b border-blue-700">
        <h2 className="text-xl font-semibold whitespace-nowrap text-center">Progress | Admin</h2>
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
                className={`flex items-center min-h-10 p-2 rounded-lg mb-1 transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-md"
                    : "hover:bg-blue-700"
                } ${isCollapsed && !expandedWidth ? "justify-center" : "justify-start"}`}
              >
                <Icon size={18} className={isCollapsed && !expandedWidth ? "" : "mr-3"} />
                {(!isCollapsed || expandedWidth) && <span>{item.label}</span>}
                {isActive && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
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
                    <div className={`transform transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                )}
              </div>
              {/* Submenu */}
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
                          <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 ml-0.5">
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
    </div>
  );
}

export default Sidebar;