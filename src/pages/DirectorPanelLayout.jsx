import React, { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import {
  Menu,
  X,
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  GraduationCap,
  DoorOpen,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Globe,
  Bell,
  Search,
  BookOpen,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCheck,
  TestTube
} from "lucide-react";
import API_URL, { SOCKET_URL } from "../conf/api";
import { io } from "socket.io-client";

export default function DirectorPanelLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationItems, setNotificationItems] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const socketRef = useRef(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState(null);
  // AppContext dan ma'lumotlarni olish
  const context = useAppContext();

  const mergeUniqueNotifications = (oldItems, newItems) => {
    const map = new Map();

    [...newItems, ...oldItems].forEach((item) => {
      map.set(item.id, item);
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const normalizeNotification = (item) => {
    let parsedMeta = item.meta;

    if (typeof parsedMeta === "string") {
      try {
        parsedMeta = JSON.parse(parsedMeta);
      } catch {
        parsedMeta = null;
      }
    }

    return {
      id: item.id,
      title: item.title,
      message: item.message,
      type: item.type,
      color:
        item.color ||
        (item.type === "success"
          ? "green"
          : item.type === "warning"
            ? "yellow"
            : item.type === "danger"
              ? "red"
              : "blue"),
      isRead: Boolean(item.isRead ?? item.is_read),
      timeAgo: item.timeAgo || item.time_ago || "Hozirgina",
      createdAt: item.createdAt || item.created_at || new Date().toISOString(),
      meta: parsedMeta,
    };
  };

  const testDailyReport = async () => {
    await fetch(`${API_URL}/director-panel/reports/test-daily`, {
      credentials: "include",
    }).then(() => {
      console.log("Daily report test passed");
    });
  }

  const testWeeklyReport = async () => {
    const res = await fetch(`${API_URL}/director-panel/reports/test-weekly`, {
      credentials: "include",
    })
    const data = await res.json();
    console.log(data);
  }

  useEffect(() => {
    if (!context?.user?.id) return;

    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        path: "/socket.io/",
      });
    }

    const socket = socketRef.current;

    const handleConnect = () => {
      console.log("Frontend socket connected:", socket.id);
      console.log("Joining user room:", context.user.id);
      socket.emit("join-user-room", String(context.user.id));
    };

    const handleNotification = (payload) => {
      console.log("Realtime notification keldi:", payload);

      setNotificationItems((prev) => {
        const exists = prev.some((item) => item.id === payload.id);
        if (exists) return prev;

        const newItem = {
          id: payload.id,
          title: payload.title,
          message: payload.message,
          type: payload.type,
          color:
            payload.color ||
            (payload.type === "success"
              ? "green"
              : payload.type === "warning"
                ? "yellow"
                : payload.type === "danger"
                  ? "red"
                  : "blue"),
          isRead: Boolean(payload.isRead),
          timeAgo: payload.timeAgo || "Hozirgina",
          createdAt: payload.createdAt || new Date().toISOString(),
          meta: payload.meta ?? null,
        };

        if (!newItem.isRead) {
          setNotificationCount((count) => count + 1);
        }

        return [newItem, ...prev];
      });

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(payload.title, {
          body: payload.message,
        });
      }
    };

    const handleConnectError = (err) => {
      console.error("Socket connect error:", err.message);
    };

    socket.off("connect", handleConnect);
    socket.off("new-notification", handleNotification);
    socket.off("connect_error", handleConnectError);

    socket.on("connect", handleConnect);
    socket.on("new-notification", handleNotification);
    socket.on("connect_error", handleConnectError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("new-notification", handleNotification);
      socket.off("connect_error", handleConnectError);
    };
  }, [context?.user?.id]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!context?.user?.id) return;

    fetch(`${API_URL}/director-panel/notifications`, {
      credentials: "include",
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Xatolik");
        return data;
      })
      .then((res) => {
        setNotificationCount(res?.data?.unreadCount || 0);
        setNotificationItems((prev) =>
          mergeUniqueNotifications(prev, res?.data?.notifications || [])
        );
      })
      .catch((err) => console.error("Notif fetch error:", err));
  }, [context?.user?.id]);

  const handleReadAllNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/director-panel/notifications/read-all`, {
        method: "PUT",
        credentials: "include",
      });

      const data = await res.json();
      console.log("read-all response:", data);

      if (!res.ok) {
        throw new Error(data?.message || "Xatolik yuz berdi");
      }

      setNotificationCount(0);
      setNotificationItems((prev) =>
        prev.map((item) => ({ ...item, isRead: true }))
      );
    } catch (err) {
      console.error("read-all error:", err);
    }
  };

  const handleReadNotification = async (id) => {
    try {
      const res = await fetch(`${API_URL}/director-panel/notifications/${id}/read`, {
        method: "PUT",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Xatolik yuz berdi");
      }

      setNotificationItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isRead: true } : item
        )
      );

      setNotificationCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("read error:", err);
    }
  };

  const handleNotificationClick = async (item) => {
    try {
      // Avval read qilib qo'yamiz
      if (!item.isRead) {
        await handleReadNotification(item.id);
      }

      const reportTypeFromMeta = item?.meta?.report_type;

      // Oddiy notification bo'lsa faqat read bo'ladi
      if (!reportTypeFromMeta) return;

      setReportLoading(true);

      if (reportTypeFromMeta === "daily") {
        const res = await fetch(
          `${API_URL}/director-panel/reports/daily?date=${item.meta.report_date}`,
          {
            credentials: "include",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Kunlik hisobotni olishda xatolik");
        }

        setReportType("daily");
        setReportData(data);
        setReportModalOpen(true);
        return;
      }

      if (reportTypeFromMeta === "weekly") {
        const res = await fetch(
          `${API_URL}/director-panel/reports/weekly?start=${item.meta.week_start}&end=${item.meta.week_end}`,
          {
            credentials: "include",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Haftalik hisobotni olishda xatolik");
        }

        setReportType("weekly");
        setReportData(data);
        setReportModalOpen(true);
        return;
      }
    } catch (err) {
      console.error("Notification click error:", err);
    } finally {
      setReportLoading(false);
    }
  };

  // Xatolikka yo'l qo'ymaslik uchun default qiymatlar
  const darkMode = context?.darkMode || false;
  const setDarkMode = context?.changeTheme || (() => { });
  const language = context?.language || 'uz';
  const setLanguage = context?.changeLanguage || (() => { });
  const handleDirectorLogout = context?.handleDirectorLogout || (() => { });

  // t funksiyasi mavjudligini tekshirish
  const t = (key) => {
    // Agar context.t mavjud bo'lsa uni ishlat, aks holda key ni qaytar
    if (context?.t && typeof context.t === 'function') {
      return context.t(key);
    }

    // Default translations
    const translations = {
      'dashboard': 'Dashboard',
      'branches': 'Filiallar',
      'groups': 'Guruhlar',
      'debts': 'Qarzlar',
      'teachers': 'O\'qituvchilar',
      'rooms': 'Xonalar',
      'settings': 'Sozlamalar',
      'logout': 'Chiqish',
      'totalStudents': 'Jami o\'quvchilar',
      'totalRevenue': 'Jami daromad',
      'activeGroups': 'Faol guruhlar',
      'pendingDebts': 'Kutilayotgan qarzlar',
      'searchPlaceholder': 'Qidirish...'
    };

    return translations[key] || key;
  };

  // Dark mode ni body ga qo'llash
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Til o'zgartirish
  const handleLanguageChange = (lang) => {
    if (setLanguage && typeof setLanguage === 'function') {
      setLanguage(lang);
      localStorage.setItem('language', lang);
    }
  };

  // Mobil menyuni yopish
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigation = [
    { name: t('dashboard'), to: "", icon: LayoutDashboard, end: true },
    { name: t('branches'), to: "branches", icon: Building2 },
    { name: t('groups'), to: "groups", icon: BookOpen },
    { name: t('debts'), to: "debts", icon: CreditCard },
    { name: t('teachers'), to: "teachers", icon: GraduationCap },
    { name: t('rooms'), to: "rooms", icon: DoorOpen },
    { name: t('settings'), to: "settings", icon: Settings },
  ];

  // Logout funksiyasi
  const handleLogout = () => {
    if (handleDirectorLogout && typeof handleDirectorLogout === 'function') {
      handleDirectorLogout();
    } else {
      // Fallback logout
      console.log('Logout clicked');
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            ${sidebarOpen ? "w-64" : "w-20"} 
            ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            fixed md:static inset-y-0 left-0 z-50
            transition-all duration-300 ease-in-out
            bg-[#104292] dark:bg-gray-800
            shadow-xl md:shadow-lg
            flex flex-col
            h-full
          `}
        >
          {/* Logo and toggle */}
          <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} p-4 border-b dark:border-gray-700`}>
            {sidebarOpen ? (
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl bg-white bg-clip-text text-transparent">
                  Director | Progress
                </span>
              </div>
            ) : null}

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:block p-1.5 text-white hover:text-black rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 text-white hover:text-black rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center ${sidebarOpen ? 'justify-start px-3' : 'justify-center'} 
                    py-2.5 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r dark:border-blue-700 border from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-white hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-300 dark:hover:bg-gray-700/50'
                    }
                    group relative
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={20} className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} />
                      {sidebarOpen && <span className="ml-3">{item.name}</span>}

                      {/* Tooltip for collapsed sidebar */}
                      {!sidebarOpen && (
                        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                          {item.name}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* User info */}
          <div className={`border-t dark:border-gray-700 p-4 ${!sidebarOpen && 'text-center'}`}>
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-xl dark:border-red-700 border transition-colors"
              >
                <LogOut size={16} />
                <span>{t('logout')}</span>
              </button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
            <div className="px-5 py-3.5 flex items-center justify-between">
              {/* Left side */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  <Menu size={20} />
                </button>

                {/* Search */}
                <div className="hidden md:flex items-center bg-gray-200 dark:bg-gray-700 rounded-xl px-3 py-2">
                  <Search size={18} className="text-gray-900 dark:text-white" />
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    className="ml-2 bg-transparent placeholder:text-gray-900 dark:placeholder:text-white border-none outline-none text-sm w-64"
                  />
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-2 dark:text-white">
                {/* Notifications */}
                <div className="relative">
                  {/* <button
                    onClick={() => testWeeklyReport()}
                    className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <TestTube size={20} />
                  </button>
                  <button
                    onClick={() => testDailyReport()}
                    className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <TestTube size={20} />
                  </button> */}
                  <button
                    onClick={() => setShowNotifications((prev) => !prev)}
                    className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <Bell size={20} />
                    {notificationCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
                        {notificationCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Bildirishnomalar
                        </h3>
                        <button
                          onClick={handleReadAllNotifications}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Hammasini o‘qildi
                        </button>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notificationItems.length > 0 ? (
                          notificationItems.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleNotificationClick(item)}
                              className={`px-4 py-3 transition cursor-pointer border-b border-gray-100 dark:border-gray-700
                              ${item.isRead
                                  ? "opacity-60 bg-transparent hover:bg-gray-50/60 dark:hover:bg-gray-700/30"
                                  : "bg-blue-50/40 dark:bg-blue-900/10 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                }
                            `}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`mt-1 w-2 h-2 rounded-full ${item.color === "red"
                                    ? "bg-red-500"
                                    : item.color === "yellow"
                                      ? "bg-yellow-500"
                                      : item.color === "green"
                                        ? "bg-green-500"
                                        : "bg-blue-500"
                                    } ${item.isRead ? "opacity-50" : ""}`}
                                ></div>

                                <div className="flex-1">
                                  <p
                                    className={`text-sm font-medium ${item.isRead
                                      ? "text-gray-500 dark:text-gray-400"
                                      : "text-gray-900 dark:text-white"
                                      }`}
                                  >
                                    {item.title}
                                  </p>

                                  {item?.meta?.report_type === "daily" && (
                                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                      Kunlik
                                    </span>
                                  )}

                                  {item?.meta?.report_type === "weekly" && (
                                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                                      Haftalik
                                    </span>
                                  )}

                                  <p
                                    className={`text-xs mt-1 ${item.isRead
                                      ? "text-gray-400 dark:text-gray-400"
                                      : "text-gray-500 dark:text-gray-400"
                                      }`}
                                  >
                                    {item.message}
                                  </p>

                                  <div className="flex items-center justify-between mt-1">
                                    <p
                                      className={`text-[11px] ${item.isRead
                                        ? "text-gray-300 dark:text-gray-300"
                                        : "text-gray-400"
                                        }`}
                                    >
                                      {item.timeAgo}
                                    </p>

                                    <CheckCheck
                                      size={14}
                                      className={
                                        item.isRead
                                          ? "text-blue-500 dark:text-blue-500"
                                          : "hidden"
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-10 text-center">
                            <Bell className="mx-auto mb-3 text-gray-300" size={28} />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Hozircha bildirishnomalar yo‘q
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Language selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Globe size={20} />
                    <span className="hidden sm:inline text-sm font-medium">
                      {language === 'uz' ? 'UZ' : 'EN'}
                    </span>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 py-1 z-50">
                      <button
                        onClick={() => {
                          handleLanguageChange('uz');
                          setShowProfileMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${language === 'uz' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : ''}`}
                      >
                        🇺🇿 O'zbekcha
                      </button>
                      <button
                        onClick={() => {
                          handleLanguageChange('en');
                          setShowProfileMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${language === 'en' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : ''}`}
                      >
                        🇬🇧 English
                      </button>
                    </div>
                  )}
                </div>

                {/* Theme toggle */}
                <button onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Toggle theme"
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </div>

            {/* Mobile search */}
            <div className="md:hidden px-4 pb-3">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  className="ml-2 bg-transparent border-none outline-none text-sm w-full"
                />
              </div>
            </div>
          </header>
          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="p-4 md:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      {reportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {reportType === "daily" ? "Kunlik hisobot" : "Haftalik hisobot"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {reportType === "daily"
                    ? reportData?.date
                    : `${reportData?.start || ""} — ${reportData?.end || ""}`}
                </p>
              </div>

              <button
                onClick={() => {
                  setReportModalOpen(false);
                  setReportData(null);
                  setReportType(null);
                }}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto max-h-[75vh]">
              {reportLoading ? (
                <div className="py-16 text-center text-gray-500 dark:text-gray-400">
                  Yuklanmoqda...
                </div>
              ) : reportData ? (
                <div className="space-y-5">
                  {/* Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Jami o'quvchilar
                      </p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {reportData.totalStudents || 0}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Yangi o'quvchilar
                      </p>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {reportData.newStudents || 0}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Jami to'lov
                      </p>
                      <p className="mt-2 text-2xl font-bold text-green-600">
                        {Number(reportData.totalPayments || 0).toLocaleString()} so'm
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Yo'qlama foizi
                      </p>
                      <p className="mt-2 text-2xl font-bold text-blue-600">
                        {reportData.attendancePercent || 0}%
                      </p>
                    </div>
                  </div>

                  {/* Latest payments */}
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                      So'nggi to'lovlar
                    </h3>

                    {reportData.latestPayments?.length > 0 ? (
                      <div className="space-y-3">
                        {reportData.latestPayments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {payment.group_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {payment.created_at}
                              </p>
                            </div>

                            <p className="text-sm font-semibold text-green-600">
                              {Number(payment.amount || 0).toLocaleString()} so'm
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        To'lovlar topilmadi
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-gray-500 dark:text-gray-400">
                  Hisobot topilmadi
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}