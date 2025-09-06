"use client"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Copy, CheckCircle, Trash2, Pen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API_URL from '../conf/api';

export default function LinkGenerator() {
  const [links, setLinks] = useState([]);
  const [subject, setSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await fetch(`${API_URL}/get-registration-links`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      setLinks(data);
    } catch (error) {
      console.error('Error fetching links:', error);
      toast.error('Linklarni olishda xato yuz berdi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error('Fan nomini kiriting');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/create-registration-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ subject }),
      });
      if (response.ok) {
        toast.success('Link muvaffaqiyatli yaratildi!');
        setSubject('');
        fetchLinks();
      } else {
        throw new Error('Link yaratishda xato');
      }
    } catch (error) {
      toast.error('Xato yuz berdi, qayta urinib ko‘ring');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateLink = async (id, newSubject) => {
    try {
      const response = await fetch(`${API_URL}/update-registration-link/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ subject: newSubject }),
      });
      if (response.ok) {
        toast.success('Link yangilandi');
        fetchLinks();
      } else {
        throw new Error('Link yangilashda xato');
      }
    } catch (error) {
      toast.error('Xato yuz berdi, qayta urinib ko‘ring');
    }
  };

  const copyToClipboard = (link) => {
    navigator.clipboard.writeText(link);
    toast.success('Link nusxalandi!');
  };

  const deleteLink = async (id) => {
    try {
      const response = await fetch(`${API_URL}/delete-registration-link/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        toast.success('Link o‘chirildi');
        fetchLinks();
      } else {
        throw new Error('Link o‘chirishda xato');
      }
    } catch (error) {
      toast.error('Xato yuz berdi, qayta urinib ko‘ring');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6">
        <div className="mb-5 flex items-center gap-2">
          <Link size={28} color="#104292" />
          <h1 className="text-2xl font-bold text-gray-800">Ro‘yxatdan o‘tish linklari</h1>
        </div>

        {/* Link yaratish formasi */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-gray-600 mb-2">Fan nomi</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Masalan: Matematika"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSubmitting ? 'Yuklanmoqda...' : 'Link yaratish'}
            </motion.button>
          </form>
        </div>

        {/* Yaratilgan linklar ro‘yxati */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Yaratilgan linklar</h2>
          <div className="space-y-4">
            <AnimatePresence>
              {links.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Link size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Hech qanday link mavjud emas</p>
                </div>
              ) : (
                links.map((link) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div>
                      <p className="font-semibold">{link.subject}</p>
                      <p
                        className="text-gray-600 cursor-pointer hover:underline"
                        onClick={() => copyToClipboard(`https://register.intellectualprogress.uz?subject=${encodeURIComponent(link.subject)}`)}
                      >
                        https://register.intellectualprogress.uz?subject={encodeURIComponent(link.subject)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(link.created_at).toLocaleDateString('ru-RU')} soat {new Date(link.created_at).toLocaleTimeString('ru-RU').slice(0, 5)}da yaratilgan
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(`https://register.intellectualprogress.uz?subject=${encodeURIComponent(link.subject)}`)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition"
                        title="Nusxalash"
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        onClick={() => {
                          const newSubject = prompt("Yangi fan nomini kiriting", link.subject);
                          if (newSubject && newSubject.trim() !== "") {
                            updateLink(link.id, newSubject);
                          }
                        }}
                        className="p-2 bg-yellow-100 text-yellow-600 rounded-full hover:bg-yellow-200 transition"
                        title="Tahrirlash"
                      >
                        <Pen size={18} />
                      </button>
                      <button
                        onClick={() => deleteLink(link.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
                        title="O‘chirish"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}