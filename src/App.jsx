"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import Sidebar from "./components/Sidebar"
import Header from "./components/Header"
import Dashboard from "./pages/Dashboard"
import Students from "./pages/Students"
import Groups from "./pages/Groups"
import Payments from "./pages/Payments"
import Attendance from "./pages/Attendance"
import Requests from "./pages/Requests"
import Login from "./pages/Login"
import Teachers from "./pages/Teachers"
import "./i18n"
import LottieLoading from "./components/Loading"
import LottieNotFound from "./components/LottieNotFound"
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated")
    setIsAuthenticated(authStatus === "true")
    setLoading(false)
  }, [])

  if (loading) {
    return <LottieLoading />
  }

  if (!isAuthenticated) {
    return <Login setIsAuthenticated={setIsAuthenticated} />
  }

  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Header setIsAuthenticated={setIsAuthenticated} />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="*" element={<LottieNotFound />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App