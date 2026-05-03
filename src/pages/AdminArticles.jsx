"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Pencil, Trash2, Image as ImageIcon, Video, Eye,
  ThumbsUp, MessageSquare, X, Save, Search, FileText, Calendar
} from "lucide-react";
import { toast } from "react-hot-toast";
import API_URL, { resolveImgUrl } from "../conf/api";

export default function AdminArticles() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("articles");

  const empty = {
    title: "",
    summary: "",
    content: "",
    cover_image: "",
    video_url: "",
    category: "metodika",
    published: true,
  };
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/admin/articles`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : data.articles || []);
    } catch {
      toast.error("Maqolalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/article-requests`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : data.requests || []);
    } catch {}
  };

  useEffect(() => {
    fetchArticles();
    fetchRequests();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  };

  const openEdit = async (a) => {
    try {
      const res = await fetch(`${API_URL}/admin/articles/${a.id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const full = data.article || data;
      setEditing(full);
      setForm({
        title: full.title || "",
        summary: full.summary || "",
        content: full.content || "",
        cover_image: full.cover_image || "",
        video_url: full.video_url || "",
        category: full.category || "metodika",
        published: full.published ?? true,
      });
      setModalOpen(true);
    } catch {
      toast.error("Maqolani yuklashda xatolik");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Rasm hajmi 5MB dan oshmasin");
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API_URL}/admin/articles/upload-image`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Yuklashda xatolik");
      setForm((f) => ({ ...f, cover_image: data.url }));
      toast.success("Rasm yuklandi");
    } catch (err) {
      toast.error(err.message || "Rasm o'qishda xatolik");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Sarlavha va matn majburiy");
      return;
    }
    try {
      const url = editing
        ? `${API_URL}/admin/articles/${editing.id}`
        : `${API_URL}/admin/articles`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(editing ? "Yangilandi" : "Yaratildi");
      setModalOpen(false);
      fetchArticles();
    } catch {
      toast.error("Saqlashda xatolik");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Maqolani o'chirishni tasdiqlang")) return;
    try {
      const res = await fetch(`${API_URL}/admin/articles/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      toast.success("O'chirildi");
      fetchArticles();
    } catch {
      toast.error("O'chirishda xatolik");
    }
  };

  const filtered = articles.filter((a) =>
    a.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">Maqolalar boshqaruvi</h1>
            <p className="text-sm text-slate-500">Metodikaga oid maqolalar yarating va boshqaring</p>
          </div>
          {activeTab === "articles" && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
            >
              <Plus size={18} /> Yangi maqola
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-5 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("articles")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === "articles"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-600"
            }`}
          >
            Maqolalar ({articles.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === "requests"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-600"
            }`}
          >
            So'rovlar ({requests.length})
          </button>
        </div>

        {activeTab === "articles" ? (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Sarlavha bo'yicha qidirish..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white"
              />
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText size={48} className="mx-auto mb-3 text-slate-300" />
                <p>Hali maqola yo'q</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filtered.map((a) => (
                  <div
                    key={a.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 hover:shadow-md transition"
                  >
                    {a.cover_image && (
                      <img
                        src={resolveImgUrl(a.cover_image)}
                        alt=""
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{a.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mt-1">{a.summary}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Eye size={12} /> {a.views || 0}</span>
                        <span className="flex items-center gap-1"><ThumbsUp size={12} /> {a.likes_count || 0}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={12} /> {a.comments_count || 0}</span>
                        {a.video_url && <span className="flex items-center gap-1"><Video size={12} /> Video</span>}
                        <span className={`px-2 py-0.5 rounded-full ${a.published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                          {a.published ? "Nashr etilgan" : "Qoralama"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => openEdit(a)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => remove(a.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="grid gap-3">
            {requests.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <MessageSquare size={48} className="mx-auto mb-3 text-slate-300" />
                <p>So'rovlar yo'q</p>
              </div>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {r.teacher_name || "Anonim ustoz"}
                      </p>
                      <p className="text-slate-700 mt-1">{r.message}</p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1">
                      <Calendar size={12} />
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("uz-UZ") : ""}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editing ? "Maqolani tahrirlash" : "Yangi maqola"}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-800">Sarlavha *</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-800">Qisqa tavsif (preview)</label>
                <textarea
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  rows={2}
                  maxLength={250}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400"
                  placeholder="Ro'yxatda ko'rinadigan qisqa tavsif"
                />
                <p className="text-xs text-slate-500 mt-1">{form.summary.length}/250</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-800">Kategoriya</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  <option value="metodika">Metodika</option>
                  <option value="psixologiya">Psixologiya</option>
                  <option value="texnologiya">Texnologiya</option>
                  <option value="tajriba">Tajriba</option>
                  <option value="boshqa">Boshqa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-800">Asosiy rasm</label>
                <div className="flex items-center gap-3">
                  {form.cover_image && (
                    <img src={resolveImgUrl(form.cover_image)} alt="" className="w-20 h-20 object-cover rounded-lg" />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer text-sm">
                    <ImageIcon size={16} />
                    {uploading ? "Yuklanmoqda..." : (form.cover_image ? "O'zgartirish" : "Rasm yuklash")}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                  {form.cover_image && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, cover_image: "" })}
                      className="text-red-600 text-sm hover:underline"
                    >
                      O'chirish
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1 text-slate-800">
                  <Video size={14} /> Video havolasi (YouTube, Vimeo)
                </label>
                <input
                  type="url"
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-800">Maqola matni *</label>
                <textarea
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 text-sm leading-relaxed font-mono"
                  placeholder={`Misol:\n\n# Katta sarlavha\n## Kichik sarlavha\n\nOddiy matn. Ba'zi so'zlar **qora va qalin**, ba'zilari *kursiv* bo'lishi mumkin.\n\n- Ro'yxat element 1\n- Ro'yxat element 2\n\n[Havola matni](https://example.com)`}
                />
                <div className="mt-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
                  <p className="font-semibold text-slate-700 mb-1">Formatlash (Markdown):</p>
                  <ul className="space-y-0.5">
                    <li><code className="bg-white px-1 rounded">**matn**</code> → <strong>qora qalin matn</strong></li>
                    <li><code className="bg-white px-1 rounded">*matn*</code> → <em>kursiv</em></li>
                    <li><code className="bg-white px-1 rounded"># Sarlavha</code> → katta sarlavha</li>
                    <li><code className="bg-white px-1 rounded">## Sarlavha</code> → o'rta sarlavha</li>
                    <li><code className="bg-white px-1 rounded">- element</code> → ro'yxat</li>
                    <li><code className="bg-white px-1 rounded">[matn](havola)</code> → bosiladigan havola</li>
                    <li><code className="bg-white px-1 rounded">&gt; iqtibos</code> → iqtibos bloki</li>
                  </ul>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                />
                Nashr etish (ustozlar ko'ra olishadi)
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Save size={16} /> Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
