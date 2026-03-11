"use client";

import { useState, useEffect } from "react";
import {
  Trash2,
  Pen,
  Plus,
  X,
  Check,
  Calendar,
  Clock,
  Search,
  AlertCircle,
  Users,
  GraduationCap,
  DoorOpen,
  CreditCard,
  Phone,
  MessageSquare,
  ChevronRight,
  BarChart3,
  Award,
  UserCheck,
  UserX,
  BookOpen,
  Coffee,
  BellRing,
  Timer,
  UserCog
} from "lucide-react";
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
  const [groupStudents, setGroupStudents] = useState([]);
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

    if (!smsText || smsText.trim() === "") {
      toast.error("Xabar matni kiritilmadi");
      return;
    }
    // setSendingSMS(true);
    toast.success(`SMS muvaffaqiyatli yuborildi (${result.sent_count || groupStudents.length} ta)`);
    return;
    try {
      const response = await fetch(`${API_URL}/send-group-sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: selectedGroup.id,
          message: smsText.trim(),
        }),
        credentials: "include",
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
      // setSendingSMS(false);
    }
  };

  useEffect(() => {
    if (!selectedGroup?.id) {
      setAttendanceSummary(null);
      return;
    }

    const fetchAttendanceStats = async () => {
      try {
        const res = await fetch(`${API_URL}/group-attendance-summary/${selectedGroup.id}`, {
          credentials: "include",
        });
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
        const res = await fetch(`${API_URL}/group-payment-summary/${selectedGroup.id}`, {
          credentials: "include",
        });
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
        credentials: "include",
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
        `${API_URL}/get_extend_attendance_time/${groupId}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setExtensionInfo(data);
      } else if (response.status === 404) {
        setExtensionInfo(null);
      } else {
        throw new Error("Uzaytirish ma'lumotlarini olishda xatolik");
      }
    } catch (error) {
      console.error("Uzaytirish ma'lumotlarini olishda xatolik:", error);
      setExtensionInfo(null);
    }
  };

  const openExtendModal = async (group) => {
    setSelectedGroupForExtension(group);
    setExtendModal(true);

    await fetchExtensionInfo(group.id);

    if (extensionInfo && extensionInfo.extended_until) {
      const extendedDate = new Date(extensionInfo.extended_until);
      const dateStr = extendedDate.toISOString().split('T')[0];
      const timeStr = extendedDate.toTimeString().slice(0, 5);

      setExtensionData({
        date: dateStr,
        time: timeStr
      });
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      setExtensionData({
        date: dateStr,
        time: "23:59"
      });
    }
  };

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

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrors({ groups: "", teachers: "", students: "", rooms: "" });

      const [
        groupsResponse,
        teachersResponse,
        studentsResponse,
        roomsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/get_groups`, {
          credentials: "include",
        }).catch(() => ({ ok: false })),
        fetch(`${API_URL}/get_teachers`, {
          credentials: "include",
        }).catch(() => ({ ok: false })),
        fetch(`${API_URL}/get_students`, {
          credentials: "include",
        }).catch(() => ({ ok: false })),
        fetch(`${API_URL}/get_rooms`, {
          credentials: "include",
        }).catch(() => ({ ok: false })),
      ]);

      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();

        const groupsWithStatus = await Promise.all(
          groupsData.map(async (group) => {
            const dateStr = formatDate(new Date());
            let status = "loading";
            let records = [];

            try {
              const resAtt = await fetch(
                `${API_URL}/get_attendance_by_date/${group.id}?date=${dateStr}`,
                { credentials: "include" }
              );

              if (resAtt.status === 404) {
                status = "no_attendance";
              } else if (resAtt.ok) {
                const attData = await resAtt.json();
                status = attData.records?.length > 0 ? "done" : "no_attendance";
                records = attData.records || [];
              } else {
                status = "error";
              }
            } catch {
              status = "error";
            }

            return {
              ...group,
              todayStatus: status,
              todayRecords: records,
              days: group.days ? group.days.toUpperCase() : "",
            };
          })
        );

        setGroups(groupsWithStatus);
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
        const studentsData = await studentsResponse.json();
        setStudents(studentsData.data);

      } else {
        setStudents([]);
        setErrors((prev) => ({ ...prev, students: "O'quvchilar mavjud emas" }));
        toast.error("O'quvchilar mavjud emas");
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
      setRooms([]);
      setErrors({
        groups: "Guruhlar mavjud emas",
        teachers: "O'qituvchilar mavjud emas",
        students: "O'quvchilar mavjud emas",
        rooms: "Xonalar mavjud emas",
      });
      toast.error("Ma'lumotlarni yuklashda umumiy xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

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

  const getErrorMessage = async (response) => {
    try {
      const data = await response.json();

      return (
        data?.message ||
        data?.error ||
        data?.errors?.[0]?.message ||
        "Xatolik yuz berdi"
      );
    } catch {
      return response?.statusText || "Serverdan xatolik qaytdi";
    }
  };

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
        credentials: "include",
      });
  
      if (!response.ok) {
        const errorMessage = await getErrorMessage(response);
        toast.error(errorMessage);
        return;
      }
  
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
      fetchGroups();
    } catch (err) {
      toast.error(err?.message || "API bilan bog‘lanishda xatolik yuz berdi");
    }
  };

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
  
    try {
      const payload = {
        ...editFormData,
        days: editFormData.days.join("-"),
        start_time: `${editFormData.start_time}:00`,
        end_time: `${editFormData.end_time}:00`,
        monthly_fee: Number(editFormData.monthly_fee),
      };
  
      const response = await fetch(
        `${API_URL}/update_group/${editingGroup.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        }
      );
  
      if (!response.ok) {
        const errorMessage = await getErrorMessage(response);
        toast.error(errorMessage);
        return;
      }
  
      const updatedGroup = {
        ...editingGroup,
        ...editFormData,
        days: editFormData.days.join("-"),
        start_time: `${editFormData.start_time}:00`,
        end_time: `${editFormData.end_time}:00`,
        monthly_fee: Number(editFormData.monthly_fee),
      };
  
      setGroups(
        groups.map((group) =>
          group.id === editingGroup.id ? updatedGroup : group
        )
      );
  
      toast.success(`${editFormData.group_subject} guruhi muvaffaqiyatli yangilandi`);
      setEditModal(false);
      fetchGroups();
  
      if (selectedGroup && selectedGroup.id === editingGroup.id) {
        setSelectedGroup(updatedGroup);
        fetchTeacher(updatedGroup.teacher_id);
      }
    } catch (err) {
      toast.error(err?.message || "API bilan bog‘lanishda xatolik yuz berdi");
    }
  };

  const deleteGroup = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/delete_group/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        setGroups(groups.filter((g) => g.id !== id));
        toast.success("Guruh muvaffaqiyatli o'chirildi");
        setSelectedGroup(null);
        setGroupStudents([]);
        fetchGroups();
      } else {
        throw new Error(`Guruhni o'chirishda xatolik yuz berdi: ${response.statusText}`);
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

  const calculateGroupStats = (groupId) => {
    const currentMonth = getMonthsInWord(new Date().getMonth() + 1);
    const safeStudents = Array.isArray(students) ? students : [];
    const safePayments = Array.isArray(payments) ? payments : [];

    const groupStudents = safeStudents.filter((student) =>
      student.groups?.some((group) => group.id === groupId)
    );

    const studentsAmount = groupStudents.length;

    const paidStudents = safePayments.filter(
      (payment) =>
        payment.group_id === groupId &&
        String(payment.for_which_month || "").toUpperCase() === currentMonth
    );

    const paidStudentsAmount = paidStudents.length;
    const unpaidStudentsAmount = studentsAmount - paidStudentsAmount;

    return { studentsAmount, paidStudentsAmount, unpaidStudentsAmount };
  };

  const filteredGroups = groups.filter((group) =>
    group.group_subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/get_groups`, { credentials: "include" });
      if (!res.ok) throw new Error("Guruhlarni yuklashda xatolik");
      const data = await res.json();

      const groupsWithStatus = await Promise.all(data.map(async (group) => {
        const dateStr = formatDate(new Date());
        let status = "loading";
        let records = [];

        try {
          const resAtt = await fetch(
            `${API_URL}/get_attendance_by_date/${group.id}?date=${dateStr}`,
            { credentials: "include" }
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

  const fetchStudents = async (groupId) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/get_one_group_students?group_id=${groupId}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("O'quvchilarni yuklashda xatolik");
      const data = await res.json();

      const studentsArray = Array.isArray(data) ? data : [];
      setGroupStudents(studentsArray);
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

  const fetchAttendance = async (groupId, date) => {
    try {
      setLoading(true);

      if (!isClassOnDate(groups.find(group => group.id === groupId), date)) {
        toast.error("Bugun dars yo‘q");
        setAttendanceTime(null);
        return;
      }

      let res;

      res = await fetch(
        `${API_URL}/get_attendance_by_date/${groupId}?date=${formatDate(date)}`,
        { credentials: "include" }
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

  const fetchTeacher = async (teacher_id) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/get_one_teacher/${teacher_id}`,
        { credentials: "include" }
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

  const handleGroupSelect = async (group) => {
    setAttendance({})
    setAttendanceTime(null);
    setSelectedGroup(group);
    setGroupStudents([]);
    await fetchStudents(group.id);
    await fetchAttendance(group.id, selectedDate);
    await fetchTeacher(group.teacher_id);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
              <Calendar className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Guruhlar va davomat tizimi</h1>
              <p className="text-gray-600 mt-1">Guruhlarni boshqaring va davomatni kuzating</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Groups List */}
        <motion.div
          className="lg:col-span-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 max-h-[80vh] overflow-y-auto border border-white/20"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Users className="text-blue-600" size={20} />
              Guruhlar
            </h2>
            <motion.button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => setAddModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={18} />
              Yangi guruh
            </motion.button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
              placeholder="Guruhni qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <AnimatePresence>
            {filteredGroups.map((group, index) => {
              const todayClass = isClassOnDate(group, new Date());
              let statusEl, statusClass, statusIcon;

              if (!todayClass) {
                statusEl = "Bugun dars yo‘q";
                statusClass = "bg-gray-100 text-gray-600";
                statusIcon = <Coffee size={14} />;
              } else if (group.todayStatus === "loading") {
                statusEl = "Yuklanmoqda...";
                statusClass = "bg-gray-100 text-gray-400";
                statusIcon = <Timer size={14} />;
              } else if (group.todayStatus === "done") {
                statusEl = "Davomat qilingan";
                statusClass = "bg-green-100 text-green-700";
                statusIcon = <Check size={14} />;
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
                  statusIcon = <Clock size={14} />;
                } else if (now >= start && now <= end) {
                  statusEl = "Dars davom etmoqda";
                  statusClass = "bg-blue-100 text-blue-700";
                  statusIcon = <BellRing size={14} />;
                } else {
                  statusEl = "Davomat qilinmagan";
                  statusClass = "bg-red-100 text-red-700";
                  statusIcon = <AlertCircle size={14} />;
                }
              }

              return (
                <motion.div
                  key={group.id}
                  className="mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <div
                    className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 ${selectedGroup?.id === group.id ? 'border-blue-600' : 'border-transparent'
                      }`}
                    onClick={() => handleGroupSelect(group)}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg text-gray-800">{group.group_subject}</h3>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                          {statusIcon}
                          {statusEl}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-blue-600" />
                          <span>{formatDaysForDisplay(group.days) || "Belgilanmagan"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-blue-600" />
                          <span>{group.start_time.slice(0, 5)} - {group.end_time.slice(0, 5)}</span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <motion.button
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            openExtendModal(group);
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Davomat vaqtini uzaytirish"
                        >
                          <Timer size={16} />
                        </motion.button>
                        <motion.button
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(group);
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Tahrirlash"
                        >
                          <Pen size={16} />
                        </motion.button>
                        <motion.button
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            showDeleteToast(group.id);
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="O'chirish"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredGroups.length === 0 && (
            <motion.div
              className="text-center py-12 text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Users size={48} className="mx-auto mb-3 text-gray-300" />
              <p>{searchTerm ? "Bunday guruh topilmadi" : errors.groups || "Hali guruh mavjud emas"}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Selected Group Details */}
        <motion.div
          className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {selectedGroup ? (
            <>
              {/* Header with actions */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BookOpen className="text-blue-600" size={24} />
                    {selectedGroup.group_subject}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">Guruh ma'lumotlari va davomat</p>
                </div>

                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => setSmsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={sendingSMS}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MessageSquare size={18} />
                    Guruhga SMS
                    {sendingSMS && <span className="animate-pulse">...</span>}
                  </motion.button>

                  <div className="relative">
                    <motion.button
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => setShowCalendar(!showCalendar)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Calendar size={18} />
                      Boshqa kun
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
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <motion.div
                  className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <CreditCard size={20} />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Oylik</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {paymentSummary
                      ? `${(paymentSummary.total_paid / 1000000).toFixed(1)}M so'm`
                      : "—"}
                  </p>
                  <p className="text-sm opacity-90">
                    To‘lov: {paymentSummary?.paid_count || 0} / {paymentSummary?.total_students || 0}
                  </p>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <GraduationCap size={20} />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Ustoz</span>
                  </div>
                  <p className="text-lg font-bold truncate">{teacher?.first_name} {teacher?.last_name}</p>
                  <p className="text-sm opacity-90">{teacher?.subject || "—"}</p>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Users size={20} />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">O‘quvchilar</span>
                  </div>
                  <p className="text-2xl font-bold">{groupStudents.length} nafar</p>
                  <p className="text-sm opacity-90">Guruhdagi o‘quvchilar</p>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <BarChart3 size={20} />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Davomat</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {Object.values(attendance).filter(att => att?.status === "present").length} / {groupStudents.length}
                  </p>
                  <p className="text-sm opacity-90">Hozirgi davomat</p>
                </motion.div>
              </div>

              {/* Attendance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <motion.div
                  className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                    <Award className="text-yellow-500" size={18} />
                    Haftalik davomat
                  </h3>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-800">
                        {attendanceSummary?.week?.percent ?? "—"}%
                      </p>
                      <p className="text-sm text-gray-500">
                        {attendanceSummary?.week?.present ?? 0} / {attendanceSummary?.week?.total ?? 0}
                      </p>
                    </div>
                    <div className="w-24 h-24 relative">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="3"
                          strokeDasharray={`${attendanceSummary?.week?.percent || 0}, 100`}
                        />
                      </svg>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                    <Award className="text-indigo-500" size={18} />
                    Oylik davomat
                  </h3>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-800">
                        {attendanceSummary?.month?.percent ?? "—"}%
                      </p>
                      <p className="text-sm text-gray-500">
                        {attendanceSummary?.month?.present ?? 0} / {attendanceSummary?.month?.total ?? 0}
                      </p>
                    </div>
                    <div className="w-24 h-24 relative">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#6366F1"
                          strokeWidth="3"
                          strokeDasharray={`${attendanceSummary?.month?.percent || 0}, 100`}
                        />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Date Info */}
              <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Calendar className="text-blue-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Tanlangan sana</p>
                    <p className="font-semibold text-gray-800">{formatDateWithDaysStart(selectedDate)}</p>
                  </div>
                </div>
                {attendanceTime && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>Yo‘qlama: {formatStartTime(attendanceTime)} da</span>
                  </div>
                )}
              </div>

              {/* Students Table */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Users size={20} className="text-blue-600" />
                  Guruhdagi o‘quvchilar
                </h3>

                {groupStudents.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                          <th className="p-3 text-left font-semibold">#</th>
                          <th className="p-3 text-left font-semibold">Ism Familiya</th>
                          <th className="p-3 text-left font-semibold">Telefon</th>
                          <th className="p-3 text-center font-semibold">Holat</th>
                          <th className="p-3 text-center font-semibold">Sabab</th>
                          <th className="p-3 text-center font-semibold">Izoh</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupStudents.map((student, index) => {
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
                              <td className="p-3 font-medium text-gray-800">
                                {student.first_name} {student.last_name}
                              </td>
                              <td className="p-3 text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Phone size={14} className="text-gray-400" />
                                  {student.phone_number || "N/A"}
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isPresent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                  {isPresent ? <Check size={12} /> : <X size={12} />}
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
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Users size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">Bu guruhda o‘quvchilar mavjud emas</p>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {attendanceData.length > 0 && (
                <div className="mt-6 space-y-4">
                  {attendanceData.map((day, idx) => {
                    const total = day.present + day.absent;
                    const percent = total > 0 ? Math.round((day.present / total) * 100) : 0;

                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-sm font-medium text-gray-700">
                          <span>Davomat foizi</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <motion.div
              className="h-[60vh] flex flex-col items-center justify-center text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Users size={80} className="mb-4 text-gray-300" />
              <p className="text-xl font-medium mb-2">Guruh tanlanmagan</p>
              <p className="text-sm">Iltimos, chap tomondan guruhni tanlang</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* SMS Modal */}
      <AnimatePresence>
        {smsModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <MessageSquare size={24} />
                  <h3 className="text-lg font-bold">Guruhga SMS yuborish</h3>
                </div>
                <motion.button
                  onClick={() => setSmsModalOpen(false)}
                  className="hover:bg-white/20 p-1 rounded-full transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-3">
                  <Users className="text-blue-600" size={20} />
                  <p className="text-gray-700">
                    <span className="font-semibold">{groupStudents.length}</span> ta o‘quvchiga yuboriladi
                  </p>
                </div>

                <textarea
                  className="w-full border border-gray-300 rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Xabar matnini kiriting..."
                  value={smsText}
                  onChange={e => setSmsText(e.target.value)}
                  maxLength={160}
                />

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Belgilar:</span>
                  <span className={`font-medium ${smsText.length > 140 ? 'text-orange-500' : 'text-gray-700'}`}>
                    {smsText.length} / 160
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <motion.button
                  className="px-5 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
                  onClick={() => setSmsModalOpen(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Bekor qilish
                </motion.button>
                <motion.button
                  className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  disabled={!smsText.trim() || sendingSMS}
                  onClick={handleSendSMStoGroup}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {sendingSMS ? "Yuborilmoqda..." : "SMS yuborish"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Group Modal */}
      <AnimatePresence>
        {addModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Plus size={24} />
                    <h3 className="text-xl font-bold">Yangi guruh qo'shish</h3>
                  </div>
                  <motion.button
                    onClick={() => setAddModal(false)}
                    className="hover:bg-white/20 p-1 rounded-full transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={20} />
                  </motion.button>
                </div>
                <p className="text-blue-100 text-sm mt-1">Yangi guruh ma'lumotlarini to'ldiring</p>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <form onSubmit={addGroup} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guruh nomi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={formData.group_subject}
                      onChange={(e) => setFormData({ ...formData, group_subject: e.target.value })}
                      placeholder="Masalan: Matematika 1-guruh"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        O'qituvchi <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                        Xona <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Dars kunlari <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {daysOfWeek.map((day) => (
                        <label
                          key={day}
                          className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all duration-200 ${formData.days.includes(day)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-gray-400"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.days.includes(day)}
                            onChange={() => handleDaysChange(day)}
                            className="hidden"
                          />
                          <div
                            className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${formData.days.includes(day)
                              ? "border-blue-500 bg-blue-500 text-white"
                              : "border-gray-400"
                              }`}
                          >
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Boshlanish vaqti <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tugash vaqti <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Oylik to'lov summasi (so'm) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={formData.monthly_fee}
                      onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
                      placeholder="Masalan: 225000"
                      min="0"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <motion.button
                      type="button"
                      onClick={() => setAddModal(false)}
                      className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Bekor qilish
                    </motion.button>
                    <motion.button
                      type="submit"
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium flex items-center gap-2"
                      disabled={formData.days.length === 0}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus size={18} />
                      Guruh qo'shish
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extend Time Modal */}
      <AnimatePresence>
        {extendModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Timer size={24} />
                    <h3 className="text-lg font-bold">Davomat vaqtini uzaytirish</h3>
                  </div>
                  <motion.button
                    onClick={() => setExtendModal(false)}
                    className="hover:bg-white/20 p-1 rounded-full transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={20} />
                  </motion.button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-gray-600">
                  <span className="font-semibold">{selectedGroupForExtension?.group_subject}</span> guruhi uchun davomat vaqtini uzaytiring
                </p>

                {extensionInfo && extensionInfo.extended_until && extensionInfo.extended_until > new Date().toISOString() && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <Check size={16} />
                      <span className="font-medium">Joriy uzaytirish mavjud:</span>
                    </div>
                    {(() => {
                      const date = new Date(extensionInfo.extended_until);
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

                      return (
                        <p className="text-sm text-blue-600">
                          {prefix}
                          {date.getDate()}-{monthsUZ[date.getMonth()].toLowerCase()} soat {date.getHours()}:00 gacha
                        </p>
                      );
                    })()}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sana <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      value={extensionData.date}
                      onChange={(e) => setExtensionData({ ...extensionData, date: e.target.value })}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vaqt <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      value={extensionData.time}
                      onChange={(e) => setExtensionData({ ...extensionData, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <AlertCircle size={16} />
                    ⏰ Tanlangan vaqtgacha yo'qlama qilish mumkin bo'ladi
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <motion.button
                  type="button"
                  className="px-5 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
                  onClick={() => setExtendModal(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Bekor qilish
                </motion.button>
                <motion.button
                  type="button"
                  className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                  onClick={extendAttendanceTime}
                  disabled={!extensionData.date || !extensionData.time}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Timer size={16} />
                  {extensionInfo ? "Vaqtni yangilash" : "Vaqtni uzaytirish"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Pen size={24} />
                    <h3 className="text-xl font-bold">Guruhni tahrirlash</h3>
                  </div>
                  <motion.button
                    onClick={() => setEditModal(false)}
                    className="hover:bg-white/20 p-1 rounded-full transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={20} />
                  </motion.button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <form onSubmit={updateGroup} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guruh nomi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      value={editFormData.group_subject}
                      onChange={(e) => setEditFormData({ ...editFormData, group_subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        O'qituvchi <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                        value={editFormData.teacher_id}
                        onChange={(e) => setEditFormData({ ...editFormData, teacher_id: e.target.value })}
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Xona <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                        value={editFormData.room_id}
                        onChange={(e) => setEditFormData({ ...editFormData, room_id: e.target.value })}
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Dars kunlari <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {daysOfWeek.map((day) => (
                        <label
                          key={day}
                          className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all duration-200 ${editFormData.days.includes(day)
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-300 hover:border-gray-400"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={editFormData.days.includes(day)}
                            onChange={() => handleDaysChange(day, true)}
                            className="hidden"
                          />
                          <div
                            className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${editFormData.days.includes(day)
                              ? "border-purple-500 bg-purple-500 text-white"
                              : "border-gray-400"
                              }`}
                          >
                            {editFormData.days.includes(day) && <Check size={14} />}
                          </div>
                          <span className="text-sm font-medium">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Boshlanish vaqti <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        value={editFormData.start_time}
                        onChange={(e) => setEditFormData({ ...editFormData, start_time: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tugash vaqti <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        value={editFormData.end_time}
                        onChange={(e) => setEditFormData({ ...editFormData, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Oylik to'lov summasi (so'm) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      value={editFormData.monthly_fee}
                      onChange={(e) => setEditFormData({ ...editFormData, monthly_fee: e.target.value })}
                      placeholder="Masalan: 200000"
                      min="0"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <motion.button
                      type="button"
                      className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors font-medium"
                      onClick={() => setEditModal(false)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Bekor qilish
                    </motion.button>
                    <motion.button
                      type="submit"
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Check size={18} />
                      Saqlash
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {success && (
          <motion.div
            className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <Check size={20} />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}