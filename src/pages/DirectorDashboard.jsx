import React, { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  BookOpen,
  TrendingUp,
  Calendar,
  Clock,
  Bell,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import API_URL from "../conf/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// pul format
const formatMoneyShort = (value) => {
  const n = Number(value || 0);
  // 1 200 000 -> 1.2M, 900 000 -> 900K kabi
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} mlrd`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} mln`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;

  return (
    <div className="rounded-lg bg-gray-900 text-white px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold">{label}</div>
      <div className="mt-1 opacity-90">{new Intl.NumberFormat("uz-UZ").format(value)} so'm</div>
    </div>
  );
};

export default function DirectorDashboard() {
  const { t, darkMode } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsRes, revRes, brRes, actRes] = await Promise.all([
          fetch(`${API_URL}/director-panel/dashboard/stats`, { credentials: "include" }),
          fetch(`${API_URL}/director-panel/dashboard/revenue`, { credentials: "include" }),
          fetch(`${API_URL}/director-panel/dashboard/branches`, { credentials: "include" }),
          // fetch(`${API_URL}/director-panel/dashboard/activities`, { credentials: "include" }),
        ]);

        const statsData = await statsRes.json();
        const revData = await revRes.json();
        const brData = await brRes.json();

        if (statsRes.ok) setStats(statsData.data);
        if (revRes.ok) setRevenueData(revData.data);
        if (brRes.ok) setBranchPerformance(brData.data);
      } catch (error) {
        throw new Error(error)
      }
    }
    fetchDashboardData()
  }, [])


  const [revenueData, setRevenueData] = useState([]);

  const [branchPerformance, setBranchPerformance] = useState({
    branches: [],
    summary: {},
  });

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, type: "payment", message: "Yangi to'lov qilindi: 1,200,000 so'm", time: "5 min oldin", user: "Ali Valiyev" },
    { id: 2, type: "student", message: "Yangi o'quvchi qo'shildi", time: "15 min oldin", user: "Zebo Karimova" },
    { id: 3, type: "debt", message: "Qarz muddati tugadi", time: "1 soat oldin", user: "Jasur Aliyev" },
    { id: 4, type: "attendance", message: "Davomat 95% dan yuqori", time: "2 soat oldin", user: "IELTS 6.5" },
    { id: 5, type: "teacher", message: "Yangi o'qituvchi tayinlandi", time: "3 soat oldin", user: "John Doe" }
  ]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'good': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Boshqaruv paneli
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title="Jami o'quvchilar"
          value={stats.totalStudents ? stats.totalStudents : 0}
          change={stats.monthlyGrowth ? stats.monthlyGrowth : 0}
          color="blue"
          iconBg="bg-blue-100 dark:bg-blue-900/20"
        />
        <StatCard
          icon={<BookOpen className="w-6 h-6" />}
          title="Faol guruhlar"
          value={stats.totalGroups ? stats.totalGroups : 0}
          subValue={`${stats.totalTeachers ? stats.totalTeachers : 0} o'qituvchi`}
          change={stats.prevMonthGroupsGrowth ? stats.prevMonthGroupsGrowth : 0}
          color="green"
          iconBg="bg-green-100 dark:bg-green-900/20"
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          title="Jami daromad"
          value={formatMoney(stats.totalRevenue ? stats.totalRevenue : 0)}
          change={stats.prevMonthGrowth ? stats.prevMonthGrowth : 0}
          color="purple"
          iconBg="bg-purple-100 dark:bg-purple-900/20"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Qarz miqdori"
          value={formatMoney(stats.debtAmount ? stats.debtAmount : 0)}
          change={stats.prevMonthDebtGrowth ? stats.prevMonthDebtGrowth : 0}
          color="red"
          iconBg="bg-red-100 dark:bg-red-900/20"
          negative
        />
      </div>

      {/* Revenue Chart and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Oylik daromad dinamikasi
            </h2>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatMoneyShort}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* pastki kichik info */}
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>So‘nggi 12 oy</span>
            <span>
              Jami:{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {formatMoney(revenueData.reduce((sum, x) => sum + (x.amount || 0), 0))}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Branch Performance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 dark:text-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Filiallar faoliyati</h2>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Eng yaxshi: {branchPerformance?.summary?.bestBranch?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">Eng yomon: {branchPerformance?.summary?.worstBranch?.name}</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4">Filial</th>
                <th className="text-left py-3 px-4">O'quvchilar</th>
                <th className="text-left py-3 px-4">O'qituvchilar</th>
                <th className="text-left py-3 px-4">Daromad</th>
                <th className="text-left py-3 px-4">Bandlik</th>
                <th className="text-left py-3 px-4">Qarz</th>
                <th className="text-left py-3 px-4">O'sish</th>
                <th className="text-left py-3 px-4">Holat</th>
              </tr>
            </thead>
            <tbody>
              {branchPerformance?.branches?.map((branch) => (
                <tr key={branch.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="py-3 px-4 font-medium">{branch.name}</td>
                  <td className="py-3 px-4">{branch.students}</td>
                  <td className="py-3 px-4">{branch.teachers}</td>
                  <td className="py-3 px-4 font-medium text-green-600 dark:text-green-400">
                    {formatMoney(branch.revenue)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span>{branch.occupancy}%</span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div
                          className={`h-2 rounded-full ${branch.occupancy > 90 ? 'bg-green-500' :
                            branch.occupancy > 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                          style={{ width: `${branch.occupancy}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-red-500">{formatMoney(branch.debt)}</td>
                  <td className="py-3 px-4">
                    <span className={`flex items-center gap-1 ${branch.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {branch.growth > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                      {Math.abs(branch.growth)}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(branch.status)}`}>
                      {branch.status === 'excellent' ? "A'lo" :
                        branch.status === 'good' ? "Yaxshi" : "Diqqat"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 dark:text-white">
        <QuickStatCard
          title="O'rtacha davomat"
          value={`${stats.avgAttendance ? stats.avgAttendance : 0}%`}
          icon={<Clock className="w-5 h-5" />}
          color="blue"
        />
        <QuickStatCard
          title="Faol filiallar"
          value={stats.activeBranches}
          subtitle={`Jami ${stats.activeBranches ? stats.activeBranches : 0} ta`}
          icon={<Users className="w-5 h-5" />}
          color="green"
        />
        <QuickStatCard
          title="To'lovlar"
          value={stats.discipline ? `${stats.discipline}%` : `0%`}
          subtitle="To'lov intizomi"
          icon={<DollarSign className="w-5 h-5" />}
          color="purple"
        />
      </div>
    </div>
  );
}

const COLOR_STYLES = {
  blue: {
    iconText: "text-blue-600 dark:text-blue-400",
    chipBg: "bg-blue-100 dark:bg-blue-900/20",
  },
  green: {
    iconText: "text-green-600 dark:text-green-400",
    chipBg: "bg-green-100 dark:bg-green-900/20",
  },
  purple: {
    iconText: "text-purple-600 dark:text-purple-400",
    chipBg: "bg-purple-100 dark:bg-purple-900/20",
  },
  red: {
    iconText: "text-red-600 dark:text-red-400",
    chipBg: "bg-red-100 dark:bg-red-900/20",
  },
  yellow: {
    iconText: "text-yellow-600 dark:text-yellow-400",
    chipBg: "bg-yellow-100 dark:bg-yellow-900/20",
  },
};

function StatCard({
  icon,
  title,
  value,
  change = 0,
  subValue,
  color,
  iconBg,
  negative = false,
}) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  const getTrendIcon = () => {
    if (isNeutral) return <Minus className="w-4 h-4 text-gray-400" />;
    if (isPositive) return <ArrowUpRight className="w-4 h-4" />;
    return <ArrowDownRight className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (isNeutral) return "text-gray-400";

    // oddiy cardlar uchun:
    // o'ssa = yashil, tushsa = qizil
    if (!negative) {
      return isPositive ? "text-green-500" : "text-red-500";
    }

    // negative=true bo'lsa (masalan qarz):
    // o'ssa = qizil, kamayса = yashil
    return isPositive ? "text-red-500" : "text-green-500";
  };

  const getTrendBg = () => {
    if (isNeutral) return "bg-gray-100 dark:bg-gray-800";

    if (!negative) {
      return isPositive
        ? "bg-green-100 dark:bg-green-900/20"
        : "bg-red-100 dark:bg-red-900/20";
    }

    return isPositive
      ? "bg-red-100 dark:bg-red-900/20"
      : "bg-green-100 dark:bg-green-900/20";
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4 dark:text-white">
        <div className={`p-3 rounded-xl ${iconBg}`}>
          {icon}
        </div>

        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${getTrendColor()} ${getTrendBg()}`}
        >
          {getTrendIcon()}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </h3>

      {subValue && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {subValue}
        </p>
      )}
    </div>
  );
}

function QuickStatCard({ title, value, subtitle, icon, color = "blue" }) {
  const styles = COLOR_STYLES[color] || COLOR_STYLES.blue;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 ${styles.chipBg} rounded-xl`}>
          <div className={styles.iconText}>{icon}</div>
        </div>

        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}