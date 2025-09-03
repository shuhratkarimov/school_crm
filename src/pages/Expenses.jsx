"use client";

import { DollarSign, Pencil, Trash } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval } from "date-fns";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ExpensesChart from "../components/ExpensesChart";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ title: "", amount: "", date: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [today] = useState(new Date());
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // --- Backend bilan ishlash ---
  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/get_expenses`);
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
    if (!newExpense.title || !newExpense.amount || !newExpense.date) return;
    try {
      const res = editingId
        ? await fetch(`${import.meta.env.VITE_API_URL}/update_expense/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...newExpense, amount: Number(newExpense.amount) }),
          })
        : await fetch(`${import.meta.env.VITE_API_URL}/create_expense`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...newExpense, amount: Number(newExpense.amount) }),
          });
      if (!res.ok) toast.error(`Xarajat qo‘shishda xatolik yuz berdi: ${res.statusText}`);
      const saved = await res.json();
      toast.success(editingId ? "Xarajat tahrirlandi" : "Xarajat qo‘shildi");
      setNewExpense({ title: "", amount: "", date: "" });
      setEditingId(null);
      fetchExpenses(); // Backenddan qayta olish
    } catch (err) {
      console.error(err);
      toast.error(`Xatolik yuz berdi: ${err.message}`);
    }
  };

  const deleteExpense = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/delete_expense/${id}`, { method: "DELETE" });
      if (!res.ok) toast.error(`Xarajat o‘chirishda xatolik yuz berdi: ${res.statusText}`);
      toast.success("Xarajat o‘chirildi");
      fetchExpenses();
    } catch (err) {
      console.error(err);
      toast.error(`O‘chirishda xatolik: ${err.message}`);
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setNewExpense({ title: expense.title, amount: expense.amount, date: expense.date });
  };

  // --- Filtrlash va qidiruv ---
  const filteredExpenses = expenses.filter(expense => {
    const date = parseISO(expense.date);
    let matchesFilter = true;
    switch (filter) {
      case "day": matchesFilter = format(date, "dd-MM-yyyy") === format(today, "dd-MM-yyyy"); break;
      case "week": matchesFilter = isWithinInterval(date, { start: startOfWeek(today), end: endOfWeek(today) }); break;
      case "month": matchesFilter = isWithinInterval(date, { start: startOfMonth(today), end: endOfMonth(today) }); break;
      case "year": matchesFilter = isWithinInterval(date, { start: startOfYear(today), end: endOfYear(today) }); break;
    }
    const matchesSearch = expense.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDateRange = startDate && endDate ? isWithinInterval(date, { start: startDate, end: endDate }) : true;
    return matchesFilter && matchesSearch && matchesDateRange;
  });

  const total = filteredExpenses.reduce((acc, item) => acc + Number(item.amount), 0);

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>
          Diqqat! Ushbu xarajatga doir barcha ma'lumotlar o'chiriladi!
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
      <div className="bg-gray-50 min-h-screen">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign size={24} color="#104292" />
          <h1 className="text-2xl font-bold">Xarajatlar</h1>
        </div>
        <h1 className="text-[1.7rem] font-bold mb-6">Ushbu oyda jami: {total.toLocaleString()} so‘m</h1>
        <ExpensesChart/>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 mt-6">
          <input
            type="text"
            placeholder="Qidirish..."
            className="border rounded px-3 py-2 flex-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex gap-2">
            {["all", "day", "week", "month", "year"].map(f => (
              <button
                key={f}
                className={`px-4 py-2 rounded ${filter === f ? "bg-blue-600 text-white" : "bg-white shadow hover:bg-gray-100"}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "Barchasi" : f === "day" ? "Bugun" : f === "week" ? "Shu hafta" : f === "month" ? "Shu oy" : "Shu yil"}
              </button>
            ))}
          </div>
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => setDateRange(update)}
            isClearable={true}
            className="border rounded px-3 py-2 w-full sm:w-64"
          />
        </div>

        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-2">{editingId ? "Xarajatni tahrirlash" : "Yangi xarajat qo'shish"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <input type="text" placeholder="Nomi" className="border rounded px-3 py-2" value={newExpense.title} onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })} />
            <input type="number" placeholder="Summa" className="border rounded px-3 py-2" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
            <input type="date" className="border rounded px-3 py-2" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition" onClick={addExpense}>{editingId ? "Saqlash" : "Qo'shish"}</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {filteredExpenses.map(expense => (
            <div key={expense.id} className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
              <h3 className="text-lg font-semibold">{expense.title}</h3>
              <p className="text-gray-600">Summa: {Number(expense.amount).toLocaleString()} so‘m</p>
              <p className="text-gray-400">Sana: {expense.date}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => handleEdit(expense)} className="rounded-full p-2 hover:bg-blue-100 transition" style={{ backgroundColor: "#3b82f6" }}>
                  <Pencil size={20} color="white" />
                </button>
                <button onClick={() => showDeleteToast(expense.id)} className="rounded-full p-2 hover:bg-red-100 transition" style={{ backgroundColor: "#ef4444" }}>
                  <Trash size={20} color="white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}