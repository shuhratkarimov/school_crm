"use client";

import { useState, useEffect } from "react";
import { Trash2, Pen, Trophy, Plus, X, Award, Calendar, User, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import LottieLoading from "../components/Loading";

function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState("students");
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAchievements, setFilteredAchievements] = useState([]);
  const [formData, setFormData] = useState({
    entity_id: "",
    achievement_title: "",
    description: "",
    date: "",
  });

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/get_achievements`);
      if (!response.ok) throw new Error("Yutuqlar ma'lumotlarini olishda xatolik!");
      if (response.status === 200) {
        console.log(response);
        let data = await response.json();
        data = data.length ? data : [];
        setAchievements(data);
        setFilteredAchievements(data);
      }
    } catch (error) {
      toast.error("Yutuqlar ma'lumotlarini olishda xatolik yuz berdi!");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/get_students`);
      let data = await response.json();
      if (!response.ok) {
        toast.error("O'quvchilar ma'lumotlarini olishda xatolik yuz berdi!");
        throw new Error("O'quvchilar ma'lumotlarini olishda xatolik!");
      }
      if (response.status === 200) {
        data = data.length ? data : [];
        setStudents(data);
      }
    } catch (error) {
      toast.error("O'quvchilar ma'lumotlarini olishda xatolik yuz berdi!");
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/get_teachers`);
      let data = await response.json();
      if (!response.ok) {
        toast.error("Ustozlar ma'lumotlarini olishda xatolik yuz berdi!");
        throw new Error("Ustozlar ma'lumotlarini olishda xatolik!");
      }
      if (response.status === 200) {
        data = data.length ? data : [];
        setTeachers(data);
      }
    } catch (error) {
      toast.error("Ustozlar ma'lumotlarini olishda xatolik yuz berdi!");
    }
  };

  useEffect(() => {
    fetchAchievements();
    fetchStudents();
    fetchTeachers();
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredAchievements(achievements);
      return;
    }
    
    const filtered = achievements.filter(ach => {
      const entity = ach.achiever_type === "student" 
        ? students.find(s => s.id === ach.achiever_id) 
        : teachers.find(t => t.id === ach.achiever_id);
      
      if (!entity) return false;
      
      const entityName = `${entity.first_name} ${entity.last_name}`.toLowerCase();
      const achievementTitle = ach.achievement_title.toLowerCase();
      const description = ach.description.toLowerCase();
      const searchLower = term.toLowerCase();
      
      return entityName.includes(searchLower) || 
             achievementTitle.includes(searchLower) || 
             description.includes(searchLower);
    });
    
    setFilteredAchievements(filtered);
  };

  useEffect(() => {
    handleSearch(searchTerm);
  }, [achievements, students, teachers, searchTerm]);

  const addAchievement = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/create_achievement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          type: selectedType,
        }),
      });
      if (!response.ok) {
        toast.error("Yutuq qo'shishda xatolik yuz berdi!");
        throw new Error("Yutuq qo'shishda xatolik!");
      }
      await fetchAchievements();
      setAddModal(false);
      setFormData({
        entity_id: "",
        achievement_title: "",
        description: "",
        date: "",
      });
      toast.success("Yutuq muvaffaqiyatli qo'shildi!");
    } catch (error) {
      toast.error("Yutuq qo'shishda xatolik yuz berdi!");
    }
  };

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>
          Diqqat! Ushbu yutuqqa tegishli barcha ma'lumotlar o'chiriladi!
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
              deleteAchievement(id);
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

  const updateAchievement = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/update_achievement/${selectedAchievement.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity_id: formData.entity_id,
            type: selectedType,
            achievement_title: formData.achievement_title,
            description: formData.description,
            date: formData.date,
          }),          
        }
      );
  
      if (!response.ok) {
        toast.error("Yutuq yangilashda xatolik yuz berdi!");
        throw new Error("Yutuq yangilashda xatolik!");
      }
  
      await fetchAchievements();
      setEditModal(false);
      toast.success("Yutuq muvaffaqiyatli yangilandi!");
    } catch (error) {
      toast.error("Yutuq yangilashda xatolik yuz berdi!");
    }
  };

  const deleteAchievement = async (id) => {    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/delete_achievement/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Yutuq o'chirishda xatolik!");
      await fetchAchievements();
      toast.success("Yutuq muvaffaqiyatli o'chirildi!");
    } catch (error) {
      toast.error("Yutuq o'chirishda xatolik yuz berdi!");
    }
  };

  const groupedAchievements = filteredAchievements?.reduce((acc, ach) => {
    const entity = ach.achiever_type === "student" 
      ? students.find(s => s.id === ach.achiever_id) 
      : teachers.find(t => t.id === ach.achiever_id);
    
    if (entity) {
      if (!acc[entity.id]) {
        acc[entity.id] = { entity, achievements: [] };
      }
      acc[entity.id].achievements.push(ach);
    }
    return acc;
  }, {});

  const sortedEntities = Object.values(groupedAchievements).sort((a, b) => b.achievements?.length - a.achievements?.length);

  if (loading) return <LottieLoading />;

  return (
    <div className="bg-gray-50 min-h-screen dark:bg-gray-900">
      {/* Sarlavha va qo'shish tugmasi */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div>
            <Trophy size={24} className="text-[#104292]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Yutuqlar</h1>
          </div>
        </div>
        
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
          onClick={() => setAddModal(true)}
        >
          <Plus size={20} />
          Yutuq qo'shish
        </button>
      </div>

      <div className="mb-6 relative">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Yutuq yoki ism bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-gray-700"
          />
        </div>
      </div>

      {/* Tur selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Yutuq turi</label>
        <div className="flex bg-gray-100 p-1 rounded-lg dark:bg-gray-800 w-fit">
          <button
            className={`px-4 py-2 rounded-md transition-colors ${selectedType === "students" ? "bg-white shadow-sm dark:bg-gray-700" : "text-gray-500 dark:text-gray-400"}`}
            onClick={() => setSelectedType("students")}
          >
            O'quvchilar yutuqlari
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors ${selectedType === "teachers" ? "bg-white shadow-sm dark:bg-gray-700" : "text-gray-500 dark:text-gray-400"}`}
            onClick={() => setSelectedType("teachers")}
          >
            Ustozlar yutuqlari
          </button>
        </div>
      </div>

      {/* Yutuqlar ro'yxati */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedEntities.filter(({ entity }) => {
          // Ensure we're filtering by the correct type
          const isStudent = students.some(s => s.id === entity.id);
          return selectedType === "students" ? isStudent : !isStudent;
        }).map(({ entity, achievements }) => (
          <div key={entity.id} className="bg-white rounded-xl shadow-sm p-6 dark:bg-gray-800">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {entity.first_name?.charAt(0)}{entity.last_name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {entity.first_name} {entity.last_name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <Award size={16} className="text-amber-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {achievements?.length} ta yutuq
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid gap-3">
              {achievements?.map(ach => (
                <div key={ach.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-r">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white">{ach.achievement_title}</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{ach.description}</p>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mt-2">
                        <Calendar size={14} />
                        {new Date(ach.date).toLocaleDateString('uz-UZ')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedAchievement(ach);
                          setFormData({
                            entity_id: ach.achiever_id,
                            achievement_title: ach.achievement_title,
                            description: ach.description,
                            date: ach.date.split('T')[0],
                            achiever_type: ach.achiever_type,
                          });                          
                          setEditModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors dark:text-blue-400 dark:hover:bg-blue-900/30"
                        title="Tahrirlash"
                      >
                        <Pen size={16} />
                      </button>
                      <button
                        onClick={() => showDeleteToast(ach.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors dark:text-red-400 dark:hover:bg-red-900/30"
                        title="O'chirish"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {sortedEntities.filter(({ entity }) => {
          const isStudent = students.some(s => s.id === entity.id);
          return selectedType === "students" ? isStudent : !isStudent;
        }).length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm dark:bg-gray-800">
            <Award size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Hozircha hech qanday yutuq mavjud emas</h3>
            <p className="text-gray-400 dark:text-gray-500 mt-1">Yutuq qo'shish uchun yuqoridagi tugmadan foydalaning</p>
          </div>
        )}
      </div>

      {/* Yutuq qo'shish modali */}
      {addModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-scale-in">
            <button
              onClick={() => {
                setAddModal(false);
                setFormData({
                  entity_id: "",
                  achievement_title: "",
                  description: "",
                  date: "",
                  achiever_type: "",
                  achiever_id: "",
                });
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X size={24} />
            </button>

            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Yangi yutuq qo'shish</h2>
            
            <form onSubmit={addAchievement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {selectedType === "students" ? "O'quvchi" : "Ustoz"}
                </label>
                <select
                  value={formData.entity_id}
                  onChange={(e) => setFormData({ ...formData, entity_id: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  required
                >
                  <option value="">Tanlang</option>
                  {selectedType === "students" 
                    ? students?.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>) 
                    : teachers?.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)
                  }
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Yutuq nomi</label>
                <input
                  type="text"
                  value={formData.achievement_title}
                  onChange={(e) => setFormData({ ...formData, achievement_title: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="Yutuq nomi"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tavsif</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="Yutuq haqida batafsil"
                  rows="3"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sana</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => {
                    setAddModal(false);
                    setFormData({
                      entity_id: "",
                      achievement_title: "",
                      description: "",
                      date: "",
                    });
                  }}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium rounded-lg"
                >
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yutuqni tahrirlash modali */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-scale-in">
            <button
              onClick={() => setEditModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X size={24} />
            </button>

            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Yutuqni tahrirlash</h2>
            
            <form onSubmit={updateAchievement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Yutuq nomi</label>
                <input
                  type="text"
                  value={formData.achievement_title}
                  onChange={(e) => setFormData({ ...formData, achievement_title: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="Yutuq nomi"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tavsif</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="Yutuq haqida batafsil"
                  rows="3"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sana</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setEditModal(false)}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium rounded-lg"
                >
                  Yangilash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Achievements;