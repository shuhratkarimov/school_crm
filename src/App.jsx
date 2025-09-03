"use client";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
import { Toaster, toast } from 'react-hot-toast';
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

  useEffect(() => {
    // Admin auth check
    const checkAdminAuth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/check-auth`, {
          method: "GET",
          credentials: "include", // cookie yuboradi
        });
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };

    // Teacher auth check
    const checkTeacherAuth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/check-teacher-auth`, {
          method: "GET",
          credentials: "include", // cookie yuboradi
        });
        setTeacherAuthenticated(response.ok);
      } catch {
        setTeacherAuthenticated(false);
      }
    };

    Promise.all([checkAdminAuth(), checkTeacherAuth()]).finally(() =>
      setLoading(false)
    );
  }, []);

  if (loading) {
    return <LottieLoading />;
  }

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          // Default
          duration: 3000,
          style: {
            background: "#fff",
            color: "#333",
            fontSize: "14px",
            borderRadius: "12px",
            padding: "12px 16px",
          },
          // Success
          success: {
            duration: 2500, // agar boshqa vaqt bersang ham bo‘ladi
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
          // Error
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
          // Loading
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

            {/* Admin Dashboard va boshqa sahifalar */}
            <Route
              path="/"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <Navigate to="/dashboard" />
                </PrivateRoute>
              }
            />
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

            {/* <Route
              path="/calculator"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <div className="app-layout">
                    <Sidebar />
                    <div className="main-content">
                      <Header setIsAuthenticated={setIsAuthenticated} />
                      <Calculator />
                    </div>
                  </div>
                </PrivateRoute>
              }
            /> */}

            <Route
              path="/teacher/test-results"
              element={
                <PrivateRoute isAuthenticated={teacherAuthenticated}>
                  <TeacherTestResults />
                </PrivateRoute>
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
                <PrivateRoute isAuthenticated={teacherAuthenticated}>
                  <PaymentReports />
                </PrivateRoute>
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
            {/* <Route
              path="/groups"
              element={
                <PrivateRoute isAuthenticated={isAuthenticated}>
                  <div className="app-layout">
                    <Sidebar />
                    <div className="main-content">
                      <Header setIsAuthenticated={setIsAuthenticated} />
                      <Groups />
                    </div>
                  </div>
                </PrivateRoute>
              }
            /> */}
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

            <Route path="*" element={<LottieNotFound />} />
          </Routes>
        </ErrorBoundary>
      </Suspense>
    </Router>
  );
}

export default App;
