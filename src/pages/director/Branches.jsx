import React, { useEffect, useState } from "react";
import {
  MapPin,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  MoreVertical,
  Search,
  Filter,
  Download,
  Plus,
  Star,
  Award,
  PieChart,
  Home,
  Phone,
  Mail,
  Clock,
  CalendarDays,
  UserCircle,
  BookOpen,
  GraduationCap,
  DoorOpen,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Grid3X3,
  LayoutList,
  RefreshCw,
  Loader2,
  X,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import API_URL from "../../conf/api";
import { useMemo } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function Branches() {
  const { t, darkMode } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [filterStatus, setFilterStatus] = useState("all");

  const [branches, setBranches] = useState({
    branches: [],
    summary: {},
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${API_URL}/director-panel/dashboard/branches`, {
        credentials: "include"
      });
      const data = await res.json();
      setBranches(data.data);
    } catch (error) {
      console.error("Filiallarni yuklashda xatolik:", error);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('uz-UZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + " so'm";
  };

  const formatShortMoney = (amount) => {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + " mln";
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + " ming";
    }
    return amount.toString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'good': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return null;
    }
  };

  const filteredBranches = (branches?.branches || [])
    .filter((branch) => {
      // Search filter
      const matchesSearch =
        (branch.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (branch.address || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (branch.manager?.username || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "all" || branch.status === filterStatus;

      return matchesSearch && matchesStatus;
    });

  const sortedBranches = [...filteredBranches].sort((a, b) => {
    if (a.isTheBest) return -1;
    if (b.isTheBest) return 1;
    if (a.isTheWorst) return 1;
    if (b.isTheWorst) return -1;
    return 0;
  });

  const SummaryCards = () => {
    const summary = branches.summary || {};

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 dark:text-white">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Jami filiallar</p>
              <p className="text-2xl font-bold mt-1">{summary.totalBranches || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Home className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Jami o'quvchilar</p>
              <p className="text-2xl font-bold mt-1">{summary.totalStudents || 0}</p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-full">
              <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Xonalar bandligi: {summary.avgOccupancy || 0}%
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Jami daromad</p>
              <p className="text-2xl font-bold mt-1">{formatShortMoney(summary.totalRevenue || 0)}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Jami qarzlar</p>
              <p className="text-2xl font-bold mt-1">{formatShortMoney(summary.totalDebt || 0)}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
              <CreditCard className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const BestBranchBanner = ({ branch }) => {
    if (!branch) return null;

    return (
      <div className="mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
            <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Oyning eng yaxshi filiali *
            </p>
            <p className="text-lg font-bold text-amber-900 dark:text-amber-200">
              {branch.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-amber-700 dark:text-amber-400">Reyting ball</p>
            <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">
              {branch.score ? `${branch.score}/10` : 0}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const WorstBranchBanner = ({ branch }) => {
    if (!branch) return null;

    return (
      <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              E'tibor talab qiladigan filial *
            </p>
            <p className="text-lg font-bold text-red-900 dark:text-red-200">
              {branch.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-red-700 dark:text-red-400">Reyting ball</p>
            <p className="text-2xl font-bold text-red-800 dark:text-red-300">
              {branch.score ? `${branch.score}/10` : 0}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const BranchCard = ({ branch, isBest, isWorst }) => {
    return (
      <div
        className={`group bg-white dark:text-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border ${isBest
          ? 'border-amber-300 dark:border-amber-700 ring-2 ring-amber-200 dark:ring-amber-800'
          : 'border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
          } overflow-hidden`}
      >

        {/* Header with gradient */}
        <div className={`p-5 ${isBest
          ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20'
          : ''
          }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${branch.status === 'excellent' ? 'bg-emerald-100 dark:bg-emerald-900/20' :
                branch.status === 'good' ? 'bg-blue-100 dark:bg-blue-900/20' :
                  'bg-amber-100 dark:bg-amber-900/20'
                }`}>
                {getStatusIcon(branch.status)}
              </div>
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  {branch.name}
                  {branch.growth > 0 && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                      +{branch.growth}%
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1 dark:text-gray-400">
                  <MapPin size={14} className="shrink-0" />
                  <span className="truncate">{branch.address}</span>
                </p>
              </div>
            </div>
            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Manager Info */}
        <div className="px-5 py-3 bg-gray-50/50 dark:bg-gray-700/30 border-y border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <UserCircle size={18} className="text-gray-400" />
            <span className="text-sm font-medium">{branch.manager?.username || "Menejer"}</span>
            <span className="text-xs text-gray-500">• {branch.phone}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-5 dark:text-white">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Users size={12} /> O'quvchilar
              </p>
              <p className="text-lg font-bold">{branch.students || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <GraduationCap size={12} /> O'qituvchilar
              </p>
              <p className="text-lg font-bold">{branch.teachers || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <BookOpen size={12} /> Guruhlar
              </p>
              <p className="text-lg font-bold">{branch.branchGroups?.length || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <DoorOpen size={12} /> Xonalar
              </p>
              <p className="text-lg font-bold">
                {branch.roomStats?.busyRooms || 0}/{branch.roomStats?.totalRooms || 0}
              </p>
            </div>
          </div>

          {/* Revenue and Debt */}
          <div className="space-y-2.5 mb-4">
            <div className="flex justify-between items-center p-2 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Daromad:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatMoney(branch.revenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-red-50/50 dark:bg-red-900/10 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Qarz:</span>
              <span className="font-bold text-red-500">
                {formatMoney(branch.debt || 0)}
              </span>
            </div>
          </div>

          {/* Occupancy Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-600 dark:text-gray-400">Bandlik</span>
              <span className="font-semibold">{branch.occupancy || 0}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${branch.occupancy > 90 ? 'bg-emerald-500' :
                  branch.occupancy > 70 ? 'bg-blue-500' :
                    branch.occupancy > 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                style={{ width: `${branch.occupancy || 0}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
            <div className="flex items-center gap-2">
              {isBest && (
                <div className="px-2 py-1 bg-amber-400 text-white text-xs font-bold rounded-full flex items-center gap-1">
                  <Star size={12} />
                  <span>ENG YAXSHI</span>
                </div>
              )}

              {isWorst && (
                <div className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>ENG YOMON</span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setSelectedBranch(branch);
                setShowBranchModal(true);
              }}
              className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 font-medium group"
            >
              <Eye size={16} />
              <span>Batafsil</span>
              <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const BranchListItem = ({ branch, isBest, isWorst }) => {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border ${isBest ? 'border-amber-300 dark:border-amber-700' : 'border-gray-100 dark:border-gray-700'
        } p-4`}>
        <div className="flex items-center gap-4">
          {isBest && (
            <div className="shrink-0">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          )}
          {isWorst && (
            <div className="shrink-0">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          )}

          <div className="flex-1 grid grid-cols-12 gap-4 items-center">
            <div className="col-span-3">
              <h3 className="font-semibold flex items-center gap-2">
                {branch.name}
                {branch.isTheBest && (
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                    Eng yaxshi
                  </span>
                )}

                {branch.isTheWorst && (
                  <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                    Eng yomon
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500 truncate">{branch.address}</p>
            </div>

            <div className="col-span-2">
              <p className="text-sm text-gray-500">Menejer</p>
              <p className="font-medium">{branch.manager?.username}</p>
            </div>

            <div className="col-span-1">
              <p className="text-sm text-gray-500">O'quvchilar</p>
              <p className="font-semibold">{branch.students}</p>
            </div>

            <div className="col-span-1">
              <p className="text-sm text-gray-500">Daromad</p>
              <p className="font-semibold text-emerald-600">{formatShortMoney(branch.revenue)}</p>
            </div>

            <div className="col-span-1">
              <p className="text-sm text-gray-500">Bandlik</p>
              <p className="font-semibold">{branch.occupancy}%</p>
            </div>

            <div className="col-span-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedBranch(branch);
                  setShowBranchModal(true);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <Eye size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Filiallar
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Barcha filiallar bo'yicha umumiy ma'lumotlar
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {branches.summary?.bestBranch && (
          <BestBranchBanner branch={branches.summary.bestBranch} />
        )}

        {branches.summary?.worstBranch && (
          <WorstBranchBanner branch={branches.summary.worstBranch} />
        )}
      </div>
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Filial nomi, manzili yoki menejer bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-xl text-black dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border rounded-xl dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Barcha filiallar</option>
            <option value="excellent">A'lo</option>
            <option value="good">Yaxshi</option>
            <option value="warning">Diqqat talab</option>
          </select>
          <div className="flex bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 ${viewMode === "grid" ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-500'}`}
            >
              <Grid3X3 size={20} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-3 ${viewMode === "list" ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-500'}`}
            >
              <LayoutList size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {filteredBranches.length} ta filial topildi
        </p>
      </div>

      {/* Branches Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedBranches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              isBest={branch.isTheBest}
              isWorst={branch.isTheWorst}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3 dark:text-white">
          {sortedBranches.map((branch) => (
            <BranchListItem
              key={branch.id}
              branch={branch}
              isBest={branch.isTheBest}
              isWorst={branch.isTheWorst}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredBranches.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <Search size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">Filial topilmadi</h3>
          <p className="text-gray-500">
            Qidiruv so'roviga mos keladigan filial mavjud emas
          </p>
        </div>
      )}

      {/* Branch Details Modal */}
      {showBranchModal && selectedBranch && (
        <BranchDetailsModal
          branch={selectedBranch}
          onClose={() => setShowBranchModal(false)}
        />
      )}
      <p className="text-gray-500 dark:text-gray-400 text-sm italic">
        * <span className="font-bold text-black dark:text-white">Eslatma:</span> Filiallarni baholashda ularning moliyaviy tushumi, o'quvchilar va ustozlar soni o'sishi, qarz miqdori kamligi va xonalar bandligi ko'rsatkichlariga qarab hisoblanadi.
      </p>
    </div>
  );
}

function BranchDetailsModal({ branch, onClose }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);

  const tabs = [
    { id: "overview", label: "Umumiy", icon: <Home size={18} /> },
    { id: "teachers", label: "O'qituvchilar", icon: <GraduationCap size={18} /> },
    { id: "finance", label: "Moliya", icon: <DollarSign size={18} /> },
  ];

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("uz-UZ").format(Number(amount || 0)) + " so'm";
  };

  useEffect(() => {
    let isMounted = true;

    const fetchBranchDetails = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_URL}/director-panel/branches/full-analytics`, {
          credentials: "include",
        });

        const data = await res.json();
        const allBranches = data?.data?.branches ?? [];
        const foundBranch = allBranches.find(
          (item) => item.id === branch?.id
        );

        if (isMounted) {
          setDetails(foundBranch ?? null);
        }
      } catch (error) {
        console.error("Branch details fetch error:", error);
        if (isMounted) setDetails(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (branch?.id) {
      fetchBranchDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [branch?.id]);

  const branchTeachers = details?.branchTeachers || [];
  const branchRevenue = Array.isArray(details?.branchRevenue)
    ? details.branchRevenue
    : [];

  const maxRevenue = Math.max(
    ...branchRevenue.map((item) => Number(item.amount || 0)),
    0
  );

  const revenueChartData = useMemo(() => {
    return branchRevenue.map((item) => ({
      key: item.key,
      month: item.month,
      shortMonth: item.month?.slice(0, 3),
      amount: Number(item.amount || 0),
    }));
  }, [branchRevenue]);

  function RevenueTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    const value = payload[0]?.value ?? 0;

    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg px-3 py-2">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          {new Intl.NumberFormat("uz-UZ").format(value)} so'm
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 dark:text-white">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            {branch.isTheBest && (
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
                {branch.name}
                {branch.isTheBest && (
                  <span className="text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full">
                    Eng yaxshi filial
                  </span>
                )}
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                <MapPin size={14} />
                {branch.address || "Manzil kiritilmagan"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors dark:text-white"
          >
            <XCircle size={20} className="text-gray-500 dark:text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto shrink-0">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-white dark:bg-gray-800">
          {loading ? (
            <div className="h-72 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p>Filial ma'lumotlari yuklanmoqda...</p>
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <p className="text-sm text-gray-500">Reyting ball</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {branch.score ? `${branch.score}/10` : "0/10"}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <p className="text-sm text-gray-500">O'sish</p>
                      <p
                        className={`text-2xl font-bold ${Number(branch.growth || 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                          }`}
                      >
                        {Number(branch.growth || 0) >= 0 ? "+" : ""}
                        {branch.growth || 0}%
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <p className="text-sm text-gray-500">Holat</p>
                      <p className="text-lg font-semibold capitalize">
                        {branch.status || "Noma'lum"}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <p className="text-sm text-gray-500">Bandlik</p>
                      <p className="text-2xl font-bold">{branch.occupancy || 0}%</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Aloqa ma'lumotlari</h3>
                      <div className="space-y-3">
                        <InfoItem
                          icon={<Phone size={18} />}
                          label="Telefon"
                          value={branch.phone || "Mavjud emas"}
                        />
                        <InfoItem
                          icon={<Mail size={18} />}
                          label="Email"
                          value={branch.manager?.email || "Mavjud emas"}
                        />
                        <InfoItem
                          icon={<UserCircle size={18} />}
                          label="Menejer"
                          value={branch.manager?.username || "Biriktirilmagan"}
                        />
                        <InfoItem
                          icon={<CalendarDays size={18} />}
                          label="Tashkil etilgan"
                          value={
                            branch.created_at
                              ? new Date(branch.created_at).toLocaleDateString("ru-RU")
                              : "Noma'lum"
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Filial statistikasi</h3>
                      <div className="space-y-3">
                        <InfoItem
                          icon={<Users size={18} />}
                          label="Jami o'quvchilar"
                          value={details?.counts?.students ?? branch.students ?? 0}
                        />
                        <InfoItem
                          icon={<GraduationCap size={18} />}
                          label="Jami o'qituvchilar"
                          value={details?.counts?.teachers ?? branch.teachers ?? 0}
                        />
                        <InfoItem
                          icon={<BookOpen size={18} />}
                          label="Faol guruhlar"
                          value={branch.branchGroups?.length || 0}
                        />
                        <InfoItem
                          icon={<DoorOpen size={18} />}
                          label="Xonalar"
                          value={
                            details?.counts?.rooms ??
                            `${branch.roomStats?.busyRooms || 0}/${branch.roomStats?.totalRooms || 0}`
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "finance" && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                          Jami daromad
                        </p>
                      </div>

                      <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                        {formatMoney(branch.revenue || 0)}
                      </p>

                      <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
                        O'tgan oy: {formatMoney(branch.prevRevenue || 0)}
                      </p>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Jami qarzlar
                        </p>
                      </div>

                      <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                        {formatMoney(branch.debt || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <h3 className="font-semibold mb-4">Oxirgi 12 oylik daromad</h3>

                    <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Oxirgi 12 oylik daromad</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          12 oy kesimida
                        </span>
                      </div>

                      {revenueChartData.length > 0 ? (
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="shortMonth"
                                tick={{ fontSize: 12 }}
                              />
                              <YAxis
                                tickFormatter={(value) =>
                                  value >= 1000000
                                    ? `${(value / 1000000).toFixed(1)}M`
                                    : value >= 1000
                                      ? `${(value / 1000).toFixed(0)}k`
                                      : value
                                }
                                tick={{ fontSize: 12 }}
                                width={50}
                              />
                              <Tooltip content={<RevenueTooltip />} />
                              <Line
                                type="monotone"
                                dataKey="amount"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-40 flex items-center justify-center text-gray-500 dark:text-gray-400">
                          Daromad ma'lumotlari topilmadi
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "teachers" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">O'qituvchilar ro'yxati</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Jami: {branchTeachers.length}
                    </span>
                  </div>

                  {branchTeachers.length > 0 ? (
                    <div className="space-y-3">
                      {branchTeachers.map((teacher) => (
                        <div
                          key={teacher.id}
                          className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {teacher.first_name} {teacher.last_name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Telefon: {teacher.phone_number || teacher.phone || "Mavjud emas"}
                              </p>
                            </div>

                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Fan: {teacher.subject}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                      O'qituvchilar topilmadi
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40">
      <div className="text-blue-600 dark:text-blue-400">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-medium text-gray-900 dark:text-white">
          {value ?? "Mavjud emas"}
        </p>
      </div>
    </div>
  );
}