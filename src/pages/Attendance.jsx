"use client";

import { useState, useEffect } from "react";
import { Trash2, Pen, Plus, X, Check, Calendar, Clock, Search, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import CalendarEl from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import LottieLoading from "../components/Loading";
import { motion, AnimatePresence } from "framer-motion";
import { registerLocale } from "react-datepicker";
import uz from "date-fns/locale/uz";
import "../index.css";
import API_URL from "../conf/api";

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
  const [extendModal, setExtendModal] = useState(false);
  const [selectedGroupForExtension, setSelectedGroupForExtension] = useState(null);
  const [extensionData, setExtensionData] = useState({
    date: "",
    time: "",
  });
  const [classDay, setClassDay] = useState(null);
  const [errors, setErrors] = useState({
    groups: "",
    teachers: "",
    students: "",
    payments: "",
    rooms: "",
  });
  const [extensionInfo, setExtensionInfo] = useState(null);
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
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [smsText, setSmsText] = useState("");
  const [smsModalOpen, setSmsModalOpen] = useState(false);

  const daysOfWeek = [
    "DUSHANBA",
    "SESHANBA",
    "CHORSHANBA",
    "PAYSHANBA",
    "JUMA",
    "SHANBA",
    "YAKSHANBA",
  ];

  const handleSendSMStoGroup = async () => {
    if (!selectedGroup) return;
    if (groupStudents.length === 0) {
      toast.error("Guruhda o‘quvchi yo‘q");
      return;
    }

    // Agar xabar matnini foydalanuvchidan olishni xohlasangiz — modal oching
    // Hozircha oddiy misol:
    const message = prompt("Yuboriladigan xabar matni:",
      `Hurmatli o'quvchilar! ${selectedGroup.group_subject} darsi haqida eslatma.`
    );

    if (!message || message.trim() === "") {
      toast.error("Xabar matni kiritilmadi");
      return;
    }

    if (!confirm(`Haqiqatan ham ${groupStudents.length} ta o‘quvchiga SMS yubormoqchimisiz?\n\nXabar: ${message}`)) {
      return;
    }

    setSendingSMS(true);
    try {
      const response = await fetch(`${API_URL}/send-group-sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: selectedGroup.id,
          message: message.trim(),
          // yoki: phone_numbers: groupStudents.map(s => s.phone_number).filter(Boolean)
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "SMS yuborishda xato");
      }

      const result = await response.json();
      toast.success(`SMS muvaffaqiyatli yuborildi (${result.sent_count || groupStudents.length} ta)`);

    } catch (err) {
      console.error(err);
      toast.error(err.message || "SMS yuborishda xatolik yuz berdi");
    } finally {
      setSendingSMS(false);
    }
  };

  useEffect(() => {
    if (!selectedGroup?.id) {
      setAttendanceSummary(null);
      return;
    }

    const fetchAttendanceStats = async () => {
      try {
        const res = await fetch(`${API_URL}/group-attendance-summary/${selectedGroup.id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setAttendanceSummary(data);
      } catch (err) {
        console.log(err);
        setAttendanceSummary(null);
      }
    };

    fetchAttendanceStats();
  }, [selectedGroup?.id]);

  useEffect(() => {
    if (!selectedGroup) {
      setPaymentSummary(null);
      return;
    }

    const fetchSummary = async () => {
      try {
        const res = await fetch(`${API_URL}/group-payment-summary/${selectedGroup.id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setPaymentSummary(data);
      } catch {
        setPaymentSummary(null);
      }
    };

    fetchSummary();
  }, [selectedGroup?.id]);

  const extendAttendanceTime = async () => {
    if (!selectedGroupForExtension || !extensionData.date || !extensionData.time) {
      toast.error("Iltimos, sana va vaqtni kiriting");
      return;
    }

    const extendedUntil = `${extensionData.date}T${extensionData.time}:00`;

    try {
      const response = await fetch(`${API_URL}/extend-attendance-time`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: selectedGroupForExtension.id,
          extended_until: extendedUntil
        }),
      });

      if (response.ok) {
        toast.success("Davomat vaqti muvaffaqiyatli uzaytirildi");
        setExtendModal(false);
        setExtensionData({ date: "", time: "" });
      } else if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Vaqt uzaytirishda xatolik");
      }
    } catch (err) {
      toast.error(`${err.message || "Vaqt uzaytirishda xatolik"}`);
    }
  };

  const fetchExtensionInfo = async (groupId) => {
    try {
      const response = await fetch(
        `${API_URL}/get_extend_attendance_time/${groupId}`
      );

      if (response.ok) {
        const data = await response.json();
        setExtensionInfo(data);
      } else if (response.status === 404) {
        setExtensionInfo(null); // Uzaytirish mavjud emas
      } else {
        throw new Error("Uzaytirish ma'lumotlarini olishda xatolik");
      }
    } catch (error) {
      console.error("Uzaytirish ma'lumotlarini olishda xatolik:", error);
      setExtensionInfo(null);
    }
  };

  // Modalni ochish funksiyasi
  const openExtendModal = async (group) => {
    setSelectedGroupForExtension(group);
    setExtendModal(true);

    // Uzaytirish ma'lumotlarini yuklash
    await fetchExtensionInfo(group.id);

    // Agar uzaytirish mavjud bo'lsa, formani to'ldirish
    if (extensionInfo && extensionInfo.extended_until) {
      const extendedDate = new Date(extensionInfo.extended_until);
      const dateStr = extendedDate.toISOString().split('T')[0];
      const timeStr = extendedDate.toTimeString().slice(0, 5);

      setExtensionData({
        date: dateStr,
        time: timeStr
      });
    } else {
      // Yangi uzaytirish uchun boshlang'ich qiymatlar
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      setExtensionData({
        date: dateStr,
        time: "23:59"
      });
    }
  };

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
        fetch(`${API_URL}/get_groups`).catch(() => ({ ok: false })),
        fetch(`${API_URL}/get_teachers`).catch(() => ({ ok: false })),
        fetch(`${API_URL}/get_students`).catch(() => ({ ok: false })),
        fetch(`${API_URL}/get_payments`).catch(() => ({ ok: false })),
        fetch(`${API_URL}/get_rooms`).catch(() => ({ ok: false })),
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
        toast.error("Guruhlar mavjud emas");
      }

      if (teachersResponse.ok) {
        setTeachers(await teachersResponse.json());
      } else {
        setTeachers([]);
        setErrors((prev) => ({ ...prev, teachers: "O'qituvchilar mavjud emas" }));
        toast.error("O'qituvchilar mavjud emas");
      }

      if (studentsResponse.ok) {
        setStudents(await studentsResponse.json());
      } else {
        setStudents([]);
        setErrors((prev) => ({ ...prev, students: "O'quvchilar mavjud emas" }));
        toast.error("O'quvchilar mavjud emas");
      }

      if (paymentsResponse.ok) {
        setPayments(await paymentsResponse.json());
      } else {
        setPayments([]);
        setErrors((prev) => ({ ...prev, payments: "To'lovlar mavjud emas" }));
        toast.error("To'lovlar mavjud emas");
      }

      if (roomsResponse.ok) {
        setRooms(await roomsResponse.json());
      } else {
        setRooms([]);
        setErrors((prev) => ({ ...prev, rooms: "Xonalar mavjud emas" }));
        toast.error("Xonalar mavjud emas");
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
      toast.error("Ma'lumotlarni yuklashda umumiy xatolik yuz berdi");
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
      toast.error("Kamida bitta dars kuni tanlanishi kerak");
      return;
    }

    if (formData.start_time >= formData.end_time) {
      toast.error("Boshlanish vaqti tugash vaqtidan oldin bo‘lishi kerak");
      return;
    }

    if (!formData.teacher_id || !formData.room_id) {
      toast.error("O‘qituvchi va xona tanlanishi kerak");
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
      toast.error(
        "Tanlangan xonada ushbu kunlar va vaqt oralig‘ida boshqa guruh mavjud. Iltimos, boshqa vaqt yoki xona tanlang.",
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
      const response = await fetch(`${API_URL}/create_group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });

      if (response.ok) {
        const newGroup = await response.json();
        setGroups([...groups, newGroup.group]);
        setSuccess(`${formData.group_subject} guruhi muvaffaqiyatli qo'shildi`);
        toast.success(`${formData.group_subject} guruhi muvaffaqiyatli qo'shildi`);
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
          toast.error("Tanlangan xonada ushbu kunlar va vaqt oralig‘ida boshqa guruh mavjud. Iltimos, boshqa vaqt yoki xona tanlang.");
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Guruh qo'shishda xatolik yuz berdi");
      }
    } catch (err) {
      toast.error(err.message || "Guruh qo'shishda xatolik: API mavjud emas");
    }
  };

  // Guruh yangilash
  const updateGroup = async (e) => {
    e.preventDefault();

    if (editFormData.days.length === 0) {
      toast.error("Kamida bitta dars kuni tanlanishi kerak");
      return;
    }

    if (editFormData.start_time >= editFormData.end_time) {
      toast.error("Boshlanish vaqti tugash vaqtidan oldin bo‘lishi kerak");
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
      toast.error("Tanlangan xonada ushbu kunlar va vaqt oralig‘ida boshqa guruh mavjud. Iltimos, boshqa vaqt yoki xona tanlang.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/update_group/${editingGroup.id}`,
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
        toast.success(`${editFormData.group_subject} guruhi muvaffaqiyatli yangilandi`);
        setSuccess(`${editFormData.group_subject} guruhi muvaffaqiyatli yangilandi`);
        setEditModal(false);
        fetchGroups(); // Refresh groups with status
        if (selectedGroup && selectedGroup.id === editingGroup.id) {
          setSelectedGroup(updatedGroup);
          fetchTeacher(updatedGroup.teacher_id);
        }
      } else {
        if (response.status === 400) {
          toast.error("Tanlangan xonada ushbu kunlar va vaqt oralig‘ida boshqa guruh mavjud. Iltimos, boshqa vaqt yoki xona tanlang.");
          return;
        }
        throw new Error("Guruhni yangilashda xatolik yuz berdi");
      }
    } catch (err) {
      toast.error(`Xatolik yuz berdi: ${err.message}`);
    }
  };

  // Guruh o‘chirish
  const deleteGroup = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/delete_group/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setGroups(groups.filter((g) => g.id !== id));
        toast.success("Guruh muvaffaqiyatli o'chirildi");
        setSelectedGroup(null);
        setGroupStudents([]); // Clear group students
        fetchGroups(); // Refresh
      } else {
        throw new Error("Guruhni o'chirishda xatolik yuz berdi");
      }
    } catch (err) {
      toast.error(`Xatolik yuz berdi: ${err.message}`);
    }
  };

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>
          Diqqat! Ushbu guruhga tegishli barcha ma'lumotlar o'chiriladi!
        </p>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            style={{
              padding: "8px 22px",
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
      </div>
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
      const res = await fetch(`${API_URL}/get_groups`);
      if (!res.ok) throw new Error("Guruhlarni yuklashda xatolik");
      const data = await res.json();

      const groupsWithStatus = await Promise.all(data.map(async (group) => {
        const dateStr = formatDate(new Date());
        let status = "loading";
        let records = [];

        try {
          const resAtt = await fetch(
            `${API_URL}/get_attendance_by_date/${group.id}?date=${dateStr}`
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
      toast.error("Guruhlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Fetch students for selected group
  const fetchStudents = async (groupId) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/get_one_group_students?group_id=${groupId}`
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
      toast.error("O'quvchilarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance
  const fetchAttendance = async (groupId, date) => {
    try {
      setLoading(true);

      if (!isClassOnDate(groups.find(group => group.id === groupId), date)) {
        toast.error("Bugun dars yo‘q");
        setAttendanceTime(null);
        return;
      }

      let res; // oldindan e’lon qilamiz

      res = await fetch(
        `${API_URL}/get_attendance_by_date/${groupId}?date=${formatDate(date)}`
      );

      if (res.status === 404) {
        toast.custom((t) => (
          <div className="flex items-center gap-2 p-2 bg-yellow-500 text-white rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span>{formatDateWithDaysStart(date)} yilda davomat qilinmagan!</span>
          </div>
        ), { duration: 1500 });
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
      toast.error(error.message || "Davomatni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Fetch teacher
  const fetchTeacher = async (teacher_id) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/get_one_teacher/${teacher_id}`
      );
      if (!res.ok) throw new Error("Ustozni yuklashda xatolik");
      const data = await res.json();
      setTeacher(data);
    } catch {
      toast.error("Ustozni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Handle group selection
  const handleGroupSelect = async (group) => {
    setAttendance({})
    setAttendanceTime(null);
    setSelectedGroup(group);
    setGroupStudents([]);
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
                        className="bg-green-600 text-white rounded-full p-2 hover:bg-green-700 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          openExtendModal(group);
                        }}
                        title="Davomat vaqtini uzaytirish"
                      >
                        <Clock size={16} />
                      </button>
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
          className="lg:col-span-2   bg-white rounded-2xl shadow-lg p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {selectedGroup ? (
            <>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">{selectedGroup.group_subject}</h2>
                <button
                  onClick={() => setSmsModalOpen(true)}
                  className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm"
                  disabled={sendingSMS} // loading holatini ko‘rsatish uchun
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                  Guruhga SMS yuborish
                  {sendingSMS && <span className="animate-pulse">...</span>}
                </button>
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
                  <h3 className="text-sm font-semibold text-blue-600">
                    {paymentSummary?.month || "—"} oyi to‘lovlari
                  </h3>
                  <p className="text-lg font-bold text-gray-800">
                    {paymentSummary
                      ? `${paymentSummary.total_paid.toLocaleString('uz-UZ')} so'm`
                      : "—"}
                  </p>
                  <p className="text-sm text-gray-600">
                    To‘lov qilgan: {paymentSummary?.paid_count || 0} / {paymentSummary?.total_students || 0}
                  </p>
                </div>
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
                <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-blue-600">Haftalik davomat</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {attendanceSummary?.week?.percent ?? "—"}%
                  </p>
                  <p className="text-sm text-gray-600">
                    {attendanceSummary?.week?.present ?? 0} / {attendanceSummary?.week?.total ?? 0}
                  </p>
                </div>

                <div className="bg-indigo-50 rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-indigo-600">Oylik davomat</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {attendanceSummary?.month?.percent ?? "—"}%
                  </p>
                  <p className="text-sm text-gray-600">
                    {attendanceSummary?.month?.present ?? 0} / {attendanceSummary?.month?.total ?? 0}
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

      {smsModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
              <h3 className="text-lg font-bold">Guruhga SMS yuborish</h3>
              <button onClick={() => setSmsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-gray-600">
                {groupStudents.length} ta o‘quvchiga yuboriladi
              </p>

              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-green-500"
                placeholder="Xabar matnini kiriting..."
                value={smsText}
                onChange={e => setSmsText(e.target.value)}
                maxLength={160} // ko'p SMS operatorlarda 160 belgidan boshlanadi
              />

              <p className="text-sm text-gray-500">
                Belgilar: {smsText.length} / 160
              </p>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
              <button
                className="px-5 py-2 border rounded-lg hover:bg-gray-100"
                onClick={() => setSmsModalOpen(false)}
              >
                Bekor qilish
              </button>
              <button
                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!smsText.trim() || sendingSMS}
                onClick={async () => {
                  // yuqoridagi handleSendSMStoGroup logikasini shu yerga ko‘chiring
                  // faqat message = smsText ishlatiladi
                  // muvaffaqiyatli bo‘lsa: setSmsModalOpen(false); setSmsText("");
                }}
              >
                {sendingSMS ? "Yuborilmoqda..." : "SMS yuborish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {addModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Plus size={24} className="bg-white text-blue-600 p-1 rounded-full" />
                  <h3 className="text-xl font-bold">Yangi guruh qo'shish</h3>
                </div>
                <button
                  onClick={() => setAddModal(false)}
                  className="text-white hover:bg-blue-700 p-1 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-blue-100 text-sm mt-1">Yangi guruh ma'lumotlarini to'ldiring</p>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <form onSubmit={addGroup} className="space-y-6">
                {/* Guruh nomi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guruh nomi *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={formData.group_subject}
                    onChange={(e) => setFormData({ ...formData, group_subject: e.target.value })}
                    placeholder="Masalan: Matematika 1-guruh"
                    required
                  />
                </div>

                {/* O'qituvchi va Xona */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      O'qituvchi *
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      value={formData.teacher_id}
                      onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                      required
                      disabled={teachers.length === 0}
                    >
                      <option value="">O'qituvchi tanlang</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.first_name} {teacher.last_name} ({teacher.subject})
                        </option>
                      ))}
                    </select>
                    {teachers.length === 0 && (
                      <p className="text-red-500 text-xs mt-1">O'qituvchilar mavjud emas</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Xona *
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      value={formData.room_id}
                      onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                      required
                      disabled={rooms.length === 0}
                    >
                      <option value="">Xona tanlang</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} ({room.capacity || 0} o'rin)
                        </option>
                      ))}
                    </select>
                    {rooms.length === 0 && (
                      <p className="text-red-500 text-xs mt-1">Xonalar mavjud emas</p>
                    )}
                  </div>
                </div>

                {/* Dars kunlari */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Dars kunlari *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {daysOfWeek.map((day) => (
                      <label
                        key={day}
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all duration-200 ${formData.days.includes(day)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.days.includes(day)}
                          onChange={() => handleDaysChange(day)}
                          className="hidden"
                        />
                        <div className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${formData.days.includes(day)
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-400'
                          }`}>
                          {formData.days.includes(day) && <Check size={14} />}
                        </div>
                        <span className="text-sm font-medium">{day}</span>
                      </label>
                    ))}
                  </div>
                  {formData.days.length === 0 && (
                    <p className="text-red-500 text-xs mt-2">Kamida bitta kun tanlanishi kerak</p>
                  )}
                </div>

                {/* Vaqt oralig'i */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Boshlanish vaqti *
                    </label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tugash vaqti *
                    </label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Oylik to'lov */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oylik to'lov summasi (so'm) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={formData.monthly_fee}
                      onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
                      placeholder="Masalan: 225000"
                      min="0"
                      required
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setAddModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center gap-2"
                    disabled={formData.days.length === 0}
                  >
                    <Plus size={18} />
                    Guruh qo'shish
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Davomat vaqtini uzaytirish modal oynasi */}
      {extendModal && (
        <div className="modal" onClick={() => setExtendModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header bg-green-600 p-2 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={20} />
                  <h3 className="text-lg font-bold">Davomat vaqtini uzaytirish</h3>
                </div>
                <button
                  type="button"
                  className="text-white hover:bg-green-700 rounded-full p-1"
                  onClick={() => setExtendModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  <strong>{selectedGroupForExtension?.group_subject}</strong> guruhi uchun davomat vaqtini uzaytiring
                </p>
                <p className="text-sm text-gray-500">
                  Uzaytirilgan vaqtgacha o'qituvchilar yo'qlama qilish va yangilash imkoniyatiga ega bo'ladilar
                </p>
              </div>

              {/* Mavjud uzaytirish ma'lumotlari */}
              {extensionInfo && extensionInfo.extended_until && extensionInfo.extended_until > new Date().toISOString() && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Check size={16} />
                    <span className="font-medium">Joriy uzaytirish mavjud:</span>
                  </div>

                  {(() => {
                    const date = new Date(extensionInfo.extended_until);

                    // bugun va ertaga aniqlash
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const tomorrow = new Date(today);
                    tomorrow.setDate(today.getDate() + 1);

                    const extendedDay = new Date(date);
                    extendedDay.setHours(0, 0, 0, 0);

                    let prefix = "";
                    if (extendedDay.getTime() === today.getTime()) {
                      prefix = "Bugun, ";
                    } else if (extendedDay.getTime() === tomorrow.getTime()) {
                      prefix = "Ertaga, ";
                    }
                    else {
                      prefix = ""
                    }

                    return (
                      <p className="text-sm text-blue-600 mt-1">
                        {prefix}
                        {date.getDate()}-{monthsUZ[date.getMonth()].toLowerCase()} soat {date.getHours()}:00 gacha
                      </p>
                    );
                  })()}

                  {extensionInfo.extended_by && (
                    <p className="text-xs text-blue-500 mt-1">
                      Admin tomonidan uzaytirilgan
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sana *
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={extensionData.date}
                    onChange={(e) => setExtensionData({ ...extensionData, date: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vaqt *
                  </label>
                  <input
                    type="time"
                    className="input"
                    value={extensionData.time}
                    onChange={(e) => setExtensionData({ ...extensionData, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  ⏰ Eslatma: Uzaytirish vaqti hozirgi vaqtdan keyin bo'lishi kerak.
                  Tanlangan vaqtgacha bu guruh uchun yo'qlama qilish mumkin bo'ladi.
                </p>
              </div>
            </div>

            <div className="modal-footer bg-gray-50 px-6 rounded-b-lg h-12">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setExtendModal(false)}
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  className="btn btn-success flex items-center bg-green-600 hover:bg-green-700 text-white"
                  onClick={extendAttendanceTime}
                  disabled={!extensionData.date || !extensionData.time}
                >
                  <Clock size={16} className="mr-2" />
                  {extensionInfo ? "Vaqtni yangilash" : "Vaqtni uzaytirish"}
                </button>
              </div>
            </div>
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
