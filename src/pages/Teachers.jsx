"use client";

import { useState, useEffect } from "react";
import { Trash2, GraduationCap, Plus, Pen, X, Euro } from "lucide-react";
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
        `${API_URL}/get_teacher_payments/${teacher.id}`
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
        `${API_URL}/get_teacher_balance/${teacherId}`
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
        fetch(`${API_URL}/get_groups`).catch(() => ({
          ok: false,
        })),
        fetch(`${API_URL}/get_teachers`).catch(() => ({
          ok: false,
        })),
        fetch(`${API_URL}/get_students`).catch(() => ({
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
        setStudents(studentsData);
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
            password: formData.password !== "********" && formData.password !== "O‘rnatilmagan"
              ? formData.password
              : null
          }),
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
                editFormData.password !== "O‘rnatilmagan"
                ? editFormData.password
                : null,
          }),
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
      password: teacher.password ? "********" : "O‘rnatilmagan",
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
          className="btn btn-primary"
          onClick={() => setIsAddModalOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Plus size={20} />
          Yangi ustoz qo'shish
        </button>
      </div>

      {isAddModalOpen && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "#fff",
              padding: "0",
              borderRadius: "12px",
              width: "600px",
              maxWidth: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: "1px solid #eaeaea",
                backgroundColor: "#f9fafb",
                borderTopLeftRadius: "12px",
                borderTopRightRadius: "12px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontWeight: "600",
                  fontSize: "1.25rem",
                  color: "#104292",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Plus size={22} />
                Yangi ustoz qo'shish
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: "4px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseOver={(e) => (e.target.style.color = "#374151")}
                onMouseOut={(e) => (e.target.style.color = "#6b7280")}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={addTeacher}>
              <div
                style={{
                  padding: "24px",
                }}
              >
                <div
                  className="form-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <div className="form-group">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: "500",
                        color: "#374151",
                        fontSize: "0.875rem",
                      }}
                    >
                      Ism *
                    </label>
                    <input
                      type="text"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        transition: "border-color 0.2s",
                      }}
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      placeholder="Ustoz ismi"
                      required
                      onFocus={(e) => (e.target.style.borderColor = "#104292")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                    />
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: "500",
                        color: "#374151",
                        fontSize: "0.875rem",
                      }}
                    >
                      Familiya *
                    </label>
                    <input
                      type="text"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        transition: "border-color 0.2s",
                      }}
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      placeholder="Ustoz familiyasi"
                      required
                      onFocus={(e) => (e.target.style.borderColor = "#104292")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                    />
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: "500",
                        color: "#374151",
                        fontSize: "0.875rem",
                      }}
                    >
                      Otasining ismi
                    </label>
                    <input
                      type="text"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        transition: "border-color 0.2s",
                      }}
                      value={formData.father_name}
                      onChange={(e) =>
                        setFormData({ ...formData, father_name: e.target.value })
                      }
                      placeholder="Otasining ismi (ixtiyoriy)"
                      onFocus={(e) => (e.target.style.borderColor = "#104292")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                    />
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: "500",
                        color: "#374151",
                        fontSize: "0.875rem",
                      }}
                    >
                      Tug'ilgan sana *
                    </label>
                    <input
                      type="date"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        transition: "border-color 0.2s",
                      }}
                      value={formData.birth_date}
                      onChange={(e) =>
                        setFormData({ ...formData, birth_date: e.target.value })
                      }
                      required
                      onFocus={(e) => (e.target.style.borderColor = "#104292")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                    />
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: "500",
                        color: "#374151",
                        fontSize: "0.875rem",
                      }}
                    >
                      Telefon raqami *
                    </label>
                    <input
                      type="tel"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        transition: "border-color 0.2s",
                      }}
                      value={formData.phone_number}
                      onChange={(e) =>
                        setFormData({ ...formData, phone_number: e.target.value })
                      }
                      placeholder="+998 (__) ___-__-__"
                      required
                      onFocus={(e) => (e.target.style.borderColor = "#104292")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                    />
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontWeight: "500",
                        color: "#374151",
                        fontSize: "0.875rem",
                      }}
                    >
                      Fan *
                    </label>
                    <input
                      type="text"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        transition: "border-color 0.2s",
                      }}
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      placeholder="O'qitadigan fani"
                      required
                      onFocus={(e) => (e.target.style.borderColor = "#104292")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  padding: "16px 24px",
                  borderTop: "1px solid #eaeaea",
                  backgroundColor: "#f9fafb",
                  borderBottomLeftRadius: "12px",
                  borderBottomRightRadius: "12px",
                }}
              >
                <button
                  type="button"
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    transition: "background-color 0.2s",
                  }}
                  onClick={() => setIsAddModalOpen(false)}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#4b5563")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#6b7280")}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#104292",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "background-color 0.2s",
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#0d366e")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#104292")}
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
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "10px",
              width: "400px",
              maxWidth: "90%",
            }}
          >
            <h3 style={{ marginBottom: "16px", textAlign: "center", fontSize: "1.3rem", fontWeight: "700" }}>To'lov qo'shish</h3>
            <form onSubmit={addPayment}>
              <div className="form-group">
                <label>To'lov turi</label>
                <select
                  className="input"
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
              <div className="form-group">
                <label>Kim tomonidan berildi</label>
                <input
                  type="text"
                  className="input"
                  value={paymentFormData.given_by}
                  onChange={(e) =>
                    setPaymentFormData({
                      ...paymentFormData,
                      given_by: e.target.value,
                    })
                  }
                  placeholder="Kim tomonidan berildi"
                  required
                />
              </div>
              <div className="form-group">
                <label>To'lov summasi</label>
                <input
                  type="number"
                  className="input"
                  value={paymentFormData.payment_amount}
                  onChange={(e) =>
                    setPaymentFormData({
                      ...paymentFormData,
                      payment_amount: e.target.value,
                    })
                  }
                  placeholder="To'lov summasi"
                  min="0"
                  required
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "16px",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary">
                  To'lov qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "10px",
              width: "500px",
              maxWidth: "90%",
            }}
          >
            <h3 style={{ marginBottom: "16px", textAlign: "center", fontSize: "1.3rem", fontWeight: "700" }}>
              Ustoz ma'lumotlarini yangilash
            </h3>
            <form onSubmit={updateTeacher}>
              <div
                className="form-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                  padding: "12px",
                }}
              >
                <div className="form-group">
                  <label>Ism</label>
                  <input
                    type="text"
                    className="input"
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
                <div className="form-group">
                  <label>Familiya</label>
                  <input
                    type="text"
                    className="input"
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
                <div className="form-group">
                  <label>Otasining ismi</label>
                  <input
                    type="text"
                    className="input"
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
                <div className="form-group">
                  <label>Tug'ilgan sana</label>
                  <input
                    type="date"
                    className="input"
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
                <div className="form-group">
                  <label>Telefon raqami</label>
                  <input
                    type="tel"
                    className="input"
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
                <div className="form-group">
                  <label>Fan</label>
                  <input
                    type="text"
                    className="input"
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
                <div className="form-group">
                  <label>Foydalanuvchi nomi</label>
                  <input
                    type="text"
                    className="input"
                    value={editFormData.username || "O‘rnatilmagan"}
                    onFocus={(e) => {
                      if (e.target.value === "O‘rnatilmagan") {
                        setEditFormData({ ...editFormData, username: "" });
                      }
                    }}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        username: e.target.value,
                      })
                    }
                    placeholder="Foydalanuvchi nomini kiriting"
                  />
                </div>
                <div className="form-group">
                  <label>Parol</label>
                  <input
                    type="text"
                    className="input"
                    value={editFormData.password}
                    onFocus={(e) => {
                      if (e.target.value === "********" || e.target.value === "O‘rnatilmagan") {
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
                    placeholder="Yangi parol kiriting"
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "16px",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary">
                  Yangilash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedTeacher && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "10px",
              width: "800px",
              maxWidth: "95%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "end",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <button
                onClick={closeDetailModal}
                style={{
                  background: "red",
                  border: "none",
                  cursor: "pointer",
                  color: "#fff",
                  padding: "8px",
                  borderRadius: "50%",
                }}
              >
                <X size={24} />
              </button>
            </div>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", textAlign: "center" }}>Ustoz ma'lumotlari</h2>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "8px", border: "1px solid #ddd", fontWeight: "bold" }}>Ism</td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>{selectedTeacher.first_name}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px", border: "1px solid #ddd", fontWeight: "bold" }}>Familiya</td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>{selectedTeacher.last_name}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px", border: "1px solid #ddd", fontWeight: "bold" }}>Otasining ismi</td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>{selectedTeacher.father_name || "Mavjud emas"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px", border: "1px solid #ddd", fontWeight: "bold" }}>Tug'ilgan sana</td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                      {new Date(selectedTeacher.birth_date).toLocaleDateString("ru-RU")}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px", border: "1px solid #ddd", fontWeight: "bold" }}>Telefon</td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>{selectedTeacher.phone_number}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px", border: "1px solid #ddd", fontWeight: "bold" }}>Fan</td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>{selectedTeacher.subject}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px", border: "1px solid #ddd", fontWeight: "bold" }}>Joriy balans</td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                      {(teacherBalances[selectedTeacher.id] || 0).toLocaleString("ru-RU")} so'm
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <h3
                style={{
                  marginBottom: "16px",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "8px",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                To'lovlar tarixi
              </h3>
              {teacherPayments.filter((p) => p.teacher_id === selectedTeacher.id)
                .length > 0 ? (
                <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "8px", border: "1px solid #ddd", backgroundColor: "#104292", color: "#fff", textAlign: "center" }}>№</th>
                      <th style={{ padding: "8px", border: "1px solid #ddd", backgroundColor: "#104292", color: "#fff", textAlign: "center" }}>To'lov turi</th>
                      <th style={{ padding: "8px", border: "1px solid #ddd", backgroundColor: "#104292", color: "#fff", textAlign: "center" }}>Summasi</th>
                      <th style={{ padding: "8px", border: "1px solid #ddd", backgroundColor: "#104292", color: "#fff", textAlign: "center" }}>Kim tomonidan</th>
                      <th style={{ padding: "8px", border: "1px solid #ddd", backgroundColor: "#104292", color: "#fff", textAlign: "center" }}>Sana</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherPayments
                      .filter((p) => p.teacher_id === selectedTeacher.id)
                      .map((payment, index) => (
                        <tr key={payment.id}>
                          <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "center" }}>{index + 1}</td>
                          <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "center" }}>
                            {payment.payment_type === "avans"
                              ? "Avans"
                              : "Hisob"}
                          </td>
                          <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "center" }}>
                            {Number(payment.payment_amount).toLocaleString(
                              "ru-RU"
                            )}{" "}
                            so'm
                          </td>
                          <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "center" }}>{payment.given_by}</td>
                          <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "center" }}>
                            {new Date(payment.given_date).toLocaleDateString(
                              "ru-RU"
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <p
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#666",
                  }}
                >
                  To'lovlar tarixi mavjud emas
                </p>
              )}
            </div>

            <div>
              <h3
                style={{
                  marginBottom: "16px",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "8px",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                Guruhlar ({teacherGroups.length} ta)
              </h3>
              {teacherGroups.length > 0 ? (
                <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "8px", border: "1px solid #ddd", backgroundColor: "#104292", color: "#fff", textAlign: "center" }}>№</th>
                      <th style={{ padding: "8px", border: "1px solid #ddd", backgroundColor: "#104292", color: "#fff", textAlign: "center" }}>Guruh nomi</th>
                      <th style={{ padding: "8px", border: "1px solid #ddd", backgroundColor: "#104292", color: "#fff", textAlign: "center" }}>O'quvchilar soni</th>
                      <th style={{ padding: "8px", border: "1px solid #ddd", backgroundColor: "#104292", color: "#fff", textAlign: "center" }}>Kunlari</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherGroups.map((group, index) => (
                      <tr key={group.id}>
                        <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "center" }}>{index + 1}</td>
                        <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "center" }}>{group.group_subject}</td>
                        <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "center" }}>{group.students_amount || 0}</td>
                        <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "center" }}>{group.days || "Mavjud emas"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#666",
                  }}
                >
                  Ustozga hozircha guruh biriktirilmagan
                </p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "20px",
                gap: "10px",
              }}
            >
              <button
                className="btn btn-primary"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openPaymentModal(selectedTeacher)
                }}
              >
                To'lov qo'shish
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openEditModal(selectedTeacher)
                }}
              >
                Tahrirlash
              </button>
              <button className="btn btn-secondary" onClick={closeDetailModal}>
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th style={{ textAlign: "center", backgroundColor: "#104292", color: "white", borderRight: "1px solid #ddd" }}>№</th>
              <th style={{ textAlign: "center", backgroundColor: "#104292", color: "white", borderRight: "1px solid #ddd" }}>F.I.Sh.</th>
              <th style={{ textAlign: "center", backgroundColor: "#104292", color: "white", borderRight: "1px solid #ddd" }}>Tug'ilgan sana</th>
              <th style={{ textAlign: "center", backgroundColor: "#104292", color: "white", borderRight: "1px solid #ddd" }}>Fan</th>
              <th style={{ textAlign: "center", backgroundColor: "#104292", color: "white", borderRight: "1px solid #ddd" }}>Guruhlar soni</th>
              <th style={{ textAlign: "center", backgroundColor: "#104292", color: "white", borderRight: "1px solid #ddd" }}>Joriy balans (so'm)</th> {/* O'zgartirilgan sarlavha */}
              <th style={{ textAlign: "center", backgroundColor: "#104292", color: "white", borderRight: "1px solid #ddd" }}>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length === 0 ? (
              <tr style={{ textAlign: "center", padding: "40px" }}>
                <td
                  colSpan="8"
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  {searchTerm ||
                    subjectFilter !== "all" ||
                    salaryFilter !== "all"
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
                  <tr key={teacher.id}>
                    <td style={{ textAlign: "center" }}>{index + 1}</td>
                    <td
                      style={{ cursor: "pointer", color: "#104292", textAlign: "center" }}
                      onClick={() => openDetailModal(teacher)}
                    >
                      {`${teacher.first_name} ${teacher.last_name} ${teacher.father_name || ""
                        }`}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {teacher.birth_date
                        ? new Date(teacher.birth_date).toLocaleDateString(
                          "ru-RU"
                        )
                        : "N/A"}
                    </td>
                    <td style={{ textAlign: "center" }}>{teacher.subject || "N/A"}</td>
                    <td style={{ textAlign: "center" }}>{groupsCount} ta</td>
                    <td style={{ textAlign: "center" }}>
                      {(teacherBalances[teacher.id] || 0).toLocaleString(
                        "ru-RU"
                      )}{" "}
                      so'm
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="bg-green-600 text-white rounded-full p-2 hover:bg-green-700 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPaymentModal(teacher);
                        }}
                        title="To'lov qilish"
                      >
                        <Euro size={16} />
                      </button>
                      <button
                        className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(teacher);
                        }}
                        title="Tahrirlash"
                      >
                        <Pen size={16} />
                      </button>
                      <button
                        className="bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          showDeleteToast(teacher.id);
                        }}
                        title="O'chirish"
                      >
                        <Trash2 size={16} />
                      </button></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Teachers;