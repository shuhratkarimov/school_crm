"use client"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Calendar, UserCheck, UserX, Trash2, CheckCircle, XCircle, UserPlus } from 'lucide-react';
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

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, dateFilter, statusFilter]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/get-new-students`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('O‘quvchilarni olishda xato yuz berdi');
    }
  };

  const filterStudents = () => {
    let result = Array.isArray(students) ? [...students] : [];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(student =>
        student.first_name.toLowerCase().includes(query) ||
        student.last_name.toLowerCase().includes(query) ||
        student.phone.includes(query) ||
        student.subject.toLowerCase().includes(query)
      );
    }
    if (dateFilter.start && dateFilter.end) {
      result = result.filter(student => {
        const studentDate = new Date(student.created_at);
        return studentDate >= dateFilter.start && studentDate <= dateFilter.end;
      });
    }
    if (statusFilter !== 'all') {
      const isInterviewed = statusFilter === 'interviewed';
      result = result.filter(student => student.interviewed === isInterviewed);
    }
    setFilteredStudents(result);
  };

  const toggleInterviewStatus = async (id, currentStatus) => {
    try {
      const response = await fetch(`${API_URL}/update-new-student/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interviewed: !currentStatus }),
      });
      if (response.ok) {
        fetchStudents();
        toast.success('Status yangilandi');
      } else {
        throw new Error('Status yangilashda xato');
      }
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Xato yuz berdi, qayta urinib ko‘ring');
    }
  };

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>
          Diqqat! Ushbu yangi o'quvchiga tegishli barcha ma'lumotlar o'chiriladi!
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
              deleteStudent(id);
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

  const deleteStudent = async (id) => {
    try {
      const response = await fetch(`${API_URL}/delete-new-student/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        fetchStudents();
        toast.success('O‘quvchi o‘chirildi');
      } else {
        throw new Error('O‘quvchi o‘chirishda xato');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Xato yuz berdi, qayta urinib ko‘ring');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-5 flex items-center gap-2">
          <UserPlus size={28} color="#104292" />
          <h1 className="text-2xl font-bold text-gray-800">Yangi o'quvchilar</h1>
        </div>
        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Ism, familiya yoki fan bo‘yicha qidirish..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={20} className="text-blue-600" />
              </div>
              <select
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Barchasi</option>
                <option value="interviewed">Suhbatlashilgan</option>
                <option value="not-interviewed">Suhbatlashilmagan</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <DatePicker
                  selected={dateFilter.start}
                  onChange={(date) => setDateFilter({ ...dateFilter, start: date })}
                  selectsStart
                  startDate={dateFilter.start}
                  format="dd.MM.yyyy"
                  endDate={dateFilter.end}
                  placeholderText="Dan"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  popperClassName="z-50"
                  popperPlacement="bottom-start"
                />
              </div>
              <div className="relative">
                <DatePicker
                  selected={dateFilter.end}
                  onChange={(date) => setDateFilter({ ...dateFilter, end: date })}
                  selectsEnd
                  startDate={dateFilter.start}
                  format="dd.MM.yyyy"
                  endDate={dateFilter.end}
                  minDate={dateFilter.start}
                  placeholderText="Gacha"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  popperClassName="z-50"
                  popperPlacement="bottom-start"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Jami yangi o'quvchilar</p>
                <p className="text-3xl font-bold text-gray-800">{students.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <UserCheck size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Suhbatlashilgan</p>
                <p className="text-3xl font-bold text-green-600">
                  {filteredStudents.filter(s => s.interviewed).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Suhbatlashilmagan</p>
                <p className="text-3xl font-bold text-orange-600">
                  {filteredStudents.filter(s => !s.interviewed).length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <UserX size={24} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>
        {/* Students List */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-x-0 md:divide-x divide-y md:divide-y-0">
            {/* Not Interviewed */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserX size={20} className="text-orange-500" />
                <h2 className="text-xl font-semibold">Suhbatlashilmagan o'quvchilar</h2>
                <span className="bg-orange-100 text-orange-800 text-sm px-2 py-1 rounded-full">
                  {filteredStudents.filter(s => !s.interviewed).length}
                </span>
              </div>
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredStudents
                    .filter(student => !student.interviewed)
                    .map((student) => (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{student.first_name} {student.last_name}</h3>
                            <p className="text-gray-600">{student.phone}</p>
                            <p className="text-gray-600">Fan: {student.subject}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(student.created_at).toLocaleDateString('ru-RU')} soat {new Date(student.created_at).toLocaleTimeString('ru-RU').slice(0, 5)}da yozilgan
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleInterviewStatus(student.id, student.interviewed)}
                              className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition"
                              title="Suhbatlashildi"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => showDeleteToast(student.id)}
                              className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
                              title="O‘chirish"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  }
                </AnimatePresence>
                {filteredStudents.filter(student => !student.interviewed).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <UserX size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>Suhbatlashilmagan o'quvchilar mavjud emas</p>
                  </div>
                )}
              </div>
            </div>
            {/* Interviewed */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck size={20} className="text-green-500" />
                <h2 className="text-xl font-semibold">Suhbatlashilgan O'quvchilar</h2>
                <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
                  {filteredStudents.filter(s => s.interviewed).length}
                </span>
              </div>
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredStudents
                    .filter(student => student.interviewed)
                    .map((student) => (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{student.first_name} {student.last_name}</h3>
                            <p className="text-gray-600">{student.phone}</p>
                            <p className="text-gray-600">Fan: {student.subject}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(student.created_at).toLocaleDateString('ru-RU')} soat {new Date(student.created_at).toLocaleTimeString('ru-RU').slice(0, 5)}da yozilgan
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleInterviewStatus(student.id, student.interviewed)}
                              className="p-2 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition"
                              title="Suhbatlashilmagan"
                            >
                              <XCircle size={18} />
                            </button>
                            <button
                              onClick={() => showDeleteToast(student.id)}
                              className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
                              title="O‘chirish"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  }
                </AnimatePresence>
                {filteredStudents.filter(student => student.interviewed).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <UserCheck size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>Suhbatlashilgan o'quvchilar mavjud emas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}