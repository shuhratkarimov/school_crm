"use client";

import { useState, useEffect } from "react";
import LottieLoading from "../components/Loading";
import "../../styles/styles.css";

// Chart.js
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

function MonthlyExpenses() {
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMonthlyExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/get_monthly_expenses`);
      if (!res.ok) throw new Error("Oylik xarajatlarni olishda xatolik yuz berdi");
      const data = await res.json();
      setMonthlyExpenses(data); // [{month: '2025-01', monthName: 'Yanvar', jami: 0}, ...]
    } catch (err) {
      console.error(err);
      setError("Ma'lumotlarni olishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyExpenses();
  }, []);

  if (loading) return <LottieLoading />;
  if (error) return <div className="text-red-600 font-bold">{error}</div>;

  const today = new Date();

  // Chart uchun data tayyorlash
  const chartData = {
    labels: monthlyExpenses.map((m) => m.monthName),
    datasets: [
      {
        label: "Oylik xarajatlar (so'm)",
        data: monthlyExpenses.map((m) => m.jami),
        backgroundColor: "#2563eb",
        borderColor: "#1e40af",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.raw.toLocaleString("uz-UZ")} so'm`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Oylar",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Xarajatlar (so'm)",
        },
        ticks: {
          callback: function (value) {
            return value.toLocaleString("uz-UZ");
          },
        },
      },
    },
  };

  return (
    <div className="bg-white shadow rounded-xl p-6 border border-blue-400">
      <h3 className="font-bold text-lg mb-2 text-gray-700">Yillik xarajatlar</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={monthlyExpenses}
          margin={{ top: 20, right: 20, bottom: 20, left: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="monthName" />
          <YAxis tickFormatter={(value) => value.toLocaleString("uz-UZ")} />
          <Tooltip
            formatter={(value) => `${value.toLocaleString("uz-UZ")} so'm`}
            labelStyle={{ fontWeight: "bold", color: "#1e3a8a" }}
          />
          <Bar dataKey="jami" fill="purple" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MonthlyExpenses;
