"use client";

import { useState, useEffect, useMemo } from "react";
import LottieLoading from "../components/Loading";
import "../../styles/styles.css";

// Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import API_URL from "../conf/api";

export default function MonthlyExpenses({ expenses = [], salaries = [] }) {
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [monthlySalaries, setMonthlySalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Backenddan oddiy xarajatlar
  const fetchMonthlyExpenses = async () => {
    try {
      const res = await fetch(`${API_URL}/get_monthly_expenses`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMonthlyExpenses(data); // [{month: '2025-01', monthName: 'Yanvar', jami: 0}, ...]
    } catch (err) {
      console.error(err);
      setError("Oylik xarajatlarni olishda xatolik");
    }
  };

  // Backenddan o'qituvchi to'lovlari (sizning yangi endpoint)
  const fetchMonthlySalaries = async () => {
    try {
      const res = await fetch(`${API_URL}/get_teacher_salaries`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      // monthly_summary ni olish
      setMonthlySalaries(data.monthly_summary || []);
    } catch (err) {
      console.error(err);
      setError("Oylik o'qituvchi to'lovlarini olishda xatolik");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMonthlyExpenses(), fetchMonthlySalaries()]);
      setLoading(false);
    };
    loadData();
  }, []);
  const chartData = useMemo(() => {
    const map = new Map();

    // Oddiy xarajatlar
    monthlyExpenses.forEach((exp) => {
      const key = exp.month; // '2025-01'

      if (!map.has(key)) {
        map.set(key, {
          month: key,              // 👈 MUHIM
          monthName: exp.monthName || key,
          expenses: 0,
          salaries: 0,
        });
      }

      map.get(key).expenses += Number(exp.jami || 0);
    });

    // O'qituvchi to'lovlari
    monthlySalaries.forEach((sal) => {
      const key = sal.month;

      if (!map.has(key)) {
        map.set(key, {
          month: key,              // 👈 MUHIM
          monthName: key,
          expenses: 0,
          salaries: 0,
        });
      }

      map.get(key).salaries += Number(sal.total || 0);
    });

    // 🔥 Endi oy bo‘yicha real sort
    return Array.from(map.values())
      .sort((a, b) => new Date(a.month) - new Date(b.month));

  }, [monthlyExpenses, monthlySalaries]);

  if (loading) return <LottieLoading />;
  if (error) return <div className="text-red-600 font-bold">{error}</div>;

  return (
    <div className="bg-white shadow rounded-xl p-6 border border-blue-400">
      <h3 className="font-bold text-lg mb-4 text-gray-700">
        Yillik xarajatlar va o‘qituvchilarga to‘lovlar
      </h3>

      {chartData.length === 0 ? (
        <p className="text-gray-500 text-center py-10">Ma'lumot mavjud emas</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthName" />
            <YAxis tickFormatter={(value) => value.toLocaleString("uz-UZ")} />
            <Tooltip
              formatter={(value) => `${Number(value).toLocaleString("uz-UZ")} so'm`}
              labelStyle={{ fontWeight: "bold", color: "#1e3a8a" }}
            />
            <Legend />
            <Bar
              dataKey="expenses"
              name="Oddiy xarajatlar"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="salaries"
              name="O'qituvchilarga to'lov"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}