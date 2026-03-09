import React, { useEffect, useState } from "react";
import {
  Users,
  Calendar,
  Clock,
  UserCheck,
  BookOpen,
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  ChevronDown
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import API_URL from "../../conf/api";

export default function DirectorGroups() {
  const { t } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [groups, setGroups] = useState([]);
  const branches = [];
  const levels = [];
  const fetchGroups = async () => {
    try {
      const res = await fetch(`${API_URL}/director-panel/groups/analytics`, {
        credentials: "include"
      });
      const data = await res.json();
      console.log(data.data.groups);
      setGroups(data.data.groups);
    } catch (error) {
      console.error("Guruhlarni yuklashda xatolik:", error);
    }
  }
  useEffect(() => {
    fetchGroups();
  }, []);

  const filteredGroups = Array.isArray(groups) ? groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranch === "all" || group.branch === selectedBranch;
    const matchesLevel = selectedLevel === "all" || group.level === selectedLevel;
    return matchesSearch && matchesBranch && matchesLevel;
  }) : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Yaxshi':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'Yomon':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const getAttendanceColor = (attendance) => {
    if (attendance >= 90) return 'text-green-500';
    if (attendance >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6 dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Guruhlar
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Guruh qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">Barcha filiallar</option>
          {branches.map(branch => (
            <option key={branch} value={branch}>{branch}</option>
          ))}
        </select>
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">Barcha darajalar</option>
          {levels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      {/* Groups Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left py-3 px-4">Guruh nomi</th>
                <th className="text-left py-3 px-4">Filial</th>
                <th className="text-left py-3 px-4">O'qituvchi</th>
                <th className="text-left py-3 px-4">O'quvchilar <br /> (To'lov)</th>
                <th className="text-left py-3 px-4">Jadval</th>
                <th className="text-left py-3 px-4">Davomat</th>
                <th className="text-left py-3 px-4">Progress*</th>
                <th className="text-left py-3 px-4">Daromad</th>
                <th className="text-left py-3 px-4">Holat</th>
                <th className="text-left py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group) => (
                <tr key={group.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{group.name}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">{group.branch}</td>
                  <td className="py-3 px-4">{group.teacher}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      <span>{group.paidStudents && group.shouldPayStudents ? `${group.paidStudents}/${group.shouldPayStudents}` : `0/${group.shouldPayStudents}`}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm">{group.schedule.days}</p>
                      <p className="text-xs text-gray-500">{group.schedule.time.split("-")[0].slice(0, 5)} - {group.schedule.time.split("-")[1].slice(0, 6)}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${getAttendanceColor(group.attendance)}`}>
                      {group.attendance}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${group.progress}%` }}
                        />
                      </div>
                      <span className="text-sm">{group.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-green-600">
                    {new Intl.NumberFormat('uz-UZ').format(group.revenue)} so'm
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(group.status)}`}>
                      {group.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-sm text-gray-500 italic font-medium"><span className="font-bold">* Izoh:</span> Guruhlardagi progress (o'sish) ularning to'lov intizomi hamda davomat ko'rsatkichlariga asosan hisoblanadi.</p>
    </div>
  );
}