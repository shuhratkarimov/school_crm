"use client";

import { useState, useEffect } from "react";
import { Check, Trash2, Edit2 } from "lucide-react";
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
  });

  const [formData, setFormData] = useState({
    group_id: "",
    pupil_id: "",
    payment_amount: "",
    payment_type: "",
    received: "",
    for_which_month: "",
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
  const selectMonths = allMonths.filter((month) => !radioMonths.includes(month));

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

      const [groupsResponse, studentsResponse, paymentsResponse] = await Promise.all([
        fetch("http://localhost:3000/get_groups").catch(() => ({ ok: false })),
        fetch("http://localhost:3000/get_students").catch(() => ({ ok: false })),
        fetch("http://localhost:3000/get_payments").catch(() => ({ ok: false })),
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
        toast.error("Guruhlar yuklanmadi: Hali mavjud emas", {
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

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData);
      } else {
        setPayments([]);
        toast.error("To'lovlar yuklanmadi: Hali mavjud emas", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      setGroups([]);
      setStudents([]);
      setPayments([]);
      toast.error("Ma'lumotlarni yuklashda umumiy xatolik yuz berdi", {
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
      const response = await fetch("http://localhost:3000/create_payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pupil_id: formData.pupil_id,
          payment_amount: Number(formData.payment_amount),
          payment_type: formData.payment_type,
          received: formData.received,
          for_which_month: formData.for_which_month,
        }),
      });

      if (response.ok) {
        const newPayment = await response.json();
        const student = students.find((s) => s.id === formData.pupil_id);
        const paymentWithStudent = {
          ...newPayment,
          student: student || { first_name: "N/A", last_name: "N/A", phone_number: "N/A" },
        };
        setPayments([...payments, paymentWithStudent]);
        setSuccess("To'lov muvaffaqiyatli amalga oshirildi");
        setFormData({
          group_id: "",
          pupil_id: "",
          payment_amount: "",
          payment_type: "",
          received: "",
          for_which_month: currentMonth,
        });
        setStudentSearch("");
        setSearchTerm("");
        setShowDropdown(false);
      } else {
        throw new Error("To'lov qo'shishda xatolik");
      }
    } catch (err) {
      toast.error("To'lov qo'shishda xatolik: API mavjud emas", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const updatePayment = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `http://localhost:3000/update_payment/${editFormData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pupil_id: editFormData.pupil_id,
            payment_amount: Number(editFormData.payment_amount),
            payment_type: editFormData.payment_type,
            received: editFormData.received,
            for_which_month: editFormData.for_which_month,
          }),
        }
      );

      if (response.ok) {
        const updatedPayment = await response.json();
        const student = students.find((s) => s.id === editFormData.pupil_id);
        const paymentWithStudent = {
          ...updatedPayment,
          student: student || { first_name: "N/A", last_name: "N/A", phone_number: "N/A" },
        };
        setPayments(
          payments.map((p) => (p.id === editFormData.id ? paymentWithStudent : p))
        );
        setSuccess("To'lov muvaffaqiyatli yangilandi");
        setIsEditModalOpen(false);
      } else {
        throw new Error("To'lov yangilashda xatolik");
      }
    } catch (err) {
      toast.error("To'lov yangilashda xatolik: API mavjud emas", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const deletePayment = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:3000/delete_payment/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setPayments(payments.filter((p) => p.id !== id));
        setSuccess("To'lov muvaffaqiyatli o'chirildi");
      } else {
        throw new Error("To'lov o'chirishda xatolik");
      }
    } catch (err) {
      toast.error("To'lov o'chirishda xatolik: API mavjud emas", {
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
    });
    setIsEditModalOpen(true);
  };

  const filteredStudents = formData.group_id
    ? students
        .filter((student) => student.group_id === formData.group_id)
        .filter((student) =>
          `${student.first_name} ${student.last_name}`
            .toLowerCase()
            .includes(studentSearch.toLowerCase())
        )
    : [];

  const handleStudentSelect = (student) => {
    setFormData({ ...formData, pupil_id: student.id });
    setStudentSearch(`${student.first_name} ${student.last_name}`);
    setShowDropdown(false);
  };

  // Check for overdue payments
  const isOverdue = (studentId) => {
    const studentPayments = payments.filter(
      (p) => p.pupil_id === studentId
    );
    const currentOrNextMonthPaid = studentPayments.some(
      (p) =>
        [currentMonth, nextMonth].includes(p.for_which_month) &&
        new Date(p.created_at) >= new Date(now.getFullYear(), now.getMonth() - 1, 1)
    );
    return !currentOrNextMonthPaid && students.find((s) => s.id === studentId);
  };

  const sendNotification = async (studentId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/payment_alert/${studentId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" }
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

  const filteredPayments = payments.filter((payment) =>
    `${payment.student?.first_name} ${payment.student?.last_name}`
      ?.toLowerCase()
      ?.includes(searchTerm.toLowerCase()) &&
    (monthFilter === "all" || payment.for_which_month === monthFilter)
  );

  useEffect(() => {
    if (formData.group_id && groups.length > 0) {
      const selectedGroup = groups.find((group) => group.id === formData.group_id);
      if (selectedGroup && selectedGroup.payment_amount) {
        setFormData((prev) => ({
          ...prev,
          payment_amount: selectedGroup.payment_amount.toString(),
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, payment_amount: "" }));
    }
  }, [formData.group_id, groups]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.group_id && studentSearch) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [formData.group_id, studentSearch]);

  useEffect(() => {}, [formData.group_id, studentSearch, filteredStudents]);

  useEffect(() => {}, [payments]);

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
    return <LottieLoading />
  }

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>
          Diqqat! Ushbu to'lovga tegishli barcha ma'lumotlar o'chiriladi! O'chirishga
          ishonchingiz komilmi?
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
              deletePayment(id);
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

  return (
    <div className="container">
      <h1 style={{ marginBottom: "24px" }}>To'lovlar</h1>

      {success && <div className="success">{success}</div>}
      {groupsError && <div className="error">{groupsError}</div>}
      {studentsError && <div className="error">{studentsError}</div>}
      {paymentsError && <div className="error">{paymentsError}</div>}

      <ToastContainer />

      {/* To'lov qo'shish formasi */}
      <div className="card">
        <h3 style={{ marginBottom: "20px" }}>To'lov qilish</h3>
        <form onSubmit={addPayment} className="payment-form">
          <div className="form-row">
            <div className="form-group">
              <label>Guruh</label>
              <select
                className="select"
                value={formData.group_id}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    group_id: e.target.value,
                    pupil_id: "",
                  });
                  setStudentSearch("");
                  setShowDropdown(false);
                }}
                required
                disabled={groups.length === 0}
              >
                <option value="">{groupsError ? "Guruhlar yo'q" : "Tanlang"}</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.group_subject}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>O'quvchi</label>
              <input
                type="text"
                className="input"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="O'quvchi ismini kiriting..."
                disabled={!formData.group_id || students.length === 0}
              />
              {showDropdown && filteredStudents.length > 0 && (
                <div className="dropdown">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="dropdown-item"
                      onClick={() => handleStudentSelect(student)}
                    >
                      {`${student.first_name} ${student.last_name}`}
                    </div>
                  ))}
                </div>
              )}
              {showDropdown && filteredStudents.length === 0 && (
                <div className="dropdown">O'quvchi topilmadi</div>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>To'lov miqdori</label>
              <input
                type="number"
                className="input"
                value={formData.payment_amount}
                onChange={(e) =>
                  setFormData({ ...formData, payment_amount: e.target.value })
                }
                onFocus={(e) => {
                  if (
                    e.target.value ===
                    groups.find((g) => g.id === formData.group_id)?.payment_amount
                      .toString()
                  ) {
                    e.target.value = ""; // Avtomatik kiritilgan summani o'chirish
                  }
                }}
                placeholder="350000"
                min="0"
                required
              />
            </div>
            <div className="form-group">
              <label>To'lov turi</label>
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
          </div>
          <div className="form-row">
            <div className="form-group full-width">
              <label>Qaysi oy uchun to'lov qilinyapti</label>
              <div className="month-options">
                {radioMonths.map((month) => (
                  <label key={month} className="radio-label">
                    <input
                      className="radio"
                      type="radio"
                      name="month"
                      value={month}
                      checked={formData.for_which_month === month}
                      onChange={() => handleChange(month)}
                    />{" "}
                    {month}
                  </label>
                ))}
                <select
                  className="select"
                  value={
                    radioMonths.includes(formData.for_which_month)
                      ? ""
                      : formData.for_which_month
                  }
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
          <div className="form-row">
            <div className="form-group full-width">
              <label>Qabul qilgan mas'ul F.I.Sh.</label>
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
          </div>
          <button type="submit" className="btn btn-primary">
            To'lov qilish
          </button>
        </form>
      </div>

      {isEditModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{ marginBottom: "16px" }}>To'lovni yangilash</h3>
            <form onSubmit={updatePayment}>
              <div className="form-grid">
                <div className="form-group">
                  <label>To'lov miqdori</label>
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
                  <label>To'lov turi</label>
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
                  <label>Qaysi oy uchun to'lov</label>
                  <div className="month-options">
                    {radioMonths.map((month) => (
                      <label key={month} className="radio-label">
                        <input
                          type="radio"
                          name="edit_month"
                          value={month}
                          checked={editFormData.for_which_month === month}
                          onChange={() => handleEditChange(month)}
                        />{" "}
                        {month}
                      </label>
                    ))}
                    <select
                      className="select"
                      value={
                        radioMonths.includes(editFormData.for_which_month)
                          ? ""
                          : editFormData.for_which_month
                      }
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
                  <label>Qabul qilgan mas'ul F.I.Sh.</label>
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
          <h3>To'lov qilganlar ({filteredPayments.length})</h3>
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
              <th>№</th>
              <th>Ism</th>
              <th>Telefon</th>
              <th>Summa</th>
              <th>To'lov turi</th>
              <th>Qabul qilgan mas'ul</th>
              <th>Qaysi oy uchun</th>
              <th>Sana</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "10px" }}>
                  {searchTerm || monthFilter !== "all"
                    ? "Qidiruv bo'yicha natija topilmadi"
                    : paymentsError || "Hozircha to'lovlar yo'q"}
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment, index) => (
                <tr key={payment.id}>
                  <td>{index + 1}</td>
                  <td>
                    {`${payment.student?.first_name || ""} ${
                      payment.student?.last_name || ""
                    }`.trim() || "N/A"}
                  </td>
                  <td>{payment.student?.phone_number || "N/A"}</td>
                  <td>
                    {payment.payment_amount
                      ? Number(payment.payment_amount).toLocaleString("uz-UZ") +
                        " so'm"
                      : "N/A"}
                  </td>
                  <td>{payment.payment_type || "N/A"}</td>
                  <td>{payment.received || "N/A"}</td>
                  <td>{payment.for_which_month || "N/A"}</td>
                  <td>
                    {payment.created_at
                      ? new Date(payment.created_at).toLocaleDateString("uz-UZ")
                      : "N/A"}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => openEditModal(payment)}
                      style={{ marginRight: "4px", padding: "4px 8px" }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => showDeleteToast(payment.id)}
                      style={{ padding: "4px 8px" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
            {/* Display overdue students without payments */}
            {students
              .filter((student) => isOverdue(student.id))
              .map((student, index) => (
                <tr key={`overdue-${student.id}`}>
                  <td>{filteredPayments.length + index + 1}</td>
                  <td>{`${student.first_name} ${student.last_name}`}</td>
                  <td>{student.phone_number || "N/A"}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>{currentMonth}</td>
                  <td>-</td>
                  <td>
                    <button
                      className="btn btn-warning"
                      onClick={() => sendNotification(student.id)}
                      style={{ padding: "4px 8px", backgroundColor: "#f59e0b" }}
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