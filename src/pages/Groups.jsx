"use client";

import { useState, useEffect } from "react";
import { Trash2, Edit } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LottieLoading from "../components/Loading";

function Groups() {
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [groupsError, setGroupsError] = useState("");
  const [teachersError, setTeachersError] = useState("");
  const [studentsError, setStudentsError] = useState("");
  const [paymentsError, setPaymentsError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    group_subject: "",
    teacher_id: "",
    days: "",
    start_time: "",
    end_time: "",
    monthly_fee: "",
  });
  const [editFormData, setEditFormData] = useState({
    group_subject: "",
    teacher_id: "",
    days: "",
    start_time: "",
    end_time: "",
    monthly_fee: "",
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

  const fetchData = async () => {
    try {
      setLoading(true);
      setGroupsError("");
      setTeachersError("");
      setStudentsError("");
      setPaymentsError("");

      const [
        groupsResponse,
        teachersResponse,
        studentsResponse,
        paymentsResponse,
      ] = await Promise.all([
        fetch("http://localhost:3000/get_groups").catch(() => ({ ok: false })),
        fetch("http://localhost:3000/get_teachers").catch(() => ({
          ok: false,
        })),
        fetch("http://localhost:3000/get_students").catch(() => ({
          ok: false,
        })),
        fetch("http://localhost:3000/get_payments").catch(() => ({
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
      } else {
        setTeachers([]);
        setTeachersError("O'qituvchilar hali mavjud emas");
        toast.error("O'qituvchilar yuklanmadi: Hali mavjud emas", {
          position: "top-right",
          autoClose: 3000,
        });
      }

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);
      } else {
        setStudents([]);
        setStudentsError("O'quvchilar hali mavjud emas");
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
        setPaymentsError("To'lovlar hali mavjud emas");
        toast.error("To'lovlar yuklanmadi: Hali mavjud emas", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      setGroups([]);
      setTeachers([]);
      setStudents([]);
      setPayments([]);
      setGroupsError("Guruhlar hali mavjud emas");
      setTeachersError("O'qituvchilar hali mavjud emas");
      setStudentsError("O'quvchilar hali mavjud emas");
      setPaymentsError("To'lovlar hali mavjud emas");
      toast.error("Ma'lumotlarni yuklashda umumiy xatolik yuz berdi", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const addGroup = async (e) => {
    e.preventDefault();

    const formattedDays = formData.days
      .split(/[\s,-]+/)
      .filter(Boolean)
      .join("-")
      .toUpperCase();

    try {
      const response = await fetch("http://localhost:3000/create_group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          days: formattedDays,
          start_time: `${formData.start_time}:00`,
          end_time: `${formData.end_time}:00`,
          monthly_fee: Number(formData.monthly_fee),
        }),
      });

      if (response.ok) {
        const newGroup = await response.json();
        setGroups([...groups, newGroup]);
        setSuccess(`${formData.group_subject} guruhi muvaffaqiyatli qo'shildi`);
        setFormData({
          group_subject: "",
          teacher_id: "",
          days: "",
          start_time: "",
          end_time: "",
          monthly_fee: "",
        });
      } else {
        throw new Error("Guruh qo'shishda xatolik yuz berdi");
      }
    } catch (err) {
      toast.error("Guruh qo'shishda xatolik: API mavjud emas", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const updateGroup = async (e) => {
    e.preventDefault();
  
    const formattedDays = editFormData.days
      .split(/[\s,-]+/)
      .filter(Boolean)
      .join("-")
      .toUpperCase();
  
    try {
      const response = await fetch(
        `http://localhost:3000/update_group/${editingGroup.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...editFormData,
            days: formattedDays,
            start_time: `${editFormData.start_time}:00`,
            end_time: `${editFormData.end_time}:00`,
            monthly_fee: Number(editFormData.monthly_fee),
          }),
        }
      );
  
      if (response.ok) {
        // Backenddan to'liq ob'ekt kelmasa, editFormData dan foydalanamiz
        const updatedGroup = {
          ...editingGroup, // Eski guruhni asos sifatida olamiz
          ...editFormData, // Yangi ma'lumotlarni qo'shamiz
          days: formattedDays,
          start_time: `${editFormData.start_time}:00`,
          end_time: `${editFormData.end_time}:00`,
          monthly_fee: Number(editFormData.monthly_fee),
        };
        setGroups(
          groups.map((group) =>
            group.id === editingGroup.id ? updatedGroup : group
          )
        );
        toast.success(
          `${editFormData.group_subject} guruhi muvaffaqiyatli yangilandi`,
          { position: "top-right", autoClose: 3000 }
        );
        setSuccess(`${editFormData.group_subject} guruhi muvaffaqiyatli yangilandi`);
        setEditModal(false);
      } else {
        throw new Error("Guruhni yangilashda xatolik yuz berdi");
      }
    } catch (err) {
      toast.error("Guruhni yangilashda xatolik: API mavjud emas", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };
  
  const deleteGroup = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/delete_group/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setGroups(groups.filter((g) => g.id !== id));
        // setSuccess("Guruh muvaffaqiyatli o'chirildi");
        toast.error("Guruh muvaffaqiyatli o'chirildi", {
          position: "top-right",
          autoClose: 3000,
        });
        setSelectedGroup(null);
      } else {
        throw new Error("Guruhni o'chirishda xatolik yuz berdi");
      }
    } catch (err) {
      toast.error("Guruhni o'chirishda xatolik: API mavjud emas", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>Ushbu guruhni o'chirishga ishonchingiz komilmi?</p>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            style={{
              padding: "8px 16px",
              background: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => {
              deleteGroup(id);
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

  const openEditModal = (group) => {
    setEditingGroup(group);
    setEditFormData({
      group_subject: group.group_subject,
      teacher_id: group.teacher_id,
      days: group.days,
      start_time: group.start_time.slice(0, 5),
      end_time: group.end_time.slice(0, 5),
      monthly_fee: group.monthly_fee || "",
    });
    setEditModal(true);
  };

  const calculateGroupStats = (groupId) => {
    const groupStudents = students.filter(
      (student) => student.group_id === groupId
    );
    const studentsAmount = groupStudents.length;
    const currentMonth = new Date()
    const paidStudentsAmount = groupStudents.filter((student) => {
      const payment = payments.find(
        (p) =>
          p.student_id === student.id &&
          student.paid_for_this_month
      );
      return !!payment;
    }).length;
    return { studentsAmount, paidStudentsAmount };
  };

  const filteredGroups = groups
    .map((group) => ({
      ...group,
      ...calculateGroupStats(group.id),
    }))
    .filter((group) =>
      group.group_subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
    if (groupsError || teachersError || studentsError || paymentsError) {
      const timer = setTimeout(() => {
        setGroupsError("");
        setTeachersError("");
        setStudentsError("");
        setPaymentsError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, groupsError, teachersError, studentsError, paymentsError]);

  if (loading) {
    return <LottieLoading />
  }

  return (
    <div>
      <h1 style={{ marginBottom: "24px" }}>Guruhlar</h1>

      <ToastContainer />

      <div className="card">
        <h3 style={{ marginBottom: "20px" }}>Yangi guruh qo'shish</h3>
        <form onSubmit={addGroup}>
          <div className="form-grid">
            <div className="form-group">
              <label>Guruh nomi</label>
              <input
                type="text"
                className="input"
                value={formData.group_subject}
                onChange={(e) =>
                  setFormData({ ...formData, group_subject: e.target.value })
                }
                placeholder="Guruh nomini kiriting"
                required
              />
            </div>
            <div className="form-group">
              <label>O'qituvchi</label>
              <select
                className="select"
                value={formData.teacher_id}
                onChange={(e) =>
                  setFormData({ ...formData, teacher_id: e.target.value })
                }
                required
                disabled={teachers.length === 0}
              >
                <option value="">
                  {teachersError ? "O'qituvchilar yo'q" : "Tanlang"}
                </option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {`${teacher.first_name} ${teacher.last_name} (${teacher.subject})`}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Dars kunlari</label>
              <input
                type="text"
                className="input"
                value={formData.days}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/[\s,]+/g, "-")
                    .replace(/-+/g, "-")
                    .toUpperCase();
                  setFormData({ ...formData, days: value });
                }}
                placeholder="DU-CHOR-JUMA (kunlarni - bilan ajrating)"
                required
              />
            </div>
            <div className="form-group">
              <label>Boshlanish vaqti</label>
              <input
                type="time"
                className="input"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Tugash vaqti</label>
              <input
                type="time"
                className="input"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Oylik to'lov summasi (so'm)</label>
              <input
                type="number"
                className="input"
                value={formData.monthly_fee}
                onChange={(e) =>
                  setFormData({ ...formData, monthly_fee: e.target.value })
                }
                placeholder="Masalan: 225000"
                min="0"
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            Qo'shish
          </button>
        </form>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3>Mavjud guruhlar ({filteredGroups.length} ta)</h3>
          <input
            type="text"
            className="input"
            style={{ width: "300px" }}
            placeholder="Guruh nomini kiriting..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredGroups.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "40px",
              }}
            >
              {searchTerm
                ? "Qidiruv bo'yicha natija topilmadi"
                : groupsError || "Hali mavjud emas"}
            </div>
          ) : (
            filteredGroups.map((group) => {
              const teacher = teachers.find((t) => t.id === group.teacher_id);
              return (
                <div
                  key={group.id}
                  className="card"
                  style={{ margin: 0, cursor: "pointer" }}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div
                    style={{
                      background: "#104292",
                      color: "white",
                      padding: "16px",
                      margin: "-24px -24px 16px -24px",
                      borderRadius: "8px 8px 0 0",
                    }}
                  >
                    <h4 style={{ margin: 0 }}>{group.group_subject}</h4>
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <strong>O'qituvchi:</strong>{" "}
                    {teacher
                      ? `${teacher.first_name} ${teacher.last_name}`
                      : teachersError || "N/A"}
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <strong>Dars kunlari:</strong> {group.days}
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <strong>Dars vaqti:</strong>{" "}
                    {`${group.start_time.slice(0, 5)} - ${group.end_time.slice(
                      0,
                      5
                    )}`}
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <strong>O'quvchilar soni:</strong>{" "}
                    {group.studentsAmount
                      ? `${group.studentsAmount} nafar`
                      : studentsError || 0}
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <strong>Ushbu oy uchun to'lov qilgan o'quvchilar:</strong>{" "}
                    {group.paidStudentsAmount
                      ? `${group.paidStudentsAmount} nafar`
                      : paymentsError || 0}
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <strong>To'lov qilmagan o'quvchilar:</strong>{" "}
                    {group.studentsAmount - group.paidStudentsAmount
                      ? `${
                          group.studentsAmount - group.paidStudentsAmount
                        } nafar`
                      : studentsError || paymentsError || 0}
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <strong>Oylik to'lov summasi:</strong>{" "}
                    {group.monthly_fee
                      ? `${Number(group.monthly_fee).toLocaleString(
                          "uz-UZ"
                        )} so'm`
                      : "N/A"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      className="btn btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(group);
                      }}
                      style={{ padding: "4px 8px" }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        showDeleteToast(group.id);
                      }}
                      style={{ padding: "4px 8px" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {editModal && (
        <div className="modal" onClick={() => setEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Guruhni tahrirlash</h3>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditModal(false)}
                style={{ float: "right", padding: "4px 8px" }}
              >
                Yopish
              </button>
            </div>
            <form onSubmit={updateGroup}>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Guruh nomi</label>
                <input
                  type="text"
                  className="input"
                  value={editFormData.group_subject}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      group_subject: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>O'qituvchi</label>
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
                  disabled={teachers.length === 0}
                >
                  <option value="">
                    {teachersError ? "O'qituvchilar yo'q" : "Tanlang"}
                  </option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {`${teacher.first_name} ${teacher.last_name} (${teacher.subject})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Dars kunlari</label>
                <input
                  type="text"
                  className="input"
                  value={editFormData.days}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/[\s,]+/g, "-")
                      .replace(/-+/g, "-")
                      .toUpperCase();
                    setEditFormData({ ...editFormData, days: value });
                  }}
                  placeholder="DU-CHOR-JUMA (kunlarni - bilan ajrating)"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Boshlanish vaqti</label>
                <input
                  type="time"
                  className="input"
                  value={editFormData.start_time}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      start_time: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Tugash vaqti</label>
                <input
                  type="time"
                  className="input"
                  value={editFormData.end_time}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      end_time: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Oylik to'lov summasi (so'm)</label>
                <input
                  type="number"
                  className="input"
                  value={editFormData.monthly_fee}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      monthly_fee: e.target.value,
                    })
                  }
                  placeholder="Masalan: 200000"
                  min="0"
                  required
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditModal(false)}
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

      {selectedGroup && (
        <div className="modal" onClick={() => setSelectedGroup(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Guruh haqida ma'lumot</h3>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedGroup(null)}
                style={{ float: "right", padding: "4px 8px" }}
              >
                Yopish
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Guruh nomi:</strong> {selectedGroup.group_subject}
              </p>
              <p>
                <strong>Dars kunlari:</strong> {selectedGroup.days}
              </p>
              <p>
                <strong>Dars vaqti:</strong>{" "}
                {`${selectedGroup.start_time.slice(
                  0,
                  5
                )} - ${selectedGroup.end_time.slice(0, 5)}`}
              </p>
              <p>
                <strong>O'quvchilar soni:</strong>{" "}
                {selectedGroup.studentsAmount
                  ? `${selectedGroup.studentsAmount}ta`
                  : studentsError || "0"}
              </p>
              <p>
                <strong>To'lov qilganlar soni:</strong>{" "}
                {selectedGroup.paidStudentsAmount
                  ? `${selectedGroup.paidStudentsAmount}ta`
                  : paymentsError || "0"}
              </p>
              <p>
                <strong>Oylik to'lov summasi:</strong>{" "}
                {selectedGroup.monthly_fee
                  ? `${Number(selectedGroup.monthly_fee).toLocaleString(
                      "uz-UZ"
                    )} so'm`
                  : "N/A"}
              </p>
              <h4 style={{ marginTop: "15px" }}>O'qituvchi ma'lumotlari</h4>
              {teachers.length === 0 ? (
                <p>{teachersError || "O'qituvchi ma'lumotlari yo'q"}</p>
              ) : (
                teachers
                  .filter((teacher) => teacher.id === selectedGroup.teacher_id)
                  .map((teacher) => (
                    <div key={teacher.id}>
                      <p>
                        <strong>F.I.Sh:</strong>{" "}
                        {`${teacher.first_name} ${teacher.last_name}`}
                      </p>
                      <p>
                        <strong>Telefon raqami:</strong> {teacher.phone_number}
                      </p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Groups;
