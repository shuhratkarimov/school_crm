"use client";

import { useState, useEffect } from "react";
import { Pen, Trash2, Search, FileText, X, Users, TestTubeDiagonal, Filter, Check, Clock, Settings, BookOpen, BarChart3, UserCheck, UserX, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import LottieLoading from "../components/Loading";

const monthsInUzbek = {
  1: "Yanvar", 2: "Fevral", 3: "Mart", 4: "Aprel", 5: "May", 6: "Iyun",
  7: "Iyul", 8: "Avgust", 9: "Sentyabr", 10: "Oktyabr", 11: "Noyabr", 12: "Dekabr",
};

function AdminTestResults() {
  const [tests, setTests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupStudents, setGroupStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
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
  const [groupFilter, setGroupFilter] = useState("");
  const [teacher, setTeacher] = useState(null);
  const [editTimeLimit, setEditTimeLimit] = useState(24); // Soatda

  const navigate = useNavigate();

  // Sozlamalarni yuklash
  useEffect(() => {
    const savedTimeLimit = localStorage.getItem('testEditTimeLimit');
    if (savedTimeLimit) {
      setEditTimeLimit(parseInt(savedTimeLimit));
    }
    fetchData();
  }, [monthFilter, yearFilter]);

  // Sozlamalarni saqlash
  const saveSettings = () => {
    localStorage.setItem('testEditTimeLimit', editTimeLimit.toString());
    setSettingsModal(false);
    toast.success('Sozlamalar saqlandi!');
  };

  // Testni tahrirlash mumkinligini tekshirish
  const canEditTest = (testDate) => {
    const testTime = new Date(testDate).getTime();
    const currentTime = new Date().getTime();
    const hoursDiff = (currentTime - testTime) / (1000 * 60 * 60);
    return hoursDiff <= editTimeLimit;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [testsRes, groupsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/get_all_tests?month=${monthFilter}&year=${yearFilter}`, {
          credentials: "include"
        }),
        fetch(`${import.meta.env.VITE_API_URL}/get_groups`, {
          credentials: "include"
        }),
      ]);

      if (!testsRes.ok || !groupsRes.ok) {
        throw new Error('Ma\'lumotlarni olishda xatolik');
      }

      const testsData = await testsRes.json();
      const groupsData = await groupsRes.json();

      // Har bir test uchun teacher ma'lumotini qo'shamiz
      const testsWithTeachers = await Promise.all(
        testsData.map(async (test) => {
          if (!test.teacher_id) return test;
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/get_one_teacher/${test.teacher_id}`, {
              credentials: "include",
            });
            if (res.ok) {
              const teacherData = await res.json();
              return { ...test, teacher: teacherData };
            }
          } catch (err) {
            console.error("Teacher fetch error:", err);
          }
          return test;
        })
      );

      setTests(testsWithTeachers);
      setGroups(groupsData);
    } catch (err) {
      toast.error(`Ma'lumotlarni olishda xatolik: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupStudents = async (groupId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/get_one_group_students?group_id=${groupId}`, {
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
      setTestFormData(prev => ({ ...prev, scores: initialScores }));
    } catch (err) {
      toast.error(`Guruh o'quvchilarini olishda xatolik: ${err.message}`);
    }
  };

  const fetchTeacher = async (teacherId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/get_one_teacher/${teacherId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json();
        toast.error(`Ustoz ma'lumotlarini olishda xatolik: ${errData.message}`);
        return;
      }
      const data = await res.json();
      setTeacher(data);
    } catch (err) {
      toast.error(`Ustoz ma'lumotlarini olishda xatolik: ${err.message}`);
    }
  };

  const fetchTestDetails = async (testId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/get_test_results/${testId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json();
        toast.error(`Test ma'lumotlarini olishda xatolik: ${errData.message}`);
        return;
      }
      const data = await res.json();
      if (data.teacher_id) {
        await fetchTeacher(data.teacher_id);
      }
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
        student_id: Number(student_id),
        score: score ? Number(score) : 0,
        attended: !!score,
      })),
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/create_test`, {
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
    if (!canEditTest(test.date)) {
      toast.error(`Testni tahrirlash muddati (${editTimeLimit} soat) o'tgan`);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/get_test_results/${test.id}`, {
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
    } catch (err) {
      toast.error(`Test natijalarini olishda xatolik: ${err.message}`);
    }
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
        student_id: Number(student_id),
        score: score ? Number(score) : 0,
        attended: !!score,
      })),
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/update_test/${editFormData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (errData.message && errData.message.includes("soat o'tgan")) {
          return toast.error(`Testni tahrirlash uchun ${editTimeLimit} soat o'tgan!`);
        }
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

  const deleteTest = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/delete_test/${id}`, {
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

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>Diqqat! Ushbu testni o'chirishni xohlaysizmi?</p>
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
              deleteTest(id);
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
      </div>,
      { duration: 10000 }
    );
  };

  const filteredTests = tests.filter((test) => {
    const matchesSearch = test.group?.group_subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = groupFilter ? test.group_id === groupFilter : true;
    return matchesSearch && matchesGroup;
  });

  if (loading) return <LottieLoading />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <TestTubeDiagonal className="w-8 h-8 text-[#104292]" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Test natijalari</h1>
            </div>
          </div>
          <p className="text-gray-600 mt-1 flex items-center">
            <Clock size={16} className="mr-1" />
            {monthsInUzbek[monthFilter]} {yearFilter} yil | Tahrirlash muddati: {editTimeLimit} soat
          </p>

          {/* Sozlamalar tugmasi */}
          <button
            onClick={() => setSettingsModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Settings size={18} />
            Sozlamalar
          </button>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Guruh qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Barcha guruhlar</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.group_subject}
                </option>
              ))}
            </select>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(Number(e.target.value))}
              className="border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(monthsInUzbek).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(Number(e.target.value))}
              className="border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(
                (year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Jami testlar</p>
                <h3 className="text-2xl font-bold text-gray-800">{tests.length}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Jami guruhlar</p>
                <h3 className="text-2xl font-bold text-gray-800">{groups.length}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Filtrlangan testlar</p>
                <h3 className="text-2xl font-bold text-gray-800">{filteredTests.length}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <Filter className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tests List */}
        {filteredTests.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="text-gray-400" size={40} />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Test natijalari topilmadi</h3>
            <p className="text-gray-500">Boshqa filterlarni tanlab ko'ring yoki yangi test qo'shing</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-800 to-blue-600 text-white">
                    <th className="px-6 py-4 font-semibold text-center">#</th>
                    <th className="px-6 py-4 font-semibold text-center">Guruh</th>
                    <th className="px-6 py-4 font-semibold text-center">Ustoz</th>
                    <th className="px-6 py-4 font-semibold text-center">Test Raqami</th>
                    <th className="px-6 py-4 font-semibold text-center">Test Turi</th>
                    <th className="px-6 py-4 font-semibold text-center">O'rtacha Ball</th>
                    <th className="px-6 py-4 font-semibold text-center">Sana</th>
                    <th className="px-6 py-4 font-semibold text-center">Holati</th>
                    <th className="px-6 py-4 font-semibold text-center">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTests.map((test, index) => {
                    const editable = canEditTest(test.date);
                    return (
                      <tr
                        key={test.id}
                        className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-center">{index + 1}</td>
                        <td className="px-6 py-4 font-medium text-center">{test.group?.group_subject}</td>
                        <td className="px-6 py-4 text-center">{test.teacher?.first_name} {test.teacher?.last_name}</td>
                        <td className="px-6 py-4 text-center">{test.test_number}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${test.test_type === 'Yozma' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {test.test_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-semibold">{test.average_score?.toFixed(2) || '0.00'}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {new Date(test.date).toLocaleDateString("ru-RU")}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${editable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {editable ? 'Tahrirlash mumkin' : 'Muddati o\'tgan'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              className="p-2 bg-green-500 text-white hover:bg-green-600 transition-colors rounded-full"
                              onClick={() => fetchTestDetails(test.id)}
                              title="Batafsil ko'rish"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sozlamalar Modali */}
        {settingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-5 rounded-t-2xl flex justify-between items-center shadow">
                <h3 className="text-lg font-semibold">Test Sozlamalari</h3>
                <button
                  onClick={() => setSettingsModal(false)}
                  className="text-white hover:bg-blue-800 p-1 rounded-full transition-colors"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Testni tahrirlash muddati (soat)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="168"
                      value={editTimeLimit}
                      onChange={(e) => setEditTimeLimit(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-medium min-w-[50px] text-center">
                      {editTimeLimit}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Ustozlar test natijalarini kiritganidan keyin {editTimeLimit} soat davomida tahrirlashlari mumkin
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setSettingsModal(false)}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    onClick={saveSettings}
                  >
                    <Check size={18} className="mr-1" />
                    Saqlash
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {addModal && selectedGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-5 rounded-t-2xl flex justify-between items-center shadow">
                <div>
                  <h3 className="text-xl font-semibold">Yangi Test</h3>
                  <p className="text-blue-100 text-sm mt-1">{selectedGroup?.group_subject} guruhi</p>
                </div>
                <button
                  onClick={() => setAddModal(false)}
                  className="text-white hover:bg-blue-800 p-1 rounded-full transition-colors"
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={addTestResults} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test tartib raqami *</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={testFormData.test_number}
                      onChange={(e) => setTestFormData({ ...testFormData, test_number: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test turi *</label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sana *</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={testFormData.date}
                      onChange={(e) => setTestFormData({ ...testFormData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {groupStudents.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                        <Users size={20} className="mr-2 text-blue-600" />
                        O'quvchilar ballari
                      </h4>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {groupStudents.length} ta o'quvchi
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-blue-800 text-white">
                              <th className="px-4 py-3 text-left text-sm font-medium text-center">#</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-center">Ism Familiya</th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-center">Ball (0-100)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupStudents.map((student, index) => (
                              <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 text-center">{index + 1}</td>
                                <td className="px-4 py-3 text-center">
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.first_name} {student.last_name}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex justify-center">
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      value={testFormData.scores[student.id] || ""}
                                      onChange={(e) => {
                                        const newScores = {
                                          ...testFormData.scores,
                                          [student.id]: e.target.value,
                                        };
                                        setTestFormData({ ...testFormData, scores: newScores });
                                      }}
                                      placeholder="0"
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setAddModal(false)}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Check size={18} className="mr-1" />
                    Saqlash
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModal && editFormData && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-5 rounded-t-2xl flex justify-between items-center shadow">
                <div>
                  <h3 className="text-xl font-semibold">Test natijasini tahrirlash</h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {selectedGroup?.group_subject} guruhi | Test #{editFormData.test_number}
                  </p>
                </div>
                <button
                  onClick={() => setEditModal(false)}
                  className="text-white hover:bg-blue-800 p-1 rounded-full transition-colors"
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={editTestResult} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test tartib raqami *</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editFormData.test_number}
                      onChange={(e) => setEditFormData({ ...editFormData, test_number: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test turi *</label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editFormData.test_type}
                      onChange={(e) => setEditFormData({ ...editFormData, test_type: e.target.value })}
                      required
                    >
                      <option value="">Tanlang</option>
                      <option value="Yozma">Yozma</option>
                      <option value="Og'zaki">Og'zaki</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sana *</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editFormData.date}
                      onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {groupStudents.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                        <Users size={20} className="mr-2 text-blue-600" />
                        O'quvchilar ballari
                      </h4>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {groupStudents.length} ta o'quvchi
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-blue-800 text-white">
                              <th className="px-4 py-3 text-left text-sm font-medium text-center">#</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-center">Ism Familiya</th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-center">Ball (0-100)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupStudents.map((student, index) => (
                              <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 text-center">{index + 1}</td>
                                <td className="px-4 py-3 text-center">
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.first_name} {student.last_name}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex justify-center">
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      value={editFormData.scores[student.id] || ""}
                                      onChange={(e) => {
                                        const newScores = {
                                          ...editFormData.scores,
                                          [student.id]: e.target.value,
                                        };
                                        setEditFormData({ ...editFormData, scores: newScores });
                                      }}
                                      placeholder="0"
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setEditModal(false)}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Check size={18} className="mr-1" />
                    Saqlash
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Test Details Modal */}
        {detailModal && selectedTest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Test #{selectedTest.test_number} tafsilotlari</h2>
                <button
                  onClick={() => setDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{selectedTest.total_students}</div>
                    <div className="text-sm text-gray-600">Jami o'quvchilar</div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-xl text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{selectedTest.attended_students}</div>
                    <div className="text-sm text-gray-600">Qatnashgan o'quvchilar</div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-xl text-center border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">{selectedTest.average_score.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">O'rtacha ball</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Guruh</p>
                    <p className="text-lg font-semibold">{selectedTest.group?.group_subject || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ustoz</p>
                    <p className="text-lg font-semibold">{teacher ? `${teacher.first_name} ${teacher.last_name}` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Test turi</p>
                    <p className="text-lg font-semibold">{selectedTest.test_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sana</p>
                    <p className="text-lg font-semibold">{new Date(selectedTest.date).toLocaleDateString("ru-RU")}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Users size={20} className="mr-2 text-blue-600" />
                    O'quvchilar natijalari
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-800 text-white">
                          <th className="px-4 py-3 text-left text-sm font-medium text-center">#</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-center">Ism Familiya</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-center">Ball</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-center">Holati</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTest.results.map((result, index) => (
                          <tr key={result.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-center">{index + 1}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="text-sm font-medium text-gray-900">
                                {result.student.first_name} {result.student.last_name}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-semibold">{result.score.toFixed(2)}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${result.attended ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {result.attended ? (
                                  <UserCheck size={14} className="mr-1" />
                                ) : (
                                  <UserX size={14} className="mr-1" />
                                )}
                                {result.attended ? 'Qatnashgan' : 'Qatnashmagan'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminTestResults;