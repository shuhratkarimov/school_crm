"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Smile, Calendar, Clock, BookOpen, Users, User, LogOut, BarChart3, ChevronRight, CreditCard, FileText, CheckCircle, Sparkles, Target, TrendingUp, Bookmark } from "lucide-react";
import LottieLoading from "../components/Loading";
import TeacherSidebar from "../components/TeacherSidebar";
import { API_URL } from "../config";

function TeacherDashboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState(null);
  const [stats, setStats] = useState({ totalStudents: 0, activeGroups: 0 });
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const navigate = useNavigate();

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
          const res = await fetch(`${API_URL}/get_one_group/${group.id}`);
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
    toast("Chiqish amalga oshirilmoqda...");
    setTimeout(() => {
      navigate("/teacher/login");
    }, 2000);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <TeacherSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        {/* Header Section */}
        <header className="mb-8">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 shadow-lg mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-12 translate-y-12"></div>

            <div className="flex items-center justify-between relative z-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  Xush kelibsiz,<br /> {teacherData?.first_name + " " + teacherData?.last_name || "Ustoz"}!
                </h2>
                <p className="opacity-90 flex items-center gap-1">
                  Darslaringizda yordamga tayyorman ☺️
                </p>
              </div>
              <div className="hidden md:block">
                <img src="/lecture.png" alt="lecture" className="w-20 h-20" />
              </div>
            </div>
          </div>
        </header>

        {/* Stats Section */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {/* Faol guruhlar */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="flex items-center text-xs font-medium text-blue-600 mb-1">
                  <TrendingUp size={14} className="mr-1" />
                  Faol guruhlar
                </p>
                <h3 className="text-xl font-bold text-gray-800">{stats.activeGroups}</h3>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-xl">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Faol o‘quvchilar */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="flex items-center text-xs font-medium text-green-600 mb-1">
                  <User size={14} className="mr-1" />
                  Faol o‘quvchilar
                </p>
                <h3 className="text-xl font-bold text-gray-800">{stats.totalStudents}</h3>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-2 rounded-xl">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          {/* Rejalashtirilgan */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="flex items-center text-xs font-medium text-purple-600 mb-1">
                  <BarChart3 size={14} className="mr-1" />
                  Bugungi darslar
                </p>
                <h3 className="text-xl font-bold text-gray-800">
                  {groups.filter((group) => getTodayStatus(group))?.length}
                </h3>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-2 rounded-xl">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </section>

        {/* Groups Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Sizning guruhlaringiz</h2>
            </div>
            <span className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-sm font-medium px-3 py-1.5 rounded-full">
              {sortedGroups?.length} ta guruh
            </span>
          </div>

          {sortedGroups?.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Hozircha guruh mavjud emas</h3>
              <p className="text-gray-500">Administrator sizni guruhga biriktirgandan so'ng, bu yerda ko'rasiz</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sortedGroups?.map((group) => (
                <div
                  key={group.id}
                  onClick={() => {
                    setSelectedGroupId(group.id);
                    setActiveMenu("attendance");
                    navigate(`/teacher/attendance/${group.id}`);
                  }}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 hover:border-indigo-200 overflow-hidden group"
                >
                  <div
                    className={`${getTodayStatus(group)
                      ? "bg-gradient-to-r from-emerald-500 to-green-600"
                      : "bg-gradient-to-r from-slate-600 to-gray-700"
                      } text-white text-center py-4 relative overflow-hidden`}
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-6 translate-x-6"></div>
                    <h3 className="text-lg font-bold relative z-10">{group.group_subject}</h3>
                    <p className="text-sm opacity-90 mt-1 relative z-10">{group.students_amount || 0} nafar o'quvchi</p>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-xl">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Dars kunlari</span>
                        <p className="text-base font-semibold text-gray-900">
                          {group.days
                            .split("-")
                            .map((day) => daysInUzbek[day.trim().toLowerCase()] || day)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-2 rounded-xl">
                        <Clock className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Dars vaqti</span>
                        <p className="text-base font-semibold text-gray-900">
                          {group.start_time?.slice(0, 5) || "00:00"} - {group.end_time?.slice(0, 5) || "00:00"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div
                        className={`flex items-center gap-2 text-sm font-medium ${getTodayStatus(group) ? "text-emerald-600" : "text-gray-500"
                          }`}
                      >
                        <div
                          className={`p-1.5 rounded-full ${getTodayStatus(group) ? "bg-emerald-100" : "bg-gray-100"
                            }`}
                        >
                          {getTodayStatus(group) ? (
                            <CheckCircle size={16} className="text-emerald-500" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="font-semibold">
                          {getTodayStatus(group) ? "Bugun dars bor" : "Bugun dars yo'q"}
                        </span>
                      </div>
                      <div className="text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center">
                        <span className="text-xs mr-1 font-medium">Batafsil</span>
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Classes Section */}
        {sortedGroups.filter(group => getTodayStatus(group)).length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-2 rounded-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Bugungi darslar</h2>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="space-y-4">
                {sortedGroups.filter(group => getTodayStatus(group)).map((group, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        <Bookmark className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{group.group_subject}</h4>
                        <p className="text-sm text-gray-600">{group.start_time?.slice(0, 5) || "00:00"} - {group.end_time?.slice(0, 5) || "00:00"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        navigate(`/teacher/attendance/${group.id}`);
                      }}
                      className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md transition-shadow"
                    >
                      Davomatni belgilash
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer Note */}
        <footer className="text-center text-gray-500 text-sm mt-10">
          <p>© {new Date().getFullYear()} "Intellectual Progress Star" o'quv markazi <br /> Ustoz paneli</p>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-3 z-40">
        <div className="flex justify-around items-center">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveMenu(item.id);
                if (item.id === "attendance") {
                  if (selectedGroupId) {
                    navigate(`/teacher/attendance/${selectedGroupId}`);
                  } else {
                    toast.error("Avval guruh tanlang!");
                  }
                } else {
                  navigate(item.path);
                }
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