"use client";

import { useState, useEffect } from "react";
import { Trash2, GraduationCap, Plus, Pen, X } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LottieLoading from "../components/Loading";

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
        `${import.meta.env.VITE_API_URL}/get_teacher_payments/${teacher.id}`
      );
      if (res.ok) {
        const data = await res.json();
        console.log(data);
        setTeacherPayments(data);
      } else {
        setTeacherPayments([]);
      }
    } catch (err) {
      console.error("To‘lovlarni olishda xatolik:", err);
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
        `${import.meta.env.VITE_API_URL}/get_teacher_balance/${teacherId}`
      );
      if (response.ok) {
        const balanceData = await response.json();
        return balanceData.balance;
      } else {
        throw new Error("Balansni olishda xatolik");
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
        fetch(`${import.meta.env.VITE_API_URL}/get_groups`).catch(() => ({
          ok: false,
        })),
        fetch(`${import.meta.env.VITE_API_URL}/get_teachers`).catch(() => ({
          ok: false,
        })),
        fetch(`${import.meta.env.VITE_API_URL}/get_students`).catch(() => ({
          ok: false,
        })),
      ]);

      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setGroups(groupsData);
      } else {
        setGroups([]);
        setGroupsError("Guruhlar hali mavjud emas");
        toast.error("Guruhlar yuklanmadi: Hali mavjud emas", {
          position: "top-right",
          autoClose: 3000,
        });
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
        toast.error("Ustozlar yuklanmadi: Hali mavjud emas", {
          position: "top-right",
          autoClose: 3000,
        });
      }

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);
      } else {
        setStudents([]);
        toast.error("O'quvchilar yuklanmadi: Hali mavjud emas", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      setGroups([]);
      setTeachers([]);
      setStudents([]);
      setGroupsError("Guruhlar hali mavjud emas");
      setTeachersError("Ustozlar hali mavjud emas");
      toast.error("Ma'lumotlarni yuklashda umumiy xatolik yuz berdi", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const addTeacher = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/create_teacher`,
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
        toast.success("Yangi ustoz muvaffaqiyatli qo'shildi!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        throw new Error("Ustoz qo'shishda xatolik");
      }
    } catch (err) {
      toast.error("Ustoz qo'shishda xatolik: API mavjud emas", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const updateTeacher = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/update_teacher/${editFormData.id}`,
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
        throw new Error("Xatolik yuz berdi");
      }
      else {
        toast.success("O‘qituvchi ma’lumotlari yangilandi");
      }
      setIsEditModalOpen(false);
      fetchData(); // ro‘yxatni yangilash
    } catch (error) {
      toast.error("Yangilashda muammo yuz berdi");
      console.error(error);
    }
  };

  const deleteTeacher = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/delete_teacher/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setTeachers(teachers.filter((t) => t.id !== id));
        setTeacherBalances((prev) => {
          const newBalances = { ...prev };
          delete newBalances[id];
          return newBalances;
        });
        toast.success("Ustoz muvaffaqiyatli o'chirildi");
      } else {
        throw new Error("Ustoz o'chirishda xatolik");
      }
    } catch (err) {
      toast.error("Ustoz o'chirishda xatolik: API mavjud emas", {
        position: "top-right",
        autoClose: 3000,
      });
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
          )} so'm`,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
        return;
      }
      else if (Number(paymentFormData.payment_amount) < 1000) {
        toast.error(
          `Kamida 1000 so'm kiritish shart!
Balans: ${currentBalance.toLocaleString(
            "uz-UZ"
          )} so'm`,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/create_payment_teacher`,
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
        toast.success("To'lov muvaffaqiyatli qo'shildi!", {
          position: "top-right",
          autoClose: 3000,
        });
        setIsPaymentModalOpen(false);
        setPaymentFormData({
          teacher_id: "",
          payment_type: "avans",
          given_by: "",
          payment_amount: "",
        });
      } else {
        throw new Error("To'lov qo'shishda xatolik");
      }
    } catch (err) {
      toast.error("To'lov qo'shishda xatolik: " + err.message, {
        position: "top-right",
        autoClose: 3000,
      });
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
              padding: "15px 22px",
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
      <ToastContainer />
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
              padding: "20px",
              borderRadius: "10px",
              width: "500px",
              maxWidth: "90%",
            }}
          >
            <h3 style={{ marginBottom: "20px", fontWeight: "bold", fontSize: "1.2rem", textAlign: "center" }}>Yangi ustoz qo'shish</h3>
            <form onSubmit={addTeacher}>
              <div
                className="form-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "16px",
                  padding: "16px",
                }}
              >
                <div className="form-group">
                  <label>Ism</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
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
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
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
                    value={formData.father_name}
                    onChange={(e) =>
                      setFormData({ ...formData, father_name: e.target.value })
                    }
                    placeholder="Otasining ismi (ixtiyoriy)"
                  />
                </div>
                <div className="form-group">
                  <label>Tug'ilgan sana</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.birth_date}
                    onChange={(e) =>
                      setFormData({ ...formData, birth_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Telefon raqami</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_number: e.target.value })
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
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    placeholder="O'qitadigan fani"
                    required
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
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary">
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
              <tr>
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
                    <td>{index + 1}</td>
                    <td
                      style={{ cursor: "pointer", color: "#104292" }}
                      onClick={() => openDetailModal(teacher)}
                    >
                      {`${teacher.first_name} ${teacher.last_name} ${teacher.father_name || ""
                        }`}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {teacher.birth_date
                        ? new Date(teacher.birth_date).toLocaleDateString(
                          "uz-UZ"
                        )
                        : "N/A"}
                    </td>
                    <td style={{ textAlign: "center" }}>{teacher.subject || "N/A"}</td>
                    <td style={{ textAlign: "center" }}>{groupsCount} ta</td>
                    <td style={{ textAlign: "center" }}>
                      {(teacherBalances[teacher.id] || 0).toLocaleString(
                        "uz-UZ"
                      )}{" "}
                      so'm
                    </td>
                    <td style={{ textAlign: "center" }}>              <button
                      className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition"
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