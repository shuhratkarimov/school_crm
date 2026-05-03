"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, Camera, Lock, Save, Eye, EyeOff, AtSign, Image as ImageIcon, Trash2, CheckCircle2
} from "lucide-react";
import { toast } from "react-hot-toast";
import API_URL, { resolveImgUrl } from "../conf/api";

export default function TeacherProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    img_url: "",
  });

  const [pwd, setPwd] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/teacher/profile`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfile(data);
      setForm({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        username: data.username || "",
        img_url: data.img_url || "",
      });
    } catch {
      toast.error("Profilni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Rasm hajmi 3MB dan oshmasin");
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API_URL}/teacher/profile/upload-image`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Yuklashda xatolik");
      setForm((f) => ({ ...f, img_url: data.url }));
      toast.success("Rasm yuklandi — saqlash uchun \"Saqlash\"ni bosing");
    } catch (err) {
      toast.error(err.message || "Rasm o'qishda xatolik");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const removeImage = () => {
    setForm((f) => ({ ...f, img_url: "" }));
  };

  const saveProfile = async (e) => {
    e?.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("Ism va familiya majburiy");
      return;
    }
    if (!form.username.trim()) {
      toast.error("Username majburiy");
      return;
    }
    try {
      setSavingProfile(true);
      const res = await fetch(`${API_URL}/teacher/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Saqlashda xatolik");
      setProfile(data);
      if (data?.img_url) localStorage.setItem("teacher_avatar", data.img_url);
      else localStorage.removeItem("teacher_avatar");
      window.dispatchEvent(new Event("teacher-profile-updated"));
      toast.success("Profil saqlandi");
    } catch (err) {
      toast.error(err.message || "Saqlashda xatolik");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e?.preventDefault();
    if (!pwd.old_password || !pwd.new_password) {
      toast.error("Eski va yangi parolni kiriting");
      return;
    }
    if (pwd.new_password.length < 6) {
      toast.error("Yangi parol kamida 6 ta belgi bo'lsin");
      return;
    }
    if (pwd.new_password !== pwd.confirm_password) {
      toast.error("Yangi parol va tasdiqlash mos emas");
      return;
    }
    try {
      setSavingPwd(true);
      const res = await fetch(`${API_URL}/teacher/password`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          old_password: pwd.old_password,
          new_password: pwd.new_password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Parolni o'zgartirishda xatolik");
      toast.success("Parol o'zgartirildi");
      setPwd({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      toast.error(err.message || "Parolni o'zgartirishda xatolik");
    } finally {
      setSavingPwd(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-slate-500">Yuklanmoqda...</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-2"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
          <User className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profilim</h1>
          <p className="text-sm text-slate-500">Shaxsiy ma'lumotlar va xavfsizlik</p>
        </div>
      </motion.div>

      {/* PROFILE CARD */}
      <motion.form
        onSubmit={saveProfile}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5"
      >
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ImageIcon size={18} /> Shaxsiy ma'lumotlar
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md ring-2 ring-slate-200">
              {form.img_url ? (
                <img src={resolveImgUrl(form.img_url)} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-3xl font-bold bg-gradient-to-br from-indigo-100 to-purple-100">
                  {(form.first_name || profile?.first_name || "U")[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md disabled:opacity-50"
              aria-label="Rasm yuklash"
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <div className="flex-1 w-full sm:w-auto">
            <p className="text-sm text-slate-700 font-medium">Profil rasmi</p>
            <p className="text-xs text-slate-500 mt-1">
              JPG, PNG yoki WebP. Maksimum 3MB.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-sm px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
              >
                {uploading ? "Yuklanmoqda..." : (form.img_url ? "Almashtirish" : "Rasm tanlash")}
              </button>
              {form.img_url && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-sm px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 flex items-center gap-1"
                >
                  <Trash2 size={14} /> O'chirish
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Ism *</label>
            <input
              type="text"
              required
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Familiya *</label>
            <input
              type="text"
              required
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-1 flex items-center gap-1">
            <AtSign size={14} /> Username (kirish uchun) *
          </label>
          <input
            type="text"
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value.replace(/\s+/g, "") })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400"
            placeholder="masalan, ali_ustoz"
          />
          <p className="text-xs text-slate-500 mt-1">
            Username unikal bo'lishi kerak. O'zgartirilgach, keyingi kirish yangi nom bilan amalga oshiriladi.
          </p>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={savingProfile}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow disabled:opacity-50"
          >
            {savingProfile ? (
              "Saqlanmoqda..."
            ) : (
              <>
                <Save size={16} /> Saqlash
              </>
            )}
          </button>
        </div>
      </motion.form>

      {/* PASSWORD CARD */}
      <motion.form
        onSubmit={savePassword}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4"
      >
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Lock size={18} /> Parolni o'zgartirish
        </h2>
        <p className="text-sm text-slate-500 -mt-2">
          Xavfsizlik uchun avval eski parolni kiriting.
        </p>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-1">Eski parol *</label>
          <div className="relative">
            <input
              type={showOld ? "text" : "password"}
              value={pwd.old_password}
              onChange={(e) => setPwd({ ...pwd, old_password: e.target.value })}
              className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg bg-white text-slate-900"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700"
            >
              {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Yangi parol *</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={pwd.new_password}
                onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg bg-white text-slate-900"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Kamida 6 ta belgi.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Tasdiqlash *</label>
            <input
              type={showNew ? "text" : "password"}
              value={pwd.confirm_password}
              onChange={(e) => setPwd({ ...pwd, confirm_password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
              autoComplete="new-password"
            />
            {pwd.confirm_password && pwd.new_password === pwd.confirm_password && (
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 size={12} /> Mos
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={savingPwd}
            className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow disabled:opacity-50"
          >
            {savingPwd ? "Saqlanmoqda..." : (
              <>
                <Lock size={16} /> Parolni yangilash
              </>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
