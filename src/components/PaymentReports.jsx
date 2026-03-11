"use client";

import { useState, useEffect, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Home,
  User,
  Phone,
  BookOpen,
  CreditCard,
  ChevronRight,
  BarChart3,
  LogOut,
  Coins,
  Wallet,
  Receipt,
  Printer,
  CheckCircle,
  XCircle,
  Users,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import LottieLoading from "./Loading";
import * as XLSX from "xlsx";
import API_URL from "../conf/api";

function PaymentReports() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [expandedStudents, setExpandedStudents] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [groupFilter, setGroupFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, paid: 0, unpaid: 0, totalAmount: 0 });
  const [viewMode, setViewMode] = useState("table"); // table or grid

  const navigate = useNavigate();

  const monthsInUzbek = {
    1: "Yanvar",
    2: "Fevral",
    3: "Mart",
    4: "Aprel",
    5: "May",
    6: "Iyun",
    7: "Iyul",
    8: "Avgust",
    9: "Sentyabr",
    10: "Oktyabr",
    11: "Noyabr",
    12: "Dekabr",
  };

  const formatMoney = (amount) =>
    `${Number(amount).toLocaleString("uz-UZ")} so'm`;

  useEffect(() => {
    fetchPaymentData();
  }, [monthFilter, yearFilter]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/get_teacher_dashboard_student_payments?month=${monthFilter}&year=${yearFilter}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (res.status === 401) {
        toast.error("Tizimga qayta kiring!");
        navigate("/teacher/login");
        return;
      }

      const data = await res.json();
      setPayments(data);

      // Calculate stats
      const total = data.length;
      const paid = data.filter(s => s.studentPayments?.length > 0).length;
      const unpaid = total - paid;
      const totalAmount = data.reduce((sum, s) => {
        const paidAmount = s.studentPayments?.reduce((pSum, p) => pSum + (p.payment_amount || 0), 0) || 0;
        return sum + paidAmount;
      }, 0);

      setStats({ total, paid, unpaid, totalAmount });
    } catch (err) {
      toast.error("To'lov ma'lumotlarini yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const allGroups = Array.from(
    new Set(payments.flatMap((student) => student.groups.map((g) => g.group_subject)))
  );

  const sortedPayments = [...payments].sort((a, b) => {
    if (sortConfig.key) {
      let aValue, bValue;

      if (sortConfig.key === "first_name") {
        aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
        bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
      } else if (sortConfig.key === "group_name") {
        aValue = a.groups.map((g) => g.group_subject).join(", ").toLowerCase();
        bValue = b.groups.map((g) => g.group_subject).join(", ").toLowerCase();
      } else if (sortConfig.key === "paid") {
        aValue = a.studentPayments?.length > 0 ? 1 : 0;
        bValue = b.studentPayments?.length > 0 ? 1 : 0;
      } else if (sortConfig.key === "amount") {
        aValue = a.studentPayments?.reduce((sum, p) => sum + (p.payment_amount || 0), 0) || 0;
        bValue = b.studentPayments?.reduce((sum, p) => sum + (p.payment_amount || 0), 0) || 0;
      }

      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  const filteredPayments = sortedPayments.filter((student) => {
    const matchesSearch =
      student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.groups.some((g) =>
        g.group_subject.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      student?.phone_number?.includes(searchTerm) ||
      student?.parents_phone_number?.includes(searchTerm);

    const matchesGroup =
      groupFilter === "all" ||
      student.groups.some((g) => g.group_subject === groupFilter);

    return matchesSearch && matchesGroup;
  });

  const toggleStudentExpansion = (studentId) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const exportToXLSX = () => {
    try {
      const worksheetData = [
        [
          "Ism",
          "Familiya",
          "Guruh",
          "Telefon",
          "Ota-ona telefoni",
          "Oy",
          "Yil",
          "To'lov holati",
          "To'lov sanasi",
          "To'lov summasi",
          "Qarzdorlik",
          "Izoh",
        ],
      ];

      filteredPayments.forEach((student) => {
        const totalFee = student.groups.reduce(
          (sum, g) => sum + (g.monthly_fee || 0),
          0
        );
        const totalPaid = student.studentPayments?.reduce(
          (sum, p) => sum + (p.payment_amount || 0),
          0
        ) || 0;

        let debt = totalFee - totalPaid;
        if (student.studentPayments?.some((p) => p.shouldBeConsideredAsPaid)) {
          debt = 0;
        }

        worksheetData.push([
          student.first_name || "",
          student.last_name || "",
          student.groups.map((g) => g.group_subject).join(", ") || "",
          student.phone_number || "",
          student.parents_phone_number || "",
          monthsInUzbek[monthFilter] || "",
          yearFilter || "",
          student.studentPayments?.length > 0 ? "To'langan" : "To'lanmagan",
          student.studentPayments?.[0]?.created_at
            ? `${new Date(student.studentPayments[0].created_at).toLocaleDateString(
              "uz-UZ"
            )}, ${new Date(student.studentPayments[0].created_at).toLocaleTimeString(
              "uz-UZ"
            )}`
            : "",
          student.studentPayments?.[0]?.payment_amount
            ? `${student.studentPayments[0].payment_amount.toLocaleString(
              "uz-UZ"
            )} so'm`
            : "",
          debt > 0 ? `${debt.toLocaleString("uz-UZ")} so'm` : "Yo'q",
          student.studentPayments?.[0]?.comment || "",
        ]);
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      worksheet["!cols"] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 18 },
        { wch: 10 },
        { wch: 8 },
        { wch: 14 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
      ];

      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1E3A8A" } },
      };

      for (let col = 0; col < worksheetData[0].length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
        worksheet[cellAddress].s = headerStyle;
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, "To'lovlar");
      XLSX.writeFile(
        workbook,
        `tolovlar_${monthsInUzbek[monthFilter]}_${yearFilter}_.xlsx`
      );
      toast.success("To'lovlar Excel fayl sifatida yuklandi!");
    } catch (err) {
      toast.error("Excel faylni yaratishda xatolik!");
    }
  };

  if (loading) return <LottieLoading />;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 mb-6 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 translate-y-16"></div>

          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Coins className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">To'lovlar hisoboti</h1>
              <p className="opacity-90 mt-1">O'quvchilarning to'lov ma'lumotlarini kuzating</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-blue-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-100 p-2 rounded-xl">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                Jami
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.total}</h3>
            <p className="text-sm text-gray-600 mt-1">O'quvchilar soni</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-green-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-100 p-2 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-600 rounded-full">
                {((stats.paid / stats.total) * 100 || 0).toFixed(1)}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-green-600">{stats.paid}</h3>
            <p className="text-sm text-gray-600 mt-1">To'lagan o'quvchilar</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-red-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-red-100 p-2 rounded-xl">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-600 rounded-full">
                {((stats.unpaid / stats.total) * 100 || 0).toFixed(1)}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-red-600">{stats.unpaid}</h3>
            <p className="text-sm text-gray-600 mt-1">Qarzdor o'quvchilar</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-purple-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-100 p-2 rounded-xl">
                <Wallet className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-600 rounded-full">
                {monthsInUzbek[monthFilter]}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-purple-600">
              {(stats.totalAmount / 1000000).toFixed(1)}M
            </h3>
            <p className="text-sm text-gray-600 mt-1">Jami to'lov</p>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate("/teacher/dashboard")}
            className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200"
          >
            <Home size={18} />
            <span className="hidden sm:inline">Asosiy menyu</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            onClick={exportToXLSX}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Excel yuklab olish</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">Chop etish</span>
          </motion.button>

          <div className="flex-1"></div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-200"
          >
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl transition-all ${viewMode === "table"
                ? "bg-indigo-100 text-indigo-600"
                : "text-gray-400 hover:text-gray-600"
                }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 18h18M3 6h18" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl transition-all ${viewMode === "grid"
                ? "bg-indigo-100 text-indigo-600"
                : "text-gray-400 hover:text-gray-600"
                }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm p-4 md:p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="O'quvchi, guruh yoki telefon raqami bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl w-full justify-center"
            >
              <Filter size={18} />
              Filtrlash
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <div
              className={`${showFilters ? "flex" : "hidden"
                } md:flex flex-col md:flex-row gap-3 w-full md:w-auto`}
            >
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(parseInt(e.target.value))}
                className="border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(monthsInUzbek).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>

              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(parseInt(e.target.value))}
                className="border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const years = [];
                  for (let i = currentYear - 2; i <= currentYear + 2; i++) {
                    years.push(i);
                  }
                  return years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ));
                })()}
              </select>

              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Barcha guruhlar</option>
                {allGroups.map((group, idx) => (
                  <option key={idx} value={group}>
                    {group}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchPaymentData}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg transition-all"
              >
                <Filter size={18} />
                <span>Filtrlash</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {filteredPayments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-12 text-center shadow-sm"
          >
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Receipt className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">Ushbu oy uchun to'lov ma'lumotlari topilmadi</p>
            <p className="text-gray-400 mt-1">Boshqa oy yoki yilni tanlang</p>
          </motion.div>
        ) : (
          <>
            {viewMode === "table" ? (
              /* Table View - Mobile va Desktop uchun */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="block overflow-x-auto rounded-xl shadow-sm border border-gray-200"
              >
                <div className="min-w-[800px] md:min-w-full">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      <tr>
                        <th
                          className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-white/10 whitespace-nowrap"
                          onClick={() => handleSort("first_name")}
                        >
                          <div className="flex items-center gap-1">
                            O'quvchi
                            {sortConfig.key === "first_name" && (
                              sortConfig.direction === "ascending" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                            )}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-white/10 whitespace-nowrap"
                          onClick={() => handleSort("group_name")}
                        >
                          <div className="flex items-center gap-1">
                            Guruh
                            {sortConfig.key === "group_name" && (
                              sortConfig.direction === "ascending" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                            )}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Telefon</th>
                        <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Ota-ona telefoni</th>
                        <th
                          className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-white/10 whitespace-nowrap"
                          onClick={() => handleSort("paid")}
                        >
                          <div className="flex items-center gap-1">
                            Holat
                            {sortConfig.key === "paid" && (
                              sortConfig.direction === "ascending" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                            )}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-white/10 whitespace-nowrap"
                          onClick={() => handleSort("amount")}
                        >
                          <div className="flex items-center gap-1">
                            Summa
                            {sortConfig.key === "amount" && (
                              sortConfig.direction === "ascending" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                            )}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPayments.map((student, index) => {
                        const totalPaid = student.studentPayments?.reduce((sum, p) => sum + (p.payment_amount || 0), 0) || 0;
                        const isPaid = student.studentPayments?.length > 0;

                        return (
                          <Fragment key={student.id}>
                            <motion.tr
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.02 }}
                              className="hover:bg-indigo-50 transition-colors cursor-pointer"
                              onClick={() => toggleStudentExpansion(student.id)}
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-indigo-600" />
                                  </div>
                                  <span className="font-medium text-gray-800">
                                    {student.first_name} {student.last_name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-gray-600 line-clamp-2">
                                    {student.groups.map((g) => g.group_subject).join(", ")}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-gray-600">{student.phone_number || "Noma'lum"}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-gray-600">{student.parents_phone_number || "Noma'lum"}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${isPaid
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                    }`}
                                >
                                  {isPaid ? "To'langan" : "To'lanmagan"}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`font-semibold ${isPaid ? "text-green-600" : "text-red-600"}`}>
                                  {isPaid ? formatMoney(totalPaid) : "0 so'm"}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStudentExpansion(student.id);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-800 flex items-center font-medium"
                                >
                                  {expandedStudents[student.id] ? "Yopish" : "Batafsil"}
                                  {expandedStudents[student.id] ? (
                                    <ChevronUp size={16} className="ml-1" />
                                  ) : (
                                    <ChevronRight size={16} className="ml-1" />
                                  )}
                                </button>
                              </td>
                            </motion.tr>

                            <AnimatePresence>
                              {expandedStudents[student.id] && (
                                <motion.tr
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                >
                                  <td colSpan="7" className="px-4 py-4 bg-indigo-50">
                                    <motion.div
                                      initial={{ y: -10 }}
                                      animate={{ y: 0 }}
                                      className="bg-white rounded-xl p-5 shadow-sm"
                                    >
                                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-indigo-600" />
                                        To'lov ma'lumotlari
                                      </h3>

                                      {student.studentPayments?.length > 0 ? (
                                        <div className="space-y-4">
                                          {student.studentPayments.map((p, idx) => (
                                            <div
                                              key={p.id}
                                              className="border-l-4 border-indigo-500 bg-indigo-50/50 p-4 rounded-r-lg"
                                            >
                                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                  <p className="text-xs text-gray-500">Summa</p>
                                                  <p className="font-semibold text-gray-800">
                                                    {formatMoney(p.payment_amount)}
                                                  </p>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-gray-500">To'lov turi</p>
                                                  <p className="font-medium text-gray-700">
                                                    {p.payment_type || "Noma'lum"}
                                                  </p>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-gray-500">Sana</p>
                                                  <p className="font-medium text-gray-700">
                                                    {new Date(p.created_at).toLocaleDateString("uz-UZ")}
                                                  </p>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-gray-500">Vaqt</p>
                                                  <p className="font-medium text-gray-700">
                                                    {new Date(p.created_at).toLocaleTimeString("uz-UZ")}
                                                  </p>
                                                </div>
                                                {p.comment && (
                                                  <div className="col-span-full">
                                                    <p className="text-xs text-gray-500">Izoh</p>
                                                    <p className="text-gray-700">{p.comment}</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-center py-6">
                                          <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                          <p className="text-gray-500">To'lov tarixi mavjud emas</p>
                                        </div>
                                      )}
                                    </motion.div>
                                  </td>
                                </motion.tr>
                              )}
                            </AnimatePresence>
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : (
              /* Grid View */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredPayments.map((student, index) => {
                  const isPaid = student.studentPayments?.length > 0;
                  const totalPaid = student.studentPayments?.reduce((sum, p) => sum + (p.payment_amount || 0), 0) || 0;

                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"
                    >
                      <div className={`h-2 ${isPaid ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500'}`} />

                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-800 truncate">
                                {student.first_name} {student.last_name}
                              </h3>
                              <p className="text-sm text-gray-500 flex items-center gap-1 truncate">
                                <BookOpen className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{student.groups.map(g => g.group_subject).join(", ")}</span>
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}
                          >
                            {isPaid ? 'To\'langan' : 'To\'lanmagan'}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-sm flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{student.phone_number || "Noma'lum"}</span>
                          </p>
                          <p className="text-sm flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{student.parents_phone_number || "Noma'lum"}</span>
                          </p>
                          {isPaid && (
                            <p className="text-sm flex items-center gap-2">
                              <Wallet className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="font-semibold text-green-600 truncate">{formatMoney(totalPaid)}</span>
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => toggleStudentExpansion(student.id)}
                          className="w-full flex items-center justify-center gap-1 text-indigo-600 font-medium py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        >
                          {expandedStudents[student.id] ? 'Yopish' : 'To\'lov ma\'lumotlari'}
                          {expandedStudents[student.id] ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
                        </button>

                        <AnimatePresence>
                          {expandedStudents[student.id] && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t"
                            >
                              {student.studentPayments?.length > 0 ? (
                                <div className="space-y-3">
                                  {student.studentPayments.map((p) => (
                                    <div key={p.id} className="bg-gray-50 p-3 rounded-xl">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <p className="text-xs text-gray-500">Summa</p>
                                          <p className="font-medium text-gray-800">
                                            {formatMoney(p.payment_amount)}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Turi</p>
                                          <p className="font-medium text-gray-700">{p.payment_type || "Noma'lum"}</p>
                                        </div>
                                        <div className="col-span-2">
                                          <p className="text-xs text-gray-500">Sana</p>
                                          <p className="font-medium text-gray-700">
                                            {new Date(p.created_at).toLocaleString("uz-UZ")}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-center text-gray-500 text-sm py-2">
                                  To'lov tarixi mavjud emas
                                </p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-10">
          <p className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            © {new Date().getFullYear()} "Intellectual Progress Star" o'quv markazi
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </p>
        </footer>
      </div>
    </>
  );
}

export default PaymentReports;