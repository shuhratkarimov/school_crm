"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MessageSquareWarning,
  Bug,
  X,
  Send,
  History,
  Clock3,
  Eye,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import API_URL from "../conf/api";

export default function FeedbackModal({ open, onClose, senderType = "user" }) {
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const [formData, setFormData] = useState({
    type: "feedback",
    subject: "",
    message: "",
  });

  const resetForm = () => {
    setFormData({
      type: "feedback",
      subject: "",
      message: "",
    });
  };

  const handleClose = () => {
    resetForm();
    setActiveTab("create");
    setStatusFilter("all");
    onClose?.();
  };

  const fetchMyFeedbacks = async () => {
    try {
      setHistoryLoading(true);

      const endpoint =
        senderType === "teacher"
          ? `${API_URL}/feedbacks/teacher/my`
          : `${API_URL}/feedbacks/admin/my`;

      const response = await fetch(endpoint, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Feedbacklar yuklanmadi");
      }

      setMyFeedbacks(data.feedbacks || []);
    } catch (err) {
      toast.error(err?.message || "Feedbacklar yuklanmadi");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMyFeedbacks();
    }
  }, [open, senderType]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim()) {
      toast.error("Mavzuni kiriting");
      return;
    }

    if (!formData.message.trim()) {
      toast.error("Xabarni kiriting");
      return;
    }

    try {
      setLoading(true);

      const endpoint =
        senderType === "teacher"
          ? `${API_URL}/feedbacks/teacher`
          : `${API_URL}/feedbacks/admin`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type: formData.type,
          subject: formData.subject,
          message: formData.message,
          sender_type: senderType,
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Feedback yuborishda xatolik yuz berdi"
        );
      }

      toast.success("Xabaringiz muvaffaqiyatli yuborildi");
      resetForm();

      await fetchMyFeedbacks();
      setActiveTab("history");
    } catch (err) {
      toast.error(err?.message || "Feedback yuborishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedbacks = useMemo(() => {
    if (statusFilter === "all") return myFeedbacks;
    return myFeedbacks.filter((item) => item.status === statusFilter);
  }, [myFeedbacks, statusFilter]);

  const getStatusBadge = (status) => {
    if (status === "new") {
      return {
        label: "Yangi",
        className: "bg-blue-100 text-blue-700",
        icon: <Clock3 size={14} />,
      };
    }

    if (status === "reviewed") {
      return {
        label: "Ko‘rilgan",
        className: "bg-amber-100 text-amber-700",
        icon: <Eye size={14} />,
      };
    }

    return {
      label: "Hal qilingan",
      className: "bg-green-100 text-green-700",
      icon: <CheckCircle2 size={14} />,
    };
  };

  const getTypeBadge = (type) => {
    if (type === "bug") {
      return {
        label: "Xatolik",
        className: "bg-red-100 text-red-700",
        icon: <Bug size={14} />,
      };
    }

    return {
      label: "Taklif",
      className: "bg-indigo-100 text-indigo-700",
      icon: <MessageSquareWarning size={14} />,
    };
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600">
          <div>
            <h2 className="text-xl font-bold text-white">
              Platforma yuzasidan o'z fikringizni bildiring
            </h2>
            <p className="text-sm text-white mt-1">
              Taklif yoki xatolik haqida yozib qoldiring va biz buni albatta ko'rib chiqamiz
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full text-white bg-white/20 hover:bg-white/40 transition"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-2xl p-1">
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${activeTab === "create"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
                }`}
            >
              Yangi murojaat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition flex items-center justify-center gap-2 ${activeTab === "history"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
                }`}
            >
              <History size={16} />
              Mening murojaatlarim
            </button>
          </div>
        </div>

        {activeTab === "create" ? (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turi
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, type: "feedback" }))
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition ${formData.type === "feedback"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  <MessageSquareWarning size={18} />
                  Taklif
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: "bug" }))}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition ${formData.type === "bug"
                    ? "border-red-600 bg-red-50 text-red-700"
                    : "border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  <Bug size={18} />
                  Xatolik
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mavzu
              </label>
              <input
                type="text"
                disabled={loading}
                value={formData.subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
                placeholder="Masalan: Dashboardda grafik noto‘g‘ri chiqyapti"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xabar
              </label>
              <textarea
                rows={5}
                disabled={loading}
                value={formData.message}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="Muammoni yoki taklifingizni batafsil yozing..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none resize-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-xl border border-gray-300 px-4 py-2.5 hover:bg-gray-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Bekor qilish
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-blue-600 text-white px-5 py-2.5 hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Yuborilmoqda...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Yuborish
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-2 rounded-xl text-sm transition ${statusFilter === "all"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700"
                    }`}
                >
                  Barchasi
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("new")}
                  className={`px-3 py-2 rounded-xl text-sm transition ${statusFilter === "new"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-700"
                    }`}
                >
                  Yangi
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("reviewed")}
                  className={`px-3 py-2 rounded-xl text-sm transition ${statusFilter === "reviewed"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-50 text-amber-700"
                    }`}
                >
                  Ko‘rilgan
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("resolved")}
                  className={`px-3 py-2 rounded-xl text-sm transition ${statusFilter === "resolved"
                    ? "bg-green-600 text-white"
                    : "bg-green-50 text-green-700"
                    }`}
                >
                  Hal qilingan
                </button>
              </div>

              <button
                type="button"
                onClick={fetchMyFeedbacks}
                disabled={historyLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 hover:bg-gray-50 transition disabled:opacity-60"
              >
                <RefreshCw size={16} className={historyLoading ? "animate-spin" : ""} />
                Yangilash
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto pr-1 space-y-3">
              {historyLoading ? (
                <div className="py-10 text-center text-gray-500">
                  Yuklanmoqda...
                </div>
              ) : filteredFeedbacks.length === 0 ? (
                <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-2xl">
                  Hozircha murojaatlar topilmadi
                </div>
              ) : (
                filteredFeedbacks.map((item) => {
                  const statusBadge = getStatusBadge(item.status);
                  const typeBadge = getTypeBadge(item.type);

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${typeBadge.className}`}
                            >
                              {typeBadge.icon}
                              {typeBadge.label}
                            </span>

                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${statusBadge.className}`}
                            >
                              {statusBadge.icon}
                              {statusBadge.label}
                            </span>
                          </div>

                          <h3 className="text-sm sm:text-base font-semibold text-gray-800">
                            {item.subject}
                          </h3>

                          <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap break-words">
                            {item.message}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          Yuborilgan:
                          {" "}
                          {new Date(item.created_at).toLocaleString("en-US")}
                        </span>
                        {item.updated_at && item.updated_at !== item.created_at && (
                          <span>
                            Yangilangan:
                            {" "}
                            {new Date(item.updated_at).toLocaleString("en-US")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}