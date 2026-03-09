import React, { useEffect, useState, useMemo } from "react";
import {
  DollarSign,
  AlertCircle,
  Clock,
  User,
  Calendar,
  Phone,
  Mail,
  Search,
  Filter,
  Download,
  Send,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import API_URL from "../../conf/api";

export default function DirectorDebts() {
  const { t } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [debts, setDebts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [summary, setSummary] = useState({
    totalDebt: 0,
    overdueDebt: 0,
    pendingDebt: 0,
    averageDebt: 0,
    debtorsCount: 0,
    overdueCount: 0,
    pendingCount: 0,
  });
  const [branchSummary, setBranchSummary] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/director-panel/debts`, {
        credentials: "include",
      });

      const data = await res.json();
      const payload = data?.data ?? {};

      setDebts(payload.debts ?? []);
      setBranches(payload.branchSummary ?? []);
    } catch (error) {
      console.error("Debt fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDebts = useMemo(() => {
    return debts.filter((debt) => {
      const matchesSearch =
        debt.student?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.phone?.includes(searchTerm);

      const matchesStatus =
        filterStatus === "all" || debt.status === filterStatus;

      const matchesBranch =
        filterBranch === "all" ||
        String(debt.branchId) === String(filterBranch);

      return matchesSearch && matchesStatus && matchesBranch;
    });
  }, [debts, searchTerm, filterStatus, filterBranch]);

  const totalDebt = useMemo(
    () => filteredDebts.reduce((sum, d) => sum + Number(d.remaining || 0), 0),
    [filteredDebts]
  );

  const overdueDebt = useMemo(
    () =>
      filteredDebts
        .filter((d) => d.status === "overdue")
        .reduce((sum, d) => sum + Number(d.remaining || 0), 0),
    [filteredDebts]
  );

  const pendingDebt = useMemo(
    () =>
      filteredDebts
        .filter((d) => d.status === "pending")
        .reduce((sum, d) => sum + Number(d.remaining || 0), 0),
    [filteredDebts]
  );

  const averageDebt = useMemo(() => {
    const debtors = filteredDebts.filter((d) => Number(d.remaining || 0) > 0);
    if (!debtors.length) return 0;
    return Math.round(totalDebt / debtors.length);
  }, [filteredDebts, totalDebt]);

  const computedBranchSummary = useMemo(() => {
    return branches.map((branch) => {
      const branchDebts = filteredDebts.filter(
        (d) => String(d.branchId) === String(branch.id)
      );

      const branchTotal = branchDebts.reduce(
        (sum, d) => sum + Number(d.remaining || 0),
        0
      );

      const branchOverdue = branchDebts.filter(
        (d) => d.status === "overdue"
      ).length;

      return {
        id: branch.id,
        branch: branch.branch,
        totalDebt: branchTotal,
        debtorsCount: branchDebts.filter((d) => Number(d.remaining || 0) > 0).length,
        overdueCount: branchOverdue,
        percent: totalDebt > 0 ? (branchTotal / totalDebt) * 100 : 0,
      };
    });
  }, [branches, filteredDebts, totalDebt]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'paid': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'overdue': return 'Muddati o\'tgan';
      case 'pending': return 'Kutilmoqda';
      case 'paid': return 'To\'langan';
      default: return status;
    }
  };

  const formatMoney = (amount) => {
    return amount ? new Intl.NumberFormat('uz-UZ').format(amount) + " so'm" : "0 so'm";
  };

  return (
    <div className="space-y-6 dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Qarz monitoringi
        </h1>
        <div className="relative flex items-center gap-3">
          {/* overlay text */}
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <span className="px-3 py-1 text-xs font-semibold bg-black/10 text-white rounded-full backdrop-blur-xs">
              Tez kunda
            </span>
          </div>

          {/* buttons */}
          <div className="flex items-center gap-3 opacity-40 blur-[0.5px] pointer-events-none">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl">
              <Send size={18} />
              <span>Eslatma yuborish</span>
            </button>

            <button className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Jami qarz</p>
          <p className="text-2xl font-bold text-red-500">{formatMoney(totalDebt)}</p>
          <p className="text-xs text-gray-500 mt-1">{debts.length} ta qarzdor</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Muddati o'tgan</p>
          <p className="text-2xl font-bold text-red-600">{formatMoney(overdueDebt)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {debts.filter(d => d.status === 'overdue').length} ta o'quvchi
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Kutilayotgan to'lovlar</p>
          <p className="text-2xl font-bold text-yellow-500">{formatMoney(pendingDebt)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {debts.filter(d => d.status === 'pending').length} ta o'quvchi
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">O'rtacha qarz</p>
          <p className="text-2xl font-bold text-blue-500">
            {formatMoney(Math.round(totalDebt / debts.filter(d => d.remaining > 0).length))}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="O'quvchi qidirish..."
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
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.branch}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">Barcha holatlar</option>
          <option value="overdue">Muddati o'tgan</option>
          <option value="pending">Kutilmoqda</option>
          <option value="paid">To'langan</option>
        </select>
      </div>

      {/* Debts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {filteredDebts?.length > 0 ? <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left py-3 px-4">O'quvchi</th>
                <th className="text-left py-3 px-4">Filial</th>
                <th className="text-left py-3 px-4">Guruh</th>
                <th className="text-left py-3 px-4">O'qituvchi</th>
                <th className="text-left py-3 px-4">Qarz miqdori</th>
                <th className="text-left py-3 px-4">Qarz oyi</th>
                <th className="text-left py-3 px-4">Muddat</th>
                <th className="text-left py-3 px-4">Holat</th>
              </tr>
            </thead>
            <tbody>
              {filteredDebts.map((debt) => (
                <tr key={debt.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{debt.student}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Phone size={12} />
                        <span>{debt.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{debt.branch}</td>
                  <td className="py-3 px-4">{debt.group}</td>
                  <td className="py-3 px-4">{debt.teacher}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-red-500">{formatMoney(debt.remaining)}</p>
                      <p className="text-xs text-gray-500">/{formatMoney(debt.amount)}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">{debt.month}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span>{debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('ru-RU') : ''}</span>
                    </div>
                    {debt.daysOverdue > 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        {debt.daysOverdue} kun kechikkan
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(debt.status)}`}>
                      {getStatusText(debt.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table> : <p className="text-center py-6">Hozircha qarzdor o'quvchilar yo'q</p>}
        </div>
      </div>

      {/* Branch Debt Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {computedBranchSummary.map((branch) => (
          <div
            key={branch.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <h3 className="font-semibold mb-2">{branch.branch}</h3>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Jami qarz:</span>
                <span className="font-medium text-red-500">
                  {formatMoney(branch.totalDebt)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Qarzdorlar:</span>
                <span className="font-medium">{branch.debtorsCount} nafar</span>
              </div>

              {branch.overdueCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Muddati o'tgan:</span>
                  <span className="font-medium text-red-600">
                    {branch.overdueCount} nafar
                  </span>
                </div>
              )}

              <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                <div
                  className="h-2 bg-red-500 rounded-full"
                  style={{ width: `${branch.percent}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}