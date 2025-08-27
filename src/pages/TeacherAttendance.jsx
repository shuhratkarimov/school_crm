"use client";

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LottieLoading from "../components/Loading";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, CheckCircle2, XCircle, Save, Clock, Book } from "lucide-react";

function TeacherAttendance() {
  const { groupId } = useParams();
  const [group, setGroup] = useState({});
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [history, setHistory] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [classDays, setClassDays] = useState([]);

  const monthsInUzbek = {
    0: "yanvar",
    1: "fevral",
    2: "mart",
    3: "aprel",
    4: "may",
    5: "iyun",
    6: "iyul",
    7: "avgust",
    8: "sentyabr",
    9: "oktyabr",
    10: "noyabr",
    11: "dekabr",
  };

  const daysInUzbek = {
    0: "yakshanba",
    1: "dushanba",
    2: "seshanba",
    3: "chorshanba",
    4: "payshanba",
    5: "juma",
    6: "shanba",
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchGroup(), fetchStudents()]);
      if (group.days && students.length > 0) {
        checkClassDateAndFetchAttendance();
      }
    };
    fetchData();
  }, [groupId]);

  useEffect(() => {
    if (group.days) {
      const daysMap = {
        dushanba: 1,
        seshanba: 2,
        chorshanba: 3,
        payshanba: 4,
        juma: 5,
        shanba: 6,
        yakshanba: 0,
      };
      const classDaysArray = group.days
        .toLowerCase()
        .split("-")
        .map((day) => daysMap[day.trim()])
        .filter((day) => day !== undefined);
      setClassDays(classDaysArray);
      console.log("Class days updated:", classDaysArray);
    }
  }, [group]);

  useEffect(() => {
    if (groupId && classDays.length > 0 && students.length > 0) {
      setAttendance({});
      setHistory(null);
      checkClassDateAndFetchAttendance();
    }
  }, [groupId, selectedDate, classDays, students]);

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/get_one_group/${groupId}`);
      const data = await res.json();
      if (!data.group) throw new Error("Guruh topilmadi");
      setGroup(data.group);
      console.log("Group fetched:", data.group);
    } catch (err) {
      console.error("Error fetching group:", err);
      toast.error("Guruh olinmadi", { position: "top-right", autoClose: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/get_one_group_students?group_id=${groupId}`
      );
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("O'quvchilar ro'yxati noto'g'ri");
      const filteredStudents = data.filter((s) => s.id);
      setStudents(filteredStudents);
      console.log("Students fetched:", filteredStudents);
    } catch (err) {
      console.error("Error fetching students:", err);
      toast.error("O'quvchilar olinmadi", { position: "top-right", autoClose: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const checkClassDateAndFetchAttendance = async () => {
    try {
      setLoading(true);
      const date = selectedDate.toISOString().slice(0, 10);
      if (date > new Date().toISOString().slice(0, 10)) {
        toast.error("Ushbu sana hali mavjud emas!", { position: "top-right", autoClose: 2000 });
        setHistory(null);
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/get_attendance_by_date/${groupId}?date=${date}`
      );
      const data = await res.json();
      console.log("Attendance data fetched:", JSON.stringify(data, null, 2));

      if (data.records && Array.isArray(data.records) && data.records.length > 0) {
        setHistory(data.records);
        toast.success("Davomat muvaffaqiyatli yuklandi", { position: "top-right", autoClose: 2000 });
        return;
      }

      const dayOfWeek = selectedDate.getDay();
      if (!classDays.includes(dayOfWeek)) {
        toast.error("Bu kuni dars mavjud emas!", { position: "top-right", autoClose: 2000 });
        setHistory(null);
        return;
      }

      setHistory(null);
      toast.info("Ushbu sana uchun davomat qilinmagan!", { position: "top-right", autoClose: 2000 });
    } catch (err) {
      console.error("Error fetching attendance:", err);
      toast.error("Davomatni yuklashda xatolik", { position: "top-right", autoClose: 2000 });
      setHistory(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (students.length > 0 && !history) {
      const initialAttendance = {};
      students.forEach((s) => {
        if (s.id) {
          initialAttendance[s.id] = { present: null, reason: null, note: "" };
        }
      });
      setAttendance(initialAttendance);
      console.log("Initial attendance set (no defaults):", initialAttendance);
    }
  }, [students, history]);

  const toggleAttendance = (student_id) => {
    setAttendance((prev) => {
      const current = prev[student_id] || { present: true, reason: null, note: "" };
      return {
        ...prev,
        [student_id]: {
          present: !current.present,
          reason: current.present ? "unexcused" : null,
          note: current.present ? "" : current.note,
        },
      };
    });
  };

  const saveAttendance = async () => {
    try {
      const date = selectedDate.toISOString().slice(0, 10);
      if (date > new Date().toISOString().slice(0, 10)) {
        toast.error("Ushbu sana hali mavjud emas!", { position: "top-right", autoClose: 2000 });
        return;
      }

      const dayOfWeek = selectedDate.getDay();
      if (!classDays.includes(dayOfWeek)) {
        toast.error("Bu kunda dars mavjud emas!", { position: "top-right", autoClose: 2000 });
        return;
      }

      const checkRes = await fetch(
        `${import.meta.env.VITE_API_URL}/get_attendance_by_date/${groupId}?date=${date}`
      );
      const checkData = await checkRes.json();
      if (checkData.records && Array.isArray(checkData.records) && checkData.records.length > 0) {
        toast.error("Ushbu sana uchun davomat allaqachon mavjud!", { position: "top-right", autoClose: 2000 });
        return;
      }

      const records = Object.entries(attendance)
        .filter(([student_id]) => student_id && student_id !== "null")
        .map(([student_id, data]) => ({
          student_id,
          status: data.present ? "present" : "absent",
          reason: data.present ? null : data.reason || "unexcused",
          note: data.present ? null : data.note || null,
        }));

      if (records.length === 0) {
        toast.error("Davomat uchun hech qanday yozuv topilmadi!", { position: "top-right", autoClose: 2000 });
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/make_attendance/${groupId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, records }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("Davomat saqlandi!", { position: "top-right", autoClose: 2000 });
        setAttendance({}); // Clear attendance state after saving
        checkClassDateAndFetchAttendance();
      } else {
        toast.error(data.message || "Xatolik yuz berdi", { position: "top-right", autoClose: 2000 });
      }
    } catch (err) {
      console.error("Error saving attendance:", err);
      toast.error("Serverga ulanishda xatolik", { position: "top-right", autoClose: 2000 });
    }
  };

  const highlightClassDays = (date) => {
    const dayOfWeek = date.getDay();
    return classDays.includes(dayOfWeek) ? "highlight-class-day" : "";
  };

  if (loading) return <LottieLoading />;

  return (
    <>
      <style>{`
        .highlight-class-day {
          background-color: #ffe6e6;
          color: #333;
          border-radius: 50%;
        }
        .react-datepicker__day--selected {
          background-color: #ff4d4d !important;
          color: white !important;
        }
        .react-datepicker__day {
          padding: 4px;
          margin: 2px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
        }
      `}</style>
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <ToastContainer />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#104292]" />
            <DatePicker
              selected={selectedDate}
              minDate={new Date("2025-08-22")}
              maxDate={new Date()}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="dd.MM.yyyy"
              className="border rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-500"
              dayClassName={highlightClassDays}
            />
          </div>
        </div>
        <div className="mb-6 overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-2 flex items-center gap-2">
                  <Book className="w-5 h-5 text-[#104292]" />
                  <span className="text-gray-700 font-medium">Guruh nomi:</span>
                </td>
                <td className="px-4 py-2 text-lg font-semibold text-gray-800">
                  {group.group_subject || "Noma'lum"}
                </td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#104292]" />
                  <span className="text-gray-700 font-medium">Dars kunlari:</span>
                </td>
                <td className="px-4 py-2 text-lg font-semibold text-gray-800">
                  {group.days || "Noma'lum"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#104292]" />
                  <span className="text-gray-700 font-medium">Dars vaqti:</span>
                </td>
                <td className="px-4 py-2 text-lg font-semibold text-gray-800">
                  {group.start_time?.slice(0, 5) || "Noma'lum"} - {group.end_time?.slice(0, 5) || "Noma'lum"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mb-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {new Date(selectedDate).getDate()}-{monthsInUzbek[new Date(selectedDate).getMonth()]} {new Date(selectedDate).getFullYear()}-yil ({daysInUzbek[new Date(selectedDate).getDay()].toUpperCase()})
          </h2>
        </div>
        <div className="overflow-x-auto shadow-md rounded-lg bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#104292] text-white text-sm sm:text-base">
                <th className="py-2 px-2 text-left">#</th>
                <th className="py-2 px-2 text-left">O‘quvchi ismi</th>
                <th className="py-2 px-2 text-center">Bor/Yo‘q</th>
                <th className="py-2 px-2 text-center">Sabab</th>
                <th className="py-2 px-2 text-center">Izoh</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(history && history.length > 0 ? history : students) &&
                (history?.length > 0 || students?.length > 0) ? (
                (history && history.length > 0 ? history : students).map((item, idx) => {
                  const student_id = history ? item.student_id : item.id;
                  const studentData = attendance[student_id] || { present: null, reason: null, note: "" };

                  return (
                    <tr
                      key={student_id}
                      className="border-b hover:bg-gray-50 transition text-sm sm:text-base"
                    >
                      {/* T/r */}
                      <td className="px-3 py-2">{idx + 1}</td>

                      {/* F.I.O */}
                      <td className="px-3 py-2">
                        {history
                          ? `${item.student?.first_name} ${item.student?.last_name}`
                          : `${item.first_name} ${item.last_name}`}
                      </td>

                      {/* Bor/Yo‘q */}
                      <td className="px-3 py-2 text-center">
                        {history ? (
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${item.status === "present"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                              }`}
                          >
                            {item.status === "present" ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            {item.status === "present" ? "Bor" : "Yo‘q"}
                          </span>
                        ) : studentData.present === null ? (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() =>
                                setAttendance((prev) => ({
                                  ...prev,
                                  [student_id]: { present: true, reason: null, note: "" },
                                }))
                              }
                              className="p-1 rounded-full text-gray-400 hover:scale-110 transition"
                            >
                              <CheckCircle2 className="w-6 h-6" />
                            </button>
                            <button
                              onClick={() =>
                                setAttendance((prev) => ({
                                  ...prev,
                                  [student_id]: {
                                    present: false,
                                    reason: "unexcused",
                                    note: "",
                                  },
                                }))
                              }
                              className="p-1 rounded-full text-gray-400 hover:scale-110 transition"
                            >
                              <XCircle className="w-6 h-6" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => toggleAttendance(student_id)}
                              className={`p-1 rounded-full ${studentData.present
                                  ? "bg-green-100 text-green-600"
                                  : "text-gray-400"
                                } hover:scale-110 transition`}
                            >
                              <CheckCircle2 className="w-6 h-6" />
                            </button>
                            <button
                              onClick={() => toggleAttendance(student_id)}
                              className={`p-1 rounded-full ${studentData.present === false
                                  ? "bg-red-100 text-red-600"
                                  : "text-gray-400"
                                } hover:scale-110 transition`}
                            >
                              <XCircle className="w-6 h-6" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Sabab */}
                      <td className="py-2 text-center">
                        {history ? (
                          item.reason === "excused"
                            ? "Sababli"
                            : item.reason === "unexcused"
                              ? "Sababsiz"
                              : "-"
                        ) : (
                          <AnimatePresence>
                            {studentData.present === false && (
                              <motion.div
                                key={`reason-${student_id}`}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.25 }}
                              >
                                <select
                                  value={studentData.reason || "unexcused"}
                                  onChange={(e) =>
                                    setAttendance((prev) => ({
                                      ...prev,
                                      [student_id]: {
                                        ...prev[student_id],
                                        reason: e.target.value,
                                      },
                                    }))
                                  }
                                  className="border rounded py-1 text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="excused">Sababli</option>
                                  <option value="unexcused">Sababsiz</option>
                                </select>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        )}
                      </td>

                      {/* Izoh */}
                      <td className="px-3 py-2 text-center">
                        {history ? (
                          item.note || "-"
                        ) : (
                          <AnimatePresence>
                            {studentData.present === false &&
                              studentData.reason === "excused" && (
                                <motion.input
                                  key={`note-${student_id}`}
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                  transition={{ duration: 0.25 }}
                                  type="text"
                                  value={studentData.note || ""}
                                  onChange={(e) =>
                                    setAttendance((prev) => ({
                                      ...prev,
                                      [student_id]: {
                                        ...prev[student_id],
                                        note: e.target.value,
                                      },
                                    }))
                                  }
                                  className="border rounded py-1 w-full sm:w-40 text-sm focus:ring-2 focus:ring-blue-500"
                                  placeholder="Sabab yozing..."
                                />
                              )}
                          </AnimatePresence>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-6 text-gray-500 italic"
                  >
                    Bu guruhga hali o‘quvchilar biriktirilmagan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!history && students.length > 0 && classDays.includes(selectedDate.getDay()) && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={saveAttendance}
              className="flex items-center gap-2 bg-[#104292] text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Save className="w-5 h-5" />
              Davomatni saqlash
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default TeacherAttendance;