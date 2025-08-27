"use client";

import { useState, useEffect } from "react";
import { Trash2, Pen, Users, X, Search, Plus } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LottieLoading from "../components/Loading";
import { DatePicker } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import uz from "date-fns/locale/uz";
registerLocale("uz", uz);

function Students() {
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [addModal, setAddModal] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    father_name: "",
    mother_name: "",
    birth_date: "",
    phone_number: "",
    group_ids: [],
    parents_phone_number: "",
    came_in_school: "",
  });

  const [editModal, setEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    father_name: "",
    mother_name: "",
    birth_date: "",
    phone_number: "",
    group_ids: [],
    parents_phone_number: "",
    came_in_school: "",
    groups: [],
  });

  const monthsInUzbek = {
    1: "Yanvar",
    2: "Fevral",
    3: "Mart",
    4: "Aprel",
    5: "May",
    6: "Iyun",
    7: "Iyul",
    8: "Avgust",
    9: "Sentabr",
    10: "Oktabr",
    11: "Noyabr",
    12: "Dekabr",
  };

  const today = new Date().toLocaleDateString("en-CA");
  const minDate = "1990-01-01";
  const twentyYearsAgo = new Date();
  twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
  const defaultBirthDate = twentyYearsAgo.toISOString().split("T")[0];

  const getCurrentMonth = () => new Date().getMonth() + 1;
  const getCurrentYear = () => new Date().getFullYear();

  const getPaymentRatio = (student, currentMonth, currentYear) => {
    const totalGroups = student.groups ? student.groups.length : 0;
    if (totalGroups === 0) return "0/0";
    const paidGroups = student.paid_groups || 0;
    return `${paidGroups}/${totalGroups} (${Math.round(
      (paidGroups / totalGroups) * 100
    )}%)`;
  };

  const FormattedDate = (isoDate) => {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/get_students`);
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError("O'quvchilarni olishda xatolik yuz berdi!");
      toast.error("O'quvchilarni olishda xatolik yuz berdi!", { position: "top-right", autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/get_groups`);
      if (!response.ok) throw new Error("Guruhlar ma'lumotlarini olishda muammo yuzaga keldi!");
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      setError("Guruhlar ma'lumotlarini olishda muammo yuzaga keldi!");
      toast.error(`Guruhlar ma'lumotlarini olishda xatolik yuz berdi: ${err.message}`, { position: "top-right", autoClose: 3000 });
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/get_teachers`);
      if (!response.ok) throw new Error("Ustozlar ma'lumotlarini olishda muammo yuzaga keldi!");
      const data = await response.json();
      setTeachers(data);
    } catch (err) {
      setError("Ustozlar ma'lumotlarini olishda muammo yuzaga keldi!");
      toast.error("Ustozlar ma'lumotlarini olishda xatolik yuz berdi: hali mavjud emas", { position: "top-right", autoClose: 3000 });
    }
  };

  const fetchStudentPayments = async (studentId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/get_student_payments/${studentId}`);
      if (!response.ok) throw new Error("O'quvchi to'lovlarini olishda xatolik yuz berdi!");
      const data = await response.json();
      // Note: This function is defined but not used in the provided code; keeping it as is.
    } catch (err) {
      console.error("O'quvchi to'lovlarini olishda xatolik:", err);
    }
  };

  const formatDate = (date) => {
    if (!date || date === "Invalid date") return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  };

  const addStudent = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.group_ids.length === 0) {
      setError("Iltimos, kamida bitta guruhni tanlang!");
      toast.error("Iltimos, kamida bitta guruhni tanlang!", { position: "top-right", autoClose: 3000 });
      return;
    }

    const payload = {
      ...formData,
      birth_date: formatDate(formData.birth_date),
      came_in_school: formatDate(formData.came_in_school),
      group_ids: formData.group_ids,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/create_student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("O'quvchini qo'shishda muammo yuzaga keldi!");
      await fetchStudents();
      await fetchGroups();
      await fetchTeachers();
      setSuccess("Yangi o'quvchi muvaffaqiyatli qo'shildi!");
      toast.success("Yangi o'quvchi muvaffaqiyatli qo'shildi!", { position: "top-right", autoClose: 3000 });
      setFormData({
        first_name: "",
        last_name: "",
        father_name: "",
        mother_name: "",
        birth_date: "",
        phone_number: "",
        group_ids: [],
        parents_phone_number: "",
        came_in_school: "",
      });
      setAddModal(false);
    } catch (err) {
      toast.error("O'quvchini qo'shishda muammo yuzaga keldi. Iltimos, barcha maydonlar kiritilganligiga e'tibor bering!", { position: "top-right", autoClose: 3000 });
      setError("O'quvchini qo'shishda muammo yuzaga keldi. Iltimos, barcha maydonlar kiritilganligiga e'tibor bering!");
      console.error(err);
    }
  };

  const deleteStudent = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/delete_student/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("O'quvchini o'chirishda muammo yuzaga keldi!");
      await fetchStudents();
      setSuccess("O'quvchi muvaffaqiyatli o'chirib tashlandi!");
      toast.success("O'quvchi muvaffaqiyatli o'chirib tashlandi!", { position: "top-right", autoClose: 3000 });
      setSelectedStudent(null);
    } catch (err) {
      setError("O'quvchini o'chirishda muammo yuzaga keldi. Iltimos, birozdan so'ng qayta urinib ko'ring!");
      toast.error("O'quvchini o'chirishda muammo yuzaga keldi. Iltimos, birozdan so'ng qayta urinib ko'ring!", { position: "top-right", autoClose: 3000 });
      console.error(err);
    }
  };

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>
          Diqqat! Ushbu o'quvchiga tegishli barcha ma'lumotlar o'chiriladi!
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
              deleteStudent(id);
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

  const editStudent = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (editFormData.group_ids.length === 0) {
      setError("Iltimos, kamida bitta guruhni tanlang!");
      toast.error("Iltimos, kamida bitta guruhni tanlang!", { position: "top-right", autoClose: 3000 });
      return;
    }

    const payload = {
      ...editFormData,
      birth_date: formatDate(editFormData.birth_date),
      came_in_school: formatDate(editFormData.came_in_school),
      group_ids: editFormData.group_ids,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/update_student/${editingStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update student");
      await fetchStudents();
      await fetchGroups();
      await fetchTeachers();
      setSuccess("Student successfully updated");
      toast.success("O'quvchi ma'lumotlari muvaffaqiyatli yangilandi!", { position: "top-right", autoClose: 3000 });
      setEditModal(false);
      setSelectedStudent(null);
    } catch (err) {
      setError("Failed to update student. Please check the form data.");
      toast.error("O'quvchi ma'lumotlarini yangilashda xatolik yuz berdi! Iltimos, barcha maydonlar to'ldirilganligini tekshiring!", { position: "top-right", autoClose: 3000 });
      console.error(err);
    }
  };

  const openEditModal = (student) => {
    const studentGroups = student.groups || [];
    setEditingStudent(student);
    setEditFormData({
      ...student,
      groups: studentGroups,
      group_ids: studentGroups.map((group) => group.id),
      birth_date: student.birth_date ? new Date(student.birth_date).toISOString().split("T")[0] : "",
      came_in_school: student.came_in_school ? new Date(student.came_in_school).toISOString().split("T")[0] : "",
    });
    setEditModal(true);
  };

  const openDetailModal = (student) => {
    setSelectedStudent(student);
  };

  const filteredStudents =
    students.length > 0
      ? students.filter((student) => {
        const matchesName = `${student.first_name} ${student.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const totalGroups = student.groups ? student.groups.length : 0;
        const paidGroups = student?.paid_groups || 0;
        const isFullyPaid = totalGroups > 0 && paidGroups === totalGroups;
        const isPartiallyPaid = totalGroups > 0 && paidGroups > 0 && paidGroups < totalGroups;
        const isUnpaid = totalGroups > 0 && paidGroups === 0;

        const matchesPayment =
          paymentFilter === "all" ||
          (paymentFilter === "fullyPaid" && isFullyPaid) ||
          (paymentFilter === "partiallyPaid" && isPartiallyPaid) ||
          (paymentFilter === "unpaid" && isUnpaid);
        return matchesName && matchesPayment;
      })
      : [];

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    fetchStudents();
    fetchGroups();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, paymentFilter]);

  if (loading) {
    return <LottieLoading />;
  }

  return (
    <div>
      <ToastContainer />
      <div className="flex justify-between gap-2 pl-6 pr-6">
        <div className="flex items-center gap-2">
          <Users size={24} color="#104292" />
          <span className="text-2xl font-bold">O'quvchilar</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <button
            className="btn btn-primary"
            onClick={() => setAddModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Plus size={20} />
            Yangi o'quvchi qo'shish
          </button>
        </div>
      </div>


      {addModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header bg-[#104292] p-2 text-white rounded-[10px]">
              <h3 className="text-center text-lg font-bold">Yangi o'quvchi qo'shish</h3>
            </div>
            <form onSubmit={addStudent}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Ism</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="O'quvchining ismi"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Familiya</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="O'quvchining familiyasi"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Telefon raqami</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+998901234567"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontWeight: "600" }}>
                    Guruhlar
                  </label>
                  <select
                    className="select"
                    value=""
                    onChange={(e) => {
                      const selectedGroupId = e.target.value;
                      if (selectedGroupId && !formData.group_ids.includes(selectedGroupId)) {
                        setFormData((prev) => ({
                          ...prev,
                          group_ids: [...prev.group_ids, selectedGroupId],
                        }));
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #ced4da",
                      marginBottom: "12px",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">Guruhni tanlang</option>
                    {groups
                      .filter((group) => !formData.group_ids.includes(group.id))
                      .map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.group_subject}
                        </option>
                      ))}
                  </select>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {formData.group_ids.map((groupId) => {
                      const group = groups.find((g) => g.id === groupId);
                      if (!group) return null;
                      return (
                        <div
                          key={groupId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            background: "#104292",
                            padding: "6px 10px",
                            borderRadius: "20px",
                            fontSize: "14px",
                            color: "white",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          }}
                        >
                          {group.group_subject}
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                group_ids: prev.group_ids.filter((id) => id !== groupId),
                              }))
                            }
                            style={{
                              marginLeft: "8px",
                              background: "white",
                              border: "none",
                              color: "red",
                              borderRadius: "50%",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              padding: 0,
                            }}
                          >
                            <X size={23} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="form-group">
                  <label>Ota/onasining ismi va familiyasi</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    placeholder="Ota/onasining ismi va familiyasi"
                  />
                </div>
                <div className="form-group">
                  <label>Ota/onasining telefon raqami</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.parents_phone_number}
                    onChange={(e) => setFormData({ ...formData, parents_phone_number: e.target.value })}
                    placeholder="+998901234567"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tug'ilgan sana</label>
                  <DatePicker
                    selected={formData.birth_date}
                    onChange={(date) => setFormData({ ...formData, birth_date: date })}
                    onChangeRaw={(e) => {
                      const value = e?.target?.value;
                      if (!value) return;
                      const parts = value.split(".");
                      if (parts.length === 3) {
                        const day = parseInt(parts[0], 10);
                        const month = parseInt(parts[1], 10) - 1;
                        const year = parseInt(parts[2], 10);
                        const date = new Date(year, month, day);
                        if (!isNaN(date)) {
                          setFormData({ ...formData, birth_date: date });
                        }
                      }
                    }}
                    dateFormat="dd.MM.yyyy"
                    showYearDropdown
                    scrollableMonthYearDropdown
                    className="input"
                    locale="uz"
                    placeholderText="Tug'ilgan sana"
                    minDate={minDate}
                    maxDate={today}
                  />
                </div>
                <div className="form-group">
                  <label>O'qishga kelgan vaqti</label>
                  <DatePicker
                    selected={formData.came_in_school}
                    onChange={(date) => setFormData({ ...formData, came_in_school: date })}
                    onChangeRaw={(e) => {
                      const value = e?.target?.value;
                      if (!value) return;
                      const parts = value.split(".");
                      if (parts.length === 3) {
                        const day = parseInt(parts[0], 10);
                        const month = parseInt(parts[1], 10) - 1;
                        const year = parseInt(parts[2], 10);
                        const date = new Date(year, month, day);
                        if (!isNaN(date)) {
                          setFormData({ ...formData, came_in_school: date });
                        }
                      }
                    }}
                    dateFormat="dd.MM.yyyy"
                    showYearDropdown
                    scrollableMonthYearDropdown
                    className="input"
                    locale="uz"
                    placeholderText="O'qishga kelgan vaqti"
                    minDate={minDate}
                    maxDate={today}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAddModal(false)}>
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

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            gap: "20px",
          }}
        >
          <h3 style={{ fontWeight: "bold", fontSize: "1.2rem" }}>Bizning o'quvchilar ({filteredStudents.length} nafar)</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", border: "1px solid #ccc", borderRadius: "5px", padding: "5px" }}>
              <Search size={22} color="#104292" style={{ marginLeft: "12px" }} />
              <input
                type="text"
                className="input"
                style={{ width: "200px", border: "none", outline: "none" }}
                placeholder="O'quvchilarni qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="select"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={{ minWidth: "150px" }}
            >
              <option value="all">Barcha o'quvchilar</option>
              <option value="fullyPaid">To'liq to'lagan</option>
              <option value="partiallyPaid">Qisman to'lagan</option>
              <option value="unpaid">Umuman to'lamagan</option>
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid #e5e7eb", textAlign: "center" }}>#</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid #e5e7eb", textAlign: "center" }}>F.I.Sh.</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid #e5e7eb", textAlign: "center" }}>Telefon raqami</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid #e5e7eb", textAlign: "center" }}>Guruhlar</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid #e5e7eb", textAlign: "center" }}>Ota/onasining F.I.Sh.</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid #e5e7eb", textAlign: "center" }}>To'lov ({monthsInUzbek[getCurrentMonth()]})</th>
              <th style={{ backgroundColor: "#104292", color: "white", textAlign: "center" }}>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                  {searchTerm || paymentFilter !== "all" ? "Ushbu qidiruv bo'yicha o'quvchi topilmadi..." : "O'quvchilar yo'q"}
                </td>
              </tr>
            ) : (
              currentStudents.map((student, index) => (
                <tr
                  key={student.id}
                  onClick={() => openDetailModal(student)}
                  style={{ cursor: "pointer" }}
                >
                  <td style={{ textAlign: "center" }}>{indexOfFirstStudent + index + 1}</td>
                  <td style={{ textAlign: "center" }}>{`${student.first_name} ${student.last_name}`}</td>
                  <td style={{ textAlign: "center" }}>{student.phone_number}</td>
                  <td style={{ paddingLeft: "30px" }}>{student.groups?.map((group) => group.group_subject).map((g, i) => <p key={i}>{i + 1}. {g}</p>) || "N/A"}</td>
                  <td style={{ textAlign: "center" }}>{student.father_name || "N/A"}</td>
                  <td style={{ textAlign: "center" }}>{getPaymentRatio(student, getCurrentMonth(), getCurrentYear())}</td>
                  <td>
                    <div className="flex gap-2 justify-center">
                      <div className="relative group">
                        <button
                          className="rounded-full bg-[#104292] h-8 w-8 flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(student);
                          }}
                        >
                          <Pen size={18} color="white" />
                        </button>
                        <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Tahrirlash
                        </span>
                      </div>
                      <div className="relative group">
                        <button
                          className="rounded-full bg-[#dc3545] h-8 w-8 flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            showDeleteToast(student.id);
                          }}
                        >
                          <Trash2 size={18} color="white" />
                        </button>
                        <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          O'chirish
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {filteredStudents.length > studentsPerPage && (
          <div
            className="pagination"
            style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}
          >
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-full"
              style={{ margin: "0 5px", padding: "5px 10px" }}
            >
              « Oldingi
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`rounded-full ${currentPage === number ? "bg-[#104292]" : "bg-[#104292]/10"}`}
                style={{ margin: "0 5px", padding: "5px 10px" }}
              >
                {number}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-full"
              style={{ margin: "0 5px", padding: "5px 10px" }}
            >
              Keyingi »
            </button>
          </div>
        )}
      </div>

      {editModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header bg-[#104292] p-2 text-white rounded-[10px]">
              <h3 className="text-center text-lg font-bold">O'quvchi ma'lumotlarini yangilash</h3>
            </div>
            <form onSubmit={editStudent}>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>O'quvchi ismi</label>
                <input
                  type="text"
                  className="input"
                  value={editFormData.first_name}
                  onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>O'quvchi familiyasi</label>
                <input
                  type="text"
                  className="input"
                  value={editFormData.last_name}
                  onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>O'quvchi telefon raqami</label>
                <input
                  type="tel"
                  className="input"
                  value={editFormData.phone_number}
                  onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                  placeholder="+998 (__) ___-__-__"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontWeight: "600" }}>
                  Guruhlar
                </label>
                <select
                  className="select"
                  value=""
                  onChange={(e) => {
                    const selectedGroupId = e.target.value;
                    if (selectedGroupId && !editFormData.group_ids.includes(selectedGroupId)) {
                      setEditFormData((prev) => ({
                        ...prev,
                        group_ids: [...prev.group_ids, selectedGroupId],
                      }));
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #ced4da",
                    marginBottom: "12px",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Guruhni tanlang</option>
                  {groups
                    .filter((group) => !editFormData.group_ids.includes(group.id))
                    .map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.group_subject}
                      </option>
                    ))}
                </select>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {editFormData.group_ids.map((groupId) => {
                    const group = groups.find((g) => g.id === groupId);
                    if (!group) return null;
                    return (
                      <div
                        key={groupId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          background: "#104292",
                          padding: "6px 10px",
                          borderRadius: "20px",
                          fontSize: "14px",
                          color: "white",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                      >
                        {group.group_subject}
                        <button
                          type="button"
                          onClick={() =>
                            setEditFormData((prev) => ({
                              ...prev,
                              group_ids: prev.group_ids.filter((id) => id !== groupId),
                            }))
                          }
                          style={{
                            marginLeft: "8px",
                            background: "white",
                            border: "none",
                            color: "red",
                            borderRadius: "50%",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            padding: 0,
                          }}
                        >
                          <X size={23} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Ota/onasining F.I.Sh.</label>
                <input
                  type="text"
                  className="input"
                  value={editFormData.father_name}
                  onChange={(e) => setEditFormData({ ...editFormData, father_name: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Ota/onasining telefon raqami</label>
                <input
                  type="tel"
                  className="input"
                  value={editFormData.parents_phone_number}
                  onChange={(e) => setEditFormData({ ...editFormData, parents_phone_number: e.target.value })}
                  placeholder="+998 (__) ___-__-__"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Tug'ilgan sana</label>
                <input
                  type="date"
                  min={new Date('1980-01-01').toISOString().split("T")[0]}
                  max={new Date().toISOString().split("T")[0]}
                  className="input"
                  value={editFormData.birth_date}
                  onChange={(e) => setEditFormData({ ...editFormData, birth_date: e.target.value })}
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>O'qishga kelgan vaqti</label>
                <input
                  type="date"
                  min={new Date('2010-01-01').toISOString().split("T")[0]}
                  max={new Date().toISOString().split("T")[0]}
                  className="input"
                  value={editFormData.came_in_school}
                  onChange={(e) => setEditFormData({ ...editFormData, came_in_school: e.target.value })}
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditModal(false)}>
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

      {selectedStudent && (
        <div className="modal" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setSelectedStudent(null)}
              style={{ float: "right", padding: "8px", borderRadius: "50%" }}
            >
              <X />
            </button>
            <div className="modal-body p-4">
              <div className="modal-header">
                <h3 style={{ textAlign: "center", fontWeight: "bold", fontSize: "1.5rem", marginBottom: "16px" }}>O'quvchi haqida batafsil ma'lumot</h3>
              </div>
              <table className="min-w-full border border-gray-200 overflow-hidden" style={{ borderRadius: "30px", border: "1px solid rgb(0, 52, 103)" }}>
                <tbody className="bg-white">
                  <tr className="border-b">
                    <td className="px-4 py-2 font-semibold bg-[#104292] text-white">F.I.Sh.</td>
                    <td className="px-4 py-2" style={{ borderBottom: "1px solid rgb(0, 52, 103)" }}>{selectedStudent.first_name} {selectedStudent.last_name}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-semibold bg-[#104292] text-white">Telefon raqami</td>
                    <td className="px-4 py-2" style={{ borderBottom: "1px solid rgb(0, 52, 103)" }}>{selectedStudent.phone_number}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-semibold bg-[#104292] text-white">Ota/Onasining F.I.Sh.</td>
                    <td className="px-4 py-2" style={{ borderBottom: "1px solid rgb(0, 52, 103)" }}>{selectedStudent.father_name || "N/A"}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-semibold bg-[#104292] text-white">Ota/Onasining telefon raqami</td>
                    <td className="px-4 py-2" style={{ borderBottom: "1px solid rgb(0, 52, 103)" }}>{selectedStudent.parents_phone_number || "N/A"}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-semibold bg-[#104292] text-white">Tug'ilgan sana</td>
                    <td className="px-4 py-2" style={{ borderBottom: "1px solid rgb(0, 52, 103)" }}>{FormattedDate(selectedStudent.birth_date) || "N/A"}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-semibold bg-[#104292] text-white">O'qishni boshlagan sana</td>
                    <td className="px-4 py-2" style={{ borderBottom: "1px solid rgb(0, 52, 103)" }}>{FormattedDate(selectedStudent.came_in_school) || "N/A"}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-semibold bg-[#104292] text-white">Guruhlar</td>
                    <td className="px-4 py-2" style={{ borderBottom: "1px solid rgb(0, 52, 103)" }}>{selectedStudent.groups?.map(g => g.group_subject).join(", ") || "N/A"}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-semibold bg-[#104292] text-white">O'quvchining unikal ID raqami</td>
                    <td className="px-4 py-2" style={{ borderBottom: "1px solid rgb(0, 52, 103)" }}>{`ID${selectedStudent.studental_id}` || "N/A"}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-semibold bg-[#104292] text-white">{monthsInUzbek[getCurrentMonth()]} oyi uchun to'lov holati</td>
                    <td className="px-4 py-2" style={{ borderBottom: "1px solid rgb(0, 52, 103)" }}>{getPaymentRatio(selectedStudent, getCurrentMonth(), getCurrentYear())}</td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2 text-center">Guruhlar to‘lov holati</h3>
                {selectedStudent.groups?.map((group, index) => {
                  const groupPaymentStatus = selectedStudent.studentGroups.find(
                    (sg) => sg.group_id === group.id && sg.month === monthsInUzbek[getCurrentMonth()]
                  )?.paid;

                  return (
                    <table key={index} className="min-w-full border border-gray-200 rounded-lg overflow-hidden mb-4">
                      <tbody className="bg-white">
                        <tr className="border-b">
                          <td className="px-4 py-2 font-bold text-center w-10 bg-[#104292] text-white" style={{ borderLeft: "1px solid #e5e7eb", borderTopLeftRadius: "50%", borderBottomLeftRadius: "50%" }}>{index + 1}</td>
                          <td className="px-4 py-2 font-semibold bg-[#104292] text-white">Guruh</td>
                          <td className="px-4 py-2" style={{ borderBottom: "1px solid rgb(0, 52, 103)" }}>{group.group_subject}</td>
                        </tr>
                        <tr className="border-b">
                          <td></td>
                          <td className="px-4 py-2 font-semibold bg-[#104292] text-white">To‘lov holati</td>
                          <td className={`px-4 py-2 font-bold ${groupPaymentStatus ? "text-green-600" : "text-red-600"}`} style={{ borderBottom: "1px solid rgb(0, 52, 103)" }}>
                            {groupPaymentStatus ? "To'langan" : "To'lanmagan"}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td></td>
                          <td className="px-4 py-2 font-semibold bg-[#104292] text-white">Ustoz</td>
                          <td className="px-4 py-2" style={{ borderBottom: "1px solid rgb(0, 52, 103)" }}>{group.teacher ? `${group.teacher.first_name} ${group.teacher.last_name}` : "N/A"}</td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="px-4 py-2 font-semibold bg-[#104292] text-white">Telefon raqami</td>
                          <td className="px-4 py-2" style={{ borderBottom: "1px solid rgb(0, 52, 103)" }}>{group.teacher ? group.teacher.phone_number : "N/A"}</td>
                        </tr>
                      </tbody>
                    </table>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;