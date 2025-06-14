import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Users, BookOpen, CreditCard, ClipboardCheck, MessageSquare, GraduationCap } from "lucide-react";

function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
  };

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/students", label: "O'quvchilar", icon: Users },
    { path: "/groups", label: "Guruhlar", icon: BookOpen },
    { path: "/payments", label: "To'lovlar", icon: CreditCard },
    { path: "/attendance", label: "Davomat", icon: ClipboardCheck },
    { path: "/requests", label: "Murojaatlar", icon: MessageSquare },
    { path: "/teachers", label: "Ustozlar", icon: GraduationCap },
  ];

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        {!isCollapsed && (
          <h2 style={{ color: "#ffffff", fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
            Progress | CRM  
          </h2>
        )}
        <button
          onClick={toggleSidebar}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "4px",
            transition: "background 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div
            style={{
              width: "20px",
              height: "16px",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                width: "100%",
                height: "2px",
                background: "#ffffff",
                position: "absolute",
                top: 0,
                transition: "all 1s ease",
                transform: isCollapsed ? "rotate(45deg) translate(5px, 5px)" : "none",
              }}
            />
            <span
              style={{
                width: "100%",
                height: "2px",
                background: "#ffffff",
                position: "absolute",
                top: "7px",
                transition: "all 0.3s ease",
                opacity: isCollapsed ? 0 : 1,
              }}
            />
            <span
              style={{
                width: "100%",
                height: "2px",
                background: "#ffffff",
                position: "absolute",
                bottom: 0,
                transition: "all 1s ease",
                transform: isCollapsed ? "rotate(-45deg) translate(5px, -5px)" : "none",
              }}
            />
          </div>
        </button>
      </div>
      <nav>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? "active" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "flex-start",
                minHeight: "40px",
              }}
            >
              <Icon size={18} style={{ flexShrink: 0, marginRight: isCollapsed ? 0 : "8px" }} />
              {!isCollapsed && (
                <span className="menu-list">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default Sidebar;