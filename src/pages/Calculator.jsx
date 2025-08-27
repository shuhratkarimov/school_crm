"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { endOfMonth, differenceInDays } from "date-fns";
import { Calculator } from "lucide-react";

export default function TuitionCalculator() {
  const [startDate, setStartDate] = useState(null);
  const [monthlyFee, setMonthlyFee] = useState(300000); // Oylik to'lov
  const [calculatedFee, setCalculatedFee] = useState(null);

  const handleCalculate = () => {
    if (!startDate || !monthlyFee) return;

    const monthEnd = endOfMonth(startDate);
    const totalDays = monthEnd.getDate();
    const remainingDays = differenceInDays(monthEnd, startDate) + 1;

    const perDayFee = monthlyFee / totalDays;
    const result = Math.round(perDayFee * remainingDays);

    setCalculatedFee(result);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-6">
        <Calculator size={28} color="#104292" />
        <h1 className="text-2xl font-bold text-[#104292]">Oylik to'lov kalkulyatori</h1>
      </div>

      <div className="bg-white rounded-xl shadow p-6 w-full max-w-md">
        <label className="block text-gray-700 font-medium mb-2">Oylik to'lov summasi (so'm)</label>
        <input
          type="number"
          value={monthlyFee}
          onChange={(e) => setMonthlyFee(Number(e.target.value))}
          className="border rounded px-3 py-2 w-full mb-4"
        />

        <label className="block text-gray-700 font-medium mb-2">Kelgan sana</label>
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          className="border rounded px-3 py-2 w-full mb-4"
          dateFormat="dd.MM.yyyy"
          placeholderText="Sanani tanlang"
        />

        <button
          onClick={handleCalculate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full"
        >
          Hisoblash
        </button>

        {calculatedFee !== null && (
          <div className="mt-6 text-center">
            <p className="text-lg font-semibold text-gray-800">
              To‘lov: <span className="text-blue-600">{calculatedFee.toLocaleString('uz-UZ')} so‘m</span>
            </p>
            <p className="text-sm text-gray-500">(oy oxirigacha hisoblangan)</p>
          </div>
        )}
      </div>
    </div>
  );
}
