"use client";

import { useState, useEffect, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Save,
  Clock,
  Book,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  UserCheck,
  UserX,
  Info,
  ArrowLeft,
  Download,
  Printer
} from "lucide-react";
import LottieLoading from "../components/Loading";
import API_URL from "../conf/api";
import "react-datepicker/dist/react-datepicker.css";

function TeacherAttendance() {
  const navigate = useNavigate();
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
  const [stats, setStats] = useState({ present: 0, absent: 0, excused: 0 });
  const [saving, setSaving] = useState(false);
  const monthsInUzbek = {
    0: "yanvar", 1: "fevral", 2: "mart", 3: "aprel", 4: "may", 5: "iyun",
    6: "iyul", 7: "avgust", 8: "sentyabr", 9: "oktyabr", 10: "noyabr", 11: "dekabr",
  };

  const daysInUzbek = {
    0: "yakshanba", 1: "dushanba", 2: "seshanba", 3: "chorshanba",
    4: "payshanba", 5: "juma", 6: "shanba",
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchGroup(), fetchStudents()]);
    };
    fetchData();
  }, [groupId]);

  useEffect(() => {
    if (group.days) {
      const daysMap = {
        dushanba: 1, seshanba: 2, chorshanba: 3, payshanba: 4,
        juma: 5, shanba: 6, yakshanba: 0,
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

  useEffect(() => {
    // Calculate stats
    const present = Object.values(attendance).filter(a => a.present === true).length;
    const absent = Object.values(attendance).filter(a => a.present === false && a.reason !== "excused").length;
    const excused = Object.values(attendance).filter(a => a.present === false && a.reason === "excused").length;
    setStats({ present, absent, excused });
  }, [attendance]);

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/get_one_teacher_group/${groupId}`, {
        credentials: "include"
      });
      const data = await res.json();
      if (!data.group) throw new Error("Guruh topilmadi");
      setGroup(data.group);
    } catch (err) {
      toast.error("Guruh olinmadi");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/get_one_group_students_for_teacher?group_id=${groupId}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("O'quvchilar ro'yxati noto'g'ri");
      const filteredStudents = data.filter((s) => s.id);
      setStudents(filteredStudents);
    } catch (err) {
      toast.error("O'quvchilar olinmadi");
    } finally {
      setLoading(false);
    }
  };

  const checkClassDateAndFetchAttendance = async () => {
    try {
      setLoading(true);
      const date = selectedDate.toISOString().slice(0, 10);

      if (date > new Date().toISOString().slice(0, 10)) {
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-amber-500 text-white rounded-lg shadow-lg"
          >
            <AlertCircle className="w-5 h-5" />
            <span>Kelajak sanasi uchun davomat qilinmagan!</span>
          </motion.div>
        ));
        setHistory(null);
        return;
      }

      const res = await fetch(
        `${API_URL}/get_attendance_by_teacher/${groupId}?date=${date}`,
        { credentials: "include" }
      );
      const data = await res.json();

      if (data.records && Array.isArray(data.records) && data.records.length > 0) {
        setHistory(data.records);
        toast.success("Davomat muvaffaqiyatli yuklandi");
        return;
      }

      const dayOfWeek = selectedDate.getDay();
      if (!classDays.includes(dayOfWeek)) {
        toast.error("Bu kuni dars mavjud emas!");
        setHistory(null);
        return;
      }

      setHistory(null);
      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-amber-500 text-white rounded-lg shadow-lg"
        >
          <AlertCircle className="w-5 h-5" />
          <span>Ushbu sanada davomat qilinmagan!</span>
        </motion.div>
      ));
    } catch (err) {
      console.error("Error fetching attendance:", err);
      toast.error("Davomatni yuklashda xatolik");
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

  const setAttendanceStatus = (student_id, isPresent) => {
    setAttendance((prev) => {
      const current = prev[student_id] || { present: true, reason: null, note: "" };
      const next = {
        ...current,
        present: isPresent,
        reason: isPresent ? null : (current.reason || "unexcused"),
        note: isPresent ? "" : (current.note || ""),
      };
      return { ...prev, [student_id]: next };
    });

    if (isPresent) {
      setExpandedStudent(null);
    } else {
      setExpandedStudent(student_id);
    }
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      const date = selectedDate.toISOString().slice(0, 10);

      if (date > new Date().toISOString().slice(0, 10)) {
        toast.error("Kelajak sanasi uchun davomat qilinmagan!");
        return;
      }

      const dayOfWeek = selectedDate.getDay();
      if (!classDays.includes(dayOfWeek)) {
        toast.error("Ushbu kuni dars mavjud emas!");
        return;
      }

      const checkRes = await fetch(
        `${API_URL}/get_attendance_by_teacher/${groupId}?date=${date}`,
        { credentials: "include" }
      );
      const checkData = await checkRes.json();

      if (checkData.records && Array.isArray(checkData.records) && checkData.records.length > 0) {
        toast.error("Ushbu sanada davomat allaqachon qilingan!");
        setSaving(false);
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
        toast.error("Davomatni saqlash uchun o'quvchilarni belgilang!");
        return;
      }

      const res = await fetch(`${API_URL}/make_attendance/${groupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ date, records }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Davomat saqlandi!");
        setAttendance({});
        setExpandedStudent(null);
        checkClassDateAndFetchAttendance();
      } else {
        toast.error(data.message || "Xatolik yuz berdi");
      }
    } catch (err) {
      console.error("Error saving attendance:", err);
      toast.error(`Serverga ulanishda xatolik: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const updateAttendance = async () => {
    try {
      setSaving(true);
      const date = selectedDate.toISOString().slice(0, 10);

      const records = history.map((item) => ({
        student_id: item.student_id,
        status: attendance[item.student_id]?.present ? "present" : "absent",
        reason: attendance[item.student_id]?.present
          ? null
          : attendance[item.student_id]?.reason || "unexcused",
        note: attendance[item.student_id]?.present
          ? null
          : attendance[item.student_id]?.note || null,
      }));

      const res = await fetch(`${API_URL}/update_attendance/${groupId}?date=${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ date, records }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Davomat yangilandi!");
        setExpandedStudent(null);
        checkClassDateAndFetchAttendance();
      } else {
        toast.error(data.message || "Xatolik yuz berdi");
      }
    } catch (err) {
      console.error("Error updating attendance:", err);
      toast.error(`Serverga ulanishda xatolik: ${err}`);
    } finally {
      setSaving(false);
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

  const highlightClassDays = (date) => {
    const dayOfWeek = date.getDay();
    return classDays.includes(dayOfWeek) ? "highlight-class-day" : "";
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
      <div className="space-y-6">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/teacher/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Orqaga</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 mb-6 shadow-lg"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Book className="w-8 h-8" />
                {group.group_subject}
              </h1>
              <p className="opacity-90 mt-1 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {students.length} nafar o'quvchi
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">
                {selectedDate.getDate()}-{monthsInUzbek[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-green-100"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-xl">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Bor</p>
                <p className="text-xl font-bold text-green-600">{stats.present}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-red-100"
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-xl">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Yo'q (sababsiz)</p>
                <p className="text-xl font-bold text-red-600">{stats.absent}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-purple-100"
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-xl">
                <Info className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sababli</p>
                <p className="text-xl font-bold text-purple-600">{stats.excused}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Date Picker & Info */}
          <div className="lg:col-span-1 space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-5 shadow-sm"
            >
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Sana tanlash
              </h3>

              <DatePicker
                selected={selectedDate}
                minDate={new Date("2025-08-22")}
                maxDate={new Date()}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="dd.MM.yyyy"
                className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dayClassName={highlightClassDays}
                placeholderText="Sana tanlang"
                inline
              />

              <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                <p className="text-center text-sm text-indigo-800">
                  {daysInUzbek[selectedDate.getDay()]}, {selectedDate.getDate()} {monthsInUzbek[selectedDate.getMonth()]}
                </p>
                {classDays.includes(selectedDate.getDay()) ? (
                  <p className="text-center text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Dars kuni
                  </p>
                ) : (
                  <p className="text-center text-xs text-amber-600 mt-1 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Dars kuni emas
                  </p>
                )}
              </div>
            </motion.div>

            {/* Group Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-5 shadow-sm"
            >
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" />
                Guruh ma'lumotlari
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Dars kunlari</p>
                  <p className="font-medium text-gray-800">{group.days || "Noma'lum"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Dars vaqti</p>
                  <p className="font-medium text-gray-800">
                    {group.start_time?.slice(0, 5)} - {group.end_time?.slice(0, 5)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Xona</p>
                  <p className="font-medium text-gray-800">{group.room?.name || "Noma'lum"}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Students Table */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              {/* Table Header */}
              <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  O'quvchilar ro'yxati
                  <span className="bg-indigo-100 text-indigo-600 text-xs font-medium px-2 py-1 rounded-xl">
                    {students.length} nafar
                  </span>
                </h3>

                <div className="flex items-center gap-2">
                  {history && (
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      Filtr {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}

                  <button
                    onClick={() => window.print()}
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    title="Chop etish"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    title="Yuklab olish"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-3 bg-gray-50 border-b"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">Holati:</span>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="text-sm border rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="all">Barchasi</option>
                        <option value="present">Bor</option>
                        <option value="absent">Yo'q</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm">
                      <th className="py-3 px-4 text-left font-medium">#</th>
                      <th className="py-3 px-4 text-left font-medium">O'quvchi</th>
                      <th className="py-3 px-4 text-center font-medium">Holati</th>
                      <th className="py-3 px-4 text-center font-medium">Sabab</th>
                      <th className="py-3 px-4 text-center font-medium">Izoh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStudents().length > 0 ? (
                      filteredStudents().map((item, idx) => {
                        const student_id = history ? item.student_id : item.id;
                        const studentData = attendance[student_id] || { present: null, reason: null, note: null };
                        const isExpanded = expandedStudent === student_id;

                        return (
                          <Fragment key={student_id}>
                            <tr className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 text-sm text-gray-600">{idx + 1}</td>

                              <td className="py-3 px-4">
                                <div className="font-medium text-gray-800">
                                  {history
                                    ? `${item.student?.first_name} ${item.student?.last_name}`
                                    : `${item.first_name} ${item.last_name}`}
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex justify-center gap-2">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setAttendanceStatus(student_id, true)}
                                    className={`p-1.5 rounded-full transition-all ${studentData.present === true
                                      ? "bg-green-100 text-green-600"
                                      : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                                      }`}
                                  >
                                    <CheckCircle2 className="w-6 h-6" />
                                  </motion.button>

                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setAttendanceStatus(student_id, false)}
                                    className={`p-1.5 rounded-full transition-all ${studentData.present === false
                                      ? "bg-red-100 text-red-600"
                                      : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                                      }`}
                                  >
                                    <XCircle className="w-6 h-6" />
                                  </motion.button>
                                </div>
                              </td>

                              <td className="py-3 px-4 text-center">
                                {history ? (
                                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.reason === "excused"
                                    ? "status-excused"
                                    : item.reason === "unexcused"
                                      ? "status-absent"
                                      : "status-present"
                                    }`}>
                                    {item.reason === "excused"
                                      ? "Sababli"
                                      : item.reason === "unexcused"
                                        ? "Sababsiz"
                                        : "-"}
                                  </span>
                                ) : (
                                  studentData.present === false && (
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
                                      className="text-xs border rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500"
                                    >
                                      <option value="unexcused">Sababsiz</option>
                                      <option value="excused">Sababli</option>
                                    </select>
                                  )
                                )}
                              </td>

                              <td className="py-3 px-4 text-center">
                                {history ? (
                                  <span className="text-sm text-gray-600">{item.note || "-"}</span>
                                ) : (
                                  studentData.present === false && studentData.reason === "excused" && (
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
                                      className="w-full max-w-[150px] border rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500"
                                      placeholder="Sabab..."
                                    />
                                  )
                                )}
                              </td>
                            </tr>

                            {/* Expanded row for absent students */}
                            {isExpanded && !history && (
                              <tr className="bg-indigo-50">
                                <td colSpan="5" className="px-4 py-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sabab turi
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
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
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
                                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                          placeholder="Sababini yozing..."
                                        />
                                      </div>
                                    )}

                                    <div className="md:col-span-2 flex justify-end">
                                      <button
                                        onClick={() => setExpandedStudent(null)}
                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                      >
                                        Yopish
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-gray-500">
                          <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                          <p>O'quvchilar topilmadi</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {students.length > 0 && classDays.includes(selectedDate.getDay()) && (
                <div className="border-t p-4 bg-gray-50">
                  <motion.button
                    whileHover={{ scale: saving ? 1 : 1.02 }}
                    whileTap={{ scale: saving ? 1 : 0.98 }}
                    onClick={!history ? saveAttendance : updateAttendance}
                    disabled={saving}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 mx-auto min-w-[220px]
        ${saving
                        ? "bg-gradient-to-r from-indigo-400 to-purple-400 cursor-not-allowed opacity-80"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white"
                      } text-white`}
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {!history ? "Saqlanmoqda..." : "Yangilanmoqda..."}
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {!history ? "Davomatni saqlash" : "Davomatni yangilash"}
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </motion.div>

            {/* Guide */}
            {!history && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100"
              >
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-800 mb-1">Yo'riqnoma</p>
                    <p className="text-sm text-blue-700">
                      • Yashil tugma - o'quvchi darsga kelgan<br />
                      • Qizil tugma - o'quvchi kelmagan<br />
                      • Kelmagan o'quvchilar uchun sabab va izoh qoldirishingiz mumkin
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default TeacherAttendance;