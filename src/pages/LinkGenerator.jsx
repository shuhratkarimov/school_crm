"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, Copy, Trash2, Pen, X, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import API_URL from "../conf/api";

export default function LinkGenerator() {
  const [links, setLinks] = useState([]);
  const [subject, setSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await fetch(`${API_URL}/get-registration-links`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      setLinks(data);
    } catch (error) {
      console.error("Error fetching links:", error);
      toast.error("Havolalarni olishda xato yuz berdi");
    }
  };

  const resetModal = () => {
    setSubject("");
    setEditingLink(null);
    setIsModalOpen(false);
  };

  const openCreateModal = () => {
    setEditingLink(null);
    setSubject("");
    setIsModalOpen(true);
  };

  const openEditModal = (link) => {
    setEditingLink(link);
    setSubject(link.subject || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!subject.trim()) {
      toast.error("Fan nomini kiriting");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = editingLink
        ? await fetch(`${API_URL}/update-registration-link/${editingLink.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ subject: subject.trim() }),
          })
        : await fetch(`${API_URL}/create-registration-link`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ subject: subject.trim() }),
          });

      if (!response.ok) {
        throw new Error(
          editingLink ? "Link yangilashda xato" : "Link yaratishda xato"
        );
      }

      await response.json();

      toast.success(
        editingLink
          ? "Havola muvaffaqiyatli yangilandi!"
          : "Havola muvaffaqiyatli yaratildi!"
      );

      resetModal();
      fetchLinks();
    } catch (error) {
      console.error(error);
      toast.error("Xato yuz berdi, qayta urinib ko‘ring");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (link) => {
    navigator.clipboard.writeText(link);
    toast.success("Havola nusxalandi!");
  };

  const deleteLink = async (id) => {
    try {
      const response = await fetch(`${API_URL}/delete-registration-link/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Havola o‘chirildi");
        fetchLinks();
      } else {
        throw new Error("Havola o‘chirishda xato");
      }
    } catch (error) {
      console.error(error);
      toast.error("Xato yuz berdi, qayta urinib ko‘ring");
    }
  };

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>Diqqat! Ushbu yangi havolaga tegishli barcha ma'lumotlar o'chiriladi!</p>
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
              deleteLink(id);
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

  const makePublicLink = (token) =>
    `https://register.intellectualprogress.uz/student-registration/${token}`;

  const makePublicLinkLocal = (token) =>
    `http://localhost:5173/student-registration/${token}`;

  return (
    <>
      <div className="min-h-screen bg-gray-50 px-2 sm:px-4">
        <div className="mx-auto">
          <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Link size={26} color="#104292" />
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800">
                Ro‘yxatdan o‘tish havolalari
              </h1>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 bg-[#104292] text-white px-3 sm:px-4 py-2 hover:bg-[#104292]/90 transition rounded-lg"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Yangi havola</span>
              <span className="sm:hidden">Qo'shish</span>
            </button>
          </div>

          <div className="bg-white shadow p-3 sm:p-6 rounded-lg">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Yaratilgan havolalar</h2>

            <div className="space-y-4">
              <AnimatePresence>
                {links.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Link size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>Hech qanday havola mavjud emas</p>
                  </div>
                ) : (
                  links.map((link) => (
                    <motion.div
                      key={link.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-gray-200 p-3 sm:p-4 hover:shadow-md transition rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800">{link.subject}</p>
                        <p
                          className="text-gray-600 cursor-pointer hover:underline break-all mt-1"
                          onClick={() =>
                            link.token &&
                            copyToClipboard(makePublicLinkLocal(link.token))
                          }
                        >
                          {link.token
                            ? makePublicLinkLocal(link.token)
                            : "Token yo‘q (migration qiling)"}
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() =>
                            link.token &&
                            copyToClipboard(makePublicLinkLocal(link.token))
                          }
                          className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                          title="Nusxalash"
                        >
                          <Copy size={18} />
                        </button>

                        <button
                          onClick={() => openEditModal(link)}
                          className="p-2 bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition"
                          title="Tahrirlash"
                        >
                          <Pen size={18} />
                        </button>

                        <button
                          onClick={() => showDeleteToast(link.id)}
                          className="p-2 bg-red-100 text-red-600 hover:bg-red-200 transition"
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b">
              <h3 className="text-lg font-semibold">
                {editingLink ? "Fan nomini yangilash" : "Yangi havola yaratish"}
              </h3>

              <button
                onClick={resetModal}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <X size={20} className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fan nomi
              </label>

              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Masalan: Matematika"
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#104292] focus:border-transparent outline-none"
              />

              <div className="flex justify-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={resetModal}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 transition"
                >
                  Bekor qilish
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#104292] text-white hover:bg-[#104292]/90 transition disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Yuklanmoqda..."
                    : editingLink
                    ? "Saqlash"
                    : "Yaratish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}