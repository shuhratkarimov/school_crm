"use client";

import { useState, useEffect } from "react";
import { Trash2, School, Pen, Plus, X } from "lucide-react";
import LottieLoading from "../components/Loading";
import "../index.css";
import { toast } from "react-hot-toast";
import API_URL from "../conf/api";

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
  const [addRoomModalOpen, setAddRoomModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [roomsResponse, schedulesResponse] = await Promise.all([
        fetch(`${API_URL}/get_rooms`, {
          credentials: "include",
        }).catch(() => ({
          ok: false,
        })),
        fetch(`${API_URL}/get_schedules`, {
          credentials: "include",
        }).catch(() => ({
          ok: false,
        })),
      ]);

      if (roomsResponse.ok) {
        setRooms(await roomsResponse.json());
      } else {
        setRooms([]);
        toast.error("Xonalar hali mavjud emas");
      }
      if (schedulesResponse.ok) {
        setSchedules(await schedulesResponse.json());
      } else {
        setSchedules([]);
        toast.error("Jadval hali mavjud emas");
      }
    } catch (err) {
      setRooms([]);
      setSchedules([]);
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const addRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/create_room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          capacity: formData.capacity ? Number(formData.capacity) : null,
        }),
        credentials: "include",
      });

      if (response.ok) {
        const newRoom = await response.json();
        setRooms([...rooms, newRoom.room]);
        toast.success(`${formData.name} xonasi muvaffaqiyatli qo'shildi`);
        setFormData({ name: "", capacity: "" });
        setAddRoomModalOpen(false);
      } else {
        throw new Error("Xona qo'shishda xatolik yuz berdi");
      }
    } catch (err) {
      toast.error(`Xona qo'shishda xatolik: ${err.message}`);
    }
  };

  const updateRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${API_URL}/update_room/${editingRoom.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editFormData.name,
            capacity: editFormData.capacity
              ? Number(editFormData.capacity)
              : null,
          }),
          credentials: "include",
        }
      );

      if (response.ok) {
        const updatedRoom = { ...editingRoom, ...editFormData };
        setRooms(
          rooms.map((room) => (room.id === editingRoom.id ? updatedRoom : room))
        );
        toast.success(`${editFormData.name} xonasi muvaffaqiyatli yangilandi`);
        setEditModal(false);
      } else {
        throw new Error("Xonani yangilashda xatolik yuz berdi");
      }
    } catch (err) {
      toast.error(`Xonani yangilashda xatolik: ${err.message}`);
    }
  };

  const deleteRoom = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/delete_room/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        setRooms(rooms.filter((r) => r.id !== id));
        toast.success("Xona muvaffaqiyatli o'chirildi");
        if (selectedRoom?.id === id) setSelectedRoom(null);
      } else {
        throw new Error("Xonani o'chirishda xatolik yuz berdi");
      }
    } catch (err) {
      toast.error(`Xonani o'chirishda xatolik: ${err.message}`);
    }
  };

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>
          Diqqat! Ushbu xonani o'chirishga ishonchingiz komilmi?
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
      </div>
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
    return 'green';
  };

  const renderScheduleCells = (day) => {
    const daySchedules = getRoomSchedules(selectedRoom.id).filter(
      (schedule) => schedule.day === day
    ).sort((a, b) => a.start_time.localeCompare(b.start_time));

    const cells = [];
    let currentHour = 9; // 09:00 dan boshlaymiz
    let processedSchedules = new Set(); // Qayta ishlangan darslarni saqlash

    while (currentHour < 18) { // 18:00 gacha
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
              position: "relative",
              padding: "10px",
              border: "1px solid #d1d5db",
              minWidth: `${durationHours * 110}px`,
              textAlign: "center",
              verticalAlign: "middle",
            }}
          >
            <div style={{
              position: 'relative',
              zIndex: 2,
              padding: '4px',
              wordBreak: 'break-word'
            }}>
              <p><strong>Guruh:</strong> {schedule.scheduleGroup?.group_subject || 'Noma\'lum'}</p>
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
              border: "1px solid #d1d5db",
              minWidth: "110px",
              height: "72px",
              background: "#ffffff",
            }}
          ></td>
        );
      }

      currentHour++;
    }

    return cells;
  };

  const openAddRoomModal = () => {
    setAddRoomModalOpen(true);
  };

  const closeAddRoomModal = () => {
    setAddRoomModalOpen(false);
  };

  return (
    <div>
      <div className="flex flex-col gap-3 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <School size={24} color="#104292" />
          <h1 className="text-2xl font-bold">Xonalar va darslar jadvali</h1>
        </div>

        <button
          className="flex items-center gap-2 bg-[#104292] px-4 py-2 text-white transition hover:bg-[#0d3677]"
          onClick={() => {
            setSelectedRoom(null);
            setFormData({ name: "", capacity: "" });
            setEditModal(false);
            openAddRoomModal();
          }}
        >
          <Plus size={18} />
          Yangi xona qo'shish
        </button>
      </div>
      {/* Xona qo‘shish formasi */}


      <div className="card mt-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold">Xonalar ({rooms.length} ta)</h3>
        </div>

        {rooms.length === 0 ? (
          <div className="border border-gray-200 bg-gray-50 py-10 text-center text-gray-500">
            {error || "Xonalar hali mavjud emas"}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`cursor-pointer border bg-white p-5 shadow-sm transition hover:shadow-md ${selectedRoom?.id === room.id
                  ? "border-[#104292] bg-blue-50 ring-2 ring-[#104292]/10"
                  : "border-gray-200"
                  }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{room.name}</h4>
                    <p className="mt-1 text-sm text-gray-500">Xona ma'lumotlari</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="flex h-9 w-9 items-center justify-center bg-blue-600 text-white transition hover:bg-blue-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(room);
                      }}
                      title="Tahrirlash"
                    >
                      <Pen size={16} />
                    </button>

                    <button
                      className="flex h-9 w-9 items-center justify-center bg-red-600 text-white transition hover:bg-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        showDeleteToast(room.id);
                      }}
                      title="O'chirish"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                    <span className="font-medium text-gray-500">Sig‘im</span>
                    <span className="text-right font-semibold text-gray-900">
                      {room.capacity ? `${room.capacity} o'quvchi` : "Belgilanmagan"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                    <span className="font-medium text-gray-500">Asosan bo‘sh</span>
                    <span className="text-right font-semibold text-gray-900">
                      {room?.busiestFreePeriod || "Kun bo'yi"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="font-medium text-gray-500">Bandlik foizi</span>
                    <span className="text-right font-bold text-[#104292]">
                      {room?.occupancyPercentage != null
                        ? `${room.occupancyPercentage}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {selectedRoom && (
        <div className="card mt-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {selectedRoom.name} xonasidagi darslar jadvali
              </h3>
              <p className="text-sm text-gray-500">
                Haftalik bandlik ko‘rinishi
              </p>
            </div>

            <div className="bg-blue-50 px-4 py-2 text-sm font-medium text-[#104292]">
              Bandlik:{" "}
              <span className="font-bold">
                {selectedRoom?.occupancyPercentage != null
                  ? `${selectedRoom.occupancyPercentage}%`
                  : "0%"}
              </span>
            </div>
          </div>

          {getRoomSchedules(selectedRoom.id).length === 0 ? (
            <div className="border border-gray-200 bg-gray-50 py-10 text-center text-gray-500">
              Ushbu xonada darslar belgilangan emas
            </div>
          ) : (
            <div className="overflow-hidden border border-gray-300 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-[12px]">
                  <thead className="bg-[#104292] text-white">
                    <tr>
                      <th className="min-w-[150px] border border-gray-300 px-4 py-3 text-center font-semibold">
                        Kun / Soat
                      </th>
                      {Array.from({ length: 9 }, (_, i) => {
                        const hour = 9 + i;
                        return (
                          <th
                            key={hour}
                            className="min-w-[110px] border border-gray-300 px-4 py-3 text-center font-semibold"
                          >
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
                        <td className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">
                          {day}
                        </td>
                        {renderScheduleCells(day)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 bg-[#104292] px-6 py-4 text-white">
              <h2 className="text-xl font-bold">Xonani tahrirlash</h2>
              <button
                type="button"
                onClick={() => setEditModal(false)}
                className="rounded-full p-2 transition-colors hover:bg-blue-700"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={updateRoom} className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Xona nomi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    placeholder="Masalan: 1-xona"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Sig‘im (ixtiyoriy)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
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
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  className="px-5 py-2 bg-gray-200 text-gray-700 transition hover:bg-gray-300"
                  onClick={() => setEditModal(false)}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#104292] text-white transition hover:bg-[#0d3677]"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-[#104292] px-6 py-4 text-white">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Plus size={20} />
                Yangi xona qo'shish
              </h2>
              <button
                type="button"
                onClick={closeAddRoomModal}
                className="rounded-full p-2 transition-colors hover:bg-blue-700"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={addRoom} className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Xona nomi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Xona nomini kiriting"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Sig‘im (ixtiyoriy)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 px-4 py-2 outline-none transition focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                    placeholder="Masalan: 30"
                    min="0"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  className="px-5 py-2 bg-gray-200 text-gray-700 transition hover:bg-gray-300"
                  onClick={closeAddRoomModal}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#104292] px-5 py-2 text-white transition hover:bg-[#0d3677]"
                >
                  <Plus size={18} />
                  Qo'shish
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
