"use client";

import { useState, useEffect } from "react";
import { Trash2, BookOpen, Plus, Pen } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/styles.css";
import LottieLoading from "../components/Loading";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [groupsError, setGroupsError] = useState("");
  const [studentsError, setStudentsError] = useState("");
  const [paymentsError, setPaymentsError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [monthFilter, setMonthFilter] = useState("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    pupil_id: "",
    payment_amount: "",
    payment_type: "",
    received: "",
    for_which_month: "",
    comment: "",
  });
  const [addModal, setAddModal] = useState(false);

  const [formData, setFormData] = useState({
    for_which_group: "", // "group_id" o'rniga "for_which_group"
    pupil_id: "",
    payment_amount: "",
    payment_type: "",
    received: "",
    for_which_month: "",
    comment: "",
  });

  const allMonths = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentyabr",
    "Oktyabr",
    "Noyabr",
    "Dekabr",
  ];

  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const currentMonth = allMonths[currentMonthIndex];
  const nextMonth = allMonths[(currentMonthIndex + 1) % 12];
  const radioMonths = [currentMonth, nextMonth];
  const selectMonths = allMonths.filter(
    (month) => !radioMonths.includes(month)
  );

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      for_which_month: currentMonth,
    }));
  }, [currentMonth]);

  const handleChange = (value) => {
    setFormData({ ...formData, for_which_month: value });
  };

  const handleEditChange = (value) => {
    setEditFormData({ ...editFormData, for_which_month: value });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setGroupsError("");
      setStudentsError("");
      setPaymentsError("");

      const [groupsResponse, studentsResponse, paymentsResponse] =
        await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/get_groups`).catch(() => ({
            ok: false,
          })),
          fetch(`${import.meta.env.VITE_API_URL}/get_students`).catch(() => ({
            ok: false,
          })),
          fetch(`${import.meta.env.VITE_API_URL}/get_payments`).catch(() => ({
            ok: false,
          })),
        ]);

      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        const groupsWithAmount = groupsData.map((group) => ({
          ...group,
          payment_amount: group.monthly_fee,
        }));
        setGroups(groupsWithAmount);
      } else {
        setGroups([]);
        toast.info("To'lovlar mavjud emas", {
          position: "top-right",
          autoClose: 3000,
        });
      }

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);
      } else {
        setStudents([]);
        toast.info("O'quvchilar mavjud emas", {
          position: "top-right",
          autoClose: 3000,
        });
      }

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        console.log(paymentsData)
        setPayments(paymentsData);
      } else {
        setPayments([]);
        toast.info("To'lovlar mavjud emas", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      setGroups([]);
      setStudents([]);
      setPayments([]);
      toast.warning("Ma'lumotlarni yuklashda umumiy xatolik yuz berdi", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const addPayment = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/create_payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pupil_id: formData.pupil_id,
            for_which_group: formData.for_which_group,
            payment_amount: Number(formData.payment_amount),
            payment_type: formData.payment_type,
            received: formData.received,
            for_which_month: formData.for_which_month,
            comment: formData.comment,
          }),
        }
      );

      if (response.ok) {
        await fetchData();
        setSuccess("To'lov muvaffaqiyatli amalga oshirildi");
        setFormData({
          for_which_group: "",
          pupil_id: "",
          payment_amount: "",
          payment_type: "",
          received: "",
          for_which_month: currentMonth,
        });
        setStudentSearch("");
        setSearchTerm("");
        setShowDropdown(false);
        setAddModal(false);
        toast.success("To'lov muvaffaqiyatli qo'shildi", {
          position: "top-right",
          autoClose: 3000,
        });
      }
      else if (response.status === 400) {
        const errorData = await response.json();
        toast.warning(`${errorData.message}`, {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        const errorData = await response.json();
        toast.warning(`${errorData.message}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      toast.error(`${err.message}`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const updatePayment = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/update_payment/${editFormData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pupil_id: editFormData.pupil_id,
            payment_amount: Number(editFormData.payment_amount),
            payment_type: editFormData.payment_type,
            received: editFormData.received,
            for_which_month: editFormData.for_which_month,
            comment: editFormData.comment,
          }),
        }
      );

      if (response.ok) {
        const updatedPayment = await response.json();
        const student = students.find((s) => s.id === editFormData.pupil_id);
        const paymentWithStudent = {
          ...updatedPayment,
          student: student || {
            first_name: "N/A",
            last_name: "N/A",
            phone_number: "N/A",
          },
        };
        setPayments(
          payments.map((p) =>
            p.id === editFormData.id ? paymentWithStudent : p
          )
        );
        toast.success(`To'lov muvaffaqiyatli yangilandi`, {
          position: "top-right",
          autoClose: 3000,
        });
        setIsEditModalOpen(false);
      } else {
        const errorData = await response.json();
        toast.warning(`${errorData.message}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      toast.warning(`${err.message}`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const deletePayment = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/delete_payment/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setPayments(payments.filter((p) => p.id !== id));
        toast.success(`To'lov muvaffaqiyatli o'chirildi`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      toast.warning(`${err.message}`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const openEditModal = (payment) => {
    setEditFormData({
      id: payment.id,
      pupil_id: payment.pupil_id,
      payment_amount: payment.payment_amount,
      payment_type: payment.payment_type,
      received: payment.received,
      for_which_month: payment.for_which_month,
      comment: payment.comment,
    });
    setIsEditModalOpen(true);
  };

  const filteredStudents = students.filter((student) =>
    `${student.first_name} ${student.last_name}`
      .toLowerCase()
      .includes(studentSearch.toLowerCase())
  );

  const handleStudentSelect = (student) => {
    setFormData({ ...formData, pupil_id: student.id, group_id: "" });
    setStudentSearch(`${student.first_name} ${student.last_name}`);
    setShowDropdown(false);
  };

  const getStudentGroups = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student?.groups.map((group) => group.id) || []; // `groups` dan `id` larni olish
  };

  const isOverdue = (studentId) => {
    const studentPayments = payments.filter((p) => p.pupil_id === studentId);
    const currentOrNextMonthPaid = studentPayments.some(
      (p) =>
        [currentMonth, nextMonth].includes(p.for_which_month) &&
        new Date(p.created_at) >=
        new Date(now.getFullYear(), now.getMonth() - 1, 1)
    );
    return !currentOrNextMonthPaid && students.find((s) => s.id === studentId);
  };

  const sendNotification = async (studentId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/payment_alert/${studentId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        toast.success("Xabar muvaffaqiyatli jo'natildi", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        throw new Error("Xabarni jo'natishda xatolik");
      }
    } catch (err) {
      toast.error("Xabarni jo'natishda xatolik: API mavjud emas", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const filteredPayments = payments.filter(
    (payment) =>
      `${payment.student?.first_name} ${payment.student?.last_name}`
        ?.toLowerCase()
        ?.includes(searchTerm.toLowerCase()) &&
      (monthFilter === "all" || payment.for_which_month === monthFilter)
  );

  useEffect(() => {
    if (formData.pupil_id && groups.length > 0) {
      const studentGroups = getStudentGroups(formData.pupil_id);
      const selectedGroup = groups.find(
        (group) => group.id === formData.for_which_group
      ); // "group_id" o'rniga "for_which_group"
      if (selectedGroup && studentGroups.includes(selectedGroup.id)) {
        setFormData((prev) => ({
          ...prev,
          payment_amount: selectedGroup.payment_amount.toString(),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          payment_amount: "",
          for_which_group: "",
        })); // "group_id" o'rniga "for_which_group"
      }
    }
  }, [formData.pupil_id, formData.for_which_group, groups]); // "group_id" o'rniga "for_which_group"

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (studentSearch) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [studentSearch]);

  useEffect(() => { }, [formData.pupil_id, studentSearch, filteredStudents]);

  useEffect(() => { }, [payments]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
    if (groupsError || studentsError || paymentsError) {
      const timer = setTimeout(() => {
        setGroupsError("");
        setStudentsError("");
        setPaymentsError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, groupsError, studentsError, paymentsError]);

  if (loading) {
    return <LottieLoading />;
  }

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>
          Diqqat! Ushbu to'lovga tegishli barcha ma'lumotlar o'chiriladi!
          O'chirishga ishonchingiz komilmi?
        </p>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            style={{
              padding: "2px 22px",
              background: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => {
              deletePayment(id);
              toast.dismiss();
            }}
          >
            O'chirish
          </button>
          <button
            style={{
              padding: "2px 22px",
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

  return (
    <div>
      <ToastContainer />
      <div className="flex justify-between items-center gap-2 pl-6 pr-6 mb-6">
        <div className="flex items-center gap-2">
          <BookOpen size={24} color="#104292" />
          <h1 className="text-2xl font-bold">To'lovlar</h1>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setAddModal(true)}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Plus size={20} />
          To'lov qo'shish
        </button>
      </div>
      {isEditModalOpen && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "600px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header bg-[#104292] p-2 text-white rounded-[10px]">
              <h3 className="text-center text-lg font-bold">To'lovni tahrirlash</h3>
            </div>
            <form onSubmit={updatePayment}>
              <div className="form-grid" style={{ display: "grid", gap: "16px" }}>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    To'lov miqdori
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={editFormData.payment_amount}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        payment_amount: e.target.value,
                      })
                    }
                    placeholder="350000"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    To'lov turi
                  </label>
                  <select
                    className="select"
                    value={editFormData.payment_type}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        payment_type: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Tanlang</option>
                    <option value="Naqd">Naqd</option>
                    <option value="Plastik karta orqali">Karta</option>
                    <option value="Bank o'tkazmasi">Bank o'tkazmasi</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    Qaysi oy uchun to'lov
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "center" }}>
                    {radioMonths.map((month) => (
                      <label
                        key={month}
                        style={{ display: "flex", alignItems: "center", marginRight: "15px", whiteSpace: "nowrap" }}
                      >
                        <input
                          type="radio"
                          style={{ scale: "1.5", marginRight: "5px", cursor: "pointer" }}
                          name="edit_month"
                          value={month}
                          checked={editFormData.for_which_month === month}
                          onChange={() => handleEditChange(month)}
                        />
                        {month}
                      </label>
                    ))}
                    <select
                      className="select"
                      value={radioMonths.includes(editFormData.for_which_month) ? "" : editFormData.for_which_month}
                      onChange={(e) => handleEditChange(e.target.value)}
                    >
                      <option value="">Boshqa oy tanlang</option>
                      {selectMonths.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group full-width">
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    Qabul qilgan mas'ul F.I.Sh.
                  </label>
                  <input
                    className="input"
                    value={editFormData.received}
                    placeholder="Kim to'lovni qabul qilganligini kiriting..."
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        received: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    Izoh (ixtiyoriy)
                  </label>
                  <input
                    className="input"
                    value={editFormData.comment}
                    placeholder="Izohni kiriting..."
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        comment: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
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

      {addModal && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setAddModal(false)}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "600px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header bg-[#104292] p-2 text-white rounded-[10px]">
              <h3 className="text-center text-lg font-bold">Yangi to'lov qo'shish</h3>
            </div>
            <form onSubmit={addPayment}>
              <div className="form-grid" style={{ display: "grid", gap: "16px" }}>
                <div className="form-group" style={{ position: "relative" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    O'quvchi
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder="O'quvchi ismini kiriting..."
                    disabled={students.length === 0}
                  />
                  {showDropdown && filteredStudents.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#fff",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        maxHeight: "150px",
                        overflowY: "auto",
                        zIndex: 10,
                      }}
                    >
                      {filteredStudents.map((student) => (
                        <div
                          key={student.id}
                          style={{
                            padding: "8px",
                            cursor: "pointer",
                            background: "#f9f9f9",
                            borderBottom: "1px solid #eee",
                          }}
                          onClick={() => handleStudentSelect(student)}
                        >
                          {`${student.first_name} ${student.last_name}`}
                        </div>
                      ))}
                    </div>
                  )}
                  {showDropdown && filteredStudents.length === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#fff",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        padding: "8px",
                        color: "#666",
                      }}
                    >
                      O'quvchi topilmadi
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    Guruh
                  </label>
                  <select
                    className="select"
                    value={formData.for_which_group}
                    onChange={(e) =>
                      setFormData({ ...formData, for_which_group: e.target.value })
                    }
                    required
                    disabled={!formData.pupil_id || getStudentGroups(formData.pupil_id).length === 0}
                  >
                    <option value="">Tanlang</option>
                    {formData.pupil_id &&
                      getStudentGroups(formData.pupil_id).map((groupId) => {
                        const group = groups.find((g) => g.id === groupId);
                        return (
                          group && (
                            <option key={group.id} value={group.id}>
                              {group.group_subject}
                            </option>
                          )
                        );
                      })}
                  </select>
                  {formData.pupil_id && getStudentGroups(formData.pupil_id).length === 0 && (
                    <p style={{ color: "red", fontSize: "0.9rem", marginTop: "5px" }}>
                      Ushbu o‘quvchiga hech qanday guruh bog‘lanmagan!
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    To'lov miqdori
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={formData.payment_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_amount: e.target.value })
                    }
                    onFocus={(e) => {
                      const selectedGroup = groups.find((g) => g.id === formData.for_which_group);
                      if (e.target.value === selectedGroup?.payment_amount.toString()) {
                        e.target.value = "";
                      }
                    }}
                    placeholder="350000"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    To'lov turi
                  </label>
                  <select
                    className="select"
                    value={formData.payment_type}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_type: e.target.value })
                    }
                    required
                  >
                    <option value="">Tanlang</option>
                    <option value="Naqd">Naqd</option>
                    <option value="Plastik karta orqali">Karta</option>
                    <option value="Bank o'tkazmasi">Bank o'tkazmasi</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    Qabul qilgan mas'ul F.I.Sh.
                  </label>
                  <input
                    className="input"
                    value={formData.received}
                    placeholder="Kim to'lovni qabul qilganligini kiriting..."
                    onChange={(e) =>
                      setFormData({ ...formData, received: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    Izoh (ixtiyoriy)
                  </label>
                  <input
                    className="input"
                    value={formData.comment}
                    placeholder="Izohni kiriting..."
                    onChange={(e) =>
                      setFormData({ ...formData, comment: e.target.value })
                    }
                  />
                </div>
                <div className="form-group full-width">
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    Qaysi oy uchun to'lov
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "center" }}>
                    {radioMonths.map((month) => (
                      <label
                        key={month}
                        style={{ display: "flex", alignItems: "center", marginRight: "15px", whiteSpace: "nowrap" }}
                      >
                        <input
                          type="radio"
                          style={{ scale: "1.5", marginRight: "5px", cursor: "pointer" }}
                          name="month"
                          value={month}
                          checked={formData.for_which_month === month}
                          onChange={() => handleChange(month)}
                        />
                        {month}
                      </label>
                    ))}
                    <select
                      className="select"
                      value={radioMonths.includes(formData.for_which_month) ? "" : formData.for_which_month}
                      onChange={(e) => handleChange(e.target.value)}
                    >
                      <option value="">Boshqa oy tanlang</option>
                      {selectMonths.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
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

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <h3 style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
            To'lov qilganlar (
            {filteredPayments.length})
          </h3>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <input
              type="text"
              className="input"
              style={{ width: "300px" }}
              placeholder="O'quvchi ismini kiriting..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="select"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              style={{ width: "200px" }}
            >
              <option value="all">Barcha oylar</option>
              {allMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid rgb(255, 255, 255)", textAlign: "center" }}>#</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid rgb(255, 255, 255)", textAlign: "center" }}>Ism</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid rgb(255, 255, 255)", textAlign: "center" }}>Summa</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid rgb(255, 255, 255)", textAlign: "center" }}>To'lov turi</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid rgb(255, 255, 255)", textAlign: "center" }}>Qabul qilgan mas'ul</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid rgb(255, 255, 255)", textAlign: "center" }}>Qaysi oy uchun</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid rgb(255, 255, 255)", textAlign: "center" }}>Qaysi guruh uchun</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid rgb(255, 255, 255)", textAlign: "center" }}>Sana</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid rgb(255, 255, 255)", textAlign: "center" }}>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  style={{ textAlign: "center", padding: "10px" }}
                >
                  {searchTerm || monthFilter !== "all"
                    ? "Qidiruv bo'yicha natija topilmadi"
                    : paymentsError || "Hozircha to'lovlar yo'q"}
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment, index) => {
                const group = groups.find(
                  (g) => g.id === payment.for_which_group
                );
                const groupName = group ? group.group_subject : "N/A";
                return (
                  <tr key={payment.id}>
                    <td style={{ textAlign: "center" }}>{index + 1}</td>
                    <td style={{ textAlign: "center" }}>
                      {`${payment.student?.first_name || ""} ${payment.student?.last_name || ""
                        }`.trim() || "N/A"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {payment.payment_amount
                        ? Number(payment.payment_amount).toLocaleString(
                          "uz-UZ"
                        ) + " so'm"
                        : "N/A"}
                    </td>
                    <td style={{ textAlign: "center" }}>{payment.payment_type || "N/A"}</td>
                    <td style={{ textAlign: "center" }}>{payment.received || "N/A"}</td>
                    <td style={{ textAlign: "center" }}>{payment.for_which_month || "N/A"}</td>
                    <td style={{ textAlign: "center" }}>{groupName}</td> {/* Yangi qo'shilgan qism */}
                    <td style={{ textAlign: "center" }}>
                      {payment.created_at
                        ? new Date(payment.created_at).toLocaleDateString("ru-RU")
                        : "N/A"}
                    </td>
                    <td style={{ textAlign: "center" }}>              <button
                      className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(payment);
                      }}
                      title="Tahrirlash"
                    >
                      <Pen size={16} />
                    </button>
                      <button
                        className="bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition ml-2"
                        onClick={(e) => {
                          e.stopPropagation();    
                          showDeleteToast(payment.id);
                        }}
                        title="O'chirish"
                      >
                        <Trash2 size={16} />
                      </button></td>
                  </tr>
                );
              })
            )}
            <tr>
              <td colSpan="9" style={{ textAlign: "center", fontWeight: "bold", color: "red" }}>
                Ushbu oy uchun to'lov amalga oshirmagan o'quvchilar
              </td>
            </tr>
            {/* Display overdue students without payments */}
            {students
              .filter((student) => isOverdue(student.id))
              .map((student, index) => (
                <tr
                  key={`overdue-${student.id}`}
                  style={{ backgroundColor: "#cfd694", color: "black" }}
                >
                  <td style={{ textAlign: "center" }}>{index + 1}</td>
                  <td style={{ textAlign: "center" }}>{`${student.first_name} ${student.last_name}`}</td>
                  <td colSpan={6} style={{ textAlign: "center", fontWeight: "bold" }}>
                    Ushbu oy uchun to'lov amalga oshirmagan
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      className="btn btn-warning"
                      onClick={() => sendNotification(student.id)}
                      style={{ backgroundColor: "red", color: "white" }}
                    >
                      Xabar jo'natish
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Payments;
