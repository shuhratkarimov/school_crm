import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Download,
  Users,
  GraduationCap,
  ClipboardCheck,
  CreditCard,
  DollarSign,
  Database,
  Loader2,
} from "lucide-react";
import { downloadExport, getExportFilters } from "../api/exportApi";

const EXPORTS = [
  {
    key: "students",
    path: "/export/students",
    file: "oquvchilar.xlsx",
    title: "O'quvchilar",
    desc: "Barcha o'quvchilar ro'yxati (guruhlari bilan)",
    icon: Users,
    color: "from-blue-500 to-blue-600",
    useGroup: true,
  },
  {
    key: "teachers",
    path: "/export/teachers",
    file: "ustozlar.xlsx",
    title: "Ustozlar",
    desc: "Barcha ustozlar va ularning guruhlari soni",
    icon: GraduationCap,
    color: "from-emerald-500 to-emerald-600",
  },
  {
    key: "groups",
    path: "/export/groups",
    file: "guruhlar.xlsx",
    title: "Guruhlar",
    desc: "Barcha guruhlar, ustozlari va jadvallari",
    icon: ClipboardCheck,
    color: "from-violet-500 to-violet-600",
    useGroup: true,
  },
  {
    key: "payments",
    path: "/export/payments",
    file: "tolovlar.xlsx",
    title: "To'lovlar",
    desc: "Barcha to'lovlar (o'quvchi va guruh bo'yicha)",
    icon: CreditCard,
    color: "from-amber-500 to-amber-600",
    useGroup: true,
  },
  {
    key: "expenses",
    path: "/export/expenses",
    file: "xarajatlar.xlsx",
    title: "Xarajatlar",
    desc: "Barcha xarajatlar ro'yxati",
    icon: DollarSign,
    color: "from-rose-500 to-rose-600",
  },
  {
    key: "all",
    path: "/export/all",
    file: "crm_malumotlari.xlsx",
    title: "Hammasi (to'liq)",
    desc: "Barcha ma'lumotlar bitta faylda, alohida varaqlarda",
    icon: Database,
    color: "from-slate-600 to-slate-800",
    full: true,
  },
];

export default function ExportData() {
  const [branches, setBranches] = useState([]);
  const [groups, setGroups] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [loadingKey, setLoadingKey] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getExportFilters();
        setBranches(data.branches || []);
        setGroups(data.groups || []);
      } catch (err) {
        // Filtrlar yuklanmasa ham, filtrsiz yuklab olish ishlayveradi
        console.error(err);
      }
    })();
  }, []);

  // Tanlangan filialga mos guruhlarni ko'rsatamiz
  const visibleGroups = useMemo(() => {
    if (!branchId) return groups;
    return groups.filter((g) => g.branch_id === branchId);
  }, [groups, branchId]);

  const handleBranchChange = (value) => {
    setBranchId(value);
    setGroupId(""); // filial o'zgarsa, guruh tanlovini tozalaymiz
  };

  const handleDownload = async (item) => {
    setLoadingKey(item.key);
    const toastId = toast.loading(`${item.title} yuklab olinmoqda...`);
    try {
      const params = {};
      // "Hammasi" faqat filial bo'yicha filtrlanadi (guruh emas)
      if (!item.full && branchId) params.branch_id = branchId;
      if (item.full && branchId) params.branch_id = branchId;
      if (item.useGroup && groupId) params.group_id = groupId;

      await downloadExport(item.path, params, item.file);
      toast.success(`${item.title} muvaffaqiyatli yuklab olindi`, { id: toastId });
    } catch (err) {
      toast.error(err?.message || "Yuklab olishda xatolik", { id: toastId });
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-gray-100">
          <Download className="text-blue-600" /> Ma'lumotlarni yuklab olish
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          CRM tizimidagi ma'lumotlarni Excel (.xlsx) ko'rinishida to'liq yuklab oling.
          Kerak bo'lsa, filial yoki guruh bo'yicha filtrlang.
        </p>
      </div>

      {/* Filtrlar */}
      <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Filial
          </label>
          <select
            value={branchId}
            onChange={(e) => handleBranchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100"
          >
            <option value="">Barcha filiallar</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Guruh{" "}
            <span className="text-xs text-gray-400">
              (o'quvchilar, guruhlar, to'lovlar uchun)
            </span>
          </label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100"
          >
            <option value="">Barcha guruhlar</option>
            {visibleGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.group_subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Yuklab olish kartalari */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXPORTS.map((item) => {
          const Icon = item.icon;
          const isLoading = loadingKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleDownload(item)}
              disabled={isLoading}
              className="group flex flex-col items-start gap-3 rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} text-white shadow`}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={22} />
                ) : (
                  <Icon size={22} />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {item.desc}
                </p>
              </div>
              <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:gap-2 dark:text-blue-400">
                <Download size={15} /> {isLoading ? "Yuklanmoqda..." : "Excel yuklab olish"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
