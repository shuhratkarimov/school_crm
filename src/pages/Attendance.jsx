"use client";

import { useState, useEffect } from "react";
import { Trash2, Pen, BookOpen, Plus, X, Search, Check, Calendar } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CalendarEl from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import LottieLoading from "../components/Loading";
import { motion, AnimatePresence } from "framer-motion";
import { registerLocale } from "react-datepicker";
import uz from "date-fns/locale/uz";
import "../index.css";

registerLocale("uz", uz);

const uzWeekdays = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];
const monthsUZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
];

export default function Attendance() {
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState({
    groups: "",
    teachers: "",
    students: "",
    payments: "",
    rooms: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    group_subject: "",
    teacher_id: "",
    room_id: "",
    days: [],
    start_time: "",
    end_time: "",
    monthly_fee: "",
  });
  const [editFormData, setEditFormData] = useState({
    group_subject: "",
    teacher_id: "",
    room_id: "",
    days: [],
    start_time: "",
    end_time: "",
    monthly_fee: "",
  });
  const [addModal, setAddModal] = useState(false);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const [attendanceTime, setAttendanceTime] = useState(null);
  const [groupStudents, setGroupStudents] = useState([]); // New state for group students

  const daysOfWeek = [
    "DUSHANBA",
    "SESHANBA",
    "CHORSHANBA",
    "PAYSHANBA",
    "JUMA",
    "SHANBA",
    "YAKSHANBA",
  ];

  // Checkbox’lar uchun handler
  const handleDaysChange = (day, isEdit = false) => {
    if (isEdit) {
      const updatedDays = editFormData.days.includes(day)
        ? editFormData.days.filter((d) => d !== day)
        : [...editFormData.days, day].slice(0, 7);
      setEditFormData({ ...editFormData, days: updatedDays });
    } else {
      const updatedDays = formData.days.includes(day)
        ? formData.days.filter((d) => d !== day)
        : [...formData.days, day].slice(0, 7);
      setFormData({ ...formData, days: updatedDays });
    }
  };

  // Oylarni so‘z bilan olish
  const getMonthsInWord = (thisMonth) => {
    const months = {
      1: "YANVAR",
      2: "FEVRAL",
      3: "MART",
      4: "APREL",
      5: "MAY",
      6: "IYUN",
      7: "IYUL",
      8: "AVGUST",
      9: "SENTABR",
      10: "OKTABR",
      11: "NOYABR",
      12: "DEKABR",
    };
    return months[thisMonth] || "";
  };

  // Ma'lumotlarni olish
  const fetchData = async () => {
    try {
      setLoading(true);
      setErrors({ groups: "", teachers: "", students: "", payments: "", rooms: "" });

      const [
        groupsResponse,
        teachersResponse,
        studentsResponse,
        paymentsResponse,
        roomsResponse,
      ] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/get_groups`).catch(() => ({ ok: false })),
        fetch(`${import.meta.env.VITE_API_URL}/get_teachers`).catch(() => ({ ok: false })),
        fetch(`${import.meta.env.VITE_API_URL}/get_students`).catch(() => ({ ok: false })),
        fetch(`${import.meta.env.VITE_API_URL}/get_payments`).catch(() => ({ ok: false })),
        fetch(`${import.meta.env.VITE_API_URL}/get_rooms`).catch(() => ({ ok: false })),
      ]);

      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setGroups(
          groupsData.map((group) => ({
            ...group,
            days: group.days ? group.days.toUpperCase() : "",
          }))
        );
      } else {
        setGroups([]);
        setErrors((prev) => ({ ...prev, groups: "Guruhlar mavjud emas" }));
        toast.info("Guruhlar mavjud emas", {
          position: "top-right",
          autoClose: 3000,
        });
      }

      if (teachersResponse.ok) {
        setTeachers(await teachersResponse.json());
      } else {
        setTeachers([]);
        setErrors((prev) => ({ ...prev, teachers: "O'qituvchilar mavjud emas" }));
        toast.info("O'qituvchilar mavjud emas", {
          position: "top-right",
          autoClose: 3000,
        });
      }

      if (studentsResponse.ok) {
        setStudents(await studentsResponse.json());
      } else {
        setStudents([]);
        setErrors((prev) => ({ ...prev, students: "O'quvchilar mavjud emas" }));
        toast.info("O'quvchilar mavjud emas", {
          position: "top-right",
          autoClose: 3000,
        });
      }

      if (paymentsResponse.ok) {
        setPayments(await paymentsResponse.json());
      } else {
        setPayments([]);
        setErrors((prev) => ({ ...prev, payments: "To'lovlar mavjud emas" }));
        toast.info("To'lovlar mavjud emas", {
          position: "top-right",
          autoClose: 3000,
        });
      }

      if (roomsResponse.ok) {
        setRooms(await roomsResponse.json());
      } else {
        setRooms([]);
        setErrors((prev) => ({ ...prev, rooms: "Xonalar mavjud emas" }));
        toast.info("Xonalar mavjud emas", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      setGroups([]);
      setTeachers([]);
      setStudents([]);
      setPayments([]);
      setRooms([]);
      setErrors({
        groups: "Guruhlar mavjud emas",
        teachers: "O'qituvchilar mavjud emas",
        students: "O'quvchilar mavjud emas",
        payments: "To'lovlar mavjud emas",
        rooms: "Xonalar mavjud emas",
      });
      toast.warning("Ma'lumotlarni yuklashda umumiy xatolik yuz berdi", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Vaqt oralig‘ini solishtirish funksiyasi
  const isTimeOverlap = (start1, end1, start2, end2) => {
    const startTime1 = new Date(`1970-01-01T${start1}:00`);
    const endTime1 = new Date(`1970-01-01T${end1}:00`);
    const startTime2 = new Date(`1970-01-01T${start2}:00`);
    const endTime2 = new Date(`1970-01-01T${end2}:00`);

    return startTime1 < endTime2 && endTime1 > startTime2;
  };

  const checkScheduleConflict = (roomId, days, startTime, endTime, excludeGroupId = null) => {
    return groups?.some((group) => {
      if (group.room_id !== roomId || (excludeGroupId && group.id === excludeGroupId)) return false;

      const existingDays = group.days.split("-");
      const hasCommonDay = days?.some((day) => existingDays.includes(day));
      if (!hasCommonDay) return false;

      return isTimeOverlap(
        startTime,
        endTime,
        group.start_time.slice(0, 5),
        group.end_time.slice(0, 5)
      );
    });
  };

  // Guruh qo‘shish
  const addGroup = async (e) => {
    e.preventDefault();

    if (formData.days.length === 0) {
      toast.warning("Kamida bitta dars kuni tanlanishi kerak", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (formData.start_time >= formData.end_time) {
      toast.warning("Boshlanish vaqti tugash vaqtidan oldin bo‘lishi kerak", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (!formData.teacher_id || !formData.room_id) {
      toast.warning("O‘qituvchi va xona tanlanishi kerak", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // Vaqt mosligini tekshirish
    const hasConflict = checkScheduleConflict(
      formData.room_id,
      formData.days,
      formData.start_time,
      formData.end_time
    );

    if (hasConflict) {
      toast.warning(
        "Tanlangan xonada ushbu kunlar va vaqt oralig‘ida boshqa guruh mavjud. Iltimos, boshqa vaqt yoki xona tanlang.",
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
      return;
    }

    const groupData = {
      group_subject: formData.group_subject,
      teacher_id: formData.teacher_id,
      room_id: formData.room_id,
      days: formData.days.join("-"),
      start_time: `${formData.start_time}:00`,
      end_time: `${formData.end_time}:00`,
      monthly_fee: Number(formData.monthly_fee),
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/create_group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });

      if (response.ok) {
        const newGroup = await response.json();
        setGroups([...groups, newGroup.group]);
        setSuccess(`${formData.group_subject} guruhi muvaffaqiyatli qo'shildi`);
        toast.success(`${formData.group_subject} guruhi muvaffaqiyatli qo'shildi`, {
          position: "top-right",
          autoClose: 3000,
        });
        setFormData({
          group_subject: "",
          teacher_id: "",
          room_id: "",
          days: [],
          start_time: "",
          end_time: "",
          monthly_fee: "",
        });
        setAddModal(false);
        fetchGroups(); // Refresh groups with status
      } else {
        if (response.status === 400) {
          toast.warning("Tanlangan xonada ushbu kunlar va vaqt oralig‘ida boshqa guruh mavjud. Iltimos, boshqa vaqt yoki xona tanlang.", {
            position: "top-right",
            autoClose: 5000,
          });
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Guruh qo'shishda xatolik yuz berdi");
      }
    } catch (err) {
      toast.error(err.message || "Guruh qo'shishda xatolik: API mavjud emas", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Guruh yangilash
  const updateGroup = async (e) => {
    e.preventDefault();

    if (editFormData.days.length === 0) {
      toast.error("Kamida bitta dars kuni tanlanishi kerak", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (editFormData.start_time >= editFormData.end_time) {
      toast.error("Boshlanish vaqti tugash vaqtidan oldin bo‘lishi kerak", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // Vaqt mosligini tekshirish (o'z guruhini hisobga olmaymiz)
    const hasConflict = checkScheduleConflict(
      editFormData.room_id,
      editFormData.days,
      editFormData.start_time,
      editFormData.end_time,
      editingGroup.id
    );

    if (hasConflict) {
      toast.warning(
        "Tanlangan xonada ushbu kunlar va vaqt oralig‘ida boshqa guruh mavjud. Iltimos, boshqa vaqt yoki xona tanlang.",
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/update_group/${editingGroup.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...editFormData,
            days: editFormData.days.join("-"),
            start_time: `${editFormData.start_time}:00`,
            end_time: `${editFormData.end_time}:00`,
            monthly_fee: Number(editFormData.monthly_fee),
          }),
        }
      );

      if (response.ok) {
        const updatedGroup = {
          ...editingGroup,
          ...editFormData,
          days: editFormData.days.join("-"),
          start_time: `${editFormData.start_time}:00`,
          end_time: `${editFormData.end_time}:00`,
          monthly_fee: Number(editFormData.monthly_fee),
        };
        setGroups(
          groups.map((group) => (group.id === editingGroup.id ? updatedGroup : group))
        );
        toast.success(`${editFormData.group_subject} guruhi muvaffaqiyatli yangilandi`, {
          position: "top-right",
          autoClose: 3000,
        });
        setSuccess(`${editFormData.group_subject} guruhi muvaffaqiyatli yangilandi`);
        setEditModal(false);
        fetchGroups(); // Refresh groups with status
        if (selectedGroup && selectedGroup.id === editingGroup.id) {
          setSelectedGroup(updatedGroup);
          fetchTeacher(updatedGroup.teacher_id);
        }
      } else {
        if (response.status === 400) {
          toast.warning("Tanlangan xonada ushbu kunlar va vaqt oralig‘ida boshqa guruh mavjud. Iltimos, boshqa vaqt yoki xona tanlang.", {
            position: "top-right",
            autoClose: 5000,
          });
          return;
        }
        throw new Error("Guruhni yangilashda xatolik yuz berdi");
      }
    } catch (err) {
      toast.warning("Guruhni yangilashda xatolik: API mavjud emas", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Guruh o‘chirish
  const deleteGroup = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/delete_group/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setGroups(groups.filter((g) => g.id !== id));
        toast.success("Guruh muvaffaqiyatli o'chirildi", {
          position: "top-right",
          autoClose: 3000,
        });
        setSelectedGroup(null);
        setGroupStudents([]); // Clear group students
        fetchGroups(); // Refresh
      } else {
        throw new Error("Guruhni o'chirishda xatolik yuz berdi");
      }
    } catch (err) {
      toast.warning("Guruhni o'chirishda xatolik: API mavjud emas", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // O‘chirish tasdiqlash toast
  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>Ushbu guruhni o'chirishga ishonchingiz komilmi?</p>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            style={{
              padding: "8px 16px",
              background: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => {
              deleteGroup(id);
              toast.dismiss();
            }}
          >
            O'chirish
          </button>
          <button
            style={{
              padding: "8px 16px",
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => toast.dismiss()}
          >
            Bekor qilish
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
      }
    );
  };

  // Tahrirlash modalini ochish
  const openEditModal = (group) => {
    setEditingGroup(group);
    const parsedDays = group.days ? group.days.split("-").map((d) => d.trim().toUpperCase()) : [];
    setEditFormData({
      group_subject: group.group_subject,
      teacher_id: group.teacher_id,
      room_id: group.room_id || "",
      days: parsedDays,
      start_time: group.start_time.slice(0, 5),
      end_time: group.end_time.slice(0, 5),
      monthly_fee: group.monthly_fee || "",
    });
    setEditModal(true);
  };

  // Guruh statistikasini hisoblash
  const calculateGroupStats = (groupId) => {
    const currentMonth = getMonthsInWord(new Date().getMonth() + 1);
    const groupStudents = students.filter((student) =>
      student.groups?.some((group) => group.id === groupId)
    );
    const studentsAmount = groupStudents.length;
    const paidStudents = payments.filter(
      (payment) =>
        payment.for_which_group === groupId &&
        payment.for_which_month.toUpperCase() === currentMonth
    );
    const paidStudentsAmount = paidStudents.length;
    const unpaidStudentsAmount = studentsAmount - paidStudentsAmount;

    return { studentsAmount, paidStudentsAmount, unpaidStudentsAmount };
  };

  // Filtrlash
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      ...calculateGroupStats(group.id),
    }))
    .filter((group) =>
      group.group_subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Helper functions for attendance
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
      setGroupStudents(studentsArray); // Set group-specific students
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
    fetchData();
    fetchGroups();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
    if (Object.values(errors).some((err) => err)) {
      const timer = setTimeout(
        () =>
          setErrors({
            groups: "",
            teachers: "",
            students: "",
            payments: "",
            rooms: "",
          }),
        3000
      );
      return () => clearTimeout(timer);
    }
  }, [success, errors]);

  if (loading && groups.length === 0) return <LottieLoading />;

  return (
    <div className="min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mb-8 flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-800">
          <Calendar className="text-blue-600" size={28} /> Guruhlar va davomat tizimi
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Groups List with Management */}
        <motion.div
          className="col-span-1 bg-white rounded-2xl shadow-lg p-6 max-h-[80vh] overflow-y-auto"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Guruhlar</h2>
            <button
              className="btn btn-primary flex items-center gap-2"
              onClick={() => setAddModal(true)}
            >
              <Plus size={20} />
              Yangi guruh
            </button>
          </div>
          <div className="flex items-center gap-2 mb-4 border border-gray-200 rounded-md p-2">
            <Search size={20} color="#104292" />
            <input
              type="text"
              className="w-full outline-none"
              placeholder="Guruhni qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <AnimatePresence>
            {filteredGroups.map(group => {
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
                const [sh, sm] = group.start_time.split(":").map(Number);
                const [eh, em] = group.end_time.split(":").map(Number);
                const start = new Date(now);
                start.setHours(sh, sm, 0, 0);
              
                const end = new Date(now);
                end.setHours(eh, em, 0, 0);

                if (now < start) {
                  statusEl = `Dars ${group.start_time.slice(0, 5)} da boshlanadi`;
                  statusClass = "bg-yellow-100 text-yellow-700";
                } else if (now >= start && now <= end) {
                  statusEl = "Dars davom etmoqda";
                  statusClass = "bg-blue-100 text-blue-700";
                } else {
                  statusEl = "Davomat qilinmagan";
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
                    className="flex cursor-pointer items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors border-l-2 border-r-2 border-t-2 border-blue-200 rounded-t-[10px]"
                    onClick={() => handleGroupSelect(group)}
                  >
                    <span className="font-semibold text-gray-800 text-xl bg-green-200 pr-2 pl-2 rounded">{group.group_subject}</span>
                    <span className={`inline-flex items-end rounded-full px-3 py-1 text-sm font-medium max-w-[150px] truncate ${statusClass}`}>
                      {statusEl}
                    </span>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 flex justify-between items-center border-l-2 border-r-2 border-b-2 border-blue-200 rounded-b-[10px]">
                    <div>
                      <p className="text-gray-700 text-s mb-2">
                        <span className="font-semibold">Dars kunlari: </span>
                        <span className="font-medium">{formatDaysForDisplay(group.days) || "Belgilanmagan"}</span>
                      </p>
                      <p className="text-gray-700 text-s">
                        <span className="font-semibold">Dars vaqti: </span>
                        <span className="font-medium">{group.start_time.slice(0, 5)} - {group.end_time.slice(0, 5)}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(group);
                        }}
                        title="Tahrirlash"
                      >
                        <Pen size={16} />
                      </button>
                      <button
                        className="bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          showDeleteToast(group.id);
                        }}
                        title="O'chirish"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filteredGroups.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "Bunday guruh topilmadi" : errors.groups || "Hali mavjud emas"}
            </div>
          )}
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
                  <p className="text-lg font-medium text-gray-800">{groupStudents.length ? `${groupStudents.length} nafar` : "0"}</p>
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

              {/* Students List */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Guruhdagi o‘quvchilar</h3>
                {groupStudents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-s rounded-lg overflow-hidden shadow-sm">
                      <thead>
                        <tr className="bg-blue-600 text-white">
                          <th className="p-3 text-left font-semibold">#</th>
                          <th className="p-3 text-left font-semibold">Ism Familiya</th>
                          <th className="p-3 text-left font-semibold">Telefon raqami</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupStudents.map((student, index) => (
                          <motion.tr
                            key={student.id}
                            className="border-b hover:bg-gray-50 transition-colors"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <td className="p-3">{index + 1}</td>
                            <td className="p-3 font-medium text-gray-800">{student.first_name} {student.last_name}</td>
                            <td className="p-3 text-gray-600">{student.phone_number || "N/A"}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-4 text-center text-gray-500 font-medium">
                    Bu guruhda o‘quvchilar mavjud emas
                  </div>
                )}
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

      {/* Add Modal */}
      {addModal && (
        <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-content bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="modal-header bg-[#104292] p-2 text-white rounded-t-lg">
              <h3 className="text-center text-lg font-bold">Yangi guruh qo'shish</h3>
            </div>
            <form onSubmit={addGroup}>
              <div className="form-grid grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="form-group">
                  <label>Guruh nomi</label>
                  <input
                    type="text"
                    className="input w-full border border-gray-300 rounded-md p-2"
                    value={formData.group_subject}
                    onChange={(e) =>
                      setFormData({ ...formData, group_subject: e.target.value })
                    }
                    placeholder="Guruh nomini kiriting"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>O'qituvchi</label>
                  <select
                    className="select w-full border border-gray-300 rounded-md p-2"
                    value={formData.teacher_id}
                    onChange={(e) =>
                      setFormData({ ...formData, teacher_id: e.target.value })
                    }
                    required
                    disabled={teachers.length === 0}
                  >
                    <option value="">
                      {errors.teachers ? "O'qituvchilar yo'q" : "Tanlang"}
                    </option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {`${teacher.first_name} ${teacher.last_name} (${teacher.subject})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Xona</label>
                  <select
                    className="select w-full border border-gray-300 rounded-md p-2"
                    value={formData.room_id}
                    onChange={(e) =>
                      setFormData({ ...formData, room_id: e.target.value })
                    }
                    required
                    disabled={rooms.length === 0}
                  >
                    <option value="">
                      {errors.rooms ? "Xonalar yo'q" : "Tanlang"}
                    </option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {`${room.name} (${room.capacity || "Belgilanmagan"})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group md:col-span-2">
                  <label>Dars kunlari</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {daysOfWeek.map((day) => (
                      <label key={day} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <input
                          type="checkbox"
                          checked={formData.days.includes(day)}
                          onChange={() => handleDaysChange(day)}
                          style={{ scale: "1.5", cursor: "pointer" }}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Boshlanish vaqti</label>
                  <input
                    type="time"
                    className="input w-full border border-gray-300 rounded-md p-2"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tugash vaqti</label>
                  <input
                    type="time"
                    className="input w-full border border-gray-300 rounded-md p-2"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group md:col-span-2">
                  <label>Oylik to'lov summasi (so'm)</label>
                  <input
                    type="number"
                    className="input w-full border border-gray-300 rounded-md p-2"
                    value={formData.monthly_fee}
                    onChange={(e) =>
                      setFormData({ ...formData, monthly_fee: e.target.value })
                    }
                    placeholder="Masalan: 225000"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-secondary px-4 py-2 bg-gray-500 text-white rounded-md"
                  onClick={() => setAddModal(false)}
                >
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary px-4 py-2 bg-blue-600 text-white rounded-md">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-content bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="modal-header flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Guruhni tahrirlash</h3>
              <button
                onClick={() => setEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={updateGroup}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Guruh nomi</label>
                  <input
                    type="text"
                    className="input w-full border border-gray-300 rounded-md p-2"
                    value={editFormData.group_subject}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        group_subject: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>O'qituvchi</label>
                  <select
                    className="select w-full border border-gray-300 rounded-md p-2"
                    value={editFormData.teacher_id}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        teacher_id: e.target.value,
                      })
                    }
                    required
                    disabled={teachers.length === 0}
                  >
                    <option value="">
                      {errors.teachers ? "O'qituvchilar yo'q" : "Tanlang"}
                    </option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {`${teacher.first_name} ${teacher.last_name} (${teacher.subject})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Xona</label>
                  <select
                    className="select w-full border border-gray-300 rounded-md p-2"
                    value={editFormData.room_id}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        room_id: e.target.value,
                      })
                    }
                    required
                    disabled={rooms.length === 0}
                  >
                    <option value="">
                      {errors.rooms ? "Xonalar yo'q" : "Tanlang"}
                    </option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {`${room?.name} (${room?.capacity || "Belgilanmagan"})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group md:col-span-2">
                  <label>Dars kunlari</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {daysOfWeek.map((day) => (
                      <label key={day} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <input
                          type="checkbox"
                          checked={editFormData.days.includes(day)}
                          onChange={() => handleDaysChange(day, true)}
                          style={{ scale: "1.5", cursor: "pointer" }}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Boshlanish vaqti</label>
                  <input
                    type="time"
                    className="input w-full border border-gray-300 rounded-md p-2"
                    value={editFormData.start_time}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        start_time: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tugash vaqti</label>
                  <input
                    type="time"
                    className="input w-full border border-gray-300 rounded-md p-2"
                    value={editFormData.end_time}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        end_time: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group md:col-span-2">
                  <label>Oylik to'lov summasi (so'm)</label>
                  <input
                    type="number"
                    className="input w-full border border-gray-300 rounded-md p-2"
                    value={editFormData.monthly_fee}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        monthly_fee: e.target.value,
                      })
                    }
                    placeholder="Masalan: 200000"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-secondary px-4 py-2 bg-gray-500 text-white rounded-md"
                  onClick={() => setEditModal(false)}
                >
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary px-4 py-2 bg-blue-600 text-white rounded-md">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
