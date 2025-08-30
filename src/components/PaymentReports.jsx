"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Download, ChevronDown, ChevronUp, Home, Calendar, User, Phone, BookOpen, CreditCard, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LottieLoading from "./Loading";
import * as XLSX from 'xlsx';

function PaymentReports() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [expandedStudents, setExpandedStudents] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [groupFilter, setGroupFilter] = useState("all");
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
    10: "Oktabr",
    11: "Noyabr",
    12: "Dekabr",
  };

  useEffect(() => {
    fetchPaymentData();
  }, [monthFilter, yearFilter]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/get_teacher_dashboard_student_payments?month=${monthFilter}&year=${yearFilter}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (res.status === 401) {
        toast.error("Avtorizatsiya talab qilinadi", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      const data = await res.json();

      setPayments(data);
    } catch (err) {
      toast.error("To'lov ma'lumotlarini yuklashda xatolik", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const allGroups = Array.from(
    new Set(
      payments.flatMap(student => student.groups.map(g => g.group_subject))
    )
  );

  const sortedPayments = [...payments].sort((a, b) => {
    if (sortConfig.key) {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
    }
    return 0;
  });

  const filteredPayments = sortedPayments.filter((student) => {
    const matchesSearch =
      student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.groups.some(g => g.group_subject.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGroup =
      groupFilter === "all" ||
      student.groups.some(g => g.group_subject === groupFilter);

    return matchesSearch && matchesGroup;
  });;

  const toggleStudentExpansion = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const exportToXLSX = () => {
    // Ma'lumotlarni Excel formatiga moslab tayyorlaymiz
    const worksheetData = [
      ["Ism", "Familiya", "Guruh", "Telefon", "Ota-ona telefoni", "Oy", "Yil", "To'lov holati", "To'lov sanasi", "To'lov summasi", "Qarzdorlik"]
    ];

    filteredPayments.forEach(student => {
      const totalFee = student.groups.reduce((sum, g) => sum + (g.monthly_fee || 0), 0);
      const totalPaid = student.payments.reduce((sum, p) => sum + (p.payment_amount || 0), 0);
      const debt = totalFee - totalPaid;

      worksheetData.push([
        student.first_name || "",
        student.last_name || "",
        student.groups.map(g => g.group_subject).join(", ") || "",
        student.phone_number || "",
        student.parents_phone_number || "",
        monthsInUzbek[monthFilter] || "",
        yearFilter || "",
        student.payments.length > 0 ? "To'langan" : "To'lanmagan",
        student.payments[0]?.createdAt
          ? new Date(student.payments[0].createdAt).toLocaleDateString("uz-UZ")
          : "",
        student.payments[0]?.payment_amount
          ? `${student.payments[0].payment_amount} so'm`
          : "",
        debt > 0 ? `${debt} so'm` : "Yo'q"
      ]);
    });

    // Workbook yaratish
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Ustun kengliklarini sozlash
    const colWidths = [
      { wch: 15 }, // Ism
      { wch: 15 }, // Familiya
      { wch: 20 }, // Guruh
      { wch: 15 }, // Telefon
      { wch: 15 }, // Ota-ona telefoni
      { wch: 10 }, // Oy
      { wch: 8 },  // Yil
      { wch: 12 }, // To'lov holati
      { wch: 15 }, // To'lov sanasi
      { wch: 15 }, // To'lov summasi
      { wch: 12 }  // Qarzdorlik
    ];
    worksheet['!cols'] = colWidths;

    // Sarlavha qatorini formatlash
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "104292" } }
    };

    for (let col = 0; col < worksheetData[0].length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
      worksheet[cellAddress].s = headerStyle;
    }

    // Worksheetni workbookga qo'shish
    XLSX.utils.book_append_sheet(workbook, worksheet, "To'lovlar");

    // Faylni yuklab olish
    XLSX.writeFile(workbook, `to'lovlar_${monthsInUzbek[monthFilter]}_${yearFilter}.xlsx`);
  };

  if (loading) return <LottieLoading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 md:p-8">
      <ToastContainer theme="colored" />

      {/* Sarlavha va navigatsiya */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">O'quvchilar to'lovlari</h1>
            <p className="text-gray-600 mt-1 flex items-center">
              <Calendar size={16} className="mr-1" />
              {monthsInUzbek[monthFilter]} {yearFilter} yil
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/teacher/dashboard")}
              className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition"
            >
              <Home size={18} />
              <span className="hidden sm:inline">Asosiy menyu</span>
            </button>

            <button
              onClick={exportToXLSX}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Excel yuklab olish</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="O'quvchi yoki guruh nomi bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg w-full justify-center"
            >
              <Filter size={18} />
              Filtrlash
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <div className={`${showFilters ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-4 w-full md:w-auto justify-end`}>
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(monthsInUzbek).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>

                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[2023, 2024, 2025].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>

                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Barcha guruhlar</option>
                  {allGroups.map((group, idx) => (
                    <option key={idx} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={fetchPaymentData}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Filter size={18} />
                <span className="hidden md:inline">Filtrlash</span>
              </button>
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">Ushbu oy uchun to'lov ma'lumotlari topilmadi</p>
            </div>
          ) : (
            <>
              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto rounded-lg shadow">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-50 text-left text-gray-700">
                      <th
                        className="px-4 py-3 cursor-pointer font-semibold"
                        onClick={() => handleSort('first_name')}
                      >
                        <div className="flex items-center">
                          O'quvchi
                          {sortConfig.key === 'first_name' && (
                            sortConfig.direction === 'ascending' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 cursor-pointer font-semibold"
                        onClick={() => handleSort('group_name')}
                      >
                        <div className="flex items-center">
                          Guruh
                          {sortConfig.key === 'group_name' && (
                            sortConfig.direction === 'ascending' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 font-semibold">Telefon raqami</th>
                      <th className="px-4 py-3 font-semibold">Ota-ona telefoni</th>
                      <th
                        className="px-4 py-3 cursor-pointer font-semibold"
                        onClick={() => handleSort('paid')}
                      >
                        <div className="flex items-center">
                          To'lov holati
                          {sortConfig.key === 'paid' && (
                            sortConfig.direction === 'ascending' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 font-semibold">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((student) => (
                      <>
                        <tr key={student.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <User size={16} className="text-gray-500 mr-2" />
                              {student.first_name} {student.last_name}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <BookOpen size={16} className="text-gray-500 mr-2" />
                              {student.groups.map((g) => g.group_subject).join(", ")}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <Phone size={16} className="text-gray-500 mr-2" />
                              {student.phone_number}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <Phone size={16} className="text-gray-500 mr-2" />
                              {student.parents_phone_number}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${student.payments.length > 0
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                                }`}
                            >
                              {student.payments.length > 0 ? "To'langan" : "To'lanmagan"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleStudentExpansion(student.id)}
                              className="text-blue-600 hover:text-blue-800 flex items-center font-medium"
                            >
                              {expandedStudents[student.id] ? "Yopish" : "Batafsil"}
                              {expandedStudents[student.id] ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
                            </button>
                          </td>
                        </tr>

                        {/* Batafsil qismi */}
                        {expandedStudents[student.id] && (
                          <tr className="bg-blue-50">
                            <td colSpan="6" className="px-4 py-4">
                              <div className="bg-white p-4 rounded-lg shadow">
                                <h3 className="font-semibold text-lg mb-3 flex items-center">
                                  <CreditCard size={18} className="mr-2" />
                                  To'lov ma'lumotlari
                                </h3>
                                {student.payments.length > 0 ? (
                                  <div className="space-y-3">
                                    {student.payments.map((p) => (
                                      <div key={p.id} className="border-b pb-3 last:border-0 last:pb-0">
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <p className="text-sm text-gray-600">Summasi:</p>
                                            <p className="font-medium">{p.payment_amount ? p.payment_amount.toLocaleString("uz-UZ") : "Noma'lum"} so'm</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-gray-600">Turi:</p>
                                            <p className="font-medium">{p.payment_type}</p>
                                          </div>
                                          <div className="col-span-2">
                                            <p className="text-sm text-gray-600">Sana:</p>
                                            <p className="font-medium">
                                              {console.log(p.created_at)}
                                              {p.created_at ? `${new Date(p.created_at).toLocaleDateString("ru-RU")} yil, soat ${new Date(p.created_at).toLocaleTimeString("ru-RU")}da` : "Noma'lum"}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500">To'lov tarixi mavjud emas</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="grid gap-4 md:hidden">
                {filteredPayments.map(student => (
                  <div key={student.id} className="bg-white shadow rounded-lg p-4 border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg flex items-center">
                          <User size={16} className="mr-2 text-blue-600" />
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 flex items-center">
                          <BookOpen size={14} className="mr-1" />
                          {student.groups.map(g => g.group_subject).join(", ")}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${student.payments.length > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}
                      >
                        {student.payments.length > 0 ? "To'langan" : "To'lanmagan"}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                      <p className="flex items-center">
                        <Phone size={14} className="mr-2 text-gray-500" />
                        {student.phone_number}
                      </p>
                      <p className="flex items-center">
                        <Phone size={14} className="mr-2 text-gray-500" />
                        {student.parents_phone_number}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleStudentExpansion(student.id)}
                      className="mt-3 w-full flex items-center justify-center gap-1 text-blue-600 font-medium py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition"
                    >
                      {expandedStudents[student.id] ? "Yopish" : "To'lov ma'lumotlari"}
                      {expandedStudents[student.id] ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {expandedStudents[student.id] && (
                      <div className="mt-3 pt-3 border-t">
                        <h4 className="font-medium mb-2 flex items-center">
                          <CreditCard size={16} className="mr-2" />
                          To'lov tarixi
                        </h4>
                        {student.payments.length > 0 ? (
                          <div className="space-y-3">
                            {student.payments.map((p) => (
                              <div key={p.id} className="bg-gray-50 p-3 rounded-lg">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-xs text-gray-600">Summa</p>
                                    <p className="font-medium">{p.payment_amount} so'm</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600">Turi</p>
                                    <p className="font-medium">{p.payment_type}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-xs text-gray-600">Sana</p>
                                    <p className="font-medium">
                                      {p.created_at ? `${new Date(p.created_at).toLocaleDateString("ru-RU")} yil, soat ${new Date(p.created_at).toLocaleTimeString("ru-RU")}da` : "Noma'lum"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">To'lov tarixi mavjud emas</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentReports;