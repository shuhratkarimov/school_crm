"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle,
  ChevronRight,
  LogOut,
  GraduationCap,
  Sparkles,
  Award,
  Target,
  Bookmark,
  Bell,
  Star,
  Coffee,
  Sun,
  Moon,
  FileText,
  CreditCard
} from "lucide-react";
import LottieLoading from "../components/Loading";
import TeacherSidebar from "../components/TeacherSidebar";
import API_URL from "../conf/api";

const monthsUZ = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"
];

const weekdaysUZ = [
  "Yakshanba",
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba"
];

function TeacherDashboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState(null);
  const [stats, setStats] = useState({ totalStudents: 0, activeGroups: 0 });
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const navigate = useNavigate();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Xayrli tong");
    else if (hour < 18) setGreeting("Xayrli kun");
    else setGreeting("Xayrli kech");

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTeacherData();
    fetchGroups();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/get_teacher_data`, {
        method: "GET",
        credentials: "include",
      });

      if (res.status === 401) {
        navigate("/teacher/login");
        return;
      }

      const data = await res.json();
      setTeacherData(data);
    } catch (err) {
      toast.error(`Ustoz ma'lumotlarini yuklashda xatolik: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/get_teacher_groups`, {
        method: "GET",
        credentials: "include",
      });

      if (res.status === 401) {
        navigate("/teacher/login");
        return;
      }

      const data = await res.json();
      let groupsWithStudents = [];
      if (data) {
        for (const group of data) {
          const res = await fetch(`${API_URL}/get_one_teacher_group/${group.id}`, {
            method: "GET",
            credentials: "include",
          });
          const groupData = await res.json();
          groupsWithStudents.push({
            ...group,
            students_amount: groupData.studentsInThisGroup.length,
          });
        }
        setGroups(groupsWithStudents);
      }
      setStats({
        totalStudents: groupsWithStudents.reduce((sum, group) => sum + group.students_amount, 0),
        activeGroups: groupsWithStudents?.length,
      });
    } catch (err) {
      toast.error(`Guruhlarni yuklashda xatolik: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    navigate("/teacher/login");
  };

  const daysInUzbek = {
    mon: "Dushanba",
    tue: "Seshanba",
    wed: "Chorshanba",
    thu: "Payshanba",
    fri: "Juma",
    sat: "Shanba",
    sun: "Yakshanba",
  };

  const getTodayStatus = (group) => {
    const today = new Date();
    const todayDay = today.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();
    return group.days.split("-").map((day) => day.trim().toLowerCase()).includes(daysInUzbek[todayDay].toLowerCase());
  };

  const sortedGroups = [...groups].sort((a, b) => {
    const aHasClass = getTodayStatus(a);
    const bHasClass = getTodayStatus(b);
    return aHasClass === bHasClass ? 0 : aHasClass ? -1 : 1;
  });

  const menuItems = [
    { id: "dashboard", label: "Bosh sahifa", icon: BookOpen, path: "/teacher/dashboard" },
    { id: "test-results", label: "Test natijalari", icon: FileText, path: "/teacher/test-results" },
    { id: "payments", label: "To'lovlar", icon: CreditCard, path: "/teacher/payments" },
  ];

  if (loading) return <LottieLoading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col md:flex-row">
      <TeacherSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        {/* Header with time and greeting */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-2xl shadow-lg">
                {greeting.includes("tong") ? (
                  <Sun className="w-8 h-8 text-white" />
                ) : greeting.includes("kech") ? (
                  <Moon className="w-8 h-8 text-white" />
                ) : (
                  <Sparkles className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  {greeting}, {teacherData?.first_name}!
                </h1>
                <p className="text-gray-600 mt-1">
                  {`${currentTime.getDate()}-${monthsUZ[currentTime.getMonth()]}, ${currentTime.getFullYear()}-yil, ${weekdaysUZ[currentTime.getDay()]}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span className="text-lg font-semibold text-gray-800">
                {currentTime.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl p-6 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 translate-y-16"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">📚 Bugungi darslar</h2>
              <p className="opacity-90 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Sizda {sortedGroups.filter(group => getTodayStatus(group)).length} ta dars bor
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-white rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-xl">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                Faol
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.activeGroups}</h3>
            <p className="text-gray-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Jami guruhlar
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalStudents}</h3>
            <p className="text-gray-600">Jami o'quvchilar</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-3 rounded-xl">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-600 rounded-full">
                Bugun
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              {sortedGroups.filter(group => getTodayStatus(group)).length}
            </h3>
            <p className="text-gray-600">Bugungi darslar</p>
          </motion.div>
        </div>

        {/* Today's Classes */}
        <AnimatePresence>
          {sortedGroups.filter(group => getTodayStatus(group)).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  Bugungi darslar
                </h2>
                <span className="text-sm text-gray-500">
                  {sortedGroups.filter(group => getTodayStatus(group)).length} ta dars
                </span>
              </div>

              <div className="grid gap-3">
                {sortedGroups
                  .filter(group => getTodayStatus(group))
                  .map((group, index) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate(`/teacher/attendance/${group.id}`)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm">
                            <Bookmark className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{group.group_subject}</h3>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {group.start_time?.slice(0, 5)} - {group.end_time?.slice(0, 5)}
                            </p>
                          </div>
                        </div>
                        <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2 justify-center">
                          Davomatni belgilash
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All Groups */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Sizning guruhlaringiz
            </h2>
            <span className="bg-indigo-100 text-indigo-600 text-sm font-medium px-3 py-1 rounded-full">
              {sortedGroups.length} ta guruh
            </span>
          </div>

          {sortedGroups.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100"
            >
              <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Hozircha guruh mavjud emas</h3>
              <p className="text-gray-500">Administrator sizni guruhga biriktirgandan so'ng, bu yerda ko'rasiz</p>
            </motion.div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedGroups.map((group, index) => {
                const hasClassToday = getTodayStatus(group);
                return (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all cursor-pointer border border-gray-100 overflow-hidden group"
                    onClick={() => navigate(`/teacher/attendance/${group.id}`)}
                  >
                    <div className={`h-2 ${hasClassToday ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`} />

                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg text-gray-800">{group.group_subject}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${hasClassToday
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                          }`}>
                          {hasClassToday ? 'Bugun dars bor' : 'Dars yo\'q'}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span>
                            {group.days
                              .split("-")
                              .map((day) => daysInUzbek[day.trim().toLowerCase()] || day)
                              .join(", ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-indigo-600" />
                          <span>
                            {group.start_time?.slice(0, 5)} - {group.end_time?.slice(0, 5)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <span>{group.students_amount || 0} nafar o'quvchi</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-sm">
                          {hasClassToday ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-green-600 font-medium">Davomat qilinmagan</span>
                            </>
                          ) : (
                            <>
                              <Coffee className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-500">Dam olish kuni</span>
                            </>
                          )}
                        </div>
                        <div className="text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center">
                          <span className="text-sm font-medium">Batafsil</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-12">
          <p className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            © {new Date().getFullYear()} "Intellectual Progress Star" o'quv markazi
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </p>
          <p className="mt-1">Ustozlar uchun maxsus platforma</p>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg shadow-lg border-t border-gray-200 p-2 z-40">
        <div className="flex justify-around items-center">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveMenu(item.id);
                navigate(item.path);
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeMenu === item.id
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
            >
              <item.icon size={20} />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={20} />
            <span className="text-xs">Chiqish</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default TeacherDashboard;