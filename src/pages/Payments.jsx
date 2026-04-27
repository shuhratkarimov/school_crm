"use client";

import { useState, useEffect, useDeferredValue, useCallback } from "react";
import { Trash2, BookOpen, Plus, Pen, X, Check, Calendar, CreditCard, Users, User, MessageSquare, DollarSign, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import "../../styles/styles.css";
import LottieLoading from "../components/Loading";
import API_URL from "../conf/api";
import { useAppContext } from "../context/AppContext";

const PaymentSearchInput = ({ value, onChange, onSearch }) => {
  return (
    <div className="flex items-center gap-2 border border-gray-300 px-3 py-2 bg-white min-w-[280px]">
      <input
        type="text"
        className="w-full outline-none text-sm"
        placeholder="O'quvchi ismini kiriting..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSearch();
          }
        }}
      />

      <button
        onClick={onSearch}
        className="px-3 py-1 bg-[#104292] text-white text-sm"
      >
        Qidirish
      </button>
    </div>
  );
};


function Payments() {

  const { user } = useAppContext();

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
  const selectMonths = allMonths.filter(m => !radioMonths.includes(m));
  const [payments, setPayments] = useState([]);
  const [studentResults, setStudentResults] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);
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
    payment_type: "Naqd",
    received: "",
    for_which_month: "",
    comment: "",
    shouldBeConsideredAsPaid: false,
    came_in_school: "",
    group_id: "",
  });
  const [paymentsPagination, setPaymentsPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [unpaidPagination, setUnpaidPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [unpaidSearch, setUnpaidSearch] = useState("");
  const [paymentSearchInput, setPaymentSearchInput] = useState("");
  const [unpaidSearchInput, setUnpaidSearchInput] = useState("");
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [groupDiscounts, setGroupDiscounts] = useState({}); // { groupId: { percent: number, amount: number } }
  const [totalAmount, setTotalAmount] = useState(0); // Umumiy summa
  const [unpaid, setUnpaid] = useState([]);
  const [showUnpaid, setShowUnpaid] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isLoadingUnpaid, setIsLoadingUnpaid] = useState(false);
  const [formData, setFormData] = useState({
    group_id: "",
    pupil_id: "",
    payment_amount: "",
    payment_type: "Naqd",
    received: "",
    for_which_month: "",
    comment: "",
    shouldBeConsideredAsPaid: false,
    came_in_school: "",
  });
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [currentYearUnpaidCount, setCurrentYearUnpaidCount] = useState(0);
  const [selectedPaymentYear, setSelectedPaymentYear] = useState(new Date().getFullYear().toString());
  const [sendingNotification, setSendingNotification] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const years = Array.from({ length: 6 }, (_, i) => (new Date().getFullYear() - i).toString());

  // const loadInitialStudents = async () => {
  //   try {
  //     setStudentLoading(true);

  //     const res = await fetch(
  //       `${API_URL}/get_students?page=1&limit=10&simple=true`,
  //       { credentials: "include" }
  //     );

  //     const data = await res.json();
  //     setStudentResults(data.data || []);
  //   } catch {
  //     setStudentResults([]);
  //   } finally {
  //     setStudentLoading(false);
  //   }
  // };

  useEffect(() => {
    if (!showUnpaid) {
      setUnpaid([]);
      setIsLoadingUnpaid(false);
      return;
    }

    let url = `${API_URL}/get_unpaid_payments?year=${selectedYear}&page=${unpaidPagination.page}&limit=${unpaidPagination.limit}&search=${encodeURIComponent(unpaidSearch)}`;

    if (selectedMonth !== "all") {
      url += `&month=${encodeURIComponent(selectedMonth)}`;
    }

    setIsLoadingUnpaid(true);
    setUnpaid([]);

    fetch(url, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP xato: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        setUnpaid(list);
        setUnpaidPagination((prev) => ({
          ...prev,
          ...(data?.pagination || {}),
        }));
      })
      .catch(() => {
        toast.error("Qarzdorlar yuklanmadi");
      })
      .finally(() => {
        setIsLoadingUnpaid(false);
      });
  }, [showUnpaid, selectedYear, selectedMonth, unpaidPagination.page, unpaidSearch]);

  useEffect(() => {
    const loadInitialUnpaidCount = async () => {
      try {
        const url = `${API_URL}/get_unpaid_payments?year=${new Date().getFullYear()}&month=${encodeURIComponent(currentMonth)}`;
        // ↑ Bu yerda month parametrini qo‘shdik — endi faqat joriy oy!

        const res = await fetch(url, {
          credentials: "include"
        });
        if (!res.ok) throw new Error("Initial count yuklanmadi");

        const data = await res.json();
        setCurrentYearUnpaidCount(data?.count || 0);
      } catch (err) {
        setCurrentYearUnpaidCount(0);
      }
    };

    loadInitialUnpaidCount();
  }, []);

  const getPaymentDateRange = (month, cameInSchool) => {
    if (!month || !cameInSchool) return null;

    const currentYear = new Date().getFullYear();
    const monthIndex = allMonths.findIndex(m => m === month);
    if (monthIndex === -1) return null;

    const selectedMonthFirstDay = new Date(currentYear, monthIndex, 1);
    const selectedMonthLastDay = new Date(currentYear, monthIndex + 1, 0);
    const cameDate = new Date(cameInSchool);

    if (cameDate > selectedMonthLastDay) return null;

    const startDate = cameDate > selectedMonthFirstDay ? cameDate : selectedMonthFirstDay;

    const format = (date) =>
      `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;

    return `${format(startDate)} - ${format(selectedMonthLastDay)}`;
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      for_which_month: currentMonth,
    }));
  }, [currentMonth]);

  const handleChange = (value) => {
    setFormData((prev) => ({ ...prev, for_which_month: value }));

    if (!autoCalculate) return; // ← manual rejimda hisoblama

    setGroupDiscounts((prev) => {
      const next = { ...prev };
      selectedGroups.forEach((groupId) => {
        const group = groups.find((g) => g.id === groupId);
        if (!group) return;
        const originalAmount = Number(calculatePaymentAmount(group, value, formData.came_in_school)) || 0;
        next[groupId] = { percent: 0, amount: 0, finalAmount: originalAmount };
      });
      return next;
    });
  };

  const handleEditChange = (value) => {
    setEditFormData((prev) => {
      const selectedGroup = groups.find((group) => group.id === prev.group_id);

      if (!autoCalculate) {
        return {
          ...prev,
          for_which_month: value,
        };
      }

      const calculatedAmount = calculatePaymentAmount(
        selectedGroup,
        value,
        prev.came_in_school
      );

      return {
        ...prev,
        for_which_month: value,
        payment_amount: calculatedAmount ?? prev.payment_amount
      };
    });
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setGroupsError("");
      setStudentsError("");
      setPaymentsError("");

      const paymentsUrl = `${API_URL}/get_payments?page=${paymentsPagination.page}&limit=${paymentsPagination.limit}&search=${encodeURIComponent(searchTerm)}&year=${selectedPaymentYear}&month=${monthFilter}`;

      const [groupsResponse, paymentsResponse] = await Promise.all([
        fetch(`${API_URL}/get_groups`, {
          credentials: "include",
        }).catch(() => ({ ok: false })),
        fetch(paymentsUrl, {
          credentials: "include",
        }).catch(() => ({ ok: false })),
      ]);

      if (groupsResponse.ok) {
        const groupsJson = await groupsResponse.json();
        const groupsData = Array.isArray(groupsJson) ? groupsJson : (groupsJson.data || []);
        const groupsWithAmount = groupsData.map((group) => ({
          ...group,
          payment_amount: group.monthly_fee,
        }));
        setGroups(groupsWithAmount);
      } else {
        setGroups([]);
        toast.error("Guruhlar mavjud emas");
      }

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();

        setPayments(paymentsData.data || []);
        setPaymentsPagination((prev) => ({
          ...prev,
          ...(paymentsData.pagination || {}),
        }));
      } else {
        setPayments([]);
        toast.error("To'lovlar mavjud emas");
      }
    } catch (err) {
      setGroups([]);
      setPayments([]);
      toast.error("Ma'lumotlarni yuklashda umumiy xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, [paymentsPagination.page, searchTerm, selectedPaymentYear, monthFilter]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = studentSearch.trim();

      if (q.length < 3) {
        setStudentResults([]);
        return;
      }

      try {
        setStudentLoading(true);

        const res = await fetch(
          `${API_URL}/get_students?search=${encodeURIComponent(q)}&page=1&limit=10&paymentFilter=all&simple=true`,
          { credentials: "include" }
        );

        if (!res.ok) throw new Error("Studentlarni qidirishda xatolik");

        const data = await res.json();
        setStudentResults(data.data || []);
      } catch (err) {
        setStudentResults([]);
      } finally {
        setStudentLoading(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [studentSearch]);

  useEffect(() => {
    setPaymentsPagination((prev) => ({ ...prev, page: 1 }));
  }, [selectedPaymentYear, monthFilter]);

  useEffect(() => {
    setUnpaidPagination((prev) => ({ ...prev, page: 1 }));
  }, [selectedYear, selectedMonth, unpaidSearch]);

  // useEffect(() => {
  //   if (!addModal) return;
  //   loadInitialStudents();
  // }, [addModal]);

  useEffect(() => {
    const updateCount = async () => {
      try {
        let url = `${API_URL}/get_unpaid_payments?year=${selectedYear}`;
        if (selectedMonth !== "all") {
          url += `&month=${encodeURIComponent(selectedMonth)}`;
        } else {
          // "all" bo‘lsa — butun yilni hisoblaymiz
          url = `${API_URL}/get_unpaid_payments?year=${selectedYear}`;
        }

        const res = await fetch(url, {
          credentials: "include"
        });
        if (!res.ok) return;

        const data = await res.json();
        setCurrentYearUnpaidCount(data?.count || 0);
      } catch (err) {
        setCurrentYearUnpaidCount(0);
      }
    };

    if (showUnpaid) {
      updateCount();
    }
  }, [showUnpaid, selectedYear, selectedMonth]);


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
          credentials: "include"
        }
      );

      if (response.ok) {
        const updatedPayment = await response.json();
        const student = studentResults.find((s) => s.id === editFormData.pupil_id);
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

  const getStudentGroups = (studentId) => {
    const student = studentResults.find((s) => s.id === studentId);
    // student?.groups mavjudligini tekshirish
    if (student?.groups && Array.isArray(student.groups)) {
      return student.groups.map((group) => group.id);
    }
    return [];
  };

  const deletePayment = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/delete_payment/${id}`,
        {
          method: "DELETE",
          credentials: "include"
        }
      );

      if (response.ok) {
        setPayments(payments.filter((p) => p.id !== id));
        toast.success(`To'lov muvaffaqiyatli o'chirildi`);
      }
    } catch (err) {
      toast.error("To'lovni o'chirishda xatolik");
    }
  };

  const openEditModal = (payment) => {
    // Student ma'lumotlarini topamiz
    const student = studentResults.find(s => s.id === payment.pupil_id);

    setEditFormData({
      id: payment.id,
      pupil_id: payment.pupil_id,
      payment_amount: payment.payment_amount,
      payment_type: payment.payment_type,
      received: payment.received || user?.username || "",
      for_which_month: payment.for_which_month,
      comment: payment.comment,
      came_in_school: student?.came_in_school || "",
      group_id: payment.group_id,
      shouldBeConsideredAsPaid: payment.shouldBeConsideredAsPaid,
    });
    setIsEditModalOpen(true);
  };

  const filteredStudents = studentResults.filter((student) =>
    `${student.first_name} ${student.last_name}`
      .toLowerCase()
      .includes(studentSearch.toLowerCase())
  );

  const openDetailModal = (payment) => {
    setSelectedPayment(payment);
    setIsDetailModalOpen(true);
  };

  const handleStudentSelect = (student) => {
    setFormData((prev) => ({
      ...prev,
      pupil_id: student.id,
      group_id: "",
      came_in_school: student.came_in_school,
      shouldBeConsideredAsPaid: false,
    }));

    setStudentSearch(`${student.first_name} ${student.last_name}`);
    setShowDropdown(false);
    setSelectedGroups([]);
    setGroupDiscounts({});
  };

  const handleGroupToggle = (groupId) => {
    setSelectedGroups((prev) => {
      const exists = prev.includes(groupId);

      if (exists) {
        const newSelected = prev.filter((id) => id !== groupId);
        setGroupDiscounts((prevDiscounts) => {
          const newDiscounts = { ...prevDiscounts };
          delete newDiscounts[groupId];
          return newDiscounts;
        });
        return newSelected;
      }

      const group = groups.find((g) => g.id === groupId);

      // autoCalculate true bo'lsa — hisoblangan summa, false bo'lsa — oylik to'lov
      const finalAmount = autoCalculate
        ? Number(calculatePaymentAmount(group, formData.for_which_month, formData.came_in_school)) || 0
        : Number(group?.payment_amount) || 0;

      setGroupDiscounts((prevDiscounts) => ({
        ...prevDiscounts,
        [groupId]: {
          percent: 0,
          amount: 0,
          originalAmount: finalAmount,
          finalAmount,
        },
      }));

      return [...prev, groupId];
    });
  };
  const handlePercentDiscount = (groupId, percentValue) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    // autoCalculate false bo'lsa — asl oylik summa, true bo'lsa — hisoblangan summa
    const originalAmount = groupDiscounts[group.id]?.originalAmount
      ?? (autoCalculate
        ? Number(calculatePaymentAmount(group, formData.for_which_month, formData.came_in_school))
        : Number(group?.payment_amount) || 0);

    let percent =
      percentValue === ""
        ? 0
        : Math.min(100, Math.max(0, parseInt(percentValue) || 0));

    const discountAmount = Math.round((originalAmount * percent) / 100);
    const finalAmount = originalAmount - discountAmount;

    setGroupDiscounts((prev) => ({
      ...prev,
      [groupId]: {
        percent,
        amount: discountAmount,
        originalAmount,
        finalAmount,
      },
    }));
  };

  const handleAmountDiscount = (groupId, amountValue) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    // autoCalculate false bo'lsa — asl oylik summa, true bo'lsa — hisoblangan summa
    const originalAmount = groupDiscounts[group.id]?.originalAmount
      ?? (autoCalculate
        ? Number(calculatePaymentAmount(group, formData.for_which_month, formData.came_in_school))
        : Number(group?.payment_amount) || 0);

    let finalAmount =
      amountValue === ""
        ? originalAmount
        : Math.min(originalAmount, Math.max(0, parseInt(amountValue) || 0));

    if (finalAmount === 0) finalAmount = originalAmount;

    const discountAmount = originalAmount - finalAmount;
    const percent =
      originalAmount > 0
        ? Math.round((discountAmount * 100) / originalAmount)
        : 0;

    setGroupDiscounts((prev) => ({
      ...prev,
      [groupId]: {
        percent,
        amount: discountAmount,
        originalAmount,
        finalAmount,
      },
    }));
  };

  useEffect(() => {
    if (!selectedGroups.length) return;

    setGroupDiscounts((prev) => {
      const next = { ...prev };

      selectedGroups.forEach((groupId) => {
        const group = groups.find((g) => g.id === groupId);
        if (!group) return;

        // autoCalculate asosida summa tanlanadi
        const finalAmount = autoCalculate
          ? Number(calculatePaymentAmount(group, formData.for_which_month, formData.came_in_school)) || 0
          : Number(group?.payment_amount) || 0;

        next[groupId] = {
          percent: 0,
          amount: 0,
          originalAmount: finalAmount,
          finalAmount,
        };
      });

      return next;
    });
  }, [
    autoCalculate,
    selectedGroups,
    groups,
    formData.for_which_month,
    formData.came_in_school,
  ]);

  const addPayment = async (e) => {
    e.preventDefault();

    if (selectedGroups.length === 0) {
      toast.error("Kamida bitta guruh tanlang");
      return;
    }

    toast.loading("To'lovlar qo'shilmoqda.", { id: "add-payment" });

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const groupId of selectedGroups) {
        const group = groups.find((g) => g.id === groupId);

        const originalAmount =
          Number(
            calculatePaymentAmount(
              group,
              formData.for_which_month,
              formData.came_in_school
            )
          ) || 0;

        let paymentAmount = originalAmount;

        if (!autoCalculate) {
          paymentAmount = Number(
            groupDiscounts[groupId]?.finalAmount ?? originalAmount
          );
        }

        let discountInfo = "";
        if (groupDiscounts[groupId]) {
          discountInfo = ` (Chegirma: ${groupDiscounts[groupId].percent}% / ${groupDiscounts[groupId].amount} so'm)`;
        }

        const response = await fetch(`${API_URL}/create_payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            pupil_id: formData.pupil_id,
            payment_type: formData.payment_type,
            received: formData.received,
            for_which_month: formData.for_which_month,
            comment: formData.comment
              ? `${formData.comment} (Guruh: ${group?.group_subject}${discountInfo})`
              : `Guruh: ${group?.group_subject}${discountInfo}`,
            payments: [
              {
                group_id: groupId,
                payment_amount: Number(paymentAmount),
                shouldBeConsideredAsPaid: formData.shouldBeConsideredAsPaid,
              },
            ],
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
          const errorData = await response.json();
          errors.push(`${group?.group_subject}: ${errorData.message}`);
        }
      }

      toast.dismiss("add-payment");

      if (successCount > 0) {
        await fetchData();
        toast.success(`${successCount} ta to'lov muvaffaqiyatli qo'shildi`);

        if (errorCount > 0) {
          toast.error(`${errorCount} ta to'lovda xatolik: ${errors.join(", ")}`);
        }

        setFormData({
          group_id: "",
          pupil_id: "",
          payment_amount: "",
          payment_type: "Naqd",
          received: "",
          for_which_month: currentMonth,
          comment: "",
          shouldBeConsideredAsPaid: false,
        });
        closeAddModal();
      } else {
        toast.error(`To'lov qo'shilmadi: ${errors.join(", ")}`);
      }
    } catch (err) {
      toast.dismiss("add-payment");
      toast.error(`Xatolik yuz berdi: ${err.message}`);
    }
  };

  const calculateTotalAmount = () => {
    return selectedGroups.reduce((sum, groupId) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return sum;

      const originalAmount = Number(
        calculatePaymentAmount(group, formData.for_which_month, formData.came_in_school)
      ) || 0;

      if (groupDiscounts[groupId]?.finalAmount !== undefined) {
        return sum + Number(groupDiscounts[groupId].finalAmount || 0);
      }

      return sum + originalAmount;
    }, 0);
  };

  const closeAddModal = () => {
    setAddModal(false);
    setSelectedGroups([]);
    setGroupDiscounts({});
    setTotalAmount(0);
    setStudentSearch("");
    setStudentResults([]);
    setAutoCalculate(true);
    setFormData({
      group_id: "",
      pupil_id: "",
      payment_amount: "",
      payment_type: "",
      received: user?.username || "",
      for_which_month: currentMonth,
      comment: "",
      shouldBeConsideredAsPaid: false,
      came_in_school: "",
    });
  };

  useEffect(() => {
    const total = calculateTotalAmount();
    setTotalAmount(total);
  }, [selectedGroups, groupDiscounts, formData.for_which_month, formData.pupil_id, formData.came_in_school]);

  const sendNotification = async (studentId) => {
    if (sendingNotification[studentId]) return; // takroriy bosishni oldini olish

    setSendingNotification(prev => ({ ...prev, [studentId]: true }));

    try {
      const response = await fetch(
        `${API_URL}/payment_alert/${studentId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        }
      );

      if (response.ok) {
        toast.success("Xabar muvaffaqiyatli jo'natildi");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Xabar jo'natishda xatolik");
      }
    } catch (err) {
      toast.error("Xabarni jo'natishda xatolik yuz berdi");
    } finally {
      setSendingNotification(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const filteredPayments = payments

  useEffect(() => {
    if (!autoCalculate) return;
    if (!selectedGroups.length) return;

    setGroupDiscounts((prev) => {
      const next = { ...prev };

      selectedGroups.forEach((groupId) => {
        const group = groups.find((g) => g.id === groupId);
        if (!group) return;

        const originalAmount = Number(
          calculatePaymentAmount(group, formData.for_which_month, formData.came_in_school)
        ) || 0;

        next[groupId] = {
          percent: 0,
          amount: 0,
          finalAmount: originalAmount,
        };
      });

      return next;
    });
  }, [
    autoCalculate,
    selectedGroups,
    groups,
    formData.for_which_month,
    formData.came_in_school,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    const currentYear = new Date().getFullYear(); // to'g'rilandi

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

  const handleSearch = () => {
    const q = paymentSearchInput.trim();

    setSearchTerm(q);
    setPaymentsPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div>
      <div className="flex justify-between items-center gap-2 pl-6 pr-6 mb-6">
        <div className="flex items-center gap-2">
          <BookOpen size={24} color="#104292" />
          <h1 className="text-2xl font-bold">To'lovlar</h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowUnpaid(!showUnpaid)}
            className={`px-5 py-2.5 font-medium text-white shadow-sm transition-all duration-200 relative
      ${showUnpaid
                ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700'}`}
          >
            {showUnpaid ? "Yashirish" : "Qarzdorlar"}
            {currentYearUnpaidCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-700 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center border-2 border-white px-1.5">
                {currentYearUnpaidCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                received: user?.username || "",
              }));
              setAddModal(true);
            }}
            className="px-5 py-2.5 bg-[#104292] hover:bg-[#104292]/80 active:bg-[#104292]/80 text-white font-medium shadow-sm transition-all duration-200 flex items-center gap-2"
          >
            <Plus size={20} />
            To'lov qo'shish
          </button>
        </div>
      </div>

      {showUnpaid && (
        <div className="mb-8">
          {/* Filtrlar */}
          <div className="mb-6 flex flex-wrap gap-6 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yil</label>
              <select
                value={selectedYear}
                onChange={e => {
                  setSelectedYear(e.target.value);
                  setUnpaid([]);           // yangi yil tanlanganda tozalash
                }}
                className="w-32 px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}-yil</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Oy</label>
              <select
                value={selectedMonth}
                onChange={e => {
                  setSelectedMonth(e.target.value);
                  setUnpaid([]); // yangi oy tanlanganda tozalash
                }}
                className="w-40 px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              >
                <option value={currentMonth}>Joriy oy ({currentMonth})</option>
                {allMonths
                  .filter(m => m !== currentMonth)
                  .map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                {/* Agar xohlasangiz "all" ni qoldirishingiz mumkin */}
                {/* <option value="all">Barcha oylar (sekin yuklanadi)</option> */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">O'quvchi qidirish</label>
              <input
                type="text"
                value={unpaidSearchInput}
                onChange={(e) => {
                  setUnpaidSearchInput(e.target.value);
                  setUnpaidPagination((prev) => ({ ...prev, page: 1 }));
                }}
                placeholder="Ism yoki telefon..."
                className="w-64 px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              />
            </div>
          </div>

          {/* ← Jadval shu yerdan boshlanadi */}
          <div className="border border-red-300 shadow-sm p-5">
            <div className="flex justify-between mb-3">
              <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                <AlertCircle size={24} />
                To'lanmagan to'lovlar ({selectedYear} yil {selectedMonth !== "all" ? selectedMonth : "barcha oylar"})
              </h3>
              <button
                onClick={async () => {
                  if (!unpaid.length) return;
                  toast(
                    <div>
                      <p>
                        Diqqat! Barcha qarzdorga xabar jo'natmoqchimisiz?
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
                          onClick={async () => {
                            const promises = unpaid.map(item => sendNotification(item.student?.id));
                            await Promise.all(promises);
                            toast.success("Barcha xabarlar jo'natildi");
                            toast.dismiss();
                          }}
                        >
                          Jo'natish
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
                }}
                disabled={Object.values(sendingNotification).some(v => v)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white shadow disabled:opacity-50"
              >
                Barchasiga xabar jo'natish
              </button>
            </div>

            {isLoadingUnpaid ? (
              <div className="text-center py-10 text-gray-500">Yuklanmoqda...</div>
            ) : unpaid.length === 0 ? (
              <div className="text-center py-10 text-gray-600">
                Bu yil/oy bo'yicha qarzdor topilmadi
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-200">
                  <thead className="bg-amber-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">#</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">O'quvchi</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Telefon</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Guruh</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Oy</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Summa</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 bg-white">
                    {unpaid.map((item, idx) => (
                      <tr key={idx} className="hover:bg-amber-50">
                        <td className="px-4 py-3 text-sm text-gray-700">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {item.student?.fullName || "Noma'lum"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.student?.phone || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.group?.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.month} {item.year}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {Number(item.group?.monthlyFee || 0).toLocaleString("uz-UZ")} so'm
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => sendNotification(item.student?.id)}
                            disabled={sendingNotification[item.student?.id || ""]}
                            className={`px-4 py-1.5 text-white text-sm shadow-sm transition-colors flex items-center gap-2
        ${sendingNotification[item.student?.id || ""]
                                ? "bg-gray-500 cursor-not-allowed"
                                : "bg-red-600 hover:bg-red-700"
                              }`}
                          >
                            {sendingNotification[item.student?.id || ""] ? (
                              <>
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Yuborilmoqda...
                              </>
                            ) : (
                              "Xabar jo'natish"
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {unpaidPagination.totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={() =>
                        setUnpaidPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                      }
                      disabled={!unpaidPagination.hasPrevPage}
                      className="px-4 py-2 border disabled:opacity-50 bg-white"
                    >
                      Oldingi
                    </button>

                    <span className="text-sm text-gray-700">
                      {unpaidPagination.page} / {unpaidPagination.totalPages}
                    </span>

                    <button
                      onClick={() =>
                        setUnpaidPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                      }
                      disabled={!unpaidPagination.hasNextPage}
                      className="px-4 py-2 border disabled:opacity-50 bg-white"
                    >
                      Keyingi
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-fadeIn">

            {/* Header */}
            <div className="bg-[#104292] text-white p-5 flex justify-between items-center shadow">
              <h3 className="text-lg font-semibold">To'lovni tahrirlash</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white hover:bg-[#104292]/80 p-1 rounded-full transition-colors"
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
                    className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
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
                    <label key={month} className="flex items-center p-2 border border-gray-300 hover:bg-gray-50 cursor-pointer">
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
                    className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
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
                    className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    value={editFormData.group_id}
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
                        group_id: groupId,
                        payment_amount: calculatedAmount ?? prev.payment_amount
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
                  className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={editFormData.comment}
                  placeholder="Izohni kiriting..."
                  onChange={(e) => setEditFormData({ ...editFormData, comment: e.target.value })}
                />
              </div>

              {/* To'liq to'lov toggle */}
              <div className="flex items-center justify-start p-3 bg-gray-50 shadow-sm">
                <span className="text-gray-700 font-medium">O'quvchi imtiyozli to'lov qilmoqda <br /> va to'lovni to'liq amalga oshirdi deb hisoblash</span>
                <button
                  type="button"
                  onClick={() =>
                    setEditFormData(prev => ({
                      ...prev,
                      shouldBeConsideredAsPaid: !prev.shouldBeConsideredAsPaid,
                    }))
                  }
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${editFormData.shouldBeConsideredAsPaid ? "bg-[#104292]" : "bg-gray-300"
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
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#104292] text-white hover:bg-[#104292]/80 transition-colors flex items-center"
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
          <div className="bg-white shadow-2xl max-w-md w-full">
            <div className="bg-[#104292] text-white p-5 flex justify-between items-center">
              <h3 className="text-xl font-semibold">To'lov tafsilotlari</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-white hover:bg-[#104292]/80 p-1 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center">
                <div className="bg-[#104292]/20 p-3 rounded-full">
                  <User size={20} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">O'quvchi</p>
                  <p className="font-medium">
                    {`${selectedPayment.student?.first_name || ""} ${selectedPayment.student?.last_name || ""}`.trim() || selectedPayment.reserve_data?.first_name + " " + selectedPayment.reserve_data?.last_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-[#104292]/20 p-3 rounded-full">
                  <DollarSign size={20} className="text-blue-600" />
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
                <div className="bg-[#104292]/20 p-3 rounded-full">
                  <CreditCard size={20} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">To'lov turi</p>
                  <p className="font-medium">{selectedPayment.payment_type || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-[#104292]/20 p-3 rounded-full">
                  <User size={20} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Qabul qilgan mas'ul</p>
                  <p className="font-medium">{selectedPayment.received || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-[#104292]/20 p-3 rounded-full">
                  <Calendar size={20} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Qaysi oy uchun</p>
                  <p className="font-medium">{selectedPayment.for_which_month || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-[#104292]/20 p-3 rounded-full">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Guruh</p>
                  <p className="font-medium">
                    {groups.find(g => g.id === selectedPayment.group_id)?.group_subject || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-[#104292]/20 p-3 rounded-full">
                  <Calendar size={20} className="text-blue-600" />
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
                  <div className="bg-[#104292]/20 p-3 rounded-full mt-1">
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
                className="px-5 py-2.5 btn btn-primary text-white hover:bg-blue-700 transition-colors"
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
            closeAddModal();
          }}
        >
          <div
            className="bg-white shadow-2xl w-full max-w-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bg-[#104292] text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Yangi to'lov qo'shish</h3>
              <button
                onClick={() => {
                  closeAddModal();
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
                    className="input"
                    style={{ width: "300px" }}
                    placeholder="O'quvchi ismini kiriting..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-md max-h-56 overflow-y-auto z-10">
                      {studentLoading ? (
                        <div className="px-3 py-2 text-gray-500">Yuklanmoqda...</div>
                      ) : studentResults.length > 0 ? (
                        studentResults.map((student) => (
                          <div
                            key={student.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onMouseDown={() => handleStudentSelect(student)}
                          >
                            {student.first_name} {student.last_name}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500">O'quvchi topilmadi</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Guruh selector - ko'p tanlovli */}
                <div className="sm:col-span-2">
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Guruhlar * (bir nechtasini tanlashingiz mumkin)
                  </label>
                  <div className="border border-gray-300 max-h-80 overflow-y-auto p-2">
                    {formData.pupil_id && getStudentGroups(formData.pupil_id).length > 0 ? (
                      getStudentGroups(formData.pupil_id).map((groupId) => {
                        const group = groups.find((g) => g.id === groupId);
                        if (!group) return null;

                        const originalAmount = Number(calculatePaymentAmount(
                          group,
                          formData.for_which_month,
                          formData.came_in_school
                        ));

                        const isSelected = selectedGroups.includes(group.id);
                        const groupDiscount = groupDiscounts[group.id] || { percent: 0, amount: 0, finalAmount: originalAmount };

                        return (
                          <div key={group.id} className="mb-3 border overflow-hidden">
                            {/* Guruh tanlash qismi */}
                            <div
                              className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                              onClick={() => handleGroupToggle(group.id)}
                            >
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => { }}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 font-medium">{group.group_subject}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-medium text-gray-600">
                                  {Number(group?.payment_amount || 0).toLocaleString()} so'm
                                </span>
                                {isSelected && groupDiscount.finalAmount !== groupDiscount.originalAmount && (
                                  <span className="text-xs text-green-600">
                                    To'lanadi: {groupDiscount.finalAmount.toLocaleString()} so'm
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Chegirma qismi - faqat tanlangan guruhlar uchun ko'rsatiladi */}
                            {isSelected && (
                              <div className="p-3 bg-gray-50 border-t grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Chegirma foizi (%)</label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:ring-1 focus:ring-blue-500"
                                      value={groupDiscount.percent || ""}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        handlePercentDiscount(group.id, value);
                                      }}
                                      placeholder="0"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    {autoCalculate ? "To'lanadigan summa (auto, o'zgartirish mumkin)" : "To'lanadigan summa (manual)"}
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 focus:ring-1 focus:ring-blue-500"
                                      value={groupDiscount.finalAmount ?? ""}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        handleAmountDiscount(group.id, value);
                                      }}
                                      placeholder={originalAmount.toLocaleString()}
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">so'm</span>
                                  </div>
                                </div>
                                {groupDiscount.percent > 0 && (
                                  <div className="col-span-2 text-xs text-green-600 mt-1">
                                    Chegirma: {groupDiscount.percent}% ({groupDiscount.amount.toLocaleString()} so'm)
                                    <span className="text-gray-500 ml-2">asl: {groupDiscount.originalAmount.toLocaleString()} so'm</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        {formData.pupil_id
                          ? "Ushbu o'quvchiga guruh bog'lanmagan"
                          : "Avval o'quvchini tanlang"}
                      </p>
                    )}
                  </div>
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
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        readOnly
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        so'm
                      </span>
                    </div>
                    {selectedGroups.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1 space-y-1">
                        {selectedGroups.map(gId => {
                          const group = groups.find(g => g.id === gId);
                          if (!group) return null;

                          const original = Number(calculatePaymentAmount(
                            group,
                            formData.for_which_month,
                            formData.came_in_school
                          )) || 0;

                          let final = original;
                          let discountText = '';

                          if (groupDiscounts[gId]) {
                            final = Number(groupDiscounts[gId].finalAmount) || original;
                            const percent = groupDiscounts[gId].percent;
                            if (percent > 0) {
                              discountText = ` (-${percent}%)`;
                            }
                          }

                          return (
                            <div key={gId}>
                              {group.group_subject}: {final.toLocaleString('uz-UZ')} so'm
                              {discountText && <span className="text-amber-600">{discountText}</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-gray-50 border">
                  <input
                    id="autoCalculate"
                    type="checkbox"
                    checked={autoCalculate}
                    onChange={(e) => setAutoCalculate(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="autoCalculate" className="text-sm font-medium text-gray-700">
                    Avtomatik hisoblash
                  </label>
                  {autoCalculate && formData.pupil_id && formData.for_which_month && formData.came_in_school && (
                    <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 border border-blue-200">
                      {getPaymentDateRange(formData.for_which_month, formData.came_in_school) ?? "—"}
                    </span>
                  )}
                </div>

                {/* To'lov turi */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    To'lov turi *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="flex items-center px-3 py-2 border border-gray-300 cursor-pointer hover:bg-gray-50"
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
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                    value={formData.comment}
                    placeholder="Qo'shimcha izoh..."
                    onChange={(e) =>
                      setFormData({ ...formData, comment: e.target.value })
                    }
                  />
                </div>

                {/* Switch toggle */}
                <div className="flex items-center justify-start gap-5 sm:col-span-2 p-3 bg-gray-50 shadow-sm">
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
                      ? "bg-[#104292]"
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
                  closeAddModal();
                }}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                form="add-payment-form"
                className="px-5 py-2.5 btn btn-primary text-white font-semibold hover:opacity-90 transition"
              >
                To'lovni qo'shish
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Search */}
            <PaymentSearchInput
              value={paymentSearchInput}
              onChange={setPaymentSearchInput}
              onSearch={handleSearch}
            />

            {/* Year filter */}
            <select
              value={selectedPaymentYear}
              onChange={(e) => setSelectedPaymentYear(e.target.value)}
              className="min-w-[150px] border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#104292]"
            >
              <option value="all">Barcha yillar</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}-yil
                </option>
              ))}
            </select>

            {/* Month filter */}
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="min-w-[150px] border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#104292]"
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

        <div className="overflow-hidden border border-gray-300 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-[15px]">
              <thead className="bg-[#104292] text-white">
                <tr>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">#</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">O'quvchi</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Summa</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Qaysi oy uchun</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Guruh</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Sana</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Amallar</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="border border-gray-300 py-12 text-center text-gray-500"
                    >
                      {paymentSearchInput || monthFilter !== "all" || selectedPaymentYear !== "all"
                        ? "Qidiruv bo'yicha natija topilmadi"
                        : paymentsError || "Hozircha to'lovlar yo'q"}
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment, index) => {
                    const group = groups.find((g) => g.id === payment.group_id);
                    const groupName =
                      payment.paymentGroup?.group_subject ||
                      group?.group_subject ||
                      "N/A";

                    return (
                      <tr
                        key={payment.id}
                        onClick={() => openDetailModal(payment)}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <td className="border border-gray-300 px-4 py-3 text-center font-medium">
                          {(paymentsPagination.page - 1) * paymentsPagination.limit + index + 1}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                          {payment.student &&
                            `${payment.student.first_name} ${payment.student.last_name}` ||
                            (payment.reserve_data &&
                              `${payment.reserve_data.first_name} ${payment.reserve_data.last_name}`) ||
                            "Yo'q"}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-800">
                          {payment.payment_amount
                            ? `${Number(payment.payment_amount).toLocaleString("uz-UZ")} so'm`
                            : "N/A"}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">
                          {payment.for_which_month || "N/A"}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">
                          {groupName}
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">
                          {payment.created_at
                            ? new Date(payment.created_at).toLocaleDateString("ru-RU")
                            : "N/A"}
                        </td>

                        <td
                          className="border border-gray-300 px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-center gap-2">
                            <button
                              className="flex h-9 w-9 items-center justify-center bg-[#104292] text-white transition hover:bg-[#104292]/80"
                              onClick={() => openEditModal(payment)}
                              title="Tahrirlash"
                            >
                              <Pen size={16} />
                            </button>

                            <button
                              className="flex h-9 w-9 items-center justify-center bg-red-600 text-white transition hover:bg-red-700"
                              onClick={() => showDeleteToast(payment.id)}
                              title="O'chirish"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {paymentsPagination.totalPages > 1 && (
          <div className="mt-8 border border-gray-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-center text-sm text-gray-600 lg:text-left">
                Jami{" "}
                <span className="font-semibold text-[#104292]">
                  {paymentsPagination.totalItems}
                </span>{" "}
                ta to‘lov,
                <span className="mx-1 font-semibold text-[#104292]">
                  {paymentsPagination.page}
                </span>
                / {paymentsPagination.totalPages} sahifa
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() =>
                    setPaymentsPagination((prev) => ({
                      ...prev,
                      page: prev.page - 1,
                    }))
                  }
                  disabled={!paymentsPagination.hasPrevPage}
                  className={`border px-4 py-2 text-sm font-medium transition ${paymentsPagination.hasPrevPage
                    ? "border-[#104292]/20 bg-white text-[#104292] hover:border-[#104292] hover:bg-[#104292] hover:text-white"
                    : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                    }`}
                >
                  « Oldingi
                </button>

                <span className="flex h-10 min-w-[70px] items-center justify-center border border-gray-200 bg-white px-3 text-sm font-semibold text-[#104292]">
                  {paymentsPagination.page} / {paymentsPagination.totalPages}
                </span>

                <button
                  onClick={() =>
                    setPaymentsPagination((prev) => ({
                      ...prev,
                      page: prev.page + 1,
                    }))
                  }
                  disabled={!paymentsPagination.hasNextPage}
                  className={`border px-4 py-2 text-sm font-medium transition ${paymentsPagination.hasNextPage
                    ? "border-[#104292]/20 bg-white text-[#104292] hover:border-[#104292] hover:bg-[#104292] hover:text-white"
                    : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                    }`}
                >
                  Keyingi »
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Payments;
