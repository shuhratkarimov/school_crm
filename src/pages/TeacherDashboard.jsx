"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LottieLoading from "../components/Loading";
import { Calendar, Clock, BookOpen } from "lucide-react";

function TeacherDashboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/get_teacher_data`,
        {
          method: "GET",
          credentials: "include",
        }
      );

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
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/get_teacher_groups`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (res.status === 401) {
        navigate("/teacher/login");
        return;
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        setGroups([]);
        return;
      }

      setGroups(data);
    } catch (err) {
      toast.error("Guruhlarni yuklashda xatolik", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const daysInUzbek = {
    mon: "dushanba",
    tue: "seshanba",
    wed: "chorshanba",
    thu: "payshanba",
    fri: "juma",
    sat: "shanba",
    sun: "yakshanba",
  };

  const getTodayStatus = (group) => {
    const today = new Date();
    console.log(`Today: ${today}`);
    const options = { weekday: "short" };
    const todayDay = today
      .toLocaleDateString("en-US", options)
      .toLowerCase();
    console.log(`Today day: ${todayDay}`);
    console.log(`Group days: ${group.days}`);
    console.log(`Group days array: ${group.days.split("-").map((day) => day.toLowerCase())}`);
    console.log(`Group days array includes today day: ${group.days.split("-").map((day) => day.toLowerCase()).includes(daysInUzbek[todayDay])}`);
    return group.days
      .split("-")
      .map((day) => day.toLowerCase())
      .includes(daysInUzbek[todayDay]);
  };

  const sortedGroups = [...groups].sort((a, b) => {
    const aHasClass = getTodayStatus(a);
    const bHasClass = getTodayStatus(b);
    if (aHasClass && !bHasClass) return -1;
    if (!aHasClass && bHasClass) return 1;
    return 0;
  });

  if (loading) return <LottieLoading />;

  return (
    <div className="min-h-screen p-6">
      <ToastContainer />
      <div className="mb-10 text-center flex justify-center">
        {teacherData && (
          <span className="inline-flex items-center gap-2 text-xl sm:text-2xl md:text-3xl font-extrabold text-[#104292]">
            Xush kelibsiz, {teacherData?.first_name ? teacherData.first_name : "Ustoz"} {teacherData?.last_name ? teacherData.last_name : ""}!
            <img
              src={"/hello.png"}
              alt="hello"
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
            />
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mb-10 text-center justify-center">
        <BookOpen className="w-8 h-8 text-[#104292]" />
        <span className="text-xl md:text-2xl font-extrabold text-[#104292] tracking-wide">
          Sizning guruhlaringiz
        </span>
      </div>

      {sortedGroups?.length === 0 ? (
        <p className="text-center text-gray-500 text-xl italic">
          Hozircha guruh mavjud emas
        </p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {sortedGroups.map((group) => (
            <div
              key={group.id}
              onClick={() => navigate(`/teacher/attendance/${group.id}`)}
              className="bg-white shadow-md rounded-2xl cursor-pointer border border-blue-700 hover:shadow-xl hover:border-blue-500 transition-all duration-300 overflow-hidden"
            >
              <div className="bg-[#104292] text-white text-center py-3">
                <span className="text-xl font-bold">{group.group_subject}</span>
              </div>

              <div className="p-6 space-y-4">
                {/* Dars kunlari */}
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Calendar className="w-6 h-6 text-[#104292]" />
                  </div>
                  <span className="text-lg font-bold">Dars kunlari:</span>
                  <span className="font-medium text-gray-900">
                    {group.days.split("-").join(", ")}
                  </span>
                </div>

                {/* Dars vaqti */}
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="p-2 rounded-full bg-indigo-100">
                    <Clock className="w-6 h-6 text-[#104292]" />
                  </div>
                  <span className="text-lg font-bold">Dars vaqti:</span>
                  <span className="font-medium text-gray-900">
                    {group.start_time.slice(0, 5)} - {group.end_time.slice(0, 5)}
                  </span>
                </div>

                {/* Bugungi status */}
                <div
                  className={`flex items-center gap-3 text-lg font-medium mt-4 ${getTodayStatus(group) ? "text-green-600" : "text-red-600"
                    }`}
                >
                  <div
                    className={`p-2 rounded-full ${getTodayStatus(group) ? "bg-green-100" : "bg-red-100"
                      }`}
                  >
                    {getTodayStatus(group) ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <span className="font-bold">
                    {getTodayStatus(group) ? "(Bugun dars bor)" : "(Bugun dars yo'q)"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;
