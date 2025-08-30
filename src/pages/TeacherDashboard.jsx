// TeacherDashboard.jsx (yangilangan versiya)
"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LottieLoading from "../components/Loading";
import { Calendar, Clock, BookOpen, Users, User, LogOut, BarChart3, ChevronRight, CreditCard } from "lucide-react";

function TeacherDashboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState(null);
  const [stats, setStats] = useState({ totalStudents: 0, activeGroups: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeacherData();
    fetchGroups();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/get_teacher_data`, {
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
      toast.error("Ustoz ma'lumotlarini yuklashda xatolik", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/get_teacher_groups`, {
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
          const res = await fetch(`${import.meta.env.VITE_API_URL}/get_one_group/${group.id}`);
          const groupData = await res.json();
          console.log(groupData);
          groupsWithStudents.push({
            ...group,
            students_amount: groupData.studentsInThisGroup.length,
          });
        }
        setGroups(groupsWithStudents);
      }        
      setStats({
        totalStudents: groupsWithStudents.reduce((sum, group) => sum + group.students_amount, 0),
        activeGroups: groupsWithStudents?.length
      });
    } catch (err) {
      toast.error(`${err.message || "Guruhlarni yuklashda xatolik"}`, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Implement logout logic here
    toast.info("Chiqish amalga oshirilmoqda...", {
      position: "top-right",
      autoClose: 2000,
    });
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

  if (loading) return <LottieLoading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 md:p-8">
      <ToastContainer theme="colored" />
      
      {/* Header Section */}
      <header className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Ustozlar paneli</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/teacher/payments")}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm text-gray-600 hover:text-blue-600 transition"
            >
              <CreditCard size={18} />
              <span className="hidden sm:inline">To'lovlar</span>
            </button>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm text-gray-600 hover:text-red-600 transition"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>
        
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                Xush kelibsiz, {teacherData?.first_name || "Ustoz"}!
              </h2>
              <p className="opacity-90">Bugun darslaringizni rejalashtiring va davomatni belgilang</p>
            </div>
            <img
              src="/hello.png"
              alt="hello"
              className="w-16 h-16 sm:w-20 sm:h-20"
            />
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Jami guruhlar</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.activeGroups}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Jami o'quvchilar</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.totalStudents}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Bugungi darslar</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {groups.filter(group => getTodayStatus(group))?.length}
              </h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div 
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
          onClick={() => navigate("/teacher/payments")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">To'lovlar</p>
              <h3 className="text-2xl font-bold text-gray-800">Ko'rish</h3>
            </div>
            <div className="bg-amber-100 p-3 rounded-full">
              <CreditCard className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </section>

      {/* Groups Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Sizning guruhlaringiz</h2>
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
            {sortedGroups?.length} ta
          </span>
        </div>

        {sortedGroups?.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Hozircha guruh mavjud emas</h3>
            <p className="text-gray-500">Administrator sizni guruhga biriktirgandan so'ng, bu yerda ko'rasiz</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sortedGroups?.map((group) => (
              <div
                key={group.id}
                onClick={() => navigate(`/teacher/attendance/${group.id}`)}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-200 overflow-hidden group"
              >
                {/* Header with gradient based on today status */}
                <div className={`${getTodayStatus(group) ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-gray-600 to-gray-700'} text-white text-center py-4`}>
                  <h3 className="text-lg font-bold">{group.group_subject}</h3>
                  <p className="text-sm opacity-90 mt-1">{group.students_amount || 0} nafar o'quvchi</p>
                </div>

                <div className="p-5 space-y-4">
                  {/* Dars kunlari */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Dars kunlari</span>
                      <p className="text-base font-semibold text-gray-900">
                        {group.days.split("-").map(day => daysInUzbek[day.trim().toLowerCase()] || day).join(", ")}
                      </p>
                    </div>
                  </div>

                  {/* Dars vaqti */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-indigo-100">
                      <Clock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Dars vaqti</span>
                      <p className="text-base font-semibold text-gray-900">
                        {group.start_time?.slice(0, 5) || "00:00"} - {group.end_time?.slice(0, 5) || "00:00"}
                      </p>
                    </div>
                  </div>

                  {/* Bugungi status */}
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 text-sm font-medium ${getTodayStatus(group) ? "text-green-600" : "text-gray-500"}`}>
                      <div className={`p-1 rounded-full ${getTodayStatus(group) ? "bg-green-100" : "bg-gray-100"}`}>
                        {getTodayStatus(group) ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <span className="font-semibold">
                        {getTodayStatus(group) ? "Bugun dars bor" : "Bugun dars yo'q"}
                      </span>
                    </div>
                    
                    <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
      {/* Footer Note */}
      <footer className="text-center text-gray-500 text-sm mt-10">
        <p>© {new Date().getFullYear()} "Intellectual Progress Star" o'quv markazi <br /> Ustoz paneli</p>
      </footer>
    </div>
  );
}

export default TeacherDashboard;