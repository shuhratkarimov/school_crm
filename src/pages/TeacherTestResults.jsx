"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pen,
  Trash2,
  Search,
  Calendar,
  BookOpen,
  FileText,
  CreditCard,
  LogOut,
  X,
  Users,
  BarChart3,
  UserCheck,
  UserX,
  TestTubeDiagonal,
  Filter,
  Download,
  Printer,
  Award,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { toast } from "react-hot-toast";
import LottieLoading from "../components/Loading";
import TeacherSidebar from "../components/TeacherSidebar";
import API_URL from "../conf/api";

const monthsInUzbek = {
  1: "Yanvar", 2: "Fevral", 3: "Mart", 4: "Aprel", 5: "May", 6: "Iyun",
  7: "Iyul", 8: "Avgust", 9: "Sentyabr", 10: "Oktyabr", 11: "Noyabr", 12: "Dekabr",
};

function TeacherTestResults() {
  const [tests, setTests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupStudents, setGroupStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testFormData, setTestFormData] = useState({
    test_number: "",
    test_type: "",
    date: new Date().toISOString().split("T")[0],
    scores: {},
  });
  const [editFormData, setEditFormData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [activeMenu, setActiveMenu] = useState("test-results");
  const [smsSending, setSmsSending] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, average: 0, best: 0 });

  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [testsRes, groupsRes] = await Promise.all([
        fetch(`${API_URL}/get_tests?month=${monthFilter}&year=${yearFilter}`, { credentials: "include" }),
        fetch(`${API_URL}/get_teacher_groups`, { credentials: "include" }),
      ]);

      if (!testsRes.ok || !groupsRes.ok) {
        const errData = await testsRes.json();
        toast.error(`Ma'lumotlarni olishda xatolik: ${errData.message}`);
        return;
      }

      const testsData = await testsRes.json();
      const groupsData = await groupsRes.json();
      setTests(testsData);
      setGroups(groupsData);

      // Calculate stats
      if (testsData.length > 0) {
        const avg = testsData.reduce((sum, t) => sum + t.average_score, 0) / testsData.length;
        const best = Math.max(...testsData.map(t => t.average_score));
        setStats({
          total: testsData.length,
          average: avg.toFixed(2),
          best: best.toFixed(2)
        });
      }
    } catch (err) {
      setError("Ma'lumotlarni olishda xatolik!");
      toast.error(`Ma'lumotlarni olishda xatolik: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupStudents = async (groupId) => {
    try {
      const res = await fetch(`${API_URL}/get_one_group_students_for_teacher?group_id=${groupId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json();
        toast.error(`Guruh o'quvchilarini olishda xatolik: ${errData.message}`);
        return;
      }
      const data = await res.json();
      setGroupStudents(data);
      const initialScores = {};
      data.forEach((student) => (initialScores[student.id] = ""));
      setTestFormData({ ...testFormData, scores: initialScores });
    } catch (err) {
      toast.error(`Guruh o'quvchilarini olishda xatolik: ${err.message}`);
    }
  };

  const fetchTestDetails = async (testId) => {
    try {
      const res = await fetch(`${API_URL}/get_test_results/${testId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json();
        toast.error(`Test ma'lumotlarini olishda xatolik: ${errData.message}`);
        return;
      }
      const data = await res.json();
      setSelectedTest(data);
      setDetailModal(true);
    } catch (err) {
      toast.error(`Test ma'lumotlarini olishda xatolik: ${err.message}`);
    }
  };

  const openAddModal = async (group) => {
    setSelectedGroup(group);
    await fetchGroupStudents(group.id);
    const lastTestNumber = tests
      .filter((test) => test.group_id === group.id)
      .reduce((max, test) => Math.max(max, test.test_number), 0);
    setTestFormData({
      ...testFormData,
      test_number: lastTestNumber + 1,
    });
    setAddModal(true);
  };

  const sendTestSMS = async () => {
    if (!selectedTest) return;

    try {
      setSmsSending(true);
      const res = await fetch(`${API_URL}/send_test_sms/${selectedTest.id}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(`SMS yuborishda xatolik: ${data.message}`);
        return;
      }

      toast.success("Ota-onalarga SMS yuborildi!");
      setDetailModal(false);
      await fetchTestDetails(selectedTest.id);
    } catch (err) {
      toast.error(`SMS yuborishda xatolik: ${err.message}`);
    } finally {
      setSmsSending(false);
    }
  };

  const addTestResults = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return toast.error("Guruh tanlanmagan!");
    
    const totalStudents = groupStudents.length;
    const attendedStudents = Object.values(testFormData.scores).filter((score) => score !== "").length;
    const scores = Object.values(testFormData.scores).filter((score) => score !== "").map(Number);
    const averageScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const payload = {
      group_id: selectedGroup.id,
      test_number: testFormData.test_number,
      test_type: testFormData.test_type,
      date: testFormData.date,
      total_students: totalStudents,
      attended_students: attendedStudents,
      average_score: averageScore,
      results: Object.entries(testFormData.scores).map(([student_id, score]) => ({
        student_id,
        score: score ? Number(score) : 0,
        attended: !!score,
      })),
    };

    try {
      const res = await fetch(`${API_URL}/create_test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        toast.error(`Test natijalarini saqlashda xatolik: ${errData.message}`);
        return;
      }
      await fetchData();
      setAddModal(false);
      setSelectedGroup(null);
      setTestFormData({ test_number: "", test_type: "", date: new Date().toISOString().split("T")[0], scores: {} });
      toast.success("Test natijalari saqlandi!");
    } catch (err) {
      toast.error(`Test natijalarini saqlashda xatolik: ${err.message}`);
    }
  };

  const openEditModal = async (test) => {
    const res = await fetch(`${API_URL}/get_test_results/${test.id}`, {
      credentials: "include",
    });
    if (!res.ok) {
      const errData = await res.json();
      toast.error(`Test natijalarini olishda xatolik: ${errData.message}`);
      return;
    }
    const testData = await res.json();
    const scores = {};
    testData.results.forEach((result) => {
      scores[result.student_id] = result.attended ? result.score.toString() : "";
    });
    await fetchGroupStudents(test.group_id);
    setEditFormData({
      id: test.id,
      group_id: test.group_id,
      test_number: test.test_number,
      test_type: test.test_type,
      date: new Date(test.date).toISOString().split("T")[0],
      scores,
    });
    setSelectedGroup({ id: test.group_id });
    setEditModal(true);
  };

  const editTestResult = async (e) => {
    e.preventDefault();
    const totalStudents = groupStudents.length;
    const attendedStudents = Object.values(editFormData.scores).filter((score) => score !== "").length;
    const scores = Object.values(editFormData.scores).filter((score) => score !== "").map(Number);
    const averageScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const payload = {
      group_id: editFormData.group_id,
      test_number: editFormData.test_number,
      test_type: editFormData.test_type,
      date: editFormData.date,
      total_students: totalStudents,
      attended_students: attendedStudents,
      average_score: averageScore,
      results: Object.entries(editFormData.scores).map(([student_id, score]) => ({
        student_id,
        score: score ? Number(score) : 0,
        attended: !!score,
      })),
    };

    try {
      const res = await fetch(`${API_URL}/update_test/${editFormData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        if (errData.message === "24 soat o'tgan") return toast.error("Testni tahrirlash uchun 24 soat o'tgan!");
        toast.error(`Test natijasini tahrirlashda xatolik: ${errData.message}`);
        return;
      }
      await fetchData();
      setEditModal(false);
      setSelectedGroup(null);
      toast.success("Test natijasi tahrirlandi!");
    } catch (err) {
      toast.error("Test natijasini tahrirlashda xatolik!");
    }
  };

  const showDeleteToast = (id) => {
    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-xl shadow-xl p-4 max-w-md"
      >
        <p className="text-gray-800 font-medium mb-3">
          Diqqat! Ushbu testni o'chirishni xohlaysizmi?
        </p>
        <div className="flex gap-3">
          <button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            onClick={() => {
              deleteTest(id);
              toast.dismiss();
            }}
          >
            O'chirish
          </button>
          <button
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
            onClick={() => toast.dismiss()}
          >
            Bekor qilish
          </button>
        </div>
      </motion.div>
    ));
  };

  const deleteTest = async (id) => {
    try {
      const res = await fetch(`${API_URL}/delete_test/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json();
        toast.error(`Testni o'chirishda xatolik: ${errData.message}`);
        return;
      }
      await fetchData();
      toast.success("Test o'chirildi!");
    } catch (err) {
      toast.error("Testni o'chirishda xatolik!");
    }
  };

  const filteredTests = tests
    .filter((test) =>
      test.group?.group_subject?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((test) => typeFilter === "all" || test.test_type === typeFilter);

  useEffect(() => {
    fetchData();
  }, [monthFilter, yearFilter]);

  if (loading) return <LottieLoading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col md:flex-row">
      <TeacherSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 mb-6 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <TestTubeDiagonal className="w-8 h-8" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Test natijalari</h1>
              <p className="opacity-90 mt-1">O'quvchilarning test natijalarini kuzating</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-blue-100"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Jami testlar</p>
                <p className="text-xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-green-100"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">O'rtacha ball</p>
                <p className="text-xl font-bold text-green-600">{stats.average}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-purple-100"
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Eng yuqori ball</p>
                <p className="text-xl font-bold text-purple-600">{stats.best}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Groups Quick Add */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Guruhlar bo'yicha test qo'shish
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                onClick={() => openAddModal(group)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{group.group_subject}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {tests.filter(t => t.group_id === group.id).length} ta test
                    </p>
                  </div>
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Plus className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Guruh qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filtr
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(Number(e.target.value))}
                className="border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(monthsInUzbek).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>

              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(Number(e.target.value))}
                className="border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(
                  (year) => (
                    <option key={year} value={year}>{year}</option>
                  )
                )}
              </select>

              <button
                onClick={() => window.print()}
                className="p-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                title="Chop etish"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Test turi:</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="text-sm border rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">Barchasi</option>
                    <option value="Yozma">Yozma</option>
                    <option value="Og'zaki">Og'zaki</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tests List */}
        {filteredTests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-12 text-center shadow-sm"
          >
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="text-gray-400" size={40} />
            </div>
            <p className="text-gray-500 text-lg">Ushbu oy uchun test natijalari topilmadi</p>
            <p className="text-gray-400 mt-1">Yangi test qo'shish uchun guruhlardan birini tanlang</p>
          </motion.div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl shadow-sm border border-gray-200">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">#</th>
                    <th className="px-6 py-4 text-left font-semibold">Guruh</th>
                    <th className="px-6 py-4 text-left font-semibold">Test raqami</th>
                    <th className="px-6 py-4 text-left font-semibold">Test turi</th>
                    <th className="px-6 py-4 text-left font-semibold">O'rtacha ball</th>
                    <th className="px-6 py-4 text-left font-semibold">Sana</th>
                    <th className="px-6 py-4 text-right font-semibold">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTests.map((test, index) => (
                    <motion.tr
                      key={test.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-indigo-50 transition-colors cursor-pointer"
                      onClick={() => fetchTestDetails(test.id)}
                    >
                      <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{test.group?.group_subject}</td>
                      <td className="px-6 py-4">#{test.test_number}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          test.test_type === 'Yozma' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {test.test_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-indigo-600">{test.average_score.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(test.date).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(test);
                            }}
                          >
                            <Pen size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              showDeleteToast(test.id);
                            }}
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="grid gap-4 md:hidden">
              {filteredTests.map((test, index) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => fetchTestDetails(test.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{test.group?.group_subject}</h3>
                      <p className="text-sm text-gray-500">Test #{test.test_number}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      test.test_type === 'Yozma' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {test.test_type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">O'rtacha ball</p>
                      <p className="font-bold text-indigo-600">{test.average_score.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Sana</p>
                      <p className="text-sm text-gray-800">
                        {new Date(test.date).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      className="flex-1 flex items-center justify-center gap-1 text-blue-600 font-medium py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(test);
                      }}
                    >
                      <Pen size={16} />
                      Tahrirlash
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-1 text-red-600 font-medium py-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        showDeleteToast(test.id);
                      }}
                    >
                      <Trash2 size={16} />
                      O'chirish
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-10">
          <p className="flex items-center justify-center gap-2">
            <TestTubeDiagonal className="w-4 h-4 text-indigo-600" />
            © {new Date().getFullYear()} "Intellectual Progress Star" o'quv markazi
          </p>
        </footer>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {addModal && selectedGroup && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Plus size={24} />
                    <h3 className="text-xl font-bold">Yangi test qo'shish</h3>
                  </div>
                  <button
                    onClick={() => setAddModal(false)}
                    className="hover:bg-white/20 p-1 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-white/80 text-sm mt-1">{selectedGroup.group_subject}</p>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <form onSubmit={addTestResults} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test tartib raqami *
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={testFormData.test_number}
                        onChange={(e) => setTestFormData({ ...testFormData, test_number: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test shakli *
                      </label>
                      <select
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={testFormData.test_type}
                        onChange={(e) => setTestFormData({ ...testFormData, test_type: e.target.value })}
                        required
                      >
                        <option value="">Tanlang</option>
                        <option value="Yozma">Yozma</option>
                        <option value="Og'zaki">Og'zaki</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sanasi *
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={testFormData.date}
                        onChange={(e) => setTestFormData({ ...testFormData, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-5">
                    <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                      <Users size={20} />
                      O'quvchilar ballari
                    </h3>

                    <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                      {groupStudents.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-700">
                            {student.first_name} {student.last_name}
                          </span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Ball"
                            className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={testFormData.scores[student.id] || ""}
                            onChange={(e) =>
                              setTestFormData({
                                ...testFormData,
                                scores: { ...testFormData.scores, [student.id]: e.target.value },
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
                      onClick={() => setAddModal(false)}
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                    >
                      Saqlash
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModal && editFormData && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Pen size={24} />
                    <h3 className="text-xl font-bold">Test natijasini tahrirlash</h3>
                  </div>
                  <button
                    onClick={() => setEditModal(false)}
                    className="hover:bg-white/20 p-1 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <form onSubmit={editTestResult} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test tartib raqami *
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={editFormData.test_number}
                        onChange={(e) => setEditFormData({ ...editFormData, test_number: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test shakli *
                      </label>
                      <select
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={editFormData.test_type}
                        onChange={(e) => setEditFormData({ ...editFormData, test_type: e.target.value })}
                        required
                      >
                        <option value="Yozma">Yozma</option>
                        <option value="Og'zaki">Og'zaki</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sanasi *
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={editFormData.date}
                        onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-5">
                    <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                      <Users size={20} />
                      O'quvchilar ballari
                    </h3>

                    <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                      {groupStudents.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-700">
                            {student.first_name} {student.last_name}
                          </span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Ball"
                            className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={editFormData.scores[student.id] || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                scores: { ...editFormData.scores, [student.id]: e.target.value },
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
                      onClick={() => setEditModal(false)}
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                    >
                      Saqlash
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailModal && selectedTest && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={24} />
                    <h3 className="text-xl font-bold">Test tafsilotlari</h3>
                  </div>
                  <button
                    onClick={() => setDetailModal(false)}
                    className="hover:bg-white/20 p-1 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-xl">
                    <h4 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Test haqida
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium text-gray-600">Guruh:</span>{' '}
                        <span className="text-gray-800">{selectedTest.group?.group_subject}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-gray-600">Test raqami:</span>{' '}
                        <span className="text-gray-800">#{selectedTest.test_number}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-gray-600">Test turi:</span>{' '}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          selectedTest.test_type === 'Yozma' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedTest.test_type}
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-gray-600">Sana:</span>{' '}
                        <span className="text-gray-800">
                          {new Date(selectedTest.date).toLocaleDateString("uz-UZ", {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl">
                    <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Statistika
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-gray-600">Jami o'quvchilar:</span>{' '}
                        <span className="text-gray-800">{selectedTest.total_students}</span>
                      </p>
                      <p className="text-sm flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-600">Qatnashganlar:</span>{' '}
                        <span className="text-green-600 font-semibold">{selectedTest.attended_students}</span>
                      </p>
                      <p className="text-sm flex items-center gap-2">
                        <UserX className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-gray-600">Qatnashmaganlar:</span>{' '}
                        <span className="text-red-600 font-semibold">
                          {selectedTest.total_students - selectedTest.attended_students}
                        </span>
                      </p>
                      <p className="text-sm flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-gray-600">O'rtacha ball:</span>{' '}
                        <span className="text-yellow-600 font-bold">{selectedTest.average_score?.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-lg text-gray-800 mb-4">O'quvchilar natijalari</h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 font-medium text-gray-700">Ism Familiya</th>
                          <th className="text-left p-3 font-medium text-gray-700">Holat</th>
                          <th className="text-left p-3 font-medium text-gray-700">SMS</th>
                          <th className="text-left p-3 font-medium text-gray-700">Ball</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedTest.results?.map((result, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="p-3 font-medium text-gray-800">
                              {result.student?.first_name} {result.student?.last_name}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                result.attended 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {result.attended ? 'Qatnashdi' : 'Qatnashmadi'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                result.is_sent 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {result.is_sent ? 'Yuborilgan' : 'Yuborilmagan'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-indigo-600">
                                {result.attended ? result.score : '-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button
                  className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
                  onClick={() => setDetailModal(false)}
                >
                  Yopish
                </button>
                <button
                  className={`px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 ${
                    smsSending
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  }`}
                  onClick={sendTestSMS}
                  disabled={smsSending}
                >
                  {smsSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Yuborilmoqda...
                    </>
                  ) : (
                    <>
                      Ota-onalarga SMS yuborish
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg shadow-lg border-t border-gray-200 p-2 z-40">
        <div className="flex justify-around items-center">
          {[
            { id: "dashboard", label: "Bosh sahifa", icon: BookOpen, path: "/teacher/dashboard" },
            { id: "test-results", label: "Test natijalari", icon: FileText, path: "/teacher/test-results" },
            { id: "payments", label: "To'lovlar", icon: CreditCard, path: "/teacher/payments" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveMenu(item.id);
                navigate(item.path);
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                activeMenu === item.id
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              <item.icon size={20} />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => navigate("/teacher/login")}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut size={20} />
            <span className="text-xs">Chiqish</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default TeacherTestResults;