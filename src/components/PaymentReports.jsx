"use client";

import { useState, useEffect, Fragment } from "react";
import { Search, Filter, Download, ChevronDown, ChevronUp, Home, Calendar, User, Phone, BookOpen, CreditCard, ChevronRight, BarChart3, LogOut, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import LottieLoading from "./Loading";
import * as XLSX from "xlsx";
import TeacherSidebar from "./TeacherSidebar";
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
  const [activeMenu, setActiveMenu] = useState("payments");

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
        aValue = a.payments.length > 0 ? 1 : 0;
        bValue = b.payments.length > 0 ? 1 : 0;
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
      );

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
        const totalPaid = student.payments.reduce(
          (sum, p) => sum + (p.payment_amount || 0),
          0
        );

        let debt = totalFee - totalPaid;
        if (student.payments.some((p) => p.shouldBeConsideredAsPaid)) {
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
          student.payments.length > 0 ? "To'langan" : "To'lanmagan",
          student.payments[0]?.created_at
            ? `${new Date(student.payments[0].created_at).toLocaleDateString(
              "uz-UZ"
            )}, ${new Date(student.payments[0].created_at).toLocaleTimeString(
              "uz-UZ"
            )}`
            : "",
          student.payments[0]?.payment_amount
            ? `${student.payments[0].payment_amount.toLocaleString(
              "uz-UZ"
            )} so'm`
            : "",
          debt > 0 ? `${debt.toLocaleString("uz-UZ")} so'm` : "Yo'q",
          student.payments[0]?.comment || "",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <TeacherSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex justify-center items-center mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md p-2 rounded-xl">
            <div className="flex items-center">
              <h1 className="text-2xl md:text-3xl font-bold text-white">O'quvchilar to'lovlari</h1>
              <Coins size={24} className="ml-2" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
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

        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
              <div className="relative w-full md:w-1/2">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="O'quvchi yoki guruh nomi bo'yicha qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg w-full justify-center"
              >
                <Filter size={18} />
                Filtrlash
                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <div
                className={`${showFilters ? "flex" : "hidden"
                  } md:flex flex-col md:flex-row gap-4 w-full md:w-auto justify-end`}
              >
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(parseInt(e.target.value))}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[2023, 2024, 2025].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>

                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Barcha guruhlar</option>
                    {allGroups.map((group, idx) => (
                      <option key={idx} value={group}>
                        {group}
                      </option>
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
                          onClick={() => handleSort("first_name")}
                        >
                          <div className="flex items-center">
                            O'quvchi
                            {sortConfig.key === "first_name" && (
                              <span className="ml-1">
                                {sortConfig.direction === "ascending" ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                )}
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 cursor-pointer font-semibold"
                          onClick={() => handleSort("group_name")}
                        >
                          <div className="flex items-center">
                            Guruh
                            {sortConfig.key === "group_name" && (
                              <span className="ml-1">
                                {sortConfig.direction === "ascending" ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                )}
                              </span>
                            )}
                          </div>
                        </th>
                        <th className="px-4 py-3 font-semibold">Telefon raqami</th>
                        <th className="px-4 py-3 font-semibold">Ota-ona telefoni</th>
                        <th
                          className="px-4 py-3 cursor-pointer font-semibold"
                          onClick={() => handleSort("paid")}
                        >
                          <div className="flex items-center">
                            To'lov holati
                            {sortConfig.key === "paid" && (
                              <span className="ml-1">
                                {sortConfig.direction === "ascending" ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                )}
                              </span>
                            )}
                          </div>
                        </th>
                        <th className="px-4 py-3 font-semibold">Amallar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((student) => (
                        <Fragment key={student.id}>
                          <tr
                            key={student.id}
                            className="border-b hover:bg-gray-50 transition-colors"
                          >
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
                                {student.phone_number || "Noma'lum"}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <Phone size={16} className="text-gray-500 mr-2" />
                                {student.parents_phone_number || "Noma'lum"}
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
                                {expandedStudents[student.id] ? (
                                  <ChevronUp size={16} className="ml-1" />
                                ) : (
                                  <ChevronRight size={16} className="ml-1" />
                                )}
                              </button>
                            </td>
                          </tr>

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
                                        <div
                                          key={p.id}
                                          className="border-b pb-3 last:border-0 last:pb-0"
                                        >
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <p className="text-sm text-gray-600">Summasi:</p>
                                              <p className="font-medium">
                                                {p.payment_amount
                                                  ? p.payment_amount.toLocaleString("uz-UZ")
                                                  : "Noma'lum"}{" "}
                                                so'm
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-sm text-gray-600">Turi:</p>
                                              <p className="font-medium">
                                                {p.payment_type || "Noma'lum"}
                                              </p>
                                            </div>
                                            <div className="col-span-2">
                                              <p className="text-sm text-gray-600">Sana:</p>
                                              <p className="font-medium">
                                                {p.created_at
                                                  ? `${new Date(
                                                    p.created_at
                                                  ).toLocaleDateString("uz-UZ")} yil, soat ${new Date(
                                                    p.created_at
                                                  ).toLocaleTimeString("uz-UZ")}da`
                                                  : "Noma'lum"}
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
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card view */}
                <div className="grid gap-4 md:hidden">
                  {filteredPayments.map((student) => (
                    <div
                      key={student.id}
                      className="bg-white shadow rounded-lg p-4 border border-gray-100"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg flex items-center">
                            <User size={16} className="mr-2 text-blue-600" />
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 flex items-center">
                            <BookOpen size={14} className="mr-1" />
                            {student.groups.map((g) => g.group_subject).join(", ")}
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
                          {student.phone_number || "Noma'lum"}
                        </p>
                        <p className="flex items-center">
                          <Phone size={14} className="mr-2 text-gray-500" />
                          {student.parents_phone_number || "Noma'lum"}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleStudentExpansion(student.id)}
                        className="mt-3 w-full flex items-center justify-center gap-1 text-blue-600 font-medium py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition"
                      >
                        {expandedStudents[student.id] ? "Yopish" : "To'lov ma'lumotlari"}
                        {expandedStudents[student.id] ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
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
                                      <p className="font-medium">
                                        {p.payment_amount
                                          ? p.payment_amount.toLocaleString("uz-UZ")
                                          : "Noma'lum"}{" "}
                                        so'm
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600">Turi</p>
                                      <p className="font-medium">
                                        {p.payment_type || "Noma'lum"}
                                      </p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-xs text-gray-600">Sana</p>
                                      <p className="font-medium">
                                        {p.created_at
                                          ? `${new Date(
                                            p.created_at
                                          ).toLocaleDateString("uz-UZ")} yil, soat ${new Date(
                                            p.created_at
                                          ).toLocaleTimeString("uz-UZ")}da`
                                          : "Noma'lum"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">
                              To'lov tarixi mavjud emas
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <footer className="text-center text-gray-500 text-sm mt-10">
            <p>
              © {new Date().getFullYear()} "Intellectual Progress Star" o'quv markazi{" "}
              <br /> Ustoz paneli
            </p>
          </footer>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-2">
        <div className="flex justify-around items-center">
          {[
            { id: "dashboard", label: "Bosh sahifa", icon: BookOpen, path: "/teacher/dashboard" },
            { id: "test-results", label: "Test natijalari", icon: BarChart3, path: "/teacher/test-results" },
            { id: "payments", label: "To'lovlar", icon: CreditCard, path: "/teacher/payments" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveMenu(item.id);
                navigate(item.path);
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeMenu === item.id
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
            >
              <item.icon size={20} />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => {
              navigate("/teacher/login")
            }}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut size={20} />
            <span className="text-xs">Chiqish</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default PaymentReports;