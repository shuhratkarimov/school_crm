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
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [bulkAssignModal, setBulkAssignModal] = useState(false);
    const [bulkSelectedGroups, setBulkSelectedGroups] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [progressModal, setProgressModal] = useState(false);
    const [progressData, setProgressData] = useState({
        jobId: "",
        status: "pending",
        total: 0,
        processed: 0,
        percent: 0,
        successCount: 0,
        failedCount: 0,
        message: "",
        errors: [],
        type: "",
    });
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

    const listenToBulkProgress = (jobId, onDone) => {
        const es = new EventSource(`${API_URL}/bulk_job_progress/${jobId}`, {
            withCredentials: true,
        });

        setProgressModal(true);

        es.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setProgressData(data);

            if (data.done) {
                es.close();
                setBulkLoading(false);

                if (data.status === "done") {
                    toast.success(data.message || "Jarayon yakunlandi");
                    onDone?.(data);
                } else {
                    toast.error(data.message || "Jarayonda xatolik yuz berdi");
                }
            }
        };

        es.onerror = () => {
            es.close();
            setBulkLoading(false);
            toast.error("Progress stream uzildi");
        };

        return es;
    };

    const handleAssignGroups = async () => {
        if (!assignStudent) return;

        try {
            const res = await fetch(`${API_URL}/approve_reserve_student/${assignStudent.id}`, {
                method: "POST",
                credentials: "include",
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
            const res = await fetch(`${API_URL}/get_reserve_students`, { credentials: "include" });
            if (!res.ok) throw new Error("Zaxiradagi o'quvchilarni yuklashda xato");
            const data = await res.json();
            console.log(data);
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
            const res = await fetch(`${API_URL}/get_groups`, { credentials: "include" });
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

                    if (["ism", "firstname", "first_name"].includes(header)) {
                        student.first_name = value ? String(value).trim() : "";
                    }

                    if (["familiya", "lastname", "last_name"].includes(header)) {
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
                    if (header === "tug'ilgan sana" || header.includes("birth")) {
                        student.birth_date = value ? parseFlexibleDate(value) : null;
                    }
                    if (header === "o'qishga kelgan sana" || header.includes("came")) {
                        student.came_in_school = value ? parseFlexibleDate(value) : null;
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
                    credentials: "include",
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || "Import xatosi");
                }

                const data = await res.json();

                listenToBulkProgress(data.jobId, () => {
                    fetchReserveStudents();
                    setImportModal(false);
                    setSelectedFile(null);
                });
            } catch (err) {
                toast.error(err.message || "Xatolik yuz berdi");
                setImportErrors([err.message]);
            }
        };

        reader.readAsArrayBuffer(selectedFile);
    };

    function parseFlexibleDate(value) {
        if (!value) return null;

        // Excel serial number bo'lsa
        if (typeof value === 'number') {
            const utcDays = Math.floor(value - 25569);
            const date = new Date(utcDays * 86400 * 1000);
            return date.toISOString().split('T')[0];
        }

        if (typeof value !== 'string') return null;

        const str = value.trim().replace(/\s+/g, '');

        let year, month, day;

        // dd.mm.yyyy yoki dd.mm.yy
        const dotMatch = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/);
        if (dotMatch) {
            [day, month, year] = dotMatch.slice(1);
            if (year.length === 2) year = '20' + year;
        }

        // dd/mm/yyyy yoki d/m/yy
        else if (str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/)) {
            const parts = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
            [day, month, year] = parts.slice(1);
            if (year.length === 2) year = '20' + year;
        }

        // yyyy-mm-dd
        else if (str.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
            [year, month, day] = str.split('-');
        }

        if (year && month && day) {
            // Eng muhimi — UTC sana yaratish
            const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0));

            // Agar sana noto'g'ri bo'lsa (masalan 31-fevral), Date avto-korreksiya qiladi
            // Lekin biz xohlamaymiz — shuning uchun tekshirib qaytaramiz
            if (
                date.getUTCFullYear() === Number(year) &&
                date.getUTCMonth() === Number(month) - 1 &&
                date.getUTCDate() === Number(day)
            ) {
                return date.toISOString().split('T')[0];
            }
        }

        // Fallback — brauzer sinab ko'radi
        const fallback = new Date(str);
        if (!isNaN(fallback.getTime())) {
            // fallback ham local bo'lishi mumkin, shuning uchun UTC ga o'tkazamiz
            return new Date(Date.UTC(
                fallback.getFullYear(),
                fallback.getMonth(),
                fallback.getDate()
            )).toISOString().split('T')[0];
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
                credentials: "include"
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


    const showDeleteToast = ({
        title = "Diqqat!",
        message = "Ushbu ma'lumot o'chiriladi!",
        confirmText = "O'chirish",
        cancelText = "Bekor qilish",
        onConfirm,
    }) => {
        const toastId = toast(
            <div className="min-w-[280px]">
                <p className="text-sm font-medium text-gray-800">{title}</p>
                <p className="mt-2 text-sm text-gray-600">{message}</p>

                <div className="flex gap-3 mt-4">
                    <button
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        onClick={async () => {
                            try {
                                await onConfirm?.();
                            } finally {
                                toast.dismiss(toastId);
                            }
                        }}
                    >
                        {confirmText}
                    </button>

                    <button
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        onClick={() => toast.dismiss(toastId)}
                    >
                        {cancelText}
                    </button>
                </div>
            </div>,
            {
                duration: 10000,
            }
        );
    };

    // O'chirish
    const deleteReserveStudent = async (id) => {
        try {
            const res = await fetch(`${API_URL}/delete_reserve_student/${id}`, { method: "DELETE", credentials: "include" });
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
                credentials: "include",
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

    const isAllSelected =
        filteredStudents.length > 0 &&
        filteredStudents.every((student) => selectedStudentIds.includes(student.id));

    const toggleStudentSelection = (id) => {
        setSelectedStudentIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (isAllSelected) {
            const filteredIds = filteredStudents.map((s) => s.id);
            setSelectedStudentIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
        } else {
            const filteredIds = filteredStudents.map((s) => s.id);
            setSelectedStudentIds((prev) => [...new Set([...prev, ...filteredIds])]);
        }
    };

    const clearSelections = () => {
        setSelectedStudentIds([]);
        setBulkSelectedGroups([]);
    };

    const deleteSelectedReserveStudents = async () => {
        if (selectedStudentIds.length === 0) {
            toast.error("Hech qanday o'quvchi tanlanmagan");
            return;
        }

        try {
            setBulkLoading(true);

            const res = await fetch(`${API_URL}/delete_reserve_students_bulk`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ ids: selectedStudentIds }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Belgilangan o'quvchilarni o'chirishda xato");
            }

            const data = await res.json();

            listenToBulkProgress(data.jobId, () => {
                clearSelections();
                setDetailStudent(null);
                fetchReserveStudents();
            });
        } catch (err) {
            toast.error(err.message || "Xatolik yuz berdi");
            setBulkLoading(false);
        }
    };

    const handleBulkAssignGroups = async () => {
        if (selectedStudentIds.length === 0) {
            toast.error("Hech qanday o'quvchi tanlanmagan");
            return;
        }

        if (bulkSelectedGroups.length === 0) {
            toast.error("Kamida bitta guruh tanlang");
            return;
        }

        try {
            setBulkLoading(true);

            const res = await fetch(`${API_URL}/approve_reserve_students_bulk`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reserve_student_ids: selectedStudentIds,
                    group_ids: bulkSelectedGroups,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Belgilangan o'quvchilarni o'tkazishda xato");
            }

            const data = await res.json();

            listenToBulkProgress(data.jobId, () => {
                fetchReserveStudents();
                clearSelections();
                setBulkAssignModal(false);
                setDetailStudent(null);
            });
        } catch (err) {
            toast.error(err.message || "Xatolik yuz berdi");
        } finally {
            setBulkLoading(false);
        }
    };

    if (loading) return <LottieLoading />;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between px-6 pt-6">
                <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-800">
                    <AlertCircle className="text-blue-700" size={32} />
                    Yangi o'quvchilar (zaxira)
                </h1>
                <div className="flex gap-4">
                    <button
                        onClick={() => setImportModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 btn btn-primary text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Plus size={18} /> Excel import
                    </button>
                    <button
                        onClick={() => setAddModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 btn btn-primary text-white rounded-lg hover:bg-blue-700 transition"
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
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {selectedStudentIds.length > 0 && (
                <div className="px-6 mb-4">
                    <div className="bg-white border border-blue-200 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">
                                    {selectedStudentIds.length} ta o'quvchi tanlandi
                                </p>
                                <p className="text-sm text-gray-500">
                                    Belgilangan o'quvchilar ustida ommaviy amal bajarishingiz mumkin
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setBulkAssignModal(true)}
                                disabled={bulkLoading}
                                className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                            >
                                <Users size={18} />
                                Guruhga biriktirish
                            </button>

                            <button
                                onClick={() =>
                                    showDeleteToast({
                                        title: "Belgilangan o'quvchilarni o'chirish",
                                        message: `${selectedStudentIds.length} ta zaxiradagi o'quvchini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`,
                                        confirmText: "Ha, o'chirish",
                                        onConfirm: deleteSelectedReserveStudents,
                                    })
                                }
                                disabled={bulkLoading || selectedStudentIds.length === 0}
                                className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
                            >
                                <Trash2 size={18} />
                                O'chirish
                            </button>

                            <button
                                onClick={clearSelections}
                                disabled={bulkLoading}
                                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition"
                            >
                                Bekor qilish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="px-6">
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[#104292] text-white">
                            <tr>
                                <th className="p-4 text-center">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4"
                                    />
                                </th>
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
                                    <td colSpan={8} className="p-8 text-center text-gray-500">                                        {searchTerm ? "Hech narsa topilmadi" : "Hozircha zaxirada o'quvchi yo'q"}
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student, idx) => (
                                    <tr
                                        key={student.id}
                                        className={`border-b transition-colors cursor-pointer ${selectedStudentIds.includes(student.id) ? "bg-blue-50" : "hover:bg-gray-50"
                                            }`}
                                        onClick={() => setDetailStudent(student)}
                                    >
                                        <td
                                            className="p-4 text-center"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedStudentIds.includes(student.id)}
                                                onChange={() => toggleStudentSelection(student.id)}
                                                className="w-4 h-4 accent-blue-600"
                                            />
                                        </td>

                                        <td className="p-4">{idx + 1}</td>
                                        <td className="p-4 font-medium">{student.first_name} {student.last_name}</td>
                                        <td className="p-4">{student.phone_number}</td>
                                        <td className="p-4">{student.parents_phone_number}</td>
                                        <td className="p-4">
                                            {student.birth_date ? new Date(student.birth_date).toLocaleDateString("ru-RU") : "—"}
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                                {student.status === "new" ? "Yangi" : student.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal(student);
                                                    }}
                                                    className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                                >
                                                    <Pen size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        showDeleteToast({
                                                            title: "O'quvchini o'chirish",
                                                            message: "Diqqat! Ushbu zaxiradagi o'quvchiga tegishli barcha ma'lumotlar o'chiriladi!",
                                                            confirmText: "O'chirish",
                                                            onConfirm: () => deleteReserveStudent(student.id),
                                                        });
                                                    }}
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
                        <div className="p-6 border-b bg-[#104292] text-white rounded-t-xl flex justify-between items-center">
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
                                    className="px-5 py-2 bg-[#104292] text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <div className="p-6 border-b bg-[#104292] text-white rounded-t-xl flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {editModal ? "Ma'lumotlarni tahrirlash" : "Yangi o'quvchi qo'shish (zaxira)"}
                            </h2>
                            <button
                                onClick={() => {
                                    setAddModal(false);
                                    setEditModal(false);
                                    setEditStudent(null);
                                }}
                            >
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
                                    className="px-6 py-2 bg-[#104292] text-white rounded hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <Check size={18} />
                                    Saqlash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {progressModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-[#104292] text-white px-6 py-4">
                            <h2 className="text-xl font-bold">Jarayon davom etmoqda</h2>
                            <p className="text-sm text-blue-100 mt-1">
                                {progressData.message || "Iltimos kuting..."}
                            </p>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Progress</span>
                                    <span className="font-semibold text-gray-800">
                                        {progressData.percent || 0}%
                                    </span>
                                </div>

                                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-600 transition-all duration-300"
                                        style={{ width: `${progressData.percent || 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl bg-blue-50 p-4 text-center">
                                    <p className="text-sm text-gray-500">Jami</p>
                                    <p className="text-xl font-bold text-blue-700">{progressData.total || 0}</p>
                                </div>
                                <div className="rounded-xl bg-green-50 p-4 text-center">
                                    <p className="text-sm text-gray-500">Bajarildi</p>
                                    <p className="text-xl font-bold text-green-700">{progressData.successCount || 0}</p>
                                </div>
                                <div className="rounded-xl bg-red-50 p-4 text-center">
                                    <p className="text-sm text-gray-500">Xato</p>
                                    <p className="text-xl font-bold text-red-700">{progressData.failedCount || 0}</p>
                                </div>
                            </div>

                            <div className="text-sm text-gray-600">
                                <strong>{progressData.processed || 0}</strong> / <strong>{progressData.total || 0}</strong> ta ishlov berildi
                            </div>

                            {progressData.errors?.length > 0 && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-4 max-h-40 overflow-y-auto">
                                    <p className="font-semibold text-red-700 mb-2">Xatolar:</p>
                                    <div className="space-y-1 text-sm text-red-600">
                                        {progressData.errors.slice(0, 10).map((err, idx) => (
                                            <p key={idx}>{err}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(progressData.status === "done" || progressData.status === "error") && (
                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={() => {
                                            setProgressModal(false);
                                            setProgressData({
                                                jobId: "",
                                                status: "pending",
                                                total: 0,
                                                processed: 0,
                                                percent: 0,
                                                successCount: 0,
                                                failedCount: 0,
                                                message: "",
                                                errors: [],
                                                type: "",
                                            });
                                            setBulkLoading(false);
                                        }}
                                        className="px-5 py-2.5 bg-[#104292] text-white rounded-xl hover:bg-blue-700"
                                    >
                                        Yopish
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {bulkAssignModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b bg-[#104292] text-white rounded-t-xl flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold">Belgilangan o'quvchilarni guruhlarga biriktirish</h2>
                                <p className="text-sm text-blue-100 mt-1">
                                    {selectedStudentIds.length} ta o'quvchi tanlangan
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    if (!bulkLoading) {
                                        setBulkAssignModal(false);
                                        setBulkSelectedGroups([]);
                                    }
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="mb-4 text-sm text-gray-600">
                                Belgilangan o'quvchilar asosiy ro'yxatga o'tkaziladi va tanlangan guruh(lar)ga biriktiriladi.
                            </p>

                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {groups.length === 0 ? (
                                    <p className="text-center text-gray-500 py-6">
                                        Guruhlar yuklanmadi yoki hali mavjud emas
                                    </p>
                                ) : (
                                    groups.map((group) => (
                                        <label
                                            key={group.id}
                                            className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 cursor-pointer transition"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={bulkSelectedGroups.includes(group.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setBulkSelectedGroups((prev) => [...prev, group.id]);
                                                    } else {
                                                        setBulkSelectedGroups((prev) =>
                                                            prev.filter((id) => id !== group.id)
                                                        );
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
                                    onClick={() => {
                                        setBulkAssignModal(false);
                                        setBulkSelectedGroups([]);
                                    }}
                                    disabled={bulkLoading}
                                    className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 disabled:opacity-50"
                                >
                                    Bekor qilish
                                </button>

                                <button
                                    onClick={handleBulkAssignGroups}
                                    disabled={bulkLoading || bulkSelectedGroups.length === 0}
                                    className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Check size={18} />
                                    {bulkLoading ? "Saqlanmoqda..." : "Saqlash va o'tkazish"}
                                </button>
                            </div>

                            {bulkSelectedGroups.length === 0 && (
                                <p className="mt-3 text-sm text-amber-700 text-center">
                                    Kamida bitta guruh tanlanishi kerak
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {assignModal && assignStudent && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b bg-[#104292] text-white rounded-t-xl flex justify-between items-center">
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
                                onClick={() =>
                                    showDeleteToast({
                                        title: "O'quvchini o'chirish",
                                        message: "Diqqat! Ushbu zaxiradagi o'quvchiga tegishli barcha ma'lumotlar o'chiriladi!",
                                        confirmText: "O'chirish",
                                        onConfirm: () => deleteReserveStudent(detailStudent.id),
                                    })
                                }
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