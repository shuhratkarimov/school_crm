"use client";

import { useState, useEffect } from "react";
import { Trash2, GraduationCap, Plus, Pen, X, Euro, Search, DollarSign } from "lucide-react";
import LottieLoading from "../components/Loading";
import { toast } from "react-hot-toast";
import API_URL from "../conf/api";

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [teacherPayments, setTeacherPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    teacher_id: "",
    payment_type: "avans",
    given_by: "",
    payment_amount: "",
  });
  const [groupsError, setGroupsError] = useState("");
  const [teachersError, setTeachersError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [salaryFilter, setSalaryFilter] = useState("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherGroups, setTeacherGroups] = useState([]);
  const [teacherBalances, setTeacherBalances] = useState({});

  const openDetailModal = async (teacher) => {
    setSelectedTeacher(teacher);
    const filteredGroups = groups
      .filter((group) => group.teacher_id === teacher.id)
      .map((group) => ({
        ...group,
        students_amount: students.filter((student) =>
          student.groups.some((g) => g.id === group.id)
        ).length,
      }));
    setTeacherGroups(filteredGroups);
    setIsDetailModalOpen(true);
    try {
      const res = await fetch(
        `${API_URL}/get_teacher_payments/${teacher.id}`,
        {
          credentials: "include"
        }
      );
      if (res.ok) {
        const data = await res.json();
        toast.success("To‘lovlarni olish muvaffaqiyatli amalga oshirildi");
        setTeacherPayments(data);
      } else {
        toast.error(`To‘lovlarni olishda xatolik: ${res.status}`);
        setTeacherPayments([]);
      }
    } catch (err) {
      toast.error("To‘lovlarni olishda xatolik");
      setTeacherPayments([]);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTeacher(null);
    setTeacherGroups([]);
  };

  const [editFormData, setEditFormData] = useState({
    id: "",
    first_name: "",
    last_name: "",
    father_name: "",
    birth_date: "",
    phone_number: "",
    subject: "",
    salary_amount: 0,
    got_salary_for_this_month: false,
    username: "",
    password: "",
    hashPassword: false,
  });

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    father_name: "",
    birth_date: "",
    phone_number: "",
    subject: "",
    salary_amount: 0,
    got_salary_for_this_month: false,
    username: "",
    password: "",
  });

  const fetchTeacherBalance = async (teacherId) => {
    try {
      const response = await fetch(
        `${API_URL}/get_teacher_balance/${teacherId}`,
        {
          credentials: "include"
        }
      );
      if (response.ok) {
        const balanceData = await response.json();
        return balanceData.balance;
      } else {
        toast.error(`Balansni olishda xatolik: ${response.status}`);
        return 0;
      }
    } catch (err) {
      toast.error("Balansni olishda xatolik", {
        position: "top-right",
        autoClose: 3000,
      });
      return 0;
    }
  };

  const formatMoney = (amount) =>
    `${Number(amount).toLocaleString("ru-RU")} so'm`;

  const fetchData = async () => {
    try {
      setLoading(true);
      setGroupsError("");
      setTeachersError("");

      const [
        groupsResponse,
        teachersResponse,
        studentsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/get_groups`, {
          credentials: "include"
        }).catch(() => ({
          ok: false,
        })),
        fetch(`${API_URL}/get_teachers`, {
          credentials: "include"
        }).catch(() => ({
          ok: false,
        })),
        fetch(`${API_URL}/get_students`, {
          credentials: "include"
        }).catch(() => ({
          ok: false,
        })),
      ]);

      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setGroups(groupsData);
      } else {
        setGroups([]);
        setGroupsError("Guruhlar hali mavjud emas");
        toast.error(`Guruhlar yuklanmadi: ${groupsResponse.status}`);
      }

      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json();
        setTeachers(teachersData);

        const balancePromises = teachersData.map(async (teacher) => {
          const balance = await fetchTeacherBalance(teacher.id);
          return { id: teacher.id, balance };
        });
        const balances = await Promise.all(balancePromises);
        const balanceMap = balances.reduce((acc, { id, balance }) => {
          acc[id] = balance;
          return acc;
        }, {});
        setTeacherBalances(balanceMap);
      } else {
        setTeachers([]);
        setTeachersError("Ustozlar hali mavjud emas");
        toast.error(`Ustozlar yuklanmadi: ${teachersResponse.status}`);
      }

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setStudents(studentsData.data);
      } else {
        setStudents([]);
        toast.error(`O'quvchilar yuklanmadi: ${studentsResponse.status}`);
      }
    } catch (err) {
      setGroups([]);
      setTeachers([]);
      setStudents([]);
      setGroupsError("Guruhlar hali mavjud emas");
      setTeachersError("Ustozlar hali mavjud emas");
      toast.error(`Ma'lumotlarni yuklashda umumiy xatolik yuz berdi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addTeacher = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${API_URL}/create_teacher`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: formData.first_name,
            last_name: formData.last_name,
            father_name: formData.father_name,
            birth_date: formData.birth_date,
            phone_number: formData.phone_number,
            subject: formData.subject,
            salary_amount: Number(formData.salary_amount),
            got_salary_for_this_month: formData.got_salary_for_this_month,
            username: formData.username,
            password: formData.password !== "********" && formData.password !== ""
              ? formData.password
              : null
          }),
          credentials: "include",
        }
      );

      if (response.ok) {
        const newTeacher = await response.json();
        setTeachers([...teachers, newTeacher]);
        // Yangi o'qituvchi uchun balansni olish
        const balance = await fetchTeacherBalance(newTeacher.id);
        setTeacherBalances((prev) => ({
          ...prev,
          [newTeacher.id]: balance,
        }));
        setFormData({
          first_name: "",
          last_name: "",
          father_name: "",
          birth_date: "",
          phone_number: "",
          subject: "",
          salary_amount: 0,
          got_salary_for_this_month: false,
          username: "",
          password: "",
        });
        setIsAddModalOpen(false);
        fetchData(); // Refresh data after add
        toast.success("Yangi ustoz muvaffaqiyatli qo'shildi!");
      } else {
        toast.error(`Ustoz qo'shishda xatolik: ${response.status}`);
      }
    } catch (err) {
      toast.error(`Ustoz qo'shishda xatolik: ${err.message}`);
    }
  };

  const updateTeacher = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${API_URL}/update_teacher/${editFormData.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: editFormData.first_name,
            last_name: editFormData.last_name,
            father_name: editFormData.father_name,
            birth_date: editFormData.birth_date,
            phone_number: editFormData.phone_number,
            subject: editFormData.subject,
            salary_amount: Number(editFormData.salary_amount),
            got_salary_for_this_month: editFormData.got_salary_for_this_month,
            username: editFormData.username,
            password:
              editFormData.password &&
                editFormData.password !== "********" &&
                editFormData.password !== ""
                ? editFormData.password
                : null,
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        toast.error(`Xatolik yuz berdi: ${response.status}`);
      }
      else {
        fetchData();
        toast.success("O‘qituvchi ma’lumotlari yangilandi");
      }
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error(`Yangilashda muammo yuz berdi: ${error.message}`);
      console.error(error);
    }
  };

  const deleteTeacher = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/delete_teacher/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        toast.success("Ustoz muvaffaqiyatli o'chirildi");
        setTeachers(teachers.filter((t) => t.id !== id));
        setTeacherBalances((prev) => {
          const newBalances = { ...prev };
          delete newBalances[id];
          return newBalances;
        });
        toast.success("Ustoz muvaffaqiyatli o'chirildi");
      } else {
        toast.error(`Ustoz o'chirishda xatolik: ${response.status}`);
      }
    } catch (err) {
      toast.error(`Ustoz o'chirishda xatolik: ${err.message}`);
    }
  };

  const openPaymentModal = (teacher) => {
    setPaymentFormData({ ...paymentFormData, teacher_id: teacher.id });
    setIsPaymentModalOpen(true);
  };

  const addPayment = async (e) => {
    e.preventDefault();
    try {
      const currentBalance = teacherBalances[paymentFormData.teacher_id] || 0;
      if (Number(paymentFormData.payment_amount) > currentBalance) {
        toast.error(
          `Kiritilgan summa ustoz balansidan katta!\nBalans: ${currentBalance.toLocaleString(
            "uz-UZ"
          )} so'm`
        );
        return;
      }
      else if (Number(paymentFormData.payment_amount) < 1000) {
        toast.error(
          `Kamida 1000 so'm kiritish shart!`
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/create_payment_teacher`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacher_id: paymentFormData.teacher_id,
            payment_type: paymentFormData.payment_type,
            given_by: paymentFormData.given_by,
            payment_amount: Number(paymentFormData.payment_amount),
            given_date: new Date().toISOString(),
          }),
          credentials: "include",
        }
      );

      if (response.ok) {
        const newPayment = await response.json();
        setTeacherPayments([...teacherPayments, newPayment]);
        const updatedBalance = await fetchTeacherBalance(
          paymentFormData.teacher_id
        );
        setTeacherBalances((prev) => ({
          ...prev,
          [paymentFormData.teacher_id]: updatedBalance,
        }));
        toast.success("To'lov muvaffaqiyatli qo'shildi!");
        setIsPaymentModalOpen(false);
        setPaymentFormData({
          teacher_id: "",
          payment_type: "avans",
          given_by: "",
          payment_amount: "",
        });
      } else {
        toast.error(`To'lov qo'shishda xatolik: ${response.status}`);
      }
    } catch (err) {
      toast.error(`To'lov qo'shishda xatolik: ${err.message}`);
    }
  };

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>
          Diqqat! Ushbu ustozga tegishli barcha ma'lumotlar o'chiriladi!
          O'chirishga ishonchingiz komilmi?
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
              deleteTeacher(id);
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

  const openEditModal = async (teacher) => {
    setEditFormData({
      id: teacher.id,
      first_name: teacher.first_name || "",
      last_name: teacher.last_name || "",
      father_name: teacher.father_name || "",
      birth_date: teacher.birth_date || "",
      phone_number: teacher.phone_number || "",
      subject: teacher.subject || "",
      salary_amount: teacher.salary_amount || 0,
      got_salary_for_this_month: teacher.got_salary_for_this_month || false,
      username: teacher.username || "",
      password: teacher.password ? "********" : "",
      hashPassword: teacher.password || false,
    });
    setIsEditModalOpen(true);
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const nameMatch = `${teacher.first_name} ${teacher.last_name} ${teacher.father_name || ""
      }`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const subjectMatch =
      subjectFilter === "all" || teacher.subject === subjectFilter;
    const salaryMatch =
      salaryFilter === "all" ||
      (salaryFilter === "paid" && teacher.got_salary_for_this_month) ||
      (salaryFilter === "unpaid" && !teacher.got_salary_for_this_month);

    return nameMatch && subjectMatch && salaryMatch;
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
    if (groupsError || teachersError) {
      const timer = setTimeout(() => {
        setGroupsError("");
        setTeachersError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, groupsError, teachersError]);

  if (loading) {
    return <LottieLoading />;
  }

  return (
    <div>
      <div className="flex justify-between items-center gap-2 pl-6 pr-6 mb-6">
        <div className="flex items-center gap-2">
          <GraduationCap size={24} color="#104292" />
          <h1 className="text-2xl font-bold">Ustozlar</h1>
        </div>
        <button
          className="btn btn-primary bg-[#104292] hover:bg-[#104292]/80"
          onClick={() => setIsAddModalOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Plus size={20} />
          Yangi ustoz qo'shish
        </button>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-[#104292] px-6 py-4 text-white">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <Plus size={22} />
                Yangi ustoz qo'shish
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-2 transition-colors hover:bg-[#104292]/80"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={addTeacher} className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ism <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    placeholder="Ustoz ismi"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Familiya <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    placeholder="Ustoz familiyasi"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Otasining ismi
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={formData.father_name}
                    onChange={(e) =>
                      setFormData({ ...formData, father_name: e.target.value })
                    }
                    placeholder="Otasining ismi (ixtiyoriy)"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tug'ilgan sana <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={formData.birth_date}
                    onChange={(e) =>
                      setFormData({ ...formData, birth_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Telefon raqami <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_number: e.target.value })
                    }
                    placeholder="+998 (__) ___-__-__"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Fan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    placeholder="O'qitadigan fani"
                    required
                  />
                </div>

                {/* Kerak bo‘lsa keyin qo‘shish uchun joy qoldirdim:
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Oylik summasi
            </label>
            <input
              type="number"
              className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
              value={formData.salary_amount}
              onChange={(e) =>
                setFormData({ ...formData, salary_amount: e.target.value })
              }
              placeholder="Masalan: 3000000"
            />
          </div>
          */}
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  className="px-5 py-2 bg-gray-200 text-gray-700 transition hover:bg-gray-300"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Bekor qilish
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#104292] px-5 py-2 text-white transition hover:bg-[#0d3677]"
                >
                  <Plus size={18} />
                  Ustoz qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-[#104292] px-6 py-4 text-white">
              <h2 className="text-xl font-bold">To'lov qo'shish</h2>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="rounded-full p-2 transition-colors hover:bg-blue-700"
              >
                <X size={22} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={addPayment} className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    To'lov turi <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={paymentFormData.payment_type}
                    onChange={(e) =>
                      setPaymentFormData({
                        ...paymentFormData,
                        payment_type: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="avans">Avans</option>
                    <option value="hisob">Hisob</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Kim tomonidan berildi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={paymentFormData.given_by}
                    onChange={(e) =>
                      setPaymentFormData({
                        ...paymentFormData,
                        given_by: e.target.value,
                      })
                    }
                    placeholder="Masalan: Direktor"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    To'lov summasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={paymentFormData.payment_amount}
                    onChange={(e) =>
                      setPaymentFormData({
                        ...paymentFormData,
                        payment_amount: e.target.value,
                      })
                    }
                    placeholder="Masalan: 500000"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  className="px-5 py-2 bg-gray-200 text-gray-700 transition hover:bg-gray-300"
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#104292] text-white transition hover:bg-[#0d3677]"
                >
                  To'lov qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-[#104292] px-6 py-4 text-white">
              <h2 className="text-2xl font-bold">Ustoz ma'lumotlarini yangilash</h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-full p-2 transition-colors hover:bg-blue-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={updateTeacher} className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ism <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={editFormData.first_name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        first_name: e.target.value,
                      })
                    }
                    placeholder="Ustoz ismi"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Familiya <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={editFormData.last_name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        last_name: e.target.value,
                      })
                    }
                    placeholder="Ustoz familiyasi"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Otasining ismi
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={editFormData.father_name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        father_name: e.target.value,
                      })
                    }
                    placeholder="Otasining ismi (ixtiyoriy)"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tug'ilgan sana <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={editFormData.birth_date}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        birth_date: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Telefon raqami <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={editFormData.phone_number}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        phone_number: e.target.value,
                      })
                    }
                    placeholder="+998 (__) ___-__-__"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Fan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={editFormData.subject}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        subject: e.target.value,
                      })
                    }
                    placeholder="O'qitadigan fani"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Foydalanuvchi nomi
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={editFormData.username || ""}
                    onFocus={(e) => {
                      if (e.target.value === "") {
                        setEditFormData({ ...editFormData, username: "" });
                      }
                    }}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        username: e.target.value,
                      })
                    }
                    placeholder="Foydalanuvchi nomi yo'q"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Parol
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={editFormData.password}
                    onFocus={(e) => {
                      if (e.target.value === "********" || e.target.value === "") {
                        setEditFormData({ ...editFormData, password: "" });
                      }
                    }}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        password: e.target.value,
                        hasPassword: true,
                      })
                    }
                    placeholder="Parol o'rnatilmagan"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  className="px-5 py-2 bg-gray-200 text-gray-700 transition hover:bg-gray-300"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#104292] text-white transition hover:bg-[#0d3677]"
                >
                  Yangilash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-[#104292] px-6 py-4 text-white">
              <h2 className="text-2xl font-bold">Ustoz ma'lumotlari</h2>
              <button
                onClick={closeDetailModal}
                className="rounded-full p-2 transition-colors hover:bg-blue-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Asosiy ma'lumotlar */}
              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="border border-blue-100 bg-blue-50 p-5">
                  <h3 className="mb-4 text-lg font-semibold text-blue-800">
                    Shaxsiy ma'lumotlar
                  </h3>

                  <div className="space-y-3">
                    <div className="flex">
                      <span className="w-1/3 text-sm font-medium text-gray-600">Ism:</span>
                      <span className="flex-1 font-medium text-gray-800">
                        {selectedTeacher.first_name || "—"}
                      </span>
                    </div>

                    <div className="flex">
                      <span className="w-1/3 text-sm font-medium text-gray-600">Familiya:</span>
                      <span className="flex-1 font-medium text-gray-800">
                        {selectedTeacher.last_name || "—"}
                      </span>
                    </div>

                    <div className="flex">
                      <span className="w-1/3 text-sm font-medium text-gray-600">Otasining ismi:</span>
                      <span className="flex-1 font-medium text-gray-800">
                        {selectedTeacher.father_name || "Mavjud emas"}
                      </span>
                    </div>

                    <div className="flex">
                      <span className="w-1/3 text-sm font-medium text-gray-600">Tug'ilgan sana:</span>
                      <span className="flex-1 font-medium text-gray-800">
                        {selectedTeacher.birth_date
                          ? new Date(selectedTeacher.birth_date).toLocaleDateString("ru-RU")
                          : "—"}
                      </span>
                    </div>

                    <div className="flex">
                      <span className="w-1/3 text-sm font-medium text-gray-600">Telefon:</span>
                      <span className="flex-1 font-medium text-gray-800">
                        {selectedTeacher.phone_number || "—"}
                      </span>
                    </div>

                    <div className="flex">
                      <span className="w-1/3 text-sm font-medium text-gray-600">Fan:</span>
                      <span className="flex-1 font-medium text-gray-800">
                        {selectedTeacher.subject || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-green-100 bg-green-50 p-5">
                  <h3 className="mb-4 text-lg font-semibold text-green-800">
                    Ish faoliyati
                  </h3>

                  <div className="space-y-4">
                    <div className="border border-green-200 bg-white p-4">
                      <p className="mb-1 text-sm font-medium text-gray-500">
                        Joriy balans
                      </p>
                      <p className="text-2xl font-bold text-green-700">
                        {(teacherBalances[selectedTeacher.id] || 0).toLocaleString("ru-RU")} so'm
                      </p>
                    </div>

                    <div className="border border-green-200 bg-white p-4">
                      <p className="mb-1 text-sm font-medium text-gray-500">
                        Guruhlar soni
                      </p>
                      <p className="text-2xl font-bold text-[#104292]">
                        {teacherGroups.length} ta
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* To'lovlar tarixi */}
              <div className="mb-8">
                <h3 className="mb-4 text-xl font-semibold text-gray-800">
                  To'lovlar tarixi
                </h3>

                {teacherPayments.filter((p) => p.teacher_id === selectedTeacher.id).length > 0 ? (
                  <div className="overflow-hidden border border-gray-300 bg-white">
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-[15px]">
                        <thead className="bg-[#104292] text-white">
                          <tr>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">#</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">To'lov turi</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Summasi</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Kim tomonidan</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Sana</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teacherPayments
                            .filter((p) => p.teacher_id === selectedTeacher.id)
                            .map((payment, index) => (
                              <tr key={payment.id} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  {index + 1}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  {payment.payment_type === "avans" ? "Avans" : "Hisob"}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center font-medium">
                                  {formatMoney(payment.payment_amount)}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  {payment.given_by || "—"}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  {payment.given_date
                                    ? new Date(payment.given_date).toLocaleDateString("ru-RU")
                                    : "—"}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
                    To'lovlar tarixi mavjud emas
                  </div>
                )}
              </div>

              {/* Guruhlar */}
              <div>
                <h3 className="mb-4 text-xl font-semibold text-gray-800">
                  Guruhlar ({teacherGroups.length} ta)
                </h3>

                {teacherGroups.length > 0 ? (
                  <div className="overflow-hidden border border-gray-300 bg-white">
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-[15px]">
                        <thead className="bg-[#104292] text-white">
                          <tr>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">#</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Guruh nomi</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">O'quvchilar soni</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Kunlari</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teacherGroups.map((group, index) => (
                            <tr key={group.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                {index + 1}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center font-medium">
                                {group.group_subject}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                {group.students_amount || 0}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                {group.days || "Mavjud emas"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
                    Ustozga hozircha guruh biriktirilmagan
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 p-6 sm:flex-row sm:justify-end">
              <button
                className="px-5 py-2 bg-green-600 text-white transition hover:bg-green-700"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openPaymentModal(selectedTeacher);
                }}
              >
                To'lov qo'shish
              </button>

              <button
                className="px-5 py-2 bg-[#104292] text-white transition hover:bg-[#0d3677]"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openEditModal(selectedTeacher);
                }}
              >
                Tahrirlash
              </button>

              <button
                className="px-5 py-2 bg-gray-200 text-gray-700 transition hover:bg-gray-300"
                onClick={closeDetailModal}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5"
        >
          <h3 className="font-bold text-[1.2rem]">
            Bizning ustozlar ({filteredTeachers.length} nafar)
          </h3>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 border border-gray-300 px-3 py-2 bg-white min-w-[240px]">
              <Search size={18} color="#104292" />
              <input
                type="text"
                className="w-full outline-none text-sm"
                placeholder="Ustozni qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Subject filter */}
            <select
              className="border border-gray-300 px-4 py-2 bg-white text-sm min-w-[180px] outline-none focus:border-[#104292]"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="all">Barcha fanlar</option>
              {[...new Set(teachers.map((t) => t.subject).filter(Boolean))].map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>

            {/* Salary filter */}
            <select
              className="border border-gray-300 px-4 py-2 bg-white text-sm min-w-[180px] outline-none focus:border-[#104292]"
              value={salaryFilter}
              onChange={(e) => setSalaryFilter(e.target.value)}
            >
              <option value="all">Barcha holatlar</option>
              <option value="paid">Oyligi berilgan</option>
              <option value="unpaid">Oyligi berilmagan</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden border border-gray-300 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-[16px]">
              <thead className="bg-[#104292] text-white">
                <tr>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">#</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">F.I.Sh.</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Tug'ilgan sana</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Fan</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Guruhlar</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Joriy balans</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Amallar</th>
                </tr>
              </thead>

              <tbody>
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="border border-gray-300 py-12 text-center text-gray-500"
                    >
                      {searchTerm || subjectFilter !== "all" || salaryFilter !== "all"
                        ? "Qidiruv bo'yicha natija topilmadi"
                        : teachersError || "Hali ustozlar qo'shilmagan"}
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher, index) => {
                    const groupsCount = groups.filter(
                      (g) => g.teacher_id === teacher.id
                    ).length;

                    return (
                      <tr
                        key={teacher.id}
                        onClick={() => openDetailModal(teacher)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="border border-gray-300 px-4 py-3 text-center font-medium">
                          {index + 1}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                          {teacher.first_name} {teacher.last_name}{" "}
                          {teacher.father_name || ""}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">
                          {teacher.birth_date
                            ? new Date(teacher.birth_date).toLocaleDateString("ru-RU")
                            : "N/A"}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">
                          {teacher.subject || "N/A"}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">
                          {groupsCount} ta
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-900">
                          {formatMoney(teacherBalances[teacher.id] || 0)}
                        </td>

                        <td
                          className="border border-gray-300 px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-center gap-2">
                            <button
                              className="h-9 w-9 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white transition"
                              onClick={() => openPaymentModal(teacher)}
                              title="To'lov qilish"
                            >
                              <DollarSign size={16} />
                            </button>

                            <button
                              className="h-9 w-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white transition"
                              onClick={() => openEditModal(teacher)}
                              title="Tahrirlash"
                            >
                              <Pen size={16} />
                            </button>

                            <button
                              className="h-9 w-9 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white transition"
                              onClick={() => showDeleteToast(teacher.id)}
                              title="O'chirish"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Teachers;