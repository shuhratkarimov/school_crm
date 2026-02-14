"use client";

import { useState, useEffect } from "react";
import { Trash2, Pen, Plus, X, Check, Search, AlertCircle, Users } from "lucide-react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import LottieLoading from "../components/Loading";
import API_URL from "../conf/api";

export default function NewStudents() {
    const [reserveStudents, setReserveStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [importModal, setImportModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [importErrors, setImportErrors] = useState([]);
    const [addModal, setAddModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        father_name: "",
        mother_name: "",
        birth_date: "",
        phone_number: "",
        parents_phone_number: "",
        came_in_school: "",
        notes: "",
    });
    const [editFormData, setEditFormData] = useState({ ...formData });
    const [assignModal, setAssignModal] = useState(false);
    const [selectedGroups, setSelectedGroups] = useState([]); // tanlangan guruh ID'lari
    const [detailStudent, setDetailStudent] = useState(null);
    const [editStudent, setEditStudent] = useState(null);
    const [assignStudent, setAssignStudent] = useState(null);

    // Joriy sana (sana maydonlari uchun)
    const today = new Date().toISOString().split("T")[0];

    const openAssignModal = (student) => {
        setAssignStudent(student);
        setSelectedGroups([]);
        setAssignModal(true);
    };

    const openEditModal = (student) => {
        if (!student?.id) {
            toast.error("Tahrirlanadigan o'quvchi topilmadi");
            return;
        }

        setEditStudent(student);

        setEditFormData({
            first_name: student.first_name || "",
            last_name: student.last_name || "",
            father_name: student.father_name || "",
            mother_name: student.mother_name || "",
            birth_date: student.birth_date
                ? new Date(student.birth_date).toISOString().split("T")[0]
                : "",
            phone_number: student.phone_number || "",
            parents_phone_number: student.parents_phone_number || "",
            came_in_school: student.came_in_school
                ? new Date(student.came_in_school).toISOString().split("T")[0]
                : "",
            notes: student.notes || "",
        });

        setEditModal(true);
    };

    const handleAssignGroups = async () => {
        if (!assignStudent) return;

        try {
            const res = await fetch(`${API_URL}/approve_reserve_student/${assignStudent.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ group_ids: selectedGroups }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "O'tkazishda xato");
            }

            toast.success("O'quvchi asosiy ro'yxatga o'tkazildi va guruh(lar)ga biriktirildi!");
            fetchReserveStudents();
            setAssignModal(false);
            setAssignStudent(null);
            setSelectedGroups([]);
        } catch (err) {
            toast.error(err.message || "Xatolik yuz berdi");
        }
    };

    // Ma'lumotlarni yuklash
    const fetchReserveStudents = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/get_reserve_students`);
            if (!res.ok) throw new Error("Zaxiradagi o'quvchilarni yuklashda xato");
            const data = await res.json();
            setReserveStudents(data);
        } catch (err) {
            toast.error("Zaxiradagi o'quvchilarni yuklashda xato");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await fetch(`${API_URL}/get_groups`);
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
            }
        } catch (err) {
            console.error("Guruhlar yuklanmadi", err);
        }
    };

    useEffect(() => {
        fetchReserveStudents();
        fetchGroups();
    }, []);

    // Excel import
    const handleImport = async () => {
        if (!selectedFile) {
            toast.error("Fayl tanlanmagan!");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const headers = jsonData[0].map(h => h?.toString().toLowerCase().trim() || "");
            const rows = jsonData.slice(1);

            const studentsToImport = rows.map(row => {
                const student = {};
                headers.forEach((header, idx) => {
                    const value = row[idx];

                    if (header === "ism" || header.includes("first_name")) {
                        student.first_name = value ? String(value).trim() : "";
                    }
                    if (header === "familiya" || header.includes("last_name")) {
                        student.last_name = value ? String(value).trim() : "";
                    }
                    if (header === "ota/ona ismi" || header.includes("father_name")) {
                        student.father_name = value ? String(value).trim() : "";
                    }
                    if (header === "telefon" || header.includes("phone_number")) {
                        let val = value;
                        if (val != null && val !== "") {
                            let digits = String(val).trim().replace(/\D/g, '');
                            if (digits.length === 9) student.phone_number = '+998' + digits;
                            else if (digits.length === 12 && digits.startsWith('998')) student.phone_number = '+' + digits;
                            else if (digits.length === 13 && digits.startsWith('0')) student.phone_number = '+998' + digits.slice(1);
                            else student.phone_number = null;
                        } else student.phone_number = null;
                    }
                    if (header === "ota/ona telefoni" || header.includes("parents_phone")) {
                        let val = value;
                        if (val != null && val !== "") {
                            let digits = String(val).trim().replace(/\D/g, '');
                            if (digits.length === 9) student.parents_phone_number = '+998' + digits;
                            else if (digits.length === 12 && digits.startsWith('998')) student.parents_phone_number = '+' + digits;
                            else if (digits.length === 13 && digits.startsWith('0')) student.parents_phone_number = '+998' + digits.slice(1);
                            else student.parents_phone_number = null;
                        } else student.parents_phone_number = null;
                    }
                    if (header === "tug'ilgan sana") {
                        student.birth_date = value ? formatDateForExcelImport(value) : null;
                    }
                    if (header === "o'qishga kelgan sana") {
                        student.came_in_school = value ? formatDateForExcelImport(value) : null;
                    }
                });
                return student;
            }).filter(s =>
                s.first_name?.trim() &&
                s.last_name?.trim() &&
                s.phone_number?.startsWith('+998') &&
                s.parents_phone_number?.startsWith('+998')
            );

            if (studentsToImport.length === 0) {
                toast.error("Faylda to'g'ri ma'lumot topilmadi yoki telefon raqamlari noto'g'ri!");
                return;
            }

            try {
                const res = await fetch(`${API_URL}/import_students`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ students: studentsToImport }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || "Import xatosi");
                }

                toast.success(`${studentsToImport.length} ta yangi o'quvchi zaxiraga qo'shildi!`);
                fetchReserveStudents();
                setImportModal(false);
                setSelectedFile(null);
            } catch (err) {
                toast.error(err.message || "Xatolik yuz berdi");
                setImportErrors([err.message]);
            }
        };

        reader.readAsArrayBuffer(selectedFile);
    };

    // Sana formatlash (sizda allaqachon bor edi)
    function formatDateForExcelImport(value) {
        if (!value) return null;
        let date;
        if (typeof value === 'number') {
            date = new Date((value - 25569) * 86400 * 1000);
        } else if (typeof value === 'string') {
            const trimmed = value.trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) date = new Date(trimmed);
            else if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(trimmed)) {
                const [d, m, y] = trimmed.split('.').map(Number);
                date = new Date(y, m - 1, d);
            }
            else date = new Date(trimmed);
        }
        if (date && !isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
        return null;
    }

    const handleSubmit = async (e, isEdit = false) => {
        e.preventDefault();

        const data = isEdit ? editFormData : formData;

        let url;
        let method;

        if (isEdit) {
            if (!editStudent?.id) {
                toast.error("Tahrirlanayotgan o'quvchi topilmadi");
                return;
            }

            url = `${API_URL}/update_reserve_student/${editStudent.id}`;
            method = "PUT";
        } else {
            url = `${API_URL}/create_reserve_student`;
            method = "POST";
        }

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Saqlashda xato");
            }

            toast.success(isEdit ? "Ma'lumotlar yangilandi" : "Yangi o'quvchi qo'shildi");
            fetchReserveStudents();

            if (isEdit) {
                setEditModal(false);
                setEditStudent(null);
            } else {
                setAddModal(false);
                setFormData({
                    first_name: "",
                    last_name: "",
                    father_name: "",
                    mother_name: "",
                    birth_date: "",
                    phone_number: "",
                    parents_phone_number: "",
                    came_in_school: "",
                    notes: "",
                });
            }

        } catch (err) {
            toast.error(err.message);
            console.error(err);
        }
    };


    const showDeleteToast = (id) => {
        toast(
            <div>
                <p>
                    Diqqat! Ushbu zaxiradagi o'quvchiga tegishli barcha ma'lumotlar o'chiriladi!
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
                            deleteReserveStudent(id);
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

    // O'chirish
    const deleteReserveStudent = async (id) => {
        try {
            const res = await fetch(`${API_URL}/delete_reserve_student/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("O'chirishda xato");
            toast.success("O'quvchi zaxiradan o'chirildi");
            setDetailStudent(null);
            fetchReserveStudents();
        } catch (err) {
            toast.error(err.message);
        }
    };

    // Zaxiradagi o'quvchini students ga o'tkazish
    const approveToStudent = async (reserveId, selectedGroups = []) => {
        try {
            const res = await fetch(`${API_URL}/approve_reserve_student/${reserveId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ group_ids: selectedGroups }),
            });
            if (!res.ok) throw new Error("O'tkazishda xato");
            toast.success("O'quvchi asosiy ro'yxatga o'tkazildi!");
            fetchReserveStudents();
            setSelectedStudent(null);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const filteredStudents = reserveStudents.filter(s =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone_number?.includes(searchTerm)
    );

    if (loading) return <LottieLoading />;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between px-6 pt-6">
                <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-800">
                    <AlertCircle className="text-blue-600" size={32} />
                    Yangi o'quvchilar (zaxira)
                </h1>
                <div className="flex gap-4">
                    <button
                        onClick={() => setImportModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Plus size={18} /> Excel import
                    </button>
                    <button
                        onClick={() => setAddModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                        <Plus size={18} /> Qo'lda qo'shish
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="px-6 mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Ism, familiya yoki telefon bo'yicha qidirish..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="px-6">
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-blue-600 text-white">
                            <tr>
                                <th className="p-4 text-left">#</th>
                                <th className="p-4 text-left">F.I.Sh</th>
                                <th className="p-4 text-left">Telefon</th>
                                <th className="p-4 text-left">Ota-ona telefoni</th>
                                <th className="p-4 text-left">Tug'ilgan sana</th>
                                <th className="p-4 text-left">Status</th>
                                <th className="p-4 text-center">Amallar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        {searchTerm ? "Hech narsa topilmadi" : "Hozircha zaxirada o'quvchi yo'q"}
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student, idx) => (
                                    <tr
                                        key={student.id}
                                        className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => setDetailStudent(student)}
                                    >
                                        <td className="p-4">{idx + 1}</td>
                                        <td className="p-4 font-medium">{student.first_name} {student.last_name}</td>
                                        <td className="p-4">{student.phone_number}</td>
                                        <td className="p-4">{student.parents_phone_number}</td>
                                        <td className="p-4">{student.birth_date ? new Date(student.birth_date).toLocaleDateString('uz-UZ') : "—"}</td>
                                        <td className="p-4">
                                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                                {student.status === 'new' ? 'Yangi' : student.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openEditModal(student); }}
                                                    className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                                >
                                                    <Pen size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); showDeleteToast(student.id); }}
                                                    className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Import Modal */}
            {importModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                        <div className="p-6 border-b bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-t-xl flex justify-between items-center">
                            <h2 className="text-xl font-bold">Excel orqali yangi o'quvchilarni import qilish</h2>
                            <button onClick={() => setImportModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="mb-4 text-sm text-gray-600">
                                Excel shablon: Ism, Familiya, Telefon, Ota/ona ismi, Ota/ona telefoni, Tug'ilgan sana, O'qishga kelgan sana
                            </p>
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => setSelectedFile(e.target.files[0])}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {importErrors.length > 0 && (
                                <p className="mt-2 text-red-600 text-sm">{importErrors.join(", ")}</p>
                            )}
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setImportModal(false)}
                                    className="px-5 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={!selectedFile}
                                    className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Import qilish
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Qo'shish / Tahrirlash Modal */}
            {(addModal || editModal) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-t-xl flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {editModal ? "Ma'lumotlarni tahrirlash" : "Yangi o'quvchi qo'shish (zaxira)"}
                            </h2>
                            <button onClick={() => {
                                setEditModal(false);
                                setEditStudent(null);
                            }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={(e) => handleSubmit(e, editModal)} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Ism */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ism *</label>
                                    <input
                                        type="text"
                                        value={editModal ? editFormData.first_name : formData.first_name}
                                        onChange={(e) => (editModal
                                            ? setEditFormData({ ...editFormData, first_name: e.target.value })
                                            : setFormData({ ...formData, first_name: e.target.value })
                                        )}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* Familiya */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Familiya *</label>
                                    <input
                                        type="text"
                                        value={editModal ? editFormData.last_name : formData.last_name}
                                        onChange={(e) => (editModal
                                            ? setEditFormData({ ...editFormData, last_name: e.target.value })
                                            : setFormData({ ...formData, last_name: e.target.value })
                                        )}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* Telefon raqami */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqami *</label>
                                    <input
                                        type="tel"
                                        value={editModal ? editFormData.phone_number : formData.phone_number}
                                        onChange={(e) => (editModal
                                            ? setEditFormData({ ...editFormData, phone_number: e.target.value })
                                            : setFormData({ ...formData, phone_number: e.target.value })
                                        )}
                                        placeholder="+998901234567"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* YANGI: Ota/ona ismi — bitta input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ota/ona ismi</label>
                                    <input
                                        type="text"
                                        value={editModal ? editFormData.father_name : formData.father_name}
                                        onChange={(e) => (editModal
                                            ? setEditFormData({ ...editFormData, father_name: e.target.value })
                                            : setFormData({ ...formData, father_name: e.target.value })
                                        )}
                                        placeholder="Ota yoki onaning ismi va familiyasi"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Ota/ona telefoni */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ota/ona telefoni *</label>
                                    <input
                                        type="tel"
                                        value={editModal ? editFormData.parents_phone_number : formData.parents_phone_number}
                                        onChange={(e) => (editModal
                                            ? setEditFormData({ ...editFormData, parents_phone_number: e.target.value })
                                            : setFormData({ ...formData, parents_phone_number: e.target.value })
                                        )}
                                        placeholder="+998901234567"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* Tug'ilgan sana */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tug'ilgan sana</label>
                                    <input
                                        type="date"
                                        value={editModal ? editFormData.birth_date : formData.birth_date}
                                        onChange={(e) => (editModal
                                            ? setEditFormData({ ...editFormData, birth_date: e.target.value })
                                            : setFormData({ ...formData, birth_date: e.target.value })
                                        )}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* O'qishga kelgan sana */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">O'qishga kelgan sana</label>
                                    <input
                                        type="date"
                                        value={editModal ? editFormData.came_in_school : formData.came_in_school}
                                        onChange={(e) => (editModal
                                            ? setEditFormData({ ...editFormData, came_in_school: e.target.value })
                                            : setFormData({ ...formData, came_in_school: e.target.value })
                                        )}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Izoh */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Izoh / qo'shimcha</label>
                                    <textarea
                                        value={editModal ? editFormData.notes : formData.notes}
                                        onChange={(e) => (editModal
                                            ? setEditFormData({ ...editFormData, notes: e.target.value })
                                            : setFormData({ ...formData, notes: e.target.value })
                                        )}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => { setAddModal(false); setEditModal(false); }}
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <Check size={18} />
                                    Saqlash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {assignModal && assignStudent && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b bg-gradient-to-r from-green-700 to-green-600 text-white rounded-t-xl flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {assignStudent.first_name} {assignStudent.last_name} ni guruhlarga biriktirish
                            </h2>
                            <button onClick={() => setAssignModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="mb-4 text-sm text-gray-600">
                                Ushbu o'quvchi asosiy ro'yxatga o'tkaziladi va quyidagi guruh(lar)ga biriktiriladi:
                            </p>

                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {groups.length === 0 ? (
                                    <p className="text-center text-gray-500 py-6">Guruhlar yuklanmadi yoki hali mavjud emas</p>
                                ) : (
                                    groups.map((group) => (
                                        <label
                                            key={group.id}
                                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedGroups.includes(group.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedGroups([...selectedGroups, group.id]);
                                                    } else {
                                                        setSelectedGroups(selectedGroups.filter(id => id !== group.id));
                                                    }
                                                }}
                                                className="w-5 h-5 text-green-600 rounded"
                                            />
                                            <span className="font-medium">{group.group_subject}</span>
                                        </label>
                                    ))
                                )}
                            </div>

                            <div className="mt-8 flex justify-end gap-4 pt-4 border-t">
                                <button
                                    onClick={() => setAssignModal(false)}
                                    className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={handleAssignGroups}
                                    disabled={selectedGroups.length === 0}
                                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Check size={18} />
                                    Saqlash va o'tkazish
                                </button>
                            </div>

                            {selectedGroups.length === 0 && (
                                <p className="mt-3 text-sm text-amber-700 text-center">
                                    Kamida bitta guruh tanlanishi kerak
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Tanlangan o'quvchi modal (detail + approve tugmasi) */}
            {detailStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-t-xl flex justify-between items-center">
                            <h2 className="text-xl font-bold">Zaxiradagi o'quvchi</h2>
                            <button onClick={() => { setDetailStudent(null) }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Shaxsiy ma'lumotlar</h3>
                                    <p><strong>Ism Familiya:</strong> {detailStudent.first_name} {detailStudent.last_name}</p>
                                    <p><strong>Telefon:</strong> {detailStudent.phone_number}</p>
                                    <p><strong>Tug'ilgan sana:</strong> {detailStudent.birth_date ? new Date(detailStudent.birth_date).toLocaleDateString('uz-UZ') : "—"}</p>
                                    <p><strong>O'qishga kelgan sana:</strong> {detailStudent.came_in_school ? new Date(detailStudent.came_in_school).toLocaleDateString('uz-UZ') : "—"}</p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Ota-ona</h3>
                                    <p><strong>Ismi:</strong> {detailStudent.father_name || "—"}</p>
                                    <p><strong>Telefon:</strong> {detailStudent.parents_phone_number}</p>
                                </div>
                            </div>

                            {detailStudent.notes && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Izoh</h3>
                                    <p className="bg-gray-50 p-3 rounded border">{detailStudent.notes}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-4 pt-4 border-t p-6">
                            <button
                                onClick={() => { openEditModal(detailStudent); setDetailStudent(null) }}
                                className="px-5 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-2"
                            >
                                <Pen size={16} /> Tahrirlash
                            </button>

                            <button
                                onClick={() => showDeleteToast(detailStudent.id)}
                                className="px-5 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-2"
                            >
                                <Trash2 size={16} /> O'chirish
                            </button>

                            {/* Yangi tugma: Guruhlarga biriktirish */}
                            <button
                                onClick={() => { openAssignModal(detailStudent); setDetailStudent(null) }}
                                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                            >
                                <Users size={18} /> Guruhlarga biriktirish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}