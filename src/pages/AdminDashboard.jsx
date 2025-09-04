"use client";

import { useState, useEffect } from "react";
import LottieLoading from "../components/Loading";
import { toast } from "react-hot-toast";
import API_URL from "../conf/api";
function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/get_attendance_stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      toast.error("Statistikani yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LottieLoading />;

  return (
    <div className="card" style={{ margin: "20px" }}>
      <h2>Davomat Statistika</h2>
      <div style={{ display: "grid", gap: "16px" }}>
        <div className="card">
          <h3>Kunlik Davomat</h3>
          <p>Kelgan: {stats.daily?.present || 0}</p>
          <p>Kelmagan: {stats.daily?.absent || 0}</p>
        </div>
        <div className="card">
          <h3>Haftalik Davomat</h3>
          <p>Kelgan: {stats.weekly?.present || 0}</p>
          <p>Kelmagan: {stats.weekly?.absent || 0}</p>
        </div>
        <div className="card">
          <h3>Oylik Davomat</h3>
          <p>Kelgan: {stats.monthly?.present || 0}</p>
          <p>Kelmagan: {stats.monthly?.absent || 0}</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;