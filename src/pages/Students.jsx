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
    group_id: "", // Boshlang'ichda bo'sh
    teacher_id: "", // Boshlang'ichda bo'sh
    paid_for_this_month: false,
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
    group_id: "",
    teacher_id: "",
    paid_for_this_month: false,
    parents_phone_number: "",
    came_in_school: "",
    group: { group_subject: "" },
  });

  function getMonthsInWord(thisMonth) {
    let months = {
      1: "yanvar",
      2: "fevral",
      3: "mart",
      4: "aprel",
      5: "may",
      6: "iyun",
      7: "iyul",
      8: "avgust",
      9: "sentabr",
      10: "oktabr",
      11: "noyabr",
      12: "dekabr",
    };
    for (const key in months) {
      if (key == thisMonth) {
        thisMonth = months[key].toUpperCase();
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
      const response = await fetch("http://localhost:3000/get_students");
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch("http://localhost:3000/get_groups");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Guruhlar ma'lumotlarini olishda muammo yuzaga keldi! ${errorText}`);
      }
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      setError("Guruhlar ma'lumotlarini olishda muammo yuzaga keldi!");
      toast.error(`Guruhlar ma'lumotlarini olishda xatolik yuz berdi: ${err.message}`, { position: "top-right", autoClose: 3000 });
      console.error(err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch("http://localhost:3000/get_teachers");
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
      console.error(err);
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

    if (!formData.group_id) {
      setError("Iltimos, guruhni tanlang!");
      toast.error("Iltimos, guruhni tanlang!", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const payload = {
      ...formData,
      birth_date: formatDate(formData.birth_date),
      came_in_school: formatDate(formData.came_in_school),
      group_id: formData.group_id || null,
      teacher_id: formData.teacher_id || null, // Agar avtomatik to'ldirilgan bo'lsa, null bo'lmasligi kerak
      paid_for_this_month: formData.paid_for_this_month,
    };

    try {
      const response = await fetch("http://localhost:3000/create_student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

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
        group_id: "",
        teacher_id: "",
        paid_for_this_month: false,
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
        `http://localhost:3000/delete_student/${id}`,
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

  useEffect(() => {
    if (groups.length > 0 && formData.group_id) {
      const selectedGroup = groups.find(
        (group) => group.id === formData.group_id
      );
      if (selectedGroup && selectedGroup.teacher_id) {
        setFormData((prev) => ({
          ...prev,
          teacher_id: selectedGroup.teacher_id.toString(),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          teacher_id: "",
        }));
      }
    } else if (!formData.group_id) {
      setFormData((prev) => ({
        ...prev,
        teacher_id: "",
      }));
    }
  }, [formData.group_id, groups]);

  useEffect(() => {
  }, [formData]);

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

    if (!editFormData.teacher_id) {
      setError("Iltimos, ustozni tanlang");
      toast.error("Iltimos, ustozni tanlang", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const payload = {
      ...editFormData,
      birth_date: formatDate(editFormData.birth_date),
      came_in_school: formatDate(editFormData.came_in_school),
      group_id: editFormData.group_id || null,
      teacher_id: editFormData.teacher_id,
      paid_for_this_month: editFormData.paid_for_this_month,
    };

    try {
      const response = await fetch(
        `http://localhost:3000/update_student/${editingStudent.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Failed to update student");
      await fetchStudents(); // Barcha ma'lumotlarni qayta yuklash
      await fetchGroups(); // Guruhlarni yangilash
      await fetchTeachers(); // Ustozlarni yangilash
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
    const selectedGroup = groups.find((group) => group.id === student.group_id);
    setEditingStudent(student);
    setEditFormData({
      ...student,
      group: student.group || { group_subject: "" },
      birth_date: student.birth_date
        ? new Date(student.birth_date).toISOString().split("T")[0]
        : "",
      came_in_school: student.came_in_school
        ? new Date(student.came_in_school).toISOString().split("T")[0]
        : "",
      paid_for_this_month: student.paid_for_this_month || false,
      teacher_id: selectedGroup
        ? selectedGroup.teacher_id
        : student.teacher_id || "",
    });
    setEditModal(true);
  };

  const openDetailModal = (student) => {
    setSelectedStudent(student);
  };

  // Real-time search and payment filter
  const filteredStudents = students.filter((student) => {
    const matchesName = `${student.first_name} ${student.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesPayment =
      paymentFilter === "all" ||
      (paymentFilter === "paid" && student.paid_for_this_month) ||
      (paymentFilter === "unpaid" && !student.paid_for_this_month);
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
    if (groups.length > 0 && formData.group_id) {
      const selectedGroup = groups.find((group) => group.id === formData.group_id);
      if (selectedGroup && selectedGroup.teacher_id) {
        setFormData((prev) => ({
          ...prev,
          teacher_id: selectedGroup.teacher_id.toString(),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          teacher_id: "",
        }));
      }
    } else if (!formData.group_id) {
      setFormData((prev) => ({
        ...prev,
        teacher_id: "",
      }));
    }
  }, [formData.group_id, groups]);

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
      <h1 style={{ marginBottom: "24px" }}>O'quvchilar</h1>

      {/* {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>} */}

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
              <label>Guruh</label>
              <select
                className="select"
                value={formData.group_id || ""} // Bo'sh bo'lsa default qiymat
                onChange={(e) => {
                  const selectedGroupId = e.target.value;
                  const selectedGroup = groups.find(
                    (group) => group.id === selectedGroupId
                  );
                  const newTeacherId = selectedGroup
                    ? selectedGroup.teacher_id.toString()
                    : "";
                  setFormData({
                    ...formData,
                    group_id: selectedGroupId,
                    teacher_id: newTeacherId,
                  });
                }}
              >
                <option value="">Guruhni tanlang</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.group_subject}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Ustoz</label>
              <select
                className="select"
                value={formData.teacher_id || ""} // Bo'sh bo'lsa default qiymat
                onChange={(e) => {}} // O'zgartirishni taqiqlash
                disabled
                required
              >
                <option value="">Ustoz</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.last_name}
                  </option>
                ))}
              </select>
              <input
                type="hidden"
                name="teacher_id"
                value={formData.teacher_id}
              />
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
            <div
              className="form-group"
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <label style={{ margin: "0" }}>
                Ushbu oy uchun to'lov qildimi?
              </label>
              <div
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <button
                  type="button"
                  className={`btn ${
                    formData.paid_for_this_month
                      ? "btn-primary"
                      : "btn-secondary"
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, paid_for_this_month: true })
                  }
                  style={{
                    padding: "4px 10px",
                    borderRadius: "5px",
                    minWidth: "60px",
                    fontSize: "14px",
                  }}
                >
                  ✓ Ha
                </button>
                <button
                  type="button"
                  className={`btn ${
                    !formData.paid_for_this_month
                      ? "btn-primary"
                      : "btn-secondary"
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, paid_for_this_month: false })
                  }
                  style={{
                    padding: "4px 10px",
                    borderRadius: "5px",
                    minWidth: "60px",
                    fontSize: "14px",
                  }}
                >
                  X Yo'q
                </button>
              </div>
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
              <option value="paid">To'lov qilgan</option>
              <option value="unpaid">To'lov qilmagan</option>
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>F.I.Sh.</th>
              <th>Telefon raqami</th>
              <th>Fan</th>
              <th>Ota/onasining F.I.Sh.</th>
              <th>Ota/onasining telefon raqami</th>
              <th>To'lov ({getMonthsInWord()})</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
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
                  <td>{student.group?.group_subject || "N/A"}</td>
                  <td>{student.father_name || "N/A"}</td>
                  <td>{student.parents_phone_number}</td>
                  <td>
                    {student.paid_for_this_month ? "To'langan" : "To'lanmagan"}
                  </td>
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
                <label>Familiyasi</label>
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
                <label>Fan</label>
                <select
                  className="select"
                  value={editFormData.group_id}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      group_id: e.target.value,
                    })
                  }
                >
                  <option value="">Guruhni tanlang</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.group_subject}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Ustoz</label>
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
                >
                  <option value="">Ustozni tanlang</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                    </option>
                  ))}
                </select>
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
                <strong>Guruh:</strong>{" "}
                {selectedStudent.group?.group_subject || "N/A"}
              </p>
              <p>
                <strong>O'quvchining unikal ID raqami:</strong>{" "}
                {`ID${selectedStudent.studental_id}` || "N/A"}
              </p>
              <p>
                <strong>Ustoz:</strong>{" "}
                {
                  teachers.find((t) => t.id === selectedStudent.teacher_id)
                    ?.first_name
                }{" "}
                {teachers.find((t) => t.id === selectedStudent.teacher_id)
                  ?.last_name || "N/A"}
              </p>
              <p>
                <strong>Ustozning telefon raqami:</strong>{" "}
                {teachers.find((t) => t.id === selectedStudent.teacher_id)
                  ?.phone_number || "N/A"}
              </p>
              <p>
                <strong>{getMonthsInWord()} oyi uchun to'lov holati:</strong>{" "}
                {selectedStudent.paid_for_this_month
                  ? "To'langan"
                  : "To'lanmagan"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;
