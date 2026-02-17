"use client";

import { useState, useEffect } from "react";
import { Trash2, BookOpen, Plus, Pen, X, Check, Calendar, CreditCard, Users, User, MessageSquare, DollarSign, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import "../../styles/styles.css";
import LottieLoading from "../components/Loading";
import API_URL from "../conf/api";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [groupsError, setGroupsError] = useState("");
  const [studentsError, setStudentsError] = useState("");
  const [paymentsError, setPaymentsError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [monthFilter, setMonthFilter] = useState("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    pupil_id: "",
    payment_amount: "",
    payment_type: "",
    received: "",
    for_which_month: "",
    comment: "",
    shouldBeConsideredAsPaid: false,
  });
  const [addModal, setAddModal] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0); // Umumiy summa

  const [formData, setFormData] = useState({
    for_which_group: "", // "group_id" o'rniga "for_which_group"
    pupil_id: "",
    payment_amount: "",
    payment_type: "",
    received: "",
    for_which_month: "",
    comment: "",
    shouldBeConsideredAsPaid: false,
  });

  const calculateTotalAmount = (groupsList, month, cameInSchool, discountPercent) => {
    if (!groupsList || groupsList.length === 0 || !month || !cameInSchool) return 0;

    let total = 0;
    groupsList.forEach(groupId => {
      const group = groups.find(g => g.id === groupId);
      if (group) {
        const amount = calculatePaymentAmount(group, month, cameInSchool);
        total += Number(amount) || 0;
      }
    });

    // Chegirma qo'llash
    if (discountPercent > 0 && total > 0) {
      total = total * (1 - discountPercent / 100);
    }

    return Math.round(total);
  };

  const allMonths = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentyabr",
    "Oktyabr",
    "Noyabr",
    "Dekabr",
  ];

  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const currentMonth = allMonths[currentMonthIndex];
  const nextMonth = allMonths[(currentMonthIndex + 1) % 12];
  const radioMonths = [currentMonth, nextMonth];
  const selectMonths = allMonths.filter(
    (month) => !radioMonths.includes(month)
  );

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      for_which_month: currentMonth,
    }));
  }, [currentMonth]);

  const handleChange = (value) => {
    setFormData(prev => {
      // Yangi oy uchun to'lov miqdorini qayta hisoblaymiz
      const selectedGroup = groups.find(group => group.id === prev.for_which_group);
      const calculatedAmount = calculatePaymentAmount(
        selectedGroup,
        value,
        prev.came_in_school
      );

      return {
        ...prev,
        for_which_month: value,
        payment_amount: calculatedAmount || prev.payment_amount
      };
    });
  };

  const handleEditChange = (value) => {
    setEditFormData(prev => {
      // Yangi oy uchun to'lov miqdorini qayta hisoblaymiz
      const selectedGroup = groups.find(group => group.id === prev.for_which_group);
      const calculatedAmount = calculatePaymentAmount(
        selectedGroup,
        value,
        prev.came_in_school
      );

      return {
        ...prev,
        for_which_month: value,
        payment_amount: calculatedAmount || prev.payment_amount
      };
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setGroupsError("");
      setStudentsError("");
      setPaymentsError("");

      const [groupsResponse, studentsResponse, paymentsResponse] =
        await Promise.all([
          fetch(`${API_URL}/get_groups`).catch(() => ({
            ok: false,
          })),
          fetch(`${API_URL}/get_students`).catch(() => ({
            ok: false,
          })),
          fetch(`${API_URL}/get_payments`).catch(() => ({
            ok: false,
          })),
        ]);

      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        const groupsWithAmount = groupsData.map((group) => ({
          ...group,
          payment_amount: group.monthly_fee,
        }));
        setGroups(groupsWithAmount);
      } else {
        setGroups([]);
        toast.error("To'lovlar mavjud emas");
      }

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);
      } else {
        setStudents([]);
        toast.error("O'quvchilar mavjud emas");
      }

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData);
      } else {
        setPayments([]);
        toast.error("To'lovlar mavjud emas");
      }
    } catch (err) {
      setGroups([]);
      setStudents([]);
      setPayments([]);
      toast.error("Ma'lumotlarni yuklashda umumiy xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const addPayment = async (e) => {
    e.preventDefault();

    // Tanlangan guruhlar sonini tekshirish
    if (selectedGroups.length === 0) {
      toast.error("Kamida bitta guruh tanlang");
      return;
    }

    // Loading state (ixtiyoriy)
    toast.loading("To'lovlar qo'shilmoqda...", { id: "add-payment" });

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Har bir tanlangan guruh uchun alohida to'lov yaratish
      for (const groupId of selectedGroups) {
        const group = groups.find(g => g.id === groupId);

        // Har bir guruh uchun to'lov miqdorini hisoblash (chegirmasiz)
        const groupAmount = calculatePaymentAmount(
          group,
          formData.for_which_month,
          formData.came_in_school
        );

        // Chegirmani har bir guruhga teng taqsimlash yoki 
        // umumiy summadan kelib chiqib hisoblash
        let paymentAmount = Number(groupAmount);

        // Agar chegirma bo'lsa, har bir guruh to'loviga chegirmani proporsional taqsimlash
        if (discount > 0 && totalAmount > 0) {
          const groupShare = paymentAmount / (totalAmount / (1 - discount / 100));
          paymentAmount = Math.round(paymentAmount - (groupShare * discount / 100));
        }

        const response = await fetch(
          `${API_URL}/create_payment`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pupil_id: formData.pupil_id,
              for_which_group: groupId,
              payment_amount: paymentAmount,
              payment_type: formData.payment_type,
              received: formData.received,
              for_which_month: formData.for_which_month,
              comment: formData.comment ?
                `${formData.comment} (Guruh: ${group?.group_subject})` :
                `Guruh: ${group?.group_subject}`,
              shouldBeConsideredAsPaid: formData.shouldBeConsideredAsPaid,
            }),
          }
        );

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
          const errorData = await response.json();
          errors.push(`${group?.group_subject}: ${errorData.message}`);
        }
      }

      // Loadingni yopish
      toast.dismiss("add-payment");

      // Natijalarni ko'rsatish
      if (successCount > 0) {
        await fetchData();
        toast.success(`${successCount} ta to'lov muvaffaqiyatli qo'shildi`);

        if (errorCount > 0) {
          toast.error(`${errorCount} ta to'lovda xatolik: ${errors.join(', ')}`);
        }

        // Formani tozalash
        setFormData({
          for_which_group: "",
          pupil_id: "",
          payment_amount: "",
          payment_type: "",
          received: "",
          for_which_month: currentMonth,
          comment: "",
          shouldBeConsideredAsPaid: false,
        });
        setStudentSearch("");
        setSearchTerm("");
        setShowDropdown(false);
        setSelectedGroups([]);
        setDiscount(0);
        setTotalAmount(0);
        setAddModal(false);
      } else {
        toast.error(`To'lov qo'shilmadi: ${errors.join(', ')}`);
      }

    } catch (err) {
      toast.dismiss("add-payment");
      toast.error(`Xatolik yuz berdi: ${err.message}`);
    }
  };

  const updatePayment = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API_URL}/update_payment/${editFormData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pupil_id: editFormData.pupil_id,
            payment_amount: Number(editFormData.payment_amount),
            payment_type: editFormData.payment_type,
            received: editFormData.received,
            for_which_month: editFormData.for_which_month,
            comment: editFormData.comment,
            shouldBeConsideredAsPaid: editFormData.shouldBeConsideredAsPaid,
          }),
        }
      );

      if (response.ok) {
        const updatedPayment = await response.json();
        const student = students.find((s) => s.id === editFormData.pupil_id);
        const paymentWithStudent = {
          ...updatedPayment,
          student: student || {
            first_name: "N/A",
            last_name: "N/A",
            phone_number: "N/A",
          },
        };
        setPayments(
          payments.map((p) =>
            p.id === editFormData.id ? paymentWithStudent : p
          )
        );
        toast.success(`To'lov muvaffaqiyatli yangilandi`);
        setIsEditModalOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(`${errorData.message}`);
      }
    } catch (err) {
      toast.error(`${err.message}`);
    }
  };

  const deletePayment = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/delete_payment/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setPayments(payments.filter((p) => p.id !== id));
        toast.success(`To'lov muvaffaqiyatli o'chirildi`);
      }
    } catch (err) {
      toast.error(`${err.message}`);
    }
  };

  const openEditModal = (payment) => {
    // Student ma'lumotlarini topamiz
    const student = students.find(s => s.id === payment.pupil_id);

    setEditFormData({
      id: payment.id,
      pupil_id: payment.pupil_id,
      payment_amount: payment.payment_amount,
      payment_type: payment.payment_type,
      received: payment.received,
      for_which_month: payment.for_which_month,
      comment: payment.comment,
      came_in_school: student?.came_in_school || "",
      for_which_group: payment.for_which_group,
      shouldBeConsideredAsPaid: payment.shouldBeConsideredAsPaid,
    });
    setIsEditModalOpen(true);
  };

  const filteredStudents = students.filter((student) =>
    `${student.first_name} ${student.last_name}`
      .toLowerCase()
      .includes(studentSearch.toLowerCase())
  );

  const openDetailModal = (payment) => {
    setSelectedPayment(payment);
    setIsDetailModalOpen(true);
  };

  const handleStudentSelect = (student) => {
    setFormData({ ...formData, pupil_id: student.id, group_id: "", came_in_school: student.came_in_school });
    setStudentSearch(`${student.first_name} ${student.last_name}`);
    setShowDropdown(false);
    setSelectedGroups([]); // Tanlangan guruhlarni tozalash
    setDiscount(0); //
    setFormData((prev) => ({
      ...prev,
      shouldBeConsideredAsPaid: false,
    }));
  };

  const handleGroupToggle = (groupId) => {
    setSelectedGroups(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const handleDiscountChange = (value) => {
    // Agar value bo'sh string bo'lsa, 0 qaytar
    if (value === "") {
      setDiscount(0);
      return;
    }

    // Faqat raqamlarni olish
    const numericValue = value.replace(/[^0-9]/g, '');

    // Agar numericValue bo'sh bo'lmasa
    if (numericValue !== "") {
      // Number ga o'tkazish va 0-100 oralig'ida cheklash
      let discountValue = parseInt(numericValue, 10);
      discountValue = Math.min(100, Math.max(0, discountValue));
      setDiscount(discountValue);
    } else {
      setDiscount(0);
    }
  };

  const getStudentGroups = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student?.groups.map((group) => group.id) || []; // `groups` dan `id` larni olish
  };

  const isOverdue = (studentId) => {
    const studentPayments = payments.filter((p) => p.pupil_id === studentId);
    const currentOrNextMonthPaid = studentPayments.some(
      (p) =>
        [currentMonth, nextMonth].includes(p.for_which_month) &&
        new Date(p.created_at) >=
        new Date(now.getFullYear(), now.getMonth() - 1, 1)
    );
    return !currentOrNextMonthPaid && students.find((s) => s.id === studentId);
  };

  useEffect(() => {
    if (formData.pupil_id && selectedGroups.length > 0 && formData.for_which_month) {
      const total = calculateTotalAmount(
        selectedGroups,
        formData.for_which_month,
        formData.came_in_school,
        discount
      );
      setTotalAmount(total);
      // setFormData(prev => ({
      //   ...prev,
      //   payment_amount: total.toString()
      // }));
    } else {
      setTotalAmount(0);
      // setFormData(prev => ({
      //   ...prev,
      //   payment_amount: ""
      // }));
    }
  }, [selectedGroups, discount, formData.for_which_month, formData.pupil_id, formData.came_in_school]);

  const sendNotification = async (studentId) => {
    try {
      const response = await fetch(
        `${API_URL}/payment_alert/${studentId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        toast.success("Xabar muvaffaqiyatli jo'natildi");
      } else {
        throw new Error("Xabarni jo'natishda xatolik");
      }
    } catch (err) {
      toast.error(`Xabarni jo'natishda xatolik: ${err.message}`);
    }
  };

  const filteredPayments = payments.filter(
    (payment) =>
      `${payment.student?.first_name} ${payment.student?.last_name}`
        ?.toLowerCase()
        ?.includes(searchTerm.toLowerCase()) &&
      (monthFilter === "all" || payment.for_which_month === monthFilter)
  );

  useEffect(() => {
    if (formData.pupil_id && groups.length > 0) {
      const studentGroups = getStudentGroups(formData.pupil_id);
      const selectedGroup = groups.find(
        (group) => group.id === formData.for_which_group
      );

      if (selectedGroup && studentGroups.includes(selectedGroup.id)) {
        const calculatedAmount = calculatePaymentAmount(
          selectedGroup,
          formData.for_which_month,
          formData.came_in_school
        );

        setFormData((prev) => ({
          ...prev,
          payment_amount: calculatedAmount,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          payment_amount: "",
          for_which_group: "",
        }));
      }
    }
  }, [formData.pupil_id, formData.for_which_group, formData.for_which_month, groups, formData.shouldBeConsideredAsPaid]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (studentSearch) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [studentSearch]);

  useEffect(() => { }, [formData.pupil_id, studentSearch, filteredStudents]);

  useEffect(() => { }, [payments]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
    if (groupsError || studentsError || paymentsError) {
      const timer = setTimeout(() => {
        setGroupsError("");
        setStudentsError("");
        setPaymentsError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, groupsError, studentsError, paymentsError]);

  const calculatePaymentAmount = (group, month, cameInSchool) => {
    if (!group || !month || !cameInSchool) return group?.payment_amount || "";

    const monthlyFee = Number(group.payment_amount);
    if (!monthlyFee) return "";

    // Joriy yil va oy
    const now = new Date();
    const currentYear = now.getFullYear();

    // Tanlangan oyning indeksi
    const monthIndex = allMonths.findIndex(m => m === month);
    if (monthIndex === -1) return monthlyFee;

    // Tanlangan oyning birinchi va oxirgi kuni
    const selectedMonthFirstDay = new Date(currentYear, monthIndex, 1);
    const selectedMonthLastDay = new Date(currentYear, monthIndex + 1, 0);

    // O'quvchining kelgan sanasi
    const cameDate = new Date(cameInSchool);

    // Agar o'quvchi tanlangan oydan keyin kelgan bo'lsa
    if (cameDate > selectedMonthLastDay) return "0";

    // Agar o'quvchi tanlangan oydan oldin kelgan bo'lsa
    if (cameDate <= selectedMonthFirstDay) return monthlyFee.toString();

    // O'quvchi oyning o'rtasida kelgan bo'lsa
    const daysInMonth = selectedMonthLastDay.getDate();
    const daysToPay = daysInMonth - cameDate.getDate() + 1;

    // Kunlik to'lov miqdori
    const dailyFee = monthlyFee / daysInMonth;

    // To'lov miqdori
    const calculatedAmount = Math.round(dailyFee * daysToPay);

    return calculatedAmount.toString();
  };

  if (loading) {
    return <LottieLoading />;
  }

  const showDeleteToast = (id) => {
    toast(
      <div>
        <p>
          Diqqat! Ushbu to'lovga tegishli barcha ma'lumotlar o'chiriladi!
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
              deletePayment(id);
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

  return (
    <div>
      <div className="flex justify-between items-center gap-2 pl-6 pr-6 mb-6">
        <div className="flex items-center gap-2">
          <BookOpen size={24} color="#104292" />
          <h1 className="text-2xl font-bold">To'lovlar</h1>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setAddModal(true);
            setSelectedGroups([]);
            setDiscount(0);
            setTotalAmount(0);
          }}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Plus size={20} />
          To'lov qo'shish
        </button>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-fadeIn">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-5 rounded-t-2xl flex justify-between items-center shadow">
              <h3 className="text-lg font-semibold">To'lovni tahrirlash</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white hover:bg-blue-800 p-1 rounded-full transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={updatePayment} className="p-6 space-y-5">

              {/* To'lov miqdori */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To'lov miqdori *</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editFormData.payment_amount}
                    onChange={(e) => setEditFormData({ ...editFormData, payment_amount: e.target.value })}
                    placeholder="350000"
                    min="0"
                    required
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">so'm</span>
                </div>
              </div>

              {/* To'lov turi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To'lov turi *</label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    value={editFormData.payment_type}
                    onChange={(e) => setEditFormData({ ...editFormData, payment_type: e.target.value })}
                    required
                  >
                    <option value="">To'lov turini tanlang</option>
                    <option value="Naqd">Naqd</option>
                    <option value="Plastik karta orqali">Karta orqali</option>
                    <option value="Bank o'tkazmasi">Bank o'tkazmasi</option>
                  </select>
                  <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Qaysi oy uchun */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qaysi oy uchun to'lov *</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {radioMonths.map((month) => (
                    <label key={month} className="flex items-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                        name="edit_month"
                        value={month}
                        checked={editFormData.for_which_month === month}
                        onChange={() => handleEditChange(month)}
                      />
                      <span className="ml-2 text-sm">{month}</span>
                    </label>
                  ))}
                </div>

                <div className="relative">
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    value={radioMonths.includes(editFormData.for_which_month) ? "" : editFormData.for_which_month}
                    onChange={(e) => handleEditChange(e.target.value)}
                  >
                    <option value="">Boshqa oylar</option>
                    {selectMonths.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Guruh */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guruh *</label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    value={editFormData.for_which_group}
                    onChange={(e) => {
                      const groupId = e.target.value;
                      const selectedGroup = groups.find(g => g.id === groupId);
                      const calculatedAmount = calculatePaymentAmount(
                        selectedGroup,
                        editFormData.for_which_month,
                        editFormData.came_in_school
                      );

                      setEditFormData(prev => ({
                        ...prev,
                        for_which_group: groupId,
                        payment_amount: calculatedAmount || prev.payment_amount
                      }));
                    }}
                    required
                  >
                    <option value="">Guruhni tanlang</option>
                    {editFormData.pupil_id &&
                      getStudentGroups(editFormData.pupil_id).map((groupId) => {
                        const group = groups.find((g) => g.id === groupId);
                        return (
                          group && (
                            <option key={group.id} value={group.id}>
                              {group.group_subject}
                            </option>
                          )
                        );
                      })}
                  </select>
                  <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Qabul qilgan mas'ul */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qabul qilgan mas'ul *</label>
                <input
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editFormData.received}
                  placeholder="F.I.Sh. kiriting..."
                  onChange={(e) => setEditFormData({ ...editFormData, received: e.target.value })}
                  required
                />
              </div>

              {/* Izoh */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Izoh (ixtiyoriy)</label>
                <textarea
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={editFormData.comment}
                  placeholder="Izohni kiriting..."
                  onChange={(e) => setEditFormData({ ...editFormData, comment: e.target.value })}
                />
              </div>

              {/* To'liq to'lov toggle */}
              <div className="flex items-center justify-start p-3 bg-gray-50 rounded-lg shadow-sm">
                <span className="text-gray-700 font-medium">O'quvchi imtiyozli to'lov qilmoqda <br /> va to'lovni to'liq amalga oshirdi deb hisoblash</span>
                <button
                  type="button"
                  onClick={() =>
                    setEditFormData(prev => ({
                      ...prev,
                      shouldBeConsideredAsPaid: !prev.shouldBeConsideredAsPaid,
                    }))
                  }
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${editFormData.shouldBeConsideredAsPaid ? "bg-blue-600" : "bg-gray-300"
                    }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${editFormData.shouldBeConsideredAsPaid ? "translate-x-5" : ""
                      }`}
                  />
                </button>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Check size={18} className="mr-1" />
                  Yangilash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-5 rounded-t-xl flex justify-between items-center">
              <h3 className="text-xl font-semibold">To'lov tafsilotlari</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-white hover:bg-blue-800 p-1 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <User size={20} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">O'quvchi</p>
                  <p className="font-medium">
                    {`${selectedPayment.student?.first_name || ""} ${selectedPayment.student?.last_name || ""}`.trim() || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign size={20} className="text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">To'lov miqdori</p>
                  <p className="font-medium">
                    {selectedPayment.payment_amount
                      ? Number(selectedPayment.payment_amount).toLocaleString("uz-UZ") + " so'm"
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <CreditCard size={20} className="text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">To'lov turi</p>
                  <p className="font-medium">{selectedPayment.payment_type || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-amber-100 p-3 rounded-full">
                  <User size={20} className="text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Qabul qilgan mas'ul</p>
                  <p className="font-medium">{selectedPayment.received || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-rose-100 p-3 rounded-full">
                  <Calendar size={20} className="text-rose-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Qaysi oy uchun</p>
                  <p className="font-medium">{selectedPayment.for_which_month || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-indigo-100 p-3 rounded-full">
                  <Users size={20} className="text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Guruh</p>
                  <p className="font-medium">
                    {groups.find(g => g.id === selectedPayment.for_which_group)?.group_subject || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-gray-100 p-3 rounded-full">
                  <Calendar size={20} className="text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Sana</p>
                  <p className="font-medium">
                    {selectedPayment.created_at
                      ? new Date(selectedPayment.created_at).toLocaleDateString("ru-RU")
                      : "N/A"}
                  </p>
                </div>
              </div>

              {selectedPayment.comment && (
                <div className="flex items-start">
                  <div className="bg-blue-100 p-3 rounded-full mt-1">
                    <MessageSquare size={20} className="text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Izoh</p>
                    <p className="font-medium">{selectedPayment.comment}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end p-5 border-t border-gray-200">
              <button
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {addModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setAddModal(false);
            setSelectedGroups([]);
            setDiscount(0);
            setTotalAmount(0);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Yangi to'lov qo'shish</h3>
              <button
                onClick={() => {
                  setAddModal(false);
                  setSelectedGroups([]);
                  setDiscount(0);
                  setTotalAmount(0);
                }}
                className="text-white text-2xl leading-none hover:opacity-80"
              >
                ×
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              <form id="add-payment-form" onSubmit={addPayment} className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* O'quvchi inputi */}
                <div className="relative">
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    O'quvchi *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder="O'quvchi ismini kiriting..."
                    disabled={students.length === 0}
                  />
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-md max-h-56 overflow-y-auto z-10">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <div
                            key={student.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onMouseDown={() => handleStudentSelect(student)}
                          >
                            {`${student.first_name} ${student.last_name}`}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500">
                          O'quvchi topilmadi
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Guruh selector - ko'p tanlovli */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Guruhlar * (bir nechtasini tanlashingiz mumkin)
                  </label>
                  <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto p-2">
                    {formData.pupil_id && getStudentGroups(formData.pupil_id).length > 0 ? (
                      getStudentGroups(formData.pupil_id).map((groupId) => {
                        const group = groups.find((g) => g.id === groupId);
                        return group ? (
                          <div
                            key={group.id}
                            className={`p-2 mb-1 rounded cursor-pointer transition-colors ${selectedGroups.includes(group.id)
                              ? "bg-blue-100 border border-blue-500"
                              : "hover:bg-gray-100"
                              }`}
                            onClick={() => handleGroupToggle(group.id)}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedGroups.includes(group.id)}
                                onChange={() => { }}
                                className="h-4 w-4 text-blue-600 rounded"
                              />
                              <span className="ml-2 flex-1">
                                {group.group_subject}
                              </span>
                              <span className="text-sm font-medium text-gray-600">
                                {group.payment_amount?.toLocaleString()} so'm
                              </span>
                            </div>
                          </div>
                        ) : null;
                      })
                    ) : (
                      <p className="text-gray-500 text-center py-2">
                        {formData.pupil_id
                          ? "Ushbu o'quvchiga guruh bog'lanmagan"
                          : "Avval o'quvchini tanlang"}
                      </p>
                    )}
                  </div>
                  {selectedGroups.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Tanlangan guruhlar: {selectedGroups.length} ta
                    </p>
                  )}
                </div>

                {/* To'lov miqdori va chegirma */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      To'lov miqdori *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                        value={totalAmount}
                        readOnly
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        so'm
                      </span>
                    </div>
                    {selectedGroups.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {selectedGroups.map(gId => {
                          const g = groups.find(g => g.id === gId);
                          return g ? `${g.group_subject}: ${g.payment_amount?.toLocaleString()} so'm` : '';
                        }).join(' + ')}
                      </div>
                    )}
                  </div>

                  {/* Chegirma inputi */}
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">
                      Chegirma (%)
                    </label>
                    <div className="relative">
                      <input
                        type="text"  // "number" dan "text" ga o'zgartiring
                        inputMode="numeric"  // Mobile uchun raqamli klaviatura
                        pattern="[0-9]*"     // Faqat raqamlar
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={discount === 0 ? "" : discount}  // 0 bo'lsa bo'sh string ko'rsat
                        onChange={(e) => handleDiscountChange(e.target.value)}
                        placeholder="0"
                        min="0"
                        max="100"
                        step="1"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        %
                      </span>
                    </div>
                    {discount > 0 && totalAmount > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        Chegirma: {discount}% ({(totalAmount * discount / 100).toLocaleString()} so'm)
                      </p>
                    )}
                  </div>
                </div>

                {/* To'lov turi */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    To'lov turi *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.payment_type}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_type: e.target.value })
                    }
                    required
                  >
                    <option value="">To'lov turini tanlang</option>
                    <option value="Naqd">Naqd</option>
                    <option value="Plastik karta orqali">Karta orqali</option>
                    <option value="Bank o'tkazmasi">Bank o'tkazmasi</option>
                  </select>
                </div>

                {/* Qabul qilgan shaxs */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Qabul qilgan mas'ul *
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.received}
                    placeholder="F.I.Sh. kiriting..."
                    onChange={(e) =>
                      setFormData({ ...formData, received: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Oy uchun to'lov */}
                <div className="sm:col-span-2">
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Qaysi oy uchun *
                  </label>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {radioMonths.map((month) => (
                      <label
                        key={month}
                        className="flex items-center px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                          name="month"
                          value={month}
                          checked={formData.for_which_month === month}
                          onChange={() => handleChange(month)}
                        />
                        <span className="ml-2 text-sm">{month}</span>
                      </label>
                    ))}
                  </div>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={
                      radioMonths.includes(formData.for_which_month)
                        ? ""
                        : formData.for_which_month
                    }
                    onChange={(e) => handleChange(e.target.value)}
                  >
                    <option value="">Boshqa oylar</option>
                    {selectMonths.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Izoh */}
                <div className="sm:col-span-2">
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Izoh (ixtiyoriy)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                    value={formData.comment}
                    placeholder="Qo'shimcha izoh..."
                    onChange={(e) =>
                      setFormData({ ...formData, comment: e.target.value })
                    }
                  />
                </div>

                {/* Switch toggle */}
                <div className="flex items-center justify-start gap-5 sm:col-span-2 p-3 bg-gray-50 rounded-lg shadow-sm">
                  <span className="text-gray-700 font-medium">
                    O'quvchi imtiyozli to'lov qilmoqda va to'lovni to'liq amalga oshirdi deb hisoblash
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        shouldBeConsideredAsPaid: !prev.shouldBeConsideredAsPaid,
                      }))
                    }
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${formData.shouldBeConsideredAsPaid
                      ? "bg-blue-600"
                      : "bg-gray-300"
                      }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${formData.shouldBeConsideredAsPaid ? "translate-x-5" : ""
                        }`}
                    />
                  </button>
                </div>
              </form>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setAddModal(false);
                  setSelectedGroups([]);
                  setDiscount(0);
                  setTotalAmount(0);
                }}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                form="add-payment-form"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg font-semibold hover:opacity-90 transition"
              >
                To'lovni qo'shish
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <h3 style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
            To'lov qilganlar (
            {filteredPayments.length})
          </h3>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <input
              type="text"
              className="input"
              style={{ width: "300px" }}
              placeholder="O'quvchi ismini kiriting..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="select"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              style={{ width: "200px" }}
            >
              <option value="all">Barcha oylar</option>
              {allMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid rgb(255, 255, 255)", textAlign: "center" }}>#</th>
              <th colSpan={3} style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid rgb(255, 255, 255)", textAlign: "center" }}>Ism</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid rgb(255, 255, 255)", textAlign: "center" }}>Summa</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid rgb(255, 255, 255)", textAlign: "center" }}>Qaysi oy uchun</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid rgb(255, 255, 255)", textAlign: "center" }}>Qaysi guruh uchun</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid rgb(255, 255, 255)", textAlign: "center" }}>Sana</th>
              <th style={{ backgroundColor: "#104292", color: "white", borderRight: "1px solid rgb(255, 255, 255)", textAlign: "center" }}>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "10px" }}>
                  {searchTerm || monthFilter !== "all"
                    ? "Qidiruv bo'yicha natija topilmadi"
                    : paymentsError || "Hozircha to'lovlar yo'q"}
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment, index) => {
                const group = groups.find(
                  (g) => g.id === payment.for_which_group
                );
                const groupName = group ? group.group_subject : "N/A";
                return (
                  <tr
                    key={payment.id}
                    onClick={() => openDetailModal(payment)}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
                  >
                    <td style={{ textAlign: "center" }}>{index + 1}</td>
                    <td colSpan={3} style={{ textAlign: "center" }}>
                      {`${payment.student?.first_name || ""} ${payment.student?.last_name || ""
                        }`.trim() || "N/A"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {payment.payment_amount
                        ? Number(payment.payment_amount).toLocaleString(
                          "uz-UZ"
                        ) + " so'm"
                        : "N/A"}
                    </td>
                    <td style={{ textAlign: "center" }}>{payment.for_which_month || "N/A"}</td>
                    <td style={{ textAlign: "center" }}>{groupName}</td>
                    <td style={{ textAlign: "center" }}>
                      {payment.created_at
                        ? new Date(payment.created_at).toLocaleDateString("ru-RU")
                        : "N/A"}
                    </td>
                    <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(payment);
                        }}
                        title="Tahrirlash"
                      >
                        <Pen size={16} />
                      </button>
                      <button
                        className="bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          showDeleteToast(payment.id);
                        }}
                        title="O'chirish"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            {/* Display overdue students without payments */}
            {students
              .filter((student) => isOverdue(student.id))
              .map((student, index) => (
                <tr
                  key={`overdue-${student.id}`}
                  style={{ backgroundColor: "#cfd694", color: "black" }}
                >
                  <td style={{ textAlign: "center" }}>{index + 1}</td>
                  <td style={{ textAlign: "center" }}>{`${student.first_name} ${student.last_name}`}</td>
                  <td colSpan={6} style={{ textAlign: "center", fontWeight: "bold" }}>
                    Ushbu oy uchun to'lov amalga oshirmagan
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      className="btn btn-warning"
                      onClick={() => sendNotification(student.id)}
                      style={{ backgroundColor: "red", color: "white" }}
                    >
                      Xabar jo'natish
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Payments;
