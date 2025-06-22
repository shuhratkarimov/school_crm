"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import "../../styles/styles.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LottieLoading from "../components/Loading";

function Attendance() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function getMonthsInWord() {
    let thisMonth = new Date().getMonth() + 1;
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
        thisMonth = months[key];
        return thisMonth;
      }
    }
  }

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/get_groups`);
      if (!res.ok) {
        throw new Error("Guruhlar olinmadi");
      }
      const data = await res.json();
      setGroups(data);
      if (data.length > 0) {
        setSelectedGroup(data[0]); // Birinchi guruhni default sifatida tanlaymiz
      }
    } catch (err) {
      toast.error("Guruhlarni yuklashda xatolik yuz berdi: hali mavjud emas", {
        position: "top-right",
        autoClose: 3000,
      });
      console.error("Fetch groups error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (groupId) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/get_one_group_students?group_id=${groupId}`
      );
      if (!res.ok) {
        if (res.status === 404) {
          toast.error(`O'quvchilar hali mavjud emas!`, {
            position: "top-right",
            autoClose: 3000,
          });
        }
        throw new Error(`O'quvchilar olinmadi. Status: ${res.status}`);
      }
      const data = await res.json();
      setStudents(data);

      const initialAttendance = {};
      data.forEach((student) => {
        initialAttendance[student.id] = true;
      });
      setAttendance(initialAttendance);
    } catch (err) {
      console.error("Fetch students error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const saveAttendance = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const attendanceData = Object.entries(attendance).map(
        ([studentId, present]) => ({
          studentId,
          present,
          date: today,
        })
      );

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/make_attendance/${selectedGroup.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ attendanceBody: attendanceData }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || "Noma'lum xatolik yuz berdi", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      toast.success("Davomat muvaffaqiyatli saqlandi", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err) {
      console.error("Davomatni saqlashda xatolik:", err);
      toast.error("Davomatni saqlashda kutilmagan xatolik yuz berdi", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchStudents(selectedGroup.id);
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (loading) {
    return <LottieLoading />;
  }

  return (
    <div>
      <h1>Davomat</h1>
      <ToastContainer />

      {success && <div className="success">{success}</div>}
      {error && <div className="error">{error}</div>}

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}
      >
        {/* Group Selection */}
        <div>
          <div className="card">
            <h3 style={{ marginBottom: "16px" }}>Guruhlar</h3>
            <select
              className="select"
              value={selectedGroup ? selectedGroup.id : ""}
              onChange={(e) => {
                const group = groups.find((g) => g.id == e.target.value);
                setSelectedGroup(group);
              }}
              style={{
                width: "100%",
                marginBottom: "50px",
                position: "relative",
                zIndex: 10,
              }}
            >
              <option value="">Guruh tanlang</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.group_subject}
                </option>
              ))}
            </select>
            {selectedGroup && (
              <div>
                <div
                  style={{
                    background: "#104292",
                    color: "white",
                    padding: "16px",
                    margin: "-24px -24px 16px -24px",
                    borderRadius: "8px 8px 0 0",
                  }}
                >
                  <h3 style={{ margin: 0 }}>{selectedGroup.group_subject}</h3>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <strong>O'qituvchi:</strong>{" "}
                  {`${selectedGroup.teacher.first_name} ${selectedGroup.teacher.last_name}`}
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <strong>Telefon:</strong> {selectedGroup.teacher.phone_number}
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <strong>Dars kunlari:</strong> {selectedGroup.days}
                </div>
                <div>
                  <strong>Dars vaqti:</strong>{" "}
                  {`${selectedGroup.start_time.slice(
                    0,
                    5
                  )} - ${selectedGroup.end_time.slice(0, 5)}`}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Table */}
        <div className="card">
          {selectedGroup && (
            <>
              <h3 style={{ marginBottom: "20px" }}>
                Davomat:{" "}
                {`${new Date().getFullYear()}-yil ${new Date().getDate()}-${getMonthsInWord()} kuni darsi uchun`}
              </h3>

              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>O'quvchi ismi</th>
                    <th style={{ textAlign: "left" }}>Davomat</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length > 0 ? (
                    students.map((student, index) => (
                      <tr key={student.id}>
                        <td>{index + 1}</td>
                        <td>{`${student.first_name} ${student.last_name}`}</td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={() => toggleAttendance(student.id)}
                            style={{
                              background: attendance[student.id]
                                ? "#16a34a"
                                : "#ef4444",
                              color: "white",
                              border: "none",
                              borderRadius: "50%",
                              width: "32px",
                              height: "32px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            {attendance[student.id] ? (
                              <Check size={16} />
                            ) : (
                              <X size={16} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center", padding: "20px" }}>
                        Hali o'quvchilar yo'q...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={{ marginTop: "20px", textAlign: "right" }}>
                <button className="btn btn-primary" onClick={saveAttendance}>
                  Saqlash
                </button>
              </div>
            </>
          )}
          {!selectedGroup && <div>Iltimos, guruh tanlang</div>}
        </div>
      </div>
    </div>
  );
}

export default Attendance;