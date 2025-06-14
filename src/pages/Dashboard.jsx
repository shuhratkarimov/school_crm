"use client"

import { useState, useEffect } from "react"
import LottieLoading from "../components/Loading"

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [animatedStudents, setAnimatedStudents] = useState(0) // Animated state for totalStudents
  const [animatedGroups, setAnimatedGroups] = useState(0)    // Animated state for totalGroups
  const [animatedPayment, setAnimatedPayment] = useState(0)  // Animated state for totalPaymentThisMonth
  const [animatedTeachers, setAnimatedTeachers] = useState(0) // Animated state for totalTeachers

  function formatDate(dateInput, offsetDays = 0) {
    const date = new Date(dateInput)
    date.setDate(date.getDate() + offsetDays)

    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()

    return `${day}.${month}.${year}`
  }

  // Animation function using requestAnimationFrame
  const animateValue = (start, end, duration, setValue) => {
    let startTimestamp = null
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const easeInOut = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress // Ease in-out
      const currentValue = Math.floor(start + (end - start) * easeInOut)
      setValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }
    requestAnimationFrame(step)
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${import.meta.env.VITE_API_URL}/get_stats`)

        if (response.ok) {
          const data = await response.json()
          setStats(data)
        } else {
          throw new Error("API not available")
        }
      } catch (err) {
        console.log("API not available, using mock data")
        setStats(mockStats)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])
  
  // Trigger animation for all stats when data loads
  useEffect(() => {
    if (!loading && stats) {
      animateValue(0, stats.totalStudents?.count || 0, 1500, setAnimatedStudents)
      animateValue(0, stats.totalGroups || 0, 1500, setAnimatedGroups)
      animateValue(0, stats.totalPaymentThisMonth || 0, 1500, setAnimatedPayment)
      animateValue(0, stats.totalTeachers || 0, 1500, setAnimatedTeachers)
    }
  }, [loading, stats])

  if (loading) {
    return <LottieLoading />
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  const today = new Date()
  return (
    <div>
<h1 style={{ marginBottom: "24px" }}>{today.getDate().toString().padStart(2, "0")}.{(today.getMonth() + 1).toString().padStart(2, "0")}.{today.getFullYear()}-yil holatiga raqamli statistika:</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{animatedStudents} nafar</div>
          <div className="stat-label">Jami o'quvchilar</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{animatedGroups} ta</div>
          <div className="stat-label">Faol guruhlar</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{animatedPayment.toLocaleString("uz-UZ")} so'm</div>
          <div className="stat-label">Oylik to'lovlar</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{animatedTeachers} nafar</div>
          <div className="stat-label">O'qituvchilar</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div className="card">
          <h3 style={{ marginBottom: "16px" }}>So'nggi qo'shilgan o'quvchilar</h3>
          <table className="table">
            <thead>
              <tr>
                <th>F.I.Sh.</th>
                <th>Fan</th>
                <th>Qo'shilgan sana</th>
              </tr>
            </thead>
            <tbody>
              {stats?.latestStudents?.length > 0 ? (
                stats.latestStudents.map((student) => (
                  <tr key={student.id}>
                    <td>{student.first_name} {student.last_name}</td>
                    <td>{student.group?.group_subject}</td>
                    <td>{formatDate(student.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>Ma'lumotlar mavjud emas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "16px" }}>So'nggi to'lovlar</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Ism</th>
                <th>Summa</th>
                <th>Sana</th>
              </tr>
            </thead>
            <tbody>
              {stats?.latestPaymentsForThisMonth?.length > 0 ? (
                stats.latestPaymentsForThisMonth.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.student?.first_name} {payment.student?.last_name}</td>
                    <td>{payment.payment_amount?.toLocaleString()} so'm</td>
                    <td>{formatDate(payment.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>Ma'lumotlar mavjud emas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard