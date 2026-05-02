"use client";
import { useState, useEffect } from "react";
import { LogOut, Search, RotateCcw, Trash2, User, Phone, Calendar, BookOpen } from "lucide-react";
import { toast } from "react-hot-toast";
import LottieLoading from "../components/Loading";
import API_URL from "../conf/api";

export default function LeftStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1, limit: 10, totalItems: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false,
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  useEffect(() => {
    fetchLeft(page, debouncedSearch);
  }, [page, debouncedSearch]);

  const fetchLeft = async (p = 1, q = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(p),
        limit: "10",
        search: q,
        onlyLeft: "true",
        simple: "true",
      });
      const res = await fetch(`${API_URL}/get_students?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      setStudents(result.data || []);
      setPagination(result.pagination || pagination);
    } catch {
      toast.error("Ketgan o'quvchilarni olishda xato");
    } finally {
      setLoading(false);
    }
  };

  const restoreStudent = async (id) => {
    try {
      const res = await fetch(`${API_URL}/restore_student/${id}`, {
        method: "PUT",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      toast.success("O'quvchi qaytarildi");
      fetchLeft(page, debouncedSearch);
    } catch {
      toast.error("Qaytarishda xato");
    }
  };

  const deleteStudent = async (id) => {
    try {
      const res = await fetch(`${API_URL}/delete_student/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      toast.success("O'quvchi to'liq o'chirildi");
      fetchLeft(page, debouncedSearch);
    } catch {
      toast.error("O'chirishda xato");
    }
  };

  const showRestoreToast = (id, name) => {
    toast(
      <div>
        <p>{name} ni qaytarmoqchimisiz?</p>
        <p className="text-xs text-gray-500 mt-1">U yana asosiy o'quvchilar ro'yxatiga qo'shiladi.</p>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            style={{ padding: "8px 22px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
            onClick={() => { restoreStudent(id); toast.dismiss(); }}
          >Qaytarish</button>
          <button
            style={{ padding: "8px 16px", background: "#6c757d", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
            onClick={() => toast.dismiss()}
          >Bekor qilish</button>
        </div>
      </div>
    );
  };

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>Diqqat! O'quvchining barcha ma'lumotlari o'chiriladi!</p>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            style={{ padding: "8px 22px", background: "#dc2626", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
            onClick={() => { deleteStudent(id); toast.dismiss(); }}
          >O'chirish</button>
          <button
            style={{ padding: "8px 16px", background: "#6c757d", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
            onClick={() => toast.dismiss()}
          >Bekor qilish</button>
        </div>
      </div>
    );
  };

  if (loading && students.length === 0) return <LottieLoading />;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-5">
        <LogOut size={26} className="text-amber-600" />
        <h1 className="text-2xl font-bold text-slate-800">Ketgan o'quvchilar</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 mb-5">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Ism, familiya yoki telefon..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {students.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <LogOut size={48} className="mx-auto mb-3 text-slate-300" />
            <p>Ketgan o'quvchilar mavjud emas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">F.I.SH</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Telefon</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Guruhlar</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Ketgan sana</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s, i) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {(pagination.page - 1) * pagination.limit + i + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">
                      {s.first_name} {s.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{s.phone_number || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {s.groups?.length > 0
                        ? s.groups.map((g) => g.group_subject).join(", ")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {s.left_school ? new Date(s.left_school).toLocaleDateString("ru-RU") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          className="h-9 w-9 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                          onClick={() => showRestoreToast(s.id, `${s.first_name} ${s.last_name}`)}
                          title="Qaytarish"
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button
                          className="h-9 w-9 rounded-md flex items-center justify-center bg-red-100 text-red-700 hover:bg-red-200 transition"
                          onClick={() => showDeleteToast(s.id)}
                          title="To'liq o'chirish"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-600">
              Jami: {pagination.totalItems} ta
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-1.5 rounded-md border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >Oldingi</button>
              <span className="text-sm text-slate-700">{pagination.page} / {pagination.totalPages}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-1.5 rounded-md border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >Keyingi</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
