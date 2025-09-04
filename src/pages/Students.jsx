"use client";

import { useState, useEffect } from "react";
import { Trash2, Pen, Users, X, Search, Plus } from "lucide-react";
import LottieLoading from "../components/Loading";
import { DatePicker } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import { toast } from "react-hot-toast";
import uz from "date-fns/locale/uz";
registerLocale("uz", uz);
const monthsInUzbek = {
  1: "Yanvar",
  2: "Fevral",
  3: "Mart",
  4: "Aprel",
  5: "May",
  6: "Iyun",
  7: "Iyul",
  8: "Avgust",
  9: "Sentyabr",
  10: "Oktyabr",
  11: "Noyabr",
  12: "Dekabr",
};
import API_URL from "../conf/api";

const InfoRow = ({ label, value }) => (
  <div className="flex">
    <span className="text-sm font-medium text-gray-600 w-1/3">{label}:</span>
    <span className="text-gray-800 font-medium flex-1">{value}</span>
  </div>
);

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
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth());
  const [yearFilter, setYearFilter] = useState(getCurrentYear());

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

  const today = new Date().toLocaleDateString("en-CA");
  const minDate = "1990-01-01";
  const twentyYearsAgo = new Date();
  twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
  const defaultBirthDate = twentyYearsAgo.toISOString().split("T")[0];

  function getCurrentMonth() {
    return monthsInUzbek[new Date().getMonth() + 1];
  };

  function getCurrentYear() {
    return new Date().getFullYear();
  };

  const getPaymentRatio = (student) => {   
    const totalGroups = student.all_groups || 0
    const paidGroups = student.studentGroups?.filter(
      (sg) => sg.month === monthFilter && sg.year === yearFilter && sg.paid
    ).length || 0;
    return totalGroups ? `${paidGroups}/${totalGroups} (${Math.round((paidGroups / totalGroups) * 100)}%)` : "0/0";
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
      const response = await fetch(
        `${API_URL}/get_students?month=${monthFilter}&year=${yearFilter}`
      );
      if (!response.ok) throw new Error("O'quvchilarni olishda xatolik yuz berdi!");
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError("O'quvchilarni olishda xatolik yuz berdi!");
      toast.error("O'quvchilarni olishda xatolik yuz berdi!");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${API_URL}/get_groups`);
      if (!response.ok) throw new Error("Guruhlar ma'lumotlarini olishda muammo yuzaga keldi!");
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      setError("Guruhlar ma'lumotlarini olishda muammo yuzaga keldi!");
      toast.error("Guruhlar ma'lumotlarini olishda xatolik yuz berdi!");
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch(`${API_URL}/get_teachers`);
      if (!response.ok) throw new Error("Ustozlar ma'lumotlarini olishda muammo yuzaga keldi!");
      const data = await response.json();
      setTeachers(data);
    } catch (err) {
      setError("Ustozlar ma'lumotlarini olishda muammo yuzaga keldi!");
      toast.error("Ustozlar ma'lumotlarini olishda xatolik yuz berdi!");
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
      toast.error("Iltimos, kamida bitta guruhni tanlang!");
      return;
    }

    const payload = {
      ...formData,
      birth_date: formatDate(formData.birth_date),
      came_in_school: formatDate(formData.came_in_school),
      group_ids: formData.group_ids,
    };

    try {
      const response = await fetch(`${API_URL}/create_student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("O'quvchini qo'shishda muammo yuzaga keldi!");
      await fetchStudents();
      await fetchGroups();
      await fetchTeachers();
      setSuccess("Yangi o'quvchi muvaffaqiyatli qo'shildi!");
      toast.success("Yangi o'quvchi muvaffaqiyatli qo'shildi!");
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
      toast.error("O'quvchini qo'shishda muammo yuzaga keldi. Iltimos, barcha maydonlar kiritilganligiga e'tibor bering!");
      setError("O'quvchini qo'shishda muammo yuzaga keldi. Iltimos, barcha maydonlar kiritilganligiga e'tibor bering!");
      console.error(err);
    }
  };

  const deleteStudent = async (id) => {
    try {
      const response = await fetch(`${API_URL}/delete_student/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("O'quvchini o'chirishda muammo yuzaga keldi!");
      await fetchStudents();
      setSuccess("O'quvchi muvaffaqiyatli o'chirib tashlandi!");
      toast.success("O'quvchi muvaffaqiyatli o'chirib tashlandi!");
      setSelectedStudent(null);
    } catch (err) {
      setError("O'quvchini o'chirishda muammo yuzaga keldi. Iltimos, birozdan so'ng qayta urinib ko'ring!");
      toast.error("O'quvchini o'chirishda muammo yuzaga keldi. Iltimos, birozdan so'ng qayta urinib ko'ring!");
      console.error(err);
    }
  };

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>
          Diqqat! Ushbu o'quvchiga tegishli barcha ma'lumotlar o'chiriladi!
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
      </div>
    );
  };

  const editStudent = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (editFormData.group_ids.length === 0) {
      setError("Iltimos, kamida bitta guruhni tanlang!");
      toast.error("Iltimos, kamida bitta guruhni tanlang!");
      return;
    }

    const payload = {
      ...editFormData,
      birth_date: formatDate(editFormData.birth_date),
      came_in_school: formatDate(editFormData.came_in_school),
      group_ids: editFormData.group_ids,
    };

    try {
      const response = await fetch(`${API_URL}/update_student/${editingStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update student");
      await fetchStudents();
      await fetchGroups();
      await fetchTeachers();
      setSuccess("Student successfully updated");
      toast.success("O'quvchi ma'lumotlari muvaffaqiyatli yangilandi!");
      setEditModal(false);
      setSelectedStudent(null);
    } catch (err) {
      setError("Failed to update student. Please check the form data.");
      toast.error("O'quvchi ma'lumotlarini yangilashda xatolik yuz berdi! Iltimos, barcha maydonlar to'ldirilganligini tekshiring!");
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
        const totalGroups = student.studentGroups?.filter(
          (sg) => sg.month === monthFilter && sg.year === yearFilter
        ).length || 0;
        const paidGroups = student.studentGroups?.filter(
          (sg) => sg.month === monthFilter && sg.year === yearFilter && sg.paid
        ).length || 0;
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
    setMonthFilter(getCurrentMonth());
    setYearFilter(getCurrentYear());
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchGroups();
    fetchTeachers();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [monthFilter, yearFilter]);

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-t-xl">
              <h2 className="text-2xl font-bold">Yangi o'quvchi qo'shish</h2>
              <button
                className="p-2 rounded-full hover:bg-blue-600 transition-colors"
                onClick={() => setAddModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={addStudent} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Ism */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ism <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="O'quvchining ismi"
                    required
                  />
                </div>

                {/* Familiya */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Familiya <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="O'quvchining familiyasi"
                    required
                  />
                </div>

                {/* Telefon raqami */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Telefon raqami <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+998901234567"
                    required
                  />
                </div>

                {/* Ota/onasining ismi */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ota/onasining ismi
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    placeholder="Ota/onasining ismi va familiyasi"
                  />
                </div>

                {/* Ota/onasining telefon raqami */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ota/onasining telefon raqami <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.parents_phone_number}
                    onChange={(e) => setFormData({ ...formData, parents_phone_number: e.target.value })}
                    placeholder="+998901234567"
                    required
                  />
                </div>

                {/* Tug'ilgan sana */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tug'ilgan sana
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    max={today}
                    format="dd.MM.yyyy"
                  />
                </div>

                {/* O'qishga kelgan vaqti */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    O'qishga kelgan vaqti
                  </label>
                  <DatePicker
                    selected={formData.came_in_school ? new Date(formData.came_in_school) : null}
                    onChange={(date) => setFormData({ ...formData, came_in_school: date })}
                    dateFormat="dd.MM.yyyy"
                    showYearDropdown
                    scrollableMonthYearDropdown
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    locale="uz"
                    placeholderText="O'qishga kelgan vaqti"
                    minDate={new Date("1990-01-01")}
                    maxDate={new Date()}
                  />
                </div>
              </div>

              {/* Guruhlar */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guruhlar <span className="text-red-500">*</span>
                </label>

                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
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

                <div className="flex flex-wrap gap-2">
                  {formData.group_ids.map((groupId) => {
                    const group = groups.find((g) => g.id === groupId);
                    if (!group) return null;
                    return (
                      <div
                        key={groupId}
                        className="flex items-center bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-medium"
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
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {formData.group_ids.length === 0 && (
                  <p className="text-red-500 text-sm mt-1">Iltimos, kamida bitta guruhni tanlang!</p>
                )}
              </div>

              {/* Modal footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="px-5 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  onClick={() => setAddModal(false)}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus size={18} />
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
              style={{ minWidth: "180px" }}
            >
              <option value="all">Barcha o'quvchilar</option>
              <option value="fullyPaid">To'liq to'lagan</option>
              <option value="partiallyPaid">Qisman to'lagan</option>
              <option value="unpaid">Umuman to'lamagan</option>
            </select>
            <select
              className="select"
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                setCurrentPage(1); // Yangi oy tanlanganda paginationni reset qilish
              }}
              style={{ minWidth: "100px" }}
            >
              <option value={getCurrentMonth()}>Joriy oy</option>
              {Object.values(monthsInUzbek).map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <select
              className="select"
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ minWidth: "100px" }}
            >
              {[getCurrentYear() - 1, getCurrentYear(), getCurrentYear() + 1].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
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
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid #e5e7eb", textAlign: "center" }}>
                To'lov ({monthFilter})
              </th>
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
                  <td style={{ textAlign: "center" }}>{getPaymentRatio(student)}</td>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-t-xl">
              <h2 className="text-2xl font-bold">O'quvchi ma'lumotlarini tahrirlash</h2>
              <button
                className="p-2 rounded-full hover:bg-blue-600 transition-colors"
                onClick={() => setEditModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={editStudent} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Ism */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ism <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editFormData.first_name}
                    onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                    required
                  />
                </div>

                {/* Familiya */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Familiya <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editFormData.last_name}
                    onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                    required
                  />
                </div>

                {/* Telefon raqami */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Telefon raqami <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editFormData.phone_number}
                    onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                    placeholder="+998 (__) ___-__-__"
                    required
                  />
                </div>

                {/* Ota/onasining ismi */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ota/onasining ismi
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editFormData.father_name}
                    onChange={(e) => setEditFormData({ ...editFormData, father_name: e.target.value })}
                  />
                </div>

                {/* Ota/onasining telefon raqami */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ota/onasining telefon raqami <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editFormData.parents_phone_number}
                    onChange={(e) => setEditFormData({ ...editFormData, parents_phone_number: e.target.value })}
                    placeholder="+998 (__) ___-__-__"
                    required
                  />
                </div>

                {/* Tug'ilgan sana */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tug'ilgan sana
                  </label>
                  <DatePicker
                    selected={editFormData.birth_date ? new Date(editFormData.birth_date) : null}
                    onChange={(date) => setEditFormData({ ...editFormData, birth_date: date })}
                    dateFormat="dd.MM.yyyy"
                    showYearDropdown
                    scrollableMonthYearDropdown
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    locale="uz"
                    placeholderText="Tug'ilgan sana"
                    minDate={new Date('1980-01-01')}
                    maxDate={new Date()}
                  />
                </div>

                {/* O'qishga kelgan vaqti */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    O'qishga kelgan vaqti
                  </label>
                  <DatePicker
                    selected={editFormData.came_in_school ? new Date(editFormData.came_in_school) : null}
                    onChange={(date) => setEditFormData({ ...editFormData, came_in_school: date })}
                    dateFormat="dd.MM.yyyy"
                    showYearDropdown
                    scrollableMonthYearDropdown
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    locale="uz"
                    placeholderText="O'qishga kelgan vaqti"
                    minDate={new Date('2010-01-01')}
                    maxDate={new Date()}
                  />
                </div>
              </div>

              {/* Guruhlar */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guruhlar <span className="text-red-500">*</span>
                </label>

                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
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

                <div className="flex flex-wrap gap-2">
                  {editFormData.group_ids.map((groupId) => {
                    const group = groups.find((g) => g.id === groupId);
                    if (!group) return null;
                    return (
                      <div
                        key={groupId}
                        className="flex items-center bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-medium"
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
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {editFormData.group_ids.length === 0 && (
                  <p className="text-red-500 text-sm mt-1">Iltimos, kamida bitta guruhni tanlang!</p>
                )}
              </div>

              {/* Modal footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="px-5 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  onClick={() => setEditModal(false)}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedStudent(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-t-xl">
              <h2 className="text-2xl font-bold">O'quvchi ma'lumotlari</h2>
              <button
                className="p-2 rounded-full hover:bg-blue-600 transition-colors"
                onClick={() => setSelectedStudent(null)}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6">
              {/* Asosiy ma'lumotlar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Users size={20} />
                    Shaxsiy ma'lumotlar
                  </h3>
                  <div className="space-y-2">
                    <InfoRow label="F.I.Sh." value={`${selectedStudent.first_name} ${selectedStudent.last_name}`} />
                    <InfoRow label="Telefon raqami" value={selectedStudent.phone_number} />
                    <InfoRow label="Tug'ilgan sana" value={FormattedDate(selectedStudent.birth_date) || "N/A"} />
                    <InfoRow label="O'qishga kelgan sana" value={FormattedDate(selectedStudent.came_in_school) || "N/A"} />
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Users size={20} />
                    Ota-ona ma'lumotlari
                  </h3>
                  <div className="space-y-2">
                    <InfoRow label="Ota/Onasining ismi" value={selectedStudent.father_name || "N/A"} />
                    <InfoRow label="Telefon raqami" value={selectedStudent.parents_phone_number || "N/A"} />
                  </div>
                </div>
              </div>

              {/* ID va to'lov holati */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3">Identifikator</h3>
                  <div className="flex items-center justify-center">
                    <span className="bg-purple-100 text-purple-800 py-2 px-4 rounded-full font-mono text-lg">
                      ID{selectedStudent.studental_id}
                    </span>
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <h3 className="text-lg font-semibold text-amber-800 mb-3">To'lov holati ({monthFilter})</h3>
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">{getPaymentRatio(selectedStudent)}</div>
                    {(() => {
                      const totalGroups = selectedStudent.studentGroups?.filter(
                        sg => sg.month === monthFilter && sg.year === yearFilter
                      ).length || 0;
                      const paidGroups = selectedStudent.studentGroups?.filter(
                        sg => sg.month === monthFilter && sg.year === yearFilter && sg.paid
                      ).length || 0;

                      return (
                        <span className={paidGroups === totalGroups && paidGroups > 0 ? "bg-green-100 text-green-800" :
                          paidGroups > 0 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                          {paidGroups === totalGroups && paidGroups > 0 ? "Toʻliq toʻlangan" :
                            paidGroups > 0 ? "Qisman toʻlangan" : "Toʻlanmagan"}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Guruhlar ro'yxati */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users size={24} />
                  Guruhlar ({selectedStudent.groups?.length || 0})
                </h3>

                <div className="space-y-4">
                  {selectedStudent.groups?.map((group, index) => {
                    const groupPayment = selectedStudent.studentGroups?.find(
                      sg => sg.group_id === group.id && sg.month === monthFilter && sg.year === yearFilter
                    );

                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-lg font-medium text-blue-800">{group.group_subject}</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${groupPayment?.paid
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                            }`}>
                            {groupPayment?.paid ? "Toʻlangan" : "Toʻlanmagan"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Ustoz:</p>
                            <p className="text-gray-800">
                              {group.teacher ? `${group.teacher.first_name} ${group.teacher.last_name}` : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Telefon:</p>
                            <p className="text-gray-800">{group.teacher ? group.teacher.phone_number : "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                className="px-5 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                onClick={() => setSelectedStudent(null)}
              >
                Yopish
              </button>
              <button
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(selectedStudent);
                  setSelectedStudent(null);
                }}
              >
                <Pen size={16} />
                Tahrirlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;