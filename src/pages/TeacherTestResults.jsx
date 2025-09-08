"use client";

import { useState, useEffect } from "react";
import { Plus, Pen, Trash2, Search, Calendar, BookOpen, FileText, CreditCard, LogOut, X, Users, BarChart3, UserCheck, UserX, TestTubeDiagonal } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
    scores: {}, // {student_id: score}
  });
  const [editFormData, setEditFormData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [activeMenu, setActiveMenu] = useState("test-results");

  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [testsRes, groupsRes] = await Promise.all([
        fetch(
          `${API_URL}/get_tests?month=${monthFilter}&year=${yearFilter}`,
          { credentials: "include" }
        ),
        fetch(
          `${API_URL}/get_teacher_groups`,
          { credentials: "include" }
        ),
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
    } catch (err) {
      setError("Ma'lumotlarni olishda xatolik!");
      toast.error(`Ma'lumotlarni olishda xatolik: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupStudents = async (groupId) => {
    try {
      const res = await fetch(`${API_URL}/get_one_group_students?group_id=${groupId}`, {
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
    toast(
      <div>
        <p>
          Diqqat! Ushbu testni o'chirishni xohlaysizmi?
        </p>
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
      </div>
    );
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

  const filteredTests = tests.filter((test) =>
    test.group?.group_subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchData();
  }, [monthFilter, yearFilter]);

  if (loading) return <LottieLoading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col md:flex-row">
      <TeacherSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md p-2 rounded-xl">
            <div className="flex items-center">
              <h1 className="text-2xl md:text-3xl font-bold text-white">Test natijalari</h1>
              <TestTubeDiagonal size={24} className="ml-2" />
            </div>
          </div>
          {/* Guruhlar Ro'yxati */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white p-4 rounded-xl shadow-md border border-gray-100 cursor-pointer transition-all hover:shadow-lg hover:border-blue-200"
                onClick={() => openAddModal(group)}
              >
                <h3 className="font-bold text-lg text-gray-800">{group.group_subject}</h3>
                <button className="mt-3 text-green-600 font-medium flex items-center gap-1 bg-green-100 px-2 py-1 rounded-xl">
                  <Plus size={20} />
                  Test qo'shish
                </button>
              </div>
            ))}
          </div>

          {/* Add Modal */}
          {addModal && selectedGroup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800">{selectedGroup.group_subject} - yangi test</h2>
                  <button
                    onClick={() => setAddModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="overflow-y-auto p-6">
                  <form onSubmit={addTestResults} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Test tartib raqami *</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={testFormData.test_number}
                          onChange={(e) => setTestFormData({ ...testFormData, test_number: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Test shakli *</label>
                        <select
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sanasi *</label>
                        <input
                          type="date"
                          format="dd.MM.yyyy"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={testFormData.date}
                          onChange={(e) => setTestFormData({ ...testFormData, date: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Izoh (ixtiyoriy)</label>
                        <textarea
                          className="w-full px-4 py-2.5 h-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={testFormData.note}
                          onChange={(e) => setTestFormData({ ...testFormData, note: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-5">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                        <Users size={20} />
                        O'quvchilar ballari
                      </h3>

                      <div className="overflow-x-auto max-h-60 overflow-y-auto rounded-lg border">
                        <table className="min-w-full border-collapse">
                          <thead className="bg-[#104292] sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-2 text-left text-sm font-semibold text-white border right-0 text-center">#</th>
                              <th className="px-4 py-2 text-left text-sm font-semibold text-white border right-0 text-center">Ism Familiya</th>
                              <th className="px-4 py-2 text-center text-sm font-semibold text-white border right-0 text-center">Ball</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {groupStudents.map((student, index) => (
                              <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm text-gray-600 border right-0 text-center">{index + 1}</td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-800 border right-0 text-center">
                                  {student.first_name} {student.last_name}
                                </td>
                                <td className="px-4 py-2 text-center border text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="0"
                                    className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={testFormData.scores[student.id] || ""}
                                    onChange={(e) =>
                                      setTestFormData({
                                        ...testFormData,
                                        scores: { ...testFormData.scores, [student.id]: e.target.value },
                                      })
                                    }
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                        onClick={() => setAddModal(false)}
                      >
                        Bekor qilish
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        Saqlash
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {editModal && editFormData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800">Test natijasini tahrirlash</h2>
                  <button
                    onClick={() => setEditModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="overflow-y-auto p-6">
                  <form onSubmit={editTestResult} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Test Tartib Raqami *</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={editFormData.test_number}
                          onChange={(e) => setEditFormData({ ...editFormData, test_number: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Test Shakli *</label>
                        <select
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={editFormData.date}
                          onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-5">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                        <Users size={20} />
                        O'quvchilar Ballari
                      </h3>

                      <div className="space-y-3 max-h-60 overflow-y-auto p-2">
                        {groupStudents.map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">{student.first_name} {student.last_name}</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                        onClick={() => setEditModal(false)}
                      >
                        Bekor qilish
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        Saqlash
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Test Details Modal */}
          {detailModal && selectedTest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800">Test Tafsilotlari</h2>
                  <button
                    onClick={() => setDetailModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="overflow-y-auto p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <h3 className="font-semibold text-blue-800 mb-2">Test Haqida</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">Guruh:</span> {selectedTest.group?.group_subject}</p>
                        <p><span className="font-medium">Test Raqami:</span> {selectedTest.test_number}</p>
                        <p><span className="font-medium">Test Turi:</span> {selectedTest.test_type}</p>
                        <p><span className="font-medium">Sana:</span> {new Date(selectedTest.date).toLocaleDateString("uz-UZ")}</p>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-xl">
                      <h3 className="font-semibold text-green-800 mb-2">Statistika</h3>
                      <div className="space-y-2">
                        <p className="flex items-center gap-2">
                          <Users size={16} />
                          <span>Jami o'quvchilar: {selectedTest.total_students}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <UserCheck size={16} />
                          <span>Qatnashganlar: {selectedTest.attended_students}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <UserX size={16} />
                          <span>Qatnashmaganlar: {selectedTest.total_students - selectedTest.attended_students}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <BarChart3 size={16} />
                          <span>O'rtacha ball: {selectedTest?.average_score?.toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-4">O'quvchilar Natijalari</h3>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 font-medium text-gray-700">Ism Familiya</th>
                            <th className="text-left p-3 font-medium text-gray-700">Holat</th>
                            <th className="text-left p-3 font-medium text-gray-700">Ball</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedTest.results && selectedTest.results.map((result, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="p-3">{result.student?.first_name} {result.student?.last_name}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${result.attended ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {result.attended ? 'Qatnashdi' : 'Qatnashmadi'}
                                </span>
                              </td>
                              <td className="p-3 font-medium">{result.attended ? result.score : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                  <button
                    className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                    onClick={() => setDetailModal(false)}
                  >
                    Yopish
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-1/2">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Guruh qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
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
          </div>

          {/* Tests List */}
          {filteredTests.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="text-gray-400" size={40} />
              </div>
              <p className="text-gray-500 text-lg">Ushbu oy uchun test natijalari topilmadi</p>
              <p className="text-gray-400 mt-1">Yangi test qo'shish uchun yuqoridagi guruhlardan birini tanlang</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto rounded-xl shadow-sm border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-50 text-left text-gray-700">
                      <th className="px-6 py-4 font-semibold">#</th>
                      <th className="px-6 py-4 font-semibold">Guruh</th>
                      <th className="px-6 py-4 font-semibold">Test Raqami</th>
                      <th className="px-6 py-4 font-semibold">Test Turi</th>
                      <th className="px-6 py-4 font-semibold">O'rtacha Ball</th>
                      <th className="px-6 py-4 font-semibold">Sana</th>
                      <th className="px-6 py-4 font-semibold text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTests.map((test, index) => (
                      <tr
                        key={test.id}
                        className="border-b border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => fetchTestDetails(test.id)}
                      >
                        <td className="px-6 py-4">{index + 1}</td>
                        <td className="px-6 py-4 font-medium">{test.group?.group_subject}</td>
                        <td className="px-6 py-4">{test.test_number}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${test.test_type === 'Yozma' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {test.test_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold">{test.average_score.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4">{new Date(test.date).toLocaleDateString("ru-RU")}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-end">
                            <button
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(test);
                              }}
                            >
                              <Pen size={16} />
                            </button>
                            <button
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                showDeleteToast(test.id);
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="grid gap-4 md:hidden">
                {filteredTests.map((test, index) => (
                  <div
                    key={test.id}
                    className="bg-white shadow rounded-xl p-5 border border-gray-100 transition-all hover:shadow-md cursor-pointer"
                    onClick={() => fetchTestDetails(test.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg text-gray-800">{test.group?.group_subject}</p>
                        <p className="text-sm text-gray-600 mt-1">Test #{test.test_number}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {test.average_score.toFixed(2)} ball
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Turi:</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${test.test_type === 'Yozma' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {test.test_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Sana:</span>
                        <span>{new Date(test.date).toLocaleDateString("ru-RU")}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        className="flex-1 flex items-center justify-center gap-1 text-blue-600 font-medium py-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(test);
                        }}
                      >
                        <Pen size={16} />
                        Tahrirlash
                      </button>
                      <button
                        className="flex-1 flex items-center justify-center gap-1 text-red-600 font-medium py-2 rounded-xl bg-red-50 hover:bg-red-100 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          showDeleteToast(test.id);
                        }}
                      >
                        <Trash2 size={16} />
                        O'chirish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Footer */}
          <footer className="text-center text-gray-500 text-sm mt-10">
            <p>
              © {new Date().getFullYear()} "Intellectual Progress Star" o'quv markazi <br /> Ustoz paneli
            </p>
          </footer>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-3 z-40">
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
              navigate("/teacher/login");
            }}
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