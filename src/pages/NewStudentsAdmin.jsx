"use client"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, UserCheck, UserX, Trash2, CheckCircle, XCircle, UserPlus, X, Plus, Phone, User as UserIcon, Users as UsersIcon, Calendar, BookOpen,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-hot-toast';
import API_URL from '../conf/api';

export default function NewStudentsAdmin() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: null, end: null });
  const [statusFilter, setStatusFilter] = useState('all');

  // Approve modal
  const [approveModal, setApproveModal] = useState(false);
  const [approveData, setApproveData] = useState(null);
  const [approveForm, setApproveForm] = useState({
    first_name: '', last_name: '', father_name: '', birth_date: '',
    phone_number: '', parents_phone_number: '', came_in_school: '',
    group_ids: [],
  });
  const [groups, setGroups] = useState([]);
  const [dropdownGroups, setDropdownGroups] = useState([]);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupLoading, setGroupLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchStudents(); }, []);
  useEffect(() => { filterStudents(); }, [students, searchQuery, dateFilter, statusFilter]);

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_URL}/get-new-students`, { credentials: 'include' });
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      toast.error("O'quvchilarni olishda xato");
    }
  };

  const fetchGroups = async (search = '') => {
    try {
      setGroupLoading(true);
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      const res = await fetch(`${API_URL}/get_groups?${params}`, { credentials: 'include' });
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json.data || []);
      setDropdownGroups(list);
      setGroups((prev) => {
        const merged = [...prev];
        list.forEach((g) => { if (!merged.find((x) => x.id === g.id)) merged.push(g); });
        return merged;
      });
    } catch {
      // silent
    } finally {
      setGroupLoading(false);
    }
  };

  useEffect(() => {
    if (!approveModal) return;
    const t = setTimeout(() => fetchGroups(groupSearch), groupSearch ? 300 : 0);
    return () => clearTimeout(t);
  }, [groupSearch, approveModal]);

  const filterStudents = () => {
    let result = Array.isArray(students) ? [...students] : [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        (s.first_name || '').toLowerCase().includes(q) ||
        (s.last_name || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q) ||
        (s.subject || '').toLowerCase().includes(q)
      );
    }
    if (dateFilter.start && dateFilter.end) {
      result = result.filter(s => {
        const d = new Date(s.created_at);
        return d >= dateFilter.start && d <= dateFilter.end;
      });
    }
    if (statusFilter !== 'all') {
      const isInterviewed = statusFilter === 'interviewed';
      result = result.filter(s => s.interviewed === isInterviewed);
    }
    // Approved bo'lganlarni ro'yxatdan chiqarish
    result = result.filter(s => !s.approved);
    setFilteredStudents(result);
  };

  const toggleInterviewStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_URL}/update-new-student/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewed: !currentStatus }),
        credentials: 'include',
      });
      if (res.ok) {
        fetchStudents();
        toast.success('Status yangilandi');
      } else throw new Error('error');
    } catch {
      toast.error('Xato yuz berdi');
    }
  };

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>Diqqat! Ushbu yangi o'quvchi ma'lumotlari o'chiriladi!</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            style={{ padding: '8px 22px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            onClick={() => { deleteStudent(id); toast.dismiss(); }}
          >O'chirish</button>
          <button
            style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            onClick={() => toast.dismiss()}
          >Bekor qilish</button>
        </div>
      </div>
    );
  };

  const deleteStudent = async (id) => {
    try {
      const res = await fetch(`${API_URL}/delete-new-student/${id}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) { fetchStudents(); toast.success("O'quvchi o'chirildi"); }
      else throw new Error();
    } catch { toast.error('Xato yuz berdi'); }
  };

  // Approve flow
  const openApproveModal = (s) => {
    setApproveData(s);
    const stripPhone = (p) => (p || '').replace(/^\+998/, '');
    setApproveForm({
      first_name: s.first_name || '',
      last_name: s.last_name || '',
      father_name: s.father_name || '',
      birth_date: s.birth_date ? s.birth_date.slice(0, 10) : '',
      phone_number: s.phone ? (s.phone.startsWith('+') ? s.phone : '+998' + stripPhone(s.phone)) : '',
      parents_phone_number: s.parents_phone_number || '',
      came_in_school: s.came_in_school ? s.came_in_school.slice(0, 10) : '',
      group_ids: [],
    });
    setApproveModal(true);
    setGroupSearch('');
  };

  const closeApproveModal = () => {
    setApproveModal(false);
    setApproveData(null);
    setApproveForm({
      first_name: '', last_name: '', father_name: '', birth_date: '',
      phone_number: '', parents_phone_number: '', came_in_school: '',
      group_ids: [],
    });
    setGroupSearch('');
  };

  const submitApprove = async (e) => {
    e.preventDefault();
    if (approveForm.group_ids.length === 0) {
      toast.error('Kamida bitta guruh tanlang');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        first_name: approveForm.first_name.trim(),
        last_name: approveForm.last_name.trim(),
        father_name: approveForm.father_name.trim() || null,
        birth_date: approveForm.birth_date || null,
        phone_number: approveForm.phone_number.trim(),
        parents_phone_number: approveForm.parents_phone_number.trim(),
        came_in_school: approveForm.came_in_school || null,
        group_ids: approveForm.group_ids,
      };
      const res = await fetch(`${API_URL}/create_student`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "O'quvchi yaratishda xato");
      }
      // NewStudent ni approved qilish
      await fetch(`${API_URL}/update-new-student/${approveData.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });
      toast.success("O'quvchi muvaffaqiyatli ro'yxatga qo'shildi");
      closeApproveModal();
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Xato');
    } finally {
      setSubmitting(false);
    }
  };

  const card = "bg-white shadow-sm rounded-2xl border border-slate-200";
  const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto p-4 sm:p-6 max-w-[1400px]">
        <div className="mb-5 flex items-center gap-2">
          <UserPlus size={26} className="text-[#104292]" />
          <h1 className="text-2xl font-bold text-slate-800">Qiziquvchilar (yangi o'quvchilar)</h1>
        </div>

        {/* Filters */}
        <div className={`${card} p-4 sm:p-5 mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ism, familiya, telefon yoki fan..."
                className={`${inputCls} pl-10`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                className={`${inputCls} pl-10 appearance-none`}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Barchasi</option>
                <option value="interviewed">Suhbatlashilgan</option>
                <option value="not-interviewed">Suhbatlashilmagan</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <DatePicker
                selected={dateFilter.start}
                onChange={(date) => setDateFilter({ ...dateFilter, start: date })}
                selectsStart
                startDate={dateFilter.start}
                endDate={dateFilter.end}
                placeholderText="Dan"
                className={inputCls}
              />
              <DatePicker
                selected={dateFilter.end}
                onChange={(date) => setDateFilter({ ...dateFilter, end: date })}
                selectsEnd
                startDate={dateFilter.start}
                endDate={dateFilter.end}
                minDate={dateFilter.start}
                placeholderText="Gacha"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Jami yangi o'quvchilar", value: filteredStudents.length, color: "blue", Icon: UserCheck },
            { label: "Suhbatlashilgan", value: filteredStudents.filter(s => s.interviewed).length, color: "green", Icon: CheckCircle },
            { label: "Suhbatlashilmagan", value: filteredStudents.filter(s => !s.interviewed).length, color: "orange", Icon: UserX },
          ].map((s) => (
            <div key={s.label} className={`${card} p-5 flex items-center justify-between`}>
              <div>
                <p className="text-sm text-slate-600">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color === 'blue' ? 'text-slate-800' : s.color === 'green' ? 'text-emerald-600' : 'text-orange-600'}`}>
                  {s.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${s.color === 'blue' ? 'bg-blue-100' : s.color === 'green' ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                <s.Icon size={24} className={s.color === 'blue' ? 'text-blue-600' : s.color === 'green' ? 'text-emerald-600' : 'text-orange-600'} />
              </div>
            </div>
          ))}
        </div>

        {/* Lists */}
        <div className={`${card} overflow-hidden`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Not Interviewed */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <UserX size={20} className="text-orange-500" />
                <h2 className="text-lg font-semibold text-slate-800">Suhbatlashilmagan</h2>
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-medium">
                  {filteredStudents.filter(s => !s.interviewed).length}
                </span>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredStudents.filter(s => !s.interviewed).map((s) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="border border-slate-200 rounded-xl p-3.5 hover:shadow-md transition"
                    >
                      <div className="flex justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-800">{s.first_name} {s.last_name}</h3>
                          <p className="text-sm text-slate-600">{s.phone}</p>
                          <p className="text-sm text-slate-600">Fan: <span className="font-medium">{s.subject}</span></p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(s.created_at).toLocaleDateString('ru-RU')} {new Date(s.created_at).toLocaleTimeString('ru-RU').slice(0, 5)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => toggleInterviewStatus(s.id, s.interviewed)}
                            className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                            title="Suhbatlashildi deb belgilash"
                          ><CheckCircle size={16} /></button>
                          <button
                            onClick={() => showDeleteToast(s.id)}
                            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                            title="O'chirish"
                          ><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredStudents.filter(s => !s.interviewed).length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <UserX size={40} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">Suhbatlashilmagan o'quvchilar mavjud emas</p>
                  </div>
                )}
              </div>
            </div>

            {/* Interviewed */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck size={20} className="text-emerald-500" />
                <h2 className="text-lg font-semibold text-slate-800">Suhbatlashilgan</h2>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-medium">
                  {filteredStudents.filter(s => s.interviewed).length}
                </span>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredStudents.filter(s => s.interviewed).map((s) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-3.5 hover:shadow-md transition"
                    >
                      <div className="flex justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-800">{s.first_name} {s.last_name}</h3>
                          <p className="text-sm text-slate-600">{s.phone}</p>
                          <p className="text-sm text-slate-600">Fan: <span className="font-medium">{s.subject}</span></p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(s.created_at).toLocaleDateString('ru-RU')} {new Date(s.created_at).toLocaleTimeString('ru-RU').slice(0, 5)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => openApproveModal(s)}
                            className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-xs font-medium flex items-center gap-1"
                            title="O'quvchini ro'yxatga qo'shish"
                          ><Plus size={14} /> Ro'yxatga qo'shish</button>
                          <button
                            onClick={() => toggleInterviewStatus(s.id, s.interviewed)}
                            className="p-2 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition"
                            title="Suhbatlashilmagan"
                          ><XCircle size={16} /></button>
                          <button
                            onClick={() => showDeleteToast(s.id)}
                            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                            title="O'chirish"
                          ><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredStudents.filter(s => s.interviewed).length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <UserCheck size={40} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">Suhbatlashilgan o'quvchilar mavjud emas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      <AnimatePresence>
        {approveModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={closeApproveModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-t-2xl">
                <h2 className="text-xl font-bold">O'quvchini ro'yxatga qo'shish</h2>
                <button onClick={closeApproveModal} className="p-2 rounded-full hover:bg-white/15 transition">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitApprove} className="p-5 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Ism <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" required
                      className={inputCls}
                      value={approveForm.first_name}
                      onChange={(e) => setApproveForm({ ...approveForm, first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Familiya <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" required
                      className={inputCls}
                      value={approveForm.last_name}
                      onChange={(e) => setApproveForm({ ...approveForm, last_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Otasining ismi
                    </label>
                    <input
                      type="text"
                      className={inputCls}
                      value={approveForm.father_name}
                      onChange={(e) => setApproveForm({ ...approveForm, father_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Tug'ilgan sana
                    </label>
                    <input
                      type="date" max={new Date().toISOString().slice(0, 10)}
                      className={inputCls}
                      value={approveForm.birth_date}
                      onChange={(e) => setApproveForm({ ...approveForm, birth_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Telefon raqam <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel" required
                      className={inputCls}
                      value={approveForm.phone_number}
                      onChange={(e) => setApproveForm({ ...approveForm, phone_number: e.target.value })}
                      placeholder="+998901234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Ota-ona telefon raqami <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel" required
                      className={inputCls}
                      value={approveForm.parents_phone_number}
                      onChange={(e) => setApproveForm({ ...approveForm, parents_phone_number: e.target.value })}
                      placeholder="+998901234567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      O'qishni boshlash sanasi
                    </label>
                    <input
                      type="date"
                      className={inputCls}
                      value={approveForm.came_in_school}
                      onChange={(e) => setApproveForm({ ...approveForm, came_in_school: e.target.value })}
                    />
                  </div>
                </div>

                {/* Groups */}
                <div className="mt-5">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Guruhlar <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mb-2">
                    <div className="flex items-center border border-slate-200 rounded-xl bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
                      <Search size={16} className="text-slate-400 mr-2" />
                      <input
                        type="text"
                        className="w-full outline-none text-sm"
                        placeholder="Guruh nomidan qidiring..."
                        value={groupSearch}
                        onChange={(e) => setGroupSearch(e.target.value)}
                      />
                    </div>
                    {groupLoading ? (
                      <div className="mt-1 border border-slate-200 rounded-xl bg-white px-3 py-2 text-sm text-slate-400">Qidirilmoqda...</div>
                    ) : (() => {
                      const filtered = dropdownGroups.filter((g) => !approveForm.group_ids.includes(g.id));
                      return filtered.length > 0 ? (
                        <div className="mt-1 border border-slate-200 rounded-xl bg-white max-h-40 overflow-y-auto">
                          {filtered.map((g) => (
                            <div key={g.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setApproveForm((prev) => ({ ...prev, group_ids: [...prev.group_ids, g.id] }));
                                setGroups((prev) => prev.find((x) => x.id === g.id) ? prev : [...prev, g]);
                                setGroupSearch('');
                              }}
                              className="px-3 py-2 text-sm cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 transition flex items-center gap-2"
                            >
                              <BookOpen size={14} className="text-slate-400" /> {g.group_subject}
                            </div>
                          ))}
                        </div>
                      ) : groupSearch ? (
                        <div className="mt-1 border border-slate-200 rounded-xl bg-white px-3 py-2 text-sm text-slate-400">Guruh topilmadi</div>
                      ) : null;
                    })()}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {approveForm.group_ids.map((gid) => {
                      const g = groups.find((x) => x.id === gid);
                      if (!g) return null;
                      return (
                        <span key={gid}
                          className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {g.group_subject}
                          <button
                            type="button"
                            onClick={() => setApproveForm((prev) => ({ ...prev, group_ids: prev.group_ids.filter((id) => id !== gid) }))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      );
                    })}
                  </div>

                  {approveForm.group_ids.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Kamida bitta guruh tanlang</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
                  <button type="button" onClick={closeApproveModal}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-medium">
                    Bekor qilish
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition font-medium flex items-center gap-2 disabled:opacity-50">
                    {submitting ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : <Plus size={16} />}
                    Ro'yxatga qo'shish
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
