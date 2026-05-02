"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2, Pen, Users, X, Search, Plus, CreditCard, AlertCircle, LogOut } from "lucide-react";
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

const StudentSearchInput = ({ value, onChange, onSearch }) => {
  return (
    <div className="flex items-center gap-2 border border-gray-300 px-3 py-2 bg-white w-full sm:min-w-[280px] sm:w-auto rounded-lg">
      <input
        type="text"
        className="w-full outline-none text-sm"
        placeholder="O'quvchi ismini kiriting..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSearch();
          }
        }}
      />

      <button
        onClick={onSearch}
        className="px-3 py-1 bg-[#104292] text-white text-sm"
      >
        Qidirish
      </button>
    </div>
  );
};

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
  const todayLocalISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const [markLeftModal, setMarkLeftModal] = useState({
    open: false,
    id: null,
    name: "",
    date: todayLocalISO(),
  });
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth());
  const [yearFilter, setYearFilter] = useState(getCurrentYear());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
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

  const [studentSearch, setStudentSearch] = useState("");
  const [groupSearchAdd, setGroupSearchAdd] = useState("");
  const [groupSearchEdit, setGroupSearchEdit] = useState("");
  const [dropdownGroups, setDropdownGroups] = useState([]);
  const [groupDropdownLoading, setGroupDropdownLoading] = useState(false);
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
  const [studentPayments, setStudentPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [editPaymentModalOpen, setEditPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  const today = new Date().toLocaleDateString("en-CA");
  function getCurrentMonth() {
    return monthsInUzbek[new Date().getMonth() + 1];
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  function getCurrentYear() {
    return new Date().getFullYear();
  };

  const openEditPaymentModal = (payment) => {
    setEditingPayment(payment);
    setEditPaymentModalOpen(true);
  };

  const getPaymentRatio = (student) => {
    const totalGroups = student.total_groups || 0;
    const paidGroups = student.paid_groups || 0;
    return totalGroups
      ? `${paidGroups}/${totalGroups} (${Math.round((paidGroups / totalGroups) * 100)}%)`
      : "0/0";
  };

  const FormattedDate = (isoDate) => {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };
  const fetchStudents = async (
    page = currentPage,
    search = searchTerm,
    payment = paymentFilter,
    month = monthFilter,
    year = yearFilter
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit || 10),
        month: month || getCurrentMonth(),
        year: String(year || getCurrentYear()),
        search: search || "",
        paymentFilter: payment || "all",
      });

      const response = await fetch(`${API_URL}/get_students?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("O'quvchilarni olishda xatolik yuz berdi!");
      }

      const result = await response.json();

      setStudents(result.data || []);
      setPagination(result.pagination || {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
    } catch (err) {
      setError("O'quvchilarni olishda xatolik yuz berdi!");
      toast.error("O'quvchilarni olishda xatolik yuz berdi!");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${API_URL}/get_groups?limit=50`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Guruhlar ma'lumotlarini olishda muammo yuzaga keldi!");
      const json = await response.json();
      const list = Array.isArray(json) ? json : (json.data || []);
      setGroups(list);
      setDropdownGroups(list);
    } catch (err) {
      setError("Guruhlar ma'lumotlarini olishda muammo yuzaga keldi!");
      toast.error("Guruhlar ma'lumotlarini olishda xatolik yuz berdi!");
    }
  };

  const fetchGroupsForDropdown = async (search) => {
    try {
      setGroupDropdownLoading(true);
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`${API_URL}/get_groups?${params}`, { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json.data || []);
      setDropdownGroups(list);
      // Tanlangan guruhlarni cache ga qo'shib qo'yamiz
      setGroups((prev) => {
        const merged = [...prev];
        list.forEach((g) => { if (!merged.find((x) => x.id === g.id)) merged.push(g); });
        return merged;
      });
    } catch {
      // silent
    } finally {
      setGroupDropdownLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch(`${API_URL}/get_teachers`, {
        credentials: "include"
      });
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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("O'quvchini qo'shishda muammo yuzaga keldi!");
      await fetchStudents(currentPage, debouncedSearch, paymentFilter, monthFilter, yearFilter);
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
      setGroupSearchAdd("");
    } catch (err) {
      toast.error("O'quvchini qo'shishda muammo yuzaga keldi. Iltimos, barcha maydonlar kiritilganligiga e'tibor bering!");
      setError("O'quvchini qo'shishda muammo yuzaga keldi. Iltimos, barcha maydonlar kiritilganligiga e'tibor bering!");
      console.error(err);
    }
  };

  const markStudentAsLeft = async (id, leftDate) => {
    try {
      const response = await fetch(`${API_URL}/mark_student_left/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ left_school: leftDate }),
      });
      if (!response.ok) throw new Error("Belgilashda xatolik");
      await fetchStudents(currentPage, debouncedSearch, paymentFilter, monthFilter, yearFilter);
      toast.success("O'quvchi 'ketgan' deb belgilandi va alohida ro'yxatga ko'chirildi");
      setSelectedStudent(null);
    } catch (err) {
      toast.error("Belgilashda xatolik yuz berdi");
    }
  };

  const openMarkLeftModal = (id, name) => {
    setMarkLeftModal({ open: true, id, name, date: todayLocalISO() });
  };

  const closeMarkLeftModal = () => {
    setMarkLeftModal({ open: false, id: null, name: "", date: todayLocalISO() });
  };

  const confirmMarkLeft = async () => {
    if (!markLeftModal.id || !markLeftModal.date) {
      toast.error("Iltimos, ketish sanasini kiriting");
      return;
    }
    await markStudentAsLeft(markLeftModal.id, markLeftModal.date);
    closeMarkLeftModal();
  };

  const deleteStudent = async (id) => {
    try {
      const response = await fetch(`${API_URL}/delete_student/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!response.ok) throw new Error("O'quvchini o'chirishda muammo yuzaga keldi!");

      const nextPage =
        students.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;

      setCurrentPage(nextPage);

      await fetchStudents(nextPage, debouncedSearch, paymentFilter, monthFilter, yearFilter);

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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update student");
      await fetchStudents(currentPage, debouncedSearch, paymentFilter, monthFilter, yearFilter);
      await fetchGroups();
      await fetchTeachers();
      setSuccess("Student successfully updated");
      toast.success("O'quvchi ma'lumotlari muvaffaqiyatli yangilandi!");
      setEditModal(false);
      setGroupSearchEdit("");
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
      came_in_school: student.came_in_school ? student.came_in_school : new Date(student.came_in_school).toISOString().split("T")[0],
    });
    setEditModal(true);
  };

  const openDetailModal = async (student) => {
    setSelectedStudent(student);
    setStudentPayments([]);           // tozalash
    setLoadingPayments(true);

    try {
      const res = await fetch(`${API_URL}/get_payments_by_student/${student.id}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("To'lovlarni yuklab bo'lmadi");
      const data = await res.json();
      setStudentPayments(data || []);
    } catch (err) {
      toast.error("O'quvchining to'lov tarixini yuklashda xatolik");
      setStudentPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    setMonthFilter(getCurrentMonth());
    setYearFilter(getCurrentYear());
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchTeachers();
  }, []);

  useEffect(() => {
    fetchStudents(currentPage, debouncedSearch, paymentFilter, monthFilter, yearFilter);
  }, [currentPage, debouncedSearch, paymentFilter, monthFilter, yearFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, paymentFilter, monthFilter, yearFilter]);

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
    if (!addModal) return;
    const delay = groupSearchAdd ? 300 : 0;
    const timer = setTimeout(() => fetchGroupsForDropdown(groupSearchAdd), delay);
    return () => clearTimeout(timer);
  }, [groupSearchAdd, addModal]);

  useEffect(() => {
    if (!editModal) return;
    const delay = groupSearchEdit ? 300 : 0;
    const timer = setTimeout(() => fetchGroupsForDropdown(groupSearchEdit), delay);
    return () => clearTimeout(timer);
  }, [groupSearchEdit, editModal]);

  if (loading) {
    return <LottieLoading />;
  }

  const getVisiblePages = (current, total) => {
    const delta = 2; // current page atrofida nechta ko'rinsin
    const range = [];
    const rangeWithDots = [];

    // doim birinchi va oxirgi sahifa
    // current atrofi ham ko'rinadi
    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      }
    }

    let prev = null;

    for (const page of range) {
      if (prev !== null) {
        if (page - prev === 2) {
          rangeWithDots.push(prev + 1);
        } else if (page - prev > 2) {
          rangeWithDots.push("...");
        }
      }

      rangeWithDots.push(page);
      prev = page;
    }

    return rangeWithDots;
  };

  const handlePageInputSubmit = () => {
    const page = Number(pageInput);

    if (!page || page < 1 || page > pagination.totalPages) {
      return;
    }

    setCurrentPage(page);
    setPageInput("");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 sm:px-6 mb-4">
        <div className="flex items-center gap-2">
          <Users size={24} color="#104292" />
          <span className="text-xl sm:text-2xl font-bold">O'quvchilar</span>
        </div>
        <button
          className="btn btn-primary flex items-center gap-2 rounded-lg px-4 py-2"
          onClick={() => setAddModal(true)}
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Yangi o'quvchi qo'shish</span>
          <span className="sm:hidden">Qo'shish</span>
        </button>
      </div>


      {addModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#104292] text-white">
              <h2 className="text-2xl font-bold">Yangi o'quvchi qo'shish</h2>
              <button
                className="p-2 rounded-full hover:bg-blue-600 transition-colors"
                onClick={() => { setAddModal(false); setGroupSearchAdd(""); }}
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
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                <div className="relative mb-3">
                  <div className="flex items-center border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <Search size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      className="w-full outline-none text-sm"
                      placeholder="Guruhni qidirish..."
                      value={groupSearchAdd}
                      onChange={(e) => setGroupSearchAdd(e.target.value)}
                    />
                  </div>
                  {groupDropdownLoading ? (
                    <div className="border border-t-0 border-gray-300 bg-white px-4 py-2 text-sm text-gray-400 flex items-center gap-2">
                      <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Qidirilmoqda...
                    </div>
                  ) : (() => {
                    const filtered = dropdownGroups.filter((g) => !formData.group_ids.includes(g.id));
                    return filtered.length > 0 ? (
                      <div className="border border-t-0 border-gray-300 bg-white max-h-48 overflow-y-auto">
                        {filtered.map((group) => (
                          <div
                            key={group.id}
                            className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setFormData((prev) => ({
                                ...prev,
                                group_ids: [...prev.group_ids, group.id],
                              }));
                              setGroups((prev) => prev.find((x) => x.id === group.id) ? prev : [...prev, group]);
                              setGroupSearchAdd("");
                            }}
                          >
                            {group.group_subject}
                          </div>
                        ))}
                      </div>
                    ) : groupSearchAdd ? (
                      <div className="border border-t-0 border-gray-300 bg-white px-4 py-2 text-sm text-gray-400">
                        Guruh topilmadi
                      </div>
                    ) : null;
                  })()}
                </div>

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
                  className="px-5 py-2 btn btn-secondary text-gray-700  hover:bg-gray-400 transition-colors"
                  onClick={() => { setAddModal(false); setGroupSearchAdd(""); }}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 btn btn-primary text-white  hover:bg-blue-700 transition-colors flex items-center gap-2"
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
          <h3 className="font-bold text-lg sm:text-xl">
            Bizning o'quvchilar ({pagination.totalItems} nafar)
          </h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <StudentSearchInput
              value={studentSearch}
              onChange={setStudentSearch}
              onSearch={() => fetchStudents(currentPage, studentSearch, paymentFilter, monthFilter, yearFilter)}
            />
            <select
              className="select w-full sm:w-auto sm:min-w-[180px] rounded-lg"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="all">Barcha o'quvchilar</option>
              <option value="fullyPaid">To'liq to'lagan</option>
              <option value="partiallyPaid">Qisman to'lagan</option>
              <option value="unpaid">Umuman to'lamagan</option>
            </select>
            <select
              className="select w-full sm:w-auto sm:min-w-[120px] rounded-lg"
              value={monthFilter}
              onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value={getCurrentMonth()}>Joriy oy</option>
              {Object.values(monthsInUzbek).map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <select
              className="select w-full sm:w-auto sm:min-w-[100px] rounded-lg"
              value={yearFilter}
              onChange={(e) => { setYearFilter(Number(e.target.value)); setCurrentPage(1); }}
            >
              {[getCurrentYear() - 1, getCurrentYear(), getCurrentYear() + 1].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden  border border-gray-300 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-[16px]">

              {/* HEADER */}
              <thead className="bg-[#104292] text-white">
                <tr>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">#</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">F.I.Sh.</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Telefon</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Guruhlar</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Ota/ona</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                    To'lov ({monthFilter})
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Amallar</th>
                </tr>
              </thead>

              {/* BODY */}
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="border border-gray-300 py-12 text-center text-gray-500">
                      {searchTerm || paymentFilter !== "all"
                        ? "O'quvchi topilmadi"
                        : "O'quvchilar yo'q"}
                    </td>
                  </tr>
                ) : (
                  students.map((student, index) => (
                    <tr
                      key={student.id}
                      onClick={() => openDetailModal(student)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      {/* INDEX */}
                      <td className="border border-gray-300 px-4 py-3 text-center font-medium">
                        {(currentPage - 1) * pagination.limit + index + 1}
                      </td>

                      {/* NAME */}
                      <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                        {student.first_name} {student.last_name}
                      </td>

                      {/* PHONE */}
                      <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">
                        {student.phone_number || "—"}
                      </td>

                      {/* GROUPS */}
                      <td className="border border-gray-300 px-4 py-3">
                        {student.groups?.length > 0 ? (
                          student.groups.map((g, i) => (
                            <div key={i} className="text-sm text-gray-700">
                              {i + 1}. {g.group_subject}
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* FATHER */}
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {student.father_name || "—"}
                      </td>

                      {/* PAYMENT */}
                      <td className="border border-gray-300 px-4 py-3 text-center font-medium">
                        {getPaymentRatio(student)}
                      </td>

                      {/* ACTIONS */}
                      <td
                        className="border border-gray-300 px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-center gap-2">
                          <button
                            className="h-9 w-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                            onClick={() => openEditModal(student)}
                            title="Tahrirlash"
                          >
                            <Pen size={16} />
                          </button>

                          <button
                            className="h-9 w-9 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-md"
                            onClick={() => openMarkLeftModal(student.id, `${student.first_name} ${student.last_name}`)}
                            title="Ketgan deb belgilash"
                          >
                            <LogOut size={16} />
                          </button>

                          <button
                            className="h-9 w-9 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-md"
                            onClick={() => showDeleteToast(student.id)}
                            title="O'chirish"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {pagination.totalPages > 1 && (
          <div className="mt-8 border border-gray-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-center text-sm text-gray-600 lg:text-left">
                Jami{" "}
                <span className="font-semibold text-[#104292]">
                  {pagination.totalItems}
                </span>{" "}
                ta o‘quvchi,
                <span className="mx-1 font-semibold text-[#104292]">
                  {currentPage}
                </span>
                / {pagination.totalPages} sahifa
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className={` border px-4 py-2 text-sm font-medium transition ${pagination.hasPrevPage
                    ? "border-[#104292]/20 bg-white text-[#104292] hover:border-[#104292] hover:bg-[#104292] hover:text-white"
                    : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                    }`}
                >
                  « Oldingi
                </button>

                {getVisiblePages(currentPage, pagination.totalPages).map((item, index) =>
                  item === "..." ? (
                    <span
                      key={`dots-${index}`}
                      className="flex h-10 min-w-[40px] items-center justify-center px-2 text-sm font-semibold text-gray-500"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={`h-10 min-w-[40px]  border px-3 text-sm font-semibold transition ${currentPage === item
                        ? "border-[#104292] bg-[#104292] text-white shadow-sm"
                        : "border-gray-200 bg-white text-[#104292] hover:bg-[#104292]/10"
                        }`}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className={` border px-4 py-2 text-sm font-medium transition ${pagination.hasNextPage
                    ? "border-[#104292]/20 bg-white text-[#104292] hover:border-[#104292] hover:bg-[#104292] hover:text-white"
                    : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                    }`}
                >
                  Keyingi »
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 lg:justify-end">
              <span className="text-sm text-gray-500">Sahifaga o‘tish:</span>

              <input
                type="number"
                min={1}
                max={pagination.totalPages}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handlePageInputSubmit();
                  }
                }}
                placeholder="Masalan 12"
                className="w-28  border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
              />

              <button
                onClick={handlePageInputSubmit}
                className=" bg-[#104292] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0d3677]"
              >
                O‘tish
              </button>
            </div>
          </div>
        )}
      </div>

      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#104292] text-white">
              <h2 className="text-2xl font-bold">O'quvchi ma'lumotlarini tahrirlash</h2>
              <button
                className="p-2 rounded-full hover:bg-blue-600 transition-colors"
                onClick={() => { setEditModal(false); setGroupSearchEdit(""); }}
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
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                <div className="relative mb-3">
                  <div className="flex items-center border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <Search size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      className="w-full outline-none text-sm"
                      placeholder="Guruhni qidirish..."
                      value={groupSearchEdit}
                      onChange={(e) => setGroupSearchEdit(e.target.value)}
                    />
                  </div>
                  {groupDropdownLoading ? (
                    <div className="border border-t-0 border-gray-300 bg-white px-4 py-2 text-sm text-gray-400 flex items-center gap-2">
                      <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Qidirilmoqda...
                    </div>
                  ) : (() => {
                    const filtered = dropdownGroups.filter((g) => !editFormData.group_ids.includes(g.id));
                    return filtered.length > 0 ? (
                      <div className="border border-t-0 border-gray-300 bg-white max-h-48 overflow-y-auto">
                        {filtered.map((group) => (
                          <div
                            key={group.id}
                            className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setEditFormData((prev) => ({
                                ...prev,
                                group_ids: [...prev.group_ids, group.id],
                              }));
                              setGroups((prev) => prev.find((x) => x.id === group.id) ? prev : [...prev, group]);
                              setGroupSearchEdit("");
                            }}
                          >
                            {group.group_subject}
                          </div>
                        ))}
                      </div>
                    ) : groupSearchEdit ? (
                      <div className="border border-t-0 border-gray-300 bg-white px-4 py-2 text-sm text-gray-400">
                        Guruh topilmadi
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="flex flex-wrap gap-2">
                  {editFormData.group_ids.map((groupId) => {
                    const group = groups.find((g) => g.id === groupId);
                    if (!group) return null;
                    return (
                      <div
                        key={groupId}
                        className="flex items-center bg-blue-100 text-blue-800 py-1 px-3 text-sm font-medium"
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
                  className="px-5 py-2 btn btn-secondary text-gray-700  hover:bg-gray-400 transition-colors"
                  onClick={() => { setEditModal(false); setGroupSearchEdit(""); }}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 btn btn-primary text-white  hover:bg-blue-700 transition-colors"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editPaymentModalOpen && editingPayment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-5 flex justify-between items-center">
              <h3 className="text-lg font-semibold">To'lovni tahrirlash</h3>
              <button
                onClick={() => setEditPaymentModalOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch(`${API_URL}/update_payment/${editingPayment.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      payment_amount: Number(editingPayment.payment_amount),
                      payment_type: editingPayment.payment_type,
                      received: editingPayment.received,
                      for_which_month: editingPayment.for_which_month,
                      comment: editingPayment.comment || "",
                      shouldBeConsideredAsPaid: editingPayment.shouldBeConsideredAsPaid,
                    }),
                    credentials: "include",
                  });

                  if (res.ok) {
                    toast.success("To'lov muvaffaqiyatli yangilandi");

                    // Yangi ma'lumotlarni qayta yuklash
                    const updatedRes = await fetch(`${API_URL}/get_payments_by_student/${selectedStudent.id}`, {
                      credentials: "include",
                    });
                    if (updatedRes.ok) {
                      const updatedData = await updatedRes.json();
                      setStudentPayments(updatedData);
                    }

                    setEditPaymentModalOpen(false);
                  } else {
                    const err = await res.json();
                    toast.error(err.message || "Yangilashda xatolik");
                  }
                } catch (err) {
                  console.error(err);
                  toast.error("Server bilan bog'lanishda xatolik");
                }
              }}
              className="p-6 space-y-5"
            >
              {/* To'lov miqdori */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To'lov miqdori (so'm) *
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500"
                  value={editingPayment.payment_amount || ""}
                  onChange={(e) =>
                    setEditingPayment({
                      ...editingPayment,
                      payment_amount: e.target.value,
                    })
                  }
                  min="0"
                  required
                />
              </div>

              {/* To'lov turi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To'lov turi *
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500"
                  value={editingPayment.payment_type || ""}
                  onChange={(e) =>
                    setEditingPayment({
                      ...editingPayment,
                      payment_type: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Tanlang</option>
                  <option value="Naqd">Naqd</option>
                  <option value="Plastik karta orqali">Plastik karta orqali</option>
                  <option value="Bank o'tkazmasi">Bank o'tkazmasi</option>
                </select>
              </div>

              {/* Qabul qilgan mas'ul */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qabul qilgan mas'ul *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500"
                  value={editingPayment.received || ""}
                  onChange={(e) =>
                    setEditingPayment({
                      ...editingPayment,
                      received: e.target.value,
                    })
                  }
                  placeholder="F.I.Sh. kiriting"
                  required
                />
              </div>

              {/* Qaysi oy uchun */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qaysi oy uchun *
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500"
                  value={editingPayment.for_which_month || ""}
                  onChange={(e) =>
                    setEditingPayment({
                      ...editingPayment,
                      for_which_month: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Oy tanlang</option>
                  {["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Izoh */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Izoh</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  value={editingPayment.comment || ""}
                  onChange={(e) =>
                    setEditingPayment({
                      ...editingPayment,
                      comment: e.target.value,
                    })
                  }
                  placeholder="Qo'shimcha ma'lumot..."
                />
              </div>

              {/* Imtiyozli to'lov toggle */}
              <div className="flex items-center justify-between bg-gray-50 p-3 ">
                <span className="text-gray-700 font-medium">
                  Imtiyozli to'lov (to'liq deb hisoblash)
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={editingPayment.shouldBeConsideredAsPaid}
                    onChange={() =>
                      setEditingPayment({
                        ...editingPayment,
                        shouldBeConsideredAsPaid: !editingPayment.shouldBeConsideredAsPaid,
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditPaymentModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700  hover:bg-gray-300"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white  hover:bg-blue-700 flex items-center gap-2"
                >
                  <Pen size={16} />
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedStudent(null)}>
          <div className="bg-white shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#104292] text-white ">
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
                <div className="bg-blue-50 p-4  border border-blue-100">
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

                <div className="bg-green-50 p-4  border border-green-100">
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
                <div className="bg-purple-50 p-4  border border-purple-100">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3">Identifikator</h3>
                  <div className="flex items-center justify-center">
                    <span className="bg-purple-100 text-purple-800 py-2 px-4 rounded-full font-mono text-lg">
                      ID{selectedStudent.studental_id}
                    </span>
                  </div>
                </div>

                <div className="bg-amber-50 p-4  border border-amber-100">
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

                      // return (
                      //   console.log(totalGroups, paidGroups),
                      //   <span className={paidGroups === totalGroups && paidGroups > 0 ? "bg-green-100 text-green-800" :
                      //     paidGroups > 0 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                      //     {paidGroups === totalGroups && paidGroups > 0 ? "Toʻliq toʻlangan" :
                      //       paidGroups > 0 ? "Qisman toʻlangan" : "Toʻlanmagan"}
                      //   </span>
                      // );
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
                      <div key={index} className="border border-gray-200  p-4 hover:shadow-md transition-shadow">
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
              {/* To'lovlar tarixi */}
              <div className="mt-10">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                  <CreditCard size={24} className="text-green-600" />
                  To'lovlar tarixi ({studentPayments.length} ta)
                </h3>

                {loadingPayments ? (
                  <div className="text-center py-8">
                    <LottieLoading /> {/* yoki oddiy spinner */}
                    <p className="mt-2 text-gray-500">To'lovlar yuklanmoqda...</p>
                  </div>
                ) : studentPayments.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200  p-8 text-center">
                    <AlertCircle size={40} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">Hozircha to'lovlar mavjud emas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studentPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="border border-gray-200  p-4 hover:shadow-md transition-all bg-white"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-lg text-gray-800">
                              {Number(payment.payment_amount).toLocaleString('uz-UZ')} so‘m
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {payment.for_which_month} oyi uchun
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${payment.shouldBeConsideredAsPaid
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                                }`}
                            >
                              {payment.shouldBeConsideredAsPaid ? "Imtiyozli" : "To‘liq"}
                            </span>

                            <button
                              onClick={() => openEditPaymentModal(payment)}
                              className="p-2 bg-blue-50 hover:bg-blue-100 rounded-full transition"
                              title="Tahrirlash"
                            >
                              <Pen size={16} className="text-blue-600" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Turi:</span><br />
                            <strong>{payment.payment_type || "—"}</strong>
                          </div>
                          <div>
                            <span className="text-gray-500">Qabul qilgan:</span><br />
                            <strong>{payment.received || "—"}</strong>
                          </div>
                          <div>
                            <span className="text-gray-500">Guruh:</span><br />
                            <strong>{payment.group?.group_subject || "—"}</strong>
                          </div>
                          <div>
                            <span className="text-gray-500">Sana:</span><br />
                            <strong>
                              {payment.created_at
                                ? new Date(payment.created_at).toLocaleDateString("uz-UZ")
                                : "—"}
                            </strong>
                          </div>
                          {payment.comment && (
                            <div className="col-span-2 sm:col-span-3 mt-2 pt-2 border-t border-gray-100">
                              <span className="text-gray-500">Izoh:</span><br />
                              <p className="text-gray-700 mt-1">{payment.comment}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                className="px-5 py-2 btn btn-secondary text-gray-700  hover:bg-gray-400 transition-colors"
                onClick={() => setSelectedStudent(null)}
              >
                Yopish
              </button>
              <button
                className="px-5 py-2 btn btn-primary text-white  hover:bg-blue-700 transition-colors flex items-center gap-2"
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

      {markLeftModal.open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeMarkLeftModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <LogOut size={20} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Ketgan deb belgilash
                </h2>
                <p className="text-xs text-gray-500">
                  O'quvchi alohida "Ketgan o'quvchilar" sahifasiga o'tkaziladi.
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-4">
              <span className="font-semibold">{markLeftModal.name}</span> ni ketgan deb belgilamoqchimisiz?
            </p>

            <label className="block mb-4">
              <span className="block text-sm font-medium text-gray-700 mb-1">
                Ketish sanasi
              </span>
              <input
                type="date"
                value={markLeftModal.date}
                onChange={(e) =>
                  setMarkLeftModal((prev) => ({ ...prev, date: e.target.value }))
                }
                max={todayLocalISO()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
              <span className="block text-xs text-gray-500 mt-1">
                Bo'sh qoldirilsa, bugungi sana ishlatiladi.
              </span>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                onClick={closeMarkLeftModal}
              >
                Bekor qilish
              </button>
              <button
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center gap-2"
                onClick={confirmMarkLeft}
              >
                <LogOut size={16} />
                Ketgan deb belgilash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;