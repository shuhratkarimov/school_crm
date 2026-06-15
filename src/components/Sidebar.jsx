import { useState, useEffect, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Download,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import API_URL from "../conf/api";
import FeedbackModal from "./FeedbackModal";
import { useAppContext } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0, height: 0 },
  show: {
    opacity: 1,
    height: "auto",
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
};

const sliderVariants = {
  initial: (dir) => ({
    opacity: 0,
    x: dir > 0 ? 20 : -20,
  }),
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: (dir) => ({
    opacity: 0,
    x: dir > 0 ? -20 : 20,
  }),
};

function Sidebar() {
  const location = useLocation();
  const [direction, setDirection] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [unansweredRequests, setUnansweredRequests] = useState(0);
  const [notInterviewedStudents, setNotInterviewedStudents] = useState(0);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const { user, mobileSidebarOpen, setMobileSidebarOpen } = useAppContext();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isCollapsed ? "64px" : "256px"
    );
  }, [isCollapsed]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isCollapsed ? "64px" : "256px"
    );
  }, []);

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
        { path: "/left-students", label: "Ketgan o'quvchilar", icon: LogOut },
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
        { path: "/export", label: "Ma'lumotlarni yuklab olish", icon: Download },
      ],
    },
  ];

  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      setDirection(location.pathname > prevPathRef.current ? 1 : -1);
      prevPathRef.current = location.pathname;
      setMobileSidebarOpen(false);
    }
  }, [location.pathname, setMobileSidebarOpen]);

  const expandedWidth = isHovered && isCollapsed;

  return (
    <>
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col bg-gradient-to-b from-blue-900 to-blue-800 dark:from-neutral-900 dark:to-black p-4 text-white transition-all duration-300
          ${isCollapsed ? "w-16" : "w-64"}
          ${expandedWidth ? "!w-64 shadow-xl" : ""}
          ${mobileSidebarOpen ? "!translate-x-0 !w-64" : "-translate-x-full md:translate-x-0"}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative mb-6 flex items-center justify-between gap-2 border-b border-blue-700 dark:border-neutral-800 pb-4">
          {(!isCollapsed || expandedWidth) && (
            <h2 className="whitespace-nowrap text-xl font-semibold truncate">
              {user?.username ? `${user?.username?.toUpperCase()} | Progress` : "Manager | Progress"}
            </h2>
          )}
          <button
            onClick={() => setIsCollapsed((p) => !p)}
            className="ml-auto p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title={isCollapsed ? "Yoyish" : "Yig'ish"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
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
                  className={`relative mb-1 flex min-h-10 items-center p-2 transition-all duration-200 ${isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 shadow-md"
                    : "hover:bg-blue-700 dark:hover:bg-neutral-800"
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
                  className={`flex cursor-pointer items-center p-2 transition-all duration-200 ${isMenuOpen ? "bg-blue-700 dark:bg-neutral-800" : "hover:bg-blue-700 dark:hover:bg-neutral-800"
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
                        className={`transform transition-transform duration-200 ease-in-out ${isMenuOpen ? "rotate-180" : ""
                          }`}
                      >
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {isMenuOpen && (!isCollapsed || expandedWidth) && (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="ml-6 mt-1 border-l border-blue-700 dark:border-neutral-800 pl-2 overflow-hidden"
                    >
                      {item.children.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = location.pathname === sub.path;

                        return (
                          <motion.div
                            key={sub.path}
                            variants={itemVariants}
                          >
                            <Link
                              to={sub.path}
                              className={`mb-1 flex min-h-8 items-center p-2 transition-all duration-200 ${isSubActive ? "bg-blue-600 dark:bg-blue-700 shadow-md" : "hover:bg-blue-700 dark:hover:bg-neutral-800"
                                }`}
                            >
                              <SubIcon size={16} className="mr-2" />
                              <span>{sub.label}</span>

                              {sub.badge > 0 && (
                                <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                                  {sub.badge}
                                </span>
                              )}
                            </Link>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="mt-4 space-y-2 border-t border-blue-700 dark:border-neutral-800 pt-4">
          <button
            onClick={toggleTheme}
            className={`w-full border border-blue-500/40 dark:border-neutral-700 bg-white/10 dark:bg-white/5 rounded-lg px-3 py-2.5 shadow-sm transition-all duration-200 hover:bg-white/15 ${isCollapsed && !expandedWidth ? "flex justify-center" : "flex justify-start"
              } items-center`}
            title={theme === "light" ? "Tungi rejim" : "Kunduzgi rejim"}
          >
            {theme === "light" ? (
              <Moon size={18} className={isCollapsed && !expandedWidth ? "" : "mr-3"} />
            ) : (
              <Sun size={18} className={isCollapsed && !expandedWidth ? "" : "mr-3"} />
            )}
            {(!isCollapsed || expandedWidth) && (
              <span className="text-sm font-medium">
                {theme === "light" ? "Tungi rejim" : "Kunduzgi rejim"}
              </span>
            )}
          </button>
          <button
            onClick={openSupportModal}
            className={`w-full border border-blue-500/40 dark:border-neutral-700 bg-white/10 dark:bg-white/5 rounded-lg px-3 py-3 shadow-sm transition-all duration-200 hover:bg-white/15 ${isCollapsed && !expandedWidth ? "flex justify-center" : "flex justify-start"
              } items-center`}
          >
            <HelpCircle size={18} className={isCollapsed && !expandedWidth ? "" : "mr-3"} />
            {(!isCollapsed || expandedWidth) && (
              <div className="text-left">
                <p className="text-sm font-semibold">Qo‘llab-quvvatlash</p>
                <p className="text-[11px] text-blue-100 dark:text-neutral-400">Fikr yoki xatolik yuborish</p>
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