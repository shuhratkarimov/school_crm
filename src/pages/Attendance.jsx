"use client";

import { useState, useEffect } from "react";
import { Check, X, Calendar } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CalendarEl from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import LottieLoading from "../components/Loading";
import { motion, AnimatePresence } from "framer-motion";
import { registerLocale } from "react-datepicker";
import uz from "date-fns/locale/uz";
registerLocale("uz", uz); 

const uzWeekdays = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];
const monthsUZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
];

export default function AttendanceDashboard() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const [attendanceTime, setAttendanceTime] = useState(null);

  // Helper functions
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateWithDaysStart = (d) => {
    const year = d.getFullYear();
    const month = monthsUZ[d.getMonth()];
    const day = String(d.getDate()).padStart(2, "0");
    return `${day} ${month}, ${year}`;
  };

  const formatStartTime = (created_at) => {
    const date = new Date(created_at);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const normalizeDaysString = (days) =>
    days?.toUpperCase()?.split("-").map(d => d.trim()).filter(Boolean) || [];

  const formatDaysForDisplay = (days) => {
    const uzWeekdaysFormatted = {
      DUSHANBA: "Dushanba",
      SESHANBA: "Seshanba",
      CHORSHANBA: "Chorshanba",
      PAYSHANBA: "Payshanba",
      JUMA: "Juma",
      SHANBA: "Shanba",
      YAKSHANBA: "Yakshanba",
    };
    return normalizeDaysString(days)
      .map(day => uzWeekdaysFormatted[day] || day)
      .join(", ");
  };

  const isClassOnDate = (group, date) => {
    const classDays = normalizeDaysString(group?.days).map(d => uzWeekdays.indexOf(d.toLowerCase()));
    return classDays.includes(date.getDay());
  };

  // Fetch groups with status
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/get_groups`);
      if (!res.ok) throw new Error("Guruhlarni yuklashda xatolik");
      const data = await res.json();

      const groupsWithStatus = await Promise.all(data.map(async (group) => {
        const dateStr = formatDate(new Date());
        let status = "loading";
        let records = [];

        try {
          const resAtt = await fetch(
            `${import.meta.env.VITE_API_URL}/get_attendance_by_date/${group.id}?date=${dateStr}`
          );
          if (resAtt.status === 404) {
            status = "no_attendance";
          } else {
            const attData = await resAtt.json();
            setAttendance(attData.records);
            setAttendanceTime(attData.created_at);
            status = attData.records?.length > 0 ? "done" : "no_attendance";
            records = attData.records || [];
          }
        } catch {
          status = "error";
        }

        return { ...group, todayStatus: status, todayRecords: records, days: group.days.toUpperCase() };
      }));

      setGroups(groupsWithStatus);
    } catch {
      toast.error("Guruhlarni yuklashda xatolik", { position: "top-right", autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // Fetch students for selected group
  const fetchStudents = async (groupId) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/get_one_group_students?group_id=${groupId}`
      );
      if (!res.ok) throw new Error("O'quvchilarni yuklashda xatolik");
      const data = await res.json();

      const studentsArray = Array.isArray(data) ? data : [];
      setStudents(studentsArray);

      const initialAttendance = {};
      studentsArray.forEach(student => {
        if (student.id) initialAttendance[student.id] = {};
      });
      setAttendance(initialAttendance);
    } catch {
      toast.error("O'quvchilarni yuklashda xatolik", { position: "top-right", autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance
  const fetchAttendance = async (groupId, date) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/get_attendance_by_date/${groupId}?date=${formatDate(date)}`
      );

      if (res.status === 404) {
        toast.info(`${formatDateWithDaysStart(date)} yilda davomat qilinmagan!`, { position: "top-right", autoClose: 3000 });
        setAttendance({});
        return;
      }

      if (!res.ok) {
        let errMsg = "Davomatni yuklashda xatolik";
        try {
          const errData = await res.json();
          if (errData?.message) errMsg = errData.message;
        } catch { }
        throw new Error(errMsg);
      }

      const data = await res.json();
      const attendanceMap = data.records?.reduce((acc, record) => {
        acc[record.student_id] = record;
        return acc;
      }, {}) || {};

      setAttendance(attendanceMap);
      setAttendanceTime(data.created_at);
    } catch (error) {
      toast.error(error.message || "Davomatni yuklashda xatolik", { position: "top-right", autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // Fetch teacher
  const fetchTeacher = async (teacher_id) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/get_one_teacher/${teacher_id}`
      );
      if (!res.ok) throw new Error("Ustozni yuklashda xatolik");
      const data = await res.json();
      setTeacher(data);
    } catch {
      toast.error("Ustozni yuklashda xatolik", { position: "top-right", autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // Handle group selection
  const handleGroupSelect = async (group) => {
    setSelectedGroup(group);
    await fetchStudents(group.id);
    await fetchAttendance(group.id, selectedDate);
    await fetchTeacher(group.teacher_id);
  };

  // Calendar component
  const GroupCalendar = ({ group, onSelectDate, selectedDate }) => {
    if (!group) return null;

    const classDays = normalizeDaysString(group.days).map(d => uzWeekdays.indexOf(d.toLowerCase()));

    const filterDate = (date) => classDays.includes(date.getDay());

    const dayClassName = (date) => {
      return classDays.includes(date.getDay())
        ? "highlight-class-day"
        : undefined;
    };

    return (
      <motion.div
        className="absolute top-full right-0 z-20 bg-white shadow-2xl rounded-lg p-4 border border-gray-200"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <CalendarEl
          selected={selectedDate}
          onChange={(date) => {
            onSelectDate(date);
            setShowCalendar(false);
          }}
          minDate={new Date("2025-01-01")}
          maxDate={new Date()}
          filterDate={filterDate}
          dayClassName={dayClassName}
          inline
          locale="uz"
          dateFormat="dd/MM/yyyy"
          calendarClassName="custom-calendar"
        />
      </motion.div>
    );
  };

  // Attendance data for progress bar
  const attendanceData = Object.keys(attendance)
    .map(studentId => attendance[studentId])
    .filter(record => record && record.status)
    .reduce((acc, record) => {
      const date = record.date || formatDate(new Date());
      let item = acc.find(a => a.date === date);
      if (!item) {
        item = { date, present: 0, absent: 0 };
        acc.push(item);
      }
      if (record.status === "present") item.present++;
      else if (record.status === "absent") item.absent++;
      return acc;
    }, []);

  useEffect(() => {
    fetchGroups();
  }, []);

  if (loading && groups.length === 0) return <LottieLoading />;

  return (
    <div className="min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mb-8 flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-800">
          <Calendar className="text-blue-600" size={28} /> Davomat tizimi
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Groups List */}
        <motion.div
          className="col-span-1 bg-white rounded-2xl shadow-lg p-6 max-h-[80vh] overflow-y-auto"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Guruhlar</h2>
          <AnimatePresence>
            {groups.map(group => {
              const todayClass = isClassOnDate(group, new Date());
              let statusEl, statusClass;

              if (!todayClass) {
                statusEl = "Bugun dars yo‘q";
                statusClass = "bg-gray-100 text-gray-500";
              } else if (group.todayStatus === "loading") {
                statusEl = "Yuklanmoqda...";
                statusClass = "bg-gray-100 text-gray-400";
              } else if (group.todayStatus === "done") {
                statusEl = "Davomat qilingan";
                statusClass = "bg-green-100 text-green-700";
              } else if (group.todayStatus === "no_attendance") {
                const now = new Date();
                console.log(group.start_time, group.end_time);
                const [sh, sm] = group.start_time.split(":").map(Number);
                const [eh, em] = group.end_time.split(":").map(Number);
                const start = new Date(now);
                start.setHours(sh, sm, 0, 0);
              
                const end = new Date(now);
                end.setHours(eh, em, 0, 0);

                console.log(now, start, end);
                if (now < start) {
                  statusEl = `Dars ${group.start_time.slice(0, 5)} da boshlanadi`;
                  statusClass = "bg-yellow-100 text-yellow-700";
                } else if (now >= start && now <= end) {
                  statusEl = "Dars davom etmoqda";
                  statusClass = "bg-blue-100 text-blue-700";
                } else {
                  statusEl = "Dars tugagan, davomat qilinmagan";
                  statusClass = "bg-red-100 text-red-700";
                }
              }

              return (
                <motion.div
                  key={group.id}
                  className="mb-4 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="flex cursor-pointer items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                    onClick={() => handleGroupSelect(group)}
                  >
                    <span className="font-semibold text-gray-800 text-lg">{group.group_subject}</span>
                    <span className={`inline-flex items-end rounded-full px-3 py-1 text-sm font-medium ${statusClass}`}>
                      {statusEl}
                    </span>
                  </div>
                  <div className="px-4 py-3 bg-gray-50">
                    <p className="text-gray-700 text-sm mb-2">
                      <span className="font-semibold">Dars kunlari: </span>
                      <span className="font-medium">{formatDaysForDisplay(group.days) || "Belgilanmagan"}</span>
                    </p>
                    <p className="text-gray-700 text-sm">
                      <span className="font-semibold">Dars vaqti: </span>
                      <span className="font-medium">{group.start_time.slice(0, 5)} - {group.end_time.slice(0, 5)}</span>
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Selected Group Details */}
        <motion.div
          className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {selectedGroup ? (
            <>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">{selectedGroup.group_subject}</h2>
                <div className="relative">
                  <motion.button
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    onClick={() => setShowCalendar(!showCalendar)}
                  >
                    <Calendar size={18} />
                    Boshqa kunni tanlash
                  </motion.button>
                  <AnimatePresence>
                    {showCalendar && (
                      <GroupCalendar
                        group={selectedGroup}
                        selectedDate={selectedDate}
                        onSelectDate={(date) => {
                          setSelectedDate(date);
                          fetchAttendance(selectedGroup.id, date);
                        }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Group Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-blue-600">Sana</h3>
                  <p className="text-lg font-medium text-gray-800">{formatDateWithDaysStart(selectedDate)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-blue-600">Ustoz</h3>
                  <p className="text-lg font-medium text-gray-800">{teacher?.first_name} {teacher?.last_name}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-blue-600">O‘quvchilar soni</h3>
                  <p className="text-lg font-medium text-gray-800">{students.length ? `${students.length} nafar` : "0"}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-blue-600">Davomat</h3>
                  <p className="text-lg font-medium text-gray-800">
                    Bor: {Object.values(attendance).filter(att => att && att.status === "present").length} /
                    Yo‘q: {Object.values(attendance).filter(att => att && att.status === "absent").length}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-blue-600">Sabablar</h3>
                  <p className="text-lg font-medium text-gray-800">
                    Sababli: {Object.values(attendance).filter(att => att && att.status === "absent" && att.reason === "excused").length} /
                    Sababsiz: {Object.values(attendance).filter(att => att && att.status === "absent" && att.reason === "unexcused").length}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-blue-600">Yo‘qlama vaqti</h3>
                  <p className="text-lg font-medium text-gray-800">
                    {attendanceTime ? `Bugun ${formatStartTime(attendanceTime)} da` : "Yo‘qlama qilinmagan"}
                  </p>
                </div>
              </div>

              {/* Attendance Table */}
              {students.length > 0 && Object.keys(attendance).length > 0 ? (
                <div className="overflow-x-auto mt-6">
                  <div className="space-y-4 mb-6">
                    {attendanceData.map((day, idx) => {
                      const total = day.present + day.absent;
                      const percent = total > 0 ? Math.round((day.present / total) * 100) : 0;

                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between text-sm font-medium text-gray-700">
                            <span>Davomat foizi</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-blue-600"
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <table className="w-full border-collapse text-sm rounded-lg overflow-hidden shadow-sm">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="p-3 text-left font-semibold">#</th>
                        <th className="p-3 text-left font-semibold">O‘quvchi</th>
                        <th className="p-3 text-center font-semibold">Holat</th>
                        <th className="p-3 text-center font-semibold">Sabab</th>
                        <th className="p-3 text-center font-semibold">Izoh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => {
                        const attRecord = attendance[student.id];
                        const isPresent = attRecord?.status === "present";

                        return (
                          <motion.tr
                            key={student.id}
                            className="border-b hover:bg-gray-50 transition-colors"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <td className="p-3">{index + 1}</td>
                            <td className="p-3 font-medium text-gray-800">{student.first_name} {student.last_name}</td>
                            <td className="p-3 text-center">
                              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${isPresent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {isPresent ? <Check size={16} /> : <X size={16} />}
                                {isPresent ? "Bor" : "Yo‘q"}
                              </span>
                            </td>
                            <td className="p-3 text-center text-gray-600">
                              {attRecord?.reason ? (attRecord.reason === "excused" ? "Sababli" : "Sababsiz") : "-"}
                            </td>
                            <td className="p-3 text-center text-gray-600">
                              {attRecord?.note || "-"}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500 font-medium text-lg">
                  {isClassOnDate(selectedGroup, selectedDate)
                    ? "Davomat qilinmagan"
                    : "Bu kuni dars yo‘q"}
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-gray-500 font-medium text-lg">Iltimos, guruhni tanlang</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}