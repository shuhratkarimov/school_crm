"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Shield, Building2, Users, Pencil, Trash, Plus, KeyRound,
  UserCog, School, Briefcase, ChevronDown, ChevronUp,
  X, Save, Search, AlertTriangle, UserPlus
} from "lucide-react";
import { toast } from "react-hot-toast";
import API_URL from "../conf/api";

export default function SuperAdmin() {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [centers, setCenters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);

  // Modals
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isCenterModalOpen, setIsCenterModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditUserMode, setIsEditUserMode] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form states
  const [centerForm, setCenterForm] = useState({
    name: "", address: "", owner: "", phone: "", status: "active"
  });

  const [branchForm, setBranchForm] = useState({
    name: "", address: "", phone: "", center_id: "", manager_id: ""
  });

  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    branch_id: "",
    role: "manager"
  });

  const directors = useMemo(() => users.filter(u => u.role === "director"), [users]);
  const managers = useMemo(() => users.filter(u => u.role === "manager"), [users]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [centersRes, branchesRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/superadmin/centers`, { credentials: "include" }),
        fetch(`${API_URL}/superadmin/branches`, { credentials: "include" }),
        fetch(`${API_URL}/superadmin/users`, { credentials: "include" }),
      ]);

      if (!centersRes.ok || !branchesRes.ok || !usersRes.ok) {
        throw new Error("Ma'lumotlarni yuklashda xato");
      }

      const centersData = await centersRes.json();
      const branchesData = await branchesRes.json();
      const usersData = await usersRes.json();

      setCenters(centersData.centers || centersData || []);
      setBranches(branchesData.branches || branchesData || []);
      setUsers(usersData.users || usersData || []);

    } catch (err) {
      toast.error(err.message || "Server bilan bog'lanib bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  const changeUserRole = async (userId, role) => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/superadmin/change-role/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Rol o'zgartirilmadi");

      toast.success(data.message || "Rol o'zgartirildi");
      fetchAllData();
    } catch (err) {
      toast.error(err.message || "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  const saveUser = async () => {
    if (!userForm.username || !userForm.email) {
      toast.error("Username va email majburiy");
      return;
    }

    if (!isEditUserMode && !userForm.password) {
      toast.error("Parol kiritilishi shart (yangi user uchun)");
      return;
    }

    try {
      setLoading(true);

      const payload = { ...userForm };
      if (!isEditUserMode && !payload.password) {
        delete payload.password; // update da parol bo'sh bo'lsa yubormaymiz
      }

      const method = isEditUserMode ? "PUT" : "POST";
      const url = isEditUserMode
        ? `${API_URL}/superadmin/update-user-by-superadmin/${editingUser.id}`
        : `${API_URL}/superadmin/fast-register-user-by-superadmin`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Amal bajarilmadi");
      }

      toast.success(isEditUserMode ? "Foydalanuvchi yangilandi" : "Yangi foydalanuvchi qo'shildi");
      closeUserModal();
      fetchAllData();
    } catch (err) {
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id, username) => {
    if (!window.confirm(`"${username}" ni o'chirishni tasdiqlaysizmi?`)) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/superadmin/delete-user-by-superadmin/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("O'chirishda xato");

      toast.success("Foydalanuvchi o'chirildi");
      fetchAllData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Modal ochish funksiyalari
  const openAddUser = () => {
    setIsEditUserMode(false);
    setUserForm({ username: "", email: "", password: "", branch_id: "", role: "manager" });
    setIsUserModalOpen(true);
  };

  const openEditUser = (user) => {
    setIsEditUserMode(true);
    setEditingUser(user);
    setUserForm({
      username: user.username || "",
      email: user.email || "",
      password: "", // parolni ko'rsatmaymiz va majburiy emas
      branch_id: user.branch_id || "",
      role: user.role || "manager"
    });
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  useEffect(() => {
    fetchAllData();
  }, []);
  // ─────────────────────────────────────────────
  //              CRUD OPERATIONS
  // ─────────────────────────────────────────────

  const saveCenter = async () => {
    if (!centerForm.name || !centerForm.address) {
      toast.error("Nom va manzil majburiy!");
      return;
    }

    try {
      setLoading(true);
      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode
        ? `${API_URL}/superadmin/centers/${centerForm.id}`
        : `${API_URL}/superadmin/centers`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(centerForm),
      });

      if (!res.ok) throw new Error("Saqlashda xatolik");

      toast.success(isEditMode ? "Markaz yangilandi" : "Markaz qo'shildi");
      closeCenterModal();
      fetchAllData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveBranch = async () => {
    if (!branchForm.name || !branchForm.address || !branchForm.center_id) {
      toast.error("Nom, manzil va markaz tanlanishi shart!");
      return;
    }

    try {
      setLoading(true);
      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode
        ? `${API_URL}/superadmin/update_branch/${branchForm.id}`
        : `${API_URL}/superadmin/create_branch`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(branchForm),
      });

      if (!res.ok) throw new Error(await res.text());

      toast.success(isEditMode ? "Filial yangilandi" : "Filial qo'shildi");
      closeBranchModal();
      fetchAllData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCenter = async (id) => {
    if (!window.confirm("Bu markazni va unga tegishli barcha filiallar o‘chiriladi. Tasdiqlaysizmi?")) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/superadmin/centers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("O‘chirishda xato");
      toast.success("Markaz o‘chirildi");
      fetchAllData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteBranch = async (id) => {
    if (!window.confirm("Filialni o‘chirishni tasdiqlaysizmi?")) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/superadmin/branches/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("O‘chirishda xato");
      toast.success("Filial o‘chirildi");
      fetchAllData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  //              MODAL HELPERS
  // ─────────────────────────────────────────────

  const openAddCenter = () => {
    setIsEditMode(false);
    setCenterForm({ name: "", address: "", owner: "", phone: "", status: "active" });
    setIsCenterModalOpen(true);
  };

  const openEditCenter = (center) => {
    setIsEditMode(true);
    setCenterForm({ ...center });
    setIsCenterModalOpen(true);
  };

  const closeCenterModal = () => {
    setIsCenterModalOpen(false);
    setSelectedCenter(null);
  };

  const openAddBranch = (centerId) => {
    setIsEditMode(false);
    setBranchForm({ center_id: centerId || "", name: "", address: "", phone: "", manager_id: "" });
    setIsBranchModalOpen(true);
  };

  const openEditBranch = (branch) => {
    setIsEditMode(true);
    setBranchForm({ ...branch });
    setIsBranchModalOpen(true);
  };

  const closeBranchModal = () => {
    setIsBranchModalOpen(false);
    setSelectedBranch(null);
  };

  const filteredCenters = useMemo(() => {
    if (!searchQuery.trim()) return centers;
    const q = searchQuery.toLowerCase();
    return centers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q) ||
      c.owner?.toLowerCase().includes(q)
    );
  }, [centers, searchQuery]);

  // ─────────────────────────────────────────────
  //              RENDER
  // ─────────────────────────────────────────────


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-5 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header + Add button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-3 rounded-xl shadow-md">
              <Shield size={28} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Super Admin Panel</h1>
          </div>

          <button
            onClick={openAddCenter}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Plus size={20} /> Yangi markaz qo‘shish
          </button>
          <button
            onClick={openAddUser}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Plus size={20} /> Yangi foydalanuvchi qo‘shish
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <StatCard icon={<Building2 />} title="Markazlar" value={centers.length} color="blue" />
          <StatCard icon={<School />} title="Filiallar" value={branches.length} color="indigo" />
          <StatCard icon={<UserCog />} title="Directorlar" value={directors.length} color="purple" />
          <StatCard icon={<Users />} title="Managerlar" value={managers.length} color="green" />
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Markaz nomi, manzil yoki egasi bo‘yicha qidirish..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Centers Grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Yuklanmoqda...</div>
        ) : filteredCenters.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-2xl shadow">
            Hech qanday o‘quv markazi topilmadi
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCenters.map(center => (
              <div
                key={center.id}
                onClick={() => setSelectedCenter(center)}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                        {center.name}
                      </h3>
                      <p className="text-gray-600 mt-1.5 flex items-center gap-1.5">
                        <Building2 size={16} /> {center.address}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${center.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                      {center.status === "active" ? "Faol" : "Faol emas"}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Egasi</p>
                      <p className="font-medium">{center.owner || "—"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Director</p>
                      <p className="font-medium">{center.director?.username || "Tayinlanmagan"}</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {center.branches?.length || 0} ta filial
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); openEditCenter(center); }}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition"
                    >
                      <Pencil size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="bg-white rounded-2xl shadow mt-10 mb-10 overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-3">
              <Users size={22} className="text-indigo-600" />
              Foydalanuvchilar
            </h2>
            <button
              onClick={openAddUser}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
            >
              <UserPlus size={18} /> Yangi qo'shish
            </button>
          </div>

          {users.length === 0 ? (
            <div className="p-10 text-center text-gray-500">Hozircha foydalanuvchilar yo'q</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filial</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.email || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          disabled={loading || user.role === "superadmin"}
                          onChange={(e) => {
                            const newRole = e.target.value;
                            if (newRole === user.role) return;

                            // optimistik UI (xohlasangiz) — oldin local update qilib yuborish mumkin
                            changeUserRole(user.id, newRole);
                          }}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
               focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                        >
                          <option value="manager">MANAGER</option>
                          <option value="director">DIRECTOR</option>
                          <option value="superadmin">SUPERADMIN</option>
                          {/* agar sizda boshqa role bo'lsa, shu yerga qo'shasiz */}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {user.branch_id ? branches.find(b => b.id === user.branch_id)?.name || "—" : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => openEditUser(user)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                          title="Tahrirlash"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id, user.username)}
                          className="text-red-600 hover:text-red-800"
                          title="O'chirish"
                        >
                          <Trash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>


      {/* Yangi User Modal */}
      {isUserModalOpen && (
        <Modal
          title={isEditUserMode ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi qo'shish"}
          isOpen={isUserModalOpen}
          onClose={closeUserModal}
        >
          <div className="space-y-5">
            <Input
              label="Username"
              value={userForm.username}
              onChange={v => setUserForm({ ...userForm, username: v })}
              required
            />
            <Input
              label="Email"
              value={userForm.email}
              onChange={v => setUserForm({ ...userForm, email: v })}
              required
            />
            <Input
                label="Parol"
                type="password"
                value={userForm.password}
                onChange={v => setUserForm({ ...userForm, password: v })}
                required
              />
            <Select
              label="Rol"
              value={userForm.role}
              onChange={v => setUserForm({ ...userForm, role: v })}
              options={[
                { value: "manager", label: "Manager" },
                { value: "director", label: "Director" },
                { value: "superadmin", label: "Superadmin" },
                // { value: "user", label: "Oddiy foydalanuvchi" } – agar kerak bo'lsa
              ]}
              required
            />
            <Select
              label="Filial (ixtiyoriy)"
              value={userForm.branch_id || ""}
              onChange={v => setUserForm({ ...userForm, branch_id: v })}
              options={[
                { value: "", label: "Filialsiz" },
                ...branches.map(b => ({ value: b.id, label: b.name }))
              ]}
            />

            <div className="flex gap-4 pt-6">
              <button
                onClick={saveUser}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save size={18} />
                {loading ? "Saqlanmoqda..." : isEditUserMode ? "Yangilash" : "Qo'shish"}
              </button>
              <button
                onClick={closeUserModal}
                className="flex-1 bg-gray-200 hover:bg-gray-300 py-3.5 rounded-xl"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Center Detail Modal */}
      {selectedCenter && (
        <Modal
          title={`${selectedCenter.name} - Ma'lumotlar va filiallar`}
          isOpen={!!selectedCenter}
          onClose={() => setSelectedCenter(null)}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem label="Nomi" value={selectedCenter.name} />
              <InfoItem label="Manzil" value={selectedCenter.address} />
              <InfoItem label="Egasining F.I.O." value={selectedCenter.owner} />
              <InfoItem label="Telefon" value={selectedCenter.phone} />
              <InfoItem label="Director" value={selectedCenter.director?.username || "—"} />
              <InfoItem label="Holati" value={selectedCenter.status === "active" ? "Faol" : "Faol emas"} />
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <h3 className="text-lg font-semibold">Filiallar</h3>
              <button
                onClick={() => openAddBranch(selectedCenter.id)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
              >
                <Plus size={16} /> Yangi filial
              </button>
            </div>

            <div className="space-y-3">
              {selectedCenter.branches?.length ? (
                selectedCenter.branches.map(b => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBranch(b)}
                    className="flex justify-between items-center bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition cursor-pointer group"
                  >
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-sm text-gray-600">{b.address}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {b.manager ? b.manager.username : "Manager yo‘q"}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); openEditBranch(b); }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil size={18} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-8 italic">
                  Hozircha filiallar mavjud emas
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <button
                onClick={() => openEditCenter(selectedCenter)}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Pencil size={18} /> Tahrirlash
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Markazni o‘chirishni tasdiqlaysizmi?")) {
                    deleteCenter(selectedCenter.id);
                    setSelectedCenter(null);
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Trash size={18} /> O‘chirish
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Center Create/Edit Modal */}
      {isCenterModalOpen && (
        <Modal
          title={isEditMode ? "Markazni tahrirlash" : "Yangi markaz qo‘shish"}
          isOpen={isCenterModalOpen}
          onClose={closeCenterModal}
        >
          <div className="space-y-5">
            <Input
              label="Markaz nomi"
              value={centerForm.name || ""}
              onChange={v => setCenterForm({ ...centerForm, name: v })}
              required
            />
            <Input
              label="Manzil"
              value={centerForm.address || ""}
              onChange={v => setCenterForm({ ...centerForm, address: v })}
              required
            />
            <Input
              label="Egasining F.I.O."
              value={centerForm.owner || ""}
              onChange={v => setCenterForm({ ...centerForm, owner: v })}
            />
            <Input
              label="Telefon raqami"
              value={centerForm.phone || ""}
              onChange={v => setCenterForm({ ...centerForm, phone: v })}
            />
            <Select
              label="Holati"
              value={centerForm.status || "active"}
              onChange={v => setCenterForm({ ...centerForm, status: v })}
              options={[
                { value: "active", label: "Faol" },
                { value: "inactive", label: "Faol emas" },
              ]}
            />

            <div className="flex gap-4 pt-6">
              <button
                onClick={saveCenter}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save size={18} />
                {loading ? "Saqlanmoqda..." : isEditMode ? "Yangilash" : "Qo‘shish"}
              </button>
              <button
                onClick={closeCenterModal}
                className="flex-1 bg-gray-200 hover:bg-gray-300 py-3.5 rounded-xl"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Branch Create/Edit Modal */}
      {isBranchModalOpen && (
        <Modal
          title={isEditMode ? "Filialni tahrirlash" : "Yangi filial qo‘shish"}
          isOpen={isBranchModalOpen}
          onClose={closeBranchModal}
        >
          <div className="space-y-5">
            {!isEditMode && selectedCenter && (
              <div className="bg-blue-50 p-4 rounded-xl text-sm">
                Markaz: <strong>{selectedCenter.name}</strong>
              </div>
            )}

            <Input
              label="Filial nomi"
              value={branchForm.name || ""}
              onChange={v => setBranchForm({ ...branchForm, name: v })}
              required
            />
            <Input
              label="Manzil"
              value={branchForm.address || ""}
              onChange={v => setBranchForm({ ...branchForm, address: v })}
              required
            />
            <Input
              label="Telefon"
              value={branchForm.phone || ""}
              onChange={v => setBranchForm({ ...branchForm, phone: v })}
            />
            <Select
              label="Qaysi markazga tegishli?"
              value={branchForm.center_id || ""}
              onChange={v => setBranchForm({ ...branchForm, center_id: v })}
              options={centers.map(c => ({ value: c.id, label: c.name }))}
              required
            />
            <Select
              label="Manager"
              value={branchForm.manager_id || ""}
              onChange={v => setBranchForm({ ...branchForm, manager_id: v })}
              options={users
                .filter(u => u.role === "manager")
                .map(u => ({ value: u.id, label: u.username }))}
            />

            <div className="flex gap-4 pt-6">
              <button
                onClick={saveBranch}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save size={18} />
                {loading ? "Saqlanmoqda..." : isEditMode ? "Yangilash" : "Qo‘shish"}
              </button>
              <button
                onClick={closeBranchModal}
                className="flex-1 bg-gray-200 hover:bg-gray-300 py-3.5 rounded-xl"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Branch Detail Modal */}
      {selectedBranch && (
        <Modal
          title={`${selectedBranch.name} ma'lumotlari`}
          isOpen={!!selectedBranch}
          onClose={() => setSelectedBranch(null)}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem label="Nomi" value={selectedBranch.name} />
              <InfoItem label="Manzil" value={selectedBranch.address} />
              <InfoItem label="Telefon" value={selectedBranch.phone || "—"} />
              <InfoItem label="Manager" value={selectedBranch.manager?.username || "Tayinlanmagan"} />
            </div>

            <div className="flex gap-4 pt-6 border-t">
              <button
                onClick={() => {openEditBranch(selectedBranch), closeBranchModal()}}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Pencil size={18} /> Tahrirlash
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Filialni o‘chirishni tasdiqlaysizmi?")) {
                    deleteBranch(selectedBranch.id);
                    setSelectedBranch(null);
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Trash size={18} /> O‘chirish
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//              HELPER COMPONENTS
// ─────────────────────────────────────────────

function StatCard({ icon, title, value, color }) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    indigo: "bg-indigo-100 text-indigo-700",
    purple: "bg-purple-100 text-purple-700",
    green: "bg-green-100 text-green-700",
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-5">
      <div className={`p-4 rounded-xl ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function Modal({ title, children, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, required = false, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
        required={required}
      />
    </div>
  );
}

function Select({ label, value, onChange, options, required = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
        required={required}
      >
        <option value="">Tanlang...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="bg-gray-50 p-4 rounded-xl">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium mt-1">{value || "—"}</p>
    </div>
  );
}