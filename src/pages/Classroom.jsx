"use client";

import { useState, useEffect } from "react";
import { Trash2, Edit, School } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LottieLoading from "../components/Loading";
import "../index.css";

const daysInEn = {
  monday: "DUSHANBA",
  tuesday: "SESHANBA",
  wednesday: "CHORSHANBA",
  thursday: "PAYSHANBA",
  friday: "JUMA",
  saturday: "SHANBA",
  sunday: "YAKSHANBA",
};

function dayParser(day) {
  for (const d in daysInEn) {
    if (day === d) {
      day = daysInEn[d];
    }
  }
  return day;
}

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    capacity: "",
  });
  const [editModal, setEditModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [roomsResponse, schedulesResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/get_rooms`).catch(() => ({
          ok: false,
        })),
        fetch(`${import.meta.env.VITE_API_URL}/get_schedules`).catch(() => ({
          ok: false,
        })),
      ]);

      if (roomsResponse.ok) {
        setRooms(await roomsResponse.json());
      } else {
        setRooms([]);
        setError("Xonalar hali mavjud emas");
      }
      if (schedulesResponse.ok) {
        setSchedules(await schedulesResponse.json());
      } else {
        setSchedules([]);
        setError((prev) => prev || "Jadval hali mavjud emas");
      }
    } catch (err) {
      setRooms([]);
      setSchedules([]);
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const addRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/create_room`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            capacity: formData.capacity ? Number(formData.capacity) : null,
          }),
        }
      );

      if (response.ok) {
        const newRoom = await response.json();
        setRooms([...rooms, newRoom.room]);
        setSuccess(`${formData.name} xonasi muvaffaqiyatli qo'shildi`);
        toast.success(`${formData.name} xonasi muvaffaqiyatli qo'shildi`, {
          position: "top-right",
          autoClose: 3000,
        });
        setFormData({ name: "", capacity: "" });
      } else {
        throw new Error("Xona qo'shishda xatolik yuz berdi");
      }
    } catch (err) {
      toast.error("Xona qo'shishda xatolik: API mavjud emas", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const updateRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/update_room/${editingRoom.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editFormData.name,
            capacity: editFormData.capacity
              ? Number(editFormData.capacity)
              : null,
          }),
        }
      );

      if (response.ok) {
        const updatedRoom = { ...editingRoom, ...editFormData };
        setRooms(
          rooms.map((room) => (room.id === editingRoom.id ? updatedRoom : room))
        );
        setSuccess(`${editFormData.name} xonasi muvaffaqiyatli yangilandi`);
        toast.success(`${editFormData.name} xonasi muvaffaqiyatli yangilandi`, {
          position: "top-right",
          autoClose: 3000,
        });
        setEditModal(false);
      } else {
        throw new Error("Xonani yangilashda xatolik yuz berdi");
      }
    } catch (err) {
      toast.error("Xonani yangilashda xatolik: API mavjud emas", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const deleteRoom = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/delete_room/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setRooms(rooms.filter((r) => r.id !== id));
        setSuccess("Xona muvaffaqiyatli o'chirildi");
        toast.success("Xona muvaffaqiyatli o'chirildi", {
          position: "top-right",
          autoClose: 3000,
        });
        if (selectedRoom?.id === id) setSelectedRoom(null);
      } else {
        throw new Error("Xonani o'chirishda xatolik yuz berdi");
      }
    } catch (err) {
      toast.error("Xonani o'chirishda xatolik: API mavjud emas", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>Ushbu xonani o'chirishga ishonchingiz komilmi?</p>
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
              deleteRoom(id);
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

  const openEditModal = (room) => {
    setEditingRoom(room);
    setEditFormData({
      name: room.name,
      capacity: room.capacity || "",
    });
    setEditModal(true);
  };

  const getRoomSchedules = (roomId) => {
    return schedules
      .filter((schedule) => schedule.room_id === roomId)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (loading) {
    return <LottieLoading />;
  }

  // Fon rangiga qarab matn rangini aniqlash
const getContrastColor = (hexColor) => {
  if (!hexColor) return '#000000';
  
  // Hex rangni RGB ga o'tkazamiz
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  
  // YIQ formulasi orqali yorqinlikni hisoblaymiz
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // Agar fon yorqin bo'lsa, qora rang; aks holda oq rang
  return yiq >= 128 ? '#000000' : '#FFFFFF';
};

  const getColorForGroup = (groupId) => {
    const colors = [
      '#FFD700', // Gold
      '#87CEEB', // Sky Blue
      '#98FB98', // Pale Green
      '#FFA07A', // Light Salmon
      '#DDA0DD', // Plum
      '#FF6347', // Tomato
      '#40E0D0', // Turquoise
      '#FF8C00', // Dark Orange
      '#7B68EE', // Medium Slate Blue
      '#20B2AA', // Light Sea Green
    ];
    
    // Agar guruh ID si bo'lsa, unga mos rang tanlaymiz
    if (groupId) {
      const hash = groupId.toString().split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0);
      return colors[hash % colors.length];
    }
    
    // Standart rang (agar guruh ID si bo'lmasa)
    return '#FFD700';
  };

  const renderScheduleCells = (day) => {
    const daySchedules = getRoomSchedules(selectedRoom.id).filter(
      (schedule) => schedule.day === day
    ).sort((a, b) => a.start_time.localeCompare(b.start_time));
  
    const cells = [];
    let currentHour = 5; // 05:00 dan boshlaymiz
    let processedSchedules = new Set(); // Qayta ishlangan darslarni saqlash
  
    while (currentHour < 21) { // 21:00 gacha
      const startHour = currentHour;
      const endHour = startHour + 1;
      const slotStart = startHour * 60;
      const slotEnd = endHour * 60;
  
      // Shu vaqt oralig'ida boshlanadigan darsni topamiz
      const schedule = daySchedules.find(s => {
        if (processedSchedules.has(s.id)) return false;
        
        const [startH, startM] = s.start_time.split(':').map(Number);
        const scheduleStart = startH * 60 + startM;
        return scheduleStart >= slotStart && scheduleStart < slotEnd;
      });
  
      if (schedule) {
        const [startH, startM] = schedule.start_time.split(':').map(Number);
        const [endH, endM] = schedule.end_time.split(':').map(Number);
        const scheduleStart = startH * 60 + startM;
        const scheduleEnd = endH * 60 + endM;
        
        // Dars davomiyligi (soatlarda)
        const durationHours = Math.ceil((scheduleEnd - scheduleStart) / 60);
        
        const groupColor = getColorForGroup(schedule.group?.id);
        const textColor = getContrastColor(groupColor);
  
        cells.push(
          <td
            key={`${day}-${startHour}-${schedule.id}`}
            colSpan={durationHours}
            style={{
              background: groupColor,
              color: textColor,
              position: 'relative',
              padding: '8px',
              border: '1px solid #ddd',
              minWidth: `${durationHours * 100}px`,
              textAlign: 'center'
            }}
          >
            <div style={{
              position: 'relative',
              zIndex: 2,
              padding: '4px',
              wordBreak: 'break-word'
            }}>
              <p><strong>Guruh:</strong> {schedule.group?.group_subject || 'Noma\'lum'}</p>
              <p><strong>O'qituvchi:</strong> {
                schedule.teacher ? 
                `${schedule.teacher.first_name} ${schedule.teacher.last_name}` : 
                'Noma\'lum'
              }</p>
              <p><strong>Vaqti:</strong> {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}</p>
            </div>
          </td>
        );
  
        processedSchedules.add(schedule.id);
        currentHour += durationHours - 1; // Keyingi ishlov berilmagan soatga o'tamiz
      } else {
        // Bo'sh yacheyka
        cells.push(
          <td 
            key={`empty-${day}-${startHour}`}
            style={{
              border: '1px solid #ddd',
              minWidth: '100px',
              height: '60px'
            }}
          ></td>
        );
      }
  
      currentHour++;
    }
  
    return cells;
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <School size={24} color="#104292"/>
        <h1 className="text-2xl font-bold">Xonalar va darslar jadvali</h1>
      </div>
      <ToastContainer />

      {/* Xona qo‘shish formasi */}
      <div className="card">
        <h3 style={{ marginBottom: "20px", fontWeight: "bold" }}>Yangi xona qo'shish</h3>
        <form onSubmit={addRoom}>
          <div className="form-grid">
            <div className="form-group">
              <label>Xona nomi</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Xona nomini kiriting"
                required
              />
            </div>
            <div className="form-group">
              <label>Sig‘im (ixtiyoriy)</label>
              <input
                type="number"
                className="input"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
                placeholder="Masalan: 30"
                min="0"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            Qo'shish
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h3 style={{ marginBottom: "20px", fontWeight: "bold" }}>Xonalar ({rooms.length} ta)</h3>
        {rooms.length === 0 ? (
          <p style={{ textAlign: "center", padding: "20px" }}>
            {error || "Xonalar hali mavjud emas"}
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "10px",
            }}
          >
            {rooms.map((room) => (
              <div
                key={room.id}
                className="card"
                style={{
                  margin: 0,
                  cursor: "pointer",
                  background:
                    selectedRoom?.id === room.id ? "#e6f3ff" : "white",
                  border:
                    selectedRoom?.id === room.id
                      ? "2px solid #007bff"
                      : "1px solid #ddd",
                }}
                onClick={() => setSelectedRoom(room)}
              >
                <div style={{ padding: "10px", fontSize: "17px" }}>
                  <p
                    style={{
                      fontWeight: "bold",
                      fontSize: "18px",
                      marginBottom: "10px",
                    }}
                  >
                    {room.name}
                  </p>
                  <p style={{ marginBottom: "10px" }}>
                    <strong>Sig‘im:</strong>{" "}
                    {`${room.capacity} o'quvchi sig'adi` || "Belgilanmagan"}
                  </p>
                  <p style={{ marginBottom: "10px" }}>
                    <strong>Asosan bo'sh:</strong>{" "}
                    {room?.busiestFreePeriod || "Belgilanmagan"}
                  </p>
                  <p style={{ marginBottom: "30px" }}>
                    <strong>Bandlik foizi: </strong>
                    {room?.occupancyPercentage
                      ? `${room?.occupancyPercentage}%`
                      : "0%"}
                  </p>
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
                        openEditModal(room);
                      }}
                      style={{ padding: "4px 8px" }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        showDeleteToast(room.id);
                      }}
                      style={{ padding: "4px 8px" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {selectedRoom && (
        <div className="card" style={{ marginTop: "20px", overflowX: "auto" }}>
          <h3 style={{ marginBottom: "20px" }}>
            {selectedRoom.name} xonasidagi darslar jadvali
          </h3>
          {getRoomSchedules(selectedRoom.id).length === 0 ? (
            <p style={{ textAlign: "center", padding: "20px" }}>
              Ushbu xonada darslar belgilangan emas
            </p>
          ) : (
            <table className="schedule-table">
              <thead>
                <tr>
                  <th style={{ minWidth: "150px" }}>Kun/Soat</th>
                  {Array.from({ length: 16 }, (_, i) => {
                    const hour = 5 + i;
                    return (
                      <th key={hour}>
                        {hour.toString().padStart(2, "0")}:00 -{" "}
                        {(hour + 1).toString().padStart(2, "0")}:00
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {[
                  "DUSHANBA",
                  "SESHANBA",
                  "CHORSHANBA",
                  "PAYSHANBA",
                  "JUMA",
                  "SHANBA",
                  "YAKSHANBA",
                ].map((day) => (
                  <tr key={day}>
                    <td style={{ fontWeight: "bold" }}>{dayParser(day)}</td>
                    {renderScheduleCells(day)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tahrirlash modal oynasi */}
      {editModal && (
        <div className="modal" onClick={() => setEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Xonani tahrirlash</h3>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditModal(false)}
                style={{ float: "right", padding: "4px 8px" }}
              >
                Yopish
              </button>
            </div>
            <form onSubmit={updateRoom}>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Xona nomi</label>
                <input
                  type="text"
                  className="input"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Sig‘im (ixtiyoriy)</label>
                <input
                  type="number"
                  className="input"
                  value={editFormData.capacity}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      capacity: e.target.value,
                    })
                  }
                  placeholder="Masalan: 30"
                  min="0"
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
    </div>
  );
};

export default RoomManagement;
