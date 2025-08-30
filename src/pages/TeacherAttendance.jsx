"use client";

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LottieLoading from "../components/Loading";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, CheckCircle2, XCircle, Save, Clock, Book, Users, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

function TeacherAttendance() {
  const { groupId } = useParams();
  const [group, setGroup] = useState({});
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [history, setHistory] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [classDays, setClassDays] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedStudent, setExpandedStudent] = useState(null);

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
          initialAttendance[s.id] = { present: true, reason: null, note: "" };
        }
      });
      setAttendance(initialAttendance);
    }
  }, [students, history]);

  useEffect(() => {
    if (history && history.length > 0) {
      const initial = {};
      history.forEach((item) => {
        initial[item.student_id] = {
          present: item.status === "present",
          reason: item.reason,
          note: item.note || "",
        };
      });
      setAttendance(initial);
    }
  }, [history]);

  const toggleAttendance = (student_id) => {
    setAttendance((prev) => {
      const current = prev[student_id] || { present: true, reason: null, note: "" };
      
      // Agar yo'q qilinsa, sababni avtomatik ravishda "sababsiz" qilib qo'yamiz
      if (current.present) {
        return {
          ...prev,
          [student_id]: {
            ...current,
            present: false,
            reason: "unexcused",
            note: ""
          },
        };
      } else {
        // Agar bor qilinsa, sabab va izohni tozalaymiz
        return {
          ...prev,
          [student_id]: {
            ...current,
            present: true,
            reason: null,
            note: ""
          },
        };
      }
    });
    
    // Agar yo'q qilinsa, qatorni kengaytiramiz
    if (attendance[student_id]?.present) {
      setExpandedStudent(student_id);
    } else {
      setExpandedStudent(null);
    }
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
        setAttendance({});
        setExpandedStudent(null);
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

  const updateAttendance = async () => {
    try {
      const date = selectedDate.toISOString().slice(0, 10);

      const records = history.map((item) => ({
        student_id: item.student_id,
        status: attendance[item.student_id]?.present
          ? "present"
          : "absent",
        reason: attendance[item.student_id]?.present
          ? null
          : attendance[item.student_id]?.reason || "unexcused",
        note: attendance[item.student_id]?.present
          ? null
          : attendance[item.student_id]?.note || null,
      }));

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/update_attendance/${groupId}?date=${date}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, records }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        toast.success("Davomat yangilandi!", {
          position: "top-right",
          autoClose: 2000,
        });
        setExpandedStudent(null);
        checkClassDateAndFetchAttendance();
      } else {
        toast.error(data.message || "Xatolik yuz berdi", {
          position: "top-right",
          autoClose: 2000,
        });
      }
    } catch (err) {
      console.error("Error updating attendance:", err);
      toast.error("Serverga ulanishda xatolik", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const filteredStudents = () => {
    if (!history) return students;

    let filtered = history;
    if (filterStatus !== "all") {
      filtered = history.filter(record => record.status === filterStatus);
    }
    return filtered;
  };

  if (loading) return <LottieLoading />;

  return (
    <>
      <style>{`
          .highlight-class-day {
            background-color: #e6f7ff;
            color: #1890ff;
            border-radius: 50%;
            font-weight: 600;
          }
          .react-datepicker__day--selected {
            background-color: #1890ff !important;
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
            border-radius: 50%;
            transition: all 0.2s;
          }
          .react-datepicker__day:hover {
            background-color: #f0f0f0;
          }
          .status-present {
            background-color: #f6ffed;
            border: 1px solid #b7eb8f;
            color: #52c41a;
          }
          .status-absent {
            background-color: #fff2f0;
            border: 1px solid #ffccc7;
            color: #ff4d4f;
          }
          .status-excused {
            background-color: #f9f0ff;
            border: 1px solid #d3adf7;
            color: #722ed1;
          }
        `}</style>
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <ToastContainer />

        {/* Sarlavha qismi */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Davomatni boshqarish</h1>
          <p className="text-gray-600">Guruh davomatini kiritish va monitoring qilish</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asosiy ma'lumotlar paneli */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Book className="w-5 h-5 text-blue-600" />
                Guruh ma'lumotlari
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Guruh nomi</p>
                  <p className="text-lg font-medium text-gray-800">{group.group_subject || "Noma'lum"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Dars kunlari</p>
                  <p className="text-lg font-medium text-gray-800 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    {group.days || "Noma'lum"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Dars vaqti</p>
                  <p className="text-lg font-medium text-gray-800 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    {group.start_time?.slice(0, 5) || "Noma'lum"} - {group.end_time?.slice(0, 5) || "Noma'lum"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">O'quvchilar soni</p>
                  <p className="text-lg font-medium text-gray-800 flex items-center gap-1">
                    <Users className="w-4 h-4 text-blue-600" />
                    {students.length} ta
                  </p>
                </div>
              </div>
            </div>

            {/* Sana tanlash paneli */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Sana tanlash</h2>

              <div className="mb-4">
                <DatePicker
                  selected={selectedDate}
                  minDate={new Date("2025-08-22")}
                  maxDate={new Date()}
                  onChange={(date) => setSelectedDate(date)}
                  dateFormat="dd.MM.yyyy"
                  className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  dayClassName={highlightClassDays}
                  placeholderText="Sana tanlang"
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-center text-lg font-semibold text-blue-800">
                  {new Date(selectedDate).getDate()}-{monthsInUzbek[new Date(selectedDate).getMonth()]}, {new Date(selectedDate).getFullYear()}-yil
                </p>
                <p className="text-center text-blue-600 capitalize">
                  {daysInUzbek[new Date(selectedDate).getDay()]}
                </p>
              </div>
            </div>
          </div>

          {/* O'quvchilar ro'yxati */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Jadval sarlavhasi */}
              <div className="border-b p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  O'quvchilar ro'yxati
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {students.length} ta
                  </span>
                </h2>

                {history && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Filtr {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                )}
              </div>

              {/* Filtrlar */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-3 bg-gray-50 border-b flex flex-wrap gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Holati:</span>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="text-sm border rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="all">Barchasi</option>
                        <option value="present">Bor</option>
                        <option value="absent">Yo'q</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Jadval */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm">
                      <th className="py-3 px-4 text-left font-medium">#</th>
                      <th className="py-3 px-4 text-left font-medium">O'quvchi ismi</th>
                      <th className="py-3 px-4 text-center font-medium">Holati</th>
                      <th className="py-3 px-4 text-center font-medium">Sabab</th>
                      <th className="py-3 px-4 text-center font-medium">Izoh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStudents().length > 0 ? (
                      filteredStudents().map((item, idx) => {
                        const student_id = history ? item.student_id : item.id;
                        const studentData = attendance[student_id] || { present: true, reason: null, note: "" };
                        const isExpanded = expandedStudent === student_id;

                        return (
                          <>
                            <tr key={student_id} className="hover:bg-gray-50 transition">
                              <td className="py-3 px-4">{idx + 1}</td>

                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-medium text-gray-800">
                                    {history
                                      ? `${item.student?.first_name} ${item.student?.last_name}`
                                      : `${item.first_name} ${item.last_name}`}
                                  </p>
                                </div>
                              </td>

                              <td className="py-3 px-4 text-center">
                                <div className="flex justify-center gap-1">
                                  <button
                                    onClick={() => toggleAttendance(student_id)}
                                    className={`p-1 ${studentData.present ? "text-green-600" : "text-gray-400"} hover:scale-110 transition`}
                                  >
                                    <CheckCircle2 className="w-6 h-6" />
                                  </button>
                                  <button
                                    onClick={() => toggleAttendance(student_id)}
                                    className={`p-1 ${studentData.present === false ? "text-red-600" : "text-gray-400"} hover:scale-110 transition`}
                                  >
                                    <XCircle className="w-6 h-6" />
                                  </button>
                                </div>
                              </td>

                              <td className="py-3 px-4 text-center">
                                {history ? (
                                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.reason === "excused" ? "status-excused" : ""}`}>
                                    {item.reason === "excused"
                                      ? "Sababli"
                                      : item.reason === "unexcused"
                                        ? "Sababsiz"
                                        : "-"}
                                  </span>
                                ) : (
                                  <AnimatePresence>
                                    {studentData.present === false && (
                                      <motion.div
                                        key={`reason-${student_id}`}
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.2 }}
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
                                          className="border rounded-md py-1 px-2 text-sm focus:ring-1 focus:ring-blue-500"
                                        >
                                          <option value="excused">Sababli</option>
                                          <option value="unexcused">Sababsiz</option>
                                        </select>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                )}
                              </td>

                              <td className="py-3 px-4 text-center">
                                {history ? (
                                  <span className="text-sm">{item.note || "-"}</span>
                                ) : (
                                  <AnimatePresence>
                                    {studentData.present === false &&
                                      studentData.reason === "excused" && (
                                        <motion.input
                                          key={`note-${student_id}`}
                                          initial={{ opacity: 0, y: -5 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -5 }}
                                          transition={{ duration: 0.2 }}
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
                                          className="border rounded-md py-1 px-2 text-sm w-full max-w-xs focus:ring-1 focus:ring-blue-500"
                                          placeholder="Sababini yozing..."
                                        />
                                      )}
                                  </AnimatePresence>
                                )}
                              </td>
                            </tr>
                            
                            {/* Kengaytirilgan qator - sabab va izoh uchun */}
                            {isExpanded && (
                              <tr className="bg-blue-50">
                                <td colSpan="5" className="px-4 py-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sabab
                                      </label>
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
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      >
                                        <option value="unexcused">Sababsiz</option>
                                        <option value="excused">Sababli</option>
                                      </select>
                                    </div>
                                    
                                    {studentData.reason === "excused" && (
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Sabab tafsilotlari
                                        </label>
                                        <input
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
                                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="Sababini yozing..."
                                        />
                                      </div>
                                    )}
                                    
                                    <div className="md:col-span-2 flex justify-end">
                                      <button
                                        onClick={() => setExpandedStudent(null)}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                      >
                                        Yopish
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-gray-500">
                          <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                          <p>O'quvchilar topilmadi</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Saqlash tugmasi */}
              {students.length > 0 && classDays.includes(selectedDate.getDay()) && (
                <div className="border-t p-4 bg-gray-50 flex gap-3">
                  {!history ? (
                    <button
                      onClick={saveAttendance}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition shadow-md hover:shadow-lg"
                    >
                      <Save className="w-5 h-5" />
                      Davomatni saqlash
                    </button>
                  ) : (
                    <button
                      onClick={updateAttendance}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition shadow-md hover:shadow-lg"
                    >
                      <Save className="w-5 h-5" />
                      Davomatni yangilash
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Yo'riqnoma */}
            {!history && (
              <div className="mt-4 bg-blue-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-800 mb-1">Yo'riqnoma</p>
                    <p className="text-sm text-blue-700">
                      O'quvchini yo'q deb belgilaganingizda, avtomatik ravishda "Sababsiz" tanlanadi. 
                      Agar sababli bo'lsa, "Sababli" ni tanlang va sababini yozing.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default TeacherAttendance;