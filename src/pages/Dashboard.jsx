"use client";

import { useState, useEffect } from "react";
import LottieLoading from "../components/Loading";
import { GraduationCap, Users, BookOpen, Wallet, TrendingUp } from "lucide-react";
import "../../styles/styles.css";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import API_URL from "../conf/api";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [animatedStudents, setAnimatedStudents] = useState(0);
  const [animatedRoomPercent, setAnimatedRoomPercent] = useState(0);
  const [animatedGroups, setAnimatedGroups] = useState(0);
  const [animatedPayment, setAnimatedPayment] = useState(0);
  const [animatedTeachers, setAnimatedTeachers] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [animatedAttendance, setAnimatedAttendance] = useState(0);
  const [animatedMalePercent, setAnimatedMalePercent] = useState(0);
  const [animatedFemalePercent, setAnimatedFemalePercent] = useState(0);
  const [animatedMaleCount, setAnimatedMaleCount] = useState(0);
  const [animatedFemaleCount, setAnimatedFemaleCount] = useState(0);
  const [yearlyPayments, setYearlyPayments] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);

  function formatDate(dateInput, offsetDays = 0) {
    const date = new Date(dateInput);
    date.setDate(date.getDate() + offsetDays);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  const animateValue = (start, end, duration, setValue) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeInOut =
        progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;
      const currentValue = Math.floor(start + (end - start) * easeInOut);
      setValue(currentValue);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/get_stats`
        );
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else throw new Error("API not available");
      } catch (err) {
        console.log("API not available, using mock data");
        setStats({ studentsGender: { male: 0, female: 0 } });
      } finally {
        setLoading(false);
      }
    };

    const fetchTodayAttendance = async () => {
      try {
        const res = await fetch(`${API_URL}/get_attendance_stats`);
        const data = await res.json();
        const total = data.total;
        const present = data.present;
        setTodayAttendance({ total, present });
        const percent = Math.round((present / (total || 1)) * 100);
        animateValue(0, percent, 1500, setAnimatedAttendance);
      } catch (err) {
        console.error("Davomat olinmadi:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchYearlyPayments = async () => {
      try {
        const res = await fetch(`${API_URL}/get_yearly_payments`);
        const data = await res.json();
        setYearlyPayments(data);
      } catch (err) {
        console.error("Yillik to'lovlar olinmadi:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchMonthlyExpenses = async () => {
      try {
        const res = await fetch(`${API_URL}/get_monthly_expenses`);
        if (!res.ok) throw new Error("Oylik xarajatlarni olishda xatolik yuz berdi");
        const data = await res.json();
        setMonthlyExpenses(data);
      } catch (err) {
        console.error("Oylik xarajatlarni olishda xatolik:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchTodayAttendance();
    fetchYearlyPayments();
    fetchMonthlyExpenses();
  }, []);

  useEffect(() => {
    if (!loading && stats) {
      animateValue(0, stats.totalStudents?.count || 0, 1500, setAnimatedStudents);
      animateValue(0, stats.roomsBusinessPercentAll || 0, 1500, setAnimatedRoomPercent);
      animateValue(0, stats.totalGroups || 0, 1500, setAnimatedGroups);
      animateValue(0, stats.totalPaymentThisMonth || 0, 1500, setAnimatedPayment);
      animateValue(0, stats.totalTeachers || 0, 1500, setAnimatedTeachers);
      const totalStudents = stats.totalStudents?.count;
      const malePercent = totalStudents ? Math.round((stats.studentsGender.male / totalStudents) * 100) : 0;
      const femalePercent = totalStudents ? Math.round((stats.studentsGender.female / totalStudents) * 100) : 0;
      animateValue(0, malePercent, 1500, setAnimatedMalePercent);
      animateValue(0, femalePercent, 1500, setAnimatedFemalePercent);
      animateValue(0, stats.studentsGender.male || 0, 1500, setAnimatedMaleCount);
      animateValue(0, stats.studentsGender.female || 0, 1500, setAnimatedFemaleCount);
    }
  }, [loading, stats]);

  if (loading) return <LottieLoading />;
  if (error) return <div className="text-red-600 font-bold">{error}</div>;

  const monthsInUzbek = {
    1: "yanvar",
    2: "fevral",
    3: "mart",
    4: "aprel",
    5: "may",
    6: "iyun",
    7: "iyul",
    8: "avgust",
    9: "sentyabr",
    10: "oktyabr",
    11: "noyabr",
    12: "dekabr",
  };

  const combinedData = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const payment = yearlyPayments.find((p) => parseInt(p.month.split("-")[1]) === month) || {
      jami: 0,
    };
    const expense = monthlyExpenses.find((e) => parseInt(e.month.split("-")[1]) === month) || {
      jami: 0,
    };
    return {
      monthName: monthsInUzbek[month],
      income: payment.jami,
      expense: expense.jami,
    };
  });

  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp size={24} color="#104292" />
        <h1 className="text-2xl font-bold text-gray-800">
        {today.getDate().toString().padStart(2, "0")}-{monthsInUzbek[today.getMonth() + 1]}{" "}
        {today.getFullYear()}-yil holatiga raqamli statistika:
      </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-blue-100 to-blue-50 shadow rounded-xl p-6 flex items-center justify-between border border-blue-300 hover:shadow-lg transition">
          <div>
            <div className="text-3xl font-bold text-gray-800">{animatedStudents} nafar</div>
            <div className="text-sm text-gray-600 font-medium">Jami o'quvchilar</div>
          </div>
          <div className="flex items-center gap-4">
            <Users size={40} className="text-blue-600" />
            <div className="flex gap-2">
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-800">{animatedMaleCount} nafar</div>
                <div className="w-16 h-16">
                  <CircularProgressbar
                    value={animatedMalePercent}
                    text={`${animatedMalePercent ? animatedMalePercent : "0"}%`}
                    styles={buildStyles({
                      textSize: "20px",
                      pathColor: "url(#gradientMale)",
                      textColor: "#1e40af",
                      trailColor: "#bfdbfe",
                    })}
                  />
                  <svg style={{ height: 0 }}>
                    <defs>
                      <linearGradient id="gradientMale" gradientTransform="rotate(90)">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1e3a8a" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="text-xs text-gray-600 mt-1">O'g'il</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-800">{animatedFemaleCount} nafar</div>
                <div className="w-16 h-16">
                  <CircularProgressbar
                    value={animatedFemalePercent}
                    text={`${animatedFemalePercent ? animatedFemalePercent : "0"}%`}
                    styles={buildStyles({
                      textSize: "20px",
                      pathColor: "url(#gradientFemale)",
                      textColor: "#9d174d",
                      trailColor: "#fce7f3",
                    })}
                  />
                  <svg style={{ height: 0 }}>
                    <defs>
                      <linearGradient id="gradientFemale" gradientTransform="rotate(90)">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#9d174d" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="text-xs text-gray-600 mt-1">Qiz</div>
              </div>
            </div>
          </div>
        </div>
        <Card
          icon={<BookOpen size={40} className="text-indigo-600" />}
          value={`${animatedGroups} ta`}
          label="Faol guruhlar"
          color="indigo"
        />
        <Card
          icon={<Wallet size={40} className="text-green-600" />}
          value={`${animatedPayment.toLocaleString()} so'm`}
          label="Oylik tushumlar"
          color="green"
        />
        <Card
          icon={<GraduationCap size={40} className="text-purple-600" />}
          value={`${animatedTeachers} nafar`}
          label="O'qituvchilar"
          color="purple"
        />
        <div className="bg-white shadow rounded-xl p-6 flex items-center border border-green-300 hover:shadow-lg transition">
          <div className="w-20 h-20">
            <CircularProgressbar
              value={animatedRoomPercent}
              text={`${animatedRoomPercent}%`}
              styles={buildStyles({
                textSize: "16px",
                pathColor: "url(#gradientRooms)",
                textColor: "#065f46",
                trailColor: "#d1fae5",
              })}
            />
            <svg style={{ height: 0 }}>
              <defs>
                <linearGradient id="gradientRooms" gradientTransform="rotate(90)">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="ml-4">
            <div className="text-sm text-green-700 font-medium">
              Xonalarning bandlik ko'rsatkichi
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-xl p-6 flex items-center border border-blue-300 hover:shadow-lg transition">
          <div className="w-20 h-20">
            <CircularProgressbar
              value={animatedAttendance}
              text={`${animatedAttendance}%`}
              styles={buildStyles({
                textSize: "16px",
                pathColor: "url(#gradientAttendance)",
                textColor: "#1e40af",
                trailColor: "#bfdbfe",
              })}
            />
            <svg style={{ height: 0 }}>
              <defs>
                <linearGradient id="gradientAttendance" gradientTransform="rotate(90)">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1e3a8a" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="ml-4">
            <div className="text-sm text-blue-700 font-medium">
              Bugungi davomat (
              {todayAttendance?.present ? todayAttendance.present : "0"}/
              {todayAttendance?.total ? todayAttendance.total : "0"})
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-xl p-6 border border-blue-400">
        <h3 className="font-bold text-lg mb-2 text-gray-700">
          Yillik tushumlar va xarajatlar
        </h3>
        <ResponsiveContainer width="100%" height={300} className="p-1">
          <BarChart
            data={combinedData}
            margin={{ top: 20, right: 20, bottom: 20, left: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthName" />
            <YAxis
              tickFormatter={(value) => value.toLocaleString("uz-UZ")}
            />
            <Tooltip
              formatter={(value, name) =>
                `${value.toLocaleString("uz-UZ")} so'm`
              }
              labelStyle={{ fontWeight: "bold", color: "#1e3a8a" }}
            />
            <Legend />
            <Bar
              dataKey="income"
              name="Tushumlar"
              fill="#2563eb"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expense"
              name="Xarajatlar"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-xl p-6 border border-blue-400">
          <h3 className="font-bold text-lg mb-4 text-black-700 text-center">
            So'nggi qo'shilgan o'quvchilar
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#104292] text-white">
                <tr>
                  <th className="px-4 py-2 text-center" style={{ borderRight: "1px solid rgb(247, 247, 247)" }}>#</th>
                  <th className="px-4 py-2 text-center" style={{ borderRight: "1px solid rgb(247, 247, 247)" }}>F.I.Sh.</th>
                  <th className="px-4 py-2 text-center" style={{ borderRight: "1px solid rgb(247, 247, 247)" }}>Fan</th>
                  <th className="px-4 py-2 text-center" style={{ borderRight: "1px solid rgb(247, 247, 247)" }}>Qo'shilgan sana</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats?.latestStudents?.length > 0 ? (
                  stats.latestStudents.map((student, index) => (
                    <tr key={student.id} className="hover:bg-gray-100">
                      <td className="px-4 py-2 text-center">{index + 1}</td>
                      <td className="px-4 py-2 text-center">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="px-4 py-2 pl-10">
                        {student.groups.map((item, index) => (
                          <span className="block" key={item.id}>
                            {index + 1}. {item.group_subject}
                          </span>
                        ))}
                      </td>
                      <td className="px-4 py-2 text-center">{formatDate(student.came_in_school)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      To'lovlar mavjud emas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white shadow rounded-xl p-6 border border-blue-400">
          <h3 className="font-bold text-lg mb-4 text-black-700 text-center">So'nggi to'lovlar</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#104292] text-white">
                <tr>
                  <th className="px-2 py-2 text-center" style={{ borderRight: "1px solid rgb(247, 247, 247)" }}>#</th>
                  <th className="px-2 py-2 text-center" style={{ borderRight: "1px solid rgb(247, 247, 247)" }}>F.I.Sh.</th>
                  <th className="px-2 py-2 text-center" style={{ borderRight: "1px solid rgb(247, 247, 247)" }}>Summa</th>
                  <th className="px-2 py-2 text-center" style={{ borderRight: "1px solid rgb(247, 247, 247)" }}>Sana</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats?.latestPaymentsForThisMonth?.length > 0 ? (
                  stats.latestPaymentsForThisMonth.map((payment, index) => (
                    <tr key={payment.id} className="hover:bg-gray-100">
                      <td className="px-4 py-2 text-center">{index + 1}</td>
                      <td className="px-4 py-2 text-center">
                        {payment.student?.first_name} {payment.student?.last_name}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {payment.payment_amount?.toLocaleString("uz-UZ")} so'm
                      </td>
                      <td className="px-4 py-2 text-center">{formatDate(payment.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      Ma'lumotlar mavjud emas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ icon, value, label, color }) {
  const colors = {
    blue: "from-blue-100 to-blue-50 border-blue-300",
    green: "from-green-100 to-green-50 border-green-300",
    indigo: "from-indigo-100 to-indigo-50 border-indigo-300",
    purple: "from-purple-100 to-purple-50 border-purple-300",
  };
  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} shadow rounded-xl p-6 flex items-center justify-between border hover:shadow-lg transition`}
    >
      <div>
        <div className="text-3xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-600 font-medium">{label}</div>
      </div>
      {icon}
    </div>
  );
}

export default Dashboard;