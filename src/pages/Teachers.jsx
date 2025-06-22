"use client";

import { useState, useEffect } from "react";
import { Check, Trash2, Edit2, X } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LottieLoading from "../components/Loading";
import InputMask from "react-input-mask";

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [groupsError, setGroupsError] = useState("");
  const [teachersError, setTeachersError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [salaryFilter, setSalaryFilter] = useState("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherGroups, setTeacherGroups] = useState([]);

  const openDetailModal = (teacher) => {
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
  };

  const [editFormData, setEditFormData] = useState({
    id: "",
    first_name: "",
    last_name: "",
    father_name: "",
    birth_date: "",
    phone_number: "",
    subject: "",
    salary_amount: "",
    got_salary_for_this_month: false,
  });

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    father_name: "",
    birth_date: "",
    phone_number: "",
    subject: "",
    salary_amount: "",
    got_salary_for_this_month: false,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setGroupsError("");
      setTeachersError("");

      const [groupsResponse, teachersResponse, studentsResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/get_groups`).catch(() => ({ ok: false })),
        fetch(`${import.meta.env.VITE_API_URL}/get_teachers`).catch(() => ({ ok: false })),
        fetch(`${import.meta.env.VITE_API_URL}/get_students`).catch(() => ({ ok: false })),
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/create_teacher`, {
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
        }),
      });

      if (response.ok) {
        const newTeacher = await response.json();
        setTeachers([...teachers, newTeacher]);
        toast.success("Yangi ustoz muvaffaqiyatli qo'shildi!", {
          position: "top-right",
          autoClose: 3000,
        });
        setFormData({
          first_name: "",
          last_name: "",
          father_name: "",
          birth_date: "",
          phone_number: "",
          subject: "",
          salary_amount: "",
          got_salary_for_this_month: false,
        });
        setSearchTerm("");
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: editFormData.first_name,
            last_name: editFormData.last_name,
            father_name: editFormData.father_name,
            birth_date: editFormData.birth_date,
            phone_number: editFormData.phone_number,
            subject: editFormData.subject,
            salary_amount: Number(editFormData.salary_amount),
            got_salary_for_this_month: editFormData.got_salary_for_this_month,
          }),
        }
      );

      if (response.ok) {
        const updatedTeacher = await response.json();
        setTeachers(teachers.map((t) => (t.id === editFormData.id ? updatedTeacher : t)));
        toast.success("Ustoz ma'lumotlari muvaffaqiyatli yangilandi.", {
          position: "top-right",
          autoClose: 3000,
        });
        setIsEditModalOpen(false);
      } else {
        throw new Error("Ustoz yangilashda xatolik");
      }
    } catch (err) {
      toast.error("Ustoz yangilashda xatolik: API mavjud emas", {
        position: "top-right",
        autoClose: 3000,
      });
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
        toast.success("Ustoz muvaffaqiyatli o'chirildi!", {
          position: "top-right",
          autoClose: 3000,
        });
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

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>Diqqat! Ushbu ustozga tegishli barcha ma'lumotlar o'chiriladi! O'chirishga ishonchingiz komilmi?</p>
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

  const openEditModal = (teacher) => {
    setEditFormData({
      id: teacher.id,
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      father_name: teacher.father_name,
      birth_date: teacher.birth_date,
      phone_number: teacher.phone_number,
      subject: teacher.subject,
      salary_amount: teacher.salary_amount,
      got_salary_for_this_month: teacher.got_salary_for_this_month,
    });
    setIsEditModalOpen(true);
  };

  // Extract unique subjects from teachers
  const uniqueSubjects = [...new Set(teachers.map((teacher) => teacher.subject))];

  const filteredTeachers = teachers.filter((teacher) => {
    const nameMatch = `${teacher.first_name} ${teacher.last_name} ${teacher.father_name || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const subjectMatch = subjectFilter === "all" || teacher.subject === subjectFilter;
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
      <h1>Ustozlar</h1>
{/* 
      {success && <div className="success">{success}</div>}
      {groupsError && <div className="error">{groupsError}</div>}
      {teachersError && <div className="error">{teachersError}</div>} */}

      <ToastContainer />

      {/* Ustoz qo'shish formasi */}
      <div className="card">
        <h3 style={{ marginBottom: "20px" }}>Yangi ustoz qo'shish</h3>
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
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                placeholder="Otasining ismi (ixtiyoriy)"
              />
            </div>
            <div className="form-group">
              <label>Tug'ilgan sana</label>
              <input
                type="date"
                className="input"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Telefon raqami</label>
              <InputMask
                mask="+998 (99) 999-99-99"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
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
              <label>Fan</label>
              <input
                type="text"
                className="input"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="O'qitadigan fani"
                required
              />
            </div>
            <div className="form-group">
              <label>Oylik maosh</label>
              <input
                type="number"
                className="input"
                value={formData.salary_amount}
                onChange={(e) => setFormData({ ...formData, salary_amount: e.target.value })}
                placeholder="Maosh miqdori"
                min="0"
                required
              />
            </div>
            <div className="form-group">
              <label>Ushbu oy uchun maosh olganmi?</label>
              <div style={{ marginTop: "8px" }}>
                <label style={{ marginRight: "16px" }}>
                  <input
                    type="radio"
                    name="salary"
                    style={{ scale: "1.5", marginLeft: "5px", cursor: "pointer" }}
                    checked={formData.got_salary_for_this_month === true}
                    onChange={() =>
                      setFormData({ ...formData, got_salary_for_this_month: true })
                    }
                  />{" "}
                  Ha
                </label>
                <label>
                  <input
                    type="radio"
                    name="salary"
                    style={{ scale: "1.5", marginLeft: "5px", cursor: "pointer" }}
                    checked={formData.got_salary_for_this_month === false}
                    onChange={() =>
                      setFormData({ ...formData, got_salary_for_this_month: false })
                    }
                  />{" "}
                  Yo'q
                </label>
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            Ustoz qo'shish
          </button>
        </form>
      </div>

      {/* Ustoz yangilash modali */}
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
            <h3 style={{ marginBottom: "16px" }}>Ustoz ma'lumotlarini yangilash</h3>
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
                      setEditFormData({ ...editFormData, first_name: e.target.value })
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
                      setEditFormData({ ...editFormData, last_name: e.target.value })
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
                      setEditFormData({ ...editFormData, father_name: e.target.value })
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
                      setEditFormData({ ...editFormData, birth_date: e.target.value })
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
                      setEditFormData({ ...editFormData, phone_number: e.target.value })
                    }
                    placeholder="+998901234567"
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
                      setEditFormData({ ...editFormData, subject: e.target.value })
                    }
                    placeholder="O'qitadigan fani"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Oylik maosh</label>
                  <input
                    type="number"
                    className="input"
                    value={editFormData.salary_amount}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, salary_amount: e.target.value })
                    }
                    placeholder="Maosh miqdori"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ushbu oy uchun maosh olganmi?</label>
                  <div style={{ marginTop: "8px" }}>
                    <label style={{ marginRight: "16px" }}>
                      <input
                        type="radio"
                        name="edit_salary"
                        checked={editFormData.got_salary_for_this_month === true}
                        onChange={() =>
                          setEditFormData({
                            ...editFormData,
                            got_salary_for_this_month: true,
                          })
                        }
                      />{" "}
                      Ha
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="edit_salary"
                        checked={editFormData.got_salary_for_this_month === false}
                        onChange={() =>
                          setEditFormData({
                            ...editFormData,
                            got_salary_for_this_month: false,
                          })
                        }
                      />{" "}
                      Yo'q
                    </label>
                  </div>
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

      {/* Ustoz ma'lumotlari modali */}
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
              width: "600px",
              maxWidth: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2>Ustoz ma'lumotlari</h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <h3
                style={{
                  marginBottom: "16px",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "8px",
                }}
              >
                Asosiy ma'lumotlar
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <p>
                    <strong>Ism:</strong> {selectedTeacher.first_name}
                  </p>
                  <p>
                    <strong>Familiya:</strong> {selectedTeacher.last_name}
                  </p>
                  <p>
                    <strong>Otasining ismi:</strong>{" "}
                    {selectedTeacher.father_name || "Mavjud emas"}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Tug'ilgan sana:</strong>{" "}
                    {new Date(selectedTeacher.birth_date).toLocaleDateString("uz-UZ")}
                  </p>
                  <p>
                    <strong>Telefon:</strong> {selectedTeacher.phone_number}
                  </p>
                  <p>
                    <strong>Fan:</strong> {selectedTeacher.subject}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: "16px" }}>
                <p>
                  <strong>Oylik maosh:</strong>{" "}
                  {Number(selectedTeacher.salary_amount).toLocaleString("uz-UZ")} so'm
                </p>
                <p>
                  <strong>Maosh holati:</strong>{" "}
                  {selectedTeacher.got_salary_for_this_month ? (
                    <span style={{ color: "#388e3c" }}>Berildi</span>
                  ) : (
                    <span style={{ color: "#d32f2f" }}>Berilmagan</span>
                  )}
                </p>
              </div>
            </div>

            <div>
              <h3
                style={{
                  marginBottom: "16px",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "8px",
                }}
              >
                Guruhlar ({teacherGroups.length} ta)
              </h3>
              {teacherGroups.length > 0 ? (
                <table className="table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>№</th>
                      <th>Guruh nomi</th>
                      <th>O'quvchilar soni</th>
                      <th>Kunlari</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherGroups.map((group, index) => (
                      <tr key={group.id}>
                        <td>{index + 1}</td>
                        <td>{group.group_subject}</td>
                        <td>{group.students_amount || 0}</td>
                        <td>{group.days || "Mavjud emas"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                  Ustozga hozircha guruh biriktirilmagan
                </p>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openEditModal(selectedTeacher);
                }}
                style={{ marginRight: "10px" }}
              >
                Tahrirlash
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setIsDetailModalOpen(false)}
              >
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
              <th>№</th>
              <th>F.I.Sh.</th>
              <th>Tug'ilgan sana</th>
              <th>Fan</th>
              <th>Oylik maosh</th>
              <th>Maosh holati</th>
              <th>Guruhlar soni</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "40px" }}>
                  {searchTerm || subjectFilter !== "all" || salaryFilter !== "all"
                    ? "Qidiruv bo'yicha natija topilmadi"
                    : teachersError || "Hali ustozlar qo'shilmagan"}
                </td>
              </tr>
            ) : (
              filteredTeachers.map((teacher, index) => {
                const groupsCount = groups.filter((g) => g.teacher_id === teacher.id).length;
                return (
                  <tr key={teacher.id}>
                    <td>{index + 1}</td>
                    <td
                      style={{ cursor: "pointer", color: "#104292" }}
                      onClick={() => openDetailModal(teacher)}
                    >
                      {`${teacher.first_name} ${teacher.last_name} ${teacher.father_name || ""}`}
                    </td>
                    <td>
                      {teacher.birth_date
                        ? new Date(teacher.birth_date).toLocaleDateString("uz-UZ")
                        : "N/A"}
                    </td>
                    <td>{teacher.subject || "N/A"}</td>
                    <td>
                      {teacher.salary_amount
                        ? Number(teacher.salary_amount).toLocaleString("uz-UZ") + " so'm"
                        : "N/A"}
                    </td>
                    <td>
                      {teacher.got_salary_for_this_month ? (
                        <span style={{ color: "#388e3c" }}>Berildi</span>
                      ) : (
                        <span style={{ color: "#d32f2f" }}>Berilmagan</span>
                      )}
                    </td>
                    <td>{groupsCount} ta</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(teacher);
                        }}
                        style={{ marginRight: "6px", padding: "4px 8px" }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          showDeleteToast(teacher.id);
                        }}
                        style={{ padding: "4px 8px" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
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