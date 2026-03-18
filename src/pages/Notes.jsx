"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO, isWithinInterval } from "date-fns";
import { Book, Pencil, Trash, Plus, X } from "lucide-react";
import { toast } from "react-hot-toast";
import API_URL from "../conf/api";

export default function Notes() {
  const [records, setRecords] = useState([]);
  const [newRecord, setNewRecord] = useState({
    title: "",
    description: "",
    date: "",
  });
  const [dateRange, setDateRange] = useState([null, null]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [startDate, endDate] = dateRange;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setNewRecord({ title: "", description: "", date: "" });
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    resetForm();
    setIsModalOpen(false);
  };

  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API_URL}/get_notes`, {
        credentials: "include",
      });
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
        <p>Diqqat! Ushbu qaydga tegishli barcha ma'lumotlar o'chiriladi!</p>
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

  const handleAddOrUpdate = async () => {
    if (!newRecord.title || !newRecord.description || !newRecord.date) {
      toast.error("Barcha maydonlarni to‘ldiring");
      return;
    }

    try {
      setSubmitting(true);

      const res = editingId
        ? await fetch(`${API_URL}/update_note/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newRecord),
          credentials: "include",
        })
        : await fetch(`${API_URL}/create_note`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newRecord),
          credentials: "include",
        });

      if (!res.ok) throw new Error("Saqlashda xatolik");

      await res.json();

      toast.success(editingId ? "Qayd tahrirlandi" : "Qayd qo‘shildi");
      closeModal();
      fetchNotes();
    } catch (err) {
      console.error(err);
      toast.error(`Xatolik yuz berdi: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setNewRecord({
      title: record.title || "",
      description: record.description || "",
      date: record.date || "",
    });
    setIsModalOpen(true);
  };

  const deleteNote = async (id) => {
    try {
      const res = await fetch(`${API_URL}/delete_note/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("O‘chirishda xatolik");
      toast.success("Qayd o‘chirildi");
      fetchNotes();
    } catch (err) {
      console.error(err);
      toast.error(`O‘chirishda xatolik: ${err.message}`);
    }
  };

  const filteredRecords = records.filter((record) => {
    const recordDate = parseISO(record.date);

    const matchesDate =
      startDate && endDate
        ? isWithinInterval(recordDate, { start: startDate, end: endDate })
        : true;

    const matchesSearch =
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDate && matchesSearch;
  });

  return (
    <>
      <div className="bg-gray-50 min-h-screen pb-6">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Book size={24} color="#104292" />
            <h1 className="text-2xl font-bold">Qaydlar</h1>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-[#104292] text-white px-4 py-2 hover:bg-[#104292]/90 transition"
          >
            <Plus size={18} />
            Yangi qayd
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Qidirish..."
            className="border px-3 py-2 flex-1 rounded-md outline-none focus:ring-2 focus:ring-[#104292]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => setDateRange(update)}
            isClearable={true}
            className="border px-3 py-2 w-full sm:w-64 rounded-md outline-none focus:ring-2 focus:ring-[#104292]"
            placeholderText="Sana oralig'i"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                className="bg-white p-5 shadow hover:shadow-lg transition"
              >
                <h3 className="text-lg font-semibold">{record.title}</h3>
                <p className="text-gray-600 mt-1">{record.description}</p>
                <p className="text-gray-400 mt-2">Sana: {record.date}</p>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(record)}
                    className="p-2 rounded-lg transition hover:bg-[#104292]/80"
                    style={{ backgroundColor: "#104292" }}
                  >
                    <Pencil size={20} color="white" />
                  </button>

                  <button
                    onClick={() => showDeleteToast(record.id)}
                    className="p-2 rounded-lg transition hover:bg-[#ef4444]/80"
                    style={{ backgroundColor: "#ef4444" }}
                  >
                    <Trash size={20} color="white" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center min-h-[280px] rounded-2xl border border-dashed border-gray-300 bg-white text-center px-6">
              <Book size={42} className="text-gray-400 mb-3" />
              <h3 className="text-lg font-semibold text-gray-700">Qaydlar topilmadi</h3>
              <p className="text-sm text-gray-500 mt-1">
                Hozircha hech qanday qayd mavjud emas yoki qidiruv bo‘yicha natija chiqmadi.
              </p>
            </div>
          )}
        </div>
      </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-lg bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b bg-[#104292] text-white">
                <h2 className="text-xl font-semibold">
                  {editingId ? "Qaydni tahrirlash" : "Yangi qayd qo'shish"}
                </h2>

                <button
                  onClick={closeModal}
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sarlavha
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: Oylik yig‘ilish"
                    className="w-full border px-3 py-2 outline-none focus:ring-2 focus:ring-[#104292]"
                    value={newRecord.title}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tafsilot
                  </label>
                  <textarea
                    placeholder="Qayd tafsilotini kiriting..."
                    rows={4}
                    className="w-full border px-3 py-2 outline-none focus:ring-2 focus:ring-[#104292] resize-none"
                    value={newRecord.description}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Sana</label>
                  <input
                    type="date"
                    className="w-full border px-3 py-2 outline-none focus:ring-2 focus:ring-[#104292]"
                    value={newRecord.date}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 px-5 py-4 border-t bg-gray-50">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 transition"
                >
                  Bekor qilish
                </button>

                <button
                  onClick={handleAddOrUpdate}
                  disabled={submitting}
                  className="px-4 py-2 bg-[#104292] text-white hover:bg-[#104292]/90 transition disabled:opacity-60"
                >
                  {submitting
                    ? "Saqlanmoqda..."
                    : editingId
                      ? "Saqlash"
                      : "Qo'shish"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
      );
}