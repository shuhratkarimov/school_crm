"use client";

import { useState, useEffect } from "react";
import { Trash2, Edit } from "lucide-react";
import InputMask from "react-input-mask";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LottieLoading from "../components/Loading";

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
    group_ids: [], // Ko'p guruhlar uchun massiv
    parents_phone_number: "",
    came_in_school: "",
  });

  // Edit modal states
  const [editModal, setEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    father_name: "",
    mother_name: "",
    birth_date: "",
    phone_number: "",
    group_ids: [], // Ko'p guruhlar uchun massiv
    parents_phone_number: "",
    came_in_school: "",
    groups: [], // Guruhlar ro'yxati ko'rsatish uchun
  });

  function getMonthsInWord(thisMonth) {
    let months = {
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
    for (const key in months) {
      if (key == thisMonth) {
        thisMonth = months[key];
        return thisMonth;
      }
    }
  }

  const FormattedDate = (isoDate) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const formatted = `${day}.${month}.${year}`;
    return formatted;
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/get_students`
      );
      if (!response.ok)
        throw new Error(
          "O'quvchilar ma'lumotlarini olishda muammo yuzaga keldi!"
        );
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError("O'quvchilar ma'lumotlarini olishda muammo yuzaga keldi!");
      toast.error(
        "O'quvchilar ma'lumotlarini olishda xatolik yuz berdi: hali mavjud emas",
        { position: "top-right", autoClose: 3000 }
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/get_groups`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Guruhlar ma'lumotlarini olishda muammo yuzaga keldi! ${errorText}`
        );
      }
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      setError("Guruhlar ma'lumotlarini olishda muammo yuzaga keldi!");
      toast.error(
        `Guruhlar ma'lumotlarini olishda xatolik yuz berdi: ${err.message}`,
        { position: "top-right", autoClose: 3000 }
      );
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/get_teachers`
      );
      if (!response.ok)
        throw new Error("Ustozlar ma'lumotlarini olishda muammo yuzaga keldi!");
      const data = await response.json();
      setTeachers(data);
    } catch (err) {
      toast.error(
        "Ustozlar ma'lumotlarini olishda xatolik yuz berdi: hali mavjud emas",
        { position: "top-right", autoClose: 3000 }
      );
      setError("Ustozlar ma'lumotlarini olishda muammo yuzaga keldi!");
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
      toast.error("Iltimos, kamida bitta guruhni tanlang!", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const payload = {
      ...formData,
      birth_date: formatDate(formData.birth_date),
      came_in_school: formatDate(formData.came_in_school),
      group_ids: formData.group_ids, // Ko'p guruhlar uchun massiv
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/create_student`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok)
        throw new Error("O'quvchini qo'shishda muammo yuzaga keldi!");
      await fetchStudents();
      await fetchGroups();
      await fetchTeachers();
      setSuccess("Yangi o'quvchi muvaffaqiyatli qo'shildi!");
      toast.success("Yangi o'quvchi muvaffaqiyatli qo'shildi!", {
        position: "top-right",
        autoClose: 3000,
      });
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
    } catch (err) {
      toast.error(
        "O'quvchini qo'shishda muammo yuzaga keldi. Iltimos, barcha maydonlar kiritilganligiga e'tibor bering!",
        { position: "top-right", autoClose: 3000 }
      );
      setError(
        "O'quvchini qo'shishda muammo yuzaga keldi. Iltimos, barcha maydonlar kiritilganligiga e'tibor bering!"
      );
      console.error(err);
    }
  };

  const deleteStudent = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/delete_student/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok)
        throw new Error("O'quvchini o'chirishda muammo yuzaga keldi!");
      await fetchStudents();
      setSuccess("O'quvchi muvaffaqiyatli o'chirib tashlandi!");
      toast.success("O'quvchi muvaffaqiyatli o'chirib tashlandi!", {
        position: "top-right",
        autoClose: 3000,
      });
      setSelectedStudent(null);
    } catch (err) {
      setError(
        "O'quvchini o'chirishda muammo yuzaga keldi. Iltimos, birozdan so'ng qayta urinib ko'ring!"
      );
      toast.error(
        "O'quvchini o'chirishda muammo yuzaga keldi. Iltimos, birozdan so'ng qayta urinib ko'ring!",
        { position: "top-right", autoClose: 3000 }
      );
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
      toast.error("Iltimos, kamida bitta guruhni tanlang!", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const payload = {
      ...editFormData,
      birth_date: formatDate(editFormData.birth_date),
      came_in_school: formatDate(editFormData.came_in_school),
      group_ids: editFormData.group_ids, // Ko'p guruhlar uchun massiv
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/update_student/${editingStudent.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Failed to update student");
      await fetchStudents();
      await fetchGroups();
      await fetchTeachers();
      setSuccess("Student successfully updated");
      toast.success("O'quvchi ma'lumotlari muvaffaqiyatli yangilandi!", {
        position: "top-right",
        autoClose: 3000,
      });
      setEditModal(false);
      setSelectedStudent(null);
    } catch (err) {
      setError("Failed to update student. Please check the form data.");
      toast.error(
        "O'quvchi ma'lumotlarini yangilashda xatolik yuz berdi! Iltimos, barcha maydonlar to'ldirilganligini tekshiring!",
        { position: "top-right", autoClose: 3000 }
      );
      console.error(err);
    }
  };

  const openEditModal = (student) => {
    const studentGroups = student.groups || [];
    setEditingStudent(student);
    setEditFormData({
      ...student,
      groups: studentGroups,
      group_ids: studentGroups.map((group) => group.id), // Guruhlar ID lari
      birth_date: student.birth_date
        ? new Date(student.birth_date).toISOString().split("T")[0]
        : "",
      came_in_school: student.came_in_school
        ? new Date(student.came_in_school).toISOString().split("T")[0]
        : "",
    });
    setEditModal(true);
  };

  const openDetailModal = (student) => {
    setSelectedStudent(student);
  };

  // Calculate payment ratio for a student
  const getPaymentRatio = (student) => {
    const totalGroups = student.total_groups;
    if (totalGroups === 0) return "0/0";
    const paidGroups = student?.paid_groups;
    return `${paidGroups}/${totalGroups} (${Math.round(
      (paidGroups / totalGroups) * 100
    )}%)`;
  };

  // Filter students based on payment status
  const filteredStudents = students.filter((student) => {
    const matchesName = `${student.first_name} ${student.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const totalGroups = student.groups ? student.groups.length : 0;
    const paidGroups = student?.paid_groups;
    const isFullyPaid = totalGroups > 0 && paidGroups === totalGroups;
    const isPartiallyPaid =
      totalGroups > 0 && paidGroups > 0 && paidGroups < totalGroups;
    const isUnpaid = totalGroups > 0 && paidGroups === 0;

    const matchesPayment =
      paymentFilter === "all" ||
      (paymentFilter === "fullyPaid" && isFullyPaid) ||
      (paymentFilter === "partiallyPaid" && isPartiallyPaid) ||
      (paymentFilter === "unpaid" && isUnpaid);
    return matchesName && matchesPayment;
  });

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Change page
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

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, paymentFilter]);

  if (loading) {
    return <LottieLoading />;
  }

  return (
    <div>
      <h1>O'quvchilar</h1>

      {/* Toast Container */}
      <ToastContainer />

      {/* Add Student Form */}
      <div className="card">
        <h3 style={{ marginBottom: "20px" }}>Yangi o'quvchi qo'shish</h3>
        <form onSubmit={addStudent}>
          <div className="form-grid">
            <div className="form-group">
              <label>Ism</label>
              <input
                type="text"
                className="input"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                placeholder="O'quvchining familiyasi"
                required
              />
            </div>
            <div className="form-group">
              <label>Telefon raqami</label>
              <InputMask
                mask="+998 (99) 999-99-99"
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
              >
                {(inputProps) => (
                  <input
                    {...inputProps}
                    type="tel"
                    className="input"
                    placeholder="+998 (99) 999-99-99"
                    required
                  />
                )}
              </InputMask>
            </div>
            <div className="form-group">
              <label>Guruhlar</label>
              <select
                className="select"
                value=""
                onChange={(e) => {
                  const selectedGroupId = e.target.value;
                  if (
                    selectedGroupId &&
                    !formData.group_ids.includes(selectedGroupId)
                  ) {
                    setFormData((prev) => ({
                      ...prev,
                      group_ids: [...prev.group_ids, selectedGroupId],
                    }));
                  }
                }}
                style={{ marginBottom: "10px" }}
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
              <div>
                {formData.group_ids.map((groupId) => {
                  const group = groups.find((g) => g.id === groupId);
                  return group ? (
                    <div
                      key={groupId}
                      style={{
                        display: "inline-block",
                        background: "#e9ecef",
                        padding: "5px 10px",
                        margin: "5px",
                        borderRadius: "5px",
                      }}
                    >
                      {group.group_subject}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            group_ids: prev.group_ids.filter(
                              (id) => id !== groupId
                            ),
                          }))
                        }
                        style={{
                          marginLeft: "10px",
                          background: "none",
                          border: "none",
                          color: "#dc3545",
                          cursor: "pointer",
                        }}
                      >
                        x
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
            <div className="form-group">
              <label>Ota/onasining ismi va familiyasi</label>
              <input
                type="text"
                className="input"
                value={formData.father_name}
                onChange={(e) =>
                  setFormData({ ...formData, father_name: e.target.value })
                }
                placeholder="Ota/onasining ismi va familiyasini kiriting"
              />
            </div>
            <div className="form-group">
              <label>Ota/onasining telefon raqamini kiriting</label>
              <InputMask
                mask="+998 (99) 999-99-99"
                value={formData.parents_phone_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parents_phone_number: e.target.value,
                  })
                }
              >
                {(inputProps) => (
                  <input
                    {...inputProps}
                    type="tel"
                    className="input"
                    placeholder="+998 (99) 999-99-99"
                    required
                  />
                )}
              </InputMask>
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
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div className="form-group">
              <label>O'qishga kelgan vaqti</label>
              <input
                type="date"
                className="input"
                value={formData.came_in_school}
                onChange={(e) =>
                  setFormData({ ...formData, came_in_school: e.target.value })
                }
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            O'quvchini qo'shish
          </button>
        </form>
      </div>

      {/* Students List */}
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
          <h3>Bizning o'quvchilar ({filteredStudents.length} nafar)</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              className="input"
              style={{ width: "300px" }}
              placeholder="O'quvchilarni qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="select"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={{ minWidth: "150px" }}
            >
              <option value="all">Barcha o'quvchilar</option>
              <option value="fullyPaid">To'liq to'langan</option>
              <option value="partiallyPaid">Qisman to'langan</option>
              <option value="unpaid">Umuman to'lanmagan</option>
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>F.I.Sh.</th>
              <th>Telefon raqami</th>
              <th>Guruhlar</th>
              <th>Ota/onasining F.I.Sh.</th>
              <th>To'lov ({getMonthsInWord(new Date().getMonth() + 1)})</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  {searchTerm || paymentFilter !== "all"
                    ? "Ushbu qidiruv bo'yicha o'quvchi topilmadi..."
                    : "O'quvchilar yo'q"}
                </td>
              </tr>
            ) : (
              currentStudents.map((student, index) => (
                <tr
                  key={student.id}
                  onClick={() => openDetailModal(student)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{indexOfFirstStudent + index + 1}</td>
                  <td>{`${student.first_name} ${student.last_name}`}</td>
                  <td>{student.phone_number}</td>
                  <td>
                    {student.groups
                      ?.map((group) => group.group_subject)
                      .join(", ") || "N/A"}
                  </td>
                  <td>{student.father_name || "N/A"}</td>
                  <td>{getPaymentRatio(student)}</td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(student);
                        }}
                        style={{ padding: "4px 8px" }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          showDeleteToast(student.id);
                        }}
                        style={{ padding: "4px 8px" }}
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

        {/* Pagination Controls */}
        {filteredStudents.length > studentsPerPage && (
          <div
            className="pagination"
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-secondary"
              style={{ margin: "0 5px", padding: "5px 10px" }}
            >
              « Oldingi
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`btn ${
                    currentPage === number ? "btn-primary" : "btn-secondary"
                  }`}
                  style={{ margin: "0 5px", padding: "5px 10px" }}
                >
                  {number}
                </button>
              )
            )}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-secondary"
              style={{ margin: "0 5px", padding: "5px 10px" }}
            >
              Keyingi »
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>O'quvchi ma'lumotlarini yangilash</h3>
            </div>
            <form onSubmit={editStudent}>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Ismi</label>
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
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
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
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Telefon raqami</label>
                <InputMask
                  mask="+998 (99) 999-99-99"
                  value={editFormData.phone_number}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      phone_number: e.target.value,
                    })
                  }
                >
                  {(inputProps) => (
                    <input
                      {...inputProps}
                      type="tel"
                      className="input"
                      placeholder="+998 (99) 999-99-99"
                      required
                    />
                  )}
                </InputMask>
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Guruhlar</label>
                <select
                  className="select"
                  value=""
                  onChange={(e) => {
                    const selectedGroupId = e.target.value;
                    if (
                      selectedGroupId &&
                      !editFormData.group_ids.includes(selectedGroupId)
                    ) {
                      setEditFormData((prev) => ({
                        ...prev,
                        group_ids: [...prev.group_ids, selectedGroupId],
                      }));
                    }
                  }}
                  style={{ marginBottom: "10px" }}
                >
                  <option value="">Guruhni tanlang</option>
                  {groups
                    .filter(
                      (group) => !editFormData.group_ids.includes(group.id)
                    )
                    .map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.group_subject}
                      </option>
                    ))}
                </select>
                <div>
                  {editFormData.group_ids.map((groupId) => {
                    const group = groups.find((g) => g.id === groupId);
                    return group ? (
                      <div
                        key={groupId}
                        style={{
                          display: "inline-block",
                          background: "#e9ecef",
                          padding: "5px 10px",
                          margin: "5px",
                          borderRadius: "5px",
                        }}
                      >
                        {group.group_subject}
                        <button
                          type="button"
                          onClick={() =>
                            setEditFormData((prev) => ({
                              ...prev,
                              group_ids: prev.group_ids.filter(
                                (id) => id !== groupId
                              ),
                            }))
                          }
                          style={{
                            marginLeft: "10px",
                            background: "none",
                            border: "none",
                            color: "#dc3545",
                            cursor: "pointer",
                          }}
                        >
                          x
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Ota/onasining F.I.Sh.</label>
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
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Ota/onasining telefon raqami</label>
                <InputMask
                  mask="+998 (99) 999-99-99"
                  value={editFormData.parents_phone_number}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      parents_phone_number: e.target.value,
                    })
                  }
                >
                  {(inputProps) => (
                    <input
                      {...inputProps}
                      type="tel"
                      className="input"
                      placeholder="+998 (99) 999-99-99"
                      required
                    />
                  )}
                </InputMask>
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
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
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>O'qishga kelgan vaqti</label>
                <input
                  type="date"
                  className="input"
                  value={editFormData.came_in_school}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      came_in_school: e.target.value,
                    })
                  }
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed View Modal */}
      {selectedStudent && (
        <div className="modal" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>O'quvchi haqida batafsil ma'lumot</h3>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedStudent(null)}
                style={{ float: "right", padding: "4px 8px" }}
              >
                Yopish
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>F.I.Sh.:</strong> {selectedStudent.first_name}{" "}
                {selectedStudent.last_name}
              </p>
              <p>
                <strong>Telefon raqami:</strong> {selectedStudent.phone_number}
              </p>
              <p>
                <strong>Ota/onasining F.I.Sh.:</strong>{" "}
                {selectedStudent.father_name || "N/A"}
              </p>
              <p>
                <strong>Ota/onasining telefon raqami:</strong>{" "}
                {selectedStudent.parents_phone_number}
              </p>
              <p>
                <strong>Tug'ilgan sana:</strong>{" "}
                {selectedStudent.birth_date || "N/A"}
              </p>
              <p>
                <strong>O'qishni boshlagan sana:</strong>{" "}
                {FormattedDate(selectedStudent.came_in_school) || "N/A"}
              </p>
              <p>
                <strong>Guruhlar:</strong>{" "}
                {selectedStudent.groups
                  ?.map((group) => group.group_subject)
                  .join(", ") || "N/A"}
              </p>
              <p>
                <strong>O'quvchining unikal ID raqami:</strong>{" "}
                {`ID${selectedStudent.studental_id}` || "N/A"}
              </p>
              <p>
                <strong>
                  {getMonthsInWord(new Date().getMonth() + 1)} oyi uchun to'lov
                  holati:
                </strong>{" "}
                {getPaymentRatio(selectedStudent)}
              </p>
              <p style={{ marginTop: "10px" }}>
                <hr />
              </p>
              <p style={{ marginTop: "10px" }}>
                <strong>Guruhlar to‘lov holati:</strong>
              </p>
              {selectedStudent.groups &&
                selectedStudent.groups.map((group, index) => {
                  // studentGroups'dan mos group_id uchun paid qiymatini topamiz
                  const groupPaymentStatus = selectedStudent.studentGroups.find(
                    (sg) => sg.group_id === group.id
                  )?.paid;
                  return (
                    <div key={index} style={{ marginBottom: "10px" }}>
                      <p>
                        <strong>Guruh:</strong> {group.group_subject}
                      </p>
                      <p>
                        <strong>To‘lov holati:</strong>{" "}
                        <span
                          style={{
                            color: groupPaymentStatus ? "green" : "red",
                            fontWeight: "bold",
                          }}
                        >
                          {groupPaymentStatus ? "To'langan" : "To'lanmagan"}
                        </span>
                      </p>
                      <p>
                        <strong>Ustoz:</strong>{" "}
                        {group.teacher
                          ? `${group.teacher.first_name} ${group.teacher.last_name}`
                          : "N/A"}
                      </p>
                      <p>
                        <strong>Telefon raqami:</strong>{" "}
                        {group.teacher ? group.teacher.phone_number : "N/A"}
                      </p>
                      {index < selectedStudent.groups.length - 1 && <hr />}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;
