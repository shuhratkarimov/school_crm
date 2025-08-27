"use client";

import { useState, useEffect } from "react";
import { Trash2, Pen, BookOpen, Plus, X, Search } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LottieLoading from "../components/Loading";
import "../index.css";

function Groups() {
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
        console.log("Backenddan kelgan days:", groupsData.map(g => g.days));
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
    return groups.some((group) => {
      if (group.room_id !== roomId || (excludeGroupId && group.id === excludeGroupId)) return false;

      const existingDays = group.days.split("-");
      const hasCommonDay = days.some((day) => existingDays.includes(day));
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
    // Joriy oyni aniqlash
    const currentMonth = getMonthsInWord(new Date().getMonth() + 1); // Masalan, "IYUN"

    // Guruhdagi jami o‘quvchilar
    const groupStudents = students.filter((student) =>
      student.groups.some((group) => group.id === groupId)
    );
    const studentsAmount = groupStudents.length;

    // Joriy oy uchun to‘lov qilgan o‘quvchilar
    const paidStudents = payments.filter(
      (payment) =>
        payment.for_which_group === groupId &&
        payment.for_which_month.toUpperCase() === currentMonth
    );
    const paidStudentsAmount = paidStudents.length;

    // To‘lov qilmaganlar
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

  if (loading) {
    return <LottieLoading />;
  }

  return (
    <div>
      <ToastContainer />
      <div className="flex justify-between gap-2 pl-6 pr-6">
        <div className="flex items-center gap-2">
          <BookOpen size={24} color="#104292" />
          <span className="text-2xl font-bold">Guruhlar</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <button
            className="btn btn-primary"
            onClick={() => setAddModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Plus size={20} />
            Yangi guruh qo'shish
          </button>
        </div>
      </div>

      {/* Mavjud guruhlar ro‘yxati */}
      <div className="p-6 grid">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-xl font-bold">
            Mavjud guruhlar ({filteredGroups.length} ta)
          </h3>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", border: "1px solid #ccc", borderRadius: "5px", padding: "5px" }}>
              <Search size={22} color="#104292" style={{ marginLeft: "12px" }} />
              <input
                type="text"
                className="input"
                style={{ width: "170px", border: "none", outline: "none" }}
                placeholder="Guruhni qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        </div>

        {filteredGroups.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {searchTerm ? "Bunday guruh topilmadi" : errors.groups || "Hali mavjud emas"}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => {
              const teacher = teachers?.find((t) => t.id === group?.teacher_id);
              const room = rooms.find((r) => r.id == group?.room_id);

              return (
                <div
                  key={group.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer flex flex-col"
                  onClick={() => setSelectedGroup(group)}
                >
                  {/* Header */}
                  <div className="bg-blue-800 text-white px-4 py-3 rounded-t-lg">
                    <h4 className="font-semibold text-center text-xl ">{group.group_subject}</h4>
                  </div>

                  {/* Body: 2 ustunli jadval ko'rinishida */}
                  <div className="p-4 flex-1">
                    <div className="grid grid-cols-[35%_65%] gap-x-4 gap-y-2">
                      <span className="font-semibold text-black">O'qituvchi:</span>
                      <span className="text-black font-semibold">
                        {teacher ? `${teacher.first_name} ${teacher.last_name}` : errors.teachers || "N/A"}
                      </span>

                      <span className="font-semibold text-black">Xona:</span>
                      <span className="text-black font-semibold">{room ? room.name : errors.rooms || "Belgilanmagan"}</span>

                      <span className="font-semibold text-black">Dars kunlari:</span>
                      <span className="text-black break-all font-semibold">{group.days || "Belgilanmagan"}</span>
                      <span className="font-semibold text-black">Dars vaqti:</span>
                      <span className="text-black font-semibold">
                        {group.start_time?.slice(0, 5)} - {group.end_time?.slice(0, 5)}
                      </span>

                      <span className="font-semibold text-black">O'quvchilar soni:</span>
                      <span className="text-black font-semibold">{group.studentsAmount || 0}</span>

                      <span className="font-semibold text-black">To'lov qilganlar:</span>
                      <span className="text-black font-semibold">{group.paidStudentsAmount || 0}</span>

                      <span className="font-semibold text-black">To'lov qilmaganlar:</span>
                      <span className="text-black font-semibold">{group.unpaidStudentsAmount || 0}</span>

                      <span className="font-semibold text-black">Oylik to'lov:</span>
                      <span className="text-black font-semibold">
                        {group.monthly_fee ? `${Number(group.monthly_fee).toLocaleString("uz-UZ")} so'm` : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Tugmalar pastda */}
                  <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
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
              );
            })}
          </div>
        )}
      </div>
      {addModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header bg-[#104292] p-2 text-white rounded-[10px]">
              <h3 className="text-center text-lg font-bold">Yangi guruh qo'shish</h3>
            </div>
            <form onSubmit={addGroup}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Guruh nomi</label>
                  <input
                    type="text"
                    className="input"
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
                    className="select"
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
                    className="select"
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
                <div className="form-group">
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
                    className="input"
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
                    className="input"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Oylik to'lov summasi (so'm)</label>
                  <input
                    type="number"
                    className="input"
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
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAddModal(false)}
                >
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tahrirlash modal oynasi */}
      {editModal && (
        <div className="modal" onClick={() => setEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Guruhni tahrirlash</h3>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditModal(false)}
                style={{ float: "right", padding: "4px 8px" }}
              >
                Yopish
              </button>
            </div>
            <form onSubmit={updateGroup}>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Guruh nomi</label>
                <input
                  type="text"
                  className="input"
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
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>O'qituvchi</label>
                <select
                  className="select"
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
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Xona</label>
                <select
                  className="select"
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
              <div className="form-group" style={{ marginBottom: "16px" }}>
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
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Boshlanish vaqti</label>
                <input
                  type="time"
                  className="input"
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
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Tugash vaqti</label>
                <input
                  type="time"
                  className="input"
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
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Oylik to'lov summasi (so'm)</label>
                <input
                  type="number"
                  className="input"
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
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditModal(false)}
                >
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guruh haqida ma'lumot modal oynasi */}
      {selectedGroup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedGroup(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-bold">Guruh haqida ma'lumot</h3>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setSelectedGroup(null)}
                style={{ float: "right", padding: "8px", borderRadius: "50%" }}
              >
                <X />
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-4">
              {/* Guruh haqida ma'lumotlar */}
              <div className="grid grid-cols-2 gap-4">
                <span className="font-semibold text-gray-700">Guruh nomi:</span>
                <span className="text-gray-900">{selectedGroup.group_subject}</span>

                <span className="font-semibold text-gray-700">Xona:</span>
                <span className="text-gray-900">
                  {rooms.find((r) => r.id === selectedGroup.room_id)?.name || "Belgilanmagan"}
                </span>

                <span className="font-semibold text-gray-700">Dars kunlari:</span>
                <span className="text-gray-900 break-words">{selectedGroup.days || "Belgilanmagan"}</span>
                <span className="font-semibold text-gray-700">Dars vaqti:</span>
                <span className="text-gray-900">
                  {`${selectedGroup.start_time.slice(0, 5)} - ${selectedGroup.end_time.slice(0, 5)}`}
                </span>

                <span className="font-semibold text-gray-700">O'quvchilar soni:</span>
                <span className="text-gray-900">
                  {selectedGroup.studentsAmount ? `${selectedGroup.studentsAmount} nafar` : errors.students || "0"}
                </span>

                <span className="font-semibold text-gray-700">To'lov qilganlar soni ({getMonthsInWord(new Date().getMonth() + 1)}):</span>
                <span className="text-gray-900">
                  {selectedGroup.paidStudentsAmount ? `${selectedGroup.paidStudentsAmount} nafar` : errors.payments || "0"}
                </span>

                <span className="font-semibold text-gray-700">To'lov qilmaganlar soni:</span>
                <span className="text-gray-900">
                  {selectedGroup.unpaidStudentsAmount ? `${selectedGroup.unpaidStudentsAmount} nafar` : errors.students || "0"}
                </span>

                <span className="font-semibold text-gray-700">Oylik to'lov summasi:</span>
                <span className="text-gray-900">
                  {selectedGroup.monthly_fee ? `${Number(selectedGroup.monthly_fee).toLocaleString("uz-UZ")} so'm` : "N/A"}
                </span>
              </div>

              {/* O'qituvchi haqida ma'lumotlar */}
              <h4 className="mt-4 text-lg font-semibold border-t pt-2">O'qituvchi ma'lumotlari</h4>
              {teachers.length === 0 ? (
                <p className="text-gray-700">{errors.teachers || "O'qituvchi ma'lumotlari yo'q"}</p>
              ) : (
                teachers
                  .filter((teacher) => teacher.id === selectedGroup.teacher_id)
                  .map((teacher) => (
                    <div key={teacher.id} className="grid grid-cols-2 gap-4 mt-2">
                      <span className="font-semibold text-gray-700">F.I.Sh:</span>
                      <span className="text-gray-900">{`${teacher.first_name} ${teacher.last_name}`}</span>

                      <span className="font-semibold text-gray-700">Telefon raqami:</span>
                      <span className="text-gray-900">{teacher.phone_number}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Groups;