"use client";

import { Routes, Route, Navigate, useNavigate } from "react-router-dom"; // BrowserRouter ni bu yerda ishlatmaymiz
import { useState, useEffect, Suspense, lazy } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import LottieLoading from "./components/Loading";
import LottieNotFound from "./components/LottieNotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import "./i18n";
import Expenses from "./pages/Expenses";
import Notes from "./pages/Notes";
import Calculator from "./pages/Calculator";
import Achievements from "./pages/Achievements";
import { Toaster } from 'react-hot-toast';
import API_URL from "./conf/api";

// Lazy-loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Students = lazy(() => import("./pages/Students"));
// const Groups = lazy(() => import("./pages/Groups"));
const Payments = lazy(() => import("./pages/Payments"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Requests = lazy(() => import("./pages/Requests"));
const Teachers = lazy(() => import("./pages/Teachers"));
const RoomManagement = lazy(() => import("./pages/Classroom"));
const Login = lazy(() => import("./pages/Login"));
const TeacherLogin = lazy(() => import("./pages/TeacherLogin"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const TeacherAttendance = lazy(() => import("./pages/TeacherAttendance"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PaymentReports = lazy(() => import("./components/PaymentReports"));
const AdminTestResults = lazy(() => import("./pages/AdminTestResults"));
const TeacherTestResults = lazy(() => import("./pages/TeacherTestResults"));
const StudentRegistration = lazy(() => import("./pages/StudentRegistration"));
const NewStudentsAdmin = lazy(() => import("./pages/NewStudentsAdmin"));

function PrivateRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function TeacherRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/teacher/login" />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Admin autentifikatsiyasi
  const [teacherAuthenticated, setTeacherAuthenticated] = useState(false); // O'qituvchi autentifikatsiyasi
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const hostname = window.location.hostname;

  useEffect(() => {
    if (hostname === "admin.intellectualprogress.uz") {
      navigate("/login");
      checkAdminAuth();
    } else if (hostname === "teacher.intellectualprogress.uz") {
      navigate("/teacher/login");
      checkTeacherAuth();
    } else if (hostname === "register.intellectualprogress.uz") {
      navigate("/student-registration");
      setLoading(false); // Autentifikatsiya tekshiruvi o'tkazilmaydi
      return; // Keyingi tekshiruvlarni to'xtatish
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const checkAdminAuth = async () => {
    try {
      const response = await fetch(`${API_URL}/check-auth`, {
        method: "GET",
        credentials: "include",
      });
      setIsAuthenticated(response.ok);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const checkTeacherAuth = async () => {
    try {
      const response = await fetch(`${API_URL}/check-teacher-auth`, {
        method: "GET",
        credentials: "include",
      });
      setTeacherAuthenticated(response.ok);
    } catch {
      setTeacherAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LottieLoading />;
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#333",
            fontSize: "14px",
            borderRadius: "12px",
            padding: "12px 16px",
          },
          success: {
            duration: 2500,
            style: {
              background: "#e6ffed",
              color: "#047857",
              border: "1px solid #34d399",
            },
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            style: {
              background: "#fee2e2",
              color: "#b91c1c",
              border: "1px solid #f87171",
            },
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
          loading: {
            style: {
              background: "#fef3c7",
              color: "#92400e",
              border: "1px solid #fbbf24",
            },
          },
        }}
      />
      <Suspense fallback={<LottieLoading />}>
        <ErrorBoundary>
          <Routes>
            {/* Public sahifa: Autentifikatsiyasiz */}
            <Route path="/student-registration" element={<StudentRegistration />} />

            {/* Admin Login */}
            <Route
              path="/login"
              element={<Login setIsAuthenticated={setIsAuthenticated} />}
            />

            {/* Teacher Login */}
            <Route
              path="/teacher/login"
              element={<TeacherLogin setTeacherAuthenticated={setTeacherAuthenticated} />}
            />

            {/* Root yo'li: Subdomenga qarab shartli yo'naltirish */}
            <Route
              path="/"
              element={
                hostname === "register.intellectualprogress.uz" ? (
                  <Navigate to="/student-registration" />
                ) : (
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <Navigate to="/dashboard" />
                  </PrivateRoute>
                )
              }
            />

            {/* Admin Dashboard va boshqa sahifalar */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <div className="app-layout">
                    <Sidebar />
                    <div className="main-content">
                      <Header setIsAuthenticated={setIsAuthenticated} />
                      <Dashboard />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />

            <Route
              path="/teacher/test-results"
              element={
                <TeacherRoute isAuthenticated={teacherAuthenticated}>
                  <TeacherTestResults />
                </TeacherRoute>
              }
            />

            <Route
              path="/test-results"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <div className="app-layout">
                    <Sidebar />
                    <div className="main-content">
                      <Header setIsAuthenticated={setIsAuthenticated} />
                      <AdminTestResults />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />

            <Route
              path="/teacher/payments"
              element={
                <TeacherRoute isAuthenticated={teacherAuthenticated}>
                  <PaymentReports />
                </TeacherRoute>
              }
            />

            <Route
              path="/students"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <div className="app-layout">
                    <Sidebar />
                    <div className="main-content">
                      <Header setIsAuthenticated={setIsAuthenticated} />
                      <Students />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/achievements"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <div className="app-layout">
                    <Sidebar />
                    <div className="main-content">
                      <Header setIsAuthenticated={setIsAuthenticated} />
                      <Achievements />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <div className="app-layout">
                    <Sidebar />
                    <div className="main-content">
                      <Header setIsAuthenticated={setIsAuthenticated} />
                      <Payments />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <div className="app-layout">
                    <Sidebar />
                    <div className="main-content">
                      <Header setIsAuthenticated={setIsAuthenticated} />
                      <Attendance />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/requests"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <div className="app-layout">
                    <Sidebar />
                    <div className="main-content">
                      <Header setIsAuthenticated={setIsAuthenticated} />
                      <Requests />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/teachers"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <div className="app-layout">
                    <Sidebar />
                    <div className="main-content">
                      <Header setIsAuthenticated={setIsAuthenticated} />
                      <Teachers />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/rooms"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <div className="app-layout">
                    <Sidebar />
                    <div className="main-content">
                      <Header setIsAuthenticated={setIsAuthenticated} />
                      <RoomManagement />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <div className="app-layout">
                    <Sidebar />
                    <div className="main-content">
                      <Header setIsAuthenticated={setIsAuthenticated} />
                      <AdminDashboard />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />

            {/* Teacher Dashboard va Attendance */}
            <Route
              path="/teacher/dashboard"
              element={
                <TeacherRoute isAuthenticated={teacherAuthenticated}>
                  <TeacherDashboard />
                </TeacherRoute>
              }
            />
            <Route
              path="/teacher/attendance/:groupId"
              element={
                <TeacherRoute isAuthenticated={teacherAuthenticated}>
                  <TeacherAttendance />
                </TeacherRoute>
              }
            />

            {/* Expenses */}
            <Route
              path="/expenses"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <div className="app-layout">
                    <Sidebar />
                    <div className="main-content">
                      <Header setIsAuthenticated={setIsAuthenticated} />
                      <Expenses />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />

            {/* Notes */}
            <Route
              path="/notes"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <div className="app-layout">
                    <Sidebar />
                    <div className="main-content">
                      <Header setIsAuthenticated={setIsAuthenticated} />
                      <Notes />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/new-students"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <div className="app-layout">
                    <Sidebar />
                    <div className="main-content">
                      <Header setIsAuthenticated={setIsAuthenticated} />
                      <NewStudentsAdmin />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
            <Route path="*" element={<LottieNotFound />} />
          </Routes>
        </ErrorBoundary>
      </Suspense>
    </>
  );
}

export default App;