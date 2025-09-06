"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Phone, Send, CheckCircle, Sparkles } from "lucide-react"
import { toast } from "react-hot-toast"
import { useSearchParams, useNavigate } from "react-router-dom"
import API_URL from "../conf/api"
import { TypewriterText } from "../components/TypeWriter"

export default function StudentRegistration() {
  const [searchParams, setSearchParams] = useSearchParams()
  const subject = searchParams.get('subject') || ''
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    subject: "",
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isGlowing, setIsGlowing] = useState(false)
  const [focusedField, setFocusedField] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    if (subject) {
      setFormData(prev => ({ ...prev, subject }))
    } else {
      setErrors(prev => ({ ...prev, subject: "Fan nomi mavjud emas" }))
    }
  }, [subject])

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlowing((prev) => !prev)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === "phone") {
      const cleanedValue = value.replace(/\D/g, "")
      if (cleanedValue.length <= 9) {
        setFormData({
          ...formData,
          [name]: cleanedValue,
        })
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.first_name.trim()) {
      newErrors.first_name = "Ism kiritilishi lozim"
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Familiya kiritilishi lozim"
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Telefon raqam kiritilishi lozim"
    } else if (formData.phone.length !== 9) {
      newErrors.phone = "Telefon raqam 9 ta raqamdan iborat bo'lishi kerak"
    }
    if (!formData.subject.trim()) {
      newErrors.subject = "Fan nomi belgilanishi lozim"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }
    setIsSubmitting(true)
    try {
      const dataToSend = {
        ...formData,
        phone: "+998" + formData.phone,
      }
      const response = await fetch(`${API_URL}/register-new-student`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      })
      if (response.ok) {
        setIsSuccess(true)
        setTimeout(() => {
          setIsSuccess(false)
          setFormData({ first_name: "", last_name: "", phone: "", subject: formData.subject })
          toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz!")
        }, 4000)
      } else {
        const data = await response.json()
        toast.error(data.message)
      }
    } catch (error) {
      toast.error("Xatolik yuz berdi, qayta urinib ko'ring")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatSubject = (subject) => {
    if (!subject) return ""
    return decodeURIComponent(subject)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full blur-xl"
        />
      </div>
      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-12 order-1 lg:order-1">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center flex flex-col items-center justify-center max-w-lg"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative h-28 w-48 mb-2"
            >
              <img
                src="/logo.png"
                alt="Intellectual Progress Star Logo"
                className="w-64 h-64 sm:w-64 sm:h-64 md:w-80 md:h-80 mx-auto object-contain drop-shadow-2xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="absolute -top-100 -right-2 text-yellow-400"
              >
                <Sparkles size={28} />
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center flex flex-col items-center justify-center max-w-lg"
            >
              <TypewriterText text="Make progress with Progress!" speed={70} />
            </motion.div>
            <motion.p
              className="text-slate-500 text-lg leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              Progress bilan birga yuqorilang!
            </motion.p>
          </motion.div>
        </div>
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 order-2 lg:order-2">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 1.2, rotateY: -90 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-md text-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-3xl" />
                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 10 }}
                    className="flex justify-center mb-6"
                  >
                    <div className="relative">
                      <CheckCircle size={80} className="text-emerald-500" />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        className="absolute inset-0 rounded-full bg-emerald-200/30"
                      />
                    </div>
                  </motion.div>
                  <motion.h2
                    className="text-2xl font-bold text-slate-800 mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    Ro'yxatdan o'tdingiz!
                  </motion.h2>
                  <motion.p
                    className="text-slate-600 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    Biz sizning {formatSubject(subject)} faniga yuborilgan xabaringizni qabul qilib oldik, tez orada siz bilan bog'lanamiz.
                  </motion.p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 100, rotateY: 90 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                exit={{ opacity: 0, x: -100, rotateY: -90 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 w-full max-w-md relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 rounded-3xl" />
                <div className="relative z-10">
                  <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent mb-3">
                      {subject ? `${formatSubject(subject)} fani bo‘yicha o‘qish uchun ro‘yxatdan o‘tish` : "Ro‘yxatdan o‘tish"}
                    </h1>
                    <p className="text-slate-600">O‘quvchilar uchun onlayn ariza topshirish</p>
                    {errors.subject && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-2"
                      >
                        {errors.subject}
                      </motion.p>
                    )}
                  </motion.div>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <motion.div
                      className="relative"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.div
                        className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10"
                        animate={{
                          color: focusedField === "first_name" ? "#4f46e5" : "#9ca3af",
                          scale: focusedField === "first_name" ? 1.1 : 1,
                        }}
                      >
                        <User size={20} />
                      </motion.div>
                      <motion.input
                        type="text"
                        name="first_name"
                        value={formData.first_name || ""}
                        onChange={handleChange}
                        onFocus={() => setFocusedField("first_name")}
                        onBlur={() => {
                          setFocusedField("")
                          if (!formData.first_name.trim()) {
                            setErrors({ ...errors, first_name: "Ism kiritilishi lozim" })
                          }
                        }}
                        placeholder="Ismingiz"
                        className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all duration-300 bg-white/70 backdrop-blur-sm text-slate-800 placeholder-slate-400"
                        whileFocus={{ scale: 1.02 }}
                      />
                      <AnimatePresence>
                        {errors.first_name && (
                          <motion.p
                            initial={{ opacity: 0, y: -10, x: -10 }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, y: -10, x: 10 }}
                            className="text-red-500 text-sm mt-2 flex items-center gap-1"
                          >
                            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                            {errors.first_name}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    <motion.div
                      className="relative"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <motion.div
                        className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10"
                        animate={{
                          color: focusedField === "last_name" ? "#4f46e5" : "#9ca3af",
                          scale: focusedField === "last_name" ? 1.1 : 1,
                        }}
                      >
                        <User size={20} />
                      </motion.div>
                      <motion.input
                        type="text"
                        name="last_name"
                        value={formData.last_name || ""}
                        onChange={handleChange}
                        onFocus={() => setFocusedField("last_name")}
                        onBlur={() => {
                          setFocusedField("")
                          if (!formData.last_name.trim()) {
                            setErrors({ ...errors, last_name: "Familiya kiritilishi lozim" })
                          }
                        }}
                        placeholder="Familiyangiz"
                        className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all duration-300 bg-white/70 backdrop-blur-sm text-slate-800 placeholder-slate-400"
                        whileFocus={{ scale: 1.02 }}
                      />
                      <AnimatePresence>
                        {errors.last_name && (
                          <motion.p
                            initial={{ opacity: 0, y: -10, x: -10 }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, y: -10, x: 10 }}
                            className="text-red-500 text-sm mt-2 flex items-center gap-1"
                          >
                            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                            {errors.last_name}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    <motion.div
                      className="relative"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.div
                        className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10"
                        animate={{
                          color: focusedField === "phone" ? "#4f46e5" : "#9ca3af",
                          scale: focusedField === "phone" ? 1.1 : 1,
                        }}
                      >
                        <Phone size={20} />
                      </motion.div>
                      <div className="flex rounded-xl border-2 border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition-all duration-300 bg-white/70 backdrop-blur-sm overflow-hidden">
                        <div className="flex items-center justify-center pl-12 pr-3 py-4 bg-slate-50/80 border-r border-slate-200">
                          <span className="text-slate-600 font-medium">+998</span>
                        </div>
                        <motion.input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          onFocus={() => setFocusedField("phone")}
                          onBlur={() => {
                            setFocusedField("")
                            if (!formData.phone.trim()) {
                              setErrors({ ...errors, phone: "Telefon raqam kiritilishi lozim" })
                            } else if (formData.phone.length !== 9) {
                              setErrors({ ...errors, phone: "Telefon raqam 9 ta raqamdan iborat bo'lishi kerak" })
                            }
                          }}
                          placeholder="XX XXX XX XX"
                          className="w-full pl-3 pr-4 py-4 outline-none bg-transparent text-slate-800 placeholder-slate-400"
                          whileFocus={{ scale: 1.02 }}
                        />
                      </div>
                      <AnimatePresence>
                        {errors.phone && (
                          <motion.p
                            initial={{ opacity: 0, y: -10, x: -10 }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, y: -10, x: 10 }}
                            className="text-red-500 text-sm mt-2 flex items-center gap-1"
                          >
                            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                            {errors.phone}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    <motion.button
                      type="submit"
                      disabled={isSubmitting || !!errors.subject}
                      className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-3 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-50 relative overflow-hidden shadow-lg hover:shadow-xl"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <AnimatePresence mode="wait">
                        {isSubmitting ? (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3"
                          >
                            <motion.div
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            />
                            <span>Yuborilmoqda...</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="submit"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3"
                          >
                            <Send size={20} />
                            <span>Yuborish</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
                      />
                    </motion.button>
                  </form>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-6 text-center text-sm text-slate-500"
                  >
                    <p className="leading-relaxed">
                      Ma'lumotlarni kiriting va biz siz bilan tez orada bog'lanib, eng mos ta'lim dasturini taklif qilamiz
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}