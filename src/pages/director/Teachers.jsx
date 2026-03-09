import React, { useState } from "react";
import {
  User,
  Star,
  BookOpen,
  Users,
  Clock,
  TrendingUp,
  Award,
  Mail,
  Phone,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  MessageCircle,
  BarChart2
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { useEffect } from "react";
import API_URL from "../../conf/api";

export default function DirectorTeachers() {
  const { t } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterSpecialty, setFilterSpecialty] = useState("all");
  const [teachers, setTeachers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [specialties, setSpecialties] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/director-panel/teachers/analytics`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(res => {
        setTeachers(res.data.teachers || []);
        setBranches(res.data.branches || []);
        setSpecialties(res.data.specialties || []);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();

    if (searchTerm) params.append("search", searchTerm);
    if (filterBranch !== "all") params.append("branchId", filterBranch);
    if (filterSpecialty !== "all") params.append("specialty", filterSpecialty);

    fetch(`${API_URL}/director-panel/teachers/analytics?${params.toString()}`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(res => {
        console.log(res.data);
        setTeachers(res.data.teachers || []);
      })
      .catch(err => console.error(err));
  }, [searchTerm, filterBranch, filterSpecialty]);

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = filterBranch === "all" || teacher.branch === filterBranch;
    const matchesSpecialty = filterSpecialty === "all" || teacher.specialty === filterSpecialty;
    return matchesSearch && matchesBranch && matchesSpecialty;
  });

  const getStatusColor = (status) => {
    return status === 'active'
      ? 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
      : 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
  };

  const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={
              i < fullStars
                ? "text-yellow-400 fill-yellow-400"
                : i === fullStars && hasHalfStar
                  ? "text-yellow-400 fill-yellow-400 opacity-50"
                  : "text-gray-300"
            }
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating} *</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          O'qituvchilar faoliyati
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Jami o'qituvchilar</p>
          <p className="text-2xl font-bold">{teachers.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">O'rtacha reyting</p>
          <p className="text-2xl font-bold text-yellow-500">
            {isNaN(teachers.reduce((sum, t) => sum + t.rating, 0) / teachers.length) ? 0 : (teachers.reduce((sum, t) => sum + t.rating, 0) / teachers.length).toFixed(1)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">O'rtacha davomat</p>
          <p className="text-2xl font-bold text-green-500">
            {isNaN(teachers.reduce((sum, t) => sum + t.attendance, 0) / teachers.length) ? 0 : (teachers.reduce((sum, t) => sum + t.attendance, 0) / teachers.length).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">Jami o'quvchilar</p>
          <p className="text-2xl font-bold">
            {teachers.reduce((sum, t) => sum + t.students, 0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="O'qituvchi qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">Barcha filiallar</option>
          {branches.map(branch => (
            <option key={branch} value={branch}>{branch}</option>
          ))}
        </select>
        <select
          value={filterSpecialty}
          onChange={(e) => setFilterSpecialty(e.target.value)}
          className="px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">Barcha yo'nalishlar</option>
          {specialties.map(specialty => (
            <option key={specialty} value={specialty}>{specialty}</option>
          ))}
        </select>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTeachers.map((teacher) => (
          <div
            key={teacher.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {teacher.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold">{teacher.name}</h3>
                  <p className="text-sm text-gray-500">{teacher.specialty}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(teacher.status)}`}>
                {teacher.status === 'active' ? 'Faol' : 'Diqqat'}
              </span>
            </div>

            {/* Rating and Experience */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                {getRatingStars(teacher.rating)}
                {/* <p className="text-xs text-gray-500 mt-1">{teacher.experience} yil tajriba</p> */}
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600">{teacher.attendance}%</p>
                <p className="text-xs text-gray-500">davomat</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Guruhlar</p>
                <p className="text-lg font-semibold">{teacher.groups}</p>
              </div>

              <div className="min-w-0">
                <p className="text-xs text-gray-500">O'quvchilar</p>
                <p className="text-lg font-semibold">{teacher.students}</p>
              </div>

              <div className="min-w-0">
                <p className="text-xs text-gray-500">Balans</p>
                <p className="text-lg font-semibold text-blue-500 whitespace-nowrap overflow-hidden text-ellipsis">
                  {new Intl.NumberFormat("uz-UZ").format(teacher.balance)}
                  <span className="text-xs text-gray-500"> so'm</span>
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Darslar (tugatilgan/joriy oy)</span>
                <span className="font-medium">{teacher.completedLessons}/{teacher.totalLessons}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-500 rounded-full"
                  style={{ width: `${(teacher.completedLessons / teacher.totalLessons) * 100}%` }}
                />
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar size={14} />
                <span>{teacher.schedule}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock size={14} />
                <span>Keyingi dars: {teacher.nextClass}</span>
              </div>
            </div>

            {/* Qualifications */}
            <div className="flex flex-wrap gap-2 mb-4">
              {teacher.qualifications.map((qual, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs"
                >
                  {qual}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-500 italic"><span className="font-bold">* Izoh:</span> Ustozlarning reytingi ular dars berayotgan guruhlar davomati hamda o'tgan darslariga ko'ra hisoblanadi.</p>
    </div>
  );
}