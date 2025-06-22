  "use client";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, Suspense, lazy } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import LottieLoading from "./components/Loading";
import LottieNotFound from "./components/LottieNotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import "./i18n";

// Lazy-loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Students = lazy(() => import("./pages/Students"));
const Groups = lazy(() => import("./pages/Groups"));
const Payments = lazy(() => import("./pages/Payments"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Requests = lazy(() => import("./pages/Requests"));
const Teachers = lazy(() => import("./pages/Teachers"));
const RoomManagement = lazy(() => import("./pages/Classroom"));
const Login = lazy(() => import("./pages/Login"));

function PrivateRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Backenddan autentifikatsiyani tekshirish
    const checkAuth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/check-auth`, {
          method: "GET",
          credentials: "include", // HttpOnly cookie'lar bilan ishlash
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <LottieLoading />;
  }

  return (
    <Router>
      <Suspense fallback={<LottieLoading />}>
        <ErrorBoundary>
          <Routes>
            <Route
              path="/login"
              element={<Login setIsAuthenticated={setIsAuthenticated} />}
            />
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
            <Route path="*" element={<LottieNotFound />} />
          </Routes>
        </ErrorBoundary>
      </Suspense>
    </Router>
  );
}

export default App;