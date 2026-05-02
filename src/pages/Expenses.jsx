"use client";

import { DollarSign, Pencil, Trash, Plus, X } from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ExpensesChart from "../components/ExpensesChart";
import API_URL from "../conf/api";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    date: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [today] = useState(new Date());
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setNewExpense({ title: "", amount: "", date: "" });
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

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${API_URL}/get_expenses`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Xarajatlarni olishda xatolik yuz berdi");
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error(err);
      toast.error(`Xarajatlarni olishda xatolik yuz berdi: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const addExpense = async () => {
    if (!newExpense.title || !newExpense.amount || !newExpense.date) {
      toast.error("Barcha maydonlarni to‘ldiring");
      return;
    }

    try {
      setSubmitting(true);

      const res = editingId
        ? await fetch(`${API_URL}/update_expense/${editingId}`, {
            credentials: "include",
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...newExpense,
              amount: Number(newExpense.amount),
            }),
          })
        : await fetch(`${API_URL}/create_expense`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...newExpense,
              amount: Number(newExpense.amount),
            }),
            credentials: "include",
          });

      if (!res.ok) {
        toast.error(
          `Xarajat qo‘shishda xatolik yuz berdi: ${res.statusText}`
        );
        return;
      }

      await res.json();

      toast.success(editingId ? "Xarajat tahrirlandi" : "Xarajat qo‘shildi");
      closeModal();
      fetchExpenses();
    } catch (err) {
      console.error(err);
      toast.error(`Xatolik yuz berdi: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteExpense = async (id) => {
    try {
      const res = await fetch(`${API_URL}/delete_expense/${id}`, {
        credentials: "include",
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error(`Xarajat o‘chirishda xatolik yuz berdi: ${res.statusText}`);
        return;
      }

      toast.success("Xarajat o‘chirildi");
      fetchExpenses();
    } catch (err) {
      console.error(err);
      toast.error(`O‘chirishda xatolik: ${err.message}`);
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setNewExpense({
      title: expense.title || "",
      amount: expense.amount || "",
      date: expense.date || "",
    });
    setIsModalOpen(true);
  };

  const filteredExpenses = expenses.filter((expense) => {
    const date = parseISO(expense.date);
    let matchesFilter = true;

    switch (filter) {
      case "day":
        matchesFilter =
          format(date, "dd-MM-yyyy") === format(today, "dd-MM-yyyy");
        break;
      case "week":
        matchesFilter = isWithinInterval(date, {
          start: startOfWeek(today),
          end: endOfWeek(today),
        });
        break;
      case "month":
        matchesFilter = isWithinInterval(date, {
          start: startOfMonth(today),
          end: endOfMonth(today),
        });
        break;
      case "year":
        matchesFilter = isWithinInterval(date, {
          start: startOfYear(today),
          end: endOfYear(today),
        });
        break;
      default:
        matchesFilter = true;
    }

    const matchesSearch = expense.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesDateRange =
      startDate && endDate
        ? isWithinInterval(date, { start: startDate, end: endDate })
        : true;

    return matchesFilter && matchesSearch && matchesDateRange;
  });

  const total = filteredExpenses.reduce(
    (acc, item) => acc + Number(item.amount),
    0
  );

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>Diqqat! Ushbu xarajatga doir barcha ma'lumotlar o'chiriladi!</p>
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
              deleteExpense(id);
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

  return (
    <>
      <div className="bg-gray-50 min-h-screen pb-6 px-2 sm:px-4">
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <DollarSign size={24} color="#104292" />
            <h1 className="text-xl sm:text-2xl font-bold">Xarajatlar</h1>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-[#104292] text-white px-3 sm:px-4 py-2 hover:bg-[#104292]/90 transition rounded-lg"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Yangi xarajat</span>
            <span className="sm:hidden">Qo'shish</span>
          </button>
        </div>

        <h1 className="text-xl sm:text-[1.7rem] font-bold mb-4 sm:mb-6 break-words">
          Ushbu oyda jami: {total.toLocaleString()} so‘m
        </h1>

        <ExpensesChart expenses={filteredExpenses} />

        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6 mt-6">
          <input
            type="text"
            placeholder="Qidirish..."
            className="border px-3 py-2 flex-1 outline-none focus:ring-2 focus:ring-[#104292] rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="flex gap-2 flex-wrap">
            {["all", "day", "week", "month", "year"].map((f) => (
              <button
                key={f}
                className={`px-3 sm:px-4 py-2 transition rounded-lg text-sm sm:text-base ${
                  filter === f
                    ? "bg-[#104292] text-white"
                    : "bg-white shadow hover:bg-gray-100"
                }`}
                onClick={() => setFilter(f)}
              >
                {f === "all"
                  ? "Barchasi"
                  : f === "day"
                  ? "Bugun"
                  : f === "week"
                  ? "Shu hafta"
                  : f === "month"
                  ? "Shu oy"
                  : "Shu yil"}
              </button>
            ))}
          </div>

          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => setDateRange(update)}
            isClearable={true}
            className="border px-3 py-2 w-full lg:w-64 outline-none focus:ring-2 focus:ring-[#104292] rounded-lg"
            placeholderText="Sana oralig'i"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-white p-5 shadow hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold">{expense.title}</h3>
              <p className="text-gray-600">
                Summa: {Number(expense.amount).toLocaleString()} so‘m
              </p>
              <p className="text-gray-400">Sana: {expense.date}</p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleEdit(expense)}
                  className="p-2 hover:bg-[#104292]/80 transition"
                  style={{ backgroundColor: "#104292" }}
                >
                  <Pencil size={20} color="white" />
                </button>

                <button
                  onClick={() => showDeleteToast(expense.id)}
                  className="p-2 hover:bg-[#ef4444]/80 transition"
                  style={{ backgroundColor: "#ef4444" }}
                >
                  <Trash size={20} color="white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg bg-white shadow-2xl overflow-hidden">
            <div className="flex bg-[#104292] items-center justify-between px-5 py-4 border-b">
              <h2 className="text-xl font-semibold text-white">
                {editingId ? "Xarajatni tahrirlash" : "Yangi xarajat qo'shish"}
              </h2>

              <button
                onClick={closeModal}
                className="p-2 hover:bg-[#104292]/80 transition"
                style={{ backgroundColor: "#104292" }}
              >
                <X size={20} color="white" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nomi</label>
                <input
                  type="text"
                  placeholder="Masalan: Elektr energiya"
                  className="w-full border px-3 py-2 outline-none focus:ring-2 focus:ring-[#104292]"
                  value={newExpense.title}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Summa</label>
                <input
                  type="number"
                  placeholder="Masalan: 250000"
                  className="w-full border px-3 py-2 outline-none focus:ring-2 focus:ring-[#104292]"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sana</label>
                <input
                  type="date"
                  className="w-full border px-3 py-2 outline-none focus:ring-2 focus:ring-[#104292]"
                  value={newExpense.date}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, date: e.target.value })
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
                onClick={addExpense}
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