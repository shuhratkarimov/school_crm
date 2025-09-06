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

function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    // Sidebar toggle qilinganda barcha submenularni yopamiz
    setOpenMenus({});
  };

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleMouseEnter = () => {
    // Sidebar collapsed holatda bo'lsa, hover qilganda kengaytiramiz
    if (isCollapsed) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(setTimeout(() => setIsHovered(true), 150));
    }
  };

  const handleMouseLeave = () => {
    // Sidebar collapsed holatda bo'lsa, hover tugaganda yopamiz
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
      children: [
        { path: "/requests", label: "Murojaatlar", icon: MessageSquare },
        { path: "/notes", label: "Qaydlar", icon: NotebookPen },
        { path: "/new-students", label: "Yangi o‘quvchilar", icon: UserPlus },
      ],
    },
  ];

  // Hover qilinganda sidebar kengayadi
  const expandedWidth = isHovered && isCollapsed;

  return (
    <div
      className={`fixed left-0 top-0 h-screen flex flex-col bg-gradient-to-b from-blue-900 to-blue-800 text-white p-4 transition-all duration-300 z-50 ${isCollapsed ? "w-16" : "w-52"
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

          // Oddiy menu (child bo'lmasa)
          if (!item.children) {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center min-h-10 p-2 rounded-lg mb-1 transition-all duration-200 ${isActive
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

          // Agar children bo'lsa (submenu)
          const isMenuOpen = openMenus[item.label] || expandedWidth;
          return (
            <div key={item.label} className="mb-2">
              <div
                onClick={() => toggleMenu(item.label)}
                className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 ${isMenuOpen ? "bg-blue-700" : "hover:bg-blue-700"
                  } ${isCollapsed && !expandedWidth ? "justify-center" : "justify-between"}`}
              >
                <div className="flex items-center">
                  <Icon size={18} className={isCollapsed && !expandedWidth ? "" : "mr-3"} />
                  {(!isCollapsed || expandedWidth) && <span>{item.label}</span>}
                </div>
                {(!isCollapsed || expandedWidth) && (
                  <div className={`transform transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}>
                    <ChevronDown size={16} />
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
                        className={`flex items-center min-h-8 p-2 rounded-lg mb-1 transition-all duration-200 ${isSubActive
                            ? "bg-blue-600 shadow-md"
                            : "hover:bg-blue-700"
                          }`}
                      >
                        <SubIcon size={16} className="mr-2" />
                        <span>{sub.label}</span>
                        {isSubActive && (
                          <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
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