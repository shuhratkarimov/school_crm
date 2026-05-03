"use client";

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Eye, ThumbsUp, MessageSquare, Send, Calendar,
  BookOpen, Lightbulb, Search, X, Play, Heart, Quote
} from "lucide-react";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import API_URL, { resolveImgUrl } from "../conf/api";

function youtubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  return m ? m[1] : null;
}

export default function TeacherArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const articleId = params.get("article");
    if (articleId && !active) {
      openArticle({ id: articleId });
    }
  }, [location.search]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/teacher/articles`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : data.articles || []);
    } catch {
      toast.error("Maqolalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const openArticle = async (a) => {
    try {
      const res = await fetch(`${API_URL}/teacher/articles/${a.id}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setActive(data.article || data);
      setArticles((prev) =>
        prev.map((x) => (x.id === a.id ? { ...x, views: (x.views || 0) + 1 } : x))
      );
    } catch {
      toast.error("Maqolani ochishda xatolik");
    }
  };

  const filtered = articles.filter((a) =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.summary?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="text-indigo-600" /> Foydali maqolalar
            </h1>
            <p className="text-sm text-slate-500 mt-1">Foydali maqolalar, tajriba va ko'rsatmalar (Albatta, bu sahifani ko'rib turgan ustozlar juda tajribali, lekin yangi bilim o'rganish zarar qilmaydi ☺️)</p>
          </div>
          <button
            onClick={() => setRequestModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 text-sm font-medium"
          >
            <Lightbulb size={16} /> <span className="hidden sm:inline">Maqola so'rash</span>
          </button>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Maqolalarni qidirish..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-gray-800"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <BookOpen size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">Hali maqolalar yo'q</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((a) => (
              <motion.button
                key={a.id}
                whileHover={{ y: -2 }}
                onClick={() => openArticle(a)}
                className="text-left bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition group"
              >
                {a.cover_image ? (
                  <div className="aspect-video bg-slate-100 overflow-hidden">
                    <img
                      src={resolveImgUrl(a.cover_image)}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <BookOpen className="text-indigo-400" size={48} />
                  </div>
                )}
                <div className="p-4">
                  {a.category && (
                    <span className="inline-block text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full mb-2">
                      #{a.category}
                    </span>
                  )}
                  <h3 className="font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-700">
                    {a.title}
                  </h3>
                  {a.summary && (
                    <p className="text-sm text-slate-500 line-clamp-2 mt-1">{a.summary}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Eye size={12} /> {a.views || 0}</span>
                    <span className="flex items-center gap-1"><ThumbsUp size={12} /> {a.likes_count || 0}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={12} /> {a.comments_count || 0}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {active && (
          <ArticleDetail
            article={active}
            onClose={() => setActive(null)}
            onUpdate={(u) => {
              setActive(u);
              setArticles((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...u } : x)));
            }}
            onRequestArticle={() => setRequestModalOpen(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {requestModalOpen && (
          <RequestModal onClose={() => setRequestModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ArticleDetail({ article, onClose, onUpdate, onRequestArticle }) {
  const [liked, setLiked] = useState(article.liked_by_me || false);
  const [likesCount, setLikesCount] = useState(article.likes_count || 0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [article.id]);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const res = await fetch(`${API_URL}/teacher/articles/${article.id}/comments`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments(Array.isArray(data) ? data : data.comments || []);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => c + (newLiked ? 1 : -1));
    try {
      const res = await fetch(`${API_URL}/teacher/articles/${article.id}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json().catch(() => ({}));
      if (typeof data.likes_count === "number") setLikesCount(data.likes_count);
    } catch {
      setLiked(!newLiked);
      setLikesCount((c) => c + (newLiked ? -1 : 1));
      toast.error("Xatolik");
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/teacher/articles/${article.id}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json().catch(() => ({}));
      setComments((c) => [data.comment || { text: commentText, created_at: new Date().toISOString() }, ...c]);
      setCommentText("");
      toast.success("Fikringiz qo'shildi");
    } catch {
      toast.error("Yuborishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const ytId = youtubeId(article.video_url);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="min-h-screen sm:py-8 flex items-start justify-center"
      >
        <div className="w-full max-w-3xl bg-white sm:rounded-2xl shadow-2xl overflow-hidden">
          <button
            onClick={onClose}
            className="sticky top-2 left-2 z-10 ml-2 mt-2 p-2 bg-white/90 backdrop-blur rounded-full shadow border border-slate-200 hover:bg-white text-slate-900" 
          >
            <ArrowLeft size={20} />
          </button>

          {article.cover_image && (
            <div className="relative aspect-video bg-slate-100 -mt-12">
              <img src={resolveImgUrl(article.cover_image)} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-5 sm:p-8">
            {article.category && (
              <span className="inline-block text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full mb-3">
                #{article.category}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">{article.title}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
              <span className="flex items-center gap-1"><Eye size={14} /> {article.views || 0}</span>
              <span className="flex items-center gap-1"><ThumbsUp size={14} /> {likesCount}</span>
              <span className="flex items-center gap-1"><MessageSquare size={14} /> {comments.length}</span>
              {article.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(article.created_at).toLocaleDateString("ru-RU")}
                </span>
              )}
            </div>

            {ytId && (
              <div className="aspect-video rounded-xl overflow-hidden mb-6 bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title="Video"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            )}

            {!ytId && article.video_url && (
              <a
                href={article.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-slate-100 rounded-xl mb-6 hover:bg-slate-200 text-sm"
              >
                <Play size={16} /> Videoni ochish
              </a>
            )}

            <div className="article-body text-slate-800 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.content || ""}
              </ReactMarkdown>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => onRequestArticle?.()}
                className="group inline-flex items-start gap-2 text-left text-sm text-indigo-700 hover:text-indigo-900"
              >
                <Lightbulb
                  size={16}
                  className="text-amber-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform"
                />
                <span className="leading-relaxed">
                  Boshqalar bilan tajriba ulashish, yo'l-yo'riq ko'rsatish uchun siz ham maqola yozib, yosh ustozlar yanada kuchli bo'lishiga o'z hissangizni qo'shing
                  <span className="ml-1 inline-block underline decoration-dotted underline-offset-2 group-hover:translate-x-0.5 transition-transform">→</span>
                </span>
              </button>

              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={toggleLike}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition ${
                    liked
                      ? "bg-rose-100 text-rose-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Heart size={18} fill={liked ? "currentColor" : "none"} />
                  {liked ? "Foydali deb topildi" : "Maqola foydali bo'ldimi?"}
                  <span className="font-bold">{likesCount}</span>
                </button>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare size={18} /> Fikrlar ({comments.length})
              </h3>

              <form onSubmit={submitComment} className="flex gap-2 mb-5">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Fikringizni yozing..."
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-700"
                />
                <button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  className="px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </form>

              {loadingComments ? (
                <p className="text-slate-400 text-sm">Fikrlar yuklanmoqda...</p>
              ) : comments.length === 0 ? (
                <p className="text-slate-400 text-sm">Hali fikrlar yo'q. Birinchi bo'lib yozing!</p>
              ) : (
                <div className="space-y-4">
                {comments.map((c, i) => (
                  <motion.figure
                    key={c.id || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i, 5) * 0.04 }}
                    className="relative pl-6 sm:pl-6 pr-4 py-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 border border-emerald-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <span className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-gradient-to-b from-emerald-400 to-emerald-600" />
                    <Quote
                      size={28}
                      className="absolute -top-2 left-3 text-emerald-200 fill-emerald-100"
                      strokeWidth={1.5}
                    />

                    <div className="flex items-start gap-3 mb-2 pl-1">
                      {c.author_img ? (
                        <img
                          src={resolveImgUrl(c.author_img)}
                          alt={c.author_name || "Ustoz"}
                          className="w-10 h-10 rounded-full object-cover bg-white border-2 border-emerald-300 shadow"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow border-2 border-white">
                          {(c.author_name || "U")[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800 truncate">
                            {c.author_name || c.teacher_name || "Ustoz"}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-2xl tracking-wider font-semibold">
                            Ustoz
                          </span>
                        </div>
                        {c.created_at && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar size={10} />
                            {new Date(c.created_at).toLocaleDateString("ru-RU")}
                          </span>
                        )}
                      </div>
                    </div>

                    <blockquote className="pl-1 text-[15px] text-slate-700 leading-relaxed">
                      <span className="text-emerald-500 font-serif text-lg mr-0.5">“</span>
                      {c.text}
                      <span className="text-emerald-500 font-serif text-lg ml-0.5">”</span>
                    </blockquote>
                  </motion.figure>
                ))}
              </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RequestModal({ onClose }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trimmed = text.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < 10;
  const valid = trimmed.length >= 10;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) {
      toast.error("So'rov kamida 10 ta belgidan iborat bo'lsin");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/teacher/article-requests`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Yuborishda xatolik");
      toast.success("So'rovingiz yuborildi");
      onClose();
    } catch (err) {
      toast.error(err.message || "Yuborishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between  text-gray-800">
          <h2 className="font-bold flex items-center gap-2">
            <Lightbulb className="text-amber-500" /> Maqola so'rash
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Qaysi mavzuda maqola yoki ko'rsatma kerakligini yozing — chop qilamiz.
          </p>
          <textarea
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            minLength={10}
            placeholder="Masalan: bolalarga ingliz tilini o'rgatish bo'yicha amaliy mashqlar..."
            className={`w-full px-4 py-3 border rounded-xl bg-white text-gray-800 ${
              tooShort ? "border-rose-300 focus:border-rose-400" : "border-slate-200"
            }`}
          />
          <div className={`flex items-center justify-between text-xs ${tooShort ? "text-rose-600" : "text-slate-500"}`}>
            <span>
              {tooShort
                ? `Yana ${10 - trimmed.length} ta belgi yozing`
                : valid
                ? "Tayyor"
                : "Kamida 10 ta belgi"}
            </span>
            <span className="tabular-nums">{trimmed.length}/10+</span>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-gray-800 hover:bg-slate-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={submitting || !valid}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50"
            >
              <Send size={16} /> Yuborish
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
