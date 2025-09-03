"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO, isWithinInterval } from "date-fns";
import { Book, Pencil, Trash } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Notes() {
  const [records, setRecords] = useState([]);
  const [newRecord, setNewRecord] = useState({ title: "", description: "", date: "" });
  const [dateRange, setDateRange] = useState([null, null]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [startDate, endDate] = dateRange;

  // --- Backenddan ma’lumot olish ---
  const fetchNotes = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/get_notes`);
      if (!res.ok) throw new Error("Qaydlarni olishda xatolik yuz berdi");
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error(err);
      toast.error(`Qaydlarni olishda xatolik yuz berdi: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>
          Diqqat! Ushbu qaydga tegishli barcha ma'lumotlar o'chiriladi!
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
              deleteNote(id);
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

  // --- Qo‘shish yoki yangilash ---
  const handleAddOrUpdate = async () => {
    if (!newRecord.title || !newRecord.description || !newRecord.date) return;

    try {
      const res = editingId
        ? await fetch(`${import.meta.env.VITE_API_URL}/update_note/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newRecord),
          })
        : await fetch(`${import.meta.env.VITE_API_URL}/create_note`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newRecord),
          });

      if (!res.ok) throw new Error("Saqlashda xatolik");
      await res.json();

      toast.success(editingId ? "Qayd tahrirlandi" : "Qayd qo‘shildi");
      setNewRecord({ title: "", description: "", date: "" });
      setEditingId(null);
      fetchNotes(); // yangilash
    } catch (err) {
      console.error(err);
      toast.error(`Xatolik yuz berdi: ${err.message}`);
    }
  };

  // --- Tahrirlash ---
  const handleEdit = (record) => {
    setEditingId(record.id);
    setNewRecord({ title: record.title, description: record.description, date: record.date });
  };

  // --- O‘chirish ---
  const deleteNote = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/delete_note/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("O‘chirishda xatolik");
      toast.success("Qayd o‘chirildi");
      fetchNotes();
    } catch (err) {
      console.error(err);
      toast.error(`O‘chirishda xatolik: ${err.message}`);
    }
  };

  // --- Filtrlash ---
  const filteredRecords = records.filter((record) => {
    const recordDate = parseISO(record.date);
    const matchesDate = startDate && endDate ? isWithinInterval(recordDate, { start: startDate, end: endDate }) : true;
    const matchesSearch =
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesSearch;
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2 mb-6">
        <Book size={24} color="#104292" />
        <h1 className="text-2xl font-bold">Qaydlar</h1>
      </div>

      {/* Qidirish va Kalendar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Qidirish..."
          className="border rounded px-3 py-2 flex-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <DatePicker
          selectsRange
          startDate={startDate}
          endDate={endDate}
          onChange={(update) => setDateRange(update)}
          isClearable={true}
          className="border rounded px-3 py-2 w-full sm:w-64"
        />
      </div>

      {/* Yangi qayd qo'shish / Update */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">{editingId ? "Qaydni tahrirlash" : "Yangi qayd qo'shish"}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Sarlavha"
            className="border rounded px-3 py-2"
            value={newRecord.title}
            onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
          />
          <input
            type="text"
            placeholder="Tafsilot"
            className="border rounded px-3 py-2"
            value={newRecord.description}
            onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
          />
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={newRecord.date}
            onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            onClick={handleAddOrUpdate}
          >
            {editingId ? "Saqlash" : "Qo'shish"}
          </button>
        </div>
      </div>

      {/* Qaydlar ro'yxati */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecords.map((record) => (
          <div key={record.id} className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-lg font-semibold">{record.title}</h3>
            <p className="text-gray-600">{record.description}</p>
            <p className="text-gray-400 mt-2">Sana: {record.date}</p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleEdit(record)}
                className="p-2 transition rounded-full hover:bg-blue-700"
                style={{ backgroundColor: "#3b82f6" }}
              >
                <Pencil size={20} color="white" />
              </button>

              <button
                onClick={() => showDeleteToast(record.id)}
                className="p-2 transition rounded-full hover:bg-red-700"
                style={{ backgroundColor: "#ef4444" }}
              >
                <Trash size={20} color="white" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
