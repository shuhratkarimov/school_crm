"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  Phone,
  Send,
  CheckCircle,
  Calendar,
  Users,
  GraduationCap,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { toast } from "react-hot-toast"
import { useParams } from "react-router-dom"
import API_URL from "../conf/api"

export default function StudentRegistration() {
  const { token } = useParams()
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    father_name: "",
    birth_date: "",
    phone: "",
    parents_phone_number: "",
    came_in_school: "",
    subject: "",
  })
  const [subject, setSubject] = useState("")
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [loadingSubject, setLoadingSubject] = useState(true)
  const [step, setStep] = useState(1)

  useEffect(() => {
    const loadSubject = async () => {
      if (!token) {
        setErrors((p) => ({ ...p, subject: "Token mavjud emas" }))
        setLoadingSubject(false)
        return
      }
      try {
        const res = await fetch(`${API_URL}/get-registration-link-by-token/${token}`)
        const data = await res.json()
        if (!res.ok) {
          setErrors((p) => ({ ...p, subject: data.message || "Link topilmadi" }))
          return
        }
        setSubject(data.subject)
        setFormData((prev) => ({ ...prev, subject: data.subject }))
      } catch {
        setErrors((p) => ({ ...p, subject: "Server bilan ulanishda xatolik" }))
      } finally {
        setLoadingSubject(false)
      }
    }
    loadSubject()
  }, [token])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === "phone" || name === "parents_phone_number") {
      const cleaned = value.replace(/\D/g, "")
      if (cleaned.length <= 9) {
        setFormData((prev) => ({ ...prev, [name]: cleaned }))
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateStep1 = () => {
    const newErrors = {}
    if (!formData.first_name.trim()) newErrors.first_name = "Ism kiriting"
    if (!formData.last_name.trim()) newErrors.last_name = "Familiya kiriting"
    if (!formData.father_name.trim()) newErrors.father_name = "Otasining ismini kiriting"
    if (!formData.birth_date) newErrors.birth_date = "Tug'ilgan sanani tanlang"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}
    if (!formData.phone.trim()) newErrors.phone = "Telefon raqamingizni kiriting"
    else if (formData.phone.length !== 9) newErrors.phone = "9 ta raqam kiriting"

    if (!formData.parents_phone_number.trim())
      newErrors.parents_phone_number = "Ota-onangiz telefon raqamini kiriting"
    else if (formData.parents_phone_number.length !== 9)
      newErrors.parents_phone_number = "9 ta raqam kiriting"

    if (!formData.came_in_school) newErrors.came_in_school = "Boshlash sanasini tanlang"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleBack = () => setStep(1)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep2()) return
    setIsSubmitting(true)
    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        father_name: formData.father_name.trim(),
        birth_date: formData.birth_date,
        phone: "+998" + formData.phone,
        parents_phone_number: "+998" + formData.parents_phone_number,
        came_in_school: formData.came_in_school,
      }
      const res = await fetch(`${API_URL}/register-new-student/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setIsSuccess(true)
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.message || "Yuborishda xatolik")
      }
    } catch {
      toast.error("Server bilan ulanishda xatolik")
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
  const labelClass = "block mb-1.5 text-sm font-medium text-slate-700"

  const tickerWords = [
    "O'QUVCHILAR NATIJALARI",
    "YUQORI NATIJALAR",
    "MILLIY SERTIFIKATLAR",
    "YUQORI IELTS NATIJALARI",
    "TOP UNIVERSITETLAR",
    "OTMGA KIRISH",
    "GRANT YUTUQLARI",
    "SIFATLI DARS",
    "ZAMONAVIY METODIKALAR",
    "TAJRIBALI USTOZLAR",
    "INDIVIDUAL YONDASHUV",
    "TEZKOR NATIJA",
    "INTENSIV KURSLAR",
    "AMALIY MASHG‘ULOT",
    "KAFOLATLANGAN NATIJA",
    "MENTORLIK TIZIMI",
    "REAL NATIJALAR",
    "BITIRUVCHILAR MUVAFFAQIYATI",
    "YUQORI BALL",
    "PROFESSIONAL TA'LIM",
  ]

  const gradientCycle = [
    "linear-gradient(135deg, #a7f3d0 0%, #c4b5fd 50%, #fbcfe8 100%)",
    "linear-gradient(135deg, #fcd34d 0%, #f9a8d4 50%, #93c5fd 100%)",
    "linear-gradient(135deg, #6ee7b7 0%, #67e8f9 50%, #c084fc 100%)",
    "linear-gradient(135deg, #fda4af 0%, #fcd34d 50%, #86efac 100%)",
    "linear-gradient(135deg, #a5b4fc 0%, #f0abfc 50%, #fde68a 100%)",
    "linear-gradient(135deg, #5eead4 0%, #818cf8 50%, #f472b6 100%)",
    "linear-gradient(135deg, #fb923c 0%, #f472b6 50%, #a78bfa 100%)",
    "linear-gradient(135deg, #a7f3d0 0%, #c4b5fd 50%, #fbcfe8 100%)",
  ]

  const tickerImages = [
    { src: "/lenta/ielts.png", alt: "ielts" },
    { src: "/lenta/psch.png", alt: "psch" },
    { src: "/lenta/cefr.png", alt: "cefr" },
    { src: "/lenta/dtm.png", alt: "dtm" },
    { src: "/lenta/sat.png", alt: "sat" },
    { src: "/lenta/brtc.png", alt: "brtc" },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex items-stretch">
      {/* Left side: rotating logo */}
      <motion.div
        className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center"
        animate={{ background: gradientCycle }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 -left-20 w-96 h-96 bg-white rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-20 -right-20 w-96 h-96 bg-white rounded-full blur-3xl"
          />
        </div>

        {/* Top image marquee */}
        <div className="marquee absolute top-8 left-0 right-0 z-20">
          <div className="marquee-track marquee-track-fast">
            {[...tickerImages, ...tickerImages, ...tickerImages].map((img, i) => (
              <div
                key={`top-img-${i}`}
                className="flex-shrink-0 h-24 px-4 py-2 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/80 shadow-md flex items-center justify-center hover:bg-white hover:scale-105 transition-all duration-300"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="h-full w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rotating logo */}
        <div
          className="relative z-10"
          style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
        >
          <motion.img
            src="/logo.png"
            alt="Progress"
            animate={{ rotateY: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            style={{
              transformStyle: "preserve-3d",
              backfaceVisibility: "visible",
              filter: "drop-shadow(0 25px 35px rgba(0,0,0,0.45)) drop-shadow(0 0 20px rgba(0,0,0,0.2))",
            }}
            className="w-96 h-96 object-contain"
          />
        </div>

        {/* Bottom marquee — reverse direction */}
        <div className="marquee absolute bottom-8 left-0 right-0 z-20">
          <div className="marquee-track marquee-track-reverse text-sm font-bold text-slate-800/80">
            {[...tickerWords, ...tickerWords].map((w, i) => (
              <span
                key={`bot-${i}`}
                className="inline-flex items-center gap-3 px-5 py-2 bg-white/40 backdrop-blur-sm rounded-full border border-white/60 shadow-sm hover:bg-white/70 hover:scale-105 transition-all duration-300 cursor-default"
              >
                <CheckCircle size={14} className="text-purple-700" />
                {w}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right side: form */}
      <div className="w-full lg:w-1/2 relative flex flex-col lg:block">
        {/* Mobile-only animated gradient background */}
        <motion.div
          className="lg:hidden absolute inset-0 z-0"
          animate={{ background: gradientCycle }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        />
        {/* Mobile-only blur orbs */}
        <div className="lg:hidden absolute inset-0 opacity-25 z-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-10 -left-20 w-72 h-72 bg-white rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-10 -right-20 w-72 h-72 bg-white rounded-full blur-3xl"
          />
        </div>

        {/* Mobile-only top image marquee */}
        <div className="lg:hidden relative z-10 marquee py-3 mt-2">
          <div className="marquee-track marquee-track-fast">
            {[...tickerImages, ...tickerImages, ...tickerImages].map((img, i) => (
              <div
                key={`mtop-img-${i}`}
                className="flex-shrink-0 h-16 px-3 py-1.5 rounded-xl bg-white/70 backdrop-blur-sm border border-white/80 shadow-sm flex items-center justify-center"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="h-full w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10 lg:h-full">
        <div className="w-full max-w-lg">
          {/* Mobile-only rotating logo — fixed slot so rotation/scale doesn't shift layout */}
          <div className="lg:hidden flex justify-center mb-4">
            <div
              className="relative w-44 h-44"
              style={{ perspective: "600px", transformStyle: "preserve-3d" }}
            >
              <motion.img
                src="/logo.png"
                alt="Progress"
                animate={{ rotateY: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                style={{
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "visible",
                  filter: "drop-shadow(0 12px 18px rgba(0,0,0,0.35))",
                }}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl p-10 text-center border border-slate-100"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center"
                >
                  <CheckCircle size={48} className="text-emerald-600" />
                </motion.div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  Muvaffaqiyatli yuborildi!
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  Sizning {subject} yo‘nalishi bo‘yicha arizangiz qabul qilindi. Tez orada
                  siz bilan ko‘rsatgan telefon raqami orqali bog‘lanamiz.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-slate-100"
              >
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <GraduationCap size={20} className="text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-emerald-700">Ro‘yxatdan o‘tish</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {loadingSubject
                      ? "Yuklanmoqda..."
                      : subject
                      ? `${subject} kursiga yozilish`
                      : "Yangi o‘quvchi"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Quyidagi ma'lumotlarni to‘ldiring — biz tez orada siz bilan bog‘lanamiz
                  </p>
                  {errors.subject && (
                    <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                      {errors.subject}
                    </div>
                  )}
                </div>

                {/* Steps indicator */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex-1 flex items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        step >= 1 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      1
                    </div>
                    <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? "bg-emerald-600" : "bg-slate-200"}`} />
                  </div>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                      step >= 2 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    2
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {step === 1 ? (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}>Ism *</label>
                            <div className="relative">
                              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="Ali"
                                className={`${inputClass} pl-10`}
                              />
                            </div>
                            {errors.first_name && (
                              <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>
                            )}
                          </div>
                          <div>
                            <label className={labelClass}>Familiya *</label>
                            <div className="relative">
                              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Valiyev"
                                className={`${inputClass} pl-10`}
                              />
                            </div>
                            {errors.last_name && (
                              <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className={labelClass}>Otasining ismi *</label>
                          <div className="relative">
                            <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              name="father_name"
                              value={formData.father_name}
                              onChange={handleChange}
                              placeholder="Akbar o‘g‘li"
                              className={`${inputClass} pl-10`}
                            />
                          </div>
                          {errors.father_name && (
                            <p className="mt-1 text-xs text-red-600">{errors.father_name}</p>
                          )}
                        </div>

                        <div>
                          <label className={labelClass}>Tug‘ilgan sana *</label>
                          <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                              type="date"
                              name="birth_date"
                              value={formData.birth_date}
                              onChange={handleChange}
                              max={new Date().toISOString().slice(0, 10)}
                              className={`${inputClass} pl-10`}
                            />
                          </div>
                          {errors.birth_date && (
                            <p className="mt-1 text-xs text-red-600">{errors.birth_date}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleNext}
                          disabled={loadingSubject || !!errors.subject}
                          className="w-full mt-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Davom etish <ArrowRight size={18} />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        <div>
                          <label className={labelClass}>Telefon raqamingiz *</label>
                          <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100 transition-all">
                            <div className="flex items-center gap-1.5 px-3 py-3 bg-slate-50 border-r border-slate-200 text-slate-600 text-sm">
                              <Phone size={16} className="text-slate-400" />
                              +998
                            </div>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              placeholder="90 123 45 67"
                              className="w-full px-3 py-3 outline-none text-slate-900 bg-white placeholder-slate-400"
                            />
                          </div>
                          {errors.phone && (
                            <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                          )}
                        </div>

                        <div>
                          <label className={labelClass}>Ota-ona telefon raqami *</label>
                          <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100 bg-white transition-all">
                            <div className="flex items-center gap-1.5 px-3 py-3 border-r border-slate-200 text-slate-600 text-sm">
                              <Phone size={16} className="text-slate-400" />
                              +998
                            </div>
                            <input
                              type="tel"
                              name="parents_phone_number"
                              value={formData.parents_phone_number}
                              onChange={handleChange}
                              placeholder="90 123 45 67"
                              className="w-full px-3 py-3 outline-none text-slate-900 bg-white placeholder-slate-400"
                            />
                          </div>
                          {errors.parents_phone_number && (
                            <p className="mt-1 text-xs text-red-600">{errors.parents_phone_number}</p>
                          )}
                        </div>

                        <div>
                          <label className={labelClass}>Qaysi sanadan boshlamoqchisiz? *</label>
                          <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                              type="date"
                              name="came_in_school"
                              value={formData.came_in_school}
                              onChange={handleChange}
                              min={new Date().toISOString().slice(0, 10)}
                              className={`${inputClass} pl-10`}
                            />
                          </div>
                          {errors.came_in_school && (
                            <p className="mt-1 text-xs text-red-600">{errors.came_in_school}</p>
                          )}
                        </div>

                        <div className="flex gap-3 mt-2">
                          <button
                            type="button"
                            onClick={handleBack}
                            className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                          >
                            Orqaga
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? (
                              <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Yuborilmoqda...
                              </>
                            ) : (
                              <>
                                <Send size={16} />
                                Arizani yuborish
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
                  Yuborgan ma'lumotlaringiz faqat bog‘lanish maqsadida ishlatiladi
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>

        {/* Mobile-only bottom text marquee */}
        <div className="lg:hidden relative z-10 marquee py-3 mb-2">
          <div className="marquee-track marquee-track-reverse text-xs font-semibold text-slate-800/80">
            {[...tickerWords, ...tickerWords].map((w, i) => (
              <span
                key={`mbot-${i}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/40 backdrop-blur-sm rounded-full border border-white/60 shadow-sm"
              >
                <CheckCircle size={12} className="text-purple-700" />
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
